import  { useState } from 'react';
import NyankoJump from './NyankoJump';
import LizardGame from './LizardGame';

const GameMenu = () => {
  const [selectedGame, setSelectedGame] = useState(null);

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
    }
  ];

  if (selectedGame) {
    const GameComponent = games.find(game => game.id === selectedGame).component;
    return (
      <div className="relative">
        <GameComponent />
        <button
          onClick={() => setSelectedGame(null)}
          className="absolute top-4 right-4 bg-white/80 hover:bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg z-20 transition-colors"
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
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className="bg-white/90 hover:bg-white rounded-xl p-6 text-center transition-all transform hover:scale-105 shadow-lg"
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