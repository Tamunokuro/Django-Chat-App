from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer


class ChatConsumer(JsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_name = None

    def connect(self):
        print("Connected")
        self.room_name = "Party"
        self.accept()

        #accept connection
        async_to_sync(self.channel_layer.group_add)(
            self.room_name,
            self.channel_name
        )
        #send json message
        self.send_json({"type": "chat", "text": "Welcome to the chat room!"})

    def disconnect(self, code):
        print("Disconnected")
        return super().disconnect(code)
    
    def receive_json(self, content, **kwargs):
        message_type = content["type"]
        if message_type == "chat_message":
            async_to_sync(self.channel_layer.group_send)(
                self.room_name,
                {
                    "type": "chat_message_echo",
                    "name": content["name"],
                    "message": content["message"],
                },
            )
           
        return super().receive_json(content, **kwargs)

    def chat_message_echo(self, event):
        print(event)
        self.send_json(event)
