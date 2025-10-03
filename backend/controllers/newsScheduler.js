import cron from "node-cron";
import { runNewsFetch } from "./newsFetcher.js";

let task = null;

export function startNewsScheduler() {
  const schedule = process.env.CRON_SCHEDULE || "0 0 * * *"; // default daily at 00:00 UTC
  console.log(`Scheduling news fetch with cron: ${schedule}`);

  // Prevent double-scheduling if called twice
  if (task) {
    console.log("News scheduler already running.");
    return task;
  }

  task = cron.schedule(schedule, async () => {
    try {
      console.log("Cron triggered: fetching news...");
      await runNewsFetch();
      console.log("Cron fetch finished.");
    } catch (e) {
      console.error("Cron fetch error:", e?.message || e);
    }
  });

  // Start immediately (optional):
  // task.start();

  return task;
}

export function stopNewsScheduler() {
  if (task) {
    task.stop();
    task = null;
  }
}
