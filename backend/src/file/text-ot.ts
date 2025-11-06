export type TextComponent =
  | { retain: number }
  | { insert: string }
  | { delete: number };

export type TextOperation = TextComponent[];

type ComponentType = "retain" | "insert" | "delete" | "none";

function componentType(component: TextComponent | null | undefined): ComponentType {
  if (!component) return "none";
  if ("retain" in component) return "retain";
  if ("insert" in component) return "insert";
  if ("delete" in component) return "delete";
  return "none";
}

function componentLength(component: TextComponent): number {
  if ("retain" in component) return component.retain;
  if ("insert" in component) return component.insert.length;
  return component.delete;
}

export function normalizeOperation(input: TextOperation): TextOperation {
  const normalized: TextOperation = [];
  for (const component of input) {
    if ("retain" in component) {
      if (component.retain <= 0) continue;
    } else if ("delete" in component) {
      if (component.delete <= 0) continue;
    } else if ("insert" in component) {
      if (component.insert.length === 0) continue;
    }

    const last = normalized[normalized.length - 1];
    if (!last) {
      normalized.push({ ...component });
      continue;
    }

    const lastType = componentType(last);
    const nextType = componentType(component);
    if (lastType === nextType) {
      if (lastType === "retain") {
        (last as { retain: number }).retain += (component as { retain: number }).retain;
      } else if (lastType === "insert") {
        (last as { insert: string }).insert += (component as { insert: string }).insert;
      } else if (lastType === "delete") {
        (last as { delete: number }).delete += (component as { delete: number }).delete;
      }
      continue;
    }

    normalized.push({ ...component });
  }

  return normalized;
}

export function applyOperation(content: string, op: TextOperation): string {
  const normalized = normalizeOperation(op);
  let cursor = 0;
  let result = "";

  for (const component of normalized) {
    if ("retain" in component) {
      if (cursor + component.retain > content.length) {
        throw new Error("Retain extends beyond document bounds.");
      }
      result += content.slice(cursor, cursor + component.retain);
      cursor += component.retain;
    } else if ("insert" in component) {
      result += component.insert;
    } else if ("delete" in component) {
      if (cursor + component.delete > content.length) {
        throw new Error("Delete extends beyond document bounds.");
      }
      cursor += component.delete;
    }
  }

  result += content.slice(cursor);
  return result;
}

class OperationIterator {
  private index = 0;
  private offset = 0;

  constructor(private readonly op: TextOperation) {}

  peekType(): ComponentType {
    return componentType(this.op[this.index]);
  }

  peakComponent(): TextComponent | null {
    const comp = this.op[this.index];
    if (!comp) return null;
    if ("retain" in comp) {
      return { retain: comp.retain - this.offset };
    }
    if ("insert" in comp) {
      return {
        insert: comp.insert.slice(this.offset),
      };
    }
    return { delete: comp.delete - this.offset };
  }

  peekLength(): number {
    const comp = this.op[this.index];
    if (!comp) return 0;
    if ("retain" in comp) {
      return comp.retain - this.offset;
    }
    if ("insert" in comp) {
      return comp.insert.length - this.offset;
    }
    return comp.delete - this.offset;
  }

  hasNext(): boolean {
    return this.index < this.op.length;
  }

  next(length?: number): TextComponent | null {
    const comp = this.op[this.index];
    if (!comp) return null;

    const available = this.peekLength();
    const consume = length ? Math.min(length, available) : available;

    let chunk: TextComponent;
    if ("retain" in comp) {
      chunk = { retain: consume };
    } else if ("insert" in comp) {
      chunk = { insert: comp.insert.slice(this.offset, this.offset + consume) };
    } else {
      chunk = { delete: consume };
    }

    this.offset += consume;
    if (this.offset >= componentLength(comp)) {
      this.index += 1;
      this.offset = 0;
    }

    return chunk;
  }
}

export function transformOperation(
  operation: TextOperation,
  against: TextOperation,
  bias: "left" | "right" = "right",
): TextOperation {
  const a = new OperationIterator(normalizeOperation(operation));
  const b = new OperationIterator(normalizeOperation(against));
  const result: TextOperation = [];

  const push = (component: TextComponent | null) => {
    if (!component) return;
    const prev = result[result.length - 1];
    if (!prev) {
      result.push(component);
      return;
    }
    const prevType = componentType(prev);
    const nextType = componentType(component);
    if (prevType === nextType) {
      if (prevType === "retain") {
        (prev as { retain: number }).retain += (component as { retain: number }).retain;
      } else if (prevType === "insert") {
        (prev as { insert: string }).insert += (component as { insert: string }).insert;
      } else if (prevType === "delete") {
        (prev as { delete: number }).delete += (component as { delete: number }).delete;
      }
      return;
    }
    result.push(component);
  };

  while (a.hasNext()) {
    const typeA = a.peekType();
    if (typeA === "insert") {
      push(a.next());
      continue;
    }

    if (!b.hasNext()) {
      push(a.next());
      continue;
    }

    const typeB = b.peekType();

    if (typeB === "insert") {
      const chunk = b.next();
      if (bias === "left") {
        push({ retain: componentLength(chunk!) });
      } else {
        push({ retain: componentLength(chunk!) });
      }
      continue;
    }

    const len = Math.min(a.peekLength(), b.peekLength());
    if (len <= 0) {
      break;
    }

    if (typeA === "retain" && typeB === "retain") {
      push({ retain: len });
      a.next(len);
      b.next(len);
      continue;
    }

    if (typeA === "retain" && typeB === "delete") {
      b.next(len);
      a.next(len);
      continue;
    }

    if (typeA === "delete" && typeB === "retain") {
      push({ delete: len });
      a.next(len);
      b.next(len);
      continue;
    }

    if (typeA === "delete" && typeB === "delete") {
      a.next(len);
      b.next(len);
      continue;
    }
  }

  return normalizeOperation(result);
}
