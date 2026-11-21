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

---

## 🛡️ The 20 Lawsuit-Proof Compliance Safeguards

Built directly into the core engine to safeguard users, builders, and organizations against legal liability, regulatory fines, and dark patterns:

| # | Safeguard | Implementation in f0undr AI | Regulatory Standard |
|---|---|---|---|
| **01** | **Privacy Policy** | Dedicated local-first GDPR/CCPA modal disclosing zero server logging & zero data sale | GDPR Art. 13, CCPA §1798.100 |
| **02** | **Terms of Service** | Clear acceptable use, AI output liability disclaimers, and user ownership terms | Uniform Commercial Code, Digital Services Act |
| **03** | **Refund Policy** | 100% Free & Open Source declaration; zero billing charges, zero subscription traps | FTC Automatic Renewal Regulations |
| **04** | **Cookie Policy** | Explicit itemization of all browser `localStorage` functional keys | ePrivacy Directive 2002/58/EC |
| **05** | **Cookie Consent Banner** | Accessible slide-up banner offering Accept, Preferences, and Decline | EDPB Guidelines 05/2020 |
| **06** | **Check Form Consents** | Input-level disclaimer reminding users to verify mission-critical outputs | EU AI Act Art. 50 (Transparency) |
| **07** | **Collect Only Needed Data** | Strict data minimization: chats and memories persist exclusively in local storage | GDPR Art. 5(1)(c) (Data Minimization) |
| **08** | **Audit Third-Party SDKs** | Full audit matrix of Tesseract.js WASM, Google Fonts, and sandboxed iframes | OWASP Software Component Transparency |
| **09** | **Remove Dark Patterns** | No deceptive urgency, easy modal cancellation via ESC, transparent buttons | FTC Enforcement Against Dark Patterns |
| **10** | **No Hidden Fees** | Transparent "100% Free & Open Source" badges throughout the UI and header | FTC Rule on Unfair or Deceptive Fees |
| **11** | **No Fake Reviews** | Authentic community feedback hub linked directly to live user discussion | FTC Guides on Testimonials & Endorsements |
| **12** | **No Unsupported Claims** | Clear AI warning: *"Kortex 1 can make mistakes; verify sensitive facts"* | FTC Act §5 (Deceptive Practices) |
| **13** | **Add Alt Text & ARIA** | Full semantic screen-reader markup (`aria-label`, `role`, `alt`) on all UI elements | ADA Title III, Section 508 |
| **14** | **Fix Color Contrast** | High-contrast palette exceeding 4.5:1 / 7:1 against Obsidian backgrounds | WCAG 2.1 Level AA & AAA |
| **15** | **Keyboard Navigation** | Accessible tab order, focus-visible rings, ESC key dismissal for all modals/HUDs | WCAG 2.1 Success Criterion 2.1.1 |
| **16** | **Business Details** | Verified team details: f0undr Team, contact@f0undrteam.site, official domain | FTC Identity Disclosure Rules |
| **17** | **Age Consent for Kids** | Clear 13+ minimum age notice and parental guidance statement | COPPA (15 U.S.C. 6501), GDPR-K |
| **18** | **Unsubscribe / Anti-Spam** | Explicit confirmation that zero unsolicited commercial marketing emails are sent | CAN-SPAM Act, CASL |
| **19** | **License Stock Images** | 100% open-source SVG vector iconography and verified open fonts | US Copyright Act, Creative Commons |
| **20** | **Data Deletion Option** | Prominent 1-click "Purge My Data" feature that wipes all local storage and cache | GDPR Art. 17 (Right to Erasure / RTBF) |

---

## 🧩 Architectural Synthesis of 9 Connected Ecosystem Repositories

| Repository | Role & Core Capability Integrated into f0undr AI |
|---|---|
| **agency-agents** | Specialized personas (`legal-guardian`, `seo-architect`, `code-reviewer`) embedded into the tone engine. |
| **appflowy** | Local-first data sovereignty; one-click Markdown (`.md`) and JSON export of conversation threads. |
| **codebase-memory-mcp** | Persistent knowledge structuring and memory recall node management. |
| **graphify** | Knowledge graph citations and entity-relationship grounded search synthesis. |
| **hallmark** | Anti-slop UI design system, WCAG AAA accessible dark contrast, typography, and visual polish. |
| **open-seo** | High-authority structured Schema.org JSON-LD (`WebApplication`, `WebSite`, `FAQPage`), sitemaps, robots.txt. |
| **public-apis** | Curated catalog of zero-key, verified public endpoints for tool execution and live data retrieval. |
| **rea** | Reverse engineering verification protocol proving zero private API leaks and full client-side privacy. |
| **voicestudio** | Voice I/O, speech synthesis, and real-time audio interaction with explicit user permissions. |

