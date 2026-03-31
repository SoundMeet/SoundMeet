/**
 * AppDropdown
 *
 * A reusable floating dropdown shell. Handles:
 *   – Outside-click detection (closes dropdown)
 *   – Escape key (closes dropdown)
 *   – Framer Motion enter/exit animation
 *   – Right or left alignment relative to the trigger
 *
 * Usage:
 *   <AppDropdown
 *     trigger={<MyTriggerButton onClick={toggle} />}
 *     isOpen={isOpen}
 *     onClose={close}
 *     align="right"
 *   >
 *     <MyMenuContent />
 *   </AppDropdown>
 *
 * The trigger element is responsible for calling its own toggle handler.
 * AppDropdown only handles closing (outside click / Escape).
 */
import { useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const PANEL_STYLES = {
  background: 'rgba(18, 18, 18, 0.96)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  borderRadius: '16px',
  boxShadow:
    '0 16px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06), 0 0 32px rgba(220,46,115,0.04)',
}

const PANEL_VARIANTS = {
  hidden: { opacity: 0, scale: 0.96, y: -6 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit:    { opacity: 0, scale: 0.96, y: -6 },
}

export default function AppDropdown({
  trigger,
  children,
  isOpen,
  onClose,
  align = 'right',
  minWidth = 220,
}) {
  const containerRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen, onClose])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger renders as-is; its own onClick toggles the dropdown */}
      {trigger}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            aria-orientation="vertical"
            variants={PANEL_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.14, ease: [0.25, 0.1, 0.25, 1] }}
            className={`absolute top-full mt-2.5 z-50 ${align === 'right' ? 'right-0' : 'left-0'}`}
            style={{ ...PANEL_STYLES, minWidth }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
