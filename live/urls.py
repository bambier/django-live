from django.urls import path

from live.views import index



app_name = 'live'
urlpatterns = [
    path('', index, name="index")
]
