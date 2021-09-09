import type { Principal } from '@dfinity/principal';
export interface _SERVICE {
  'getHead' : () => Promise<string>,
  'getInfoPacks' : () => Promise<string>,
  'getObject' : (arg_0: string) => Promise<[] | [Array<number>]>,
  'getRefs' : () => Promise<string>,
  'lock' : (arg_0: string) => Promise<boolean>,
  'moveObject' : (arg_0: string, arg_1: string) => Promise<undefined>,
  'putObject' : (arg_0: string, arg_1: Array<number>) => Promise<undefined>,
  'putRef' : (arg_0: string, arg_1: string) => Promise<undefined>,
  'unlock' : (arg_0: string) => Promise<boolean>,
}
