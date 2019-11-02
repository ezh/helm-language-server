/* --------------------------------------------------------------------------------------------
 * Copyright (c) Alexey Aksenov. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LanguageServer } from './LanguageServer'
import {
  IPCMessageReader,
  IPCMessageWriter,
  StreamMessageReader,
  StreamMessageWriter,
  createClientPipeTransport,
  createClientSocketTransport,
  createConnection,
  generateRandomPipeName
} from 'vscode-languageserver'
import { spawn, ChildProcess } from 'child_process'
import {
  ExitNotification,
  InitializeRequest,
  ProtocolConnection,
  ShutdownRequest,
  createProtocolConnection,
} from 'vscode-languageserver-protocol'
import { join, resolve } from 'path';
import * as portscanner from 'portscanner';

const pathToServer = resolve(join(__dirname, '..', 'src', 'index.ts'));

test('should run', () => {
  process.on('message', message => {
    console.log('message from parent:', message)
  })
  process.send("Hello")
  const connection1 = createConnection(
    new IPCMessageReader(process),
    new IPCMessageWriter(process)
  )
  const connection2 = createConnection(
    new IPCMessageReader(process),
    new IPCMessageWriter(process)
  )
  const server = new LanguageServer(connection1)
  expect(server.connection).toEqual(connection1)
  expect(server.connection).not.toEqual(connection2)
})

describe('initialization handshake', () => {
  function testInitHandshake(connection: ProtocolConnection) {
    connection.listen()
    connection
      .sendRequest(InitializeRequest.type, {
        capabilities: {},
        processId: process.pid,
        rootUri: '/',
        workspaceFolders: null,
      })
      .then((res) => {
        expect(res).toHaveProperty('capabilities')
        connection.sendRequest(ShutdownRequest.type)
          .then(() => { connection.sendNotification(ExitNotification.type) })
      })
  }

  let child: ChildProcess
  console.log(pathToServer)


  it('performs LSP initialization via stdio', done => {
    //const args =  ['-r', 'ts-node/register', '--inspect', '--inspect-brk', pathToServer, '--stdio']
    const args = ['-r', 'ts-node/register', pathToServer, '--stdio']
    child = spawn('node', args)
    child.on('exit', (code) => {
      console.log(`Child process exited with code ${code}`)
      expect(code).toBe(0)
      done()
    })
    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`)
    })
    child.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`)
    })
    const connection = createProtocolConnection(
      new StreamMessageReader(child.stdout),
      new StreamMessageWriter(child.stdin),
      null
    );
    testInitHandshake(connection)
  })


  it('performs LSP initialization via IPC', done => {
    //const args =  ['-r', 'ts-node/register', '--inspect', '--inspect-brk', pathToServer, '--node-ipc']
    const args = ['-r', 'ts-node/register', pathToServer, '--node-ipc']
    child = spawn('node', args, { stdio: [null, null, null, 'ipc'] })
    child.on('exit', (code) => {
      console.log(`Child process exited with code ${code}`)
      expect(code).toBe(0)
      done()
    })
    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`)
    })
    child.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`)
    })
    const connection = createProtocolConnection(
      new IPCMessageReader(child),
      new IPCMessageWriter(child),
      null
    )
    testInitHandshake(connection)
  })


  it('performs LSP initialization via socket', async (done) => {
    const portFloor = Math.floor(Math.random() * 1000 + 2000)
    const PORT = await portscanner.findAPortNotInUse(
      portFloor,
      portFloor + 5000
    )
    //const args =  ['-r', 'ts-node/register', '--inspect', '--inspect-brk', pathToServer, `--socket=${PORT}`]
    const args = ['-r', 'ts-node/register', pathToServer, `--socket=${PORT}`]
    child = spawn('node', args)
    child.on('exit', (code) => {
      console.log(`Child process exited with code ${code}`)
      expect(code).toBe(0)
      done()
    })
    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`)
    })
    child.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`)
    })
    createClientSocketTransport(PORT).then((socketTransport) =>
      socketTransport.onConnected().then(([messageReader, messageWriter]) => {
        const connection = createProtocolConnection(
          messageReader,
          messageWriter,
          null
        )
        testInitHandshake(connection)
      })
    )
  })


  it('performs LSP initialization via pipe', (done) => {
    const pipeName = generateRandomPipeName()
    //const args =  ['-r', 'ts-node/register', '--inspect', '--inspect-brk', pathToServer, `--pipe=${pipeName}`]
    const args = ['-r', 'ts-node/register', pathToServer, `--pipe=${pipeName}`]
    child = spawn('node', args)
    child.on('exit', (code) => {
      console.log(`Child process exited with code ${code}`)
      expect(code).toBe(0)
      done()
    })
    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`)
    })
    child.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`)
    })
    createClientPipeTransport(pipeName).then((pipeTransport) =>
      pipeTransport.onConnected().then(([messageReader, messageWriter]) => {
        const connection = createProtocolConnection(
          messageReader,
          messageWriter,
          null
        )
        testInitHandshake(connection)
      })
    )
  })
})
