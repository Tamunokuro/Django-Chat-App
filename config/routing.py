from django.urls import path
from django_chat.chats.consumers import ChatConsumer

websocket_urlpatterns = [path("", ChatConsumer.as_asgi())]
