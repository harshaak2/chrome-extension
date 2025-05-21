/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./options.html",
    "./popup.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin': 'spin 20s linear infinite',
      },
    },
  },
  plugins: [],
}
