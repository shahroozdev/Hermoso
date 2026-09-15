import OwnerRecordsPage from '@/components/OwnerRecordsPage';
import { reviewService } from '@/services/reviewService';
interface Review {customerId?:{name?:string};rating?:number;comment?:string;status?:string}
const row=(item:Review)=>[item.customerId?.name||'',String(item.rating??''),item.comment||'',item.status||''];
export default function OwnerReviewsPage(){return <OwnerRecordsPage<Review> title="Reviews" queryKey="owner-reviews" service={reviewService.list}
 filters={[{key:'customer',label:'Customer'},{key:'rating',label:'Rating',options:['1','2','3','4','5']},{key:'search',label:'Comment'},{key:'status',label:'Status',options:['pending','approved','rejected','flagged','deleted']}]}
 columns={['Customer','Rating','Comment','Status']} exportRow={row} rows={items=>items.map(row)}/>;}
