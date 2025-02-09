import { useState, useEffect, useCallback } from 'react';

const NyankoJump = () => {
  const [position, setPosition] = useState({ x: 100, y: 300 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [fishes, setFishes] = useState([]);
  const [score, setScore] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [audioContext, setAudioContext] = useState(null);

  useEffect(() => {
    setAudioContext(new (window.AudioContext || window.webkitAudioContext)());
  }, []);

  // 効果音を生成する関数
  const playSound = useCallback((type) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'jump') {
      // ジャンプ音
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'collect') {
      // 魚ゲット音
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  }, [audioContext]);

  // ゲームの状態を初期化
  const initializeGame = () => {
    setPosition({ x: 100, y: 300 });
    setVelocity({ x: 0, y: 0 });
    setScore(0);
    setIsJumping(false);
    setGameStarted(true);
    
    // 初期の魚を生成
    const initialFishes = Array.from({ length: 5 }, () => ({
      x: Math.random() * 400,
      y: Math.random() * 200 + 50,
      id: Math.random()
    }));
    setFishes(initialFishes);
  };

  // キーボード入力の処理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted && e.key === ' ') {
        initializeGame();
        return;
      }

      if (!gameStarted) return;

      switch (e.key) {
        case 'ArrowLeft':
          setVelocity(v => ({ ...v, x: -5 }));
          break;
        case 'ArrowRight':
          setVelocity(v => ({ ...v, x: 5 }));
          break;
        case ' ':
          if (!isJumping) {
            setVelocity(v => ({ ...v, y: -20 }));
            setIsJumping(true);
            playSound('jump');
          }
          break;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setVelocity(v => ({ ...v, x: 0 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, isJumping, playSound]);

  // ゲームループ
  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = setInterval(() => {
      // 位置の更新
      setPosition(pos => {
        const newX = Math.max(0, Math.min(400, pos.x + velocity.x));
        const newY = pos.y + velocity.y;
        return { x: newX, y: newY };
      });

      // 重力の適用
      setVelocity(v => ({
        ...v,
        y: v.y + 0.8
      }));

      // 地面との衝突判定
      if (position.y > 300) {
        setPosition(pos => ({ ...pos, y: 300 }));
        setVelocity(v => ({ ...v, y: 0 }));
        setIsJumping(false);
      }

      // 魚との衝突判定
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

        // 新しい魚の生成
        if (remainingFishes.length < 5) {
          return [
            ...remainingFishes,
            {
              x: Math.random() * 400,
              y: Math.random() * 200 + 50,
              id: Math.random()
            }
          ];
        }

        return remainingFishes;
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameStarted, position, velocity, playSound]);

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold mb-2">🐱 にゃんこジャンプ</h1>
        <div className="text-xl">スコア: {score} 🐟</div>
      </div>

      <div className="relative bg-blue-100 w-full h-80 rounded-lg overflow-hidden">
        {/* 猫 */}
        <div
          className="absolute text-4xl"
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
            className="absolute text-2xl"
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
        <div className="absolute bottom-0 w-full h-4 bg-green-500"></div>

        {/* スタート画面のオーバーレイ */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <p className="mb-4 text-xl">スペースキーを押してスタート！</p>
              <p>⬅️➡️: 移動 スペース: ジャンプ</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NyankoJump;
