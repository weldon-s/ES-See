from django.http import JsonResponse
from rest_framework import serializers, viewsets
from rest_framework.decorators import action

from models import Edition

class EditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Edition
        fields = '__all__'

class EditionViewSet(viewsets.ModelViewSet):
    queryset = Edition.objects.all()

    @action(detail=False, methods=['POST'])
    def get_all(self, request):
        return JsonResponse(EditionSerializer(self.queryset, many=True).data, safe=False)