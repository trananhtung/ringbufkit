import { RingBuffer } from "../src/index.js";

describe("RingBuffer — construction", () => {
  test("creates empty buffer with given capacity", () => {
    const rb = new RingBuffer<number>(4);
    expect(rb.capacity).toBe(4);
    expect(rb.size).toBe(0);
    expect(rb.isEmpty).toBe(true);
    expect(rb.isFull).toBe(false);
  });

  test("throws on non-positive capacity", () => {
    expect(() => new RingBuffer(0)).toThrow(RangeError);
    expect(() => new RingBuffer(-1)).toThrow(RangeError);
    expect(() => new RingBuffer(1.5)).toThrow(RangeError);
  });

  test("capacity 1 works", () => {
    const rb = new RingBuffer<string>(1);
    rb.push("a");
    expect(rb.size).toBe(1);
    expect(rb.isFull).toBe(true);
  });
});

describe("RingBuffer — push / size / isFull", () => {
  test("push adds items and tracks size", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1).push(2).push(3);
    expect(rb.size).toBe(3);
    expect(rb.isFull).toBe(true);
  });

  test("push is chainable", () => {
    const rb = new RingBuffer<number>(5);
    rb.push(1).push(2).push(3);
    expect(rb.size).toBe(3);
  });

  test("overwrite policy wraps and drops oldest", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1).push(2).push(3);
    rb.push(4); // drops 1
    expect(rb.toArray()).toEqual([2, 3, 4]);
    expect(rb.size).toBe(3);
  });

  test("multiple overwrites work correctly", () => {
    const rb = new RingBuffer<number>(3);
    for (let i = 1; i <= 9; i++) rb.push(i);
    expect(rb.toArray()).toEqual([7, 8, 9]);
  });

  test("throw policy throws on full buffer", () => {
    const rb = new RingBuffer<number>(2, { full: "throw" });
    rb.push(1).push(2);
    expect(() => rb.push(3)).toThrow(RangeError);
    // buffer unchanged
    expect(rb.toArray()).toEqual([1, 2]);
  });
});

describe("RingBuffer — shift (dequeue from front)", () => {
  test("shift returns oldest item", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(10).push(20).push(30);
    expect(rb.shift()).toBe(10);
    expect(rb.size).toBe(2);
  });

  test("shift on empty returns undefined", () => {
    const rb = new RingBuffer<number>(3);
    expect(rb.shift()).toBeUndefined();
  });

  test("shift then push respects wrap-around", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1).push(2).push(3);
    rb.shift(); // removes 1
    rb.push(4);
    expect(rb.toArray()).toEqual([2, 3, 4]);
  });

  test("drain entire buffer via shift", () => {
    const rb = new RingBuffer<string>(3);
    rb.push("a").push("b").push("c");
    expect(rb.shift()).toBe("a");
    expect(rb.shift()).toBe("b");
    expect(rb.shift()).toBe("c");
    expect(rb.shift()).toBeUndefined();
    expect(rb.isEmpty).toBe(true);
  });
});

describe("RingBuffer — pop (dequeue from back)", () => {
  test("pop returns newest item", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(10).push(20).push(30);
    expect(rb.pop()).toBe(30);
    expect(rb.size).toBe(2);
  });

  test("pop on empty returns undefined", () => {
    const rb = new RingBuffer<number>(3);
    expect(rb.pop()).toBeUndefined();
  });

  test("pop then push stays consistent", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1).push(2).push(3);
    rb.pop(); // removes 3
    rb.push(4);
    expect(rb.toArray()).toEqual([1, 2, 4]);
  });
});

describe("RingBuffer — peek / peekBack", () => {
  test("peek returns oldest without removing", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(5).push(10);
    expect(rb.peek()).toBe(5);
    expect(rb.size).toBe(2);
  });

  test("peekBack returns newest without removing", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(5).push(10);
    expect(rb.peekBack()).toBe(10);
    expect(rb.size).toBe(2);
  });

  test("peek on empty returns undefined", () => {
    expect(new RingBuffer<number>(2).peek()).toBeUndefined();
    expect(new RingBuffer<number>(2).peekBack()).toBeUndefined();
  });
});

describe("RingBuffer — at(i)", () => {
  test("at returns item by logical index", () => {
    const rb = new RingBuffer<string>(4);
    rb.push("a").push("b").push("c");
    expect(rb.at(0)).toBe("a");
    expect(rb.at(1)).toBe("b");
    expect(rb.at(2)).toBe("c");
  });

  test("at supports negative indexing", () => {
    const rb = new RingBuffer<string>(4);
    rb.push("a").push("b").push("c");
    expect(rb.at(-1)).toBe("c");
    expect(rb.at(-2)).toBe("b");
    expect(rb.at(-3)).toBe("a");
  });

  test("at returns undefined for out-of-range", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1);
    expect(rb.at(5)).toBeUndefined();
    expect(rb.at(-5)).toBeUndefined();
  });

  test("at works correctly after wrap-around", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1).push(2).push(3).push(4); // drops 1
    expect(rb.at(0)).toBe(2);
    expect(rb.at(1)).toBe(3);
    expect(rb.at(2)).toBe(4);
  });
});

describe("RingBuffer — clear", () => {
  test("clear resets size and allows reuse", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1).push(2).push(3);
    rb.clear();
    expect(rb.size).toBe(0);
    expect(rb.isEmpty).toBe(true);
    rb.push(9);
    expect(rb.peek()).toBe(9);
  });
});

describe("RingBuffer — iteration", () => {
  test("[Symbol.iterator] yields oldest to newest", () => {
    const rb = new RingBuffer<number>(4);
    rb.push(1).push(2).push(3);
    expect([...rb]).toEqual([1, 2, 3]);
  });

  test("toArray returns correct order after wrap", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1).push(2).push(3).push(4); // wraps; drops 1
    expect(rb.toArray()).toEqual([2, 3, 4]);
  });

  test("for-of works", () => {
    const rb = new RingBuffer<string>(3);
    rb.push("x").push("y").push("z");
    const out: string[] = [];
    for (const s of rb) out.push(s);
    expect(out).toEqual(["x", "y", "z"]);
  });

  test("spread operator works", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(7).push(8).push(9);
    expect([...rb]).toEqual([7, 8, 9]);
  });
});

describe("RingBuffer — clone", () => {
  test("clone returns independent copy", () => {
    const rb = new RingBuffer<number>(4);
    rb.push(1).push(2).push(3);
    const copy = rb.clone();
    expect(copy.toArray()).toEqual([1, 2, 3]);
    expect(copy.capacity).toBe(4);
    rb.push(99);
    expect(copy.toArray()).not.toContain(99);
  });

  test("clone preserves full policy", () => {
    const rb = new RingBuffer<number>(2, { full: "throw" });
    rb.push(1).push(2);
    const copy = rb.clone();
    expect(() => copy.push(3)).toThrow(RangeError);
  });
});

describe("RingBuffer — edge cases", () => {
  test("interleaved push and shift maintain correct order", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1).push(2);
    rb.shift(); // remove 1
    rb.push(3).push(4);
    // buffer: [2, 3, 4]
    expect(rb.toArray()).toEqual([2, 3, 4]);
    rb.push(5); // overwrite drops 2
    expect(rb.toArray()).toEqual([3, 4, 5]);
  });

  test("single-element buffer overwrite works", () => {
    const rb = new RingBuffer<number>(1);
    rb.push(1);
    rb.push(2);
    expect(rb.toArray()).toEqual([2]);
  });

  test("symbol.toStringTag", () => {
    const rb = new RingBuffer<number>(2);
    expect(Object.prototype.toString.call(rb)).toBe("[object RingBuffer]");
  });
});
