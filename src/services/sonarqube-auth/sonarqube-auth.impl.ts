import {Inject} from 'typescript-ioc';
import {KubeConfigMap, KubeSecret, Secret} from '@ibmgaragecloud/cloud-native-toolkit-cli/dist/api/kubectl';

import {SonarqubeAuth, SonarqubeAuthOptions} from './sonarqube-auth.api';
import {SetupSonarqube, SonarqubeSetupError, SonarqubeSetupResult} from '../sonarqube-setup';
import {LoggingApi} from '../../logging';
import {configureKubernetesBackend} from '../../util/configure-kubernetes-backend';

interface SonarqubeSecretData {
  SONARQUBE_URL?: string;
  SONARQUBE_USER: string;
  SONARQUBE_PASSWORD: string;
}

const SECRET_NAME = 'sonarqube-access';
const CONFIG_NAME = 'sonarqube-config';

export class SonarqubeAuthImpl implements SonarqubeAuth {
  @Inject
  kubeConfigMap: KubeConfigMap;
  @Inject
  kubeSecret: KubeSecret;
  @Inject
  sonarqube: SetupSonarqube;
  @Inject
  logger: LoggingApi;

  async setupSonarqubeAuth({namespace = 'tools', inCluster = false}: SonarqubeAuthOptions): Promise<void> {

    configureKubernetesBackend(inCluster);

    const config: {url: string, username: string, password: string} = await this.getSonarqubeUrlAndCredentials(namespace, inCluster);

    this.logger.log('Retrieved SonarQube config: ', Object.assign({}, config, {password: !!config.password ? 'xxxx' : ''}));

    const credentials: SonarqubeSetupResult = await this.sonarqube.setupSonarqube(config).catch(err => {
      this.logger.debug('Error setting up Sonarqube: ', err);

      if (err instanceof SonarqubeSetupError) {
        return err.result;
      } else {
        return {};
      }
    });

    if (credentials.newPassword) {
      this.logger.log('Updating SonarQube credentials');

      await this.updateSonarqubeCredentials(namespace, credentials);
    } else {
      this.logger.log('No credentials to update', credentials);
    }
  }

  async getSonarqubeUrlAndCredentials(namespace: string, inCluster: boolean): Promise<{url: string, username: string, password: string}> {
    const result: {url: string, username: string, password: string} = await this.kubeSecret
      .getData<SonarqubeSecretData>(SECRET_NAME, namespace)
      .then(d => ({url: d.SONARQUBE_URL, username: d.SONARQUBE_USER, password: d.SONARQUBE_PASSWORD}));

    if (result.url) {
      return result;
    }

    const publicUrl = await this.kubeConfigMap
      .getData<{SONARQUBE_URL: string}>(CONFIG_NAME, namespace)
      .then(d => d.SONARQUBE_URL);

    return Object.assign({}, result, {url: publicUrl});
  }

  async updateSonarqubeCredentials(namespace: string, credentials: SonarqubeSetupResult) {
    const secret: Secret = await this.kubeSecret.get(SECRET_NAME, namespace);

    const updatedSecret = Object.assign(
      {},
      secret,
      {
        data: this.updateSecretData(secret.data, credentials)
      },
    );

    await this.kubeSecret.update(SECRET_NAME, {body: updatedSecret}, namespace);
  }

  updateSecretData(data: SonarqubeSecretData, credentials: SonarqubeSetupResult): SonarqubeSecretData {
    return Object.assign(
      {},
      data,
      {
        SONARQUBE_PASSWORD: Buffer.from(credentials.newPassword).toString('base64'),
      },
    );
  }
}
