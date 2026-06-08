function _1(md){return(
md`# Trade chokepoints`
)}

async function _2(FileAttachment,width,html)
{
  const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");
  const topojson = await import("https://cdn.jsdelivr.net/npm/topojson-client@3/+esm");
  const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");

  // =========================
  // Load Excel data
  // =========================
  const file = await FileAttachment("trade_chokepoints2.xlsx").arrayBuffer();
  const workbook = XLSX.read(file);

  const pointRows = XLSX.utils.sheet_to_json(workbook.Sheets["Points"], {
    defval: null
  });

  const lineRows = XLSX.utils.sheet_to_json(workbook.Sheets["Lines"], {
    defval: null
  });

  function value(d, names) {
    for (const name of names) {
      if (d[name] != null && d[name] !== "") return d[name];
    }
    return null;
  }

  const points = pointRows
    .filter(
      d =>
        value(d, ["Chokepoint", "chokepoint", "name"]) &&
        value(d, ["lat", "latitude", "Latitude"]) != null &&
        value(d, ["lon", "lng", "longitude", "Longitude"]) != null
    )
    .map(d => ({
      name: String(value(d, ["Chokepoint", "chokepoint", "name"])),
      lat: +value(d, ["lat", "latitude", "Latitude"]),
      lon: +value(d, ["lon", "lng", "longitude", "Longitude"]),
      vesselCount:
        +value(d, ["Vessel count", "vessel_count", "vesselCount", "total"]) ||
        0,
      chart: value(d, ["Chart", "chart"]),
      container: +value(d, ["vessel_count_container", "container"]) || 0,
      dryBulk: +value(d, ["vessel_count_dry_bulk", "dry_bulk", "dryBulk"]) || 0,
      generalCargo:
        +value(d, [
          "vessel_count_general_cargo",
          "general_cargo",
          "generalCargo"
        ]) || 0,
      roro: +value(d, ["vessel_count_RoRo", "roro", "RoRo"]) || 0
    }));

  // =========================
  // Build shipping routes from Lines sheet
  // Expected columns:
  // route_id, segment_id, point_order, lon, lat
  // =========================
  const validLineRows = lineRows
    .map(d => {
      const routeRaw = value(d, ["route_id", "routeId", "Route ID", "Route"]);
      const segmentRaw = value(d, [
        "segment_id",
        "segmentId",
        "Segment ID",
        "Segment"
      ]);

      return {
        routeId: routeRaw == null ? null : String(routeRaw),
        segmentId: segmentRaw == null ? null : String(segmentRaw),
        pointOrder: +value(d, ["point_order", "pointOrder", "order", "Order"]),
        lon: +value(d, ["lon", "lng", "longitude", "Longitude"]),
        lat: +value(d, ["lat", "latitude", "Latitude"])
      };
    })
    .filter(
      d =>
        d.routeId &&
        d.segmentId &&
        Number.isFinite(d.pointOrder) &&
        Number.isFinite(d.lon) &&
        Number.isFinite(d.lat)
    );

  const groupedRoutes = d3.group(
    validLineRows,
    d => d.routeId,
    d => d.segmentId
  );

  const routes = [];

  for (const [routeId, segmentMap] of groupedRoutes) {
    for (const [segmentId, rows] of segmentMap) {
      const coordinates = rows
        .slice()
        .sort((a, b) => a.pointOrder - b.pointOrder)
        .map(d => [d.lon, d.lat])
        .filter((coord, i, arr) => {
          if (i === 0) return true;
          const prev = arr[i - 1];
          return coord[0] !== prev[0] || coord[1] !== prev[1];
        });

      if (coordinates.length >= 2) {
        routes.push({
          type: "Feature",
          properties: {
            routeId,
            segmentId
          },
          geometry: {
            type: "LineString",
            coordinates
          }
        });
      }
    }
  }

  const world = await d3.json(
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
  );

  const countries = topojson.feature(world, world.objects.countries);

  // =========================
  // Layout
  // =========================
  const W = Math.min(1100, typeof width === "number" ? width : 1100);
  const H = 535;
  const clipId = `map-clip-${Math.random().toString(36).slice(2)}`;

  const container = html`
    <div class="trade-map-wrap">
      <style>
        .trade-map-wrap {
          width: ${W}px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          color: #333;
          position: relative;
        }

        .trade-title {
          font-size: 26px;
          font-weight: 700;
          line-height: 1.1;
          margin: 0;
        }

        .trade-subtitle {
          font-size: 20px;
          margin: 2px 0 6px 0;
          color: #444;
        }

        .trade-instruction {
          font-size: 18px;
          margin-bottom: 12px;
          color: #333;
        }

        .trade-pill {
          background: #b51d32;
          color: white;
          font-weight: 700;
          padding: 3px 6px;
        }

        .map-stage {
          width: ${W}px;
          height: ${H}px;
          position: relative;
          overflow: hidden;
          background: #eaf4fa;
        }

        .zoom-controls {
          position: absolute;
          right: 14px;
          top: 14px;
          z-index: 5;
          display: flex;
          flex-direction: column;
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          overflow: hidden;
        }

        .zoom-controls button {
          width: 38px;
          height: 36px;
          border: 0;
          border-bottom: 1px solid #ddd;
          background: white;
          font-size: 24px;
          font-weight: 700;
          cursor: pointer;
          color: #333;
        }

        .zoom-controls button:last-child {
          border-bottom: 0;
          font-size: 15px;
        }

        .zoom-controls button:hover {
          background: #f2f2f2;
        }

        .map-tooltip {
          position: absolute;
          z-index: 10;
          width: 445px;
          min-height: 230px;
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
          padding: 12px;
          display: none;
          pointer-events: none;
        }

        .map-tooltip.locked {
          pointer-events: auto;
        }

        .tooltip-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .tooltip-count {
          font-size: 16px;
          margin-bottom: 14px;
        }

        .tooltip-small {
          font-size: 12px;
          color: #666;
          margin-top: 8px;
        }

        .breakdown-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .bar-row {
          display: grid;
          grid-template-columns: 110px 1fr 70px;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          margin: 5px 0;
        }

        .bar-track {
          height: 10px;
          background: #e6e6e6;
          border-radius: 10px;
          overflow: hidden;
        }

        .bar-fill {
          height: 10px;
          background: #0b2d4d;
        }

        .flourish-frame {
          width: 100%;
          height: 250px;
          border: 0;
        }

        .attribution {
          position: absolute;
          right: 12px;
          bottom: 6px;
          color: #666;
          font-size: 13px;
          pointer-events: none;
        }
      </style>

      <h2 class="trade-title">
        How are geopolitical events impacting global trade through shipping routes?
      </h2>
      <div class="trade-subtitle">
        Global shipping chokepoints, sized by shipping volume
      </div>
      <div class="trade-instruction">
        Click on a <span class="trade-pill">chokepoint</span> to view traffic
        trends over time
      </div>

      <div class="map-stage">
        <div class="zoom-controls">
          <button class="zoom-in">+</button>
          <button class="zoom-out">−</button>
          <button class="zoom-reset">▲</button>
        </div>

        <div class="map-tooltip"></div>
        <div class="attribution">© OpenMapTiles © OpenStreetMap contributors</div>
      </div>
    </div>
  `;

  const stage = container.querySelector(".map-stage");
  const tooltip = container.querySelector(".map-tooltip");

  const svg = d3
    .select(stage)
    .append("svg")
    .attr("width", W)
    .attr("height", H)
    .style("display", "block")
    .style("touch-action", "none");

  svg
    .append("defs")
    .append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("width", W)
    .attr("height", H);

  // =========================
  // Projection
  // IMPORTANT:
  // Do not use fitExtent here.
  // fitExtent creates left/right projection padding for this aspect ratio.
  // This width-locked Mercator makes lon -180 exactly x = 0
  // and lon 180 exactly x = W.
  // =========================
  const projection = d3
    .geoMercator()
    .scale(W / (2 * Math.PI))
    .translate([W / 2, H / 2])
    .center([0, 0])
    .clipExtent([
      [0, 0],
      [W, H]
    ]);

  const path = d3.geoPath(projection);

  const mapLayer = svg.append("g").attr("clip-path", `url(#${clipId})`);
  const g = mapLayer.append("g");

  // Background is not zoomed past the safe map bounds.
  g.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", W)
    .attr("height", H)
    .attr("fill", "#eaf4fa");

  // =========================
  // Countries
  // =========================
  g.append("g")
    .attr("class", "countries")
    .selectAll("path")
    .data(countries.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "#d8d8d8")
    .attr("stroke", "#f5f5f5")
    .attr("stroke-width", 0.45);

  // =========================
  // Shipping routes
  // =========================
  const routeLayer = g.append("g").attr("class", "shipping-routes");

  routeLayer
    .selectAll("path.route-shadow")
    .data(routes)
    .join("path")
    .attr("class", "route-shadow")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#456b87")
    .attr("stroke-width", 2.4)
    .attr("stroke-opacity", 0.12)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("vector-effect", "non-scaling-stroke")
    .style("pointer-events", "none");

  routeLayer
    .selectAll("path.route-line")
    .data(routes)
    .join("path")
    .attr("class", "route-line")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#456b87")
    .attr("stroke-width", 0.95)
    .attr("stroke-opacity", 0.32)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("vector-effect", "non-scaling-stroke")
    .style("pointer-events", "none");

  // =========================
  // Chokepoints
  // =========================
  const radius = d3
    .scaleSqrt()
    .domain(d3.extent(points, d => d.vesselCount))
    .range([3.2, 12.5]);

  const labelOffsets = new Map([
    ["Dover Strait", [-8, 6, "end"]],
    ["Bosporus Strait", [-8, -10, "end"]],
    ["Suez Canal", [-8, 6, "end"]],
    ["Strait of Hormuz", [8, 5, "start"]],
    ["Bab el-Mandeb Strait", [-10, 6, "end"]],
    ["Gibraltar Strait", [-8, 4, "end"]],
    ["Cape of Good Hope", [-8, 6, "end"]],
    ["Panama Canal", [-8, 6, "end"]],
    ["Yucatan Channel", [-8, 6, "end"]],
    ["Magellan Strait", [-8, 7, "end"]],
    ["Malacca Strait", [-8, 8, "end"]],
    ["Lombok Strait", [-8, 11, "end"]],
    ["Taiwan Strait", [-8, 5, "end"]],
    ["Korea Strait", [-10, 4, "end"]],
    ["Tsugaru Strait", [-9, 4, "end"]],
    ["Bohai Strait", [-8, -8, "end"]],
    ["Luzon Strait", [-8, -8, "end"]],
    ["Makassar Strait", [-8, 5, "end"]],
    ["Sunda Strait", [-8, 8, "end"]],
    ["Ombai Strait", [8, 5, "start"]],
    ["Torres Strait", [8, 5, "start"]],
    ["Windward Passage", [8, -7, "start"]],
    ["Mona Passage", [8, 8, "start"]],
    ["Oresund Strait", [8, -7, "start"]]
  ]);

  const pointGroup = g
    .append("g")
    .attr("class", "chokepoints")
    .selectAll("g")
    .data(points)
    .join("g")
    .attr("transform", d => {
      const [x, y] = projection([d.lon, d.lat]);
      return `translate(${x},${y})`;
    })
    .style("cursor", "pointer");

  pointGroup
    .append("circle")
    .attr("r", d => radius(d.vesselCount))
    .attr("fill", "#bd334d")
    .attr("fill-opacity", 0.9)
    .attr("stroke", "white")
    .attr("stroke-width", 0.8)
    .attr("vector-effect", "non-scaling-stroke");

  // =========================
  // Dynamic fixed-size labels
  // =========================
  let currentTransform = d3.zoomIdentity;

  const labelLayer = svg
    .append("g")
    .attr("class", "label-layer")
    .attr("clip-path", `url(#${clipId})`);

  const labelSelection = labelLayer
    .selectAll("text")
    .data(points)
    .join("text")
    .text(d => d.name)
    .attr("font-size", 13)
    .attr("font-weight", 700)
    .attr("fill", "#333")
    .attr("paint-order", "stroke")
    .attr("stroke", "white")
    .attr("stroke-width", 3)
    .attr("stroke-linejoin", "round")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("visibility", "hidden")
    .attr("data-label-visible", "0");

  function projectedScreenPoint(d) {
    return currentTransform.apply(projection([d.lon, d.lat]));
  }

  function isPointVisible(d) {
    const [x, y] = projectedScreenPoint(d);
    const margin = 35;
    return x >= -margin && x <= W + margin && y >= -margin && y <= H + margin;
  }

  function updateLabelPositions() {
    labelSelection
      .attr("x", d => {
        const [x] = projectedScreenPoint(d);
        const [dx] = labelOffsets.get(d.name) ?? [8, 4, "start"];
        return x + dx;
      })
      .attr("y", d => {
        const [, y] = projectedScreenPoint(d);
        const [, dy] = labelOffsets.get(d.name) ?? [8, 4, "start"];
        return y + dy;
      })
      .attr("text-anchor", d => {
        const offset = labelOffsets.get(d.name) ?? [8, 4, "start"];
        return offset[2];
      });
  }

  function rectanglesOverlap(a, b, padding = 3) {
    return !(
      a.right + padding < b.left ||
      a.left - padding > b.right ||
      a.bottom + padding < b.top ||
      a.top - padding > b.bottom
    );
  }

  function setLabelVisible(node, show) {
    const sel = d3.select(node);
    const wasVisible = sel.attr("data-label-visible") === "1";

    if (show) {
      if (wasVisible) {
        sel.style("visibility", "visible").style("opacity", 1);
        return;
      }

      sel
        .attr("data-label-visible", "1")
        .style("visibility", "visible")
        .interrupt("labelFade")
        .transition("labelFade")
        .duration(180)
        .style("opacity", 1);
    } else {
      if (!wasVisible) {
        sel
          .interrupt("labelFade")
          .style("opacity", 0)
          .style("visibility", "hidden");
        return;
      }

      sel
        .attr("data-label-visible", "0")
        .interrupt("labelFade")
        .transition("labelFade")
        .duration(180)
        .style("opacity", 0)
        .on("end", function () {
          if (d3.select(this).attr("data-label-visible") !== "1") {
            d3.select(this).style("visibility", "hidden");
          }
        });
    }
  }

  function resolveLabelCollisions() {
    updateLabelPositions();

    labelSelection.style("visibility", "visible");

    const nodes = labelSelection
      .nodes()
      .filter(node => isPointVisible(d3.select(node).datum()))
      .sort((a, b) => {
        const da = d3.select(a).datum();
        const db = d3.select(b).datum();
        return db.vesselCount - da.vesselCount;
      });

    const keptBoxes = [];
    const visibleNodes = new Set();

    for (const node of nodes) {
      const box = node.getBoundingClientRect();

      const overlapsBiggerLabel = keptBoxes.some(kept =>
        rectanglesOverlap(box, kept, 3)
      );

      if (!overlapsBiggerLabel) {
        keptBoxes.push(box);
        visibleNodes.add(node);
      }
    }

    labelSelection.each(function () {
      setLabelVisible(this, visibleNodes.has(this));
    });
  }

  requestAnimationFrame(resolveLabelCollisions);
  setTimeout(resolveLabelCollisions, 100);

  // =========================
  // Tooltip logic
  // =========================
  let lockedPoint = null;

  function formatNumber(x) {
    return d3.format(",")(x);
  }

  function escapeHtml(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function extractIframeSrc(v) {
    const text = String(v || "");
    const match = text.match(/src=['"]([^'"]+)['"]/i);
    return match ? match[1] : null;
  }

  function categoryBreakdownHTML(d) {
    const rows = [
      ["Container", d.container],
      ["Dry bulk", d.dryBulk],
      ["General cargo", d.generalCargo],
      ["RoRo", d.roro]
    ];

    const maxValue = d3.max(rows, r => r[1]) || 1;

    return `
      <div class="breakdown-title">Vessel breakdown</div>
      ${rows
        .map(([label, val]) => {
          const pct = Math.max(3, (val / maxValue) * 100);
          return `
            <div class="bar-row">
              <div>${escapeHtml(label)}</div>
              <div class="bar-track">
                <div class="bar-fill" style="width:${pct}%"></div>
              </div>
              <div>${formatNumber(val)}</div>
            </div>
          `;
        })
        .join("")}
    `;
  }

  function showTooltip(d, locked = false) {
    lockedPoint = locked ? d : lockedPoint;

    const iframeSrc = extractIframeSrc(d.chart);

    tooltip.classList.toggle("locked", locked);
    tooltip.style.display = "block";

    tooltip.innerHTML = `
      <div class="tooltip-title">${escapeHtml(d.name)}</div>
      <div class="tooltip-count">
        Total vessel count in the last 12 months: ${formatNumber(d.vesselCount)}
      </div>

      ${
        iframeSrc
          ? `<iframe class="flourish-frame" src="${iframeSrc}" loading="lazy"></iframe>`
          : categoryBreakdownHTML(d)
      }

      <div class="tooltip-small">
        ${
          locked
            ? "Click elsewhere on the map to close this tooltip."
            : "Click this chokepoint to keep the tooltip open."
        }
      </div>
    `;

    placeTooltip(d);
  }

  function hideTooltip() {
    tooltip.style.display = "none";
    tooltip.classList.remove("locked");
  }

  function placeTooltip(d) {
    const [x, y] = projectedScreenPoint(d);

    const gap = 16;
    const boxWidth = tooltip.offsetWidth || 445;
    const boxHeight = tooltip.offsetHeight || 260;

    let left = x + gap;
    let top = y - 12;

    if (left + boxWidth > W - 10) {
      left = x - boxWidth - gap;
    }

    if (top + boxHeight > H - 10) {
      top = H - boxHeight - 10;
    }

    if (top < 10) top = 10;
    if (left < 10) left = 10;

    tooltip.style.transform = `translate(${left}px, ${top}px)`;
  }

  pointGroup
    .on("mouseenter", function (event, d) {
      if (!lockedPoint) showTooltip(d, false);
    })
    .on("mousemove", function (event, d) {
      if (!lockedPoint) placeTooltip(d);
    })
    .on("mouseleave", function () {
      if (!lockedPoint) hideTooltip();
    })
    .on("click", function (event, d) {
      event.stopPropagation();
      lockedPoint = d;
      showTooltip(d, true);
    });

  tooltip.addEventListener("click", event => {
    event.stopPropagation();
  });

  svg.on("click", () => {
    lockedPoint = null;
    hideTooltip();
  });

  // =========================
  // Bounded zoom and drag
  // =========================
  function clampTransform(transform) {
    const k = Math.max(1, Math.min(8, transform.k));

    // Because the projection is width-locked:
    // world left edge is x = 0
    // world right edge is x = W
    const minX = W - W * k;
    const maxX = 0;

    const minY = H - H * k;
    const maxY = 0;

    const x = Math.max(minX, Math.min(maxX, transform.x));
    const y = Math.max(minY, Math.min(maxY, transform.y));

    return d3.zoomIdentity.translate(x, y).scale(k);
  }

  let labelFrame = null;

  function scheduleLabelUpdate() {
    if (labelFrame) cancelAnimationFrame(labelFrame);
    labelFrame = requestAnimationFrame(() => {
      labelFrame = null;
      resolveLabelCollisions();
    });
  }

  const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .extent([
      [0, 0],
      [W, H]
    ])
    .translateExtent([
      [0, 0],
      [W, H]
    ])
    .constrain(transform => clampTransform(transform))
    .on("zoom", event => {
      currentTransform = clampTransform(event.transform);

      // Keep D3's internal zoom state synced with the clamped transform.
      svg.node().__zoom = currentTransform;

      g.attr("transform", currentTransform);

      scheduleLabelUpdate();

      if (lockedPoint) {
        placeTooltip(lockedPoint);
      }
    });

  svg.call(zoom).on("dblclick.zoom", null);

  container.querySelector(".zoom-in").addEventListener("click", event => {
    event.stopPropagation();
    svg.transition().duration(250).call(zoom.scaleBy, 1.35);
  });

  container.querySelector(".zoom-out").addEventListener("click", event => {
    event.stopPropagation();
    svg.transition().duration(250).call(zoom.scaleBy, 1 / 1.35);
  });

  container.querySelector(".zoom-reset").addEventListener("click", event => {
    event.stopPropagation();
    svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
  });

  return container;
}


function _3(md){return(
md`[Original](https://flourish.studio/examples/?q=Trade+chokepoints) by Scott Barber (@scottb) on Flourish`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["trade_chokepoints2.xlsx", {url: new URL("./files/e40096aede0cadbe9aaac15ea44644728c9130cd453c0ba480a9de3e089135308de498ac04209e244b08fd1a69588312b9f3cb2da63e0feeaa269745d9cbc266.xlsx", import.meta.url), mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","width","html"], _2);
  main.variable(observer()).define(["md"], _3);
  return main;
}
