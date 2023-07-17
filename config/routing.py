from django.urls import path

from django_chat.chats.consumers import ChatConsumer

websocket_urlpatterns = [path("<chat_name>/", ChatConsumer.as_asgi())]
