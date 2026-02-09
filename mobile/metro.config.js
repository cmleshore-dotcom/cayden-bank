const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the workspace root so Metro can find hoisted node_modules
config.watchFolders = [workspaceRoot];

// Let Metro find node_modules in both the project and workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Disable package exports resolution which can cause issues with hoisted modules
config.resolver.unstable_enablePackageExports = false;

// Follow symlinks (mobile/node_modules -> root/node_modules)
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
