import DataTable from "../../components/DataTable";
import LoadingBlock from "../../components/LoadingBlock";
import ErrorBlock from "../../components/ErrorBlock";
import { useApi } from "../../hooks/useApi";
import { staffService } from "../../services/staffService";
import Form from "@/components/Form";
import FormInput from "@/components/FormInput";
import { useState } from "react";
import z from "zod";
import { serviceService } from "@/services/serviceService";
import { formatDate } from "@/utils/format";

export const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),

  email: z.string().email("Invalid email address"),

  // password: z.string().min(6, "Password must be at least 6 characters"),

  phone: z.string().min(6, "Phone number is required"),

  bankAccount: z.string().optional(),

  location: z.object({
    city: z.string().optional(),

    country: z.string().optional(),
  }),

  staffDetails: z.object({
    designation: z.string().min(2, "Designation is required"),

    salary: z.coerce.number().min(1, "Salary must be greater than 0"),

    salaryType: z.enum(["monthly", "weekly", "daily", "hourly"]),

    joiningDate: z.string().min(1, "Joining date is required"),

    shiftStartTime: z.string().min(1, "Shift start time is required"),

    shiftEndTime: z.string().min(1, "Shift end time is required"),

    commissionPercentage: z.coerce
      .number()
      .min(0)
      .max(100)
      .optional()
      .default(0),

    emergencyContact: z.string().optional(),

    workingDays: z
      .array(
        z.enum([
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ]),
      )
      .min(1, "Select at least one working day"),
    services: z.array(z.string()).optional(),
  }),
});
export const staffDefaults = {
  name: "",
  email: "",
  // password: "",
  phone: "",
  bankAccount: "",

  location: {
    city: "",
    country: "",
  },

  staffDetails: {
    designation: "",
    salary: 0,
    salaryType: "monthly",

    joiningDate: "",

    shiftStartTime: "",
    shiftEndTime: "",

    commissionPercentage: 0,

    emergencyContact: "",

    workingDays: [],
    services: [],
  },
};
const OwnerStaffPage = () => {
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useApi(
    () => staffService.list({ page: 1, limit: 50 }),
    [refreshKey],
  );
  const servicesReq = useApi(
    () => serviceService.list({ page: 1, limit: 50 }),
    [refreshKey],
  );
  const createStaff = async (data) => {
    setFormError("");
    setFormSuccess("");
    try {
      const result = await staffService.create({
        name: data.name,
        email: data.email,
        // password: data.password,
        phone: data.phone,
        bankAccount: data.bankAccount,
        location: data.location,
        staffDetails: data.staffDetails,
      });
      setFormSuccess("Service created successfully");
      setRefreshKey((value) => value + 1);
      return { success: true, data: result.data };
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create service");
      throw err;
    }
  };
  // if (loading) return <LoadingBlock text="Loading staff..." />;
  if (error) return <ErrorBlock text={error} />;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Staff</h2>
      <div className="shell-panel rounded-2xl p-4">
        <Form
          key={refreshKey}
          schema={staffSchema}
          defaultValues={staffDefaults}
          onSubmit={createStaff}
          className="grid gap-5"
        >
          {/* BASIC INFO */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <FormInput
              name="name"
              label="Full Name"
              placeholder="e.g. John Doe"
              required
            />

            <FormInput
              name="email"
              type="email"
              label="Email"
              placeholder="e.g. john@example.com"
              required
            />
            <FormInput
              name="phone"
              label="Phone Number"
              placeholder="+92 300 1234567"
              required
            />

            <FormInput
              name="location.city"
              label="City"
              placeholder="e.g. Lahore"
            />

            <FormInput
              name="location.country"
              label="Country"
              placeholder="e.g. Pakistan"
            />

            <FormInput
              name="staffDetails.designation"
              label="Designation"
              placeholder="e.g. Hair Stylist"
              required
            />

            <FormInput
              name="staffDetails.salary"
              type="number"
              label="Salary"
              required
            />

            <FormInput
              name="staffDetails.salaryType"
              label="Salary Type"
              type="select"
              required
              options={[
                { label: "Monthly", value: "monthly" },
                { label: "Weekly", value: "weekly" },
                { label: "Daily", value: "daily" },
                { label: "Hourly", value: "hourly" },
              ]}
            />

            <FormInput
              name="staffDetails.joiningDate"
              type="date"
              label="Joining Date"
              required
            />

            <FormInput
              name="staffDetails.shiftStartTime"
              type="time"
              label="Shift Start Time"
              required
            />

            <FormInput
              name="staffDetails.shiftEndTime"
              type="time"
              label="Shift End Time"
              required
            />

            <FormInput
              name="staffDetails.commissionPercentage"
              type="number"
              label="Commission %"
              placeholder="0"
            />
            <FormInput
              name="staffDetails.services"
              label="Services"
              type="multiselect"
              options={servicesReq?.data?.data?.map((service) => ({
                label: service.name,
                value: service._id,
              }))}
            />
            <FormInput
              name="staffDetails.emergencyContact"
              label="Emergency Contact"
              placeholder="+92 300 0000000"
            />

            <FormInput
              name="bankAccount"
              label="Bank Account"
              placeholder="Optional"
            />

            <FormInput
              name="staffDetails.workingDays"
              label="Working Days"
              type="multiselect"
              options={[
                { label: "Monday", value: "monday" },
                { label: "Tuesday", value: "tuesday" },
                { label: "Wednesday", value: "wednesday" },
                { label: "Thursday", value: "thursday" },
                { label: "Friday", value: "friday" },
                { label: "Saturday", value: "saturday" },
                { label: "Sunday", value: "sunday" },
              ]}
            />
          </div>

          {formError ? (
            <p className="text-sm text-red-600">{formError}</p>
          ) : null}

          {formSuccess ? (
            <p className="text-sm text-emerald-600">{formSuccess}</p>
          ) : null}

          <div>
            <button
              type="submit"
              className="rounded-xl border border-[var(--border)] bg-[var(--accent-2)] px-5 py-3 text-sm font-semibold text-slate-900"
            >
              Add Staff
            </button>
          </div>
        </Form>
      </div>
      <DataTable
      loading={loading} 
        columns={[
          "Staff ID",
          "Name",
          "Designation",
          "Assigned Services",
          "Salary",
          "Joining Date",
          "Shift Start Time",
          "Shift End Time",
          "Active",
          "Action",
        ]}
        rows={(data?.data || []).map((item) => [
          item?.staffDetails?.employeeId || "-",
          item.name,
          item.staffDetails?.designation || "-",
          (item.staffDetails?.services || []).map((s) => s.name).join(", ") ||
            "-",
          item.staffDetails?.salary || "-",
          formatDate(item.staffDetails?.joiningDate) || "-",
          item.staffDetails?.shiftStartTime || "-",
          item.staffDetails?.shiftEndTime || "-",
          item.status === "active" ? "Yes" : "No",
          <div className="ha-actions">
            {/* <button className="ha-act-btn">View</button> */}
            <button className="ha-act-btn">Edit</button>
            {item.status === "inactive" ? (
              // <>
                <button
                  className="ha-act-btn"
                  // onClick={() => patchStatus(salon._id, "approved")}
                >
                  Activate
                </button>) : (
                <button
                  className="ha-act-btn danger"
                  // onClick={() => patchStatus(salon._id, "suspended")}
                >
                  Inactivate
                </button>
              // </>
            // ) : salon.status === "suspended" ? (
            //   <button
            //     className="ha-act-btn"
            //     onClick={() => patchStatus(salon._id, "approved")}
            //   >
            //     Reinstate
            //   </button>
            // ) : (
            //   <button
            //     className="ha-act-btn danger"
            //     onClick={() => patchStatus(salon._id, "suspended")}
            //   >
            //     Suspend
            //   </button>
            )}
          </div>,
        ])}
      />
    </div>
  );
};

export default OwnerStaffPage;
