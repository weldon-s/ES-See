from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from models import Country, Edition, Performance, POINTS_PER_PLACE, Result, Show, Vote


# TODO revisit other viewsets + change as needed
class PredictViewSet(viewsets.ViewSet):
    @action(detail=False, methods=["get"])
    def country_affinity(self, request):
        """
        Gets the affinity of all countries with the others in their semi-final for a given year.
        """

        # TODO change to post
        predict_year = 2024
        start_year = 2018
        end_year = 2023

        # Get the semi-finals of the year to predict
        # FIXME this wont work with single-semi editions

        semi_finals = Edition.objects.get(year=predict_year).semi_finals
        vote_types = semi_finals.first().voting_system

        voter_sets = []
        competitor_sets = []

        semi: Show

        for semi in semi_finals:
            # Get the countries that are in the semi-final
            voter_sets.append(
                Country.objects.filter(performance__in=semi.performance_set.all())
            )

            # Get the countries that are actually competing
            competitor_sets.append(
                Country.objects.filter(
                    performance__in=semi.performance_set.filter(running_order__gt=0)
                )
            )

        # This is a dictionary of dictionaries of arrays
        # The first key is the competitor
        # The second key is the voter
        # Then we have the year-by-year, vote-by-vote affinity
        # This is calculated by finding the difference between the actual number of points
        # given by the voter to the competitor and the average for that entry
        # We only consider the voting methods that are used in the prediction year
        affinities = {}

        # Now, let's go through each year and find our affinities!

        for year in range(start_year, end_year + 1):
            year_semi_finals = Edition.objects.get(year=year).semi_finals

            # If there are no semi-finals, we skip this year
            if not year_semi_finals.exists():
                continue

            for i in range(len(semi_finals)):
                # Do each semi-final separately

                voters = voter_sets[i]
                competitors = competitor_sets[i]

                voter: Country
                for voter in voters:
                    # Get the semi-final votes for this voter in this year
                    semi_votes = Vote.objects.filter(
                        performance__country=voter,
                        performance__show__in=year_semi_finals,
                        vote_type__in=vote_types,
                    )

                    if not semi_votes.exists():
                        continue

                    competitor: Country
                    for competitor in competitors:
                        if competitor == voter:
                            continue

                        # Get the voter's votes that are for the competitor
                        competitor_votes = semi_votes.filter(
                            ranking__contains=[competitor.code]
                        )

                        if not competitor_votes.exists():
                            continue

                        points = 0

                        for vote in competitor_votes:
                            index = vote.ranking.index(competitor.code)
                            try:
                                points += POINTS_PER_PLACE[index]
                            except IndexError:
                                pass

                        # Get the average points for this competitor
                        result = Result.objects.get(
                            performance__country=competitor,
                            performance__show__in=year_semi_finals,
                        )

                        # TODO account for different voting systems
                        total = result.televote

                        semi = year_semi_finals.get(performance__country=competitor)
                        count = semi.performance_set.count() - 1

                        average = total / count

                        # Calculate the affinity
                        affinity = points - average

                        try:
                            affinities[competitor.code][voter.code].append(affinity)
                        except KeyError:
                            # Initialize the dictionary if it doesn't exist
                            if competitor.code not in affinities:
                                affinities[competitor.code] = {voter.code: [affinity]}

                            if voter.code not in affinities[competitor.code]:
                                affinities[competitor.code][voter.code] = [affinity]

        # We finally have all of the affinities calculated, now we need to average them

        collapsed_affinities = {
            competitor: sum(
                sum(affinities[competitor][voter]) / len(affinities[competitor][voter])
                for voter in affinities[competitor]
            )
            / len(affinities[competitor])
            for competitor in affinities
        }

        return JsonResponse({"result": collapsed_affinities})
