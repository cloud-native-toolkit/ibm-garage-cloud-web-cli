import {Container} from 'typescript-ioc';
import {ArtifactoryAuth} from './artifactory-auth.api';
import {ArtifactoryAuthImpl} from './artifactory-auth.impl';

export * from './artifactory-auth.api';

Container.bind(ArtifactoryAuth).to(ArtifactoryAuthImpl);
