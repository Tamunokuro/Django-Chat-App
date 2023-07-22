import json
from uuid import UUID

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from django.contrib.auth import get_user_model

from django_chat.chats.api.serializers import MessageSerializer

from .models import Conversation, Message

User = get_user_model()


class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            return obj.hex
        return json.JSONEncoder.default(self, obj)


class ChatConsumer(JsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.chat_name = None
        self.chat = None

    def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            return
        print("Connected")
        self.accept()
        self.chat_name = f"{self.scope['url_route']['kwargs']['chat_name']}"
        self.chat, created = Conversation.objects.get_or_create(name=self.chat_name)

        # accept connection
        async_to_sync(self.channel_layer.group_add)(self.chat_name, self.channel_name)

        self.send_json(
            {
                "type": "online_user",
                "users": [user.username for user in self.chat.online.all()],
            }
        )

        async_to_sync(self.channel_layer.group_send)(
            self.chat_name,
            {"type": "user_joined", "user": self.user.username},
        )

        self.chat.online.add(self.user)
        # send json message
        self.send_json({"type": "chat", "text": "Welcome to the chat room!"})
        messages = self.chat.messages.all().order_by("-timestamp")[0:50]
        message_count = self.chat.messages.all().count()
        self.send_json(
            {
                "type": "last_50_messages",
                "messages": MessageSerializer(messages, many=True).data,
                "has_more": message_count > 50,
            }
        )

    def disconnect(self, code):
        print("Disconnected")
        if self.user.is_authenticated:
            async_to_sync(self.channel_layer.group_send)(
                self.chat_name, {"type": "user_left", "user": self.user.username}
            )
            self.chat.online.remove(self.user)
        return super().disconnect(code)

    def get_receiver(self):
        usernames = self.chat_name.split("__")
        for username in usernames:
            if username != self.user.username:
                return User.objects.get(username=username)

    def receive_json(self, content, **kwargs):
        message_type = content["type"]
        if message_type == "chat_message":
            message = Message.objects.create(
                from_user=self.user,
                to_user=self.get_receiver(),
                chat=content["message"],
                conversation=self.chat,
            )
            async_to_sync(self.channel_layer.group_send)(
                self.chat_name,
                {
                    "type": "chat_message_echo",
                    "name": self.user.username,
                    "message": MessageSerializer(message).data,
                },
            )

        if message_type == "typing":
            async_to_sync(self.channel_layer.group_send)(
                self.chat_name, {"type": "typing", "name": self.user.username, "typing": content["typing"]}
            )

        return super().receive_json(content, **kwargs)

    def chat_message_echo(self, event):
        print(event)
        self.send_json(event)

    def user_joined(self, event):
        self.send_json(event)

    def user_left(self, event):
        self.send_json(event)

    def typing(self, event):
        self.send_json(event)

    @classmethod
    def encode_json(cls, content):
        return json.dumps(content, cls=UUIDEncoder)
