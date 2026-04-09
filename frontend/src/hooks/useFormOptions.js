/**
 * useFormOptions.js
 *
 * Fetches genres, vibes, and instruments from Supabase and merges them
 * with static hardcoded options (jam types, roles, equipment, skill levels)
 * that don't have DB tables yet.
 *
 * Returns the same shape as the old mock files so all forms work unchanged.
 */

import { useState, useEffect } from 'react'
import { apiService } from '../injectables/apiCalls'

// ─── Static options (no DB table yet) ────────────────────────────────────────

const SKILL_LEVELS = [
  { id: 'beginner',     label: 'Beginner',     value: 'beginner' },
  { id: 'intermediate', label: 'Intermediate', value: 'intermediate' },
  { id: 'advanced',     label: 'Advanced',     value: 'advanced' },
  { id: 'pro',          label: 'Professional', value: 'pro' },
]

const JAM_TYPES = [
  { id: 'open-jam',      label: 'Open Jam',            value: 'open-jam' },
  { id: 'band-practice', label: 'Band Practice',       value: 'band-practice' },
  { id: 'songwriting',   label: 'Songwriting Session', value: 'songwriting' },
  { id: 'recording',     label: 'Recording Session',   value: 'recording' },
  { id: 'performance',   label: 'Live Performance',    value: 'performance' },
  { id: 'workshop',      label: 'Workshop',            value: 'workshop' },
]


// ─── DB row → option item ─────────────────────────────────────────────────────

function toOption(row) {
  return {
    id:    String(row.id),
    label: row.name,
    value: String(row.id),
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFormOptions() {
  const [options, setOptions] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiService.getGenres(),
      apiService.getVibes(),
      apiService.getInstruments(),
      apiService.getRoles(),
      apiService.getGear(),
    ])
      .then(([genres, vibes, instruments, roles, gear]) => {
        setOptions({
          genres:             genres.map(toOption),
          vibes:              vibes.map(toOption),
          instruments:        instruments.map(toOption),
          skillLevels:        SKILL_LEVELS,
          jamTypes:           JAM_TYPES,
          // Roles and gear use numeric DB PKs so Django's set_m2m can save them
          roles:              roles.map(toOption),
          rolesNeeded:        roles.map(toOption),
          lineupRoles:        roles.map(toOption),
          equipmentAvailable: gear.map(toOption),
          equipmentNeeded:    gear.map(toOption),
        })
      })
      .catch((err) => {
        console.error('useFormOptions: failed to load options from DB', err)
        // Leave options as null — modals show a loading/error state
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { options, isLoading }
}
