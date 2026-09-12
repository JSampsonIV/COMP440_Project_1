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
  { id: 7, x: 100, progress: 0, saved: false, name: 'Blessing', desc: "Your girlfriend, who witnessed the explosion with you.", skin: '#5C3E2B', shirt: '#560E96', pants: '#2767E6'} //my gf made me add her
];

const SKINS = ['#f1c27d', '#e0ac69', '#d2b48c', '#8d5524', '#3d2b1f', '#ffdbac', '#c68642', '#e8beac'];
const SHIRTS = ['#556b2f', '#4682b4', '#8b0000', '#2f4f4f', '#6b4226', '#3b3b3b', '#20504f', '#660000', '#191970', '#808000', '#cd5c5c', '#483d8b'];
const PANTS = ['#2c3e50', '#1a1a1a', '#4a4a4a', '#3e2723', '#2f4f4f', '#191919', '#696969', '#556b2f'];

export default function GameView({ onEnd }: { onEnd: (result: GameResult) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const stateRef = useRef({
    timeElapsed: 0,
    player: { x: 200, isInteracting: false, facingRight: true, runDistance: 0 },
    npcs: JSON.parse(JSON.stringify(INITIAL_NPCS)) as NPC[],
    savedNpcIds: [] as number[],
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
      const cycle = runPhase * 0.8;
      
      const bounce = isMoving ? Math.abs(Math.sin(cycle * 2)) * 6 : 0;
      ctx.translate(0, -bounce - 40); // Lift up so 0 is ground
      
      // Calculate joint angles (in radians)
      const maxThigh = 0.8; 
      const maxCalf = 1.0;
      
      const rightThigh = isMoving ? Math.sin(cycle) * maxThigh : 0.1;
      const rightCalf = isMoving ? Math.max(0, Math.sin(cycle - Math.PI/2) * maxCalf) : 0.1;
      
      const leftThigh = isMoving ? Math.sin(cycle + Math.PI) * maxThigh : -0.1;
      const leftCalf = isMoving ? Math.max(0, Math.sin(cycle + Math.PI - Math.PI/2) * maxCalf) : 0.1;
      
      const rightShoulder = isMoving ? Math.sin(cycle + Math.PI) * 0.8 : 0.1;
      const rightElbow = isMoving ? -0.5 + Math.sin(cycle + Math.PI) * 0.3 : -0.2;
      
      const leftShoulder = isMoving ? Math.sin(cycle) * 0.8 : -0.1;
      const leftElbow = isMoving ? -0.5 + Math.sin(cycle) * 0.3 : -0.2;
      
      const torsoTilt = isMoving ? 0.15 + Math.sin(cycle * 2) * 0.05 : 0.05;
      
      // Ground shadow
      ctx.save();
      ctx.translate(0, bounce + 40);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const drawLimb = (w: number, h: number, color: string, shadeColor: string, isShoe = false) => {
        // Fallback for roundRect if not perfectly supported, but modern browsers have it.
        ctx.fillStyle = color;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-w/2, 0, w, h, w/2);
        } else {
            ctx.rect(-w/2, 0, w, h);
        }
        ctx.fill();
        ctx.fillStyle = shadeColor;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-w/2, 0, w/3, h, w/2);
        } else {
            ctx.rect(-w/2, 0, w/3, h);
        }
        ctx.fill();
        if (isShoe) {
            ctx.fillStyle = '#111';
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(-w/2 - 2, h - 8, w + 6, 10, 4);
            else ctx.rect(-w/2 - 2, h - 8, w + 6, 10);
            ctx.fill();
        }
      };

      // LEFT ARM (Back)
      ctx.save();
      ctx.translate(0, -18);
      ctx.rotate(leftShoulder);
      drawLimb(8, 16, darken(shirt, 0.2), darken(shirt, 0.4));
      ctx.translate(0, 14);
      ctx.rotate(leftElbow);
      drawLimb(7, 16, darken(skin, 0.2), darken(skin, 0.4));
      ctx.restore();

      // LEFT LEG (Back)
      ctx.save();
      ctx.translate(0, 8);
      ctx.rotate(leftThigh);
      drawLimb(11, 20, darken(pants, 0.2), darken(pants, 0.4));
      ctx.translate(0, 18);
      ctx.rotate(leftCalf);
      drawLimb(9, 20, darken(pants, 0.2), darken(pants, 0.4), true);
      ctx.restore();

      // TORSO
      ctx.save();
      ctx.rotate(torsoTilt);
      ctx.fillStyle = shirt;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-10, -22, 20, 32, 6);
      else ctx.rect(-10, -22, 20, 32);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-10, -22, 6, 32, 6);
      else ctx.rect(-10, -22, 6, 32);
      ctx.fill();
      // Belt
      ctx.fillStyle = '#222';
      ctx.fillRect(-10, 6, 20, 5);
      // Buckle
      ctx.fillStyle = '#777';
      ctx.fillRect(4, 5, 4, 7);
      
      // HEAD
      ctx.save();
      ctx.translate(0, -24);
      ctx.rotate(-torsoTilt + (isMoving ? Math.sin(cycle * 2) * 0.05 : 0)); // Keep head upright
      ctx.fillStyle = skin;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-8, -20, 16, 22, 6);
      else ctx.rect(-8, -20, 16, 22);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-8, -20, 5, 22, 6);
      else ctx.rect(-8, -20, 5, 22);
      ctx.fill();
      // Hair
      ctx.fillStyle = '#2c1e16';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-9, -22, 18, 8, 4);
      else ctx.rect(-9, -22, 18, 8);
      ctx.fill();
      ctx.fillRect(-9, -16, 6, 12);
      
      if (isPlayer) {
          // Goggles
          ctx.fillStyle = '#FF9212';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(-4, -13, 14, 6, 2);
          else ctx.rect(-4, -13, 14, 6);
          ctx.fill();
          // Goggle strap
          ctx.fillStyle = '#111';
          ctx.fillRect(-9, -12, 5, 4);
      }
      ctx.restore(); // end head
      ctx.restore(); // end torso

      // RIGHT LEG (Front)
      ctx.save();
      ctx.translate(0, 8);
      ctx.rotate(rightThigh);
      drawLimb(12, 22, pants, darken(pants, 0.2));
      ctx.translate(0, 20);
      ctx.rotate(rightCalf);
      drawLimb(10, 22, pants, darken(pants, 0.2), true);
      ctx.restore();

      // RIGHT ARM (Front)
      ctx.save();
      ctx.translate(0, -18);
      ctx.rotate(rightShoulder);
      drawLimb(9, 18, shirt, darken(shirt, 0.2));
      ctx.translate(0, 16);
      ctx.rotate(rightElbow);
      drawLimb(8, 18, skin, darken(skin, 0.2));
      if (isPlayer) {
          ctx.fillStyle = '#52FC28'; // Pip-boy style Arm device
          ctx.fillRect(-5, 0, 10, 8);
          ctx.fillStyle = '#111';
          ctx.fillRect(-5, 2, 10, 4);
      }
      ctx.restore();
      ctx.restore(); // Restore facing scale and translation
    };

    const drawGrittyHouse = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, isDamaged: boolean, colorIndex: number) => {
      ctx.save();
      ctx.translate(x, y);

      const houseColors = ['#4a4238', '#5c6b73', '#6a3b35', '#4a5043', '#554433'];
      const houseColor = houseColors[colorIndex % houseColors.length];

      // Main structure
      ctx.fillStyle = houseColor;
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

        if (isDamaged) {
          ctx.fillStyle = '#3a2411';
          ctx.save();
          ctx.translate(wx + 18, wy + 23);
          ctx.rotate(0.2);
          ctx.fillRect(-22, -4, 44, 8);
          ctx.rotate(-0.5);
          ctx.fillRect(-22, -4, 44, 8);
          ctx.restore();
        }
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
            if (!state.savedNpcIds.includes(interactingWithNpc.id)) {
              state.savedNpcIds.push(interactingWithNpc.id);
            }
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
          let isMoving = false;
          if (keys.a) {
            state.player.x -= PLAYER_SPEED * dt;
            state.player.facingRight = false;
            state.player.runDistance += PLAYER_SPEED * dt;
            isMoving = true;
          }
          if (keys.d) {
            state.player.x += PLAYER_SPEED * dt;
            state.player.facingRight = true;
            state.player.runDistance += PLAYER_SPEED * dt;
            isMoving = true;
          }
          if (!isMoving) {
            state.player.runDistance = 0; // Reset animation when stopped
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
        state.npcs.forEach((npc) => {
          if (npc.saved) {
            const followIndex = state.savedNpcIds.indexOf(npc.id);
            const orderIndex = followIndex !== -1 ? followIndex : 0;
            const targetX = state.player.x - (state.player.facingRight ? 1 : -1) * (60 + orderIndex * 50);
            const dx = targetX - npc.x;
            if (Math.abs(dx) > 5) {
              npc.x += Math.sign(dx) * PLAYER_SPEED * 1.05 * dt; 
            }
          }
        });

        const timeRatio = state.timeElapsed / TOTAL_TIME;
      }

      // Drawing
      const width = canvas.width;
      const height = canvas.height;

      const timeRatio = state.timeElapsed / TOTAL_TIME;
      const shakeMag = Math.pow(timeRatio, 4) * 40; 
      const shakeX = (Math.random() - 0.5) * shakeMag;
      const shakeY = (Math.random() - 0.5) * shakeMag;

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Base background (apocalyptic sky)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#1a1016'); // dark purple/black
      skyGrad.addColorStop(0.5, '#4a2511'); // burnt reddish brown
      skyGrad.addColorStop(1, '#8c3b22'); // dirty orange at horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-50, -50, width + 100, height + 100);
      
      // Mushroom Cloud Explosion
      ctx.save();
      // Start with a large visible cloud at scale 1.0, and grow slightly
      const cloudScale = 1.0 + (timeRatio * 1.8);
      const centerX = width / 2;
      const groundLevel = height - 80;
      
      ctx.translate(centerX, groundLevel);
      ctx.scale(cloudScale, cloudScale);

      // Dust ring (Base Surge)
      ctx.save();
      const dustRadius = 400 + (timeRatio * 400);
      ctx.scale(1, 0.15); 
      const dustGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, dustRadius);
      dustGrad.addColorStop(0, 'rgba(255, 120, 0, 0.9)');
      dustGrad.addColorStop(0.2, 'rgba(120, 90, 70, 0.9)');
      dustGrad.addColorStop(0.6, 'rgba(60, 50, 45, 0.8)');
      dustGrad.addColorStop(1, 'rgba(40, 30, 25, 0)');
      ctx.fillStyle = dustGrad;
      ctx.beginPath();
      ctx.arc(0, 0, dustRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Cloud stem
      const stemGrad = ctx.createLinearGradient(-60, 0, 60, 0);
      stemGrad.addColorStop(0, '#111');
      stemGrad.addColorStop(0.15, '#333');
      stemGrad.addColorStop(0.5, '#ffa500'); // fiery core
      stemGrad.addColorStop(0.85, '#333');
      stemGrad.addColorStop(1, '#111');
      ctx.fillStyle = stemGrad;
      ctx.beginPath();
      ctx.moveTo(-50, 0);
      ctx.bezierCurveTo(-30, -150, -20, -300, -80, -450);
      ctx.lineTo(80, -450);
      ctx.bezierCurveTo(20, -300, 30, -150, 50, 0);
      ctx.fill();

      // Cauliflower Cap function
      const drawPuff = (px: number, py: number, pr: number, innerColor: string, outerColor: string) => {
          const grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
          grad.addColorStop(0, innerColor);
          grad.addColorStop(0.7, outerColor);
          grad.addColorStop(1, 'rgba(20, 20, 20, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fill();
      };

      // Inner glowing core
      drawPuff(0, -450, 180, '#ffffff', '#ff4500');
      
      // Outer dark ash puffs
      drawPuff(0, -520, 160, '#ff4500', '#1a1a1a');
      drawPuff(-100, -450, 140, '#ff6347', '#111111');
      drawPuff(100, -450, 140, '#ff6347', '#111111');
      drawPuff(-150, -380, 120, '#444444', '#0a0a0a');
      drawPuff(150, -380, 120, '#444444', '#0a0a0a');
      drawPuff(-70, -360, 130, '#883311', '#1a1a1a');
      drawPuff(70, -360, 130, '#883311', '#1a1a1a');
      drawPuff(0, -600, 140, '#555555', '#0a0a0a');

      ctx.restore();

      const cameraX = state.player.x - width / 3;

      ctx.save();
      ctx.translate(-cameraX, 0);

      // Distant Ruined Cityscape (Parallax 0.3)
      ctx.fillStyle = '#16100c';
      const cityX = cameraX * 0.3;
      for(let i = -1000; i < MAP_WIDTH + 2000; i += 120) {
          if (i > cityX - 300 && i < cityX + width + 300) {
              const h = 100 + Math.abs(Math.sin(i * 99)) * 250;
              const w = 40 + Math.abs(Math.cos(i * 33)) * 80;
              ctx.fillRect(i - cityX, groundLevel - h, w, h);
              // Sparse illuminated windows
              if (Math.sin(i) > 0.5) {
                  ctx.fillStyle = 'rgba(255, 180, 50, 0.2)';
                  ctx.fillRect(i - cityX + 10, groundLevel - h + 20, 4, 4);
                  ctx.fillStyle = '#16100c';
              }
          }
      }

      // Distant background elements (mountains/hills - Parallax 0.5)
      ctx.fillStyle = '#1c1512';
      const hillX = cameraX * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, groundLevel);
      for(let i = -200; i <= width + 200; i += 150) {
        ctx.lineTo(i, groundLevel - 100 - Math.sin((i + hillX) * 0.01) * 50);
      }
      ctx.lineTo(width + 200, groundLevel);
      ctx.fill();

      // Ground (Detailed Wasteland)
      const groundGrad = ctx.createLinearGradient(0, groundLevel, 0, height);
      groundGrad.addColorStop(0, '#3d3024');
      groundGrad.addColorStop(1, '#15110d');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(cameraX, groundLevel, width, height - groundLevel);

      // Parallax cracked ground details
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      const startX = Math.floor(cameraX / 100) * 100 - 100;
      for (let i = startX; i < cameraX + width + 100; i += 100) {
          const h1 = Math.abs(Math.sin(i * 12.3)) * (height - groundLevel - 20) + groundLevel;
          const h2 = Math.abs(Math.cos(i * 4.5)) * (height - groundLevel - 20) + groundLevel;
          ctx.beginPath();
          ctx.moveTo(i, h1);
          ctx.lineTo(i + 40, h2);
          ctx.lineTo(i + 80, h1 + 10);
          ctx.stroke();
      }
      ctx.restore();

      // Scenery Houses
      for(let i=0; i<MAP_WIDTH; i+=500) {
        drawGrittyHouse(ctx, i, groundLevel, 220, i % 3 === 0, Math.floor(i / 500));
      }

      // Panic NPCs in the background
      panicNPCsRef.current.forEach(p => {
        // Draw slightly darkened to push to background
        drawGrittyPerson(ctx, p.x, groundLevel - 10, darken(p.skin, 0.3), darken(p.shirt, 0.3), darken(p.pants, 0.3), p.facingRight, p.x / 40);
      });

      // Shelter / Vault
      ctx.fillStyle = '#1c1c1c';
      ctx.fillRect(SHELTER_X - 20, groundLevel - 240, 260, 240); // outer frame
      
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(SHELTER_X, groundLevel - 220, 220, 220); // inner block

      // Heavy Vault Door (Gear shape)
      ctx.fillStyle = '#4a4a4a';
      ctx.beginPath();
      ctx.arc(SHELTER_X + 110, groundLevel - 110, 95, 0, Math.PI * 2);
      ctx.fill();
      
      for(let i=0; i<12; i++) {
          ctx.save();
          ctx.translate(SHELTER_X + 110, groundLevel - 110);
          ctx.rotate(i * (Math.PI*2)/12);
          ctx.fillStyle = '#4a4a4a';
          ctx.fillRect(-12, -105, 24, 20);
          ctx.restore();
      }
      
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath();
      ctx.arc(SHELTER_X + 110, groundLevel - 110, 80, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(SHELTER_X + 110, groundLevel - 110, 70, 0, Math.PI * 2);
      ctx.fill();
      
      // Vault numbering
      ctx.fillStyle = '#e6c84c'; // classic yellow vault tint
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('13', SHELTER_X + 110, groundLevel - 95);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#e6c84c'; // classic yellow
      ctx.font = 'bold 36px monospace';
      ctx.fillText('VAULT', SHELTER_X + 55, groundLevel - 260);

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
      // Using rugged survivor colors
      const playerRunPhase = state.player.isInteracting ? 0 : state.player.runDistance / 40;
      drawGrittyPerson(ctx, state.player.x, groundLevel, '#f1c27d', '#4a5d23', '#2a3b4c', state.player.facingRight, playerRunPhase, true);
      
      ctx.restore(); // Restore camera translation

      // Film Grain / Dirt Overlay
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for(let i=0; i<400; i++) {
          const rx = Math.random() * width;
          const ry = Math.random() * height;
          const rw = Math.random() * 2 + 1;
          ctx.fillRect(rx, ry, rw, rw);
      }

      // Global explosion bloom overlay (Intensifies rapidly at the end)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const bloomIntensity = Math.min(1, Math.pow(timeRatio, 4) * 1.5 + (timeRatio * timeRatio * 0.8));
      ctx.fillStyle = `rgba(255, 146, 18, ${bloomIntensity})`;
      ctx.fillRect(-50, -50, width + 100, height + 100);
      ctx.restore();

      ctx.restore(); // Restore shake translation

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
