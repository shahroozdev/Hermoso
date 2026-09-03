import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { z } from "zod";

interface FormProps {
  schema?: z.ZodType; // Zod schema for validation
  defaultValues?: Record<string, unknown>; // Default form values
  onSubmit: (data: Record<string, unknown>) => Promise<unknown>; // Function to handle form submission
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

  // Deliberately mount-only: resetting whenever `defaultValues` changes reference
  // (a new object literal on every parent render) wiped out whatever the user had
  // typed on any unrelated re-render — e.g. a server error being set after a failed
  // submit. Callers that need a real reset (switching a modal from create to edit,
  // re-showing after a save) already remount this component via a `key` change.
  useEffect(() => {
    methods.reset(defaultValues || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      const res = await onSubmit(data) as { status?: number; success?: boolean };
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
