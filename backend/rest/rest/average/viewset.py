from django.http import JsonResponse
from json import loads
from rest_framework import viewsets
from rest_framework.decorators import action

from models import Edition, Result, ShowType, VoteType

class AverageViewset(viewsets.GenericViewSet):
    @action(detail=False, methods=['POST'])
    def get_average_final_points(self, request):
        #get the start and end years from the request
        data = loads(request.body)
        start_year = data.get('start_year')
        end_year = data.get('end_year')
        include_nq = data.get('include_nq', True)
        #TODO add option for including NQ years in average

        editions = Edition.objects.filter(year__gte=start_year, year__lte=end_year)

        # get the average points for each country
        # we use a dict with country ids as a key, and a list of [points, num_editions] as a value
        # this way, we don't assume that each country has participated in every edition
        averages = {}

        for edition in editions:
            print(edition.year)
            final = edition.show_set.get(show_type=ShowType.GRAND_FINAL)

            performances = final.performance_set.all()

            if not include_nq:
                performances = performances.filter(running_order__gt=0)

            #TODO ignore noncompeting countries
            for performance in performances:
                if not performance.country.id in averages:
                    averages[performance.country.id] = [0, 0]

                #if this performance did not qualify, increment show counter without adding points  
                if performance.running_order <= 0:
                    averages[performance.country.id][1] += 1

                else:
                    result = Result.objects.get(performance=performance)

                    #find the key for the points given the voting system
                    key_index = VoteType.COMBINED if len(final.voting_system) > 1 else final.voting_system[0]
                    key = VoteType.choices[key_index - 1][1].lower()

                    #add points to tally and increment number of editions
                    averages[performance.country.id][0] += getattr(result, key)
                    averages[performance.country.id][1] += 1

        #calculate the average points for each country
        for country_id in averages:
            averages[country_id] = averages[country_id][0] / averages[country_id][1]

        #convert dict into list sorted by the average we just calculated
        lst = sorted(averages.items(), key=lambda x: x[1], reverse=True)

        lst = [{'country': x[0], 'average': x[1], 'place': lst.index(x) + 1} for x in lst]

        return JsonResponse(lst, safe=False)                                                                                                                                                                                                                                                                                                                            