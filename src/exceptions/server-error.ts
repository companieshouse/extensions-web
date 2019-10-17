import {HttpException} from "./http-exceptions";

export class HttpServerError extends HttpException {
  constructor(message: string) {
    super(500, message);
  }
}
