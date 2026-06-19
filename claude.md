# Onboarding Guide: Project Everflow

This repository contains a Google I/O-style presentation viewer for markdown-based slide decks. It is designed to support custom layouts, bilingual Thai/English content, interactive logic diagrams, and cross-window sync features for presentation.

## Core Philosophy

The default deck, `reclaiming-agency-pi.md`, centers on Mario Zechner's "pi" agent-harness project. It advocates for engineering agency, minimalist abstractions, and context stability, while critiquing bloated AI agent frameworks (referred to as "slop"). The layout and design adhere to Google I/O aesthetic specs: monospaced typography, strict color presets, ample negative space, and smooth transitions.

---

## Technical Stack

*   **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Motion (react-motion for interactive animations), Lucide React (icons).
*   **Backend / API**: Fully mocked in `vite.config.ts` using the custom `slidesApiPlugin()` middleware. It serves Markdown presentations dynamically from the `library/` folder.
*   **Routing**: Simple hash-based router using state and `window.location.hash` directly in `App.tsx`.

---

## Project Structure

```
.
├── vite.config.ts            # Vite config; embeds the mock slide library API server
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS settings
├── package.json              # Package metadata and run scripts
├── index.html                # Entry HTML pointing to src/main.tsx
├── library/                  # Presentation slide decks in markdown format
│   ├── deep-modules.md       # "Designing Deep Modules" deck
│   └── reclaiming-agency-pi.md # Core presentation deck
├── src/
│   ├── main.tsx              # React client entrypoint
│   ├── App.tsx               # Primary application component (dashboard + viewer + controls)
│   ├── parser.ts             # Custom markdown slides parser
│   ├── index.css             # Main Tailwind and global stylesheet
│   ├── components/
│   │   └── SlideDiagrams.tsx # React components for interactive diagrams
│   ├── main.js               # Legacy Reveal.js entrypoint (unused)
│   └── style.css             # Legacy Reveal.js stylesheet (unused)
```

---

## Slide Markdown Specification

Slide decks are written as standard Markdown files located inside the `library/` directory.

### 1. Frontmatter
Every deck starts with a YAML frontmatter parsed in `vite.config.ts`:
```yaml
---
title: "Presentation Title"
preset: "google-io-light"
accent: "blue"
transition: "slide"
---
```

### 2. Slide Separator
Slides are split by three dashes on a single line:
```markdown
Slide 1 content
---
Slide 2 content
```

### 3. Slide Directives
Comment tags customize layout, accent color, and interactive diagrams on a per-slide basis:
*   `<!-- layout: [hero | split | grid | interactive-diagram | benchmark] -->`
*   `<!-- diagram: [intro | motivation | lobotomy | benchmark | tools | self-mod | clankers | ourobouros | friction | summary] -->`
*   `<!-- category: CATEGORY | THAI_CATEGORY -->`
*   `<!-- accent: [blue | teal | mint | lavender] -->`

### 4. Speaker Notes
Speaker notes must begin with `Note:` or be enclosed in `<aside class="notes">` and will be displayed in the Presenter Console.

---

## API Endpoints

The mock backend plugin in `vite.config.ts` intercepts and responds to the following API endpoints:

1.  `GET /api/presentations`: Returns a JSON list of all available presentations in `library/` along with their metadata.
    *   **Response Scheme**: `Array<{ id: string, title: string, preset: string, accent: string, mtime: number }>`
2.  `GET /api/presentations/:id`: Returns the markdown source, parsed metadata, and ID for a specific deck.
    *   **Response Scheme**: `{ id: string, metadata: { title: string, preset: string, accent: string, transition: string }, content: string }`

---

## Interactive Diagrams (`SlideDiagrams.tsx`)

When a slide contains `<!-- layout: interactive-diagram -->` or `<!-- diagram: <type> -->`, it renders the `<SlideDiagrams />` component. The available diagram types are:

*   `intro`: Google I/O bouncing crest and a mock TypeScript code snippet.
*   `motivation`: A split panel comparing the broken developer tool metaphor (The Broken Hammer) to the minimalist tool (The Solid Tool).
*   `lobotomy`: An interactive visualization showing how context window pruning cuts off recent context history.
*   `benchmark`: An animated vertical chart comparing tool execution accuracy statistics.
*   `tools`: A mock command console simulator with clickable tool actions (Read, Write, Edit, Bash) printing execution logs.
*   `self-mod`: A workspace structure graph illustrating TypeScript plugin self-modification and hot reload.
*   `clankers`: A verification flow diagram illustrating human-only PR gateways.
*   `ourobouros`: A cyclical network map outlining how synthetic AI training loops degrade codebases.
*   `friction`: An interactive range slider showcasing how cognitive resistance aids coding memory.
*   `summary`: A text block validating human verification requirements.

---

## Development Workflows

### Command Scripts
*   **Run Development Server**: `npm run dev` (starts on port 5173, host 0.0.0.0)
*   **Build Project**: `npm run build`
*   **Preview Build**: `npm run preview`

### Integration Guidelines
*   **Adding New Slides**: Create a `.md` file in `library/`. The mock endpoint automatically registers it.
*   **Modifying Diagram Behavior**: Edit the corresponding `render<Type>Diagram` helper function in `src/components/SlideDiagrams.tsx`.
*   **Modifying Parser Logic**: Adjust `src/parser.ts`. Ensure you match regular expressions for metadata matches.
