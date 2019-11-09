/* --------------------------------------------------------------------------------------------
 * Copyright (c) Alexey Aksenov. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
  IConnection,
  MessageType,
  ProposedFeatures,
  TextDocuments,
  createConnection,
} from 'vscode-languageserver'
import { join, resolve } from 'path'
import { spawn } from 'child_process'
import {
  IPCMessageReader,
  IPCMessageWriter,
} from 'vscode-languageserver'
import {
  ExitNotification,
  ShutdownRequest,
  Trace,
  createProtocolConnection,
} from 'vscode-languageserver-protocol'

import { Base } from "./Base"
import { Logger } from './Logger'
import { Tracer } from './Tracer'
import { onExit } from './event/onExit'
import { onInitialize } from './event/onInitialize'
import { onShutdown } from './event/onShutdown'


/**
 * Helm language server
 *
 * @export
 * @class LanguageServer
 */
export class LanguageServer extends
  onExit(
    onShutdown(
      onInitialize(
        Base))) {
  // Helm language server logger
  public readonly logger = new Logger("helm-language-server")
  // Create a simple text document manager. The text document manager
  // supports full document sync only
  public readonly documents: TextDocuments = new TextDocuments()


  /**
   * Constructor
   */
  constructor(public readonly connection: IConnection = LanguageServer.createConnection()) {
    super()
  }
  /**
   * Create LanguageServer connection
   */
  static createConnection() {
    if (process.argv.indexOf('--stdio') === -1)
      return createConnection(ProposedFeatures.all)
    return createConnection()
  }
  startedInSTDIOMode() {
    return process.argv.indexOf('--stdio') !== -1
  }
  /**
   * Run Helm language server
   *
   * @memberof LanguageServer
   */
  public run() {
    if (this.startedInSTDIOMode()) {
      console.error = this.connection.console.error.bind(this.connection.console)
      console.info = this.connection.console.info.bind(this.connection.console)
      console.log = this.connection.console.log.bind(this.connection.console)
      console.warn = this.connection.console.warn.bind(this.connection.console)
    }
    this.logger.log("Run")

    // Run yaml-language-server
    const pathToServer = resolve(join(__dirname, '..', 'node_modules', '.bin', 'yaml-language-server'));
    const args = [pathToServer, '--node-ipc']
    this.yamlChild = spawn('node', args, { stdio: [null, null, null, 'ipc'] })
    this.yamlChild.on('error', (code) => {
      this.logger.error(`YAML process error ${code}`)
    })
    this.yamlChild.on('exit', (code) => {
      this.logger.log(`YAML process exited with code ${code}`)
      this.yamlChild.removeAllListeners()
      this.yamlChild = undefined
      this.emit('stop')
    })
    this.yamlChild.stdout.on('data', (data) => {
      this.logger.log(`YAML stdout: ${data}`)
    })
    this.yamlChild.stderr.on('data', (data) => {
      this.logger.error(`YAML stderr: ${data}`)
    })
    this.yaml = createProtocolConnection(
      new IPCMessageReader(this.yamlChild),
      new IPCMessageWriter(this.yamlChild),
      this.logger
    )
    this.yaml.trace(Trace.Verbose, new Tracer(new Logger("yaml-language-server")))
    this.yaml.listen()
    this.logger.log(`YAML server pid is ${this.yamlChild.pid}`)


    process.on('exit', code => {
      if (code !== 0) {
        this.connection.sendNotification('window/showMessage', {
          type: MessageType.Error,
          message: `Helm language server abnormal exit with code ${code}`
        })
      }
    })


    this.connection.onShutdown(this.onShutdown.bind(this))
    this.connection.onInitialize(this.onInitialize.bind(this))
    this.connection.onExit(this.onExit.bind(this))
    // Make the text document manager listen on the connection
    // for open, change and close text document events
    this.documents.listen(this.connection)
    // Listen on the connection
    this.connection.listen();
  }
  public stop() {
    this.connection.dispose()
    if (typeof this.yamlChild !== 'undefined')
      if (this.shouldShutdown)
        this.yaml.sendNotification(ExitNotification.type)
      else
        this.yaml.sendRequest(ShutdownRequest.type)
          .then(() => { this.yaml.sendNotification(ExitNotification.type) })
  }
}
