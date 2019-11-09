/* --------------------------------------------------------------------------------------------
 * Copyright (c) Alexey Aksenov. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { createConnection } from 'vscode-languageserver'
import { LanguageServer } from '../LanguageServer'
import { PassThrough } from 'stream'
import {
  ExitNotification,
  InitializeRequest,
  ShutdownRequest,
  StreamMessageReader,
  StreamMessageWriter,
  createProtocolConnection,
} from 'vscode-languageserver-protocol'

function sleep(millis: number) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

// Draw jest table at the bottom
afterAll(async () => await sleep(250))

test('should handle onExit', async done => {
  const input: PassThrough = new PassThrough()
  const output: PassThrough = new PassThrough()
  const client = createProtocolConnection(new StreamMessageReader(output), new StreamMessageWriter(input), null)
  const server = new LanguageServer(createConnection(new StreamMessageReader(input), new StreamMessageWriter(output)))
  const spy = jest.spyOn(server, 'onExit')
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(code => { throw new Error(`Exit with code ${code}`) })
  client.listen()
  server.run()
  client
    .sendRequest(InitializeRequest.type, {
      capabilities: {},
      processId: process.pid,
      rootUri: 'file:///',
      workspaceFolders: null,
    })
    .then((res) => {
      expect(res).toHaveProperty('capabilities')
      client.sendRequest(ShutdownRequest.type)
        .then(() => { client.sendNotification(ExitNotification.type) })
    })
  server.on('stop', () => {
    console.log('LanguageServer is stopped')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(mockExit).toHaveBeenCalledTimes(1)
    expect(mockExit).toHaveBeenCalledWith(0)
    spy.mockRestore()
    mockExit.mockRestore()
    done()
  })
})

