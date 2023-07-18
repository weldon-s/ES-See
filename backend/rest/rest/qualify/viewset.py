from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from models import Edition


class QualifyViewSet(viewsets.GenericViewSet):
    @action(detail=False, methods=["POST"])
    def get_qualifiers(self, request):
        year = request.data["year"]
        edition = Edition.objects.get(year=year)

        qualifier_obj = edition.get_qualifier_data()

        lst = []

        lst.extend(
            {"country": x, "qualify_count": 1} for x in qualifier_obj["qualifiers"]
        )
        lst.extend(
            {"country": x, "qualify_count": 0} for x in qualifier_obj["non_qualifiers"]
        )

        return JsonResponse(lst, safe=False)
