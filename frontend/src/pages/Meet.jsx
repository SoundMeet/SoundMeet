import React, { useEffect } from 'react'
import SwipeStack from '../components/SwipeStack'

const Meet = () => {
  // Lock body scroll while on this page — iOS Safari ignores overflow:hidden on divs
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div className="h-[calc(100dvh-4rem)] text-white flex flex-col relative overflow-hidden">
      <SwipeStack/>
    </div>
  )
}

export default Meet