import { useState, useEffect, useCallback } from 'react';

const LizardGame = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [position, setPosition] = useState({ x: 100, y: window.innerHeight - 100 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [insects, setInsects] = useState([]);
  const [score, setScore] = useState(0);
  const [isOnWall, setIsOnWall] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [windPower, setWindPower] = useState(0);
  const [audioContext, setAudioContext] = useState(null);
  const [lastWindTime, setLastWindTime] = useState(0);

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

  // 効果音を生成する関数
  const playSound = useCallback((type) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'wind') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    } else if (type === 'catch') {
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    }
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  }, [audioContext]);

  // ゲームの初期化
  const initializeGame = () => {
    setPosition({ x: 100, y: dimensions.height - 100 });
    setVelocity({ x: 0, y: 0 });
    setScore(0);
    setIsOnWall(false);
    setGameStarted(true);
    setWindPower(0);
    
    // 初期の昆虫を生成
    const initialInsects = Array.from({ length: 3 }, () => ({
      x: Math.random() * (dimensions.width - 200) + 100,
      y: Math.random() * (dimensions.height - 200) + 100,
      id: Math.random()
    }));
    setInsects(initialInsects);
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
          setVelocity(v => ({ ...v, x: -6 }));
          break;
        case 'ArrowRight':
          setVelocity(v => ({ ...v, x: 6 }));
          break;
        case ' ':
          if (now - lastWindTime > 300) {
            setWindPower(8);
            setLastWindTime(now);
            playSound('wind');
          }
          break;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setVelocity(v => ({ ...v, x: 0 }));
      }
      if (e.key === ' ') {
        setWindPower(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, lastWindTime, playSound]);

  // ゲームループ
  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = setInterval(() => {
      // 位置の更新
      setPosition(pos => {
        const newX = Math.max(50, Math.min(dimensions.width - 50, pos.x + velocity.x));
        // 上下の移動制限を追加
        let newY = Math.max(50, Math.min(dimensions.height - 100, pos.y + velocity.y));

        // 壁との当たり判定
        const isNearWall = newX <= 60 || newX >= dimensions.width - 60;
        
        if (isNearWall) {
          setIsOnWall(true);
          // 壁にくっついているときは落下速度を遅くする
          setVelocity(v => ({ ...v, y: Math.min(v.y, 2) }));
        } else {
          setIsOnWall(false);
        }

        // 風の効果
        if (windPower > 0) {
          // 上限に近づくと風の効果を弱める
          const distanceFromTop = Math.max(0, newY - 50);
          const adjustedWindPower = Math.min(windPower, distanceFromTop / 10);
          newY -= adjustedWindPower;
          setVelocity(v => ({ ...v, y: Math.max(v.y - 1, -8) }));
        }

        // 地面との当たり判定
        if (newY > dimensions.height - 100) {
          newY = dimensions.height - 100;
          setVelocity(v => ({ ...v, y: 0 }));
        }

        return { x: newX, y: newY };
      });

      // 重力の適用
      if (!isOnWall) {
        setVelocity(v => ({
          ...v,
          y: Math.min(v.y + 0.5, 8)
        }));
      }

      // 昆虫との当たり判定
      setInsects(prevInsects => {
        const remainingInsects = prevInsects.filter(insect => {
          const dx = insect.x - position.x;
          const dy = insect.y - position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 40) {
            setScore(s => s + 1);
            playSound('catch');
            return false;
          }
          return true;
        });

        // 新しい昆虫の生成
        if (remainingInsects.length < 3) {
          return [
            ...remainingInsects,
            {
              x: Math.random() * (dimensions.width - 200) + 100,
              y: Math.random() * (dimensions.height - 200) + 100,
              id: Math.random()
            }
          ];
        }

        return remainingInsects;
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameStarted, position, velocity, isOnWall, windPower, dimensions, playSound]);

  return (
    <div className="w-screen h-screen overflow-hidden">
      <div className="absolute top-0 left-0 w-full text-center z-10 p-8 pointer-events-none">
        <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-lg">🦎 トカゲのせんぷう機乗り</h1>
        <div className="text-4xl text-white drop-shadow-lg">スコア: {score} 🪲</div>
      </div>

      <div className="relative w-full h-full bg-gradient-to-b from-yellow-200 to-yellow-100">
        {/* 壁 */}
        <div className="absolute left-0 top-0 w-12 h-full bg-gradient-to-r from-stone-800 to-stone-700"></div>
        <div className="absolute right-0 top-0 w-12 h-full bg-gradient-to-l from-stone-800 to-stone-700"></div>

        {/* トカゲ */}
        <div
          className="absolute text-8xl"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: `translate(-50%, -50%) scaleX(${velocity.x > 0 ? 1 : -1})`,
          }}
        >
          🦎
          {windPower > 0 && (
            <span className="absolute top-0 left-0 text-6xl animate-bounce">💨</span>
          )}
        </div>

        {/* 昆虫 */}
        {insects.map(insect => (
          <div
            key={insect.id}
            className="absolute text-6xl animate-bounce"
            style={{
              left: `${insect.x}px`,
              top: `${insect.y}px`,
              transform: 'translate(-50%, -50%)',
              animationDuration: '2s',
            }}
          >
            🪲
          </div>
        ))}

        {/* 地面 */}
        <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-stone-600 to-stone-500"></div>

        {/* スタート画面 */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <p className="mb-6 text-4xl">スペースキーを押してスタート！</p>
              <p className="text-2xl">⬅️➡️: 移動</p>
              <p className="text-2xl">スペース長押し: せんぷう機</p>
              <p className="text-2xl mt-4">壁に近づくとくっつけます！</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LizardGame;