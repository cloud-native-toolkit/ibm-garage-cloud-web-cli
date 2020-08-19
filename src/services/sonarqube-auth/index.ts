import {Container} from 'typescript-ioc';
import {SonarqubeAuth} from './sonarqube-auth.api';
import {SonarqubeAuthImpl} from './sonarqube-auth.impl';

export * from './sonarqube-auth.api';

Container.bind(SonarqubeAuth).to(SonarqubeAuthImpl);
