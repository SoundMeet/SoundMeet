import { useState } from "react";
import LogowText from "../assets/LogowText.svg";
import { useAuth } from "../injectables/Auth.jsx";
import { useNavigate, Link } from "react-router-dom";

const GENDER_OPTIONS = [
  { value: "MAN", label: "Man" },
  { value: "WOMAN", label: "Woman" },
  { value: "NON-BINARY", label: "Non-binary" },
  { value: "PREFER NOT TO SAY", label: "Prefer not to say" },
];

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
  }

  .reg-root {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--bg);
    position: relative;
    overflow: hidden;
  }
  .reg-root::before {
    content: '';
    position: fixed;
    top: -200px; left: 50%;
    transform: translateX(-50%);
    width: 800px; height: 500px;
    background: radial-gradient(ellipse, rgba(233,30,140,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .reg-root::after {
    content: '';
    position: fixed;
    bottom: -200px; right: -100px;
    width: 600px; height: 400px;
    background: radial-gradient(ellipse, rgba(255,61,110,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .reg-card {
    width: 100%;
    max-width: 480px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 40px;
    position: relative;
    z-index: 1;
    animation: cardIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .reg-logo {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 32px;
  }
  .reg-logo img { height: 32px; }

  .reg-headline {
    font-family: 'Syne', sans-serif;
    font-size: 26px; font-weight: 800;
    line-height: 1.15; margin-bottom: 6px;
    letter-spacing: -0.5px;
    color: var(--text);
  }
  .reg-sub {
    color: var(--muted); font-size: 14px;
    margin-bottom: 28px; font-weight: 300;
  }

  .reg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .reg-field { margin-bottom: 14px; }
  .reg-label {
    display: block; font-size: 11px;
    text-transform: uppercase; letter-spacing: 1.2px;
    color: var(--muted); margin-bottom: 7px;
    font-weight: 500;
  }
  .reg-input, .reg-select {
    width: 100%; padding: 13px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--text); font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    appearance: none;
  }
  .reg-input:focus, .reg-select:focus {
    border-color: rgba(233,30,140,0.5);
    background: rgba(233,30,140,0.04);
  }
  .reg-input::placeholder { color: rgba(255,255,255,0.2); }
  .reg-select option { background: #16161a; color: #f0f0f0; }

  .reg-divider {
    height: 1px;
    background: var(--border);
    margin: 20px 0;
  }
  .reg-section-label {
    font-size: 11px; text-transform: uppercase;
    letter-spacing: 1.2px; color: var(--muted);
    font-weight: 500; margin-bottom: 14px;
  }

  .reg-btn {
    width: 100%; padding: 15px;
    background: linear-gradient(135deg, var(--accent3) 0%, var(--accent1) 100%);
    border: none; border-radius: 14px;
    color: #fff; font-size: 15px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    margin-top: 8px;
  }
  .reg-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .reg-btn:active { transform: translateY(0); }
  .reg-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .reg-error {
    background: rgba(255,61,110,0.1);
    border: 1px solid rgba(255,61,110,0.3);
    border-radius: 10px;
    padding: 10px 14px;
    color: #ff3d6e;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .reg-login {
    text-align: center;
    font-size: 13px;
    color: var(--muted);
    margin-top: 16px;
  }
  .reg-login a {
    color: var(--accent3);
    text-decoration: none;
    font-weight: 500;
  }
  .reg-login a:hover { text-decoration: underline; }
`;

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    age: "",
    country: "",
    city: "",
    gender: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(formData);
      navigate("/");
    } catch (err) {
      setError("Registration failed. That username might already be taken.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="reg-root">
        <div className="reg-card">

          <div className="reg-logo">
            <img src={LogowText} alt="SoundMeet" />
          </div>

          <h2 className="reg-headline">Create your account.</h2>
          <p className="reg-sub">Join SoundMeet and find your perfect music partners.</p>

          {error && <div className="reg-error">{error}</div>}

          <form onSubmit={handleSubmit}>

            {/* ── Account info ── */}
            <p className="reg-section-label">Account</p>

            <div className="reg-field">
              <label className="reg-label">Username</label>
              <input
                className="reg-input"
                placeholder="e.g. funkyjamez"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">Email</label>
              <input
                className="reg-input"
                placeholder="you@example.com"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">Password</label>
              <input
                className="reg-input"
                placeholder="Min. 8 characters"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="reg-divider" />

            {/* ── About you ── */}
            <p className="reg-section-label">About you <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></p>

            <div className="reg-row">
              <div className="reg-field">
                <label className="reg-label">Age</label>
                <input
                  className="reg-input"
                  placeholder="25"
                  type="number"
                  name="age"
                  min="13"
                  max="120"
                  value={formData.age}
                  onChange={handleChange}
                />
              </div>
              <div className="reg-field">
                <label className="reg-label">Gender</label>
                <select
                  className="reg-select"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select...</option>
                  {GENDER_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="reg-row">
              <div className="reg-field">
                <label className="reg-label">City</label>
                <input
                  className="reg-input"
                  placeholder="Miami"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div className="reg-field">
                <label className="reg-label">Country</label>
                <input
                  className="reg-input"
                  placeholder="USA"
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button className="reg-btn" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account →"}
            </button>

          </form>

          <p className="reg-login">
            Already have an account? <Link to="/login">Log in</Link>
          </p>

        </div>
      </div>
    </>
  );
};

export default Register;