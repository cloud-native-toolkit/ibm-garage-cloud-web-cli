export interface SonarqubeAuthOptions {
  inCluster?: boolean;
  namespace?: string;
}

export abstract class SonarqubeAuth {
  abstract async setupSonarqubeAuth(options: SonarqubeAuthOptions): Promise<void>;
}
