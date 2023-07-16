from django.http import JsonResponse
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
