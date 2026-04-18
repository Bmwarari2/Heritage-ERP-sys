import Header from '@/components/layout/Header'

interface PageWrapperProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export default function PageWrapper({ title, subtitle, actions, children }: PageWrapperProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title={title} subtitle={subtitle} actions={actions} />
      <div className="flex-1 overflow-y-auto p-8">
        {children}
      </div>
    </div>
  )
}
