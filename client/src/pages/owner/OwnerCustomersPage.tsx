import OwnerRecordsPage from '@/components/OwnerRecordsPage';
import { customerService } from '@/services/customerService';
interface Customer {name?:string;email?:string;status?:string;createdAt?:string}
const row=(item:Customer)=>[item.name||'',item.email||'',item.status||'',item.createdAt?.slice(0,10)||''];
export default function OwnerCustomersPage(){return <OwnerRecordsPage<Customer> title="Customers" queryKey="owner-customers" service={customerService.list}
 filters={[{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'status',label:'Status',options:['active','inactive','suspended']},{key:'fromDate',label:'Joined From',type:'date'},{key:'toDate',label:'Joined To',type:'date'}]}
 columns={['Name','Email','Status','Joined']} exportRow={row} rows={items=>items.map(row)}/>;}
