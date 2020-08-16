
export class ArtifactorySetupResult {
  newPassword?: string;
  encryptedPassword?: string;
  errorMessage?: string;
  error?: Error;
}

export class ArtifactorySetupError extends Error {
  constructor(message: string, public readonly result: ArtifactorySetupResult, public readonly cause: Error) {
    super(message);

    if (!result.errorMessage) {
      Object.assign(this.result, {errorMessage: message});
    }
    if (!result.error) {
      Object.assign(this.result, {error: cause});
    }
  }
}

export abstract class SetupArtifactory {
  abstract async setupArtifactory({url, publicUrl, username, password}: {url: string, publicUrl: string, username: string, password: string}): Promise<ArtifactorySetupResult>;
}
