import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate }    from "react-router-dom";
import { apiService }     from "../injectables/apiCalls";
import { useAuth }        from "../injectables/Auth";
import LogowText          from "../assets/LogowText.svg";

import "../components/onboarding/onboarding.css";
import { STEPS }         from "../components/onboarding/onboardingConfig";
import ObProgress        from "../components/onboarding/ObProgress";
import ObCTABar          from "../components/onboarding/ObCTABar";
import ProfileStep       from "../components/onboarding/ProfileStep";
import SelectionStep     from "../components/onboarding/SelectionStep";
import MusicLinksStep    from "../components/onboarding/MusicLinksStep";

// ─── Completion screen ────────────────────────────────────────────────────────
function DoneScreen({ username }) {
  return (
    <div className="ob-done">
      <div className="ob-done-logo">
        <img src={LogowText} alt="SoundMeet" />
      </div>
      <h2 className="ob-done-headline">You're in, {username}.</h2>
      <p className="ob-done-sub">Setting up your profile.<br />Finding your people now.</p>
      <div className="ob-done-orb" aria-hidden="true" />
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
export default function Onboarding() {
  const { updateProfile, user } = useAuth();
  const navigate                = useNavigate();

  // Step state
  const [step, setStep] = useState(0);
  const [dir,  setDir]  = useState("forward"); // 'forward' | 'back'
  const [done, setDone] = useState(false);

  // Form state
  const [username,   setUsername]   = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [selections, setSelections] = useState({
    genres:      [],
    instruments: [],
    vibes:       [],
    artists:     [],
  });
  const [musicLinks, setMusicLinks] = useState({
    spotify: "", soundcloud: "", bandcamp: "", youtube: "", instagram: "", tiktok: "",
  });

  // Async state
  const [options,    setOptions]    = useState({ genres: [], instruments: [], vibes: [], artists: [] });
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Prevent double-submit
  const submitLock = useRef(false);

  // Guard — already onboarded
  useEffect(() => {
    if (user?.onboarding_complete) navigate("/", { replace: true });
  }, [user]);

  // Fetch taxonomy options once
  useEffect(() => {
    setLoading(true);
    apiService.getAllFormOptions()
      .then(data => setOptions(data))
      .catch(err => console.error("Error loading options:", err))
      .finally(() => setLoading(false));
  }, []);

  // ── Selections toggle ────────────────────────────────────────────────────────
  const toggleSelection = (stateKey, item) => {
    setSelections(prev => {
      const current = prev[stateKey];
      const exists  = current.some(i => i.id === item.id);
      return {
        ...prev,
        [stateKey]: exists
          ? current.filter(i => i.id !== item.id)
          : [...current, item],
      };
    });
  };

  // ── Music links ──────────────────────────────────────────────────────────────
  const handleLinkChange = (key, value) => setMusicLinks(prev => ({ ...prev, [key]: value }));
  const handleLinkRemove = (key)        => setMusicLinks(prev => ({ ...prev, [key]: "" }));

  // ── Can advance logic ────────────────────────────────────────────────────────
  const currentStepConfig = STEPS[step];

  const selectionCount = useMemo(() => {
    if (!currentStepConfig?.stateKey) return 0;
    return selections[currentStepConfig.stateKey]?.length ?? 0;
  }, [step, selections, currentStepConfig]);

  const canAdvance = useMemo(() => {
    if (done) return false;
    switch (currentStepConfig?.type) {
      case "profile":
        return username.trim().length > 0 && skillLevel !== "";
      case "pills":
      case "artists":
        return currentStepConfig.optional
          ? true
          : selectionCount >= (currentStepConfig.minSelect ?? 1);
      default:
        return true; // links step — always OK
    }
  }, [done, currentStepConfig, username, skillLevel, selectionCount]);

  // ── Navigation ───────────────────────────────────────────────────────────────
  const next = () => {
    if (!canAdvance) return;
    setDir("forward");
    setStep(s => s + 1);
  };

  const back = () => {
    setDir("back");
    setStep(s => s - 1);
  };

  // Enter on profile step advances
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && step === 0 && canAdvance) next();
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitLock.current || submitting) return;
    submitLock.current = true;
    setSubmitting(true);

    try {
      await updateProfile({
        display_name:        username.trim(),
        skill_level:         skillLevel,
        onboarding_complete: true,
        genres_liked:        selections.genres.map(g => g.id),
        instruments_liked:   selections.instruments.map(i => i.id),
        vibes_liked:         selections.vibes.map(v => v.id),
        artists_liked:       selections.artists.map(a => a.id),
        ...(musicLinks.spotify    && { spotify:    musicLinks.spotify    }),
        ...(musicLinks.soundcloud && { soundcloud: musicLinks.soundcloud }),
        ...(musicLinks.bandcamp   && { bandcamp:   musicLinks.bandcamp   }),
        ...(musicLinks.youtube    && { youtube:    musicLinks.youtube    }),
        ...(musicLinks.instagram  && { instagram:  musicLinks.instagram  }),
        ...(musicLinks.tiktok     && { tiktok:     musicLinks.tiktok     }),
      });

      setDone(true);
      setTimeout(() => navigate("/", { replace: true }), 1600);
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitting(false);
      submitLock.current = false;
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const isFinal    = step === STEPS.length - 1;
  const isWide     = currentStepConfig?.wide && !done;
  const transClass = dir === "forward" ? "ob-step-fwd" : "ob-step-back";

  // ── Step content ─────────────────────────────────────────────────────────────
  const renderStep = () => {
    if (done) return <DoneScreen username={username} />;

    switch (currentStepConfig?.type) {
      case "profile":
        return (
          <ProfileStep
            username={username}      onUsername={setUsername}
            skillLevel={skillLevel}  onSkillLevel={setSkillLevel}
          />
        );
      case "pills":
      case "artists":
        return (
          <SelectionStep
            config={currentStepConfig}
            items={options[currentStepConfig.stateKey] ?? []}
            loading={loading}
            selected={selections[currentStepConfig.stateKey]}
            onToggle={item => toggleSelection(currentStepConfig.stateKey, item)}
          />
        );
      case "links":
        return (
          <MusicLinksStep
            links={musicLinks}
            onChange={handleLinkChange}
            onRemove={handleLinkRemove}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="ob-root" onKeyDown={handleKeyDown}>
      <div className={`ob-card${isWide ? " wide" : ""}`}>

        {/* Header — logo + progress, never scrolls */}
        {!done && (
          <div className="ob-card-header">
            <div className="ob-logo">
              <img src={LogowText} alt="SoundMeet" />
            </div>
            <ObProgress step={step} />
          </div>
        )}

        {/* Scrollable body — key forces remount + re-triggers CSS animation */}
        <div key={`step-${step}-${done}`} className={`ob-card-body ${done ? "" : transClass}`}>
          {renderStep()}
        </div>

        {/* CTA bar — fixed bottom on mobile, flow on desktop */}
        {!done && (
          <ObCTABar
            onNext={!isFinal ? next : null}
            onSubmit={isFinal ? handleSubmit : null}
            onBack={step > 0 ? back : null}
            canAdvance={canAdvance}
            isOptional={currentStepConfig?.optional ?? false}
            count={selectionCount}
            submitting={submitting}
            isFinal={isFinal}
          />
        )}

      </div>
    </div>
  );
}
