import { useState, useEffect, useCallback } from 'react';

const DIYGame = () => {
  // ゲームの状態
  const [currentPos, setCurrentPos] = useState({ x: 5, y: 4 });
  const [placedBoards, setPlacedBoards] = useState([]);
  const [currentTarget, setCurrentTarget] = useState(0);
  const [message, setMessage] = useState('板を赤い枠の位置まで運んでください！');
  const [gameCompleted, setGameCompleted] = useState(false);

  // 目標位置の定義（家の形になるように配置）
  const targets = [
    { x: 5, y: 6 }, // 床
    { x: 4, y: 4 }, // 左壁
    { x: 6, y: 4 }, // 右壁
    { x: 5, y: 2 }, // 屋根
  ];

  // 効果音の再生
  const playSound = useCallback((type) => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    if (type === 'place') {
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(440, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
    } else if (type === 'complete') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(987.77, context.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.2, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    }

    oscillator.start();
    oscillator.stop(context.currentTime + 0.3);
  }, []);

  // 板を配置する処理
  const placeBoard = useCallback(() => {
    if (currentTarget >= targets.length) return;
    
    const target = targets[currentTarget];
    if (currentPos.x === target.x && currentPos.y === target.y) {
      playSound('place');
      setPlacedBoards([...placedBoards, { ...currentPos }]);
      
      if (currentTarget + 1 >= targets.length) {
        setGameCompleted(true);
        setMessage('家が完成しました！🎉');
        playSound('complete');
      } else {
        setCurrentTarget(prev => prev + 1);
        setCurrentPos({ x: 5, y: 4 }); // 初期位置に戻す
        setMessage('次の板を運びましょう！');
      }
    } else {
      setMessage('位置がずれています！赤い枠の位置に合わせてください。');
    }
  }, [currentPos, currentTarget, placedBoards, playSound]);

  // 移動処理
  const moveBoard = useCallback((direction) => {
    if (gameCompleted) return;
    
    setCurrentPos(prev => {
      const newPos = { ...prev };
      switch (direction) {
        case 'up':
          newPos.y = Math.max(0, prev.y - 1);
          break;
        case 'down':
          newPos.y = Math.min(7, prev.y + 1);
          break;
        case 'left':
          newPos.x = Math.max(0, prev.x - 1);
          break;
        case 'right':
          newPos.x = Math.min(9, prev.x + 1);
          break;
      }
      return newPos;
    });
  }, [gameCompleted]);

  // キーボード操作
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          moveBoard('up');
          break;
        case 'ArrowDown':
          moveBoard('down');
          break;
        case 'ArrowLeft':
          moveBoard('left');
          break;
        case 'ArrowRight':
          moveBoard('right');
          break;
        case ' ':
          placeBoard();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveBoard, placeBoard]);

  // グリッドセルのレンダリング
  const renderCell = (x, y) => {
    // 現在の板の位置
    const isCurrentBoard = currentPos.x === x && currentPos.y === y;
    // 設置済みの板
    const isPlacedBoard = placedBoards.some(board => board.x === x && board.y === y);
    // 目標位置
    const isTarget = !gameCompleted && currentTarget < targets.length && 
                    targets[currentTarget].x === x && targets[currentTarget].y === y;

    let cellContent = null;
    if (isCurrentBoard) {
      cellContent = <div className="w-full h-full bg-yellow-700 rounded shadow-md" />;
    } else if (isPlacedBoard) {
      cellContent = <div className="w-full h-full bg-yellow-900 rounded shadow-md" />;
    } else if (isTarget) {
      cellContent = <div className="w-full h-full border-2 border-dashed border-red-500 rounded" />;
    }

    return (
      <div key={`${x}-${y}`} className="w-full h-full p-1">
        {cellContent}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-blue-600 text-white p-4 pt-16 text-center">
        <h1 className="text-2xl font-bold">木の板トントンDIY</h1>
        <p className="text-sm mt-2">
          {gameCompleted ? '' : 'PCの場合は矢印キーで移動、スペースキーで板を固定'}
        </p>
      </header>

      {/* メインゲームエリア */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {/* グリッド */}
        <div className="w-full max-w-lg aspect-[10/8] bg-gray-200 grid grid-cols-10 grid-rows-8 gap-px p-px">
          {Array.from({ length: 8 }, (_, y) =>
            Array.from({ length: 10 }, (_, x) => renderCell(x, y))
          )}
        </div>

        {/* メッセージ表示 */}
        <div className="mt-4 text-center text-lg font-medium text-gray-700">
          {message}
        </div>

        {/* モバイル用コントロール */}
        <div className="mt-6 md:hidden">
          <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
            <div />
            <button
              className="bg-gray-200 w-14 h-14 rounded-full text-2xl active:bg-gray-300 flex items-center justify-center"
              onClick={() => moveBoard('up')}
            >
              ⬆️
            </button>
            <div />
            
            <button
              className="bg-gray-200 p-4 rounded-full text-2xl active:bg-gray-300"
              onClick={() => moveBoard('left')}
            >
              ⬅️
            </button>
            <button
              className="bg-blue-500 w-14 h-14 rounded-full text-white font-bold active:bg-blue-600 flex items-center justify-center text-lg"
              onClick={placeBoard}
            >
              トン
            </button>
            <button
              className="bg-gray-200 p-4 rounded-full text-2xl active:bg-gray-300"
              onClick={() => moveBoard('right')}
            >
              ➡️
            </button>
            
            <div />
            <button
              className="bg-gray-200 p-4 rounded-full text-2xl active:bg-gray-300"
              onClick={() => moveBoard('down')}
            >
              ⬇️
            </button>
            <div />
          </div>
        </div>
      </main>

      {/* クリア時のオーバーレイ */}
      {gameCompleted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">🎉 完成！ 🎉</h2>
            <div className="text-6xl mb-4">🏠</div>
            <p>素敵な家が完成しました！</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DIYGame;