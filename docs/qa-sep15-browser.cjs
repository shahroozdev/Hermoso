// Run with QA_PLAYWRIGHT_PATH pointing to an installed playwright package.
// All API traffic is intercepted; this suite never changes live application data.
const { chromium } = require(process.env.QA_PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5173';
const results = [];
(async () => {
 const browser = await chromium.launch({ headless: true });
 const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
 const page = await context.newPage();
 const errors = [];
 page.on('pageerror', e => errors.push(e.message));
 let lastRequest;
 const requests=[];
 const services = Array.from({length: 30}, (_,i) => ({_id:`service-${i}`, name:`Hair service ${i}`, category:'Hair', categoryId:{_id:'cat',name:'Hair'}, priceInPaisa:125075, duration:30, description:'A very long service description with many words that must stay within the table and never break the surrounding layout or make it wider.'}));
 const notification = {_id:'campaign-1',title:'QA Campaign',message:'QA campaign description',targetRole:'customer',type:'announcement',status:'sent',createdAt:'2026-09-10T10:00:00Z',recipientCount:80};
 await page.route('**/api/**', async route => {
   const req=route.request(); const url=new URL(req.url()); const path=url.pathname;
   lastRequest={path,params:Object.fromEntries(url.searchParams),body:req.postDataJSON?.()};
   requests.push({...lastRequest, method:req.method()});
   let data=[]; let extra={};
   if(path.endsWith('/services')) data=services;
   if(path.endsWith('/bookings')) data=[{_id:'booking-1',customerId:{name:'QA Customer'},serviceId:{name:'Hair'},staffId:{name:'QA Staff'},bookingDate:'2026-09-15',status:'pending'}];
   if(path.endsWith('/customers') || path.endsWith('/customers/analytics/overview')) data=[{_id:'customer-1',name:'QA Customer',email:'customer@example.test',status:'active',createdAt:'2026-09-15T18:00:00Z'}];
   if(path.endsWith('/owners')) data=[{_id:'owner-1',name:'QA Owner',email:'owner@example.test',status:'active'}];
   if(path.endsWith('/salons/analytics/revenue')) data=Array.from({length:50},(_,i)=>({name:'Salon '+i,bookingsCount:5,grossRevenueInPaisa:100000}));
   if(path.endsWith('/categories')) data=[{_id:'cat',name:'Hair'}, {_id:'skin',name:'Skin'}];
   if(path.endsWith('/salons')) data=[{_id:'qa-salon',name:'QA Salon',owner:{name:'QA Owner',email:'qa@example.test'},status:'approved',active:true,servicesCount:30,location:{city:'Lahore',country:'Pakistan'},address:'QA test address',phone:'03000000000'}];
   if(path.endsWith('/notifications')) data=[notification];
   if(path.endsWith('/reports/summary')) data=[{...notification,readCount:20,sentAt:'2026-09-12T10:00:00Z'}, {...notification,_id:'campaign-2',title:'Owner update',targetRole:'salon_owner',readCount:0,sentAt:'2026-09-01T10:00:00Z'}];
   if(path.endsWith('/staff')) data=[{_id:'staff-1',name:'QA Stylist',email:'stylist@example.test',phone:'03000000000',status:'active',location:{city:'Lahore',country:'Pakistan'},staffDetails:{employeeId:'E1',designation:'Stylist',salary:30000,salaryType:'monthly',joiningDate:'2026-09-01',shiftStartTime:'09:00',shiftEndTime:'18:00',commissionPercentage:5,workingDays:['monday'],services:[{_id:'service-0',name:'Hair service 0'}]}}];
   if(path.endsWith('/users/admins')) {
     data=[{_id:'admin-1',name:'QA Admin',email:'admin@example.test',role:'admin',status:'active',createdAt:'2026-09-05T12:00:00Z'},{_id:'super-1',name:'QA Super',email:'super@example.test',role:'super_admin',status:'active',createdAt:'2026-08-01T12:00:00Z'}].filter(a=>(!url.searchParams.get('role')||a.role===url.searchParams.get('role'))&&(!url.searchParams.get('fromDate')||a.createdAt.slice(0,10)>=url.searchParams.get('fromDate'))&&(!url.searchParams.get('toDate')||a.createdAt.slice(0,10)<=url.searchParams.get('toDate')));
   }
   if(path.endsWith('/settings')) data={aiSkinScan:true,eventBookings:true,pushNotifications:true,selfRegistration:true,maintenanceMode:false,commissionRules:{defaultRate:10,vipRate:8,eventRate:12,promoRate:0}};
   if(path.endsWith('/analytics/admin/dashboard')) data={totals:{salons:18,customers:145,bookings:220,platformRevenueInPaisa:1900500},charts:{bookingsByMonth:[{month:'2026-08',totalBookings:100},{month:'2026-09',totalBookings:120}],categoryDistribution:[{name:'Hair',percent:60},{name:'Skin',percent:40}],trafficByCity:[{city:'Lahore',percent:70},{city:'Karachi',percent:30}],bookingStatuses:[{_id:'pending',count:20},{_id:'completed',count:200}],revenueByMonth:[{_id:'2026-08',amountInPaisa:1000000},{_id:'2026-09',amountInPaisa:2000000}],customerGrowth:[{_id:'2026-08',count:60},{_id:'2026-09',count:85}]},productMetrics:{appDownloads:200,dau:80,avgSessionMinutes:4,aiEngagement:20},activity:{scansCompleted:220,ledToBooking:120,repeatScanners:30,recommendationCtr:40},recentSalons:[]};
   if(path.endsWith('/recipients')) {data=Array.from({length:80},(_,i)=>({_id:`recipient-${i}`,user:{name:`Customer ${i}`,email:`qa${i}@example.test`,role:'customer'},isRead:false})); extra.notification=notification;}
   if(path.endsWith('/payouts')) data=[{_id:'payout-1',salonId:{name:'QA Salon'},amountInPaisa:12345,status:'completed',createdAt:'2026-09-10T10:00:00Z',payoutDate:'2026-09-10T10:00:00Z'}];
   if(path.endsWith('/reviews')) data=[{_id:'review-1',customerId:{name:'QA'},salonId:{name:'QA Salon'},rating:5,status:'approved',comment:'QA review'}];
   if(path.includes('/stats')) {data=[];}
   if(req.method() !== 'GET') data={_id:'new-item',...req.postDataJSON()};
   await route.fulfill({json:{success:true,data,meta:{total:Array.isArray(data)?data.length:0},...extra}});
 });
 const login = async (role) => {
   await context.addCookies([{name:'hermoso_access_token',value:'qa-local-fixture',url:base}]);
   await page.goto(base+'/login');
   await page.evaluate(role=>{localStorage.setItem('hermoso_user',JSON.stringify({_id:'qa-user',name:'QA User',email:'qa@example.test',role,status:'active',salonId:'qa-salon'}));localStorage.setItem('ha_theme','dark');},role);
 };
 const check = async(name,fn)=>{await fn();results.push(name);console.log('PASS '+name);};

 try {
 await login('salon_owner');
 for(const [path,label,value,param] of [['bookings','Staff','QA Staff','staff'],['customers','Email','customer@example.test','email'],['reviews','Comment','QA','search'],['revenue','Payout To','2026-09-15','payoutTo']]) {
  await check('Owner '+path+' filters, reset and matching export',async()=>{
   await page.goto(base+'/owner/'+path);
   const wait=page.waitForRequest(r=>new URL(r.url()).searchParams.get(param)===value);await page.getByLabel(label,{exact:true}).fill(value);await wait;
   const download=page.waitForEvent('download');await page.locator('.ha-content').getByRole('button',{name:'Export',exact:true}).click();assert.ok(fs.readFileSync(await (await download).path(),'utf8').length>20);
   assert.equal(requests.filter(r=>r.params[param]===value).at(-1).params.limit,'100');
   await page.getByRole('button',{name:'Reset Filters'}).click();assert.equal(await page.getByLabel(label,{exact:true}).inputValue(),'');
  });
 }
 await check('Owner export traverses every filtered page',async()=>{
  await page.route('**/api/bookings?**',async route=>{
    const url=new URL(route.request().url());
    if(url.searchParams.get('limit')!=='100')return route.fallback();
    assert.equal(url.searchParams.get('customer'),'Paged QA');
    const second=url.searchParams.get('page')==='2';
    await route.fulfill({json:{success:true,data:Array.from({length:second?1:100},(_,i)=>({_id:String(i),customerId:{name:second?'Last matching customer':'Paged QA '+i},bookingDate:'2026-09-15',status:'pending'})),meta:{total:101}}});
  });
  await page.goto(base+'/owner/bookings');await page.getByLabel('Customer',{exact:true}).fill('Paged QA');
  const download=page.waitForEvent('download');await page.locator('.ha-content').getByRole('button',{name:'Export',exact:true}).click();const csv=fs.readFileSync(await (await download).path(),'utf8');assert.ok(csv.includes('Last matching customer'));assert.equal(csv.trim().split('\n').length,102);
  await page.unroute('**/api/bookings?**');
 });
 await login('super_admin');
 for(const [path,action,title,menu] of [['salons','Suspend','Suspend Salon',true],['owners','Suspend','Suspend Salon Owner',true],['customers','Flag','Flag Customer',false],['bookings','Cancel','Cancel Booking',false],['reviews','Remove','Remove Review',false]]) {
  await check(path+' confirmation cancels without mutation and confirms once',async()=>{
   await page.goto(base+'/admin/'+path);if(menu)await page.getByRole('button',{name:'More actions'}).first().click();
   await page.getByRole('button',{name:action,exact:true}).first().click();await page.getByRole('heading',{name:title,exact:true}).waitFor();
   const count=requests.filter(r=>r.method==='PATCH').length;await page.locator('.ha-modal').getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(requests.filter(r=>r.method==='PATCH').length,count);
   if(menu)await page.getByRole('button',{name:'More actions'}).first().click();await page.getByRole('button',{name:action,exact:true}).first().click();
   const mutation=page.waitForRequest(r=>r.method()==='PATCH');await page.locator('.ha-modal').getByRole('button',{name:'Confirm',exact:true}).click();await mutation;await page.locator('.ha-modal').waitFor({state:'detached'});assert.equal(requests.filter(r=>r.method==='PATCH').length,count+1);
  });
 }
 await check('BUG-133 salon service comparison filters and fixed table height',async()=>{
  await page.goto(base+'/admin/salons');await page.getByRole('button',{name:'More actions'}).first().click();await page.getByRole('button',{name:'View',exact:true}).click();
  await page.getByLabel('Price comparison').selectOption('lt');const request=page.waitForRequest(r=>new URL(r.url()).searchParams.get('priceMax')==='10000' && new URL(r.url()).searchParams.get('priceOp')==='lt');await page.getByLabel('Price value').fill('100');await request;
  const table=page.locator('.ha-salon-services .ha-table-scroll');await table.locator('tbody tr').first().waitFor();const height=await table.evaluate(el=>el.clientHeight);assert.equal(height,280);
  await page.locator('.ha-modal-body').evaluate(el=>{const img=document.createElement('img');img.style.height='160px';img.style.flexShrink='0';el.prepend(img);});assert.equal(await table.evaluate(el=>el.clientHeight),height);
  await table.scrollIntoViewIfNeeded();await page.screenshot({path:'docs/qa-sep15-salon.png'});await page.getByRole('button',{name:'Close modal'}).click();
 });
 await check('BUG-176 and 196 compact ranges and correct password form',async()=>{
  await page.goto(base+'/admin/customers');await page.getByRole('button',{name:'More Filters',exact:true}).click();for(const range of await page.locator('.ha-range-filter').all())assert.ok((await range.boundingBox()).width<=210);
  await page.goto(base+'/admin/profile');const password=page.locator('.ha-password-form');await password.waitFor();assert.equal(await password.locator('[name=currentPassword]').count(),1);assert.ok((await password.boundingBox()).width<=380);assert.ok((await password.locator('[name=currentPassword]').boundingBox()).height<=36);
 });
 await check('BUG-202 and 225 commission popup and records-only scrolling',async()=>{
  await page.goto(base+'/admin/revenue');assert.equal(await page.getByRole('button',{name:'Save Commission Rules'}).count(),0);await page.getByRole('button',{name:'Edit Commission Rates'}).click();await page.getByRole('button',{name:'Save Commission Rules'}).waitFor();await page.getByRole('button',{name:'Close modal'}).click();
  await page.getByRole('button',{name:'More Filters',exact:true}).click();const scroll=page.locator('.ha-revenue-records .ha-table-scroll');await scroll.locator('tbody tr').first().waitFor();assert.ok(await scroll.evaluate(el=>el.scrollHeight>el.clientHeight));assert.ok(await page.locator('.ha-content').evaluate(el=>el.scrollHeight<=el.clientHeight+2));await page.screenshot({path:'docs/qa-sep15-revenue.png'});
 });
 await check('BUG-211 compact working-hour fields',async()=>{
  await page.goto(base+'/admin/salons');await page.getByRole('button',{name:'+ Add Salon',exact:true}).click();const start=page.getByLabel('monday start time',{exact:true});await start.scrollIntoViewIfNeeded();assert.ok((await start.boundingBox()).width<=106);assert.ok((await start.boundingBox()).height<=32);await page.getByRole('button',{name:'Close modal'}).click();
 });
 await check('New owner pages fit laptop widths',async()=>{
  await login('salon_owner');for(const width of [1024,1280,1366,1440]){await page.setViewportSize({width,height:768});for(const path of ['bookings','customers','reviews','revenue']){await page.goto(base+'/owner/'+path);await page.getByRole('button',{name:'Reset Filters'}).waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));}}
 });
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/qa-sep15-results.json',JSON.stringify({passed:results},null,2));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
