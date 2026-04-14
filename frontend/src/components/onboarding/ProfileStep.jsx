import { SKILL_LEVELS } from "./onboardingConfig";

export default function ProfileStep({ username, onUsername, skillLevel, onSkillLevel }) {
  return (
    <div>
      <h2 className="ob-headline">Your musical<br />identity.</h2>
      <p className="ob-sub">Tell us who you are so we can find your music partners.</p>

      <div className="ob-field">
        <label className="ob-label" htmlFor="ob-display-name">Display name</label>
        <input
          id="ob-display-name"
          className="ob-input"
          type="text"
          placeholder="Your name, stage name, or alias"
          value={username}
          onChange={e => onUsername(e.target.value)}
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          maxLength={40}
        />
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 6, fontFamily: "'Instrument Sans', sans-serif" }}>
          This is how other musicians will see you.
        </p>
      </div>

      <div className="ob-field">
        <label className="ob-label">Skill level</label>
        <div className="ob-skill-grid" role="group" aria-label="Select your skill level">
          {SKILL_LEVELS.map(s => (
            <button
              key={s.value}
              type="button"
              className={`ob-skill-chip${skillLevel === s.value ? " sel" : ""}`}
              onClick={() => onSkillLevel(s.value)}
              aria-pressed={skillLevel === s.value}
            >
              <div className="ob-skill-bars" aria-hidden="true">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className={`ob-skill-bar${n <= s.bars ? " on" : ""}`} />
                ))}
              </div>
              <div className="ob-skill-name">{s.name}</div>
              <div className="ob-skill-desc">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
