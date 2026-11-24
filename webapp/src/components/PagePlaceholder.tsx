import type { ReactNode } from 'react';
import { Construction } from 'lucide-react';
import { Card } from '@/components/ui';

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export function PagePlaceholder({ title, description, icon, children }: PagePlaceholderProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8 sm:p-12 text-center">
        <div className="h-14 w-14 rounded-2xl bg-mint flex items-center justify-center mx-auto mb-5 text-primary-600">
          {icon ?? <Construction className="h-7 w-7" />}
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">{title}</h1>
        <p className="text-ink-soft max-w-md mx-auto">{description}</p>
        {children && <div className="mt-6">{children}</div>}
      </Card>
    </div>
  );
}
