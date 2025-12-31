import React, { useEffect, useRef } from 'react';

export const FireworksDisplay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set Canvas Size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // --- SOUND ENGINE ---
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
    } catch (e) {
        console.error("Audio context blocked or not supported");
    }

    const playLaunchSound = () => {
        if (!audioCtxRef.current) return;
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
        
        const t = audioCtxRef.current.currentTime;
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        
        // Slightly lower pitch for a "thump" launch
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(450, t + 0.5);
        
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        
        osc.start(t);
        osc.stop(t + 0.5);
    };

    const playExplosionSound = () => {
        if (!audioCtxRef.current) return;
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();

        const t = audioCtxRef.current.currentTime;
        const bufferSize = audioCtxRef.current.sampleRate * 2.0; 
        const buffer = audioCtxRef.current.createBuffer(1, bufferSize, audioCtxRef.current.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioCtxRef.current.createBufferSource();
        noise.buffer = buffer;
        
        const filter = audioCtxRef.current.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t); // Lower frequency for deeper boom
        filter.frequency.exponentialRampToValueAtTime(50, t + 1.0);
        
        const gain = audioCtxRef.current.createGain();
        gain.gain.setValueAtTime(0.2, t); 
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        
        noise.start(t);
    };

    // --- HELPER: TEXT TO PARTICLES ---
    const getTextParticleCoordinates = (text: string, fontSize: number = 150): {x: number, y: number}[] => {
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
                const alpha = data[(y * tempCanvas.width + x) * 4 + 3];
                if (alpha > 128) {
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
      vx: number;
      vy: number;
      alpha: number;
      color: string;
      decay: number;
      size: number;
      flash: boolean;

      constructor(x: number, y: number, color: string, velocity?: {x: number, y: number}, isFlash: boolean = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.alpha = 1;
        this.flash = isFlash;

        if (isFlash) {
            this.vx = 0;
            this.vy = 0;
            this.size = 50; // Much smaller flash, cleaner
            this.decay = 0.15; // Fades out very fast
        } else {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1; // Controlled speed
            this.vx = velocity ? velocity.x : Math.cos(angle) * speed;
            this.vy = velocity ? velocity.y : Math.sin(angle) * speed;
            this.size = Math.random() * 1.5 + 0.5; // Smaller, finer particles
            this.decay = Math.random() * 0.01 + 0.005;
        }
      }

      update() {
        if (this.flash) {
            this.alpha -= this.decay;
            this.size *= 0.8; 
            return;
        }

        this.vx *= 0.95; // Air resistance
        this.vy *= 0.95;
        this.vy += 0.08; // Gentle gravity
        
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        if (this.flash) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'white';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Cleaner look: No heavy shadowBlur for every particle, creates "muddy" look
            // Only slight glow if needed, but 'lighter' composite handles it mostly
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
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
      color: string;
      exploded: boolean;
      type: 'normal' | 'text';
      textChar?: string;
      
      constructor(x: number, targetY: number, color: string, type: 'normal' | 'text' = 'normal', textChar?: string) {
        this.x = x;
        this.y = canvas!.height;
        this.targetY = targetY;
        this.color = color;
        this.type = type;
        this.textChar = textChar;
        this.exploded = false;
        
        // Launch physics - Straight up, cleaner
        this.vy = -14; 
        this.vx = (Math.random() - 0.5) * 0.5; // Very minimal drift
        
        playLaunchSound();
      }

      update() {
        this.vy += 0.2; // Gravity
        this.x += this.vx; // No wobble
        this.y += this.vy;

        // NO SMOKE PARTICLES - Cleaner trail is just the fade of the canvas

        // Check explosion
        if (this.vy >= -1 || this.y <= this.targetY) {
            this.explode();
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        
        // Small, sharp rocket head
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Simple glowing trail line (fades naturally due to canvas clear)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 4, this.y - this.vy * 4);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }

      explode() {
        this.exploded = true;
        playExplosionSound();

        // 1. Subtle Flash (White pop)
        particles.push(new Particle(this.x, this.y, 'white', undefined, true));

        if (this.type === 'normal') {
            const count = 100;
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(this.x, this.y, this.color));
            }
        } else if (this.type === 'text' && this.textChar) {
            const points = getTextParticleCoordinates(this.textChar);
            points.forEach(p => {
                const v = { 
                    x: p.x * 0.05 + (Math.random() - 0.5) * 0.2, 
                    y: p.y * 0.05 + (Math.random() - 0.5) * 0.2 
                };
                particles.push(new Particle(this.x, this.y, this.color, v));
            });
        }
      }
    }

    let rockets: Rocket[] = [];
    let particles: Particle[] = [];
    let frame = 0;

    const animate = () => {
        // --- 1. Fade Effect (Trails) ---
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Faster fade for cleaner trails
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- 2. Draw Elements (Additive Blending) ---
        ctx.globalCompositeOperation = 'lighter';

        // --- SEQUENCE ---
        
        // T=0: One Gold Rocket
        if (frame === 10) {
            rockets.push(new Rocket(canvas.width * 0.5, canvas.height * 0.25, '#FBBC05'));
        }

        // T=1.5s: Two White Rockets
        if (frame === 90) {
            rockets.push(new Rocket(canvas.width * 0.35, canvas.height * 0.4, '#FFFFFF'));
            rockets.push(new Rocket(canvas.width * 0.65, canvas.height * 0.4, '#FFFFFF'));
        }

        // T=3s: Three Gold Rockets
        if (frame === 180) {
            rockets.push(new Rocket(canvas.width * 0.2, canvas.height * 0.3, '#FBBC05'));
            rockets.push(new Rocket(canvas.width * 0.5, canvas.height * 0.2, '#FBBC05'));
            rockets.push(new Rocket(canvas.width * 0.8, canvas.height * 0.3, '#FBBC05'));
        }

        // T=5.5s: THE FINALE "2026" SIMULTANEOUS
        if (frame === 320) {
            // 2 - Red
            rockets.push(new Rocket(canvas.width * 0.2, canvas.height * 0.35, '#EA4335', 'text', '2'));
            // 0 - Yellow
            rockets.push(new Rocket(canvas.width * 0.4, canvas.height * 0.35, '#FBBC05', 'text', '0'));
            // 2 - Green
            rockets.push(new Rocket(canvas.width * 0.6, canvas.height * 0.35, '#34A853', 'text', '2'));
            // 6 - Blue
            rockets.push(new Rocket(canvas.width * 0.8, canvas.height * 0.35, '#4285F4', 'text', '6'));
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
        className="absolute inset-0 z-[100] pointer-events-none mix-blend-screen"
    />
  );
};
