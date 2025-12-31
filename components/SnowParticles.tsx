import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

const SnowParticles: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate static particle data on mount to avoid re-renders
    const count = 40;
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100, // percentage
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 20, // slow falling
        size: 4 + Math.random() * 6,
        opacity: 0.2 + Math.random() * 0.3,
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-slate-300 blur-[1px]"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          initial={{ top: -20 }}
          animate={{
            top: '110vh',
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

export default SnowParticles;