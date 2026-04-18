import { runSeed } from '../scripts/seed.js';

export default async function globalSetup() {
  await runSeed();
}
