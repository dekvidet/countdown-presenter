# Countdown Presenter

Countdown Presenter is a small web app for running a presentation timer from one window while showing a clean, full-screen countdown in another. The control view lets you set the start time, start or pause the timer, reset or clear it, configure alert sounds, and customize the displayed time format including separators such as `HH:mm:ss`, `HH.mm.ss`, or `HH-MM-SS`.

The app exposes two routes:

- `/` or `#/control` for the operator controls
- `#/display` for the audience-facing full-screen timer display

## GitHub

<p align="center">
  <a href="https://github.com/dekvidet/countdown-presenter">
    <img alt="View on GitHub" src="https://img.shields.io/badge/View%20the%20GitHub%20Repository-111111?style=for-the-badge&logo=github&logoColor=white">
  </a>
</p>

Repository: https://github.com/dekvidet/countdown-presenter

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

## Usage

1. Open the control view.
2. Set the starting time and optional alerts.
3. Adjust the time format if you want different separators or token layout.
4. Click `Open display` to launch the presentation display in a separate window or screen.
5. Start the countdown from the control view.
