import type { ForgeConfig } from "@electron-forge/shared-types";
import path from "path";
import { MakerAppX, type MakerAppXConfig } from "@electron-forge/maker-appx";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const parsePort = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 1024 && parsed <= 65535 ? parsed : fallback;
};

type StoreAppXConfig = MakerAppXConfig & {
    identityName?: string;
    publisherDisplayName?: string;
    packageBackgroundColor?: string;
};

const appxAssetsPath = path.resolve(__dirname, "build", "appx");
const iconPath = path.resolve(__dirname, "build", "icon");

const appxConfig: StoreAppXConfig = {
    packageName: "AgeofGame",
    packageDisplayName: "Age of Game",
    packageDescription: "Standalone desktop screen playground game.",
    packageExecutable: "app\\ageofgame.exe",
    packageBackgroundColor: "#05070d",
    assets: appxAssetsPath,
    makeVersionWinStoreCompatible: true,
    publisher: process.env.AGEOFGAME_APPX_PUBLISHER || "CN=gmiez",
    publisherDisplayName: process.env.AGEOFGAME_APPX_PUBLISHER_DISPLAY_NAME || "gmiez",
    identityName: process.env.AGEOFGAME_APPX_IDENTITY_NAME || "AgeofGame",
    devCert: process.env.AGEOFGAME_APPX_CERT,
    certPass: process.env.AGEOFGAME_APPX_CERT_PASS,
};

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        executableName: "ageofgame",
        icon: iconPath,
        name: "Age of Game",
    },
    rebuildConfig: {},
    makers: [
        new MakerSquirrel({
            name: "ageofgame",
            setupIcon: `${iconPath}.ico`,
        }),
        new MakerAppX(appxConfig),
        new MakerZIP({}, ["darwin", "win32"]),
    ],
    plugins: [
        new AutoUnpackNativesPlugin({}),
        new WebpackPlugin({
            mainConfig,
            port: parsePort(process.env.AGEOFGAME_DEV_SERVER_PORT, 3031),
            renderer: {
                config: rendererConfig,
                entryPoints: [
                    {
                        html: "./src/playground/playground.html",
                        js: "./src/playground/renderer.tsx",
                        name: "screen_playground_window",
                        preload: {
                            js: "./src/playground/preload.ts",
                        },
                    },
                ],
            },
        }),
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
        }),
    ],
};

export default config;
