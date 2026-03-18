import React from 'react'
import Navbar from '../components/Navbar'
import MeetCard from '../components/MeetCard'

const Meet = () => {
  return (
    <div className="flex flex-col min-h-screen">
        <Navbar/>
        <main className="flex flex-col px-12 my-4 flex-1">
            <div className="flex justify-between text-3xl">
                <h3>Find Musicians near you</h3>
                <i className="fa-solid fa-gear"></i>
            </div>
            <div className="flex justify-around mt-8">
                <MeetCard/>
                <MeetCard/>
                <MeetCard/>
            </div>
        </main>
        <footer className="flex justify-around bg-slate-50 p-2">
        <div className="bg-slate-500 rounded-full w-5 h-5 flex items-center justify-center">
          <i className="fa-solid fa-play text-white text-[10px]"></i>
        </div>
        </footer>
    </div>
  )
}

export default Meet