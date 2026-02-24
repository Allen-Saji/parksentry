import { runWorkerLoop } from './chunkProcessor';

const pollMs = Number(process.env.WORKER_POLL_MS ?? 1000);

void runWorkerLoop(pollMs);
