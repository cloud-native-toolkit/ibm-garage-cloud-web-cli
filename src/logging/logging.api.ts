export abstract class LoggingApi {
  abstract log(message: string, ...objects: object[]);
}
