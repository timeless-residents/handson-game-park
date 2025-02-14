import { useState, useEffect, useCallback } from 'react';

const LizardGame = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [position, setPosition] = useState({
    x: 100,
    y: window.innerHeight - 100,
  });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [insects, setInsects] = useState([]);
  const [score, setScore] = useState(0);
  const [isOnWall, setIsOnWall] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [windPower, setWindPower] = useState(0);
  const [audioContext, setAudioContext] = useState(null);
  const [lastWindTime, setLastWindTime] = useState(0);
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);

  // モバイル端末用：ビューポート高さをCSS変数--vhに設定
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
        height: window.innerHeight,
      });
      setPosition((pos) => ({
        x: pos.x,
        y: Math.min(pos.y, window.innerHeight - 100),
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setAudioContext(new (window.AudioContext || window.webkitAudioContext)());
  }, []);

  const playSound = useCallback(
    (type) => {
      if (!audioContext) return;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === 'wind') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          400,
          audioContext.currentTime + 0.3
        );
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3
        );
      } else if (type === 'catch') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          800,
          audioContext.currentTime + 0.1
        );
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.1
        );
      }

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    },
    [audioContext]
  );

  const initializeGame = () => {
    setPosition({ x: 100, y: dimensions.height - 100 });
    setVelocity({ x: 0, y: 0 });
    setScore(0);
    setIsOnWall(false);
    setGameStarted(true);
    setWindPower(0);

    const initialInsects = Array.from({ length: 3 }, () => ({
      x: Math.random() * (dimensions.width - 200) + 100,
      y: Math.random() * (dimensions.height - 200) + 100,
      id: Math.random(),
    }));
    setInsects(initialInsects);
  };

  // 扇風機ボタンの処理
  const handleWindStart = () => {
    const now = Date.now();
    if (now - lastWindTime > 300) {
      setWindPower(8);
      setLastWindTime(now);
      playSound('wind');
    }
  };

  const handleWindEnd = () => {
    setWindPower(0);
  };

  // 移動制御
  useEffect(() => {
    if (!gameStarted) return;
    const movement = isMovingLeft ? -6 : isMovingRight ? 6 : 0;
    setVelocity((v) => ({ ...v, x: movement }));
  }, [isMovingLeft, isMovingRight, gameStarted]);

  // キーボード操作のサポート
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
          handleWindStart();
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          setIsMovingLeft(false);
          break;
        case 'ArrowRight':
          setIsMovingRight(false);
          break;
        case ' ':
          handleWindEnd();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted]);

  // ゲームループ
  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = setInterval(() => {
      setPosition((pos) => {
        const newX = Math.max(
          50,
          Math.min(dimensions.width - 50, pos.x + velocity.x)
        );
        let newY = Math.max(
          50,
          Math.min(dimensions.height - 100, pos.y + velocity.y)
        );

        const isNearWall = newX <= 60 || newX >= dimensions.width - 60;

        if (isNearWall) {
          setIsOnWall(true);
          setVelocity((v) => ({ ...v, y: Math.min(v.y, 2) }));
        } else {
          setIsOnWall(false);
        }

        if (windPower > 0) {
          const distanceFromTop = Math.max(0, newY - 50);
          const adjustedWindPower = Math.min(windPower, distanceFromTop / 10);
          newY -= adjustedWindPower;
          setVelocity((v) => ({ ...v, y: Math.max(v.y - 1, -8) }));
        }

        if (newY > dimensions.height - 100) {
          newY = dimensions.height - 100;
          setVelocity((v) => ({ ...v, y: 0 }));
        }

        return { x: newX, y: newY };
      });

      if (!isOnWall) {
        setVelocity((v) => ({
          ...v,
          y: Math.min(v.y + 0.5, 8),
        }));
      }

      setInsects((prevInsects) => {
        const remainingInsects = prevInsects.filter((insect) => {
          const dx = insect.x - position.x;
          const dy = insect.y - position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 40) {
            setScore((s) => s + 1);
            playSound('catch');
            return false;
          }
          return true;
        });

        if (remainingInsects.length < 3) {
          return [
            ...remainingInsects,
            {
              x: Math.random() * (dimensions.width - 200) + 100,
              y: Math.random() * (dimensions.height - 200) + 100,
              id: Math.random(),
            },
          ];
        }

        return remainingInsects;
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [
    gameStarted,
    position,
    velocity,
    isOnWall,
    windPower,
    dimensions,
    playSound,
  ]);

  return (
    <div
      className="overflow-hidden"
      style={{
        width: "calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right))",
        height: "calc(var(--vh, 1vh) * 100)",
      }}
    >
      {/* タイトル＆スコア */}
      <div className="absolute top-12 left-0 w-full text-center z-10 p-8 pointer-events-none">
        <h1 className="text-2xl font-bold mb-4 text-white drop-shadow-lg">
          🦎 トカゲのせんぷう機乗り
        </h1>
        <div className="text-2xl text-white drop-shadow-lg">
          スコア: {score} 🪲
        </div>
      </div>

      {/* ゲームエリア */}
      <div className="relative w-full h-full bg-gradient-to-b from-yellow-200 to-yellow-100">
        {/* 壁 */}
        <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-r from-stone-800 to-stone-700"></div>
        <div className="absolute right-0 top-0 w-2 h-full bg-gradient-to-l from-stone-800 to-stone-700"></div>

        {/* トカゲ（向きは移動方向に合わせ反転） */}
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
            <span className="absolute top-0 left-0 text-6xl animate-bounce">
              💨
            </span>
          )}
        </div>

        {/* 昆虫 */}
        {insects.map((insect) => (
          <div
            key={insect.id}
            className="absolute text-6xl animate-bounce"
            style={{
              left: `${insect.x}px`,
              top: `${insect.y}px`,
              transform: "translate(-50%, -50%)",
              animationDuration: "2s",
            }}
          >
            🪲
          </div>
        ))}

        {/* 地面 */}
        <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-stone-600 to-stone-500"></div>
      </div>

      {/* 操作パネル：画面下部に固定＆安全領域考慮 */}
      {gameStarted && (
        <div
          className="fixed bottom-0 left-0 flex justify-between items-center px-8 z-20 py-4"
          style={{
            width:
              "calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right))",
          }}
        >
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
            onTouchStart={handleWindStart}
            onTouchEnd={handleWindEnd}
            onMouseDown={handleWindStart}
            onMouseUp={handleWindEnd}
            onMouseLeave={handleWindEnd}
          >
            💨
          </button>
        </div>
      )}

      {/* スタート画面 */}
      {!gameStarted && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-center">
            <button
              className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl text-4xl mb-8 active:bg-white/10"
              onClick={initializeGame}
            >
              タップしてスタート！
            </button>
            <div className="space-y-2">
              <p className="text-2xl">⬅️➡️ボタン: 移動</p>
              <p className="text-2xl">💨ボタン長押し: せんぷう機</p>
              <p className="text-2xl mt-4">壁に近づくとくっつけます！</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LizardGame;
