
export class ArtifactorySetupResult {
  newPassword?: string;
  encryptedPassword?: string;
}

export class ArtifactorySetupError extends Error {
  constructor(message: string, public readonly result: ArtifactorySetupResult, public readonly cause: Error) {
    super(message);
  }
}

export abstract class SetupArtifactory {
  abstract async setupArtifactory({url, username, password}: {url: string, username: string, password: string}): Promise<ArtifactorySetupResult>;
}
