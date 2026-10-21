import { useEffect, useRef, useState, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  Zap,
  Trophy,
  Sparkles,
  Shield,
  X,
} from "lucide-react";
import { Button } from "@/client/components/ui/button";

interface SpaceInvadersGameProps {
  onClose?: () => void;
  onNextQuestion?: () => void;
  nextQuestionLabel?: string;
  sourceContext?: string;
}

export function SpaceInvadersGame({
  onClose,
  onNextQuestion,
  nextQuestionLabel = "Next Question",
  sourceContext = "Practice Challenge Solved!",
}: SpaceInvadersGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("s2c-space-invaders-highscore") || "0");
    }
    return 0;
  });
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [gameState, setGameState] = useState<
    "start" | "playing" | "paused" | "gameover" | "victory"
  >("start");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio synthesizer via Web Audio API (zero external assets needed)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current && typeof window !== "undefined") {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const playSound = useCallback(
    (type: "shoot" | "alienHit" | "playerHit" | "victory" | "gameover") => {
      if (!soundEnabled) return;
      try {
        initAudio();
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const now = ctx.currentTime;
        if (type === "shoot") {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
        } else if (type === "alienHit") {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.18);
        } else if (type === "playerHit") {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.35);
        } else if (type === "victory") {
          const notes = [523.25, 659.25, 783.99, 1046.5]; // C - E - G - C
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            gain.gain.setValueAtTime(0.2, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.15);
          });
        } else if (type === "gameover") {
          const notes = [392.0, 349.23, 329.63, 261.63];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(freq, now + idx * 0.14);
            gain.gain.setValueAtTime(0.18, now + idx * 0.14);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.14 + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.14);
            osc.stop(now + idx * 0.14 + 0.2);
          });
        }
      } catch {
        // Audio error ignore
      }
    },
    [soundEnabled],
  );

  // Keyboard input states
  const keysRef = useRef<{ left: boolean; right: boolean; shoot: boolean }>({
    left: false,
    right: false,
    shoot: false,
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const scoreRef = useRef(score);
  scoreRef.current = score;

  const livesRef = useRef(lives);
  livesRef.current = lives;

  // Touch control callbacks
  const setLeftKey = (pressed: boolean) => {
    keysRef.current.left = pressed;
  };
  const setRightKey = (pressed: boolean) => {
    keysRef.current.right = pressed;
  };
  const triggerShoot = () => {
    keysRef.current.shoot = true;
    setTimeout(() => {
      keysRef.current.shoot = false;
    }, 120);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "KeyA"].includes(e.code)) {
        keysRef.current.left = true;
        e.preventDefault();
      }
      if (["ArrowRight", "KeyD"].includes(e.code)) {
        keysRef.current.right = true;
        e.preventDefault();
      }
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
        keysRef.current.shoot = true;
        e.preventDefault();
      }
      if (e.code === "KeyP") {
        setGameState((prev) =>
          prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev,
        );
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (["ArrowLeft", "KeyA"].includes(e.code)) keysRef.current.left = false;
      if (["ArrowRight", "KeyD"].includes(e.code)) keysRef.current.right = false;
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) keysRef.current.shoot = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Main game loop engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const width = 640;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    // Game Entities
    const player = {
      x: width / 2 - 20,
      y: height - 45,
      width: 40,
      height: 22,
      speed: 6,
      cooldown: 0,
      invulnerable: 0,
    };

    interface Bullet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      isAlien?: boolean;
    }

    interface Alien {
      x: number;
      y: number;
      width: number;
      height: number;
      row: number;
      col: number;
      alive: boolean;
      type: number;
    }

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
      size: number;
    }

    interface Star {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
    }

    let bullets: Bullet[] = [];
    let aliens: Alien[] = [];
    const particles: Particle[] = [];
    const stars: Star[] = Array.from({ length: 70 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.5,
      speed: Math.random() * 0.6 + 0.2,
      opacity: Math.random() * 0.8 + 0.2,
    }));

    let alienDirection = 1;
    let alienStepDown = false;
    let alienSpeed = 1.0 + wave * 0.3;
    let alienShootTimer = 0;

    // Spawn aliens
    const createAliens = () => {
      const rows = 4;
      const cols = 9;
      const alienW = 32;
      const alienH = 22;
      const paddingX = 18;
      const paddingY = 16;
      const startX = (width - (cols * (alienW + paddingX) - paddingX)) / 2;
      const startY = 60;

      const list: Alien[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          list.push({
            x: startX + c * (alienW + paddingX),
            y: startY + r * (alienH + paddingY),
            width: alienW,
            height: alienH,
            row: r,
            col: c,
            alive: true,
            type: r % 3,
          });
        }
      }
      return list;
    };

    aliens = createAliens();

    const spawnExplosion = (x: number, y: number, color: string, count = 16) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 3.5 + 1;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          life: 1.0,
          color,
          size: Math.random() * 2.5 + 1.5,
        });
      }
    };

    // Game loop
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Draw background
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, width, height);

      // Draw Starfield
      stars.forEach((st) => {
        if (gameStateRef.current === "playing") {
          st.y += st.speed;
          if (st.y > height) {
            st.y = 0;
            st.x = Math.random() * width;
          }
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${st.opacity})`;
        ctx.fillRect(st.x, st.y, st.size, st.size);
      });

      if (gameStateRef.current === "playing") {
        // Player movement
        if (keysRef.current.left && player.x > 15) {
          player.x -= player.speed;
        }
        if (keysRef.current.right && player.x + player.width < width - 15) {
          player.x += player.speed;
        }

        // Player shooting
        if (player.cooldown > 0) player.cooldown--;
        if (player.invulnerable > 0) player.invulnerable--;

        if (keysRef.current.shoot && player.cooldown <= 0) {
          bullets.push({
            x: player.x + player.width / 2,
            y: player.y - 4,
            vx: 0,
            vy: -9,
            isAlien: false,
          });
          player.cooldown = 14;
          playSound("shoot");
        }

        // Alien shooting
        alienShootTimer++;
        if (alienShootTimer > Math.max(30, 85 - wave * 8)) {
          alienShootTimer = 0;
          const aliveAliens = aliens.filter((a) => a.alive);
          if (aliveAliens.length > 0) {
            const randomIndex = Math.floor(Math.random() * aliveAliens.length);
            const shooter = aliveAliens[randomIndex];
            if (shooter) {
              bullets.push({
                x: shooter.x + shooter.width / 2,
                y: shooter.y + shooter.height + 4,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 3.8 + wave * 0.4,
                isAlien: true,
              });
            }
          }
        }

        // Update Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          if (!b) continue;

          b.x += b.vx;
          b.y += b.vy;

          if (b.y < -10 || b.y > height + 10 || b.x < 0 || b.x > width) {
            bullets.splice(i, 1);
            continue;
          }

          // Player bullet vs Aliens
          if (!b.isAlien) {
            for (let j = 0; j < aliens.length; j++) {
              const a = aliens[j];
              if (!a) continue;

              if (
                a.alive &&
                b.x >= a.x &&
                b.x <= a.x + a.width &&
                b.y >= a.y &&
                b.y <= a.y + a.height
              ) {
                a.alive = false;
                bullets.splice(i, 1);
                const pts = (3 - (a.row % 3)) * 15 + 10;
                const nextScore = scoreRef.current + pts;
                setScore(nextScore);
                spawnExplosion(
                  a.x + a.width / 2,
                  a.y + a.height / 2,
                  a.row === 0 ? "#ec4899" : a.row === 1 ? "#38bdf8" : "#4ade80",
                );
                playSound("alienHit");
                break;
              }
            }
          } else {
            // Alien bullet vs Player
            if (
              player.invulnerable <= 0 &&
              b.x >= player.x &&
              b.x <= player.x + player.width &&
              b.y >= player.y &&
              b.y <= player.y + player.height
            ) {
              bullets.splice(i, 1);
              const nextLives = livesRef.current - 1;
              setLives(nextLives);
              player.invulnerable = 60; // 1s invulnerable flash
              spawnExplosion(
                player.x + player.width / 2,
                player.y + player.height / 2,
                "#fb7185",
                22,
              );
              playSound("playerHit");

              if (nextLives <= 0) {
                setGameState("gameover");
                playSound("gameover");
                if (scoreRef.current > highScore) {
                  setHighScore(scoreRef.current);
                  localStorage.setItem("s2c-space-invaders-highscore", String(scoreRef.current));
                }
              }
            }
          }
        }

        // Move Aliens
        let hitEdge = false;
        const aliveAliens = aliens.filter((a) => a.alive);

        if (aliveAliens.length === 0) {
          // Wave Cleared!
          playSound("victory");
          setWave((w) => w + 1);
          setScore((s) => s + 500);
          aliens = createAliens();
          bullets = [];
          alienSpeed += 0.4;
        }

        aliveAliens.forEach((a) => {
          if (
            (alienDirection === 1 && a.x + a.width >= width - 20) ||
            (alienDirection === -1 && a.x <= 20)
          ) {
            hitEdge = true;
          }
        });

        if (hitEdge) {
          alienDirection *= -1;
          alienStepDown = true;
        }

        aliveAliens.forEach((a) => {
          a.x += alienDirection * alienSpeed;
          if (alienStepDown) {
            a.y += 14;
            // Check if invaders reached player bottom
            if (a.y + a.height >= player.y) {
              setGameState("gameover");
              playSound("gameover");
            }
          }
        });
        alienStepDown = false;
      }

      // Render Player
      if (player.invulnerable % 8 < 4) {
        ctx.save();
        ctx.translate(player.x, player.y);

        // Retro Spacecraft Hull
        ctx.fillStyle = "#10b981"; // emerald chassis
        ctx.beginPath();
        ctx.moveTo(player.width / 2, 0);
        ctx.lineTo(player.width, player.height);
        ctx.lineTo(player.width - 8, player.height - 4);
        ctx.lineTo(8, player.height - 4);
        ctx.lineTo(0, player.height);
        ctx.closePath();
        ctx.fill();

        // Cockpit glow
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(player.width / 2, player.height / 2 - 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Engine flame
        if (gameStateRef.current === "playing") {
          ctx.fillStyle = Math.random() > 0.4 ? "#f97316" : "#facc15";
          ctx.beginPath();
          ctx.moveTo(player.width / 2 - 6, player.height);
          ctx.lineTo(player.width / 2 + 6, player.height);
          ctx.lineTo(player.width / 2, player.height + 6 + Math.random() * 5);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      // Render Aliens
      aliens.forEach((a) => {
        if (!a.alive) return;
        ctx.save();
        ctx.translate(a.x, a.y);

        const color = a.row === 0 ? "#ec4899" : a.row === 1 ? "#38bdf8" : "#4ade80";
        ctx.fillStyle = color;

        // Retro pixelated alien sprite shapes
        if (a.type === 0) {
          // Squishy Top Alien
          ctx.fillRect(8, 0, 16, 4);
          ctx.fillRect(4, 4, 24, 6);
          ctx.fillRect(0, 10, 32, 6);
          ctx.fillRect(4, 16, 6, 6);
          ctx.fillRect(22, 16, 6, 6);
          // Eyes
          ctx.fillStyle = "#090d16";
          ctx.fillRect(8, 6, 4, 4);
          ctx.fillRect(20, 6, 4, 4);
        } else if (a.type === 1) {
          // Mid Crab Alien
          ctx.fillRect(6, 0, 20, 4);
          ctx.fillRect(2, 4, 28, 6);
          ctx.fillRect(0, 10, 32, 6);
          ctx.fillRect(2, 16, 4, 6);
          ctx.fillRect(10, 16, 12, 4);
          ctx.fillRect(26, 16, 4, 6);
          // Eyes
          ctx.fillStyle = "#090d16";
          ctx.fillRect(6, 6, 4, 4);
          ctx.fillRect(22, 6, 4, 4);
        } else {
          // Bottom Octopus Alien
          ctx.fillRect(10, 0, 12, 4);
          ctx.fillRect(6, 4, 20, 6);
          ctx.fillRect(2, 10, 28, 6);
          ctx.fillRect(0, 16, 6, 6);
          ctx.fillRect(12, 16, 8, 4);
          ctx.fillRect(26, 16, 6, 6);
          // Eyes
          ctx.fillStyle = "#090d16";
          ctx.fillRect(8, 6, 4, 4);
          ctx.fillRect(20, 6, 4, 4);
        }

        ctx.restore();
      });

      // Render Bullets
      bullets.forEach((b) => {
        ctx.save();
        if (b.isAlien) {
          ctx.fillStyle = "#fb7185";
          ctx.shadowColor = "#f43f5e";
          ctx.shadowBlur = 6;
          ctx.fillRect(b.x - 2, b.y - 3, 4, 9);
        } else {
          ctx.fillStyle = "#38bdf8";
          ctx.shadowColor = "#0284c7";
          ctx.shadowBlur = 8;
          ctx.fillRect(b.x - 2, b.y - 5, 4, 12);
        }
        ctx.restore();
      });

      // Render Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!p) continue;

        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt * 2.2;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.globalAlpha = 1.0;
      }

      // HUD overlay inside canvas
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "11px monospace";
      ctx.fillText(`SCORE: ${scoreRef.current}`, 16, 24);
      ctx.fillText(`WAVE: ${wave}`, width / 2 - 25, 24);
      ctx.fillText(`HIGH: ${Math.max(highScore, scoreRef.current)}`, width - 95, 24);

      // Lives indicators (mini spacecrafts)
      for (let l = 0; l < livesRef.current; l++) {
        ctx.fillStyle = "#10b981";
        ctx.fillRect(16 + l * 18, height - 16, 12, 6);
        ctx.fillRect(20 + l * 18, height - 20, 4, 4);
      }

      // Start screen overlay
      if (gameStateRef.current === "start") {
        ctx.fillStyle = "rgba(9, 13, 22, 0.78)";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 26px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SPACE INVADERS", width / 2, height / 2 - 35);

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "14px sans-serif";
        ctx.fillText("Practice Reward Brain Break 🚀", width / 2, height / 2 - 5);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "12px monospace";
        ctx.fillText(
          "Controls: [◀ / ▶] or [A / D] to Move • [SPACE] to Fire",
          width / 2,
          height / 2 + 25,
        );

        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText("▶ TAP OR PRESS SPACE TO START", width / 2, height / 2 + 65);
        ctx.textAlign = "left";
      }

      // Pause screen overlay
      if (gameStateRef.current === "paused") {
        ctx.fillStyle = "rgba(9, 13, 22, 0.75)";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME PAUSED", width / 2, height / 2 - 10);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "13px sans-serif";
        ctx.fillText("Press P or Tap to Resume", width / 2, height / 2 + 20);
        ctx.textAlign = "left";
      }

      // Game Over screen
      if (gameStateRef.current === "gameover") {
        ctx.fillStyle = "rgba(9, 13, 22, 0.85)";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#fb7185";
        ctx.font = "bold 28px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", width / 2, height / 2 - 30);

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "15px sans-serif";
        ctx.fillText(
          `Final Score: ${scoreRef.current} PTS (Wave ${wave})`,
          width / 2,
          height / 2 + 5,
        );

        ctx.fillStyle = "#38bdf8";
        ctx.font = "13px sans-serif";
        ctx.fillText(
          "Press Restart to try again or Skip to Next Challenge!",
          width / 2,
          height / 2 + 35,
        );
        ctx.textAlign = "left";
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [wave, soundEnabled, playSound, highScore]);

  const handleStartGame = () => {
    initAudio();
    if (gameState === "start" || gameState === "gameover") {
      setScore(0);
      setLives(3);
      setWave(1);
      setGameState("playing");
    } else if (gameState === "paused") {
      setGameState("playing");
    }
  };

  const restartGame = () => {
    initAudio();
    setScore(0);
    setLives(3);
    setWave(1);
    setGameState("playing");
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-950 text-white shadow-2xl">
      {/* Arcade Header */}
      <div className="flex items-center justify-between w-full px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 shadow-md shadow-emerald-500/20 text-white font-bold text-xs">
            👾
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Space Invaders
              </h3>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                Bonus Arcade Break
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{sourceContext}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={soundEnabled ? "Mute SFX" : "Enable SFX"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Arcade"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Arcade Top Info Bar */}
      <div className="flex items-center justify-between w-full px-6 py-2.5 bg-slate-900/50 border-b border-slate-800/80 text-xs text-slate-300">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-400">Score:</span>
            <span className="font-mono font-bold text-amber-300">{score}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-slate-400">High:</span>
            <span className="font-mono font-bold text-yellow-300">
              {Math.max(highScore, score)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">Shields:</span>
            <span className="font-mono font-bold text-emerald-300">{lives} / 3</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gameState === "playing" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setGameState("paused")}
              className="h-7 text-xs border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300"
            >
              <Pause className="h-3 w-3 mr-1" /> Pause
            </Button>
          )}
          {gameState === "paused" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setGameState("playing")}
              className="h-7 text-xs border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-emerald-400"
            >
              <Play className="h-3 w-3 mr-1" /> Resume
            </Button>
          )}
          {gameState === "gameover" && (
            <Button
              size="sm"
              onClick={restartGame}
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Play Again
            </Button>
          )}
        </div>
      </div>

      {/* Screen Canvas Area */}
      <div
        className="relative flex items-center justify-center p-3 bg-slate-950 w-full cursor-pointer"
        onClick={() => {
          if (gameState === "start" || gameState === "paused") handleStartGame();
        }}
      >
        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-[0_0_30px_rgba(56,189,248,0.15)] bg-black">
          <canvas ref={canvasRef} className="block w-full max-w-[640px] aspect-[4/3] touch-none" />
        </div>
      </div>

      {/* Touch / Mobile / On-Screen Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between w-full px-6 py-4 bg-slate-900/90 border-t border-slate-800 gap-3">
        {/* On-screen control pads for tablets & touch */}
        <div className="flex items-center gap-2">
          <button
            onPointerDown={() => setLeftKey(true)}
            onPointerUp={() => setLeftKey(false)}
            onPointerLeave={() => setLeftKey(false)}
            className="flex h-11 w-12 items-center justify-center rounded-xl bg-slate-800 active:bg-slate-700 border border-slate-700 text-slate-200 select-none shadow-sm transition cursor-pointer"
            aria-label="Move Left"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onPointerDown={() => setRightKey(true)}
            onPointerUp={() => setRightKey(false)}
            onPointerLeave={() => setRightKey(false)}
            className="flex h-11 w-12 items-center justify-center rounded-xl bg-slate-800 active:bg-slate-700 border border-slate-700 text-slate-200 select-none shadow-sm transition cursor-pointer"
            aria-label="Move Right"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            onPointerDown={triggerShoot}
            className="flex h-11 px-4 items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs select-none shadow-lg shadow-rose-600/30 transition cursor-pointer"
          >
            <Zap className="h-4 w-4" /> FIRE
          </button>
        </div>

        {/* Choice buttons: Continue to Next Question vs Close */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              Resume Coding
            </Button>
          )}

          {onNextQuestion && (
            <Button
              size="sm"
              onClick={onNextQuestion}
              className="text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-md shadow-emerald-900/30 cursor-pointer"
            >
              {nextQuestionLabel} ⏭️
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
