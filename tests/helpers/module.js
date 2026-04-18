import { jest } from '@jest/globals';

export async function importFresh(modulePath, mocks = []) {
  jest.resetModules();

  for (const [path, factory] of mocks) {
    jest.unstable_mockModule(path, factory);
  }

  return import(modulePath);
}
