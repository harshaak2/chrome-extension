import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Popup from './Popup.jsx'
import Options from './Options.jsx'

// Determine which component to render based on the current HTML file
const renderComponent = () => {
  const pathname = window.location.pathname;
  
  if (pathname.includes('popup.html')) {
    return <Popup />;
  } else if (pathname.includes('options.html')) {
    return <Options />;
  } else {
    // Default fallback
    return <Popup />;
  }
};

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    // {renderComponent()}
    renderComponent()
  // </StrictMode>,
)
