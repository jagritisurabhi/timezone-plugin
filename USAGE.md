# Calendar Timezone Helper - Usage Guide

## What This Extension Does

This Chrome extension adds an **integrated sidebar column** to Google Calendar that shows you how times in your calendar translate to a different timezone of your choice.

## Visual Design

When you open Google Calendar, you'll see a **sidebar on the right edge** of the screen with:

- **Header** showing the timezone you're converting to (e.g., "EST/EDT")
- **Settings button** to quickly change timezone
- **Table of time conversions** showing: Local Time | Selected Timezone

Example:
```
┌─────────────────────────┐
│ EST/EDT                 │
│ [Settings]              │
├─────────────────────────┤
│ 9:00 AM      6:00 AM   │
│ 2:00 PM     11:00 AM   │
│ 5:30 PM      2:30 PM   │
└─────────────────────────┘
```

## Installation Steps

1. **Open Chrome** and go to `chrome://extensions/`
2. **Enable Developer Mode** (toggle in top-right)
3. **Click "Load unpacked"**
4. **Select** the `timezone-plugin` folder
5. **Done** The extension is now active

## Using the Extension

### Method 1: From the Sidebar

1. Go to **calendar.google.com**
2. The sidebar appears automatically on the right edge
3. Click the **"Settings"** button in the sidebar header
4. Select your desired timezone
5. Click **Save**

### Method 2: From the Toolbar Icon

1. Click the **extension icon** in Chrome's toolbar
2. See your current additional timezone
3. Click **"Add Timezone"** to select a different one
4. Click **"Refresh Calendar"** to update the display

## Supported Timezones

- **Americas:** Eastern, Central, Mountain, Pacific Time
- **Europe:** London (GMT/BST), Paris (CET/CEST)
- **Asia:** Tokyo (JST), Shanghai (CST), India (IST)
- **Australia:** Sydney (AEST/AEDT)

## Tips

1. **Best Views:** Works best in Week or Day view
2. **Auto-Update:** Sidebar automatically updates when you navigate
3. **Refresh:** Use the refresh button if times don't update
4. **Console Logs:** Open DevTools (F12) to see debug messages prefixed with `[Timezone Helper]`
5. **Sidebar Width:** The sidebar is 280px wide and fixed to the right edge

## Design Features

- **Integrated:** Blends naturally with Google Calendar's interface
- **Non-intrusive:** Fixed to the right edge, doesn't overlap calendar
- **Clean Table Layout:** Easy to scan local vs. converted times
- **Google Material Design:** Uses Google's official colors and fonts
- **Scrollable:** If you have many events, the sidebar scrolls independently

## Troubleshooting

### Sidebar doesn't appear
- Make sure you're on **calendar.google.com** (not mail.google.com)
- Try refreshing the page (Cmd/Ctrl + R)
- Check the browser console for error messages

### Times not showing
- Switch to Week or Day view (not Month view)
- Make sure you have events in your calendar
- Click the refresh button in the extension popup

### Sidebar overlaps content
- The sidebar is 280px wide on the right edge
- If your window is very narrow, you may need to resize it
- Minimum recommended window width: 1200px

## Technical Details

- **Manifest Version:** 3
- **Permissions:** activeTab, storage
- **Host Permissions:** mail.google.com, calendar.google.com
- **Update Frequency:** Checks for new events every 2 seconds
- **DOM Observer:** Watches for calendar changes automatically
- **Sidebar Position:** Fixed right edge, 280px wide

## Known Limitations

1. Only works with Google Calendar web interface
2. Detects times from event labels (may miss some custom formats)
3. Sidebar position is fixed (right edge)
4. Month view support is limited
5. Sidebar takes up 280px of screen space on the right

## Updating the Extension

When you make changes to the code:

1. Go to `chrome://extensions/`
2. Find "Gmail Timezone Helper"
3. Click the reload button
4. Refresh your Google Calendar tab

---

**Version:** 2.0.0  
**Last Updated:** October 2025  
**Design:** Integrated Sidebar (Non-intrusive)
