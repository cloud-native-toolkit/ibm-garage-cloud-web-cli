import {Container} from 'typescript-ioc';
import {Arguments, Argv} from 'yargs';
import {ArtifactoryAuth, ArtifactoryAuthOptions} from '../services/artifactory-auth';
import {LOG_CONFIG, LoggingApi, LogLevel} from '../logging';
import {CommandLineOptions} from '../model';

export const command = 'setup-artifactory';
export const desc = 'Sets up the Artifactory instance for usage in the cluster';
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
exports.handler = async (argv: Arguments<ArtifactoryAuthOptions & CommandLineOptions>) => {
  Container.bindName(LOG_CONFIG).to({logLevel: argv.debug ? LogLevel.DEBUG : LogLevel.INFO});

  const artifactoryAuth: ArtifactoryAuth = Container.get(ArtifactoryAuth);
  const logger: LoggingApi = Container.get(LoggingApi);

  logger.log('Configuring Artifactory');

  try {
    await artifactoryAuth.setupArtifactoryAuth(argv);
  } catch (err) {
    console.log('Error configuring Artifactory', err);
    process.exit(1);
  }
};
