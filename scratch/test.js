import { strict as assert } from 'node:assert';
import { suite, test, after } from 'node:test';
import { client, log, JOBS_LIST, PROCESSING_LIST,RETRIES_SORTED_SET, RETRIES_MAX } from '../../init.js';

import { setTimeout } from 'node:timers/promises';

function assertEquality(actual, expected) {
  assert.strictEqual(actual, expected);
  // probs not needed, as probs alias for `strictEqual` (when importing strict)
  assert.equal(actual, expected);
}

function assertDeepEquality(actual, expected) {
  assert.deepStrictEqual(actual, expected);
  // probs not needed, as probs alias for `deepStrictEqual` (when importing strict)
  assert.deepEqual(actual, expected);
}

async function assertListEquality(key, expected) {
  const list = await client.lRange(key, 0, -1);
  assertDeepEquality(list, expected);
}

//

let jobId = 0;

// make dynamic based on ENV vars NODE_ENV test
const DELAYS = [1, 31, 61];

async function jobGenerator() {
  while (true) {
    const jobs = [];

    for (let i = 0; i < 100; i++) {
      jobs.push({
        id: ++jobId,
        userId: 'test',
        attempts: [],
      });
    }

    await setTimeout(DELAYS[Math.floor(Math.random() * 3)] * 1000, 'DONE');

    await client.lPush(JOBS_LIST, jobs);
  }
}

//

async function jobProcessor(job) {
  job.attempts.push(Date.now());

  await setTimeout(250, 'DONE');

  if (Math.random() < 0.1) {
    job.error = new Error('JOB FAILED');
  }

  return job;
}

//

await client.lRange(key, 0, -1);
await client.zRangeWithScores(key, 0, -1);

// this changes, are not doing this
function checkState(jobsActual, jobsExpected, callback = () => {}) {
  for (let i = 0; i < jobsExpected.length; i++) {
    console.log(i); // confirm 0 first

    const jobActual = jobsActual[i];
    const jobExpected = jobsExpected[i];

    assertDeepEquality(jobActual, jobExpected);
    callback(jobActual, jobExpected);
  }
}

// here for check

suite('job engine', () => {
  after(async () => {
    await client.disconnect();
  });

  test('job engine test', async (t) => {

    

    // new Array or Array is fine?


    const checks = [
      ['lRange', JOBS_LIST],
      ['lRange', PROCESSING_LIST],
      ['lRange', 'success:test', (job) => {
        assert.ok(!(job.error));
        // need <==? no. and not using below
        assert.ok(job.attempts <= RETRIES_MAX);
      }],
      ['lRange', 'failure:test', (job) => {
        assert.ok(job.error);
        assertEquality(job.attempts, RETRIES_MAX);
      }],
      ['zRangeWithScores', RETRIES_SORTED_SET, (job) => {
        assert.ok(job.attempts < RETRIES_MAX);
      }],
    ];

    // extract this out into func, have default last arg (empty func)

    // here for check
    
    const jobs = await client[method](key, 0, -1);
    let jobsITB = Array(RETRIES_MAX).fill(-1);

    for (const job of jobs) {
      assert.ok(job.id > jobsITB[job.attempts]);
      jobsITB[job.attempts] = job.id;
      additionalChecks(job);
    }
    


    
    assertEquality(await client.flushAll('SYNC'), 'OK');
    console.log('\nFLUSHED ALL');
  });
});
