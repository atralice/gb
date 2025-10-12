export class UnexpectedHttpResponseCodeError extends Error {
  constructor(statusCode: number, responseBody: string) {
    super(
      `Unexpected HTTP response code: ${statusCode}, Response body: ${responseBody}`
    );
    this.name = "UnexpectedHttpResponseCodeError";
  }
}
