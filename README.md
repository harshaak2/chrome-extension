# QB it - Chrome Extension with React

This Chrome extension has been migrated from vanilla HTML/JS to React for a better development experience.

## Installation & Testing

1. Build the extension:
   ```
   npm run build:extension
   ```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the `dist` folder in this project
   - The extension should now be loaded and ready to use

3. Development workflow:
   - Make changes to the React files in `src` directory
   - Run `npm run build:extension` to build the extension
   - Click the refresh icon on the extension in Chrome's extension page to update it

## Project Structure

- `src/` - Contains all React components and logic
  - `Popup.jsx` - The extension popup UI
  - `Options.jsx` - The options page UI
  - `api.js` - API calls and related functionality
  
- `public/` - Contains static files that are copied as-is to the build
  - `manifest.json` - Chrome extension manifest
  - `background.js` - Background script for the extension
  - `content.js` - Content script that runs on web pages

- `dist/` - Build output directory (generated after build)
