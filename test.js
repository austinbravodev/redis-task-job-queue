import {
  client,
  JOBS_LIST,
  PROCESSING_LIST,
  RETRIES_MAX,
  RETRIES_SORTED_SET,
  STATUS_SUCCESS,
  STATUS_FAILURE,
  RETRIES_DELAY_BASE,
  RETRIES_CHECK_BUFFER,
  RETRIES_CHECK_INTERVAL,
} from './init.js';
import { strict as assert } from 'node:assert';
import { test, mock } from 'node:test';
import { setTimeout } from 'node:timers/promises';

function sumArray(results) {
  let s = 0;

  for (const r of results) {
    s += r;
  }

  return s;
}

export const JOB_TIMEOUT = parseInt(process.env.JOB_TIMEOUT);

test('test', async () => {
  const mockFetchRetries = await import('./chains.js').then(
    ({ default: defaultExport, ...namedExports }) => {
      const mockFetchRetries = mock.fn(namedExports.fetchRetries);

      mock.module('./chains.js', {
        defaultExport,
        namedExports: {
          ...namedExports,
          fetchRetries: mockFetchRetries,
        },
      });

      return mockFetchRetries;
    },
  );

  const { processJobs } = await import('./run.js');

  const FLUSH_ALL = parseInt(process.env.FLUSH_ALL);
  const PROCESS_ALL = parseInt(process.env.PROCESS_ALL);
  const GENERATE_JOBS = parseInt(process.env.GENERATE_JOBS);
  const STRANDED = parseInt(process.env.STRANDED);
  const GROUP_SUFFIX = ':test';
  const MAX_JOBS_GENERATED = parseInt(process.env.MAX_JOBS_GENERATED);
  const JOBS_BATCH_SIZE =
    MAX_JOBS_GENERATED / parseInt(process.env.JOBS_BATCH_DIVISOR);

  function assertEquality(actual, expected) {
    assert.strictEqual(actual, expected);
    // probs not needed, as probs alias for `strictEqual` (when importing strict)
    assert.equal(actual, expected);
  }

  const CHECKS = [
    {
      key: JOBS_LIST,
      retriesMax: RETRIES_MAX - 1,
      length: 0,
    },
    {
      key: PROCESSING_LIST,
      retriesMax: RETRIES_MAX - 1,
      length: 0,
    },
    {
      key: RETRIES_SORTED_SET,
      method: 'zRangeWithScores',
      retriesMax: RETRIES_MAX - 1,
      length: 0,
    },
    {
      key: STATUS_SUCCESS + GROUP_SUFFIX,
    },
    {
      key: STATUS_FAILURE + GROUP_SUFFIX,
      error: new Error('JOB FAILED').message,
      retriesMin: RETRIES_MAX,
    },
  ];

  let totalAttempts = 0;

  async function checks() {
    let jobsTotal = 0;
    const jobIds = new Set();

    for (const check of CHECKS) {
      const {
        key,
        method = 'lRange',
        error = null,
        retriesMin = 0,
        retriesMax = RETRIES_MAX,
        length,
      } = check;

      const jobs = await client[method](key, 0, -1);

      jobsTotal += jobs.length;
      console.log(key + ' ' + jobs.length);

      if (PROCESS_ALL && length !== undefined) {
        assertEquality(jobs.length, length);
      }

      let lastAttempt = Infinity;

      for (const jobStr of jobs) {
        const job = JSON.parse(jobStr);

        assertEquality(job.error, error);
        assert.ok(retriesMin <= job.retries <= retriesMax);
        assert.ok(job.retries === job.attempts.length - 1);
        assert.ok(!jobIds.has(job.id));
        jobIds.add(job.id);

        totalAttempts += job.attempts.length;

        let attempt;
        let nextAttemptAfter = 0;
        for (const nAttempt in job.attempts) {
          attempt = job.attempts[nAttempt];
          assert.ok(attempt >= nextAttemptAfter);

          nextAttemptAfter =
            attempt + JOB_TIMEOUT + RETRIES_DELAY_BASE * 2 ** nAttempt;
        }

        assert.ok(attempt <= lastAttempt);
        lastAttempt = attempt;
      }
    }

    assertEquality(jobsTotal, jobNumber);
  }

  function generateJobBatch(key = JOBS_LIST) {
    const jobs = [];

    for (let i = 0; i < JOBS_BATCH_SIZE; i++) {
      jobs.push(
        JSON.stringify({
          id: ++jobNumber,
          groupId: 'test',
          error: null,
          retries: 0,
          attempts: [],
        }),
      );
    }

    return client.lPush(key, jobs);
  }

  const GENERATION_INTERVALS = [
    RETRIES_CHECK_BUFFER * 0.5,
    RETRIES_CHECK_BUFFER,
    RETRIES_CHECK_BUFFER * 2,
    RETRIES_CHECK_INTERVAL * 0.5,
    RETRIES_CHECK_INTERVAL,
    RETRIES_CHECK_INTERVAL * 2,
  ];

  async function generateJobs() {
    while (jobNumber < jobGenerationLimit - 1) {
      await generateJobBatch();

      const generationTimeout =
        GENERATION_INTERVALS[Math.floor(Math.random() * 6)];

      console.log(await setTimeout(generationTimeout, generationTimeout));
    }
  }

  // ---

  let jobNumber = 0;
  let jobGenerationLimit = MAX_JOBS_GENERATED;

  if (FLUSH_ALL) {
    await client.flushAll('SYNC');

    if (STRANDED) {
      await generateJobBatch(PROCESSING_LIST);
    }
  } else {
    const strandedResults = await Promise.all(
      CHECKS.map((c) =>
        client[c.method === 'zRangeWithScores' ? 'zCard' : 'lLen'](c.key),
      ),
    );

    jobNumber += sumArray(strandedResults);
    jobGenerationLimit += jobNumber;
  }

  console.time('processingJobs');

  const promProcessJobs = processJobs();

  if (GENERATE_JOBS) {
    await generateJobs();
  }

  while (true) {
    const results = await Promise.all([
      client.lLen(JOBS_LIST),
      client.lLen(PROCESSING_LIST),
      client.zCard(RETRIES_SORTED_SET),
    ]);

    console.log('RESULTS');
    console.log(results);

    if (!sumArray(results)) {
      client.emit('STOP_FETCHING_LOOP');
      await promProcessJobs;
      break;
    }

    await setTimeout(250, 'STILL PROCESSING JOBS');
  }

  console.timeEnd('processingJobs');
  console.log(jobNumber + ' JOBS PROCESSED');

  // mock seems to be working - would need a complicated equation to really check
  console.log(
    'mockFetchRetries.mock.callCount() = ' + mockFetchRetries.mock.callCount(),
  );
  assert.ok(mockFetchRetries.mock.callCount() > 1);

  await checks();

  console.log(totalAttempts + ' TOTAL ATTEMPTS');

  // move above checks? move as last line in test? doesn't matter
  mock.reset();

  // await client.close();
  // client.destroy();
  // console.log("CLIENT IS CLOSED");
});
