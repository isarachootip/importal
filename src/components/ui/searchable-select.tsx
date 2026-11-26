"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type SelectOptionItem = string | [string | number, string];

function normalizeOptions(options: readonly SelectOptionItem[], allLabel?: string): Array<{ value: string; label: string }> {
  const base = options.map((opt) =>
    Array.isArray(opt) ? { value: String(opt[0]), label: opt[1] } : { value: String(opt), label: String(opt) }
  );
  return allLabel ? [{ value: "", label: allLabel }, ...base] : base;
}

function renderHighlighted(text: string, query: string): React.ReactNode {
  const q = query.trim().toLowerCase();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <b>{text.slice(idx, idx + q.length)}</b>
      {text.slice(idx + q.length)}
    </>
  );
}

export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  allLabel,
  ariaLabel,
  style,
}: {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  options: readonly SelectOptionItem[];
  allLabel?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
}) {
  const normalized = useMemo(() => normalizeOptions(options, allLabel), [options, allLabel]);
  const currentLabel = useMemo(
    () => normalized.find((o) => o.value === String(value))?.label ?? normalized[0]?.label ?? "",
    [normalized, value]
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(currentLabel);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery(currentLabel);
    }
  }, [currentLabel, open]);

  const filtered = useMemo(() => {
    if (!open) return normalized;
    const raw = query === currentLabel ? "" : query.trim().toLowerCase();
    if (!raw) return normalized;
    const tokens = raw.split(/\s+/).filter(Boolean);
    return normalized.filter((o) => {
      const lower = o.label.toLowerCase();
      return tokens.every((tk) => lower.includes(tk));
    });
  }, [normalized, open, query, currentLabel]);

  if (normalized.length < 4) {
    return (
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        style={style}
        onChange={(e) => onChange(e.target.value)}
      >
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  const pickOption = (opt: { value: string; label: string } | undefined) => {
    if (!opt) return;
    setOpen(false);
    setQuery(opt.label);
    if (String(value) !== opt.value) {
      onChange(opt.value);
    }
  };

  return (
    <div className="ss-wrap" style={style}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        className="ss-in"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-label={ariaLabel ?? "พิมพ์เพื่อค้นหา"}
        placeholder="พิมพ์เพื่อค้นหา…"
        value={query}
        onFocus={(e) => {
          e.currentTarget.select();
          const curIdx = Math.max(0, normalized.findIndex((o) => o.value === String(value)));
          setActiveIdx(curIdx);
          setOpen(true);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIdx(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
            e.preventDefault();
            setOpen(true);
            return;
          }
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!filtered.length) return;
            const next = (activeIdx + (e.key === "ArrowDown" ? 1 : -1) + filtered.length) % filtered.length;
            setActiveIdx(next);
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[activeIdx]) pickOption(filtered[activeIdx]);
            else {
              setOpen(false);
              setQuery(currentLabel);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
            setQuery(currentLabel);
            inputRef.current?.blur();
          } else if (e.key === "Tab") {
            if (open && query.trim() && query !== currentLabel && filtered[activeIdx]) {
              pickOption(filtered[activeIdx]);
            } else {
              setOpen(false);
            }
          }
        }}
        onBlur={() => {
          setTimeout(() => {
            setOpen(false);
            setQuery(currentLabel);
          }, 130);
        }}
      />
      {open && (
        <div ref={listRef} className="ss-list" role="listbox">
          {filtered.length > 0 ? (
            filtered.map((opt, i) => (
              <div
                key={`${opt.value}-${i}`}
                role="option"
                aria-selected={opt.value === String(value)}
                className={`ss-opt${i === activeIdx ? " act" : ""}${opt.value === String(value) ? " sel" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickOption(opt);
                }}
              >
                {renderHighlighted(opt.label, query === currentLabel ? "" : query)}
              </div>
            ))
          ) : (
            <div className="ss-none">ไม่พบรายการที่ตรงกัน</div>
          )}
        </div>
      )}
    </div>
  );
}
