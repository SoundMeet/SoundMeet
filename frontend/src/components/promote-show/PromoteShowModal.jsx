import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import PromoteShowForm from "./PromoteShowForm";
import { useFormOptions } from "../../hooks/useFormOptions";

/**
 * PromoteShowModal — Radix Dialog shell wrapping PromoteShowForm.
 *
 * This component has no form state — it is a pure presentational shell.
 *
 * Props:
 *   open         boolean
 *   onOpenChange (open: boolean) => void
 *   options      PromoteShowOptionSets — injectable; defaults to mock data.
 */
const PromoteShowModal = ({
  open,
  onOpenChange,
  initialValues,
}) => {
  const { options, isLoading } = useFormOptions()
  return (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      {/* Overlay */}
      <Dialog.Overlay
        className="fixed inset-0 z-40 cursor-pointer"
        onClick={() => onOpenChange(false)}
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(220,46,115,0.08) 0%, rgba(0,0,0,0.74) 100%)",
          animation: "jamOverlayIn 0.22s ease forwards",
        }}
      />

      {/* Centered content container */}
      <Dialog.Content
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center outline-none"
        style={{ pointerEvents: "none" }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div
          id="promote-show-dropdown-portal"
          style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
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
          {!isLoading && options && (
            <PromoteShowForm
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

export default PromoteShowModal;
