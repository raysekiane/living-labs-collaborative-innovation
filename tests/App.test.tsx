import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ schema_version: '1.1', items: [] }),
  }));
  await act(async () => {
    root.render(createElement(App));
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('editorial interface shell', () => {
  it('renders the five primary sections without scientific body content', () => {
    expect(container.querySelectorAll('main section')).toHaveLength(5);
    expect(container.querySelector('#environment-project-distinction')).not.toBeNull();
    expect(container.textContent).toContain('Conteúdo científico ainda não integrado.');
    expect(container.querySelector<HTMLImageElement>('.hero-photo-image')?.alt).toBe(
      'Fotografia ilustrativa de pessoas reunidas em torno de uma mesa.',
    );
    expect(container.querySelectorAll('.content-block')).toHaveLength(0);
    expect(container.querySelectorAll('.section-nav a')).toHaveLength(5);
  });

  it('switches interface language while preserving the page section structure', async () => {
    const languageButton = container.querySelector<HTMLButtonElement>('.language-switch button:last-child');
    expect(languageButton).not.toBeNull();

    await act(async () => languageButton?.click());

    expect(document.documentElement.lang).toBe('en');
    expect(container.querySelector('.section-nav')?.getAttribute('aria-label')).toBe('Main navigation');
    expect(container.querySelector('#approach h2')?.textContent).toBe('Approach and Contribution');
    expect(container.textContent).toContain('Scientific content has not yet been integrated.');
    expect(container.querySelectorAll('main section')).toHaveLength(5);
  });

  it('provides a compact, keyboard-operable primary menu and closes it after navigation', async () => {
    const toggle = container.querySelector<HTMLButtonElement>('.menu-toggle');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    await act(async () => toggle?.click());
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    const contextLink = container.querySelector<HTMLAnchorElement>('.section-nav a[href="#context"]');
    await act(async () => contextLink?.click());
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('#context')).not.toBeNull();
  });

  it('requests only the generated public content asset', () => {
    expect(fetch).toHaveBeenCalledWith('/content.json');
  });

  it('renders translated editorial links and keeps destinations intact after switching languages', async () => {
    const publicContent = {
      schema_version: '1.1' as const,
      items: [
        {
          claim_id: 'home-title', site_section_id: 'opening', content_type: 'title',
          translations: { 'pt-BR': { text: 'Título de teste' }, en: { text: 'Test title' } },
        },
        {
          claim_id: 'thesis-link', site_section_id: 'full-thesis', content_type: 'link',
          translations: { 'pt-BR': { text: 'Acessar a tese completa' }, en: { text: 'Access the full thesis' } },
          url: 'https://example.org/thesis',
        },
        {
          claim_id: 'author-link', site_section_id: 'author-profile', content_type: 'link',
          translations: { 'pt-BR': { text: 'Perfil da autora no LinkedIn' }, en: { text: 'Author profile on LinkedIn' } },
          url: 'https://example.org/author',
        },
      ],
    };
    await act(async () => root.unmount());
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => publicContent }));
    root = createRoot(container);
    await act(async () => root.render(createElement(App)));

    expect(container.querySelector('#home-title')?.textContent).toBe('Título de teste');
    const thesisLink = container.querySelector<HTMLAnchorElement>('#full-thesis a.content-block-link');
    expect(thesisLink?.getAttribute('href')).toBe('https://example.org/thesis');
    expect(thesisLink?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(thesisLink?.textContent).toContain('Acessar a tese completa');
    expect(container.querySelector('#author-profile a.content-block-link')?.textContent).toContain('Perfil da autora no LinkedIn');

    const englishButton = container.querySelector<HTMLButtonElement>('.language-switch button:last-child');
    await act(async () => englishButton?.click());
    expect(container.querySelector('#home-title')?.textContent).toBe('Test title');
    expect(container.querySelector('#full-thesis a.content-block-link')?.textContent).toContain('Access the full thesis');
    expect(container.querySelector('#author-profile a.content-block-link')?.textContent).toContain('Author profile on LinkedIn');
  });
});
