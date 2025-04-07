Path: main.ts
```
import { v4 as uuidv4 } from 'uuid';

// Symbol mapping
const SYMBOL_MAP: Record<number, string> = {
  1: '🔴',
  2: '🟢',
  3: '🔵',
  4: '🟣',
  5: '🟡',
  6: '🟠',
  7: '💎',
  8: '⭐',
  9: '🌙'
};

// Types for API responses
interface Round {
  roundId: string;
  bet: number;
  balance: number;
  totalWin: number;
  frame: number[][];
  paylines: Array<{
    lineId: number;
    line: number[];
    winType: number;
    value: number;
  }>;
  stickyWildFeatures: any[];
  totalFreespins: number;
  newFreespins: number;
  currentGameMode?: number;
  nextGameMode: number;
  freeRoundCampaign: null;
  endedUtc?: string;
}

interface SessionResult {
  securityHash: string;
  id: string;
  gameId: string;
  currency: string;
  round: Round;
  gameSettings: {
    allowedBets: number[];
    autoSpinSettings: {
      availableAutoSpinCounts: number[];
    };
  };
  freeRoundCampaign: null;
  startGameMode: number;
  isDemo: boolean;
}

interface SignalRResponse {
  type: number;
  invocationId: string;
  result: Round | SessionResult;
}

// SignalR protocol
enum SignalRMessageType {
  Invocation = 1,
  StreamItem = 2,
  Completion = 3,
  StreamInvocation = 4,
  CancelInvocation = 5,
  Ping = 6,
  Close = 7,
}

// DOM Elements
const connectBtn = document.getElementById('connect-btn') as HTMLButtonElement;
const sessionBtn = document.getElementById('session-btn') as HTMLButtonElement;
const spinBtn = document.getElementById('spin-btn') as HTMLButtonElement;
const betSelect = document.getElementById('bet-select') as HTMLSelectElement;
const sessionIdEl = document.getElementById('session-id') as HTMLElement;
const balanceEl = document.getElementById('balance') as HTMLElement;
const winEl = document.getElementById('win') as HTMLElement;
const reelsContainer = document.getElementById('reels-container') as HTMLElement;
const logMessages = document.getElementById('log-messages') as HTMLElement;
const connectionStatus = document.getElementById('connection-status') as HTMLElement;

// State
let ws: WebSocket | null = null;
let sessionId: string = uuidv4();
let invocationId = 0;
let currentRound: Round | null = null;

// Connect to WebSocket server
connectBtn.addEventListener('click', () => {
  // Close existing connection if any
  if (ws) {
    ws.close();
    ws = null;
  }

  connectionStatus.textContent = 'Connecting...';
  connectionStatus.className = 'connecting';
  log('Connecting to server...');

  // Create new WebSocket connection
  const wsUrl = `ws://localhost:3000/burst/slot?sessionId=${sessionId}`;
  ws = new WebSocket(wsUrl);

  // Setup event listeners
  ws.onopen = handleOpen;
  ws.onmessage = handleMessage;
  ws.onclose = handleClose;
  ws.onerror = handleError;
});

// Request session when session button is clicked
sessionBtn.addEventListener('click', () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    log('WebSocket not connected', 'error');
    return;
  }

  log('Requesting session...');
  const message = {
    type: SignalRMessageType.Invocation,
    invocationId: (invocationId++).toString(),
    target: 'session',
    arguments: []
  };

  ws.send(JSON.stringify(message) + '\u001E');
});

// Send spin request when spin button is clicked
spinBtn.addEventListener('click', () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    log('WebSocket not connected', 'error');
    return;
  }

  const bet = parseFloat(betSelect.value);
  log(`Sending spin request with bet: ${bet}`);
  
  const message = {
    type: SignalRMessageType.Invocation,
    invocationId: (invocationId++).toString(),
    target: 'spin',
    arguments: [{ bet }]
  };

  ws.send(JSON.stringify(message) + '\u001E');
  
  // Disable spin button until response is received
  spinBtn.disabled = true;
});

// WebSocket event handlers
function handleOpen() {
  log('Connected to server', 'success');
  connectionStatus.textContent = 'Connected';
  connectionStatus.className = 'connected';
  
  sessionBtn.disabled = false;
  
  // Send handshake
  const handshake = {
    protocol: 'json',
    version: 1
  };
  
  ws?.send(JSON.stringify(handshake) + '\u001E');
  log('Sent handshake message');
}

function handleMessage(event: MessageEvent) {
  // Parse message (remove trailing separator)
  let message = event.data as string;
  if (message.endsWith('\u001E')) {
    message = message.slice(0, -1);
  }
  
  if (message === '{}') {
    log('Handshake successful', 'success');
    return;
  }
  
  try {
    const response = JSON.parse(message) as SignalRResponse;
    
    if (response.type === SignalRMessageType.Completion) {
      log(`Received response for invocation ${response.invocationId}`);
      
      // Check if it's a session response
      if ('gameId' in response.result) {
        handleSessionResponse(response.result as SessionResult);
      } 
      // Check if it's a spin response
      else if ('roundId' in response.result) {
        handleSpinResponse(response.result as Round);
      }
    }
  } catch (error) {
    log(`Error parsing message: ${error}`, 'error');
    console.error('Error parsing message:', error);
    console.log('Raw message:', message);
  }
}

function handleClose(event: CloseEvent) {
  log(`Connection closed: ${event.reason || 'No reason provided'}`, 'error');
  connectionStatus.textContent = 'Disconnected';
  connectionStatus.className = 'disconnected';
  
  // Disable buttons
  sessionBtn.disabled = true;
  spinBtn.disabled = true;
  betSelect.disabled = true;
  
  ws = null;
}

function handleError(event: Event) {
  log('WebSocket error', 'error');
  console.error('WebSocket error:', event);
}

// Response handlers
function handleSessionResponse(session: SessionResult) {
  log('Session established successfully', 'success');
  
  // Update UI
  sessionIdEl.textContent = session.id;
  balanceEl.textContent = formatCurrency(session.round.balance, session.currency);
  winEl.textContent = formatCurrency(0, session.currency);
  
  // Enable spin button and bet select
  spinBtn.disabled = false;
  betSelect.disabled = false;
  
  // Populate bet select with allowed bets
  betSelect.innerHTML = '';
  session.gameSettings.allowedBets.forEach(bet => {
    const option = document.createElement('option');
    option.value = bet.toString();
    option.textContent = formatCurrency(bet, session.currency, false);
    betSelect.appendChild(option);
  });
  
  // Set initial bet value
  betSelect.value = '1';
  
  // Update reels
  updateReels(session.round.frame);
  
  // Store current round
  currentRound = session.round;
}

function handleSpinResponse(round: Round) {
  log(`Spin completed. Win: ${round.totalWin}`, round.totalWin > 0 ? 'success' : '');
  
  // Update UI
  balanceEl.textContent = formatCurrency(round.balance, 'eur');
  winEl.textContent = formatCurrency(round.totalWin, 'eur');
  
  // Update reels with animation
  updateReels(round.frame, round.paylines);
  
  // Re-enable spin button
  spinBtn.disabled = false;
  
  // Store current round
  currentRound = round;
}

// Helper functions
function updateReels(frame: number[][], paylines: any[] = []) {
  reelsContainer.innerHTML = '';
  
  // Create winning positions map
  const winningPositions = new Set<string>();
  if (paylines && paylines.length > 0) {
    paylines.forEach(payline => {
      if (payline.line) {
        payline.line.forEach((rowIndex: number, reelIndex: number) => {
          if (rowIndex !== null) {
            winningPositions.add(`${reelIndex}-${rowIndex}`);
          }
        });
      }
    });
  }
  
  // Create reels
  for (let reelIndex = 0; reelIndex < frame.length; reelIndex++) {
    const reel = document.createElement('div');
    reel.className = 'reel';
    
    const reelSymbols = frame[reelIndex];
    for (let rowIndex = 0; rowIndex < reelSymbols.length; rowIndex++) {
      const symbolValue = reelSymbols[rowIndex];
      const symbol = document.createElement('div');
      symbol.className = 'symbol';
      
      if (winningPositions.has(`${reelIndex}-${rowIndex}`)) {
        symbol.classList.add('win');
      }
      
      symbol.textContent = SYMBOL_MAP[symbolValue] || symbolValue.toString();
      symbol.dataset.symbol = symbolValue.toString();
      reel.appendChild(symbol);
    }
    
    reelsContainer.appendChild(reel);
  }
}

function formatCurrency(amount: number, currency: string, includeSymbol = true) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2
  });
  
  return formatter.format(amount);
}

function log(message: string, type = '') {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${type ? `log-${type}` : ''}`;
  
  const logTimestamp = document.createElement('span');
  logTimestamp.className = 'log-timestamp';
  logTimestamp.textContent = timestamp;
  
  logEntry.appendChild(logTimestamp);
  logEntry.appendChild(document.createTextNode(message));
  
  logMessages.appendChild(logEntry);
  logMessages.scrollTop = logMessages.scrollHeight;
}

// Initialize
log('Burst Client initialized');
```

---

Path: style.css
```
:root {
    --primary-color: #2c3e50;
    --secondary-color: #3498db;
    --accent-color: #f1c40f;
    --error-color: #e74c3c;
    --success-color: #2ecc71;
    --background-color: #ecf0f1;
    --light-color: #f8f9fa;
    --dark-color: #343a40;
    --text-color: #333;
    --border-radius: 4px;
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background-color: var(--background-color);
  }
  
  #app {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: var(--primary-color);
    color: white;
    margin-bottom: 1rem;
  }
  
  .container {
    padding: 1rem;
  }
  
  .controls {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--border-radius);
    background-color: var(--light-color);
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.2s, transform 0.1s;
  }
  
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  button:hover:not(:disabled) {
    background-color: #e9ecef;
  }
  
  button:active:not(:disabled) {
    transform: translateY(1px);
  }
  
  button.primary {
    background-color: var(--secondary-color);
    color: white;
  }
  
  button.primary:hover:not(:disabled) {
    background-color: #2980b9;
  }
  
  select {
    padding: 0.5rem;
    border-radius: var(--border-radius);
    border: 1px solid #ddd;
  }
  
  select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .game-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding: 1rem;
    background-color: var(--light-color);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .label {
    font-size: 0.8rem;
    color: #6c757d;
  }
  
  .value {
    font-weight: bold;
    font-size: 1.2rem;
  }
  
  .game-board {
    margin-bottom: 1rem;
    padding: 1rem;
    background-color: var(--light-color);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    min-height: 300px;
  }
  
  #reels-container {
    display: flex;
    justify-content: space-around;
    gap: 0.5rem;
  }
  
  .reel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .symbol {
    width: 70px;
    height: 70px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2rem;
    background-color: white;
    border-radius: var(--border-radius);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: 2px solid #ddd;
    transition: all 0.3s ease;
  }
  
  .symbol.win {
    border-color: var(--accent-color);
    box-shadow: 0 0 10px var(--accent-color);
    animation: pulse 1s infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  .log-container {
    margin-top: 2rem;
    padding: 1rem;
    background-color: var(--light-color);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    height: 200px;
    overflow-y: auto;
  }
  
  #log-messages {
    font-family: monospace;
    font-size: 0.9rem;
    white-space: pre-wrap;
    line-height: 1.4;
  }
  
  .log-entry {
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #eee;
  }
  
  .log-timestamp {
    color: #6c757d;
    font-size: 0.8rem;
    margin-right: 0.5rem;
  }
  
  .log-error {
    color: var(--error-color);
  }
  
  .log-success {
    color: var(--success-color);
  }
  
  #connection-status {
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius);
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  #connection-status.disconnected {
    background-color: var(--error-color);
    color: white;
  }
  
  #connection-status.connected {
    background-color: var(--success-color);
    color: white;
  }
  
  #connection-status.connecting {
    background-color: var(--accent-color);
    color: var(--dark-color);
  }
```

---

