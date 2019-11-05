/* --------------------------------------------------------------------------------------------
 * Copyright (c) Alexey Aksenov. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

// https://mariusschulz.com/blog/mixin-classes-in-typescript
// https://www.bryntum.com/blog/the-mixin-pattern-in-typescript-all-you-need-to-know/

import { ChildProcess } from 'child_process'

import { IConnection } from 'vscode-languageserver'
import { ProtocolConnection, Logger } from 'vscode-languageserver-protocol'

export class Base {
  // Create a connection for the server
  public readonly connection: IConnection
  // Helm language server logger
  public readonly logger: Logger
  // Create a connection to the yaml-language-server
  public yaml: ProtocolConnection
  // yaml-language-server process
  public yamlChild: ChildProcess
  // Shutdown flag
  public shouldShutdown = false

  initialize<T extends Base>(props?: Partial<T>) {
    props && Object.assign(this, props)
  }

  static new<T extends typeof Base>(this: T, props?: Partial<InstanceType<T>>): InstanceType<T> {
    const instance = new this()

    instance.initialize<InstanceType<T>>(props)

    return instance as InstanceType<T>
  }
}

export type BaseConstructor = typeof Base
export type AnyFunction<A = any> = (...input: any[]) => A
export type AnyConstructor<A = object> = new (...input: any[]) => A
export type Mixin<T extends AnyFunction> = InstanceType<ReturnType<T>>
export type MixinConstructor<T extends AnyFunction> =
  T extends AnyFunction<infer M> ? (M extends AnyConstructor<Base> ? M & BaseConstructor : M) : ReturnType<T>
