/**
 * mockApiDelay.js — Simulated network latency utility
 *
 * PURPOSE:
 *   In a real application, data is fetched over the network from an API server.
 *   That fetch is asynchronous — it takes time — and the UI must handle the
 *   "loading" and "error" states that arise during that wait.
 *
 *   Because MS2 has no backend, we use this utility to inject artificial delays
 *   before returning data. This forces every consumer to be written as an
 *   async function and prove that loading states and skeleton screens work.
 *
 * HOW IT WORKS:
 *   `mockApiDelay(data, ms)` returns a Promise that:
 *     1. Waits `ms` milliseconds  (default: 600ms — feels realistic).
 *     2. Resolves with the provided `data`.
 *
 *   Usage pattern in a custom hook:
 *     const result = await mockApiDelay(filteredProjects, 800);
 *
 *   `mockApiError(message, ms)` simulates a failed API call by rejecting the
 *   Promise after the delay. Use it to test error boundary / error state UI.
 *
 * JAVASCRIPT CONCEPTS USED:
 *   - Promise constructor  — `new Promise((resolve) => setTimeout(resolve, ms))`
 *     wraps the callback-based `setTimeout` in the Promise interface.
 *   - async/await          — callers can `await mockApiDelay(data)` instead of
 *     chaining `.then()` callbacks.
 *   - Default parameters   — `ms = 600` provides a sensible fallback delay.
 */

/**
 * Resolves with `data` after a simulated network delay.
 * @template T
 * @param {T} data   — The value to resolve the promise with.
 * @param {number} ms — Delay in milliseconds (default 600).
 * @returns {Promise<T>}
 */
export function mockApiDelay(data, ms = 600) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), ms);
  });
}

/**
 * Rejects with an Error after a simulated network delay.
 * Useful for testing error states in the UI.
 * @param {string} message — Error message string.
 * @param {number} ms      — Delay in milliseconds (default 600).
 * @returns {Promise<never>}
 */
export function mockApiError(message = 'Something went wrong.', ms = 600) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}
