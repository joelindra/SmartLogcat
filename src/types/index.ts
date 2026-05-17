// src/types/index.ts

export type LogLevel = 'V' | 'D' | 'I' | 'W' | 'E' | 'F';

export interface SmartCategory {
  name: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
}

export interface HttpData {
  type: 'request' | 'response';
  method?: string;
  url: string;
  status?: number;
  ms?: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  pid: number;
  tid: number;
  level: LogLevel;
  tag: string;
  message: string;
  raw: string;
  smartCategory?: SmartCategory | null;
  isHttpLog?: boolean;
  httpData?: HttpData | null;
  isStackTrace?: boolean;
  ruleMatched?: string; // ID of the rule matched
}

export interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'unauthorized';
  isWifi?: boolean;
}

export interface DeviceInfo {
  'ro.product.model': string;
  'ro.product.manufacturer': string;
  'ro.build.version.release': string;
  'ro.build.version.sdk': string;
  'ro.product.device': string;
  battery: string;
}

export interface LogSession {
  id: string;
  name: string;
  deviceId: string;
  startedAt: number;
  logs?: LogEntry[];
}

export interface CustomRule {
  id: string;
  name: string;
  pattern: string;
  isRegex: boolean;
  highlightColor: string;
  notify: boolean;
  enabled: boolean;
}

export interface MemInfo {
  success: boolean;
  totalPss: number;
  nativeHeap: number;
  dalvikHeap: number;
  timestamp: number;
}
