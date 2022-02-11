from channels.generic.websocket import AsyncWebsocketConsumer

class LiveConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		await self.accept()
		

	async def receive(self, text_data=None, bytes_data=None, *args, **kwargs):
		if bytes_data:
			await self.send(bytes_data=bytes_data)
		
	

