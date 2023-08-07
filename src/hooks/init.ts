import { Hook } from '@oclif/core'
import got from 'got'

const hook: Hook<'init'> = async function () {
  // Set global got options
  got.extend({
    timeout: { request: 10_000 },
  })
}

export default hook
