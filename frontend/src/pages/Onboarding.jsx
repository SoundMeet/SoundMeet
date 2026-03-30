import { useEffect, useState } from "react";
import { apiService } from "../injectables/apiCalls";
import { onboardingService } from "../injectables/onboardingService";

export default function Onboarding() {
  const [genres, setGenres] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [vibes, setVibes] = useState([]);
  const [artists, setArtists] = useState([]);

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);

  const [username, setUsername] = useState("");
  const [skillsLevel, setSkillsLevel] = useState("");

  // 🔥 Fetch all options
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiService.getAllFormOptions();
        setGenres(data.genres);
        setInstruments(data.instruments);
        setVibes(data.vibes);
        setArtists(data.artists);
      } catch (err) {
        console.error("Error loading options:", err);
      }
    };

    fetchData();
  }, []);

  // 🔥 Toggle helper
  const toggleItem = (item, selected, setSelected) => {
    if (selected.some((i) => i.id === item.id)) {
      setSelected(selected.filter((i) => i.id !== item.id));
    } else {
      setSelected([...selected, item]);
    }
  };

  // 🔥 Submit to Django
  const handleSubmit = async () => {
    try {
      const payload = {
        username,
        skills_level: skillsLevel,
        genres_liked: selectedGenres.map((g) => g.id),
        instruments_liked: selectedInstruments.map((i) => i.id),
        vibes_liked: selectedVibes.map((v) => v.id),
        artists_liked: selectedArtists.map((a) => a.id),
      };
      console.log("PAYLOAD:", payload);


      const res = await onboardingService.submitOnboarding(payload);
      console.log("Saved:", res);

      alert("Onboarding saved!");

    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  // 🔥 Reusable UI section
  const renderSection = (title, items, selected, setSelected) => (
    <div style={{ marginBottom: "20px" }}>
      <h3>{title}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item, selected, setSelected)}
            style={{
              padding: "8px 12px",
              borderRadius: "20px",
              border: "1px solid white",
              background: selected.some((i) => i.id === item.id)
                ? "white"
                : "transparent",
              color: selected.some((i) => i.id === item.id)
                ? "black"
                : "white",
              cursor: "pointer",
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>Onboarding</h1>

      {/* Username */}
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ marginBottom: "10px", padding: "8px" }}
      />

      {/* Skill Level */}
      <input
        placeholder="Skill Level (beginner, intermediate...)"
        value={skillsLevel}
        onChange={(e) => setSkillsLevel(e.target.value)}
        style={{ marginBottom: "20px", padding: "8px" }}
      />

      {/* Sections */}
      {renderSection("Genres", genres, selectedGenres, setSelectedGenres)}
      {renderSection("Instruments", instruments, selectedInstruments, setSelectedInstruments)}
      {renderSection("Vibes", vibes, selectedVibes, setSelectedVibes)}
      {renderSection("Artists", artists, selectedArtists, setSelectedArtists)}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        style={{
          padding: "10px 20px",
          background: "white",
          color: "black",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Submit
      </button>
    </div>
  );
}