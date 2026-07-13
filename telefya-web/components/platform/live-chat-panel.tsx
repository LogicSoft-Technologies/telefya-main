"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Message = {
  messageId: string;
  message: string;
  time: string;
  userName: string;
};

export function LiveChatPanel({
  messages,
  onSend,
}: {
  messages: Message[];
  onSend: (message: string) => void;
}) {
  const [value, setValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim()) return;
    onSend(value);
    setValue("");
  }

  return (
    <aside className="flex min-h-[520px] flex-col border border-border bg-white">
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-bold text-navy-900">Room chat</h2>
        <p className="mt-0.5 text-xs font-semibold text-navy-400">
          Visible to all participants
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-navy-50">
              <Send size={16} className="text-navy-300" />
            </div>
            <p className="text-sm font-semibold text-navy-500">No messages yet</p>
            <p className="mt-1 text-xs text-navy-400">Send the first message.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {messages.map((msg) => (
              <div key={msg.messageId} className="rounded-md bg-navy-50 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs font-bold text-navy-900">{msg.userName}</strong>
                  <span className="text-[10px] font-semibold text-navy-300">{msg.time}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{msg.message}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a message..."
          className="h-9 min-w-0 flex-1 rounded-md border border-border bg-navy-50 px-3 text-sm font-semibold outline-none transition-colors focus:border-telefya-blue focus:bg-white"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="grid h-9 w-9 place-items-center rounded-md bg-telefya-blue text-white transition-colors hover:bg-telefya-violet disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </form>
    </aside>
  );
}