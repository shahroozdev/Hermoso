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
 const services = Array.from({length: 30}, (_,i) => ({_id:`service-${i}`, name:`Hair service ${i}`, category:'Hair', categoryId:{_id:'cat',name:'Hair'}, priceInPaisa:125075, duration:30, description:'A very long service description with many words that must stay within the table and never break the surrounding layout or make it wider.'}));
 const notification = {_id:'campaign-1',title:'QA Campaign',message:'QA campaign description',targetRole:'customer',type:'announcement',status:'sent',createdAt:'2026-09-10T10:00:00Z',recipientCount:80};
 await page.route('**/api/**', async route => {
   const req=route.request(); const url=new URL(req.url()); const path=url.pathname;
   lastRequest={path,params:Object.fromEntries(url.searchParams),body:req.postDataJSON?.()};
   let data=[]; let extra={};
   if(path.endsWith('/services')) data=services;
   if(path.endsWith('/categories')) data=[{_id:'cat',name:'Hair'}, {_id:'skin',name:'Skin'}];
   if(path.endsWith('/salons')) data=[{_id:'qa-salon',name:'QA Salon',owner:{name:'QA Owner',email:'qa@example.test'},status:'approved',active:true,servicesCount:30,location:{city:'Lahore',country:'Pakistan'},address:'QA test address',phone:'03000000000'}];
   if(path.endsWith('/notifications')) data=[notification];
   if(path.endsWith('/reports/summary')) data=[{...notification,readCount:20}];
   if(path.endsWith('/recipients')) {data=Array.from({length:80},(_,i)=>({_id:`recipient-${i}`,user:{name:`Customer ${i}`,email:`qa${i}@example.test`,role:'customer'},isRead:false})); extra.notification=notification;}
   if(path.endsWith('/payouts')) data=[{_id:'payout-1',salonId:{name:'QA Salon'},amountInPaisa:12345,status:'completed',createdAt:'2026-09-10T10:00:00Z',payoutDate:'2026-09-10T10:00:00Z'}];
   if(path.endsWith('/reviews')) data=[{_id:'review-1',customerId:{name:'QA'},salonId:{name:'QA Salon'},rating:5,status:'approved',comment:'QA review'}];
   if(path.includes('/stats') || path.includes('/overview')) {data=[];}
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
  await check('BUG-063 OTP resend uses entered email after reopening',async()=>{
   await page.goto(base+'/verify-otp'); await page.locator('#email').fill('recover@example.test');
   await page.getByRole('button',{name:'Resend OTP'}).click(); await page.getByText('OTP resent successfully.').waitFor();
   assert.equal(lastRequest.body.email,'recover@example.test'); assert.equal(await page.getByRole('button',{name:'Resend OTP'}).isEnabled(),true);
  });
  await login('super_admin');
  await check('BUG-097/099/100/148/149/150 notification reports, scrolling and blank type',async()=>{
   await page.goto(base+'/admin/notifications'); await page.getByRole('button',{name:'Sent Notifications Report',exact:true}).click();
   await page.getByText('Sent Notifications Report — All Audiences').waitFor(); await page.getByRole('button',{name:'Close modal'}).click();
   await page.getByRole('button',{name:'+ Add Notification'}).click(); await page.getByText('Select Type...',{exact:true}).waitFor(); await page.getByRole('button',{name:'Close modal'}).click();
   assert.equal(await page.getByRole('button',{name:'Export Notification',exact:true}).count(),1);
   await page.getByRole('button',{name:'More actions'}).click(); await page.getByRole('button',{name:'View Recipients',exact:true}).click();
   await page.getByRole('columnheader',{name:'Description',exact:true}).waitFor();
   const scroll=page.locator('.ha-modal .ha-table-scroll');
   assert.ok(await scroll.evaluate(el=>el.scrollHeight>el.clientHeight && el.clientHeight>80));
   assert.equal(await page.locator('.ha-modal-body').evaluate(el=>getComputedStyle(el).overflowY),'hidden');
   const csvPromise=page.waitForEvent('download'); await page.getByRole('button',{name:'Download Report',exact:true}).click();
   const csv=await csvPromise; assert.match(fs.readFileSync(await csv.path(),'utf8'),/"Title","Description","Name"/);
   await page.getByRole('button',{name:'Close modal'}).click();
   assert.equal(await page.locator('input[type="date"]').first().evaluate(el=>getComputedStyle(el).colorScheme),'dark');
  });
  await check('BUG-111/154 customer date preset and comparison',async()=>{
   await page.goto(base+'/admin/customers'); await page.getByText('Joined: Any Time',{exact:true}).click(); await page.getByRole('button',{name:'Current Month',exact:true}).click();
   const from=page.getByLabel('From Date',{exact:true}); assert.equal(await from.isDisabled(),true); assert.match(await from.inputValue(),/-01$/);
   await page.getByRole('button',{name:'More Filters',exact:true}).click(); await page.getByLabel('Bookings comparison').selectOption('eq'); await page.getByLabel('Bookings value').fill('3');
  });
  await check('BUG-158 processed review action disabled',async()=>{
   await page.goto(base+'/admin/reviews'); await page.getByRole('button',{name:'Approve',exact:true}).waitFor(); assert.equal(await page.getByRole('button',{name:'Approve',exact:true}).isDisabled(),true);
  });
  await check('BUG-153 salon services paginate and scroll records',async()=>{
   await page.goto(base+'/admin/salons'); await page.getByRole('button',{name:'More actions'}).click();await page.getByRole('button',{name:'View',exact:true}).click();
   const scroll=page.locator('.ha-modal .ha-table-scroll'); await scroll.locator('tbody tr').first().waitFor();
   assert.ok(await scroll.evaluate(el=>el.scrollHeight>el.clientHeight && el.clientHeight>60));
   await page.getByRole('button',{name:'Close modal'}).click();
  });
  await check('BUG-159/160 payout receipt is PNG',async()=>{
   await page.goto(base+'/admin/payouts'); await page.getByRole('button',{name:'Receipt',exact:true}).click();
   const download=page.waitForEvent('download'); await page.getByRole('button',{name:'Download Receipt',exact:true}).click(); const file=await download; assert.match(file.suggestedFilename(),/\.png$/);
   await page.getByRole('button',{name:'Close modal'}).click();
  });
  await login('salon_owner');
  await check('BUG-107/151/152/162 services preview, category search and numeric export',async()=>{
   await page.goto(base+'/owner/services'); await page.locator('td [title]').first().waitFor();
   assert.equal(await page.locator('td [title]').first().evaluate(el=>getComputedStyle(el).whiteSpace),'nowrap');
   const csvPromise=page.waitForEvent('download'); await page.getByRole('button',{name:'Export',exact:true}).click();const csv=await csvPromise;
   assert.match(fs.readFileSync(await csv.path(),'utf8'),/"1250.75"/);
   await page.getByRole('button',{name:'+ Add Service',exact:true}).click(); await page.getByRole('button',{name:'Manage categories',exact:true}).click();
   await page.getByLabel('Search categories').fill('Skin'); assert.equal(await page.getByRole('button',{name:'Edit category',exact:true}).count(),1);
   await page.getByRole('button',{name:'Reset',exact:true}).click(); assert.equal(await page.getByRole('button',{name:'Edit category',exact:true}).count(),2);
   await page.getByRole('button',{name:'Done',exact:true}).click();await page.getByRole('button',{name:'Close modal'}).click();
  });
  await check('BUG-142/145 multiple services save and close event modal',async()=>{
   await page.goto(base+'/owner/events'); await page.getByRole('button',{name:'+ Add Event',exact:true}).click();
   await page.locator('#name').fill('QA package'); await page.locator('#category').selectOption('bridal');
   await page.getByText('Select options',{exact:true}).click();
   for(let i=0;i<6;i++) await page.getByRole('button',{name:`Hair service ${i}`,exact:true}).click();
   await page.locator('#name').click(); await page.getByRole('button',{name:'Add Event',exact:true}).click();
   await page.locator('.ha-modal').waitFor({state:'detached'});
  });
  await check('BUG-164/165/166/167 staff filters, stable button, 24h shifts',async()=>{
   await page.goto(base+'/owner/staff'); const btn=page.getByRole('button',{name:'+ Add Staff',exact:true}); const before=await btn.boundingBox(); await btn.click(); const after=await btn.boundingBox(); assert.ok(Math.abs(before.x-after.x)<2);
   await page.locator('[name="staffDetails.shiftStartTime"]').fill('00:00'); await page.locator('[name="staffDetails.shiftEndTime"]').fill('23:59');
   assert.equal(await page.locator('[name="staffDetails.shiftEndTime"]').inputValue(),'23:59'); await page.getByRole('button',{name:'Close modal'}).click();
   await page.getByLabel('Salary PKR comparison').selectOption('eq');
  });
  await check('BUG-147 laptop pages have no document horizontal overflow',async()=>{
   for(const width of [1024,1280,1366,1440]) {await page.setViewportSize({width,height:768});for(const route of ['/owner/staff','/owner/services','/owner/events']){await page.goto(base+route);await page.locator('.ha-content').waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} at ${width}`);}}
  });
  await login('super_admin');
  await check('BUG-147 admin laptop layouts',async()=>{
   for(const width of [1024,1366]) { await page.setViewportSize({width,height:768});for(const route of ['/admin/notifications','/admin/customers','/admin/bookings','/admin/reviews','/admin/payouts']){await page.goto(base+route);await page.locator('.ha-content').waitFor(); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} at ${width}`);}}
  });
  assert.deepEqual(errors,[]); fs.writeFileSync('docs/qa-browser-results.json',JSON.stringify({passed:results},null,2));
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
