from django.shortcuts import JsonResponse
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
        start_year = request["start_year"]
        end_year = request["end_year"]

        entries = Entry.objects.filter(
            year__year__gte=start_year, year__year__lte=end_year
        )

        # keys are languages, values are [total, num_years]
        data = {}

        for entry in entries:
            for language in entry.languages.all():
                if language not in data:
                    data[language] = 0

                data[language] += 1

        lst = [
            {"language": language, "count": count} for language, count in data.items()
        ]

        return JsonResponse(LanguageSerializer(lst, many=True).data, safe=False)
