from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from models import Edition


class QualifyViewSet(viewsets.GenericViewSet):
    @action(detail=False, methods=["POST"])
    def get_qualify_count(self, request):
        # get all editions in the given range
        start_year = request.data["start_year"]
        end_year = request.data["end_year"]
        editions = Edition.objects.filter(year__gte=start_year, year__lte=end_year)

        dict = {}

        for edition in editions:
            # get qualifier data for this edition and make an array: qualify_count is 1 if qualifier, 0 if non-qualifier
            qualifier_obj = edition.get_qualifier_data()
            qualifier_lst = [
                {"country": x, "qualify_count": 1} for x in qualifier_obj["qualifiers"]
            ]
            qualifier_lst.extend(
                [
                    {"country": x, "qualify_count": 0}
                    for x in qualifier_obj["non_qualifiers"]
                ]
            )

            # add our qualifier_count values to the dict
            for elem in qualifier_lst:
                if not elem["country"] in dict:
                    dict[elem["country"]] = 0

                dict[elem["country"]] += elem["qualify_count"]

        # convert dict to list for ease of use
        lst = [{"country": k, "qualify_count": v} for k, v in dict.items()]
        return JsonResponse(lst, safe=False)
