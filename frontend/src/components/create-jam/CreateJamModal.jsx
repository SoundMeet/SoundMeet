import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import CreateJamForm from "./CreateJamForm";
import { useFormOptions } from "../../hooks/useFormOptions";

/**
 * CreateJamModal — Radix Dialog shell wrapping CreateJamForm.
 *
 * Responsibilities:
 *   - Modal open/close lifecycle (overlay, portal, ESC handling)
 *   - Animated entrance / exit
 *   - Form reset on close (delegated to CreateJamForm via key prop)
 *
 * This component intentionally has no form state — it is purely a
 * presentational shell. All form logic lives in CreateJamForm.
 *
 * Props:
 *   open           boolean
 *   onOpenChange   (open: boolean) => void
 *   options        CreateJamOptionSets  — injectable; defaults to mock data.
 *                  Future: pass backend-fetched options from the parent page.
 *   initialValues  Partial<INITIAL_FORM>?  — when provided, pre-populates the
 *                  form and switches the title to "Edit Jam".
 */
const CreateJamModal = ({
  open,
  onOpenChange,
  initialValues,
}) => {
  const { options, isLoading } = useFormOptions()
  return (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      {/* ── Overlay ────────────────────────────────────────────────────────── */}
      <Dialog.Overlay
        className="fixed inset-0 z-40 cursor-pointer"
        onClick={() => onOpenChange(false)}
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(220,46,115,0.08) 0%, rgba(0,0,0,0.74) 100%)",
          animation: "jamOverlayIn 0.22s ease forwards",
        }}
      />

      {/* ── Centered content container ──────────────────────────────────────── */}
      <Dialog.Content
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center outline-none"
        style={{ pointerEvents: "none" }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/*
         * Dropdown portal target — lives INSIDE Dialog.Content's DOM so
         * Radix never fires onPointerDownOutside/onFocusOutside for clicks
         * inside the dropdown. Lives OUTSIDE the modal card so the card's
         * backdropFilter (which creates a CSS containing block, trapping
         * position:fixed children) does not affect the dropdown.
         * pointerEvents:none on the container; the dropdown sets auto.
         */}
        <div
          id="jam-dropdown-portal"
          style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}
        />

        {/*
         * Slide-up uses a CSS @keyframes animation (not Framer Motion y)
         * so NO transform remains on the element after it finishes.
         * CSS animations without fill-mode:forwards reset the animated
         * property to its natural value (transform: none) on completion.
         * This prevents the modal card from becoming a containing block
         * for position:fixed children (the location dropdown).
         * Framer Motion handles opacity only — no transform at all.
         */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          // Mobile: full-width bottom sheet  |  Desktop: 560px centered card
          className="w-full md:w-[560px] flex flex-col overflow-hidden
            rounded-t-[1.5rem] max-h-[92vh]
            md:rounded-[1.5rem] md:max-h-[88vh]"
          style={{
            animation: "modalSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: "auto",
            background: "rgba(20,20,20,0.95)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            boxShadow:
              "0 0 60px rgba(229,226,225,0.03), 0 0 50px rgba(220,46,115,0.1), 0 -1px 0 rgba(220,46,115,0.07)",
          }}
        >
          {/*
           * Key prop resets CreateJamForm state when the modal re-opens.
           * Using `open` as the key unmounts + remounts the form on each open,
           * giving a clean slate without managing reset logic in the form.
           */}
          {!isLoading && options && (
            <CreateJamForm
              key={open ? "open" : "closed"}
              options={options}
              onClose={() => onOpenChange(false)}
              initialValues={initialValues}
            />
          )}
        </motion.div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
  )
}

export default CreateJamModal;
