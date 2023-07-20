from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from models import Edition


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
            qualifier_obj = edition.get_qualifier_data()
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
            lst = [{"country": k, "qualify": v[0] / v[1]} for k, v in dict.items()]
        else:
            lst = [{"country": k, "qualify": v[0]} for k, v in dict.items()]

        return sorted(lst, key=lambda x: x["qualify"], reverse=True)

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

    # We consider streaks to be broken when a country NQs
    # If they autoqualify or do not participate, the streak is not broken, but it is not extended either
    @action(detail=False, methods=["POST"])
    def get_longest_q_streak(self, request):
        # get years from request
        start_year = request.data["start_year"]
        end_year = request.data["end_year"]
        duration = end_year - start_year + 1

        data = {}

        for year in range(start_year, end_year + 1):
            # skip 2020
            if year == 2020:
                continue

            # get qualifier data for this year
            qualifier_obj = Edition.objects.get(year=year).get_qualifier_data()

            # 1 extends streak, -1 breaks streak, 0 maintains streak
            for country in qualifier_obj["qualifiers"]:
                if country not in data:
                    data[country] = [0] * duration

                data[country][year - start_year] = 1

            for country in qualifier_obj["non_qualifiers"]:
                if country not in data:
                    data[country] = [0] * duration

                data[country][year - start_year] = -1

        streaks = []

        for country, q_data in data.items():
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

            streaks.append({"country": country, "qualify": longest})

        return JsonResponse(streaks, safe=False)
