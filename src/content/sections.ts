import type { Locale } from '../types/content';

interface SectionCopy {
  nav: string;
  kicker: string;
  title: string;
  description: string;
  empty: string;
}

interface SubsectionCopy {
  id: string;
  contentId: string;
  title: Record<Locale, string>;
}

interface SectionDefinition {
  id: string;
  tone: 'paper' | 'tint' | 'ink';
  contentSectionIds: string[];
  subsections?: SubsectionCopy[];
  copy: Record<Locale, SectionCopy>;
}

export const sections: SectionDefinition[] = [
  {
    id: 'home',
    tone: 'ink',
    contentSectionIds: ['opening'],
    copy: {
      'pt-BR': { nav: 'Início', kicker: 'Tese de doutorado', title: 'Living Labs como ambientes colaborativos para a inovação: uma proposta de framework', description: '', empty: '' },
      en: { nav: 'Home', kicker: 'PhD Research · Collaborative Innovation', title: 'Living Labs como ambientes colaborativos para a inovação: uma proposta de framework', description: '', empty: '' },
    },
  },
  {
    id: 'context',
    tone: 'paper',
    contentSectionIds: ['context-problem', 'living-lab-concepts', 'environment-project-distinction'],
    subsections: [
      { id: 'context-problem', contentId: 'context-problem', title: { 'pt-BR': 'O problema e o contexto', en: 'The problem and context' } },
      { id: 'living-lab-concepts', contentId: 'living-lab-concepts', title: { 'pt-BR': 'Living Labs e inovação', en: 'Living Labs and innovation' } },
      { id: 'environment-project-distinction', contentId: 'environment-project-distinction', title: { 'pt-BR': 'Living Lab: ambiente e projeto', en: 'Living Lab: environment and project' } },
    ],
    copy: {
      'pt-BR': { nav: 'O Problema e o Contexto', kicker: 'Pesquisa · contexto', title: 'O Problema e o Contexto', description: '', empty: 'Conteúdo científico ainda não integrado.' },
      en: { nav: 'The Problem & Context', kicker: 'Research · context', title: 'The Problem and Context', description: '', empty: 'Scientific content has not yet been integrated.' },
    },
  },
  {
    id: 'approach',
    tone: 'tint',
    contentSectionIds: ['methodology', 'framework-contribution'],
    subsections: [
      { id: 'methodology', contentId: 'methodology', title: { 'pt-BR': 'Metodologia', en: 'Methodology' } },
      { id: 'framework-contribution', contentId: 'framework-contribution', title: { 'pt-BR': 'Contribuição', en: 'Contribution' } },
    ],
    copy: {
      'pt-BR': { nav: 'Abordagem e Contribuição', kicker: 'Pesquisa · abordagem', title: 'Abordagem e Contribuição', description: '', empty: 'Conteúdo científico ainda não integrado.' },
      en: { nav: 'Approach & Contribution', kicker: 'Research · approach', title: 'Approach and Contribution', description: '', empty: 'Scientific content has not yet been integrated.' },
    },
  },
  {
    id: 'results',
    tone: 'ink',
    contentSectionIds: ['results-implications'],
    copy: {
      'pt-BR': { nav: 'Resultados', kicker: 'Pesquisa · resultados', title: 'Resultados', description: '', empty: 'Resultados científicos ainda não integrados.' },
      en: { nav: 'Results', kicker: 'Research · results', title: 'Results', description: '', empty: 'Scientific results have not yet been integrated.' },
    },
  },
  {
    id: 'about',
    tone: 'paper',
    contentSectionIds: ['full-thesis', 'author-profile', 'references'],
    subsections: [
      { id: 'full-thesis', contentId: 'full-thesis', title: { 'pt-BR': 'Acesso à tese', en: 'Access the thesis' } },
      { id: 'author-profile', contentId: 'author-profile', title: { 'pt-BR': 'Sobre a autora', en: 'About the author' } },
    ],
    copy: {
      'pt-BR': { nav: 'Sobre a autora e acesso à tese', kicker: 'Autoria · leitura integral', title: 'Sobre a autora e acesso à tese', description: '', empty: 'Informações ainda não disponíveis.' },
      en: { nav: 'About & Full Thesis', kicker: 'Author · full text', title: 'About the Author and Full Thesis', description: '', empty: 'Information is not yet available.' },
    },
  },
];

export const ui: Record<Locale, {
  skip: string;
  siteLabel: string;
  navigation: string;
  menu: string;
  closeMenu: string;
  begin: string;
  photoNote: string;
  photoCredit: string;
  footer: string;
}> = {
  'pt-BR': {
    skip: 'Pular para o conteúdo', siteLabel: 'Narrativa da tese', navigation: 'Navegação principal', menu: 'Abrir navegação', closeMenu: 'Fechar navegação',
    begin: 'Percorrer a pesquisa',
    photoNote: 'Imagem ilustrativa · sem vínculo com a pesquisa', photoCredit: 'Foto: Van Tay Media / Unsplash', footer: 'Tese de doutorado · UFSC',
  },
  en: {
    skip: 'Skip to content', siteLabel: 'Thesis narrative', navigation: 'Main navigation', menu: 'Open navigation', closeMenu: 'Close navigation',
    begin: 'Explore the research',
    photoNote: 'Illustrative image · not related to the research', photoCredit: 'Photo: Van Tay Media / Unsplash', footer: 'Doctoral thesis · UFSC',
  },
};
