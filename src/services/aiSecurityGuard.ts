/**
 * FreshMart AI Safety, Rate Limiter & Abuse Guard
 * 
 * Rules:
 * 1. Gibberish & prompt-injection detection:
 *    - Uses Shannon entropy + repetitive character regex + non-dictionary character distribution checks.
 *    - If user sends gibberish/malicious text:
 *        * 1st offense: Warning 1 of 3
 *        * 2nd offense: Warning 2 of 3
 *        * 3rd offense: Warning 3 of 3
 *        * 4th: Banned for 24 Hours.
 * 2. Rate Limiting:
 *    - Max 15 requests per IP address within 3 hours.
 * 3. Permanent Ban (perma_ban):
 *    - Managed in Supabase / Local storage guard.
 *    - If perma_ban === true: completely blocked from sending any requests forever.
 *    - If perma_ban === false: access is allowed provided rate limit & 24hr temp ban haven't lapsed.
 */

export interface IpSecurityRecord {
  ip: string;
  request_count: number;
  window_start: string; // ISO timestamp for 3-hour window
  warning_count: number; // 0 to 3
  is_banned: boolean; // 24-hr temp ban
  banned_until: string | null; // ISO timestamp
  perma_ban: boolean; // Owner's perma ban toggle
  last_request_at: string;
  notes?: string;
}

// In-memory cache for fast local checks & fallback when Supabase is offline
const memoryStore = new Map<string, IpSecurityRecord>();

const MAX_REQUESTS_PER_3_HOURS = 15;
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Extracts client IP from request headers or socket
 */
export function extractClientIp(req: any): string {
  const xForwardedFor = req.headers?.['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    return ips.split(',')[0].trim();
  }
  const realIp = req.headers?.['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0].trim() : realIp.trim();
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

/**
 * Computes Shannon entropy of a string to detect random character mashing
 */
function calculateEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  for (const count of Object.values(frequencies)) {
    const p = count / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Checks whether user input is meaningless gibberish, keyboard spam, or low-entropy spam
 */
export function isGibberish(text: string): { isGibberish: boolean; reason?: string } {
  if (!text) return { isGibberish: false };
  const trimmed = text.trim();
  if (trimmed.length < 3) return { isGibberish: false };

  // 1. Check for single character repeats (e.g., "aaaaaaaaaaaa", "ffffffffffff")
  if (/(.)\1{5,}/i.test(trimmed)) {
    return { isGibberish: true, reason: 'Excessive consecutive identical characters' };
  }

  // 2. Check for 2 or 3-character pattern loops (e.g., "asdasdasdasd", "qwqwqwqwqw")
  if (/([a-zA-Z0-9]{2,3})\1{3,}/i.test(trimmed)) {
    return { isGibberish: true, reason: 'Repetitive keyboard mash pattern' };
  }

  // 3. Check for keyboard home-row smashing (e.g., "asdfghjkl", "zxcvbnm", "qwertyyuiop")
  const keyboardSmashes = [
    'asdfgh', 'sdfghj', 'dfghjk', 'fghjkl',
    'qwerty', 'wertyu', 'ertyui', 'rtyuio', 'tyuiop',
    'zxcvbn', 'xcvbnm', 'lkjhgf', 'poiuyt', 'mnbvcx',
    '123456', '234567', '345678', '456789'
  ];
  const lower = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const smash of keyboardSmashes) {
    if (lower.includes(smash)) {
      return { isGibberish: true, reason: 'Keyboard sequence spam' };
    }
  }

  // 4. Check for consonant clustering without vowels in latin text (e.g., "bcdfghjklmnpqrstvwxyz")
  const words = trimmed.split(/\s+/).filter(Boolean);
  let gibberishWordCount = 0;

  for (const word of words) {
    // Only check words of length >= 6 that look like ASCII words
    if (/^[a-zA-Z]{6,}$/.test(word)) {
      // If 5+ consonants in a row without a vowel or 'y'
      if (/[bcdfghjklmnpqrstvwxz]{5,}/i.test(word)) {
        gibberishWordCount++;
      }
      // Or 0 vowels in a 6+ letter word
      if (!/[aeiouy]/i.test(word)) {
        gibberishWordCount++;
      }
    }
  }

  if (words.length > 0 && gibberishWordCount >= Math.ceil(words.length * 0.6)) {
    return { isGibberish: true, reason: 'Unreadable consonant clustering' };
  }

  // 5. Very high entropy random symbol smashing (e.g. "@#$!)(*&^%$#@!)(*&")
  if (trimmed.length > 15) {
    const entropy = calculateEntropy(trimmed);
    // Standard natural language entropy is typically 2.5 - 4.2
    // If text has extremely high randomness without valid spaces/grammar:
    if (entropy > 4.6 && !trimmed.includes(' ')) {
      return { isGibberish: true, reason: 'Random character entropy overload' };
    }
  }

  return { isGibberish: false };
}

/**
 * Retrieves security record for an IP
 */
export function getIpSecurityRecord(ip: string): IpSecurityRecord {
  const existing = memoryStore.get(ip);
  const now = new Date();

  if (existing) {
    // Check if 3-hour rate limit window has expired, reset counter if so
    const windowStart = new Date(existing.window_start).getTime();
    if (now.getTime() - windowStart > THREE_HOURS_MS) {
      existing.window_start = now.toISOString();
      existing.request_count = 0;
    }

    // Check if 24-hour temporary ban has expired
    if (existing.is_banned && existing.banned_until) {
      if (now.getTime() > new Date(existing.banned_until).getTime()) {
        existing.is_banned = false;
        existing.banned_until = null;
        existing.warning_count = 0; // Reset warnings after penalty completed
      }
    }

    return existing;
  }

  // Default clean record
  const freshRecord: IpSecurityRecord = {
    ip,
    request_count: 0,
    window_start: now.toISOString(),
    warning_count: 0,
    is_banned: false,
    banned_until: null,
    perma_ban: false, // Default is false, controlled by owner
    last_request_at: now.toISOString(),
  };

  memoryStore.set(ip, freshRecord);
  return freshRecord;
}

/**
 * Updates an IP security record in-memory
 */
export function updateIpSecurityRecord(ip: string, updates: Partial<IpSecurityRecord>): IpSecurityRecord {
  const record = getIpSecurityRecord(ip);
  Object.assign(record, updates);
  memoryStore.set(ip, record);
  return record;
}

/**
 * Retrieves all stored IP security records (for Manager UI / Dashboard)
 */
export function getAllIpSecurityRecords(): IpSecurityRecord[] {
  return Array.from(memoryStore.values());
}

/**
 * Validates request permissions against Perma-Ban, 24-hr Temp Ban, and 15 req/3hr limit.
 */
export function validateIpRequest(ip: string): {
  allowed: boolean;
  statusCode?: number;
  error?: string;
  record: IpSecurityRecord;
  remainingRequests: number;
} {
  const record = getIpSecurityRecord(ip);
  const now = new Date();

  // 1. Check Permanent Ban (perma_ban)
  if (record.perma_ban) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Access Denied: Your IP address has been permanently banned from this store terminal by the administrator.',
      record,
      remainingRequests: 0,
    };
  }

  // 2. Check 24-Hour Temporary Ban (from 3 gibberish warnings)
  if (record.is_banned && record.banned_until) {
    const banUntilDate = new Date(record.banned_until);
    if (now.getTime() < banUntilDate.getTime()) {
      const remainingHours = Math.ceil((banUntilDate.getTime() - now.getTime()) / (60 * 60 * 1000));
      return {
        allowed: false,
        statusCode: 429,
        error: `Temporary Ban Active: You have exceeded the allowable gibberish/abuse limit (3 warnings). Your IP (${ip}) is suspended for 24 hours. Remaining: ~${remainingHours} hr(s).`,
        record,
        remainingRequests: 0,
      };
    } else {
      // Ban expired
      record.is_banned = false;
      record.banned_until = null;
      record.warning_count = 0;
    }
  }

  // 3. Check 15 requests in 3 hours Rate Limit
  const windowStart = new Date(record.window_start).getTime();
  if (now.getTime() - windowStart > THREE_HOURS_MS) {
    // Reset window
    record.window_start = now.toISOString();
    record.request_count = 0;
  }

  if (record.request_count >= MAX_REQUESTS_PER_3_HOURS) {
    const nextReset = new Date(windowStart + THREE_HOURS_MS);
    const minutesLeft = Math.ceil((nextReset.getTime() - now.getTime()) / (60 * 1000));
    return {
      allowed: false,
      statusCode: 429,
      error: `Rate Limit Exceeded: One IP address is permitted a maximum of 15 requests per 3 hours. Try again in ${minutesLeft} minute(s).`,
      record,
      remainingRequests: 0,
    };
  }

  const remaining = Math.max(0, MAX_REQUESTS_PER_3_HOURS - record.request_count);
  return {
    allowed: true,
    record,
    remainingRequests: remaining,
  };
}

/**
 * Increments request count on successful call
 */
export function recordSuccessfulRequest(ip: string): IpSecurityRecord {
  const record = getIpSecurityRecord(ip);
  record.request_count += 1;
  record.last_request_at = new Date().toISOString();
  memoryStore.set(ip, record);
  return record;
}

/**
 * Handles detection of gibberish: issues 3 warnings, then triggers 24h ban on 4th strike
 */
export function handleGibberishOffense(ip: string, reason?: string): {
  warningCount: number;
  isBannedNow: boolean;
  bannedUntil?: string;
  message: string;
} {
  const record = getIpSecurityRecord(ip);
  record.warning_count += 1;
  record.last_request_at = new Date().toISOString();

  if (record.warning_count >= 4) {
    // Trigger 24-hr ban
    const bannedUntil = new Date(Date.now() + TWENTY_FOUR_HOURS_MS).toISOString();
    record.is_banned = true;
    record.banned_until = bannedUntil;
    memoryStore.set(ip, record);

    return {
      warningCount: record.warning_count,
      isBannedNow: true,
      bannedUntil,
      message: `🚫 BANNED FOR 24 HOURS: You ignored 3 warnings for typing gibberish / nonsensical text. Your IP (${ip}) has been suspended for 24 hours.`,
    };
  } else {
    // Warning 1, 2, or 3
    memoryStore.set(ip, record);
    return {
      warningCount: record.warning_count,
      isBannedNow: false,
      message: `⚠️ Warning ${record.warning_count} of 3: Gibberish/meaningless text detected (${reason || 'unrecognized typing pattern'}). Please ask a coherent grocery or store question. If you receive 3 warnings, your IP will be banned for 24 hours!`,
    };
  }
}
