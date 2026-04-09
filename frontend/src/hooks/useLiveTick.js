/**
 * useLiveTick — shared 60-second ticker for live timestamp re-renders.
 *
 * One setInterval is created at module level and shared across all callers.
 * No matter how many NotificationItem components are mounted, only one timer runs.
 */
import { useState, useEffect } from 'react'

const subscribers = new Set()
let tickerId = null

function ensureTicker() {
  if (tickerId !== null) return
  tickerId = setInterval(() => {
    subscribers.forEach((fn) => fn())
  }, 60_000)
}

function cleanupTicker() {
  if (subscribers.size === 0 && tickerId !== null) {
    clearInterval(tickerId)
    tickerId = null
  }
}

export function useLiveTick() {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const tick = () => forceUpdate((n) => n + 1)
    subscribers.add(tick)
    ensureTicker()
    return () => {
      subscribers.delete(tick)
      cleanupTicker()
    }
  }, [])
}
