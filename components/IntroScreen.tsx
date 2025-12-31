import React from 'react';
import { motion } from 'framer-motion';

export const IntroScreen: React.FC = () => {
  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h2 
        initial={{ scale: 0.9, opacity: 0, filter: "blur(12px)", y: 20 }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)", y: 0 }}
        exit={{ scale: 1.1, opacity: 0, filter: "blur(12px)", y: -20 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl md:text-5xl font-light text-slate-800 tracking-tight"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        2025 brought:
      </motion.h2>
    </motion.div>
  );
};
