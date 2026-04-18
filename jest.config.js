export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  transform: {},
  setupFiles: ['dotenv/config', './tests/setupEnv.js'],
  globalSetup: './tests/globalSetup.js',
  testTimeout: 60000
};
