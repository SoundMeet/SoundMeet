import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const API_URL = "http://localhost:8000/";
const TOKEN_KEY = "auth_token";


const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
const removeToken = () => localStorage.removeItem(TOKEN_KEY);


async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (token) headers.set("Authorization", `Token ${token}`);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw err;
  }

  if (res.status === 204) return undefined;
  return res.json();
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken())
  const [isLoading, setIsLoading] = useState(!!getToken());

  const fetchProfile = useCallback(async () => {
    const profile = await apiFetch("api/profiles/me/");
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    fetchProfile()
      .catch(() => {
        removeToken();
        setIsLoggedIn(false);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setSession = (token) => {
    setToken(token);
    setIsLoggedIn(true);
  };

  const login = async (credentials) => {
    const res = await apiFetch("api-token-auth/", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    setSession(res.token);
    return fetchProfile();
  };

  const register = async (userData) => {
    const res = await apiFetch("api/register/", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    setSession(res.token);
    return fetchProfile();
  };

  const logout = useCallback(() => {
    removeToken();
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  const updateProfile = async (data) => {
    const form = new FormData();

    if (data.display_name !== undefined) form.append("display_name", data.display_name);
    if (data.pfp instanceof File)        form.append("pfp", data.pfp);
    if (data.about !== undefined)        form.append("about", data.about);
    if (data.age !== undefined)          form.append("age", String(data.age));
    if (data.gender !== undefined)       form.append("gender", data.gender);
    if (data.spectator !== undefined)    form.append("spectator", String(data.spectator));
    if (data.country !== undefined)      form.append("country", data.country);
    if (data.city !== undefined)         form.append("city", data.city);
    if (data.state !== undefined)        form.append("state", data.state);

    data.instruments_liked?.forEach((id) => form.append("instruments_liked", String(id)));
    data.genres_liked?.forEach((id)      => form.append("genres_liked", String(id)));
    data.vibes_liked?.forEach((id)       => form.append("vibes_liked", String(id)));

    const updated = await apiFetch("api/profiles/me/", {
      method: "PATCH",
      body: form,
    });
    setUser(updated);
    return updated;
  };

  const updateSecurityQuestion = async (question, answer) => {
    const form = new FormData();
    form.append("recovery_question", question);
    form.append("recovery_answer", answer);
    await apiFetch("api/profiles/me/", { method: "PATCH", body: form });
  };

  const getRecoveryQuestion = (username) =>
    apiFetch(`api/password-reset/?username=${encodeURIComponent(username)}`);

  const resetPassword = async (payload) => {
    await apiFetch("api/password-reset/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        login,
        register,
        logout,
        fetchProfile,
        updateProfile,
        updateSecurityQuestion,
        getRecoveryQuestion,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}