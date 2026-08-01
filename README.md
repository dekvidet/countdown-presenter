# Countdown Presenter

Countdown Presenter is a small web app for running a presentation timer from one window while showing a clean, full-screen countdown in another. The control view lets you set the start time, start or pause the timer, reset or clear it, configure alert sounds, and customize the displayed time format including separators such as `HH:mm:ss`, `HH.mm.ss`, or `HH-MM-SS`.

<p align="center">
  <a href="https://github.com/dekvidet/countdown-presenter">
    <img height="56" alt="Try It Now" src="https://img.shields.io/badge/Try%20It%20Now-2563EB?style=for-the-badge&logo=github&logoColor=white">
  </a>
</p>

The app exposes two routes:

- `/` or `#/control` for the operator controls
- `#/display` for the audience-facing full-screen timer display

It now supports two sync modes:

- Static browser mode for GitHub Pages and other static hosts, with control and display synchronized locally in the browser
- Electron desktop mode, which starts a local HTTP + websocket server so the control dashboard and display can be opened from other devices in a browser on the same network

## Installation

Requirements:

- Node.js 20 or newer
- npm

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Start the Electron desktop app:

```bash
npm run electron
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment

This is a static Vite application, so deployment is straightforward. Build the app first:

```bash
npm run build
```

Then publish the generated `dist/` directory to any static host, such as:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Any web server that can serve static files

Because the app uses a hash router, the control and display pages work from static hosting without additional server-side route handling.

In static hosting mode, synchronization stays local to the browser origin, so the current GitHub Pages flow continues to work without any server component.

## Electron Desktop Mode

Run:

```bash
npm run electron
```

This builds the web app, starts a local HTTP server and websocket state hub inside Electron, and opens the control dashboard in an Electron window.

From there you can use:

- the Electron window as the main control dashboard
- the `Open display` button for a second local display window
- the `Remote access` panel to open both control and display from other devices in a browser

Typical URLs look like:

- Local control: `http://127.0.0.1:<port>/#/control`
- Remote control: `http://<your-lan-ip>:<port>/#/control`
- Remote display: `http://<your-lan-ip>:<port>/#/display`

Remote devices must be able to reach your PC on the local network.

## Usage

1. Open the control view.
2. Set the starting time and optional alerts.
3. Adjust the time format if you want different separators or token layout.
4. Click `Open display` to launch the presentation display in a separate window or screen.
5. In Electron mode, use the URLs in the `Remote access` panel if you want browser-based control or display on other clients.
6. Start the countdown from the control view.
