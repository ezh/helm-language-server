/* --------------------------------------------------------------------------------------------
 * Copyright (c) Alexey Aksenov. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ShutdownRequest } from 'vscode-languageserver-protocol'

import { AnyConstructor, Base, Mixin } from "../Base"

export const onShutdown = <T extends AnyConstructor<Base>>(base: T) =>
  class onShutdown extends base {
    /**
     * Asks the server to shut down, but to not exit.
     */
    public async onShutdown(): Promise<void> {
      this.logger.log('onShutdown')
      this.yaml.sendRequest(ShutdownRequest.type).then(response => {
        this.shouldShutdown = true
        return response
      }, err => {
        this.logger.error(`Unable to process ShutdownRequest for yaml-language-server: ${err}`)
        this.yamlChild.kill()
        return err
      })
    }
  }

export type onShutdown = Mixin<typeof onShutdown>
