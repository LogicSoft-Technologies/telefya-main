"use client";

import {
  Mic,
  MicOff,
  MonitorUp,
  UserRound,
  Video,
  VideoOff,
} from "lucide-react";
import { useEffect, useRef } from "react";

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

type LiveVideoTileProps = {
  stream: MediaStream | null;
  name: string;
  muted?: boolean;
  cameraOn?: boolean;
  micOn?: boolean;
  isScreen?: boolean;
  large?: boolean;
  compact?: boolean;
  /** When true, suppresses the built-in name/icon overlay so a parent
   * component can render its own minimal label instead (used for floating
   * self-view pips). */
  hideOverlay?: boolean;
};

export function LiveVideoTile({
  stream,
  name,
  muted = false,
  cameraOn = true,
  micOn = true,
  isScreen = false,
  large = false,
  compact = false,
  hideOverlay = false,
}: LiveVideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.srcObject = stream;

    return () => {
      if (video.srcObject === stream) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  const showVideo = Boolean(stream && cameraOn);

  return (
    <article
      className={[
        "relative h-full w-full overflow-hidden bg-[#071633]",
        compact
          ? "rounded-lg border border-white/10"
          : "rounded-xl border border-white/10 shadow-soft",
        large ? "min-h-0" : "",
      ].join(" ")}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="absolute inset-0 h-full w-full bg-black object-cover"
        />
      ) : (
        <div className="grid h-full min-h-[120px] place-items-center bg-[#071633]">
          <div className="grid place-items-center text-center">
            <div
              className={[
                "grid place-items-center rounded-full bg-white/10 text-white",
                compact
                  ? "h-10 w-10"
                  : large
                    ? "h-24 w-24"
                    : "h-20 w-20",
              ].join(" ")}
            >
              <UserRound
                size={compact ? 18 : large ? 38 : 34}
              />
            </div>

            {!compact && !hideOverlay ? (
              <span className="mt-3 text-xs font-bold text-white/55">
                {cameraOn ? "Connecting video" : "Camera off"}
              </span>
            ) : null}
          </div>
        </div>
      )}

      {!hideOverlay ? (
        <div
          className={[
            "absolute z-20 flex items-center rounded-full bg-black/55 text-white backdrop-blur-md",
            compact
              ? "left-1.5 top-1.5 h-6 min-w-6 justify-center px-1.5 text-[10px]"
              : "left-3 top-3 gap-2 px-3 py-2 text-xs font-black",
          ].join(" ")}
          title={compact ? name : undefined}
        >
          {compact ? (
            getInitials(name)
          ) : (
            <>
              {isScreen ? <MonitorUp size={15} /> : <Video size={15} />}

              <span className="max-w-[220px] truncate">
                {isScreen ? "Screen" : name}
              </span>
            </>
          )}
        </div>
      ) : null}

      {!compact && !hideOverlay ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent" />

          <div className="absolute bottom-3 right-3 z-20 flex gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-black/50 text-white backdrop-blur">
              {micOn ? <Mic size={15} /> : <MicOff size={15} />}
            </span>

            <span className="grid h-8 w-8 place-items-center rounded-lg bg-black/50 text-white backdrop-blur">
              {cameraOn ? (
                <Video size={15} />
              ) : (
                <VideoOff size={15} />
              )}
            </span>
          </div>
        </>
      ) : null}
    </article>
  );
}