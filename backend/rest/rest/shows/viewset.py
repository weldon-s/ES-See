from django.http import HttpResponse, JsonResponse
from json import loads
from models import Country, Performance, POINTS_PER_PLACE, Show, ShowType, Vote, VoteType
from rest_framework import serializers, viewsets
from rest_framework.decorators import action


class ShowSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    vote_types = serializers.SerializerMethodField()

    class Meta:
        model = Show
        fields = ['id', 'edition',  'type', 'vote_types']
        
    def get_type(self, obj: Show):
        return obj.show_type
        
    def get_vote_types(self, obj: Show):
        return list(map(lambda x: VoteType.choices[x - 1][1].lower(), obj.voting_system))

class ShowViewSet(viewsets.ModelViewSet):
    queryset = Show.objects.all()

    @action(detail=False, methods=['POST'])
    def get_show(self, request):
        #load our year and show type from the request
        data = loads(request.body)
        year = data.get('year')
        show_type = data.get('show_type')

        #get the appropriate show from the database and return
        show = Show.objects.get(edition__id=year, show_type=show_type)
        return JsonResponse(ShowSerializer(show).data, safe=False)
    
    @action(detail=True, methods=['POST'])
    def get_results(self, request, pk=None):
        show = self.get_object()

        #add entries for each performing country and vote type
        performances = Performance.objects.filter(show=show, running_order__gt=0)
        vote_types = show.voting_system
        result = {}

        for performance in performances:
            result[performance.country.id] = {
                "running_order": performance.running_order,
                "id": performance.id
                }

            for vote_type in vote_types:
                result[performance.country.id][vote_type] = 0

        #get all votes from this show
        votes = Vote.objects.filter(performance__show=self.get_object())

        #iterate through all votes and add points to the appropriate countries
        for vote in votes:
            for i in range(min(len(POINTS_PER_PLACE), len(vote.ranking))):
                key = Country.objects.get(code=vote.ranking[i])
                result[key.id][vote.vote_type] += POINTS_PER_PLACE[i]

        lst = []

        #now we convert the results to a list
        for k, v in result.items():
            obj = {"country": k, "running_order": v["running_order"], "id": v["id"]}

            #add voting results for each vote type
            for int, label in VoteType.choices:
                if int in vote_types:
                    obj[label.lower()] = v[int]

            #add a "combined" property if there are multiple vote types
            #this assumes that len(vote_types) > 1 implies VoteType.COMBINED
            if len(vote_types) > 1:
                sum = 0
                for vote_type in VoteType.choices:
                    sum += v.get(vote_type[0], 0)

                obj[VoteType.COMBINED.label.lower()] = sum

            lst.append(obj)

        #sort the list by the appropriate vote type
        #combined if there are multiple vote types, otherwise the only vote type
        index = VoteType.COMBINED if len(vote_types) > 1 else vote_types[0]
        index -= 1
        key = VoteType.choices[index][1].lower()
        lst.sort(key=lambda x: x[key], reverse=True)

        for i in range(len(lst)):
            lst[i]["place"] = i + 1

        return JsonResponse(lst, safe=False)
