import {Container} from 'typescript-ioc';
import {KubeBackend} from '@ibmgaragecloud/cloud-native-toolkit-cli/dist/api/kubectl/client.api';
import {
  DefaultBackend,
  InClusterBackend
} from '@ibmgaragecloud/cloud-native-toolkit-cli/dist/api/kubectl/client.backend';

export function configureKubernetesBackend(inCluster: boolean) {
  if (inCluster) {
    Container.bind(KubeBackend).to(InClusterBackend);
  } else {
    Container.bind(KubeBackend).to(DefaultBackend);
  }
}
