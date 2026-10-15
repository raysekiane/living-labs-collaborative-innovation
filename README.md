# Living Labs & Collaborative Innovation

Academic research website by **Rayse Kiane de Souza**, presenting the doctoral thesis *Living Labs como ambientes colaborativos para a inovação: uma proposta de framework* in Portuguese and English.

## Development

Requirements: Node.js 22.12 or later.

```sh
npm ci
npm run content:validate
npm run test
npm run typecheck
npm run build
npm run preview
```

The site is a static React and Vite application. Its public bilingual content is stored in `public/content.json`; internal editorial records and working documents are kept outside the public project package.
