import { supabase } from './supaBaseClient';
import { apiFetch } from './Auth';

export const bandService = {

  async getAllBands() {
    const { data, error } = await supabase
      .from('chat_band')
      .select(`
        id,
        name,
        description,
        created_at,
        admin:admin_id ( id, username ),
        genres:chat_band_genres (
          genre:chat_genre (id, name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getOpenBandmateListings() {
    const { data, error } = await supabase
      .from('chat_bandmatelisting')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        admin:admin_id ( id, username ),
        band:band_id ( id, name ),
        instrument_needed:instrument_needed_id ( id, name, family )
      `)
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async applyForBandmate(listingId, message = '') {
    return await apiFetch(`api/bandmates/${listingId}/apply/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async createBand(form) {
    const payload = {
      name: form.name?.trim(),
      description: form.description?.trim() || '',
      genre_ids: form.genres?.presetIds || []
    };

    return await apiFetch('api/bands/create/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getCandidatesForListing(listingId) {
    const { data, error } = await supabase
      .from('chat_bandmatecandidate')
      .select(`
        id,
        status,
        message,
        created_at,
        user:user_id (
          id,
          username,
          chat_profile ( display_name, pfp )
        )
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }
};