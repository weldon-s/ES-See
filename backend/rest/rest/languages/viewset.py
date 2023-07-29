from django.http import JsonResponse
from rest_framework import serializers, viewsets
from rest_framework.decorators import action

from models import Entry, Language, Performance, Result, ShowType


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ["id", "name"]


class LanguageViewSet(viewsets.ModelViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer

    # returns the number of entries in a specific language
    @action(detail=False, methods=["POST"])
    def get_language_count(self, request):
        start_year = request.data["start_year"]
        end_year = request.data["end_year"]
        weighted = request.data.get("weighted", False)

        entries = Entry.objects.filter(
            year__year__gte=start_year, year__year__lte=end_year
        )

        # keys are languages, values are totals
        data = {}

        for entry in entries:
            for language in entry.languages.all():
                if language not in data:
                    data[language] = 0

                if weighted:
                    data[language] += 1 / len(entry.languages.all())
                else:
                    data[language] += 1

        lst = [
            {"language": language.name, "result": count}
            for language, count in data.items()
        ]

        lst.sort(key=lambda x: x["result"], reverse=True)

        return JsonResponse(lst, safe=False)

    # returns the number of countries that have sent entries in a specific language over a time period
    @action(detail=False, methods=["POST"])
    def get_country_count(self, request):
        start_year = request.data["start_year"]
        end_year = request.data["end_year"]

        entries = Entry.objects.filter(
            year__year__gte=start_year, year__year__lte=end_year
        )

        # keys are languages, values are sets of country ids that have sent entries in that language

        data = {}

        for entry in entries:
            for language in entry.languages.all():
                if language not in data:
                    data[language] = set(())

                data[language].add(entry.country.id)

        lst = [
            {"language": language.name, "result": len(country_set)}
            for language, country_set in data.items()
        ]

        lst.sort(key=lambda x: x["result"], reverse=True)

        return JsonResponse(lst, safe=False)

    # returns the longest streak of having an entry in a specific language
    # this includes 2020, should it? something to think about
    @action(detail=False, methods=["POST"])
    def get_use_streak(self, request):
        start_year = request.data["start_year"]
        end_year = request.data["end_year"]

        # keys are languages, values are 1 for a year with an entry in that language, 0 for a year without
        data = {}

        for year in range(start_year, end_year + 1):
            entries = Entry.objects.filter(year__year=year)

            for entry in entries:
                for language in entry.languages.all():
                    if language not in data:
                        data[language] = [0] * (end_year - start_year + 1)

                    data[language][year - start_year] = 1

        streaks = []

        for language, streak_data in data.items():
            longest = 0
            current = 0

            for num in streak_data:
                # if we are going to break the streak, check if it is the longest and then reset
                if num == 0:
                    if current > longest:
                        longest = current

                    current = 0

                # otherwise, increment
                else:
                    current += 1

            # check again at the end in case the last streak is never broken
            if current > longest:
                longest = current

            streaks.append({"language": language.name, "result": longest})

        # keys are languages, values are streaks

        streaks.sort(key=lambda x: x["result"], reverse=True)

        return JsonResponse(streaks, safe=False)

    # returns the Q rate of all songs in a language
    @action(detail=False, methods=["POST"])
    def get_qualification_rate(self, request):
        start_year = request.data["start_year"]
        end_year = request.data["end_year"]

        entries = Entry.objects.filter(
            year__year__gte=start_year, year__year__lte=end_year
        )

        # keys are languages, values are [q_count, total_count]

        data = {}

        for entry in entries:
            performances = Performance.objects.filter(
                country=entry.country, show__edition__year=entry.year.year
            ).exclude(show__show_type=ShowType.GRAND_FINAL)

            if len(performances) == 0 or performances[0].running_order <= 0:
                continue

            result = Result.objects.get(performance=performances[0])

            for language in entry.languages.all():
                if language not in data:
                    data[language] = [0, 0]

                if result.place <= 10:
                    data[language][0] += 1

                data[language][1] += 1

        lst = [
            {"language": language.name, "result": data[language][0] / data[language][1]}
            for language in data
        ]

        lst.sort(key=lambda x: x["result"], reverse=True)

        return JsonResponse(lst, safe=False)

    # returns the earliest or latest appearance of a language
    # TODO year with most appearances of a language?
    def get_appearance(self, data):
        entries = Entry.objects.filter(
            year__year__gte=data["start_year"], year__year__lte=data["end_year"]
        )

        # keys are languages, values are years fitting the criterion
        dict = {}

        for entry in entries:
            for language in entry.languages.all():
                if language not in dict:
                    dict[language] = entry.year.year

                # if we are looking for the earliest appearance, we want to find the minimum year
                if data["mode"] == "earliest":
                    dict[language] = min(dict[language], entry.year.year)

                # if we are looking for the latest appearance, we want to find the maximum year
                elif data["mode"] == "latest":
                    dict[language] = max(dict[language], entry.year.year)

        lst = [
            {"language": language.name, "result": year}
            for language, year in dict.items()
        ]

        lst.sort(key=lambda x: x["result"], reverse=data["mode"] == "latest")

        return JsonResponse(lst, safe=False)

    @action(detail=False, methods=["POST"])
    def get_earliest_appearance(self, request):
        return self.get_appearance({"mode": "earliest", **request.data})

    @action(detail=False, methods=["POST"])
    def get_latest_appearance(self, request):
        return self.get_appearance({"mode": "latest", **request.data})
