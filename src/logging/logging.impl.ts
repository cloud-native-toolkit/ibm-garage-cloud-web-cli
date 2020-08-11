import {LOG_CONFIG, LoggingApi, LoggingConfig, LogLevel} from './logging.api';
import {Page} from 'puppeteer';
import {InjectValue} from 'typescript-ioc';
import {existsSync, promises as fs} from 'fs';

export class LoggingImpl implements LoggingApi {
  private snapshotCounter = 0;
  private snapshotPath: string = 'screenshots';
  private logLevel: LogLevel = LogLevel.INFO;

  constructor(@InjectValue(LOG_CONFIG) config: LoggingConfig = {}) {
    Object.assign(this, config);
  }

  log(message: string, ...objects: object[]) {
    if (this.logLevel >= LogLevel.INFO) {
      console.log(message, ...objects);
    }
  }

  debug(message: string, ...objects: object[]) {
    if (this.logLevel >= LogLevel.DEBUG) {
      console.log(message, ...objects);
    }
  }

  async snapshot(page: Page, title: string) {
    if (this.logLevel >= LogLevel.DEBUG) {
      if (!existsSync(this.snapshotPath)) {
        await fs.mkdir(this.snapshotPath);
      }

      await page.screenshot({path: `${this.snapshotPath}/${++this.snapshotCounter}-${title}.png`, type: 'png'});
    }
  }
}
