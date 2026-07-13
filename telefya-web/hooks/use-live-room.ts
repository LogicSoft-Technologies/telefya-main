"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSavedUser } from "@/lib/auth/session";
import { getAccessToken } from "@/lib/auth/tokens";
import {
  joinRoom,
  leaveRoom,
  muteAll,
  raiseHand,
  stopScreenShare,
} from "@/lib/api/streams";
import type { JoinRoomResponse } from "@/types/stream";

export function useLiveRoom(roomId: string) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [joined, setJoined] = useState(false);
  const [roomInfo, setRoomInfo] = useState<JoinRoomResponse | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = getSavedUser();
  const token = getAccessToken();

  const userId = user?.id ?? user?.email ?? "guest-user";
  const userName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "Guest";

  const attachStream = useCallback((stream: MediaStream | null) => {
    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, []);

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    attachStream(stream);
    setCameraOn(true);
    setMicOn(true);
  }

  function toggleCamera() {
    const stream = localStreamRef.current;

    if (!stream) {
      startCamera().catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to start camera.")
      );
      return;
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setCameraOn(videoTrack.enabled);
  }

  function toggleMic() {
    const stream = localStreamRef.current;

    if (!stream) {
      startCamera().catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to start microphone.")
      );
      return;
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  }

  async function join() {
    setLoading(true);
    setError("");

    try {
      const response = await joinRoom(
        {
          roomId,
          userId,
          userName,
        },
        token
      );

      setRoomInfo(response);
      setJoined(true);

      await startCamera();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to join room.");
    } finally {
      setLoading(false);
    }
  }

  async function leave() {
    try {
      await leaveRoom({ roomId, userId }, token);
    } finally {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      attachStream(null);
      setJoined(false);
      setCameraOn(false);
      setMicOn(false);
    }
  }

  async function toggleHand() {
    const next = !handRaised;
    setHandRaised(next);
    await raiseHand({ userId, handup: next }, token);
  }

  async function toggleMuteAll() {
    await muteAll({ roomId, userId, mute: true }, token);
  }

  async function shareScreen() {
    setError("");

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      attachStream(screenStream);
      setScreenSharing(true);

      const [track] = screenStream.getVideoTracks();

      track.onended = async () => {
        setScreenSharing(false);
        await stopScreenShare({ userId, screenProducerIds: [] }, token);
        await startCamera();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to share screen.");
    }
  }

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return {
    userName,
    joined,
    roomInfo,
    localVideoRef,
    cameraOn,
    micOn,
    handRaised,
    screenSharing,
    loading,
    error,
    join,
    leave,
    toggleCamera,
    toggleMic,
    toggleHand,
    toggleMuteAll,
    shareScreen,
  };
}