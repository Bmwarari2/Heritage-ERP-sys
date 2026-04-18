import Header from '@/components/layout/Header'

interface PageWrapperProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export default function PageWrapper({ title, subtitle, actions, children }: PageWrapperProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      <Header title={title} subtitle={subtitle} actions={actions} />
      <div className="flex-1 overflow-y-auto scroll-subtle">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  )
}
