'use client';

interface SwapPageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  showGradient?: boolean;
}

export function SwapPageLayout({ title, description, children, showGradient = false }: SwapPageLayoutProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {showGradient && (
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245, 158, 11, 0.15), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(245, 158, 11, 0.08), transparent)',
          }}
        />
      )}
      <div className={`w-full max-w-md ${showGradient ? 'relative z-10' : ''}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
          <p className="text-gray-600 dark:text-white/60">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
