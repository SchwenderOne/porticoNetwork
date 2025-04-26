# Portico Netzwerk Visualisierung

Eine interaktive Mind-Map zur Visualisierung und Verwaltung von Netzwerkkontakten und Clustern mit modernem Glassmorphism-Design.

---

## 1. Projektübersicht

- **Zweck / Ziel**  
  Eine dynamische Visualisierungsplattform für das Portico Netzwerk, die komplexe Netzwerkzusammenhänge in einer intuitiven, interaktiven Oberfläche darstellt. Die Anwendung ermöglicht es Nutzern, Kontakte und Bereiche (Cluster) in einem Mind-Map-artigen Layout zu organisieren, zu bearbeiten und zu erkunden. Entwickelt mit einem modernen Glassmorphism-Design für ein ansprechendes visuelles Erlebnis.

- **Funktionalitäten**  
  - Interaktive Netzwerk-Visualisierung mit D3.js
  - Zentrale "Portico"-Node als Ausgangspunkt des Netzwerks
  - Hinzufügen und Bearbeiten von Kontakten und Bereichen (Cluster)
  - Drag-and-Drop-Positionierung mit persistenter Speicherung der Positionen
  - Zoom- und Pan-Funktionalität mit Steuerungselementen
  - "Fit to View"-Button zum Anzeigen des gesamten Netzwerks
  - Filterung von Kontakten nach Bereichen/Clustern
  - Detailansicht für Kontakte mit vollständigen Informationen
  - Fuzzy-Suche nach Kontaktnamen oder Rollen
  - Modernes Glassmorphism-UI-Design
  - Farbcodierte Cluster und Kontakt-Nodes
  - Floating Action Button (FAB) für Hauptaktionen
  - Mehrsprachige Unterstützung (derzeit Deutsch)

---

## 2. Tech-Stack & Dependencies

- **Frameworks / Libraries**  
  - React (v18.x) - Frontend-Framework
  - TypeScript (v5.x) - Typsicheres JavaScript
  - D3.js (v7.x) - Für die Graphen-Visualisierung und Interaktivität
  - Express.js - Backend-Server und API
  - TailwindCSS - Utility-First CSS-Framework für Styling
  - Shadcn/UI - Komponenten-Bibliothek für UI-Elemente
  - Drizzle ORM - Datenbankabstraktion und Schemadefinition
  - Zod - Schema-Validierung und Typsicherheit
  - TanStack Query (React Query v5) - Server-State-Management
  - React Hook Form - Formularvalidierung und -handling
  - Lucide React - Icon-Bibliothek
  - Wouter - Routing-Bibliothek
  - Fuse.js - Fuzzy-Search-Implementierung
  
- **Package-Manager**  
  npm - Zur Verwaltung aller Abhängigkeiten und Skripte
  
- **Weitere Tools**  
  - Vite - Build-Tool und Entwicklungsserver
  - Replit - Entwicklungs- und Hosting-Plattform
  - MemStorage - In-Memory-Speicherlösung für Entwicklung
  - LocalStorage/SessionStorage - Persistentes Speichern von UI-Zuständen

---

## 3. Projektstruktur

```
/
├── client/                                # Frontend-Code
│   ├── src/
│   │   ├── components/                    # UI-Komponenten
│   │   │   ├── ui/                        # Shadcn UI-Komponenten (Button, Dialog, etc.)
│   │   │   ├── AddClusterModal.tsx        # Modal zum Hinzufügen/Bearbeiten von Bereichen
│   │   │   ├── AddContactModal.tsx        # Modal zum Hinzufügen/Bearbeiten von Kontakten
│   │   │   ├── ContactDetailDrawer.tsx    # Seitenleiste für Kontaktdetails
│   │   │   ├── FilterSection.tsx          # Filteroptionen und Suchfeld
│   │   │   ├── GraphCanvas.tsx            # Haupt-Visualisierungskomponente mit D3
│   │   │   └── HeroTitle.tsx              # Seitentitel-Komponente
│   │   ├── hooks/                         # React Custom Hooks
│   │   │   ├── use-mobile.tsx             # Erkennung von mobilen Geräten
│   │   │   ├── use-toast.ts               # Toast-Benachrichtigungen
│   │   │   └── useNetworkGraph.ts         # Hook für D3.js-Graph-Logik
│   │   ├── lib/                           # Dienstprogramme und Hilfsfunktionen
│   │   │   ├── d3-utils.ts                # D3.js-Funktionen für Graph-Darstellung
│   │   │   ├── fuzzySearch.ts             # Implementierung der Fuzzy-Suche
│   │   │   ├── queryClient.ts             # API-Client und Abfrage-Konfiguration
│   │   │   ├── types.d.ts                 # TypeScript-Typdefinitionen
│   │   │   └── utils.ts                   # Allgemeine Hilfsfunktionen
│   │   ├── pages/
│   │   │   ├── NetworkPage.tsx            # Hauptseite mit Netzwerk-Visualisierung
│   │   │   └── not-found.tsx              # 404-Seite
│   │   ├── App.tsx                        # Haupt-React-Komponente und Routing
│   │   ├── index.css                      # Globale Styles und Tailwind-Imports
│   │   └── main.tsx                       # Entry-Point für React-Anwendung
│   └── index.html                         # HTML-Grundgerüst
├── server/                                # Backend-Code
│   ├── index.ts                           # Express-Server-Konfiguration
│   ├── routes.ts                          # API-Endpunkte und Route-Handler
│   ├── storage.ts                         # Datenspeicher-Interface und Implementierung
│   └── vite.ts                            # Vite-Integration für Entwicklung
├── shared/                                # Von Front- und Backend gemeinsam genutzter Code
│   └── schema.ts                          # Datenmodelle, Schemas und Typdefinitionen
├── attached_assets/                       # Designvorlagen und visuelle Assets
│   ├── Visueller Walled Garden Konzept.jpeg
│   └── original-7a27fe131f29295e737930be8cef2fc5.webp
├── components.json                        # Shadcn-Komponentenkonfiguration
├── drizzle.config.ts                      # Drizzle ORM Konfiguration
├── package.json                           # Projektabhängigkeiten und Skripte
├── postcss.config.js                      # PostCSS-Konfiguration (für Tailwind)
├── tailwind.config.ts                     # Tailwind-CSS-Konfiguration
├── tsconfig.json                          # TypeScript-Konfiguration
├── vite.config.ts                         # Vite-Build-Konfiguration
└── README.md                              # Projektdokumentation
```

---

## 4. Installation & Setup

1. Replit-Projekt forken oder klonen
   ```bash
   git clone https://replit.com/@username/portico-netzwerk-visualisierung
   ```

2. Abhängigkeiten installieren
   ```bash
   npm install
   ```

3. Entwicklungsserver starten
   ```bash
   npm run dev
   # oder über Replit-Workflow "Start application" starten
   ```

4. Die Anwendung öffnet sich im Replit-Browser oder ist unter `http://localhost:5000` erreichbar.

5. Zur Entwicklung:
   - Frontend-Code befindet sich im `client/`-Verzeichnis
   - Backend-Code befindet sich im `server/`-Verzeichnis
   - Änderungen werden automatisch durch Hot-Modul-Replacement aktualisiert

---

## 5. Laufende Skripte

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Startet den Entwicklungsserver für Frontend und Backend mit Hot-Reloading |
| `npm run build` | Erstellt ein optimiertes Produktions-Build im `dist/`-Verzeichnis |
| `npm start` | Startet den Produktionsserver mit dem erstellten Build |
| `npm run type-check` | Führt TypeScript-Typprüfung durch ohne zu kompilieren |
| `npx drizzle-kit generate` | Generiert SQL-Migration aus Drizzle-Schema (falls DB verwendet wird) |

---

## 6. Umgebungsvariablen

Das Projekt verwendet derzeit für die Entwicklung keine Umgebungsvariablen, kann aber mit folgenden Variablen konfiguriert werden:

```env
NODE_ENV=development       # Entwicklungsmodus (development/production)
PORT=5000                  # Server-Port (Standard: 5000)
DATABASE_URL=              # Falls PostgreSQL verwendet wird
```

Für eine potenzielle Produktionsumgebung könnten zusätzliche Variablen erforderlich sein:

```env
VITE_API_BASE_URL=         # Basis-URL für API-Anfragen
```

Umgebungsvariablen können in einer `.env`-Datei im Hauptverzeichnis oder über die Replit-Umgebungsvariablen-Einstellungen konfiguriert werden.

---

## 7. Stil- und Namenskonventionen

* **CSS-Klassen**
  * TailwindCSS-Utility-Klassen für Styling
  * `glass` Klasse für Glassmorphism-Effekte
  * `className={cn("base-class", condition && "conditional-class")}` Pattern mit cn-Helper

* **Komponenten-Namensgebung**
  * PascalCase für React-Komponenten (z.B. `NetworkPage`, `AddContactModal`)
  * Komponenten für UI-Elemente beginnen mit der Funktion (z.B. `AddClusterModal`, nicht `ClusterAddModal`)

* **Variablen/Funktionen**
  * camelCase für Variablen und Funktionen
  * Deskriptive Benennungen (z.B. `handleNodeClick`, `toggleFilter`)
  * Event-Handler beginnen mit `handle...` oder `on...` (z.B. `handleSubmit`, `onNodeClick`)

* **TypeScript-Typen**
  * Interface-Namen beginnen mit `I` (z.B. `IStorage`)
  * Typen für Komponenten-Props enden mit `Props` (z.B. `ContactDetailDrawerProps`)
  * Zod-Schemas enden mit `Schema` (z.B. `insertContactSchema`)

* **Dateistruktur**
  * Komponenten nach Funktionalität gruppiert
  * Shadcn-UI-Komponenten in `/components/ui/`
  * Seiten in `/pages/`
  * Hooks in `/hooks/`
  * D3.js-Logik in `/lib/d3-utils.ts`

* **Code-Stil**
  * 2 Leerzeichen Einrückung
  * Semikolon am Ende jeder Anweisung
  * JSX mit selbstschließenden Tags für leere Elemente
  * `const` für unveränderliche Werte, `let` für veränderliche

---

## 8. Deployment

### Auf Replit
Die Anwendung ist für die Ausführung auf Replit optimiert:

1. Projekt in Replit öffnen
2. "Run"-Button klicken oder Workflow "Start application" starten
3. Die App ist automatisch unter der Replit-URL verfügbar (Format: `https://portico-netzwerk-visualisierung.{username}.repl.co`)

### Für andere Umgebungen

1. Repository klonen:
   ```bash
   git clone https://github.com/username/portico-netzwerk-visualisierung.git
   cd portico-netzwerk-visualisierung
   ```

2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

3. Produktions-Build erstellen:
   ```bash
   npm run build
   ```

4. Server starten:
   ```bash
   npm start
   ```

5. Für Docker-basiertes Deployment (falls erforderlich):
   ```bash
   # Dockerfile erstellen und konfigurieren
   docker build -t portico-network .
   docker run -p 5000:5000 portico-network
   ```

---

## 9. Bekannte Probleme & To-Dos

### Bugs & Einschränkungen
* **Mobile Ansicht**: Die Anwendung ist primär für Desktop-Geräte optimiert und benötigt weitere Anpassungen für mobile Geräte.
* **Zoom-Verhalten**: Bei häufigem Aktualisieren kann es zu unerwünschtem Zoom-Verhalten kommen.
* **Browser-Kompatibilität**: Die D3.js-Implementierung ist hauptsächlich für Chrome optimiert.
* **Performance**: Bei sehr großen Netzwerken kann die Rendering-Performance nachlassen.

### Geplante Verbesserungen
* **Persistente Datenbank**: Implementierung von PostgreSQL statt In-Memory-Storage
* **Kontaktverbindungen**: Direktes Verbinden von Kontakten untereinander
* **Verbesserte Drag-and-Drop-Funktionalität**: Stabilere Persistenz von Knotenpositionen
* **Export/Import-Funktionalität**: JSON-Export/Import für Netzwerkdaten
* **Erweiterte Filter**: Filtern nach mehreren Attributen (z.B. Rolle, Status)
* **Benutzerauthentifizierung**: Login-System für mehrere Benutzer
* **Undo/Redo-Funktionalität**: Zurücknehmen und Wiederholen von Aktionen
* **Mehr Anpassungsoptionen**: Benutzerdefinierte Farbschemata und Layouts
* **Hierarchische Strukturen**: Unterstützung für verschachtelte Cluster-Hierarchien

### Dokumentationsbedarf
* Erstellen einer detaillierten API-Dokumentation für Backend-Endpunkte
* Erweitern der Komponentendokumentation für Frontend-Entwickler
* Hinzufügen von JSDoc-Kommentaren zu komplexen Funktionen

---

## 10. Mitwirken

Bei der Entwicklung dieses Projekts sind folgende Richtlinien zu beachten:

### Workflow für Beiträge

1. Repository forken und lokalen Clone erstellen
2. Feature-Branch von `main` erstellen (`git checkout -b feature/meine-neue-funktion`)
3. Code-Änderungen implementieren und testen
4. Commit-Nachricht mit klarer Beschreibung (`git commit -m 'Feature: Beschreibung der Änderung'`)
5. Push zum Feature-Branch (`git push origin feature/meine-neue-funktion`)
6. Pull Request gegen den `main`-Branch erstellen

### Coding-Standards

* Folgen Sie den bestehenden Stil- und Namenskonventionen
* Verwenden Sie TypeScript für alle neuen Funktionen mit korrekten Typ-Definitionen
* Schreiben Sie klare, beschreibende Variablen- und Funktionsnamen
* Kommentieren Sie komplexe Logik, besonders in D3.js-Funktionen
* Optimieren Sie die Performance durch Vermeidung unnötiger Rerenders

### Funktionsentwicklung

* Beim Hinzufügen neuer UI-Komponenten Shadcn/UI verwenden
* D3.js-Änderungen in der `d3-utils.ts`-Datei konzentrieren
* Neue Features sollten responsiv sein und auf Desktop und Tablet funktionieren
* API-Endpunkte in `server/routes.ts` hinzufügen und mit Zod validieren
* Datenmodelle in `shared/schema.ts` definieren

### Testen

* Manuell in verschiedenen Browsern testen (Chrome, Firefox, Safari)
* Überprüfen Sie die Konsolenausgabe auf Fehler oder Warnungen
* Testen Sie mit verschiedenen Netzwerkgrößen und Datenmengen

---

## 11. Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert:

```
MIT License

Copyright (c) 2025 Portico Netzwerk Entwickler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```