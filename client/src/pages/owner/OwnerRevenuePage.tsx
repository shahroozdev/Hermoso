import OwnerRecordsPage from '@/components/OwnerRecordsPage';
import { payoutService } from '@/services/payoutService';
import { rupeesToPaisa } from '@/utils/money';
interface Payout {amountInPaisa?:number;status?:string;createdAt?:string;payoutDate?:string}
const row=(item:Payout)=>[item.amountInPaisa==null?'':(item.amountInPaisa/100).toFixed(2),item.status||'',item.createdAt?.slice(0,10)||'',item.payoutDate?.slice(0,10)||''];
export default function OwnerRevenuePage(){return <OwnerRecordsPage<Payout> title="Revenue" queryKey="owner-payouts" service={payoutService.list}
 filters={[{key:'netMin',label:'Amount From (PKR)',type:'number'},{key:'netMax',label:'Amount To (PKR)',type:'number'},{key:'status',label:'Status',options:['pending','processing','completed','failed']},{key:'dateFrom',label:'Created From',type:'date'},{key:'dateTo',label:'Created To',type:'date'},{key:'payoutFrom',label:'Payout From',type:'date'},{key:'payoutTo',label:'Payout To',type:'date'}]}
 mapParams={values=>({...values,...(values.netMin!==undefined?{netMin:rupeesToPaisa(values.netMin)}:{}),...(values.netMax!==undefined?{netMax:rupeesToPaisa(values.netMax)}:{})})}
 columns={['Amount (PKR)','Status','Created','Payout Date']} exportRow={row} rows={items=>items.map(row)}/>;}
