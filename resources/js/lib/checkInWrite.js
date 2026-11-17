/**
 * A saved check-in stays. A 400 or 422 is a permanent rejection.
 * Anything else, including offline, can be retried.
 */

export const CHECK_IN_REJECTED_EVENT = 'habuilt:check-in-rejected';

export function classifyCheckInWrite(response) {
  if (response && (response.guest === true || response.success === true)) return 'saved';
  const status = Number(response && response.status);
  if (status === 400 || status === 422) return 'rejected';
  return 'retry';
}
