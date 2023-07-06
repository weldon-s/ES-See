from django.db import models
from django.contrib.postgres.fields import ArrayField

#Base model class to put all models in data app
class BaseModel(models.Model):
    class Meta:
        abstract = True
        app_label = 'data'

#Enum for show type
ShowType = models.IntegerChoices("ShowType", "SEMI-FINAL_1 SEMI-FINAL_2 GRAND_FINAL")

#Enum for vote type
VoteType = models.IntegerChoices("VoteType", "JURY TELEVOTE COMBINED")

#Points per place (place not in array means no points for that place)
POINTS_PER_PLACE = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1]

#Has ISO 3166-1 alpha-2 country codes and full country names
class Country(BaseModel):
    name = models.CharField(max_length=50)
    code = models.CharField(max_length=2)
    
    def _str_(self):
        return self.name

#Represents an edition of the contest
class Edition(BaseModel):
    year = models.IntegerField()
    host = models.ForeignKey(Country, on_delete=models.CASCADE)
    city = models.CharField(max_length=25)

#Shows represent a specific semi-final or final in an edition.
#They are associated with a given voting system, which is an array of the types of points given out in said show.
class Show(BaseModel):
    edition = models.ForeignKey(Edition, on_delete=models.CASCADE)
    show_type = models.IntegerField(choices=ShowType.choices, default=ShowType.GRAND_FINAL)
    voting_system = ArrayField(models.IntegerField(choices=VoteType.choices, default=VoteType.COMBINED))

#Entries represent a song sent by a country in a given year
#e.g. Portugal 2023, Serbia 2022, France 2021
class Entry(BaseModel):
    #We can leave these two blank when a country does not perform 
    # e.g. in the case of Rest of the World (not a country but close enough) and Serbia and Montenegro 2006
    title = models.CharField(max_length=50, null=True, blank=True)
    artist = models.CharField(max_length=100, null=True, blank=True)

    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    year = models.ForeignKey(Edition, on_delete=models.CASCADE)

    def _str_(self):
        return f"{self.title} by {self.artist}"

#Performances represent a specific instance of a song being sung in a show (or of a non-performing country voting)
#e.g. Portugal in Semi 1 in 2023, Serbia in Semi 2 in 2022, France in the Grand Final in 2021
class Performance(BaseModel):
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    show = models.ForeignKey(Show, on_delete=models.CASCADE)
    running_order = models.IntegerField() #nonpositive indicates not competing, only voting

#Votes are the results of a country's jury or televote (or combined vote) in a given show
class Vote(BaseModel):
    vote_type = models.IntegerField(choices=VoteType.choices, default=VoteType.COMBINED)
    performance = models.ForeignKey(Performance, on_delete=models.CASCADE)
    ranking = ArrayField(models.CharField(max_length=2))