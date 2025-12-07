# Job Application Logger - Chrome Extension

A Chrome browser extension that allows job seekers to log job applications directly from job posting pages into a Google Sheet.

## Features

- **Auto-detect job details** from LinkedIn, Indeed, Greenhouse, Lever, Workday, Glassdoor
- **Manual entry fallback** for company websites and unsupported platforms
- **Google Sheets integration** with user-configurable column mapping
- **Duplicate detection** with option to update existing entries
- **Badge notifications** when on a job posting page

## Installation (Development)

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Chrome browser

### Setup

1. Clone the repository:
```bash
git clone https://github.com/brondumjacob/job-logger-chrome-extension.git
cd job-logger-chrome-extension
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist` folder (or the project root for development)

### Development Mode

For development with hot reload:
```bash
npm run dev
```

## Project Structure

```
job-logger-chrome-extension/
├── manifest.json              # Extension configuration
├── package.json               # Dependencies
├── public/
│   ├── popup.html             # Popup entry point
│   └── icons/                 # Extension icons
├── src/
│   ├── popup/                 # React popup UI
│   │   ├── App.jsx
│   │   └── components/
│   ├── background/            # Service worker
│   │   └── background.js
│   ├── content/               # Content scripts
│   │   ├── content.js
│   │   └── scrapers/          # Site-specific scrapers
│   └── shared/                # Shared utilities
```

## Google Cloud Setup (Required for Sheets Integration)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Google Sheets API**
4. Create OAuth 2.0 credentials:
   - Application type: Chrome Extension
   - Add your extension ID
5. Update `manifest.json` with your Client ID

## Supported Job Boards

| Platform | Auto-Detection |
|----------|----------------|
| LinkedIn | ✅ Full |
| Indeed | ✅ Full |
| Greenhouse | ✅ Full |
| Lever | ✅ Full |
| Workday | ✅ Full |
| Glassdoor | ✅ Full |
| Other | ⚠️ Best effort |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Author

Jacob Brondum - [GitHub](https://github.com/brondumjacob)
