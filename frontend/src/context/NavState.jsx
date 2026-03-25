import navContext from "./NavContext";
import React, { useState } from 'react'

const NavState = ({children}) => {
  const [activePill, setActivePill] = useState("All")
  return (
    <navContext.Provider value={{activePill,setActivePill}}>
      {children}
    </navContext.Provider>
  )
}

export default NavState
