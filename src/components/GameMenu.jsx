import { useState, useRef, useEffect } from 'react';
import NyankoJump from './NyankoJump';
import LizardGame from './LizardGame';
import DIYHouseGame from './DIYHouseGame';
import CandyRocketGame from './CandyRocketGame';

const GameMenu = () => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [focusedGameIndex, setFocusedGameIndex] = useState(0);
  const gameButtonsRef = useRef([]);

  const games = [
    {
      id: 'nyanko',
      title: 'にゃんこジャンプ',
      emoji: '😺',
      description: '魚を集めながらジャンプで冒険しよう！',
      component: NyankoJump
    },
    {
      id: 'lizard',
      title: 'トカゲのせんぷう機乗り',
      emoji: '🦎',
      description: '壁を登って昆虫をキャッチしよう！',
      component: LizardGame
    },
    {
      id: 'diy',
      title: '木の板トントンDIY',
      emoji: '🔨',
      description: '矢印キーで板を移動し、スペースキーで釘を打っておうちを完成させる',
      component: DIYHouseGame
    },
    {
      id: 'candy-rocket',
      title: 'キャンディロケット体操',
      emoji: '🚀',
      description: '矢印キーでキャンディを点火位置に置き、スペースキーで発射して空中の星を取る',
      component: CandyRocketGame
    }
  ];

  // ボタン参照の配列をgamesの数に合わせる
  useEffect(() => {
    gameButtonsRef.current = gameButtonsRef.current.slice(0, games.length);
  }, [games]);

  // ゲームメニューが表示されているとき、focusedGameIndexに合わせてボタンにフォーカスする
  useEffect(() => {
    if (!selectedGame && gameButtonsRef.current[focusedGameIndex]) {
      gameButtonsRef.current[focusedGameIndex].focus();
    }
  }, [selectedGame, focusedGameIndex]);

  const handleKeyDown = (e) => {
    // ゲームプレイ中ならEscapeキーでメニューに戻る
    if (selectedGame) {
      if (e.key === 'Escape') {
        setSelectedGame(null);
      }
      return;
    }

    // 対象のキーの場合、デフォルトのスクロール動作などを防止する
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      setFocusedGameIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : games.length - 1));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      setFocusedGameIndex(prevIndex => (prevIndex < games.length - 1 ? prevIndex + 1 : 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      setSelectedGame(games[focusedGameIndex].id);
    }
  };

  // window全体でキーボードイベントを監視する
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGame, focusedGameIndex]);

  if (selectedGame) {
    const GameComponent = games.find(game => game.id === selectedGame)?.component;
    return (
      <div className="relative">
        {GameComponent ? <GameComponent /> : <p>ゲームが見つかりません</p>}
        <button
          onClick={() => setSelectedGame(null)}
          className="absolute top-4 right-4 bg-white/80 hover:bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg z-20 transition-colors"
          onFocus={() => setFocusedGameIndex(0)}
        >
          ゲーム選択に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 to-purple-600 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-12 drop-shadow-lg">
          ミニゲーム選択
        </h1>
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {games.map((game, index) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className={`bg-white/90 hover:bg-white rounded-xl p-6 text-center transition-all transform hover:scale-105 shadow-lg ${focusedGameIndex === index ? 'ring-4 ring-purple-500' : ''}`}
              ref={el => (gameButtonsRef.current[index] = el)}
              onFocus={() => setFocusedGameIndex(index)}
            >
              <div className="text-7xl mb-4">{game.emoji}</div>
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                {game.title}
              </h2>
              <p className="text-gray-600">{game.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameMenu;