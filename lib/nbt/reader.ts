import { TAG_END, TAG_BYTE, TAG_SHORT, TAG_INT, TAG_LONG, TAG_FLOAT, TAG_DOUBLE, TAG_BYTE_ARRAY, TAG_STRING, TAG_LIST, TAG_COMPOUND, TAG_INT_ARRAY, TAG_LONG_ARRAY } from './writer';

export type NbtValue =
  | { type: 'byte'; value: number }
  | { type: 'short'; value: number }
  | { type: 'int'; value: number }
  | { type: 'long'; value: bigint }
  | { type: 'float'; value: number }
  | { type: 'double'; value: number }
  | { type: 'byteArray'; value: Uint8Array }
  | { type: 'string'; value: string }
  | { type: 'list'; itemType: number; items: NbtValue[] }
  | { type: 'compound'; fields: Record<string, NbtValue> }
  | { type: 'intArray'; value: Int32Array }
  | { type: 'longArray'; value: bigint[] };

class NbtCursor {
  offset = 0;
  private view: DataView;
  private data: Uint8Array;

  constructor(readonly bytes: Uint8Array, private readonly littleEndian: boolean) {
    this.data = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  u8() {
    return this.view.getUint8(this.offset++);
  }

  i8() {
    return this.view.getInt8(this.offset++);
  }

  i16() {
    const value = this.view.getInt16(this.offset, this.littleEndian);
    this.offset += 2;
    return value;
  }

  i32() {
    const value = this.view.getInt32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }

  i64() {
    const value = this.view.getBigInt64(this.offset, this.littleEndian);
    this.offset += 8;
    return value;
  }

  f32() {
    const value = this.view.getFloat32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }

  f64() {
    const value = this.view.getFloat64(this.offset, this.littleEndian);
    this.offset += 8;
    return value;
  }

  slice(length: number) {
    const out = this.data.subarray(this.offset, this.offset + length);
    this.offset += length;
    return out;
  }

  string() {
    const length = this.view.getUint16(this.offset, this.littleEndian);
    this.offset += 2;
    const encoded = this.slice(length);
    return new TextDecoder().decode(encoded);
  }
}

function readPayload(cursor: NbtCursor, tagType: number): NbtValue {
  switch (tagType) {
    case TAG_BYTE:
      return { type: 'byte', value: cursor.i8() };
    case TAG_SHORT:
      return { type: 'short', value: cursor.i16() };
    case TAG_INT:
      return { type: 'int', value: cursor.i32() };
    case TAG_LONG:
      return { type: 'long', value: cursor.i64() };
    case TAG_FLOAT:
      return { type: 'float', value: cursor.f32() };
    case TAG_DOUBLE:
      return { type: 'double', value: cursor.f64() };
    case TAG_BYTE_ARRAY: {
      const length = cursor.i32();
      return { type: 'byteArray', value: cursor.slice(length) };
    }
    case TAG_STRING:
      return { type: 'string', value: cursor.string() };
    case TAG_LIST: {
      const itemType = cursor.u8();
      const count = cursor.i32();
      const items: NbtValue[] = new Array(count);
      for (let i = 0; i < count; i += 1) items[i] = readPayload(cursor, itemType);
      return { type: 'list', itemType, items };
    }
    case TAG_COMPOUND: {
      const fields: Record<string, NbtValue> = {};
      while (true) {
        const childType = cursor.u8();
        if (childType === TAG_END) break;
        const name = cursor.string();
        fields[name] = readPayload(cursor, childType);
      }
      return { type: 'compound', fields };
    }
    case TAG_INT_ARRAY: {
      const count = cursor.i32();
      const value = new Int32Array(count);
      for (let i = 0; i < count; i += 1) value[i] = cursor.i32();
      return { type: 'intArray', value };
    }
    case TAG_LONG_ARRAY: {
      const count = cursor.i32();
      const value: bigint[] = new Array(count);
      for (let i = 0; i < count; i += 1) value[i] = cursor.i64();
      return { type: 'longArray', value };
    }
    default:
      throw new Error(`Unsupported NBT tag type ${tagType}`);
  }
}

export function parseNbt(bytes: Uint8Array, options?: { littleEndian?: boolean }): NbtValue {
  const cursor = new NbtCursor(bytes, options?.littleEndian ?? false);
  const rootType = cursor.u8();
  if (rootType === TAG_END) throw new Error('Empty NBT root');
  cursor.string(); // root name
  return readPayload(cursor, rootType);
}

export function compoundOf(value: NbtValue): Record<string, NbtValue> {
  if (value.type !== 'compound') throw new Error('Expected NBT compound');
  return value.fields;
}

export function intOf(value: NbtValue | undefined, fallback = 0): number {
  if (!value) return fallback;
  if (value.type === 'int' || value.type === 'short' || value.type === 'byte') return value.value;
  if (value.type === 'long') return Number(value.value);
  return fallback;
}

export function stringOf(value: NbtValue | undefined, fallback = ''): string {
  return value && value.type === 'string' ? value.value : fallback;
}

export function listOf(value: NbtValue | undefined): NbtValue[] {
  return value && value.type === 'list' ? value.items : [];
}
