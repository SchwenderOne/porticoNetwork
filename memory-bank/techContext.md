# techContext.md

## Technologien und Frameworks

- React v18
- TypeScript v5
- Vite als Build-Tool
- TailwindCSS für Styling
- Shadcn/UI Komponentenbibliothek
- D3.js v7 für Graph-Visualisierung
- Express.js für Backend-API
- Zod für Schema-Validierung
- TanStack Query (React Query v5) für Server-State-Management
- React Hook Form für Formular-Handling
- Fuse.js für Fuzzy Search
- Wouter für Routing

## Entwicklungsumgebung und Setup

- `npm install` zum Installieren der Abhängigkeiten
- `npm run dev` startet Frontend und Backend mit Hot-Reloading via Vite
- Entwicklung in Replit oder lokal via `http://localhost:5000`

## Abhängigkeiten und Versionierung

- Siehe `package.json`
- Wichtige Versionen: React 18.x, TypeScript 5.x, D3.js 7.x, Express 4.x

## Build- und Deployment-Prozess

- `npm run build` erstellt Produktions-Build im `dist/`-Verzeichnis
- `npm start` startet den Produktionsserver
- Docker-Deployment kann über Dockerfile ergänzt werden

## Teststrategie und Tools

- Aktuell keine automatisierten Tests definiert
- Zukünftig: Jest & React Testing Library für Unit- und Integrationstests
- E2E-Tests mit Cypress möglich
