import {buildMockKubeClient, mockKubeClientProvider} from './testHelper';
import {KubeIngress} from './ingress';
import {Container} from 'typescript-ioc';
import {KubeClient} from './client';
import Mock = jest.Mock;
import {mockField} from '../../testHelper';

describe('ingress', () => {
  test('canary verifies test infrastructure', () => {
    expect(true).toEqual(true);
  });

  describe('given KubeIngress', () => {
    let classUnderTest: KubeIngress;

    beforeEach(() => {
      Container
        .bind(KubeClient)
        .provider(mockKubeClientProvider);

      classUnderTest = Container.get(KubeIngress);
    });

    describe('getHosts()', () => {
      let mock_get: Mock;
      let unset_get: () => void;

      beforeEach(() => {
        mock_get = jest.fn();
        unset_get = mockField(classUnderTest, 'get', mock_get);
      });

      afterEach(() => {
        unset_get();
      });

      describe('when the ingress exists', () => {

        describe('when single host defined on ingress', () => {
          const host = 'my-host';

          beforeEach(() => {
            mock_get.mockResolvedValue({
                spec: {
                  rules: [{
                    host
                  }]
                }
            });
          });

          test('retrieve host name', async () => {
            const namespace = 'namespace';
            const ingressName = 'ingressName';

            const actualHosts = await classUnderTest.getHosts(namespace, ingressName);

            expect(actualHosts).toEqual([host]);
            expect(mock_get).toBeCalledWith(ingressName, namespace);
          });
        });

        describe('when multiple hosts defined on ingress', () => {
          const hosts = ['my-host', 'my-host2'];

          beforeEach(() => {
            mock_get.mockResolvedValue({
              spec: {
                rules: [{
                  host: hosts[0]
                }, {
                  host: hosts[1]
                }]
              }
            });
          });

          test('retrieve host name', async () => {
            const namespace = 'namespace';
            const ingressName = 'ingressName';

            const actualHosts = await classUnderTest.getHosts(namespace, ingressName);

            expect(actualHosts).toEqual(hosts);
          });
        });

        describe('when no hosts defined on ingress', () => {
          test('throw "no hosts found" error', () => {
            mock_get.mockResolvedValue({
              spec: {
                rules: [{}, {}]
              }
            });

            return classUnderTest.getHosts('name', 'ingress')
              .then(() => fail('should throw error'))
              .catch(err => {
                expect(err.message).toEqual('no hosts found');
              });
          });
        });

        describe('when no rules defined on ingress', () => {
          test('throw "no hosts found" error', () => {
            mock_get.mockResolvedValue({
              spec: {}
            });

            return classUnderTest.getHosts('name', 'ingress')
              .then(() => fail('should throw error'))
              .catch(err => {
                expect(err.message).toEqual('no hosts found');
              });
          });
        });
      });

      describe('when the ingress does not exist', () => {
        const ingressName = 'test-ingress';
        const namespace = 'ns';

        beforeEach(() => {
          mock_get.mockReturnValue(Promise.reject(new Error(`ingresses "${ingressName}" not found`)));
        });

        test('throw ingress not found error', async () => {
          return classUnderTest.getHosts(namespace, ingressName)
            .then(() => fail('should throw error'))
            .catch(err => {

              expect(err.message).toEqual(`ingresses "${ingressName}" not found`);

              expect(mock_get).toBeCalledWith(ingressName, namespace);
            });
        });
      });
    });
  });
});