import React, { useEffect, useRef } from 'react';

// --- CONFIGURATION ---
const PHYSICS = {
    friction: 0.96,
    gravity: 0.04, 
};

// --- PALETTES ---
const GOLDEN_HOUR = [
    { h: 45, s: 100, l: 50 }, // Pure Gold
    { h: 35, s: 100, l: 60 }, // Amber
    { h: 25, s: 100, l: 65 }, // Light Orange
    { h: 50, s: 90, l: 80 },  // Pale Gold
];

const WHITE_GLITTER = { h: 0, s: 0, l: 100 };

// GOOGLE BRAND COLORS (HSL approximations)
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
    const randColor = (palette: typeof GOLDEN_HOUR) => palette[Math.floor(Math.random() * palette.length)];

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
            this.size = behavior === 'glitter' ? rand(1.5, 2.5) : rand(1, 2);

            // Decay Logic
            if (this.behavior === 'heavy') {
                this.decay = rand(0.005, 0.008); 
            } else if (this.behavior === 'glitter') {
                this.decay = rand(0.008, 0.015);
            } else if (this.behavior === 'text') {
                this.decay = rand(0.015, 0.025); // Faster decay so text doesn't stick forever
                this.size = 2;
            } else if (this.behavior === 'fountain') {
                this.decay = rand(0.02, 0.04);
                this.size = rand(0.5, 1.5);
            } else if (this.behavior === 'trail') {
                this.decay = rand(0.04, 0.08); // Trails fade fast
                this.size = rand(0.5, 1.5);
                this.light = 80; // Trails are bright
            } else {
                this.decay = rand(0.01, 0.02);
            }
        }

        update() {
            this.prevX = this.x;
            this.prevY = this.y;
            
            if (this.behavior === 'heavy') {
                this.vx *= 0.92; 
                this.vy *= 0.92; 
                this.vy += PHYSICS.gravity * 2.5; 
            } else if (this.behavior === 'text') {
                 this.vx *= 0.92;
                 this.vy *= 0.92;
                 this.vy += 0.02; 
            } else if (this.behavior === 'trail') {
                 this.vx *= 0.9;
                 this.vy *= 0.9;
                 this.vy += 0.01;
            } else {
                this.vx *= PHYSICS.friction;
                this.vy *= PHYSICS.friction;
                this.vy += PHYSICS.gravity;
            }
            
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
            
            if (this.alpha < 0.5) this.size *= 0.95;

            // Sparkle logic
            if (this.behavior === 'glitter') {
                if (Math.random() > 0.7) {
                    this.light = 100; 
                    this.size = 3; 
                } else {
                    this.light = 60; 
                    this.size = rand(1, 2);
                }
            }
        }

        draw(ctx: CanvasRenderingContext2D) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            
            ctx.beginPath();
            
            if (this.behavior === 'glitter' && this.light === 100) {
                ctx.strokeStyle = `hsl(${this.hue}, ${this.sat}%, ${this.light}%)`;
                ctx.lineWidth = 1;
                ctx.moveTo(this.x - 3, this.y);
                ctx.lineTo(this.x + 3, this.y);
                ctx.moveTo(this.x, this.y - 3);
                ctx.lineTo(this.x, this.y + 3);
                ctx.stroke();
            } else {
                ctx.strokeStyle = `hsl(${this.hue}, ${this.sat}%, ${this.light}%)`;
                ctx.lineWidth = this.size;
                ctx.lineCap = 'round';
                ctx.moveTo(this.prevX, this.prevY);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
            }
            
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
                let speed = -Math.sqrt(2 * 0.15 * height); 
                if (type === 'mine') speed = -15; 
                
                this.vy = speed;
                this.vx = 0 + rand(-0.5, 0.5); 
            }
        }

        update() {
            this.vy += 0.15; // Gravity
            this.x += this.vx;
            this.y += this.vy;

            // EMIT TRAIL PARTICLES
            // Instead of drawing a persistent line, we drop particles
            // This prevents "lines that don't go away"
            if (this.type !== 'mine') { // Mines don't have trails
                for(let i=0; i<2; i++) {
                    const t = new Particle(
                        this.x + rand(-1, 1), 
                        this.y + rand(-1, 1), 
                        this.vx * 0.1 + rand(-0.2, 0.2), 
                        this.vy * 0.1 + rand(-0.2, 0.2), 
                        this.hue, 
                        this.sat, 
                        this.light, 
                        'trail'
                    );
                    particles.push(t);
                }
            }

            const reachedTarget = this.vy >= -0.5 || this.y <= this.targetY;
            if (reachedTarget) {
                this.explode();
            }
        }

        draw(ctx: CanvasRenderingContext2D) {
            if (this.type === 'mine') return; 

            // Just draw the "Head" of the rocket
            ctx.fillStyle = `hsl(${this.hue}, ${this.sat}%, 80%)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        explode() {
            this.exploded = true;
            let count = 0;
            let power = 0;
            let behavior: ParticleBehavior = 'normal';

            switch (this.type) {
                case 'peony':
                    count = 100;
                    power = rand(4, 7);
                    behavior = 'normal';
                    break;
                case 'horsetail':
                    count = 150;
                    power = rand(3, 5); 
                    behavior = 'heavy';
                    break;
                case 'mine':
                    count = 60;
                    power = rand(5, 12);
                    behavior = 'normal';
                    break;
                case 'crackle_fan':
                case 'wiper_white':
                    count = 80;
                    power = rand(5, 8);
                    behavior = 'glitter';
                    break;
                case 'finale_white':
                    count = 600; 
                    power = 18; 
                    behavior = 'glitter';
                    break;
                case 'text':
                    behavior = 'text';
                    break;
            }

            if (this.type === 'text' && this.textChar) {
                const points = getTextParticleCoordinates(this.textChar);
                points.forEach(p => {
                    const vx = p.x * 0.05 + rand(-0.2, 0.2);
                    const vy = p.y * 0.05 + rand(-0.2, 0.2);
                    particles.push(new Particle(this.x, this.y, vx, vy, this.hue, this.sat, this.light, behavior));
                });
                return;
            }

            for (let i = 0; i < count; i++) {
                let a = rand(0, Math.PI * 2); 
                let s = Math.pow(Math.random(), 0.5) * power; 
                
                let vx = Math.cos(a) * s;
                let vy = Math.sin(a) * s;

                // SPECIAL GEOMETRY
                if (this.type === 'horsetail') {
                    a = rand(Math.PI * 1.1, Math.PI * 1.9); 
                    s = rand(2, 6);
                    vx = Math.cos(a) * s;
                    vy = Math.sin(a) * s;
                }
                
                if (this.type === 'mine') {
                    a = rand(Math.PI * 1.2, Math.PI * 1.8);
                    s = rand(8, 15);
                    vx = Math.cos(a) * s;
                    vy = Math.sin(a) * s;
                }

                // Color Variation
                let h = this.hue;
                let sat = this.sat;
                let l = this.light;

                if (this.type !== 'finale_white' && this.type !== 'text' && this.type !== 'wiper_white') {
                    const mix = randColor(GOLDEN_HOUR);
                    h = mix.h;
                    sat = mix.s;
                    l = mix.l;
                }

                particles.push(new Particle(this.x, this.y, vx, vy, h, sat, l, behavior));
            }
        }
    }

    let rockets: Rocket[] = [];
    let particles: Particle[] = [];
    let frame = 0;

    const animate = () => {
        // --- 1. Clear Screen (Stronger fade to remove imprints) ---
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; // Increased opacity
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- 2. Additive Blending ---
        ctx.globalCompositeOperation = 'lighter';

        // ==========================================
        //               TIMELINE
        // ==========================================
        
        // [0-450] ORIGINAL SEQUENCE (Intro + 2026)
        if (frame === 20) rockets.push(new Rocket(canvas.width * 0.5, canvas.height * 0.35, GOLDEN_HOUR[0], 'peony'));
        if (frame === 140) {
            rockets.push(new Rocket(canvas.width * 0.3, canvas.height * 0.45, WHITE_GLITTER, 'peony'));
            rockets.push(new Rocket(canvas.width * 0.7, canvas.height * 0.45, WHITE_GLITTER, 'peony'));
        }
        if (frame === 270) {
            rockets.push(new Rocket(canvas.width * 0.2, canvas.height * 0.3, GOLDEN_HOUR[1], 'peony'));
            rockets.push(new Rocket(canvas.width * 0.5, canvas.height * 0.25, GOLDEN_HOUR[0], 'peony'));
            rockets.push(new Rocket(canvas.width * 0.8, canvas.height * 0.3, GOLDEN_HOUR[2], 'peony'));
        }
        
        // 2026 WITH GOOGLE COLORS
        if (frame === 450) {
            rockets.push(new Rocket(canvas.width * 0.2, canvas.height * 0.4, GOOGLE_BLUE, 'text', '2'));   
            rockets.push(new Rocket(canvas.width * 0.4, canvas.height * 0.4, GOOGLE_RED, 'text', '0'));  
            rockets.push(new Rocket(canvas.width * 0.6, canvas.height * 0.4, GOOGLE_YELLOW, 'text', '2')); 
            rockets.push(new Rocket(canvas.width * 0.8, canvas.height * 0.4, GOOGLE_GREEN, 'text', '6')); 
        }

        // [650-1350] EXTENDED SHOW 
        if (frame === 650) {
            rockets.push(new Rocket(canvas.width * 0.35, canvas.height * 0.20, GOLDEN_HOUR[0], 'horsetail'));
            rockets.push(new Rocket(canvas.width * 0.65, canvas.height * 0.20, GOLDEN_HOUR[3], 'horsetail'));
        }
        if (frame === 660) {
            rockets.push(new Rocket(canvas.width * 0.25, canvas.height * 0.9, GOLDEN_HOUR[1], 'mine'));
            rockets.push(new Rocket(canvas.width * 0.75, canvas.height * 0.9, GOLDEN_HOUR[2], 'mine'));
        }

        // SINGLE POINT FAN 1 (Left to Right Sweep)
        const fanStart = 850;
        const centerX = canvas.width * 0.5;
        if (frame >= fanStart && frame < fanStart + 25 && frame % 5 === 0) {
            const idx = (frame - fanStart) / 5; 
            const angleDeg = -110 + (idx * 10); 
            const rad = angleDeg * (Math.PI / 180);
            const speed = 14;
            rockets.push(new Rocket(centerX, 0, GOLDEN_HOUR[0], 'crackle_fan', undefined, {
                vx: Math.cos(rad) * speed,
                vy: Math.sin(rad) * speed
            }));
        }

        // SINGLE POINT FAN 2 (Right to Left Sweep)
        const fan2Start = 1050;
        if (frame >= fan2Start && frame < fan2Start + 25 && frame % 5 === 0) {
            const idx = (frame - fan2Start) / 5; 
            const angleDeg = -70 - (idx * 10); 
            const rad = angleDeg * (Math.PI / 180);
            const speed = 14;
            rockets.push(new Rocket(centerX, 0, GOLDEN_HOUR[2], 'crackle_fan', undefined, {
                vx: Math.cos(rad) * speed,
                vy: Math.sin(rad) * speed
            }));
        }

        // [1350] HUGE WHITE FINAL
        if (frame === 1350) {
            rockets.push(new Rocket(canvas.width * 0.5, canvas.height * 0.25, WHITE_GLITTER, 'finale_white'));
        }

        // ==========================================
        //        POST-FINALE SEQUENCE
        // ==========================================

        const startPostFinale = 1500;

        // 1. 20 WHITE CRACKLE WIPERS
        if (frame >= startPostFinale && frame < startPostFinale + 100 && frame % 5 === 0) {
            const step = (frame - startPostFinale) / 5;
            const sequenceIndex = Math.floor(step / 5); 
            const shotInSequence = step % 5; 

            const isLeftToRight = (sequenceIndex % 2 === 0);
            
            let angleDeg = 0;
            if (isLeftToRight) {
                angleDeg = -130 + (shotInSequence * 20); 
            } else {
                angleDeg = -50 - (shotInSequence * 20); 
            }

            const rad = angleDeg * (Math.PI / 180);
            const speed = 13;
            
            rockets.push(new Rocket(centerX, 0, WHITE_GLITTER, 'wiper_white', undefined, {
                vx: Math.cos(rad) * speed,
                vy: Math.sin(rad) * speed
            }));
        }

        // 2. 8 SIMULTANEOUS SMALL MINES (Low Height)
        if (frame >= startPostFinale && frame < startPostFinale + 120 && frame % 15 === 0) {
             const xPos = rand(0.2, 0.8) * canvas.width;
             rockets.push(new Rocket(xPos, canvas.height * 0.75, GOLDEN_HOUR[1], 'mine'));
        }

        // 3. FOUNTAIN & ALTERNATING ROCKETS
        const fountainStart = startPostFinale + 180; 
        const fountainDuration = 180; 

        if (frame >= fountainStart && frame < fountainStart + fountainDuration) {
            for(let k=0; k<3; k++) {
                const angle = -Math.PI / 2 + rand(-0.2, 0.2);
                const speed = rand(8, 14);
                const vx = Math.cos(angle) * speed * 0.3; 
                const vy = Math.sin(angle) * speed;
                particles.push(new Particle(
                    canvas.width * 0.5, 
                    canvas.height, 
                    vx, vy, 
                    GOLDEN_HOUR[0].h, 100, 70, 
                    'fountain'
                ));
            }
        }

        if (frame >= fountainStart && frame < fountainStart + 150 && frame % 15 === 0) {
            const count = (frame - fountainStart) / 15;
            const isLeft = count % 2 === 0;
            const xPos = isLeft ? canvas.width * 0.25 : canvas.width * 0.75;
            
            rockets.push(new Rocket(xPos, canvas.height * 0.2, isLeft ? GOLDEN_HOUR[1] : GOLDEN_HOUR[3], 'peony', undefined, {
                vx: 0, 
                vy: -18 
            }));
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
