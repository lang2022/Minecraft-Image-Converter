export type NbtEndianness = 'big' | 'little';

export const TAG_END = 0;
export const TAG_BYTE = 1;
export const TAG_SHORT = 2;
export const TAG_INT = 3;
export const TAG_LONG = 4;
export const TAG_FLOAT = 5;
export const TAG_DOUBLE = 6;
export const TAG_BYTE_ARRAY = 7;
export const TAG_STRING = 8;
export const TAG_LIST = 9;
export const TAG_COMPOUND = 10;
export const TAG_INT_ARRAY = 11;
export const TAG_LONG_ARRAY = 12;

export type NbtTag =
  | { kind: 'byte'; value: number }
  | { kind: 'short'; value: number }
  | { kind: 'int'; value: number }
  | { kind: 'long'; value: bigint }
  | { kind: 'float'; value: number }
  | { kind: 'double'; value: number }
  | { kind: 'byteArray'; value: Uint8Array }
  | { kind: 'string'; value: string }
  | { kind: 'list'; itemType: NbtTag['kind']; items: NbtTag[] }
  | { kind: 'compound'; fields: Record<string, NbtTag> }
  | { kind: 'intArray'; value: number[] }
  | { kind: 'longArray'; value: bigint[] };

export const nbt = {
  byte: (value: number): NbtTag => ({ kind: 'byte', value }),
  short: (value: number): NbtTag => ({ kind: 'short', value }),
  int: (value: number): NbtTag => ({ kind: 'int', value }),
  long: (value: bigint | number): NbtTag => ({ kind: 'long', value: BigInt(value) }),
  float: (value: number): NbtTag => ({ kind: 'float', value }),
  double: (value: number): NbtTag => ({ kind: 'double', value }),
  byteArray: (value: Uint8Array): NbtTag => ({ kind: 'byteArray', value }),
  string: (value: string): NbtTag => ({ kind: 'string', value }),
  list: (itemType: NbtTag['kind'], items: NbtTag[]): NbtTag => ({ kind: 'list', itemType, items }),
  compound: (fields: Record<string, NbtTag>): NbtTag => ({ kind: 'compound', fields }),
  intArray: (value: number[]): NbtTag => ({ kind: 'intArray', value }),
  longArray: (value: bigint[]): NbtTag => ({ kind: 'longArray', value }),
};

const TAG_IDS: Record<NbtTag['kind'], number> = {
  byte: TAG_BYTE,
  short: TAG_SHORT,
  int: TAG_INT,
  long: TAG_LONG,
  float: TAG_FLOAT,
  double: TAG_DOUBLE,
  byteArray: TAG_BYTE_ARRAY,
  string: TAG_STRING,
  list: TAG_LIST,
  compound: TAG_COMPOUND,
  intArray: TAG_INT_ARRAY,
  longArray: TAG_LONG_ARRAY,
};

const INITIAL_CAPACITY = 512;

class ByteSink {
  private buffer = new Uint8Array(INITIAL_CAPACITY);
  private view = new DataView(this.buffer.buffer);
  private length = 0;
  private readonly littleEndian: boolean;
  private readonly textEncoder = new TextEncoder();

  constructor(littleEndian: boolean) {
    this.littleEndian = littleEndian;
  }

  private ensure(extra: number) {
    if (this.length + extra <= this.buffer.length) return;
    let capacity = this.buffer.length * 2;
    while (capacity < this.length + extra) capacity *= 2;
    const next = new Uint8Array(capacity);
    next.set(this.buffer.subarray(0, this.length));
    this.buffer = next;
    this.view = new DataView(next.buffer);
  }

  u8(value: number) {
    this.ensure(1);
    this.view.setUint8(this.length, value);
    this.length += 1;
  }

  i16(value: number) {
    this.ensure(2);
    this.view.setInt16(this.length, value, this.littleEndian);
    this.length += 2;
  }

  i32(value: number) {
    this.ensure(4);
    this.view.setInt32(this.length, value, this.littleEndian);
    this.length += 4;
  }

  i64(value: bigint) {
    this.ensure(8);
    this.view.setBigInt64(this.length, value, this.littleEndian);
    this.length += 8;
  }

  f32(value: number) {
    this.ensure(4);
    this.view.setFloat32(this.length, value, this.littleEndian);
    this.length += 4;
  }

  f64(value: number) {
    this.ensure(8);
    this.view.setFloat64(this.length, value, this.littleEndian);
    this.length += 8;
  }

  bytes(data: Uint8Array) {
    this.ensure(data.length);
    this.buffer.set(data, this.length);
    this.length += data.length;
  }

  string(value: string) {
    const encoded = this.textEncoder.encode(value);
    this.ensure(2 + encoded.length);
    this.view.setUint16(this.length, encoded.length, this.littleEndian);
    this.buffer.set(encoded, this.length + 2);
    this.length += 2 + encoded.length;
  }

  varint(value: number) {
    let remaining = value >>> 0;
    while (true) {
      if ((remaining & ~0x7f) === 0) {
        this.u8(remaining);
        return;
      }
      this.u8((remaining & 0x7f) | 0x80);
      remaining >>>= 7;
    }
  }

  toUint8Array() {
    return this.buffer.slice(0, this.length);
  }
}

function writePayload(sink: ByteSink, tag: NbtTag) {
  switch (tag.kind) {
    case 'byte':
      sink.u8(tag.value & 0xff);
      break;
    case 'short':
      sink.i16(tag.value);
      break;
    case 'int':
      sink.i32(tag.value);
      break;
    case 'long':
      sink.i64(tag.value);
      break;
    case 'float':
      sink.f32(tag.value);
      break;
    case 'double':
      sink.f64(tag.value);
      break;
    case 'byteArray':
      sink.i32(tag.value.length);
      sink.bytes(tag.value);
      break;
    case 'string':
      sink.string(tag.value);
      break;
    case 'list':
      sink.u8(TAG_IDS[tag.itemType]);
      sink.i32(tag.items.length);
      for (const item of tag.items) writePayload(sink, item);
      break;
    case 'compound':
      for (const [name, value] of Object.entries(tag.fields)) {
        sink.u8(TAG_IDS[value.kind]);
        sink.string(name);
        writePayload(sink, value);
      }
      sink.u8(TAG_END);
      break;
    case 'intArray':
      sink.i32(tag.value.length);
      for (const item of tag.value) sink.i32(item);
      break;
    case 'longArray':
      sink.i32(tag.value.length);
      for (const item of tag.value) sink.i64(item);
      break;
  }
}

export function serializeNbt(root: NbtTag, rootName: string, endianness: NbtEndianness = 'big'): Uint8Array {
  const sink = new ByteSink(endianness === 'little');
  sink.u8(TAG_IDS[root.kind]);
  sink.string(rootName);
  writePayload(sink, root);
  return sink.toUint8Array();
}

export { ByteSink };
