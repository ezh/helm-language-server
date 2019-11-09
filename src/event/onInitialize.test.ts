/* --------------------------------------------------------------------------------------------
 * Copyright (c) Alexey Aksenov. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { createConnection } from 'vscode-languageserver'
import { LanguageServer } from '../LanguageServer'
import { PassThrough } from 'stream'
import {
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

test('should handle onInitialize', async done => {
  const input: PassThrough = new PassThrough()
  const output: PassThrough = new PassThrough()
  const client = createProtocolConnection(new StreamMessageReader(output), new StreamMessageWriter(input), null)
  const server = new LanguageServer(createConnection(new StreamMessageReader(input), new StreamMessageWriter(output)))
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
        .then(() => server.stop())
    })
  server.on('stop', () => {
    console.log('LanguageServer is stopped')
    done()
  })
})

