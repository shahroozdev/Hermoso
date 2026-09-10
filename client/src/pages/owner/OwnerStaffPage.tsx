import { staffService } from "../../services/staffService";
import { formatDate } from "@/utils/format";
import StaffModal from "@/components/StaffModal";
import TABLE from "@/components/table";
import { useState } from 'react';
import RangeFilter from '@/components/form/RangeFilter';
import Time24Input from '@/components/form/Time24Input';
import { downloadCsv } from '@/utils';
import { useToastStore } from '@/store/toastStore';

interface StaffItem {
  name?: string;
  status?: string;
  staffDetails?: {
    employeeId?: string;
    designation?: string;
    salary?: string;
    joiningDate?: string;
    shiftStartTime?: string;
    shiftEndTime?: string;
    services?: { name?: string }[];
  };
}

const OwnerStaffPage = () => {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToastStore();
  const set = (key: string, value: string) => setFilters((old) => ({ ...old, [key]: value }));
  const exportStaff = async () => {
    setExporting(true);
    try {
      const items: StaffItem[] = [];
      for (let page = 1; ; page++) {
        const result = await staffService.list({ ...filters, page, limit: 100 });
        items.push(...(result.data || []));
        if (!result.data?.length || items.length >= result.meta.total) break;
      }
      downloadCsv('hermoso-staff.csv', [
        ['Staff ID', 'Name', 'Designation', 'Assigned Services', 'Salary PKR', 'Joining Date', 'Shift Start Time', 'Shift End Time', 'Status'],
        ...items.map((item) => { const d = item.staffDetails || {}; return [d.employeeId || '', item.name || '', d.designation || '', (d.services || []).map(s => s.name).join(', '), String(d.salary ?? ''), formatDate(d.joiningDate) || '', d.shiftStartTime || '', d.shiftEndTime || '', item.status || '']; }),
      ]);
    } catch { showToast('Failed to export staff', 'error'); }
    finally { setExporting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Staff Management</h2>
        <button className="ha-act-btn ml-auto mr-2" onClick={exportStaff} disabled={exporting}>{exporting ? 'Exporting...' : 'Export'}</button>
        <StaffModal />
      </div>
      <div className="ha-card grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries({ employeeId: 'Staff ID', search: 'Name', designation: 'Designation', servicesSearch: 'Assigned Services' }).map(([key, label]) => <label key={key}>{label}<input className="ha-input" value={filters[key] || ''} onChange={e => set(key, e.target.value)} /></label>)}
        <RangeFilter label="Salary PKR" min={filters.salaryMin || ''} max={filters.salaryMax || ''} onMin={v => set('salaryMin', v)} onMax={v => set('salaryMax', v)} />
        <label>Status<select className="ha-input" value={filters.status || ''} onChange={e => set('status', e.target.value)}><option value="">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select></label>
        {Object.entries({ joinedFrom: 'Joined From', joinedTo: 'Joined To' }).map(([key, label]) => <label key={key}>{label}<input type="date" className="ha-input" value={filters[key] || ''} onChange={e => set(key, e.target.value)} /></label>)}
        {Object.entries({ shiftStartTimeFrom: 'Shift Start From', shiftStartTimeTo: 'Shift Start To', shiftEndTimeFrom: 'Shift End From', shiftEndTimeTo: 'Shift End To' }).map(([key, label]) => <label key={key}>{label}<Time24Input className="ha-input" value={filters[key] || ''} onChange={e => set(key, e.target.value)} /></label>)}
        <button className="ha-btn-secondary" onClick={() => setFilters({})}>Reset Filters</button>
      </div>
      <TABLE<StaffItem>
        title="Staff List"
        queryKey={["owner-staff"]}
        showPagination
        service={staffService.list}
        serviceParams={filters}
        columns={[
          { title: "Staff ID", size: "210px" },
          { title: "Name", size: "150px" },
          { title: "Designation" },
          { title: "Assigned Services", lines: 3 },
          { title: "Salary" },
          { title: "Joining Date" },
          { title: "Shift Start Time" },
          { title: "Shift End Time" },
          { title: "Active" },
          { title: "Action" },
        ]}
        rows={(data) =>
          data?.map((item) => {
            const d = item.staffDetails ?? {};
            return [
              d?.employeeId || "-",
              item.name || "-",
              d?.designation || "-",
              (d?.services || []).map((s) => s.name).join(", ") || "-",
              d?.salary || "-",
              formatDate(d?.joiningDate) || "-",
              d?.shiftStartTime || "-",
              d?.shiftEndTime || "-",
              item.status === "active" ? "Yes" : "No",
              <div className="ha-actions" key="actions">
                <button className="ha-act-btn">Edit</button>
                {item.status === "inactive" ? (
                  <button className="ha-act-btn">Activate</button>
                ) : (
                  <button className="ha-act-btn danger">Inactivate</button>
                )}
              </div>,
            ];
          })
        }
      />
    </div>
  );
};

export default OwnerStaffPage;
