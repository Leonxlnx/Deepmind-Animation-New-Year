import React, { useEffect, useRef } from 'react';

// --- CONFIGURATION ---
const PHYSICS = {
    friction: 0.95, // High air resistance (Drag) causes them to "stop" mid-air then drift
    gravity: 0.035, // Very low gravity for a slow, floating fall
};

// --- COLORS ---
const COLORS = {
    GOLD: { h: 45, s: 100, l: 50 },
    WHITE: { h: 0, s: 0, l: 100 },
};

export const FireworksDisplay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // --- UTILS ---
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    // --- TEXT BITMAP GENERATOR ---
    const getTextParticleCoordinates = (text: string, fontSize: number = 180): {x: number, y: number}[] => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return [];

        tempCanvas.width = fontSize * 1.5;
        tempCanvas.height = fontSize * 1.5;
        
        tempCtx.font = `900 ${fontSize}px "Space Grotesk", sans-serif`;
        tempCtx.fillStyle = 'white';
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);

        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        const points: {x: number, y: number}[] = [];
        const step = 4; 

        for (let y = 0; y < tempCanvas.height; y += step) {
            for (let x = 0; x < tempCanvas.width; x += step) {
                if (data[(y * tempCanvas.width + x) * 4 + 3] > 128) {
                    points.push({
                        x: x - tempCanvas.width / 2,
                        y: y - tempCanvas.height / 2
                    });
                }
            }
        }
        return points;
    };

    // --- PHYSICS CLASSES ---

    class Particle {
        x: number;
        y: number;
        prevX: number;
        prevY: number;
        vx: number;
        vy: number;
        alpha: number;
        hue: number;
        sat: number;
        light: number;
        decay: number;

        constructor(x: number, y: number, vx: number, vy: number, hue: number, sat: number, light: number) {
            this.x = x;
            this.y = y;
            this.prevX = x;
            this.prevY = y;
            this.vx = vx;
            this.vy = vy;
            this.hue = hue;
            this.sat = sat;
            this.light = light;
            this.alpha = 1;
            // Slower decay = particles last longer on screen
            this.decay = rand(0.004, 0.010); 
        }

        update() {
            this.prevX = this.x;
            this.prevY = this.y;
            
            // Apply Physics
            this.vx *= PHYSICS.friction;
            this.vy *= PHYSICS.friction;
            this.vy += PHYSICS.gravity;
            
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }

        draw(ctx: CanvasRenderingContext2D) {
            ctx.lineWidth = 2.0; 
            ctx.strokeStyle = `hsla(${this.hue}, ${this.sat}%, ${this.light}%, ${this.alpha})`;
            
            // Motion Blur Trail
            ctx.beginPath();
            ctx.moveTo(this.prevX, this.prevY);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
        }
    }

    class Rocket {
        x: number;
        y: number;
        targetY: number;
        vy: number;
        vx: number;
        hue: number;
        sat: number;
        light: number;
        exploded: boolean;
        type: 'peony' | 'text';
        textChar?: string;

        constructor(x: number, targetY: number, hue: number, sat: number, light: number, type: 'peony' | 'text' = 'peony', textChar?: string) {
            this.x = x;
            this.y = canvas!.height;
            this.targetY = targetY;
            this.hue = hue;
            this.sat = sat;
            this.light = light;
            this.type = type;
            this.textChar = textChar;
            this.exploded = false;
            
            // Slower Ascent Physics
            // Lower launch speed (-10 instead of -12) and lower gravity influence in update
            this.vy = -10 - rand(0, 2); 
            this.vx = rand(-0.3, 0.3); // Minimal drift
        }

        update() {
            // Slower gravity on rocket so it reaches the target height despite lower speed
            this.vy += 0.12; 
            this.x += this.vx;
            this.y += this.vy;

            // Explode when slowing down significantly or hitting target height
            if (this.vy >= -0.5 || this.y <= this.targetY) {
                this.explode();
            }
        }

        draw(ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = `hsl(${this.hue}, ${this.sat}%, 70%)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Faint trail
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = `hsl(${this.hue}, ${this.sat}%, 50%)`;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.vx * 4, this.y - this.vy * 4);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        explode() {
            this.exploded = true;

            if (this.type === 'peony') {
                // Realistic Spread:
                // Higher power + High Friction = Fast burst that hangs in air
                const power = rand(5, 9); 
                const count = 150; 

                for (let i = 0; i < count; i++) {
                    const a = rand(0, Math.PI * 2); // Random Angle
                    // Power distribution: Biased slightly towards outer edge for definition, but filled
                    const s = Math.pow(Math.random(), 0.5) * power; 
                    
                    const vx = Math.cos(a) * s;
                    const vy = Math.sin(a) * s;
                    
                    // Add subtle flicker/sparkle variety to hue
                    const h = this.hue + rand(-10, 10);
                    particles.push(new Particle(this.x, this.y, vx, vy, h, this.sat, this.light));
                }

            } else if (this.type === 'text' && this.textChar) {
                const points = getTextParticleCoordinates(this.textChar);
                points.forEach(p => {
                    const vx = p.x * 0.05 + rand(-0.2, 0.2);
                    const vy = p.y * 0.05 + rand(-0.2, 0.2);
                    particles.push(new Particle(this.x, this.y, vx, vy, this.hue, this.sat, this.light));
                });
            }
        }
    }

    let rockets: Rocket[] = [];
    let particles: Particle[] = [];
    let frame = 0;

    const animate = () => {
        // --- 1. Trail Fade Effect ---
        // Slower fade (0.15) for longer trails
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- 2. Additive Blending ---
        ctx.globalCompositeOperation = 'lighter';

        // --- SEQUENCE ---
        
        // T=0: One Gold Peony
        if (frame === 20) {
            rockets.push(new Rocket(canvas.width * 0.5, canvas.height * 0.35, COLORS.GOLD.h, COLORS.GOLD.s, COLORS.GOLD.l, 'peony'));
        }

        // T=2.0s: Two White Peonies
        if (frame === 140) {
            rockets.push(new Rocket(canvas.width * 0.3, canvas.height * 0.45, COLORS.WHITE.h, COLORS.WHITE.s, COLORS.WHITE.l, 'peony'));
            rockets.push(new Rocket(canvas.width * 0.7, canvas.height * 0.45, COLORS.WHITE.h, COLORS.WHITE.s, COLORS.WHITE.l, 'peony'));
        }

        // T=4.5s: Three Gold Peonies
        if (frame === 270) {
            rockets.push(new Rocket(canvas.width * 0.2, canvas.height * 0.3, COLORS.GOLD.h, COLORS.GOLD.s, COLORS.GOLD.l, 'peony'));
            rockets.push(new Rocket(canvas.width * 0.5, canvas.height * 0.25, COLORS.GOLD.h, COLORS.GOLD.s, COLORS.GOLD.l, 'peony'));
            rockets.push(new Rocket(canvas.width * 0.8, canvas.height * 0.3, COLORS.GOLD.h, COLORS.GOLD.s, COLORS.GOLD.l, 'peony'));
        }

        // T=7.5s: THE FINALE "2026"
        if (frame === 450) {
            // Google Colors
            rockets.push(new Rocket(canvas.width * 0.2, canvas.height * 0.4, 0, 80, 60, 'text', '2'));   // Red
            rockets.push(new Rocket(canvas.width * 0.4, canvas.height * 0.4, 45, 100, 50, 'text', '0'));  // Yellow
            rockets.push(new Rocket(canvas.width * 0.6, canvas.height * 0.4, 120, 60, 50, 'text', '2')); // Green
            rockets.push(new Rocket(canvas.width * 0.8, canvas.height * 0.4, 210, 90, 60, 'text', '6')); // Blue
        }

        // --- UPDATE & DRAW ---

        for (let i = rockets.length - 1; i >= 0; i--) {
            rockets[i].update();
            if (rockets[i].exploded) {
                rockets.splice(i, 1);
            } else {
                rockets[i].draw(ctx);
            }
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            if (particles[i].alpha <= 0) {
                particles.splice(i, 1);
            } else {
                particles[i].draw(ctx);
            }
        }

        frame++;
        requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);

    return () => {
        cancelAnimationFrame(raf);
    }
  }, []);

  return (
    <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-[100] pointer-events-none"
    />
  );
};
