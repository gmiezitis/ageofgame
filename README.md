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

## Microsoft Store AppX

```sh
npm run make:store
```

The AppX build uses the generated assets in `build/appx` and the app icon in `build/icon.ico`.
Before submitting to Partner Center, set the Store identity values from your app listing:

```sh
set AGEOFGAME_APPX_IDENTITY_NAME=YourPublisher.AgeofGame
set AGEOFGAME_APPX_PUBLISHER="CN=Your Publisher ID"
set AGEOFGAME_APPX_PUBLISHER_DISPLAY_NAME="Your Publisher Name"
set AGEOFGAME_APPX_CERT=C:\path\to\certificate.pfx
set AGEOFGAME_APPX_CERT_PASS=certificate-password
npm run make:store
```

Building AppX packages requires Windows and the Windows 10 SDK.

The app contains only the game window, the safe preload bridge, the minimal screen/window thumbnail capture used as the playfield source, and the assets imported by the game renderer.
