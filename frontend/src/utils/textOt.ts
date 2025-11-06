export type TextComponent =
  | { retain: number }
  | { insert: string }
  | { delete: number };

export type TextOperation = TextComponent[];

type ComponentType = "retain" | "insert" | "delete" | "none";

function componentType(component: TextComponent | undefined): ComponentType {
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

export function normalizeOperation(operation: TextOperation): TextOperation {
  const normalized: TextOperation = [];
  for (const component of operation) {
    if ("retain" in component && component.retain <= 0) {
      continue;
    }
    if ("insert" in component && component.insert.length === 0) {
      continue;
    }
    if ("delete" in component && component.delete <= 0) {
      continue;
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

export function applyOperation(content: string, operation: TextOperation): string {
  const normalized = normalizeOperation(operation);
  let cursor = 0;
  let result = "";

  for (const component of normalized) {
    if ("retain" in component) {
      result += content.slice(cursor, cursor + component.retain);
      cursor += component.retain;
      continue;
    }
    if ("insert" in component) {
      result += component.insert;
      continue;
    }
    if ("delete" in component) {
      cursor += component.delete;
    }
  }

  result += content.slice(cursor);
  return result;
}

class OperationIterator {
  private index = 0;
  private offset = 0;
  private readonly op: TextOperation;

  constructor(op: TextOperation) {
    this.op = op;
  }

  hasNext(): boolean {
    return this.index < this.op.length;
  }

  peekType(): ComponentType {
    return componentType(this.op[this.index]);
  }

  peekLength(): number {
    const component = this.op[this.index];
    if (!component) return 0;
    if ("retain" in component) {
      return component.retain - this.offset;
    }
    if ("insert" in component) {
      return component.insert.length - this.offset;
    }
    return component.delete - this.offset;
  }

  next(length?: number): TextComponent | null {
    const component = this.op[this.index];
    if (!component) return null;

    const available = this.peekLength();
    const consume = length ? Math.min(length, available) : available;

    let chunk: TextComponent;
    if ("retain" in component) {
      chunk = { retain: consume };
    } else if ("insert" in component) {
      chunk = {
        insert: component.insert.slice(this.offset, this.offset + consume),
      };
    } else {
      chunk = { delete: consume };
    }

    this.offset += consume;
    if (this.offset >= componentLength(component)) {
      this.index += 1;
      this.offset = 0;
    }

    return chunk;
  }
}

export function transformOperation(
  operation: TextOperation,
  against: TextOperation,
): TextOperation {
  const iterator = new OperationIterator(normalizeOperation(operation));
  const other = new OperationIterator(normalizeOperation(against));
  const result: TextOperation = [];

  const push = (component: TextComponent | null) => {
    if (!component) return;
    const last = result[result.length - 1];
    if (!last) {
      result.push(component);
      return;
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
      return;
    }
    result.push(component);
  };

  while (iterator.hasNext()) {
    const type = iterator.peekType();
    if (type === "insert") {
      push(iterator.next());
      continue;
    }

    if (!other.hasNext()) {
      push(iterator.next());
      continue;
    }

    const otherType = other.peekType();
    if (otherType === "insert") {
      const insert = other.next();
      if (insert && "insert" in insert) {
        push({ retain: insert.insert.length });
      }
      continue;
    }

    const len = Math.min(iterator.peekLength(), other.peekLength());
    if (type === "retain" && otherType === "retain") {
      push({ retain: len });
      iterator.next(len);
      other.next(len);
      continue;
    }

    if (type === "retain" && otherType === "delete") {
      iterator.next(len);
      other.next(len);
      continue;
    }

    if (type === "delete" && otherType === "retain") {
      push({ delete: len });
      iterator.next(len);
      other.next(len);
      continue;
    }

    if (type === "delete" && otherType === "delete") {
      iterator.next(len);
      other.next(len);
    }
  }

  return normalizeOperation(result);
}

export function diffToOperation(before: string, after: string): TextOperation {
  if (before === after) {
    return [];
  }

  let start = 0;
  const minLength = Math.min(before.length, after.length);
  while (start < minLength && before[start] === after[start]) {
    start += 1;
  }

  let endBefore = before.length;
  let endAfter = after.length;
  while (
    endBefore > start &&
    endAfter > start &&
    before[endBefore - 1] === after[endAfter - 1]
  ) {
    endBefore -= 1;
    endAfter -= 1;
  }

  const operation: TextOperation = [];
  if (start > 0) {
    operation.push({ retain: start });
  }

  const deleteCount = endBefore - start;
  if (deleteCount > 0) {
    operation.push({ delete: deleteCount });
  }

  const insertText = after.slice(start, endAfter);
  if (insertText.length > 0) {
    operation.push({ insert: insertText });
  }

  const tailRetain = before.length - endBefore;
  if (tailRetain > 0) {
    operation.push({ retain: tailRetain });
  }

  return normalizeOperation(operation);
}
