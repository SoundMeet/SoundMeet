/**
 * postService.js — Post CRUD operations.
 *
 * Currently uses an in-memory mock store. Swap each method body for
 * a real Supabase call when the backend is ready — the call sites
 * (FeedSection, PostActions) don't need to change.
 *
 * ─── Backend schema guide ────────────────────────────────────────────────────
 *
 * Table: posts
 *   id               UUID           PK, default gen_random_uuid()
 *   author_id        UUID           FK → auth.users / profiles.id  NOT NULL
 *   type             TEXT           'text' | 'audio' | 'photo'     NOT NULL
 *   post_type        TEXT           'jam' | 'clip' | 'show' | 'gear' | 'review' NOT NULL
 *   content          TEXT           caption / body text             NULLABLE
 *   audio_url        TEXT           Supabase Storage URL            NULLABLE
 *   audio_duration   TEXT           e.g. "2:47"                     NULLABLE
 *   photo_urls       JSONB          string[]                        NULLABLE
 *   jam_ref_id       UUID           FK → events.id                  NULLABLE
 *   show_ref_id      UUID           FK → events.id                  NULLABLE
 *   review_rating    INT2           1–5, only set when post_type='review'  NULLABLE
 *   post_lat         FLOAT8         raw latitude                    NULLABLE
 *   post_lng         FLOAT8         raw longitude                   NULLABLE
 *   post_place_name  TEXT           human-readable neighbourhood    NULLABLE
 *   likes_count      INT            default 0
 *   comments_count   INT            default 0
 *   created_at       TIMESTAMPTZ    default now()
 *
 * Table: post_likes
 *   post_id          UUID FK → posts.id
 *   user_id          UUID FK → auth.users
 *   PRIMARY KEY (post_id, user_id)
 *
 * Table: post_comments
 *   id               UUID PK
 *   post_id          UUID FK → posts.id
 *   author_id        UUID FK → auth.users
 *   content          TEXT NOT NULL
 *   created_at       TIMESTAMPTZ default now()
 *
 * File storage:
 *   Bucket: "post-media"
 *   Path convention: "{author_id}/{post_id}/audio.{ext}" or
 *                    "{author_id}/{post_id}/photo_{n}.{ext}"
 *   Upload flow:
 *     1. Create the post row first (to get the post_id)
 *     2. Upload file to storage at the path above
 *     3. Update post row with the returned public URL
 *   Or: use a presigned URL endpoint POST /api/uploads/presigned-url/
 *
 * Realtime:
 *   supabase.channel('public:posts')
 *     .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, cb)
 *     .subscribe()
 * ─────────────────────────────────────────────────────────────────────────────
 */

// In-memory mock store — prepend only, no persistence across page reload
let _localPosts = []

export const postService = {

  /**
   * Create a new post and prepend it to the local store.
   *
   * @param {object} payload
   *   author    { id, displayName, username, avatarUrl }
   *   type      'text' | 'audio' | 'photo'
   *   postType  'jam' | 'clip' | 'show' | 'gear'
   *   content   string | null
   *   media     { audioFile?, audioFileName?, duration?, images? } | null
   *   jamRef    { id, title, date, locationName } | null
   *   showRef   { id, title, date, venueName } | null
   *   location  { lat, lng, name } | null
   *   tags      string[]
   * @returns Promise<post>
   */
  async createPost(payload) {
    const post = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author:    payload.author,
      type:      payload.type,
      postType:  payload.postType,
      content:   payload.content ?? '',
      media:     payload.media      ?? null,
      jamRef:    payload.jamRef     ?? null,
      showRef:   payload.showRef    ?? null,
      reviewRef: payload.reviewRef  ?? null,
      location:  payload.location ?? null,
      likes:     0,
      comments:  0,
      shares:    0,
      hasLiked:  false,
      createdAt: new Date().toISOString(),
      tags:      payload.tags ?? [],
    }

    _localPosts = [post, ..._localPosts]
    console.log('📝 [postService] Post created (mock):', post)

    // TODO (backend developer): replace the above with:
    // const { data, error } = await supabase.from('posts').insert({
    //   author_id:       payload.author.id,
    //   type:            payload.type,
    //   post_type:       payload.postType,
    //   content:         payload.content ?? null,
    //   audio_url:       payload.media?.audioUrl ?? null,
    //   audio_duration:  payload.media?.duration ?? null,
    //   photo_urls:      payload.media?.images   ?? null,
    //   jam_ref_id:      payload.jamRef?.id       ?? null,
    //   show_ref_id:     payload.showRef?.id      ?? null,
    //   post_lat:        payload.location?.lat    ?? null,
    //   post_lng:        payload.location?.lng    ?? null,
    //   post_place_name: payload.location?.name   ?? null,
    // }).select().single()
    // if (error) throw error
    // return data

    return post
  },

  /**
   * Return the local post store (for merging with mock seed data).
   * In prod: replace with supabase.from('posts').select(...)...
   */
  getLocalPosts() {
    return _localPosts
  },

  /**
   * Toggle like on a post (optimistic, local only for now).
   *
   * TODO: supabase.from('post_likes').insert({ post_id, user_id })
   *       / supabase.from('post_likes').delete().match({ post_id, user_id })
   */
  async likePost(_postId, _userId) {
    return { ok: true }
  },

  async unlikePost(_postId, _userId) {
    return { ok: true }
  },
}
