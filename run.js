import {
  client,
  logError,
  JOBS_LIST,
  PROCESSING_LIST,
  RETRIES_CHECK_BUFFER,
  RETRIES_CHECK_INTERVAL,
} from './init.js';
import { processJob, fetchRetries, handleStranded } from './chains.js';
import { jobProcessor as processor } from './processor.js';

export async function processJobs() {
  let strandedJobs = [],
    lastCheckedRetries = 0,
    fetchingRetries = false,
    continueLoop = true;

  client.on('STOP_FETCHING_LOOP', () => {
    console.log('STOPPING LOOP');
    continueLoop = false;
  });

  // awaiting to guarantee lRange completes before anything else
  // is put in PROCESSING_LIST - as i'm not sure if guaranteed otherwise
  try {
    strandedJobs = await client.lRange(PROCESSING_LIST, 0, -1);
  } catch (err) {
    logError(err);
  }

  if (strandedJobs.length) {
    handleStranded(strandedJobs);
  }

  while (continueLoop) {
    const currentDatetime = Date.now();
    const timeout =
      lastCheckedRetries + RETRIES_CHECK_INTERVAL - currentDatetime;

    // if ever change to < or something, update assert in init file
    if (timeout - RETRIES_CHECK_BUFFER <= 0) {
      lastCheckedRetries = currentDatetime;

      if (!fetchingRetries) {
        fetchingRetries = true;

        fetchRetries(lastCheckedRetries).finally(() => {
          fetchingRetries = false;
        });
      }
    } else {
      let job = null;

      try {
        job = await client.blMove(
          JOBS_LIST,
          PROCESSING_LIST,
          'RIGHT',
          'LEFT',
          Math.round(timeout / 1000),
        );
      } catch (err) {
        logError(err);
      }

      if (job !== null) {
        processJob(job, processor);
      }
    }
  }
}
