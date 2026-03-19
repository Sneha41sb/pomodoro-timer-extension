const DURATIONS = {
  focus: 25 * 60 * 1000,
  shortBreak: 5 * 60 * 1000,
  longBreak: 15 * 60 * 1000
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    timeLeft: DURATIONS.focus,
    isRunning: false,
    endTime: null,
    mode: 'focus'
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'pomodoroAlarm') {
    chrome.storage.local.get(['mode'], (data) => {
      chrome.storage.local.set({ isRunning: false, timeLeft: 0, endTime: null });
      
      let message = 'Session complete!';
      if (data.mode === 'focus') {
        message = 'Focus session complete! Take a break.';
      } else if (data.mode === 'shortBreak' || data.mode === 'longBreak') {
        message = 'Break over! Ready to focus?';
      }

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 
        title: 'Focus Timer',
        message: message
      });
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.cmd === 'start') {
    chrome.storage.local.get(['timeLeft'], (data) => {
      const newEndTime = Date.now() + data.timeLeft;
      chrome.storage.local.set({ isRunning: true, endTime: newEndTime });
      chrome.alarms.create('pomodoroAlarm', { when: newEndTime });
    });
  } else if (request.cmd === 'pause') {
    chrome.storage.local.get(['endTime'], (data) => {
      const remaining = Math.max(0, data.endTime - Date.now());
      chrome.storage.local.set({ isRunning: false, timeLeft: remaining, endTime: null });
      chrome.alarms.clear('pomodoroAlarm');
    });
  } else if (request.cmd === 'reset') {
    chrome.storage.local.get(['mode'], (data) => {
      chrome.storage.local.set({ isRunning: false, timeLeft: DURATIONS[data.mode], endTime: null });
      chrome.alarms.clear('pomodoroAlarm');
    });
  } else if (request.cmd === 'setMode') {
    const duration = DURATIONS[request.mode];
    chrome.storage.local.set({ 
      mode: request.mode, 
      timeLeft: duration, 
      isRunning: false, 
      endTime: null 
    });
    chrome.alarms.clear('pomodoroAlarm');
  }
  sendResponse({ status: 'ok' });
});