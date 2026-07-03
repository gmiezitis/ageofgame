import type { Configuration } from "webpack";

import { plugins } from "./webpack.plugins";
import { rules } from "./webpack.rules";

export const rendererConfig: Configuration = {
    devtool: process.env.NODE_ENV === "development" ? "eval-source-map" : false,
    stats: "errors-warnings",
    infrastructureLogging: {
        level: "error",
    },
    module: {
        rules,
    },
    plugins,
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    },
};
