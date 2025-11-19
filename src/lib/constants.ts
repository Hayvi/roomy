/**
 * Application-wide constants
 */

// Validation limits
export const MAX_DISPLAY_NAME_LENGTH = 30;
export const MAX_ROOM_NAME_LENGTH = 50;

// Password generation
export const ROOM_PASSWORD_LENGTH = 6;

// Timing intervals (in milliseconds)
export const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
export const ROOM_LIST_POLL_INTERVAL_MS = 10000; // 10 seconds

// Online user detection window (must be > HEARTBEAT_INTERVAL_MS)
export const ONLINE_WINDOW_MINUTES = 1;

// Discord-style name suffix range
export const NAME_SUFFIX_MIN = 1000;
export const NAME_SUFFIX_MAX = 9999;
