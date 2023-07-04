from django.http import JsonResponse
from json import loads
from models import Country
from rest_framework import viewsets, serializers
from rest_framework.decorators import action

class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ['id', 'name', 'code']

class CountryViewSet(viewsets.ModelViewSet):
    serializer_class = CountrySerializer
    queryset = Country.objects.all()

    @action(detail=True, methods=['POST'])
    def get_country(self, request, pk=None):
        return JsonResponse(CountrySerializer(self.get_object()).data, safe=False)
    
    @action(detail=False, methods=['POST'])
    def get_all(self, request):
        set = Country.objects.all()

        return JsonResponse(CountrySerializer(set, many=True).data, safe=False)