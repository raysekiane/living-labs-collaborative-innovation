import type { Locale, PublicContentItem } from '../types/content';

interface ContentBlocksProps {
  items: PublicContentItem[];
  locale: Locale;
}

export function ContentBlocks({ items, locale }: ContentBlocksProps) {
  if (items.length === 0) return null;

  return (
    <div className="content-blocks">
      {items.map((item) => {
        const text = item.translations[locale].text;
        const displayText = item.content_type === 'paragraph' ? renderInlineMarkup(text) : text;
        const className = `content-block content-block--${item.content_type}`;
        if ((item.content_type === 'link' || item.content_type === 'reference') && item.url) {
          return <a className={`${className} content-block-link`} href={item.url} key={item.claim_id} lang={locale} target="_blank" rel="noopener noreferrer">{text}<span aria-hidden="true">↗</span></a>;
        }
        if (item.content_type === 'title') return <h1 id={item.claim_id === 'home-title' ? 'home-title' : undefined} className={`${className} hero-title`} key={item.claim_id} lang={locale}>{displayText}</h1>;
        if (item.content_type === 'eyebrow') return <p className={className} key={item.claim_id} lang={locale}>{displayText}</p>;
        if (item.content_type === 'subtitle') return <p className={`${className} hero-intro`} key={item.claim_id} lang={locale}>{displayText}</p>;
        return <p className={className} key={item.claim_id} lang={locale}>{displayText}</p>;
      })}
    </div>
  );
}

function renderInlineMarkup(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https:\/\/[^)\s]+\))/g).map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\((https:\/\/[^)\s]+)\)$/);
    if (link) {
      return <a className="inline-content-link" href={link[2]} key={index} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
