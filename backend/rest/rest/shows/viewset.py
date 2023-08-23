from django.http import HttpResponse, JsonResponse
from json import loads
from models import (
    Country,
    get_vote_label,
    Performance,
    POINTS_PER_PLACE,
    Result,
    Show,
    ShowType,
    Vote,
    VoteType,
)
from rest_framework import serializers, viewsets
from rest_framework.decorators import action

from rest.results.viewset import ResultSerializer


class ShowSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    vote_types = serializers.SerializerMethodField()

    class Meta:
        model = Show
        fields = ["id", "edition", "type", "vote_types"]

    def get_type(self, obj: Show):
        return obj.show_type

    def get_vote_types(self, obj: Show):
        return list(map(lambda x: get_vote_label(x), obj.voting_system))


class ShowViewSet(viewsets.ModelViewSet):
    queryset = Show.objects.all()

    @action(detail=False, methods=["POST"])
    def get_show(self, request):
        # load our year and show type from the request
        data = loads(request.body)
        year = data.get("year")
        show_type = data.get("show_type")

        # get the appropriate show from the database and return
        show = Show.objects.get(edition__id=year, show_type=show_type)
        return JsonResponse(ShowSerializer(show).data, safe=False)

    @action(detail=True, methods=["POST"])
    def calculate_results(self, request, pk=None):
        show: Show = self.get_object()

        # add entries for each performing country and vote type
        performances = Performance.objects.filter(show=show, running_order__gt=0)
        vote_types = show.voting_system
        result = {}

        for performance in performances:
            result[performance.country.id] = {
                "running_order": performance.running_order,
                "id": performance.id,
            }

            for vote_type in vote_types:
                result[performance.country.id][vote_type] = 0

        # get all votes from this show
        votes = Vote.objects.filter(performance__show=self.get_object())

        # iterate through all votes and add points to the appropriate countries
        for vote in votes:
            for i in range(min(len(POINTS_PER_PLACE), len(vote.ranking))):
                key = Country.objects.get(code=vote.ranking[i])
                result[key.id][vote.vote_type] += POINTS_PER_PLACE[i]

        lst = []

        # now we convert the results to a list
        for k, v in result.items():
            obj = {"country": k, "running_order": v["running_order"], "id": v["id"]}

            # add voting results for each vote type
            for int, label in VoteType.choices:
                if int in vote_types:
                    obj[label.lower()] = v[int]

            # add a "combined" property if there are multiple vote types
            # this assumes that len(vote_types) > 1 implies VoteType.COMBINED
            if len(vote_types) > 1:
                sum = 0
                for vote_type in VoteType.choices:
                    sum += v.get(vote_type[0], 0)

                obj[VoteType.COMBINED.label.lower()] = sum

            lst.append(obj)

        # sort the list by the appropriate vote type to add place data
        if "jury" in lst[0]:
            lst.sort(key=lambda x: x["jury"], reverse=True)

            for i in range(len(lst)):
                lst[i]["jury_place"] = i + 1

        if "televote" in lst[0]:
            lst.sort(key=lambda x: x["televote"], reverse=True)

            for i in range(len(lst)):
                lst[i]["televote_place"] = i + 1

        # sort the list by the appropriate vote type
        # combined if there are multiple vote types, otherwise the only vote type
        key = get_vote_label(show.get_primary_vote_type())

        lst.sort(key=lambda x: x[key], reverse=True)

        for i in range(len(lst)):
            lst[i]["place"] = i + 1

            performance = Performance.objects.get(
                show=self.get_object(), country__id=lst[i]["country"]
            )

            if Result.objects.filter(performance=performance).exists():
                # update the existing result
                result = Result.objects.get(performance=performance)
                result.place = lst[i]["place"]
                result.jury_place = lst[i].get("jury_place", None)
                result.televote_place = lst[i].get("televote_place", None)
                result.combined = lst[i].get("combined", None)
                result.jury = lst[i].get("jury", None)
                result.televote = lst[i].get("televote", None)
                result.running_order = lst[i]["running_order"]
                result.save()

            else:
                # create a new result
                Result.objects.create(
                    performance=Performance.objects.get(
                        show=self.get_object(), country__id=lst[i]["country"]
                    ),
                    place=lst[i]["place"],
                    jury_place=lst[i].get("jury_place", None),
                    televote_place=lst[i].get("televote_place", None),
                    combined=lst[i].get("combined", None),
                    jury=lst[i].get("jury", None),
                    televote=lst[i].get("televote", None),
                    running_order=lst[i]["running_order"],
                )

        return JsonResponse(lst, safe=False)

    @action(detail=True, methods=["POST"])
    def get_results(self, request, pk=None):
        show = self.get_object()
        performances = Performance.objects.filter(show=show, running_order__gt=0)

        lst = []

        for performance in performances:
            result = Result.objects.get(performance=performance)
            lst.append(result)

        lst.sort(key=lambda x: x.place)

        return JsonResponse(ResultSerializer(lst, many=True).data, safe=False)
