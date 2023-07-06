from json import loads
from rest_framework import serializers, viewsets
from rest_framework.decorators import action

from models import Result
from rest.countries.viewset import CountrySerializer

class ResultSerializer(serializers.ModelSerializer):
    country = serializers.SerializerMethodField()

    class Meta:
        model=Result
        fields=['id', 'place', 'combined', 'jury', 'televote', 'running_order', 'country']

    def get_country(self, obj: Result):
        return obj.performance.country.id
    
class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer