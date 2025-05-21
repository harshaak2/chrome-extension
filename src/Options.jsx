import { useEffect } from 'react'

function Options() {
  return (
    <div className="font-sans max-w-[800px] mx-auto p-5 bg-black text-white min-h-screen bg-black">
      <h1 className="text-white border-b-2 border-[#333] pb-4">Welcome to QB at your cursor!</h1>
      <div className="mt-5">
        <p className="text-base leading-relaxed">This extension allows you to quickly process selected text using AI.</p>
        <ol className="mt-4">
          <li className="mb-2.5">Select text on any webpage</li>
          <li className="mb-2.5">Click on the QB it extension icon</li>
          <li className="mb-2.5">Press the Confirm button</li>
          <li className="mb-2.5">View and copy the AI-processed results</li>
        </ol>
      </div>
    </div>
  )
}

export default Options
