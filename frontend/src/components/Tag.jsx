import React from 'react'

const Tag = ({tag}) => {
  return (
    <div className="bg-slate-500 rounded-full text-[10px] h-5 flex items-center justify-center px-2">{tag}</div>
  )
}

export default Tag