# Build Your Own AI: Zero-API Autonomous Search, Synthesis & Conservation Engine 🌿

> **Architectural Synthesis of 7 Disciplines**:
> **REA** (Reverse Engineer Anything) + **Build Your Own X** + **Unslop** + **Open Design** + **Craft Anything** + **Awesome Design MD** + **Open SEO** + **Conservation AI**

---

## 🏛 Executive Architecture Overview

```
                                ┌───────────────────────────────────────────────┐
                                │            User Interface (Browser)           │
                                │   Open Design + Canvas + Web Audio + KaTeX    │
                                └───────────────────────┬───────────────────────┘
                                                        │ POST /api/chat (SSE Stream)
                                                        ▼
                                ┌───────────────────────────────────────────────┐
                                │        Node.js Zero-Dependency Server         │
                                │              (`server.js`: node:http)         │
                                └───────────────────────┬───────────────────────┘
                                                        │
                   ┌────────────────────────────────────┼────────────────────────────────────┐
                   ▼                                    ▼                                    ▼
       ┌────────────────────────┐           ┌────────────────────────┐           ┌────────────────────────┐
       │   Multi-Engine Scraping│           │  Open SEO Text Parser  │           │   Conservation AI Core │
       │      (`search.js`)     │           │ (`indexer.js`/`ranker`)│           │  (`conservation.js`)   │
       ├────────────────────────┤           ├────────────────────────┤           ├────────────────────────┤
       │ • DuckDuckGo HTML/Lite │           │ • HTML Boilerplate Strip│          │ • IUCN Red List DB     │
       │ • Wikipedia REST API   │           │ • TF-IDF / BM25 Weights│           │ • Shannon Index ($H'$) │
       │ • Google News RSS      │           │ • Sentence Tokenizer   │           │ • Species Richness ($S$)│
       │ • Direct URL Fetcher   │           │ • Overlap Filter       │           │ • Trophic Cascades     │
       └───────────┬────────────┘           └───────────┬────────────┘           └───────────┬────────────┘
                   │                                    │                                    │
                   └────────────────────────────────────┼────────────────────────────────────┘
                                                        ▼
                                ┌───────────────────────────────────────────────┐
                                │         Dual-Mode Synthesis Pipeline          │
                                │                 (`ai.js`)                     │
                                ├───────────────────────────────────────────────┤
                                │ Mode A: Zero-API Public Inference (Pollinations)│
                                │ Mode B: Pure Local Algorithmic Graph Ranker   │
                                └───────────────────────┬───────────────────────┘
                                                        │ Real-Time Token & Citation Stream
                                                        ▼
                                ┌───────────────────────────────────────────────┐
                                │         Interactive Canvas Execution          │
                                │         Side-by-Side Live Simulator           │
                                └───────────────────────────────────────────────┘
```

---

## 📐 The 7 Disciplines Explained

### 1. REA (Reverse Engineer Anything)
Modern AI search engines (such as Perplexity, ChatGPT Search, and Gemini Grounding) do not query hidden black-box magic. Under the hood, they execute a precise 5-stage pipeline:
1. **Query Entity Disambiguation**: Strip conversational fluff ("can you please tell me about") to isolate the core entity.
2. **Parallel Live Scraping**: Concurrently query search indices and encyclopedic APIs without requiring paid API keys.
3. **Information Density Filtering**: Strip navigational boilerplate (cookie consent banners, ads, headers, footers).
4. **Statistical Term Weighting**: Calculate Inverse Document Frequency (IDF) over candidate sentences to reward rare factual terms and penalize generic filler.
5. **Streamed Synthesis with Citations**: Stream tokens via Server-Sent Events (SSE) while rendering interactive source chips linked to verified URLs.

### 2. Build Your Own X
Adhering to the legendary [Build Your Own X](https://github.com/codecrafters-io/build-your-own-x) philosophy:
- **Zero Third-Party Dependencies**: No `langchain`, no `llamaindex`, no heavy Python runtimes. The entire engine runs on native Node.js built-ins (`node:http`, `node:fs`, `node:path`, `fetch`).
- **Zero Paid Model Dependencies**: Requires no OpenAI, Anthropic, or Gemini API keys. It pairs free public zero-key streaming inference with a 100% offline mathematical sentence ranker.

### 3. Unslop & Deslop
Eliminates robotic AI clichés and marketing fluff:
- Strips robotic openings ("As an AI language model...", "Certainly! I would be glad to help...").
- Discards filler words ("delve into", "tapestry of", "testament to", "furthermore", "in conclusion").
- Delivers pure, high-density facts, structured markdown tables, and actionable findings.

### 4. Open Design
Built upon modern, accessible design systems:
- **Obsidian Emerald Palette**: Dark mode tuned for high-contrast legibility (`--bg: #07130e; --card: #10291f; --accent: #10b981;`).
- **Responsive Fluid Layout**: Adapts seamlessly from mobile viewports to desktop split-screen workstations.
- **Micro-Interactions**: Hover states, glowing pulse indicators, and smooth transitions.

### 5. Craft Anything
World-class engineering craftsmanship:
- **Canvas Split-Screen**: Live side-by-side execution environment running HTML/JS apps in an isolated iframe.
- **In-Memory Storage Polyfill**: Bridges `localStorage` inside sandboxed iframes to prevent security errors while preserving state.
- **Procedural Web Audio**: Synthesizes pleasant acoustic notification chimes directly via the browser's native `AudioContext` API—zero external audio assets required.

### 6. Awesome Design MD
High-impact markdown presentation:
- Structured comparison tables with header alignment.
- Mathematical rigor via KaTeX LaTeX formulas ($H' = -\sum p_i \ln p_i$).
- Collapsible System 2 `<details>` thought process blocks for deep deliberation.

### 7. Open SEO
Adheres to web discovery and semantic retrieval standards:
- Semantic HTML5 structure (`<header>`, `<main>`, `<aside>`, `<footer>`).
- Full Schema.org JSON-LD structured data (`SoftwareApplication`).
- Native XML sitemap (`sitemap.xml`) and search engine crawler instructions (`robots.txt`).

---

## 🐾 Conservation AI (BioEarth) Specification

Conservation AI provides specialized environmental, wildlife, and ecological intelligence:

### 1. IUCN Red List Taxonomy
Categorizes species based on official IUCN threat levels:
| Category | Code | Meaning | Example |
| :--- | :--- | :--- | :--- |
| **Extinct** | `EX` | No reasonable doubt the last individual has died | Dodo (*Raphus cucullatus*) |
| **Critically Endangered** | `CR` | Extremely high risk of immediate extinction | Vaquita (*Phocoena sinus*) |
| **Endangered** | `EN` | Very high risk of extinction in the wild | Mountain Gorilla (*Gorilla beringei beringei*) |
| **Vulnerable** | `VU` | High risk of endangerment in the wild | Snow Leopard (*Panthera uncia*) |
| **Near Threatened** | `NT` | Close to qualifying for a threatened category | Jaguar (*Panthera onca*) |
| **Least Concern** | `LC` | Widespread, abundant, healthy population | Grey Wolf (*Canis lupus*) |

### 2. Ecological Formulas
The engine includes mathematical calculators for ecological fieldwork:
- **Species Richness ($S$)**: Total count of unique species in a sampled ecosystem.
- **Shannon-Wiener Diversity Index ($H'$)**:
  $$H' = -\sum_{i=1}^{S} p_i \ln p_i$$
  *(where $p_i = \frac{n_i}{N}$ is the proportion of total individuals belonging to species $i$)*
- **Evenness ($J'$)**:
  $$J' = \frac{H'}{\ln S}$$

---

## 🚀 Running Your Own Instance

### 1. Start the Server
```bash
cd conservation-ai
node server.js
```
Open your browser to `http://localhost:3000`.

### 2. Query Directly via CLI
```bash
node ask.js "What is the endangered status of snow leopards?"
```

### 3. Launch an Interactive Canvas Tool
Ask the AI:
- *"Launch the Shannon-Wiener Biodiversity Index Calculator"*
- *"Show me the IUCN Red List Global Threat Spectrum Explorer"*

The interactive simulation will automatically execute in the side-by-side Canvas workspace!
