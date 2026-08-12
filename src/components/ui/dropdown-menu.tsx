"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";

import { cn } from "@/lib/utils";

const DropdownMenu = MenuPrimitive.Root;
const DropdownMenuTrigger = MenuPrimitive.Trigger;

// Renders the positioned dropdown menu panel with app styling and animations.
// It wraps Base UI menu popup behavior.
function DropdownMenuContent({
  className,
  side = "bottom",
  sideOffset = 4,
  align = "end",
  children,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "align" | "side" | "sideOffset">) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        className="z-50"
      >
        <MenuPrimitive.Popup
          className={cn(
            "z-50 min-w-36 rounded-lg bg-white p-1 text-primary shadow-md ring-1 ring-foreground/10 outline-none data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            className,
          )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

// Renders one clickable dropdown menu item.
// It includes shared spacing, focus, disabled, and inset styles.
function DropdownMenuItem({ className, ...props }: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item
      className={cn(
        "relative flex cursor-default items-center rounded-md px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-[#f5f3f1] data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
};
