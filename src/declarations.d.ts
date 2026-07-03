declare const SCREEN_PLAYGROUND_WINDOW_WEBPACK_ENTRY: string;
declare const SCREEN_PLAYGROUND_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

declare module "electron-squirrel-startup" {
    const started: boolean;
    export default started;
}

declare module "*.mp3" {
    const src: string;
    export default src;
}

declare module "*.mp4" {
    const src: string;
    export default src;
}

declare module "*.png" {
    const src: string;
    export default src;
}

declare module "*.jpg" {
    const src: string;
    export default src;
}

declare module "*.svg" {
    const src: string;
    export default src;
}

declare module "*.css" {
    const content: string;
    export default content;
}

declare module "*.node" {
    const nativeModule: unknown;
    export default nativeModule;
}
