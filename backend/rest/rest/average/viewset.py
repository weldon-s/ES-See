from django.http import JsonResponse
from json import loads
from rest_framework import viewsets
from rest_framework.decorators import action

from models import (
    Edition,
    get_vote_key,
    Performance,
    Result,
    ShowType,
    VoteType,
)


# TODO ignore noncompeting countries
# TODO tiebreaking
class AverageViewset(viewsets.GenericViewSet):
    @action(detail=False, methods=["POST"])

    # Gets the average points given to each country in the Grand Final over a given range of years
    def get_average_final_points(self, request):
        # get the start and end years from the request
        data = loads(request.body)
        start_year = data.get("start_year")
        end_year = data.get("end_year")

        # get the vote type from the request
        vote_type = data.get("vote_type", None)

        # If include_nq is true, we count non-qualifying performances as 0 points, otherwise we ignore them
        include_nq = data.get("include_nq", True)

        editions = Edition.objects.filter(year__gte=start_year, year__lte=end_year)

        # get the average points for each country
        # we use a dict with country ids as a key, and a list of [points, num_editions] as a value
        # this way, we don't assume that each country has participated in every edition
        averages = {}

        for edition in editions:
            final = edition.show_set.get(show_type=ShowType.GRAND_FINAL)

            performances = final.performance_set.all()

            # remove NQs if we are not accounting for them
            if not include_nq:
                performances = performances.filter(running_order__gt=0)

            for performance in performances:
                if not performance.country.id in averages:
                    averages[performance.country.id] = [0, 0]

                # if this performance did not qualify, increment show counter without adding points
                if performance.running_order <= 0:
                    averages[performance.country.id][1] += 1

                else:
                    result = Result.objects.get(performance=performance)

                    # find the key for the points given the voting system
                    if vote_type is None:
                        key = get_vote_key(final.get_primary_vote_type())
                    else:
                        key = vote_type

                    # add points to tally and increment number of editions
                    averages[performance.country.id][0] += getattr(result, key, 0)
                    averages[performance.country.id][1] += 1

        # calculate the average points for each country
        for country_id in averages:
            averages[country_id] = averages[country_id][0] / averages[country_id][1]

        # convert dict into list sorted by the average we just calculated
        lst = sorted(averages.items(), key=lambda x: x[1], reverse=True)

        lst = [
            {"country": x[0], "average": x[1], "place": lst.index(x) + 1} for x in lst
        ]

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

        # If include_nq is true, we include non-qualifying performances in the ranking, otherwise we ignore them
        include_nq = data.get("include_nq", True)

        editions = Edition.objects.filter(year__gte=start_year, year__lte=end_year)

        # get the average points for each country
        # we use a dict with country ids as a key, and a list of [sum_of_places, num_editions] as a value
        # this way, we don't assume that each country has participated in every edition
        averages = {}

        for edition in editions:
            final = edition.show_set.get(show_type=ShowType.GRAND_FINAL)

            performances = final.performance_set.all()

            q_performances = performances.filter(running_order__gt=0)
            gf_results = Result.objects.filter(performance__in=q_performances)

            for result in gf_results:
                if not result.performance.country.id in averages:
                    averages[result.performance.country.id] = [0, 0]

                # add place and increment number of editions
                averages[result.performance.country.id][0] += result.place
                averages[result.performance.country.id][1] += 1

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
                            get_vote_key(
                                result.performance.show.get_primary_vote_type()
                            ),
                        )
                        / result.get_maximum_possible(),
                    ]
                    for result in nq_results
                ]

                # order our NQs by proportion of maximum points
                nq_data = sorted(nq_data, key=lambda x: x[1], reverse=True)

                starting_place = gf_results.count() + 1

                for i in range(len(nq_data)):
                    country = nq_data[i][0]

                    if not country.id in averages:
                        averages[country.id] = [0, 0]

                    # add place and increment number of editions
                    averages[country.id][0] += starting_place + i
                    averages[country.id][1] += 1

        # calculate the average place for each country
        for country_id in averages:
            averages[country_id] = averages[country_id][0] / averages[country_id][1]

        # convert dict into list sorted by the average we just calculated
        lst = sorted(averages.items(), key=lambda x: x[1])
        lst = [
            {"country": x[0], "average": x[1], "place": lst.index(x) + 1} for x in lst
        ]

        return JsonResponse(lst, safe=False)
