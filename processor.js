import { setTimeout } from 'node:timers/promises';
import { JOB_TIMEOUT } from './test.js';

const FAILURE_RATE = parseFloat(process.env.FAILURE_RATE);

export function jobProcessor(job) {
  job.attempts.push(Date.now());

  if (Math.random() < FAILURE_RATE) {
    job.error = new Error('JOB FAILED').message;
  }

  return setTimeout(JOB_TIMEOUT, job);
}
