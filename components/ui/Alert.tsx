import type { ReactNode } from "react";

type AlertProps = {
  variant: "error" | "success";
  children: ReactNode;
};

const VARIANTS = {
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  success:
    "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
} as const;

export function Alert({ variant, children }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-md border px-3 py-2 text-sm ${VARIANTS[variant]}`}
    >
      {children}
    </div>
  );
}
