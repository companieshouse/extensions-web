// Ensure that inline jest.mock factories for 'ioredis' produce an __esModule-compatible object
const originalJestMock = global.jest && global.jest.mock;
if (originalJestMock) {
  global.jest.mock = (moduleName, factory, options) => {
    if (moduleName === 'ioredis' && typeof factory === 'function') {
      const wrappedFactory = () => {
        const mod = factory();
        if (mod && mod.default && mod.__esModule !== true) {
          mod.__esModule = true;
        }
        return mod;
      };
      return originalJestMock.call(global.jest, moduleName, wrappedFactory, options);
    }
    return originalJestMock.call(global.jest, moduleName, factory, options);
  };
}
