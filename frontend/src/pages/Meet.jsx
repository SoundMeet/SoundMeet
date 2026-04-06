import React from 'react'
import Navbar from '../components/Navbar'
import MeetCard from '../components/MeetCard'
import SwipeStack from '../components/SwipeStack'

const Meet = () => {
  return (
    <div className="h-[calc(100vh-4rem)] bg-neutral-950 text-white flex flex-col relative overflow-hidden">
      <SwipeStack/>
    </div>
  )
}

export default Meet