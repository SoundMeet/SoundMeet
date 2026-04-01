
// components/profile/PillInput.jsx
//
// The pill creation widget used inside the Edit Modal's "Pills" section.
// Completely self-contained — owns its own input value, focus state,
// and selected color. Calls onAdd(pill) when the user submits.
//
// Props:
//   onAdd – ({ text: string, color: string }) => void
 
import React, { useState } from "react";
 
export const PILL_SUGGESTIONS = [
  "Jazz", "Rock", "Hip-hop", "Classical", "Lo-fi", "Soul", "R&B", "Funk",
  "Guitar", "Bass", "Drums", "Piano", "Vocals", "Producer", "DJ", "Songwriter",
];
 
export const PILL_COLORS = [
  { label: "Pink",   value: "#DC2E73" },
  { label: "Purple", value: "#7C3AED" },
  { label: "Cyan",   value: "#0891B2" },
  { label: "Orange", value: "#EA580C" },
  { label: "Green",  value: "#16A34A" },
  { label: "Gold",   value: "#CA8A04" },
];
 
const MAX_PILL_CHARS = 12;
 
const PillInput = ({ onAdd }) => {
  const [value,         setValue]         = useState("");
  const [focused,       setFocused]       = useState(false);
  const [selectedColor, setSelectedColor] = useState(PILL_COLORS[0].value);
 
  // Filter suggestions to those matching the current input.
  // Only show when the user has typed something — no suggestions on empty.
  const suggestions = PILL_SUGGESTIONS.filter(
    (s) => s.toLowerCase().includes(value.toLowerCase()) && value.length > 0
  ).slice(0, 5);
 
  const submit = (val) => {
    const trimmed = val.trim().slice(0, MAX_PILL_CHARS);
    if (!trimmed) return;
    onAdd({ text: trimmed, color: selectedColor });
    setValue("");
  };
 
  return (
    <div className="relative space-y-3">
 
      {/* Color picker + live preview */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-500 shrink-0">Color</span>
        <div className="flex gap-1.5">
          {PILL_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedColor(c.value)}
              title={c.label}
              className="w-5 h-5 rounded-full transition-all duration-150"
              style={{
                backgroundColor: c.value,
                // Ring highlight on the selected color using outline + offset
                outline: selectedColor === c.value
                  ? `2px solid ${c.value}`
                  : "2px solid transparent",
                outlineOffset: "2px",
              }}
            />
          ))}
        </div>
 
        {/* Live preview pill — only shown while typing */}
        {value && (
          <span
            className="ml-2 rounded-full px-3 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: selectedColor + "33",
              border: `1px solid ${selectedColor}88`,
              color: "#fff",
            }}
          >
            {value}
          </span>
        )}
      </div>
 
      {/* Text input + Add button */}
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_PILL_CHARS))}
          onFocus={() => setFocused(true)}
          // Delay blur so onMouseDown on a suggestion fires before focus is lost
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); submit(value); }
          }}
          placeholder="Type a genre, instrument, role..."
          className="flex-1 rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none border border-transparent focus:border-[#DC2E73]/50"
        />
        <button
          onClick={() => submit(value)}
          className="rounded-lg bg-[#DC2E73] px-4 py-2 text-sm text-white hover:bg-pink-500 transition"
        >
          Add
        </button>
      </div>
 
      {/* Character counter */}
      {value.length > 0 && (
        <p className="text-right text-xs text-neutral-500">
          {value.length}/{MAX_PILL_CHARS}
        </p>
      )}
 
      {/* Autocomplete dropdown — absolute so it doesn't push layout */}
      {focused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-full rounded-xl bg-neutral-800 border border-white/10 overflow-hidden z-10">
          {suggestions.map((s) => (
            <button
              key={s}
              onMouseDown={() => submit(s)}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
 
export default PillInput;