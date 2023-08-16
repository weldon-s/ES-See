import numpy as np
from rest_framework import viewsets

from rest.countries.viewset import CountrySerializer
from models import Country, Show, ShowType, Vote, VoteType


class FriendViewSet(viewsets.GenericViewSet):
    def get_ranking_matrix(self, year: int, vote_type: int):
        """
        Returns a "matrix" containing the points given to each entry by each voting country.
        The actual data structure will be a dict of dicts.
        The outer dict will be keyed by the voting countries
        The inner dicts will be keyed by the receiving countries (i.e. the participants)
        The values will be the proportion of countries the giving country rated below the receiving country
        So 1 for first place, 0 for last place
        We'll only care about finals for now
        """

        # Get the final for the given year
        final = Show.objects.get(edition__year=year, show_type=ShowType.GRAND_FINAL)

        # Get all the votes in the final
        votes = Vote.objects.filter(
            performance__in=final.performance_set.all(), vote_type=vote_type
        )

        # Now we'll set up our matrix
        matrix = {}

        vote: Vote
        for vote in votes:
            # We'll just assume that all the entries are there if there are more than 10
            # (10 normally implies only knowing the countries that got points)
            if len(vote.ranking) <= 10:
                continue

            code = vote.performance.country.code
            matrix[code] = {}

            # Let's iterate through the vote's rankings
            for i in range(len(vote.ranking)):
                value = 1 - i / (len(vote.ranking) - 1)
                matrix[code][vote.ranking[i]] = value

        return matrix

    def get_jury_televote_difference(self, year: int):
        """
        Gets a quantification of the difference between the jury and televote results for each country
        We'll use cosine similarity for this
        """

        result_dict = {}

        # Get our matrices
        jury_matrix = self.get_ranking_matrix(year, VoteType.JURY)
        televote_matrix = self.get_ranking_matrix(year, VoteType.TELEVOTE)

        for voter in jury_matrix:
            if voter not in televote_matrix:
                continue

            jury = []
            televote = []

            # get entries in the same order
            for receiver in jury_matrix[voter]:
                if receiver not in televote_matrix[voter]:
                    continue

                jury.append(jury_matrix[voter][receiver])
                televote.append(televote_matrix[voter][receiver])

            # Calculate cosine similarity
            dot_product = np.dot(jury, televote)

            jury_norm = np.linalg.norm(jury)
            televote_norm = np.linalg.norm(televote)

            similarity = dot_product / (jury_norm * televote_norm)

            result_dict[voter] = similarity

        lst = [
            {
                "country": CountrySerializer(Country.objects.get(code=k)).data,
                "similarity": v,
            }
            for k, v in result_dict.items()
        ]

        lst = sorted(lst, key=lambda x: x["similarity"], reverse=True)

        return lst
