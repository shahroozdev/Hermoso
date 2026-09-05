/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
// One-time migration: converts every money field in the DB from decimal rupees
// to integer paisa (1 rupee = 100 paisa) and renames each field with an
// `InPaisa` suffix. Safe to re-run — it exits early once the migration marker
// exists, unless --force is passed.
//
// Usage:
//   tsx scripts/migrate-paisa.ts --dry-run   # inspect what would change, no writes
//   tsx scripts/migrate-paisa.ts             # run for real
//   tsx scripts/migrate-paisa.ts --force     # re-run even if already migrated
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Booking } from '../models/Booking.js';
import { Service } from '../models/Service.js';
import { Event } from '../models/Event.js';
import { Payment } from '../models/Payment.js';
import { Refund } from '../models/Refund.js';
import { Payout } from '../models/Payout.js';
import { Salon } from '../models/Salon.js';
import { POS } from '../models/POS.js';

dotenv.config();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

const MIGRATION_ID = 'paisa-migration-v1';

const toPaisaExpr = (field: string) => ({ $round: [{ $multiply: [`$${field}`, 100] }, 0] });

async function alreadyMigrated(): Promise<boolean> {
  const doc = await (mongoose.connection.collection('migrations') as any).findOne({ _id: MIGRATION_ID });
  return Boolean(doc);
}

async function markMigrated(): Promise<void> {
  await (mongoose.connection.collection('migrations') as any).insertOne({ _id: MIGRATION_ID, appliedAt: new Date() });
}

async function migrateBookings(): Promise<void> {
  if (dryRun) {
    const sample = await Booking.find({ price: { $exists: true } }).limit(5).lean();
    console.log('Booking sample:', sample.map((b: any) => ({ before: b.price, after: Math.round(b.price * 100) })));
    console.log(`Would migrate ${await Booking.countDocuments({ price: { $exists: true } })} bookings`);
    return;
  }
  const result = await Booking.collection.updateMany({}, [
    { $set: { priceInPaisa: toPaisaExpr('price') } },
    { $unset: 'price' }
  ]);
  console.log(`Bookings modified: ${result.modifiedCount}`);
}

async function migrateServices(): Promise<void> {
  if (dryRun) {
    const sample = await Service.find({ price: { $exists: true } }).limit(5).lean();
    console.log('Service sample:', sample.map((s: any) => ({ before: s.price, after: Math.round(s.price * 100) })));
    console.log(`Would migrate ${await Service.countDocuments({ price: { $exists: true } })} services`);
    return;
  }
  const result = await Service.collection.updateMany({}, [
    { $set: { priceInPaisa: toPaisaExpr('price') } },
    { $unset: 'price' }
  ]);
  console.log(`Services modified: ${result.modifiedCount}`);
}

async function migrateEvents(): Promise<void> {
  if (dryRun) {
    const sample = await Event.find({ totalPrice: { $exists: true } }).limit(5).lean();
    console.log('Event sample:', sample.map((e: any) => ({ before: e.totalPrice, after: Math.round(e.totalPrice * 100) })));
    console.log(`Would migrate ${await Event.countDocuments({ totalPrice: { $exists: true } })} events`);
    return;
  }
  const result = await Event.collection.updateMany({}, [
    {
      $set: {
        services: {
          $map: {
            input: '$services',
            as: 's',
            in: {
              serviceId: '$$s.serviceId',
              serviceName: '$$s.serviceName',
              duration: '$$s.duration',
              priceInPaisa: { $round: [{ $multiply: ['$$s.price', 100] }, 0] }
            }
          }
        },
        totalPriceInPaisa: toPaisaExpr('totalPrice'),
        finalPriceInPaisa: toPaisaExpr('finalPrice')
      }
    },
    { $unset: ['totalPrice', 'finalPrice'] }
  ]);
  console.log(`Events modified: ${result.modifiedCount}`);
}

async function migratePayments(): Promise<void> {
  if (dryRun) {
    const sample = await Payment.find({ amount: { $exists: true } }).limit(5).lean();
    console.log('Payment sample:', sample.map((p: any) => ({ before: p.amount, after: Math.round(p.amount * 100) })));
    console.log(`Would migrate ${await Payment.countDocuments({ amount: { $exists: true } })} payments`);
    return;
  }
  const result = await Payment.collection.updateMany({}, [
    {
      $set: {
        amountInPaisa: toPaisaExpr('amount'),
        platformCommissionInPaisa: toPaisaExpr('platformCommission'),
        salonAmountInPaisa: toPaisaExpr('salonAmount'),
        refundAmountInPaisa: toPaisaExpr('refundAmount')
      }
    },
    { $unset: ['amount', 'platformCommission', 'salonAmount', 'refundAmount'] }
  ]);
  console.log(`Payments modified: ${result.modifiedCount}`);
}

async function migrateRefunds(): Promise<void> {
  if (dryRun) {
    const sample = await Refund.find({ amount: { $exists: true } }).limit(5).lean();
    console.log('Refund sample:', sample.map((r: any) => ({ before: r.amount, after: Math.round(r.amount * 100) })));
    console.log(`Would migrate ${await Refund.countDocuments({ amount: { $exists: true } })} refunds`);
    return;
  }
  const result = await Refund.collection.updateMany({}, [
    { $set: { amountInPaisa: toPaisaExpr('amount') } },
    { $unset: 'amount' }
  ]);
  console.log(`Refunds modified: ${result.modifiedCount}`);
}

async function migratePayouts(): Promise<void> {
  if (dryRun) {
    const sample = await Payout.find({ amount: { $exists: true } }).limit(5).lean();
    console.log('Payout sample:', sample.map((p: any) => ({ before: p.amount, after: Math.round(p.amount * 100) })));
    console.log(`Would migrate ${await Payout.countDocuments({ amount: { $exists: true } })} payouts`);
    return;
  }
  const result = await Payout.collection.updateMany({}, [
    { $set: { amountInPaisa: toPaisaExpr('amount') } },
    { $unset: 'amount' }
  ]);
  console.log(`Payouts modified: ${result.modifiedCount}`);
}

async function migrateSalons(): Promise<void> {
  if (dryRun) {
    const sample = await Salon.find({ averagePrice: { $exists: true } }).limit(5).lean();
    console.log('Salon sample:', sample.map((s: any) => ({ before: s.averagePrice, after: Math.round(s.averagePrice * 100) })));
    console.log(`Would migrate ${await Salon.countDocuments({ averagePrice: { $exists: true } })} salons`);
    return;
  }
  const result = await Salon.collection.updateMany({ averagePrice: { $exists: true } }, [
    { $set: { averagePriceInPaisa: toPaisaExpr('averagePrice') } },
    { $unset: 'averagePrice' }
  ]);
  console.log(`Salons modified: ${result.modifiedCount}`);
}

async function migratePOS(): Promise<void> {
  if (dryRun) {
    const sample = await POS.find({ subtotal: { $exists: true } }).limit(5).lean();
    console.log('POS sample:', sample.map((p: any) => ({ before: p.subtotal, after: Math.round(p.subtotal * 100) })));
    console.log(`Would migrate ${await POS.countDocuments({ subtotal: { $exists: true } })} POS transactions`);
    return;
  }
  const result = await POS.collection.updateMany({}, [
    {
      $set: {
        items: {
          $map: {
            input: '$items',
            as: 'i',
            in: {
              serviceId: '$$i.serviceId',
              type: '$$i.type',
              name: '$$i.name',
              qty: '$$i.qty',
              priceInPaisa: { $round: [{ $multiply: ['$$i.price', 100] }, 0] },
              discountInPaisa: { $round: [{ $multiply: ['$$i.discount', 100] }, 0] },
              totalInPaisa: { $round: [{ $multiply: ['$$i.total', 100] }, 0] }
            }
          }
        },
        subtotalInPaisa: toPaisaExpr('subtotal'),
        itemDiscountInPaisa: toPaisaExpr('itemDiscount'),
        gstAmountInPaisa: toPaisaExpr('gstAmount'),
        globalDiscountAmountInPaisa: toPaisaExpr('globalDiscountAmount'),
        grandTotalInPaisa: toPaisaExpr('grandTotal')
      }
    },
    { $unset: ['subtotal', 'itemDiscount', 'gstAmount', 'globalDiscountAmount', 'grandTotal'] }
  ]);
  console.log(`POS transactions modified: ${result.modifiedCount}`);
}

async function main() {
  await connectDB();

  if (!dryRun && !force && (await alreadyMigrated())) {
    console.log(`Migration "${MIGRATION_ID}" has already been applied. Pass --force to re-run.`);
    process.exit(0);
  }

  console.log(dryRun ? '--- DRY RUN (no writes will be made) ---' : '--- Running paisa migration ---');

  await migrateBookings();
  await migrateServices();
  await migrateEvents();
  await migratePayments();
  await migrateRefunds();
  await migratePayouts();
  await migrateSalons();
  await migratePOS();

  if (!dryRun) {
    await markMigrated();
    console.log('Migration marker recorded. Done.');
  } else {
    console.log('Dry run complete. No changes were made.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
