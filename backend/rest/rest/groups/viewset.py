from django.http import JsonResponse
from rest_framework import serializers
from rest_framework import viewsets
from rest_framework.decorators import action

from models import Group


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name", "countries"]


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

    @action(detail=False, methods=["POST"])
    def get_all(self, request):
        """Returns all groups"""
        return JsonResponse(GroupSerializer(self.queryset, many=True).data, safe=False)

    @action(detail=True, methods=["POST"])
    def get_group(self, request, pk=None):
        """Returns a specific group"""
        group = self.queryset.get(id=pk)
        return JsonResponse(GroupSerializer(group, many=False).data, safe=False)
