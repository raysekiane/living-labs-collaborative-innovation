import type { PropsWithChildren, ReactNode } from 'react';

interface PageShellProps extends PropsWithChildren {
  header: ReactNode;
  locale: string;
}

export function PageShell({ children, header, locale }: PageShellProps) {
  return (
    <div className="site-frame" data-locale={locale}>
      <header className="site-header">
        <a
          className="brand"
          href="#home"
          aria-label={locale === 'en' ? 'Living Labs — home' : 'Living Labs — início'}
        >
          <span className="brand-symbol" aria-hidden="true">L</span>
          <span className="brand-name">Living Labs</span>
          <span className="brand-divider" aria-hidden="true" />
          <span className="brand-kind">{locale === 'en' ? 'Thesis' : 'Tese'}</span>
        </a>
        <div className="header-tools">{header}</div>
      </header>
      {children}
    </div>
  );
}
