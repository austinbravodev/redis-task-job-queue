import { strict as assert } from 'node:assert';
import { suite, test, after } from 'node:test';
import { client, log, JOBS_LIST, PROCESSING_LIST } from '../../init.js';
// import { createRequire } from 'node:module';

// const require = createRequire(import.meta.url);

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

const JOBS = ['one', 'two', 'three'];
const JOBS_EXTRA = ['four', 'five'];
const ERRORS = [
  {
    method: 'lRange',
    implementation: 'sCard',
    error: {
      name: 'Error',
      message:
        'WRONGTYPE Operation against a key holding the wrong kind of value',
    },
  },
  {
    method: 'lPush',
    implementation: 'lMove',
    error: {
      name: 'TypeError',
      message: 'Invalid argument type',
    },
  },
  {
    // may want to try to generate a different type of error
    // than the lRange + sCard, but can put this off
    method: 'lTrim',
    implementation: 'zRange',
    error: {
      name: 'Error',
      message:
        'WRONGTYPE Operation against a key holding the wrong kind of value',
    },
  },
];

const TESTS = [];

for (const jobs of [JOBS, []]) {
  for (const jobsExtra of [JOBS_EXTRA, []]) {
    TESTS.push({
      jobs,
      jobsExtra,
      processingList: jobsExtra.toReversed(),
      jobsList: jobs.toReversed(),
    });
  }
}

for (const error of ERRORS) {
  TESTS.push({
    jobs: JOBS,
    error,
    processingList: JOBS.toReversed(),
    jobsList: error.method === 'lTrim' ? JOBS.toReversed() : [],
  });
}

suite('stranded jobs', () => {
  after(async () => {
    await client.disconnect();
  });

  let count = 0;

  for (const specs of TESTS) {
    test(JSON.stringify(specs), async (t) => {
      assertEquality(await client.flushAll('SYNC'), 'OK');
      console.log('\nFLUSHED ALL');

      const { jobs, jobsExtra = [], error, processingList, jobsList } = specs;

      if (jobs.length) {
        await client.lPush(PROCESSING_LIST, jobs);
        // const res = await client.lPush(PROCESSING_LIST, jobs);
        // assertEquality(res, jobs.length);
      }

      await assertListEquality(PROCESSING_LIST, jobs.toReversed());

      let logTracker;

      if (error) {
        logTracker = t.mock.fn(log);

        // t.mock.method(client, error.method, client[error.implementation]);

        t.mock.method(client, error.method);
        client[error.method].mock.mockImplementationOnce(
          client[error.implementation],
        );

        t.mock.module('../../init.js', {
          namedExports: { client, log: logTracker, JOBS_LIST, PROCESSING_LIST },
        });

        console.log('`log`, `init.js` mocked');
      }

      const { default: handleStranded } = await import(
        '../stranded.js?count=' + ++count
      );

      // const { default: handleStranded } = require(
      //   '../stranded.js'
      // );

      console.log('`stranded.js` imported');

      if (error) {
        assertEquality(client[error.method].mock.callCount(), 0);
        assertEquality(logTracker.mock.callCount(), 0);
      }

      const handleStrandedProm = handleStranded();

      if (jobsExtra.length) {
        const processingListLength = await client.lPush(
          PROCESSING_LIST,
          jobsExtra,
        );

        assertEquality(processingListLength, jobs.length + jobsExtra.length);
      }

      const res = await handleStrandedProm;

      let resExpected;

      if (error) {
        assertEquality(client[error.method].mock.callCount(), 1);
        // client[error.method].mock.restore();

        assertEquality(logTracker.mock.callCount(), 1);

        const err = logTracker.mock.calls[0].arguments[0];
        assertEquality(err.name, error.error.name);
        assertEquality(err.message, error.error.message);
      } else if (jobs.length) {
        resExpected = 'OK';
      }

      assertEquality(res, resExpected);

      await assertListEquality(PROCESSING_LIST, processingList);
      await assertListEquality(JOBS_LIST, jobsList);

      // if (error) {
      //   assertEquality(client[error.method].mock.callCount(), 1);
      // }
    });
  }
});
