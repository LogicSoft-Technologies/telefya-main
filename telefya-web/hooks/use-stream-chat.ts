"use client";

import { useState } from "react";
import { deleteRoomMessage, editRoomMessage, sendRoomMessage } from "@/lib/api/chat";
import { getSavedUser } from "@/lib/auth/session";
import { getAccessToken } from "@/lib/auth/tokens";
import type { RoomMessage } from "@/types/chat";

export function useStreamChat(roomId: string) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const user = getSavedUser();
  const token = getAccessToken();

  const userName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "Guest";

  async function send(message: string) {
    if (!message.trim()) return;

    setSending(true);
    setError("");

    const payload: RoomMessage = {
      roomId,
      message,
      time: new Date().toISOString(),
      userName,
      socketId: "http-client",
      messageId: crypto.randomUUID(),
    };

    try {
      const response = await sendRoomMessage(payload, token);
      setMessages((current) => [...current, response]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  async function edit(messageId: string, newMessage: string) {
    await editRoomMessage(
      {
        roomId,
        messageId,
        newMessage,
        socketId: "http-client",
      },
      token
    );

    setMessages((current) =>
      current.map((item) =>
        item.messageId === messageId ? { ...item, message: newMessage } : item
      )
    );
  }

  async function remove(messageId: string) {
    await deleteRoomMessage({ roomId, messageId }, token);

    setMessages((current) =>
      current.filter((item) => item.messageId !== messageId)
    );
  }

  return {
    messages,
    sending,
    error,
    send,
    edit,
    remove,
  };
}