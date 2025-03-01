import { useState, useEffect, useCallback } from 'react';

const TurtleCrossingGame = () => {
  // Game state
  const [turtlePosition, setTurtlePosition] = useState({ x: 2, y: 9 }); // Initial position at bottom left
  const [isInShell, setIsInShell] = useState(false); // Whether turtle is hiding in shell
  const [obstacles, setObstacles] = useState([]); // Obstacles in the river
  const [gameOver, setGameOver] = useState(false); // Game over state
  const [won, setWon] = useState(false); // Win state
  const [score, setScore] = useState(0); // Player's score
  const [gameStarted, setGameStarted] = useState(false); // Whether game has started
  const [level, setLevel] = useState(1); // Current level

  // Game constants
  const GRID_WIDTH = 10;
  const GRID_HEIGHT = 10;
  const OBSTACLE_SPEED = 250; // ms per cell move
  const OBSTACLE_TYPES = ['🌊', '🌲', '🪨']; // Water, tree, rock obstacles

  // Initialize game
  useEffect(() => {
    if (gameStarted) {
      // Reset game state
      setTurtlePosition({ x: 2, y: 9 });
      setIsInShell(false);
      setGameOver(false);
      setWon(false);
      setScore(0);
      
      // Generate initial obstacles based on level
      const initialObstacles = [];
      
      // Create row patterns for the river (rows 2-7)
      for (let y = 2; y < 8; y++) {
        const direction = y % 2 === 0 ? 'right' : 'left';
        const speed = OBSTACLE_SPEED - (level * 20); // Speed increases with level
        
        // Add obstacles in this row
        const count = 2 + Math.floor(Math.random() * 3); // 2-4 obstacles per row
        for (let i = 0; i < count; i++) {
          const x = Math.floor(Math.random() * GRID_WIDTH);
          const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
          initialObstacles.push({ x, y, direction, type, speed });
        }
      }
      
      setObstacles(initialObstacles);
    }
  }, [gameStarted, level]);

  // Play sound effect
  const playSound = useCallback((type) => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    if (type === 'move') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(330, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(220, context.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
    } else if (type === 'shell') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(180, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(140, context.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    } else if (type === 'collision') {
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150, context.currentTime);
      oscillator.frequency.linearRampToValueAtTime(50, context.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
    } else if (type === 'win') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.2, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
    }

    oscillator.start();
    oscillator.stop(context.currentTime + 0.4);
  }, []);

  // Handle shell state
  const toggleShell = useCallback(() => {
    if (!gameOver && !won && gameStarted) {
      setIsInShell(prev => !prev);
      playSound('shell');
    }
  }, [gameOver, won, gameStarted, playSound]);

  // Move turtle
  const moveTurtle = useCallback((direction) => {
    if (isInShell || gameOver || won || !gameStarted) return;
    
    setTurtlePosition(prev => {
      let newX = prev.x;
      let newY = prev.y;
      
      switch (direction) {
        case 'up':
          newY = Math.max(0, prev.y - 1);
          break;
        case 'down':
          newY = Math.min(GRID_HEIGHT - 1, prev.y + 1);
          break;
        case 'left':
          newX = Math.max(0, prev.x - 1);
          break;
        case 'right':
          newX = Math.min(GRID_WIDTH - 1, prev.x + 1);
          break;
      }
      
      // Only play sound if actually moved
      if (newX !== prev.x || newY !== prev.y) {
        playSound('move');
      }
      
      return { x: newX, y: newY };
    });
  }, [isInShell, gameOver, won, gameStarted, playSound]);

  // Game loop for obstacles
  useEffect(() => {
    if (!gameStarted || gameOver || won) return;

    // Move obstacles
    const obstacleIntervals = obstacles.map((obstacle, index) => {
      return setInterval(() => {
        setObstacles(prev => {
          return prev.map((obs, i) => {
            if (i !== index) return obs;
            
            let newX = obs.x;
            if (obs.direction === 'right') {
              newX = (obs.x + 1) % GRID_WIDTH; // Wrap around right to left
            } else {
              newX = obs.x - 1 < 0 ? GRID_WIDTH - 1 : obs.x - 1; // Wrap around left to right
            }
            
            return { ...obs, x: newX };
          });
        });
      }, obstacle.speed);
    });
    
    return () => {
      obstacleIntervals.forEach(interval => clearInterval(interval));
    };
  }, [obstacles, gameStarted, gameOver, won]);

  // Collision detection and win condition check
  useEffect(() => {
    if (!gameStarted || gameOver || won) return;

    const gameLoop = setInterval(() => {
      // Check for collisions
      const collision = obstacles.some(obstacle => 
        obstacle.x === turtlePosition.x && obstacle.y === turtlePosition.y && !isInShell
      );
      
      if (collision) {
        setGameOver(true);
        playSound('collision');
      }
      
      // Check if reached the top (win condition)
      if (turtlePosition.y === 0) {
        setWon(true);
        setScore(prevScore => prevScore + 100 * level);
        playSound('win');
      }
    }, 100);
    
    return () => clearInterval(gameLoop);
  }, [turtlePosition, obstacles, isInShell, gameStarted, gameOver, won, level, playSound]);

  // Keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') {
        moveTurtle('up');
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        moveTurtle('down');
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        moveTurtle('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        moveTurtle('right');
      } else if (e.key === ' ') {
        if (!gameStarted) {
          setGameStarted(true);
        } else {
          toggleShell();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveTurtle, toggleShell, gameStarted]);

  // Next level
  const goToNextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setGameStarted(false);
    setTimeout(() => setGameStarted(true), 100);
  }, []);

  // Restart game
  const restartGame = useCallback(() => {
    setLevel(1);
    setGameStarted(false);
    setTimeout(() => setGameStarted(true), 100);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-green-50">
      {/* Header */}
      <header className="bg-green-700 text-white p-4 pt-20 text-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold">カメののんびりクロス</h1>
        <p className="text-sm mt-2">
          {!gameStarted 
            ? 'スペースキーを押してスタート！' 
            : '矢印キーで移動、スペースキーで甲羅にこもる'}
        </p>
        {gameStarted && (
          <div className="flex justify-between max-w-md mx-auto mt-2">
            <div>レベル: {level}</div>
            <div>スコア: {score}</div>
          </div>
        )}
      </header>

      {/* Main game area */}
      <main className="flex flex-col items-center justify-center p-4 flex-1">
        {!gameStarted && !gameOver && !won ? (
          <div className="text-center">
            <div className="text-4xl mb-4">🐢</div>
            <h2 className="text-xl font-bold mb-4">カメののんびりクロスへようこそ！</h2>
            <p className="mb-6">矢印キーで川を渡り、スペースキーで甲羅にこもって危険を回避しよう。</p>
            <button 
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-green-700"
              onClick={() => setGameStarted(true)}
            >
              スタート
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md bg-blue-100 border-4 border-blue-800 rounded-lg p-4 mb-4 relative">
            {/* Level indicator */}
            <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded-md text-sm font-bold">
              レベル {level}
            </div>
            
            {/* Score indicator */}
            <div className="absolute top-2 right-2 bg-white text-black px-2 py-1 rounded-md text-sm font-bold">
              スコア: {score}
            </div>
            
            {/* Game grid */}
            <div className="grid grid-cols-10 gap-0 mt-10">
              {Array.from({ length: GRID_HEIGHT }).map((_, y) => (
                Array.from({ length: GRID_WIDTH }).map((_, x) => {
                  // Find if there's an obstacle at this position
                  const obstacle = obstacles.find(o => o.x === x && o.y === y);
                  
                  // Determine cell content and style
                  let cellContent = '';
                  let cellStyle = 'flex items-center justify-center w-8 h-8 border border-blue-200';
                  
                  // Top row (safe zone)
                  if (y === 0) {
                    cellStyle += ' bg-yellow-200';
                    cellContent = '🏠';
                  } 
                  // Bottom row (starting zone)
                  else if (y === GRID_HEIGHT - 1) {
                    cellStyle += ' bg-green-200';
                  }
                  // Middle rows (river)
                  else if (y >= 2 && y < 8) {
                    cellStyle += ' bg-blue-400';
                    if (obstacle) {
                      cellContent = obstacle.type;
                    }
                  }
                  // Safe banks
                  else {
                    cellStyle += ' bg-green-300';
                  }
                  
                  // Player position
                  if (x === turtlePosition.x && y === turtlePosition.y) {
                    cellContent = isInShell ? '🐚' : '🐢';
                  }
                  
                  return (
                    <div key={`${x}-${y}`} className={cellStyle}>
                      {cellContent}
                    </div>
                  );
                })
              ))}
            </div>
          </div>
        )}
        
        {/* Game over screen */}
        {gameOver && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20">
            <div className="bg-white p-8 rounded-lg text-center max-w-md">
              <h2 className="text-2xl font-bold mb-4">ゲームオーバー</h2>
              <div className="text-6xl mb-4">💦</div>
              <p className="mb-4">スコア: {score}</p>
              <button 
                className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 mr-2"
                onClick={restartGame}
              >
                最初からやり直す
              </button>
            </div>
          </div>
        )}
        
        {/* Win screen */}
        {won && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20">
            <div className="bg-white p-8 rounded-lg text-center max-w-md">
              <h2 className="text-2xl font-bold mb-4">クリア！</h2>
              <div className="text-6xl mb-4">🎉</div>
              <p className="mb-4">スコア: {score}</p>
              <button 
                className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 mr-2"
                onClick={goToNextLevel}
              >
                次のレベルへ
              </button>
              <button 
                className="bg-gray-500 text-white px-4 py-2 rounded font-medium hover:bg-gray-600 mt-2"
                onClick={restartGame}
              >
                最初からやり直す
              </button>
            </div>
          </div>
        )}
        
        {/* Mobile controls */}
        {gameStarted && !gameOver && !won && (
          <div className="mt-6 md:hidden">
            <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
              <div></div>
              <button
                className="bg-gray-200 w-14 h-14 rounded-full text-2xl active:bg-gray-300"
                onClick={() => moveTurtle('up')}
              >
                ⬆️
              </button>
              <div></div>
              
              <button
                className="bg-gray-200 w-14 h-14 rounded-full text-2xl active:bg-gray-300"
                onClick={() => moveTurtle('left')}
              >
                ⬅️
              </button>
              <button
                className="bg-green-500 w-14 h-14 rounded-full text-white font-bold active:bg-green-600 flex items-center justify-center text-sm"
                onClick={toggleShell}
              >
                甲羅
              </button>
              <button
                className="bg-gray-200 w-14 h-14 rounded-full text-2xl active:bg-gray-300"
                onClick={() => moveTurtle('right')}
              >
                ➡️
              </button>
              
              <div></div>
              <button
                className="bg-gray-200 w-14 h-14 rounded-full text-2xl active:bg-gray-300"
                onClick={() => moveTurtle('down')}
              >
                ⬇️
              </button>
              <div></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TurtleCrossingGame;