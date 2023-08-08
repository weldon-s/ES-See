from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from rest.countries.viewset import CountrySerializer
from models import Performance, Result, ShowType


class VoteTypeViewSet(viewsets.GenericViewSet):
    # TODO overall places
    # returns the discrepancy for two values for each country
    def calculate_discrepancy(self, data):
        start_year = data["start_year"]
        end_year = data["end_year"]
        average = data["average"]

        performances = Performance.objects.filter(
            show__edition__year__gte=start_year,
            show__edition__year__lte=end_year,
            running_order__gt=0,
        )

        if data["mode"] == "final":
            performances = performances.filter(show__show_type=ShowType.GRAND_FINAL)
        elif data["mode"] == "semi":
            performances = performances.exclude(show__show_type=ShowType.GRAND_FINAL)

        # keys are countries, values are [difference, number of occurrences]
        dict = {}

        for performance in performances:
            result = Result.objects.get(performance=performance)
            # make sure we have both results for this performance
            if (
                getattr(result, data["positive_key"], None) is None
                or getattr(result, data["negative_key"], None) is None
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

    # returns the average proportion of two values for each country
    # TODO add proportion that sums all values and divides by total, not just year-by-year average
    def calculate_proportion(self, data):
        start_year = data["start_year"]
        end_year = data["end_year"]

        performances = Performance.objects.filter(
            show__edition__year__gte=start_year,
            show__edition__year__lte=end_year,
            running_order__gt=0,
        )

        if data["mode"] == "final":
            performances = performances.filter(show__show_type=ShowType.GRAND_FINAL)
        elif data["mode"] == "semi":
            performances = performances.exclude(show__show_type=ShowType.GRAND_FINAL)

        # keys are countries, values are [proportion, number of occurrences]

        dict = {}

        for performance in performances:
            result = Result.objects.get(performance=performance)
            # make sure we have both results for this performance
            if (
                getattr(result, data["positive_key"], None) is None
                or getattr(result, data["negative_key"], None) is None
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
    def get_discrepancy(self, request):
        metric = request.data["metric"]  # points or places

        if metric != "points" and metric != "places":
            return JsonResponse({"error": "Invalid metric"}, status=400)

        lst = self.calculate_discrepancy(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "positive_key": "televote" if metric == "points" else "jury_place",
                "negative_key": "jury" if metric == "points" else "televote_place",
                "mode": request.data["shows"],
                "average": request.data["average"],
            }
        )

        return JsonResponse(lst, safe=False)

    @action(detail=False, methods=["POST"])
    def get_points_proportion(self, request):
        lst = self.calculate_proportion(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "positive_key": "televote",
                "negative_key": "jury",
                "mode": request.data["shows"],
            }
        )

        return JsonResponse(lst, safe=False)
