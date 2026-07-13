"use client";

import { Mic, MicOff, MonitorUp, UserRound, Video, VideoOff } from "lucide-react";
import { useEffect, useRef } from "react";

export function LiveVideoTile({
  stream,
  name,
  muted,
  cameraOn = true,
  micOn = true,
  isScreen = false,
}: {
  stream: MediaStream | null;
  name: string;
  muted?: boolean;
  cameraOn?: boolean;
  micOn?: boolean;
  isScreen?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <article className="relative overflow-hidden rounded-xl border border-white/10 bg-[#071633] shadow-soft">
      {stream && cameraOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="aspect-video h-full w-full bg-black object-cover"
        />
      ) : (
        <div className="grid aspect-video place-items-center bg-navy-900">
          <div className="grid h-20 w-20 place-items-center rounded-xl bg-white/10 text-white">
            <UserRound size={34} />
          </div>
        </div>
      )}

      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-black/45 px-3 py-2 text-xs font-black text-white backdrop-blur">
        {isScreen ? <MonitorUp size={15} /> : <Video size={15} />}
        {isScreen ? "Screen" : name}
      </div>

      <div className="absolute bottom-3 right-3 flex gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-black/45 text-white backdrop-blur">
          {micOn ? <Mic size={15} /> : <MicOff size={15} />}
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-black/45 text-white backdrop-blur">
          {cameraOn ? <Video size={15} /> : <VideoOff size={15} />}
        </span>
      </div>
    </article>
  );
}