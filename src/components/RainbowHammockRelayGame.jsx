import React, { useState, useEffect, useCallback, useRef } from "react";

const RainbowHammockRelayGame = () => {
  /*** 定数定義 ***/
  const PICKUP_ZONE = 20; // ハンモック位置がこの%以下ならPickupゾーン（左側）
  const GOAL_ZONE = 80; // ハンモック位置がこの%以上ならGoalゾーン（右側）
  const TARGET_SCORE = 10; // ゲームクリアに必要な合計スコア（動物の数）
  const COLLISION_THRESHOLD = 5; // プレイヤーと動物との距離の許容誤差（%）

  // Pickupゾーン内で動物が待機する位置（%）をランダム生成（例：5～20%）
  const getRandomPickupX = () => Math.floor(Math.random() * 16) + 5;

  // 待機中の動物を生成する関数（複数の動物）
  const generateWaitingAnimals = (count = 3) => {
    const animalEmojis = ["🐶", "🐱", "🐰", "🦊", "🐻"];
    return Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: getRandomPickupX(),
      emoji: animalEmojis[Math.floor(Math.random() * animalEmojis.length)],
    }));
  };

  /*** 1. 状態管理 ***/
  // プレイヤー（ハンモック）の状態
  const [playerPosition, setPlayerPosition] = useState(50); // 画面中央スタート
  const [playerState, setPlayerState] = useState("idle");

  // ゲーム進行状態
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0); // 0～100%
  const [isGameClear, setIsGameClear] = useState(false);

  // 動物の状態：待機中（waitingAnimals）、ハンモックに乗っている（onboardAnimals）、およびゴール済み（deliveredAnimals）
  const [waitingAnimals, setWaitingAnimals] = useState(
    generateWaitingAnimals()
  );
  const [onboardAnimals, setOnboardAnimals] = useState([]);
  const [deliveredAnimals, setDeliveredAnimals] = useState([]);

  /*** 2. オーディオ＆ライフサイクル ***/
  // サウンド管理（useRefでAudioオブジェクトを保持）
  const actionAudioRef = useRef(null);
  const successAudioRef = useRef(null);

  useEffect(() => {
    // ※サウンドファイルのパスは適宜変更してください
    actionAudioRef.current = new Audio("/sounds/action.mp3");
    successAudioRef.current = new Audio("/sounds/success.mp3");
  }, []);

  // ビューポート高さ調整（モバイル対応：CSS変数 --vh の設定）
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  /*** 3. ユーザー入力のハンドリング ***/
  const handleAction = () => {
    setPlayerState("action");
    if (actionAudioRef.current) {
      actionAudioRef.current.currentTime = 0;
      actionAudioRef.current.play();
    }

    // 【Pickup処理】
    // プレイヤーがPickupゾーン内（playerPosition ≤ PICKUP_ZONE）の場合、待機中の動物のうち
    // プレイヤーとの距離がCOLLISION_THRESHOLD以内の動物をハンモックに乗せる
    if (playerPosition <= PICKUP_ZONE) {
      const picked = waitingAnimals.filter(
        (animal) => Math.abs(playerPosition - animal.x) <= COLLISION_THRESHOLD
      );
      if (picked.length > 0) {
        setOnboardAnimals((prev) => [...prev, ...picked]);
        setWaitingAnimals(
          waitingAnimals.filter(
            (animal) =>
              Math.abs(playerPosition - animal.x) > COLLISION_THRESHOLD
          )
        );
        if (waitingAnimals.length - picked.length === 0) {
          setWaitingAnimals(generateWaitingAnimals());
        }
        setTimeout(() => setPlayerState("idle"), 300);
        return;
      }
    }

    // 【Deliver処理】
    // プレイヤーがGoalゾーン内（playerPosition ≥ GOAL_ZONE）で、ハンモックに動物が乗っている場合
    // 乗っている動物たちをゴール済みとして表示し、スコアを加算
    if (playerPosition >= GOAL_ZONE && onboardAnimals.length > 0) {
      setDeliveredAnimals((prev) => [...prev, ...onboardAnimals]);
      const deliveredCount = onboardAnimals.length;
      const newScore = score + deliveredCount;
      setScore(newScore);
      setProgress((newScore / TARGET_SCORE) * 100);
      setOnboardAnimals([]);
      if (waitingAnimals.length === 0) {
        setWaitingAnimals(generateWaitingAnimals());
      }
      if (newScore >= TARGET_SCORE) {
        setIsGameClear(true);
      }
    }

    setTimeout(() => setPlayerState("idle"), 300);
  };

  const handleKeyDown = useCallback(
    (e) => {
      if (isGameClear) return;
      if (e.key === "ArrowLeft") {
        setPlayerPosition((prev) => Math.max(0, prev - 5));
        setPlayerState("active");
      } else if (e.key === "ArrowRight") {
        setPlayerPosition((prev) => Math.min(100, prev + 5));
        setPlayerState("active");
      } else if (e.key === " " || e.key === "Spacebar") {
        handleAction();
      }
    },
    [playerPosition, waitingAnimals, onboardAnimals, score, isGameClear]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /*** 4. リセット機能 ***/
  const handleReset = () => {
    setPlayerPosition(50);
    setPlayerState("idle");
    setScore(0);
    setProgress(0);
    setIsGameClear(false);
    setWaitingAnimals(generateWaitingAnimals());
    setOnboardAnimals([]);
    setDeliveredAnimals([]);
  };

  /*** 5. デバッグ情報（必要に応じて削除可） ***/
  const debugInfo = `Player: ${playerPosition}% | Waiting: ${waitingAnimals.length} | Onboard: ${onboardAnimals.length} | Delivered: ${deliveredAnimals.length}`;

  /*** 6. レイアウトと描画 ***/
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 to-purple-400 flex flex-col relative overflow-hidden">
      {/* 虹の表示：画面上部に虹のアーチ */}
      <div className="absolute top-0 left-0 w-full h-40 pointer-events-none">
        <svg viewBox="0 0 500 100" className="w-full h-full">
          <path
            d="M0,100 Q250,0 500,100"
            fill="none"
            stroke="red"
            strokeWidth="10"
          />
          <path
            d="M0,100 Q250,0 500,100"
            fill="none"
            stroke="orange"
            strokeWidth="10"
            transform="translate(0,10)"
          />
          <path
            d="M0,100 Q250,0 500,100"
            fill="none"
            stroke="yellow"
            strokeWidth="10"
            transform="translate(0,20)"
          />
          <path
            d="M0,100 Q250,0 500,100"
            fill="none"
            stroke="green"
            strokeWidth="10"
            transform="translate(0,30)"
          />
          <path
            d="M0,100 Q250,0 500,100"
            fill="none"
            stroke="blue"
            strokeWidth="10"
            transform="translate(0,40)"
          />
          <path
            d="M0,100 Q250,0 500,100"
            fill="none"
            stroke="indigo"
            strokeWidth="10"
            transform="translate(0,50)"
          />
          <path
            d="M0,100 Q250,0 500,100"
            fill="none"
            stroke="violet"
            strokeWidth="10"
            transform="translate(0,60)"
          />
        </svg>
      </div>

      {/* ヘッダー：左：タイトル、中央：Score/Progress、右：メニューボタン */}
      <header className="relative p-4 bg-white shadow-md flex items-center">
        <div className="flex-1">
          <h1 className="text-xl font-bold">虹のハンモックリレー</h1>
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-4 text-sm">
            <span>Score: {score}</span>
            <span>Progress: {progress.toFixed(0)}%</span>
          </div>
        </div>
        <div className="flex-1 text-right">
          <button className="p-2">☰</button>
        </div>
      </header>

      {/* ゲームエリア */}
      <main
        className="flex-1 relative z-10"
        style={{ height: "calc(var(--vh, 1vh) * 100)" }}
      >
        {/* Pickupゾーン（画面左下） */}
        <div className="absolute bottom-0 left-0 w-1/4 h-24 bg-blue-100 bg-opacity-70 border-r border-blue-300 flex flex-col items-center justify-center">
          <span className="text-sm font-semibold">PICKUP</span>
          {/* 待機中の動物たち：大きく表示 */}
          <div className="flex space-x-2">
            {waitingAnimals.map((animal) => (
              <div key={animal.id} className="text-4xl">
                {animal.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Goalゾーン（画面右下） */}
        <div className="absolute bottom-0 right-0 w-1/4 h-24 bg-green-100 bg-opacity-70 border-l border-green-300 flex flex-col items-center justify-center">
          <span className="text-sm font-semibold">GOAL</span>
          {/* ゴールした動物たちを表示（大きく） */}
          <div className="flex space-x-2">
            {deliveredAnimals.map((animal) => (
              <div key={animal.id} className="text-4xl">
                {animal.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* ハンモック（プレイヤー）の描画 */}
        <div
          className={`absolute bottom-4 w-40 h-16 bg-yellow-300 rounded-full shadow-lg transition-all duration-300 flex flex-col items-center justify-center ${
            playerState === "action" ? "scale-110" : "scale-100"
          }`}
          style={{
            left: `${playerPosition}%`,
            transform: `translateX(-${playerPosition}%)`,
          }}
        >
          <div className="text-sm font-bold">ハンモック</div>
          {/* ハンモックに乗っている動物たち（やや大きめに表示） */}
          <div className="flex space-x-1">
            {onboardAnimals.map((animal) => (
              <div key={animal.id} className="text-3xl">
                {animal.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* ゲームクリア表示 */}
        {isGameClear && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center">
              <h2 className="text-3xl font-bold mb-4">GAME CLEAR!</h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                リセット
              </button>
            </div>
          </div>
        )}
      </main>

      {/* フッター：リセットボタン＆タッチ操作用仮想ボタン */}
      <footer className="p-4 bg-white shadow-md flex flex-col md:flex-row md:justify-between items-center relative z-10">
        <button
          onClick={handleReset}
          className="mb-2 md:mb-0 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          リセット
        </button>
        <div className="flex space-x-2">
          <button
            onTouchStart={() => {
              setPlayerPosition((prev) => Math.max(0, prev - 5));
              setPlayerState("active");
            }}
            className="px-3 py-2 bg-blue-500 text-white rounded"
          >
            左
          </button>
          <button
            onTouchStart={() => handleAction()}
            className="px-3 py-2 bg-green-500 text-white rounded"
          >
            アクション
          </button>
          <button
            onTouchStart={() => {
              setPlayerPosition((prev) => Math.min(100, prev + 5));
              setPlayerState("active");
            }}
            className="px-3 py-2 bg-blue-500 text-white rounded"
          >
            右
          </button>
        </div>
      </footer>

      {/* デバッグ情報（開発用：必要に応じて削除） */}
      <div className="absolute top-0 left-0 p-2 text-xs text-gray-700 z-20">
        <p>{debugInfo}</p>
      </div>
    </div>
  );
};

export default RainbowHammockRelayGame;
