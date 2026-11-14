export const IUCN_CATEGORIES = {
  EX: { code: 'EX', label: 'Extinct', color: '#000000', desc: 'No known individuals remaining.' },
  EW: { code: 'EW', label: 'Extinct in the Wild', color: '#551a8b', desc: 'Survives only in captivity or cultivation.' },
  CR: { code: 'CR', label: 'Critically Endangered', color: '#d9534f', desc: 'Extremely high risk of extinction in the wild.' },
  EN: { code: 'EN', label: 'Endangered', color: '#f0ad4e', desc: 'Very high risk of extinction in the wild.' },
  VU: { code: 'VU', label: 'Vulnerable', color: '#f7d154', desc: 'High risk of endangerment in the wild.' },
  NT: { code: 'NT', label: 'Near Threatened', color: '#5bc0de', desc: 'Close to qualifying for a threatened category.' },
  LC: { code: 'LC', label: 'Least Concern', color: '#5cb85c', desc: 'Widespread and abundant.' },
  DD: { code: 'DD', label: 'Data Deficient', color: '#888888', desc: 'Inadequate information to make a direct assessment.' },
};

export const ICONIC_SPECIES_DB = {
  'snow leopard': {
    binomial: 'Panthera uncia',
    status: 'VU',
    population: '3,500 – 6,500 mature individuals',
    trend: 'Decreasing',
    threats: 'Poaching (pelts & bones), retaliatory killing by herders, habitat fragmentation in alpine high-Asia.',
    habitat: 'Central & South Asian mountains (Himalayas, Altai, Tian Shan across 12 countries).',
    action: 'Anti-poaching patrols, community livestock insurance, transboundary protected corridors.'
  },
  'amur leopard': {
    binomial: 'Panthera pardus orientalis',
    status: 'CR',
    population: '~120 individuals in wild',
    trend: 'Increasing slightly from <35 due to strict preserves',
    threats: 'Extremely small gene pool, forest fires, logging, prey depletion (roe & sika deer).',
    habitat: 'Russian Far East and adjacent northeast China (Land of the Leopard National Park).',
    action: 'Preserve expansion, anti-poaching camera surveillance, reintroduction planning.'
  },
  'vaquita': {
    binomial: 'Phocoena sinus',
    status: 'CR',
    population: '~10 – 13 individuals',
    trend: 'Critically decreasing',
    threats: 'Bycatch in illegal gillnets set for totoaba fish (swimming bladder trade).',
    habitat: 'Northern Gulf of California, Mexico.',
    action: 'Zero-tolerance gillnet ban enforcement, acoustic array monitoring, alternative acoustic fishing gear.'
  },
  'mountain gorilla': {
    binomial: 'Gorilla beringei beringei',
    status: 'EN',
    population: '~1,060 individuals',
    trend: 'Increasing due to intensive conservation efforts',
    threats: 'Habitat encroachment, civil unrest, snares intended for other animals, disease transmission.',
    habitat: 'Virunga volcanic mountains (Rwanda, Uganda, DRC) and Bwindi Impenetrable Forest.',
    action: 'Ranger protection, eco-tourism revenue-sharing with local communities, veterinary field interventions.'
  },
  'javan rhino': {
    binomial: 'Rhinoceros sondaicus',
    status: 'CR',
    population: '~76 individuals',
    trend: 'Stable but extremely vulnerable to single catastrophic events',
    threats: 'Tsunamis, volcanic eruption of Krakatoa, disease, invasive Arenga palm choking forage.',
    habitat: 'Ujung Kulon National Park, Java, Indonesia.',
    action: 'Habitat management (Arenga palm control), establishing a second viable insurance population.'
  },
  'pangolin': {
    binomial: 'Manis spp. (8 species)',
    status: 'CR / EN',
    population: 'Severely depleted globally (most trafficked mammal)',
    trend: 'Steeply decreasing',
    threats: 'Massive illicit trade for scales (traditional medicines) and meat luxury markets.',
    habitat: 'Tropical and subtropical Africa and Asia.',
    action: 'CITES Appendix I trade bans, AI automated border luggage scanners, rescue & rehabilitation centers.'
  }
};

export function isConservationQuery(text = '') {
  return /(?:conservation|endangered|iucn|wildlife|biodiversity|habitat|extinction|poaching|deforestation|species|ecology|ecosystem|coral\s+reef|rainforest|carbon\s+footprint|camera\s+trap|rewilding|climate\s+change|trophic\s+cascade|shannon|biomass|snow\s+leopard|leopard|rhino|gorilla|vaquita|tiger|pangolin|elephant|whale|forest\s+cover)/i.test(text);
}

export function generateConservationCanvas(toolType = 'iucn') {
  if (toolType === 'biodiversity') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verdant 1 - Biodiversity Index Calculator</title>
  <style>
    :root {
      --bg: #171717;
      --card: #212121;
      --accent: #10b981;
      --accent-glow: rgba(16, 185, 129, 0.25);
      --text: #ececec;
      --text-muted: #8e8e8e;
      --border: #383838;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 24px; min-height: 100vh; }
    h1 { font-size: 20px; color: var(--accent); margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    p.sub { color: var(--text-muted); font-size: 13px; margin-bottom: 20px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 18px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid var(--border); font-size: 13px; }
    th { color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    input[type="number"], input[type="text"] {
      background: #111; border: 1px solid var(--border); color: var(--text); padding: 6px 10px; border-radius: 6px; width: 100%; outline: none;
    }
    input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }
    .btn {
      background: var(--accent); color: #042f1f; font-weight: 600; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: all 0.2s;
    }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px var(--accent-glow); }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 16px; }
    .metric-box { background: #171717; border: 1px solid var(--border); border-radius: 8px; padding: 14px; text-align: center; }
    .metric-val { font-size: 24px; font-weight: 700; color: var(--accent); margin-top: 4px; }
    .metric-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; }
  </style>
</head>
<body>
  <h1><span>🌿</span> Shannon-Wiener Biodiversity Index Calculator</h1>
  <p class="sub">Computes Species Richness (S), Shannon Entropy (H'), and Evenness (J') for ecological community samples.</p>

  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <strong style="font-size: 14px;">Species Abundance Matrix</strong>
      <button class="btn" onclick="addSpecies()">+ Add Species</button>
    </div>
    <table id="speciesTable">
      <thead>
        <tr>
          <th>Species Name</th>
          <th style="width: 140px;">Count (n)</th>
          <th style="width: 80px;">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><input type="text" value="Snow Leopard (Panthera uncia)"></td>
          <td><input type="number" value="14" oninput="calculate()"></td>
          <td><button class="btn" style="background:#ef4444;color:#fff;padding:4px 8px;" onclick="removeRow(this)">✕</button></td>
        </tr>
        <tr>
          <td><input type="text" value="Himalayan Blue Sheep (Pseudois nayaur)"></td>
          <td><input type="number" value="120" oninput="calculate()"></td>
          <td><button class="btn" style="background:#ef4444;color:#fff;padding:4px 8px;" onclick="removeRow(this)">✕</button></td>
        </tr>
        <tr>
          <td><input type="text" value="Ibex (Capra sibirica)"></td>
          <td><input type="number" value="85" oninput="calculate()"></td>
          <td><button class="btn" style="background:#ef4444;color:#fff;padding:4px 8px;" onclick="removeRow(this)">✕</button></td>
        </tr>
      </tbody>
    </table>

    <div class="metrics-grid">
      <div class="metric-box">
        <div class="metric-label">Species Richness (S)</div>
        <div class="metric-val" id="richnessVal">3</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Shannon Index (H')</div>
        <div class="metric-val" id="shannonVal">0.89</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Evenness (J')</div>
        <div class="metric-val" id="evennessVal">0.81</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Total Organisms (N)</div>
        <div class="metric-val" id="totalVal">219</div>
      </div>
    </div>
  </div>

  <script>
    function addSpecies() {
      const tbody = document.querySelector('#speciesTable tbody');
      const tr = document.createElement('tr');
      tr.innerHTML = '<td><input type="text" placeholder="Species name..."></td><td><input type="number" value="10" oninput="calculate()"></td><td><button class="btn" style="background:#ef4444;color:#fff;padding:4px 8px;" onclick="removeRow(this)">✕</button></td>';
      tbody.appendChild(tr);
      calculate();
    }
    function removeRow(btn) {
      btn.closest('tr').remove();
      calculate();
    }
    function calculate() {
      const rows = document.querySelectorAll('#speciesTable tbody tr');
      let counts = [];
      rows.forEach(r => {
        const val = parseInt(r.querySelectorAll('input')[1].value, 10);
        if (!isNaN(val) && val > 0) counts.push(val);
      });
      const N = counts.reduce((a, b) => a + b, 0);
      const S = counts.length;
      if (N === 0 || S === 0) return;
      let H = 0;
      counts.forEach(c => {
        const pi = c / N;
        H -= pi * Math.log(pi);
      });
      const J = S > 1 ? (H / Math.log(S)) : 1;
      document.getElementById('richnessVal').textContent = S;
      document.getElementById('shannonVal').textContent = H.toFixed(3);
      document.getElementById('evennessVal').textContent = J.toFixed(3);
      document.getElementById('totalVal').textContent = N;
    }
    calculate();
  </script>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verdant 1 - IUCN Threat Spectrum</title>
  <style>
    :root {
      --bg: #171717;
      --card: #212121;
      --accent: #10b981;
      --text: #ececec;
      --text-muted: #8e8e8e;
      --border: #383838;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 24px; min-height: 100vh; }
    h1 { font-size: 20px; color: var(--accent); margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    p.sub { color: var(--text-muted); font-size: 13px; margin-bottom: 20px; }
    .spectrum-bar { display: flex; height: 36px; border-radius: 8px; overflow: hidden; margin-bottom: 20px; border: 1px solid var(--border); }
    .cat-btn { flex: 1; border: none; font-weight: 700; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: opacity 0.2s; }
    .cat-btn:hover { opacity: 0.85; filter: brightness(1.2); }
    .detail-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 700; font-size: 13px; color: #fff; margin-bottom: 12px; }
    .species-list { margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
    .species-pill { background: #111; border: 1px solid var(--border); border-radius: 6px; padding: 10px; font-size: 12px; }
    .species-pill strong { color: var(--accent); display: block; margin-bottom: 2px; }
  </style>
</head>
<body>
  <h1><span>🐾</span> IUCN Red List Global Threat Spectrum</h1>
  <p class="sub">Click any classification to inspect criteria and representative fauna.</p>

  <div class="spectrum-bar">
    <button class="cat-btn" style="background:#5cb85c;" onclick="showCategory('LC')">LC</button>
    <button class="cat-btn" style="background:#5bc0de;" onclick="showCategory('NT')">NT</button>
    <button class="cat-btn" style="background:#f7d154;color:#000;" onclick="showCategory('VU')">VU</button>
    <button class="cat-btn" style="background:#f0ad4e;" onclick="showCategory('EN')">EN</button>
    <button class="cat-btn" style="background:#d9534f;" onclick="showCategory('CR')">CR</button>
    <button class="cat-btn" style="background:#551a8b;" onclick="showCategory('EW')">EW</button>
    <button class="cat-btn" style="background:#111111;" onclick="showCategory('EX')">EX</button>
  </div>

  <div class="detail-card" id="detailCard">
    <div class="badge" id="catBadge" style="background:#f7d154;color:#000;">VU - Vulnerable</div>
    <h2 id="catTitle" style="font-size:16px;margin-bottom:8px;">High Risk of Endangerment in the Wild</h2>
    <p id="catDesc" style="font-size:13px;color:var(--text-muted);line-height:1.5;">Species facing high risk of extinction due to population decline or habitat loss.</p>
    <h3 style="font-size:13px;margin-top:16px;color:var(--accent);">Notable Examples</h3>
    <div class="species-list" id="speciesList">
      <div class="species-pill"><strong>Snow Leopard</strong><em>Panthera uncia</em><br>Pop: 3,500 - 6,500</div>
      <div class="species-pill"><strong>Polar Bear</strong><em>Ursus maritimus</em><br>Pop: ~26,000</div>
    </div>
  </div>

  <script>
    const data = {
      LC: { badge: 'LC - Least Concern', color: '#5cb85c', textColor: '#fff', title: 'Widespread and Abundant', desc: 'Abundant across natural ranges.', examples: [{ name: 'Grey Wolf', sci: 'Canis lupus', pop: 'Stable' }] },
      NT: { badge: 'NT - Near Threatened', color: '#5bc0de', textColor: '#fff', title: 'Close to Qualifying for Threatened', desc: 'Likely to qualify if degradation continues.', examples: [{ name: 'Jaguar', sci: 'Panthera onca', pop: '~173,000' }] },
      VU: { badge: 'VU - Vulnerable', color: '#f7d154', textColor: '#000', title: 'High Risk of Extinction', desc: 'Population reduction of 30-50% over 10 years.', examples: [{ name: 'Snow Leopard', sci: 'Panthera uncia', pop: '3,500 - 6,500' }] },
      EN: { badge: 'EN - Endangered', color: '#f0ad4e', textColor: '#fff', title: 'Very High Risk of Extinction', desc: 'Population decline >= 50% or under 2,500 mature individuals.', examples: [{ name: 'Mountain Gorilla', sci: 'Gorilla beringei beringei', pop: '~1,060' }] },
      CR: { badge: 'CR - Critically Endangered', color: '#d9534f', textColor: '#fff', title: 'Extremely High Risk', desc: 'Fewer than 250 mature individuals remaining.', examples: [{ name: 'Vaquita', sci: 'Phocoena sinus', pop: '~10' }] },
      EW: { badge: 'EW - Extinct in Wild', color: '#551a8b', textColor: '#fff', title: 'Survives Only in Captivity', desc: 'Survives only in managed breeding.', examples: [{ name: 'Spix\\'s Macaw', sci: 'Cyanopsitta spixii', pop: 'Captive only' }] },
      EX: { badge: 'EX - Extinct', color: '#111', textColor: '#fff', title: 'No Remaining Individuals', desc: 'Last individual died.', examples: [{ name: 'Dodo', sci: 'Raphus cucullatus', pop: 'Extinct' }] }
    };
    function showCategory(cat) {
      const item = data[cat];
      const badge = document.getElementById('catBadge');
      badge.textContent = item.badge;
      badge.style.background = item.color;
      badge.style.color = item.textColor;
      document.getElementById('catTitle').textContent = item.title;
      document.getElementById('catDesc').textContent = item.desc;
      const list = document.getElementById('speciesList');
      list.innerHTML = item.examples.map(e => '<div class="species-pill"><strong>' + e.name + '</strong><em>' + e.sci + '</em><br>Pop: ' + e.pop + '</div>').join('');
    }
  </script>
</body>
</html>`;
}
