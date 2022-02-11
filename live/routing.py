from django.urls import path

from live.consumers import LiveLiveConsumer

websocket_urlpatterns = [
	path('live/', LiveConsumer.as_asgi()),
]