/**
 * PrivacyToggle — Public / Private two-option toggle.
 *
 * Extracted from ShowDetailsSection so it can be reused across all forms
 * with the correct per-form accent gradient.
 *
 * Props:
 *   value         boolean          — true = private
 *   onChange      (boolean) => void
 *   gradientFrom  string           — CSS hex, gradient start
 *   gradientTo    string           — CSS hex, gradient end
 *   publicLabel   string?          — defaults to "Public"
 *   privateLabel  string?          — defaults to "Private"
 *   publicHint    string?          — hint shown when public is selected
 *   privateHint   string?          — hint shown when private is selected
 */
const PrivacyToggle = ({
  value,
  onChange,
  gradientFrom = "#DC2E73",
  gradientTo   = "#FB4040",
  publicLabel  = "Public",
  privateLabel = "Private",
  publicHint   = "Public — visible on the map. Anyone can attend.",
  privateHint  = "Private — hidden from the map. Invite-only.",
}) => {
  const opts = [
    { id: "public",  label: publicLabel  },
    { id: "private", label: privateLabel },
  ];

  return (
    <div className="space-y-2">
      <div className="flex rounded-xl p-1" style={{ background: "#1C1B1B" }}>
        {opts.map((opt) => {
          const active = (opt.id === "private") === value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id === "private")}
              className="relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200"
              style={{
                background: active
                  ? `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
                  : "transparent",
                color: active ? "#ffffff" : "rgba(229,226,225,0.3)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs ml-1" style={{ color: "rgba(229,226,225,0.28)" }}>
        {value ? privateHint : publicHint}
      </p>
    </div>
  );
};

export default PrivacyToggle;
