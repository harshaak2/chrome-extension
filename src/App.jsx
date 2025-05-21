import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="max-w-[1280px] mx-auto p-8 text-center">
        <div>
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="h-24 p-6 inline-block transition-[filter] duration-300 hover:drop-shadow-[0_0_2em_#646cffaa]" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img 
              src={reactLogo} 
              className="h-24 p-6 inline-block transition-[filter] duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa] motion-safe:animate-[spin_20s_linear_infinite]" 
              alt="React logo" 
            />
          </a>
        </div>
        <h1 className="text-5xl leading-tight">Vite + React</h1>
        <div className="p-8">
          <button 
            className="rounded-lg border border-transparent px-6 py-2.5 text-base font-medium bg-[#1a1a1a] cursor-pointer transition-[border-color] duration-250 hover:border-[#646cff] focus:outline-[4px] focus:outline-[#646cff]"
            onClick={() => setCount((count) => count + 1)}
          >
            count is {count}
          </button>
          <p className="mt-4">
            Edit <code>src/App.jsx</code> and save to test HMR
          </p>
        </div>
        <p className="text-[#888]">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </>
  )
}

export default App
