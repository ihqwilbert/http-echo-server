// because of https://github.com/facebook/jest/issues/10025 this import is needed.
import { jest } from "@jest/globals";
import { BufferWritableStream } from "./bufferWritableStream";

const char512 = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolorit. Aenean massa. "
  + "Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, "
  + "pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, "
  + "vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis "
  + "pretium. Integer tincidunt. Cras dapibus. Vivamus";

describe("BufferWriteableStream", () => {
  const testStr = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et "
      + "dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo "
      + "consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. "
      + "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
  
  it("should support writing a string to the stream", () => {
    const bws = new BufferWritableStream();
    expect(() => {
      bws.write(testStr);
    }).not.toThrowError();
    expect(bws.toBuffer()).toEqual(Buffer.from(testStr));
  });

  it("should support the decodeStrings option", () => {
    const bws = new BufferWritableStream({decodeStrings: false});
    expect(() => {
      bws.write(testStr);
    }).not.toThrowError();
    expect(bws.toBuffer()).toEqual(Buffer.from(testStr));
  });

  it("should support writing a string to the stream with a utf16le encoding", () => {
    const bws = new BufferWritableStream({defaultEncoding: "utf16le"});
    expect(() => {
      bws.write(testStr);
    }).not.toThrowError();
    expect(bws.toBuffer()).toEqual(Buffer.from(testStr, "utf16le"));
  });

  it("should support writing in different encodings without decodeStrings", () => {
    const bws = new BufferWritableStream({decodeStrings: false});
    expect(() => {
      bws.write(testStr);
      bws.write(testStr, "utf16le");
    }).not.toThrowError();
    expect(bws.toBuffer().toString("utf8")).toEqual(
      Buffer.concat([
        Buffer.from(testStr),
        Buffer.from(testStr,"utf16le")]
      ).toString("utf8")
    );
  });

  it("should support writing in different encodings with decodeStrings", () => {
    const bws = new BufferWritableStream({decodeStrings: true});
    expect(() => {
      bws.write(testStr);
      bws.write(testStr, "utf16le");
    }).not.toThrowError();
    expect(bws.toBuffer().toString("utf8")).toEqual(
      Buffer.concat([
        Buffer.from(testStr),
        Buffer.from(testStr,"utf16le")]
      ).toString("utf8")
    );
  });

  it("should support writing a large string to the stream", async () => {
    const textGenerator = jest.fn(function* (szInMiB: number) {
      for (let count = 0; count < 2*szInMiB; count++) {
        yield char512;
      }
    });
    const bws = new BufferWritableStream();
    let largeStr = "";
    for(const str of textGenerator(8)) {
      largeStr += str;
    }
    expect(() => bws.write(largeStr)).not.toThrowError();
    expect(bws.write(largeStr)).toEqual(true);
    expect(bws.toBuffer().length).toEqual(2 * 8 * 1024);
  });

  it("should support events and highWaterMark", async () => {
    const textGenerator = jest.fn(function* (szInMiB: number) {
      for (let count = 0; count < 2*szInMiB; count++) {
        yield char512;
      }
    });
    let largeStr = "";
    for(const str of textGenerator(8)) {
      largeStr += str;
    }
    let drainCalled = 0;
    let finishedCalled = 0;
    const bws = new BufferWritableStream({highWaterMark: 1024});
    bws.on("drain", () => {
      drainCalled += 1;
    });
    bws.on("finish", () => {
      expect(bws.toBuffer().length).toEqual(2 * 8 * 1024);
      finishedCalled += 1;
    });
    expect(() => bws.write(largeStr)).not.toThrowError();
    const r = bws.write(largeStr);
    if (!r) {
      await (async () => {
        do {
          await (() => new Promise<void>(resolve => {
            setTimeout(() => {
              resolve();
            }, 100);
          }))();
        } while (drainCalled == 0);
        return new Promise<void>(resolve => resolve());
      })();
    }
    bws.end();
    do {
      await (() => new Promise<void>(resolve => {
        setTimeout(() => {
          resolve();
        }, 100);
      }))();
    } while (!finishedCalled);
    
    expect(drainCalled).toEqual(1);
    expect(finishedCalled).toEqual(1);
  });

  it("should support writing a Buffer to the stream", () => {
    const testBuffer = Buffer.from(testStr);
    const bws = new BufferWritableStream();
    expect(bws.write(testBuffer)).toEqual(true);
    expect(bws.toBuffer()).toEqual(testBuffer);
  });

  it("should support writing a Objects to the stream", () => {
    const testObject:Array<{foo: string; bar: number}> = [{foo: "ping", bar: 42}, {foo: "pong", bar: 8}];
    const bws = new BufferWritableStream({objectMode: true});
    expect(bws.write(testObject)).toEqual(true);
    expect(bws.toBuffer().toString()).toEqual(JSON.stringify(testObject));
  });

  it("should support writing a Uint8Array to the stream", () => {
    const testArray: Uint8Array = Uint8Array.from([65,66,67]);
    const bws = new BufferWritableStream();
    expect(bws.write(testArray)).toEqual(true);
    expect(bws.toBuffer().toString()).toEqual("ABC");
  });

});

