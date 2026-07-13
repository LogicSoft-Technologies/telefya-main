export type RoomUser = {
  id: string;
  userId?: string;
  userName: string;
  micStatus: boolean;
  videoStatus: boolean;
  isPresenter: boolean;
  screenSharingStatus: boolean;
  presenterControlAudio: boolean;
  presenterControlVideo: boolean;
  room: string;
};

export type RoomUsersPayload = {
  roomUsers: RoomUser[];
  currentUserId: string;
  isPresenter: boolean;
};

export type LiveChatMessage = {
  roomId: string;
  message: string;
  time: string;
  userName: string;
  userId: string;
  messageId: string;
};