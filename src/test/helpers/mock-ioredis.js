// Small shared helper to produce a properly-shaped ioredis mock
// Usage in tests: jest.mock('ioredis', () => require('../helpers/mock-ioredis')());
module.exports = function createIoredisMock() {
  const instance = {
    on: jest.fn().mockReturnThis(),
    quit: jest.fn().mockReturnThis(),
    disconnect: jest.fn().mockReturnThis(),
  };

  const ctor = jest.fn().mockImplementation(() => instance);

  // Support both CommonJS and ES module default import shapes
  const exportObj = ctor;
  exportObj.default = ctor;
  exportObj.__esModule = true;

  return exportObj;
};
