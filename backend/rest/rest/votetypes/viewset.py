from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from rest.countries.viewset import CountrySerializer
from models import Performance, Result, ShowType


class VoteTypeViewSet(viewsets.GenericViewSet):
    # TODO overall places
    # returns the discrepancy for two values for each country in grand finals
    def get_discrepancy(self, data):
        start_year = data["start_year"]
        end_year = data["end_year"]
        average = data["average"]

        performances = Performance.objects.filter(
            show__edition__year__gte=start_year,
            show__edition__year__lte=end_year,
            show__show_type=ShowType.GRAND_FINAL,
            running_order__gt=0,
        )

        # keys are countries, values are [difference, number of occurrences]
        dict = {}

        for performance in performances:
            result = Result.objects.get(performance=performance)
            # make sure we have both televote and jury results for this performance
            if not (hasattr(result, data["positive_key"])) or not (
                hasattr(result, data["negative_key"])
            ):
                continue

            country = performance.country

            if country not in dict:
                dict[country] = [0, 0]

            dict[country][0] += getattr(result, data["positive_key"]) - getattr(
                result, data["negative_key"]
            )

            dict[country][1] += 1

        lst = [
            {
                "country": CountrySerializer(country).data,
                "result": result[0] / result[1] if average else result[0],
            }
            for country, result in dict.items()
        ]

        lst.sort(key=lambda x: x["result"], reverse=True)

        return lst

    # returns the average proportion of two values for each country in grand finals
    def get_proportion(self, data):
        start_year = data["start_year"]
        end_year = data["end_year"]

        performances = Performance.objects.filter(
            show__edition__year__gte=start_year,
            show__edition__year__lte=end_year,
            show__show_type=ShowType.GRAND_FINAL,
            running_order__gt=0,
        )

        # keys are countries, values are [proportion, number of occurrences]

        dict = {}

        for performance in performances:
            result = Result.objects.get(performance=performance)
            if not hasattr(result, data["positive_key"]) or not hasattr(
                result, data["negative_key"]
            ):
                continue

            country = performance.country

            if country not in dict:
                dict[country] = [0, 0]

            total = getattr(result, data["positive_key"]) + getattr(
                result, data["negative_key"]
            )

            # if we have no points, we just add 0.5 to the proportion total to avoid division by 0
            if total == 0:
                dict[country][0] += 0.5

            else:
                dict[country][0] += getattr(result, data["positive_key"]) / total

            dict[country][1] += 1

        lst = [
            {
                "country": CountrySerializer(country).data,
                "result": result[0] / result[1],
            }
            for country, result in dict.items()
        ]

        lst.sort(key=lambda x: x["result"], reverse=True)

        return lst

    @action(detail=False, methods=["POST"])
    def get_discrepancy_points(self, request):
        lst = self.get_discrepancy(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "positive_key": "televote",
                "negative_key": "jury",
                "average": False,
            }
        )
        return JsonResponse(lst, safe=False)

    @action(detail=False, methods=["POST"])
    def get_average_discrepancy_points(self, request):
        lst = self.get_discrepancy(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "positive_key": "televote",
                "negative_key": "jury",
                "average": True,
            }
        )
        return JsonResponse(lst, safe=False)

    @action(detail=False, methods=["POST"])
    def get_discrepancy_places(self, request):
        lst = self.get_discrepancy(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "positive_key": "jury_place",
                "negative_key": "televote_place",
                "average": False,
            }
        )

        return JsonResponse(lst, safe=False)

    @action(detail=False, methods=["POST"])
    def get_average_discrepancy_places(self, request):
        lst = self.get_discrepancy(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "positive_key": "jury_place",
                "negative_key": "televote_place",
                "average": True,
            }
        )

        return JsonResponse(lst, safe=False)

    @action(detail=False, methods=["POST"])
    def get_points_proportion(self, request):
        lst = self.get_proportion(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "positive_key": "televote",
                "negative_key": "jury",
            }
        )

        return JsonResponse(lst, safe=False)
