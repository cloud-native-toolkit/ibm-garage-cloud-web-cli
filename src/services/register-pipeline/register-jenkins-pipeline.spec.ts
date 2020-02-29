import {Container} from 'typescript-ioc';

import {KubeConfigMap, KubeSecret} from '../../api/kubectl';
import {setField, providerFromValue} from '../../testHelper';
import {RegisterPipeline, RegisterJenkinsPipeline} from './register-jenkins-pipeline';
import {FsPromises} from '../../util/file-util';
import {RegisterPipelineType} from './register-pipeline-type';
import {RegisterPipelineOptions} from './register-pipeline-options.model';
import Mock = jest.Mock;
import {GitParams} from '../git-secret';

describe('register-pipeline', () => {
  test('canary verifies test infrastructure', () => {
    expect(true).toEqual(true);
  });

  describe('given RegisterPipeline', () => {
    let classUnderTest: RegisterJenkinsPipeline;

    let mock_getConfigMapData: Mock;
    let mock_getSecretData: Mock;

    beforeEach(() => {

      mock_getConfigMapData = jest.fn();
      Container.bind(KubeConfigMap).provider(providerFromValue({getData: mock_getConfigMapData}));

      mock_getSecretData = jest.fn();
      Container.bind(KubeSecret).provider(providerFromValue({getData: mock_getSecretData}));

      classUnderTest = Container.get(RegisterPipeline);
    });

    describe('executeRegisterPipeline()', () => {
      let mock_getPipelineType: Mock;
      let unset_getPipelineType: () => void;

      let mock_registerPipeline: Mock  = jest.fn();

      beforeEach(() => {
        mock_getPipelineType = jest.fn();
        unset_getPipelineType = setField(classUnderTest, 'getPipelineType', mock_getPipelineType);

        const pipeline: RegisterPipelineType = {
          registerPipeline: mock_registerPipeline,
        } as any;

        mock_getPipelineType.mockReturnValue(pipeline);
      });

      afterEach(() => {
        unset_getPipelineType();
      });

      describe('when called', () => {
        test('then get the pipeline and call registerPipeline()', async () => {
          const expectedResult = {};
          mock_registerPipeline.mockResolvedValue(expectedResult);

          const clusterType = 'clusterType' as any;
          const options: RegisterPipelineOptions = {} as any;
          const gitParams: GitParams = {} as any;
          const credentialsName = 'credentialsName';
          expect(await classUnderTest.executeRegisterPipeline(clusterType, options, gitParams, credentialsName)).toBe(expectedResult);

          expect(mock_getPipelineType).toHaveBeenCalledWith(clusterType);
          expect(mock_registerPipeline).toHaveBeenCalledWith(options, gitParams, credentialsName);
        });
      });
    });

    describe('given getClusterType()', () => {

      describe('when ibmcloud-config ConfigMap exists', () => {
        const clusterType = 'cluster_type';
        const serverUrl = 'server_url';
        beforeEach(() => {
          mock_getConfigMapData.mockResolvedValue({CLUSTER_TYPE: clusterType, SERVER_URL: serverUrl});
        });

        test('should read the cluster_type from `ibmcloud-config` ConfigMap in provided namespace', async () => {
          const namespace = 'namespace';
          const result = await classUnderTest.getClusterType(namespace);

          expect(mock_getConfigMapData).toHaveBeenCalledWith('ibmcloud-config', namespace);
          expect(result).toEqual({clusterType, serverUrl});
        });

        test('should read the cluster_type from `ibmcloud-config` ConfigMap in tools namespace if not provided', async () => {
          const clusterType = 'openshift';
          mock_getConfigMapData.mockResolvedValue({CLUSTER_TYPE: clusterType});

          await classUnderTest.getClusterType();

          expect(mock_getConfigMapData).toHaveBeenCalledWith('ibmcloud-config', 'tools');
        });

        describe('and when cluster_type is not defined', () => {
          test('should default to kubernetes', async () => {
            mock_getConfigMapData.mockResolvedValue({});

            expect(await classUnderTest.getClusterType()).toEqual({clusterType: undefined, serverUrl: undefined});
          });
        })
      });

      describe('when retrieval of ibmcloud-config ConfigMap throws an error', () => {
        beforeEach(() => {
          mock_getConfigMapData.mockRejectedValue(new Error('unable to find configmap'));
        });

        test('should try to get the cluster type from the ibmcloud-apikey Secret in provided namespace', async () => {
          const clusterType = 'expected';
          mock_getSecretData.mockResolvedValue({cluster_type: clusterType});

          const namespace = 'namespace';
          expect(await classUnderTest.getClusterType(namespace)).toEqual({clusterType});

          expect(mock_getSecretData).toHaveBeenCalledWith('ibmcloud-apikey', namespace);
        });

        test('should try to get the cluster type from the ibmcloud-apikey Secret in `tools` namespace if not provided', async () => {
          const clusterType = 'expected';
          mock_getSecretData.mockResolvedValue({cluster_type: clusterType});

          await classUnderTest.getClusterType();

          expect(mock_getSecretData).toHaveBeenCalledWith('ibmcloud-apikey', 'tools');
        });

        test('should default to `kubernetes` if cluster_type not found', async () => {
          mock_getSecretData.mockResolvedValue({});

          expect(await classUnderTest.getClusterType()).toEqual({clusterType: 'kubernetes'});
        });

        describe('and when getSecretData throws an error', () => {
          test('should default to kubernetes', async () => {
            mock_getSecretData.mockRejectedValue(new Error('secret not found'));

            expect(await classUnderTest.getClusterType()).toEqual({clusterType: 'kubernetes'});
          });
        })
      });
    });

    describe('buildCreateWebhookOptions()', () => {
      test('map GitParams to CreateWebhookOptions', () => {
        const gitParams = {
          url: 'url',
          username: 'username',
          password: 'password'
        } as any;

        const pipelineResult = {
          jenkinsUrl: 'jenkinsUrl'
        } as any;

        const result = classUnderTest.buildCreateWebhookOptions(gitParams, pipelineResult);

        expect(result.gitUrl).toEqual(gitParams.url);
        expect(result.gitUsername).toEqual(gitParams.username);
        expect(result.gitToken).toEqual(gitParams.password);
        expect(result.jenkinsUrl).toEqual(pipelineResult.jenkinsUrl);
      });
    });
  });
});