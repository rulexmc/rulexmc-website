import net from "node:net";

/**
 * Minimal Java Edition Server List Ping (1.7+ protocol), server-side only.
 * https://minecraft.wiki/w/Java_Edition_protocol/Server_List_Ping
 */

export function encodeVarInt(value: number): Buffer {
  const bytes: number[] = [];
  let v = value >>> 0;
  do {
    let b = v & 0x7f;
    v >>>= 7;
    if (v !== 0) b |= 0x80;
    bytes.push(b);
  } while (v !== 0);
  return Buffer.from(bytes);
}

/** Returns [value, bytesRead] or null if the buffer does not yet hold a full VarInt. */
export function decodeVarInt(buf: Buffer, offset = 0): [number, number] | null {
  let result = 0;
  let shift = 0;
  let pos = offset;
  while (pos < buf.length) {
    const b = buf[pos]!;
    result |= (b & 0x7f) << shift;
    pos++;
    if ((b & 0x80) === 0) return [result >>> 0, pos - offset];
    shift += 7;
    if (shift > 35) throw new Error("VarInt too big");
  }
  return null;
}

function encodeString(s: string): Buffer {
  const data = Buffer.from(s, "utf8");
  return Buffer.concat([encodeVarInt(data.length), data]);
}

function packet(id: number, payload: Buffer): Buffer {
  const body = Buffer.concat([encodeVarInt(id), payload]);
  return Buffer.concat([encodeVarInt(body.length), body]);
}

export function buildHandshake(host: string, port: number, protocol = -1): Buffer {
  const portBuf = Buffer.alloc(2);
  portBuf.writeUInt16BE(port);
  const payload = Buffer.concat([encodeVarInt(protocol), encodeString(host), portBuf, encodeVarInt(1)]);
  return Buffer.concat([packet(0x00, payload), packet(0x00, Buffer.alloc(0))]);
}

export interface SlpResponse {
  version?: { name?: string; protocol?: number };
  players?: { online?: number; max?: number };
  description?: unknown;
}

/** Flatten a chat component / legacy string MOTD into plain text lines. */
export function flattenMotd(desc: unknown): string[] {
  const parts: string[] = [];
  const walk = (node: unknown) => {
    if (typeof node === "string") parts.push(node);
    else if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === "object") {
      const o = node as { text?: unknown; extra?: unknown };
      if (typeof o.text === "string") parts.push(o.text);
      if (o.extra) walk(o.extra);
    }
  };
  walk(desc);
  return parts
    .join("")
    .replace(/§[0-9a-fk-orx]/gi, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function pingServer(host: string, port: number, timeoutMs = 5000): Promise<SlpResponse> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let buf = Buffer.alloc(0);
    let done = false;
    const finish = (err: Error | null, value?: SlpResponse) => {
      if (done) return;
      done = true;
      socket.destroy();
      if (err) reject(err);
      else resolve(value!);
    };
    socket.setTimeout(timeoutMs, () => finish(new Error("Ping timed out")));
    socket.on("error", (e) => finish(e));
    socket.on("connect", () => socket.write(buildHandshake(host, port)));
    socket.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (buf.length > 1024 * 1024) return finish(new Error("Response too large"));
      try {
        const len = decodeVarInt(buf, 0);
        if (!len) return;
        const [packetLen, lenBytes] = len;
        if (buf.length < lenBytes + packetLen) return;
        let off = lenBytes;
        const id = decodeVarInt(buf, off);
        if (!id || id[0] !== 0x00) return finish(new Error("Unexpected packet id"));
        off += id[1];
        const strLen = decodeVarInt(buf, off);
        if (!strLen) return finish(new Error("Malformed response"));
        off += strLen[1];
        const json = buf.subarray(off, off + strLen[0]).toString("utf8");
        finish(null, JSON.parse(json) as SlpResponse);
      } catch (e) {
        finish(e instanceof Error ? e : new Error("Malformed response"));
      }
    });
    socket.on("end", () => finish(new Error("Connection closed before response")));
  });
}
