/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": "@swc/jest",
  },
  testMatch: ["**/__tests__/**/*.test.(ts|tsx)"],
  moduleNameMapper: {
    "^@berojgardegreewala/(.*)$": "<rootDir>/../$1/src",
    // NodeNext-style ".js" specifiers inside src → extensionless for jest
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

module.exports = config;
