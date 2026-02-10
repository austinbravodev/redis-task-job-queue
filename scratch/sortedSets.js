import { createClient } from 'redis';

const client = createClient();
client.on('error', (err) => console.error('Redis client error:', err));
await client.connect();

const r1 = await client.zAdd('testing', {
  score: 5,
  value: 'value',
});

const r2 = await client.zAdd('testing', {
  score: 3,
  value: 'hello',
});

const r5 = await client.zRangeWithScores("testing", 0, 10, { BY: 'SCORE' });
console.log(r5);

const r3 = await client.zAdd('testing', {
  score: 4,
  value: 'value',
});

const r4 = await client.zRangeWithScores("testing", 0, 10, { BY: 'SCORE' });
console.log(r4);

await client.flushAll('SYNC');
await client.disconnect();
