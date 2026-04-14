import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export const API_URL = "https://soundmeet-production.up.railway.app/";
const TOKEN_KEY = "auth_token";
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
const removeToken = () => localStorage.removeItem(TOKEN_KEY);


export async function apiFetch(path, options = {}) {
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
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());
  const [isLoading, setIsLoading] = useState(!!getToken());

  const fetchProfile = useCallback(async () => {
    const profile = await apiFetch("api/profiles/me/", { cache: "no-store" });
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
    const profile = await fetchProfile();
    return profile;
  };

  const loginWithGoogle = async (accessToken) => {
    // Get user info from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userInfo = await userInfoRes.json();

    // Send to our backend
    const res = await fetch(`${API_URL}api/auth/google/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: accessToken,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Google login failed" }));
      throw err;
    }

    const data = await res.json();
    setSession(data.token);
    const profile = await fetchProfile();
    return { profile, created: data.created, suggestedUsername: data.username };
  };

  const register = async (userData) => {
    const res = await apiFetch("api/register/", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    setSession(res.token);
    const profile = await fetchProfile();
    return profile;
  };

  const logout = useCallback(() => {
    removeToken();
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  const changePassword = async ({ currentPassword, newPassword, confirmNewPassword }) => {
    const body = { new_password: newPassword, confirm_new_password: confirmNewPassword }
    if (currentPassword) body.current_password = currentPassword
    const data = await apiFetch('api/account/change-password/', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    setSession(data.token)
    await fetchProfile()
  }

  const deleteAccount = async ({ password, confirmUsername }) => {
    const body = password
      ? { password }
      : { confirm_username: confirmUsername };
    await apiFetch("api/account/delete/", {
      method: "POST",
      body: JSON.stringify(body),
    });
    removeToken();
    setIsLoggedIn(false);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const form = new FormData();
    if (data.display_name !== undefined)        form.append("display_name", data.display_name);
    if (data.pfp instanceof File || data.pfp instanceof Blob) form.append("pfp", data.pfp, "pfp.jpg");
    if (data.about !== undefined)               form.append("about", data.about);
    if (data.age !== undefined)                 form.append("age", String(data.age));
    if (data.gender !== undefined)              form.append("gender", data.gender);
    if (data.spectator !== undefined)           form.append("spectator", String(data.spectator));
    if (data.country !== undefined)             form.append("country", data.country);
    if (data.city !== undefined)                form.append("city", data.city);
    if (data.state !== undefined)               form.append("state", data.state);
    if (data.onboarding_complete !== undefined) form.append("onboarding_complete", String(data.onboarding_complete));
    if (data.skill_level !== undefined)         form.append("skill_level", data.skill_level);
    if (data.skill_level !== undefined)         form.append("skill_level", data.skill_level);
    if (data.headline !== undefined)            form.append("headline", data.headline);
    if (data.available_to_jam !== undefined)    form.append("available_to_jam", String(data.available_to_jam));
    if (data.profile_theme !== undefined)       form.append("profile_theme", data.profile_theme);
    // Music links
    if (data.spotify !== undefined)             form.append("spotify", data.spotify);
    if (data.soundcloud !== undefined)          form.append("soundcloud", data.soundcloud);
    if (data.bandcamp !== undefined)            form.append("bandcamp", data.bandcamp);
    if (data.youtube !== undefined)             form.append("youtube", data.youtube);
    if (data.instagram !== undefined)           form.append("instagram", data.instagram);
    if (data.tiktok !== undefined)              form.append("tiktok", data.tiktok);

    if (data.profile_banner instanceof Blob) form.append("profile_banner", data.profile_banner, "banner.jpg");
    else if (data.clear_profile_banner) form.append("clear_profile_banner", "true");

    // ── BACKEND NEEDED: ImageField "about_photo" on the profile model ─────────
    // Uncomment once the backend field exists.
    // if (data.about_photo instanceof Blob) form.append("about_photo", data.about_photo, "about_photo.jpg");
    //I'm letting the ai write this to let anyone else know some of the backend variables that still need to be put, like banner. we can just uncomment this after it's applied. 
    data.instruments_liked?.forEach((id) => form.append("instruments_liked", String(id)));
    data.genres_liked?.forEach((id)      => form.append("genres_liked", String(id)));
    data.vibes_liked?.forEach((id)       => form.append("vibes_liked", String(id)));
    data.artists_liked?.forEach((id)     => form.append("artists_liked", String(id)));

   //This is the patch request for updating the profile. I think it's alright, but tell me if anything breaks - GL 
    const updated = await apiFetch("api/profiles/me/", {
      method: "PATCH",
      body: form,
    });

    // Optimistically merge onboarding_complete so OnboardingGuard sees it
    // as true immediately before the next fetchProfile call.
    const merged = {
      ...updated,
      onboarding_complete: data.onboarding_complete ?? updated.onboarding_complete,
    };
    setUser(merged);
    return merged;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        changePassword,
        deleteAccount,
        fetchProfile,
        updateProfile,
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