import 'dotenv/config';
import { createClientPool } from 'redis';
import assert from 'node:assert/strict';

export const JOBS_LIST = process.env.JOBS_LIST,
  PROCESSING_LIST = process.env.PROCESSING_LIST,
  RETRIES_SORTED_SET = process.env.RETRIES_SORTED_SET,
  STATUS_SUCCESS = 'succeeded',
  STATUS_FAILURE = 'failed',
  HISTORY_LENGTH_SUCCESS = parseInt(process.env.HISTORY_LENGTH_SUCCESS),
  HISTORY_LENGTH_FAILURE = parseInt(process.env.HISTORY_LENGTH_FAILURE),
  RETRIES_MAX = parseInt(process.env.RETRIES_MAX),
  RETRIES_DELAY_BASE = parseInt(process.env.RETRIES_DELAY_BASE),
  RETRIES_CHECK_INTERVAL = parseInt(process.env.RETRIES_CHECK_INTERVAL),
  RETRIES_CHECK_BUFFER = parseInt(process.env.RETRIES_CHECK_BUFFER);

assert.ok(RETRIES_CHECK_BUFFER >= 499);

export function logError(err) {
  console.error(err);
}

export const client = createClientPool();
client.on('error', logError);
await client.connect();

// // confirm not needed
// // import process from 'node:process';

// function clientDisconnect(signal) {
//   console.log(`Received ${signal}`);
// }

// process.on('SIGINT', clientDisconnect);
// process.on('SIGTERM', clientDisconnect);

// process.on('beforeExit', clientDisconnect);
// process.on('exit', clientDisconnect);

// await client.close();
