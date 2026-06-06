from django.urls import path

from app import views
from app.views import *

urlpatterns = [
    path('', views.index, name='index'),
    path('qrcode-time-limited', views.qrcode_time_limited, name='qrcode_time_limited'),
    path('generate_temp_link/', views.generate_temp_link, name='generate_temp_link'),
    path('r/<path:token>/', views.redirect_temp_link, name='redirect_temp_link'),
]