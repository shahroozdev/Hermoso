import { useApi } from "@/hooks/useApi";
import { serviceService } from "@/services/serviceService";
import { staffService } from "@/services/staffService";
import { useState } from "react";
import Form from "./form/Form";
import FormInput from "./form/FormInput";
import z from "zod";
import GenericModal from "./GenericModal";
import { useInvalidate } from "../hooks/useInvalidate";
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
const StaffModal = () => {
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [onClose, setOnClose] = useState(true);
  const invalidate = useInvalidate();

  const servicesReq = useApi(
    () => serviceService.list({ page: 1, limit: 50 }),
    [],
  );
  const createStaff = async (data) => {
    setFormError("");
    setFormSuccess("");
    try {
      const result = await staffService.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        bankAccount: data.bankAccount,
        location: data.location,
        staffDetails: data.staffDetails,
      });
      setFormSuccess("Staff created successfully");
      invalidate();
      return { success: true, data: result.data };
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create service");
      throw err;
    }
  };
  return (
    <>
      <button
        type="button"
        className="rounded-xl border border-[var(--border)] bg-[var(--accent-2)] px-5 py-2 text-sm font-semibold text-slate-900"
        onClick={() => {
          setOnClose(false);
        }}
      >
        + Add Staff
      </button>
      {!onClose && (
        <Form
          schema={staffSchema}
          defaultValues={staffDefaults}
          onSubmit={createStaff}
          className="grid gap-5"
        >
          <GenericModal
            title="+ Add Staff"
            onClose={() => {
              setOnClose(true);
            }}
            footer={
              <div>
                <button
                  type="submit"
                  className="rounded-xl border border-[var(--border)] bg-[var(--accent-2)] px-5 py-3 text-sm font-semibold text-slate-900"
                >
                  Add Staff
                </button>
              </div>
            }
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
          </GenericModal>
        </Form>
      )}
    </>
  );
};

export default StaffModal;
