export type RoomMessage = {
  roomId: string;
  message: string;
  time: string;
  userName: string;
  socketId: string;
  messageId: string;
};

export type SendMessagePayload = RoomMessage;

export type EditMessagePayload = {
  roomId: string;
  messageId: string;
  newMessage: string;
  socketId: string;
};

export type EditMessageResponse = EditMessagePayload;

export type DeleteMessagePayload = {
  roomId: string;
  messageId: string;
};

export type DeleteMessageResponse = DeleteMessagePayload;