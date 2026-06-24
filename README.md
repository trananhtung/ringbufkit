# ringbufkit

<!-- ALL-CONTRIBUTORS-BADGE:START --><!-- ALL-CONTRIBUTORS-BADGE:END -->
[![npm version](https://img.shields.io/npm/v/ringbufkit.svg)](https://www.npmjs.com/package/ringbufkit)
[![npm downloads](https://img.shields.io/npm/dm/ringbufkit.svg)](https://www.npmjs.com/package/ringbufkit)
[![CI](https://img.shields.io/github/actions/workflow/status/trananhtung/ringbufkit/ci.yml?branch=main)](https://github.com/trananhtung/ringbufkit/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Zero-dependency typed Ring Buffer (circular buffer) — fixed-capacity FIFO, O(1) push/shift/pop/peek.**

Inspired by Python's [`collections.deque(maxlen=N)`](https://docs.python.org/3/library/collections.html#collections.deque), Java's `ArrayDeque` / Apache Commons `CircularFifoQueue`, C#'s `CircularBuffer<T>`, and Go's `container/ring` — now in pure TypeScript with no runtime dependencies.

```ts
import { RingBuffer } from "ringbufkit";

// Sliding window of last 3 readings
const window = new RingBuffer<number>(3);
window.push(10).push(20).push(30);
window.push(40); // drops oldest (10) automatically

window.toArray();  // [20, 30, 40]
window.peek();     // 20  — oldest
window.peekBack(); // 40  — newest
window.at(-1);     // 40  — negative indexing
```

## Features

- **Fixed-capacity circular buffer** — pre-allocated, no resizing, no copying
- **O(1)** `push`, `shift`, `pop`, `peek`, `peekBack`, `at(i)`
- **Two overflow policies**: `"overwrite"` (default, like Python `deque(maxlen)`) or `"throw"`
- **Negative indexing** via `at(i)` — `at(-1)` is newest
- Full iteration: `[Symbol.iterator]`, `toArray()`, spread, `for-of`
- **`clone()`** — independent copy preserving capacity and policy
- Zero dependencies, TypeScript-first, ESM + CJS

## Install

```bash
npm install ringbufkit
```

## Usage

### Sliding window (overwrite, default)

```ts
import { RingBuffer } from "ringbufkit";

const buf = new RingBuffer<number>(4);
for (const n of [1, 2, 3, 4, 5, 6]) buf.push(n);

buf.toArray();  // [3, 4, 5, 6]
buf.size;       // 4
buf.isFull;     // true
buf.peek();     // 3  (oldest)
buf.peekBack(); // 6  (newest)
```

### Strict mode (throw on overflow)

```ts
const buf = new RingBuffer<string>(2, { full: "throw" });
buf.push("a").push("b");
buf.push("c"); // throws RangeError: buffer is full (capacity 2)
```

### Dequeue operations

```ts
const buf = new RingBuffer<number>(5);
buf.push(1).push(2).push(3);

buf.shift(); // 1  — remove from front (oldest)
buf.pop();   // 3  — remove from back (newest)
buf.toArray(); // [2]
```

### Random access

```ts
const buf = new RingBuffer<string>(4);
buf.push("a").push("b").push("c");

buf.at(0);   // "a"  — oldest
buf.at(2);   // "c"  — newest
buf.at(-1);  // "c"  — same as at(size - 1)
buf.at(-2);  // "b"
buf.at(99);  // undefined
```

### Iteration

```ts
const buf = new RingBuffer<number>(3);
buf.push(7).push(8).push(9);

[...buf];             // [7, 8, 9]  — oldest to newest
for (const n of buf) console.log(n);
buf.toArray();        // [7, 8, 9]  — copy
```

## API

| Method / Property | Description |
|---|---|
| `new RingBuffer(capacity, options?)` | Create buffer. Throws `RangeError` if capacity < 1 or non-integer. |
| `push(item)` | Add to back. On full: overwrite oldest or throw. Chainable. |
| `shift()` | Remove and return oldest (front). `undefined` if empty. |
| `pop()` | Remove and return newest (back). `undefined` if empty. |
| `peek()` | Return oldest without removing. `undefined` if empty. |
| `peekBack()` | Return newest without removing. `undefined` if empty. |
| `at(i)` | Return item at logical index (0 = oldest). Negative indexing supported. |
| `clear()` | Remove all items. Capacity unchanged. |
| `clone()` | Return independent copy with same capacity and policy. |
| `toArray()` | `T[]` — copy in order oldest → newest. |
| `[Symbol.iterator]` | Iterate oldest → newest. |
| `capacity` | Maximum items. |
| `size` | Current items. |
| `isEmpty` | `true` when `size === 0`. |
| `isFull` | `true` when `size === capacity`. |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `full` | `"overwrite" \| "throw"` | `"overwrite"` | Overflow policy. |

## Use cases

- **Sliding window** — keep last N sensor readings, log lines, events
- **Rate limiting** — fixed-size event history for token bucket helpers
- **Undo/redo history** — bounded command stack with automatic eviction
- **Audio / streaming** — lock-free style fixed buffer for sample chunks
- **LRU approximation** — simple eviction without a full LRU implementation

## vs. alternatives

| Package | TypeScript | ESM | `at(i)` | Clone | `"throw"` mode | Maintained |
|---------|-----------|-----|---------|-------|----------------|------------|
| **ringbufkit** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| circular_buffer_js | partial | ✅ | ❌ | ❌ | ❌ | ❌ (2022) |
| circular-buffer | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (2020) |

## Contributors ✨

Contributions of any kind are welcome! See the [contributing guide](https://github.com/all-contributors/all-contributors) and add yourself via `@all-contributors please add @<username> for <contributions>`.

<!-- ALL-CONTRIBUTORS-LIST:START --><!-- ALL-CONTRIBUTORS-LIST:END -->

## License

MIT © [trananhtung](https://github.com/trananhtung)
