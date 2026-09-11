import { readConfig } from '../server/config.js';
import { connectClient, disconnectClient } from '../server/db.js';
import { runMigrations } from '../server/migrate.js';
import { logger } from '../server/logger.js';

async function main() {
  const config = readConfig();
  if (!config) {
    logger.error('migrate', 'No database config found. Is Recura installed?');
    process.exit(1);
  }

  logger.info('migrate', 'Connecting to database...');
  const client = await connectClient(config);

  try {
    logger.info('migrate', 'Running migrations...');
    const result = await runMigrations(client, {
      onProgress: ({ name, index, total }) => {
        logger.info('migrate', `[${index}/${total}] Applied ${name}`);
      }
    });

    if (result.applied.length > 0) {
      logger.info('migrate', `Successfully applied ${result.applied.length} new migrations.`);
    } else {
      logger.info('migrate', 'Database is up to date. No new migrations applied.');
    }
  } catch (err) {
    logger.error('migrate', `Failed to apply migrations: ${err.message}`);
    process.exit(1);
  } finally {
    await disconnectClient(client);
  }
}

main();
