export class ErrorResponse extends Error {
  public statusCode: number;

  constructor(statusCode: number | string, msg: string) {
    super(msg);
    this.statusCode = typeof statusCode === 'number' ? statusCode : parseInt(statusCode, 10) || 500;
  }
}
