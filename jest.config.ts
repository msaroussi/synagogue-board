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
      transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
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
