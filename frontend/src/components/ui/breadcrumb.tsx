import * as React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items, className, ...props }: BreadcrumbProps) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('common.breadcrumb.ariaLabel')}
      className={cn('flex items-center gap-1.5 text-[13.5px] text-[var(--muted-foreground)]', className)}
      {...props}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="rounded-sm px-1 text-[var(--foreground)]/80 hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn('px-1', isLast && 'font-medium text-[var(--foreground)]')}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="h-3.5 w-3.5 text-[var(--muted-foreground)]/60" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
