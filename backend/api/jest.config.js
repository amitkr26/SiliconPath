/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": "@swc/jest",
  },
  testMatch: ["**/__tests__/**/*.test.(ts|tsx)"],
  moduleNameMapper: {
    "^@berojgardegreewala/(.*)$": "<rootDir>/../$1/src",
  },
};

module.exports = config;