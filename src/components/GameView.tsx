import React, { useEffect, useRef } from 'react';
import { GameResult, NPC } from '../types';

const TOTAL_TIME = 75;
const MAP_WIDTH = 4500;
const SHELTER_X = MAP_WIDTH;
const PLAYER_SPEED = 250;
const NPC_SAVE_TIME = 6;
const SHELTER_ENTER_TIME = 2;
const INTERACT_DISTANCE = 120;

const darken = (hex: string, percent: number) => {
    let r = parseInt(hex.substring(1,3), 16);
    let g = parseInt(hex.substring(3,5), 16);
    let b = parseInt(hex.substring(5,7), 16);
    r = Math.floor(r * (1 - percent));
    g = Math.floor(g * (1 - percent));
    b = Math.floor(b * (1 - percent));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const INITIAL_NPCS: NPC[] = [
  { id: 1, x: 800, progress: 0, saved: false, name: 'Timmy', desc: 'A child paralyzed by fear, sobbing for their parents.', skin: '#d2b48c', shirt: '#8b4513', pants: '#2c3e50' },
  { id: 2, x: 1600, progress: 0, saved: false, name: 'Martha', desc: 'An older woman with a severely sprained ankle unable to walk.', skin: '#e0ac69', shirt: '#556b2f', pants: '#3b3b3b' },
  { id: 3, x: 2400, progress: 0, saved: false, name: 'David', desc: 'A man pinned tightly beneath a collapsed steel beam.', skin: '#8d5524', shirt: '#8b0000', pants: '#1a1a1a' },
  { id: 4, x: 3200, progress: 0, saved: false, name: 'Sarah', desc: 'A teenager blinded by dust and debris, stumbling aimlessly.', skin: '#f1c27d', shirt: '#4682b4', pants: '#2c3e50' },
  { id: 5, x: 3800, progress: 0, saved: false, name: 'Marcus', desc: 'A father refusing to abandon his unconscious daughter.', skin: '#3d2b1f', shirt: '#2f4f4f', pants: '#4a4a4a' },
];

const SKINS = ['#f1c27d', '#e0ac69', '#d2b48c', '#8d5524', '#3d2b1f'];
const SHIRTS = ['#556b2f', '#4682b4', '#8b0000', '#2f4f4f', '#6b4226', '#3b3b3b'];
const PANTS = ['#2c3e50', '#1a1a1a', '#4a4a4a', '#3e2723'];

export default function GameView({ onEnd }: { onEnd: (result: GameResult) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const stateRef = useRef({
    timeElapsed: 0,
    player: { x: 200, isInteracting: false, facingRight: true, runDistance: 0 },
    npcs: JSON.parse(JSON.stringify(INITIAL_NPCS)) as NPC[],
    shelterProgress: 0,
    isGameOver: false,
    gameWon: false,
  });

  const keysRef = useRef({ a: false, d: false, e: false });
  
  const panicNPCsRef = useRef(
    Array.from({ length: 30 }).map(() => {
      const speed = (Math.random() * 150 + 100) * (Math.random() > 0.5 ? 1 : -1);
      return {
        x: Math.random() * MAP_WIDTH,
        speed: speed,
        facingRight: speed > 0,
        skin: SKINS[Math.floor(Math.random() * SKINS.length)],
        shirt: SHIRTS[Math.floor(Math.random() * SHIRTS.length)],
        pants: PANTS[Math.floor(Math.random() * PANTS.length)]
      };
    })
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'a') keysRef.current.a = true;
      if (e.key.toLowerCase() === 'd') keysRef.current.d = true;
      if (e.key.toLowerCase() === 'e') keysRef.current.e = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'a') keysRef.current.a = false;
      if (e.key.toLowerCase() === 'd') keysRef.current.d = false;
      if (e.key.toLowerCase() === 'e') keysRef.current.e = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const drawGrittyPerson = (ctx: CanvasRenderingContext2D, x: number, y: number, skin: string, shirt: string, pants: string, facingRight: boolean, runPhase: number, isPlayer = false) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(facingRight ? 1 : -1, 1);
      
      const isMoving = runPhase > 0;
      const bounce = isMoving ? Math.abs(Math.sin(runPhase * Math.PI)) * 4 : 0;
      ctx.translate(0, -bounce);

      const swing = isMoving ? Math.sin(runPhase * Math.PI * 2) * 20 : 0;
      
      // Ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(0, bounce + 2, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Back Arm
      ctx.fillStyle = darken(shirt, 0.4);
      ctx.save();
      ctx.translate(0, -50);
      ctx.rotate((swing * Math.PI) / 180);
      ctx.fillRect(-4, 0, 8, 25);
      ctx.fillStyle = darken(skin, 0.4);
      ctx.fillRect(-3, 25, 6, 6);
      ctx.restore();

      // Back Leg
      ctx.fillStyle = darken(pants, 0.4);
      ctx.save();
      ctx.translate(0, -30);
      ctx.rotate((-swing * Math.PI) / 180);
      ctx.fillRect(-5, 0, 10, 32);
      ctx.fillStyle = '#222'; // Shoe
      ctx.fillRect(-6, 28, 14, 6);
      ctx.restore();

      // Torso
      ctx.fillStyle = shirt;
      ctx.beginPath();
      ctx.moveTo(-10, -55);
      ctx.lineTo(8, -55);
      ctx.lineTo(6, -25);
      ctx.lineTo(-8, -25);
      ctx.fill();
      ctx.fillStyle = '#222'; // Belt
      ctx.fillRect(-8, -28, 14, 4);
      
      // Shading on torso
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.moveTo(4, -55);
      ctx.lineTo(8, -55);
      ctx.lineTo(6, -25);
      ctx.lineTo(2, -25);
      ctx.fill();

      // Front Leg
      ctx.fillStyle = pants;
      ctx.save();
      ctx.translate(0, -30);
      ctx.rotate((swing * Math.PI) / 180);
      ctx.fillRect(-5, 0, 10, 32);
      ctx.fillStyle = '#111'; // Shoe
      ctx.fillRect(-5, 28, 14, 6);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; // Leg shade
      ctx.fillRect(-5, 0, 4, 32);
      ctx.restore();

      // Front Arm
      ctx.fillStyle = shirt;
      ctx.save();
      ctx.translate(0, -50);
      ctx.rotate((-swing * Math.PI) / 180);
      ctx.fillRect(-4, 0, 8, 25);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; // Arm shade
      ctx.fillRect(-4, 0, 3, 25);
      ctx.fillStyle = skin;
      ctx.fillRect(-3, 25, 6, 6);
      ctx.restore();

      // Head
      ctx.fillStyle = skin;
      ctx.fillRect(-6, -72, 12, 16);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; // Face shade
      ctx.fillRect(-6, -72, 4, 16);
      
      // Hair
      ctx.fillStyle = '#2c1e16';
      ctx.fillRect(-7, -74, 14, 5);
      ctx.fillRect(-7, -74, 5, 12);

      if (isPlayer) {
        // High contrast accents for the player (sickly green and bright orange)
        ctx.fillStyle = '#FF9212'; // Goggles
        ctx.fillRect(-6, -69, 12, 4);
        
        ctx.fillStyle = '#52FC28'; // Arm device
        ctx.save();
        ctx.translate(0, -50);
        ctx.rotate((-swing * Math.PI) / 180);
        ctx.fillRect(-5, 8, 10, 6);
        ctx.restore();
      }

      ctx.restore();
    };

    const drawGrittyHouse = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, isDamaged: boolean) => {
      ctx.save();
      ctx.translate(x, y);

      // Main structure
      ctx.fillStyle = '#4a4238';
      ctx.fillRect(0, -160, width, 160);
      
      // Siding lines
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for(let i=0; i<160; i+=12) {
        ctx.fillRect(0, -i, width, 2);
      }

      // Roof
      ctx.fillStyle = '#2a221a';
      ctx.beginPath();
      ctx.moveTo(-15, -160);
      ctx.lineTo(width / 2, -240);
      ctx.lineTo(width + 15, -160);
      ctx.fill();
      
      // Roof shading
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.moveTo(-15, -160);
      ctx.lineTo(width / 2, -240);
      ctx.lineTo(width / 2, -160);
      ctx.fill();

      // Door
      ctx.fillStyle = '#3a2411';
      ctx.fillRect(20, -70, 45, 70);
      ctx.fillStyle = '#111';
      ctx.fillRect(22, -68, 41, 68);
      ctx.fillStyle = '#3a2411';
      ctx.fillRect(25, -65, 35, 65);
      ctx.fillStyle = '#888';
      ctx.fillRect(52, -40, 5, 5); // Doorknob

      // Windows
      const drawWindow = (wx: number, wy: number) => {
        ctx.fillStyle = '#111';
        ctx.fillRect(wx, wy, 36, 46);
        ctx.fillStyle = '#1a252c';
        ctx.fillRect(wx+3, wy+3, 30, 40);
        ctx.fillStyle = '#3a2411'; 
        ctx.fillRect(wx - 2, wy - 2, 40, 4);
        ctx.fillRect(wx - 2, wy + 44, 40, 4);
        ctx.fillRect(wx - 2, wy - 2, 4, 50);
        ctx.fillRect(wx + 34, wy - 2, 4, 50);
        ctx.fillRect(wx + 16, wy, 4, 46);
        ctx.fillRect(wx, wy + 21, 36, 4);
        
        // Dirty glass streaks
        ctx.fillStyle = 'rgba(153, 126, 103, 0.4)';
        ctx.beginPath();
        ctx.moveTo(wx + 5, wy + 5);
        ctx.lineTo(wx + 20, wy + 40);
        ctx.lineTo(wx + 10, wy + 40);
        ctx.fill();
      };

      drawWindow(80, -110);
      if (width > 160) {
        drawWindow(150, -110);
      }

      if (isDamaged) {
        ctx.fillStyle = '#2a1a0c';
        ctx.save();
        ctx.translate(80, -110);
        ctx.rotate(0.15);
        ctx.fillRect(-10, 15, 55, 6);
        ctx.rotate(-0.4);
        ctx.fillRect(5, 25, 50, 6);
        ctx.restore();
      }

      ctx.restore();
    };

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      const state = stateRef.current;
      const keys = keysRef.current;

      if (!state.isGameOver) {
        state.timeElapsed += dt;
        if (state.timeElapsed >= TOTAL_TIME) {
          state.isGameOver = true;
          state.gameWon = false;
          onEnd({ won: false, npcs: state.npcs });
          return;
        }

        state.player.isInteracting = false;
        let interactingWithNpc: NPC | null = null;
        let interactingWithShelter = false;

        if (keys.e) {
          const nearNpc = state.npcs.find(n => !n.saved && Math.abs(n.x - state.player.x) < INTERACT_DISTANCE);
          if (nearNpc) {
            interactingWithNpc = nearNpc;
            state.player.isInteracting = true;
          } else if (Math.abs(SHELTER_X - state.player.x) < INTERACT_DISTANCE) {
            interactingWithShelter = true;
            state.player.isInteracting = true;
          }
        }

        if (interactingWithNpc) {
          interactingWithNpc.progress += dt / NPC_SAVE_TIME;
          if (interactingWithNpc.progress >= 1) {
            interactingWithNpc.saved = true;
            interactingWithNpc.progress = 1;
          }
        } else {
            state.npcs.forEach(n => {
                if (!n.saved && n.progress > 0) {
                    n.progress = Math.max(0, n.progress - (dt / (NPC_SAVE_TIME * 2)));
                }
            });
        }

        if (interactingWithShelter) {
          state.shelterProgress += dt / SHELTER_ENTER_TIME;
          if (state.shelterProgress >= 1) {
            state.isGameOver = true;
            state.gameWon = true;
            onEnd({ won: true, npcs: state.npcs });
            return;
          }
        } else {
          state.shelterProgress = Math.max(0, state.shelterProgress - (dt / SHELTER_ENTER_TIME));
        }

        if (!state.player.isInteracting) {
          if (keys.a) {
            state.player.x -= PLAYER_SPEED * dt;
            state.player.facingRight = false;
            state.player.runDistance += PLAYER_SPEED * dt;
          }
          if (keys.d) {
            state.player.x += PLAYER_SPEED * dt;
            state.player.facingRight = true;
            state.player.runDistance += PLAYER_SPEED * dt;
          }
          if (state.player.x < 0) state.player.x = 0;
          if (state.player.x > MAP_WIDTH + 150) state.player.x = MAP_WIDTH + 150;
        } else {
          state.player.runDistance = 0; // Reset animation when stopped
        }

        // Panic NPCs movement
        panicNPCsRef.current.forEach(p => {
          p.x += p.speed * dt;
          if (p.x < -200) p.x = MAP_WIDTH + 200;
          if (p.x > MAP_WIDTH + 200) p.x = -200;
        });

        // Saved NPCs follow player
        state.npcs.forEach((npc, index) => {
          if (npc.saved) {
            const targetX = state.player.x - (state.player.facingRight ? 1 : -1) * (60 + index * 50);
            const dx = targetX - npc.x;
            if (Math.abs(dx) > 5) {
              npc.x += Math.sign(dx) * PLAYER_SPEED * 1.05 * dt; 
            }
          }
        });
      }

      // Drawing
      const width = canvas.width;
      const height = canvas.height;

      // Base background (dark brownish sky)
      ctx.fillStyle = '#3a3229';
      ctx.fillRect(0, 0, width, height);

      const timeRatio = state.timeElapsed / TOTAL_TIME;
      
      // Mushroom Cloud Explosion
      ctx.save();
      const cloudScale = (timeRatio * timeRatio * 6) + 0.1;
      const centerX = width / 2;
      const groundLevel = height - 80;
      
      ctx.translate(centerX, groundLevel);
      ctx.scale(cloudScale, cloudScale);

      // Dust ring kicking up
      ctx.save();
      const dustRadius = 300 + (timeRatio * 500);
      ctx.scale(1, 0.15); 
      const dustGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, dustRadius);
      dustGrad.addColorStop(0, 'rgba(255, 146, 18, 1)');
      dustGrad.addColorStop(0.3, 'rgba(153, 126, 103, 0.9)');
      dustGrad.addColorStop(0.7, 'rgba(97, 85, 71, 0.8)');
      dustGrad.addColorStop(1, 'rgba(97, 85, 71, 0)');
      ctx.fillStyle = dustGrad;
      ctx.beginPath();
      ctx.arc(0, 0, dustRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Cloud stem
      const stemGrad = ctx.createLinearGradient(-40, 0, 40, 0);
      stemGrad.addColorStop(0, '#3a3229');
      stemGrad.addColorStop(0.5, '#FF9212');
      stemGrad.addColorStop(1, '#3a3229');
      ctx.fillStyle = stemGrad;
      ctx.beginPath();
      ctx.moveTo(-30, 0);
      ctx.quadraticCurveTo(-20, -150, -50, -250);
      ctx.lineTo(50, -250);
      ctx.quadraticCurveTo(20, -150, 30, 0);
      ctx.fill();

      // Cloud cap
      const capGrad = ctx.createRadialGradient(0, -220, 10, 0, -220, 160);
      capGrad.addColorStop(0, '#FFFEA1');
      capGrad.addColorStop(0.3, '#FF9212');
      capGrad.addColorStop(0.7, '#615547');
      capGrad.addColorStop(1, 'rgba(58, 50, 41, 0)');
      ctx.fillStyle = capGrad;

      ctx.beginPath();
      ctx.arc(0, -250, 150, 0, Math.PI * 2);
      ctx.fill();

      // Side plumes
      ctx.beginPath();
      ctx.arc(-80, -220, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(80, -220, 110, 0, Math.PI * 2);
      ctx.fill();

      // Debris/Dust kicks on the ground
      ctx.fillStyle = 'rgba(97, 85, 71, 0.8)';
      for(let i=0; i<7; i++) {
          const ang = (i / 6) * Math.PI;
          const dx = Math.cos(ang + Math.PI) * 200;
          const dy = Math.sin(ang + Math.PI) * 50 - 20;
          ctx.beginPath();
          ctx.arc(dx, dy, 70, 0, Math.PI * 2);
          ctx.fill();
      }
      ctx.restore();

      // Global explosion bloom overlay
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(255, 146, 18, ${timeRatio * timeRatio * 0.8})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      const cameraX = state.player.x - width / 3;

      ctx.save();
      ctx.translate(-cameraX, 0);

      // Distant background elements (mountains/hills)
      ctx.fillStyle = '#2c2621';
      ctx.beginPath();
      ctx.moveTo(cameraX, groundLevel);
      for(let i=0; i<=width; i+=150) {
        ctx.lineTo(cameraX + i, groundLevel - 100 - Math.sin(i * 0.01) * 50);
      }
      ctx.lineTo(cameraX + width, groundLevel);
      ctx.fill();

      // Ground (Detailed)
      const groundGrad = ctx.createLinearGradient(0, groundLevel, 0, height);
      groundGrad.addColorStop(0, '#4a3d31');
      groundGrad.addColorStop(1, '#1f1a14');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(cameraX, groundLevel, width, height - groundLevel);

      // Scenery Houses
      for(let i=0; i<MAP_WIDTH; i+=500) {
        drawGrittyHouse(ctx, i, groundLevel, 220, i % 3 === 0);
      }

      // Panic NPCs in the background
      panicNPCsRef.current.forEach(p => {
        // Draw slightly darkened to push to background
        drawGrittyPerson(ctx, p.x, groundLevel - 10, darken(p.skin, 0.3), darken(p.shirt, 0.3), darken(p.pants, 0.3), p.facingRight, p.x / 40);
      });

      // Shelter / Vault
      ctx.fillStyle = '#1c1c1c';
      ctx.fillRect(SHELTER_X - 20, groundLevel - 240, 260, 240); // outer frame
      
      ctx.fillStyle = '#2c2c2c';
      ctx.fillRect(SHELTER_X, groundLevel - 220, 220, 220); // inner block

      ctx.fillStyle = '#4a4a4a'; // Vault door
      ctx.beginPath();
      ctx.arc(SHELTER_X + 110, groundLevel - 110, 90, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#333';
      for (let i = 0; i < 8; i++) {
          ctx.save();
          ctx.translate(SHELTER_X + 110, groundLevel - 110);
          ctx.rotate((i * Math.PI) / 4);
          ctx.fillRect(-15, -100, 30, 20);
          ctx.restore();
      }

      ctx.fillStyle = '#52FC28'; // Green accent
      ctx.font = 'bold 36px monospace';
      ctx.fillText('VAULT', SHELTER_X + 60, groundLevel - 260);

      if (Math.abs(SHELTER_X - state.player.x) < INTERACT_DISTANCE) {
        ctx.fillStyle = '#FFFEA1';
        ctx.font = '20px monospace';
        ctx.fillText('Hold [E] to Enter', SHELTER_X + 25, groundLevel - 300);
        
        if (state.shelterProgress > 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.8)';
          ctx.fillRect(SHELTER_X + 20, groundLevel - 340, 180, 20);
          ctx.fillStyle = '#52FC28';
          ctx.fillRect(SHELTER_X + 20, groundLevel - 340, 180 * state.shelterProgress, 20);
        }
      }

      // NPCs
      state.npcs.forEach(npc => {
        const isMoving = npc.saved && Math.abs(state.player.x - npc.x) > 5;
        drawGrittyPerson(ctx, npc.x, groundLevel, npc.skin, npc.shirt, npc.pants, state.player.x > npc.x, isMoving ? npc.x / 40 : 0);
        
        if (!npc.saved) {
          ctx.fillStyle = '#FFFEA1';
          ctx.font = 'bold 16px monospace';
          ctx.fillText(npc.name, npc.x - 25, groundLevel - 100);
          
          if (Math.abs(npc.x - state.player.x) < INTERACT_DISTANCE) {
            ctx.fillText('Hold [E] to Help', npc.x - 65, groundLevel - 120);
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(npc.x - 40, groundLevel - 145, 80, 12);
            ctx.fillStyle = '#52FC28';
            ctx.fillRect(npc.x - 40, groundLevel - 145, 80 * npc.progress, 12);
          }
        }
      });

      // Player
      // Primary shades of brown (#997E67 light, #615547 dark)
      const playerRunPhase = state.player.isInteracting ? 0 : state.player.runDistance / 40;
      drawGrittyPerson(ctx, state.player.x, groundLevel, '#f1c27d', '#997E67', '#615547', state.player.facingRight, playerRunPhase, true);
      
      ctx.restore();

      // Heavy vignette for tension
      const vignetteAlpha = timeRatio * 0.85;
      const vigGradient = ctx.createRadialGradient(width/2, height/2, width/3, width/2, height/2, width);
      vigGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vigGradient.addColorStop(1, `rgba(40, 10, 0, ${vignetteAlpha})`);
      ctx.fillStyle = vigGradient;
      ctx.fillRect(0, 0, width, height);
      
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onEnd]);

  return <canvas ref={canvasRef} className="w-full h-full block cursor-none" />;
}
