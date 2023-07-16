from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from models import Edition


class QualifyViewSet(viewsets.GenericViewSet):
    @action(detail=False, methods=["POST"])
    def get_qualifiers(self, request):
        year = request.data["year"]
        edition = Edition.objects.get(year=year)
        return JsonResponse(edition.get_qualifier_data(), safe=False)
