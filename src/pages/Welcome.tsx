import React from "react";
import { useNavigate } from "react-router-dom";

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-text relative overflow-hidden bg-gradient-to-b from-dark to-darker">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,#6F42C1_0%,#FF4D4D_50%,transparent_70%)]"></div>
      <div className="max-w-4xl mx-auto p-5 text-center z-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-light mb-4">Infinity Gaming Lounge</h1>
        <p className="text-base sm:text-lg md:text-xl text-text/70 max-w-xs sm:max-w-md md:max-w-2xl mb-8">
          The ultimate gaming lounge management system. Track, manage, and optimize your gaming center with our powerful POS solution.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => navigate("/register")}
            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded hover:brightness-110 transition-all text-sm sm:text-base"
          >
            Get Started
          </button>
          <button
            onClick={() => console.log("Learn More clicked")}
            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-transparent border border-accent text-accent font-semibold rounded hover:bg-accent hover:text-dark transition-all text-sm sm:text-base"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
