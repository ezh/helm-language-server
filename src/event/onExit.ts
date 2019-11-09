/* --------------------------------------------------------------------------------------------
 * Copyright (c) Alexey Aksenov. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ExitNotification } from 'vscode-languageserver-protocol'
import { MessageType } from 'vscode-languageserver'

import { AnyConstructor, Base, Mixin } from "../Base"

export const onExit = <T extends AnyConstructor<Base>>(base: T) =>
  class onExit extends base {
    /**
     * A notification to ask the server to exit its process.
     */
    public async onExit(): Promise<void> {
      this.yaml.sendNotification(ExitNotification.type)
      this.logger.log('onExit')
      this.connection.sendNotification('window/showMessage', {
        type: MessageType.Info,
        message: 'Helm language server exited'
      })
      // process.exit is called by vscode-languageserver
      //if (this.shouldShutdown) {
      //  process.exit()
      //} else {
      //  process.exit(1)
      //}
    }
  }

export type onExit = Mixin<typeof onExit>
