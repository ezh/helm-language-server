/* --------------------------------------------------------------------------------------------
 * Copyright (c) Alexey Aksenov. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { InitializeParams, InitializeResult } from 'vscode-languageserver'
import { InitializeRequest } from 'vscode-languageserver-protocol'

import { AnyConstructor, Base, Mixin } from "../Base"

export const onInitialize = <T extends AnyConstructor<Base>>(base: T) =>
  class onInitialize extends base {
    public async onInitialize(params: InitializeParams): Promise<InitializeResult> {
      // Fix YAML language server code smell
      if (!("textDocument" in params.capabilities))
        params.capabilities.textDocument = {}
      if (!("documentSymbol" in params.capabilities.textDocument))
        params.capabilities.textDocument.documentSymbol = { hierarchicalDocumentSymbolSupport: false }
      if (!("workspace" in params.capabilities))
        params.capabilities.workspace = {}
      if (!("symbol" in params.capabilities.workspace))
        params.capabilities.workspace.symbol = { dynamicRegistration: false }

      return this.yaml.sendRequest(InitializeRequest.type, params).then(response => {
        return response
      }, err => {
        this.logger.error(`Unable to process InitializeRequest for yaml-language-server: ${err}`)
        return err
      })
    }
  }

export type onInitialize = Mixin<typeof onInitialize>
