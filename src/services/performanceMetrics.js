export async function collectPerformanceMetrics(redisClient, requestDuration) {
  const [stats, duration] = await Promise.all([
    redisClient.info('stats'),
    requestDuration.get(),
  ]);
  const value = /^instantaneous_ops_per_sec:(\d+)\r?$/m.exec(stats)?.[1];
  const operations = value === undefined ? null : Number(value);
  let seconds = 0;
  let count = 0;
  for (const sample of duration.values) {
    if (sample.metricName.endsWith('_sum')) seconds += sample.value;
    if (sample.metricName.endsWith('_count')) count += sample.value;
  }
  return {
    redis_ops_per_second: operations,
    redis_ops_per_minute: operations === null ? null : operations * 60,
    average_response_time: count > 0 ? seconds / count : null,
    uptime_percentage: null,
    uptime_milliseconds: process.uptime() * 1000,
    redis_connected: redisClient.isReady,
    system_load: null,
    memory_usage: null,
    last_updated: new Date().toISOString(),
  };
}
