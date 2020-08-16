import {Inject} from 'typescript-ioc';
import {Browser, JSHandle, launch, Page} from 'puppeteer';
import * as generator from 'generate-password';
import {timer} from '@ibmgaragecloud/cloud-native-toolkit-cli/dist/util/timer';

import {ArtifactorySetupError, ArtifactorySetupResult} from './artifactory-setup.api';
import {LoggingApi} from '../../logging';

export class SetupArtifactoryImpl {
  @Inject
  loggingApi: LoggingApi;

  async setupArtifactory({url, username, password}: {url: string, username: string, password: string}): Promise<ArtifactorySetupResult> {

    const browser: Browser = await this.buildDriver();

    const result: ArtifactorySetupResult = {};
    try {
      const page: Page = await this.login(browser, url, username, password);

      await timer(1000);

      const handle: JSHandle = await page.evaluateHandle(() => {
        return document.querySelector<HTMLInputElement>('.welcome-content .primary-message').innerHTML;
      });
      this.loggingApi.log('Current page: ', ((await handle.jsonValue()) as any).trim());

      const {newPassword} = await this.completeWelcomeWizard(page, url);
      result.newPassword = newPassword;

      await this.allowAnonymousAccess(page, url);

      const {encryptedPassword} = await this.getEncryptedPassword(page, url, newPassword);
      result.encryptedPassword = encryptedPassword;

      return result;
    } catch (err) {
      throw new ArtifactorySetupError('Error setting up Artifactory', result, err)
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

  async login(browser: Browser, url: string, username: string, password: string): Promise<Page> {
    const loginUrl = `${url}/ui/login`;

    this.loggingApi.log(`Logging into Artifactory: ${loginUrl}`);

    const page: Page = await browser.newPage();

    try {
      await page.goto(loginUrl);
    } catch (err) {
      await timer(3000);

      await page.goto(loginUrl);
    }

    await timer(2000);

    await this.loggingApi.snapshot(page, 'login-before');

    await page.focus('input[name=username]');
    await page.keyboard.type(username);
    await page.focus('input[name=password]');
    await page.keyboard.type(password);

    await this.loggingApi.snapshot(page, 'login-after');

    await page.click('button[type=submit]')

    return page;
  }

  async completeWelcomeWizard(page: Page, url: string): Promise<{newPassword: string}> {
    this.loggingApi.log(`Starting Artifactory wizard`);

    await this.clickGetStarted(page);

    const newPassword = await this.resetAdminPassword(page);

    await this.setBaseUrl(page, url);

    await this.skipConfigureProxy(page);

    await this.createRepositories(page);

    await this.completeWizard(page);

    return {newPassword};
  }

  async clickGetStarted(page: Page) {

    const handle: JSHandle = await page.evaluateHandle(() => {
      return document.querySelector<HTMLInputElement>('.primary-message').innerText;
    });
    this.loggingApi.log('On page: ' + (await handle.jsonValue()) as string)

    this.loggingApi.log(`Getting started`);

    await this.loggingApi.snapshot(page, 'getting-started-before');
    await page.click('button.get-started');

    await timer(1000);

    await this.loggingApi.snapshot(page, 'getting-started-after');
  }

  async resetAdminPassword(page: Page): Promise<string> {

    await timer(1000);

    const handle: JSHandle = await page.evaluateHandle(() => {
      return document.querySelector<HTMLElement>('.step-wrapper .title').innerText;
    });

    this.loggingApi.log('On page: ' + await handle.jsonValue());

    this.loggingApi.log(`Resetting admin password`);

    const newPassword = generator.generate({
      length: 20,
      uppercase: true,
      lowercase: true,
      symbols: true
    });

    await this.loggingApi.snapshot(page, 'reset-password-before');
    await page.focus('input[type=password]');

    await page.keyboard.type(newPassword);
    await page.keyboard.press('Tab');
    await page.keyboard.type(newPassword);

    await this.loggingApi.snapshot(page, 'reset-password-after');

    await page.click('button.el-button--primary');

    await timer(1000);

    return newPassword;
  }

  async setBaseUrl(page: Page, url: string) {

    await timer(1000);

    const handle: JSHandle = await page.evaluateHandle(() => {
      return document.querySelector<HTMLElement>('.step-wrapper .title').innerText;
    });

    this.loggingApi.log('On page: ' + await handle.jsonValue());

    this.loggingApi.log(`Setting base url: ` + url);

    await this.loggingApi.snapshot(page, 'set-base-url-before');

    await page.focus('.base-url-wrapper input');
    await page.keyboard.type(url);

    await this.loggingApi.snapshot(page, 'set-base-url-mid');
    await page.click('.el-footer button.el-button--primary');

    await timer(1000);

    await this.loggingApi.snapshot(page, 'set-base-url-after');
  }

  async skipConfigureProxy(page: Page) {

    await timer(1000);

    const handle: JSHandle = await page.evaluateHandle(() => {
      return document.querySelector<HTMLElement>('.step-wrapper .title').innerText;
    });

    this.loggingApi.log('On page: ' + await handle.jsonValue());

    this.loggingApi.log(`Skip configure proxy`);

    await this.loggingApi.snapshot(page, 'configure-proxy-before');
    await page.evaluateHandle(() => {
      const skipButtonIndex  = 1;
      document.querySelectorAll<HTMLInputElement>('button.el-button--secondary')
        .item(skipButtonIndex)
        .click();
    });

    await this.loggingApi.snapshot(page, 'configure-proxy-after');
  }

  async createRepositories(page: Page) {

    await timer(1000);

    const handle: JSHandle = await page.evaluateHandle(() => {
      return document.querySelector<HTMLElement>('.step-wrapper .title').innerText;
    });

    this.loggingApi.log('On page: ' + await handle.jsonValue());

    this.loggingApi.log(`Create repositories`);

    await this.loggingApi.snapshot(page, 'create-repositories-before');
    await page.evaluateHandle(() => {
      document.querySelectorAll<HTMLInputElement>('input[type=checkbox]')
        .forEach(e => e.click());
    });

    await this.loggingApi.snapshot(page, 'create-repositories-mid');

    await page.click('button.el-button--primary');

    await this.loggingApi.snapshot(page, 'create-repositories-after');

    await timer(1000);
  }

  async completeWizard(page: Page) {

    await timer(1000);

    const handle: JSHandle = await page.evaluateHandle(() => {
      return document.querySelector<HTMLElement>('.step-wrapper .title').innerText;
    });

    this.loggingApi.log('On page: ' + await handle.jsonValue());

    this.loggingApi.log(`Complete wizard`);

    await this.loggingApi.snapshot(page, 'complete-wizard-before');

    await page.click('button.el-button--primary');

    await timer(1000);

    await this.loggingApi.snapshot(page, 'complete-wizard-after');
  }

  async allowAnonymousAccess(page: Page, url: string) {
    const securityConfigUrl = `${url}/ui/admin/configuration/security/general`;

    this.loggingApi.log(`Setting 'Allow anonymous access': ${securityConfigUrl}`);

    await page.goto(securityConfigUrl);

    await timer(1500);

    await this.loggingApi.snapshot(page, 'allow-anonymous-access-before');

    await page.evaluateHandle(() => {
      document.querySelectorAll<HTMLInputElement>('input[type=checkbox]')
        .item(0)
        .click();
    });

    await timer(500);

    await this.loggingApi.snapshot(page, 'allow-anonymous-access-mid');

    await page.click('.main-card-content-footer button.el-button--primary');

    await this.loggingApi.snapshot(page, 'allow-anonymous-access-after');
  }

  private async getEncryptedPassword(page: Page, url: string, password: string): Promise<{encryptedPassword: string}> {
    const userProfileUrl = `${url}/ui/admin/artifactory/user_profile`;

    this.loggingApi.log(`Retrieving encrypted password: ${userProfileUrl}`);

    await page.goto(userProfileUrl);

    await timer(2000);

    await this.loggingApi.snapshot(page, 'retrieve-encrypted-password-login-before');
    await page.focus('input[name=password]');

    await page.keyboard.type(password);
    // log in to page
    await page.evaluateHandle(() => {
      document.querySelectorAll<HTMLInputElement>('button.btn-primary')
        .item(1)
        .click();
    });

    await this.loggingApi.snapshot(page, 'retrieve-encrypted-password-login-after');

    await timer(500);

    // show encrypted password
    await page.click('i.jf-reveal-input');

    await this.loggingApi.snapshot(page, 'retrieve-encrypted-password-show-password');

    const handle: JSHandle = await page.evaluateHandle(() => {
      return document.querySelector<HTMLInputElement>('input[name=password]').value;
    });

    const encryptedPassword: string = await handle.jsonValue() as string;

    return {encryptedPassword};
  }
}
