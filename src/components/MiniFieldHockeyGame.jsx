import React, { useState, useEffect, useCallback } from "react";

const MiniFieldHockeyGame = () => {
  // ホッケースティックの横位置（0～100%）
  const [hockeyPos, setHockeyPos] = useState(50);
  // ボールの状態：x, y, inMotion, vx, vy
  const [ball, setBall] = useState({
    x: 50,
    y: 7,
    inMotion: false,
    vx: 0,
    vy: 0,
  });
  const [score, setScore] = useState(0);
  const [goalMessage, setGoalMessage] = useState("");
  // 角度選択モード用の状態（false のときは位置調整モード）
  const [isAngleSelecting, setIsAngleSelecting] = useState(false);
  // 発射角度（0=垂直、-45～45 の範囲で左右にずれる）
  const [angle, setAngle] = useState(0);

  // スマホ Safari 対策：実際の画面高さを CSS 変数にセット
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  // ボールが静止中はホッケースティックの位置に追従させる
  useEffect(() => {
    if (!ball.inMotion) {
      setBall((prev) => ({ ...prev, x: hockeyPos }));
    }
  }, [hockeyPos, ball.inMotion]);

  // キーボード操作の処理（ball.inMotion が false のときのみ反応）
  const handleKeyDown = useCallback(
    (e) => {
      if (ball.inMotion) return;
      if (!isAngleSelecting) {
        // 位置調整モード
        switch (e.key) {
          case "ArrowLeft":
            setHockeyPos((prev) => Math.max(0, prev - 2));
            break;
          case "ArrowRight":
            setHockeyPos((prev) => Math.min(100, prev + 2));
            break;
          case " ":
          case "Spacebar":
          case "Space":
            // 位置が決まったら角度選択モードに入る
            setIsAngleSelecting(true);
            setAngle(0);
            break;
          default:
            break;
        }
      } else {
        // 角度選択モード
        switch (e.key) {
          case "ArrowLeft":
            setAngle((prev) => Math.max(prev - 5, -45));
            break;
          case "ArrowRight":
            setAngle((prev) => Math.min(prev + 5, 45));
            break;
          case " ":
          case "Spacebar":
          case "Space": {
            // 発射処理：選択角度から速度ベクトルを計算（全体速度は2）
            const speed = 2;
            const rad = angle * (Math.PI / 180);
            const vx = speed * Math.sin(rad);
            const vy = speed * Math.cos(rad);
            setBall({ x: hockeyPos, y: 7, inMotion: true, vx, vy });
            setIsAngleSelecting(false);
            break;
          }
          default:
            break;
        }
      }
    },
    [ball.inMotion, isAngleSelecting, angle, hockeyPos]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ボールの移動アニメーション（inMotion の間、x, y を更新）
  useEffect(() => {
    if (!ball.inMotion) return;
    const interval = setInterval(() => {
      setBall((prev) => {
        const newX = prev.x + prev.vx;
        const newY = prev.y + prev.vy;
        if (newY >= 100) {
          // 画面上部到達時、ゴール判定（x: 40～60% をゴールエリアとする）
          if (newX >= 40 && newX <= 60) {
            setScore((s) => s + 1);
            setGoalMessage("Goal!");
          } else {
            setGoalMessage("Missed!");
          }
          setTimeout(() => {
            setGoalMessage("");
            // 発射後、ボールを再びホッケースティック位置へリセット
            setBall({ x: hockeyPos, y: 7, inMotion: false, vx: 0, vy: 0 });
          }, 500);
          clearInterval(interval);
          return { ...prev, y: 100, inMotion: false };
        }
        return { ...prev, x: newX, y: newY };
      });
    }, 20);
    return () => clearInterval(interval);
  }, [ball.inMotion, hockeyPos]);

  // ゲームのリセット処理
  const resetGame = () => {
    setHockeyPos(50);
    setBall({ x: 50, y: 7, inMotion: false, vx: 0, vy: 0 });
    setScore(0);
    setGoalMessage("");
    setIsAngleSelecting(false);
    setAngle(0);
  };

  return (
    <div
      className="flex flex-col bg-green-400 p-2 overflow-hidden"
      style={{ height: "calc(var(--vh, 1vh) * 100)" }}
    >
      {/* ヘッダー */}
      <header className="flex-shrink-0 mt-4 mb-2">
        <div className="bg-white/90 rounded-lg p-2 shadow-lg flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-800">
            ミニフィールドホッケー
          </h1>
          <div className="text-xl font-bold text-green-600">
            スコア: {score}
          </div>
        </div>
      </header>
      {/* ゲーム画面 */}
      <main className="flex-grow relative bg-green-200 rounded-xl overflow-hidden border-4 border-white/50 shadow-2xl">
        {/* ゴールエリア */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/5 h-10 bg-white rounded-b-lg shadow-md flex items-center justify-center">
          <span className="text-lg font-bold text-red-500">GOAL</span>
        </div>
        {/* ゴール判定メッセージ */}
        {goalMessage && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              {goalMessage}
            </h2>
          </div>
        )}
        {/* ボール */}
        <div
          className="absolute w-4 h-4 bg-white rounded-full shadow"
          style={{
            left: `${ball.x}%`,
            bottom: `${ball.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        ></div>
        {/* ホッケースティック */}
        <div
          className="absolute text-3xl"
          style={{
            left: `${hockeyPos}%`,
            bottom: "5%",
            transform: "translateX(-50%)",
          }}
        >
          <span role="img" aria-label="hockey stick">
            🏑
          </span>
        </div>
        {/* 角度選択中は、ホッケースティック付近に発射角度の目安を表示 */}
        {isAngleSelecting && (
          <div
            style={{
              position: "absolute",
              left: `${hockeyPos}%`,
              bottom: "7%",
              transform: `translate(-50%, -50%) rotate(${angle - 90}deg)`,
            }}
          >
            <div
              style={{ width: "2px", height: "40px", backgroundColor: "red" }}
            ></div>
          </div>
        )}
      </main>
      {/* フッター */}
      <footer className="flex-shrink-0 mt-2">
        <div className="bg-white/90 rounded-lg p-2 shadow-lg flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-600 flex gap-2 mb-2 md:mb-0">
            {!isAngleSelecting ? (
              <>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 border rounded shadow">
                    ←
                  </kbd>
                  <kbd className="px-2 py-1 bg-gray-100 border rounded shadow">
                    →
                  </kbd>
                  位置移動
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-3 py-1 bg-gray-100 border rounded shadow">
                    Space
                  </kbd>
                  角度選択
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 border rounded shadow">
                    ←
                  </kbd>
                  <kbd className="px-2 py-1 bg-gray-100 border rounded shadow">
                    →
                  </kbd>
                  角度調整
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-3 py-1 bg-gray-100 border rounded shadow">
                    Space
                  </kbd>
                  発射
                </span>
              </>
            )}
          </div>
          <button
            onClick={resetGame}
            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
          >
            リセット
          </button>
        </div>
        {/* スマホ向けタッチ操作 */}
        <div className="touch-controls flex justify-center mt-2 gap-4">
          {!isAngleSelecting ? (
            <>
              <button
                onTouchStart={() =>
                  setHockeyPos((prev) => Math.max(0, prev - 2))
                }
                onClick={() => setHockeyPos((prev) => Math.max(0, prev - 2))}
                className="p-3 bg-gray-200 rounded-full shadow text-lg"
              >
                ←
              </button>
              <button
                onTouchStart={() => {
                  setIsAngleSelecting(true);
                  setAngle(0);
                }}
                onClick={() => {
                  setIsAngleSelecting(true);
                  setAngle(0);
                }}
                className="p-3 bg-green-200 rounded-full shadow text-lg"
              >
                角度
              </button>
              <button
                onTouchStart={() =>
                  setHockeyPos((prev) => Math.min(100, prev + 2))
                }
                onClick={() => setHockeyPos((prev) => Math.min(100, prev + 2))}
                className="p-3 bg-gray-200 rounded-full shadow text-lg"
              >
                →
              </button>
            </>
          ) : (
            <>
              <button
                onTouchStart={() => setAngle((prev) => Math.max(prev - 5, -45))}
                onClick={() => setAngle((prev) => Math.max(prev - 5, -45))}
                className="p-3 bg-gray-200 rounded-full shadow text-lg"
              >
                ←
              </button>
              <button
                onTouchStart={() => {
                  const speed = 2;
                  const rad = angle * (Math.PI / 180);
                  const vx = speed * Math.sin(rad);
                  const vy = speed * Math.cos(rad);
                  setBall({ x: hockeyPos, y: 7, inMotion: true, vx, vy });
                  setIsAngleSelecting(false);
                }}
                onClick={() => {
                  const speed = 2;
                  const rad = angle * (Math.PI / 180);
                  const vx = speed * Math.sin(rad);
                  const vy = speed * Math.cos(rad);
                  setBall({ x: hockeyPos, y: 7, inMotion: true, vx, vy });
                  setIsAngleSelecting(false);
                }}
                className="p-3 bg-green-200 rounded-full shadow text-lg"
              >
                発射
              </button>
              <button
                onTouchStart={() => setAngle((prev) => Math.min(prev + 5, 45))}
                onClick={() => setAngle((prev) => Math.min(prev + 5, 45))}
                className="p-3 bg-gray-200 rounded-full shadow text-lg"
              >
                →
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
};

export default MiniFieldHockeyGame;
