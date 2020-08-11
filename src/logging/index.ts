import {Container, Scope} from 'typescript-ioc';
import {LoggingApi} from './logging.api';
import {LoggingImpl} from './logging.impl';

Container.bind(LoggingApi).to(LoggingImpl).scope(Scope.Singleton);

export * from './logging.api';
