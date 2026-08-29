import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { MultiSelectInput } from "./MultiSelectInput";
interface FormInputProps {
  name: string;
  type?:
    | "tel"
    | "text"
    | "email"
    | "password"
    | "number"
    | "date"
    | "time"
    | "select"
    | "multiselect"
    | "checkbox"
    | "textarea";
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  noStar?: boolean;
  className?: string;
  autoComplete?: string;
}

const FormInput = ({
  name,
  type = "text",
  label,
  placeholder,
  required,
  options,
  rows,
  noStar,
  className = "",
  autoComplete,
}: FormInputProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const [showPassword, setShowPassword] = useState(false);

  const error = errors[name];

  const baseInputProps = {
    id: name,
    className: `ha-input ${className}`.trim(),
    placeholder,
    autoComplete,
    ...register(name),
  };
  const renderInput = () => {
    switch (type) {
      case "textarea":
        return <textarea {...baseInputProps} rows={rows || 3} />;

      case "select":
        return (
          <select {...baseInputProps}>
            {placeholder && <option value="">{placeholder}</option>}

            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "multiselect":
        return (
          <Controller
            control={control}
            name={name}
            render={({ field }) => (
              <MultiSelectInput
                value={field.value || []}
                onChange={field.onChange}
                options={options}
                placeholder={placeholder}
                className={className}
              />
            )}
          />
        );
      case "checkbox":
        return (
          <label className="ha-checkbox-label">
            <input type="checkbox" {...register(name)} />
            <span>{label}</span>
          </label>
        );

      case "number":
        return <input {...baseInputProps} type="number" />;

      case "date":
        return <input {...baseInputProps} type="date" />;

      case "time":
        return <input {...baseInputProps} type="time" />;

      case "password":
        return (
          <div className="ha-password-input">
            <input
              {...baseInputProps}
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              className="!border-none !bg-transparent flex-1 p-2 outline-none focus:ring-0"
            />

            <button
              type="button"
              className="ha-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
            >
              {!showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                  <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                  <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                  <path d="m2 2 20 20" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        );

      default:
        return <input {...baseInputProps} type={type} />;
    }
  };

  if (type === "checkbox") {
    return (
      <div className="ha-form-group" data-field={name}>
        {renderInput()}

        {error && (
          <span className="ha-field-error">{error.message as string}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className="ha-form-group [&_input::placeholder]:text-gray-400"
      data-field={name}
    >
      {label && (
        <label htmlFor={name}>
          {label}

          {required && !noStar && <span className="ha-req-mark">*</span>}
        </label>
      )}

      {renderInput()}

      {error && (
        <span className="ha-field-error">{error.message as string}</span>
      )}
    </div>
  );
};

export default FormInput;
