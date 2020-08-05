export interface ArtifactoryAuthOptions {
  inCluster?: boolean;
  namespace?: string;
}

export abstract class ArtifactoryAuth {
  abstract async setupArtifactoryAuth(options: ArtifactoryAuthOptions): Promise<void>;
}
