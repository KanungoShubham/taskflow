import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { ApiClientError, errorMessage } from "@/lib/api";

/**
 * Shows a server error: field errors go under the matching inputs,
 * and the main message appears as a toast.
 */
export function handleFormError<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, fields: string[]) {
  if (err instanceof ApiClientError && err.errors) {
    for (const [field, message] of Object.entries(err.errors)) {
      if (fields.includes(field)) setError(field as Path<T>, { type: "server", message });
    }
  }
  toast.error(errorMessage(err));
}
