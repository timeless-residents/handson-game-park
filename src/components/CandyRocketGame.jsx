import React, { useState, useEffect, useCallback } from 'react';
import { Star, Rocket } from 'lucide-react';

const CandyRocketGame = () => {
  const [position, setPosition] = useState(50);
  const [isLaunched, setIsLaunched] = useState(false);
  const [height, setHeight] = useState(0);
  const [stars, setStars] = useState([
    { x: 20, y: 20, collected: false },
    { x: 40, y: 40, collected: false },
    { x: 60, y: 60, collected: false },
    { x: 80, y: 80, collected: false },
    { x: 30, y: 70, collected: false },
    { x: 70, y: 30, collected: false },
  ]);
  const [score, setScore] = useState(0);

  const handleKeyDown = useCallback((e) => {
    if (isLaunched) return;

    switch (e.key) {
      case 'ArrowLeft':
        setPosition((prev) => Math.max(0, prev - 1)); // より細かい移動
        break;
      case 'ArrowRight':
        setPosition((prev) => Math.min(100, prev + 1)); // より細かい移動
        break;
      case ' ':
        setIsLaunched(true);
        break;
      default:
        break;
    }
  }, [isLaunched]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isLaunched) return;

    const interval = setInterval(() => {
      setHeight((prev) => {
        const newHeight = prev + 1.5;
        if (newHeight >= 98) {  // 画面上端ギリギリまで到達可能
          setIsLaunched(false);
          return 0;
        }
        return newHeight;
      });

      // 衝突判定をより正確に
      setStars((prevStars) => 
        prevStars.map((star) => {
          // 画面上の実際の位置での衝突判定
          const dx = star.x - position;
          const dy = star.y - height;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (!star.collected && distance < 4) {  // 衝突判定の範囲を広げる
            setScore((prev) => prev + 100);
            return { ...star, collected: true };
          }
          return star;
        })
      );
    }, 20);  // よりスムーズなアニメーション

    return () => clearInterval(interval);
  }, [isLaunched, position, height]);  // heightも依存配列に追加

  const resetGame = () => {
    setIsLaunched(false);
    setHeight(0);
    setScore(0);
    setStars(stars.map(star => ({ ...star, collected: false })));
  };

  // デバッグ用の星との距離表示
  const getDistanceToNearestStar = () => {
    return stars
      .filter(star => !star.collected)
      .map(star => {
        const dx = star.x - position;
        const dy = star.y - height;
        return Math.sqrt(dx * dx + dy * dy);
      })
      .sort((a, b) => a - b)[0];
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-500 to-blue-600 p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white/90 rounded-lg p-4 mb-4 shadow-lg flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-800">キャンディロケット体操</h1>
          <div className="text-2xl font-bold text-purple-600">
            スコア: {score}
          </div>
        </div>

        <div className="relative w-full h-[32rem] bg-gradient-to-b from-blue-200 to-blue-400 rounded-xl overflow-hidden border-4 border-white/50 shadow-2xl">
          <div className="absolute top-8 left-8 w-16 h-8 bg-white/70 rounded-full"></div>
          <div className="absolute top-16 right-16 w-20 h-10 bg-white/70 rounded-full"></div>
          
          {stars.map((star, index) => (
            <div
              key={index}
              className={`absolute transition-all duration-300 ${
                star.collected 
                  ? 'opacity-0 scale-150' 
                  : 'opacity-100 animate-pulse'
              }`}
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <Star 
                className="text-yellow-400 drop-shadow-lg" 
                size={28} 
                fill="#FCD34D"
              />
            </div>
          ))}

          <div
            className="absolute bottom-0 transition-transform duration-75"
            style={{
              left: `${position}%`,
              transform: `translateX(-50%) translateY(-${height}%)`,
            }}
          >
            <Rocket
              className={`transition-transform ${
                isLaunched 
                  ? 'text-red-500 rotate-0' 
                  : 'text-pink-500 -rotate-45'
              }`}
              size={36}
              fill={isLaunched ? '#EF4444' : '#EC4899'}
            />
          </div>

          {/* デバッグ情報 - 開発時のみ表示 */}
          <div className="absolute top-2 left-2 text-xs text-white bg-black/50 p-2 rounded">
            Position: {Math.round(position)}%, Height: {Math.round(height)}%
            <br />
            Nearest Star: {Math.round(getDistanceToNearestStar() || 0)}
          </div>
        </div>

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
      </div>
    </div>
  );
};

export default CandyRocketGame;