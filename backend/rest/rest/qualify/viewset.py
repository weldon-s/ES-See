from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from models import Country, Edition
from rest.countries.viewset import CountrySerializer


class QualifyViewSet(viewsets.GenericViewSet):
    def get_qualify_data(self, data):
        # get all editions in the given range
        editions = Edition.objects.filter(
            year__gte=data["start_year"], year__lte=data["end_year"]
        )

        # our dict entries have countries as keys and [qualify_count, participation_count] as values
        # we count participation as participation in SEMIFINALS (so hosts aren't included)
        dict = {}

        for edition in editions:
            # get qualifier data for this edition and make an array: qualify_count is 1 if qualifier, 0 if non-qualifier
            # TODO make this not error when year is missing
            qualifier_obj = edition.get_qualifier_data()

            if qualifier_obj is None:
                continue

            qualifier_lst = [
                {"country": x, "qualify_count": 1} for x in qualifier_obj["qualifiers"]
            ]
            qualifier_lst.extend(
                [
                    {"country": x, "qualify_count": 0}
                    for x in qualifier_obj["non_qualifiers"]
                ]
            )

            # add our qualifier_count values to the dict
            for elem in qualifier_lst:
                if not elem["country"] in dict:
                    dict[elem["country"]] = [0, 0]

                dict[elem["country"]][0] += elem["qualify_count"]
                dict[elem["country"]][1] += 1

        # convert dict to list for ease of use
        # return proportional data if we want the qualification rate
        if data["rate"]:
            lst = [
                {
                    "country": CountrySerializer(Country.objects.get(id=k)).data,
                    "result": v[0] / v[1],
                }
                for k, v in dict.items()
            ]
        else:
            lst = [
                {
                    "country": CountrySerializer(Country.objects.get(id=k)).data,
                    "result": v[0],
                }
                for k, v in dict.items()
            ]

        return sorted(lst, key=lambda x: x["result"], reverse=True)

    @action(detail=False, methods=["POST"])
    def get_qualify_count(self, request):
        # get all editions in the given range
        start_year = request.data["start_year"]
        end_year = request.data["end_year"]

        lst = self.get_qualify_data(
            {"start_year": start_year, "end_year": end_year, "rate": False}
        )

        return JsonResponse(lst, safe=False)

    @action(detail=False, methods=["POST"])
    def get_qualify_rate(self, request):
        # get all editions in the given range
        start_year = request.data["start_year"]
        end_year = request.data["end_year"]

        lst = self.get_qualify_data(
            {"start_year": start_year, "end_year": end_year, "rate": True}
        )

        return JsonResponse(lst, safe=False)

    def get_longest_streak(self, data):
        all_data = {}
        duration = data["end_year"] - data["start_year"] + 1

        for year in range(data["start_year"], data["end_year"] + 1):
            # get qualifier data for this year
            qualifier_obj = Edition.objects.get(year=year).get_qualifier_data()

            if qualifier_obj is None:
                continue

            # 1 extends streak, -1 breaks streak, 0 maintains streak
            for key, lst in qualifier_obj.items():
                if key == data["streak_key"]:
                    for country in lst:
                        if country not in all_data:
                            all_data[country] = [0] * duration

                        all_data[country][year - data["start_year"]] = 1

                else:
                    for country in lst:
                        if country not in all_data:
                            all_data[country] = [0] * duration

                        all_data[country][year - data["start_year"]] = -1

        streaks = []

        for country, q_data in all_data.items():
            longest = 0
            current = 0

            for num in q_data:
                # if we are going to break the streak, check if it is the longest and then reset
                if num == -1:
                    if current > longest:
                        longest = current

                    current = 0

                # otherwise, increment (1) or do nothing (0)
                else:
                    current += num

            # check again at the end in case the last streak is never broken
            if current > longest:
                longest = current

            streaks.append(
                {
                    "country": CountrySerializer(Country.objects.get(id=country)).data,
                    "result": longest,
                }
            )

        streaks = sorted(streaks, key=lambda x: x["result"], reverse=True)

        return streaks

    # We consider streaks to be broken when a country NQs
    # If they autoqualify or do not participate, the streak is not broken, but it is not extended either
    @action(detail=False, methods=["POST"])
    def get_longest_q_streak(self, request):
        streaks = self.get_longest_streak(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "streak_key": "qualifiers",
            }
        )

        return JsonResponse(streaks, safe=False)

    # We consider streaks to be broken when a country Qs
    # If they do not participate, the streak is not broken, but it is not extended either
    @action(detail=False, methods=["POST"])
    def get_longest_nq_streak(self, request):
        streaks = self.get_longest_streak(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "streak_key": "non_qualifiers",
            }
        )

        return JsonResponse(streaks, safe=False)
