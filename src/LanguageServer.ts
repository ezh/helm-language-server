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
} from 'vscode-languageserver';

/**
 * Helm language server
 *
 * @export
 * @class LanguageServer
 */
export class LanguageServer {
  // Create a connection for the server.
  public readonly connection: IConnection
  // Create a simple text document manager. The text document manager
  // supports full document sync only
  public readonly documents: TextDocuments = new TextDocuments()
  // Shutdown flag
  shouldShutdown = false


  /**
   * Constructor
   */
  constructor(private initialConnection: IConnection = LanguageServer.createConnection()) {
    this.connection = initialConnection
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
    debugger
    let args = process.argv;
    if (args)
      return args.some((arg) => /^--stdio/.test(arg))
    return false;
  }
  /**
   * A notification to ask the server to exit its process.
   */
  onExit() {
    console.log('Exit Helm language server')
    this.connection.sendNotification('window/showMessage', {
      type: MessageType.Info,
      message: 'Helm language server exited'
    })
    if (this.shouldShutdown) {
      process.exit()
    } else {
      process.exit(1)
    }
  }
  /**
   * Asks the server to shut down, but to not exit.
   */
  onShutdown() {
    console.log('Shutdown Helm language server')
  }
  /**
   * Run Helm language server
   *
   * @memberof LanguageServer
   */
  public run() {
    if (this.startedInSTDIOMode()) {
      console.log = this.connection.console.log.bind(this.connection.console)
      console.error = this.connection.console.error.bind(this.connection.console)
    }
    console.log("Run Helm language server")

    process.on('exit', code => {
      if (code !== 0) {
        this.connection.sendNotification('window/showMessage', {
          type: MessageType.Error,
          message: `Helm language server abnormal exit with code ${code}`
        })
      }
    })
    this.connection.onShutdown(this.onShutdown)
    // Make the text document manager listen on the connection
    // for open, change and close text document events
    this.documents.listen(this.connection)
    // Listen on the connection
    this.connection.listen();
  }
}
