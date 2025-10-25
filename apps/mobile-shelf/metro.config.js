const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Forzar a que SOLO use node_modules local, NO el de la raíz
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
  ],
};

// Watchfolders solo en directorio actual
config.watchFolders = [__dirname];

module.exports = config;

