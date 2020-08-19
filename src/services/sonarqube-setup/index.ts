import {Container} from 'typescript-ioc';
import {SetupSonarqube} from './sonarqube-setup.api';
import {SonarqubeSetupImpl} from './sonarqube-setup.impl';

export * from './sonarqube-setup.api';

Container.bind(SetupSonarqube).to(SonarqubeSetupImpl);
