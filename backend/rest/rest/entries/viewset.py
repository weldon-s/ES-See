from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, JsonResponse
from json import loads
from rest_framework import serializers, viewsets
from rest_framework.decorators import action

from models import Entry, Performance, POINTS_PER_PLACE, ShowType, Vote, VoteType

class EntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entry
        fields = ['id', 'title', 'artist', 'country', 'year']

class EntryViewSet(viewsets.ModelViewSet):
    queryset = Entry.objects.all()

    @action(detail=False, methods=['POST'])
    def get_entry(self, request):
        data = loads(request.body)
        edition = data.get("edition")
        country = data.get("country")

        entry = self.queryset.get(year_id=edition, country_id=country)

        return JsonResponse(EntrySerializer(entry, many=False).data, safe=False)
    
    @action(detail=True, methods=['POST'])
    def get_points_to(self, request, pk=None):
        votes = Vote.objects.filter(performance__show__edition=self.get_object().year)
        votes = votes.filter(ranking__0_10__contains=[self.get_object().country.code])

        #we make a dict to return
        #first layer of keys is show type
        #second layer of keys is vote type
        #third is keys being point totals and values being countries ranking at that index
        ret = {}

        performances = Performance.objects.filter(country=self.get_object().country)
        performances = performances.filter(running_order__gt=0)
        performances = performances.filter(show__edition=self.get_object().year)

        print(performances)

        #populate all shows and their vote types
        #this way, we know if an entry got no points for a specific show and vote type
        for performance in performances:
            show_type = performance.show.show_type
            show_type = ShowType.choices[show_type - 1][1].lower()

            if show_type not in ret:
                ret[show_type] = {}

            vote_types = performance.show.voting_system

            for vote_type in vote_types:
                vote_type = VoteType.choices[vote_type - 1][1].lower()

                if vote_type not in ret[show_type]:
                    ret[show_type][vote_type] = {}


        for vote in votes:
            #find show type
            show_type_index = vote.performance.show.show_type
            show_type = ShowType.choices[show_type_index - 1][1].lower()

            #find vote type
            vote_type = VoteType.choices[vote.vote_type - 1][1].lower()

            #find points and initialize dict if not already there
            index = vote.ranking.index(self.get_object().country.code)
            points = POINTS_PER_PLACE[index]

            if points not in ret[show_type][vote_type]:
                ret[show_type][vote_type][points] = []

            #add country to appropriate list
            ret[show_type][vote_type][points].append(vote.performance.country.id)

        return JsonResponse(ret, safe=False)