import { useState, useRef, useEffect } from "react";
import { PLATFORMS } from "./onboardingConfig";

export default function MusicLinksStep({ links, onChange, onRemove }) {
  const [activePlatform, setActivePlatform] = useState("");
  const [urlInput, setUrlInput]             = useState("");
  const urlRef                              = useRef(null);

  const addedKeys        = Object.keys(links).filter(k => links[k]);
  const availablePlatforms = PLATFORMS.filter(p => !links[p.key]);
  const currentPlatform  = PLATFORMS.find(p => p.key === activePlatform);

  // Auto-focus URL field when a platform is selected
  useEffect(() => {
    if (activePlatform) {
      // Small delay so the animation has started
      const t = setTimeout(() => urlRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [activePlatform]);

  const selectPlatform = (key) => {
    setActivePlatform(prev => prev === key ? "" : key);
    setUrlInput("");
  };

  const handleAdd = () => {
    if (!activePlatform || !urlInput.trim()) return;
    onChange(activePlatform, urlInput.trim());
    setActivePlatform("");
    setUrlInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
  };

  return (
    <div>
      <h2 className="ob-headline">Share your sound.</h2>
      <p className="ob-sub">Add links so others can hear you. All optional.</p>

      {/* Added links list */}
      {addedKeys.length > 0 && (
        <div className="ob-links-list">
          {addedKeys.map(key => {
            const p = PLATFORMS.find(pl => pl.key === key);
            if (!p) return null;
            return (
              <div key={key} className="ob-link-item">
                <span className="ob-link-icon"><p.Icon /></span>
                <span className="ob-link-platform">{p.label}</span>
                <span className="ob-link-url">{links[key]}</span>
                <button
                  type="button"
                  className="ob-link-remove"
                  onClick={() => onRemove(key)}
                  aria-label={`Remove ${p.label}`}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Platform picker */}
      {availablePlatforms.length > 0 && (
        <div className="ob-platform-grid" role="group" aria-label="Choose a platform">
          {availablePlatforms.map(p => (
            <button
              key={p.key}
              type="button"
              className={`ob-platform-chip${activePlatform === p.key ? " active" : ""}`}
              onClick={() => selectPlatform(p.key)}
              aria-pressed={activePlatform === p.key}
            >
              <p.Icon />
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* URL input — shown only when a platform is active */}
      {activePlatform && (
        <div className="ob-url-row">
          <input
            ref={urlRef}
            className="ob-url-input"
            type="url"
            inputMode="url"
            placeholder={currentPlatform?.placeholder ?? "Paste your link…"}
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="ob-url-add"
            onClick={handleAdd}
            disabled={!urlInput.trim()}
          >
            Add
          </button>
        </div>
      )}

      {/* Empty state */}
      {addedKeys.length === 0 && !activePlatform && (
        <p className="ob-links-empty">Pick a platform above to add your first link.</p>
      )}
    </div>
  );
}
