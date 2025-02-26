import React, { useState, useEffect, useRef } from "react";

const GondolaGame = () => {
  const baseWidth = 320;
  const baseHeight = 480;

  const initialGameState = {
    score: 0,
    balloonsAvoided: 0,
    gameSpeed: 1,
    lastTimestamp: 0,
    isGameOver: false,
    gondola: {
      x: baseWidth / 2,
      y: baseHeight - 150,
      width: 40, // ゴンドラの幅を最適化（小さめに）
      height: 25, // ゴンドラの高さを最適化
      buoyancy: 0,
      speed: 0,
      maxSpeed: 8,
      acceleration: 0.5,
      deceleration: 0.1,
    },
    balloons: [],
  };

  const [gameState, setGameState] = useState({ ...initialGameState });
  const [score, setScore] = useState(0);
  const [balloonsAvoided, setBalloonsAvoided] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 300, height: 400 });
  const [scale, setScale] = useState(1);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const gameStateRef = useRef({ ...initialGameState });

  const keyStateRef = useRef({
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
  });

  const buttonStateRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
  });

  const updateCanvasSize = () => {
    if (!containerRef.current) return;

    const isPC = window.innerWidth >= 768;
    const containerWidth = containerRef.current.clientWidth;

    if (isPC) {
      const availableHeight = window.innerHeight - 200;
      let newWidth = Math.min(containerWidth, availableHeight / 1.1);
      let newHeight = newWidth * 1.1;

      newWidth = Math.floor(newWidth);
      newHeight = Math.floor(newHeight);

      setDimensions({ width: newWidth, height: newHeight });
      setScale(newWidth / baseWidth);
    } else {
      const newWidth = Math.floor(containerWidth);
      const newHeight = Math.floor(
        Math.min(window.innerHeight * 0.6, newWidth * 1.1)
      );

      setDimensions({ width: newWidth, height: newHeight });
      setScale(newWidth / baseWidth);
    }

    if (canvasRef.current) {
      canvasRef.current.width = dimensions.width;
      canvasRef.current.height = dimensions.height;
    }
  };

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " || e.code === "Space") {
        if (gameStateRef.current.isGameOver) {
          e.preventDefault();
          resetGame();
        }
        return;
      }

      if (Object.prototype.hasOwnProperty.call(keyStateRef.current, e.key)) {
        keyStateRef.current[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (Object.prototype.hasOwnProperty.call(keyStateRef.current, e.key)) {
        keyStateRef.current[e.key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const resetGame = () => {
    console.log("リセット開始");

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    updateCanvasSize();

    const newGameState = JSON.parse(JSON.stringify(initialGameState));
    newGameState.lastTimestamp = performance.now();

    gameStateRef.current = newGameState;
    setGameState(newGameState);
    setScore(0);
    setBalloonsAvoided(0);
    setIsGameOver(false);

    Object.keys(keyStateRef.current).forEach((key) => {
      keyStateRef.current[key] = false;
    });

    Object.keys(buttonStateRef.current).forEach((button) => {
      buttonStateRef.current[button] = false;
    });

    console.log("ゲームループ開始");
    setTimeout(() => {
      startGameLoop();
    }, 100);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    resetGame();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const startGameLoop = () => {
    if (!canvasRef.current || dimensions.width === 0) return;

    canvasRef.current.width = dimensions.width;
    canvasRef.current.height = dimensions.height;

    gameStateRef.current.lastTimestamp = performance.now();

    const loop = (timestamp) => {
      const deltaTime = timestamp - gameStateRef.current.lastTimestamp;
      gameStateRef.current.lastTimestamp = timestamp;

      const timeStep = 1000 / 60;
      const timeMultiplier = Math.min(deltaTime / timeStep, 2);

      if (!gameStateRef.current.isGameOver) {
        updateGame(timeMultiplier);
      }

      renderGame();

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
  };

  const updateGame = (timeMultiplier = 1) => {
    updateGondola(timeMultiplier);
    updateBalloons(timeMultiplier);
    generateBalloons(timeMultiplier);
  };

  const generateBalloons = (timeMultiplier = 1) => {
    const state = gameStateRef.current;
    // 風船の出現頻度を減らす（0.02 -> 0.01）
    if (Math.random() < (0.01 + state.gameSpeed * 0.005) * timeMultiplier) {
      const colors = [
        "#FF0000",
        "#00FF00",
        "#0000FF",
        "#FFFF00",
        "#FF00FF",
        "#00FFFF",
      ];
      const balloon = {
        x: Math.random() * (baseWidth - 40) + 20,
        y: -30,
        // 風船のサイズを小さく（10~15程度に）
        radius: Math.random() * 5 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 1 + state.gameSpeed,
      };

      state.balloons.push(balloon);
    }
  };

  const updateGondola = (timeMultiplier = 1) => {
    const state = gameStateRef.current;
    const gondola = state.gondola;

    if (keyStateRef.current.ArrowLeft || buttonStateRef.current.left) {
      gondola.speed = Math.max(
        gondola.speed - gondola.acceleration * timeMultiplier,
        -gondola.maxSpeed
      );
    } else if (keyStateRef.current.ArrowRight || buttonStateRef.current.right) {
      gondola.speed = Math.min(
        gondola.speed + gondola.acceleration * timeMultiplier,
        gondola.maxSpeed
      );
    } else {
      if (gondola.speed > 0) {
        gondola.speed = Math.max(
          0,
          gondola.speed - gondola.deceleration * timeMultiplier
        );
      } else if (gondola.speed < 0) {
        gondola.speed = Math.min(
          0,
          gondola.speed + gondola.deceleration * timeMultiplier
        );
      }
    }

    if (keyStateRef.current.ArrowUp || buttonStateRef.current.up) {
      gondola.buoyancy += 0.4 * timeMultiplier;
    } else if (keyStateRef.current.ArrowDown || buttonStateRef.current.down) {
      gondola.buoyancy -= 0.4 * timeMultiplier;
    }

    gondola.x += gondola.speed * timeMultiplier;
    gondola.y -= gondola.buoyancy * timeMultiplier;

    if (gondola.x < gondola.width / 2) {
      gondola.x = gondola.width / 2;
      gondola.speed = -gondola.speed * 0.5;
    } else if (gondola.x > baseWidth - gondola.width / 2) {
      gondola.x = baseWidth - gondola.width / 2;
      gondola.speed = -gondola.speed * 0.5;
    }

    if (gondola.y < 100) {
      gondola.y = 100;
      gondola.buoyancy = 0;
    } else if (gondola.y > baseHeight - 80) {
      gondola.y = baseHeight - 80;
      gondola.buoyancy = 0;
    }

    gondola.buoyancy *= Math.pow(0.98, timeMultiplier);
  };

  const updateBalloons = (timeMultiplier = 1) => {
    const state = gameStateRef.current;
    const gondola = state.gondola;
    const balloons = state.balloons;

    for (let i = balloons.length - 1; i >= 0; i--) {
      const balloon = balloons[i];
      balloon.y += balloon.speed * timeMultiplier;

      if (balloon.y > baseHeight + balloon.radius) {
        balloons.splice(i, 1);

        state.score += 10;
        setScore(state.score);

        state.balloonsAvoided += 1;
        setBalloonsAvoided(state.balloonsAvoided);

        if (state.balloonsAvoided % 5 === 0) {
          state.gameSpeed += 0.2;
        }

        continue;
      }

      if (state.isGameOver) continue;

      const dx = balloon.x - gondola.x;
      const dy = balloon.y - gondola.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < balloon.radius + gondola.width / 2) {
        balloons.splice(i, 1);
        state.isGameOver = true;
        setIsGameOver(true);

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      }
    }
  };

  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext("2d");
    const state = gameStateRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(scale, scale);

    drawBackground(ctx);
    drawGondola(ctx, state.gondola);
    drawBalloons(ctx, state.balloons);

    if (state.isGameOver) {
      drawGameOver(ctx, state);
    }

    ctx.restore();
  };

  const drawBackground = (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, baseHeight);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F7FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    drawCloud(ctx, 80, 80, 30); // 雲のサイズも少し小さめに調整
    drawCloud(ctx, 240, 120, 35);
    drawCloud(ctx, 120, 200, 25);
    drawCloud(ctx, 260, 300, 30);
  };

  const drawCloud = (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y - size * 0.3, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size * 1.5, y, size * 0.9, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y + size * 0.4, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawGondola = (ctx, gondola) => {
    const swayAmount = gondola.speed * 2;

    ctx.save();
    ctx.translate(gondola.x, gondola.y);
    ctx.rotate((swayAmount * Math.PI) / 180);

    // ゴンドラの本体
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(
      -gondola.width / 2,
      -gondola.height / 2,
      gondola.width,
      gondola.height
    );

    ctx.strokeStyle = "#654321";
    ctx.lineWidth = 1; // 線幅を少し細く
    ctx.strokeRect(
      -gondola.width / 2,
      -gondola.height / 2,
      gondola.width,
      gondola.height
    );

    // ゴンドラの中の座席
    ctx.fillStyle = "#A0522D";
    ctx.fillRect(
      -gondola.width / 2 + 5, // 内側のマージンを調整
      -gondola.height / 2 + 5,
      gondola.width - 10,
      gondola.height - 10
    );

    // 気球部分（サイズを小さめに調整）
    ctx.fillStyle = "#FF6347";
    ctx.beginPath();
    ctx.ellipse(
      0,
      -gondola.height / 2 - 20, // 気球の高さを少し近づける
      gondola.width / 2,
      20, // 気球の縦幅を小さく
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = "#B22222";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(
      0,
      -gondola.height / 2 - 20,
      gondola.width / 2,
      20,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // 紐（位置を最適化）
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-gondola.width / 2 + 5, -gondola.height / 2);
    ctx.lineTo(-gondola.width / 4, -gondola.height / 2 - 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(gondola.width / 2 - 5, -gondola.height / 2);
    ctx.lineTo(gondola.width / 4, -gondola.height / 2 - 20);
    ctx.stroke();

    ctx.restore();
  };

  const drawBalloons = (ctx, balloons) => {
    balloons.forEach((balloon) => {
      ctx.fillStyle = balloon.color;
      ctx.beginPath();
      ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(balloon.x, balloon.y + balloon.radius);
      ctx.lineTo(balloon.x, balloon.y + balloon.radius + 10); // 紐も少し短めに
      ctx.stroke();
    });
  };

  const drawGameOver = (ctx, state) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    ctx.fillStyle = "#FFF";
    ctx.font = "24px Arial"; // フォントサイズを小さめに
    ctx.textAlign = "center";
    ctx.fillText("ゲームオーバー", baseWidth / 2, baseHeight / 2 - 30);

    ctx.font = "18px Arial"; // フォントサイズを調整
    ctx.fillText(`スコア: ${state.score}`, baseWidth / 2, baseHeight / 2);
    ctx.fillText(
      `避けた風船: ${state.balloonsAvoided}`,
      baseWidth / 2,
      baseHeight / 2 + 30
    );
  };

  const handleButtonDown = (direction) => {
    buttonStateRef.current[direction] = true;
  };

  const handleButtonUp = (direction) => {
    buttonStateRef.current[direction] = false;
  };

  const handleReset = () => {
    console.log("Reset game called");
    resetGame();
  };

  return (
    <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg shadow-lg w-full max-w-5xl mx-auto h-screen max-h-screen overflow-hidden">
      <h1 className="text-xl md:text-2xl font-bold mb-2 text-blue-800">
        ゴンドラの空さんぽ
      </h1>

      <div className="flex flex-col md:flex-row w-full h-[calc(100vh-120px)] gap-4">
        <div
          ref={containerRef}
          className="relative w-full md:w-2/3 h-1/2 md:h-full"
          style={{ minHeight: "300px" }}
        >
          {dimensions.width > 0 && (
            <canvas
              ref={canvasRef}
              width={dimensions.width}
              height={dimensions.height}
              className="border-2 border-gray-400 rounded-lg bg-blue-100 shadow-md mx-auto block"
              style={{
                display: "block",
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                imageRendering: "pixelated",
              }}
            />
          )}

          {isGameOver && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button
                onClick={handleReset}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 md:px-6 rounded-lg shadow-lg transition duration-300 text-sm md:text-base z-10"
              >
                もう一度遊ぶ (スペースキー)
              </button>
            </div>
          )}
        </div>

        <div className="w-full md:w-1/3 flex flex-col justify-between">
          <div className="w-full mb-2">
            <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow">
              <div className="text-base md:text-lg">
                スコア: <span className="font-bold text-blue-600">{score}</span>
              </div>
              <div className="text-base md:text-lg">
                風船:{" "}
                <span className="font-bold text-green-600">
                  {balloonsAvoided}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full">
            <div className="col-start-2">
              <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow text-sm md:text-base"
                onMouseDown={() => handleButtonDown("up")}
                onMouseUp={() => handleButtonUp("up")}
                onMouseLeave={() => handleButtonUp("up")}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleButtonDown("up");
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleButtonUp("up");
                }}
              >
                上昇
              </button>
            </div>

            <div className="col-start-1 row-start-2">
              <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow text-sm md:text-base"
                onMouseDown={() => handleButtonDown("left")}
                onMouseUp={() => handleButtonUp("left")}
                onMouseLeave={() => handleButtonUp("left")}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleButtonDown("left");
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleButtonUp("left");
                }}
              >
                左
              </button>
            </div>

            <div className="col-start-3 row-start-2">
              <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow text-sm md:text-base"
                onMouseDown={() => handleButtonDown("right")}
                onMouseUp={() => handleButtonUp("right")}
                onMouseLeave={() => handleButtonUp("right")}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleButtonDown("right");
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleButtonUp("right");
                }}
              >
                右
              </button>
            </div>

            <div className="col-start-2 row-start-3">
              <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow text-sm md:text-base"
                onMouseDown={() => handleButtonDown("down")}
                onMouseUp={() => handleButtonUp("down")}
                onMouseLeave={() => handleButtonUp("down")}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleButtonDown("down");
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleButtonUp("down");
                }}
              >
                下降
              </button>
            </div>
          </div>

          <div className="mt-2 text-xs md:text-sm text-gray-600 text-center">
            <p>キーボード操作: 矢印キー ← → ↑ ↓</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GondolaGame;
