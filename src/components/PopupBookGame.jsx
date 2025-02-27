import { useState, useEffect, useCallback } from 'react';

const PopupBookGame = () => {
  // Game state
  const [position, setPosition] = useState(0); // Current position in the book
  const [isJumping, setIsJumping] = useState(false); // Whether player is currently jumping
  const [obstacles, setObstacles] = useState([]); // Popup obstacles
  const [gameOver, setGameOver] = useState(false); // Game over state
  const [score, setScore] = useState(0); // Player's score
  const [gameStarted, setGameStarted] = useState(false); // Whether game has started

  // Game constants
  const bookLength = 100; // Total length of the book
  const playerHeight = 2; // Player's height when not jumping
  const jumpHeight = 5; // Player's height when jumping
  const obstacleWidth = 3; // Width of obstacles
  const obstacleHeight = 4; // Height of obstacles
  const jumpDuration = 500; // Jump duration in milliseconds
  const moveSpeed = 1; // Speed of movement through the book

  // Initialize obstacles
  useEffect(() => {
    if (gameStarted) {
      // Create obstacles at random positions
      const newObstacles = [
        { position: 15, passed: false },
        { position: 30, passed: false },
        { position: 45, passed: false },
        { position: 60, passed: false },
        { position: 75, passed: false },
        { position: 90, passed: false },
      ];
      setObstacles(newObstacles);
      
      // Reset game state
      setPosition(0);
      setScore(0);
      setGameOver(false);
    }
  }, [gameStarted]);

  // Play sound effect
  const playSound = useCallback((type) => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    if (type === 'jump') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
    } else if (type === 'collision') {
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(220, context.currentTime);
      oscillator.frequency.linearRampToValueAtTime(110, context.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    } else if (type === 'score') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
    }

    oscillator.start();
    oscillator.stop(context.currentTime + 0.3);
  }, []);

  // Handle jumping
  const jump = useCallback(() => {
    if (!isJumping && !gameOver && gameStarted) {
      setIsJumping(true);
      playSound('jump');
      
      setTimeout(() => {
        setIsJumping(false);
      }, jumpDuration);
    }
  }, [isJumping, gameOver, gameStarted, playSound]);

  // Move player forward or backward
  const movePlayer = useCallback((direction) => {
    if (!gameOver && gameStarted) {
      setPosition((prev) => {
        const newPosition = direction === 'forward' 
          ? Math.min(prev + moveSpeed, bookLength)
          : Math.max(prev - moveSpeed, 0);
        return newPosition;
      });
    }
  }, [gameOver, gameStarted, bookLength]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      // Check for collisions with obstacles
      obstacles.forEach((obstacle, index) => {
        // Check if player is at the obstacle position
        const isAtObstacle = Math.abs(position - obstacle.position) < obstacleWidth / 2;
        
        // Check if player is jumping over the obstacle
        const isJumpingOverObstacle = isJumping && isAtObstacle;
        
        // Collision detection
        if (isAtObstacle && !isJumpingOverObstacle && !obstacle.passed) {
          setGameOver(true);
          playSound('collision');
        }
        
        // Score detection - passed an obstacle
        if (position > obstacle.position + obstacleWidth / 2 && !obstacle.passed) {
          setObstacles(prev => 
            prev.map((o, i) => i === index ? { ...o, passed: true } : o)
          );
          setScore(prev => prev + 1);
          playSound('score');
        }
      });

      // Check if player reached the end of the book
      if (position >= bookLength) {
        setGameOver(true);
      }
    }, 100);

    return () => clearInterval(gameLoop);
  }, [position, obstacles, isJumping, gameStarted, gameOver, playSound, bookLength]);

  // Keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          movePlayer('backward');
          break;
        case 'ArrowRight':
          movePlayer('forward');
          break;
        case ' ':
          if (!gameStarted) {
            setGameStarted(true);
          } else {
            jump();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, jump, gameStarted]);

  // Calculate player and viewport positions
  const playerPosition = position;
  const viewportStart = Math.max(0, playerPosition - 10);
  const viewportEnd = Math.min(bookLength, viewportStart + 20);
  
  // Render visible obstacles
  const visibleObstacles = obstacles.filter(
    obstacle => obstacle.position >= viewportStart && obstacle.position <= viewportEnd
  );

  return (
    <div className="min-h-screen flex flex-col bg-yellow-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 pt-20 text-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold">とびだす絵本の国</h1>
        <p className="text-sm mt-2">
          {!gameStarted 
            ? 'スペースキーを押してスタート！' 
            : 'PCの場合は矢印キーで移動、スペースキーでジャンプ'}
        </p>
        {gameStarted && (
          <div className="text-lg mt-2">
            スコア: {score} / {obstacles.length}
          </div>
        )}
      </header>

      {/* Main game area */}
      <main className="flex flex-col items-center justify-center p-4 flex-1">
        {!gameStarted ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-xl font-bold mb-4">とびだす絵本の国へようこそ！</h2>
            <p className="mb-6">矢印キーで絵本を進み、スペースキーで飛び出す仕掛けを避けよう。</p>
            <button 
              className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-indigo-600"
              onClick={() => setGameStarted(true)}
            >
              スタート
            </button>
          </div>
        ) : (
          <div className="w-full max-w-2xl bg-amber-100 border-4 border-amber-800 rounded-lg p-4 mb-4 relative">
            {/* Progress bar */}
            <div className="w-full h-2 bg-amber-200 rounded-full mb-4">
              <div 
                className="h-full bg-indigo-500 rounded-full" 
                style={{ width: `${(position / bookLength) * 100}%` }}
              />
            </div>
            
            {/* Book visualization */}
            <div className="w-full h-48 bg-white relative overflow-hidden rounded border-2 border-amber-300">
              {/* Book pages */}
              <div className="absolute inset-0 flex items-center">
                {Array.from({ length: Math.ceil((viewportEnd - viewportStart) / 2) }).map((_, i) => (
                  <div 
                    key={i} 
                    className="h-full w-4 bg-amber-50 border-r border-amber-200"
                    style={{ marginLeft: i === 0 ? `${(playerPosition - viewportStart) * 10}px` : 0 }}
                  />
                ))}
              </div>
              
              {/* Player character */}
              <div 
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 transition-all duration-500"
                style={{ 
                  height: `${isJumping ? jumpHeight : playerHeight}rem`,
                  bottom: isJumping ? '3rem' : '0',
                }}
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full relative">
                  <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full"></div>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></div>
                  <div className="absolute bottom-2 left-2 right-2 h-1 bg-white rounded-full"></div>
                </div>
                <div className="w-8 h-8 bg-blue-400 rounded-md mt-1"></div>
              </div>
              
              {/* Obstacles */}
              {visibleObstacles.map((obstacle, index) => (
                <div 
                  key={index}
                  className="absolute bottom-0 transition-all"
                  style={{ 
                    left: `${((obstacle.position - viewportStart) / (viewportEnd - viewportStart)) * 100}%`,
                    width: `${obstacleWidth}rem`,
                    height: `${obstacleHeight}rem`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className={`w-full h-full ${obstacle.passed ? 'bg-gray-300' : 'bg-red-500'} rounded-t-lg relative`}>
                    <div className="absolute top-0 left-1/4 right-1/4 h-1/3 bg-white opacity-30 rounded-t-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Game over screen */}
        {gameOver && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20">
            <div className="bg-white p-8 rounded-lg text-center max-w-md">
              <h2 className="text-2xl font-bold mb-4">
                {position >= bookLength ? '絵本完走！' : 'ゲームオーバー'}
              </h2>
              <div className="text-6xl mb-4">
                {position >= bookLength ? '🎉' : '📚'}
              </div>
              <p className="mb-4">スコア: {score} / {obstacles.length}</p>
              <button 
                className="bg-indigo-500 text-white px-4 py-2 rounded font-medium hover:bg-indigo-600"
                onClick={() => {
                  setGameStarted(false);
                  setGameOver(false);
                }}
              >
                もう一度挑戦する
              </button>
            </div>
          </div>
        )}
        
        {/* Mobile controls */}
        {gameStarted && !gameOver && (
          <div className="mt-6 md:hidden">
            <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
              <button
                className="bg-gray-200 w-14 h-14 rounded-full text-2xl active:bg-gray-300"
                onClick={() => movePlayer('backward')}
              >
                ⬅️
              </button>
              <button
                className="bg-indigo-500 w-14 h-14 rounded-full text-white font-bold active:bg-indigo-600 flex items-center justify-center text-lg"
                onClick={jump}
              >
                ジャンプ
              </button>
              <button
                className="bg-gray-200 w-14 h-14 rounded-full text-2xl active:bg-gray-300"
                onClick={() => movePlayer('forward')}
              >
                ➡️
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PopupBookGame;