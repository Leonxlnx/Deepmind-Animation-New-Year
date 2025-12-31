import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';

interface LightCordProps {
  onPull: () => void;
}

export const LightCord: React.FC<LightCordProps> = ({ onPull }) => {
  const [hasPulled, setHasPulled] = useState(false);
  
  const y = useMotionValue(0);
  // Heavy spring for realistic rope feel
  const ySpring = useSpring(y, { stiffness: 400, damping: 15 });
  
  // The resting length of the rope (handle position from top)
  const initialLength = 100; 

  // Create a string path that bends based on the drag
  const pathD = useTransform(ySpring, (latest) => {
    // Start at top center (10, 0) -> Curve Control Point -> Handle (10, length + drag)
    return `M 10 0 Q 10 ${latest / 2} 10 ${initialLength + latest}`;
  });

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y > 60 && !hasPulled) {
        // Trigger haptic if available
        if (navigator.vibrate) navigator.vibrate(50);
        
        setHasPulled(true);
        onPull();
    }
  };

  return (
    <div className="absolute top-0 right-[10%] z-50 flex flex-col items-center w-24">
      <AnimatePresence>
        {!hasPulled && (
          <motion.div
            key="cord-container"
            initial={{ y: -400 }}
            animate={{ y: 0 }}
            exit={{ y: -600, transition: { duration: 0.4, ease: "backIn" } }} // Retracts up
            className="relative w-full flex flex-col items-center"
          >
            {/* SVG Rope - Positioned Absolutely to not affect layout flow */}
            <svg width="20" height="600" className="absolute top-0 left-1/2 -translate-x-1/2 overflow-visible pointer-events-none">
              <motion.path
                d={pathD}
                fill="none"
                stroke="#334155" // Slate-700
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            
            {/* The Handle / Knob */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 200 }}
              dragElastic={0.4}
              onDragEnd={handleDragEnd}
              style={{ y: ySpring, marginTop: initialLength }} 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10 w-6 h-12 bg-gradient-to-b from-slate-700 to-slate-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center border-t border-slate-500"
            >
              <div className="w-4 h-1 bg-slate-600 rounded-full opacity-50" />
            </motion.div>
            
            {/* Text Label - Positioned relative to the rope/handle area */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute pointer-events-none text-xs text-slate-400 font-mono tracking-widest opacity-50 uppercase -rotate-90 origin-center whitespace-nowrap"
              style={{ 
                top: initialLength - 60, // Positioned along the rope, above the handle
                left: -10 // Slight offset to align optically
              }} 
            >
              Pull to dim
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};