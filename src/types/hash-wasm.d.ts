declare module 'hash-wasm' {
  export interface Argon2Options {
    password: string | Uint8Array;
    salt: string | Uint8Array;
    iterations: number;
    parallelism: number;
    memorySize: number;
    hashLength: number;
    outputType?: 'hex' | 'binary' | 'encoded';
  }

  export function argon2id(options: Argon2Options): Promise<string>;
}
