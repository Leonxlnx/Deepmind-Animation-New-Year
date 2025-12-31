import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ProductItem } from '../data/products';

interface ShowcaseProps {
  items: ProductItem[];
  onFinished: () => void;
}

export const Showcase: React.FC<ShowcaseProps> = ({ items, onFinished }) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isGrid, setIsGrid] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Orchestrate the Sequence
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNextCard = (currentCount: number) => {
      if (currentCount >= items.length) {
        // 1. All cards shown. WAIT 2 SECONDS strictly.
        setTimeout(() => {
          
          // 2. Trigger Grid Formation
          setIsGrid(true);
          
          // 3. Grid Hold Time: Hold the grid for a moment so user can see the pattern
          setTimeout(() => {
            setIsExiting(true);

            // 4. Cleanup: Notify App to switch views after animation completes
            setTimeout(() => {
              onFinished();
            }, 2000); 

          }, 4000); 

        }, 2000); // 2 second pause after the 26th card appears
        return;
      }

      // Acceleration Algorithm:
      const progress = currentCount / items.length;
      const maxDelay = 1500; 
      const minDelay = 250; 
      const delay = Math.max(minDelay, maxDelay * Math.pow(0.90, currentCount));

      timeoutId = setTimeout(() => {
        setVisibleCount((prev) => prev + 1);
        scheduleNextCard(currentCount + 1);
      }, delay);
    };

    scheduleNextCard(0);

    return () => clearTimeout(timeoutId);
  }, [items.length, onFinished]);

  return (
    <div className="absolute inset-0 z-20 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
      <div className="relative w-full h-full flex items-center justify-center perspective-container">
        <style>{`
          .perspective-container {
            perspective: 1200px;
          }
        `}</style>

        {/* Render only the visible cards */}
        {items.slice(0, visibleCount).map((item, index) => (
          <FlyingCard 
            key={index} 
            item={item} 
            index={index} 
            total={items.length}
            isGrid={isGrid}
            isExiting={isExiting}
          />
        ))}
        
      </div>
    </div>
  );
};

// --- THE FLYING CARD COMPONENT ---

interface FlyingCardProps {
  item: ProductItem;
  index: number;
  total: number;
  isGrid: boolean;
  isExiting: boolean;
}

const FlyingCard: React.FC<FlyingCardProps> = ({ item, index, total, isGrid, isExiting }) => {
  
  // 1. Random Start Position Calculation
  const initialConfig = useMemo(() => {
    // First card: Center start
    if (index === 0) {
      return { x: 0, y: 0, r: 0, color: 'from-slate-50 to-white' };
    }

    // Other cards: Fly in from random directions
    const angle = Math.random() * Math.PI * 2;
    const distance = 1200; 
    const randomX = Math.cos(angle) * distance;
    const randomY = Math.sin(angle) * distance;
    const randomRotate = (Math.random() - 0.5) * 45; // Subtle rotation during flight
    
    // Very subtle, clean gradients
    const colors = [
      'from-blue-50/40 to-white',
      'from-purple-50/40 to-white',
      'from-emerald-50/40 to-white',
      'from-orange-50/40 to-white',
      'from-rose-50/40 to-white',
    ];
    const color = colors[index % colors.length];

    return { x: randomX, y: randomY, r: randomRotate, color };
  }, [index]);

  // 2. Grid Position Calculation (5x5)
  const gridConfig = useMemo(() => {
    if (index >= 25) return null; // The 26th card (index 25) will not be in the grid

    const col = index % 5;
    const row = Math.floor(index / 5);

    // Calculate offset from center (0,0)
    // Full screen usage: 19vw horizontal, 17vh vertical spacing
    const x = (col - 2) * 19; 
    const y = (row - 2) * 17; 

    return { x, y };
  }, [index]);

  const isFirst = index === 0;

  // Define animation states
  const stackState = {
    x: 0, 
    y: 0, 
    scale: 1, 
    opacity: 1, 
    rotate: 0, 
    z: index,
    filter: "blur(0px)"
  };

  const gridState = useMemo(() => {
    if (index >= 25) {
      // The "and a lot more" card fades out cleaner (blur + slight scale up)
      return { 
        opacity: 0, 
        scale: 1.1, 
        filter: "blur(24px)",
        pointerEvents: 'none'
      };
    }
    return {
      x: `${gridConfig?.x}vw`,
      y: `${gridConfig?.y}vh`,
      scale: 0.36, 
      opacity: 1,
      rotate: 0,
      z: 0,
      filter: "blur(0px)"
    };
  }, [gridConfig, index]);

  // The Exit State ("Creative Evaporation")
  const exitState = useMemo(() => {
    const randomY = -100 - Math.random() * 200; // Float upwards
    const randomRot = (Math.random() - 0.5) * 90;
    
    return {
      x: gridConfig ? gridConfig.x * 2 : 0, // Spread outwards
      y: randomY, // Float up
      scale: 0, // Shrink
      opacity: 0,
      rotate: randomRot,
      filter: "blur(12px)",
      z: -500
    };
  }, [gridConfig]);

  // Determine current active animation state
  let currentState = stackState;
  if (isExiting) currentState = exitState;
  else if (isGrid) currentState = gridState;

  return (
    <motion.div
      className={`absolute backdrop-blur-md border border-white/90 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] rounded-[1.25rem] p-6 w-[65vw] max-w-[460px] aspect-[5/3] flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-br ${initialConfig.color}`}
      
      // Initial State (Fly-in start)
      initial={isFirst ? { 
        scale: 0.9, 
        opacity: 0, 
        y: 20,
        filter: "blur(0px)"
      } : { 
        x: initialConfig.x, 
        y: initialConfig.y, 
        scale: 1.2, 
        opacity: 0, 
        rotate: initialConfig.r,
        z: 200,
        filter: "blur(0px)"
      }}

      // Animate based on mode
      animate={currentState}

      // Physics
      transition={{ 
        type: "spring", 
        damping: isExiting ? 40 : (isGrid ? 32 : 28), 
        stiffness: isExiting ? 40 : (isGrid ? 55 : 140), 
        mass: 1,
        // Calculate delays based on state
        delay: isExiting 
          ? index * 0.02 // Rapid stagger for exit
          : (isGrid ? (index === 25 ? 0 : index * 0.015) : 0.02)
      }}
      style={{ 
        zIndex: isGrid ? 10 : index, 
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center justify-center h-full w-full transition-opacity duration-500 ${isGrid ? 'opacity-100' : 'opacity-100'}`}>
        
        {/* Number - Top right */}
        <span className="text-[32px] font-bold text-slate-100/80 select-none leading-none absolute top-0 right-0">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="flex flex-col items-center justify-center gap-3 w-full px-4">
          <h2 
            className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight leading-none"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {item.title}
          </h2>

          <div className="h-0.5 w-8 bg-slate-200 rounded-full" />

          <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[320px]">
            {item.desc}
          </p>
        </div>
      </div>
      
    </motion.div>
  );
};