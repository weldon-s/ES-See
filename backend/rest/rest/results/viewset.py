from django.http import JsonResponse
from json import loads
from rest_framework import serializers, viewsets
from rest_framework.decorators import action

from models import Performance, Result, ShowType

class ResultSerializer(serializers.ModelSerializer):
    country = serializers.SerializerMethodField()

    class Meta:
        model=Result
        fields=['id', 'place', 'jury_place', 'televote_place', 'combined', 'jury', 'televote', 'running_order', 'country']

    def get_country(self, obj: Result):
        return obj.performance.country.id
    
class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer

    @action(detail=False, methods=['POST'])
    def get_results(self, request):
        #get our country and edition from the request
        data = loads(request.body)
        country = data.get('country')
        edition = data.get('edition')

        #get corresponding performances
        performances = Performance.objects.filter(country__id=country, show__edition__id=edition, running_order__gt=0)

        #get show names and return dict
        ret = {}

        for performance in performances:
            key = ShowType.choices[performance.show.show_type - 1][1].lower()

            #get corresponding result
            result = Result.objects.get(performance=performance)
            ret[key] = ResultSerializer(result).data

        return JsonResponse(ret, safe=False)