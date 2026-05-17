// electron/adb/LogParser.cjs
'use strict';

// Simple ID generator for CJS compatibility
const generateId = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

// Format: MM-DD HH:MM:SS.mmm  PID  TID  LEVEL  TAG  :  MESSAGE
const LOG_REGEX = /^(\d{2}-\d{2}\s[\d:.]+)\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+(.+?)\s*:\s(.*)$/;

// Known Android patterns for smart categorization
const SMART_PATTERNS = [
  { name: 'Null Pointer', pattern: /NullPointerException/i, severity: 'high', suggestion: 'Check null safety before accessing object' },
  { name: 'Out of Memory', pattern: /OutOfMemoryError/i, severity: 'critical', suggestion: 'Check for memory leaks with LeakCanary' },
  { name: 'Network Timeout', pattern: /SocketTimeoutException|ConnectException|UnknownHostException/i, severity: 'medium', suggestion: 'Check network connectivity and timeout config' },
  { name: 'Main Thread IO', pattern: /StrictMode.*violation|NetworkOnMainThread/i, severity: 'medium', suggestion: 'Move IO operations to background thread' },
  { name: 'ANR', pattern: /ANR in|Application Not Responding/i, severity: 'critical', suggestion: 'Ensure main thread is not blocked' },
  { name: 'Frame Drop', pattern: /Choreographer.*Skipped (\d+) frames/i, severity: 'medium', suggestion: 'Reduce work on main thread during rendering' },
  { name: 'ClassNotFound', pattern: /ClassNotFoundException/i, severity: 'high', suggestion: 'Check ProGuard rules and class paths' },
  { name: 'IndexOutOfBounds', pattern: /IndexOutOfBoundsException|ArrayIndexOutOfBounds/i, severity: 'high', suggestion: 'Validate array/list indices before access' },
  { name: 'Security Exception', pattern: /SecurityException/i, severity: 'high', suggestion: 'Check runtime permissions' },
];

// OkHttp / Retrofit patterns
const HTTP_REQUEST_REGEX = /^--> (GET|POST|PUT|DELETE|PATCH|HEAD) (\S+)/;
const HTTP_RESPONSE_REGEX = /^<-- (\d{3}) .+ (\S+) \((\d+)ms\)/;
const HTTP_BODY_REGEX = /^\{|\[/;

function parseLine(raw) {
  if (!raw || raw.trim() === '') return null;

  const match = raw.match(LOG_REGEX);
  const id = generateId();

  if (!match) {
    return {
      id, timestamp: new Date().toISOString(), pid: 0, tid: 0,
      level: 'V', tag: 'raw', message: raw, raw,
      smartCategory: null, isHttpLog: false, isStackTrace: false,
    };
  }

  const message = match[6] || '';
  const tag = match[5].trim();
  const level = match[4];

  // Smart categorization
  let smartCategory = null;
  for (const p of SMART_PATTERNS) {
    if (p.pattern.test(message) || p.pattern.test(tag)) {
      smartCategory = p;
      break;
    }
  }

  // HTTP detection
  const isHttpLog = HTTP_REQUEST_REGEX.test(message) || HTTP_RESPONSE_REGEX.test(message);
  const httpReqMatch = message.match(HTTP_REQUEST_REGEX);
  const httpResMatch = message.match(HTTP_RESPONSE_REGEX);

  let httpData = null;
  if (httpReqMatch) httpData = { type: 'request', method: httpReqMatch[1], url: httpReqMatch[2] };
  if (httpResMatch) httpData = { type: 'response', status: parseInt(httpResMatch[1]), url: httpResMatch[2], ms: parseInt(httpResMatch[3]) };

  // StackTrace detection
  const isStackTrace = /^\s*at\s+[\w$.]+\(/.test(message) || /^(java\.|android\.|kotlin\.)/.test(message) || /Caused by:/.test(message);

  return {
    id,
    timestamp: match[1],
    pid: parseInt(match[2]),
    tid: parseInt(match[3]),
    level,
    tag,
    message,
    raw,
    smartCategory,
    isHttpLog,
    httpData,
    isStackTrace,
  };
}

module.exports = { parseLine, SMART_PATTERNS };
