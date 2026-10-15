export class LoginSuccessEvent {
  constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly otp: string,
  ) {}
}