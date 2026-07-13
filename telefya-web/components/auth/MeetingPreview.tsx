import { MessageSquare, Mic, PhoneOff, Video } from "lucide-react";

const tiles = [
  { name: "You", active: true },
  { name: "A. Ibrahim", active: false },
  { name: "C. Okoye", active: false },
  { name: "R. Bello", active: false },
];

export function MeetingPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xs" aria-hidden="true">
      <div className="absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-telefya-blue/30 via-telefya-violet/20 to-transparent blur-2xl" />

      <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Live
          </span>
          <span className="text-xs font-bold text-white/50">4 in call</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {tiles.map((tile) => (
            <div
              key={tile.name}
              className={`relative flex aspect-video items-end overflow-hidden rounded-xl bg-white/[0.08] p-2 ${
                tile.active ? "ring-2 ring-telefya-blue" : ""
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-telefya-blue text-[10px] font-black text-white">
                  {tile.name.charAt(0)}
                </span>
                <span className="text-[10px] font-bold text-white/80">{tile.name}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-3 border-t border-white/10 pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
            <Mic size={16} />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
            <Video size={16} />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
            <MessageSquare size={16} />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white">
            <PhoneOff size={16} />
          </span>
        </div>
      </div>
    </div>
  );
}