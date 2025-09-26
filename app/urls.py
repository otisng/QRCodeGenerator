from django.urls import path

from app import views
from app.views import *

urlpatterns = [
    path('', views.index, name='index'),
]