import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SnowParticles from './components/SnowParticles';
import { Showcase } from './components/Showcase';
import { SplashScreen } from './components/SplashScreen';
import { IntroScreen } from './components/IntroScreen';
import { CommunityOutro } from './components/CommunityOutro';
import { LightCord } from './components/LightCord';
import { FireworksDisplay } from './components/FireworksDisplay';
import { PRODUCTS } from './data/products';

export default function App() {
  const [viewState, setViewState] = useState<'splash' | 'transitioning' | 'intro' | 'showcase' | 'outro' | 'ready_for_dark'>('splash');
  const [isDark, setIsDark] = useState(false);
  const [showReady, setShowReady] = useState(false);
  const [startFireworks, setStartFireworks] = useState(false);

  // Handle the sequence transition
  useEffect(() => {
    if (viewState === 'transitioning') {
      const timer = setTimeout(() => {
        setViewState('intro');
      }, 1000); 
      return () => clearTimeout(timer);
    }
    if (viewState === 'intro') {
      const timer = setTimeout(() => {
        setViewState('showcase');
      }, 2500); 
      return () => clearTimeout(timer);
    }
  }, [viewState]);

  // SECRET FEATURE: Press 's' to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If 's' is pressed and we are not yet at the light switch or dark mode
      if (e.key.toLowerCase() === 's' && viewState !== 'ready_for_dark' && !isDark) {
        setViewState('ready_for_dark');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState, isDark]);

  const handleLightsOut = () => {
    setIsDark(true);
    
    // Smooth cinematic sequence
    setTimeout(() => {
        setShowReady(true);
        
        setTimeout(() => {
            setShowReady(false);
            // Slight pause before the bang
            setTimeout(() => {
                setStartFireworks(true);
            }, 500);
        }, 2500); 
    }, 1500); 
  };

  return (
    <motion.main 
      className="relative h-screen w-screen overflow-hidden flex flex-col items-center justify-center select-none transition-colors duration-1000 ease-in-out"
      animate={{ backgroundColor: isDark ? '#000000' : '#F8F9FA' }}
    >
      
      {/* Background Ambience (Persistent) */}
      <div className="absolute inset-0 z-0">
        <div className={`transition-opacity duration-1000 ${isDark ? 'opacity-10' : 'opacity-100'}`}>
            <SnowParticles />
        </div>
        <motion.div 
            className="absolute inset-0 pointer-events-none"
            animate={{ 
                background: isDark 
                    ? 'linear-gradient(to bottom, #000000 0%, #050505 100%)' 
                    : 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(59,130,246,0.1) 100%)'
            }}
        />
      </div>

      {/* Splash Screen Elements */}
      <AnimatePresence>
        {viewState === 'splash' && (
          <SplashScreen onContinue={() => setViewState('transitioning')} />
        )}
      </AnimatePresence>

      {/* Intro Text Sequence ("2025 brings:") */}
      <AnimatePresence>
        {viewState === 'intro' && (
          <IntroScreen />
        )}
      </AnimatePresence>

      {/* The Showcase Sequence */}
      <AnimatePresence>
        {viewState === 'showcase' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1 } }} 
            transition={{ duration: 1.0 }}
            className="absolute inset-0 z-20"
          >
            <Showcase 
              items={PRODUCTS} 
              onFinished={() => setViewState('outro')} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Community / Heart / Celebration Sequence */}
      <AnimatePresence>
        {viewState === 'outro' && (
          <motion.div exit={{ opacity: 0, duration: 0.5 }} className="absolute inset-0 z-30">
             <CommunityOutro onSequenceComplete={() => setViewState('ready_for_dark')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Light Cord - Appears only when asked to turn off lights */}
      <AnimatePresence>
        {viewState === 'ready_for_dark' && !isDark && (
            <motion.div
                initial={{ y: -400 }}
                animate={{ y: 0 }}
                exit={{ y: -400 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="absolute inset-0 z-50 pointer-events-none"
            >
                <div className="pointer-events-auto w-full h-full">
                    <LightCord onPull={handleLightsOut} />
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* "Ready?" Cinematic Text */}
      <AnimatePresence>
        {showReady && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none" 
          >
             <h1 
                className="text-7xl md:text-9xl font-bold tracking-tighter text-center text-white mix-blend-screen"
                style={{ 
                    fontFamily: "'Space Grotesk', sans-serif",
                    textShadow: "0 0 40px rgba(255,255,255,0.5)"
                }}
             >
                READY?
             </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE REALISTIC FIREWORKS SHOW */}
      {startFireworks && <FireworksDisplay />}

    </motion.main>
  );
}