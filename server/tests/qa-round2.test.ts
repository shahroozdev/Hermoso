import test from 'node:test';
import assert from 'node:assert/strict';
import { numericRange } from '../utils/numericRange.js';
import { validateStaffCommission } from '../utils/staffValidation.js';
import { adminFilters } from '../utils/adminFilters.js';
import { getServicesSchema } from '../schemas/service.schema.js';
import { getEventsSchema } from '../schemas/event.schema.js';
import { createNotificationRecord } from '../controllers/notification.controller.js';
import type { Request, Response } from 'express';

test('BUG-180: every comparison keeps strict versus inclusive boundaries and zero',()=>{
  const values=[0,9,10,11,20];
  const matches=(op:string,value:number)=>{
    const query=numericRange('10','',op)!;
    if('$eq' in query) return value===query.$eq;
    if('$gt' in query) return value>query.$gt;
    if('$gte' in query) return value>=query.$gte;
    if('$lt' in query) return value<query.$lt;
    return value<=query.$lte;
  };
  assert.deepEqual(values.filter(v=>matches('gt',v)),[11,20]);
  assert.deepEqual(values.filter(v=>matches('gte',v)),[10,11,20]);
  assert.deepEqual(values.filter(v=>matches('lt',v)),[0,9]);
  assert.deepEqual(values.filter(v=>matches('lte',v)),[0,9,10]);
  assert.deepEqual(values.filter(v=>matches('eq',v)),[10]);
  assert.deepEqual(numericRange('','0','lte'),{$lte:0});
  assert.equal(numericRange('','','gt'),undefined);
  assert.equal(numericRange('invalid','','eq'),undefined);
});
test('BUG-133/139: query validation retains the operator sent with paisa amounts',()=>{
  assert.equal(getServicesSchema.shape.query.parse({priceMin:'125000',priceOp:'gt'}).priceOp,'gt');
  assert.equal(getEventsSchema.shape.query.parse({finalPriceMax:'50000',finalPriceOp:'lt'}).finalPriceOp,'lt');
});
test('BUG-200: add/edit commission accepts boundaries and rejects invalid values before saving',()=>{
  for(const value of [-1,101,NaN,Infinity,'-1',null]) assert.throws(()=>validateStaffCommission({staffDetails:{commissionPercentage:value}}),/Commission/);
  for(const value of [0,5.5,100,undefined]) assert.doesNotThrow(()=>validateStaffCommission({staffDetails:{commissionPercentage:value}}));
});
test('BUG-194/195: admin list/export filters keep role scope and include the complete end date',()=>{
  const match=adminFilters({role:'admin',fromDate:'2026-09-01',toDate:'2026-09-12',search:'qa+name'});
  assert.equal(match.role,'admin');
  assert.deepEqual(match.createdAt,{$gte:new Date('2026-09-01T00:00:00.000Z'),$lte:new Date('2026-09-12T23:59:59.999Z')});
  assert.throws(()=>adminFilters({role:'customer'}),/Invalid admin role/);
  assert.throws(()=>adminFilters({fromDate:'2026-09-31'}),/Invalid joined date/);
  assert.throws(()=>adminFilters({fromDate:'2026-09-12',toDate:'2026-09-01'}),/From date/);
  assert.deepEqual(adminFilters({}).role,{$in:['admin','super_admin']});
});
test('BUG-100: a missing or display-label notification type cannot silently create an announcement',async()=>{
  for(const type of ['',undefined,'Announcement']) {
    let error: Error | undefined;
    await createNotificationRecord({body:{title:'Test',message:'Test',targetRole:'customer',type}} as Request,{} as Response,(err)=>{error=err;});
    assert.match(error?.message || '',/valid notification type/);
  }
});
