import { useState, useEffect, useRef } from "react";

// グリッドの分割数
const GRID_COLS = 12;
const GRID_ROWS = 8;

// ヘッダーとフッターの高さ（ピクセル）
const HEADER_HEIGHT = 100;
const FOOTER_HEIGHT = 50;

// 釘を打つ際の許容誤差はグリッド上の「セルが完全一致しているかどうか」で判定します

const DIYHouseGame = () => {
  // ゲームエリアのサイズ（ヘッダー・フッターを除く）
  const [gameDimensions, setGameDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - HEADER_HEIGHT - FOOTER_HEIGHT,
  });

  useEffect(() => {
    const updateDimensions = () => {
      setGameDimensions({
        width: window.innerWidth,
        height: window.innerHeight - HEADER_HEIGHT - FOOTER_HEIGHT,
      });
    };
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // body の余白・スクロールを無くす
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const { width: gameWidth, height: gameHeight } = gameDimensions;

  // グリッドセル1つ分のサイズ
  const cellWidth = gameWidth / GRID_COLS;
  const cellHeight = gameHeight / GRID_ROWS;

  // 木の板のサイズ（セルサイズの80%程度）
  const BOARD_WIDTH = cellWidth * 0.8;
  const BOARD_HEIGHT = cellHeight * 0.8;

  // 各要素をセル内中央に配置するためのオフセット（セルの中央から木板サイズの半分を引く）
  const boardOffsetX = (cellWidth - BOARD_WIDTH) / 2;
  const boardOffsetY = (cellHeight - BOARD_HEIGHT) / 2;

  // ターゲット（赤枠）のグリッド位置を定義
  // 例として、下部中央を床、左右の壁、屋根の順に配置
  const centerCol = GRID_COLS / 2;
  const boardSlotsGrid = [
    { col: Math.floor(centerCol), row: GRID_ROWS - 2 }, // 床：下から2行目中央
    { col: Math.floor(centerCol) - 2, row: GRID_ROWS - 4 }, // 左の壁：中央より左、下から4行目
    { col: Math.floor(centerCol) + 2, row: GRID_ROWS - 4 }, // 右の壁：中央より右、下から4行目
    { col: Math.floor(centerCol), row: GRID_ROWS - 6 }, // 屋根：中央、下から6行目
  ];

  // グリッド座標（col, row）をピクセル座標に変換する関数
  const gridToPixel = (gridCoord) => {
    return {
      x: gridCoord.col * cellWidth + boardOffsetX,
      y: gridCoord.row * cellHeight + boardOffsetY,
    };
  };

  // ターゲットのピクセル座標リスト
  const boardSlots = boardSlotsGrid.map(gridToPixel);

  // 現在操作中の木の板のグリッド位置を状態として管理
  const initialGridPos = {
    col: Math.floor(GRID_COLS / 2),
    row: Math.floor(GRID_ROWS / 2),
  };
  const [currentGridPos, setCurrentGridPos] = useState(initialGridPos);

  // ピクセル座標はグリッド位置から計算
  const [currentPosition, setCurrentPosition] = useState(
    gridToPixel(initialGridPos)
  );

  // ゲームエリアサイズが変わったとき、再計算
  useEffect(() => {
    setCurrentPosition(gridToPixel(currentGridPos));
  }, [gameDimensions, currentGridPos]);

  // 釘打ち済みの板のピクセル座標リスト
  const [placedBoards, setPlacedBoards] = useState([]);
  // 次に釘を打つターゲットのインデックス
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [message, setMessage] = useState("");

  // 効果音用の ref（※音声ファイルは適宜配置してください）
  const placementAudioRef = useRef(null);
  const completeAudioRef = useRef(null);

  // キー操作の処理：グリッド上の移動
  useEffect(() => {
    const handleKeyDown = (e) => {
      // すべてのターゲットに釘を打ち終わっている場合は操作しない
      if (currentSlotIndex >= boardSlots.length) return;

      let { col, row } = currentGridPos;

      if (e.key === "ArrowLeft") {
        col = Math.max(0, col - 1);
      } else if (e.key === "ArrowRight") {
        col = Math.min(GRID_COLS - 1, col + 1);
      } else if (e.key === "ArrowUp") {
        row = Math.max(0, row - 1);
      } else if (e.key === "ArrowDown") {
        row = Math.min(GRID_ROWS - 1, row + 1);
      } else if (e.key === " " || e.key === "Spacebar" || e.key === "Space") {
        // 釘を打つ処理：現在のグリッド位置がターゲットのグリッド位置と完全一致しているか判定
        const targetGrid = boardSlotsGrid[currentSlotIndex];
        if (col === targetGrid.col && row === targetGrid.row) {
          if (placementAudioRef.current) {
            placementAudioRef.current.currentTime = 0;
            placementAudioRef.current.play();
          }
          setPlacedBoards([...placedBoards, boardSlots[currentSlotIndex]]);
          const nextIndex = currentSlotIndex + 1;
          setCurrentSlotIndex(nextIndex);
          if (nextIndex >= boardSlots.length) {
            setMessage("家が完成しました！");
            if (completeAudioRef.current) {
              completeAudioRef.current.currentTime = 0;
              completeAudioRef.current.play();
            }
          } else {
            setMessage("板を正しい位置に打ち込みました！");
            // 次は初期位置に戻す（グリッド上の初期位置）
            setCurrentGridPos(initialGridPos);
          }
        } else {
          setMessage("位置がずれています！もう一度調整してね。");
        }
        return;
      }
      setCurrentGridPos({ col, row });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentGridPos,
    currentSlotIndex,
    boardSlots,
    boardSlotsGrid,
    placedBoards,
  ]);

  // 現在のグリッド位置が変わったら、ピクセル座標を更新
  useEffect(() => {
    setCurrentPosition(gridToPixel(currentGridPos));
  }, [currentGridPos, gameDimensions]);

  // 家完成時に表示するオーバーレイ用スタイル
  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.8)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  };

  const houseContainerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const roofStyle = {
    width: 0,
    height: 0,
    borderLeft: "50px solid transparent",
    borderRight: "50px solid transparent",
    borderBottom: "50px solid #d35400",
  };

  const bodyStyle = {
    width: "100px",
    height: "80px",
    backgroundColor: "#e74c3c",
    border: "2px solid #c0392b",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      <header
        style={{
          height: HEADER_HEIGHT,
          background: "#ccc",
          textAlign: "center",
          padding: "10px",
        }}
      >
        <h2>木の板トントンDIY</h2>
        <p>矢印キーで板を移動し、スペースキーで釘を打ちます。</p>
      </header>

      <main
        style={{
          flexGrow: 1,
          position: "relative",
          backgroundColor: "#eee",
          border: "2px solid #333",
          overflow: "hidden",
        }}
      >
        {/* 釘打ち済みの板 */}
        {placedBoards.map((pos, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              width: BOARD_WIDTH,
              height: BOARD_HEIGHT,
              backgroundColor: "saddlebrown",
              left: pos.x,
              top: pos.y,
              boxSizing: "border-box",
              zIndex: 1,
            }}
          />
        ))}

        {/* ターゲット位置（赤いアウトライン） */}
        {currentSlotIndex < boardSlots.length && (
          <div
            style={{
              position: "absolute",
              width: BOARD_WIDTH,
              height: BOARD_HEIGHT,
              outline: "2px dashed red",
              left: boardSlots[currentSlotIndex].x,
              top: boardSlots[currentSlotIndex].y,
              boxSizing: "border-box",
              zIndex: 0,
            }}
          />
        )}

        {/* 現在操作中の木の板 */}
        {currentSlotIndex < boardSlots.length && (
          <div
            style={{
              position: "absolute",
              width: BOARD_WIDTH,
              height: BOARD_HEIGHT,
              backgroundColor: "peru",
              left: currentPosition.x,
              top: currentPosition.y,
              boxSizing: "border-box",
              zIndex: 2,
            }}
          />
        )}

        {/* 家完成時のオーバーレイ */}
        {currentSlotIndex >= boardSlots.length && (
          <div style={overlayStyle}>
            <div style={houseContainerStyle}>
              <div style={roofStyle} />
              <div style={bodyStyle} />
            </div>
            <h2>家が完成しました！</h2>
          </div>
        )}

        {/* 効果音用のオーディオ要素 */}
        <audio
          ref={placementAudioRef}
          src="/handson-game-park/placement-sound.mp3"
          preload="auto"
        />
        <audio
          ref={completeAudioRef}
          src="/handson-game-park/house-complete.mp3"
          preload="auto"
        />
      </main>

      <footer
        style={{
          height: FOOTER_HEIGHT,
          background: "#ccc",
          textAlign: "center",
          padding: "10px",
        }}
      >
        <p>{message}</p>
      </footer>
    </div>
  );
};

export default DIYHouseGame;
