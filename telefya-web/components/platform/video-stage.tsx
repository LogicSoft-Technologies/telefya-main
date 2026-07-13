"use client";

import {
  Hand,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  ShieldCheck,
  Users,
  Video,
  VideoOff,
  VolumeX,
} from "lucide-react";
import { useState } from "react";
import { useLiveRoom } from "@/hooks/use-live-room";
import { useStreamChat } from "@/hooks/use-stream-chat";

export function VideoStage({ roomId }: { roomId: string }) {
  const room = useLiveRoom(roomId);
  const chat = useStreamChat(roomId);
  const [message, setMessage] = useState("");

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    await chat.send(message);
    setMessage("");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <section className="flex flex-col rounded-lg border border-border bg-navy-900 text-white">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
              Live Stage
            </p>
            <h1 className="mt-0.5 text-base font-bold text-white">Room: {roomId}</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-telefya-green/15 px-2.5 py-1.5 text-xs font-bold text-telefya-green">
              <ShieldCheck size={13} />
              {room.roomInfo?.isHost ? "Host" : "Participant"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.06] px-2.5 py-1.5 text-xs font-bold text-white/50">
              <Users size={13} />
              Secure
            </span>
          </div>
        </div>

        {room.error ? (
          <div className="mx-5 mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            {room.error}
          </div>
        ) : null}

        <div className="relative flex-1 overflow-hidden">
          <video
            ref={room.localVideoRef}
            autoPlay
            playsInline
            muted
            className="aspect-video w-full bg-black object-cover"
          />

          {!room.cameraOn && (
            <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_30%,rgba(100,38,255,0.15),transparent_40%),#050b1f]">
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-white/[0.06]">
                  <VideoOff size={26} className="text-white/40" />
                </div>
                <p className="mt-3 text-xs font-semibold text-white/35">Camera preview</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 px-5 py-4">
          {!room.joined ? (
            <button
              onClick={room.join}
              disabled={room.loading}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-telefya-blue px-5 text-sm font-bold text-white hover:bg-telefya-violet disabled:opacity-60"
            >
              {room.loading ? <Loader2 size={15} className="animate-spin" /> : <Video size={15} />}
              Join room
            </button>
          ) : (
            <>
              <RoomButton onClick={room.toggleMic} active={room.micOn} label={room.micOn ? "Mute" : "Unmute"}>
                {room.micOn ? <Mic size={15} /> : <MicOff size={15} />}
              </RoomButton>

              <RoomButton onClick={room.toggleCamera} active={room.cameraOn} label={room.cameraOn ? "Cam off" : "Cam on"}>
                {room.cameraOn ? <Video size={15} /> : <VideoOff size={15} />}
              </RoomButton>

              <RoomButton onClick={room.shareScreen} active={room.screenSharing} label="Share">
                <MonitorUp size={15} />
              </RoomButton>

              <RoomButton onClick={room.toggleHand} active={room.handRaised} label="Hand">
                <Hand size={15} />
              </RoomButton>

              {room.roomInfo?.isHost ? (
                <RoomButton onClick={room.toggleMuteAll} active={false} label="Mute all">
                  <VolumeX size={15} />
                </RoomButton>
              ) : null}

              <button
                onClick={room.leave}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700"
              >
                <PhoneOff size={15} />
                Leave
              </button>
            </>
          )}
        </div>
      </section>

      <aside className="flex flex-col rounded-lg border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-navy-900">Room chat</h2>
            <p className="mt-0.5 text-xs font-semibold text-navy-400">Visible to all participants</p>
          </div>
          <MessageSquare size={17} className="text-telefya-blue" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ minHeight: 300 }}>
          {chat.messages.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="text-sm font-bold text-navy-500">No messages yet</p>
                <p className="mt-1 text-xs text-navy-400">Send the first room message.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              {chat.messages.map((item) => (
                <div key={item.messageId} className="rounded-md bg-navy-50 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-xs font-bold text-navy-900">{item.userName}</strong>
                    <span className="text-[10px] font-semibold text-navy-300">
                      {new Date(item.time).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {chat.error ? (
          <div className="mx-4 mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {chat.error}
          </div>
        ) : null}

        <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-navy-50 px-3 text-sm font-semibold outline-none transition-colors focus:border-telefya-blue focus:bg-white"
          />
          <button
            disabled={chat.sending}
            className="h-9 rounded-md bg-telefya-blue px-4 text-sm font-bold text-white hover:bg-telefya-violet disabled:opacity-50"
          >
            {chat.sending ? <Loader2 size={15} className="animate-spin" /> : "Send"}
          </button>
        </form>
      </aside>
    </div>
  );
}

function RoomButton({
  children,
  active,
  onClick,
  label,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-sm font-semibold transition-colors",
        active
          ? "bg-telefya-blue text-white"
          : "border border-white/15 bg-white/[0.06] text-white/75 hover:bg-white/[0.12]",
      ].join(" ")}
    >
      {children}
      {label}
    </button>
  );
}