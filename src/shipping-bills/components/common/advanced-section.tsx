export function AdvancedSection({
  title,
  children,
  open,
  onToggle
}: {
  title: string
  children: React.ReactNode
  open?: boolean
  onToggle?: (isOpen: boolean) => void
}) {
  return (
    <details
      className="group rounded-xl border border-gray-200 bg-white p-4 shadow-2xs transition-all dark:border-gray-800 dark:bg-gray-900"
      open={open}
      onToggle={(e) => onToggle?.(e.currentTarget.open)}>
      <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold text-gray-900 select-none hover:text-black dark:text-gray-100 dark:hover:text-white">
        <span>{title}</span>
        <span className="text-gray-400 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">{children}</div>
    </details>
  )
}
