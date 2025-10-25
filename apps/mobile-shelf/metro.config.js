const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuración simple para proyecto independiente
// No más workspaces, mobile-shelf es completamente independiente
config.projectRoot = __dirname;
config.watchFolders = [__dirname];

module.exports = config;

