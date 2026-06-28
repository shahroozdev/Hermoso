import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";

interface FormProps {
  schema?: any; // Zod schema for validation
  defaultValues?: any; // Default form values
  onSubmit: (data: any) => Promise<any>; // Function to handle form submission
  children: React.ReactNode; // Form fields and buttons
  className?: string; // Optional CSS class for styling
  onErrorFunc?: () => void; // Optional function to call on validation error
}
const Form = ({
  schema,
  defaultValues,
  onSubmit,
  children,
  className = "",
  onErrorFunc,
}: FormProps) => {
  const methods = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: defaultValues || {},
    mode: "onBlur",
  });
  const onError = (errors) => {
    const firstErrorKey = Object.keys(errors)[0];
    console.log("Validation Errors", errors);
    if (firstErrorKey) {
      const el =
        document.querySelector(`[name="${firstErrorKey}"]`) ||
        document.querySelector(`[data-field="${firstErrorKey}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    onErrorFunc?.();
    console.log(methods.getValues());
  };

  useEffect(() => {
    methods.reset(defaultValues || {});
  }, [defaultValues, methods]);

  const handleSubmit = async (data: any) => {
    try {
      const res = await onSubmit(data);
      if (res?.status === 200 || res?.success) {
        methods.reset(defaultValues || {});
      }
    } catch (error) {
      console.error("Submission error", error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmit, onError)} className={className}>
        {children}
      </form>
    </FormProvider>
  );
};

export default Form;
