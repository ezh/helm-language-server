/* --------------------------------------------------------------------------------------------
 * Copyright (c) Alexey Aksenov. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Logger, Tracer as VSTracer } from 'vscode-languageserver-protocol'

export class Tracer implements VSTracer {
  constructor(public readonly logger: Logger) { }

  public log(message: string, data?: string): void {
    if (data === undefined)
      this.logger.log(message)
    else
      this.logger.log(`${message} DATA:"${data}"`)
  }
}

