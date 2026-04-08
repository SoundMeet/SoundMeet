import { supabase } from './supaBaseClient';
import { parseEWKBPoint } from '../utils/parseGeography';
import { apiFetch } from './Auth';

export const showService = {
  
  async getUpcomingShows() {
    const { data, error } = await supabase
      .from('chat_show')
      .select(`
        id,
        name,
        date_time,
        location,
        description,
        ticket_link,
        cover_image,
        admin:admin_id ( id, username ),
        genre:genre_id ( id, name )
      `)
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true });

    if (error) throw error;

    return (data ?? []).map(show => ({
      ...show,
      coordinates: parseEWKBPoint(show.location)
    }));
  },

  async createShow(form) {
    const formData = new FormData();
    
    if (form.title) formData.append("name", form.title.trim());
    if (form.description) formData.append("description", form.description.trim());
    if (form.ticketLink) formData.append("ticket_link", form.ticketLink.trim());
    
    if (form.date && form.startTime) {
      const dateTime = new Date(`${form.date}T${form.startTime}`).toISOString();
      formData.append("date_time", dateTime);
    }
    
    if (form.selectedPlace?.latitude != null && form.selectedPlace?.longitude != null) {
      const wkt = `SRID=4326;POINT(${form.selectedPlace.longitude} ${form.selectedPlace.latitude})`;
      formData.append("location", wkt);
    }
    
    if (form.genres?.presetIds?.length > 0) {
      formData.append("genre_id", form.genres.presetIds[0]);
    }
    
    if (form.coverImage instanceof File) {
      formData.append("cover_image", form.coverImage);
    }

    const response = await apiFetch('api/shows/create/', {
      method: 'POST',
      body: formData
    });

    return response;
  },

  async getShowById(showId) {
    const { data, error } = await supabase
      .from('chat_show')
      .select(`
        *,
        admin:admin_id ( id, username ),
        genre:genre_id ( id, name )
      `)
      .eq('id', showId)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      coordinates: parseEWKBPoint(data.location)
    };
  }
};