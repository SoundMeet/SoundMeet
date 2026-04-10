import { supabase } from './supaBaseClient';
import { apiFetch } from './Auth';

export const apiService = {
  async getAllJams() {
    const { data, error } = await supabase
      .from('chat_jam') 
      .select(`
        id,
        name,
        date_time,
        description,
        access,
        genre:genre_id (name),
        vibe:vibe_id (name)
      `)
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true });

    if (error) {
      console.error('Error fetching jams:', error);
      throw error;
    }
    return data;
  },

  async getInstruments() {
    const { data, error } = await supabase
      .from('chat_instrument')
      .select('id, name, family')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getGenres() {
    const { data, error } = await supabase
      .from('chat_genre')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getVibes() {
    const { data, error } = await supabase
      .from('chat_vibe')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getRoles() {
    const { data, error } = await supabase
      .from('chat_role')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getGear() {
    const { data, error } = await supabase
      .from('chat_gear')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getArtists() {
    const { data, error } = await supabase
      .from('chat_artist')
      .select(`
        id, 
        name, 
        picture,
        genres
      `)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getProfiles() {
    const { data, error } = await supabase
      .from('chat_profile')
      .select(`
        *,
        instruments_liked:chat_profile_instruments_liked (
          instrument:chat_instrument (id, name, family)
        ),
        genres_liked:chat_profile_genres_liked (
          genre:chat_genre (id, name)
        ),
        vibes_liked:chat_profile_vibes_liked (
          vibe:chat_vibe (id, name)
        )
      `)
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }

    const flattenedData = data.map(profile => ({
      ...profile,
      instruments: profile.instruments_liked.map(link => link.instrument),
      genres: profile.genres_liked.map(link => link.genre),
      vibes: profile.vibes_liked.map(link => link.vibe),
    }));

    flattenedData.forEach(p => {
      delete p.instruments_liked;
      delete p.genres_liked;
      delete p.vibes_liked;
    });

    return flattenedData;
  },

  async getUserByUsername(username) {
    return apiFetch(`api/profiles/${username}/`);
  },

  async sendFriendRequest(userId) {
    return apiFetch("api/friends/request/", {
      method: "POST",
      body: JSON.stringify({ to_user_id: userId }),
    });
  },

  async getAllFormOptions() {
    try {
      const [instruments, genres, vibes, artists, roles, gear] = await Promise.all([
        this.getInstruments(),
        this.getGenres(),
        this.getVibes(),
        this.getArtists(),
        this.getRoles(),
        this.getGear(),
      ]);

      return {
        instruments,
        genres,
        vibes,
        artists,
        roles,
        gear
      };
    } catch (error) {
      console.error("Error fetching form options:", error);
      throw error;
    }
  }
  
};
