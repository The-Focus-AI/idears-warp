// Global test timeout
jest.setTimeout(10000);

// Clean up test data after all tests
afterAll(async () => {
  const fs = require('fs');
  const path = require('path');
  
  const testDataDir = './test-data';
  if (fs.existsSync(testDataDir)) {
    const files = fs.readdirSync(testDataDir);
    for (const file of files) {
      fs.unlinkSync(path.join(testDataDir, file));
    }
    fs.rmdirSync(testDataDir);
  }
});

