// import React from 'react'

// export default function Header() {
//   return (
//     <div className='flex justify-around items-center bg-[#4123d8] text-white h-8 w-full'>
//       <span>QBit!</span>
//       <div>
//         <button>Start New Session</button>
//         <div className='flex flex-col gap-0'>
//           <span>.</span>
//           <span>.</span>
//           <span>.</span>
//         </div>
//       </div>
//     </div>
//   )
// }


// "use client"

import { MoreVertical, X } from "lucide-react"

export default function Header() {

  function handleNewSession() {
    // Logic to start a new session
    console.log("New session started")
  }

  function handleMenuClick() {
    // Logic to open the menu
    console.log("Menu opened")
  }

  function handleClose() {
    // Logic to close the header
    console.log("Header closed")
  }

  return (
    <header className="flex items-center justify-between px-2 py-2" style={{ backgroundColor: "#4123d8" }}>
      <span className="text-white text-lg font-medium ml-1 font-mono">QB it!</span>
      <div className="flex items-center gap-1">
        <div
          onClick={handleNewSession}
          className="bg-white text-[#4123d8] hover:bg-gray-100 hover:text-[#4123d8] font-normal rounded-sm text-xs px-2 py-1 cursor-pointer"
        >
          Start New Session
        </div>
        <div 
          onClick={handleMenuClick} 
          className="text-white hover:bg-[#5438e2] cursor-pointer p-1"
        >
          <MoreVertical className="h-4 w-4" />
        </div>
        <div 
          onClick={handleClose} 
          className="text-white hover:bg-[#5438e2] cursor-pointer p-1"
        >
          <X className="h-4 w-4" />
        </div>
      </div>
    </header>
  )
}
