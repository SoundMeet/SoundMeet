import { supabase } from './supaBaseClient';
import { apiFetch } from './Auth';

// ─── Shape normalizer ─────────────────────────────────────────────────────────

function toFeedPost(row, currentUserId) {
  const profile = row.author?.chat_profile ?? {}
  return {
    id:        row.id,
    author: {
      id:          row.author?.id,
      displayName: profile.display_name ?? row.author?.username ?? 'Unknown',
      username:    row.author?.username ? `@${row.author.username}` : '',
      avatarUrl:   profile.pfp ?? null,
    },
    type:      row.image ? 'photo' : 'text',
    postType:  'text',
    content:   row.content ?? '',
    media:     row.image ? { images: [row.image] } : null,
    jamRef:    null,
    showRef:   null,
    reviewRef: null,
    location:  null,
    likes:     row.likes?.length ?? 0,
    comments:  row.comments?.length ?? 0,
    shares:    0,
    hasLiked:  currentUserId
      ? (row.likes ?? []).some((l) => String(l.user_id) === String(currentUserId))
      : false,
    createdAt: row.created_at,
    tags:      [],
    _rawComments: row.comments ?? [],
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
          chat_profile ( display_name, pfp )
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
    }
  },

  async addComment(postId, userId, content) {
    const { data, error } = await supabase
      .from('chat_comment')
      .insert([{ post_id: postId, author_id: userId, content }])
      .select('id, content, created_at, author:author_id ( id, username )')
      .single();

    if (error) throw error;
    return data;
  }
};