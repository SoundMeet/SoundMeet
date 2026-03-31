import React, { useContext } from 'react'

const Glowbutton = (props) => {
  return (
    <button
        onClick={props.onClick}
        className={`px-4 py-1.5 cursor-pointer rounded-full text-sm font-medium border transition-all duration-300
        ${
            props.isActive
            ? "bg-pink-600 border-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.8),0_0_30px_rgba(236,72,153,0.4)]"
            : "bg-neutral-800 border-neutral-800 text-neutral-300 hover:border-pink-500 hover:text-white"
        }`}
        >
        {props.value}
    </button>
  )
}

export default Glowbutton
