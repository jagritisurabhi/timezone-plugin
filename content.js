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
    const checkInterval = setInterval(() => {
      const calendarContainer = document.querySelector('[role="main"]');
      if (calendarContainer && !this.timezoneColumnAdded) {
        this.addTimezoneColumn();
        clearInterval(checkInterval);
      }
    }, 1000);
  }

  addTimezoneColumn() {
    const calendarContainer = document.querySelector('[role="main"]');
    if (!calendarContainer) return;

    // Find the calendar grid or schedule view
    const scheduleView = calendarContainer.querySelector('[data-viewtype="schedule"]') || 
                        calendarContainer.querySelector('.schedule-view') ||
                        calendarContainer.querySelector('[role="grid"]');

    if (scheduleView) {
      this.injectTimezoneColumn(scheduleView);
    } else {
      // Try alternative selectors for different Gmail calendar layouts
      const alternativeSelectors = [
        '.calendar-grid',
        '.schedule-container',
        '[data-viewtype="day"]',
        '[data-viewtype="week"]'
      ];

      for (const selector of alternativeSelectors) {
        const element = calendarContainer.querySelector(selector);
        if (element) {
          this.injectTimezoneColumn(element);
          break;
        }
      }
    }
  }

  injectTimezoneColumn(container) {
    if (this.timezoneColumnAdded) return;

    // Create timezone column header
    const timezoneHeader = document.createElement('div');
    timezoneHeader.className = 'timezone-column-header';
    timezoneHeader.innerHTML = `
      <div class="timezone-header-content">
        <span class="timezone-label">${this.getTimezoneDisplayName(this.selectedTimezone)}</span>
        <button class="timezone-selector-btn" title="Change Timezone">⚙️</button>
      </div>
    `;

    // Create timezone column container
    const timezoneColumn = document.createElement('div');
    timezoneColumn.className = 'timezone-column';
    timezoneColumn.id = 'timezone-helper-column';

    // Add click handler for timezone selector
    timezoneHeader.querySelector('.timezone-selector-btn').addEventListener('click', () => {
      this.showTimezoneSelector();
    });

    // Insert the timezone column
    const existingColumns = container.querySelectorAll('[role="columnheader"], .calendar-column, .schedule-column');
    if (existingColumns.length > 0) {
      container.insertBefore(timezoneHeader, existingColumns[existingColumns.length - 1].nextSibling);
      container.insertBefore(timezoneColumn, container.lastChild);
    } else {
      container.appendChild(timezoneHeader);
      container.appendChild(timezoneColumn);
    }

    this.timezoneColumnAdded = true;
    this.updateTimezoneDisplay();
  }

  updateTimezoneDisplay() {
    const timezoneColumn = document.getElementById('timezone-helper-column');
    if (!timezoneColumn) return;

    // Find all time slots or events in the calendar
    const timeSlots = document.querySelectorAll('[data-time], .time-slot, .calendar-event');
    
    timezoneColumn.innerHTML = '';
    
    timeSlots.forEach(slot => {
      const timeElement = slot.querySelector('[data-time], .time-text, .event-time');
      if (timeElement) {
        const originalTime = timeElement.textContent.trim();
        const convertedTime = this.convertTime(originalTime);
        
        const timezoneSlot = document.createElement('div');
        timezoneSlot.className = 'timezone-slot';
        timezoneSlot.textContent = convertedTime;
        timezoneSlot.title = `${originalTime} → ${convertedTime}`;
        
        timezoneColumn.appendChild(timezoneSlot);
      }
    });
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

// Initialize the extension when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new GmailTimezoneHelper();
  });
} else {
  new GmailTimezoneHelper();
}

// Re-initialize when Gmail navigates (SPA behavior)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(() => {
      new GmailTimezoneHelper();
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });
