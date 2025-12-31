import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURATION ---
const CONFIG = {
    GRAVITY: 0.08,         // Earth-like gravity pull
    DRAG: 0.96,            // Air resistance (critical for realism)
    TRAIL_LENGTH: 5,       // How many frames of history to keep for trails
    EXPLOSION_FORCE: 5,    // Base force of bursts
    TEXT_SIZE: 140,        // Font size for sampling
    PARTICLE_DENSITY: 4,   // Lower = more particles for text
    DPI: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
};

// --- PALETTE (Noble Gases & Metals) ---
const COLORS = {
    GOLD: { h: 42, s: 100, l: 50 },     // Sodium
    RED: { h: 350, s: 100, l: 60 },     // Strontium
    GREEN: { h: 130, s: 100, l: 60 },   // Barium
    BLUE: { h: 210, s: 100, l: 60 },    // Copper
    VIOLET: { h: 280, s: 100, l: 60 },  // Potassium
    WHITE: { h: 0, s: 0, l: 100 },      // Magnesium (Blinding)
    CYAN: { h: 180, s: 100, l: 60 },
    ORANGE: { h: 25, s: 100, l: 60 }
};

// --- TYPES ---
type Vector = { x: number; y: number };
type ShellType = 'peony' | 'willow' | 'crossette' | 'ghost' | 'text' | 'ring' | 'palm';

export const FireworksDisplay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCredit, setShowCredit] = useState(false);
  const [showFinaleText, setShowFinaleText] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // False for manual clearing control
    if (!ctx) return;

    // --- HIGH DPI SETUP ---
    const setupCanvas = () => {
        canvas.width = window.innerWidth * CONFIG.DPI;
        canvas.height = window.innerHeight * CONFIG.DPI;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.scale(CONFIG.DPI, CONFIG.DPI);
    };
    window.addEventListener('resize', setupCanvas);
    setupCanvas();

    // --- HELPERS ---
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    
    // --- TEXT SAMPLING ENGINE ---
    const getTextPoints = (text: string): Vector[] => {
        const osc = document.createElement('canvas');
        const osctx = osc.getContext('2d');
        if (!osctx) return [];

        const size = CONFIG.TEXT_SIZE;
        osc.width = size * text.length * 1.5; // Enough width
        osc.height = size * 1.5;

        osctx.font = `900 ${size}px "Space Grotesk", sans-serif`;
        osctx.textAlign = 'center';
        osctx.textBaseline = 'middle';
        osctx.fillStyle = 'white';
        osctx.fillText(text, osc.width / 2, osc.height / 2);

        const data = osctx.getImageData(0, 0, osc.width, osc.height).data;
        const points: Vector[] = [];
        
        // Scan grid
        for (let y = 0; y < osc.height; y += CONFIG.PARTICLE_DENSITY) {
            for (let x = 0; x < osc.width; x += CONFIG.PARTICLE_DENSITY) {
                if (data[(y * osc.width + x) * 4 + 3] > 128) {
                    points.push({
                        x: (x - osc.width / 2) * (window.innerWidth < 768 ? 0.8 : 1.5), // Scale for screen
                        y: (y - osc.height / 2) * (window.innerWidth < 768 ? 0.8 : 1.5)
                    });
                }
            }
        }
        return points;
    };

    // --- CLASS: PARTICLE ---
    class Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        history: Vector[];
        hue: number;
        sat: number = 100;
        lit: number;
        alpha: number = 1;
        decay: number;
        type: ShellType;
        
        constructor(x: number, y: number, hue: number, type: ShellType, targetVelocity?: Vector) {
            this.x = x;
            this.y = y;
            this.history = [];
            this.hue = hue;
            this.type = type;

            // Physics Init
            if (targetVelocity) {
                // TEXT MODE: Velocity is pre-calculated to expand into shape
                this.vx = targetVelocity.x;
                this.vy = targetVelocity.y;
                this.decay = rand(0.008, 0.02); // Text burns slightly longer
                this.lit = 80; // Bright
            } else {
                // EXPLOSION MODE
                const angle = rand(0, Math.PI * 2);
                const speed = rand(1, CONFIG.EXPLOSION_FORCE * (type === 'willow' ? 0.6 : 1.0));
                
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                
                // Ring Logic override
                if (type === 'ring') {
                    this.vx = Math.cos(angle) * (CONFIG.EXPLOSION_FORCE * 1.5);
                    this.vy = Math.sin(angle) * (CONFIG.EXPLOSION_FORCE * 1.5) * 0.4; // Flattened 3D ring
                }

                this.decay = rand(0.015, 0.035);
                this.lit = rand(50, 80);
            }

            // Willow/Palm Special
            if (type === 'willow') {
                this.decay = rand(0.005, 0.015);
                this.lit = 50;
                this.sat = 20; // Pale gold
            }
        }

        update() {
            // Physics
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= CONFIG.DRAG;
            this.vy *= CONFIG.DRAG;
            this.vy += CONFIG.GRAVITY;

            // Decay
            this.alpha -= this.decay;
            if (this.type === 'ghost') this.hue += 1; // Color shift

            // History for Trails
            this.history.push({ x: this.x, y: this.y });
            if (this.history.length > CONFIG.TRAIL_LENGTH) this.history.shift();
        }

        draw() {
            if (this.alpha <= 0 || this.history.length < 2) return;

            ctx.beginPath();
            ctx.moveTo(this.history[0].x, this.history[0].y);
            for (const point of this.history) {
                ctx.lineTo(point.x, point.y);
            }
            
            ctx.lineCap = 'round';
            // Willow trails are thicker
            ctx.lineWidth = this.type === 'willow' ? 1.5 : (this.type === 'text' ? 2 : 1.5);
            ctx.strokeStyle = `hsla(${this.hue}, ${this.sat}%, ${this.lit}%, ${this.alpha})`;
            ctx.stroke();
        }
    }

    // --- CLASS: ROCKET ---
    class Rocket {
        x: number;
        y: number;
        targetY: number;
        vx: number;
        vy: number;
        hue: number;
        type: ShellType;
        char?: string;
        dead = false;

        constructor(xPerc: number, yPerc: number, hue: number, type: ShellType, char?: string) {
            this.x = window.innerWidth * xPerc;
            this.y = window.innerHeight;
            this.targetY = window.innerHeight * yPerc;
            this.hue = hue;
            this.type = type;
            this.char = char;

            // Physics: Calculate velocity to reach exact height (v^2 = u^2 + 2as)
            const height = this.y - this.targetY;
            this.vy = -Math.sqrt(2 * (CONFIG.GRAVITY + 0.05) * height) * 1.05; // 1.05 boost to fight drag
            this.vx = (Math.random() - 0.5) * 1.5; // Slight drift
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += CONFIG.GRAVITY;
            this.vx *= 0.99; // Air resistance on rocket body

            // Trail
            if (Math.random() > 0.6) {
                particles.push(new Particle(this.x, this.y, 45, 'willow')); // Gold dust trail
            }

            // Explode condition (Apex or passed target)
            if (this.vy >= -1 || this.y <= this.targetY) {
                this.dead = true;
                this.explode();
            }
        }

        draw() {
            ctx.fillStyle = `hsl(${this.hue}, 100%, 80%)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        explode() {
            // --- TEXT EXPLOSION LOGIC ---
            if (this.type === 'text' && this.char) {
                const points = getTextPoints(this.char);
                
                // Realism Hack: Flash bang first
                for (let i = 0; i < 20; i++) {
                    const p = new Particle(this.x, this.y, COLORS.WHITE.h, 'peony');
                    p.vx *= 3; p.vy *= 3; // Fast flash
                    p.decay = 0.1;
                    particles.push(p);
                }

                // Create Shape
                points.forEach(pt => {
                    const velX = pt.x * 0.06; 
                    const velY = pt.y * 0.06;
                    
                    const p = new Particle(this.x, this.y, this.hue, 'text', { x: velX, y: velY });
                    particles.push(p);
                });
                return;
            }

            // --- STANDARD EXPLOSION LOGIC ---
            const count = this.type === 'ghost' || this.type === 'ring' ? 100 : 200;
            
            for (let i = 0; i < count; i++) {
                if (this.type === 'crossette' && i % 5 !== 0) continue; 
                const p = new Particle(this.x, this.y, this.hue, this.type);
                particles.push(p);
            }
        }
    }

    // --- STATE & LOOP ---
    let rockets: Rocket[] = [];
    let particles: Particle[] = [];
    let frame = 0;

    const fire = (type: ShellType, hue: number, x: number, y: number, char?: string) => {
        rockets.push(new Rocket(x, y, hue, type, char));
    };

    const loop = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 1. Clear with Trail effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; 
        ctx.fillRect(0, 0, width, height);

        // 2. Logic
        rockets.forEach(r => r.update());
        particles.forEach(p => p.update());

        // 3. Render
        ctx.globalCompositeOperation = 'lighter';
        rockets.forEach(r => r.draw());
        particles.forEach(p => p.draw());
        ctx.globalCompositeOperation = 'source-over'; 

        // 4. Cleanup
        rockets = rockets.filter(r => !r.dead);
        particles = particles.filter(p => p.alpha > 0);

        // --- CHOREOGRAPHY (60 FPS) ---
        
        // GLOBAL BACKGROUND FILLER (New: Keeps the sky busy)
        if (frame > 200 && frame < 2200 && frame % 50 === 0) {
            // Random low-altitude bursts to fill gaps
            fire('peony', rand(0, 360), rand(0.1, 0.9), rand(0.5, 0.7));
        }

        // PHASE 1: OPENER (More layers)
        if (frame === 10) {
            fire('palm', COLORS.GOLD.h, 0.5, 0.4);
            // Flanking shots
            fire('peony', COLORS.GOLD.h, 0.2, 0.6);
            fire('peony', COLORS.GOLD.h, 0.8, 0.6);
        }
        if (frame === 60) {
            fire('peony', COLORS.RED.h, 0.3, 0.3);
            fire('peony', COLORS.BLUE.h, 0.7, 0.3);
            fire('crossette', COLORS.WHITE.h, 0.5, 0.2); // Added high center
        }

        // PHASE 2: "2026" (Intensified surroundings)
        if (frame === 180) {
            fire('text', COLORS.CYAN.h, 0.35, 0.3, '2');
            setTimeout(() => fire('text', COLORS.CYAN.h, 0.45, 0.3, '0'), 100);
            setTimeout(() => fire('text', COLORS.CYAN.h, 0.55, 0.3, '2'), 200);
            setTimeout(() => fire('text', COLORS.CYAN.h, 0.65, 0.3, '6'), 300);
            
            // Celebration bursts around text
            setTimeout(() => {
                fire('peony', COLORS.VIOLET.h, 0.2, 0.5);
                fire('peony', COLORS.VIOLET.h, 0.8, 0.5);
            }, 500);
        }

        // PHASE 3: RAMP (Double Density)
        if (frame > 400 && frame < 900) {
            if (frame % 25 === 0) { // Frequency doubled (was 40)
                const x = rand(0.1, 0.9);
                const type = Math.random() > 0.5 ? 'crossette' : 'ghost';
                fire(type, rand(0, 360), x, rand(0.2, 0.5));
            }
            if (frame % 35 === 0) { // Secondary layer
                fire('palm', rand(0, 360), rand(0.1, 0.9), rand(0.3, 0.6));
            }
        }

        // PHASE 4: MESSAGE (With background glitter)
        if (frame === 950) {
            ['H','A','P','P','Y'].forEach((char, i) => fire('text', COLORS.ORANGE.h, 0.2 + (i * 0.15), 0.2, char));
            // Underlighting
            fire('willow', COLORS.GOLD.h, 0.1, 0.6);
            fire('willow', COLORS.GOLD.h, 0.9, 0.6);
        }
        if (frame === 1100) {
            ['N','E','W'].forEach((char, i) => fire('text', COLORS.WHITE.h, 0.35 + (i * 0.15), 0.35, char));
        }
        if (frame === 1250) {
            ['Y','E','A','R'].forEach((char, i) => fire('text', COLORS.GOLD.h, 0.25 + (i * 0.16), 0.5, char));
             // Massive side bursts
             fire('peony', COLORS.RED.h, 0.1, 0.4);
             fire('peony', COLORS.RED.h, 0.9, 0.4);
        }

        // PHASE 5: GRAND FINALE (Wall of Fire)
        if (frame === 1500) {
            fire('willow', COLORS.GOLD.h, 0.2, 0.25);
            fire('willow', COLORS.GOLD.h, 0.5, 0.15);
            fire('willow', COLORS.GOLD.h, 0.8, 0.25);
            // Lower fill
            fire('peony', COLORS.BLUE.h, 0.35, 0.5);
            fire('peony', COLORS.BLUE.h, 0.65, 0.5);
        }

        if (frame === 1700) {
            ['T','H','A','N','K'].forEach((c, i) => fire('text', COLORS.BLUE.h, 0.2 + (i*0.12), 0.3, c));
            setTimeout(() => {
                ['Y','O','U'].forEach((c, i) => fire('text', COLORS.BLUE.h, 0.4 + (i*0.12), 0.5, c));
            }, 500);
            
            // Continuous rain
            for(let i=0; i<5; i++) {
                setTimeout(() => fire('willow', COLORS.GOLD.h, rand(0.1, 0.9), rand(0.1, 0.3)), i * 200);
            }
        }

        // Phase 6: THE EXTENDED FINALE (Extreme Intensity)
        if (frame > 2000 && frame < 2250) {
            if (frame % 8 === 0) { // Extremely high frequency
                const hue = rand(0, 360);
                const x = rand(0.1, 0.9);
                const y = rand(0.1, 0.5);
                fire('peony', hue, x, y);
            }
            if (frame % 20 === 0) {
                fire('ring', rand(0, 360), rand(0.2, 0.8), rand(0.2, 0.4));
            }
        }

        // TEXT OVERLAYS TRIGGERS
        // Made with Gemini: Shorter duration (200 frames -> ~3s)
        if (frame === 2400) setShowCredit(true); 
        if (frame === 2600) setShowCredit(false); 
        
        // Final text
        if (frame === 2850) setShowFinaleText(true); 

        frame++;
        requestAnimationFrame(loop);
    };

    const raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
      <>
        <canvas ref={canvasRef} className="absolute inset-0 z-[100] pointer-events-none" />
        
        {/* TEXT OVERLAY LAYER */}
        <div className="absolute inset-0 z-[110] flex items-center justify-center pointer-events-none">
            <AnimatePresence>
                {showCredit && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="text-center"
                    >
                         {/* Clean, simple, professional font style */}
                         <h2 className="text-2xl md:text-3xl font-light text-slate-200 tracking-wide" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            Made with Gemini
                         </h2>
                    </motion.div>
                )}
                
                {showFinaleText && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.5 }}
                        className="text-center"
                    >
                        <h1 className="text-4xl md:text-6xl text-white font-light tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            See you in 2025.
                        </h1>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </>
  );
};
