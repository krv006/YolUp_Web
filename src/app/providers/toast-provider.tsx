import { Toaster } from "sonner";

export function ToastProvider() {
  return <Toaster position="top-center" toastOptions={{ className: "fokus-toast" }} />;
}
