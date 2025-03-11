
import fs from 'fs';
import path from 'path';

// Configuration
const DEBUG_ENABLED = process.env.NODE_ENV !== 'production';
const LOG_TO_FILE = true;
const LOG_FILE_PATH = path.join(process.cwd(), 'logs', 'payment_debug.log');

// Ensure log directory exists
if (LOG_TO_FILE) {
  const logDir = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

export class PaymentDebugger {
  static log(method: string, stage: string, data: any) {
    if (!DEBUG_ENABLED) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${method.toUpperCase()}] [${stage}] ${JSON.stringify(data, null, 2)}`;
    
    // Console log
    console.log(logMessage);
    
    // File log
    if (LOG_TO_FILE) {
      fs.appendFileSync(LOG_FILE_PATH, logMessage + '\n');
    }
  }
  
  static logError(method: string, stage: string, error: any) {
    if (!DEBUG_ENABLED) return;
    
    const timestamp = new Date().toISOString();
    const errorDetails = error.response?.data || error.message || String(error);
    const logMessage = `[${timestamp}] [${method.toUpperCase()}] [${stage}] ERROR: ${JSON.stringify(errorDetails, null, 2)}`;
    
    // Console log (with error color)
    console.error('\x1b[31m%s\x1b[0m', logMessage);
    
    // File log
    if (LOG_TO_FILE) {
      fs.appendFileSync(LOG_FILE_PATH, logMessage + '\n');
    }
  }
  
  static getDebugInfo() {
    if (!LOG_TO_FILE || !fs.existsSync(LOG_FILE_PATH)) {
      return { logs: [] };
    }
    
    // Get last 20 log entries
    const logs = fs.readFileSync(LOG_FILE_PATH, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .slice(-20);
      
    return { logs };
  }
}
