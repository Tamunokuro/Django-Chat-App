from django.urls import path
from django_chat.chat.consumers import ChatConsumer

websocket_urlpatterns = [path("", ChatConsumer.as_asgi())]
