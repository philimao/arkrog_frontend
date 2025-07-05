import React, { useEffect, useState } from "react";
import ErrorBoundary from "~/components/ErrorBoundary";

// Import HeroUI portal components that are in use inside the Tool module
import {
  Tooltip as HeroTooltip,
  Popover as HeroPopover,
  PopoverTrigger as HeroPopoverTrigger,
  PopoverContent as HeroPopoverContent,
  Modal as HeroModal,
  ModalContent as HeroModalContent,
  Select as HeroSelect,
  Listbox as HeroListbox,
  ListboxItem as HeroListboxItem,
} from "@heroui/react";
import { Badge as HeroBadge } from "@heroui/badge";

/**
 * Higher-order helper that wr aps a HeroUI portal component with:
 * 1. A short mount delay (next micro-task) so that the DOM container
 *    is guaranteed to exist after a fast-refresh replacement.
 * 2. An ErrorBoundary so that any runtime error inside the component
 *    is caught and will not crash the entire React tree.
 */
function withSafePortal<P>(Wrapped: React.ComponentType<P>): React.FC<P> {
  const SafeComponent: React.FC<P> = (props) => {
    // Render nothing on the very first render; mount the real component
    // shortly afterwards. This avoids situations where the portal tries to
    // detach from an element that was already removed by fast-refresh.
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      const id = setTimeout(() => setMounted(true), 0);
      return () => clearTimeout(id);
    }, []);

    if (!mounted) return null;

    // Cast to a broad record type to sidestep strict generic variance without using `any`.
    const WrappedComponent = Wrapped as React.ComponentType<Record<string, unknown>>;
    return (
      <ErrorBoundary>
        <WrappedComponent {...(props as unknown as Record<string, unknown>)} />
      </ErrorBoundary>
    );
  };

  const name = Wrapped.displayName || Wrapped.name || "Anonymous";
  SafeComponent.displayName = `SafePortal(${name})`;
  return SafeComponent;
}

// Wrapped components that can be imported elsewhere in place of the originals
export const Tooltip = withSafePortal(HeroTooltip);
export const Popover = withSafePortal(HeroPopover);
export const Modal = withSafePortal(HeroModal);
export const Select = withSafePortal(HeroSelect);
export const Listbox = withSafePortal(HeroListbox);
// Some sub-components don't create new portals themselves; export originals for context correctness
export const PopoverTrigger = HeroPopoverTrigger;
export const PopoverContent = HeroPopoverContent;
export const ModalContent = HeroModalContent;
export const ListboxItem = HeroListboxItem;
export const Badge = withSafePortal(HeroBadge);

// Named default export for ergonomic usage if desired:
export default {
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Modal,
  ModalContent,
  Select,
  Listbox,
  ListboxItem,
  Badge,
};
