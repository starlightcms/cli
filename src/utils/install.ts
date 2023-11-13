import * as childProcess from 'node:child_process'

export const installDependencies = (cwd: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const npm = childProcess.spawn(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['install'],
      {
        cwd,
        stdio: 'inherit',
      },
    )

    npm.on('close', (code) => {
      if (code === 0) resolve()
      else reject()
    })
  })
