import { BaseCommand } from '../BaseCommand'

export default class Logout extends BaseCommand {
  static description = 'Log out from your Starlight account'

  static examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    await this.logout()
  }
}
