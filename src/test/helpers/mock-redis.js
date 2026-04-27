// Small shared helper to produce a properly-shaped redis (node-redis) mock
// Usage in tests: jest.mock('redis', () => require('../helpers/mock-redis')());
module.exports = function createRedisMock() {
  const client = {
    on: jest.fn().mockReturnThis(),
    connect: jest.fn().mockResolvedValue(null),
    quit: jest.fn().mockResolvedValue(null),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  };

  const factory = {
    createClient: jest.fn().mockReturnValue(client),
    on: jest.fn().mockReturnThis(),
  };

  // Support CommonJS/ES module shapes
  const exportObj = factory;
  exportObj.default = factory;
  exportObj.__esModule = true;

  return exportObj;
};
