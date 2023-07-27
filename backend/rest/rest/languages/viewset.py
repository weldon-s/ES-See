from django.http import JsonResponse
from rest_framework import serializers, viewsets
from rest_framework.decorators import action

from models import Entry, Language


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

        entries = Entry.objects.filter(
            year__year__gte=start_year, year__year__lte=end_year
        )

        # keys are languages, values are totals
        data = {}

        for entry in entries:
            for language in entry.languages.all():
                if language not in data:
                    data[language] = 0

                data[language] += 1

        lst = [
            {"language": language.name, "count": count}
            for language, count in data.items()
        ]

        lst.sort(key=lambda x: x["count"], reverse=True)

        return JsonResponse(lst, safe=False)

    # returns the number of countries that have sent entries in a specific language
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
            {"language": language.name, "count": len(country_set)}
            for language, country_set in data.items()
        ]

        lst.sort(key=lambda x: x["count"], reverse=True)

        return JsonResponse(lst, safe=False)
