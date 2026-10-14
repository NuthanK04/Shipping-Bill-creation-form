interface PersistentTabProps {
  value: string
  activeTab: string
  children: React.ReactNode
  className?: string
}

export function PersistentTab({ value, activeTab, children, className }: PersistentTabProps) {
  return (
    <div role="tabpanel" hidden={activeTab !== value} className={`mt-3 ${className ?? ''}`}>
      {children}
    </div>
  )
}
