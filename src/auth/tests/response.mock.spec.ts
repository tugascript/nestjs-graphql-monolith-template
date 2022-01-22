export class ResponseMock {
  public cookies = '';
  public options: any;

  public cookie(name: string, token: string, options?: any) {
    this.cookies = `${name}=${token}`;
    if (options) this.options = options;
  }
}
