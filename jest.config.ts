import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'angular',
      preset: 'jest-preset-angular',
      setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
      testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
      transform: {
        '^.+\\.(ts|mjs|js|html)$': [
          'jest-preset-angular',
          {
            tsconfig: '<rootDir>/tsconfig.spec.json',
            stringifyContentPathRegex: '\\.(html|svg)$',
          },
        ],
      },
      transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$|@hebcal/|temporal-polyfill|quick-lru|humanize-duration))'],
      moduleNameMapper: {
        '^@hebcal/core$': '<rootDir>/node_modules/@hebcal/core/dist/esm/index.js',
        '^@hebcal/hdate$': '<rootDir>/node_modules/@hebcal/hdate/dist/esm/index.js',
        '^@hebcal/noaa$': '<rootDir>/node_modules/@hebcal/noaa/dist/index.js',
        '^@hebcal/learning$': '<rootDir>/node_modules/@hebcal/learning/dist/esm/index.js',
      },
      moduleFileExtensions: ['ts', 'js', 'html', 'json'],
      collectCoverageFrom: [
        'src/app/**/*.ts',
        '!src/app/**/*.config.ts',
        '!src/main.ts',
      ],
    },
    {
      displayName: 'scripts',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/scripts/**/*.spec.ts'],
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.scripts.json',
          },
        ],
      },
      moduleFileExtensions: ['ts', 'js', 'json'],
    },
  ],
};

export default config;
