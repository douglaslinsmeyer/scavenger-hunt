// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test timeouts
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};