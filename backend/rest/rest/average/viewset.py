from django.http import JsonResponse
from json import loads
from rest_framework import viewsets
from rest_framework.decorators import action

from models import (
    Edition,
    get_vote_index,
    get_vote_label,
    Performance,
    Result,
    Show,
    ShowType,
    VoteType,
)

from rest.countries.viewset import CountrySerializer


# TODO ignore noncompeting countries
# TODO tiebreaking
# TODO median
# TODO adjusted places (e.g. for AQs)
class AverageViewset(viewsets.GenericViewSet):
    # This is the main workhorse function for calculating average points/proportions
    def calculate_average_points(self, data):
        if not (data["mode"] == "final" or data["mode"] == "semi"):
            return

        editions = Edition.objects.filter(
            year__gte=data["start_year"], year__lte=data["end_year"]
        )

        # get the average points for each country
        # we use a dict with a country as a key, and a list of [points, num_editions] as a value
        # this way, we don't assume that each country has participated in every edition
        averages = {}

        for edition in editions:
            if data["mode"] == "final":
                shows = edition.show_set.filter(show_type=ShowType.GRAND_FINAL)
            else:
                shows = edition.show_set.exclude(show_type=ShowType.GRAND_FINAL)

            for show in shows:
                # find the key for the points given the voting system
                if data["vote_type"] == get_vote_label(VoteType.COMBINED):
                    key = get_vote_label(show.get_primary_vote_type())
                else:
                    if get_vote_index(data["vote_type"]) not in show.voting_system:
                        continue

                    key = data["vote_type"]

                if data["mode"] == "final":
                    performances = show.performance_set.all()

                    # remove NQs if we are not accounting for them
                    if not data["include_nq"]:
                        performances = performances.filter(running_order__gt=0)
                else:
                    performances = show.performance_set.filter(running_order__gt=0)

                show_maximum = show.get_maximum_possible()

                for performance in performances:
                    if not performance.country in averages:
                        averages[performance.country] = [0, 0]

                    # if this performance did not qualify, increment show counter without adding points
                    # we can use this logic since only the grand final would have NQs remaining since we removed them for semis
                    if performance.running_order <= 0:
                        averages[performance.country][1] += 1

                    else:
                        result = Result.objects.get(performance=performance)

                        # add points to tally and increment number of editions
                        toAdd = getattr(result, key, 0)

                        if toAdd is None:
                            toAdd = 0

                        # divide by maximum possible points if we are calculating proportions
                        if data.get("proportional"):
                            toAdd /= (
                                show_maximum / 2
                                if data["vote_type"]
                                != get_vote_label(VoteType.COMBINED)
                                and len(show.voting_system) == 2
                                else show_maximum
                            )

                        averages[performance.country][0] += toAdd
                        averages[performance.country][1] += 1

        # calculate the average points for each country
        for country in averages:
            averages[country] = averages[country][0] / averages[country][1]

        # convert dict into list sorted by the average we just calculated
        lst = sorted(averages.items(), key=lambda x: x[1], reverse=True)
        lst = [
            {
                "country": CountrySerializer(x[0]).data,
                "result": x[1],
                "place": lst.index(x) + 1,
            }
            for x in lst
        ]

        return lst

    # TODO make this less unwieldy
    @action(detail=False, methods=["POST"])
    def get_average_performance(self, request):
        """
        This function calculates the average performance of a country in a way that is adjusted
        for automatic qualifiers and the number of participants in a given year.
        We start by finding the place of every country (Qs and NQs), and then we calculate the amount of
        countries that placed below them (so 0% for last, and 100% for first). All of the automatic qualifiers
        that did not place above any non-automatic qualifiers in the final also have their percentages start from 0%.
        """

        vote_type = request.data.get("vote_type", get_vote_label(VoteType.COMBINED))

        # begin by getting all of our editions
        editions = Edition.objects.filter(
            year__gte=request.data["start_year"], year__lte=request.data["end_year"]
        )

        # keys are countries, values are [sum of proportions, number of appearances]
        averages = {}

        for edition in editions:
            if edition.show_set.count() == 0:
                continue

            final = edition.show_set.get(show_type=ShowType.GRAND_FINAL)

            # find the key for the points given the voting system
            if vote_type == get_vote_label(VoteType.COMBINED):
                place_key = VoteType.COMBINED
            else:
                if get_vote_index(vote_type) not in final.voting_system:
                    continue

                place_key = get_vote_index(vote_type)

            # we need to make sure the semis have the vote type as well
            if vote_type != get_vote_label(VoteType.COMBINED):
                semis = edition.show_set.exclude(show_type=ShowType.GRAND_FINAL)

                exit = False

                for semi in semis:
                    if get_vote_index(vote_type) not in semi.voting_system:
                        exit = True

                if exit:
                    continue

            performances = final.performance_set.all()

            q_performances = performances.filter(running_order__gt=0)
            gf_results = Result.objects.filter(performance__in=q_performances)
            # result_set?

            # array elements have form [country, bad_aq]
            # bad_aq is true iff the AQ did not place above any non-AQs
            # indices are place - 1
            places = [None] * gf_results.count()

            for result in gf_results:
                place = result.get_place(place_key)
                places[place - 1] = [result.performance.country, False]

            #  get the NQing countries from the final
            nq_countries = performances.filter(running_order__lte=0).values_list(
                "country", flat=True
            )

            # then, get their performances
            nqs = Performance.objects.filter(
                show__edition=edition, country__in=nq_countries, running_order__gt=0
            )

            # then, get the results of those performances
            nq_results = Result.objects.filter(performance__in=nqs)

            # get proportion of maximum points for each NQ
            nq_data = [
                [
                    result.performance.country,
                    getattr(
                        result,
                        get_vote_label(result.performance.show.get_primary_vote_type())
                        if place_key == VoteType.COMBINED
                        else get_vote_label(place_key),
                    )
                    / result.performance.show.get_maximum_possible(),
                ]
                for result in nq_results
            ]

            # order our NQs by proportion of maximum points
            nq_data = sorted(nq_data, key=lambda x: x[1], reverse=True)

            for i in range(len(nq_data)):
                country = nq_data[i][0]
                places.append([country, False])

            # now, we need to find what denominator to use for each country
            # for almost all, this is just total number of participants
            # for poorly performing AQs, it is number of finalists

            aq_index = gf_results.count() - 1
            auto_qualifiers = edition.get_automatic_qualifiers()

            # get all the AQs that did not place above any NQs and mark them as "bad" AQs
            while places[aq_index][0].id in auto_qualifiers:
                places[aq_index][1] = True
                aq_index -= 1

            # this is the total number of participants
            total_participants = edition.entry_set.count()

            # add our data from this edition to the dict
            for i in range(len(places)):
                denominator = gf_results.count() if places[i][1] else total_participants

                if not places[i][0] in averages:
                    averages[places[i][0]] = [0, 0]

                averages[places[i][0]][0] += 1 - (i / (denominator - 1))
                averages[places[i][0]][1] += 1

        lst = [
            {
                "country": CountrySerializer(country).data,
                "result": averages[country][0] / averages[country][1],
            }
            for country in averages
        ]

        lst = sorted(lst, key=lambda x: x["result"], reverse=True)

        return JsonResponse(lst, safe=False)

    # TODO see if we can unify include_nq
    @action(detail=False, methods=["POST"])
    def get_average_final_points(self, request):
        vote_type = request.data.get("vote_type", get_vote_label(VoteType.COMBINED))

        lst = self.calculate_average_points(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "vote_type": vote_type,
                "mode": "final",
                "proportional": request.data["proportional"],
                "include_nq": request.data["include_nq"],
            }
        )

        return JsonResponse(lst, safe=False)

    @action(detail=False, methods=["POST"])
    def get_average_semi_points(self, request):
        vote_type = request.data.get("vote_type", get_vote_label(VoteType.COMBINED))

        lst = self.calculate_average_points(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "vote_type": vote_type,
                "mode": "semi",
                "proportional": request.data["proportional"],
            }
        )

        return JsonResponse(lst, safe=False)

    # Gets the average place of a country over a given range of years
    # NQ places are calculated by the proportion of the maximum points they got in their semi
    # e.g. in 2022, Croatia received 75 points in semi 1 (17.4% of the maximum 432), but
    # North Macedonia received 76 points in semi 2 (15.8% of the maximum 480), so
    # we say that Croatia placed higher despite receiving fewer points
    @action(detail=False, methods=["POST"])
    def get_average_place(self, request):
        # get the start and end years from the request
        data = loads(request.body)
        start_year = data.get("start_year")
        end_year = data.get("end_year")
        vote_type = data.get("vote_type", get_vote_label(VoteType.COMBINED))

        # If include_nq is true, we include non-qualifying performances in the ranking, otherwise we ignore them
        include_nq = data.get("include_nq", True)

        editions = Edition.objects.filter(year__gte=start_year, year__lte=end_year)

        # get the average places for each country
        # we use a dict with a country as a key, and a list of [sum_of_places, num_editions] as a value
        # this way, we don't assume that each country has participated in every edition
        averages = {}

        for edition in editions:
            if edition.show_set.count() == 0:
                continue

            final = edition.show_set.get(show_type=ShowType.GRAND_FINAL)

            # find the key for the points given the voting system
            if data["vote_type"] == get_vote_label(VoteType.COMBINED):
                place_key = VoteType.COMBINED
            else:
                if get_vote_index(data["vote_type"]) not in final.voting_system:
                    continue

                place_key = get_vote_index(data["vote_type"])

            # if we are including NQs, we need to make sure the semis have the vote type as well
            if data["include_nq"] and data["vote_type"] != get_vote_label(
                VoteType.COMBINED
            ):
                semis = edition.show_set.exclude(show_type=ShowType.GRAND_FINAL)

                exit = False

                for semi in semis:
                    if get_vote_index(data["vote_type"]) not in semi.voting_system:
                        exit = True

                if exit:
                    continue

            performances = final.performance_set.all()

            q_performances = performances.filter(running_order__gt=0)
            gf_results = Result.objects.filter(performance__in=q_performances)

            for result in gf_results:
                if not result.performance.country in averages:
                    averages[result.performance.country] = [0, 0]

                # add place and increment number of editions
                averages[result.performance.country][0] += result.get_place(place_key)
                averages[result.performance.country][1] += 1

            if include_nq:
                # first, get the NQing countries from the final
                nq_countries = performances.filter(running_order__lte=0).values_list(
                    "country", flat=True
                )

                # then, get their performances
                nqs = Performance.objects.filter(
                    show__edition=edition, country__in=nq_countries, running_order__gt=0
                )

                # then, get the results of those performances
                nq_results = Result.objects.filter(performance__in=nqs)

                # get proportion of maximum points for each NQ
                nq_data = [
                    [
                        result.performance.country,
                        getattr(
                            result,
                            get_vote_label(
                                result.performance.show.get_primary_vote_type()
                            )
                            if place_key == VoteType.COMBINED
                            else get_vote_label(place_key),
                        )
                        / result.performance.show.get_maximum_possible(),
                    ]
                    for result in nq_results
                ]

                # order our NQs by proportion of maximum points
                nq_data = sorted(nq_data, key=lambda x: x[1], reverse=True)

                starting_place = gf_results.count() + 1

                for i in range(len(nq_data)):
                    country = nq_data[i][0]

                    if not country in averages:
                        averages[country] = [0, 0]

                    # add place and increment number of editions
                    averages[country][0] += starting_place + i
                    averages[country][1] += 1

        # calculate the average place for each country
        for country in averages:
            averages[country] = averages[country][0] / averages[country][1]

        # convert dict into list sorted by the average we just calculated
        lst = sorted(averages.items(), key=lambda x: x[1])
        lst = [
            {
                "country": CountrySerializer(x[0]).data,
                "result": x[1],
                "place": lst.index(x) + 1,
            }
            for x in lst
        ]

        return JsonResponse(lst, safe=False)

    # Gets the average place of a country in the Semi-Finals over a given range of years
    @action(detail=False, methods=["POST"])
    def get_average_semi_place(self, request):
        data = loads(request.body)

        # get the start and end years from the request
        start_year = data.get("start_year")
        end_year = data.get("end_year")
        vote_type = data.get("vote_type", get_vote_label(VoteType.COMBINED))

        editions = Edition.objects.filter(year__gte=start_year, year__lte=end_year)

        shows = Show.objects.filter(edition__in=editions).exclude(
            show_type=ShowType.GRAND_FINAL
        )

        # get the average places for each country
        # we use a dict with a country as a key, and a list of [sum_of_places, num_editions] as a value
        # this way, we don't assume that each country has participated in every edition
        averages = {}

        for show in shows:
            # find the key for the points given the voting system
            if data["vote_type"] == get_vote_label(VoteType.COMBINED):
                place_key = VoteType.COMBINED
            else:
                if get_vote_index(data["vote_type"]) not in show.voting_system:
                    continue

                place_key = get_vote_index(data["vote_type"])

            performances = show.performance_set.all()

            # remove auto-qualifiers who are only voting and not performing
            performances = performances.filter(running_order__gt=0)

            results = Result.objects.filter(performance__in=performances)

            for result in results:
                if not result.performance.country in averages:
                    averages[result.performance.country] = [0, 0]

                # add place and increment number of editions

                averages[result.performance.country][0] += result.get_place(place_key)
                averages[result.performance.country][1] += 1

        # calculate the average place for each country
        for country in averages:
            averages[country] = averages[country][0] / averages[country][1]

        # convert dict into list sorted by the average we just calculated
        lst = sorted(averages.items(), key=lambda x: x[1])
        lst = [
            {
                "country": CountrySerializer(x[0]).data,
                "result": x[1],
                "place": lst.index(x) + 1,
            }
            for x in lst
        ]

        return JsonResponse(lst, safe=False)
