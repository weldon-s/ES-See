from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, JsonResponse
from json import loads
from rest_framework import serializers, viewsets
from rest_framework.decorators import action

from models import (
    Country,
    Edition,
    Entry,
    get_vote_label,
    Performance,
    POINTS_PER_PLACE,
    ShowType,
    Vote,
)


class EntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entry
        fields = ["id", "title", "artist", "country", "year"]


class EntryViewSet(viewsets.ModelViewSet):
    queryset = Entry.objects.all()

    @action(detail=False, methods=["POST"])
    def get_entry(self, request):
        data = loads(request.body)
        edition = data.get("edition")
        country = data.get("country")

        entry = self.queryset.get(year_id=edition, country_id=country)

        return JsonResponse(EntrySerializer(entry, many=False).data, safe=False)

    # TODO something is wrong with this
    @action(detail=True, methods=["POST"])
    def get_points_to(self, request, pk=None):
        votes = Vote.objects.filter(performance__show__edition=self.get_object().year)
        votes = votes.filter(ranking__0_10__contains=[self.get_object().country.code])

        # we make a dict to return
        # first layer of keys is show type
        # second layer of keys is vote type
        # third is keys being point totals and values being countries ranking at that index
        ret = {}

        performances = Performance.objects.filter(country=self.get_object().country)
        performances = performances.filter(running_order__gt=0)
        performances = performances.filter(show__edition=self.get_object().year)

        # populate all shows and their vote types
        # this way, we know if an entry got no points for a specific show and vote type
        for performance in performances:
            show_type = performance.show.get_show_key()

            if show_type not in ret:
                ret[show_type] = {}

            vote_types = performance.show.voting_system

            for vote_type in vote_types:
                vote_key = get_vote_label(vote_type)

                if vote_key not in ret[show_type]:
                    ret[show_type][vote_key] = {}

        for vote in votes:
            # find show type
            show_type = vote.performance.show.get_show_key()

            # find vote type
            vote_type = get_vote_label(vote.vote_type)

            # find points and initialize dict if not already there
            index = vote.ranking.index(self.get_object().country.code)
            points = POINTS_PER_PLACE[index]

            if points not in ret[show_type][vote_type]:
                ret[show_type][vote_type][points] = []

            # add country to appropriate list
            ret[show_type][vote_type][points].append(vote.performance.country.id)

        return JsonResponse(ret, safe=False)

    @action(detail=True, methods=["POST"])
    def get_points_from(self, request, pk=None):
        votes = Vote.objects.filter(performance__show__edition=self.get_object().year)
        votes = votes.filter(performance__country=self.get_object().country)

        # we make a dict to return
        # first layer of keys is show type
        # second layer of keys is vote type
        # third is keys being point totals and values being countries ranking at that index
        ret = {}

        for vote in votes:
            # find show type
            show_type = vote.performance.show.get_show_key()

            if show_type not in ret:
                ret[show_type] = {}

            # find vote type
            vote_type = get_vote_label(vote.vote_type)

            if vote_type not in ret[show_type]:
                ret[show_type][vote_type] = {}

            # find points and add to dict
            for i in range(len(POINTS_PER_PLACE)):
                points = POINTS_PER_PLACE[i]
                code = vote.ranking[i]
                country = Country.objects.get(code=code)
                ret[show_type][vote_type][points] = [country.id]

        return JsonResponse(ret, safe=False)

    @action(detail=False, methods=["POST"])
    def get_entries(self, request):
        data = loads(request.body)
        edition = data.get("edition")
        show_type = data.get("show_type", None)

        if show_type is not None:
            countries = Performance.objects.filter(
                show__edition=edition, show__show_type=show_type, running_order__gt=0
            ).values_list("country")

            entries = Entry.objects.filter(year=edition, country__in=countries)

        else:
            entries = Entry.objects.filter(year=edition)

        return JsonResponse(EntrySerializer(entries, many=True).data, safe=False)

    @action(detail=False, methods=["POST"])
    def get_entries_in_years(self, request):
        data = loads(request.body)
        start_year = Edition.objects.get(id=data.get("start_year"))
        end_year = Edition.objects.get(id=data.get("end_year"))
        country = data.get("country", None)
        group = data.get("group", None)

        entries = Entry.objects.filter(
            year__year__gte=start_year.year, year__year__lte=end_year.year
        )

        if country is not None:
            entries = entries.filter(country=country)

        if group is not None:
            entries = entries.filter(country__group=group)

        return JsonResponse(EntrySerializer(entries, many=True).data, safe=False)
