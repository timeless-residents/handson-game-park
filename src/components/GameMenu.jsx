import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import NyankoJump from "./NyankoJump";
import LizardGame from "./LizardGame";
import DIYHouseGame from "./DIYHouseGame";
import CandyRocketGame from "./CandyRocketGame";
import HeartRunnerGame from "./HeartRunnerGame";
import ShakaShakaNukaZukeGame from "./ShakaShakaNukaZukeGame";
import RainbowHammockRelayGame from "./RainbowHammockRelayGame";
import MiniFieldHockeyGame from "./MiniFieldHockeyGame";
import SDGRunner from "./SDGRunner";
import GondolaGame from "./GondolaGame";
import PopupBookGame from "./PopupBookGame";
import PuchiBubbleLift from "./PuchiBubbleLift";
import TurtleCrossingGame from "./TurtleCrossingGame";

const GameMenu = () => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [focusedGameIndex, setFocusedGameIndex] = useState(0);
  const gameButtonsRef = useRef([]);
  const gameContainerRef = useRef(null);

  const games = useMemo(
    () => [
      {
        id: "turtle-crossing",
        title: "カメののんびりクロス",
        emoji: "🐢",
        description: "矢印キーで川を渡り、スペースキーで甲羅にこもって危険を回避する。",
        component: TurtleCrossingGame,
      },
      {
        id: "puchi-bubble-lift",
        title: "ぷちぷちバブルリフト",
        emoji: "🫧",
        description: "矢印キーで泡を操作して障害物を避け、スペースキーで泡のサイズを変更する",
        component: PuchiBubbleLift,
      },
      {
        id: "popup-book",
        title: "とびだす絵本の国",
        emoji: "📚",
        description: "矢印キーで立体化された絵本を進み、スペースキーで飛び出す仕掛けを避ける。",
        component: PopupBookGame,
      },
      {
        id: "gondora",
        title: "ゴンドラゲーム",
        emoji: "🚡",
        description: "ゴンドラを操作して目的地に到達しよう！",
        component: GondolaGame,
      },
      {
        id: "tree-fort",
        title: "SDGsヒーロー",
        emoji: "🌏",
        description:
          "SDGsの目標を達成するために、SDGsヒーローが様々なミニゲームに挑戦します。",
        component: SDGRunner, // 新しく追加
      },
      {
        id: "mini-field-hockey",
        title: "ミニフィールドホッケー",
        emoji: "🏑",
        description:
          "矢印キーでホッケースティックを操作し、スペースキーでボールを打ってゴールを狙う",
        component: MiniFieldHockeyGame,
      },
      {
        id: "rainbow-hangmat-relay",
        title: "虹色ハンモックリレー",
        emoji: "🌈",
        description: "矢印キーで移動し、スペースキーでアクションを行う",
        component: RainbowHammockRelayGame,
      },
      {
        id: "shaka-nuka-zuke",
        title: "シャカシャカぬか漬け",
        emoji: "🍆",
        description: "矢印キーで野菜を入れ、スペースキーでぬか床をかき混ぜる",
        component: ShakaShakaNukaZukeGame,
      },
      {
        id: "heart-runner",
        title: "ハート集めランナー",
        emoji: "🏃‍♀️",
        description: "走りながらハートを集めてスコアを競おう！",
        component: HeartRunnerGame,
      },
      {
        id: "candy-rocket",
        title: "キャンディロケット体操",
        emoji: "🚀",
        description:
          "矢印キーでキャンディを点火位置に置き、スペースキーで発射して空中の星を取る",
        component: CandyRocketGame,
      },
      {
        id: "diy",
        title: "木の板トントンDIY",
        emoji: "🔨",
        description:
          "矢印キーで板を移動し、スペースキーで釘を打っておうちを完成させる",
        component: DIYHouseGame,
      },
      {
        id: "lizard",
        title: "トカゲのせんぷう機乗り",
        emoji: "🦎",
        description: "壁を登って昆虫をキャッチしよう！",
        component: LizardGame,
      },
      {
        id: "nyanko",
        title: "にゃんこジャンプ",
        emoji: "😺",
        description: "魚を集めながらジャンプで冒険しよう！",
        component: NyankoJump,
      },
    ],
    []
  );

  // ボタン参照の配列をgamesの数に合わせる
  useEffect(() => {
    gameButtonsRef.current = gameButtonsRef.current.slice(0, games.length);
  }, [games]);

  const handleKeyDown = useCallback(
    (e) => {
      if (selectedGame) {
        if (e.key === "Escape") {
          setSelectedGame(null);
        }
        return;
      }

      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Enter",
          " ",
        ].includes(e.key)
      ) {
        e.preventDefault();
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setFocusedGameIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : games.length - 1
        );
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setFocusedGameIndex((prevIndex) =>
          prevIndex < games.length - 1 ? prevIndex + 1 : 0
        );
      } else if (e.key === "Enter" || e.key === " ") {
        setSelectedGame(games[focusedGameIndex].id);
      }
    },
    [selectedGame, focusedGameIndex, games]
  );

  // ゲーム選択時にスクロールをトップに戻す
  useEffect(() => {
    if (selectedGame) {
      window.scrollTo(0, 0);
    }
  }, [selectedGame]);

  // ゲームメニューが表示されているとき、focusedGameIndexに合わせてボタンにフォーカスする
  useEffect(() => {
    if (!selectedGame && gameButtonsRef.current[focusedGameIndex]) {
      gameButtonsRef.current[focusedGameIndex].focus();
    }
  }, [selectedGame, focusedGameIndex]);

  // window全体でキーボードイベントを監視する
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (selectedGame) {
    const GameComponent = games.find(
      (game) => game.id === selectedGame
    )?.component;
    return (
      <div
        className="fixed inset-0 bg-white overflow-auto"
        ref={gameContainerRef}
      >
        {GameComponent ? (
          <div className="min-h-screen">
            <GameComponent />
          </div>
        ) : (
          <p>ゲームが見つかりません</p>
        )}
        <button
          onClick={() => setSelectedGame(null)}
          className="fixed top-4 right-4 bg-white/80 hover:bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg z-20 transition-colors"
          onFocus={() => setFocusedGameIndex(0)}
        >
          ゲーム選択に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 to-purple-600 flex items-center justify-center p-4">
      <div className="text-center w-full">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 md:mb-12 drop-shadow-lg">
          ミニゲーム選択
        </h1>
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {games.map((game, index) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className={`bg-white/90 hover:bg-white rounded-xl p-4 md:p-6 text-center transition-all transform hover:scale-105 shadow-lg ${
                focusedGameIndex === index ? "ring-4 ring-purple-500" : ""
              }`}
              ref={(el) => (gameButtonsRef.current[index] = el)}
              onFocus={() => setFocusedGameIndex(index)}
            >
              <div className="text-5xl md:text-7xl mb-2 md:mb-4">
                {game.emoji}
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-800">
                {game.title}
              </h2>
              <p className="text-sm md:text-base text-gray-600">
                {game.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
