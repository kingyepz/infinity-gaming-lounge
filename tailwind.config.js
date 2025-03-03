module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#0A192F",    // Deep Blue
        "secondary": "#64FFDA",  // Bright Cyan
        "accent": "#FF595E",     // Red
        "background": "#101010", // Dark Gray
        "text": "#FFFFFF"        // White
      }
    }
  },
  plugins: []
};
