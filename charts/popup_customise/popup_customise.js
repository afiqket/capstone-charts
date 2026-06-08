function _1(md){return(
md`# Popup customise`
)}

async function _2(FileAttachment,invalidation)
{
  const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");
  const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");

  const file = await FileAttachment("Elections.xlsx").arrayBuffer();
  const workbook = XLSX.read(file);

  const regionRows = XLSX.utils.sheet_to_json(workbook.Sheets["Regions"], { defval: null });
  const geometryRows = XLSX.utils.sheet_to_json(workbook.Sheets["Regions geometry"], { defval: null });

  const rowsByGss = new Map(regionRows.map(d => [d.gss, d]));
  const rowsByName = new Map(regionRows.map(d => [d.Name, d]));

  const features = geometryRows
    .filter(d => d.Geometry)
    .map(d => {
      const row = rowsByGss.get(d.gss) || rowsByName.get(d.Name) || {};
      return {
        type: "Feature",
        properties: {
          ...row,
          name: d.Name,
          gss: d.gss
        },
        geometry: JSON.parse(d.Geometry)
      };
    });

  const width = 900;
  const mapHeight = 500;

  let activeYear = "2019";
  let pinned = false;
  let pinnedFeature = null;
  let searchOpen = false;
  let lastTooltipX = 500;
  let lastTooltipY = 60;

  const partyColors = new Map([
    ["Con", "#0087dc"],
    ["Lab", "#e4003b"],
    ["LD", "#9b9b9b"],
    ["Grn", "#63a765"],
    ["Green", "#63a765"],
    ["Spk", "#9b9b9b"],
    ["DUP", "#8b4a58"],
    ["SF", "#9b9b9b"],
    ["Other", "#9b9b9b"],
    ["Ind", "#9b9b9b"],
    ["SNP", "#f5d800"],
    ["PC", "#9b9b9b"]
  ]);

  const legendItems = [
    ["Con", "Conservative"],
    ["Lab", "Labour"],
    ["LD", "Liberal Democrat"],
    ["Grn", "Green"],
    ["Spk", "Speaker"],
    ["DUP", "DUP"],
    ["SF", "Sinn Féin"],
    ["Other", "Other"],
    ["SNP", "SNP"],
    ["PC", "Plaid Cymru"]
  ];

  function partyCode(value) {
    const s = String(value ?? "").trim();
    const lower = s.toLowerCase();

    if (s === "Con" || lower.includes("conservative")) return "Con";
    if (s === "Lab" || lower.includes("labour")) return "Lab";
    if (s === "LD" || lower.includes("liberal democrat")) return "LD";
    if (s === "Grn" || lower.includes("green")) return "Grn";
    if (s === "Spk" || lower.includes("speaker")) return "Spk";
    if (s === "DUP" || lower.includes("democratic unionist")) return "DUP";
    if (s === "SF" || lower.includes("sinn")) return "SF";
    if (s === "SNP" || lower.includes("scottish national")) return "SNP";
    if (s === "PC" || lower.includes("plaid")) return "PC";
    if (s === "Ind" || lower.includes("independent")) return "Other";

    return "Other";
  }

  function colorFor(d) {
    const p = d.properties;
    const code = activeYear === "2019"
      ? partyCode(p.party2019 || p["Result 2019"])
      : partyCode(p.party17 || p["Result 2017"]);

    return partyColors.get(code) || "#9b9b9b";
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function isLightColor(hex) {
    const c = d3.color(hex);
    if (!c) return false;
    const luminance = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
    return luminance > 0.65;
  }

  function formatPct(value) {
    const n = +value;
    return Number.isFinite(n) ? `${n.toFixed(2)}%` : "";
  }

  function formatNumber(value) {
    const n = +value;
    return Number.isFinite(n) ? d3.format(",")(n) : "";
  }

  function candidateList(p) {
    const candidates = [];

    for (let i = 1; i <= 12; i++) {
      if (p[`name_${i}`]) {
        candidates.push({
          name: p[`name_${i}`],
          party: p[`party_name_${i}`],
          thumb: p[`thumbnail_url_${i}`]
        });
      }
    }

    if (!candidates.length) {
      return `<div class="empty-candidates">No candidate data available.</div>`;
    }

    return candidates.map(c => {
      const initials = String(c.name ?? "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(d => d[0])
        .join("")
        .toUpperCase();

      const avatar = c.thumb
        ? `<img class="candidate-photo" src="${escapeHTML(c.thumb)}" alt="">`
        : `<div class="candidate-fallback">${escapeHTML(initials)}</div>`;

      return `
        <div class="candidate">
          ${avatar}
          <div>
            <div class="candidate-name">${escapeHTML(c.name)}</div>
            <div class="candidate-party">${escapeHTML(c.party || "")}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  function resultBars2017(p) {
    const rows = [
      { code: p.first17, pct: p.FIRSTPCT },
      { code: p.second17, pct: p.SECONDPCT },
      { code: p.third17, pct: p.THIRDPCT }
    ].filter(d => d.code && d.pct != null);

    return rows.map(d => {
      const code = partyCode(d.code);
      const color = partyColors.get(code) || "#9b9b9b";
      const barWidth = Math.max(3, Math.min(150, +d.pct * 2.5));

      return `
        <div class="result-row">
          <div class="result-label">${escapeHTML(d.code)}</div>
          <div class="result-bar-bg">
            <div class="result-bar" style="width:${barWidth}px; background:${color};"></div>
          </div>
          <div class="result-pct" style="color:${color};">${formatPct(d.pct)}</div>
        </div>
      `;
    }).join("");
  }

  function tooltipHTML(d) {
    const p = d.properties;

    const yearPartyCode = activeYear === "2019"
      ? partyCode(p.party2019 || p["Result 2019"])
      : partyCode(p.party17 || p["Result 2017"]);

    const headerColor = partyColors.get(yearPartyCode) || "#0074c8";
    const headerText = isLightColor(headerColor) ? "#222" : "white";

    const winnerName = activeYear === "2019"
      ? (p.person_name || p.fullname || "")
      : (p.fullname || p.person_name || "");

    const winnerParty = activeYear === "2019"
      ? (p.party_name || p["Result 2019"] || "")
      : (p["Result 2017"] || "");

    const resultSummary = activeYear === "2019"
      ? (p["Result summary"] || "")
      : (p.result17 || "");

    const previousMp = p.fullname || "";
    const previousParty = p["Previous party"] || p["Result 2017"] || "";

    return `
      <div class="tooltip-title">${escapeHTML(p.name)}</div>

      <div class="tooltip-winner" style="background:${headerColor}; color:${headerText};">
        <div><b>${escapeHTML(winnerName)}</b>${winnerParty ? `, ${escapeHTML(winnerParty)}` : ""}</div>
        <div>${escapeHTML(resultSummary)}</div>
      </div>

      <div class="tooltip-body">
        <div class="section">
          <div class="section-title">Previous MP</div>
          <div><b>${escapeHTML(previousMp)}</b>${previousParty ? `, ${escapeHTML(previousParty)}` : ""}</div>
          ${p.REQSWING != null || p.majority != null
            ? `<div><b>${formatPct(p.REQSWING)}</b> majority, ${formatNumber(p.majority)} votes</div>`
            : ""}
        </div>

        <div class="section">
          <div class="section-title">Results in 2017 ${p.result17 ? `(${escapeHTML(p.result17)})` : ""}</div>
          ${resultBars2017(p)}
        </div>

        <div class="section">
          <div class="section-title">Candidates</div>
          ${candidateList(p)}
        </div>

        <div class="source">
          Candidate and live result data by<br>
          <a href="https://democracyclub.org.uk/" target="_blank">Democracy Club</a>.
        </div>
      </div>
    `;
  }

  const geojson = { type: "FeatureCollection", features };

  const projection = d3.geoIdentity()
    .reflectY(true)
    .fitExtent([[285, 5], [700, mapHeight - 15]], geojson);

  const path = d3.geoPath(projection);

  const container = d3.create("div")
    .attr("class", "election-chart")
    .style("width", `${width}px`);

  container.append("style").text(`
    .election-chart {
      font-family: Arial, Helvetica, sans-serif;
      color: #333;
      position: relative;
      user-select: none;
    }

    .chart-title {
      font-size: 25px;
      font-weight: 800;
      margin: 0 0 2px 0;
      letter-spacing: 0.2px;
    }

    .chart-subtitle {
      font-size: 22px;
      margin-bottom: 16px;
    }

    .button-row {
      display: flex;
      gap: 0;
      margin-bottom: 20px;
    }

    .year-button {
      border: 1px solid #ccc;
      background: #f7f7f7;
      color: #333;
      font-size: 15px;
      font-weight: 700;
      padding: 8px 11px;
      cursor: pointer;
    }

    .year-button.active {
      background: #333;
      color: white;
      border-color: #333;
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      column-gap: 8px;
      row-gap: 6px;
      font-size: 16px;
      margin-bottom: 18px;
    }

    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }

    .legend-swatch {
      width: 20px;
      height: 16px;
      display: inline-block;
    }

    .map-wrap {
      position: relative;
      width: ${width}px;
      height: ${mapHeight}px;
    }

    svg {
      display: block;
      background: white;
    }

    .region {
      cursor: pointer;
      stroke: white;
      stroke-width: 0.6;
      vector-effect: non-scaling-stroke;
    }

    .region:hover {
      stroke: #111;
      stroke-width: 1.4;
    }

    .region.selected {
      stroke: #111;
      stroke-width: 2;
    }

    .search-control {
      position: absolute;
      left: 23px;
      top: 18px;
      z-index: 20;
    }

    .search-button {
      width: 32px;
      height: 32px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      color: #333;
      display: grid;
      place-items: center;
      font-size: 17px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .search-panel {
      position: absolute;
      left: 0;
      top: 38px;
      width: 250px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 5px;
      box-shadow: 0 3px 12px rgba(0,0,0,0.18);
      padding: 8px;
    }

    .search-input {
      width: 100%;
      box-sizing: border-box;
      padding: 7px 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 13px;
      outline: none;
    }

    .search-results {
      margin-top: 6px;
      max-height: 190px;
      overflow-y: auto;
    }

    .search-result {
      display: block;
      width: 100%;
      text-align: left;
      border: 0;
      background: white;
      padding: 7px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 13px;
    }

    .search-result:hover {
      background: #f0f0f0;
    }

    .search-hint {
      color: #777;
      font-size: 13px;
      padding: 8px;
    }

    .tooltip {
      position: absolute;
      width: 355px;
      background: white;
      box-shadow: 0 3px 16px rgba(0,0,0,0.22);
      opacity: 0;
      z-index: 10;
      pointer-events: none;
      font-size: 13px;
    }

    .tooltip.pinned {
      pointer-events: auto;
    }

    .tooltip-title {
      padding: 12px 12px 0 12px;
      font-size: 16px;
      font-weight: 800;
    }

    .tooltip-winner {
      margin-top: 0;
      padding: 12px;
      line-height: 1.45;
      font-size: 14px;
      font-weight: 700;
    }

    .tooltip-body {
      max-height: 235px;
      overflow-y: auto;
      padding: 12px 12px 14px 12px;
    }

    .section {
      margin-bottom: 18px;
      line-height: 1.35;
    }

    .section-title {
      font-weight: 800;
      margin-bottom: 6px;
    }

    .result-row {
      display: grid;
      grid-template-columns: 46px 1fr 72px;
      align-items: center;
      column-gap: 8px;
      margin: 5px 0;
      font-weight: 700;
    }

    .result-bar-bg {
      height: 17px;
      position: relative;
    }

    .result-bar {
      height: 17px;
    }

    .result-pct {
      font-weight: 800;
    }

    .candidate {
      display: grid;
      grid-template-columns: 42px 1fr;
      gap: 9px;
      align-items: center;
      margin: 8px 0;
    }

    .candidate-photo,
    .candidate-fallback {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      background: #ddd;
    }

    .candidate-fallback {
      display: grid;
      place-items: center;
      font-size: 12px;
      font-weight: 800;
      color: #555;
    }

    .candidate-name {
      font-weight: 800;
      font-size: 14px;
    }

    .candidate-party {
      color: #888;
      font-size: 13px;
    }

    .empty-candidates {
      color: #888;
      font-style: italic;
    }

    .source {
      color: #999;
      font-size: 14px;
      line-height: 1.45;
      margin-top: 8px;
    }

    .source a {
      color: #7c7cff;
      text-decoration: underline;
    }
  `);

  container.append("div")
    .attr("class", "chart-title")
    .text("UK General Election 2019 results");

  container.append("div")
    .attr("class", "chart-subtitle")
    .text("The winning party in each constituency");

  const buttons = container.append("div")
    .attr("class", "button-row");

  buttons.selectAll("button")
    .data([
      { year: "2019", label: "Result 2019" },
      { year: "2017", label: "Result 2017" }
    ])
    .join("button")
    .attr("class", d => `year-button ${d.year === activeYear ? "active" : ""}`)
    .text(d => d.label)
    .on("click", (event, d) => {
      event.stopPropagation();

      activeYear = d.year;

      buttons.selectAll("button")
        .classed("active", b => b.year === activeYear);

      regions.transition()
        .duration(350)
        .attr("fill", colorFor);

      if (pinnedFeature) {
        showTooltip(pinnedFeature, lastTooltipX, lastTooltipY);
      }
    });

  const legend = container.append("div")
    .attr("class", "legend");

  legend.selectAll("div")
    .data(legendItems)
    .join("div")
    .attr("class", "legend-item")
    .html(d => `
      <span class="legend-swatch" style="background:${partyColors.get(d[0])};"></span>
      <span>${d[1]}</span>
    `);

  const mapWrap = container.append("div")
    .attr("class", "map-wrap");

  const svg = mapWrap.append("svg")
    .attr("width", width)
    .attr("height", mapHeight);

  const g = svg.append("g");

  const tooltip = mapWrap.append("div")
    .attr("class", "tooltip");

  function positionTooltip(x, y) {
    lastTooltipX = x;
    lastTooltipY = y;

    const node = tooltip.node();
    const tw = node.offsetWidth || 355;
    const th = node.offsetHeight || 320;

    let left = x + 18;
    let top = y - 18;

    if (left + tw > width - 8) left = x - tw - 18;
    if (top + th > mapHeight - 8) top = mapHeight - th - 8;
    if (top < 5) top = 5;
    if (left < 5) left = 5;

    tooltip
      .style("left", `${left}px`)
      .style("top", `${top}px`);
  }

  function pointerInMap(event) {
    const rect = mapWrap.node().getBoundingClientRect();
    return [
      event.clientX - rect.left,
      event.clientY - rect.top
    ];
  }

  function showTooltip(d, x, y) {
    tooltip
      .html(tooltipHTML(d))
      .style("opacity", 1)
      .classed("pinned", pinned);

    positionTooltip(x, y);
  }

  function hideTooltip() {
    tooltip
      .style("opacity", 0)
      .classed("pinned", false);
  }

  const regions = g.selectAll("path")
    .data(features)
    .join("path")
    .attr("class", "region")
    .attr("d", path)
    .attr("fill", colorFor)
    .on("mousemove", (event, d) => {
      if (pinned) return;

      const [x, y] = pointerInMap(event);
      showTooltip(d, x, y);
    })
    .on("mouseleave", () => {
      if (!pinned) hideTooltip();
    })
    .on("click", (event, d) => {
      event.stopPropagation();

      pinned = true;
      pinnedFeature = d;

      regions.classed("selected", r => r === d);

      const [x, y] = pointerInMap(event);
      showTooltip(d, x, y);
    });

  const searchControl = mapWrap.append("div")
    .attr("class", "search-control")
    .on("click", event => event.stopPropagation());

  const searchButton = searchControl.append("button")
    .attr("type", "button")
    .attr("class", "search-button")
    .attr("aria-label", "Search constituency")
    .html("&#128269;");

  const searchPanel = searchControl.append("div")
    .attr("class", "search-panel")
    .style("display", "none");

  const searchInput = searchPanel.append("input")
    .attr("class", "search-input")
    .attr("placeholder", "Search constituency...")
    .attr("type", "text");

  const searchResults = searchPanel.append("div")
    .attr("class", "search-results");

  const searchableFeatures = features
    .map(d => ({
      feature: d,
      name: String(d.properties.name ?? "")
    }))
    .filter(d => d.name.trim())
    .sort((a, b) => d3.ascending(a.name, b.name));

  function openSearch() {
    searchOpen = true;
    searchPanel.style("display", "block");
    searchInput.node().focus();
    updateSearchResults();
  }

  function closeSearch() {
    searchOpen = false;
    searchPanel.style("display", "none");
  }

  function selectFeatureFromSearch(d) {
    pinned = true;
    pinnedFeature = d;

    regions.classed("selected", r => r === d);

    const [[x0, y0], [x1, y1]] = path.bounds(d);
    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;

    showTooltip(d, x, y);
    closeSearch();
  }

  function updateSearchResults() {
    const q = searchInput.node().value.trim().toLowerCase();
    searchResults.html("");

    if (!q) {
      searchResults.html(`<div class="search-hint">Type a constituency name.</div>`);
      return;
    }

    const matches = searchableFeatures
      .filter(d => d.name.toLowerCase().includes(q))
      .slice(0, 8);

    if (!matches.length) {
      searchResults.html(`<div class="search-hint">No results found.</div>`);
      return;
    }

    searchResults.selectAll(".search-result")
      .data(matches, d => d.name)
      .join("button")
      .attr("type", "button")
      .attr("class", "search-result")
      .text(d => d.name)
      .on("click", (event, d) => {
        event.stopPropagation();
        selectFeatureFromSearch(d.feature);
      });
  }

  searchButton.on("click", event => {
    event.stopPropagation();
    searchOpen ? closeSearch() : openSearch();
  });

  searchInput
    .on("input", updateSearchResults)
    .on("keydown", event => {
      if (event.key === "Enter") {
        const q = searchInput.node().value.trim().toLowerCase();
        const first = searchableFeatures.find(d => d.name.toLowerCase().includes(q));
        if (first) selectFeatureFromSearch(first.feature);
      }

      if (event.key === "Escape") {
        closeSearch();
      }
    });

  d3.select(window).on("click.election2019", event => {
    if (searchOpen && !searchControl.node().contains(event.target)) {
      closeSearch();
    }

    if (!pinned) return;
    if (tooltip.node().contains(event.target)) return;
    if (searchControl.node().contains(event.target)) return;

    pinned = false;
    pinnedFeature = null;

    regions.classed("selected", false);
    hideTooltip();
  });

  invalidation.then(() => {
    d3.select(window).on("click.election2019", null);
  });

  return container.node();
}


function _3(md){return(
md`Original by joseph (@josephw) on [Flourish](https://flourish.studio/examples/?q=Popup+customise)`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Elections.xlsx", {url: new URL("./files/ee012022bf9b15e0b8b1699f5fd431ca9b75e4bec4056086e84ec8bec7ee6ae198121fcfd210cb94de937c2410827a160568fd5b3c3ecc31d51838d44f3751f4.xlsx", import.meta.url), mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","invalidation"], _2);
  main.variable(observer()).define(["md"], _3);
  return main;
}
