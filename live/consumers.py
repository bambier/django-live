from channels.generic.websocket import AsyncWebsocketConsumer

class LiveConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		await self.accept()
		

	async def receive(self, text_data=None, bytes_data=None, *args, **kwargs):
		if bytes_data:
			await self.send(bytes_data=bytes_data)
		
	

import json
from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
	def __init__(self, *args, **kwargs):
		self.x = 0
		super().__init__(*args, **kwargs)


	async def connect(self):
		self.room_group_name = 'live'

		await self.channel_layer.group_add(self.room_group_name, self.channel_name)
		await self.accept()

	async def disconnect(self, code):
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
		
		return await super().disconnect(code)



	async def receive(self, text_data=None, bytes_data=None):
		recieved_dict = json.loads(text_data)
		message = recieved_dict['message']
		action = recieved_dict['message']


		if (action == 'new-offer') or (action == 'new-answer'):
			receiver_channel_name = recieved_dict['message']['receiver_channel_name']
			recieved_dict['message']['receiver_channel_name'] = self.channel_name
			await self.channel_layer.send(
						receiver_channel_name,
						{
							'type': 'send.sdp', 
							'recieved_dict': recieved_dict
						}
					)

			return

		recieved_dict['message']['receiver_channel_name'] = self.channel_name


		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'send.sdp', 
				'recieved_dict': recieved_dict
			}
		)
	


	async def send_sdp(self, event):
		recieved_dict = event['recieved_dict']

		await self.send(text_data=json.dumps(recieved_dict))
