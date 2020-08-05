import {Container, Inject} from 'typescript-ioc';
import {
  KubeConfigMap,
  KubeSecret,
  Secret
} from '@ibmgaragecloud/cloud-native-toolkit-cli/dist/api/kubectl';
import {KubeBackend} from '@ibmgaragecloud/cloud-native-toolkit-cli/dist/api/kubectl/client.api';

import {ArtifactoryAuth, ArtifactoryAuthOptions} from './artifactory-auth.api';
import {ArtifactorySetupError, ArtifactorySetupResult, SetupArtifactory} from '../artifactory-setup';
import {
  DefaultBackend,
  InClusterBackend,
} from '@ibmgaragecloud/cloud-native-toolkit-cli/dist/api/kubectl/client.backend';
import {LoggingApi} from '../../logging';

interface ArtifactorySecretData {
  ARTIFACTORY_URL?: string;
  ARTIFACTORY_USER: string;
  ARTIFACTORY_PASSWORD: string;
  ARTIFACTORY_ENCRYPT?: string;
}

export class ArtifactoryAuthImpl implements ArtifactoryAuth {
  @Inject
  kubeConfigMap: KubeConfigMap;
  @Inject
  kubeSecret: KubeSecret;
  @Inject
  artifactory: SetupArtifactory;
  @Inject
  logger: LoggingApi;

  async setupArtifactoryAuth({namespace = 'tools', inCluster = false}: ArtifactoryAuthOptions): Promise<void> {

    this.configureKubernetesBackend(inCluster);

    const config: {url: string, username: string, password} = await this.getArtifactoryUrlAndCredentials(namespace, inCluster);

    this.logger.log('Retrieved Artifactory config: ', Object.assign({}, config, {password: !!config.password ? 'xxxx' : ''}));

    const credentials: ArtifactorySetupResult = await this.artifactory.setupArtifactory(config).catch(err => {
      if (err instanceof ArtifactorySetupError) {
        return err.result;
      } else {
        return {};
      }
    });

    this.logger.log('Updated Artifactory credentials: ', credentials);

    if (credentials.newPassword) {
      this.logger.log('Updating Artifactory credentials: ', credentials);

      await this.updateArtifactoryCredentials(namespace, credentials);
    }
  }

  configureKubernetesBackend(inCluster: boolean) {
    if (inCluster) {
      Container.bind(KubeBackend).to(InClusterBackend);
    } else {
      Container.bind(KubeBackend).to(DefaultBackend);
    }
  }

  async getArtifactoryUrlAndCredentials(namespace: string, inCluster: boolean): Promise<{url: string, username: string, password: string}> {
    const result: {url: string, username: string, password: string} = await this.kubeSecret
      .getData<ArtifactorySecretData>('artifactory-access', namespace)
      .then(d => ({url: d.ARTIFACTORY_URL, username: d.ARTIFACTORY_USER, password: d.ARTIFACTORY_PASSWORD}));

    if (inCluster && result.url) {
      return result;
    }

    const publicUrl = await this.kubeConfigMap
      .getData<{ARTIFACTORY_URL: string}>('artifactory-config', namespace)
      .then(d => d.ARTIFACTORY_URL);

    return Object.assign({}, result, {url: publicUrl});
  }

  async updateArtifactoryCredentials(namespace: string, credentials: ArtifactorySetupResult) {
    const secret: Secret = await this.kubeSecret.get('artifactory-access', namespace);

    const updatedSecret = Object.assign(
      {},
      secret,
      {
        data: this.updateSecretData(secret.data, credentials)
      },
    );

    await this.kubeSecret.update('artifactory-access', {body: updatedSecret}, namespace);
  }

  updateSecretData(data: ArtifactorySecretData, credentials: ArtifactorySetupResult): ArtifactorySecretData {
    return Object.assign(
      {},
      data,
      {
        ARTIFACTORY_PASSWORD: Buffer.from(credentials.newPassword).toString('base64'),
        ARTIFACTORY_ENCRYPT: Buffer.from(credentials.encryptedPassword).toString('base64'),
      },
    );
  }
}