export class LoggingImpl {
  log(message: string, ...objects: object[]) {
    console.log(message, ...objects);
  }
}
