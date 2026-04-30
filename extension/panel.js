document.addEventListener('DOMContentLoaded', () => {
  const powerSwitch = document.getElementById('power-switch');
  const appBody = document.getElementById('app-body');
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  const statusSub = document.getElementById('status-sub');
  const toggleHeading = document.getElementById('toggle-heading');

  // Load saved state (default to true)
  chrome.storage.local.get(['guardianActive'], (res) => {
    const isActive = res.guardianActive !== false; // true if undefined
    powerSwitch.checked = isActive;
    updateUI(isActive);
  });

  // Handle Toggle Click
  powerSwitch.addEventListener('change', (e) => {
    const isActive = e.target.checked;
    
    // Save to Chrome Storage so content.js knows to stop scanning
    chrome.storage.local.set({ guardianActive: isActive });
    
    updateUI(isActive);
  });

  function updateUI(isActive) {
    if (isActive) {
      appBody.classList.remove('is-disabled');
      statusIcon.innerHTML = '✓';
      statusText.innerText = 'Shield Active';
      statusSub.innerText = 'Protecting MetaMask & Rabby';
      toggleHeading.innerText = 'AI Engine Running';
    } else {
      appBody.classList.add('is-disabled');
      statusIcon.innerHTML = '✕';
      statusText.innerText = 'Shield Disabled';
      statusSub.innerText = 'You are vulnerable to drainers';
      toggleHeading.innerText = 'Engine Paused';
    }
  }
});