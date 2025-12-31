import React, { useEffect, useRef } from 'react';

// --- CONFIGURATION ---
const PHYSICS = {
    friction: 0.95, // Increased air resistance for "pop then stop" effect
    gravity: 0.04,  
};

// --- PALETTES ---
const GOLDEN_HOUR = [
    { h: 45, s: 100, l: 50 },
    { h: 38, s: 100, l: 60 },
    { h: 28, s: 100, l: 65 },
];

const DEEP_BLUE = [
    { h: 220, s: 90, l: 60 },
    { h: 200, s: 100, l: 60 },
    { h: 240, s: 80, l: 70 },
];

const VIBRANT_RED = [
    { h: 350, s: 90, l: 55 },
    { h: 10, s: 100, l: 60 },
    { h: 330, s: 100, l: 50 },
];

const ELECTRIC_GREEN = [
    { h: 140, s: 100, l: 50 },
    { h: 120, s: 90, l: 60 },
    { h: 160, s: 100, l: 60 },
];

const WHITE_GLITTER = { h: 0, s: 0, l: 100 };

// GOOGLE BRAND COLORS (for text)
const GOOGLE_BLUE = { h: 217, s: 89, l: 61 };
const GOOGLE_RED = { h: 5, s: 81, l: 56 };
const GOOGLE_YELLOW = { h: 45, s: 96, l: 51 };
const GOOGLE_GREEN = { h: 138, s: 58, l: 45 };

type RocketType = 'peony' | 'text' | 'horsetail' | 'mine' | 'crackle_fan' | 'finale_white' | 'wiper_white';
type ParticleBehavior = 'normal' | 'heavy' | 'glitter' | 'text' | 'fountain' | 'trail';

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
    const randColor = (palette: {h:number, s:number, l:number}[]) => palette[Math.floor(Math.random() * palette.length)];

    // --- TEXT BITMAP GENERATOR ---
    const getTextParticleCoordinates = (text: string, fontSize: number = 160): {x: number, y: number}[] => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return [];

        // Smaller font for longer words
        const isMobile = window.innerWidth < 768;
        const actualFontSize = isMobile ? fontSize * 0.5 : fontSize;

        tempCanvas.width = actualFontSize * text.length * 1.2;
        tempCanvas.height = actualFontSize * 2;
        
        tempCtx.font = `900 ${actualFontSize}px "Space Grotesk", sans-serif`;
        tempCtx.fillStyle = 'white';
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);

        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        const points: {x: number, y: number}[] = [];
        const step = 5; 

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
        size: number;
        behavior: ParticleBehavior;

        constructor(x: number, y: number, vx: number, vy: number, hue: number, sat: number, light: number, behavior: ParticleBehavior = 'normal') {
            this.x = x;
            this.y = y;
            this.prevX = x;
            this.prevY = y;
            this.vx = vx;
            this.vy = vy;
            this.hue = hue;
            this.sat = sat;
            this.light = light;
            this.behavior = behavior;
            this.alpha = 1;
            
            this.size = behavior === 'glitter' ? rand(1, 2.5) : rand(1, 2.5);

            // DECAY LOGIC - CUSTOMIZED
            if (this.behavior === 'heavy') {
                // Pferdeschwanz: Schneller vergehen als vorher (was 0.0015)
                this.decay = rand(0.005, 0.008); 
            } else if (this.behavior === 'glitter') {
                this.decay = rand(0.006, 0.012);
            } else if (this.behavior === 'text') {
                this.decay = rand(0.008, 0.015); 
            } else if (this.behavior === 'fountain') {
                this.decay = rand(0.015, 0.025);
            } else if (this.behavior === 'trail') {
                this.decay = rand(0.04, 0.08); 
                this.size = rand(0.5, 1.2);    
            } else {
                // Standard Explosion
                this.decay = rand(0.01, 0.02); 
            }
        }

        update() {
            this.prevX = this.x;
            this.prevY = this.y;
            
            if (this.behavior === 'heavy') {
                this.vx *= 0.92; 
                this.vy *= 0.92; 
                this.vy += 0.04; // Gravity for falling sparks
            } else if (this.behavior === 'text') {
                 this.vx *= 0.90;
                 this.vy *= 0.90;
            } else if (this.behavior === 'trail') {
                 this.vx *= 0.5; 
                 this.vy *= 0.5;
                 this.vy += 0.01; 
            } else {
                this.vx *= PHYSICS.friction;
                this.vy *= PHYSICS.friction;
                this.vy += PHYSICS.gravity;
            }
            
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
            
            if (this.alpha < 0.2) this.size *= 0.9;

            // Sparkle logic
            if (this.behavior === 'glitter') {
                if (Math.random() > 0.8) { 
                    this.light = 100; 
                    this.alpha = 1;
                } else {
                    this.light = 60; 
                }
            }
        }

        draw(ctx: CanvasRenderingContext2D) {
            if (this.alpha <= 0) return;

            ctx.save();
            ctx.globalAlpha = this.alpha;
            
            ctx.beginPath();
            ctx.strokeStyle = `hsl(${this.hue}, ${this.sat}%, ${this.light}%)`;
            ctx.lineWidth = this.size;
            ctx.lineCap = 'round';
            ctx.moveTo(this.prevX, this.prevY);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
            
            ctx.restore();
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
        type: RocketType;
        textChar?: string;
        
        constructor(x: number, targetY: number, color: {h: number, s: number, l: number}, type: RocketType = 'peony', textChar?: string, velocityOverride?: {vx: number, vy: number}) {
            this.x = x;
            this.y = canvas!.height;
            this.targetY = targetY;
            this.hue = color.h;
            this.sat = color.s;
            this.light = color.l;
            this.type = type;
            this.textChar = textChar;
            this.exploded = false;
            
            if (velocityOverride) {
                this.vx = velocityOverride.vx;
                this.vy = velocityOverride.vy;
            } else {
                const height = canvas!.height - targetY;
                // Fast launch
                let speed = -Math.sqrt(2 * 0.22 * height); 
                
                if (type === 'mine') speed = -15; 
                
                this.vy = speed;
                this.vx = rand(-0.3, 0.3); 
            }
        }

        update() {
            this.vy += 0.22;
            this.x += this.vx;
            this.y += this.vy;

            // Clean Trail
            if (this.type !== 'mine' && this.type !== 'text') { 
                const t = new Particle(
                    this.x, 
                    this.y, 
                    rand(-0.2, 0.2), 
                    rand(0.5, 1.0), 
                    this.hue, 
                    this.sat, 
                    this.light, 
                    'trail'
                );
                particles.push(t);
            }

            const reachedTarget = this.vy >= -0.5 || this.y <= this.targetY;
            
            if (reachedTarget || this.y < -50) {
                this.explode();
            }
        }

        draw(ctx: CanvasRenderingContext2D) {
            if (this.type === 'mine') return; 

            // HEAD: Tiny
            ctx.fillStyle = `hsl(${this.hue}, ${this.sat}%, 90%)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2); 
            ctx.fill();
        }

        explode() {
            this.exploded = true;
            let count = 0;
            let power = 0;
            let behavior: ParticleBehavior = 'normal';

            switch (this.type) {
                case 'peony':
                    // "Explosionsartig" -> Higher power
                    count = 90; 
                    power = rand(6, 11); 
                    behavior = 'normal';
                    break;
                case 'horsetail':
                    count = 150;
                    power = rand(5, 9); // Explosive start, then falls
                    behavior = 'heavy'; 
                    break;
                case 'mine':
                    count = 40;
                    power = rand(4, 8); 
                    behavior = 'normal';
                    break;
                case 'wiper_white':
                    // "Normal groß wie rakete"
                    count = 80;
                    power = rand(5, 9); 
                    behavior = 'glitter';
                    break;
                case 'crackle_fan':
                    count = 60;
                    power = rand(5, 8);
                    behavior = 'glitter';
                    break;
                case 'finale_white':
                    // "Weiße große explosion kleiner"
                    count = 250; 
                    power = 10; // Was 16/18
                    behavior = 'glitter';
                    break;
                case 'text':
                    behavior = 'text';
                    break;
            }

            if (this.type === 'text' && this.textChar) {
                const points = getTextParticleCoordinates(this.textChar);
                points.forEach(p => {
                    const vx = p.x * 0.05 + rand(-0.1, 0.1);
                    const vy = p.y * 0.05 + rand(-0.1, 0.1);
                    particles.push(new Particle(this.x, this.y, vx, vy, this.hue, this.sat, this.light, behavior));
                });
                return;
            }

            // STANDARD EXPLOSIONS
            for (let i = 0; i < count; i++) {
                let a = rand(0, Math.PI * 2); 
                // Power distribution for more natural explosion
                let s = Math.pow(Math.random(), 0.5) * power; 
                
                let vx = Math.cos(a) * s;
                let vy = Math.sin(a) * s;

                if (this.type === 'horsetail') {
                    // Slight upward bias
                    a = rand(Math.PI * 1.1, Math.PI * 1.9); 
                    s = rand(3, 8);
                    vx = Math.cos(a) * s;
                    vy = Math.sin(a) * s;
                }
                
                if (this.type === 'mine') {
                    a = rand(Math.PI * 1.1, Math.PI * 1.9);
                    s = rand(6, 12);
                    vx = Math.cos(a) * s;
                    vy = Math.sin(a) * s;
                }

                // Color Variety within palette
                let h = this.hue;
                let sat = this.sat;
                let l = this.light;
                
                // Variate slightly around the base color for depth
                h += rand(-10, 10);

                particles.push(new Particle(this.x, this.y, vx, vy, h, sat, l, behavior));
            }
        }
    }

    let rockets: Rocket[] = [];
    let particles: Particle[] = [];
    let frame = 0;

    const animate = () => {
        // --- 1. Clear Screen ---
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- 2. Switch to Additive Blending ---
        ctx.globalCompositeOperation = 'lighter';

        // ==========================================
        //               TIMELINE
        // ==========================================
        
        // --- PHASE 1: GOLD (0 - 1400) ---
        if (frame === 20) rockets.push(new Rocket(canvas.width * 0.5, canvas.height * 0.35, GOLDEN_HOUR[0], 'peony'));
        
        if (frame > 100 && frame < 800 && frame % 120 === 0) {
             const x = rand(0.2, 0.8) * canvas.width;
             const y = rand(0.2, 0.5) * canvas.height;
             rockets.push(new Rocket(x, y, randColor(GOLDEN_HOUR), 'peony'));
        }

        // 2026
        if (frame === 900) {
            rockets.push(new Rocket(canvas.width * 0.2, canvas.height * 0.4, GOLDEN_HOUR[0], 'text', '2'));   
            rockets.push(new Rocket(canvas.width * 0.4, canvas.height * 0.4, GOLDEN_HOUR[1], 'text', '0'));  
            rockets.push(new Rocket(canvas.width * 0.6, canvas.height * 0.4, GOLDEN_HOUR[2], 'text', '2')); 
            rockets.push(new Rocket(canvas.width * 0.8, canvas.height * 0.4, GOLDEN_HOUR[0], 'text', '6')); 
        }

        // --- PHASE 2: BLUE (1500 - 2500) ---
        // Organic, modern, explosive
        if (frame >= 1500 && frame < 2400) {
            // Rapid small mines
            if (frame % 40 === 0) {
                rockets.push(new Rocket(rand(0.1, 0.9) * canvas.width, canvas.height * 0.7, randColor(DEEP_BLUE), 'mine'));
            }
            // Big organic bursts
            if (frame % 90 === 0) {
                rockets.push(new Rocket(rand(0.2, 0.8) * canvas.width, rand(0.15, 0.4) * canvas.height, randColor(DEEP_BLUE), 'peony'));
            }
        }

        // --- PHASE 3: RED (2600 - 3500) ---
        // Intense, horsetails
        if (frame >= 2600 && frame < 3500) {
            if (frame % 100 === 0) {
                 // Double Horsetails
                 rockets.push(new Rocket(canvas.width * 0.3, canvas.height * 0.25, randColor(VIBRANT_RED), 'horsetail'));
                 rockets.push(new Rocket(canvas.width * 0.7, canvas.height * 0.25, randColor(VIBRANT_RED), 'horsetail'));
            }
            // Fillers
            if (frame % 60 === 0) {
                rockets.push(new Rocket(rand(0.4, 0.6) * canvas.width, canvas.height * 0.5, randColor(VIBRANT_RED), 'peony'));
            }
        }

        // --- PHASE 4: GREEN (3600 - 4500) ---
        // Wipers (Fächer) - Normal sized rockets
        if (frame >= 3600 && frame < 4000 && frame % 15 === 0) {
            const step = (frame - 3600) / 15;
            const shotInSequence = step % 10; 
            const sequenceIndex = Math.floor(step / 10); 
            const isLeftToRight = (sequenceIndex % 2 === 0);
            
            let angleDeg = isLeftToRight ? -140 + (shotInSequence * 10) : -40 - (shotInSequence * 10);
            const rad = angleDeg * (Math.PI / 180);
            const speed = 11;
            
            rockets.push(new Rocket(canvas.width * 0.5, 0, ELECTRIC_GREEN[0], 'wiper_white', undefined, {
                vx: Math.cos(rad) * speed,
                vy: Math.sin(rad) * speed
            }));
        }

        // --- PHASE 5: KRASS MIX (4600 - 5400) ---
        // Everything together
        if (frame >= 4600 && frame < 5400) {
            if (frame % 20 === 0) {
                 const x = rand(0.1, 0.9) * canvas.width;
                 const type = Math.random() > 0.7 ? 'horsetail' : 'peony';
                 
                 // Random palette
                 const p = Math.random();
                 let col;
                 if (p < 0.25) col = randColor(GOLDEN_HOUR);
                 else if (p < 0.5) col = randColor(DEEP_BLUE);
                 else if (p < 0.75) col = randColor(VIBRANT_RED);
                 else col = randColor(ELECTRIC_GREEN);

                 rockets.push(new Rocket(x, rand(0.1, 0.6) * canvas.height, col, type));
            }
        }

        // --- BIG WHITE FINALE (Reduced size) ---
        if (frame === 5500) {
             rockets.push(new Rocket(canvas.width * 0.5, canvas.height * 0.3, WHITE_GLITTER, 'finale_white'));
        }

        // --- HAPPY NEW YEAR TEXT FINALE ---
        const textY = canvas.height * 0.25;
        
        // "HAPPY"
        if (frame === 5700) {
            rockets.push(new Rocket(canvas.width * 0.2, textY, GOOGLE_BLUE, 'text', 'H'));
            rockets.push(new Rocket(canvas.width * 0.35, textY, GOOGLE_RED, 'text', 'A'));
            rockets.push(new Rocket(canvas.width * 0.5, textY, GOOGLE_YELLOW, 'text', 'P'));
            rockets.push(new Rocket(canvas.width * 0.65, textY, GOOGLE_GREEN, 'text', 'P'));
            rockets.push(new Rocket(canvas.width * 0.8, textY, GOOGLE_BLUE, 'text', 'Y'));
        }

        // "NEW"
        if (frame === 5900) {
            rockets.push(new Rocket(canvas.width * 0.3, textY + 150, GOOGLE_RED, 'text', 'N'));
            rockets.push(new Rocket(canvas.width * 0.5, textY + 150, GOOGLE_YELLOW, 'text', 'E'));
            rockets.push(new Rocket(canvas.width * 0.7, textY + 150, GOOGLE_GREEN, 'text', 'W'));
        }

        // "YEAR"
        if (frame === 6100) {
            rockets.push(new Rocket(canvas.width * 0.25, textY + 300, GOOGLE_BLUE, 'text', 'Y'));
            rockets.push(new Rocket(canvas.width * 0.42, textY + 300, GOOGLE_RED, 'text', 'E'));
            rockets.push(new Rocket(canvas.width * 0.58, textY + 300, GOOGLE_YELLOW, 'text', 'A'));
            rockets.push(new Rocket(canvas.width * 0.75, textY + 300, GOOGLE_GREEN, 'text', 'R'));
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
            if (particles[i].alpha <= 0.05) { 
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
