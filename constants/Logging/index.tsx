import { LOG_ENABLED } from '../Config';
export const LogColors = {
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Dim: '\x1b[2m',
  Underscore: '\x1b[4m',
  Blink: '\x1b[5m',
  Reverse: '\x1b[7m',
  Hidden: '\x1b[8m',
  FgBlack: '\x1b[30m',
  FgRed: '\x1b[31m',
  FgGreen: '\x1b[32m',
  FgYellow: '\x1b[33m',
  FgBlue: '\x1b[34m',
  FgMagenta: '\x1b[35m',
  FgCyan: '\x1b[36m',
  FgWhite: '\x1b[37m',
  BgBlack: '\x1b[40m',
  BgRed: '\x1b[41m',
  BgGreen: '\x1b[42m',
  BgYellow: '\x1b[43m',
  BgBlue: '\x1b[44m',
  BgMagenta: '\x1b[45m',
  BgCyan: '\x1b[46m',
  BgWhite: '\x1b[47m',
} as const;
export type ConsoleColors = keyof typeof LogColors;
const MessageToIgnore: string[] = []; // ['useFetchAndCache', 'useFetch'];
class Logging {
  public static Logger = new Logging();
  private LogEnabled: boolean;
  private constructor(LogEnabled = LOG_ENABLED) {
    this.LogEnabled = LogEnabled;
  }
  public enableLog(enabled: boolean) {
    this.LogEnabled = enabled;
  }
  public error(message?: any, ...optionalParams: any[]): void {
    if (this.LogEnabled) console.error(message, ...optionalParams);
  }
  public info(message?: any, ...optionalParams: any[]): void {
    if (this.LogEnabled) console.info(message, ...optionalParams);
  }
  public log(message?: any, ...optionalParams: any[]): void {
    for (const ignore of MessageToIgnore) if (message?.includes(ignore) || (optionalParams && optionalParams[0]?.includes(ignore))) return;
    if (this.LogEnabled) console.log(message, ...optionalParams);
  }
  public logColor(color: ConsoleColors, message?: any, ...optionalParams: any[]): void {
    this.log(LogColors[color], message, ...optionalParams, LogColors.Reset);
  }
  public logColorFirst(color: ConsoleColors, message?: any, ...optionalParams: any[]): void {
    this.log(LogColors[color], message, LogColors.Reset, ...optionalParams);
  }
  public warn(message?: any, ...optionalParams: any[]): void {
    if (this.LogEnabled) console.warn(message, ...optionalParams);
  }
  public trace(message?: any, ...optionalParams: any[]): void {
    if (this.LogEnabled) console.trace(message, ...optionalParams);
  }
  public debug(message?: any, ...optionalParams: any[]): void {
    if (this.LogEnabled) console.debug(message, ...optionalParams);
  }
}
export default Logging;
