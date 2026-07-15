"use client";

import {
  ArrowRight,
  Download,
  Globe2,
  MessageCircle,
  Mic,
  MonitorUp,
  MoreHorizontal,
  PhoneOff,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";

const people = [
  {
    name: "James",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=85",
  },
  {
    name: "Tina",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=85",
  },
  {
    name: "Lily",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=85",
  },
  {
    name: "Mark",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=85",
  },
];

const controls = [MessageCircle, Mic, Video, MonitorUp, Users, MoreHorizontal];

const rotatingLabels = [
  "Secure Video Meetings",
  "Live Events Platform",
  "No Downloads Required",
];

export function HeroSection() {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLabelIndex((current) => (current + 1) % rotatingLabels.length);
    }, 2600);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-white pt-8 sm:pt-12">
      <div className="absolute right-0 top-16 hidden h-[580px] w-[580px] rounded-full bg-[conic-gradient(from_210deg,#0f6bff,#6426ff,#8b22ff,#0f6bff)] opacity-[0.13] blur-3xl lg:block" />
      <div className="absolute right-10 top-28 hidden h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.9),rgba(100,38,255,0.30)_34%,rgba(15,107,255,0.36)_68%,transparent_72%)] lg:block" />

      <div className="relative mx-auto grid max-w-[92rem] items-center gap-10 px-4 pb-12 sm:gap-12 sm:px-5 sm:pb-16 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <div>
          <div className="inline-flex min-w-[150px] items-center justify-center rounded-md border border-blue-100 bg-blue-50 px-3 py-3.5 text-xs font-bold text-telefya-blue sm:min-w-[180px] sm:px-3.5 sm:py-5 sm:text-sm">
            <span key={rotatingLabels[labelIndex]} className="animate-[fadeSlide_0.4s_ease-out] text-center">
              {rotatingLabels[labelIndex]}
            </span>
          </div>

          <h1 className="mt-6 max-w-2xl text-[40px] font-black leading-[1.05] tracking-tight text-navy-900 sm:mt-8 sm:text-5xl sm:leading-[1.02] md:text-[58px]">
            One App. <br />
            <span className="sm:whitespace-nowrap">
              All <span className="telefya-text-gradient">Connections.</span>
            </span>
          </h1>

          <p className="mt-4 max-w-lg text-base leading-7 text-navy-500 sm:mt-5 sm:text-lg sm:leading-8">
            Telefya brings secure, high-quality video meetings, chat and collaboration to teams, customers and communities anytime, anywhere.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-telefya-violet px-6 py-3.5 text-sm font-bold text-white hover:bg-telefya-blue sm:py-3"
            >
              Start for free <ArrowRight size={15} />
            </a>

            <a
              href="/contact-sales"
              className="inline-flex items-center justify-center rounded-md border border-border bg-white px-6 py-3.5 text-sm font-bold text-navy-900 hover:border-telefya-blue hover:text-telefya-blue sm:py-3"
            >
              Book a demo
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-navy-400 sm:mt-8 sm:gap-6 sm:text-sm">
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-telefya-blue" />
              Secure & Encrypted
            </span>
            <span className="flex items-center gap-2">
              <Download size={15} className="text-telefya-blue" />
              No Downloads
            </span>
            <span className="flex items-center gap-2">
              <Globe2 size={15} className="text-telefya-blue" />
              Works Everywhere
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="relative z-10 overflow-hidden rounded-lg bg-navy-900 shadow-enterprise">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-4 text-white sm:px-4 sm:py-5">
              <strong className="flex items-center gap-2 text-sm">
                <span className="grid h-6 w-6 place-items-center rounded-md telefya-gradient text-xs font-black">
                  T
                </span>
                Telefya
              </strong>

              <div className="flex items-center gap-3 text-xs font-bold sm:gap-4">
                <span className="flex items-center gap-1.5 text-telefya-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-telefya-green" />
                  Secure
                </span>
                <Users size={14} className="text-white/40" />
                <MonitorUp size={14} className="text-white/40" />
                <Globe2 size={14} className="text-white/40" />
              </div>
            </div>

            <div className="grid gap-2 p-2.5 sm:p-3 lg:grid-cols-[1fr_210px]">
              <div className="grid grid-cols-2 gap-2">
                {people.map((person) => (
                  <div
                    key={person.name}
                    className="relative h-32 overflow-hidden rounded-md bg-navy-700 sm:h-40 lg:h-[172px]"
                  >
                    <img
                      src={person.image}
                      alt={`${person.name} on Telefya`}
                      className="h-full w-full object-cover"
                      loading="eager"
                    />
                    <span className="absolute bottom-2 left-2 rounded-md bg-navy-900/75 px-2 py-0.5 text-[11px] font-bold text-white sm:bottom-2.5 sm:left-2.5 sm:px-2.5 sm:py-1 sm:text-xs">
                      {person.name}
                    </span>
                  </div>
                ))}
              </div>

              <aside className="flex flex-col rounded-md bg-white/[0.05] p-3.5 text-white sm:p-4">
                <div className="mb-3.5 flex items-center justify-between border-b border-white/[0.07] pb-3 sm:mb-4">
                  <strong className="text-sm font-bold">Chat</strong>
                  <span className="rounded-md bg-white/[0.07] px-2 py-0.5 text-[10px] font-bold text-white/40">
                    Room
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3">
                  {[
                    ["Tina", "Thanks everyone!"],
                    ["James", "Great discussion today."],
                    ["Lily", "Let's sync again tomorrow."],
                  ].map(([name, text]) => (
                    <div key={name}>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/45">
                        {name}
                      </p>
                      <p className="rounded-md bg-white/[0.07] px-3 py-2 text-xs leading-[1.6] text-white/75">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.05] px-3 py-2">
                  <span className="flex-1 text-xs text-white/30">Message…</span>
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-telefya-violet text-white">
                    <ArrowRight size={12} />
                  </span>
                </div>
              </aside>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-white/[0.06] px-3 py-4 sm:gap-2 sm:px-4 sm:py-5">
              {controls.map((Icon, index) => (
                <button
                  key={index}
                  className="grid h-9 w-9 place-items-center rounded-md bg-white/[0.06] text-white/65 hover:bg-white/[0.12] sm:h-10 sm:w-10"
                >
                  <Icon size={16} className="sm:hidden" />
                  <Icon size={17} className="hidden sm:block" />
                </button>
              ))}
              <button className="grid h-9 w-9 place-items-center rounded-md bg-red-600 text-white hover:bg-red-700 sm:h-10 sm:w-10">
                <PhoneOff size={16} className="sm:hidden" />
                <PhoneOff size={17} className="hidden sm:block" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}