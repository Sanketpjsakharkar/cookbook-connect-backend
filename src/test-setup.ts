/**
 * Global test setup and teardown
 * Handles cleanup of database connections and other resources
 */

// Global teardown to ensure clean exit
// eslint-disable-next-line no-undef
afterAll(async () => {
  // Give a small delay to allow any pending operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  // eslint-disable-next-line no-console
  console.warn('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Increase timeout for slow operations
// eslint-disable-next-line no-undef
jest.setTimeout(30000);
