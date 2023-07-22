from django.http import JsonResponse
from rest_framework.decorators import action
from rest_framework.viewsets import GenericViewSet

from models import Edition, Performance, ShowType


class RunningOrderViewset(GenericViewSet):
    @action(detail=False, methods=["POST"])
    def get_average_final_running_order(self, request):
        start_year = request.data["start_year"]
        end_year = request.data["end_year"]

        editions = Edition.objects.filter(year__gte=start_year, year__lte=end_year)

        # our dict will have the form {country: [sum of running orders, number of appearances]}
        data = {}
        for edition in editions:
            final = edition.show_set.get(show_type=ShowType.GRAND_FINAL)

            # we only want to count performances that actually happened (and not countries that are just voting)
            performances = final.performance_set.filter(running_order__gt=0)

            for performance in performances:
                country = performance.country

                if country not in data:
                    data[country] = [0, 0]

                data[country][0] += performance.running_order
                data[country][1] += 1

        lst = [
            {"country": country.id, "average": data[country][0] / data[country][1]}
            for country in data
        ]

        lst = sorted(lst, key=lambda x: x["average"])

        return JsonResponse(lst, safe=False)
