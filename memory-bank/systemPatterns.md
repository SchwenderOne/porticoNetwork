# systemPatterns.md

## Systemarchitektur

- Client-Server-Architektur mit React/Vite-Frontend und Express-Backend
- Gemeinsame Typendefinitionen in `shared/schema.ts` für Front- und Backend
- Hot-Reloading während der Entwicklung via Vite für schnelle Feedback-Zyklen

## Hauptkomponenten und ihre Beziehungen

- `client/src`: Frontend-Komponenten (Modals, GraphCanvas, FilterSection)
- `server`: API-Routen in `routes.ts` und Speicher-Interface in `storage.ts`
- `shared`: zentrale Zod-Schemas und Typen für Datenmodelle
- React Query für Server-State-Management, D3-Utils für Graph-Logik
- Shadcn/UI-Komponenten für konsistente, wiederverwendbare UI-Elemente

## Design- und Integrationsmuster

- MVC-ähnliches Muster im Backend: Routen als Controller, `storage.ts` als Model
- Observer/Publish-Subscribe in D3-Simulation (Event-Handler für Drag & Zoom)
- Custom React Hooks (`useNetworkGraph`, `use-toast`) für wiederverwendbare Logik
- Factory-Pattern im QueryClient und D3-Utils zum Erzeugen und Konfigurieren von Instanzen

## Datenfluss und API-Kommunikation

- Frontend verwendet TanStack Query, um HTTP-Anfragen an REST-Endpunkte (`/api/contacts`, `/api/clusters`) zu stellen
- Zod-Validierung auf Server-Seite stellt sichere Datenübergabe sicher
- In-Memory-Storage speichert Contacts, Clusters und Knotenpositionen
- React Query Cache synchronisiert UI-Zustand mit Backend-Daten durch automatische Refetches

## Skalierbarkeit und Zuverlässigkeit

- Geplante Migration zu Drizzle ORM und PostgreSQL für persistente Datenhaltung
- Statischer und zustandsloser Express-Server zur einfachen Skalierung hinter einem Load Balancer
- Fehlerbehandlung über Express-Middleware und Zod-Fehler-Handling
- Logging und Monitoring (z.B. morgan, winston) können ergänzt werden
