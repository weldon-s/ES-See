from django.db import models
from django.contrib.postgres.fields import ArrayField
from functools import reduce


# Base model class to put all models in data app
class BaseModel(models.Model):
    class Meta:
        abstract = True
        app_label = "data"


# Enum for show type
ShowType = models.IntegerChoices("ShowType", "SEMI-FINAL_1 SEMI-FINAL_2 GRAND_FINAL")


# Enum for vote type
VoteType = models.IntegerChoices("VoteType", "JURY TELEVOTE COMBINED")


def get_vote_key(vote_type):
    return VoteType.choices[vote_type - 1][1].lower()


# Points per place (place not in array means no points for that place)
POINTS_PER_PLACE = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1]


# Model for countries that have participated in Eurovision
class Country(BaseModel):
    name = models.CharField(max_length=50)
    adjective = models.CharField(max_length=50)

    # ISO 3166-1 alpha-2 country code
    code = models.CharField(max_length=2)

    # True if country is a member of the Big Five (France, Germany, Italy, Spain, United Kingdom)
    is_big_five = models.BooleanField(default=False)

    def _str_(self):
        return self.name


# Represents an edition of the contest
class Edition(BaseModel):
    year = models.IntegerField()
    host = models.ForeignKey(
        Country, on_delete=models.CASCADE
    )  # TODO make separate field for last year's winner?
    city = models.CharField(max_length=25)


# Shows represent a specific semi-final or final in an edition.
# They are associated with a given voting system, which is an array of the types of points given out in said show.
class Show(BaseModel):
    edition = models.ForeignKey(Edition, on_delete=models.CASCADE)
    show_type = models.IntegerField(
        choices=ShowType.choices, default=ShowType.GRAND_FINAL
    )

    voting_system = ArrayField(
        models.IntegerField(choices=VoteType.choices, default=VoteType.COMBINED)
    )

    def get_show_key(self):
        return ShowType.choices[self.show_type - 1][1].lower()

    def get_primary_vote_type(self):
        return (
            VoteType.COMBINED if len(self.voting_system) > 1 else self.voting_system[0]
        )

    def get_maximum_possible(self):
        # get the number of countries voting in the show
        num_countries = Performance.objects.filter(show=self).count()
        num_votes = len(self.voting_system)
        # we can't vote for our own country, so subtract 1
        return (num_countries - 1) * num_votes * POINTS_PER_PLACE[0]


# Entries represent a song sent by a country in a given year
# e.g. Portugal 2023, Serbia 2022, France 2021
class Entry(BaseModel):
    # We can leave these two blank when a country does not perform
    # e.g. in the case of Rest of the World (not a country but close enough) and Serbia and Montenegro 2006
    title = models.CharField(max_length=50, null=True, blank=True)
    artist = models.CharField(max_length=100, null=True, blank=True)

    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    year = models.ForeignKey(Edition, on_delete=models.CASCADE)

    def _str_(self):
        return f"{self.title} by {self.artist}"


# Performances represent a specific instance of a song being sung in a show (or of a non-performing country voting)
# e.g. Portugal in Semi 1 in 2023, Serbia in Semi 2 in 2022, France in the Grand Final in 2021
class Performance(BaseModel):
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    show = models.ForeignKey(Show, on_delete=models.CASCADE)
    running_order = (
        models.IntegerField()
    )  # nonpositive indicates not competing, only voting


# Votes are the results of a country's jury or televote (or combined vote) in a given show
class Vote(BaseModel):
    vote_type = models.IntegerField(choices=VoteType.choices, default=VoteType.COMBINED)
    performance = models.ForeignKey(Performance, on_delete=models.CASCADE)
    ranking = ArrayField(models.CharField(max_length=2))


# Results are the results of a performance in a given show
# They are used to prevent the need to calculate the results every time they are requested
class Result(BaseModel):
    performance = models.ForeignKey(Performance, on_delete=models.CASCADE)
    place = models.IntegerField()
    jury_place = models.IntegerField(null=True, blank=True)
    televote_place = models.IntegerField(null=True, blank=True)
    combined = models.IntegerField(null=True, blank=True)
    jury = models.IntegerField(null=True, blank=True)
    televote = models.IntegerField(null=True, blank=True)
    running_order = models.IntegerField()
