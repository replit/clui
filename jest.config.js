module.exports = {
  preset: "ts-jest",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.+(ts|tsx|js)"],
  transform: { "^.+\\.(ts|tsx)$": "ts-jest" },
  snapshotSerializers: ["enzyme-to-json/serializer"],
  setupFilesAfterEnv: ["<rootDir>/src/setupEnzyme.ts"]
};
