import { CalendarDays, Copy, ExternalLink, Trash2 } from "lucide-react";
import type { ScheduledMeeting } from "@/types/meeting";

function getRoomId(meetingUrl: string) {
  try {
    const url = new URL(meetingUrl);
    return url.searchParams.get("roomId") ?? meetingUrl;
  } catch {
    return meetingUrl;
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function EventCard({
  meeting,
  selected,
  onSelect,
  onDelete,
}: {
  meeting: ScheduledMeeting;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onDelete: () => void;
}) {
  const roomId = getRoomId(meeting.meeting_url);

  async function copyLink() {
    await navigator.clipboard.writeText(meeting.meeting_url);
  }

  return (
    <article className="rounded-2xl border border-border bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelect(event.target.checked)}
            className="h-4 w-4 accent-telefya-blue"
          />

          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-telefya-blue">
            <CalendarDays size={22} />
          </span>
        </label>

        <button
          onClick={onDelete}
          className="grid h-10 w-10 place-items-center rounded-xl text-navy-300 hover:bg-red-50 hover:text-red-600"
          title="Delete meeting"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <h3 className="mt-5 text-lg font-black text-navy-900">
        Scheduled meeting
      </h3>

      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-navy-500">
        {roomId}
      </p>

      <div className="mt-5 grid gap-2 text-sm text-navy-500">
        <p>
          <span className="font-black text-navy-900">Created:</span>{" "}
          {formatDate(meeting.created_at)}
        </p>
        <p>
          <span className="font-black text-navy-900">Timezone:</span>{" "}
          {meeting.time_zone}
        </p>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={copyLink}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-black text-navy-900 hover:border-telefya-blue hover:text-telefya-blue"
        >
          <Copy size={17} />
          Copy
        </button>

        <a
          href={meeting.meeting_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 py-3 text-sm font-black text-white hover:bg-telefya-violet"
        >
          <ExternalLink size={17} />
          Join
        </a>
      </div>
    </article>
  );
}