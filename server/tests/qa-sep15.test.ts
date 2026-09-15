import test from 'node:test';
import assert from 'node:assert/strict';
import { dateRange } from '../utils/dateRange.js';
import { literalRegex } from '../utils/literalRegex.js';
import { getBookings } from '../controllers/booking.controller.js';
import { getPayouts } from '../controllers/payout.controller.js';
import { getCustomers } from '../controllers/customer.controller.js';
import { Booking } from '../models/Booking.js';
import { Payout } from '../models/Payout.js';
import { User } from '../models/User.js';
import type { Request, Response } from 'express';

test('date filters include late end-day records and reject invalid/inverted dates',()=>{
  const range=dateRange('2026-09-01','2026-09-15')!;
  assert.equal(range.$lte!.toISOString(),'2026-09-15T23:59:59.999Z');
  assert.ok(new Date('2026-09-15T23:58:00Z')<=range.$lte!);
  for(const pair of [['2026-02-30',''],['2026-09-16','2026-09-15'],['invalid','']])assert.throws(()=>dateRange(pair[0],pair[1]));
  assert.equal(dateRange('',''),undefined);
  assert.ok(literalRegex('A+B').test('a+b'));assert.ok(!literalRegex('A+B').test('aaab'));
});

test('owner booking and payout filters retain salon scope and pagination',async(t)=>{
  const pipelines: unknown[][]=[];
  t.mock.method(Booking,'aggregate',async(pipeline:unknown[])=>{pipelines.push(pipeline);return [{data:[],totalCount:[]}];});
  t.mock.method(Payout,'aggregate',async(pipeline:unknown[])=>{pipelines.push(pipeline);return [{data:[],totalCount:[]}];});
  const req={user:{role:'salon_owner',salonId:'owned-salon'},query:{staff:'A+B',salonId:'another-salon',page:'2',limit:'100',netMin:'0',netMax:'10000',payoutFrom:'2026-09-01',payoutTo:'2026-09-15',dateTo:'2026-09-15'}};
  const response={json:()=>{}} as unknown as Response;
  const next=(error?:unknown)=>{if(error)throw error;};
  await getBookings(req as unknown as Request,response,next);
  await getPayouts(req as unknown as Request,response,next);
  const booking=pipelines[0] as Record<string,Record<string,unknown>>[];
  assert.equal(booking[0].$match.salonId,'owned-salon');
  const staff=booking.find(step=>step.$match?.['staffId.name'])!.$match['staffId.name'] as RegExp;
  assert.ok(staff.test('A+B'));assert.ok(!staff.test('AAAB'));
  const payout=pipelines[1] as Record<string,Record<string,unknown>>[];
  assert.equal(payout[0].$match.salonId,'owned-salon');
  assert.deepEqual(payout[0].$match.amountInPaisa,{$gte:0,$lte:10000});
  assert.deepEqual(payout[0].$match.payoutDate,dateRange('2026-09-01','2026-09-15'));
});

test('owner customer filters apply to both records and total without exposing other salons',async(t)=>{
  const queries:Record<string,unknown>[]=[];
  t.mock.method(Booking,'distinct',async()=>['owned-customer']);
  t.mock.method(User,'find',(query:Record<string,unknown>)=>{queries.push(query);return {select:()=>({sort:()=>({skip:()=>({limit:async()=>[]})})})};});
  t.mock.method(User,'countDocuments',async(query:Record<string,unknown>)=>{queries.push(query);return 0;});
  await getCustomers({user:{role:'salon_owner',salonId:'owned-salon'},query:{name:'A+B',email:'@example.test',status:'active',toDate:'2026-09-15'}} as unknown as Request,{json:()=>{}} as unknown as Response,(error?:unknown)=>{if(error)throw error;});
  assert.deepEqual(queries[0],queries[1]);assert.deepEqual(queries[0]._id,{$in:['owned-customer']});
  assert.equal(queries[0].status,'active');assert.ok((queries[0].name as RegExp).test('A+B'));
  assert.deepEqual(queries[0].createdAt,dateRange('','2026-09-15'));
});
