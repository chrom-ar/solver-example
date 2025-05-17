import SolverSDK from '@chrom-ar/solver-sdk'
import { logger } from "./logger";
import { validateAndBuildProposal } from "./helpers";
import dotenv from 'dotenv';

dotenv.config(); // Load .env file


async function main() {
  logger.info("Starting solver...");

  try {
    // Pass your handler function and optionally a logger
    const solver = await SolverSDK.start(validateAndBuildProposal, logger);
    logger.info("Solver started successfully.");

    // Keep the solver running (e.g., wait for exit signal)
    const keepRunning = () => setTimeout(keepRunning, 1000 * 60 * 60); // Keep alive
    keepRunning();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info("Shutting down solver...");
      await solver.stop();
      logger.info("Solver stopped.");
      process.exit(0);
    });

  } catch (error) {
    logger.error("Failed to start solver:", error);
    process.exit(1);
  }
}

main();
