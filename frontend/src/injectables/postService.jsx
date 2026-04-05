import { supabase } from './supaBaseClient';
import { apiFetch } from './Auth';

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

  async getFeed() {
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
    return data;
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
      .insert([{
        post_id: postId,
        author_id: userId,
        content: content
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};