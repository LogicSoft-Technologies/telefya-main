export type JsonObject = Record<string, unknown>;

export type JoinRoomPayload = {
  roomId: string;
  userId: string;
  userName: string;
};

export type JoinRoomResponse = {
  success: boolean;
  rtpCapabilities: JsonObject;
  isHost: boolean;
};

export type CreateTransportPayload = {
  direction: "send" | "recv";
};

export type CreateTransportResponse = {
  transportParams: JsonObject;
  direction: string;
};

export type ConnectTransportPayload = {
  transportId: string;
  dtlsParameters: JsonObject;
};

export type ProducePayload = {
  transportId: string;
  kind: "audio" | "video";
  rtpParameters: JsonObject;
  appData: JsonObject;
};

export type ConsumePayload = {
  transportId: string;
  producerId: string;
  rtpCapabilities: JsonObject;
  appData: JsonObject;
};

export type LeaveRoomPayload = {
  roomId: string;
  userId: string;
};

export type ResumeConsumePayload = {
  consumerId: string;
  userId: string;
};

export type ResumeConsumeResponse = {
  consumerId: string;
};

export type MuteAllPayload = {
  roomId: string;
  userId: string;
  mute: boolean;
};

export type RaiseHandPayload = {
  userId: string;
  handup: boolean;
};

export type StopScreenShareConsumerPayload = {
  userId: string;
};

export type StopScreenSharePayload = {
  userId: string;
  screenProducerIds: string[];
};

export type StopScreenShareResponse = {
  userId: string;
  message: string;
};

export type DisconnectResponse = {
  userId: string;
  message: string;
};

export type SaveRtpCapabilitiesPayload = {
  rtpCapabilities: JsonObject;
};