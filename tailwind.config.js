export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "background": "#1A1A1A", // Dark gray
        "primary": "#6F42C1",    // Purple (was #00D4FF)
        "secondary": "#FF4D4D",  // Red (was #00FF85)
        "accent": "#00E6E6",     // Cyan (was #FF3366)
        "accent-alt": "#00FFAA", // Green
        "text": "#E0E0E0",       // Light gray
        "dark": "#121212",       // Darker gray
        "darker": "#0A0A0A"      // Near black
      }
    }
  },
  plugins: []
};
