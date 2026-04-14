import { apiFetch } from './Auth';

const SUPABASE_URL = 'https://hbdoqesapzedjwdgtnyq.supabase.co'
const BUCKET_URL = `${SUPABASE_URL}/storage/v1/object/public/media/`

export function formatUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${BUCKET_URL}${cleanPath}`
}

export const musicSnipService = {
  
  async getProfileSnips(profileId) {
    if (!profileId) throw new Error("profileId is required");

    const response = await apiFetch(`api/music-snips/?profile_id=${profileId}`, {
      method: 'GET',
    });
    
    const snips = response.snips || [];
    return snips.map(snip => ({
        ...snip,
        musicFile: formatUrl(snip.musicFile)
    }));
  },

  async createSnip(data) {
    const formData = new FormData();
    
    if (data.name) {
      formData.append('name', data.name);
    }
    
    if (data.musicFile instanceof File) {
      formData.append('musicFile', data.musicFile);
    } else {
      throw new Error("A valid audio file is required.");
    }

    const response = await apiFetch('api/music-snips/', {
      method: 'POST',
      body: formData,
    });

    return response.snip;
  },

  async updateSnip(snipId, data) {
    if (!snipId) throw new Error("snipId is required");

    const formData = new FormData();
    formData.append('snip_id', snipId);

    if (data.name !== undefined) {
      formData.append('name', data.name);
    }
    
    if (data.musicFile instanceof File) {
      formData.append('musicFile', data.musicFile);
    }

    const response = await apiFetch('api/music-snips/', {
      method: 'PATCH',
      body: formData,
    });

    return response.snip;
  },

  async deleteSnip(snipId) {
    if (!snipId) throw new Error("snipId is required");

    return await apiFetch(`api/music-snips/?snip_id=${snipId}`, {
      method: 'DELETE',
    });
  }
};
