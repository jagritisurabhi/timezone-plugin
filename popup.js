// Popup script for Gmail Timezone Helper
document.addEventListener('DOMContentLoaded', async () => {
  const currentTimezoneEl = document.getElementById('currentTimezone');
  const changeTimezoneBtn = document.getElementById('changeTimezoneBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const statusEl = document.getElementById('status');

  // Load current timezone
  const result = await chrome.storage.sync.get(['selectedTimezone']);
  const selectedTimezone = result.selectedTimezone || 'America/New_York';
  
  currentTimezoneEl.textContent = getTimezoneDisplayName(selectedTimezone);

  // Check if we're on Gmail
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isGmail = tab.url.includes('mail.google.com') || tab.url.includes('calendar.google.com');
  
  if (isGmail) {
    statusEl.textContent = 'Active on Gmail';
    statusEl.className = 'status active';
  } else {
    statusEl.textContent = 'Please open Gmail to use this extension';
    statusEl.className = 'status inactive';
  }

  // Change timezone button
  changeTimezoneBtn.addEventListener('click', () => {
    showTimezoneSelector();
  });

  // Refresh button
  refreshBtn.addEventListener('click', async () => {
    if (isGmail) {
      await chrome.tabs.sendMessage(tab.id, { action: 'refreshTimezoneColumn' });
      statusEl.textContent = 'Calendar refreshed';
      setTimeout(() => {
        statusEl.textContent = 'Active on Gmail';
      }, 2000);
    }
  });

  function getTimezoneDisplayName(timezone) {
    const timezoneNames = {
      'America/New_York': 'Eastern Time (EST/EDT)',
      'America/Chicago': 'Central Time (CST/CDT)',
      'America/Denver': 'Mountain Time (MST/MDT)',
      'America/Los_Angeles': 'Pacific Time (PST/PDT)',
      'Europe/London': 'London (GMT/BST)',
      'Europe/Paris': 'Paris (CET/CEST)',
      'Asia/Tokyo': 'Tokyo (JST)',
      'Asia/Shanghai': 'Shanghai (CST)',
      'Asia/Kolkata': 'India (IST)',
      'Australia/Sydney': 'Sydney (AEST/AEDT)'
    };
    return timezoneNames[timezone] || timezone.split('/')[1];
  }

  function showTimezoneSelector() {
    const timezones = [
      { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
      { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
      { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
      { value: 'Europe/London', label: 'London (GMT/BST)' },
      { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
      { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
      { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
      { value: 'Asia/Kolkata', label: 'India (IST)' },
      { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' }
    ];

    // Create a simple select dialog
    const select = document.createElement('select');
    select.style.width = '100%';
    select.style.padding = '8px';
    select.style.marginBottom = '12px';
    select.style.borderRadius = '4px';
    select.style.border = '1px solid #dadce0';

    timezones.forEach(tz => {
      const option = document.createElement('option');
      option.value = tz.value;
      option.textContent = tz.label;
      if (tz.value === selectedTimezone) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    // Replace the change timezone button with the select
    changeTimezoneBtn.style.display = 'none';
    changeTimezoneBtn.parentNode.insertBefore(select, changeTimezoneBtn);

    // Add save/cancel buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'btn btn-primary';
    saveBtn.style.flex = '1';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.style.flex = '1';

    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(cancelBtn);
    select.parentNode.insertBefore(buttonContainer, select.nextSibling);

    // Event listeners
    saveBtn.addEventListener('click', async () => {
      const newTimezone = select.value;
      await chrome.storage.sync.set({ selectedTimezone: newTimezone });
      currentTimezoneEl.textContent = getTimezoneDisplayName(newTimezone);
      
      // Send message to content script to update timezone
      if (isGmail) {
        await chrome.tabs.sendMessage(tab.id, { 
          action: 'updateTimezone', 
          timezone: newTimezone 
        });
      }

      // Restore UI
      select.remove();
      buttonContainer.remove();
      changeTimezoneBtn.style.display = 'block';
      statusEl.textContent = 'Timezone updated';
    });

    cancelBtn.addEventListener('click', () => {
      // Restore UI
      select.remove();
      buttonContainer.remove();
      changeTimezoneBtn.style.display = 'block';
    });
  }
});
