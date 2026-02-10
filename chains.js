import {
  client,
  logError,
  JOBS_LIST,
  PROCESSING_LIST,
  RETRIES_SORTED_SET,
  RETRIES_MAX,
  STATUS_SUCCESS,
  STATUS_FAILURE,
  HISTORY_LENGTH_SUCCESS,
  HISTORY_LENGTH_FAILURE,
  RETRIES_DELAY_BASE,
} from './init.js';

export async function handleStranded(strandedJobs) {
  return client
    .lPush(JOBS_LIST, strandedJobs.toReversed())
    .then(() => client.lTrim(PROCESSING_LIST, 0, -(strandedJobs.length + 1)))
    .catch(logError);
}

export async function processJob(jobRaw, processor) {
  const job = JSON.parse(jobRaw);

  let histKeyPref = STATUS_SUCCESS,
    maxHistLen = HISTORY_LENGTH_SUCCESS;

  return (
    processor(job)
      .catch((err) => {
        logError(err);
        job.error = err;
        return job;
      })
      // rename, not accept as argument, or keep / do not change `job`
      // for right now, keep / do not change
      .then((job) => {
        if (job.error) {
          if (job.retries < RETRIES_MAX) {
            job.error = null;
            job.retries += 1;

            return client.zAdd(RETRIES_SORTED_SET, {
              score: Date.now() + RETRIES_DELAY_BASE * 2 ** (job.retries - 1),
              value: JSON.stringify(job),
            });
          } else {
            histKeyPref = STATUS_FAILURE;
            maxHistLen = HISTORY_LENGTH_FAILURE;
          }
        }

        const histKey = histKeyPref + ':' + job.groupId;

        return client
          .lPush(histKey, JSON.stringify(job))
          .then(
            (histLen) =>
              histLen > maxHistLen && client.lTrim(histKey, 0, maxHistLen - 1),
          );
      })
      .then(() => {
        return client.lRem(PROCESSING_LIST, 0, jobRaw);
      })
      .catch(logError)
  );
}

export async function fetchRetries(lastCheckedRetries) {
  // 0, '-inf'? don't know, and doesn't matter - both work.
  return client
    .zRange(RETRIES_SORTED_SET, 0, lastCheckedRetries, { BY: 'SCORE' })
    .then(
      (jobs) =>
        jobs.length &&
        client
          .lPush(JOBS_LIST, jobs)
          .then(() => client.zRem(RETRIES_SORTED_SET, jobs)),
    )
    .catch(logError);
}
