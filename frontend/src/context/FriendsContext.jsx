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
 *   POST   /api/follow/{user_id}/
 *   DELETE /api/follow/{user_id}/
 */
import { createContext, useContext, useState, useCallback } from 'react'

const FriendsContext = createContext(null)

export function FriendsProvider({ children }) {
  const [friends, setFriends] = useState([])
  const [allUsers, setAllUsers] = useState([])

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
   *   follow, unfollow, sendRequest, cancelRequest,
   *   accept, decline, unfriend
   *
   * newStatus matches the relationshipStatus field shape on users:
   *   'none' | 'following' | 'follower' | 'request_sent' |
   *   'request_received' | 'friends'
   *
   * When connecting to real APIs, replace the setAllUsers/setFriends
   * calls below with fetch() calls that mirror these state transitions.
   */
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
            isOnline: user.isOnline,
            lastActive: new Date().toISOString(),
          },
        ])
      }
    }

    if (newStatus === 'none' || newStatus === 'following' || newStatus === 'follower') {
      setFriends((prev) => prev.filter((f) => f.id !== userId))
    }
  }, [allUsers, friends])

  return (
    <FriendsContext.Provider
      value={{
        friends,
        allUsers,
        updateRelationship,
        getRelationshipStatus,
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
