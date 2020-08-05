import {Container} from 'typescript-ioc';
import {LoggingApi} from './logging.api';
import {LoggingImpl} from './logging.impl';

Container.bind(LoggingApi).to(LoggingImpl);

export * from './logging.api';
