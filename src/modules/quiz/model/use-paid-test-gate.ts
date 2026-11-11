import { useState } from "react";
import { useCanCreateTests } from "@/modules/auth";

export function usePaidTestGate() {
  const allowed = useCanCreateTests();
  const [open, setOpen] = useState(false);

  function guard(action: () => void) {
    return () => {
      if (allowed) action();
      else setOpen(true);
    };
  }

  return { allowed, open, setOpen, guard };
}
