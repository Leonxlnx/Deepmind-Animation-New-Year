import React from 'react';
import { motion } from 'framer-motion';
import { DeepMindLogo } from './DeepMindLogo';
import { ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onContinue: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  // Ultra-smooth easing curve for premium feel
  const smoothEase = [0.22, 1, 0.36, 1];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between py-12 md:py-20 z-10">
      {/* Top: Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -30, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ 
          opacity: 0, 
          y: -40, 
          filter: "blur(20px)",
          transition: { duration: 1.2, ease: "easeInOut" } 
        }}
        transition={{ duration: 2.0, ease: smoothEase }}
      >
        <DeepMindLogo className="opacity-90" />
      </motion.div>

      {/* Center: Main Text */}
      <div className="flex flex-col items-center justify-center space-y-8">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.92, filter: "blur(15px)", y: 20 }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
          exit={{ 
            scale: 1.05, 
            opacity: 0,
            filter: "blur(30px)",
            transition: { duration: 1.5, ease: "easeInOut" }
          }}
          transition={{ duration: 2.2, ease: smoothEase, delay: 0.3 }}
          className="text-4xl md:text-6xl lg:text-7xl font-light text-slate-800 tracking-tighter text-center"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          what a 2025.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "6rem" }}
          exit={{ 
            width: 0, 
            opacity: 0, 
            transition: { duration: 1.0, ease: "easeInOut" } 
          }}
          transition={{ duration: 1.8, ease: smoothEase, delay: 1.0 }}
          className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"
        />
      </div>

      {/* Bottom: Continue Button */}
      <motion.div 
        initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ 
          opacity: 0, 
          y: 30, 
          filter: "blur(20px)", 
          transition: { duration: 1.0, ease: "easeInOut" } 
        }}
        transition={{ duration: 2.0, ease: smoothEase, delay: 1.8 }}
      >
        <button 
          className="group relative flex items-center gap-3 px-8 py-4 bg-white/80 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full 
                    hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:bg-white/90 hover:scale-[1.02] transition-all duration-700 ease-out cursor-pointer"
          onClick={onContinue}
        >
          <span className="text-slate-600 font-medium tracking-widest text-xs uppercase opacity-80 group-hover:opacity-100 transition-opacity">Continue</span>
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors duration-500">
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-500" />
          </div>
        </button>
      </motion.div>
    </div>
  );
};