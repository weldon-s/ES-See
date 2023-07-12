from django.http import JsonResponse
from json import loads
from models import Country
from rest_framework import viewsets, serializers
from rest_framework.decorators import action

from models import Entry
from rest.entries.viewset import EntrySerializer

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
    
    @action(detail=True, methods=['POST'])
    def get_entries(self, request, pk=None):
        country = self.get_object()
        #get all entries for this country
        entries = Entry.objects.filter(country=country)
        return JsonResponse(EntrySerializer(entries, many=True).data, safe=False)