import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { notificationService } from '@/services/notificationService';
import { downloadCsv } from '@/utils';
import type { NotificationRecord } from './NotificationModal';

interface SentItem extends NotificationRecord {
  createdAt: string;
  sentAt?: string;
  recipientCount: number;
  readCount: number;
}
export default function SentNotificationsReport({onRecipients}: {onRecipients: (item: SentItem)=>void}) {
  const {data,loading,error} = useApi(()=>notificationService.getSentSummary(),['sent-notifications-report']);
  const [search,setSearch] = useState('');
  const [audience,setAudience] = useState('');
  const [from,setFrom] = useState('');
  const [to,setTo] = useState('');
  const [readStatus,setReadStatus] = useState('');
  const items: SentItem[] = data?.data || [];
  const filtered = items.filter(item=>{
    const date = (item.sentAt || item.createdAt || '').slice(0,10);
    return (!search || `${item.title} ${item.message}`.toLowerCase().includes(search.trim().toLowerCase()))
      && (!audience || item.targetRole === audience) && (!from || date >= from) && (!to || date <= to)
      && (!readStatus || (readStatus === 'read' ? item.readCount > 0 : item.recipientCount > item.readCount));
  });
  const exportReport = () => downloadCsv('hermoso-sent-notifications.csv',[
    ['Title','Description','Audience','Sent Date','Recipients','Read','Unread'],
    ...filtered.map(item=>[item.title,item.message,item.targetRole,(item.sentAt||item.createdAt),String(item.recipientCount),String(item.readCount),String(Math.max(0,item.recipientCount-item.readCount))]),
  ]);
  return <section role="tabpanel" id="sent-notifications-panel" aria-labelledby="sent-notifications-tab" className="ha-notifications-panel">
    <div className="ha-filter-grid ha-card">
      <label>Title / Description<input className="ha-input" value={search} onChange={e=>setSearch(e.target.value)} /></label>
      <label>Audience<select aria-label="Audience" className="ha-input" value={audience} onChange={e=>setAudience(e.target.value)}><option value="">All audiences</option><option value="customer">Customers</option><option value="salon_owner">Salon Owners</option><option value="staff">Staff</option></select></label>
      <label>Sent From<input type="date" className="ha-input" value={from} onChange={e=>setFrom(e.target.value)} /></label>
      <label>Sent To<input type="date" className="ha-input" value={to} onChange={e=>setTo(e.target.value)} /></label>
      <label>Recipient Status<select aria-label="Recipient Status" className="ha-input" value={readStatus} onChange={e=>setReadStatus(e.target.value)}><option value="">All recipients</option><option value="read">Has read recipients</option><option value="unread">Has unread recipients</option></select></label>
      <button className="ha-btn-secondary" onClick={()=>{setSearch('');setAudience('');setFrom('');setTo('');setReadStatus('');}}>Reset Filters</button>
      <button className="ha-act-btn" onClick={exportReport} disabled={loading || !!error}>Export Report</button>
    </div>
    {loading ? <p>Loading report...</p> : error ? <p role="alert">{error}</p> : <div className="ha-card ha-records-card">
      <div className="ha-card-title">Sent Notifications <span>{filtered.length} campaigns</span></div>
      <div className="ha-table-scroll"><table className="ha-salon-table"><thead><tr>{['Title','Description','Audience','Sent Date','Recipients','Read','Unread','Actions'].map(label=><th key={label}>{label}</th>)}</tr></thead>
        <tbody>{filtered.map(item=><tr key={item._id}>
          <td>{item.title}</td><td><span className="ha-text-preview" title={item.message}>{item.message}</span></td><td>{item.targetRole.replace(/_/g,' ')}</td><td>{(item.sentAt||item.createdAt).slice(0,10)}</td><td>{item.recipientCount}</td><td>{item.readCount}</td><td>{Math.max(0,item.recipientCount-item.readCount)}</td><td><button className="ha-act-btn" onClick={()=>onRecipients(item)}>View Recipients</button></td>
        </tr>)}</tbody>
      </table>{!filtered.length && <p>No sent notifications match these filters.</p>}</div>
    </div>}
  </section>;
}
