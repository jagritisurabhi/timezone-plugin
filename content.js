// Gmail Timezone Helper Content Script
class GmailTimezoneHelper {
  constructor() {
    this.timezoneColumnAdded = false;
    this.selectedTimezone = 'America/New_York'; // Default timezone
    this.updateInterval = null;
    this.observer = null;
    this.init();
  }
  
  cleanup() {
    // Clean up intervals and observers
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    console.log('[Timezone Helper] Cleaned up resources');
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
      if (attempts > 20) {
        console.log('[Timezone Helper] Stopped checking after 20 attempts');
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
    }, 1500); // Check every 1.5 seconds instead of 1 second
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

    console.log('[Timezone Helper] Found main container, injecting column');
    
    // Just inject - don't wait for specific grid
    this.injectIntoCalendarGrid(calendarMain);
    return true;
  }

  injectIntoCalendarGrid(calendarMain) {
    console.log('[Timezone Helper] Injecting timezone column directly...');

    // Create a very visible test column first
    const timezoneColumn = document.createElement('div');
    timezoneColumn.id = 'timezone-helper-column';
    timezoneColumn.style.cssText = `
      position: fixed;
      left: 240px;
      top: 64px;
      bottom: 0;
      width: 120px;
      background: white;
      border-right: 2px solid #1a73e8;
      box-shadow: 2px 0 8px rgba(0,0,0,0.15);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      font-family: 'Google Sans', 'Roboto', Arial, sans-serif;
    `;
    
    timezoneColumn.innerHTML = `
      <div style="padding: 8px; border-bottom: 1px solid #dadce0; background: #f8f9fa; color: #3c4043; font-weight: 500; font-size: 11px; text-align: center;">
        <div id="timezone-title-display" style="margin-bottom: 4px;">${this.getTimezoneDisplayName(this.selectedTimezone)}</div>
        <button class="timezone-settings-btn" style="background: white; border: 1px solid #dadce0; cursor: pointer; font-size: 10px; padding: 3px 6px; border-radius: 3px; color: #5f6368; width: 100%;">Change</button>
      </div>
      <div id="timezone-column-body" style="padding: 8px; overflow-y: auto; flex: 1; font-size: 11px;">
        <div style="color: #5f6368; text-align: center; margin-top: 10px; font-size: 10px;">
          Loading...
        </div>
      </div>
    `;

    // Add click handler
    const settingsBtn = timezoneColumn.querySelector('.timezone-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showTimezoneSelector();
      });
    }

    // Inject directly into body
    document.body.appendChild(timezoneColumn);
    console.log('[Timezone Helper] ✓ Column injected successfully - should be visible on right side');
    console.log('[Timezone Helper] Element ID:', timezoneColumn.id);
    console.log('[Timezone Helper] Element in DOM:', document.getElementById('timezone-helper-column') !== null);
    
    this.observeCalendarEvents();
  }

  observeCalendarEvents() {
    // Start checking for calendar events
    this.updateTimezoneDisplay();
    
    // Update every 5 seconds to catch new events (less frequent to avoid performance issues)
    this.updateInterval = setInterval(() => {
      this.updateTimezoneDisplay();
    }, 5000);
    
    // Debounce the mutation observer to avoid excessive updates
    let debounceTimer = null;
    const debouncedUpdate = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        this.updateTimezoneDisplay();
      }, 500); // Wait 500ms after last change
    };
    
    // Observe DOM changes with debouncing
    const observer = new MutationObserver(debouncedUpdate);
    
    const calendarMain = document.querySelector('[role="main"]');
    if (calendarMain) {
      // Only observe childList, not subtree to reduce overhead
      observer.observe(calendarMain, { 
        childList: true, 
        subtree: false // Less aggressive observation
      });
    }
    
    this.observer = observer;
  }

  updateTimezoneDisplay() {
    const columnBody = document.getElementById('timezone-column-body');
    if (!columnBody) return;

    try {
      // Limit the query to reduce performance impact - only search in main area
      const calendarMain = document.querySelector('[role="main"]');
      if (!calendarMain) {
        columnBody.innerHTML = '<div class="timezone-status">Calendar not loaded</div>';
        return;
      }

      // Find calendar events with a more specific query (limit to first 100)
      const events = Array.from(calendarMain.querySelectorAll('[data-eventid], [data-draggable-id]')).slice(0, 100);
      
      if (events.length === 0) {
        columnBody.innerHTML = '<div class="timezone-status">No events visible</div>';
        return;
      }
      
      // Extract unique times from visible events
      const timeMap = new Map();
      
      // Limit processing to first 50 events to avoid performance issues
      events.slice(0, 50).forEach(event => {
        // Try to find time information in the event
        const timeText = event.getAttribute('aria-label');
        if (!timeText) return;
        
        // Extract times from the text (e.g., "Meeting, 2:00 PM")
        const timeMatches = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi);
        if (timeMatches) {
          timeMatches.forEach(match => {
            if (!timeMap.has(match) && timeMap.size < 20) { // Limit to 20 unique times
              const converted = this.convertTime(match);
              timeMap.set(match, converted);
            }
          });
        }
      });
      
      if (timeMap.size === 0) {
        columnBody.innerHTML = '<div class="timezone-status">No times detected</div>';
        return;
      }
      
      // Display the conversions
      let html = '';
      timeMap.forEach((converted, original) => {
        html += `
          <div class="timezone-time-row">
            <div class="time-original">${original}</div>
            <div class="time-arrow">→</div>
            <div class="time-converted">${converted}</div>
          </div>
        `;
      });
      
      columnBody.innerHTML = html;
    } catch (error) {
      console.error('[Timezone Helper] Error updating display:', error);
      columnBody.innerHTML = '<div class="timezone-status">Error loading times</div>';
    }
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
        
        console.log('[Timezone Helper] Timezone changed to:', this.selectedTimezone);
        
        // Update the display - use the correct ID
        const headerLabel = document.getElementById('timezone-title-display');
        if (headerLabel) {
          headerLabel.textContent = this.getTimezoneDisplayName(this.selectedTimezone);
          console.log('[Timezone Helper] Updated header to:', this.getTimezoneDisplayName(this.selectedTimezone));
        } else {
          console.log('[Timezone Helper] Could not find timezone-title-display element');
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
      // Update the column header
      const label = document.getElementById('timezone-title-display');
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
let navigationTimer = null;

const navigationObserver = new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    
    // Clear any pending navigation updates
    if (navigationTimer) {
      clearTimeout(navigationTimer);
    }
    
    // Debounce navigation changes
    navigationTimer = setTimeout(() => {
      console.log('[Timezone Helper] Page navigation detected');
      // Only reinitialize if we don't have a sidebar yet
      if (helperInstance && !document.getElementById('timezone-helper-column')) {
        helperInstance.timezoneColumnAdded = false;
        helperInstance.waitForGmail();
      }
    }, 2000); // Wait 2 seconds for page to settle
  }
});

// Only observe the body, not entire document
if (document.body) {
  navigationObserver.observe(document.body, { 
    childList: true, 
    subtree: false // Don't observe deeply
  });
}
