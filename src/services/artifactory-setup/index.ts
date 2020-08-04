import {Container} from 'typescript-ioc';
import {SetupArtifactory} from './artifactory-setup.api';
import {SetupArtifactoryImpl} from './artifactory-setup.impl';

export * from './artifactory-setup.api';

Container.bind(SetupArtifactory).to(SetupArtifactoryImpl);
