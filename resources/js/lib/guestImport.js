import { runGuestImport } from './followUpGates.js';
import { callLocalApi, loadUserSettings } from './supabase.js';

export function importGuestListForSignedInUser(userId, storage) {
  if (!userId || userId === 'guest') {
    return Promise.resolve({ action: 'skip', cleared: false });
  }
  return runGuestImport({
    storage,
    loadSettings: () => loadUserSettings(userId),
    postImport: (body) => callLocalApi('/api/guest-import', 'POST', body, { returnError: true }),
  });
}
