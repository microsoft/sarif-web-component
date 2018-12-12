const path = require("path");
const webpack = require('webpack');

module.exports = {
    entry: "./index.tsx",
    output: { path: __dirname, filename: "bundle.js" },
    devtool: 'source-map',
    resolve: {
        extensions: [".js", ".jsx", "ts", "tsx"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.s?css$/,
                exclude: /node_modules/,
                use: ["style-loader", "css-loader", "sass-loader"]
            },
        ]
    },
    devServer : { /* Neccesary to server outside localhost */
        host: "0.0.0.0",
        port: 8080,
		hot: false,
        historyApiFallback: {
            rewrites: [
                { from: /^\/sample\/$/, to: args => args.parsedUrl.pathname }, /* Otherwise index.html is served */
            ]
        }
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
}
