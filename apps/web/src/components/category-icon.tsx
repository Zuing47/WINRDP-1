import {
  Bike,
  Camera,
  Gamepad2,
  Laptop,
  Package,
  Refrigerator,
  Smartphone,
  Tablet,
  Tv,
  Watch,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  Smartphone,
  Laptop,
  Gamepad2,
  Tv,
  Camera,
  Tablet,
  Watch,
  Refrigerator,
  Bike,
  Wrench,
  Package,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Package;
  return <Icon className={className} />;
}
