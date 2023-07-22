"""
URL configuration for rest project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from rest.shows.viewset import ShowViewSet
from rest.countries.viewset import CountryViewSet
from rest.editions.viewset import EditionViewSet
from rest.entries.viewset import EntryViewSet
from rest.results.viewset import ResultViewSet
from rest.average.viewset import AverageViewset
from rest.qualify.viewset import QualifyViewSet
from rest.running_order.viewset import RunningOrderViewset
from rest.exchanges.viewset import ExchangeViewSet

router = DefaultRouter()

router.register(r"shows", ShowViewSet, "data-shows")
router.register(r"countries", CountryViewSet, "data-countries")
router.register(r"editions", EditionViewSet, "data-editions")
router.register(r"entries", EntryViewSet, "data-entries")
router.register(r"results", ResultViewSet, "data-results")
router.register(r"average", AverageViewset, "data-average")
router.register(r"qualify", QualifyViewSet, "data-qualify")
router.register(r"running_order", RunningOrderViewset, "data-running_order")
router.register(r"exchanges", ExchangeViewSet, "data-exchanges")

# urlpatterns = [
#   path('', include('data.urls')),
# path('admin/', admin.site.urls),
# ]
urlpatterns = router.urls
