import { staffService } from "../../services/staffService";
import { formatDate } from "@/utils/format";
import StaffModal from "@/components/StaffModal";
import TABLE from "@/components/table";

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Staff Management</h2>
        <StaffModal />
      </div>
      <TABLE<StaffItem>
        title="Staff List"
        showPagination
        service={staffService.list}
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
