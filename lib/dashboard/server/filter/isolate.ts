import type { KeyContext } from '../keys/registry';
import type { UsageEventDto } from '../upstream/types';
import { safeEq } from '../keys/fingerprint';

function assertKeyIdentifier(row: UsageEventDto): string {
  if (row.keyIdentifier === undefined || row.keyIdentifier === '') {
    throw new Error('Usage row is missing keyIdentifier');
  }

  return row.keyIdentifier;
}

export function filterEventsForKey(rows: UsageEventDto[], ctx: KeyContext): UsageEventDto[] {
  return rows.filter((row) => safeEq(assertKeyIdentifier(row), ctx.identifierForRows));
}

export function assertAllRowsBelongToKey(rows: UsageEventDto[], ctx: KeyContext): void {
  for (const row of rows) {
    const identifier = assertKeyIdentifier(row);
    if (!safeEq(identifier, ctx.identifierForRows)) {
      throw new Error('Key isolation invariant violated: foreign usage row detected');
    }
  }
}
