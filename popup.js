const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const modeBtns = document.querySelectorAll('.mode-btn');

let updateInterval;

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateUI() {
  chrome.storage.local.get(['isRunning', 'timeLeft', 'endTime', 'mode'], (data) => {
    let currentMs = data.timeLeft;
    
    if (data.isRunning && data.endTime) {
      currentMs = data.endTime - Date.now();
      if (currentMs <= 0) {
        currentMs = 0;
        clearInterval(updateInterval);
      }
    }
    
    timerDisplay.textContent = formatTime(currentMs);
    
    // Update active mode button
    modeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === data.mode);
    });

    // Update body class for styling
    document.body.className = data.mode;
    
    startBtn.disabled = data.isRunning;
    pauseBtn.disabled = !data.isRunning;
  });
}

function startUpdating() {
  clearInterval(updateInterval);
  updateUI();
  updateInterval = setInterval(updateUI, 1000);
}

startBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ cmd: 'start' }, () => {
    startUpdating();
  });
});

pauseBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ cmd: 'pause' }, () => {
    clearInterval(updateInterval);
    updateUI();
  });
});

resetBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ cmd: 'reset' }, () => {
    clearInterval(updateInterval);
    updateUI();
  });
});

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    chrome.runtime.sendMessage({ cmd: 'setMode', mode }, () => {
      clearInterval(updateInterval);
      updateUI();
    });
  });
});

// Initial load
startUpdating();