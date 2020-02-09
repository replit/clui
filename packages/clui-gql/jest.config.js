module.exports = {
  preset: 'ts-jest',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.+(ts|tsx|js)'],
  transform: { '^.+\\.(ts|tsx)$': 'ts-jest' },
};
