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

  // ウィンドウサイズの変更を監視
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
      // 地面より下にいる場合は位置を調整
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
    setPosition({ x: 100, y: dimensions.height - 100 });
    setVelocity({ x: 0, y: 0 });
    setScore(0);
    setIsGrounded(true);
    setGameStarted(true);
    
    // 初期の魚を生成
    const initialFishes = Array.from({ length: 5 }, () => ({
      x: Math.random() * (dimensions.width - 100) + 50,
      y: Math.random() * (dimensions.height - 200) + 50,
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

      const now = Date.now();
      switch (e.key) {
        case 'ArrowLeft':
          setVelocity(v => ({ ...v, x: -8 }));
          break;
        case 'ArrowRight':
          setVelocity(v => ({ ...v, x: 8 }));
          break;
        case ' ':
          if (isGrounded && now - lastJumpTime > 50) {
            // 画面の高さに応じてジャンプ力を調整
            const jumpPower = dimensions.height * -0.04; // 画面の高さの4%をジャンプ力に
            setVelocity(v => ({ ...v, y: jumpPower }));
            setIsGrounded(false);
            setLastJumpTime(now);
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
  }, [gameStarted, isGrounded, lastJumpTime, playSound, dimensions]);

  // ゲームループ
  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = setInterval(() => {
      // 位置の更新
      setPosition(pos => {
        const newX = Math.max(50, Math.min(dimensions.width - 50, pos.x + velocity.x));
        const newY = pos.y + velocity.y;
        return { x: newX, y: newY };
      });

      // 重力の適用（画面の高さに応じて調整）
      setVelocity(v => ({
        ...v,
        y: v.y + (dimensions.height * 0.001) // 画面の高さの0.1%を重力に
      }));

      // 地面との衝突判定
      setPosition(pos => {
        if (pos.y > dimensions.height - 100) {
          setVelocity(v => ({ ...v, y: 0 }));
          setIsGrounded(true);
          return { ...pos, y: dimensions.height - 100 };
        }
        return pos;
      });

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
  }, [gameStarted, position, velocity, playSound, dimensions]);

  return (
    <div className="w-screen h-screen overflow-hidden">
      <div className="absolute top-0 left-0 w-full text-center z-10 p-8 pointer-events-none">
        <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-lg">🐱 にゃんこジャンプ</h1>
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

        {/* スタート画面のオーバーレイ */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <p className="mb-6 text-4xl">スペースキーを押してスタート！</p>
              <p className="text-2xl">⬅️➡️: 移動 スペース: ジャンプ</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NyankoJump;
