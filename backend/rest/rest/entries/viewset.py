from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, JsonResponse
from json import loads
from rest_framework import serializers, viewsets
from rest_framework.decorators import action

from models import Country, Edition, Entry, Show, Performance, Vote, VoteType

class EntrySerializer(serializers.ModelSerializer):
    country = serializers.SerializerMethodField()

    class Meta:
        model = Entry
        fields = ['id', 'title', 'artist', 'country', 'year']

    def get_country(self, obj: Entry):
        return obj.country.name

class EntryViewSet(viewsets.ModelViewSet):
    serializer_class = EntrySerializer
    queryset = Entry.objects.all()

    @action(detail=False, methods=['POST'])
    def get_entry(self, request):
        data = loads(request.body)

        country = Country.objects.get(id=data['country']).name
        edition = Edition.objects.get(year=data['year'])

        entry = Entry.objects.get(country=country, year=edition)
        return JsonResponse(EntrySerializer(entry).data)
    
    @action(detail=False, methods=['POST'])
    def get_all(self, request):
        #get given edition
        year = loads(request.body).get('year')
        edition = Edition.objects.get(id=year)

        #filter and return entries
        entries = Entry.objects.filter(year=edition)

        return JsonResponse(EntrySerializer(entries, many=True).data, safe=False)