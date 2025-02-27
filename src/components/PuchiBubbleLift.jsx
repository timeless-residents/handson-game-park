import { useState, useEffect, useRef, useCallback } from "react";

const PuchiBubbleLift = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bubbleSize, setBubbleSize] = useState(30);
  const [bubblePosition, setBubblePosition] = useState({ x: 150, y: 300 });
  const [obstacles, setObstacles] = useState([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const frameCountRef = useRef(0);
  const collisionRef = useRef(false); // 衝突状態を追跡する新しいref

  // endGame関数をuseCallback化して再利用可能に
  const endGame = useCallback(() => {
    console.log("🛑 END GAME CALLED");
    if (!gameOver) {
      setGameOver(true);

      // アニメーションを確実に停止
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, [gameOver]);

  const canvasWidth = 300;
  const canvasHeight = 450;
  const minBubbleSize = 20;
  const maxBubbleSize = 60;
  const bubbleSizeStep = 5;
  const bubbleSpeed = 0.8; // 泡の速度を少し速く
  const obstacleSpeed = 1.8; // 障害物の速度を調整
  const obstacleInterval = 45; // 障害物生成間隔を調整

  // Initialize game
  // 初期障害物を作成する関数（スタート時に使用）
  const createInitialObstacle = (yPosition) => {
    const gapSize = 30 * 3.5; // 初期障害物は特に広い隙間に
    const maxPosition = canvasWidth - gapSize;
    
    // 泡の初期位置は中央（150）なので、必ず通れるように中央に隙間を配置
    let gapPosition;
    
    if (yPosition === 200) {
      // 中央の障害物は必ず泡の上に来るよう配置 (衝突しないように)
      gapPosition = maxPosition * 0.4; // 中央に隙間
    } else if (yPosition < 150) {
      // 上部の障害物は左右どちらかにランダム
      gapPosition = Math.random() > 0.5 ? maxPosition * 0.2 : maxPosition * 0.6;
    } else {
      // 下部の障害物も左右どちらかにランダム
      gapPosition = Math.random() > 0.5 ? maxPosition * 0.2 : maxPosition * 0.6;
    }
    
    return {
      y: yPosition,
      gapPosition,
      gapSize,
      passed: false,
      color: "#8ad3ff", // 優しい色
      isSafe: true // 初期障害物は衝突判定を緩和するフラグ
    };
  };
  
  const startGame = () => {
    console.log("Game starting!");

    // すべての状態をリセット
    setScore(0);
    setBubbleSize(30);
    
    // 泡の初期位置
    setBubblePosition({ x: 150, y: 300 });
    
    // 最初から障害物を表示（画面内にすぐ見えるように）
    const initialObstacles = [
      // 上部に広い隙間の障害物
      {y: 80, gapPosition: 100, gapSize: 100, passed: false, color: "#8ad3ff"},
      // 中央付近に障害物
      {y: 220, gapPosition: 50, gapSize: 90, passed: false, color: "#8ad3ff"},
    ];
    
    setObstacles(initialObstacles);
    frameCountRef.current = 0;
    collisionRef.current = false; // 衝突フラグをリセット

    // ゲーム状態を設定
    setGameOver(false);

    // 確実にレンダリングが完了した後にゲームを開始
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        console.log("🎮 STARTING GAME NOW!");
        setGameStarted(true);
      });
    });
  };

  // Reset game
  const resetGame = () => {
    console.log("🔄 Resetting game");

    // ゲーム状態をクリア
    setGameStarted(false);
    setGameOver(false);
    collisionRef.current = false; // 衝突フラグもリセット

    // アニメーションをクリア
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e) => {
      // スペースキーでゲーム開始・リセット
      if (e.key === " ") {
        if (!gameStarted) {
          startGame();
          return;
        }

        if (gameOver) {
          resetGame();
          return;
        }
      }

      if (!gameStarted || gameOver) return;

      switch (e.key) {
        case "ArrowLeft":
          setBubblePosition((prev) => ({
            ...prev,
            x: Math.max(bubbleSize / 2, prev.x - 12), // 左へ移動速度アップ
          }));
          break;
        case "ArrowRight":
          setBubblePosition((prev) => ({
            ...prev,
            x: Math.min(canvasWidth - bubbleSize / 2, prev.x + 12), // 右へ移動速度アップ
          }));
          break;
        case "ArrowUp":
          setBubblePosition((prev) => ({
            ...prev,
            y: Math.max(bubbleSize / 2, prev.y - 12), // 上へ移動速度アップ
          }));
          break;
        case "ArrowDown":
          setBubblePosition((prev) => ({
            ...prev,
            y: Math.min(canvasHeight - bubbleSize / 2, prev.y + 12), // 下へ移動速度アップ
          }));
          break;
        case " ": // Space bar
          setBubbleSize((prev) => {
            const newSize =
              (prev + bubbleSizeStep) % (maxBubbleSize + bubbleSizeStep);
            return newSize < minBubbleSize ? minBubbleSize : newSize;
          });
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted, gameOver, bubbleSize]);

  // Touch controls for mobile
  const handleTouchStart = (e) => {
    if (!gameStarted) {
      startGame();
      return;
    }

    if (gameOver) {
      resetGame();
      return;
    }

    // Change bubble size on tap
    setBubbleSize((prev) => {
      const newSize =
        (prev + bubbleSizeStep) % (maxBubbleSize + bubbleSizeStep);
      return newSize < minBubbleSize ? minBubbleSize : newSize;
    });
  };

  // Swipe controls for mobile
  const handleTouchMove = (e) => {
    if (!gameStarted || gameOver) return;

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setBubblePosition({
      x: Math.max(bubbleSize / 2, Math.min(canvasWidth - bubbleSize / 2, x)),
      y: Math.max(bubbleSize / 2, Math.min(canvasHeight - bubbleSize / 2, y)),
    });
  };

  // Create obstacles with more variety
  const createObstacle = () => {
    // ギャップサイズは泡のサイズに応じて調整（さらに広く）
    const gapSize = bubbleSize * 3;

    // 隙間の最大位置
    const maxPosition = canvasWidth - gapSize;
    let gapPosition;

    // 子供向けに簡単なパターンで障害物を配置
    // スコアが増えるとパターンが変わる
    const pattern = Math.floor(score / 3) % 3; // 3点ごとにパターン変更
    const position = score % 3; // 各パターン内で3つの位置

    if (pattern === 0) {
      // 基本パターン (左、中央、右)
      if (position === 0) {
        gapPosition = maxPosition * 0.1; // 左側
      } else if (position === 1) {
        gapPosition = maxPosition * 0.4; // 中央
      } else {
        gapPosition = maxPosition * 0.7; // 右側
      }
    } else if (pattern === 1) {
      // 逆パターン (右、中央、左)
      if (position === 0) {
        gapPosition = maxPosition * 0.7; // 右側
      } else if (position === 1) {
        gapPosition = maxPosition * 0.4; // 中央
      } else {
        gapPosition = maxPosition * 0.1; // 左側
      }
    } else {
      // 交互パターン (左右左右)
      if (position % 2 === 0) {
        gapPosition = maxPosition * 0.2; // 左よりの位置
      } else {
        gapPosition = maxPosition * 0.6; // 右よりの位置
      }
    }

    return {
      y: 0,
      gapPosition,
      gapSize,
      passed: false,
      color: "#8ad3ff", // 優しい色
      isSafe: false // 通常の障害物は普通に衝突判定
    };
  };

  // 視覚的に正確な衝突判定
  const checkCollision = (bubble, obstacle) => {
    // ゲーム時間に応じた判定（15秒たつと必ずゲームオーバー）
    if (frameCountRef.current > 900) {
      return true; // 15秒以上なら強制的に衝突
    }
    
    // 衝突判定のマージンを縮小（より厳密に）
    const margin = 5;

    // 障害物と泡が垂直方向で接触しているか（より厳密に）
    const verticalOverlap =
      bubble.y + bubble.size / 2 - margin > obstacle.y &&
      bubble.y - bubble.size / 2 + margin < obstacle.y + 20;

    if (verticalOverlap) {
      // 左右の障害物のエリア
      const leftObstacle = { start: 0, end: obstacle.gapPosition };
      const rightObstacle = {
        start: obstacle.gapPosition + obstacle.gapSize,
        end: canvasWidth,
      };

      // 泡の左右端（マージンを考慮して少し小さく）
      const bubbleLeft = bubble.x - bubble.size / 2 + margin;
      const bubbleRight = bubble.x + bubble.size / 2 - margin;

      // どちらかの障害物と接触していればゲームオーバー（より厳密に）
      const hitLeft =
        bubbleLeft < leftObstacle.end - margin && bubbleRight > leftObstacle.start + margin;
      const hitRight =
        bubbleLeft < rightObstacle.end - margin && bubbleRight > rightObstacle.start + margin;

      // 衝突している場合は状態フラグを設定
      if (hitLeft || hitRight) {
        console.log("💥 COLLISION DETECTED!");

        // 衝突フラグを設定
        collisionRef.current = true;
        
        // 即座にゲームを終了
        setTimeout(endGame, 0);

        return true;
      }
    }

    return false;
  };

  // Game loop
  const gameLoop = () => {
    // すでに衝突していたら何もしない
    if (collisionRef.current) {
      console.log("🚫 Game loop aborted due to collision flag");
      endGame();
      return;
    }

    // ゲームが終了しているか開始していない場合は何もしない
    if (!gameStarted || gameOver) {
      console.log("🚫 Game loop aborted - not started or already over");
      return;
    }

    // フレームカウンターを更新
    frameCountRef.current += 1;

    // 進行状況のログ（デバッグ用）
    if (frameCountRef.current % 60 === 0) {
      console.log(`⏱️ Frame: ${frameCountRef.current}, Score: ${score}`);
    }
    
    // 無敵時間の表示
    if (frameCountRef.current === 60) {
      console.log("🛡️ Invincibility period ended!");
    }

    // 新しい障害物の作成
    if (frameCountRef.current % obstacleInterval === 0) {
      setObstacles((prev) => [...prev, createObstacle()]);
    }

    // 障害物の位置を更新
    setObstacles((prev) => {
      const updated = prev
        .map((obstacle) => {
          // スコア増加のチェック
          let passed = obstacle.passed;
          if (!passed && obstacle.y > bubblePosition.y) {
            passed = true;
            setScore((s) => s + 1);
          }

          return {
            ...obstacle,
            y: obstacle.y + obstacleSpeed,
            passed,
          };
        })
        .filter((obstacle) => obstacle.y < canvasHeight + 20); // 画面外の障害物を削除

      return updated;
    });

    // 現在の泡の状態
    const bubble = {
      x: bubblePosition.x,
      y: bubblePosition.y,
      size: bubbleSize,
    };

    // 衝突判定（どの障害物とも衝突していないか確認）
    let hasCollision = false;

    for (const obstacle of obstacles) {
      if (checkCollision(bubble, obstacle)) {
        hasCollision = true;
        break;
      }
    }

    // 衝突していた場合
    if (hasCollision) {
      console.log("💥 COLLISION DETECTED - ENDING GAME");

      // 確実に終了状態にする
      collisionRef.current = true;

      // 泡の衝突状態を記録
      setBubblePosition((prev) => ({
        ...prev,
        collided: true,
      }));

      // ゲームを終了
      endGame();
      return;
    }

    // 泡の自然な上昇（4歳児向けに適度な速さ）
    setBubblePosition((prev) => ({
      ...prev,
      y: Math.max(bubbleSize / 2, prev.y - bubbleSpeed / 2), // 少し速く上昇
    }));

    // 衝突チェック（再度確認）
    if (collisionRef.current || gameOver) {
      console.log("🚦 Stopping game loop due to collision or game over");
      endGame();
      return;
    }

    // ゲームループを続行
    animationRef.current = requestAnimationFrame(gameLoop);
  };

  // Draw everything
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (light blue for water)
    ctx.fillStyle = "#e6f7ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // ゲーム時間表示
    if (gameStarted && !gameOver) {
      // プレイ時間の経過をゲージで表示
      const gameProgress = Math.min(frameCountRef.current / 900, 1); // 15秒でゲージいっぱい
      const gaugeWidth = 200;
      const gaugeHeight = 10;
      const gaugeX = (canvas.width - gaugeWidth) / 2;
      const gaugeY = 25;
      
      // ゲージの背景
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);
      
      // ゲージの進行部分
      ctx.fillStyle = gameProgress < 0.7 ? "#00ff00" : (gameProgress < 0.9 ? "#ffff00" : "#ff0000");
      ctx.fillRect(gaugeX, gaugeY, gaugeWidth * gameProgress, gaugeHeight);
      
      // ゲージの枠
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.strokeRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);
      
      // 15秒以上なら枠を赤く点滅させる
      if (frameCountRef.current > 900) {
        const flashRate = Math.sin(frameCountRef.current / 5) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(255, 0, 0, ${flashRate})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
      }
    }

    // Draw obstacles with friendly colors
    obstacles.forEach((obstacle) => {
      // 現在の泡の位置と障害物の位置を取得して当たり判定のデバッグに利用
      const bubble = {
        x: bubblePosition.x,
        y: bubblePosition.y,
        size: bubbleSize,
      };

      // 当たり判定と障害物の色（デバッグモードは削除）
      ctx.fillStyle = obstacle.color || "#8ad3ff";

      // Draw obstacles with rounded corners for a softer look
      // Left part
      ctx.beginPath();
      ctx.roundRect(0, obstacle.y, obstacle.gapPosition, 20, 5);
      ctx.fill();

      // Right part
      ctx.beginPath();
      ctx.roundRect(
        obstacle.gapPosition + obstacle.gapSize,
        obstacle.y,
        canvas.width - (obstacle.gapPosition + obstacle.gapSize),
        20,
        5
      );
      ctx.fill();

      // デバッグ用の当たり判定表示は削除
    });

    // Draw bubble with colorful, kid-friendly appearance
    // Main bubble
    ctx.beginPath();
    ctx.arc(bubblePosition.x, bubblePosition.y, bubbleSize / 2, 0, Math.PI * 2);

    // Rainbow gradient for bubble
    const gradient = ctx.createRadialGradient(
      bubblePosition.x,
      bubblePosition.y,
      0,
      bubblePosition.x,
      bubblePosition.y,
      bubbleSize / 2
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    gradient.addColorStop(0.5, "rgba(173, 216, 255, 0.8)");
    gradient.addColorStop(1, "rgba(142, 170, 255, 0.7)");

    ctx.fillStyle = gradient;
    ctx.fill();

    // Add bubble shine
    ctx.beginPath();
    ctx.arc(
      bubblePosition.x - bubbleSize / 5,
      bubblePosition.y - bubbleSize / 5,
      bubbleSize / 8,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fill();

    // Add smiling face for kids
    if (bubbleSize > 30) {
      // Eyes
      ctx.beginPath();
      ctx.arc(
        bubblePosition.x - bubbleSize / 6,
        bubblePosition.y - bubbleSize / 12,
        bubbleSize / 15,
        0,
        Math.PI * 2
      );
      ctx.arc(
        bubblePosition.x + bubbleSize / 6,
        bubblePosition.y - bubbleSize / 12,
        bubbleSize / 15,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fill();

      // Smile
      ctx.beginPath();
      ctx.arc(
        bubblePosition.x,
        bubblePosition.y + bubbleSize / 10,
        bubbleSize / 5,
        0.1 * Math.PI,
        0.9 * Math.PI,
        false
      );
      ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Start or game over overlay
    if (!gameStarted || gameOver) {
      if (!gameOver) {
        // ゲームスタート画面の背景
        ctx.fillStyle = "rgba(72, 61, 139, 0.7)"; // 紫がかったスラートブルー
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // テキスト描画基本設定
      ctx.fillStyle = "#FFF";
      ctx.font = "24px Arial";
      ctx.textAlign = "center";

      if (gameOver) {
        // ゲームオーバー画面の背景を暗く
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 画面を揺らす強いエフェクト (衝突感を強調)
        const frameTime = Date.now() % 1000;
        const shakeAmount = Math.sin(frameTime / 50) * 10;
        ctx.save();
        ctx.translate(
          Math.random() * shakeAmount - shakeAmount / 2,
          Math.random() * shakeAmount - shakeAmount / 2
        );

        // 「ゲームオーバー」テキストを赤く、大きく表示
        ctx.fillStyle = "#ff5555";
        ctx.font = "bold 28px Arial";
        ctx.fillText(
          "ぶつかっちゃった！",
          canvas.width / 2,
          canvas.height / 2 - 50
        );

        ctx.fillStyle = "#FFF";
        ctx.font = "22px Arial";
        ctx.fillText(
          "またチャレンジしよう！",
          canvas.width / 2,
          canvas.height / 2 - 10
        );

        // スコア表示を大きく
        ctx.font = "bold 26px Arial";
        ctx.fillStyle = "#ffff00";
        ctx.fillText(
          `スコア: ${score}`,
          canvas.width / 2,
          canvas.height / 2 + 30
        );

        ctx.font = "18px Arial";
        ctx.fillStyle = "#88ff88";
        ctx.fillText(
          "タップしてもう一度遊ぶ",
          canvas.width / 2,
          canvas.height / 2 + 70
        );

        ctx.restore(); // 画面の揺れをリセット
      } else {
        // ゲームタイトルとロゴ
        ctx.fillStyle = "#ffff00"; // 明るい黄色
        ctx.font = "bold 28px Arial";
        ctx.fillText(
          "ぷちぷちバブルリフト",
          canvas.width / 2,
          canvas.height / 2 - 60
        );

        // 簡単なバブルイラスト
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 - 20, 30, 0, Math.PI * 2);
        const gradStart = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2 - 20,
          0,
          canvas.width / 2,
          canvas.height / 2 - 20,
          30
        );
        gradStart.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        gradStart.addColorStop(1, "rgba(100, 200, 255, 0.7)");
        ctx.fillStyle = gradStart;
        ctx.fill();

        // 説明テキスト
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px Arial";
        ctx.fillText(
          "矢印キーで移動",
          canvas.width / 2,
          canvas.height / 2 + 30
        );
        ctx.fillText(
          "スペースキーでサイズ変更",
          canvas.width / 2,
          canvas.height / 2 + 55
        );

        // スタート方法
        ctx.fillStyle = "#88ff88"; // 明るい緑
        ctx.font = "bold 18px Arial";
        ctx.fillText(
          "タップかスペースキーでスタート！",
          canvas.width / 2,
          canvas.height / 2 + 90
        );
      }
    }

    // Display score
    if (gameStarted && !gameOver) {
      ctx.fillStyle = "#333";
      ctx.font = "16px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`スコア: ${score}`, 10, 25);
    }
  }, [gameStarted, gameOver, score, bubblePosition, bubbleSize, obstacles]);

  // ゲームオーバー状態をデバッグするためのロギング
  useEffect(() => {
    console.log(
      `Game state changed - gameStarted: ${gameStarted}, gameOver: ${gameOver}, collision: ${collisionRef.current}`
    );

    // ゲームオーバー時に緊急デバッグ情報を表示
    if (gameOver) {
      console.log("📊 DEBUG INFO:");
      console.log("- Obstacles:", obstacles.length);
      console.log("- Frame count:", frameCountRef.current);
      console.log("- Bubble position:", bubblePosition);
      console.log("- Bubble size:", bubbleSize);
    }
  }, [gameStarted, gameOver, obstacles.length, bubblePosition, bubbleSize]);

  // Start/stop game loop on game state changes
  useEffect(() => {
    // 衝突チェック
    if (collisionRef.current) {
      console.log("⚠️ Collision flag is set, enforcing game over");
      setGameOver(true);
      return;
    }

    if (gameStarted && !gameOver) {
      console.log("▶️ Starting game loop");

      // 単一のゲームループを開始するため、既存のループをクリア
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      // 確実にゲームループを1回だけ起動
      const startLoopTimeout = setTimeout(() => {
        if (gameStarted && !gameOver && !collisionRef.current) {
          console.log("🎬 Initiating game loop");
          gameLoop();
        }
      }, 100);

      return () => {
        clearTimeout(startLoopTimeout);
        if (animationRef.current) {
          console.log("🛑 Cleaning up animation frame on unmount");
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      };
    } else if (animationRef.current) {
      console.log("⏹️ Explicitly stopping game loop");
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    return () => {
      if (animationRef.current) {
        console.log("🧹 Final cleanup of animation frame");
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [gameStarted, gameOver, gameLoop, endGame]);

  return (
    <div className="game-container">
      <h1>ぷちぷちバブルリフト</h1>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={!gameStarted ? startGame : gameOver ? resetGame : undefined}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{
            border: "2px solid #333",
            borderRadius: "10px",
            margin: "0 auto",
            display: "block",
            touchAction: "none", // Prevents browser handling of touch events
          }}
        />
      </div>
      <div className="game-instructions">
        <p>矢印キーで泡を操作して障害物を避けよう！</p>
        <p>スペースキーで泡のサイズを変えられるよ！</p>
      </div>

      {/* デバッグ情報（隠し要素） */}
      <div style={{ display: gameOver ? "block" : "none" }}>
        <p>
          Game state: {gameStarted ? "Started" : "Not started"},{" "}
          {gameOver ? "Game over" : "Playing"}
        </p>
        <p>
          Collision ref:{" "}
          {collisionRef.current ? "Collision detected" : "No collision"}
        </p>
        <p>Frame count: {frameCountRef.current}</p>
        <button
          onClick={() => {
            console.log("Manual collision triggered");
            collisionRef.current = true;
            endGame();
          }}
        >
          Force collision
        </button>
      </div>
    </div>
  );
};

export default PuchiBubbleLift;
