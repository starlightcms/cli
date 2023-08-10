import { BaseCommand } from '../BaseCommand'

export default class Login extends BaseCommand {
  static description = 'Log in with your Starlight account'

  static examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    const [email, loginData] = await this.login()

    await this.setAuthData({
      email,
      token: loginData.token,
    })

    this.log('✅ You logged in.')
  }
}
