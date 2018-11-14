const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const chalk = require('chalk');
const glob = require('glob');

/**
 * Get files by glob patterns
 */
const getGlobbedPaths = (globPatterns, excludes) => {
  const urlRegex = new RegExp('^(?:[a-z]+:)?\/\/', 'i');
  let output = [];

  // If glob pattern is array then we use each pattern in a recursive way, otherwise we use glob
  if (_.isArray(globPatterns)) {
    globPatterns.forEach(globPattern => output = _.union(output, getGlobbedPaths(globPattern, excludes)));
  } else if (_.isString(globPatterns)) {
    if (urlRegex.test(globPatterns)) {
      output.push(globPatterns);
    } else {
      let files = glob.sync(globPatterns);
      if (excludes) {
        files = files.map((file) => {
          if (_.isArray(excludes)) {
            for (const i in excludes) {
              file = file.replace(excludes[i], '');
            }
          } else {
            file = file.replace(excludes, '');
          }
          return file;
        });
      }
      output = _.union(output, files);
    }
  }

  return output;
};

/**
 * Validate NODE_ENV existence
 */
const validateEnvironmentVariable = () => {
  const environmentFiles = glob.sync('./config/env/' + process.env.NODE_ENV + '.js');
  console.log();
  if (!environmentFiles.length) {
    if (process.env.NODE_ENV) {
      console.error(chalk.red('+ Error: No configuration file found for "' + process.env.NODE_ENV + '" environment using development instead'));
    } else {
      console.error(chalk.red('+ Error: NODE_ENV is not defined! Using default development environment'));
    }
    process.env.NODE_ENV = 'development';
  }
  // Reset console color
  console.log(chalk.white(''));
};

/**
 * Validate Secure=true parameter can actually be turned on
 * because it requires certs and key files to be available
 */
const validateSecureMode = (config) => {
  if (!config.secure || config.secure.ssl !== true) {
    return true;
  }

  const privateKey = fs.existsSync(path.resolve(config.secure.privateKey));
  const certificate = fs.existsSync(path.resolve(config.secure.certificate));

  if (!privateKey || !certificate) {
    console.log(chalk.red('+ Error: Certificate file or key file is missing, falling back to non-SSL mode'));
    console.log(chalk.red('  To create them, simply run the following from your shell: sh ./scripts/generate-ssl-certs.sh'));
    console.log();
    config.secure.ssl = false;
  }
};

/**
 * Validate Session Secret parameter is not set to default in production
 */
const validateSessionSecret = (config, testing) => {

  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  if (config.sessionSecret === 'MEAN') {
    if (!testing) {
      console.log(chalk.red('+ WARNING: It is strongly recommended that you change sessionSecret config while running in production!'));
      console.log(chalk.red('  Please add `sessionSecret: process.env.SESSION_SECRET || \'super amazing secret\'` to '));
      console.log(chalk.red('  `config/env/production.js` or `config/env/local.js`'));
      console.log();
    }
    return false;
  } else {
    return true;
  }
};

/**
 * Initialize global configuration files
 */
const initGlobalConfigFolders = (config, assets) => {
  // Appending files
  config.folders = {
    server: {},
    client: {}
  };

  // Setting globbed client paths
  config.folders.client = getGlobbedPaths(path.join(process.cwd(), 'modules/*/client/'), process.cwd().replace(new RegExp(/\\/g), '/'));
};

/**
 * Initialize global configuration files
 */
const initGlobalConfigFiles = (config, assets) => {
  // Appending files
  config.files = {
    server: {},
    client: {}
  };

  config.files.server.models = getGlobbedPaths(assets.server.models);
  config.files.server.routes = getGlobbedPaths(assets.server.routes);
  config.files.server.configs = getGlobbedPaths(assets.server.config);
  config.files.server.sockets = getGlobbedPaths(assets.server.sockets);
  config.files.server.policies = getGlobbedPaths(assets.server.policies);
  config.files.client.js = getGlobbedPaths(assets.client.lib.js, 'public/').concat(getGlobbedPaths(assets.client.js, ['public/']));
  config.files.client.css = getGlobbedPaths(assets.client.lib.css, 'public/').concat(getGlobbedPaths(assets.client.css, ['public/']));
  config.files.client.tests = getGlobbedPaths(assets.client.tests);
};

/**
 * Initialize global configuration
 */
const initGlobalConfig = () => {
  validateEnvironmentVariable();
  const defaultAssets = require(path.join(process.cwd(), 'config/assets/default'));
  const environmentAssets = require(path.join(process.cwd(), 'config/assets/', process.env.NODE_ENV)) || {};
  const assets = _.merge(defaultAssets, environmentAssets);
  const defaultConfig = require(path.join(process.cwd(), 'config/env/default'));
  const environmentConfig = require(path.join(process.cwd(), 'config/env/', process.env.NODE_ENV)) || {};
  let config = _.merge(defaultConfig, environmentConfig);
  config.meanjs = require(path.resolve('./package.json'));

  // We only extend the config object with the local.js custom/local environment if we are on
  // production or development environment. If test environment is used we don't merge it with local.js
  // to avoid running test suites on a prod/dev environment (which delete records and make modifications)
  if (process.env.NODE_ENV !== 'test') {
    config = _.merge(config, (fs.existsSync(path.join(process.cwd(), 'config/env/local.js')) && require(path.join(process.cwd(), 'config/env/local.js'))) || {});
  }

  initGlobalConfigFiles(config, assets);
  initGlobalConfigFolders(config, assets);
  validateSecureMode(config);
  validateSessionSecret(config);
  config.utils = {
    getGlobbedPaths,
    validateSessionSecret
  };

  return config;
};

/**
 * Set configuration object
 */
module.exports = initGlobalConfig();
