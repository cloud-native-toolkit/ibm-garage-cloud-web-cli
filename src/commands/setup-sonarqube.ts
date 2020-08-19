import {Container} from 'typescript-ioc';
import {Arguments, Argv} from 'yargs';

import {SonarqubeAuth, SonarqubeAuthOptions} from '../services/sonarqube-auth';
import {LOG_CONFIG, LoggingApi, LogLevel} from '../logging';
import {CommandLineOptions} from '../model';

export const command = 'setup-sonarqube';
export const desc = 'Resets the password for the SonarQube instance';
export const builder = (yargs: Argv<any>) => {
  return yargs
    .options('namespace', {
      alias: 'n',
      type: 'string',
      description: 'The namespace where the Artifactory secret has been created',
      default: 'tools'
    })
    .options('debug', {
      type: 'boolean',
      description: 'Flag to turn on debug logging and screenshots',
    })
    .options('inCluster', {
      type: 'boolean',
      description: 'Flag indicating that the command will be run from a pod in the cluster (impacts kube configuration and which url to use)',
      required: false
    });
};
exports.handler = async (argv: Arguments<SonarqubeAuthOptions & CommandLineOptions>) => {
  Container.bindName(LOG_CONFIG).to({logLevel: argv.debug ? LogLevel.DEBUG : LogLevel.INFO});

  const sonarqubeAuth: SonarqubeAuth = Container.get(SonarqubeAuth);
  const logger: LoggingApi = Container.get(LoggingApi);

  logger.log('Configuring SonarQube');

  try {
    await sonarqubeAuth.setupSonarqubeAuth(argv);
  } catch (err) {
    console.log('Error configuring SonarQube', err);
    process.exit(1);
  }
};
