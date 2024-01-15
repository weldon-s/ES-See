from django.http import JsonResponse
from enum import Enum
import numpy as np
from rest_framework import viewsets
from rest_framework.decorators import action
from scipy.stats import spearmanr

from rest.countries.viewset import CountrySerializer
from models import Country, Edition, Show, ShowType, Vote, VoteType


class SimilarityViewSet(viewsets.GenericViewSet):
    class RankType(Enum):
        RAW_RANK = 0
        PROPORTION = 1

    def get_ranking_matrix(
        self, year: int, vote_type: VoteType, rank_type: RankType = RankType.PROPORTION
    ):
        """
        Returns a "matrix" containing the rank given to each entry by each voting country.
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
                if rank_type == self.RankType.RAW_RANK:
                    matrix[code][vote.ranking[i]] = i + 1
                elif rank_type == self.RankType.PROPORTION:
                    value = 1 - i / (len(vote.ranking) - 1)
                    matrix[code][vote.ranking[i]] = value

        return matrix

    def get_jury_televote_cosine_similarity(self, year: int):
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

    def get_jury_televote_rank_similarity(self, year: int):
        """
        Gets a quantification of the difference between the jury and televote results for each country
        This uses the Spearman rank correlation coefficient
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

            # now let's calculate the rank correlation
            correlation = spearmanr(jury, televote).statistic

            result_dict[voter] = correlation

        lst = [
            {
                "country": CountrySerializer(Country.objects.get(code=k)).data,
                "similarity": v,
            }
            for k, v in result_dict.items()
        ]

        lst = sorted(lst, key=lambda x: x["similarity"], reverse=True)

        return lst

    # TODO unify these next two functions
    # likely with a function param that calculates similarity given two vectors
    def calculate_cosine_similarity_matrix(self, year: int):
        """
        Gets a "matrix" of the similarity between each pair of countries' voting.
        We'll use cosine similarity to quantify this.
        The actual data structure will be a dict of dicts.
        Since similarity does not depend on the order of the countries, we will only store the upper triangle.
        """

        # Get the ranking matrices for each voting type
        voting_systems = Edition.objects.get(year=year).final.voting_system
        matrices = [self.get_ranking_matrix(year, system) for system in voting_systems]

        # Sum them (assuming all voting types have the same countries)
        summed = {
            voter: {
                votee: sum(
                    [matrix[voter][votee] for matrix in matrices if voter in matrix]
                )
                for votee in matrices[0][voter]
            }
            for voter in matrices[0]
        }

        matrix = {}

        # For each pair of countries, calculate the cosine similarity
        for country_a in summed:
            for country_b in summed:
                # Let's skip this scenario to speed things up
                if country_a >= country_b:
                    continue

                # Get vectors of scores (making sure to have them in the same order!)
                # TODO account for the ranking of the other country since there will be a hole there
                a_scores = [
                    summed[country_a][country]
                    for country in summed[country_a]
                    if country != country_b
                ]

                b_scores = [
                    summed[country_b][country]
                    for country in summed[country_a]
                    if country != country_b
                ]

                # Calculate cosine similarity
                dot_product = np.dot(a_scores, b_scores)

                a_norm = np.linalg.norm(a_scores)
                b_norm = np.linalg.norm(b_scores)

                similarity = dot_product / (a_norm * b_norm)

                if country_a not in matrix:
                    matrix[country_a] = {}

                matrix[country_a][country_b] = similarity

        return matrix

    def get_rank_similarity_matrix(self, year: int):
        # Get the ranking matrices for each voting type
        voting_systems = Edition.objects.get(year=year).final.voting_system
        matrices = [self.get_ranking_matrix(year, system) for system in voting_systems]

        # Sum them (assuming all voting types have the same countries)
        summed = {
            voter: {
                votee: sum(
                    [matrix[voter][votee] for matrix in matrices if voter in matrix]
                )
                for votee in matrices[0][voter]
            }
            for voter in matrices[0]
        }

        matrix = {}

        # For each pair of countries, calculate the rank similarity
        for country_a in summed:
            for country_b in summed:
                # Let's skip this scenario to speed things up
                if country_a >= country_b:
                    continue

                # Get vectors of scores (making sure to have them in the same order!)
                a_scores = [
                    summed[country_a][country]
                    for country in summed[country_a]
                    if country != country_b
                ]

                b_scores = [
                    summed[country_b][country]
                    for country in summed[country_a]
                    if country != country_b
                ]

                # Calculate similarity
                correlation = spearmanr(a_scores, b_scores).statistic

                if country_a not in matrix:
                    matrix[country_a] = {}

                matrix[country_a][country_b] = correlation

        return matrix

    def get_ranked_cosine_similarities(self, year: int):
        """
        Get all country pairs ranked by similarity in voting
        """

        # Get the similarity matrix
        matrix = self.calculate_cosine_similarity_matrix(year)

        lst = [
            {
                "countries": [
                    country_a,
                    country_b,
                ],
                "similarity": matrix[country_a][country_b],
            }
            for country_a in matrix
            for country_b in matrix[country_a]
        ]

        lst = sorted(lst, key=lambda x: x["similarity"], reverse=True)

        return lst

    def get_ranked_rank_similarities(self, year: int):
        # Get the similarity matrix
        matrix = self.get_rank_similarity_matrix(year)

        lst = [
            {
                "countries": [country_a, country_b],
                "similarity": matrix[country_a][country_b],
            }
            for country_a in matrix
            for country_b in matrix[country_a]
        ]

        lst = sorted(lst, key=lambda x: x["similarity"], reverse=True)

        return lst

    @action(detail=False, methods=["POST"])
    def get_similarity(self, request):
        start_year = request.data["start_year"]
        end_year = request.data["end_year"]
        mode = request.data["mode"]

        # dict of dicts: key 1 is country A, key 2 is country B, value is [sum, count]
        result_dict = {}
        countries = set()

        for year in range(start_year, end_year + 1):
            if year == 2020:
                continue

            if mode == "cosine":
                matrix = self.calculate_cosine_similarity_matrix(year)
            elif mode == "rank":
                matrix = self.get_rank_similarity_matrix(year)

            for country_a in matrix:
                if country_a not in result_dict:
                    result_dict[country_a] = {}
                    countries.add(country_a)

                for country_b in matrix[country_a]:
                    if country_b not in result_dict[country_a]:
                        result_dict[country_a][country_b] = [0, 0]
                        countries.add(country_b)

                    similarity = matrix[country_a][country_b]
                    result_dict[country_a][country_b][0] += similarity
                    result_dict[country_a][country_b][1] += 1

        # Now we'll calculate the average similarity for each pair
        averaged = {
            country_a: {
                country_b: result_dict[country_a][country_b][0]
                / result_dict[country_a][country_b][1]
                for country_b in sorted(result_dict[country_a])
            }
            for country_a in sorted(result_dict)
        }

        countries_lst = [
            CountrySerializer(Country.objects.get(code=country)).data
            for country in sorted(countries)
        ]

        return JsonResponse({"data": averaged, "countries": countries_lst}, safe=False)
