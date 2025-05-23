import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Popup from './Popup.jsx'
import Options from './Options.jsx'
import LookupPopup from './LookupPopup.jsx'

// Determine which component to render based on the current HTML file
const renderComponent = () => {
  const pathname = window.location.pathname;
  console.log('Current pathname:', pathname);
  
  if (pathname.includes('popup.html')) {
    return <Popup />;
  } else if (pathname.includes('options.html')) {
    return <Options />;
  } else if (pathname.includes('lookup.html')) {
    return <LookupPopup />;
  } else {
    // Default fallback
    console.log('No matching component found, falling back to Popup');
    return <Popup />;
  }
};

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    // {renderComponent()}
    renderComponent()
  // </StrictMode>,
)
