import { toast } from "sonner";

/** Prefer `toast` from `sonner` directly; this re-export keeps older imports working. */
export function useToast(): { toast: typeof toast } {
  return { toast };
}

export { toast };
