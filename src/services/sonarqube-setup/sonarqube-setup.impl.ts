import {SetupSonarqube, SonarqubeSetupError, SonarqubeSetupResult} from './sonarqube-setup.api';
import {Inject} from 'typescript-ioc';
import {LoggingApi} from '../../logging';
import {Browser, launch, Page} from 'puppeteer';
import {timer} from '@ibmgaragecloud/cloud-native-toolkit-cli/dist/util/timer';
import * as generator from 'generate-password';

export class SonarqubeSetupImpl implements SetupSonarqube {
  @Inject
  logger: LoggingApi;

  async setupSonarqube({url, username, password}: { url: string; username: string; password: string }): Promise<SonarqubeSetupResult> {

    const browser: Browser = await this.buildDriver();

    const result: SonarqubeSetupResult = {};
    try {
      const page: Page = await this.login(browser, url, username, password);

      await timer(1000);

      const {newPassword} = await this.updatePassword(page, url, password);

      return {newPassword};
    } catch (err) {
      throw new SonarqubeSetupError('Error setting up SonarQube', result, err)
    } finally {
      await browser.close();
    }
  }

  async buildDriver() {
    return launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: {
        width: 1024,
        height: 768,
      },
    });
  }

  private async login(browser: Browser, url: string, username: string, password: string): Promise<Page> {
    const loginUrl = `${url}/sessions/new`;

    this.logger.log(`Logging into SonarQube: ${loginUrl}`);

    const page: Page = await browser.newPage();

    try {
      await page.goto(loginUrl);
    } catch (err) {
      await timer(2000);

      await page.goto(loginUrl);
    }

    await timer(2000);

    await this.logger.snapshot(page, 'login-before');

    await page.focus('input[name=login]');
    await page.keyboard.type(username);
    await page.focus('input[name=password]');
    await page.keyboard.type(password);

    await this.logger.snapshot(page, 'login-after');

    await page.click('button[type=submit]')

    return page;
  }

  private async updatePassword(page: Page, url: string, password: string): Promise<{newPassword: string}> {
    const adminUrl = `${url}/admin/users`;

    this.logger.log(`Changing password: ${adminUrl}`);

    try {
      await page.goto(adminUrl);
    } catch (err) {
      await timer(2000);

      await page.goto(adminUrl);
    }

    await timer(2000);

    await this.logger.snapshot(page, 'set-password-before');

    await page.click('button.dropdown-toggle');

    await timer(1000);

    await page.click('a.js-user-change-password');

    await timer(1000);

    const newPassword = generator.generate({
      length: 20,
      uppercase: true,
      lowercase: true,
      symbols: true
    });

    await page.focus('input[name=old-password]');
    await page.keyboard.type(password);
    await page.focus('input[name=password]');
    await page.keyboard.type(newPassword);
    await page.focus('input[name=confirm-password]');
    await page.keyboard.type(newPassword);

    await this.logger.snapshot(page, 'set-password-after');

    await page.click('button[type=submit]')

    return {newPassword};
  }
}