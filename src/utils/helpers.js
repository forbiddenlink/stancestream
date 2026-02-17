/**
 * Resolve a promise with an upper timeout bound.
 * Throws an Error with name "TimeoutError" if time is exceeded.
 */
export const promiseTimeout = (promise, timeoutMs = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error(`Operation timed out after ${timeoutMs}ms`);
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);

    Promise.resolve(promise)
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};
