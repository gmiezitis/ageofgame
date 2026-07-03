# Age of Game

Standalone Electron version of the Screen Playground game.

## Development

```sh
npm install
npm start
```

## Checks

```sh
npm run typecheck
```

## Windows Builds

```sh
npm run make:win-x64
npm run make:win-arm64
```

The app contains only the game window, the safe preload bridge, the minimal screen/window thumbnail capture used as the playfield source, and the assets imported by the game renderer.
