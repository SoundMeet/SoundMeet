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

const ROLES = [
  { id: 'lead-guitarist',        label: 'Lead Guitarist',        value: 'lead-guitarist' },
  { id: 'rhythm-guitarist',      label: 'Rhythm Guitarist',      value: 'rhythm-guitarist' },
  { id: 'bassist',               label: 'Bassist',               value: 'bassist' },
  { id: 'drummer',               label: 'Drummer',               value: 'drummer' },
  { id: 'vocalist',              label: 'Vocalist',              value: 'vocalist' },
  { id: 'backing-vocalist',      label: 'Backing Vocalist',      value: 'backing-vocalist' },
  { id: 'keyboardist',           label: 'Keyboardist',           value: 'keyboardist' },
  { id: 'saxophonist',           label: 'Saxophonist',           value: 'saxophonist' },
  { id: 'trumpeter',             label: 'Trumpeter',             value: 'trumpeter' },
  { id: 'violinist',             label: 'Violinist',             value: 'violinist' },
  { id: 'dj',                    label: 'DJ',                    value: 'dj' },
  { id: 'producer',              label: 'Producer',              value: 'producer' },
  { id: 'sound-engineer',        label: 'Sound Engineer',        value: 'sound-engineer' },
  { id: 'beat-maker',            label: 'Beat Maker',            value: 'beat-maker' },
  { id: 'mc',                    label: 'MC / Host',             value: 'mc' },
  { id: 'multi-instrumentalist', label: 'Multi-Instrumentalist', value: 'multi-instrumentalist' },
]

const EQUIPMENT_AVAILABLE = [
  { id: 'guitar-amp',       label: 'Guitar Amp',       value: 'guitar-amp' },
  { id: 'bass-amp',         label: 'Bass Amp',         value: 'bass-amp' },
  { id: 'pa-system',        label: 'PA System',        value: 'pa-system' },
  { id: 'mixer',            label: 'Mixer',            value: 'mixer' },
  { id: 'mics',             label: 'Mics',             value: 'mics' },
  { id: 'mic-stands',       label: 'Mic Stands',       value: 'mic-stands' },
  { id: 'cables',           label: 'Cables',           value: 'cables' },
  { id: 'power-strips',     label: 'Power Strips',     value: 'power-strips' },
  { id: 'drum-kit',         label: 'Drum Kit',         value: 'drum-kit' },
  { id: 'keyboard-stand',   label: 'Keyboard Stand',   value: 'keyboard-stand' },
  { id: 'di-box',           label: 'DI Box',           value: 'di-box' },
  { id: 'monitor-speakers', label: 'Monitor Speakers', value: 'monitor-speakers' },
  { id: 'audio-interface',  label: 'Audio Interface',  value: 'audio-interface' },
  { id: 'recording-setup',  label: 'Recording Setup',  value: 'recording-setup' },
]

const EQUIPMENT_NEEDED = [
  { id: 'amp',              label: 'Amp',              value: 'amp' },
  { id: 'mic',              label: 'Mic',              value: 'mic' },
  { id: 'xlr-cable',        label: 'XLR Cable',        value: 'xlr-cable' },
  { id: 'instrument-cable', label: 'Instrument Cable', value: 'instrument-cable' },
  { id: 'extension-cord',   label: 'Extension Cord',   value: 'extension-cord' },
  { id: 'drumsticks',       label: 'Drumsticks',       value: 'drumsticks' },
  { id: 'pedalboard',       label: 'Pedalboard',       value: 'pedalboard' },
  { id: 'di-box',           label: 'DI Box',           value: 'di-box' },
  { id: 'keyboard',         label: 'Keyboard / Synth', value: 'keyboard' },
  { id: 'laptop',           label: 'Laptop',           value: 'laptop' },
  { id: 'audio-interface',  label: 'Audio Interface',  value: 'audio-interface' },
  { id: 'headphones',       label: 'Headphones',       value: 'headphones' },
]

// ─── DB row → option item ─────────────────────────────────────────────────────

function toOption(row) {
  return {
    id:    String(row.id),
    label: row.name,
    value: String(row.id),
  }
}

function toInstrumentOption(row) {
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
    ])
      .then(([genres, vibes, instruments]) => {
        setOptions({
          genres:             genres.map(toOption),
          vibes:              vibes.map(toOption),
          instruments:        instruments.map(toInstrumentOption),
          skillLevels:        SKILL_LEVELS,
          jamTypes:           JAM_TYPES,
          roles:              ROLES,
          rolesNeeded:        ROLES,
          lineupRoles:        ROLES,
          equipmentAvailable: EQUIPMENT_AVAILABLE,
          equipmentNeeded:    EQUIPMENT_NEEDED,
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
