import {HttpException} from "./http-exceptions";

export class HttpNotFound extends HttpException {
  constructor(message: string) {
    super(404, message);
  }
}
