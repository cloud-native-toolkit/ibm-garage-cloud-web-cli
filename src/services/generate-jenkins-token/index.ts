import {Container} from 'typescript-ioc';
import {GenerateToken} from './generate-jenkins-token.api';
import {GenerateTokenImpl} from './generate-jenkins-token.impl';

export * from './generate-jenkins-token.api';
export * from './generate-jenkins-token-options.model';

Container.bind(GenerateToken).to(GenerateTokenImpl);
