module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'controllers/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!node_modules/**',
    '!coverage/**',
  ],
  testTimeout: 10000,
  verbose: true,
};
