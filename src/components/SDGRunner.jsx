import { useState, useEffect, useCallback, useRef, useMemo } from "react";

const SDGRunner = () => {
  // Mobile detection
  const isMobile = window.innerWidth <= 768;
  const CONTROL_PANEL_HEIGHT = 68;
  const GAME_HEIGHT = isMobile
    ? window.innerHeight - CONTROL_PANEL_HEIGHT
    : window.innerHeight;
  const GROUND_HEIGHT = 64;
  const PLAYER_SIZE = 40;

  const playerRestY = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE / 2;
  const maxJumpHeight = Math.abs(-18) ** 2 / (2 * 0.8);
  const apexY = playerRestY - maxJumpHeight;

  const initialPosition = useMemo(
    () => ({
      x: window.innerWidth / 4,
      y: playerRestY,
    }),
    [playerRestY]
  );

  const playerPosRef = useRef(initialPosition);
  const audioCtxRef = useRef(null);

  const [position, setPosition] = useState(initialPosition);
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isJumping, setIsJumping] = useState(false);
  const [score, setScore] = useState(0);
  const [earthHealth, setEarthHealth] = useState(100); // Earth's health (depletes over time)
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [sdgItems, setSdgItems] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);
  const [direction, setDirection] = useState("right");
  const [collectedSDGs, setCollectedSDGs] = useState([]); // Track which SDGs are collected

  const sdgIcons = useMemo(
    () => [
      "1️⃣",
      "2️⃣",
      "3️⃣",
      "4️⃣",
      "5️⃣",
      "6️⃣",
      "7️⃣",
      "8️⃣",
      "9️⃣",
      "🔟",
      "1️⃣1️⃣",
      "1️⃣2️⃣",
      "1️⃣3️⃣",
      "1️⃣4️⃣",
      "1️⃣5️⃣",
      "1️⃣6️⃣",
      "1️⃣7️⃣",
    ],
    []
  );

  const sdgNames = useMemo(
    () => [
      "No Poverty",
      "Zero Hunger",
      "Good Health",
      "Quality Education",
      "Gender Equality",
      "Clean Water",
      "Clean Energy",
      "Decent Work",
      "Industry & Innovation",
      "Reduced Inequalities",
      "Sustainable Cities",
      "Responsible Consumption",
      "Climate Action",
      "Life Below Water",
      "Life on Land",
      "Peace & Justice",
      "Partnerships",
    ],
    []
  );

  const playSound = useCallback((type) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    const audioContext = audioCtxRef.current;
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === "jump") {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        600,
        audioContext.currentTime + 0.1
      );
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );
    } else if (type === "collect") {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        1200,
        audioContext.currentTime + 0.1
      );
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );
    } else if (type === "hit") {
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
      );
    }
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  }, []);

  const jump = useCallback(() => {
    if (!isJumping && !gameOver && gameStarted) {
      setIsJumping(true);
      setVelocity((v) => ({ ...v, y: -18 }));
      playSound("jump");
    }
  }, [isJumping, gameOver, gameStarted, playSound]);

  const spawnInitialObjects = useCallback(() => {
    const initialSDG = {
      x: window.innerWidth,
      y: Math.random() * (playerRestY - apexY) + apexY,
      id: Date.now() + Math.random(),
      sdgIndex: Math.floor(Math.random() * sdgIcons.length),
    };
    const initialObstacle = {
      x: window.innerWidth + 200, // Offset to avoid immediate collision
      y: playerRestY,
      id: Date.now() + Math.random(),
    };
    setSdgItems([initialSDG]);
    setObstacles([initialObstacle]);
  }, [playerRestY, apexY, sdgIcons]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setEarthHealth(100);
    setPosition(initialPosition);
    playerPosRef.current = initialPosition;
    setVelocity({ x: 0, y: 0 });
    setSdgItems([]);
    setObstacles([]);
    setIsJumping(false);
    setDirection("right");
    setCollectedSDGs([]);
    spawnInitialObjects();
  }, [initialPosition, spawnInitialObjects]);

  const handleGameOver = useCallback(() => {
    setGameOver(true);
    playSound("hit");
  }, [playSound]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " ") {
        if (gameOver || !gameStarted) startGame();
        else jump();
        return;
      }
      switch (e.key) {
        case "ArrowLeft":
          setIsMovingLeft(true);
          setDirection("left");
          break;
        case "ArrowRight":
          setIsMovingRight(true);
          setDirection("right");
          break;
        default:
          break;
      }
    };
    const handleKeyUp = (e) => {
      switch (e.key) {
        case "ArrowLeft":
          setIsMovingLeft(false);
          break;
        case "ArrowRight":
          setIsMovingRight(false);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameOver, gameStarted, jump, startGame]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const MOVE_SPEED = 5;
    const gameLoop = setInterval(() => {
      const prevPos = playerPosRef.current;
      const movement =
        (isMovingRight ? MOVE_SPEED : 0) - (isMovingLeft ? MOVE_SPEED : 0);
      const newX = Math.max(
        0,
        Math.min(window.innerWidth - PLAYER_SIZE, prevPos.x + movement)
      );
      let newY = prevPos.y + velocity.y;
      let newVelocityY = velocity.y + 0.8;
      if (newY >= playerRestY) {
        newY = playerRestY;
        newVelocityY = 0;
        setIsJumping(false);
      }
      const newPos = { x: newX, y: newY };
      playerPosRef.current = newPos;
      setPosition(newPos);
      setVelocity((v) => ({ ...v, y: newVelocityY }));

      // Earth Health depletes over time
      setEarthHealth((h) => Math.max(0, h - 0.05));
      if (earthHealth <= 0) handleGameOver();

      // Spawn SDG items
      if (Math.random() < 0.02) {
        const sdgY = Math.random() * (playerRestY - apexY) + apexY;
        setSdgItems((prev) => [
          ...prev,
          {
            x: window.innerWidth,
            y: sdgY,
            id: Date.now() + Math.random(),
            sdgIndex: Math.floor(Math.random() * sdgIcons.length),
          },
        ]);
      }

      // Spawn obstacles
      if (Math.random() < 0.01) {
        setObstacles((prev) => [
          ...prev,
          {
            x: window.innerWidth,
            y: playerRestY,
            id: Date.now() + Math.random(),
          },
        ]);
      }

      // Handle SDG collection
      setSdgItems((prevSdgItems) =>
        prevSdgItems.reduce((acc, item) => {
          const newSdgX = item.x - 3;
          const dx = newSdgX - playerPosRef.current.x;
          const dy = item.y - playerPosRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < PLAYER_SIZE * 1.5) {
            setScore((s) => s + 1);
            setEarthHealth((h) => Math.min(100, h + 5)); // Restore some health
            setCollectedSDGs((prev) => [...new Set([...prev, item.sdgIndex])]);
            playSound("collect");
            return acc;
          }
          if (newSdgX < -30) return acc;
          return [...acc, { ...item, x: newSdgX }];
        }, [])
      );

      // Handle obstacles
      setObstacles((prevObstacles) =>
        prevObstacles.reduce((acc, obstacle) => {
          const newObstacleX = obstacle.x - 4;
          const dx = newObstacleX - playerPosRef.current.x;
          const dy = obstacle.y - playerPosRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < PLAYER_SIZE - 10) {
            setEarthHealth((h) => h - 20);
            playSound("hit");
            if (earthHealth - 20 <= 0) handleGameOver();
            return acc;
          }
          if (newObstacleX < -30) return acc;
          return [...acc, { ...obstacle, x: newObstacleX }];
        }, [])
      );
    }, 1000 / 60);
    return () => clearInterval(gameLoop);
  }, [
    gameStarted,
    gameOver,
    isMovingLeft,
    isMovingRight,
    velocity,
    earthHealth,
    handleGameOver,
    playerRestY,
    apexY,
    PLAYER_SIZE,
    sdgIcons,
    playSound,
  ]);

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-sky-200 to-green-100 flex flex-col items-center overflow-hidden">
      {/* Score and Health Display */}
      <div className="absolute top-12 left-0 w-full text-center z-10">
        <div className="text-3xl font-bold text-white drop-shadow-lg">
          🌍 SDG Score: {score} | Earth Health: {Math.round(earthHealth)}%
        </div>
        <div className="text-lg text-white drop-shadow-lg mt-2">
          Collected SDGs: {collectedSDGs.map((i) => sdgIcons[i]).join(" ")}
        </div>
      </div>

      {/* Game Area */}
      <div
        className="relative bg-gradient-to-b from-sky-300 to-green-200 rounded-lg shadow-lg overflow-hidden"
        style={{ width: "100%", height: GAME_HEIGHT }}
      >
        {/* Player (Earth) */}
        <div
          className="absolute text-4xl"
          style={{
            left: position.x,
            top: position.y,
            transform: `translate(-50%, -50%) scaleX(${
              direction === "right" ? -1 : 1
            })`,
          }}
        >
          🌍
        </div>

        {/* SDG Items */}
        {sdgItems.map((item) => (
          <div
            key={item.id}
            className="absolute text-3xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
            style={{ left: item.x, top: item.y }}
          >
            {sdgIcons[item.sdgIndex]}
          </div>
        ))}

        {/* Pollution Obstacles */}
        {obstacles.map((obstacle) => (
          <div
            key={obstacle.id}
            className="absolute text-3xl transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: obstacle.x, top: obstacle.y }}
          >
            💨
          </div>
        ))}

        {/* Ground */}
        <div className="absolute left-0 w-full bottom-0">
          <div className="h-8 bg-green-400" /> {/* Grass */}
          <div className="h-8 bg-gradient-to-b from-brown-700 to-brown-900" />{" "}
          {/* Soil */}
        </div>
      </div>

      {/* Mobile Control Panel */}
      {gameStarted && !gameOver && isMobile && (
        <div
          className="fixed left-0 w-full flex justify-between items-center px-8 md:hidden z-50 bg-[#8B4513] py-4"
          style={{ bottom: "0" }}
        >
          <div className="flex gap-4">
            <button
              className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm active:bg-white/30"
              onTouchStart={() => {
                setIsMovingLeft(true);
                setDirection("left");
              }}
              onTouchEnd={() => setIsMovingLeft(false)}
              onMouseDown={() => {
                setIsMovingLeft(true);
                setDirection("left");
              }}
              onMouseUp={() => setIsMovingLeft(false)}
              onMouseLeave={() => setIsMovingLeft(false)}
            >
              ⬅️
            </button>
            <button
              className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm active:bg-white/30"
              onTouchStart={() => {
                setIsMovingRight(true);
                setDirection("right");
              }}
              onTouchEnd={() => setIsMovingRight(false)}
              onMouseDown={() => {
                setIsMovingRight(true);
                setDirection("right");
              }}
              onMouseUp={() => setIsMovingRight(false)}
              onMouseLeave={() => setIsMovingRight(false)}
            >
              ➡️
            </button>
          </div>
          <button
            className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm active:bg-white/30"
            onTouchStart={jump}
            onMouseDown={jump}
          >
            ⬆️
          </button>
        </div>
      )}

      {/* Start Screen */}
      {!gameStarted && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-8">🌍 SDG Runner</h1>
            <button
              className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl text-2xl active:bg-white/10"
              onClick={startGame}
            >
              Save the Earth! Tap to Start!
            </button>
            <p className="mt-4 text-lg">
              {isMobile
                ? "Use buttons below to move and jump!"
                : "← → to move, Space to jump/restart"}
            </p>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Game Over</h2>
            <p className="text-2xl mb-4">SDG Score: {score}</p>
            <p className="text-lg mb-4">
              Collected SDGs:{" "}
              {collectedSDGs
                .map((i) => `${sdgIcons[i]} (${sdgNames[i]})`)
                .join(", ")}
            </p>
            <button
              className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl text-2xl active:bg-white/10"
              onClick={startGame}
            >
              Try Again!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SDGRunner;
