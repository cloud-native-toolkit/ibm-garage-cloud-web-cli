
export class SonarqubeSetupResult {
  newPassword?: string;
  errorMessage?: string;
  error?: Error;
}

export class SonarqubeSetupError extends Error {
  constructor(message: string, public readonly result: SonarqubeSetupResult, public readonly cause: Error) {
    super(message);

    if (!result.errorMessage) {
      Object.assign(this.result, {errorMessage: message});
    }
    if (!result.error) {
      Object.assign(this.result, {error: cause});
    }
  }
}

export abstract class SetupSonarqube {
  abstract async setupSonarqube({url, username, password}: {url: string, username: string, password: string}): Promise<SonarqubeSetupResult>;
}
