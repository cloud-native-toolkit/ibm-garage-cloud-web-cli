import {Page} from 'puppeteer';

export const LOG_CONFIG = 'LOG_CONFIG';

export enum LogLevel {
  INFO = 0,
  DEBUG = 1,
}

export interface LoggingConfig {
  snapshotPath?: string,
  logLevel?: LogLevel;
}

export abstract class LoggingApi {
  abstract log(message: string, ...objects: object[]);
  abstract debug(message: string, ...objects: object[]);
  abstract async snapshot(page: Page, title: string);
}
