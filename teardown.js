import { client } from 'init.js';

export async function globalTeardown() {
  console.log('Global teardown started');
  await client.flushAll('SYNC');
  await client.disconnect();
  console.log('Global teardown finished');
}
