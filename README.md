# Gmail Timezone Helper

A Chrome extension that adds a timezone column to your Gmail calendar, helping you schedule meetings across different time zones effortlessly.

## Features

- **Multi-timezone Support**: View your calendar events in any timezone
- **Real-time Conversion**: Automatically converts times as you browse
- **Seamless Integration**: Blends naturally with Gmail's interface
- **Easy Configuration**: Simple timezone selector with popular timezones
- **Persistent Settings**: Remembers your preferred timezone

## Screenshots

The extension adds a timezone column next to your Gmail calendar, showing converted times for all your events.

## Installation

### From Source (Developer Mode)

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/yourusername/gmail-timezone-plugin.git
   cd gmail-timezone-plugin
   ```

2. **Generate Icons** (if needed)
   - Open `icons/icon-generator.html` in your browser
   - Click "Download All Icons" to generate the required PNG files
   - Save them as `icon16.png`, `icon48.png`, and `icon128.png` in the `icons/` folder

3. **Load the Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `gmail-timezone-plugin` folder

4. **Grant Permissions**
   - The extension will request access to Gmail and Google Calendar
   - Click "Allow" to enable the extension

## Usage

1. **Open Gmail** and navigate to your calendar view
2. **Select Timezone**: Click the settings button in the timezone column header
3. **Choose Your Timezone**: Select from popular timezones or use the extension popup
4. **View Converted Times**: Your events will now show in both your local time and the selected timezone

## Supported Timezones

- **Americas**: Eastern, Central, Mountain, Pacific Time
- **Europe**: London (GMT/BST), Paris (CET/CEST)
- **Asia**: Tokyo (JST), Shanghai (CST), India (IST)
- **Australia**: Sydney (AEST/AEDT)

## How It Works

The extension uses a content script that:
1. **Detects Gmail Calendar**: Automatically finds your calendar interface
2. **Injects Timezone Column**: Adds a new column next to your existing calendar
3. **Converts Times**: Uses JavaScript's built-in timezone conversion
4. **Updates in Real-time**: Refreshes when you navigate or change views

## Technical Details

### Files Structure
```
gmail-timezone-plugin/
├── manifest.json          # Extension configuration
├── content.js            # Main content script
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── styles.css            # Extension styles
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon-generator.html
└── README.md
```

### Permissions
- `activeTab`: Access to current Gmail tab
- `storage`: Save timezone preferences
- `https://mail.google.com/*`: Access to Gmail
- `https://calendar.google.com/*`: Access to Google Calendar

## Development

### Prerequisites
- Chrome browser
- Basic knowledge of Chrome extensions
- Text editor or IDE

### Local Development
1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh button on your extension
4. Test your changes in Gmail

### Building Icons
If you need to regenerate icons:
1. Open `icons/icon-generator.html` in a browser
2. Click "Generate Icons" to create the canvas elements
3. Click "Download All Icons" to save PNG files
4. Replace the existing icon files

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Extension Not Working
- Ensure you're on Gmail (mail.google.com)
- Check that the extension is enabled in `chrome://extensions/`
- Try refreshing the Gmail page
- Check the browser console for errors

### Timezone Column Not Appearing
- Make sure you're in the calendar view
- Try refreshing the page
- Check if Gmail has updated its interface (extension may need updates)

### Timezone Conversion Issues
- Verify your selected timezone is correct
- Check if daylight saving time is affecting the conversion
- Try selecting a different timezone and back

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Gmail team for the excellent calendar interface
- Chrome Extensions API for making this possible
- Contributors and users who provide feedback

## Support

If you encounter any issues or have suggestions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the Chrome Extensions documentation

---

**Note**: This extension is not affiliated with Google or Gmail. It's a third-party tool designed to enhance your Gmail experience.
