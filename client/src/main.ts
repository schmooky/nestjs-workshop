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
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds

// Connect to WebSocket server
connectBtn.addEventListener('click', () => {
  connectToServer();
});

function connectToServer() {
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
  
  // Reset buttons
  sessionBtn.disabled = true;
  spinBtn.disabled = true;
  betSelect.disabled = true;
}

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

  sendSignalRMessage(message);
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

  sendSignalRMessage(message);
  
  // Disable spin button until response is received
  spinBtn.disabled = true;
});

// Function to send SignalR messages with proper formatting
function sendSignalRMessage(message: any) {
  try {
    const serializedMessage = JSON.stringify(message) + '\u001E';
    ws?.send(serializedMessage);
    log(`Sent message: ${JSON.stringify(message)}`);
  } catch (error) {
    log(`Error sending message: ${error}`, 'error');
  }
}

// WebSocket event handlers
function handleOpen() {
  log('Connected to server', 'success');
  connectionStatus.textContent = 'Connected';
  connectionStatus.className = 'connected';
  
  // Reset reconnect attempts on successful connection
  reconnectAttempts = 0;
  
  // Enable session button
  sessionBtn.disabled = false;
  
  // Send handshake
  const handshake = {
    protocol: 'json',
    version: 1
  };
  
  sendSignalRMessage(handshake);
  log('Sent handshake message');
}

function handleMessage(event: MessageEvent) {
  try {
    // Parse message (remove trailing separator)
    let message = event.data as string;
    if (message.endsWith('\u001E')) {
      message = message.slice(0, -1);
    }
    
    log(`Received message: ${message}`);
    
    if (message === '{}') {
      log('Handshake successful', 'success');
      return;
    }
    
    const response = JSON.parse(message) as SignalRResponse;
    
    if (response.type === SignalRMessageType.Completion) {
      log(`Received response for invocation ${response.invocationId}`);
      
      // Check if it's a session response
      if (response.result && 'gameId' in response.result) {
        handleSessionResponse(response.result as SessionResult);
      } 
      // Check if it's a spin response
      else if (response.result && 'roundId' in response.result) {
        handleSpinResponse(response.result as Round);
      }
    } else if (response.type === SignalRMessageType.Close) {
      log(`Server requested close: ${JSON.stringify(response)}`, 'error');
      //@ts-ignore
    } else if (response.error) {
      //@ts-ignore
      log(`Server error: ${response.error}`, 'error');
    }
  } catch (error) {
    log(`Error parsing message: ${error}`, 'error');
    console.error('Error parsing message:', error);
    console.log('Raw message:', event.data);
  }
}

function handleClose(event: CloseEvent) {
  log(`Connection closed (code ${event.code}): ${event.reason || 'No reason provided'}`, 'error');
  connectionStatus.textContent = 'Disconnected';
  connectionStatus.className = 'disconnected';
  
  // Disable buttons
  sessionBtn.disabled = true;
  spinBtn.disabled = true;
  betSelect.disabled = true;
  
  // Attempt to reconnect if not a normal closure
  if (event.code !== 1000 && event.code !== 1001) {
    attemptReconnect();
  } else {
    ws = null;
  }
}

function handleError(event: Event) {
  log('WebSocket error occurred. Check console for details.', 'error');
  console.error('WebSocket error:', event);
}

function attemptReconnect() {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    log(`Connection lost. Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`, 'warn');
    
    setTimeout(() => {
      connectToServer();
    }, RECONNECT_DELAY);
  } else {
    log('Maximum reconnection attempts reached. Please try connecting manually.', 'error');
    ws = null;
  }
}

// Response handlers
function handleSessionResponse(session: SessionResult) {
  log('Session established successfully', 'success');
  log(`Session ID: ${session.id}`);
  log(`Game ID: ${session.gameId}`);
  log(`Currency: ${session.currency}`);
  log(`Balance: ${session.round.balance}`);
  
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
  
  // Also log to console for debugging
  if (type === 'error') {
    console.error(`${timestamp}: ${message}`);
  } else if (type === 'warn') {
    console.warn(`${timestamp}: ${message}`);
  } else {
    console.log(`${timestamp}: ${message}`);
  }
}

// Initialize
log('Burst Client initialized');