declare module '@npmcli/promise-spawn' {
  import { EventEmitter } from 'events'
  import { SpawnOptions } from 'child_process'

  export default function spawn(
    cmd: string,
    args?: string[],
    opts?: SpawnOptions
  ): Promise<{ stdout: Buffer; code: number; stderr: Buffer }> & EventEmitter
}
