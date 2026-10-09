const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// O bridge MediaPipe em assets/mediapipe/ precisa que .wasm, .task e os
// arquivos de runtime (renomeados para .wasmjs) sejam tratados como assets
// binários opacos, não como código-fonte a ser transformado pelo Metro.
config.resolver.assetExts.push("wasm", "task", "wasmjs");

module.exports = config;
