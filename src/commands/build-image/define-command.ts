import {DefaultOptionBuilder, YargsCommandDefinition} from '../../util/yargs-support';
import {Arguments, Argv, CommandModule} from 'yargs';
import {generateToken, GenerateTokenOptions} from '../generate-token';
import {BuildOptions} from './build-options.model';
import {CommandLineOptions} from '../../model';
import {buildImage} from './build-image';

export const defineBuildImageCommand: YargsCommandDefinition = <T>(command: string, describe: string): CommandModule<T> => {
  return {
    command,
    describe,
    builder: (argv: Argv<any>) => new DefaultOptionBuilder(argv).baseOptions().build(),
    handler: async (argv: Arguments<BuildOptions & CommandLineOptions>) => {
      if (argv.debug) {
        console.log('arguments', argv);
      }

      try {
        const {stdout, stderr} = await buildImage(argv);

        if (!argv.quiet) {
          console.log(stdout);
          console.log(stderr);
        }
      } catch (error) {
        console.log('error', error);
        process.exit(1);
      }
    },
  };
};