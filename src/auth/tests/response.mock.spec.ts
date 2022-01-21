export class ResponseMock {
  public cookies = '';

  public cookie(name: string, token: string) {
    this.cookies = `${name}=${token}`;
  }
}
