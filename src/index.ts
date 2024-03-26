import { env } from '@/common/utils/envConfig';
import { app, logger } from '@/server';
import { CronJob } from 'cron';
import { runMongoDB } from './db/mongo';
import { startBot } from './trading/buy';
import { fetchSolBalance } from './services/solWalletService';

const server = app.listen(env.PORT, () => {
  const { NODE_ENV, HOST, PORT } = env;
  logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);
});

runMongoDB();
//startBot();

const job = new CronJob('0 0 */1 * *', fetchSolBalance); // This will run the job at midnight (00:00) every day

// Start the cron job
job.start();

// Log a message to indicate the cron job has started
console.log('Cron job for fetching SOL balance started.');

const onCloseSignal = () => {
  logger.info('sigint received, shutting down');
  server.close(() => {
    logger.info('server closed');
    process.exit();
  });
  setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on('SIGINT', onCloseSignal);
process.on('SIGTERM', onCloseSignal);
