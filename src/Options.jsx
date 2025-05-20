import { useEffect } from 'react'
import './Options.css'

function Options() {
  return (
    <div className="options-container">
      <h1>Welcome to QB at your cursor!</h1>
      <div className="content">
        <p>This extension allows you to quickly process selected text using AI.</p>
        <ol>
          <li>Select text on any webpage</li>
          <li>Click on the QB it extension icon</li>
          <li>Press the Confirm button</li>
          <li>View and copy the AI-processed results</li>
        </ol>
      </div>
    </div>
  )
}

export default Options
