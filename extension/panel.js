// panel.js – ChainGuardian popup logic (must be external for MV3 CSP compliance)

chrome.storage.local.get(['blockedCount', 'enabled'], (data) => {
    document.getElementById('blocked-count').textContent = data.blockedCount || 0;
    const toggle = document.getElementById('toggle');
    if (data.enabled === false) toggle.classList.add('off');
  });
  
  document.getElementById('toggle').addEventListener('click', function () {
    this.classList.toggle('off');
    const enabled = !this.classList.contains('off');
    chrome.storage.local.set({ enabled });
  });