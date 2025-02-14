import { useState, useEffect, useCallback } from 'react';

const NyankoJump = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [position, setPosition] = useState({ x: 100, y: window.innerHeight - 100 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [fishes, setFishes] = useState([]);
  const [score, setScore] = useState(0);
  const [isGrounded, setIsGrounded] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [lastJumpTime, setLastJumpTime] = useState(0);
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);

  // モバイル端末でのビューポート高さ調整用CSS変数の設定
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  // ウィンドウサイズの変更を監視
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
      setPosition(pos => ({
        x: pos.x,
        y: Math.min(pos.y, window.innerHeight - 100)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setAudioContext(new (window.AudioContext || window.webkitAudioContext)());
  }, []);

  const playSound = useCallback((type) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'jump') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'collect') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  }, [audioContext]);

  const initializeGame = () => {
    setPosition({ x: 100, y: dimensions.height - 100 });
    setVelocity({ x: 0, y: 0 });
    setScore(0);
    setIsGrounded(true);
    setGameStarted(true);

    const initialFishes = Array.from({ length: 5 }, () => ({
      x: Math.random() * (dimensions.width - 100) + 50,
      y: Math.random() * (dimensions.height - 200) + 50,
      id: Math.random()
    }));
    setFishes(initialFishes);
  };

  const handleJump = () => {
    const now = Date.now();
    if (isGrounded && now - lastJumpTime > 50) {
      const jumpPower = dimensions.height * -0.04;
      setVelocity(v => ({ ...v, y: jumpPower }));
      setIsGrounded(false);
      setLastJumpTime(now);
      playSound('jump');
    }
  };

  // タッチ操作の処理
  useEffect(() => {
    if (!gameStarted) return;

    const movement = isMovingLeft ? -8 : isMovingRight ? 8 : 0;
    setVelocity(v => ({ ...v, x: movement }));
  }, [isMovingLeft, isMovingRight, gameStarted]);

  // キーボード操作のサポート（PCユーザー向け）
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted && e.key === ' ') {
        initializeGame();
        return;
      }

      if (!gameStarted) return;

      switch (e.key) {
        case 'ArrowLeft':
          setIsMovingLeft(true);
          break;
        case 'ArrowRight':
          setIsMovingRight(true);
          break;
        case ' ':
          handleJump();
          break;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft') {
        setIsMovingLeft(false);
      } else if (e.key === 'ArrowRight') {
        setIsMovingRight(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, handleJump]);

  // ゲームループ
  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = setInterval(() => {
      setPosition(pos => {
        const newX = Math.max(50, Math.min(dimensions.width - 50, pos.x + velocity.x));
        const newY = pos.y + velocity.y;
        return { x: newX, y: newY };
      });

      setVelocity(v => ({
        ...v,
        y: v.y + (dimensions.height * 0.001)
      }));

      setPosition(pos => {
        if (pos.y > dimensions.height - 100) {
          setVelocity(v => ({ ...v, y: 0 }));
          setIsGrounded(true);
          return { ...pos, y: dimensions.height - 100 };
        }
        return pos;
      });

      setFishes(prevFishes => {
        const remainingFishes = prevFishes.filter(fish => {
          const dx = fish.x - position.x;
          const dy = fish.y - position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 30) {
            setScore(s => s + 1);
            playSound('collect');
            return false;
          }
          return true;
        });

        if (remainingFishes.length < 5) {
          return [
            ...remainingFishes,
            {
              x: Math.random() * (dimensions.width - 100) + 50,
              y: Math.random() * (dimensions.height - 200) + 50,
              id: Math.random()
            }
          ];
        }

        return remainingFishes;
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameStarted, position, velocity, dimensions.height, dimensions.width, playSound]);

  return (
    <div
      className="w-screen overflow-hidden"
      style={{ height: "calc(var(--vh, 1vh) * 100)" }}
    >
      <div className="absolute top-12 left-0 w-full text-center z-10 p-8 pointer-events-none">
        <h1 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">🐱 にゃんこジャンプ</h1>
        <div className="text-4xl text-white drop-shadow-lg">スコア: {score} 🐠</div>
      </div>

      <div className="relative w-full h-full bg-gradient-to-b from-blue-300 to-blue-100">
        {/* 猫 */}
        <div
          className="absolute text-8xl"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          😺
        </div>

        {/* 魚 */}
        {fishes.map(fish => (
          <div
            key={fish.id}
            className="absolute text-6xl"
            style={{
              left: `${fish.x}px`,
              top: `${fish.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            🐠
          </div>
        ))}

        {/* 地面 */}
        <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-green-600 to-green-400"></div>

        {/* コントロールボタン */}
        {gameStarted && (
          <div className="absolute bottom-0 left-0 w-full flex justify-between px-8 z-20">
            <div className="flex gap-4">
              <button
                className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm active:bg-white/30"
                onTouchStart={() => setIsMovingLeft(true)}
                onTouchEnd={() => setIsMovingLeft(false)}
                onMouseDown={() => setIsMovingLeft(true)}
                onMouseUp={() => setIsMovingLeft(false)}
                onMouseLeave={() => setIsMovingLeft(false)}
              >
                ⬅️
              </button>
              <button
                className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm active:bg-white/30"
                onTouchStart={() => setIsMovingRight(true)}
                onTouchEnd={() => setIsMovingRight(false)}
                onMouseDown={() => setIsMovingRight(true)}
                onMouseUp={() => setIsMovingRight(false)}
                onMouseLeave={() => setIsMovingRight(false)}
              >
                ➡️
              </button>
            </div>
            <button
              className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm active:bg-white/30"
              onTouchStart={handleJump}
              onMouseDown={handleJump}
            >
              ⬆️
            </button>
          </div>
        )}

        {/* スタート画面 */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <button
              className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl text-white text-2xl active:bg-white/10"
              onClick={initializeGame}
            >
              タップしてスタート！
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NyankoJump;
