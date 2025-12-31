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
    
    // Trigger "Ready?" text sequence with delay
    // User requested "1 second later"
    setTimeout(() => {
        setShowReady(true);
        // Hide "Ready?" after a delay and start fireworks
        setTimeout(() => {
            setShowReady(false);
            setStartFireworks(true);
        }, 2000); 
    }, 2200); // 1s + animation buffer
  };

  return (
    <motion.main 
      className="relative h-screen w-screen overflow-hidden flex flex-col items-center justify-center select-none transition-colors duration-700 ease-in-out"
      animate={{ backgroundColor: isDark ? '#050505' : '#F8F9FA' }}
    >
      
      {/* Background Ambience (Persistent) */}
      <div className="absolute inset-0 z-0">
        <div className={`transition-opacity duration-1000 ${isDark ? 'opacity-20' : 'opacity-100'}`}>
            <SnowParticles />
        </div>
        <motion.div 
            className="absolute inset-0 pointer-events-none"
            animate={{ 
                background: isDark 
                    ? 'linear-gradient(to bottom, #000000 0%, #111111 100%)' 
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

      {/* "Ready?" Dotted Text - Appears after dark - MOVED HIGHER */}
      <AnimatePresence>
        {showReady && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none pb-32" 
          >
             <h1 
                className="text-6xl md:text-8xl font-bold tracking-widest text-center"
                style={{ 
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: 'transparent',
                    // Creates a dotted matrix effect
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1.5px, transparent 2px)',
                    backgroundSize: '5px 5px',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text'
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