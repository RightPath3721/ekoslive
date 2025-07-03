const path = require("path");
const BUILD_DIR = path.resolve(__dirname, "./build");
const APP_DIR = path.resolve(__dirname, "src", "client");
const SHARED_DIR = path.resolve(__dirname, "StellarMateShared");
const REDUX_DIR = path.resolve(SHARED_DIR, "shared", "redux");
const IMAGE_DIR = path.resolve(SHARED_DIR, "images");
const INDI_DIR = path.resolve(SHARED_DIR, "shared", "indi");
const COMMANDS_DIR = path.resolve(SHARED_DIR, "shared", "commands");
const HOOKS_DIR = path.resolve(__dirname, "src", "client", "hooks");
const SERVICES_DIR = path.resolve(__dirname, "src", "client", "services");
const UTILS_DIR = path.resolve(__dirname, "src", "client", "utils");
const CONSTANTS_DIR = path.resolve(__dirname, "src", "client", "constants");
const COMPONENTS_DIR = path.resolve(__dirname, "src", "client", "Components");

const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MomentLocalesPlugin = require("moment-locales-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const webpack = require("webpack");

module.exports = (env, argv) =>
{
	const isDevBuild = argv.mode === "development";
	const mode = argv.mode ?? "development";

	const config = {
		entry: ["babel-polyfill", APP_DIR + "/index.jsx"],
		output: {
			filename: "bundle.js",
			path: BUILD_DIR,
		},
		cache: false, // disabled to avoid hanging
		bail: true,   // stop on first error
		infrastructureLogging: {
			level: "verbose", // helps trace where it hangs
		},
		plugins: [
			new webpack.DefinePlugin({
				"process.env.NODE_ENV": JSON.stringify(mode),
			}),
			new HtmlWebpackPlugin({
				template: "index.html",
			}),
			new CopyWebpackPlugin({
				patterns: [{ from: "public", to: "public" }],
			}),
			new MomentLocalesPlugin({
				localesToKeep: ["es-us"],
			}),
			new webpack.IgnorePlugin({ resourceRegExp: /^@env$/ }),
			new webpack.IgnorePlugin({ resourceRegExp: /^redux-flipper$/ }),
			new webpack.IgnorePlugin({ resourceRegExp: /^.*?react-native.*$/ }),
			new Dotenv(),
		],
		devtool: isDevBuild ? "source-map" : false,
		optimization: {
			minimize: true,
			minimizer: [
				new TerserPlugin({
					parallel: true,
					terserOptions: {
						sourceMap: true,
						compress: {
							drop_console: !isDevBuild
						},
					},
					exclude: [/GainIcon/, /OffsetIcon/],
				}),
			],
			chunkIds: "deterministic",
			mangleWasmImports: true,
			removeAvailableModules: true,
			splitChunks: {
				chunks: "async",
				minSize: 20000,
				maxSize: 120000,
				minRemainingSize: 0,
				minChunks: 1,
				maxAsyncRequests: 15,
				maxInitialRequests: 15,
				enforceSizeThreshold: 50000,
				minSizeReduction: 40000,
				cacheGroups: {
					defaultVendors: {
						test: /[\\/]node_modules[\\/]/,
						priority: -10,
						reuseExistingChunk: true,
					},
					default: {
						minChunks: 2,
						priority: -20,
						reuseExistingChunk: true,
					},
				},
			},
		},
		resolve: {
			extensions: [".js", ".jsx"],
			alias: {
				"@common": SHARED_DIR,
				"@redux": REDUX_DIR,
				"@images": IMAGE_DIR,
				"@indi": INDI_DIR,
				"@commands": COMMANDS_DIR,
				"@hooks": HOOKS_DIR,
				"@services": SERVICES_DIR,
				"@utils": UTILS_DIR,
				"@client": APP_DIR,
				"@components": COMPONENTS_DIR,
				"@constants": CONSTANTS_DIR,
				"react": path.resolve(__dirname, 'node_modules/react'),
				"react-dom": path.resolve(__dirname, 'node_modules/react-dom'),
			},
		},
		module: {
			rules: [
				{
					test: /\.css$/,
					include: path.resolve(__dirname, "src", "client"),
					use: ["style-loader", "css-loader", "postcss-loader"],
				},
				{
					test: /\.css$/,
					include: path.resolve(__dirname, "node_modules"),
					use: ["style-loader", "css-loader", "postcss-loader"],
				},
				{
					test: /\.(jsx|js)?$/,
					exclude: /node_modules/,
					use: [
						{
							loader: "babel-loader",
							options: {
								cacheDirectory: true,
								plugins: [
									["@babel/plugin-proposal-decorators", { legacy: true }],
									"@babel/plugin-proposal-class-properties",
									"@babel/plugin-proposal-export-default-from",
									"@babel/plugin-transform-runtime",
									"lodash",
								],
								presets: ["@babel/preset-react", "@babel/preset-env"],
							},
						},
					],
				},
				{
					test: /\.svg$/,
					use: [
						{
							loader: "url-loader",
							options: {
								limit: 10000,
								mimetype: "image/svg+xml",
							},
						},
					],
				},
				{
					test: /\.(ogg|mp3|wav|mpe|jpg|png|webp?g)$/i,
					loader: "file-loader",
					options: {
						esModule: false,
					},
				},
				{
					test: /\.webp$/,
					use: [
						{
							loader: "webp-loader",
							options: {
								esModule: false,
								name: "images/[name]-[hash].[ext]",
								outputPath: "images",
							},
						},
						{
							loader: "url-loader",
							options: {
								esModule: false,
								fallback: "webp-loader",
								name: "images/[name]-[hash].[ext]",
								outputPath: "images",
							},
						},
					],
				},
			],
		},
		watchOptions: {
			poll: true,
			ignored: /node_modules/,
		},
		devServer: {
			historyApiFallback: true,
		},
	};

	if (!isDevBuild)
	{
		config.plugins.push(
			sentryWebpackPlugin({
				authToken: process.env.SENTRY_AUTH_TOKEN,
				org: "ikarus-technologies",
				project: "ekoslive",
			}),
		);
	}

	if (process.env.NODE_DEP === "benchmark")
		config.plugins.push(new BundleAnalyzerPlugin());

	return config;
};
