import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

const quietCheckerLogger = {
    log: (_message: string): void => undefined,
    error: (message: string): void => {
        console.error(message);
    },
};

export const plugins = process.env.NODE_ENV !== "production"
    ? [
        new ForkTsCheckerWebpackPlugin({
            logger: quietCheckerLogger,
            devServer: false,
        }),
    ]
    : [];
