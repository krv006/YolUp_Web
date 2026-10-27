import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      offset={16}
      mobileOffset={16}
      toastOptions={{ className: "fokus-toast" }}
    />
  );
}
