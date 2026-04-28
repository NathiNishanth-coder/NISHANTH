import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Terminal, RadioTower, Power, RefreshCw } from 'lucide-react';

const TRACKS = [
  { id: 1, title: 'SYNTH_OVERRIDE.AI', artist: 'SYS.PROTOCOL', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'DATA_CORRUPTION.WAV', artist: 'SYS.PROTOCOL', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 3, title: 'SYSTEM_BREACH_99', artist: 'SYS.PROTOCOL', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' }
];

const GRID_SIZE = 20;
const CELL_SIZE = 20; 
const GAME_SPEED = 120; // ms per tick

type Point = { x: number; y: number };

const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }];

const randomFood = (): Point => {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };
};

type GameState = {
  snake: Point[];
  food: Point;
  score: number;
  gameOver: boolean;
  isStarted: boolean;
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    snake: INITIAL_SNAKE,
    food: { x: 15, y: 10 },
    score: 0,
    gameOver: false,
    isStarted: false,
  });
  
  const [highScore, setHighScore] = useState(0);

  const dirRef = useRef<Point>({ x: 0, y: 0 }); 
  const lastProcessedDir = useRef<Point>({ x: 0, y: 0 });

  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const startResetGame = useCallback(() => {
    setGameState(prev => {
      dirRef.current = { x: 1, y: 0 };
      return { 
        ...prev, 
        isStarted: true, 
        gameOver: false, 
        score: 0, 
        snake: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }], 
        food: randomFood() 
      };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      setGameState(prev => {
        if (!prev.isStarted && e.key === ' ') {
            startResetGame();
            return prev;
        }
        if (prev.gameOver && e.key === ' ') {
            startResetGame();
            return prev;
        }
        return prev;
      });

      const { x: lastX, y: lastY } = lastProcessedDir.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (lastY === 0) dirRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (lastY === 0) dirRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (lastX === 0) dirRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (lastX === 0) dirRef.current = { x: 1, y: 0 };
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startResetGame]);

  useEffect(() => {
    const moveSnake = () => {
      setGameState(prev => {
        if (!prev.isStarted || prev.gameOver) return prev;
        
        const curDir = dirRef.current;
        if (curDir.x === 0 && curDir.y === 0) return prev;

        lastProcessedDir.current = curDir;

        const head = prev.snake[0];
        const newHead = { x: head.x + curDir.x, y: head.y + curDir.y };

        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          if (prev.score > highScore) setHighScore(prev.score);
          return { ...prev, gameOver: true };
        }

        if (prev.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
          if (prev.score > highScore) setHighScore(prev.score);
          return { ...prev, gameOver: true };
        }

        const newSnake = [newHead, ...prev.snake];
        let newFood = prev.food;
        let newScore = prev.score;

        if (newHead.x === prev.food.x && newHead.y === prev.food.y) {
          newScore += 10;
          newFood = randomFood();
          while(newSnake.some(s => s.x === newFood.x && s.y === newFood.y)) {
            newFood = randomFood();
          }
        } else {
          newSnake.pop();
        }

        return { ...prev, snake: newSnake, food: newFood, score: newScore };
      });
    };

    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [highScore]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const skipForward = () => {
    setTrackIdx((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const skipBackward = () => {
    setTrackIdx((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, [trackIdx, isPlaying]);

  const handleEnded = () => {
    skipForward();
  };

  return (
    <div className="min-h-screen static-noise bg-[#030303] flex flex-col items-center justify-center p-4 relative z-0 overflow-hidden w-full">
      <audio 
        ref={audioRef} 
        src={TRACKS[trackIdx].src} 
        onEnded={handleEnded} 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="flex flex-col items-center mb-10 z-10 w-full max-w-5xl">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-pixel uppercase tracking-widest flex items-center gap-6 text-center glitch-text animate-tear mb-4" data-text="SYS_SNAKE.EXE">
          <Terminal className="w-10 h-10 md:w-14 md:h-14 text-[#ff00ff]" />
          SYS_SNAKE.EXE
        </h1>
        <div className="flex gap-4 sm:gap-10 mt-6 items-center text-sm md:text-xl font-terminal text-[#00ffff] bg-black px-4 sm:px-8 py-3 glitch-border">
          <span>DATA_COLLECTED: <span className="text-white ml-2 text-xl md:text-2xl">{gameState.score}</span></span>
          <div className="w-2 h-2 bg-[#ff00ff]" />
          <span>MAX_OVERRIDE: <span className="text-white ml-2 text-xl md:text-2xl">{highScore}</span></span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start w-full max-w-5xl justify-center z-10">
        
        {/* Game Board container */}
        <div className="relative p-1 bg-black glitch-border w-[90vw] max-w-[400px] aspect-square">
          <div 
            className="grid bg-[#030303] overflow-hidden w-full h-full border border-gray-800"
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
            }}
          >
            {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isHead = gameState.snake[0].x === x && gameState.snake[0].y === y;
              const isSnake = !isHead && gameState.snake.some(s => s.x === x && s.y === y);
              const isFood = gameState.food.x === x && gameState.food.y === y;

              return (
                <div 
                  key={i} 
                  className={`w-full h-full ${
                    isHead ? 'bg-[#00ffff]' :
                    isSnake ? 'bg-[#00ffff] opacity-60' :
                    isFood ? 'bg-[#ff00ff] animate-pulse' :
                    'bg-transparent'
                  }`} 
                />
              );
            })}
          </div>

          {/* Overlays */}
          {(!gameState.isStarted || gameState.gameOver) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95">
              {gameState.gameOver ? (
                <>
                  <h2 className="text-3xl md:text-4xl text-[#ff00ff] mb-6 font-pixel tracking-widest text-center glitch-text" data-text="SYSTEM FAILURE">SYSTEM FAILURE</h2>
                  <p className="text-xl md:text-2xl text-[#00ffff] mb-10 font-terminal tracking-widest">DATA_COLLECTED: {gameState.score}</p>
                  <button 
                    onClick={startResetGame}
                    className="px-6 py-4 bg-black text-[#00ffff] hover:bg-[#ff00ff] hover:text-black glitch-border font-pixel uppercase transition-colors text-sm md:text-base flex items-center"
                  >
                    <RefreshCw className="mr-3 w-5 h-5 flex-shrink-0" /> REBOOT_SEQ
                  </button>
                </>
              ) : (
                <>
                   <Power className="w-16 h-16 md:w-20 md:h-20 text-[#00ffff] mb-8 animate-pulse" />
                   <button 
                    onClick={startResetGame}
                    className="px-6 py-4 bg-black text-[#00ffff] hover:bg-[#ff00ff] hover:text-black glitch-border font-pixel text-sm md:text-lg uppercase transition-colors"
                  >
                    INITIATE_PROTOCOL
                  </button>
                   <p className="mt-8 text-[#ff00ff] font-terminal text-xl">[- PRESS SPACE TO START -]</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Music Player */}
        <div className="w-[90vw] max-w-[400px] lg:w-80 flex flex-col gap-6 bg-black glitch-border p-6 relative">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-[#ff00ff] opacity-80" />

          {/* Header */}
          <div className="flex justify-between items-center z-10 w-full mb-4 mt-2">
            <div className="flex items-center gap-3">
              <RadioTower className="text-[#ff00ff] w-6 h-6 animate-pulse" />
              <span className="text-sm md:text-base uppercase font-pixel text-[#ff00ff]">AURAL_FEED.AI</span>
            </div>
            
            <div className="flex gap-1.5 items-end h-8">
              <div className={`w-2 bg-[#00ffff] ${isPlaying ? 'animate-eq-1' : 'h-2'}`} />
              <div className={`w-2 bg-[#00ffff] ${isPlaying ? 'animate-eq-2' : 'h-3'}`} />
              <div className={`w-2 bg-[#00ffff] ${isPlaying ? 'animate-eq-3' : 'h-2'}`} />
            </div>
          </div>

          {/* Track Info */}
          <div className="z-10 bg-[#030303] p-5 border border-gray-800 flex flex-col items-center text-center">
            <h3 className="font-pixel text-[#00ffff] text-xs sm:text-sm md:text-base mb-4 leading-relaxed">{TRACKS[trackIdx].title}</h3>
            <p className="text-gray-400 font-terminal text-lg uppercase tracking-widest">{TRACKS[trackIdx].artist}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8 z-10 mt-4 mb-2">
            <button 
              onClick={skipBackward} 
              className="text-[#ff00ff] hover:text-[#00ffff] transition-colors"
            >
              <SkipBack className="w-10 h-10 fill-current" />
            </button>
            
            <button 
              onClick={togglePlay} 
              className="w-16 h-16 border-2 border-[#00ffff] flex items-center justify-center bg-black hover:bg-[#00ffff] hover:text-black text-[#00ffff] transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-1" />
              )}
            </button>

            <button 
              onClick={skipForward} 
              className="text-[#ff00ff] hover:text-[#00ffff] transition-colors"
            >
              <SkipForward className="w-10 h-10 fill-current" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
