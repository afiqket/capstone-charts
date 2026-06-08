function _1(md){return(
md`# Earthquake spikes`
)}

async function _2(FileAttachment,width)
{
  const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");
  const topojson = await import("https://cdn.jsdelivr.net/npm/topojson-client@3/+esm");
  const XLSXModule = await import("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm");
  const XLSX = XLSXModule.default ?? XLSXModule;

  const buffer = await FileAttachment("Earthquake.xlsx").arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  function getSheet(name) {
    const exact = workbook.Sheets[name];
    if (exact) return exact;

    const found = workbook.SheetNames.find(
      d => d.trim().toLowerCase() === name.trim().toLowerCase()
    );

    return found ? workbook.Sheets[found] : null;
  }

  function readSheet(name) {
    const sheet = getSheet(name);
    return sheet
      ? XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true })
      : [];
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const points = readSheet("Points");

  const earthquakes = points
    .map(d => ({
      year: d.Year,
      timestamp: d.Timestamp,
      location: d["Location Name"],
      lat: +d.Latitude,
      lon: +d.Longitude,
      depth: +d["Focal Depth (km)"],
      mag: +d.Mag,
      magBin: d["Mag-bin"],
      category: d["Mag-category"] || "No data",
      deaths: d.Deaths
    }))
    .filter(d =>
      Number.isFinite(d.lat) &&
      Number.isFinite(d.lon) &&
      Number.isFinite(d.mag)
    );

  const world = await d3.json(
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
  );

  const countries = topojson.feature(
    world,
    world.objects.countries
  ).features;

  const W = Math.min(width, 980);
  const mapH = 430;
  const dpr = window.devicePixelRatio || 1;

  const colors = new Map([
    ["Great", "#5d1477"],
    ["Major", "#51438c"],
    ["Strong", "#31456f"],
    ["Moderate", "#2e738d"],
    ["Light", "#2e9085"],
    ["Minor", "#77bc61"],
    ["Micro", "#d4df35"],
    ["No data", "#bfbfbf"]
  ]);

  const color = d => colors.get(d.category) ?? colors.get("No data");

  const container = d3.create("div")
    .style("position", "relative")
    .style("width", `${W}px`)
    .style("font-family", "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif");

  container.append("div")
    .style("text-align", "center")
    .style("font-size", "32px")
    .style("font-weight", 800)
    .style("line-height", 1.15)
    .style("margin-top", "8px")
    .text("When the Earth Shakes");

  container.append("div")
    .style("text-align", "center")
    .style("font-size", "21px")
    .style("margin-top", "6px")
    .style("margin-bottom", "14px")
    .text("Hover over a dot to explore more. Use the search bar to find a specific event.");

  const magExtent = d3.extent(earthquakes, d => d.mag);

  const signalHeight = d3.scaleLinear()
    .domain([0.75, magExtent[1]])
    .range([5, 52])
    .clamp(true);

  const signalRadius = d3.scaleSqrt()
    .domain([0.75, magExtent[1]])
    .range([1.5, 4.8])
    .clamp(true);

  const magLegend = container.append("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("align-items", "center")
    .style("gap", "10px")
    .style("margin-bottom", "4px");

  magLegend.append("div")
    .style("font-size", "16px")
    .style("font-weight", 700)
    .style("margin-right", "8px")
    .text("Magnitude");

  magLegend.append("span")
    .style("font-size", "15px")
    .style("color", "#333")
    .text("0.75");

  const magLegendSvg = magLegend.append("svg")
    .attr("width", 90)
    .attr("height", 44)
    .style("overflow", "visible");

  const legendMagValues = [0.75, 5];

  const legendHeight = d3.scaleLinear()
    .domain([0.75, 5])
    .range([8, 30]);

  const legendRadius = d3.scaleSqrt()
    .domain([0.75, 5])
    .range([2.5, 6]);

  const legendPin = magLegendSvg.selectAll("g")
    .data(legendMagValues)
    .join("g")
    .attr("transform", (d, i) => `translate(${i === 0 ? 25 : 65}, 34)`);

  legendPin.append("line")
    .attr("y1", 0)
    .attr("y2", d => -legendHeight(d))
    .attr("stroke", "#8c8c8c")
    .attr("stroke-width", 2)
    .attr("stroke-linecap", "round")
    .attr("opacity", 0.85);

  legendPin.append("circle")
    .attr("r", d => legendRadius(d))
    .attr("fill", "#8c8c8c")
    .attr("opacity", 0.85);

  magLegend.append("span")
    .style("font-size", "15px")
    .style("color", "#333")
    .text("5");

  const categoryLegend = container.append("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("align-items", "center")
    .style("flex-wrap", "wrap")
    .style("column-gap", "18px")
    .style("row-gap", "8px")
    .style("margin-bottom", "8px");

  const categoryItems = [
    "Great",
    "Major",
    "Strong",
    "Moderate",
    "Light",
    "Minor",
    "Micro",
    "No data"
  ];

  const categoryItem = categoryLegend.selectAll("div")
    .data(categoryItems)
    .join("div")
    .style("display", "inline-flex")
    .style("align-items", "center")
    .style("gap", "6px")
    .style("font-size", "18px")
    .style("color", "#2b2b2b")
    .style("white-space", "nowrap");

  categoryItem.append("span")
    .style("width", "14px")
    .style("height", "14px")
    .style("border-radius", "50%")
    .style("background", d => colors.get(d))
    .style("display", "inline-block");

  categoryItem.append("span")
    .text(d => d);

  const mapWrap = container.append("div")
    .style("position", "relative")
    .style("width", `${W}px`)
    .style("height", `${mapH}px`);

  const svg = mapWrap.append("svg")
    .attr("viewBox", [0, 0, W, mapH])
    .attr("width", W)
    .attr("height", mapH)
    .style("position", "absolute")
    .style("left", "0px")
    .style("top", "0px")
    .style("display", "block")
    .style("background", "white")
    .style("cursor", "grab")
    .style("z-index", 0);

  const projection = d3.geoEqualEarth()
    .fitExtent(
      [
        [18, 8],
        [W - 18, mapH - 8]
      ],
      { type: "Sphere" }
    );

  const path = d3.geoPath(projection);

  const viewport = svg.append("g");
  const countryLayer = viewport.append("g");
  const labelLayer = viewport.append("g");
  const focusLayer = viewport.append("g");

  countryLayer.selectAll("path")
    .data(countries)
    .join("path")
    .attr("d", path)
    .attr("fill", "white")
    .attr("stroke", "#dedede")
    .attr("stroke-width", 0.65)
    .attr("vector-effect", "non-scaling-stroke");

  const labelData = [
    { name: "United States of America", lon: -98, lat: 39 },
    { name: "Mexico", lon: -102, lat: 23 },
    { name: "Colombia", lon: -74, lat: 5 },
    { name: "Chile", lon: -71, lat: -30 },
    { name: "France", lon: 2, lat: 46 },
    { name: "India", lon: 78, lat: 22 },
    { name: "Thailand", lon: 101, lat: 15 },
    { name: "Indonesia", lon: 118, lat: -3 },
    { name: "Tanzania", lon: 35, lat: -6 },
    { name: "New Zealand", lon: 172, lat: -42 }
  ].map(d => {
    const p = projection([d.lon, d.lat]);
    return { ...d, x: p[0], y: p[1] };
  });

  labelLayer
    .attr("pointer-events", "none")
    .selectAll("text")
    .data(labelData)
    .join("text")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("text-anchor", "middle")
    .attr("font-size", 10)
    .attr("font-weight", 500)
    .attr("fill", "#888")
    .attr("opacity", 0.95)
    .text(d => d.name);

  const quakeCanvas = mapWrap.append("canvas")
    .attr("width", W * dpr)
    .attr("height", mapH * dpr)
    .style("position", "absolute")
    .style("left", "0px")
    .style("top", "0px")
    .style("width", `${W}px`)
    .style("height", `${mapH}px`)
    .style("pointer-events", "none")
    .style("z-index", 1);

  const ctx = quakeCanvas.node().getContext("2d");

  const projectedEarthquakes = earthquakes
    .map(d => {
      const p = projection([d.lon, d.lat]);

      return p
        ? {
            ...d,
            x: p[0],
            y: p[1],
            color: color(d),
            searchText: [
              d.location,
              d.category,
              d.magBin,
              d.year,
              d.mag,
              d.deaths
            ].join(" ").toLowerCase()
          }
        : null;
    })
    .filter(d =>
      d &&
      Number.isFinite(d.x) &&
      Number.isFinite(d.y)
    )
    .sort((a, b) => a.mag - b.mag);

  const delaunay = d3.Delaunay.from(
    projectedEarthquakes,
    d => d.x,
    d => d.y
  );

  let currentTransform = d3.zoomIdentity;
  let hovered = null;
  let searchQuery = "";
  let drawQueued = false;

  function scheduleDraw() {
    if (drawQueued) return;

    drawQueued = true;
    requestAnimationFrame(() => {
      drawQueued = false;
      drawQuakes();
    });
  }

  function isVisible(x, y, h) {
    return !(
      x < -80 ||
      x > W + 80 ||
      y < -80 ||
      y - h > mapH + 80
    );
  }

  function drawQuakes() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, mapH);
    ctx.lineCap = "round";

    const k = currentTransform.k;
    const symbolScale = Math.min(2.2, Math.sqrt(k));

    for (const d of projectedEarthquakes) {
      const x = currentTransform.applyX(d.x);
      const y = currentTransform.applyY(d.y);
      const h = signalHeight(d.mag) * symbolScale;

      if (!isVisible(x, y, h)) continue;

      const matched = !searchQuery || d.searchText.includes(searchQuery);
      ctx.globalAlpha = searchQuery && !matched ? 0.06 : 0.34;
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 2 * symbolScale;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - h);
      ctx.stroke();
    }

    for (const d of projectedEarthquakes) {
      const x = currentTransform.applyX(d.x);
      const y = currentTransform.applyY(d.y);
      const h = signalHeight(d.mag) * symbolScale;

      if (!isVisible(x, y, h)) continue;

      const matched = !searchQuery || d.searchText.includes(searchQuery);
      ctx.globalAlpha = searchQuery && !matched ? 0.08 : 0.58;
      ctx.fillStyle = d.color;

      ctx.beginPath();
      ctx.arc(x, y, signalRadius(d.mag) * symbolScale, 0, Math.PI * 2);
      ctx.fill();
    }

    if (hovered) {
      const x = currentTransform.applyX(hovered.x);
      const y = currentTransform.applyY(hovered.y);
      const h = signalHeight(hovered.mag) * symbolScale;

      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = hovered.color;
      ctx.fillStyle = hovered.color;
      ctx.lineWidth = 3 * symbolScale;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - h);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, signalRadius(hovered.mag) * symbolScale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  const focusRing = focusLayer.append("circle")
    .attr("fill", "none")
    .attr("stroke", "#111")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "3 3")
    .style("display", "none")
    .attr("pointer-events", "none")
    .attr("vector-effect", "non-scaling-stroke");

  const tooltip = mapWrap.append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("background", "white")
    .style("border-radius", "4px")
    .style("box-shadow", "0 2px 12px rgba(0,0,0,0.18)")
    .style("padding", "10px 12px")
    .style("min-width", "120px")
    .style("font-size", "17px")
    .style("line-height", "1.35")
    .style("color", "#333")
    .style("z-index", 4);

  function showTooltipAt(mx, my, d) {
    tooltip
      .style("opacity", 1)
      .style("left", `${Math.min(mx + 15, W - 170)}px`)
      .style("top", `${Math.max(8, my - 28)}px`)
      .html(`
        <div style="font-weight:700; letter-spacing:0.02em;">${esc(d.location)}</div>
        <div style="color:#8a8a8a; margin-top:1px;">${esc(d.category)}</div>
        <div style="margin-top:6px;">Mag: ${d3.format(".1f")(d.mag)}</div>
      `);
  }

  function nearestQuake(mx, my) {
    const [ux, uy] = currentTransform.invert([mx, my]);
    const i = delaunay.find(ux, uy);
    const d = projectedEarthquakes[i];

    if (!d) return null;

    const sx = currentTransform.applyX(d.x);
    const sy = currentTransform.applyY(d.y);
    const symbolScale = Math.min(2.2, Math.sqrt(currentTransform.k));
    const threshold = Math.max(10, signalRadius(d.mag) * symbolScale + 6);

    return Math.hypot(sx - mx, sy - my) <= threshold ? d : null;
  }

  let isDragging = false;

  svg.on("pointermove", function(event) {
    if (isDragging) return;

    const [mx, my] = d3.pointer(event, this);
    const d = nearestQuake(mx, my);

    if (d !== hovered) {
      hovered = d;
      scheduleDraw();
    }

    if (d) {
      showTooltipAt(mx, my, d);
    } else {
      tooltip.style("opacity", 0);
    }
  });

  svg.on("pointerleave", () => {
    hovered = null;
    tooltip.style("opacity", 0);
    scheduleDraw();
  });

  const searchBox = mapWrap.append("div")
    .style("position", "absolute")
    .style("left", "18px")
    .style("top", "8px")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "6px")
    .style("background", "white")
    .style("border", "1px solid #d8d8d8")
    .style("border-radius", "4px")
    .style("box-shadow", "0 1px 2px rgba(0,0,0,0.08)")
    .style("padding", "6px 8px")
    .style("z-index", 3);

  searchBox.append("span")
    .style("font-size", "16px")
    .style("line-height", "1")
    .text("🔍");

  const input = searchBox.append("input")
    .attr("type", "search")
    .attr("placeholder", "Search event")
    .style("width", "145px")
    .style("border", "none")
    .style("outline", "none")
    .style("font-size", "13px")
    .style("font-family", "inherit");

  const counter = mapWrap.append("div")
    .style("position", "absolute")
    .style("left", "18px")
    .style("top", "48px")
    .style("font-size", "12px")
    .style("color", "#555")
    .style("background", "rgba(255,255,255,0.85)")
    .style("padding", "2px 4px")
    .style("border-radius", "3px")
    .style("display", "none")
    .style("z-index", 3);

  input.on("input", function() {
    searchQuery = this.value.trim().toLowerCase();

    if (!searchQuery) {
      focusRing.style("display", "none");
      counter.style("display", "none");
      scheduleDraw();
      return;
    }

    const matches = projectedEarthquakes.filter(d =>
      d.searchText.includes(searchQuery)
    );

    if (matches.length) {
      const first = matches[0];

      focusRing
        .style("display", null)
        .attr("cx", first.x)
        .attr("cy", first.y)
        .attr("r", signalRadius(first.mag) + 8);

      counter
        .style("display", null)
        .text(`${matches.length} match${matches.length === 1 ? "" : "es"}`);
    } else {
      focusRing.style("display", "none");

      counter
        .style("display", null)
        .text("No matches");
    }

    scheduleDraw();
  });

  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .extent([
      [0, 0],
      [W, mapH]
    ])
    .translateExtent([
      [0, 0],
      [W, mapH]
    ])
    .on("start", () => {
      isDragging = true;
      hovered = null;
      tooltip.style("opacity", 0);
      svg.style("cursor", "grabbing");
      scheduleDraw();
    })
    .on("zoom", event => {
      currentTransform = event.transform;
      viewport.attr("transform", currentTransform);
      scheduleDraw();
    })
    .on("end", () => {
      isDragging = false;
      svg.style("cursor", "grab");
    });

  svg.call(zoom);
  svg.on("dblclick.zoom", null);

  drawQuakes();

  return container.node();
}


function _3(md){return(
md`Original by Scott Barber (@scottb) on [Flourish](https://flourish.studio/examples/?q=Earthquake+spikes)`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Earthquake.xlsx", {url: new URL("./files/0d56938726efbb0e8d3e505edb7e3617e1d3819259ed35039e839b76a75f835efdd115cac652305d9b98057deaa2e918af37332dc77f24de87bd06784dc2f37e.xlsx", import.meta.url), mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","width"], _2);
  main.variable(observer()).define(["md"], _3);
  return main;
}
