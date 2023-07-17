from django.contrib.auth import get_user_model
from rest_framework import serializers

from django_chat.chats.models import Conversation, Message
from django_chat.users.api.serializers import UserSerializer

User = get_user_model()


class MessageSerializer(serializers.ModelSerializer):
    from_user = serializers.SerializerMethodField()
    to_user = serializers.SerializerMethodField()
    conversation = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            "id",
            "conversation",
            "from_user",
            "to_user",
            "chat",
            "timestamp",
            "read",
        )

    def get_from_user(self, obj):
        return UserSerializer(obj.from_user).data

    def get_to_user(self, obj):
        return UserSerializer(obj.to_user).data

    def get_conversation(self, obj):
        return str(obj.conversation.id)


class ConversationSerializer(serializers.ModelSerializer):
    last_messages = serializers.SerializerMethodField()
    other_users = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ("id", "name", "last_messages", "other_users")

    def get_last_messages(self, obj):
        messages = obj.messages.all().order_by("-timestamp")
        if not messages.exists():
            return None
        message = messages[0]
        return MessageSerializer(message).data

    def get_other_users(self, obj):
        usernames = obj.name.split("__")
        context = {}
        for username in usernames:
            if username != self.context["user"].username:
                # This is the other participant
                other_user = User.objects.get(username=username)
                return UserSerializer(other_user, context=context).data
