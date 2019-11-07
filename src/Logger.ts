/* --------------------------------------------------------------------------------------------
 * Copyright (c) Alexey Aksenov. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Logger as VSLogger } from 'vscode-languageserver-protocol'

export class Logger implements VSLogger {
  constructor(public readonly name: String) { }
  error(message: string): void {
    console.error(`${this.name}: ERROR ${message}`)
  }
  warn(message: string): void {
    console.warn(`${this.name}: WARN ${message}`)
  }
  info(message: string): void {
    console.info(`${this.name}: INFO ${message}`)
  }
  log(message: string): void {
    console.log(`${this.name}: ${message}`)
  }
}
