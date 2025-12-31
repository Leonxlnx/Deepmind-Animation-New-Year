import React from 'react';
import { motion } from 'framer-motion';

export const GoogleHeart: React.FC = () => {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.4, type: "spring", duration: 2, bounce: 0 },
        opacity: { delay: i * 0.4, duration: 0.01 }
      }
    })
  };

  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
      <motion.svg
        width="100%"
        height="100%"
        viewBox="0 0 24 24"
        initial="hidden"
        animate="visible"
        className="w-full h-full drop-shadow-2xl"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 
           Heart Structure:
           Standard Heart Path: M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z
           Broken into 4 segments roughly corresponding to quadrants.
        */}

        {/* 1. BLUE: Top Left Curve */}
        <motion.path
          d="M 12 6 C 10.5 3.5 7.5 3 5 4 C 2.5 5 2 8 2 8.5 C 2 10.5 3 12.5 5 14.5"
          stroke="#4285F4"
          custom={0}
          variants={draw}
        />

        {/* 2. RED: Top Right Curve */}
        <motion.path
          d="M 12 6 C 13.5 3.5 16.5 3 19 4 C 21.5 5 22 8 22 8.5 C 22 10.5 21 12.5 19 14.5"
          stroke="#EA4335"
          custom={1}
          variants={draw}
        />

        {/* 3. YELLOW: Bottom Right to Center */}
        <motion.path
          d="M 19 14.5 C 16 17.5 13 20 12 21.35"
          stroke="#FBBC05"
          custom={2}
          variants={draw}
        />

        {/* 4. GREEN: Bottom Left to Center */}
        <motion.path
          d="M 5 14.5 C 8 17.5 11 20 12 21.35"
          stroke="#34A853"
          custom={3}
          variants={draw}
        />
        
      </motion.svg>
    </div>
  );
};