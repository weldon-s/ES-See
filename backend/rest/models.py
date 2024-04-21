from django.db import models
from django.contrib.postgres.fields import ArrayField
from functools import reduce


class BaseModel(models.Model):
    """Base model class to put all models in data app"""

    class Meta:
        abstract = True
        app_label = "data"


# Enum for show type
ShowType = models.IntegerChoices("ShowType", "SEMI-FINAL_1 SEMI-FINAL_2 GRAND_FINAL")


# Enum for vote type
VoteType = models.IntegerChoices("VoteType", "JURY TELEVOTE COMBINED")


def get_vote_label(vote_type):
    return VoteType.choices[vote_type - 1][1].lower()


def get_vote_index(vote_label):
    return VoteType[vote_label.upper()]


# Points per place (place not in array means no points for that place)
POINTS_PER_PLACE = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1]


class Country(BaseModel):
    """Model for countries that have participated in Eurovision"""

    name = models.CharField(max_length=50)
    adjective = models.CharField(max_length=50)

    # ISO 3166-1 alpha-2 country code
    code = models.CharField(max_length=2)

    # True if country is a member of the Big Five (France, Germany, Italy, Spain, United Kingdom)
    is_big_five = models.BooleanField(default=False)

    def _str_(self):
        return self.name


class Group(BaseModel):
    """Represents a group of countries, e.g. Nordics, Big Five, Romance-speaking, etc."""

    name = models.CharField(max_length=50)
    countries = models.ManyToManyField(Country)


class Edition(BaseModel):
    """Represents an edition of the contest"""

    # TODO make year primary key

    year = models.IntegerField()
    host = models.ForeignKey(
        Country, on_delete=models.CASCADE
    )  # TODO make separate field for last year's winner?
    city = models.CharField(max_length=25)

    @property
    def final(self):
        return self.show_set.get(show_type=ShowType.GRAND_FINAL)

    @property
    def semi_finals(self):
        return self.show_set.exclude(show_type=ShowType.GRAND_FINAL)

    def get_qualifier_data(self):
        if self.show_set.count() == 0:
            return None

        qualifiers = list(
            self.final.performance_set.filter(running_order__gt=0)
            .exclude(country__is_big_five=True)
            .exclude(country__id=self.host.id)
            .values_list("country__id", flat=True)
        )

        non_qualifiers = list(
            self.final.performance_set.filter(running_order__lte=0)
            .exclude(country__code="un")
            .values_list("country__id", flat=True)
        )

        return {"qualifiers": qualifiers, "non_qualifiers": non_qualifiers}

    def get_automatic_qualifiers(self):
        lst = list(
            self.show_set.get(show_type=ShowType.GRAND_FINAL)
            .performance_set.filter(
                models.Q(country__is_big_five=True) | models.Q(country=self.host)
            )
            .values_list("country", flat=True)
        )

        return lst


class Show(BaseModel):
    """
    Shows represent a specific semi-final or final in an edition.
    They are associated with a given voting system, which is an array of the types of points given out in said show.
    """

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


class Language(BaseModel):
    """
    Languages represent, well... languages
    TODO add countries where a language is official?
    """

    name = models.CharField(max_length=25)


class Entry(BaseModel):
    """
    Entries represent a song sent by a country in a given year
    e.g. Portugal 2023, Serbia 2022, France 2021
    """

    # We can leave these two blank when a country does not perform
    # e.g. in the case of Rest of the World (not a country but close enough) and Serbia and Montenegro 2006
    title = models.CharField(max_length=75, null=True, blank=True)
    artist = models.CharField(max_length=100, null=True, blank=True)

    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    year = models.ForeignKey(Edition, on_delete=models.CASCADE)

    languages = models.ManyToManyField(Language)

    def _str_(self):
        return f"{self.title} by {self.artist}"


class Performance(BaseModel):
    """
    Performances represent a specific instance of a song being sung in a show (or of a non-performing country voting)
    e.g. Portugal in Semi 1 in 2023, Serbia in Semi 2 in 2022, France in the Grand Final in 2021
    """

    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    show = models.ForeignKey(Show, on_delete=models.CASCADE)
    running_order = (
        models.IntegerField()
    )  # nonpositive indicates not competing, only voting


class Vote(BaseModel):
    """Votes are the results of a country's jury or televote (or combined vote) in a given show"""

    vote_type = models.IntegerField(choices=VoteType.choices, default=VoteType.COMBINED)
    performance = models.ForeignKey(Performance, on_delete=models.CASCADE)
    ranking = ArrayField(models.CharField(max_length=2))

    @property
    def edition(self):
        return self.performance.show.edition


class Result(BaseModel):
    """
    Results are the results of a performance in a given show
    They are used to prevent the need to calculate the results every time they are requested
    """

    performance = models.ForeignKey(Performance, on_delete=models.CASCADE)
    place = models.IntegerField()
    jury_place = models.IntegerField(null=True, blank=True)
    televote_place = models.IntegerField(null=True, blank=True)
    combined = models.IntegerField(null=True, blank=True)
    jury = models.IntegerField(null=True, blank=True)
    televote = models.IntegerField(null=True, blank=True)
    running_order = models.IntegerField()

    def get_place(self, vote_type):
        if vote_type == VoteType.JURY:
            return self.jury_place
        elif vote_type == VoteType.TELEVOTE:
            return self.televote_place
        else:
            return self.place

    @property
    def voter_count(self):
        # get the number of countries voting in the show
        show = self.performance.show
        return Country.objects.filter(performance__show=show).count() - 1
