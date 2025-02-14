import { useState, useEffect, useCallback, useRef } from 'react';

const vegetablesMap = {
  ArrowLeft: '🥕',
  ArrowRight: '🍆',
  ArrowUp: '🍅',
  ArrowDown: '🥒',
};

const ShakaShakaNukaZukeGame = () => {
  // 画面幅に応じたモバイル判定
  const isMobile = window.innerWidth < 768;
  // ぬか床エリアの高さを画面の80%に設定
  const nukaBedHeight = window.innerHeight * 0.6;
  // 画面全体の幅
  const screenWidth = window.innerWidth;
  
  // ゲーム状態
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [vegetables, setVegetables] = useState([]);
  const [stirCount, setStirCount] = useState(0);

  // ゲーム開始／再スタート処理
  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameComplete(false);
    setVegetables([]);
    setStirCount(0);
    spawnInitialObjects();
  }, []);

  // 野菜追加処理（矢印キーまたはモバイルの矢印ボタンで追加）
  const addVegetable = useCallback((key) => {
    if (vegetablesMap[key]) {
      const veg = vegetablesMap[key];
      const x = Math.random() * screenWidth;
      const y = Math.random() * nukaBedHeight;
      const id = Date.now() + Math.random();
      setVegetables(prev => [...prev, { id, veg, x, y }]);
    }
  }, [screenWidth, nukaBedHeight]);

  // 初期オブジェクトを即座に生成する関数
  const spawnInitialObjects = useCallback(() => {
    const initialVeg = {
      x: screenWidth,
      y: Math.random() * nukaBedHeight,
      id: Date.now() + Math.random(),
      veg: vegetablesMap.ArrowLeft, // 例として🥕
    };
    setVegetables([initialVeg]);
  }, [screenWidth, nukaBedHeight]);

  // ぬか床かき混ぜ処理（スペースキーまたはモバイルの「かき混ぜ」ボタン）
  const stirBed = useCallback(() => {
    setStirCount(prev => {
      const newCount = prev + 1;
      // かき混ぜると、既存の野菜の位置を微妙にずらす
      setVegetables(prevVeg =>
        prevVeg.map(v => ({
          ...v,
          x: Math.max(0, Math.min(screenWidth, v.x + (Math.random() - 0.5) * 30)),
          y: Math.max(0, Math.min(nukaBedHeight, v.y + (Math.random() - 0.5) * 30)),
        }))
      );
      if (newCount >= 10) {
        setGameComplete(true);
      }
      return newCount;
    });
  }, [screenWidth, nukaBedHeight]);

  // キーボード操作ハンドラー（PCの場合）
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ') {
        // ゲーム未開始または完成状態ならスペースでスタート／再挑戦
        if (!gameStarted || gameComplete) {
          startGame();
        } else {
          stirBed();
        }
      } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        addVegetable(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameComplete, startGame, stirBed, addVegetable]);

  return (
    <div className="w-screen h-screen bg-green-600 flex flex-col items-center justify-center relative">
      {!gameStarted && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
          <h1 className="text-4xl text-white mb-4">シャカシャカぬか漬け</h1>
          <button onClick={startGame} className="px-8 py-4 bg-white rounded-xl text-2xl mb-2">
            タップしてスタート！
          </button>
          <p className="text-white text-center">
            矢印キーで野菜を追加、<br/>スペースキーでぬか床をかき混ぜ
          </p>
        </div>
      )}
      {gameStarted && (
        <div className="w-full h-full relative">
          {/* ぬか床エリア（画面の80%の高さ） */}
          <div className="w-full bg-yellow-300 relative rounded-lg overflow-hidden mt-24" style={{ height: nukaBedHeight }}>
            <p className="absolute top-2 left-2 text-sm text-gray-700">ぬか床</p>
            {vegetables.map(v => (
              <div key={v.id} style={{ left: v.x, top: v.y }} className="absolute text-2xl">
                {v.veg}
              </div>
            ))}
          </div>
          {/* かき混ぜ回数表示 */}
          <div className="absolute top-2 left-2 text-xl text-white">
            かき混ぜ: {stirCount}
          </div>
          {gameComplete && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
              <h2 className="text-4xl text-white mb-4">漬物完成！</h2>
              <button onClick={startGame} className="px-8 py-4 bg-white rounded-xl text-2xl">
                もう一度挑戦！
              </button>
            </div>
          )}
          {/* モバイル用操作パネル */}
          {isMobile && (
            <div className="fixed bottom-4 left-0 w-full flex flex-col items-center space-y-4">
              <div className="flex flex-col items-center">
                <button onClick={() => addVegetable('ArrowUp')} className="mb-2 w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
                  ↑
                </button>
                <div className="flex space-x-4">
                  <button onClick={() => addVegetable('ArrowLeft')} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
                    ←
                  </button>
                  <button onClick={() => addVegetable('ArrowDown')} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
                    ↓
                  </button>
                  <button onClick={() => addVegetable('ArrowRight')} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
                    →
                  </button>
                </div>
              </div>
              <button onClick={stirBed} className="w-32 h-12 bg-white rounded-full flex items-center justify-center text-xl">
                かき混ぜ
              </button>
              {/* スペースキーでもスタート／再挑戦できるようにする案内 */}
              <p className="text-white text-sm mt-2">スペースキーでスタート／再挑戦</p>
            </div>
          )}
          {/* PC操作の場合の案内 */}
          {!isMobile && (
            <div className="absolute bottom-4 left-0 w-full text-center text-white">
              <p>矢印キーで野菜を追加、スペースキーでかき混ぜ／スタート・再挑戦</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShakaShakaNukaZukeGame;
