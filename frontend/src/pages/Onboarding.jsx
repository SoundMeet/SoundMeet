import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../injectables/apiCalls";
import { useAuth } from "../injectables/Auth";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0d0d0f;
    --surface: #16161a;
    --border: rgba(255,255,255,0.07);
    --accent1: #ff3d6e;
    --accent3: #e91e8c;
    --text: #f0f0f0;
    --muted: #888;
    --bubble-unsel: rgba(255,255,255,0.06);
    --bubble-unsel-border: rgba(255,255,255,0.12);
  }

  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }

  .ob-root {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 24px; position: relative; overflow: hidden; background: var(--bg);
  }
  .ob-root::before {
    content: ''; position: fixed; top: -200px; left: 50%; transform: translateX(-50%);
    width: 800px; height: 500px;
    background: radial-gradient(ellipse, rgba(233,30,140,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .ob-root::after {
    content: ''; position: fixed; bottom: -200px; right: -100px;
    width: 600px; height: 400px;
    background: radial-gradient(ellipse, rgba(255,61,110,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .ob-card {
    width: 100%; max-width: 540px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 24px; padding: 40px;
    position: relative; z-index: 1;
    animation: cardIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .ob-card.wide { max-width: 900px; width: 100%; }

  .ob-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 36px; }
  .ob-logo-icon {
    width: 32px; height: 32px;
    background: linear-gradient(135deg, var(--accent3), var(--accent1));
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
  }
  .ob-logo-text { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }

  .ob-progress { display: flex; gap: 6px; margin-bottom: 36px; }
  .ob-prog-seg { height: 3px; flex: 1; border-radius: 99px; background: rgba(255,255,255,0.1); transition: background 0.4s ease; }
  .ob-prog-seg.done { background: linear-gradient(90deg, var(--accent3), var(--accent1)); }
  .ob-prog-seg.active { background: rgba(255,255,255,0.4); }

  .ob-headline { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; line-height: 1.15; margin-bottom: 8px; letter-spacing: -0.5px; }
  .ob-sub { color: var(--muted); font-size: 14px; line-height: 1.5; margin-bottom: 32px; font-weight: 300; }

  .ob-field { margin-bottom: 16px; }
  .ob-label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: var(--muted); margin-bottom: 8px; font-weight: 500; }
  .ob-input {
    width: 100%; padding: 14px 16px;
    background: rgba(255,255,255,0.04); border: 1px solid var(--border);
    border-radius: 12px; color: var(--text); font-size: 15px;
    font-family: 'DM Sans', sans-serif; outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .ob-input:focus { border-color: rgba(233,30,140,0.5); background: rgba(233,30,140,0.04); }
  .ob-input::placeholder { color: rgba(255,255,255,0.2); }

  .ob-skill-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }
  .ob-skill-chip {
    padding: 14px 16px; background: var(--bubble-unsel);
    border: 1px solid var(--bubble-unsel-border); border-radius: 12px;
    color: var(--text); font-size: 14px; font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.18s ease; text-align: left;
  }
  .ob-skill-chip:hover { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.09); }
  .ob-skill-chip.sel { background: linear-gradient(135deg, rgba(233,30,140,0.25), rgba(255,61,110,0.2)); border-color: rgba(233,30,140,0.6); color: #fff; }
  .ob-skill-emoji { font-size: 18px; margin-bottom: 4px; display: block; }
  .ob-skill-name { font-weight: 500; font-size: 14px; }
  .ob-skill-desc { font-size: 12px; color: var(--muted); margin-top: 2px; }

  .ob-btn {
    width: 100%; padding: 15px;
    background: linear-gradient(135deg, var(--accent3) 0%, var(--accent1) 100%);
    border: none; border-radius: 14px; color: #fff; font-size: 15px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s; margin-top: 8px;
  }
  .ob-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .ob-btn:active { transform: translateY(0); }
  .ob-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .ob-btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--muted); margin-top: 10px; font-size: 14px; }

  .bubble-screen { text-align: center; }
  .bubble-screen .ob-headline { font-size: 26px; }
  .bubble-screen .ob-sub { margin-bottom: 16px; }

  .ob-search-wrap { position: relative; margin-bottom: 20px; }
  .ob-search-wrap svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
  .ob-search {
    width: 100%; padding: 11px 16px 11px 42px;
    background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 12px;
    color: var(--text); font-size: 14px; font-family: 'DM Sans', sans-serif;
    outline: none; transition: border-color 0.2s;
  }
  .ob-search:focus { border-color: rgba(233,30,140,0.5); }
  .ob-search::placeholder { color: rgba(255,255,255,0.2); }

  .ob-count-bar { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 16px; }
  .ob-count-text { font-size: 13px; color: var(--muted); }
  .ob-count-dots { display: flex; gap: 6px; }
  .ob-count-dot { width: 28px; height: 3px; border-radius: 99px; background: rgba(255,255,255,0.12); transition: background 0.3s; }
  .ob-count-dot.filled { background: linear-gradient(90deg, var(--accent3), var(--accent1)); }

  .bubble-grid {
    display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
    margin-bottom: 20px; max-height: 380px; overflow-y: auto; padding: 4px;
  }
  .bubble-grid::-webkit-scrollbar { width: 4px; }
  .bubble-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

  .bubble-pill {
    padding: 10px 18px; border-radius: 99px;
    border: 1.5px solid rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.7);
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 13px;
    cursor: pointer; transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1);
    user-select: none; animation: pillIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes pillIn { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
  .bubble-pill:hover { transform: scale(1.06); border-color: rgba(255,255,255,0.3); }
  .bubble-pill.sel {
    background: linear-gradient(135deg, var(--accent3), var(--accent1));
    border-color: transparent; color: #fff; transform: scale(1.08);
    box-shadow: 0 4px 20px rgba(233,30,140,0.35);
  }

  .artist-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 14px; margin-bottom: 20px; max-height: 400px; overflow-y: auto; padding: 4px;
  }
  .artist-grid::-webkit-scrollbar { width: 4px; }
  .artist-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

  .artist-bubble { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; animation: pillIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
  .artist-img-wrap {
    width: 80px; height: 80px; border-radius: 50%; overflow: hidden;
    border: 2.5px solid rgba(255,255,255,0.1);
    transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
    background: rgba(255,255,255,0.05);
  }
  .artist-bubble:hover .artist-img-wrap { transform: scale(1.08); border-color: rgba(255,255,255,0.3); }
  .artist-bubble.sel .artist-img-wrap { border-color: var(--accent3); box-shadow: 0 0 0 3px rgba(233,30,140,0.4); transform: scale(1.1); }
  .artist-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .artist-img-placeholder {
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    font-size: 28px; background: linear-gradient(135deg, rgba(233,30,140,0.2), rgba(255,61,110,0.1));
  }
  .artist-name { font-size: 11px; font-family: 'DM Sans', sans-serif; font-weight: 500; color: rgba(255,255,255,0.7); text-align: center; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .artist-bubble.sel .artist-name { color: #fff; }

  /* ── Music links dropdown UI ── */
  .ml-added-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
  .ml-added-item {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
    border-radius: 12px; padding: 11px 14px;
  }
  .ml-added-icon { font-size: 18px; flex-shrink: 0; }
  .ml-added-name { font-size: 13px; font-weight: 600; font-family: 'Syne', sans-serif; color: rgba(255,255,255,0.7); width: 88px; flex-shrink: 0; }
  .ml-added-url { flex: 1; font-size: 12px; color: rgba(255,255,255,0.35); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ml-remove-btn {
    background: none; border: none; cursor: pointer; padding: 2px 6px;
    color: rgba(255,255,255,0.2); font-size: 14px; border-radius: 6px;
    transition: color 0.15s, background 0.15s; flex-shrink: 0;
  }
  .ml-remove-btn:hover { color: #ff3d6e; background: rgba(255,61,110,0.1); }

  .ml-add-row {
    display: flex; gap: 10px; align-items: stretch;
  }
  .ml-select {
    flex: 0 0 160px; padding: 13px 14px;
    background: rgba(255,255,255,0.05); border: 1px solid var(--border);
    border-radius: 12px; color: var(--text); font-size: 13px;
    font-family: 'DM Sans', sans-serif; outline: none; appearance: none; cursor: pointer;
    transition: border-color 0.2s;
  }
  .ml-select:focus { border-color: rgba(233,30,140,0.5); }
  .ml-select option { background: #16161a; }

  .ml-url-input {
    flex: 1; padding: 13px 14px;
    background: rgba(255,255,255,0.05); border: 1px solid var(--border);
    border-radius: 12px; color: var(--text); font-size: 13px;
    font-family: 'DM Sans', sans-serif; outline: none;
    transition: border-color 0.2s;
  }
  .ml-url-input:focus { border-color: rgba(233,30,140,0.5); }
  .ml-url-input::placeholder { color: rgba(255,255,255,0.18); }

  .ml-add-btn {
    flex-shrink: 0; padding: 13px 18px;
    background: rgba(233,30,140,0.15); border: 1px solid rgba(233,30,140,0.3);
    border-radius: 12px; color: var(--accent3); font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }
  .ml-add-btn:hover { background: rgba(233,30,140,0.25); border-color: rgba(233,30,140,0.5); }
  .ml-add-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .ml-empty { text-align: center; padding: 24px 0; color: var(--muted); font-size: 13px; }

  .step-fade-enter { animation: fadeSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) both; }
  @keyframes fadeSlideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
`;

// ─── Platform config ───────────────────────────────────────────────────────────
const PLATFORMS = [
  { key: "spotify",    icon: "🎵", label: "Spotify",    placeholder: "https://open.spotify.com/artist/..." },
  { key: "soundcloud", icon: "☁️", label: "SoundCloud", placeholder: "https://soundcloud.com/yourname" },
  { key: "bandcamp",   icon: "🎸", label: "Bandcamp",   placeholder: "https://yourname.bandcamp.com" },
  { key: "youtube",    icon: "▶️", label: "YouTube",    placeholder: "https://youtube.com/@yourchannel" },
  { key: "instagram",  icon: "📸", label: "Instagram",  placeholder: "https://instagram.com/yourname" },
  { key: "tiktok",     icon: "🎬", label: "TikTok",     placeholder: "https://tiktok.com/@yourname" },
];

// ─── Pill screen ──────────────────────────────────────────────────────────────
function PillScreen({ title, subtitle, items, selected, onToggle, minSelect = 1 }) {
  const [search, setSearch] = useState("");
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const count = selected.length;
  const dots = Array.from({ length: Math.max(minSelect, count) });
  return (
    <div className="bubble-screen step-fade-enter">
      <h2 className="ob-headline">{title}</h2>
      <p className="ob-sub">{subtitle}</p>
      <div className="ob-count-bar">
        <span className="ob-count-text">{count} selected</span>
        <div className="ob-count-dots">
          {dots.map((_, i) => <div key={i} className={`ob-count-dot ${i < count ? "filled" : ""}`} />)}
        </div>
      </div>
      <div className="ob-search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input className="ob-search" placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="bubble-grid">
        {filtered.map(item => (
          <button key={item.id} className={`bubble-pill ${selected.some(s => s.id === item.id) ? "sel" : ""}`} onClick={() => onToggle(item)}>
            {item.name}
          </button>
        ))}
        {filtered.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13, padding: "20px 0" }}>No results found</p>}
      </div>
    </div>
  );
}

// ─── Artist screen ────────────────────────────────────────────────────────────
function ArtistScreen({ items, selected, onToggle }) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const INITIAL = 20;
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const visible = search ? filtered : (showAll ? filtered : filtered.slice(0, INITIAL));
  const hasMore = !search && !showAll && filtered.length > INITIAL;
  const count = selected.length;
  const dots = Array.from({ length: Math.max(3, count) });
  return (
    <div className="bubble-screen step-fade-enter">
      <h2 className="ob-headline">Who inspires you?</h2>
      <p className="ob-sub">Pick artists whose music moves you.</p>
      <div className="ob-count-bar">
        <span className="ob-count-text">{count} selected</span>
        <div className="ob-count-dots">
          {dots.map((_, i) => <div key={i} className={`ob-count-dot ${i < count ? "filled" : ""}`} />)}
        </div>
      </div>
      <div className="ob-search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input className="ob-search" placeholder="Search artists..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="artist-grid">
        {visible.map((item, i) => {
          const isSel = selected.some(s => s.id === item.id);
          return (
            <div key={item.id} className={`artist-bubble ${isSel ? "sel" : ""}`} style={{ animationDelay: `${i * 0.02}s` }} onClick={() => onToggle(item)}>
              <div className="artist-img-wrap">
                {item.picture ? <img src={item.picture} alt={item.name} loading="lazy" /> : <div className="artist-img-placeholder">🎵</div>}
              </div>
              <span className="artist-name">{item.name}</span>
            </div>
          );
        })}
        {filtered.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13, padding: "20px 0", gridColumn: "1/-1" }}>No artists found</p>}
      </div>
      {hasMore && (
        <button className="ob-btn ob-btn-ghost" style={{ marginTop: 0, marginBottom: 8 }} onClick={() => setShowAll(true)}>
          Show all {filtered.length} artists
        </button>
      )}
    </div>
  );
}

// ─── Music links screen ───────────────────────────────────────────────────────
function MusicLinksScreen({ links, onChange, onRemove }) {
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [urlInput, setUrlInput] = useState("");

  const addedKeys = Object.keys(links).filter(k => links[k]);
  const availablePlatforms = PLATFORMS.filter(p => !links[p.key]);
  const currentPlatform = PLATFORMS.find(p => p.key === selectedPlatform);

  const handleAdd = () => {
    if (!selectedPlatform || !urlInput.trim()) return;
    onChange(selectedPlatform, urlInput.trim());
    setSelectedPlatform("");
    setUrlInput("");
  };

  return (
    <div className="step-fade-enter">
      <h2 className="ob-headline">Share your music.</h2>
      <p className="ob-sub">Add links so others can hear your sound. All optional.</p>

      {/* Added links list */}
      {addedKeys.length > 0 && (
        <div className="ml-added-list">
          {addedKeys.map(key => {
            const p = PLATFORMS.find(pl => pl.key === key);
            return (
              <div key={key} className="ml-added-item">
                <span className="ml-added-icon">{p.icon}</span>
                <span className="ml-added-name">{p.label}</span>
                <span className="ml-added-url">{links[key]}</span>
                <button className="ml-remove-btn" onClick={() => onRemove(key)}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {addedKeys.length === 0 && (
        <div className="ml-empty">No links added yet — pick a platform below.</div>
      )}

      {/* Add row — only show if platforms remain */}
      {availablePlatforms.length > 0 && (
        <div className="ml-add-row" style={{ marginBottom: 8 }}>
          <select
            className="ml-select"
            value={selectedPlatform}
            onChange={e => { setSelectedPlatform(e.target.value); setUrlInput(""); }}
          >
            <option value="">Platform...</option>
            {availablePlatforms.map(p => (
              <option key={p.key} value={p.key}>{p.icon} {p.label}</option>
            ))}
          </select>
          <input
            className="ml-url-input"
            type="url"
            placeholder={currentPlatform ? currentPlatform.placeholder : "Paste your link..."}
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          />
          <button className="ml-add-btn" onClick={handleAdd} disabled={!selectedPlatform || !urlInput.trim()}>
            Add
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Skill levels ─────────────────────────────────────────────────────────────
const SKILL_LEVELS = [
  { value: "beginner",     emoji: "🌱", name: "Beginner",     desc: "Just starting out" },
  { value: "intermediate", emoji: "🔥", name: "Intermediate", desc: "Know my way around" },
  { value: "advanced",     emoji: "⚡", name: "Advanced",     desc: "Highly experienced" },
  { value: "professional", emoji: "🎯", name: "Professional", desc: "I do this for a living" },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function Onboarding() {
  const { updateProfile, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const TOTAL_STEPS = 6;

  const [options, setOptions] = useState({ genres: [], instruments: [], vibes: [], artists: [] });
  const [username, setUsername] = useState("");
  const [skillsLevel, setSkillsLevel] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [musicLinks, setMusicLinks] = useState({
    spotify: "", soundcloud: "", bandcamp: "", youtube: "", instagram: "", tiktok: "",
  });

  useEffect(() => {
    if (user?.onboarding_complete) navigate("/", { replace: true });
  }, [user]);

  useEffect(() => {
    apiService.getAllFormOptions()
      .then(data => setOptions(data))
      .catch(err => console.error("Error loading options:", err));
  }, []);

  const toggle = (item, selected, setSelected) => {
    if (selected.some(i => i.id === item.id)) {
      setSelected(selected.filter(i => i.id !== item.id));
    } else {
      setSelected([...selected, item]);
    }
  };

  const handleLinkChange = (key, value) => setMusicLinks(prev => ({ ...prev, [key]: value }));
  const handleLinkRemove = (key) => setMusicLinks(prev => ({ ...prev, [key]: "" }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await updateProfile({
        display_name: username,
        onboarding_complete: true,
        genres_liked: selectedGenres.map(g => g.id),
        instruments_liked: selectedInstruments.map(i => i.id),
        vibes_liked: selectedVibes.map(v => v.id),
        artists_liked: selectedArtists.map(a => a.id),
        ...(musicLinks.spotify    && { spotify:    musicLinks.spotify }),
        ...(musicLinks.soundcloud && { soundcloud: musicLinks.soundcloud }),
        ...(musicLinks.bandcamp   && { bandcamp:   musicLinks.bandcamp }),
        ...(musicLinks.youtube    && { youtube:    musicLinks.youtube }),
        ...(musicLinks.instagram  && { instagram:  musicLinks.instagram }),
        ...(musicLinks.tiktok     && { tiktok:     musicLinks.tiktok }),
      });
      setTimeout(() => navigate("/", { replace: true }), 50);
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitting(false);
    }
  };

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);
  const isWide = step >= 1 && step <= 4;

  return (
    <>
      <style>{css}</style>
      <div className="ob-root">
        <div className={`ob-card ${isWide ? "wide" : ""}`}>

          <div className="ob-logo">
            <div className="ob-logo-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2C5.13 2 2 5.13 2 9s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 3a2 2 0 110 4 2 2 0 010-4zm0 9.2a5.1 5.1 0 01-4-1.94C5.03 11.36 7 10.7 9 10.7s3.97.66 4 1.56A5.1 5.1 0 019 14.2z" fill="white"/>
              </svg>
            </div>
            <span className="ob-logo-text">SoundMeet</span>
          </div>

          <div className="ob-progress">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`ob-prog-seg ${i < step ? "done" : i === step ? "active" : ""}`} />
            ))}
          </div>

          {/* Step 0: Profile */}
          {step === 0 && (
            <div className="step-fade-enter">
              <h2 className="ob-headline">Let's set up<br />your profile.</h2>
              <p className="ob-sub">Tell us a bit about yourself so we can find your perfect music partners.</p>
              <div className="ob-field">
                <label className="ob-label">Your name or username</label>
                <input className="ob-input" placeholder="e.g. funkyjamez" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="ob-field" style={{ marginBottom: 24 }}>
                <label className="ob-label">Skill level</label>
                <div className="ob-skill-grid">
                  {SKILL_LEVELS.map(s => (
                    <button key={s.value} className={`ob-skill-chip ${skillsLevel === s.value ? "sel" : ""}`} onClick={() => setSkillsLevel(s.value)}>
                      <span className="ob-skill-emoji">{s.emoji}</span>
                      <div className="ob-skill-name">{s.name}</div>
                      <div className="ob-skill-desc">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button className="ob-btn" disabled={!username.trim() || !skillsLevel} onClick={next}>Continue →</button>
            </div>
          )}

          {/* Step 1: Genres */}
          {step === 1 && (
            <>
              <PillScreen title="What's your sound?" subtitle="Tap genres you vibe with." items={options.genres} selected={selectedGenres} onToggle={item => toggle(item, selectedGenres, setSelectedGenres)} />
              <button className="ob-btn" disabled={selectedGenres.length < 1} onClick={next}>Next →</button>
              <button className="ob-btn ob-btn-ghost" onClick={back}>← Back</button>
            </>
          )}

          {/* Step 2: Instruments */}
          {step === 2 && (
            <>
              <PillScreen title="What do you play?" subtitle="Select your instruments — or what you want to learn." items={options.instruments} selected={selectedInstruments} onToggle={item => toggle(item, selectedInstruments, setSelectedInstruments)} />
              <button className="ob-btn" disabled={selectedInstruments.length < 1} onClick={next}>Next →</button>
              <button className="ob-btn ob-btn-ghost" onClick={back}>← Back</button>
            </>
          )}

          {/* Step 3: Vibes */}
          {step === 3 && (
            <>
              <PillScreen title="What's your vibe?" subtitle="Pick the moods and energies that resonate with you." items={options.vibes} selected={selectedVibes} onToggle={item => toggle(item, selectedVibes, setSelectedVibes)} />
              <button className="ob-btn" disabled={selectedVibes.length < 1} onClick={next}>Next →</button>
              <button className="ob-btn ob-btn-ghost" onClick={back}>← Back</button>
            </>
          )}

          {/* Step 4: Artists */}
          {step === 4 && (
            <>
              <ArtistScreen items={options.artists} selected={selectedArtists} onToggle={item => toggle(item, selectedArtists, setSelectedArtists)} />
              <button className="ob-btn" disabled={selectedArtists.length < 1} onClick={next}>Next →</button>
              <button className="ob-btn ob-btn-ghost" onClick={back}>← Back</button>
            </>
          )}

          {/* Step 5: Music links */}
          {step === 5 && (
            <>
              <MusicLinksScreen links={musicLinks} onChange={handleLinkChange} onRemove={handleLinkRemove} />
              <button className="ob-btn" disabled={submitting} onClick={handleSubmit}>
                {submitting ? "Saving..." : "Finish & Find My Match 🎵"}
              </button>
              <button className="ob-btn ob-btn-ghost" disabled={submitting} onClick={back}>← Back</button>
            </>
          )}

        </div>
      </div>
    </>
  );
}