import React from 'react';

// The main App component which acts as the loader.
// All logic and components are kept in this single file as per the instructions.
const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-600">
      {/* Container for the loader animation */}
      <div className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80">
        {/* Rocket SVG */}
        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 animate-pulse-rocket"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M50 0 L65 80 L50 70 L35 80 Z"
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M50 70 L50 90 A15 15 0 0 1 35 90"
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="50" r="10" fill="#1d4ed8" />
          <path
            d="M40 85 L35 90 M60 85 L65 90"
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Orbiting circles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full bg-blue-400 animate-orbit-1" />
          <div className="absolute top-1/2 right-1/4 w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full bg-blue-400 animate-orbit-2" />
          <div className="absolute bottom-1/4 left-1/2 w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full bg-orange-400 animate-orbit-3" />
        </div>
      </div>
      
      {/* CSS for animations */}
      <style>
        {`
        @keyframes pulse-rocket {
          0%, 100% {
            transform: translate(-50%, -50%) translateY(0);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-10px);
          }
        }
        
        @keyframes orbit-1 {
          0%, 100% { transform: translate(-25%, -25%) scale(1); opacity: 1; }
          50% { transform: translate(-5%, -5%) scale(1.2); opacity: 0.8; }
        }
        
        @keyframes orbit-2 {
          0%, 100% { transform: translate(25%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(5%, -10%) scale(1.2); opacity: 0.8; }
        }
        
        @keyframes orbit-3 {
          0%, 100% { transform: translate(0, 25%) scale(1); opacity: 1; }
          50% { transform: translate(-10%, 5%) scale(1.2); opacity: 0.8; }
        }
        
        .animate-pulse-rocket {
          animation: pulse-rocket 1.5s ease-in-out infinite;
        }

        .animate-orbit-1 {
          animation: orbit-1 2s ease-in-out infinite alternate;
        }

        .animate-orbit-2 {
          animation: orbit-2 2.5s ease-in-out infinite alternate;
        }

        .animate-orbit-3 {
          animation: orbit-3 3s ease-in-out infinite alternate;
        }
        `}
      </style>
    </div>
  );
};

export default App;
