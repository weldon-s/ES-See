from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from models import (
    Country,
    Edition,
    get_vote_index,
    Performance,
    POINTS_PER_PLACE,
    ShowType,
    VoteType,
)
from rest.countries.viewset import CountrySerializer


class ExchangeViewSet(viewsets.GenericViewSet):
    # TODO make grid view for these?
    def calculate_points_from(self, data):
        country = data["country"]

        editions = Edition.objects.filter(
            year__gte=data["start_year"], year__lte=data["end_year"]
        )

        # we use a dict to store the countries this country gives its points to
        # key is the country
        # 0th element of value is the number of points given
        # 1st element of value is the number of times this country had the opportunity to give points to the other

        dict = {}

        for edition in editions:
            if data["mode"] == "final":
                shows = edition.show_set.filter(show_type=ShowType.GRAND_FINAL)
            elif data["mode"] == "semi":
                shows = edition.show_set.exclude(show_type=ShowType.GRAND_FINAL)

            for show in shows:
                performances = show.performance_set.filter(running_order__gt=0).exclude(
                    country__id=country
                )

                try:
                    votes = show.performance_set.get(country=country).vote_set.all()

                    if data["vote_type"] != "combined":
                        index = get_vote_index(data["vote_type"])
                        votes = votes.filter(vote_type=index)

                except Performance.DoesNotExist:
                    continue

                for performance in performances:
                    if performance.country not in dict:
                        dict[performance.country] = [0, 0]

                    for vote in votes:
                        # we get the place that the country passed in as an argument gave to this other country
                        try:
                            place = vote.ranking.index(performance.country.code)
                        except ValueError:
                            continue

                        if place < len(POINTS_PER_PLACE):
                            dict[performance.country][0] += POINTS_PER_PLACE[place]

                    dict[performance.country][1] += 1

        lst = [
            {
                "country": CountrySerializer(country).data,
                "result": dict[country][0] / dict[country][1]
                if data["average"]
                else dict[country][0],
            }
            for country in dict
        ]

        lst = sorted(lst, key=lambda x: x["result"], reverse=True)

        return lst

    def calculate_points_to(self, data):
        editions = Edition.objects.filter(
            year__gte=data["start_year"], year__lte=data["end_year"]
        )

        code = Country.objects.get(id=data["country"]).code

        # we use a dict to store the countries giving points to this country
        # key is the other country
        # 0th element of value is the number of points given
        # 1st element of value is the number of times the other country had the opportunity to give points to this one
        dict = {}

        for edition in editions:
            if data["mode"] == "final":
                shows = edition.show_set.filter(show_type=ShowType.GRAND_FINAL)
            elif data["mode"] == "semi":
                shows = edition.show_set.exclude(show_type=ShowType.GRAND_FINAL)

            for show in shows:
                # skip the show if this country didn't perform
                if not show.performance_set.filter(
                    country__id=data["country"], running_order__gt=0
                ).exists():
                    continue

                # we get all performances from the show except our own
                performances = show.performance_set.exclude(country__id=data["country"])

                for performance in performances:
                    if performance.country not in dict:
                        dict[performance.country] = [0, 0]

                    votes = performance.vote_set.all()

                    if data["vote_type"] != "combined":
                        index = get_vote_index(data["vote_type"])
                        votes = votes.filter(vote_type=index)

                    # for every vote, we see if this country got points from it, and if so, we add them to the total
                    for vote in votes:
                        try:
                            place = vote.ranking.index(code)
                        except:
                            continue

                        if place < len(POINTS_PER_PLACE):
                            dict[performance.country][0] += POINTS_PER_PLACE[place]

                    dict[performance.country][1] += 1

        lst = [
            {
                "country": CountrySerializer(country).data,
                "result": dict[country][0] / dict[country][1]
                if data["average"]
                else dict[country][0],
            }
            for country in dict
        ]

        lst = sorted(lst, key=lambda x: x["result"], reverse=True)

        return lst

    @action(detail=False, methods=["POST"])
    def get_points_from(self, request):
        lst = self.calculate_points_from(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "vote_type": request.data["vote_type"],
                "country": request.data["country"],
                "mode": request.data["shows"],
                "average": request.data["average"],
            }
        )

        return JsonResponse(lst, safe=False)

    @action(detail=False, methods=["POST"])
    def get_points_to(self, request):
        lst = self.calculate_points_to(
            {
                "start_year": request.data["start_year"],
                "end_year": request.data["end_year"],
                "vote_type": request.data["vote_type"],
                "country": request.data["country"],
                "mode": request.data["shows"],
                "average": request.data["average"],
            }
        )

        return JsonResponse(lst, safe=False)

    # TODO account for total amount of points given/received?
    def calculate_point_metric(self, data):
        points_from = self.calculate_points_from(data)
        points_to = self.calculate_points_to(data)

        result = []

        for i in range(len(points_from)):
            # TODO check Poland 2021-2023 to see if this is a valid fix
            points_to_elem = next(
                (x for x in points_to if x["country"] == points_from[i]["country"]),
                None,
            )

            result.append(
                {
                    "country": points_from[i]["country"],
                    "result": data["func"](
                        points_to_elem["result"], points_from[i]["result"]
                    ),
                }
            )

        result = sorted(result, key=lambda x: x["result"], reverse=True)

        return result

    """
    This method calculates the discrepancies between the points given by a country and the points received by it
    for each other country. This way, we can see which countries have the most unequal voting exchanges.
    More points received -> positive, more points given -> negative
    """

    @action(detail=False, methods=["POST"])
    def get_discrepancies(self, request):
        params = {
            "start_year": request.data["start_year"],
            "end_year": request.data["end_year"],
            "vote_type": request.data["vote_type"],
            "country": request.data["country"],
            "mode": request.data["shows"],
            "average": request.data["average"],
        }

        result = self.calculate_point_metric({"func": lambda x, y: x - y, **params})

        return JsonResponse(result, safe=False)

    """
    This method calculates the countries with the most points exchanged with the country passed in as an argument.
    """

    @action(detail=False, methods=["POST"])
    def get_friends(self, request):
        params = {
            "start_year": request.data["start_year"],
            "end_year": request.data["end_year"],
            "vote_type": request.data["vote_type"],
            "country": request.data["country"],
            "mode": request.data["shows"],
            "average": request.data["average"],
        }

        result = self.calculate_point_metric({"func": lambda x, y: x + y, **params})

        return JsonResponse(result, safe=False)
