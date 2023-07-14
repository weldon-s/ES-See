from django.http import JsonResponse
from json import loads
from rest_framework import serializers, viewsets
from rest_framework.decorators import action

from models import Performance, Result, ShowType, POINTS_PER_PLACE

class ResultSerializer(serializers.ModelSerializer):
    country = serializers.SerializerMethodField()
    auto_qualified = serializers.SerializerMethodField()
    maximum_possible = serializers.SerializerMethodField()

    class Meta:
        model=Result
        fields=['id', 'place', 'jury_place', 'televote_place', 'combined', 
                'jury', 'televote', 'running_order', 'country', 'auto_qualified', 'maximum_possible']

    def get_country(self, obj: Result):
        return obj.performance.country.id
    
    #we automatically qualify if we are the host country or part of the Big 5
    def get_auto_qualified(self, obj: Result):
        edition = obj.performance.show.edition
        country = obj.performance.country
        return country == edition.host or country.is_big_five
    
    def get_maximum_possible(self, obj: Result):
        #get the number of countries voting in the show
        show = obj.performance.show
        num_countries = Performance.objects.filter(show=show).count()
        num_votes = len(show.voting_system)

        #we can't vote for our own country, so subtract 1
        return (num_countries - 1) * num_votes * POINTS_PER_PLACE[0]
    
class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer

    @action(detail=False, methods=['POST'])
    def get_results(self, request):
        #get our country and edition from the request
        data = loads(request.body)
        country = data.get('country')
        edition = data.get('edition')

        results = self.get_results_internal(country, edition)

        return JsonResponse(results, safe=False)
    
    def get_results_internal(self, country, edition):
        #get our country and edition from the request

        #get corresponding performances
        performances = Performance.objects.filter(country__id=country, show__edition__id=edition, running_order__gt=0)

        #get show names and return dict
        ret = {}

        for performance in performances:
            key = ShowType.choices[performance.show.show_type - 1][1].lower()

            #get corresponding result
            result = Result.objects.get(performance=performance)
            ret[key] = ResultSerializer(result).data

        return ret