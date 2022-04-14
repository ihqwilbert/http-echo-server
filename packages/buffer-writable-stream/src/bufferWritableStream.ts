import stream from "stream";

export class BufferWritableStream extends stream.Writable {

  #chunks: Buffer[];

  constructor(options?: stream.WritableOptions) {
    super(options ? options : {});
    this.#chunks = [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _write(chunk: string | Buffer | Uint8Array | any,
    encoding: BufferEncoding | null,
    callback: (error?: Error | null) => void): boolean {
    const buf: Buffer =
      typeof chunk === "string" && encoding !== null
        ? Buffer.from(chunk, encoding)
        : typeof chunk === "string" || Object.prototype.toString.call(chunk) === "[object Uint8Array]"
          ? Buffer.from(chunk)
          : Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(JSON.stringify(chunk));
    this.#chunks.push(buf);
    callback(null);
    return true;
  }

  _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
    this.#chunks = [];
    callback(error);
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.#chunks);
  }
}

