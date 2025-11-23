/**
 * ゲームロジック
 * 傾きセンサーを使用したボール移動ゲームのメイン処理
 * 作成理由: DeviceOrientationAPIを使ってiPhoneの傾きでボールを制御するゲームを実装するため
 */

// ゲーム設定定数
const CANVAS_WIDTH = 400;  // キャンバスの幅
const CANVAS_HEIGHT = 400; // キャンバスの高さ
const PLAYER_RADIUS = 15;  // プレイヤーの半径
const GOAL_RADIUS = 25;    // ゴールの半径
const FRICTION = 0.98;     // 摩擦係数（速度の減衰）
const TILT_SENSITIVITY = 0.15; // 傾き感度（加速度を半分に調整）
const MIN_START_GOAL_DISTANCE = 150; // スタートとゴールの最小距離
const MAX_POSITION_ATTEMPTS = 100; // 位置生成の最大試行回数
const DEBUG_MODE = false; // デバッグ情報の表示フラグ
const WALL_COUNT = 3; // 壁の数
const WALL_WIDTH = 10; // 壁の幅
const MIN_WALL_LENGTH = 60; // 壁の最小長さ
const MAX_WALL_LENGTH = 150; // 壁の最大長さ

// ゲーム状態オブジェクト
let gameState = {
  player: {
    x: 50,           // プレイヤーのX座標
    y: 50,           // プレイヤーのY座標
    velocityX: 0,    // X方向の速度
    velocityY: 0,    // Y方向の速度
    startX: 50,      // スタート位置のX座標
    startY: 50       // スタート位置のY座標
  },
  goal: {
    x: 350,          // ゴールのX座標
    y: 350           // ゴールのY座標
  },
  walls: [],         // 壁の配列
  score: 0,          // スコア（ゴール達成回数）
  tilt: {
    beta: 0,         // 前後の傾き
    gamma: 0         // 左右の傾き
  },
  isPlaying: false,  // ゲーム実行中フラグ
  permissionGranted: false, // 権限取得フラグ
  isWaiting: false   // 待機中フラグ（ボールの動きを停止）
};

// DOM要素
let canvas;        // キャンバス要素
let ctx;           // 2Dコンテキスト
let animationId;   // アニメーションフレームID

/**
 * 初期化関数
 * ページ読み込み時にゲームの初期設定を行う
 */
function init() {
  console.log('ゲーム初期化開始');
  
  // キャンバス要素の取得
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  
  // キャンバスサイズの設定
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  
  // スコア表示の更新
  updateScoreDisplay();
  
  // 初期壁の生成
  generateWalls();
  
  // iOS 13以降のDeviceOrientationの権限チェック
  if (typeof DeviceOrientationEvent !== 'undefined' && 
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13以降: 権限要求ボタンを表示
    document.getElementById('requestPermission').style.display = 'block';
    document.getElementById('statusText').textContent = 
      'センサーを使用するには権限が必要です';
  } else if (window.DeviceOrientationEvent) {
    // それ以外: 直接センサーを開始
    startSensor();
  } else {
    // DeviceOrientationがサポートされていない
    document.getElementById('statusText').textContent = 
      'このデバイスは傾きセンサーに対応していません';
  }
  
  // 初期描画
  draw();
}

/**
 * 権限要求処理
 * iOS 13以降でDeviceOrientationの権限を要求
 */
async function requestPermission() {
  try {
    const permission = await DeviceOrientationEvent.requestPermission();
    if (permission === 'granted') {
      gameState.permissionGranted = true;
      document.getElementById('requestPermission').style.display = 'none';
      startSensor();
    } else {
      document.getElementById('statusText').textContent = 
        '権限が拒否されました。設定から許可してください。';
    }
  } catch (error) {
    console.error('権限要求エラー:', error);
    document.getElementById('statusText').textContent = 
      'エラーが発生しました: ' + error.message;
  }
}

/**
 * センサー開始処理
 * DeviceOrientationイベントのリスナーを設定してゲームを開始
 */
function startSensor() {
  console.log('センサー開始');
  gameState.permissionGranted = true;
  gameState.isPlaying = true;
  gameState.isWaiting = true;  // 待機状態で開始
  
  // DeviceOrientationイベントのリスナー設定
  window.addEventListener('deviceorientation', handleOrientation);
  
  document.getElementById('statusText').textContent = 
    'デバイスを傾けてボールを動かしてください！';
  
  // ゲーム開始シーケンスを実行
  startGameSequence();
  
  // ゲームループ開始
  gameLoop();
}

/**
 * デバイスの傾き処理
 * DeviceOrientationイベントから傾きデータを取得
 * @param {DeviceOrientationEvent} event - 傾きイベントオブジェクト
 */
function handleOrientation(event) {
  // beta: 前後の傾き（-180〜180度）
  // gamma: 左右の傾き（-90〜90度）
  gameState.tilt.beta = event.beta || 0;
  gameState.tilt.gamma = event.gamma || 0;
}

/**
 * ゲームループ
 * 毎フレーム実行されるメイン更新処理
 */
function gameLoop() {
  update();
  draw();
  
  if (gameState.isPlaying) {
    animationId = requestAnimationFrame(gameLoop);
  }
}

/**
 * 更新処理
 * プレイヤーの位置、速度、当たり判定を更新
 */
function update() {
  // 待機中は更新をスキップ
  if (gameState.isWaiting) {
    return;
  }
  
  // 傾きから加速度を計算（gammaでX軸、betaでY軸）
  const accelerationX = gameState.tilt.gamma * TILT_SENSITIVITY;
  const accelerationY = gameState.tilt.beta * TILT_SENSITIVITY;
  
  // 速度の更新
  gameState.player.velocityX += accelerationX;
  gameState.player.velocityY += accelerationY;
  
  // 摩擦の適用
  gameState.player.velocityX *= FRICTION;
  gameState.player.velocityY *= FRICTION;
  
  // 位置の更新
  gameState.player.x += gameState.player.velocityX;
  gameState.player.y += gameState.player.velocityY;
  
  // 壁との衝突判定
  checkWallCollision();
  
  // 画面外判定とリセット
  if (isOutOfBounds()) {
    resetPlayerPosition();
    showMessage('画面外に出ました！スタート位置に戻ります', 3000);
  }
  
  // ゴール判定
  if (checkGoalCollision()) {
    handleGoalReached();
  }
}

/**
 * 画面外判定
 * プレイヤーが画面外に出たかをチェック
 * @returns {boolean} 画面外ならtrue
 */
function isOutOfBounds() {
  return (
    gameState.player.x < -PLAYER_RADIUS ||
    gameState.player.x > CANVAS_WIDTH + PLAYER_RADIUS ||
    gameState.player.y < -PLAYER_RADIUS ||
    gameState.player.y > CANVAS_HEIGHT + PLAYER_RADIUS
  );
}

/**
 * プレイヤー位置のリセット
 * スタート位置に戻し、速度をリセット
 */
function resetPlayerPosition() {
  gameState.player.x = gameState.player.startX;
  gameState.player.y = gameState.player.startY;
  gameState.player.velocityX = 0;
  gameState.player.velocityY = 0;
}

/**
 * ゴール判定
 * プレイヤーとゴールの距離を計算して衝突判定
 * @returns {boolean} ゴールに到達していればtrue
 */
function checkGoalCollision() {
  const dx = gameState.player.x - gameState.goal.x;
  const dy = gameState.player.y - gameState.goal.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < (PLAYER_RADIUS + GOAL_RADIUS);
}

/**
 * 壁との衝突判定
 * プレイヤーが壁に衝突した場合、速度を反転させて跳ね返す
 */
function checkWallCollision() {
  for (const wall of gameState.walls) {
    // 壁の境界を計算
    const wallLeft = wall.x - wall.width / 2;
    const wallRight = wall.x + wall.width / 2;
    const wallTop = wall.y - wall.height / 2;
    const wallBottom = wall.y + wall.height / 2;
    
    // プレイヤーの境界を計算
    const playerLeft = gameState.player.x - PLAYER_RADIUS;
    const playerRight = gameState.player.x + PLAYER_RADIUS;
    const playerTop = gameState.player.y - PLAYER_RADIUS;
    const playerBottom = gameState.player.y + PLAYER_RADIUS;
    
    // 衝突判定
    if (playerRight > wallLeft && playerLeft < wallRight &&
        playerBottom > wallTop && playerTop < wallBottom) {
      
      // 衝突した場合の処理
      // どの方向から衝突したかを判定
      const overlapLeft = playerRight - wallLeft;
      const overlapRight = wallRight - playerLeft;
      const overlapTop = playerBottom - wallTop;
      const overlapBottom = wallBottom - playerTop;
      
      // 最小の重なりを見つけて、その方向に押し戻す
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
      
      if (minOverlap === overlapLeft) {
        // 左から衝突
        gameState.player.x = wallLeft - PLAYER_RADIUS;
        gameState.player.velocityX = -Math.abs(gameState.player.velocityX) * 0.5;
      } else if (minOverlap === overlapRight) {
        // 右から衝突
        gameState.player.x = wallRight + PLAYER_RADIUS;
        gameState.player.velocityX = Math.abs(gameState.player.velocityX) * 0.5;
      } else if (minOverlap === overlapTop) {
        // 上から衝突
        gameState.player.y = wallTop - PLAYER_RADIUS;
        gameState.player.velocityY = -Math.abs(gameState.player.velocityY) * 0.5;
      } else {
        // 下から衝突
        gameState.player.y = wallBottom + PLAYER_RADIUS;
        gameState.player.velocityY = Math.abs(gameState.player.velocityY) * 0.5;
      }
      
      break; // 1フレームで1つの壁とのみ衝突処理
    }
  }
}

/**
 * ゴール到達処理
 * スコアを増やし、スタートとゴールをランダムに再配置
 */
function handleGoalReached() {
  // 待機状態にして動きを停止
  gameState.isWaiting = true;
  
  // スコア加算
  gameState.score++;
  updateScoreDisplay();
  
  // 「Goal!!」メッセージを0.75秒表示
  showMessage('Goal!! 🎉');
  
  // スタートとゴールをランダムに再配置
  randomizePositions();
  
  // プレイヤーを新しいスタート位置に配置
  resetPlayerPosition();
  
  // 0.75秒後に「Ready?」→「Start!」のシーケンスを実行
  setTimeout(() => {
    showMessage('Ready?');
    
    // さらに0.75秒後にゲーム再開
    setTimeout(() => {
      gameState.isWaiting = false;
      showMessage('Start!');
      setTimeout(clearMessage, 2000);
    }, 750);
  }, 750);
}

/**
 * 壁の生成
 * ランダムな位置と向きで壁を生成
 * スタート位置とゴール位置を避けるように配置
 */
function generateWalls() {
  gameState.walls = [];
  
  for (let i = 0; i < WALL_COUNT; i++) {
    let validWall = false;
    let attempts = 0;
    
    while (!validWall && attempts < MAX_POSITION_ATTEMPTS) {
      // ランダムな壁の向き（水平または垂直）
      const isHorizontal = Math.random() > 0.5;
      // ランダムな長さ
      const length = MIN_WALL_LENGTH + Math.random() * (MAX_WALL_LENGTH - MIN_WALL_LENGTH);
      
      // ランダムな位置
      const margin = 30;
      const x = margin + Math.random() * (CANVAS_WIDTH - 2 * margin);
      const y = margin + Math.random() * (CANVAS_HEIGHT - 2 * margin);
      
      const wall = {
        x: x,
        y: y,
        width: isHorizontal ? length : WALL_WIDTH,
        height: isHorizontal ? WALL_WIDTH : length,
        isHorizontal: isHorizontal
      };
      
      // スタート位置やゴールと重ならないかチェック
      const startDist = Math.sqrt(
        Math.pow(gameState.player.startX - x, 2) + 
        Math.pow(gameState.player.startY - y, 2)
      );
      const goalDist = Math.sqrt(
        Math.pow(gameState.goal.x - x, 2) + 
        Math.pow(gameState.goal.y - y, 2)
      );
      
      // 十分に離れていればOK
      if (startDist > 50 && goalDist > 50) {
        gameState.walls.push(wall);
        validWall = true;
      }
      
      attempts++;
    }
  }
}

/**
 * ランダム位置生成
 * スタートとゴールの位置をランダムに設定
 * お互いが十分離れた位置になるように配慮
 */
function randomizePositions() {
  // マージンを考慮した範囲でランダムに配置
  const margin = 40;
  let attempts = 0;
  let validPosition = false;
  
  while (!validPosition && attempts < MAX_POSITION_ATTEMPTS) {
    // ランダムな位置を生成
    const newStartX = margin + Math.random() * (CANVAS_WIDTH - 2 * margin);
    const newStartY = margin + Math.random() * (CANVAS_HEIGHT - 2 * margin);
    const newGoalX = margin + Math.random() * (CANVAS_WIDTH - 2 * margin);
    const newGoalY = margin + Math.random() * (CANVAS_HEIGHT - 2 * margin);
    
    // スタートとゴールの距離を計算
    const dx = newGoalX - newStartX;
    const dy = newGoalY - newStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 最小距離以上離れていればOK
    if (distance > MIN_START_GOAL_DISTANCE) {
      gameState.player.startX = newStartX;
      gameState.player.startY = newStartY;
      gameState.goal.x = newGoalX;
      gameState.goal.y = newGoalY;
      validPosition = true;
    }
    
    attempts++;
  }
  
  // 壁を生成
  generateWalls();
}

/**
 * スコア表示更新
 * スコア表示エリアのテキストを更新
 */
function updateScoreDisplay() {
  document.getElementById('scoreDisplay').textContent = 
    `スコア: ${gameState.score}`;
}

/**
 * メッセージ表示
 * 一時的なメッセージを表示
 * @param {string} text - 表示するメッセージ
 * @param {number} duration - 表示時間（ミリ秒）、指定しない場合は自動クリアしない
 */
function showMessage(text, duration) {
  const messageElement = document.getElementById('message');
  messageElement.textContent = text;
  
  // durationが指定されている場合のみ自動クリア
  if (duration) {
    setTimeout(() => {
      messageElement.textContent = '';
    }, duration);
  }
}

/**
 * メッセージクリア
 * メッセージ表示エリアをクリア
 */
function clearMessage() {
  document.getElementById('message').textContent = '';
}

/**
 * ゲーム開始シーケンス
 * Ready? → Start! のメッセージを表示してゲームを開始
 */
function startGameSequence() {
  showMessage('Ready?');
  
  setTimeout(() => {
    gameState.isWaiting = false;
    showMessage('Start!');
    setTimeout(clearMessage, 2000);
  }, 1500);
}

/**
 * 描画処理
 * キャンバスにゲーム画面を描画
 */
function draw() {
  // 背景のクリア
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // 背景色
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // スタート位置のマーク（薄い円）
  ctx.beginPath();
  ctx.arc(gameState.player.startX, gameState.player.startY, PLAYER_RADIUS + 5, 0, Math.PI * 2);
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // 壁の描画
  drawWalls();
  
  // ゴールの描画
  drawGoal();
  
  // プレイヤーの描画
  drawPlayer();
  
  // デバッグ情報（DEBUG_MODEが有効な場合のみ表示）
  if (DEBUG_MODE) {
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.fillText(`Beta: ${gameState.tilt.beta.toFixed(1)}°`, 10, 20);
    ctx.fillText(`Gamma: ${gameState.tilt.gamma.toFixed(1)}°`, 10, 35);
    ctx.fillText(`X: ${gameState.player.x.toFixed(1)}`, 10, 50);
    ctx.fillText(`Y: ${gameState.player.y.toFixed(1)}`, 10, 65);
  }
}

/**
 * 壁描画
 * ゲーム内の障害物（壁）を描画
 */
function drawWalls() {
  ctx.fillStyle = '#333333';
  
  for (const wall of gameState.walls) {
    ctx.fillRect(
      wall.x - wall.width / 2,
      wall.y - wall.height / 2,
      wall.width,
      wall.height
    );
    
    // 壁に影をつける
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      wall.x - wall.width / 2,
      wall.y - wall.height / 2,
      wall.width,
      wall.height
    );
  }
}

/**
 * ゴール描画
 * ゴール地点を描画（緑色の円とテキスト）
 */
function drawGoal() {
  // ゴールの円（外側）
  ctx.beginPath();
  ctx.arc(gameState.goal.x, gameState.goal.y, GOAL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#4CAF50';
  ctx.fill();
  
  // ゴールの円（内側）
  ctx.beginPath();
  ctx.arc(gameState.goal.x, gameState.goal.y, GOAL_RADIUS - 5, 0, Math.PI * 2);
  ctx.fillStyle = '#66BB6A';
  ctx.fill();
  
  // ゴールのテキスト
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GOAL', gameState.goal.x, gameState.goal.y);
}

/**
 * プレイヤー描画
 * プレイヤーのボールを描画（青色のグラデーション円）
 */
function drawPlayer() {
  // グラデーション作成
  const gradient = ctx.createRadialGradient(
    gameState.player.x - 5, 
    gameState.player.y - 5, 
    0,
    gameState.player.x, 
    gameState.player.y, 
    PLAYER_RADIUS
  );
  gradient.addColorStop(0, '#64B5F6');
  gradient.addColorStop(1, '#1976D2');
  
  // プレイヤーの円
  ctx.beginPath();
  ctx.arc(gameState.player.x, gameState.player.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // プレイヤーの縁取り
  ctx.strokeStyle = '#0D47A1';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * ページ読み込み時の処理
 * DOMContentLoadedイベントで初期化を実行
 */
document.addEventListener('DOMContentLoaded', init);

/**
 * ゲームリセット処理
 * スコアを保持したまま、位置と壁を再生成
 */
function resetGame() {
  // 位置をランダム化
  randomizePositions();
  
  // プレイヤーをスタート位置に配置
  resetPlayerPosition();
  
  // メッセージ表示
  showMessage('ゲームを更新しました！', 3000);
}

/**
 * 権限要求ボタンのイベントリスナー
 */
document.getElementById('requestPermission')?.addEventListener('click', requestPermission);

/**
 * 更新ボタンのイベントリスナー
 */
document.getElementById('resetButton')?.addEventListener('click', resetGame);
