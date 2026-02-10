import {
  client,
  logError,
  JOBS_LIST,
  PROCESSING_LIST,
  RETRIES_CHECK_BUFFER,
  RETRIES_CHECK_INTERVAL,
} from './init.js';
import { strict as assert } from 'node:assert';

await client.flushAll('SYNC');

let job = await client.blMove(
  JOBS_LIST,
  PROCESSING_LIST,
  'RIGHT',
  'LEFT',
  1,
);

console.log(job);
assert.ok(job === null);
console.log(job === null);

const res = await client.lPush(JOBS_LIST, "JOBBBBYOOOO");

job = await client.blMove(
  JOBS_LIST,
  PROCESSING_LIST,
  'RIGHT',
  'LEFT',
  1,
);

console.log(job);
assert.ok(job !== null);
console.log(job === null);

job = await client.blMove(
  JOBS_LIST,
  PROCESSING_LIST,
  'RIGHT',
  'LEFT',
  1,
);

console.log(job);
assert.ok(job === null);
console.log(job === null);

await client.destroy();
