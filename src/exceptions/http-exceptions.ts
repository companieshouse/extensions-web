export interface IHttpException {
  status: number;
  message: string;
}

export class HttpException implements IHttpException {
  constructor(readonly status: number, readonly message: string) {}
}
