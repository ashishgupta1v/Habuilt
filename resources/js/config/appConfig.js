/**
 * Centralized Application Configuration & URLs
 */
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Habuilt',
  apkDownloadUrl: import.meta.env.VITE_APK_DOWNLOAD_URL || 'https://github.com/ashishgupta1v/Habuilt/releases/download/latest-build/habuilt.apk',
  repositoryUrl: import.meta.env.VITE_REPOSITORY_URL || 'https://github.com/ashishgupta1v/Habuilt',
  version: '2.0.0',
};

export const APK_DOWNLOAD_URL = APP_CONFIG.apkDownloadUrl;
