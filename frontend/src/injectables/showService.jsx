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
        end_time,
        location,
        location_name,
        location_address,
        location_guide,
        description,
        ticket_link,
        ticket_price,
        max_capacity,
        access,
        lineup,
        cover_image,
        admin:admin_id ( id, username ),
        genres:chat_show_genres ( genre:chat_genre ( id, name ) )
      `)
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true });

    if (error) throw error;

    return (data ?? []).map(show => ({
      ...show,
      coordinates: parseEWKBPoint(show.location),
      genres: show.genres?.map(g => g.genre) || []
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
    
    if (form.date && form.endTime) {
      const endDateTime = new Date(`${form.date}T${form.endTime}`).toISOString();
      formData.append("end_time", endDateTime);
    }
    
    if (form.selectedPlace?.latitude != null && form.selectedPlace?.longitude != null) {
      const wkt = `SRID=4326;POINT(${form.selectedPlace.longitude} ${form.selectedPlace.latitude})`;
      formData.append("location", wkt);
    }

    if (form.placeName) formData.append("location_name", form.placeName);
    if (form.fullAddress) formData.append("location_address", form.fullAddress);
    if (form.extraDirections) formData.append("location_guide", form.extraDirections);

    if (form.ticketPrice) formData.append("ticket_price", form.ticketPrice);
    if (form.maxCapacity) formData.append("max_capacity", form.maxCapacity);
    if (form.isPrivate !== undefined) formData.append("access", !form.isPrivate);
    
    if (form.lineup) {
      formData.append("lineup", JSON.stringify(form.lineup));
    }
    
    const genreIds = form.genres?.presetIds || [];
    genreIds.forEach(id => formData.append('genre_ids', id));
    
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
        genres:chat_show_genres ( genre:chat_genre ( id, name ) )
      `)
      .eq('id', showId)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      coordinates: parseEWKBPoint(data.location),
      genres: data.genres?.map(g => g.genre) || []
    };
  }
};