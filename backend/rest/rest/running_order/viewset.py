from django.db.models import Max
from django.http import JsonResponse
from rest_framework.decorators import action
from rest_framework.viewsets import GenericViewSet

from models import Edition, Performance, ShowType


class RunningOrderViewset(GenericViewSet):
    def get_average_running_order(self, data):
        start_year = data["start_year"]
        end_year = data["end_year"]

        editions = Edition.objects.filter(year__gte=start_year, year__lte=end_year)

        # our dict will have the form {country: [sum of running orders, number of appearances]}
        dict = {}
        for edition in editions:
            final = edition.show_set.get(show_type=ShowType.GRAND_FINAL)

            # we only want to count performances that actually happened (and not countries that are just voting)
            performances = final.performance_set.filter(running_order__gt=0)
            max_running_order = performances.aggregate(Max("running_order"))[
                "running_order__max"
            ]

            for performance in performances:
                country = performance.country

                if country not in dict:
                    dict[country] = [0, 0]

                if data["proportional"]:
                    # we want to give each country a score between 0 and 1 (both inclusive)
                    # this is based on how far through the running order they are
                    dict[country][0] += (performance.running_order - 1) / (
                        max_running_order - 1
                    )
                else:
                    dict[country][0] += performance.running_order

                dict[country][1] += 1

        lst = [
            {"country": country.id, "average": dict[country][0] / dict[country][1]}
            for country in dict
        ]

        lst = sorted(lst, key=lambda x: x["average"])

        return lst

    @action(detail=False, methods=["POST"])
    def get_average_final_running_order(self, request):
        lst = self.get_average_running_order(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "proportional": False,
            }
        )

        return JsonResponse(lst, safe=False)

    @action(detail=False, methods=["POST"])
    def get_average_final_running_order_proportion(self, request):
        lst = self.get_average_running_order(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "proportional": True,
            }
        )

        return JsonResponse(lst, safe=False)
