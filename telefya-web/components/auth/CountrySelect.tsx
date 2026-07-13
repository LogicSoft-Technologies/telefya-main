"use client";

import "flag-icons/css/flag-icons.min.css";
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { countries, type Country } from "@/lib/data/countries";

function useCountryFilter(query: string) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(q) ||
        country.dial.includes(q) ||
        country.iso2.toLowerCase().includes(q),
    );
  }, [query]);
}

function useOutsideClose(open: boolean, setOpen: (value: boolean) => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, setOpen]);

  return ref;
}

type PhoneCountrySelectProps = {
  value: string;
  onChange: (dial: string, iso2: string) => void;
};

export function PhoneCountrySelect({ value, onChange }: PhoneCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useOutsideClose(open, setOpen);
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = useCountryFilter(query);

  const selected: Country =
    countries.find((country) => country.dial === value) ??
    countries.find((country) => country.iso2 === "NG")!;

  useEffect(() => {
    if (open) searchRef.current?.focus();
    else setQuery("");
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-12 items-center gap-2 rounded-xl border border-border bg-white pl-3 pr-2.5 shadow-soft transition-colors hover:border-navy-300 focus:outline-none focus-visible:border-telefya-blue"
      >
        <span className={`fi fi-${selected.iso2.toLowerCase()} rounded-[3px] text-base`} />
        <span className="text-sm font-semibold text-navy-900">{selected.dial}</span>
        <ChevronDown size={16} className="text-navy-300" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-72 overflow-hidden rounded-xl border border-border bg-white shadow-enterprise">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search size={16} className="text-navy-300" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country or code"
              className="w-full bg-transparent text-sm font-semibold text-navy-900 outline-none placeholder:text-navy-300"
            />
          </div>

          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm font-semibold text-navy-400">
                No matches found
              </li>
            ) : (
              filtered.map((country) => (
                <li key={country.iso2}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={country.iso2 === selected.iso2}
                    onClick={() => {
                      onChange(country.dial, country.iso2);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-blue-50 ${
                      country.iso2 === selected.iso2 ? "bg-blue-50" : ""
                    }`}
                  >
                    <span className={`fi fi-${country.iso2.toLowerCase()} shrink-0 rounded-[3px] text-base`} />
                    <span className="flex-1 truncate text-sm font-semibold text-navy-900">
                      {country.name}
                    </span>
                    <span className="text-sm font-bold text-navy-400">{country.dial}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

type CountrySelectProps = {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
};

export function CountrySelect({ value, onChange, placeholder = "Select your country" }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useOutsideClose(open, setOpen);
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = useCountryFilter(query);

  const selected = countries.find((country) => country.name === value);

  useEffect(() => {
    if (open) searchRef.current?.focus();
    else setQuery("");
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-12 w-full items-center gap-3 rounded-xl border border-border bg-white px-4 shadow-soft transition-colors hover:border-navy-300 focus:outline-none focus-visible:border-telefya-blue"
      >
        {selected ? (
          <span className={`fi fi-${selected.iso2.toLowerCase()} shrink-0 rounded-[3px] text-base`} />
        ) : (
          <span className="h-4 w-5 shrink-0 rounded-[3px] border border-border bg-blue-50" />
        )}
        <span className={`flex-1 truncate text-left text-sm font-semibold ${selected ? "text-navy-900" : "text-navy-300"}`}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown size={16} className="shrink-0 text-navy-300" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-full overflow-hidden rounded-xl border border-border bg-white shadow-enterprise">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search size={16} className="text-navy-300" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country"
              className="w-full bg-transparent text-sm font-semibold text-navy-900 outline-none placeholder:text-navy-300"
            />
          </div>

          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm font-semibold text-navy-400">
                No matches found
              </li>
            ) : (
              filtered.map((country) => (
                <li key={country.iso2}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={country.name === value}
                    onClick={() => {
                      onChange(country.name);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-blue-50 ${
                      country.name === value ? "bg-blue-50" : ""
                    }`}
                  >
                    <span className={`fi fi-${country.iso2.toLowerCase()} shrink-0 rounded-[3px] text-base`} />
                    <span className="flex-1 truncate text-sm font-semibold text-navy-900">{country.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}