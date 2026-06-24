/** What to do when `push()` is called on a full buffer. */
export type FullPolicy = "overwrite" | "throw";

export interface RingBufferOptions {
  /**
   * Behaviour when the buffer is full and `push()` is called.
   * - `"overwrite"` (default) — drop the oldest item and insert the new one,
   *   matching Python `deque(maxlen=N)` and Java `CircularFifoQueue`.
   * - `"throw"` — throw a `RangeError` instead of dropping data.
   */
  full?: FullPolicy;
}

/**
 * RingBuffer<T> — a fixed-capacity circular buffer (FIFO).
 *
 * Backed by a pre-allocated array of length `capacity`; no array copying on
 * push or shift. All primary operations are O(1).
 *
 * Inspired by:
 *   - Python  `collections.deque(maxlen=N)`
 *   - Java    `ArrayDeque` / Apache Commons `CircularFifoQueue`
 *   - C#      `CircularBuffer<T>`
 *   - Go      `container/ring`
 */
export class RingBuffer<T> {
  private readonly _buf: (T | undefined)[];
  private _head = 0; // index of the oldest item
  private _size = 0;
  private readonly _policy: FullPolicy;

  constructor(capacity: number, options: RingBufferOptions = {}) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(`RingBuffer: capacity must be a positive integer, got ${capacity}`);
    }
    this._buf = new Array(capacity);
    this._policy = options.full ?? "overwrite";
  }

  /** Maximum number of items the buffer can hold. */
  get capacity(): number {
    return this._buf.length;
  }

  /** Current number of items stored. */
  get size(): number {
    return this._size;
  }

  /** True when `size === 0`. */
  get isEmpty(): boolean {
    return this._size === 0;
  }

  /** True when `size === capacity`. */
  get isFull(): boolean {
    return this._size === this._buf.length;
  }

  /**
   * Add `item` to the back (newest end) of the buffer.
   *
   * If the buffer is full:
   * - `"overwrite"` policy: drops the oldest item and inserts the new one.
   * - `"throw"` policy: throws `RangeError`.
   *
   * Returns `this` for chaining.
   */
  push(item: T): this {
    if (this.isFull) {
      if (this._policy === "throw") {
        throw new RangeError(`RingBuffer: buffer is full (capacity ${this._buf.length})`);
      }
      // overwrite: advance head past the oldest item
      this._head = (this._head + 1) % this._buf.length;
      this._size--; // will be incremented back below
    }
    const tail = (this._head + this._size) % this._buf.length;
    this._buf[tail] = item;
    this._size++;
    return this;
  }

  /**
   * Remove and return the oldest item (front).
   * Returns `undefined` if the buffer is empty.
   */
  shift(): T | undefined {
    if (this._size === 0) return undefined;
    const item = this._buf[this._head] as T;
    this._buf[this._head] = undefined; // allow GC
    this._head = (this._head + 1) % this._buf.length;
    this._size--;
    return item;
  }

  /**
   * Remove and return the newest item (back).
   * Returns `undefined` if the buffer is empty.
   */
  pop(): T | undefined {
    if (this._size === 0) return undefined;
    const tailIdx = (this._head + this._size - 1) % this._buf.length;
    const item = this._buf[tailIdx] as T;
    this._buf[tailIdx] = undefined;
    this._size--;
    return item;
  }

  /**
   * Return the oldest item (front) without removing it.
   * Returns `undefined` if the buffer is empty.
   */
  peek(): T | undefined {
    if (this._size === 0) return undefined;
    return this._buf[this._head] as T;
  }

  /**
   * Return the newest item (back) without removing it.
   * Returns `undefined` if the buffer is empty.
   */
  peekBack(): T | undefined {
    if (this._size === 0) return undefined;
    const tailIdx = (this._head + this._size - 1) % this._buf.length;
    return this._buf[tailIdx] as T;
  }

  /**
   * Return the item at logical index `i` (0 = oldest, size-1 = newest)
   * without removing it. Returns `undefined` if out of range.
   */
  at(i: number): T | undefined {
    if (i < 0) i = this._size + i; // negative indexing
    if (i < 0 || i >= this._size) return undefined;
    return this._buf[(this._head + i) % this._buf.length] as T;
  }

  /** Remove all items. Capacity is unchanged. */
  clear(): void {
    this._buf.fill(undefined);
    this._head = 0;
    this._size = 0;
  }

  /**
   * Iterate from oldest to newest.
   * The iterator is a snapshot safe to use while the buffer is modified
   * only via `push()` in "overwrite" mode (caller's responsibility).
   */
  [Symbol.iterator](): Iterator<T> {
    let i = 0;
    return {
      next: () => {
        if (i >= this._size) return { value: undefined as unknown as T, done: true };
        const item = this._buf[(this._head + i) % this._buf.length] as T;
        i++;
        return { value: item, done: false };
      },
    };
  }

  /** Return a plain array of items in order oldest → newest. */
  toArray(): T[] {
    const out: T[] = new Array(this._size);
    for (let i = 0; i < this._size; i++) {
      out[i] = this._buf[(this._head + i) % this._buf.length] as T;
    }
    return out;
  }

  /**
   * Return a new `RingBuffer` with the same capacity, policy, and contents.
   */
  clone(): RingBuffer<T> {
    const copy = new RingBuffer<T>(this._buf.length, { full: this._policy });
    for (const item of this) copy.push(item);
    return copy;
  }

  get [Symbol.toStringTag](): string {
    return "RingBuffer";
  }
}
