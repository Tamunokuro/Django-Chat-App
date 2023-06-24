from channels.generic.websocket import JsonWebsocketConsumer


class ChatConsumer(JsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_name = None

    def connect(self):
        print("Connected")
        self.room_name = "Party"
        self.accept()
        self.send_json({"type": "chat", "text": "Welcome to the chat room!"})

    def disconnect(self, code):
        print("Disconnected")
        return super().disconnect(code)
    
    def receive_json(self, content, **kwargs):
        return super().receive_json(content, **kwargs)
