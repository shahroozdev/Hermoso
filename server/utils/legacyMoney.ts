import type { Schema } from 'mongoose';

// Support records written before the paisa migration without guessing missing prices.
// Existing paisa values always win, including zero. Persist recovered values on save.
export function legacyMoneyPlugin(schema: Schema, fields: Record<string, string>) {
  // Filtering must use the same value as document hydration; otherwise a legacy
  // service disappears as soon as QA applies a price filter.
  schema.pre(['find', 'findOne', 'countDocuments'], function () {
    const query = this.getFilter();
    const conditions: Record<string, unknown>[] = [];
    for (const [current, legacy] of Object.entries(fields)) {
      const filter = query[current];
      if (filter == null) continue;
      const operators = typeof filter === 'number' ? { $eq: filter } : filter;
      if (typeof operators !== 'object' || Object.keys(operators).some(op => !['$eq', '$gte', '$lte', '$gt', '$lt'].includes(op))) continue;
      const amount = { $ifNull: [`$${current}`, { $round: [{ $multiply: [`$${legacy}`, 100] }, 0] }] };
      for (const [op, value] of Object.entries(operators)) conditions.push({ [op]: [amount, value] });
      delete query[current];
    }
    if (conditions.length) {
      query.$and = [...(query.$and || []), { $expr: { $and: conditions } }];
      this.setQuery(query);
    }
  });
  schema.pre('aggregate', function () {
    const recovered = Object.fromEntries(Object.entries(fields).map(([current, legacy]) => [current,
      { $ifNull: [`$${current}`, { $round: [{ $multiply: [`$${legacy}`, 100] }, 0] }] },
    ]));
    this.pipeline().unshift({ $addFields: recovered });
  });
  schema.pre('init', function (raw: Record<string, unknown>) {
    const recovered: string[] = [];
    for (const [current, legacy] of Object.entries(fields)) {
      if (raw[current] != null || typeof raw[legacy] !== 'number') continue;
      const value = Math.round((raw[legacy] as number) * 100);
      if (!Number.isSafeInteger(value) || value < 0) continue;
      raw[current] = value;
      recovered.push(current);
    }
    this.$locals.recoveredMoney = recovered;
  });
  schema.pre('validate', function () {
    for (const field of (this.$locals.recoveredMoney || []) as string[]) this.markModified(field);
  });
}
