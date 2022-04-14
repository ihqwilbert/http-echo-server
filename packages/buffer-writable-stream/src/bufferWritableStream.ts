import stream from "stream";

export class BufferWritableStream extends stream.Writable {

  #chunks: Buffer[];

  constructor(options?: stream.WritableOptions) {
    super(options ? options : {});
    this.#chunks = [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _write(chunk: string | Buffer |  any,
    encoding: BufferEncoding | null,
    callback: (error?: Error | null) => void): boolean {
    const buf: Buffer =
      Buffer.isBuffer(chunk)
        ? chunk
        : typeof chunk === "string" && encoding !== null
          ? Buffer.from(chunk, encoding)
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

