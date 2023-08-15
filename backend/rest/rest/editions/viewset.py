from django.http import JsonResponse
from math import floor
from rest_framework import serializers, viewsets
from rest_framework.decorators import action

from rest.entries.viewset import EntrySerializer
from models import Edition, Entry, ShowType


class EditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Edition
        fields = "__all__"


class EditionViewSet(viewsets.ModelViewSet):
    queryset = Edition.objects.all()

    @action(detail=False, methods=["POST"])
    def get_all(self, request):
        return JsonResponse(
            EditionSerializer(self.queryset, many=True).data, safe=False
        )

    @action(detail=True, methods=["POST"])
    def get_entries(self, request, pk=None):
        edition = self.get_object()

        # filter and return entries
        entries = Entry.objects.filter(year=edition)

        return JsonResponse(EntrySerializer(entries, many=True).data, safe=False)

    @action(detail=True, methods=["POST"])
    def get_color(self, request, pk=None):
        """
        Returns a reasonably distinct color for the edition
        """
        edition = self.get_object()

        # We'll get the hash of the year and get the last 6 digits
        # We are doing it this way to make sure the colour is light enough
        hashCode = hash(str(edition.year))

        r = hashCode % 100
        hashCode = floor(hashCode / 100)

        g = hashCode % 100
        hashCode = floor(hashCode / 100)

        b = hashCode % 100

        # filter and return entries
        return JsonResponse({"color": f"rgb({r + 155}, {g + 155}, {b + 155})"})
