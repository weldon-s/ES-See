from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, JsonResponse
from json import loads
from rest_framework import serializers, viewsets
from rest_framework.decorators import action

from models import Entry

class EntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entry
        fields = ['id', 'title', 'artist', 'country', 'year']