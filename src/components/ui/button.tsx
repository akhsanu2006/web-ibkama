import Link from "next/link";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-300 ease-out disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
const variants: Record<Variant, string> = {
  // hijau tunggal → umpan balik hover lewat angkat + bayangan, bukan ganti warna
  primary: "bg-green-800 text-white shadow-soft hover:-translate-y-0.5 hover:shadow-lift",
  secondary: "bg-white text-green-800 ring-1 ring-inset ring-green-200 hover:bg-green-50",
  ghost: "text-green-800 hover:bg-green-50",
  danger: "bg-danger text-white hover:brightness-95",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-[15px]",
};

type Common = { variant?: Variant; size?: Size; className?: string; children: React.ReactNode };

export function Button({
  variant = "primary", size = "md", className, ...props
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary", size = "md", className, href, external, children,
}: Common & { href: string; external?: boolean }) {
  const cls = clsx(base, variants[variant], sizes[size], className);
  if (external)
    return <a href={href} className={cls} target="_blank" rel="noopener noreferrer">{children}</a>;
  return <Link href={href} className={cls}>{children}</Link>;
}
