import type { ForgeConfig } from "@electron-forge/shared-types";
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

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        executableName: "ageofgame",
        name: "Age of Game",
    },
    rebuildConfig: {},
    makers: [
        new MakerSquirrel({
            name: "ageofgame",
        }),
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
