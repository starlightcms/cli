import { Command, ux } from '@oclif/core'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import got, { HTTPError } from 'got'
import { input, password } from '@inquirer/prompts'
import chalk from 'chalk'
import { LoginResponseData } from './types/adminApi'

type LoginMethod = 'password' | 'email-code'

type AuthData = {
  email: string
  token: string
}

export abstract class BaseCommand extends Command {
  public readonly ADMIN_API_URL = 'https://admin.starlightcms.io/v2'

  public exitWithError(
    message?: string,
    originalError?: Error,
    exitCode = 1,
  ): never {
    // Stop any running spinners.
    ux.action.stop('failed')

    this.log(`🛑 Error: ${message ?? 'an unknown error occurred.'}`)

    if (originalError) {
      this.log('⚠️ Original error message:')
      this.error(originalError ?? '', { exit: exitCode })
    }

    this.exit(exitCode)
  }

  private getStarlightFolderPath(): string {
    return path.join(os.homedir(), '.starlight')
  }

  private getAuthFilePath(): string {
    return path.join(this.getStarlightFolderPath(), 'auth')
  }

  public async getAuthData(): Promise<AuthData | false> {
    try {
      const data = await fs.readFile(this.getAuthFilePath(), {
        encoding: 'utf8',
      })

      return JSON.parse(Buffer.from(data, 'base64').toString('utf8'))
    } catch {
      return false
    }
  }

  public async setAuthData(data: AuthData): Promise<void> {
    try {
      const encodedData = Buffer.from(JSON.stringify(data)).toString('base64')

      try {
        await fs.mkdir(this.getStarlightFolderPath())
      } catch (error: any) {
        // Ignore "file already exists" error.
        if (error.code !== 'EEXIST') {
          throw error
        }
      }

      await fs.writeFile(this.getAuthFilePath(), encodedData)
    } catch (error: any) {
      this.exitWithError(
        'something went wrong while trying to write authentication data to disk.',
        error,
      )
    }
  }

  private async validateToken(data: AuthData): Promise<boolean> {
    try {
      const response = await got.get(`${this.ADMIN_API_URL}/auth/me`, {
        headers: {
          Cookie: `token=${data.token}`,
        },
      })

      return response.statusCode === 200
    } catch (error: any) {
      // Unauthorized response is expected when the token is invalid or expired
      if (error instanceof HTTPError && error.response.statusCode === 401) {
        // Try to refresh the token
        try {
          const response = await got
            .post(`${this.ADMIN_API_URL}/auth/refresh`, {
              headers: {
                Cookie: `token=${data.token}`,
              },
            })
            .json<LoginResponseData>()

          await this.setAuthData({ email: data.email, token: response.token })
          return true
        } catch {
          // Token expired, no-op
        }

        return false
      }

      throw error
    }
  }

  private async checkAccount(
    initialEmail?: string,
  ): Promise<[string, LoginMethod]> {
    let email = initialEmail
    let method: 'password' | 'email-code' | undefined

    /* eslint-disable no-await-in-loop --
     * It's okay to await here since the loop's purpose
     * is to let the user retry in case of a failure.
     */
    while (!email || !method) {
      email = await input({
        message: 'Your e-mail address',
        default: email,
        validate: (value) => {
          if (
            /^[\w!#$%&'*+./=?^`{|}~-]+@[\dA-Za-z](?:[\dA-Za-z-]{0,61}[\dA-Za-z])?(?:\.[\dA-Za-z](?:[\dA-Za-z-]{0,61}[\dA-Za-z])?)*$/.test(
              value,
            )
          ) {
            return true
          }

          return 'This e-mail address is invalid.'
        },
      })

      try {
        const response = await got
          .post(`${this.ADMIN_API_URL}/auth/check`, {
            json: { email },
          })
          .json<{ method: LoginMethod }>()

        method = response.method
      } catch (error: any) {
        if (error instanceof HTTPError) {
          switch (error.response.statusCode) {
            case 403:
              this.log(
                '⛔️ Your email address is not verified. Check your inbox for a verification email and try again.',
              )
              continue
            case 404:
              this.log(
                "⛔️ There's no account associated with this e-mail address. Check for typos and try again.",
              )
              this.log(
                chalk.gray('Tip: press TAB to edit the initial value below.'),
              )
              continue
          }
        }

        this.exitWithError(
          'something went wrong while checking your account status.',
          error,
        )
      }
    }
    /* eslint-enable no-await-in-loop */

    return [email, method]
  }

  private async logUserIn(
    email: string,
    method: LoginMethod,
  ): Promise<LoginResponseData | false> {
    try {
      const payload: Record<string, any> = { email }

      if (method === 'password') {
        payload.password = await password({
          message: 'Your password',
        })
      } else {
        payload.code = await input({
          message: 'Your one-time code',
        })
      }

      return await got
        .post(
          `${this.ADMIN_API_URL}/auth/${
            method === 'password' ? 'login' : 'code'
          }`,
          {
            json: payload,
          },
        )
        .json<LoginResponseData>()
    } catch (error: any) {
      if (error instanceof HTTPError && error.response.statusCode === 401) {
        return false
      }

      this.exitWithError('something went wrong while logging you in.', error)
    }
  }

  public async login(
    message = "Let's log in with your Starlight account",
  ): Promise<[string, LoginResponseData]> {
    this.log(`${message}:`)

    let loginData
    let lastEmail: string | undefined

    /* eslint-disable no-await-in-loop --
     * It's okay to await here since the loop's purpose
     * is to let the user retry in case of a failure.
     */
    while (!loginData) {
      const [email, method] = await this.checkAccount(lastEmail)
      lastEmail = email

      if (method === 'email-code') {
        this.log("✉️ We've sent a one-time code to your email address. ")
      }

      const loginResponse = await this.logUserIn(email, method)

      if (!loginResponse) {
        this.log('⛔️ Wrong password. Try again.')
        this.log(chalk.gray('Tip: press ENTER to retry with the same email.'))
        continue
      }

      loginData = loginResponse
    }
    /* eslint-enable no-await-in-loop */

    return [lastEmail as string, loginData]
  }

  public async logout(): Promise<void> {
    ux.action.start('Logging out')
    const data = await this.getAuthData()

    if (!data) {
      ux.action.stop('whoops')
      this.log("👀 Nobody's logged in yet.")
      return
    }

    try {
      await got.post(`${this.ADMIN_API_URL}/auth/logout`, {
        headers: {
          Cookie: `token=${data.token}`,
        },
      })
    } catch {
      // no-op, the token is probably expired
    }

    try {
      await fs.rm(this.getAuthFilePath())
    } catch {
      // no-op
    }

    ux.action.stop()
    this.log(`👋 You logged out.`)
  }

  public async needsAuthentication(message?: string): Promise<void> {
    ux.action.start('Checking authentication')

    const data = await this.getAuthData()

    if (data && data.token && (await this.validateToken(data))) {
      ux.action.stop()
      return
    }

    ux.action.stop('not authenticated')
    this.log()

    const [email, loginData] = await this.login(message)

    await this.setAuthData({
      email,
      token: loginData.token,
    })

    this.log('✅ Authenticated, continuing...')
  }
}
