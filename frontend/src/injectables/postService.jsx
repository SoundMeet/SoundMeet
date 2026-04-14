import { supabase } from './supaBaseClient';
import { apiFetch } from './Auth';
import { formatAvatarUrl } from '../utils/formatAvatarUrl';

// ─── Shape normalizer ─────────────────────────────────────────────────────────

function toFeedPost(row, currentUserId) {
  // Supabase returns one-to-many nested joins as arrays, not objects.
  // chat_profile is one-to-many from auth.users, so unwrap the first element.
  const rawProfile = row.author?.chat_profile
  const profile = Array.isArray(rawProfile)
    ? (rawProfile[0] ?? {})
    : (rawProfile ?? {})

  return {
    id:        row.id ?? `unknown-${Math.random()}`,
    author: {
      id:          row.author?.id ?? null,
      // profileId is chat_profile.id — the sequential integer used by ProfilesRUS
      profileId:   profile.id ?? null,
      displayName: profile.display_name ?? row.author?.username ?? 'Unknown',
      username:    row.author?.username ? `@${row.author.username}` : '',
      avatarUrl:   formatAvatarUrl(profile.pfp) ?? null,
    },
    type:      row.image ? 'photo' : 'text',
    postType:  'text',
    content:   row.content ?? '',
    media:     row.image ? { images: [formatAvatarUrl(row.image)] } : null,
    jamRef:    null,
    showRef:   null,
    reviewRef: null,
    location:  null,
    likes:     Array.isArray(row.likes) ? row.likes.length : 0,
    comments:  Array.isArray(row.comments) ? row.comments.length : 0,
    shares:    0,
    hasLiked:  currentUserId
      ? (row.likes ?? []).some((l) => String(l.user_id) === String(currentUserId))
      : false,
    createdAt: row.created_at ?? null,
    tags:      [],
    _rawComments: Array.isArray(row.comments) ? row.comments : [],
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const postService = {

  async createNewPost(content, imageFile) {
    const form = new FormData();
    if (content) form.append("content", content);
    if (imageFile) form.append("image", imageFile);

    return await apiFetch("api/posts/create/", {
      method: "POST",
      body: form,
    });
  },

  async getFeed(currentUserId) {
    const { data, error } = await supabase
      .from('chat_post')
      .select(`
        id,
        content,
        image,
        created_at,
        author:author_id (
          id,
          username,
          chat_profile ( id, display_name, pfp )
        ),
        likes:chat_post_likes ( user_id ),
        comments:chat_comment (
          id,
          content,
          created_at,
          author:author_id ( id, username )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((row) => toFeedPost(row, currentUserId));
  },

  async toggleLike(postId, userId, isCurrentlyLiked) {
    const M2M_TABLE = 'chat_post_likes';

    if (isCurrentlyLiked) {
      const { error } = await supabase
        .from(M2M_TABLE)
        .delete()
        .match({ post_id: postId, user_id: userId });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from(M2M_TABLE)
        .insert([{ post_id: postId, user_id: userId }]);
      if (error) throw error;

      // Fire POST_LIKE notification via Django — best-effort, never blocks the like
      apiFetch(`api/posts/${postId}/like/`, { method: 'POST' })
        .catch((err) => console.warn('[like_notify] notification call failed:', err));
    }
  },

  async addComment(postId, content) {
    return await apiFetch(`api/posts/${postId}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async getPostsByUser(authorId, currentUserId, limit = 3) {
    const { data, error } = await supabase
      .from('chat_post')
      .select(`
        id,
        content,
        image,
        created_at,
        author:author_id (
          id,
          username,
          chat_profile ( id, display_name, pfp )
        ),
        likes:chat_post_likes ( user_id ),
        comments:chat_comment (
          id,
          content,
          created_at,
          author:author_id ( id, username )
        )
      `)
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map((row) => toFeedPost(row, currentUserId));
  },
};