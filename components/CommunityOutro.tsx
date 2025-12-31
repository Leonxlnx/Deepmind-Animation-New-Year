import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleHeart } from './GoogleHeart';

interface CommunityOutroProps {
  onSequenceComplete: () => void; // Triggers the light cord appearance
}

export const CommunityOutro: React.FC<CommunityOutroProps> = ({ onSequenceComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // 1. "Behind the breakthroughs"
    const t1 = setTimeout(() => setStep(1), 500);
    
    // 2. "Are the minds"
    const t2 = setTimeout(() => setStep(2), 3500);
    
    // 3. Final List (Researchers/Engineers/Community)
    const t3 = setTimeout(() => setStep(3), 6500);
    
    // 4. Fade out text
    const t4 = setTimeout(() => setStep(4), 12500);
    
    // 5. Show Heart
    const t5 = setTimeout(() => setStep(5), 14000);
    
    // 6. Fade out Heart
    const t6 = setTimeout(() => setStep(6), 18000);
    
    // 7. "Let's celebrate"
    const t7 = setTimeout(() => setStep(7), 19500);
    
    // 8. "With fireworks"
    const t8 = setTimeout(() => setStep(8), 23500);
    
    // 9. "Turn off lights"
    const t9 = setTimeout(() => {
        setStep(9);
        onSequenceComplete();
    }, 28000);

    return () => {
      [t1, t2, t3, t4, t5, t6, t7, t8, t9].forEach(clearTimeout);
    };
  }, [onSequenceComplete]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
      <AnimatePresence mode="wait">
        
        {/* --- PROFESSIONAL TEXT PHASE --- */}

        {/* STEP 1: Intro phrase Part 1 */}
        {step === 1 && (
          <motion.h2
            key="step1"
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-3xl md:text-5xl font-light text-slate-600 tracking-tight text-center max-w-4xl px-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Behind every breakthrough...
          </motion.h2>
        )}

        {/* STEP 2: Intro phrase Part 2 */}
        {step === 2 && (
          <motion.h2
            key="step2"
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-3xl md:text-5xl font-light text-slate-800 tracking-tight text-center max-w-4xl px-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            ...are the minds that dream them.
          </motion.h2>
        )}

        {/* STEP 3: The Dedication List */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(15px)" }}
            transition={{ duration: 1.5 }}
            className="flex flex-col items-center justify-center space-y-12 text-center"
          >
            <div className="space-y-6">
              <RevealText delay={0.2} className="text-lg md:text-xl text-slate-500 font-medium tracking-wide uppercase">
                To the
              </RevealText>
              
              <div className="flex flex-col gap-4">
                <RevealText delay={0.6} className="text-4xl md:text-6xl text-slate-800 font-light tracking-tighter" font="'Space Grotesk', sans-serif">
                  Researchers
                </RevealText>
                <RevealText delay={1.0} className="text-4xl md:text-6xl text-slate-800 font-light tracking-tighter" font="'Space Grotesk', sans-serif">
                  Engineers
                </RevealText>
                <RevealText delay={1.4} className="text-4xl md:text-6xl text-slate-800 font-light tracking-tighter" font="'Space Grotesk', sans-serif">
                  & Community
                </RevealText>
              </div>
            </div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 2.0, duration: 1.5, ease: "circOut" }}
              className="w-24 h-px bg-slate-300"
            />

            <RevealText delay={2.5} className="text-base md:text-lg text-slate-400 font-normal">
              Thank you for building the future.
            </RevealText>

          </motion.div>
        )}

        {/* --- EMOTIONAL HEART PHASE --- */}

        {step === 5 && (
            <motion.div
                key="heart"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2, filter: "blur(20px)" }}
                transition={{ duration: 1.5 }}
            >
                <GoogleHeart />
            </motion.div>
        )}

        {/* --- CELEBRATION TEXT PHASE --- */}

        {step === 7 && (
            <motion.h1
                key="celebrate"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1.5 }}
                className="text-3xl md:text-5xl font-light text-slate-800 text-center"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
                Let's celebrate the new year...
            </motion.h1>
        )}

        {/* CLEANER, MORE PROFESSIONAL FIREWORKS TEXT */}
        {step === 8 && (
            <motion.div
                key="fireworks-text"
                initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
            >
                <h1 
                    className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                    WITH FIREWORKS.
                </h1>
            </motion.div>
        )}

        {step === 9 && (
            <motion.div
                key="lights"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2 }}
                className="text-center space-y-4"
            >
                <h2 className="text-xl text-slate-500 font-light tracking-widest uppercase">
                    But first
                </h2>
                <h1 className="text-4xl md:text-6xl text-slate-800 font-medium" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Turn off the lights.
                </h1>
            </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

const RevealText: React.FC<{ children: React.ReactNode; delay: number; className?: string; font?: string }> = ({ 
  children, delay, className, font 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    transition={{ delay, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    className={className}
    style={{ fontFamily: font }}
  >
    {children}
  </motion.div>
);
