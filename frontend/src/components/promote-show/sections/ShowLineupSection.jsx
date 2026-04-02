import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { hexToRgba } from "../../../utils/discovery";

// ─── Role presets ─────────────────────────────────────────────────────────────

const ROLE_PRESETS = ["Headliner", "Opening Act", "DJ Set", "Live Band", "Guest"];

// ─── LineupPill ───────────────────────────────────────────────────────────────

const LineupPill = ({ act, accent, onRemove }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.15 }}
    className="inline-flex items-center gap-2 h-8 pl-3 pr-2 rounded-xl text-[12px] font-medium"
    style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.09)",
      color: "rgba(229,226,225,0.85)",
    }}
  >
    <span>{act.name}</span>
    {act.role && (
      <span
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: accent }}
      >
        {act.role}
      </span>
    )}
    <button
      type="button"
      onClick={() => onRemove(act.id)}
      aria-label={`Remove ${act.name}`}
      className="flex items-center justify-center w-4 h-4 rounded-full transition-colors duration-150"
      style={{ color: "rgba(229,226,225,0.35)" }}
    >
      <svg width="8" height="8" viewBox="0 0 14 14" fill="none">
        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  </motion.div>
);

// ─── AddActForm ───────────────────────────────────────────────────────────────

const AddActForm = ({ accent, gradientFrom, gradientTo, onAdd, onCancel }) => {
  const [name,        setName]        = useState("");
  const [role,        setRole]        = useState("");
  const [customRole,  setCustomRole]  = useState("");
  const [showCustom,  setShowCustom]  = useState(false);

  const effectiveRole = showCustom ? customRole.trim() : role;

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, role: effectiveRole || "" });
    setName(""); setRole(""); setCustomRole(""); setShowCustom(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
    if (e.key === "Escape") onCancel();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
      className="space-y-3 p-3 rounded-xl"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Name input */}
      <input
        type="text"
        className="jam-input w-full"
        placeholder="Artist or band name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        maxLength={80}
      />

      {/* Role pills */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: "rgba(229,226,225,0.3)" }}>
          Role (optional)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ROLE_PRESETS.map((r) => {
            const active = !showCustom && role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(active ? "" : r); setShowCustom(false); }}
                className="h-6 px-2.5 rounded-full text-[11px] font-medium transition-all duration-150"
                style={{
                  background: active ? hexToRgba(accent, 0.18) : "rgba(255,255,255,0.06)",
                  color:      active ? accent : "rgba(229,226,225,0.45)",
                  border:     `1px solid ${active ? hexToRgba(accent, 0.4) : "transparent"}`,
                }}
              >
                {r}
              </button>
            );
          })}
          {/* Other / custom */}
          <button
            type="button"
            onClick={() => { setShowCustom((v) => !v); setRole(""); }}
            className="h-6 px-2.5 rounded-full text-[11px] font-medium transition-all duration-150"
            style={{
              background: showCustom ? hexToRgba(accent, 0.18) : "rgba(255,255,255,0.06)",
              color:      showCustom ? accent : "rgba(229,226,225,0.45)",
              border:     `1px solid ${showCustom ? hexToRgba(accent, 0.4) : "transparent"}`,
            }}
          >
            Other…
          </button>
        </div>
        {showCustom && (
          <input
            type="text"
            className="jam-input w-full"
            placeholder="e.g. Special Guest, Surprise Act…"
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={40}
            autoFocus
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!name.trim()}
          className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-white transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        >
          Add Act
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-[12px] font-medium transition-colors duration-150"
          style={{ color: "rgba(229,226,225,0.35)", background: "rgba(255,255,255,0.04)" }}
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
};

// ─── ShowLineupSection ────────────────────────────────────────────────────────

/**
 * ShowLineupSection — add / remove artists or bands performing at the show.
 *
 * Props:
 *   lineup        { id: string, name: string, role: string }[]
 *   onChange      (lineup) => void
 *   accent        string  — hex
 *   gradientFrom  string  — hex
 *   gradientTo    string  — hex
 *
 * Backend guide:
 *   Store lineup as a JSONField / jsonb column on the Show model:
 *     lineup: [{ name: string, role: string | null }]
 *   Or as a separate ShowLineupAct FK table if you need to filter/query by performer.
 *   The id field is a frontend-only stable React key — strip it before sending to the API.
 */
const ShowLineupSection = ({ lineup = [], onChange, accent, gradientFrom, gradientTo }) => {
  const [adding, setAdding] = useState(false);

  const handleAdd = (act) => {
    onChange([...lineup, { ...act, id: crypto.randomUUID() }]);
    setAdding(false);
  };

  const handleRemove = (id) => {
    onChange(lineup.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-2.5">
      <p
        className="text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        Lineup
      </p>

      {/* Existing acts */}
      <AnimatePresence initial={false}>
        {lineup.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 overflow-hidden"
          >
            {lineup.map((act) => (
              <LineupPill
                key={act.id}
                act={act}
                accent={accent}
                onRemove={handleRemove}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add act form / button */}
      <AnimatePresence mode="wait">
        {adding ? (
          <AddActForm
            key="add-form"
            accent={accent}
            gradientFrom={gradientFrom}
            gradientTo={gradientTo}
            onAdd={handleAdd}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <motion.button
            key="add-btn"
            type="button"
            onClick={() => setAdding(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex items-center gap-2 h-8 px-3 rounded-xl text-[12px] font-medium transition-all duration-150"
            style={{
              border: `1.5px dashed ${hexToRgba(accent, 0.3)}`,
              color: hexToRgba(accent, 0.7),
              background: hexToRgba(accent, 0.04),
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add an act
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShowLineupSection;
