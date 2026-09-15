import { useState } from 'react';
import TABLE from './table';
import { downloadCsv } from '@/utils';
import { useToastStore } from '@/store/toastStore';

export interface RecordFilter {
  key: string;
  label: string;
  type?: string;
  options?: string[];
}

interface OwnerRecordsProps<T> {
  title: string;
  queryKey: string;
  service: (params: Record<string, unknown>) => Promise<{ data: T[]; meta?: { total?: number } }>;
  filters: RecordFilter[];
  columns: string[];
  exportColumns?: string[];
  rows: (items: T[]) => React.ReactNode[][];
  exportRow: (item: T) => string[];
  mapParams?: (values: Record<string, string>) => Record<string, unknown>;
}

export default function OwnerRecordsPage<T>({
  title, queryKey, service, filters, columns, exportColumns = columns,
  rows, exportRow, mapParams = value => value,
}: OwnerRecordsProps<T>) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToastStore();
  const params = mapParams(Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '')));
  const exportRecords = async () => {
    setExporting(true);
    try {
      const records: T[] = [];
      let page = 1;
      while (true) {
        const response = await service({ ...params, page, limit: 100 });
        const batch = response.data || [];
        records.push(...batch);
        if (!batch.length || (response.meta?.total != null ? records.length >= response.meta.total : batch.length < 100)) break;
        page++;
      }
      downloadCsv(`hermoso-${title.toLowerCase()}-${new Date().toISOString().slice(0,10)}.csv`, [exportColumns, ...records.map(exportRow)]);
    } catch {
      showToast('Unable to export records. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  };
  return <div className="space-y-4 ha-owner-records">
    <div className="ha-records-toolbar">
      <h2 className="text-xl font-semibold">{title}</h2>
      <button className="ha-act-btn" disabled={exporting} onClick={exportRecords}>
        {exporting ? 'Exporting...' : 'Export'}
      </button>
    </div>
    <div className="ha-filter-grid ha-card">
      {filters.map(field => <label key={field.key}>
        {field.label}
        {field.options ? (
          <select aria-label={field.label} className="ha-input" value={values[field.key] || ''}
            onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}>
            <option value="">All</option>
            {field.options.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : (
          <input aria-label={field.label} className="ha-input" type={field.type || 'text'}
            step={field.type === 'number' ? 'any' : undefined} value={values[field.key] || ''}
            onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))} />
        )}
      </label>)}
      <button className="ha-btn-secondary" onClick={()=>setValues({})}>Reset Filters</button>
    </div>
    <TABLE<T> title={`${title} List`} queryKey={[queryKey]} showPagination service={service} serviceParams={params} columns={columns.map(title=>({title}))} rows={rows}/>
  </div>;
}
