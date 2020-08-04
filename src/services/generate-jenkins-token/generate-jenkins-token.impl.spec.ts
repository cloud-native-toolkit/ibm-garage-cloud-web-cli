import {Container} from 'typescript-ioc';
import {Browser, Page} from 'puppeteer';

import {GenerateTokenImpl} from './generate-jenkins-token.impl';
import {mockField} from '../../testHelper';
import Mock = jest.Mock;

describe('given generate-token-impl', () => {
  let classUnderTest: GenerateTokenImpl;
  beforeEach(() => {
    classUnderTest = Container.get(GenerateTokenImpl);
  });

  test('canary verifies test infrastructure', () => {
    expect(true).toEqual(true);
  });

  describe('given isAvailable()', () => {
    describe('when called', () => {
      test('then return true', async () => {
        expect(classUnderTest.isAvailable()).toEqual(true);
      });
    });
  });

  describe('given buildLoginUrl()', () => {
    describe('when called', () => {
      const url = 'baseUrl';

      test('then return {url}/login', async () => {
        expect(classUnderTest.buildLoginUrl({url}))
          .toEqual(`${url}/login`);
      });
    });
  });

  describe('given buildUserProfileUrl()', () => {
    describe('when called', () => {
      const url = 'baseUrl';
      const username = 'username';

      test('then return {url}/user/{username}/configure', async () => {
        expect(classUnderTest.buildUserProfileUrl({url, username}))
          .toEqual(`${url}/user/${username}/configure`);
      });
    });
  });

  describe('given generateToken()', () => {
    let buildDriver: Mock;
    let login: Mock;
    let genToken: Mock;
    let browser: Browser;
    let page: Page;
    const token = 'tokenValue';
    const loginUrl = 'loginUrl';
    const userProfileUrl = 'userProfileUrl';

    beforeEach(() => {
      buildDriver = mockField(classUnderTest, 'buildDriver');
      login = mockField(classUnderTest, 'login');
      genToken = mockField(classUnderTest, 'genToken').mockResolvedValue(token);

      mockField(classUnderTest, 'buildLoginUrl').mockReturnValue(loginUrl);
      mockField(classUnderTest, 'buildUserProfileUrl').mockReturnValue(userProfileUrl);

      page = {name: 'page'} as any;
      browser = {
        newPage: jest.fn().mockResolvedValue(page),
        close: jest.fn(),
      } as any;
      buildDriver.mockResolvedValue(browser);
    });

    describe('when called', () => {
      test('then genToken', async () => {
        let commandOptions = {url: 'url', username: 'username', password: 'password'};
        expect(await classUnderTest.generateToken(commandOptions)).toEqual(token);

        expect(login).toHaveBeenCalledWith(
          page,
          loginUrl,
          commandOptions.username,
          commandOptions.password);
        expect(genToken).toHaveBeenCalledWith(
          page,
          userProfileUrl);
      });
    });
  });
});
