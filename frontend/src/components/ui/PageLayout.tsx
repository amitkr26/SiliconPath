import { cn } from "@/lib/utils";

type LayoutVariant = "sidebar-content" | "content-sidebar" | "full" | "three-column";

export interface PageLayoutProps {
  variant?: LayoutVariant;
  className?: string;
  children: React.ReactNode;
}

export interface SlotProps {
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<LayoutVariant, string> = {
  "sidebar-content": "flex flex-col lg:flex-row gap-6",
  "content-sidebar": "flex flex-col lg:flex-row gap-6",
  full: "flex justify-center",
  "three-column": "flex flex-col lg:flex-row gap-6",
};

export function PageLayout({ variant = "full", className, children }: PageLayoutProps) {
  return (
    <div className={cn(variantClasses[variant], className)}>
      {children}
    </div>
  );
}

export function SidebarLeft({ className, children }: SlotProps) {
  return (
    <aside className={cn("w-full lg:w-[280px] lg:shrink-0", className)}>
      {children}
    </aside>
  );
}

export function SidebarRight({ className, children }: SlotProps) {
  return (
    <aside className={cn("w-full lg:w-[320px] lg:shrink-0", className)}>
      {children}
    </aside>
  );
}

export function MainContent({ className, children }: SlotProps) {
  return (
    <main className={cn("flex-1 min-w-0", className)}>
      {children}
    </main>
  );
}

export function ContentCenter({ className, children }: SlotProps) {
  return (
    <section className={cn("w-full max-w-4xl mx-auto", className)}>
      {children}
    </section>
  );
}
