function _1(md){return(
md`# Premier League Managers`
)}

async function _2(FileAttachment,d3)
{
  const linksRaw = await FileAttachment("links.csv").csv();
  const pointsRaw = await FileAttachment("points.csv").csv();

  // --------------------------------------------------
  // 1) CLEAN DATA
  // --------------------------------------------------
  const points = pointsRaw.map(d => ({
    id: d.Club?.trim(),
    name: d.Club?.trim(),
    group: d.Group?.trim(),
    value: +d["Number of managers"] || 1,
    logo: d["Club logo"]?.trim() || null
  })).filter(d => d.id);

  const links = linksRaw.map(d => ({
    source: d.Name?.trim(),
    target: d.Club?.trim()
  })).filter(d => d.source && d.target);

  const nodeMap = new Map(points.map(d => [d.id, {...d}]));

  for (const l of links) {
    if (!nodeMap.has(l.source)) {
      nodeMap.set(l.source, {
        id: l.source,
        name: l.source,
        group: "Manager",
        value: 1,
        logo: null
      });
    }
    if (!nodeMap.has(l.target)) {
      nodeMap.set(l.target, {
        id: l.target,
        name: l.target,
        group: "Club",
        value: 1,
        logo: null
      });
    }
  }

  const nodes = Array.from(nodeMap.values());

  const clubSet = new Set(nodes.filter(d => d.group === "Club").map(d => d.id));

  const degree = new Map(nodes.map(d => [d.id, 0]));
  for (const l of links) {
    degree.set(l.source, (degree.get(l.source) || 0) + 1);
    degree.set(l.target, (degree.get(l.target) || 0) + 1);
  }
  nodes.forEach(d => d.degree = degree.get(d.id) || 0);

  const neighbors = new Map(nodes.map(d => [d.id, new Set()]));
  const linkMap = new Map(); // source|target -> link info

  for (const l of links) {
    neighbors.get(l.source).add(l.target);
    neighbors.get(l.target).add(l.source);

    const managerNode = nodeMap.get(l.source);
    const clubNode = nodeMap.get(l.target);
    linkMap.set(`${l.source}|||${l.target}`, {
      source: l.source,
      target: l.target,
      managerGroup: managerNode?.group || "Manager",
      clubGroup: clubNode?.group || "Club"
    });
  }

  // --------------------------------------------------
  // 2) SIZE + STYLE
  // --------------------------------------------------
  const width = 1800;
  const height = 700;
  const background = "#efefef";

  const managerColor = "#0b8798";
  const currentColor = "#ff2a2a";
  const linkColor = "#9b9b9b";

  function radius(d) {
    if (d.group === "Club") return 8 + Math.sqrt(d.value || 1) * 5;
    if (d.group === "Current Manager") return 5 + Math.sqrt(d.degree || 1) * 1.5;
    return 4 + Math.sqrt(d.degree || 1) * 1.2;
  }

  // --------------------------------------------------
  // 3) SVG
  // --------------------------------------------------
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto")
    .style("display", "block")
    .style("background", background)
    .style("font-family", "Inter, Arial, sans-serif");

  svg.append("text")
    .attr("x", 10)
    .attr("y", 55)
    .attr("font-size", 38)
    .attr("font-weight", 800)
    .attr("fill", "#333")
    .text("Premier league managers and clubs");

  // --------------------------------------------------
  // 4) LEGEND
  // --------------------------------------------------
  const state = {
    showManagers: false,
    showCurrent: false,
    hovered: null
  };

  const legend = svg.append("g")
    .attr("transform", "translate(10, 90)");

  function drawLegendItem(g, x, color, label, key) {
    const item = g.append("g")
      .attr("transform", `translate(${x},0)`)
      .style("cursor", "pointer")
      .on("click", () => {
        state[key] = !state[key];
        updateLegend();
        updateVisibility();
      });

    item.append("circle")
      .attr("class", `legend-dot-${key}`)
      .attr("r", 14)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("fill", color);

    item.append("text")
      .attr("class", `legend-text-${key}`)
      .attr("x", 20)
      .attr("y", 10)
      .attr("font-size", 24)
      .text(label);

    return item;
  }

  drawLegendItem(legend, 0, currentColor, "Current Manager", "showCurrent");
  drawLegendItem(legend, 240, managerColor, "Manager", "showManagers");

  function updateLegend() {
    svg.select(".legend-dot-showCurrent")
      .attr("fill", state.showCurrent ? currentColor : "#f2bcbc");
    svg.select(".legend-text-showCurrent")
      .attr("fill", state.showCurrent ? "#222" : "#c6c6c6")
      .attr("font-weight", state.showCurrent ? 700 : 500);

    svg.select(".legend-dot-showManagers")
      .attr("fill", state.showManagers ? managerColor : "#c8dde0");
    svg.select(".legend-text-showManagers")
      .attr("fill", state.showManagers ? "#222" : "#c6c6c6")
      .attr("font-weight", state.showManagers ? 700 : 500);
  }
  updateLegend();

  // --------------------------------------------------
  // 5) DEFS FOR CLUB LOGOS
  // --------------------------------------------------
  const defs = svg.append("defs");

  for (const d of nodes.filter(d => d.group === "Club" && d.logo)) {
    const safeId = d.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    d.patternId = `logo-${safeId}`;

    const p = defs.append("pattern")
      .attr("id", d.patternId)
      .attr("patternUnits", "objectBoundingBox")
      .attr("width", 1)
      .attr("height", 1);

    p.append("image")
      .attr("href", d.logo)
      .attr("width", 1)
      .attr("height", 1)
      .attr("preserveAspectRatio", "xMidYMid slice");
  }

  // --------------------------------------------------
  // 6) FORCE SIMULATION
  // --------------------------------------------------
  const clubNodes = nodes.filter(d => d.group === "Club");
  const xClub = d3.scalePoint()
    .domain(clubNodes.map(d => d.id).sort(d3.ascending))
    .range([100, width - 100]);

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links)
      .id(d => d.id)
      .distance(65)
      .strength(0.45))
    .force("charge", d3.forceManyBody()
      .strength(d => d.group === "Club" ? -220 : -45))
    .force("collision", d3.forceCollide()
      .radius(d => radius(d) + 5)
      .strength(0.95))
    .force("x", d3.forceX(d => {
      if (d.group === "Club") return xClub(d.id) || width / 2;
      const clubNeighbors = [...(neighbors.get(d.id) || [])].filter(n => clubSet.has(n));
      if (clubNeighbors.length) {
        return d3.mean(clubNeighbors.map(c => xClub(c) || width / 2));
      }
      return width / 2;
    }).strength(d => d.group === "Club" ? 0.9 : 0.22))
    .force("y", d3.forceY(d => {
      if (d.group === "Club") return height * 0.58;
      if (d.group === "Current Manager") return height * 0.43;
      return height * 0.52;
    }).strength(d => d.group === "Club" ? 0.4 : 0.08))
    .stop();

  for (let i = 0; i < 350; i++) simulation.tick();

  // --------------------------------------------------
  // 7) DRAW LINKS
  // --------------------------------------------------
  const link = svg.append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke", linkColor)
    .attr("stroke-opacity", 0.55)
    .attr("stroke-width", 1);

  // --------------------------------------------------
  // 8) DRAW NODES
  // --------------------------------------------------
  const node = svg.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", d => `node ${d.group.replace(/\s+/g, "-")}`)
    .style("cursor", "pointer");

  node.filter(d => d.group === "Club")
    .append("circle")
    .attr("r", d => radius(d))
    .attr("fill", d => d.patternId ? `url(#${d.patternId})` : "#fff")
    .attr("stroke", "#888")
    .attr("stroke-width", 0.6);

  node.filter(d => d.group === "Manager")
    .append("circle")
    .attr("r", d => radius(d))
    .attr("fill", managerColor);

  node.filter(d => d.group === "Current Manager")
    .append("circle")
    .attr("r", d => radius(d))
    .attr("fill", currentColor);

  node.filter(d => d.group === "Current Manager")
    .append("circle")
    .attr("r", d => radius(d))
    .attr("fill", "none")
    .attr("stroke", "rgba(0,0,0,0.15)")
    .attr("stroke-width", 0.8);

  node.append("circle")
    .attr("class", "hover-hit")
    .attr("r", d => Math.max(radius(d) + 10, 16))
    .attr("fill", "transparent");

  // --------------------------------------------------
  // 9) LABELS
  // --------------------------------------------------
  const labels = svg.append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("font-size", d => d.group === "Club" ? 16 : 14)
    .attr("font-weight", d => d.group === "Club" ? 500 : 400)
    .attr("fill", d => {
      if (d.group === "Manager") return managerColor;
      if (d.group === "Current Manager") return currentColor;
      return "#222";
    })
    .attr("text-anchor", "middle")
    .style("user-select", "none")
    .style("cursor", "pointer")
    .text(d => d.name);

  // --------------------------------------------------
  // 10) POSITION
  // --------------------------------------------------
  function position() {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node.attr("transform", d => `translate(${d.x},${d.y})`);

    labels
      .attr("x", d => d.x)
      .attr("y", d => d.group === "Club" ? d.y + radius(d) + 20 : d.y - radius(d) - 10);
  }
  position();

  // --------------------------------------------------
  // 11) HELPERS
  // --------------------------------------------------
  function categoryVisible(d) {
    if (d.group === "Club") return true;
    if (d.group === "Manager") return state.showManagers;
    if (d.group === "Current Manager") return state.showCurrent;
    return false;
  }

  function activeManagerGroups() {
    const arr = [];
    if (state.showManagers) arr.push("Manager");
    if (state.showCurrent) arr.push("Current Manager");
    return arr;
  }

  function connectedSetFiltered(d) {
    const set = new Set([d.id]);

    // no active legend => no extra hover expansion
    const activeGroups = activeManagerGroups();
    if (activeGroups.length === 0) return set;

    if (d.group === "Club") {
      for (const nb of neighbors.get(d.id) || []) {
        const nbNode = nodeMap.get(nb);
        if (nbNode && activeGroups.includes(nbNode.group)) {
          set.add(nb);
        }
      }
      return set;
    }

    if (d.group === "Manager" || d.group === "Current Manager") {
      if (!activeGroups.includes(d.group)) return set;

      for (const nb of neighbors.get(d.id) || []) {
        const nbNode = nodeMap.get(nb);
        if (nbNode && nbNode.group === "Club") {
          set.add(nb);
        }
      }
      return set;
    }

    return set;
  }

  function shouldHighlightLink(l, hovered) {
    if (!hovered) return false;

    const activeGroups = activeManagerGroups();
    if (activeGroups.length === 0) return false;

    const s = l.source.id;
    const t = l.target.id;
    const sNode = nodeMap.get(s);
    const tNode = nodeMap.get(t);

    if (hovered.group === "Club") {
      const managerNode = sNode.group === "Club" ? tNode : sNode;
      const clubNode = sNode.group === "Club" ? sNode : tNode;
      return clubNode.id === hovered.id && activeGroups.includes(managerNode.group);
    }

    if (hovered.group === "Manager" || hovered.group === "Current Manager") {
      if (!activeGroups.includes(hovered.group)) return false;
      return s === hovered.id || t === hovered.id;
    }

    return false;
  }

  function setHovered(d) {
    state.hovered = d;
    updateVisibility();
  }

  function clearHovered() {
    state.hovered = null;
    updateVisibility();
  }

  node
    .on("mouseenter", (event, d) => setHovered(d))
    .on("mouseleave", clearHovered);

  labels
    .on("mouseenter", (event, d) => setHovered(d))
    .on("mouseleave", clearHovered);

  // --------------------------------------------------
  // 12) UPDATE
  // --------------------------------------------------
  function updateVisibility() {
    const hovered = state.hovered;

    if (!hovered) {
      node
        .style("display", d => {
          if (d.group === "Club") return null;
          return categoryVisible(d) ? null : "none";
        })
        .style("opacity", 1);

      link
        .style("display", d => {
          const sVisible = categoryVisible(d.source);
          const tVisible = categoryVisible(d.target);
          return (sVisible && tVisible) ? null : "none";
        })
        .attr("stroke", linkColor)
        .attr("stroke-width", 1)
        .style("opacity", 0.55);

      labels
        .style("display", d => d.group === "Club" ? null : "none")
        .style("opacity", d => d.group === "Club" ? 1 : 0)
        .attr("font-size", d => d.group === "Club" ? 16 : 14)
        .attr("font-weight", 500);

      return;
    }

    const cset = connectedSetFiltered(hovered);

    node
      .style("display", d => {
        if (d.group === "Club") return null;
        if (categoryVisible(d)) return null;
        if (cset.has(d.id)) return null;
        return "none";
      })
      .style("opacity", d => cset.has(d.id) ? 1 : 0.12);

    labels
      .style("display", d => cset.has(d.id) ? null : "none")
      .style("opacity", d => cset.has(d.id) ? 1 : 0)
      .attr("font-size", d => {
        if (d.id === hovered.id) return d.group === "Club" ? 22 : 18;
        return d.group === "Club" ? 17 : 15;
      })
      .attr("font-weight", d => d.id === hovered.id ? 700 : 500);

    link
      .style("display", d => {
        const sVisible = categoryVisible(d.source);
        const tVisible = categoryVisible(d.target);
        if (shouldHighlightLink(d, hovered)) return null;
        return (sVisible && tVisible) ? null : "none";
      })
      .attr("stroke", d => shouldHighlightLink(d, hovered) ? managerColor : linkColor)
      .attr("stroke-width", d => shouldHighlightLink(d, hovered) ? 1.8 : 1)
      .style("opacity", d => shouldHighlightLink(d, hovered) ? 1 : 0.08);
  }

  updateVisibility();

  return svg.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["points.csv", {url: new URL("./files/5891584cae7a9fcc659cf8dbea8828ccbe7a55286f2142971c6890b71810667ccac5e7c58c1e309fc44e044c3a7f306e2a48fbb007ec31c6b2cb4e0316921b7d.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["links.csv", {url: new URL("./files/ffa2463df81101a4f64d17bca9d6c40a8406193c1ae7b8f1c3f368371e017ec3562522855d9853227274700e0a18054e3d7207b32db77b10147ac042f810fb74.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","d3"], _2);
  return main;
}
