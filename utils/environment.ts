/**
 * Utility to detect the current environment
 */

export const isItchIO = (): boolean => {
  // Check if running on itch.io domain
  return window.location.hostname.includes('itch.zone') ||
         window.location.hostname.includes('itch.io');
};

export const isLocalhost = (): boolean => {
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

export const canUseOnlineMode = (): boolean => {
  // Online mode requires a backend server, which is only available locally
  return !isItchIO();
};
