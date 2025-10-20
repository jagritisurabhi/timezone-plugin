// Gmail Timezone Helper Content Script
class GmailTimezoneHelper {
  constructor() {
    this.timezoneColumnAdded = false;
    this.selectedTimezone = 'America/New_York'; // Default timezone
    this.init();
  }

  async init() {
    // Load saved timezone preference
    const result = await chrome.storage.sync.get(['selectedTimezone']);
    if (result.selectedTimezone) {
      this.selectedTimezone = result.selectedTimezone;
    }

    // Wait for Gmail to load
    this.waitForGmail();
  }

  waitForGmail() {
    console.log('[Timezone Helper] Starting to wait for calendar...');
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      if (attempts > 30) {
        console.log('[Timezone Helper] Stopped checking after 30 attempts');
        clearInterval(checkInterval);
        return;
      }
      
      if (!this.timezoneColumnAdded) {
        const found = this.addTimezoneColumn();
        if (found) {
          console.log('[Timezone Helper] Calendar found and column added');
          clearInterval(checkInterval);
        }
      } else {
        clearInterval(checkInterval);
      }
    }, 1000);
  }

  addTimezoneColumn() {
    // Check if timezone column already exists
    if (document.getElementById('timezone-helper-column')) {
      console.log('[Timezone Helper] Column already exists');
      this.timezoneColumnAdded = true;
      return true;
    }

    // Try to find Google Calendar main container
    const calendarMain = document.querySelector('[role="main"]');
    if (!calendarMain) {
      console.log('[Timezone Helper] No main calendar container found');
      return false;
    }

    // Look for the calendar grid - Google Calendar uses various structures
    const calendarGrid = calendarMain.querySelector('[role="presentation"]') ||
                        calendarMain.querySelector('.fDfEYb') || // Week view container
                        calendarMain.querySelector('[data-view-heading]');
    
    if (calendarGrid) {
      console.log('[Timezone Helper] Found calendar grid, injecting column');
      this.injectTimezoneColumn(calendarMain);
      return true;
    }

    console.log('[Timezone Helper] Calendar grid not found yet');
    return false;
  }

  injectTimezoneColumn(container) {
    if (this.timezoneColumnAdded) return;
    
    // Check if timezone column already exists in DOM (from previous instance)
    if (document.getElementById('timezone-helper-column')) {
      this.timezoneColumnAdded = true;
      return;
    }

    console.log('[Timezone Helper] Injecting timezone column into calendar');
    
    // Find the calendar grid structure
    this.injectIntoCalendarGrid();
    
    this.timezoneColumnAdded = true;
  }
  
  injectIntoCalendarGrid() {
    // Strategy: Add a sidebar that mimics Google Calendar's style
    const calendarContainer = document.querySelector('[role="main"]');
    if (!calendarContainer) {
      console.log('[Timezone Helper] Calendar container not found');
      return;
    }

    // Create the timezone column as a sidebar
    const timezoneSidebar = document.createElement('div');
    timezoneSidebar.id = 'timezone-helper-column';
    timezoneSidebar.className = 'timezone-helper-sidebar';
    timezoneSidebar.innerHTML = `
      <div class="timezone-sidebar-header">
        <div class="timezone-sidebar-title">${this.getTimezoneDisplayName(this.selectedTimezone)}</div>
        <button class="timezone-settings-btn" title="Change Timezone">Settings</button>
      </div>
      <div class="timezone-sidebar-content" id="timezone-sidebar-content">
        <div class="timezone-status">Loading times...</div>
      </div>
    `;

    // Add click handler for settings
    timezoneSidebar.querySelector('.timezone-settings-btn').addEventListener('click', () => {
      this.showTimezoneSelector();
    });

    // Insert the sidebar into the page
    try {
      calendarContainer.appendChild(timezoneSidebar);
      console.log('[Timezone Helper] Sidebar injected successfully');
      
      // Start observing for calendar events
      this.observeCalendarEvents();
    } catch (error) {
      console.error('[Timezone Helper] Error injecting sidebar:', error);
    }
  }

  observeCalendarEvents() {
    // Start checking for calendar events
    this.updateTimezoneDisplay();
    
    // Update every 2 seconds to catch new events
    setInterval(() => {
      this.updateTimezoneDisplay();
    }, 2000);
    
    // Also observe DOM changes
    const observer = new MutationObserver(() => {
      this.updateTimezoneDisplay();
    });
    
    const calendarMain = document.querySelector('[role="main"]');
    if (calendarMain) {
      observer.observe(calendarMain, { childList: true, subtree: true });
    }
  }

  updateTimezoneDisplay() {
    const sidebarContent = document.getElementById('timezone-sidebar-content');
    if (!sidebarContent) return;

    // Find all calendar events - Google Calendar uses specific selectors
    const events = document.querySelectorAll('[data-eventid], [data-draggable-id], .Yfv1yd, [role="button"][data-draggable-id]');
    
    if (events.length === 0) {
      sidebarContent.innerHTML = '<div class="timezone-status">No events visible. Navigate to week or day view.</div>';
      return;
    }
    
    // Extract unique times from visible events
    const timeMap = new Map();
    
    events.forEach(event => {
      // Try to find time information in the event
      const timeText = event.getAttribute('aria-label') || event.textContent;
      if (!timeText) return;
      
      // Extract times from the text (e.g., "Meeting, 2:00 PM")
      const timeMatches = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi);
      if (timeMatches) {
        timeMatches.forEach(match => {
          if (!timeMap.has(match)) {
            const converted = this.convertTime(match);
            timeMap.set(match, converted);
          }
        });
      }
    });
    
    if (timeMap.size === 0) {
      sidebarContent.innerHTML = '<div class="timezone-status">No times detected</div>';
      return;
    }
    
    // Display the conversions in a table format
    let html = '<table class="timezone-table"><tbody>';
    timeMap.forEach((converted, original) => {
      html += `
        <tr class="timezone-row">
          <td class="time-local">${original}</td>
          <td class="time-converted">${converted}</td>
        </tr>
      `;
    });
    html += '</tbody></table>';
    
    sidebarContent.innerHTML = html;
  }

  convertTime(timeString) {
    try {
      // Parse the time string (assuming format like "9:00 AM" or "14:30")
      const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!timeMatch) return timeString;

      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const ampm = timeMatch[3];

      // Convert to 24-hour format
      let hour24 = hours;
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours !== 12) {
          hour24 += 12;
        } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
          hour24 = 0;
        }
      }

      // Create a date object for today with the specified time
      const now = new Date();
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour24, minutes);

      // Convert to target timezone
      const convertedDate = new Date(date.toLocaleString("en-US", {timeZone: this.selectedTimezone}));
      
      // Format the converted time
      const convertedTime = convertedDate.toLocaleTimeString("en-US", {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      return convertedTime;
    } catch (error) {
      console.error('Error converting time:', error);
      return timeString;
    }
  }

  getTimezoneDisplayName(timezone) {
    const timezoneNames = {
      'America/New_York': 'EST/EDT',
      'America/Chicago': 'CST/CDT',
      'America/Denver': 'MST/MDT',
      'America/Los_Angeles': 'PST/PDT',
      'Europe/London': 'GMT/BST',
      'Europe/Paris': 'CET/CEST',
      'Asia/Tokyo': 'JST',
      'Asia/Shanghai': 'CST',
      'Asia/Kolkata': 'IST',
      'Australia/Sydney': 'AEST/AEDT'
    };
    return timezoneNames[timezone] || timezone.split('/')[1];
  }

  showTimezoneSelector() {
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

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'timezone-modal-overlay';
    modal.innerHTML = `
      <div class="timezone-modal">
        <div class="timezone-modal-header">
          <h3>Select Timezone</h3>
          <button class="timezone-modal-close">&times;</button>
        </div>
        <div class="timezone-modal-content">
          ${timezones.map(tz => `
            <label class="timezone-option">
              <input type="radio" name="timezone" value="${tz.value}" ${tz.value === this.selectedTimezone ? 'checked' : ''}>
              <span>${tz.label}</span>
            </label>
          `).join('')}
        </div>
        <div class="timezone-modal-footer">
          <button class="timezone-save-btn">Save</button>
          <button class="timezone-cancel-btn">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('.timezone-modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('.timezone-cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('.timezone-save-btn').addEventListener('click', () => {
      const selectedRadio = modal.querySelector('input[name="timezone"]:checked');
      if (selectedRadio) {
        this.selectedTimezone = selectedRadio.value;
        chrome.storage.sync.set({ selectedTimezone: this.selectedTimezone });
        
        // Update the display
        const headerLabel = document.querySelector('.timezone-label');
        if (headerLabel) {
          headerLabel.textContent = this.getTimezoneDisplayName(this.selectedTimezone);
        }
        
        this.updateTimezoneDisplay();
      }
      document.body.removeChild(modal);
    });

    // Close modal when clicking overlay
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
}

// Global instance to prevent multiple initializations
let helperInstance = null;

// Initialize the extension when the page loads
function initExtension() {
  if (!helperInstance) {
    helperInstance = new GmailTimezoneHelper();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExtension);
} else {
  initExtension();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Timezone Helper] Received message:', request);
  
  if (request.action === 'refreshTimezoneColumn') {
    if (helperInstance) {
      helperInstance.updateTimezoneDisplay();
      sendResponse({ success: true });
    }
  } else if (request.action === 'updateTimezone') {
    if (helperInstance) {
      helperInstance.selectedTimezone = request.timezone;
      // Update the sidebar header
      const label = document.querySelector('.timezone-sidebar-title');
      if (label) {
        label.textContent = helperInstance.getTimezoneDisplayName(request.timezone);
      }
      helperInstance.updateTimezoneDisplay();
      sendResponse({ success: true });
    }
  }
  
  return true; // Keep message channel open for async response
});

// Re-initialize when Gmail navigates (SPA behavior)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(() => {
      // Only create new instance if calendar might be visible
      if (helperInstance) {
        helperInstance.timezoneColumnAdded = false;
        helperInstance.waitForGmail();
      }
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });
