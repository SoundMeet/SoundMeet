import { supabase } from './supaBaseClient';

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


  async getAllFormOptions() {
    try {
      const [instruments, genres, vibes] = await Promise.all([
        this.getInstruments(),
        this.getGenres(),
        this.getVibes()
      ]);

      return {
        instruments,
        genres,
        vibes
      };
    } catch (error) {
      console.error("Error fetching form options:", error);
      throw error;
    }
  }
};