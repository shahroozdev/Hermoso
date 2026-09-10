import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Service } from '../models/Service.js';
import { Booking } from '../models/Booking.js';
import { Payout } from '../models/Payout.js';
import { Event } from '../models/Event.js';

const id = () => new mongoose.Types.ObjectId();
test('BUG-144: legacy service price is recovered without altering existing paisa', async () => {
  const raw = { _id: id(), salonId: id(), name: 'Hair cut', categoryId: id(), category: 'Hair', duration: 30, price: 1250.75 };
  const legacy = Service.hydrate({ ...raw });
  assert.equal(legacy.priceInPaisa, 125075);
  await legacy.validate();
  assert.equal(legacy.isModified('priceInPaisa'), true);
  assert.equal(Service.hydrate({ ...raw, priceInPaisa: 0 }).priceInPaisa, 0);
  assert.equal(Service.hydrate({ ...raw, priceInPaisa: 5500 }).priceInPaisa, 5500);
  const missing = { ...raw, price: undefined };
  await assert.rejects(Service.hydrate(missing).validate(), /priceInPaisa/);
});
test('BUG-156/157: legacy booking validates after confirming or cancelling', async () => {
  for (const status of ['confirmed', 'cancelled']) {
    const booking = Booking.hydrate({ _id: id(), customerId: id(), salonId: id(), serviceId: id(), staffId: id(), bookingDate: new Date(), bookingTime: '23:59', price: 900, status });
    await booking.validate();
    assert.equal(booking.priceInPaisa, 90000);
    assert.equal(booking.isModified('priceInPaisa'), true);
  }
});
test('BUG-129/161: legacy payout can be resolved without losing its amount', async () => {
  const payout = Payout.hydrate({ _id: id(), salonId: id(), amount: 123.45, status: 'pending' });
  payout.status = 'completed';
  await payout.validate();
  assert.equal(payout.amountInPaisa, 12345);
  assert.equal(payout.isModified('amountInPaisa'), true);
});
test('BUG-144/145: event totals are computed before required-field validation', async () => {
  const event = new Event({ salonId: id(), name: 'Package', category: 'bridal', discount: 10, services: [
    { serviceId: id(), serviceName: 'Hair', priceInPaisa: 100050, duration: 30 },
    { serviceId: id(), serviceName: 'Facial', priceInPaisa: 200025, duration: 60 },
  ] });
  await event.validate();
  assert.equal(event.totalPriceInPaisa, 300075);
  assert.equal(event.finalPriceInPaisa, 270067);
  assert.equal(event.totalDuration, 90);
});
test('legacy event service snapshots are recovered before recalculation', async () => {
  const event = Event.hydrate({ _id: id(), salonId: id(), name: 'Old package', category: 'bridal', discount: 10, totalPrice: 100, finalPrice: 90, totalDuration: 30,
    services: [{ serviceId: id(), serviceName: 'Hair', price: 100, duration: 30 }],
  });
  await event.validate();
  assert.equal(event.services[0].priceInPaisa, 10000);
  assert.equal(event.finalPriceInPaisa, 9000);
});
test('BUG-133: price filters include legacy amounts and retain salon scope', async (t) => {
  let captured: Record<string, unknown> = {};
  t.mock.method(Service.collection, 'find', (filter: Record<string, unknown>) => {
    captured = filter;
    return { toArray: async () => [] };
  });
  const salonId = id();
  await Service.find({ salonId, priceInPaisa: { $gte: 125075, $lte: 125075 } });
  assert.equal(String(captured.salonId), String(salonId));
  assert.equal(captured.priceInPaisa, undefined);
  assert.deepEqual(captured.$and, [{ $expr: { $and: [
    { $gte: [{ $ifNull: ['$priceInPaisa', { $round: [{ $multiply: ['$price', 100] }, 0] }] }, 125075] },
    { $lte: [{ $ifNull: ['$priceInPaisa', { $round: [{ $multiply: ['$price', 100] }, 0] }] }, 125075] },
  ] } }]);
});
