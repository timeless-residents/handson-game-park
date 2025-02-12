import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Star, Rocket } from 'lucide-react';

const initialStars = [
  { x: 20, y: 20, collected: false },
  { x: 40, y: 40, collected: false },
  { x: 60, y: 60, collected: false },
  { x: 80, y: 80, collected: false },
  { x: 30, y: 70, collected: false },
  { x: 70, y: 30, collected: false },
];

const CandyRocketGame = () => {
  // ロケットの横位置（%）
  const [position, setPosition] = useState(50);
  // ロケットの動作状態："idle"（待機）、"up"（上昇）、"down"（下降）
  const [direction, setDirection] = useState('idle');
  // ロケットの高さ（0 = 下, 100 = 上）※ CSS の bottom プロパティで管理
  const [height, setHeight] = useState(0);
  const [stars, setStars] = useState(initialStars);
  const [score, setScore] = useState(0);
  // 全星回収時にゲームクリア状態とするフラグ
  const [gameClear, setGameClear] = useState(false);

  // サウンド用 Audio オブジェクト（各イベントで再生）
  const launchSoundRef = useRef(null);
  const starHitSoundRef = useRef(null);
  const clearSoundRef = useRef(null);

  // コンポーネントマウント時にサウンドファイルを読み込み
  useEffect(() => {
    launchSoundRef.current = new Audio('/sounds/rocket-launch.wav');
    starHitSoundRef.current = new Audio('/sounds/star-hit.wav');
    clearSoundRef.current = new Audio('/sounds/game-clear.wav');
  }, []);

  // キーボード操作：待機状態のときのみ有効
  const handleKeyDown = useCallback((e) => {
    if (direction !== 'idle') return;
    switch (e.key) {
      case 'ArrowLeft':
        setPosition(prev => Math.max(0, prev - 1));
        break;
      case 'ArrowRight':
        setPosition(prev => Math.min(100, prev + 1));
        break;
      case ' ':
      case 'Spacebar':
      case 'Space':
        if (launchSoundRef.current) {
          launchSoundRef.current.currentTime = 0;
          launchSoundRef.current.play();
        }
        setDirection('up');
        break;
      default:
        break;
    }
  }, [direction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ロケットの上下移動（タイマーで状態更新）
  useEffect(() => {
    if (direction === 'idle') return;
    const interval = setInterval(() => {
      setHeight(prevHeight => {
        if (direction === 'up') {
          const newHeight = prevHeight + 1.5;
          if (newHeight >= 100) {
            // 上端到達で即下降開始
            setDirection('down');
            return 100;
          }
          return newHeight;
        } else if (direction === 'down') {
          const newHeight = prevHeight - 1.5;
          if (newHeight <= 0) {
            setDirection('idle');
            return 0;
          }
          return newHeight;
        }
        return prevHeight;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [direction]);

  // 衝突判定：上昇中のみ、星との距離が一定以下なら「回収」
  useEffect(() => {
    if (direction !== 'up') return;
    const rocketY = 100 - height; // 星は top で配置（上端:0, 下端:100）
    let collisionCount = 0;
    const updatedStars = stars.map(star => {
      if (!star.collected) {
        const dx = star.x - position;
        const dy = star.y - rocketY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 4) {
          collisionCount++;
          return { ...star, collected: true };
        }
      }
      return star;
    });
    if (collisionCount > 0) {
      setStars(updatedStars);
      setScore(prev => prev + collisionCount * 100);
      if (starHitSoundRef.current) {
        starHitSoundRef.current.currentTime = 0;
        starHitSoundRef.current.play();
      }
      // 星に衝突したら即座に下降開始
      setDirection('down');
    }
  }, [height, position, direction, stars]);

  // すべての星が回収された場合、ゲームクリアとする
  useEffect(() => {
    if (stars.every(star => star.collected)) {
      setGameClear(true);
      if (clearSoundRef.current) {
        clearSoundRef.current.currentTime = 0;
        clearSoundRef.current.play();
      }
    }
  }, [stars]);

  // ゲームリセット
  const resetGame = () => {
    setDirection('idle');
    setHeight(0);
    setScore(0);
    setStars(initialStars);
    setGameClear(false);
  };

  // デバッグ用：最も近い星までの距離を計算
  const getDistanceToNearestStar = () => {
    const rocketY = 100 - height;
    const distances = stars
      .filter(star => !star.collected)
      .map(star => {
        const dx = star.x - position;
        const dy = star.y - rocketY;
        return Math.sqrt(dx * dx + dy * dy);
      });
    return distances.length ? Math.min(...distances) : 0;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-500 to-blue-600 p-4">
      <div className="w-full max-w-4xl">
        {/* ヘッダー */}
        <div className="bg-white/90 rounded-lg p-4 mb-4 shadow-lg flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-800">キャンディロケット体操</h1>
          <div className="text-2xl font-bold text-purple-600">スコア: {score}</div>
        </div>
        {/* ゲーム画面 */}
        <div className="relative w-full h-[32rem] bg-gradient-to-b from-blue-200 to-blue-400 rounded-xl overflow-hidden border-4 border-white/50 shadow-2xl">
          {/* ゲームクリアオーバーレイ */}
          {gameClear && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
              <h2 className="text-4xl font-bold text-white">ゲームクリア！</h2>
            </div>
          )}
          {/* 背景装飾 */}
          <div className="absolute top-8 left-8 w-16 h-8 bg-white/70 rounded-full"></div>
          <div className="absolute top-16 right-16 w-20 h-10 bg-white/70 rounded-full"></div>
          {/* スター配置 */}
          {stars.map((star, index) => (
            <div
              key={index}
              className={`absolute transition-all duration-300 ${star.collected ? 'opacity-0 scale-150' : 'opacity-100 animate-pulse'}`}
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <Star className="text-yellow-400 drop-shadow-lg" size={28} fill="#FCD34D" />
            </div>
          ))}
          {/* ロケット */}
          <div
            className="absolute transition-all duration-75"
            style={{
              left: `${position}%`,
              bottom: `${height}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <Rocket
              className={`transition-transform ${direction !== 'idle' ? 'text-red-500 rotate-0' : 'text-pink-500 -rotate-45'}`}
              size={36}
              fill={direction !== 'idle' ? '#EF4444' : '#EC4899'}
            />
          </div>
          {/* デバッグ情報（任意） */}
          <div className="absolute top-2 left-2 text-xs text-white bg-black/50 p-2 rounded">
            Position: {Math.round(position)}%<br />
            Height: {Math.round(height)}%<br />
            Nearest Star: {Math.round(getDistanceToNearestStar() || 0)}
          </div>
        </div>
        {/* フッター：キーボード操作説明＆リセットボタン */}
        <div className="mt-4 bg-white/90 rounded-lg p-4 shadow-lg flex justify-between items-center">
          <div className="text-sm text-gray-600 flex gap-4">
            <span className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 border rounded shadow">←</kbd>
              <kbd className="px-2 py-1 bg-gray-100 border rounded shadow">→</kbd>
              移動
            </span>
            <span className="flex items-center gap-2">
              <kbd className="px-4 py-1 bg-gray-100 border rounded shadow">Space</kbd>
              発射
            </span>
          </div>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-md"
          >
            リセット
          </button>
        </div>
        {/* スマホ向けタッチ操作用仮想ボタン */}
        <div className="touch-controls flex justify-center mt-4 gap-4">
          <button
            onTouchStart={() => setPosition(prev => Math.max(0, prev - 1))}
            onClick={() => setPosition(prev => Math.max(0, prev - 1))}
            className="p-4 bg-gray-200 rounded-full shadow text-xl"
          >
            ←
          </button>
          <button
            onTouchStart={() => {
              if (direction === 'idle') {
                if (launchSoundRef.current) {
                  launchSoundRef.current.currentTime = 0;
                  launchSoundRef.current.play();
                }
                setDirection('up');
              }
            }}
            onClick={() => {
              if (direction === 'idle') {
                if (launchSoundRef.current) {
                  launchSoundRef.current.currentTime = 0;
                  launchSoundRef.current.play();
                }
                setDirection('up');
              }
            }}
            className="p-4 bg-green-200 rounded-full shadow text-xl"
          >
            発射
          </button>
          <button
            onTouchStart={() => setPosition(prev => Math.min(100, prev + 1))}
            onClick={() => setPosition(prev => Math.min(100, prev + 1))}
            className="p-4 bg-gray-200 rounded-full shadow text-xl"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandyRocketGame;
