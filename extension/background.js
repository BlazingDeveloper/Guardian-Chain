// background.js – MV3 Service Worker
// Handles extension lifecycle and cross-tab messaging

chrome.runtime.onInstalled.addListener(() => {
  console.log('[ChainGuardian] Installed successfully');
  chrome.storage.local.set({
    blockedCount: 0,
    savedAmount: '0',
    enabled: true
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'BLOCKED_TX') {
    chrome.storage.local.get(['blockedCount'], (data) => {
      chrome.storage.local.set({ blockedCount: (data.blockedCount || 0) + 1 });
    });
  }
  sendResponse({ ok: true });
  return true;
});
