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

  // Keep a ref to friends so fetchAllUsers can read the latest value without
  // needing it as a dependency (which would cause unnecessary re-fetches).
  useEffect(() => {
    friendsRef.current = friends
  }, [friends])

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
      // Read friends from ref so we stamp the correct status immediately,
      // regardless of whether the sync useEffect has fired yet.
      const friendIds = new Set(friendsRef.current.map((f) => String(f.id)))
      setAllUsers(
        raw.map((u) => ({
          ...u,
          relationshipStatus: friendIds.has(String(u.id)) ? 'friends' : 'none',
        }))
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

  // Reset allUsers cache when user changes
  useEffect(() => {
    setAllUsers([])
    setAllUsersFetched(false)
    setAllUsersError(null)
  }, [user?.id])

  // Sync friend relationship status into allUsers whenever friends list changes
  // (covers cases where friends update after allUsers is already populated)
  useEffect(() => {
    if (allUsers.length === 0) return
    const friendIds = new Set(friends.map((f) => String(f.id)))
    setAllUsers((prev) =>
      prev.map((u) => {
        const isFriend = friendIds.has(String(u.id))
        if (isFriend && u.relationshipStatus !== 'friends') return { ...u, relationshipStatus: 'friends' }
        if (!isFriend && u.relationshipStatus === 'friends') return { ...u, relationshipStatus: 'none' }
        return u
      })
    )
  }, [friends]) // eslint-disable-line react-hooks/exhaustive-deps

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

    // Optimistic update
    setAllUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, relationshipStatus: 'request_sent' } : u))
    )

    try {
      await socialService.sendFriendRequest(targetUserId)
    } catch (err) {
      // Rollback
      setAllUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, relationshipStatus: 'none' } : u))
      )
      throw err
    }
  }, [user?.id])

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
      await socialService.cancelFriendRequest(requestId)
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
  }, [sentRequests])

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
