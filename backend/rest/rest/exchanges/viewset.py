from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from models import Country, Edition, Performance, POINTS_PER_PLACE, ShowType


class ExchangeViewSet(viewsets.GenericViewSet):
    def get_points_from(self, data):
        start_year = data["start_year"]
        end_year = data["end_year"]
        country = data["country"]

        editions = Edition.objects.filter(year__gte=start_year, year__lte=end_year)

        # we use a dict to store the countries this country gives its points to
        # key is the country
        # 0th element of value is the number of points given
        # 1st element of value is the number of times this country had the opportunity to give points to the other

        dict = {}

        for edition in editions:
            final = edition.show_set.get(show_type=ShowType.GRAND_FINAL)
            performances = final.performance_set.filter(running_order__gt=0).exclude(
                country__id=country
            )

            try:
                votes = final.performance_set.get(country=country).vote_set.all()
            except Performance.DoesNotExist:
                continue

            for performance in performances:
                if performance.country not in dict:
                    dict[performance.country] = [0, 0]

                for vote in votes:
                    # we get the place that the country passed in as an argument gave to this other country
                    try:
                        place = vote.ranking.index(performance.country.code)
                    except ValueError:
                        continue

                    if place < len(POINTS_PER_PLACE):
                        dict[performance.country][0] += POINTS_PER_PLACE[place]

                dict[performance.country][1] += 1

        lst = [
            {
                "country": country.id,
                "points": dict[country][0] / dict[country][1]
                if data["proportional"]
                else dict[country][0],
            }
            for country in dict
        ]

        lst = sorted(lst, key=lambda x: x["points"], reverse=True)

        return lst

    @action(detail=False, methods=["POST"])
    def get_final_points_from(self, request):
        lst = self.get_points_from(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "country": request.data["country"],
                "proportional": False,
            }
        )

        return JsonResponse(lst, safe=False)

    @action(detail=False, methods=["POST"])
    def get_average_final_points_from(self, request):
        lst = self.get_points_from(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "country": request.data["country"],
                "proportional": True,
            }
        )

        return JsonResponse(lst, safe=False)
