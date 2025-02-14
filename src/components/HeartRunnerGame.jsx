import { useState, useEffect, useCallback, useRef } from 'react';

const HeartRunnerGame = () => {
  // モバイル判定（画面幅768px未満の場合）
  const isMobile = window.innerWidth < 768;
  // 土（地面）の拡張部分の高さ（Tailwind の h-48＝約12rem＝192px）
  const soilHeight = 192;
  // ゲームエリアの高さ：モバイルの場合は画面高さから土の高さを引く、PCの場合は画面の80%または700pxの小さい方
  const GAME_HEIGHT = isMobile ? window.innerHeight - soilHeight : Math.min(700, window.innerHeight * 0.8);
  const GROUND_HEIGHT = 64; // ゲーム内での地面部分（草＋土）の高さ

  // プレイヤーの足元が地面に接するための中心位置
  const playerRestY = GAME_HEIGHT - GROUND_HEIGHT - (40 / 2); // PLAYER_SIZE = 40
  // 最大ジャンプ到達高さ（物理計算）
  const maxJumpHeight = (Math.abs(-18) ** 2) / (2 * 0.8);
  // プレイヤーの中心が到達できる最上部
  const apexY = playerRestY - maxJumpHeight;

  // 初期位置：画面左側、足元が地面に接する位置
  const initialPosition = { 
    x: window.innerWidth / 4, 
    y: playerRestY 
  };

  // プレイヤーの最新位置（衝突判定用）
  const playerPosRef = useRef(initialPosition);
  // AudioContext の再利用用（ユーザー操作後に生成）
  const audioCtxRef = useRef(null);

  // 各種状態
  const [position, setPosition] = useState(initialPosition);
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isJumping, setIsJumping] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);
  // 向き状態：使用している🏃は元々左向きなので、右向き表示には scaleX(-1) を使用
  const [direction, setDirection] = useState('right');

  // AudioContext の再利用＆生成（ユーザー操作後）
  const playSound = useCallback((type) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const audioContext = audioCtxRef.current;
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'jump') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    } else if (type === 'collect') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    } else if (type === 'hit') {
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    }
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  }, []);

  // ジャンプ処理
  const jump = useCallback(() => {
    if (!isJumping && !gameOver && gameStarted) {
      setIsJumping(true);
      setVelocity(v => ({ ...v, y: -18 })); // JUMP_POWER = -18
      playSound('jump');
    }
  }, [isJumping, gameOver, gameStarted, playSound]);

  // ゲーム開始／再スタート
  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setPosition(initialPosition);
    playerPosRef.current = initialPosition;
    setVelocity({ x: 0, y: 0 });
    setHearts([]);
    setObstacles([]);
    setIsJumping(false);
    setDirection('right');
  }, [initialPosition]);

  // ゲームオーバー処理
  const handleGameOver = useCallback(() => {
    setGameOver(true);
    playSound('hit');
  }, [playSound]);

  // キーボード操作（スマホでもタップ操作にも対応）
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ') {
        if (gameOver || !gameStarted) {
          startGame();
        } else {
          jump();
        }
        return;
      }
      switch (e.key) {
        case 'ArrowLeft':
          setIsMovingLeft(true);
          setDirection('left');
          break;
        case 'ArrowRight':
          setIsMovingRight(true);
          setDirection('right');
          break;
        default:
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
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameOver, gameStarted, jump, startGame]);

  // ゲームループ（60FPS）
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const gameLoop = setInterval(() => {
      const prevPos = playerPosRef.current;
      const movement = (isMovingRight ? MOVE_SPEED : 0) - (isMovingLeft ? MOVE_SPEED : 0);
      const newX = Math.max(0, Math.min(window.innerWidth - 40, prevPos.x + movement)); // PLAYER_SIZE = 40
      
      let newY = prevPos.y + velocity.y;
      let newVelocityY = velocity.y + 0.8; // GRAVITY = 0.8
      if (newY >= playerRestY) {
        newY = playerRestY;
        newVelocityY = 0;
        setIsJumping(false);
      }
      const newPos = { x: newX, y: newY };
      playerPosRef.current = newPos;
      setPosition(newPos);
      setVelocity(v => ({ ...v, y: newVelocityY }));

      if (Math.random() < 0.02) {
        const heartY = Math.random() * (playerRestY - apexY) + apexY;
        setHearts(prev => [
          ...prev,
          { x: window.innerWidth, y: heartY, id: Date.now() + Math.random() }
        ]);
      }

      if (Math.random() < 0.01) {
        setObstacles(prev => [
          ...prev,
          { x: window.innerWidth, y: playerRestY, id: Date.now() + Math.random() }
        ]);
      }

      setHearts(prevHearts =>
        prevHearts.reduce((acc, heart) => {
          const newHeartX = heart.x - 3;
          const dx = newHeartX - playerPosRef.current.x;
          const dy = heart.y - playerPosRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 40 * 1.5) {
            setScore(s => s + 1);
            playSound('collect');
            return acc;
          }
          if (newHeartX < -30) return acc;
          return [...acc, { ...heart, x: newHeartX }];
        }, [])
      );

      setObstacles(prevObstacles =>
        prevObstacles.reduce((acc, obstacle) => {
          const newObstacleX = obstacle.x - 4;
          const dx = newObstacleX - playerPosRef.current.x;
          const dy = obstacle.y - playerPosRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 40 - 10) {
            handleGameOver();
            return acc;
          }
          if (newObstacleX < -30) return acc;
          return [...acc, { ...obstacle, x: newObstacleX }];
        }, [])
      );
    }, 1000 / 60);
    return () => clearInterval(gameLoop);
  }, [
    gameStarted,
    gameOver,
    isMovingLeft,
    isMovingRight,
    velocity,
    playSound,
    handleGameOver,
    playerRestY,
    apexY
  ]);

  return (
    // 外側コンテナは全画面を覆います
    <div className="w-screen min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 flex flex-col items-center overflow-hidden">
      {/* スコア表示 */}
      <div className="absolute top-4 left-0 w-full text-center z-10">
        <div className="text-4xl font-bold text-white drop-shadow-lg">❤️ {score}</div>
      </div>

      {/* ゲームエリア */}
      <div 
        className="relative bg-gradient-to-b from-blue-300 to-blue-400 rounded-lg shadow-lg overflow-hidden"
        style={{ width: '100%', maxWidth: '1200px', height: GAME_HEIGHT }}
      >
        {/* キャラクター */}
        <div
          className="absolute text-4xl"
          style={{
            left: position.x,
            top: position.y,
            transform: `translate(-50%, -50%) scaleX(${direction === 'right' ? -1 : 1})`,
          }}
        >
          🏃
        </div>

        {/* ハート */}
        {hearts.map(heart => (
          <div
            key={heart.id}
            className="absolute text-2xl transform -translate-x-1/2 -translate-y-1/2 animate-bounce"
            style={{
              left: heart.x,
              top: heart.y,
              animationDuration: '2s',
            }}
          >
            ❤️
          </div>
        ))}

        {/* 障害物 */}
        {obstacles.map(obstacle => (
          <div
            key={obstacle.id}
            className="absolute text-3xl transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: obstacle.x, top: obstacle.y }}
          >
            🌵
          </div>
        ))}

        {/* 地面（ゲームエリア内）：下部に草と土を描画 */}
        <div className="absolute bottom-0 w-full">
          <div className="h-8 bg-green-400" /> {/* 草 */}
          <div className="h-8 bg-gradient-to-b from-orange-700 to-orange-900" /> {/* 土 */}
        </div>
      </div>

      {/* 土の拡張部分（モバイルのみ）：画面下部まで土の背景を延長 */}
      {isMobile && (
        <div className="w-full h-48 bg-gradient-to-b from-orange-700 to-orange-900 md:hidden"></div>
      )}

      {/* モバイル用操作パネル：土の拡張部分より上（bottom: 128px）に配置 */}
      {gameStarted && !gameOver && (
        <div className="fixed left-0 w-full flex justify-between px-8 md:hidden" style={{ bottom: '68px' }}>
          <div className="flex gap-4">
            <button
              className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm active:bg-white/30"
              onTouchStart={() => { setIsMovingLeft(true); setDirection('left'); }}
              onTouchEnd={() => setIsMovingLeft(false)}
              onMouseDown={() => { setIsMovingLeft(true); setDirection('left'); }}
              onMouseUp={() => setIsMovingLeft(false)}
              onMouseLeave={() => setIsMovingLeft(false)}
            >
              ⬅️
            </button>
            <button
              className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm active:bg-white/30"
              onTouchStart={() => { setIsMovingRight(true); setDirection('right'); }}
              onTouchEnd={() => setIsMovingRight(false)}
              onMouseDown={() => { setIsMovingRight(true); setDirection('right'); }}
              onMouseUp={() => setIsMovingRight(false)}
              onMouseLeave={() => setIsMovingRight(false)}
            >
              ➡️
            </button>
          </div>
          <button
            className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm active:bg-white/30"
            onTouchStart={jump}
            onMouseDown={jump}
          >
            ⬆️
          </button>
        </div>
      )}

      {/* スタート画面 */}
      {!gameStarted && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-8">ハート集めランナー</h1>
            <button
              className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl text-2xl active:bg-white/10"
              onClick={startGame}
            >
              タップしてスタート！
            </button>
            <p className="mt-4 text-lg">
              {window.innerWidth > 768 ? 
                "← →キーで移動、スペースでジャンプ/再挑戦" : 
                "画面下のボタンで操作してね！"}
            </p>
          </div>
        </div>
      )}

      {/* ゲームオーバー画面 */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4">ゲームオーバー</h2>
            <p className="text-2xl mb-8">スコア: {score}❤️</p>
            <p className="mb-4 text-lg">スペースキーまたはタップで再挑戦できます</p>
            <button
              className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl text-2xl active:bg-white/10"
              onClick={startGame}
            >
              もう一度挑戦！
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeartRunnerGame;
