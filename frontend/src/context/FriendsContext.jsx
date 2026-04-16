/**
 * FriendsContext
 *
 * Provides friends list, relationship management, and search.
 * Currently backed by mock data — swap state initializers + action bodies
 * for fetch() calls without changing any component code.
 *
 * Future API surface:
 *   GET    /api/friends/
 *   GET    /api/users/search/?q=&lat=&lng=
 *   POST   /api/friends/request/{user_id}/
 *   POST   /api/friends/accept/{request_id}/
 *   POST   /api/friends/decline/{request_id}/
 *   DELETE /api/friends/{user_id}/
 */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../injectables/Auth'
import { socialService } from '../injectables/socialService'
import { supabase } from '../injectables/supaBaseClient'
import { formatAvatarUrl } from '../utils/formatAvatarUrl'

const FriendsContext = createContext(null)

function normalizeFriend(rawUser) {
  const profile = Array.isArray(rawUser.chat_profile)
    ? rawUser.chat_profile[0]
    : rawUser.chat_profile
  return {
    id: rawUser.id,
    profileId: profile?.id ?? null,
    username: rawUser.username || '',
    displayName: profile?.display_name || rawUser.username || 'Unknown',
    avatarUrl: formatAvatarUrl(profile?.pfp) || null,
    instruments: [],
  }
}

function normalizeSentRequest(row) {
  const toUser = row.to_user
  const profile = Array.isArray(toUser?.chat_profile)
    ? toUser.chat_profile[0]
    : toUser?.chat_profile
  return {
    id: row.id,
    createdAt: row.created_at,
    toUser: toUser
      ? {
          id: toUser.id,
          username: toUser.username || '',
          displayName: profile?.display_name || toUser.username || 'Unknown',
          avatarUrl: formatAvatarUrl(profile?.pfp) || null,
        }
      : null,
  }
}

export function FriendsProvider({ children }) {
  const { user } = useAuth()
  const [friends, setFriends] = useState([])
  const friendsRef = useRef([])
  const [sentRequests, setSentRequests] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [allUsersLoading, setAllUsersLoading] = useState(false)
  const [allUsersError, setAllUsersError] = useState(null)
  const [allUsersFetched, setAllUsersFetched] = useState(false)

  const sentRequestsRef = useRef([])

  // Keep refs so fetchAllUsers can read the latest values without
  // needing them as dependencies (which would cause unnecessary re-fetches).
  useEffect(() => {
    friendsRef.current = friends
  }, [friends])

  useEffect(() => {
    sentRequestsRef.current = sentRequests
  }, [sentRequests])

  const fetchFriends = useCallback(async (userId) => {
    try {
      const raw = await socialService.getMyFriends(userId)
      setFriends(raw.map(normalizeFriend))
    } catch (err) {
      console.error('Failed to fetch friends:', err)
    }
  }, [])

  const fetchSentRequests = useCallback(async (userId) => {
    try {
      const raw = await socialService.getSentFriendRequests(userId)
      setSentRequests(raw.map(normalizeSentRequest).filter((r) => r.toUser != null))
    } catch (err) {
      console.error('Failed to fetch sent requests:', err)
    }
  }, [])

  const fetchAllUsers = useCallback(async () => {
    if (!user?.id) return
    setAllUsersLoading(true)
    setAllUsersError(null)
    try {
      const raw = await socialService.getPeopleProfiles(user.id)
      // Read from refs so we stamp the correct status immediately,
      // regardless of whether the sync useEffect has fired yet.
      const friendIds = new Set(friendsRef.current.map((f) => String(f.id)))
      const sentRequestUserIds = new Set(
        sentRequestsRef.current.map((r) => String(r.toUser?.id)).filter(Boolean)
      )
      setAllUsers(
        raw.map((u) => {
          const uid = String(u.id)
          let relationshipStatus = 'none'
          if (friendIds.has(uid)) relationshipStatus = 'friends'
          else if (sentRequestUserIds.has(uid)) relationshipStatus = 'request_sent'
          return { ...u, relationshipStatus }
        })
      )
      setAllUsersFetched(true)
    } catch (err) {
      console.error('Failed to fetch people profiles:', err)
      setAllUsersError(err.message ?? 'Failed to load people')
    } finally {
      setAllUsersLoading(false)
    }
  }, [user?.id])

  // Initial fetch
  useEffect(() => {
    if (!user?.id) {
      setFriends([])
      setSentRequests([])
      return
    }
    fetchFriends(user.id)
    fetchSentRequests(user.id)
  }, [user?.id, fetchFriends, fetchSentRequests])

  // Re-fetch on tab focus
  useEffect(() => {
    if (!user?.id) return
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchFriends(user.id)
        fetchSentRequests(user.id)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [user?.id, fetchFriends, fetchSentRequests])

  // Reset allUsers cache when user changes
  useEffect(() => {
    setAllUsers([])
    setAllUsersFetched(false)
    setAllUsersError(null)
  }, [user?.id])

  // Sync relationship status into allUsers whenever friends or sentRequests change
  // (covers cases where either updates after allUsers is already populated)
  useEffect(() => {
    if (allUsers.length === 0) return
    const friendIds = new Set(friends.map((f) => String(f.id)))
    const sentRequestUserIds = new Set(
      sentRequests.map((r) => String(r.toUser?.id)).filter(Boolean)
    )
    setAllUsers((prev) =>
      prev.map((u) => {
        const uid = String(u.id)
        const isFriend = friendIds.has(uid)
        const isRequestSent = sentRequestUserIds.has(uid)

        if (isFriend && u.relationshipStatus !== 'friends') return { ...u, relationshipStatus: 'friends' }
        if (!isFriend && u.relationshipStatus === 'friends') return { ...u, relationshipStatus: 'none' }
        if (isRequestSent && u.relationshipStatus !== 'request_sent') return { ...u, relationshipStatus: 'request_sent' }
        if (!isRequestSent && u.relationshipStatus === 'request_sent') return { ...u, relationshipStatus: 'none' }
        return u
      })
    )
  }, [friends, sentRequests]) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: refresh friends list when a FRIEND_ACCEPTED notification arrives
  // (fires for the requester — user B — when their request is accepted)
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`friends_accepted_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_notification',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new?.notification_type === 'FRIEND_ACCEPTED') {
            fetchFriends(user.id)
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, fetchFriends])

  // Realtime: refresh friends list when THIS user accepts a request
  // (the accepter never receives a FRIEND_ACCEPTED notification themselves,
  //  so we watch for the friendrequest row flipping to ACCEPTED instead)
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`friends_i_accepted_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_friendrequest',
          filter: `to_user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new?.status === 'ACCEPTED') {
            fetchFriends(user.id)
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, fetchFriends])

  // Realtime: refresh sent requests when THIS user sends a new friend request
  // (covers cases where the request is sent outside this context, e.g. SwipeStack)
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`sent_requests_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_friendrequest',
          filter: `from_user_id=eq.${user.id}`,
        },
        () => {
          fetchSentRequests(user.id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_friendrequest',
          filter: `from_user_id=eq.${user.id}`,
        },
        () => {
          fetchSentRequests(user.id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_friendrequest',
          filter: `from_user_id=eq.${user.id}`,
        },
        () => {
          fetchSentRequests(user.id)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, fetchSentRequests])

  // Return the current relationship status for a given userId
  const getRelationshipStatus = useCallback(
    (userId) => {
      const user = allUsers.find((u) => u.id === userId)
      return user ? user.relationshipStatus : 'none'
    },
    [allUsers]
  )

  /**
   * updateRelationship(userId, newStatus)
   *
   * Handles all relationship transitions:
   *   sendRequest, cancelRequest, accept, decline, unfriend
   *
   * newStatus matches the relationshipStatus field shape on users:
   *   'none' | 'request_sent' | 'request_received' | 'friends'
   *
   * When connecting to real APIs, replace the setAllUsers/setFriends
   * calls below with fetch() calls that mirror these state transitions.
   */
  const removeFriend = useCallback(
    async (targetUserId) => {
      if (!user?.id) throw new Error('Not authenticated')

      // Snapshot for rollback
      const prevFriends = friendsRef.current
      const removed = prevFriends.find((f) => f.id === targetUserId)

      // Optimistic update
      setFriends((prev) => prev.filter((f) => f.id !== targetUserId))
      setAllUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, relationshipStatus: 'none' } : u))
      )

      try {
        await socialService.removeFriend(user.id, targetUserId)
      } catch (err) {
        // Rollback on failure
        if (removed) {
          setFriends((prev) => [...prev, removed])
          setAllUsers((prev) =>
            prev.map((u) => (u.id === targetUserId ? { ...u, relationshipStatus: 'friends' } : u))
          )
        }
        throw err
      }
    },
    [user?.id]
  )

  const sendFriendRequest = useCallback(async (targetUserId) => {
    if (!user?.id) throw new Error('Not authenticated')

    // Build optimistic sent request stub from allUsers data
    const targetUser = allUsers.find((u) => u.id === targetUserId)
    const optimisticRequest = {
      id: `optimistic-${Date.now()}`,
      createdAt: new Date().toISOString(),
      toUser: targetUser
        ? {
            id: targetUser.id,
            username: targetUser.username || '',
            displayName: targetUser.displayName || '',
            avatarUrl: targetUser.avatarUrl || null,
          }
        : { id: targetUserId, username: '', displayName: '', avatarUrl: null },
    }

    // Optimistic updates
    setAllUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, relationshipStatus: 'request_sent' } : u))
    )
    setSentRequests((prev) => [...prev, optimisticRequest])

    try {
      await socialService.sendFriendRequest(targetUserId)
      // Re-fetch to get the real request ID from the server
      fetchSentRequests(user.id)
    } catch (err) {
      // Rollback
      setAllUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, relationshipStatus: 'none' } : u))
      )
      setSentRequests((prev) => prev.filter((r) => r.id !== optimisticRequest.id))
      throw err
    }
  }, [user?.id, allUsers, fetchSentRequests])

  const cancelSentRequest = useCallback(async (requestId) => {
    const req = sentRequests.find((r) => r.id === requestId) ?? null
    const targetUserId = req?.toUser?.id ?? null

    // Optimistic updates
    setSentRequests((prev) => prev.filter((r) => r.id !== requestId))
    if (targetUserId) {
      setAllUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, relationshipStatus: 'none' } : u))
      )
    }

    try {
      let cancelId = requestId
      // If this is an optimistic request (real ID hasn't arrived from server yet),
      // re-fetch to get the real ID before calling cancel.
      if (String(requestId).startsWith('optimistic-')) {
        if (!user?.id) return
        const fresh = await socialService.getSentFriendRequests(user.id)
        const match = fresh.find(
          (r) => targetUserId && String(r.to_user?.id) === String(targetUserId)
        )
        if (!match) return // request may have already been handled server-side
        cancelId = match.id
      }
      await socialService.cancelFriendRequest(cancelId)
    } catch (err) {
      // Rollback on failure
      if (req) setSentRequests((prev) => [...prev, req])
      if (targetUserId) {
        setAllUsers((prev) =>
          prev.map((u) =>
            u.id === targetUserId ? { ...u, relationshipStatus: 'request_sent' } : u
          )
        )
      }
      throw err
    }
  }, [sentRequests, user?.id])

  const updateRelationship = useCallback((userId, newStatus) => {
    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, relationshipStatus: newStatus } : u
      )
    )

    // Sync the friends list when a user is added or removed
    if (newStatus === 'friends') {
      const user = allUsers.find((u) => u.id === userId)
      if (user && !friends.find((f) => f.id === userId)) {
        setFriends((prev) => [
          ...prev,
          {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            instruments: user.instruments,
            lastActive: new Date().toISOString(),
          },
        ])
      }
    }

    if (newStatus === 'none') {
      setFriends((prev) => prev.filter((f) => f.id !== userId))
    }
  }, [allUsers, friends])

  return (
    <FriendsContext.Provider
      value={{
        friends,
        sentRequests,
        allUsers,
        allUsersLoading,
        allUsersError,
        allUsersFetched,
        fetchFriends,
        fetchAllUsers,
        updateRelationship,
        getRelationshipStatus,
        removeFriend,
        sendFriendRequest,
        cancelSentRequest,
      }}
    >
      {children}
    </FriendsContext.Provider>
  )
}

export function useFriends() {
  const ctx = useContext(FriendsContext)
  if (!ctx) throw new Error('useFriends must be used inside <FriendsProvider>')
  return ctx
}
