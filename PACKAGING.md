# CAF: Tech Hustle Packaging

CAF: Tech Hustle uses Electron, Vite, React, and TypeScript. Windows packaging is handled by electron-builder.

## Development

```bash
npm install
npm run dev
```

`npm run dev` starts the Vite dev server and launches Electron against `http://localhost:5173`.

## Production Build

```bash
npm run build
```

This compiles TypeScript, builds the Vite app into `dist/`, and compiles the Electron main/preload files into `dist-electron/`.

## Installer Build

```bash
npm run dist
```

This creates the Windows NSIS installer in `release/`.

## Unpacked Build

```bash
npm run package
```

This creates an unpacked Windows build in `release/` for quick local testing without running the installer.

## Saves

The current save slot system uses browser `localStorage`, which persists in Electron's app profile for the installed application. The Electron main process also exposes a legacy save file under Electron `userData` for migration compatibility.

## Icon

The temporary Windows icon is `build/icon.ico`. Replace it with final CAF artwork before public release. Keep the same path or update `package.json` under `build.win.icon`.

## Troubleshooting

- If the packaged app opens to a blank screen, run `npm run build` again and confirm `dist/index.html` references assets with relative `./assets/...` paths.
- If `npm run dist` says `electron-builder` is missing, run `npm install`.
- If Windows SmartScreen warns on launch, that is expected for unsigned local builds. Code signing can be added later.
