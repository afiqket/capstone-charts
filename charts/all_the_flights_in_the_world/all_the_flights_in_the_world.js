function _1(md){return(
md`# All the Flights in the World`
)}

function _2(md){return(
md`Two hours of flight data collected by OpenSky Network on September 3rd 2019`
)}

async function _3(html,d3,FileAttachment,topojson,ResizeObserver)
{
  const width = 1100;
  const height = 600;
  const dpr = window.devicePixelRatio || 1;

  const container = html`<div style="font: 12px sans-serif; position: relative;"></div>`;

  const controls = html`
    <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
      <label><b>Time</b></label>
      <input type="range" min="0" step="1" style="width: 500px;">
      <span></span>
    </div>
  `;
  container.appendChild(controls);

  const slider = controls.querySelector("input");
  const timeLabel = controls.querySelector("span");

  const chart = html`
    <div style="
      position: relative;
      width: 100%;
      max-width: ${width}px;
      overflow: hidden;
    "></div>
  `;
  container.appendChild(chart);

  const svg = d3.create("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .style("display", "block")
    .style("width", "100%")
    .style("height", "auto")
    .style("background", "#eef5ff")
    .style("cursor", "grab")
    .style("user-select", "none");

  chart.appendChild(svg.node());

  const bgCanvas = html`
    <canvas style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>
  `;

  const dynamicCanvas = html`
    <canvas style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>
  `;

  const pointCanvas = html`
    <canvas style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>
  `;

  for (const canvas of [bgCanvas, dynamicCanvas, pointCanvas]) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }

  chart.appendChild(bgCanvas);
  chart.appendChild(dynamicCanvas);
  chart.appendChild(pointCanvas);

  const bgCtx = bgCanvas.getContext("2d");
  const dynCtx = dynamicCanvas.getContext("2d");
  const pointCtx = pointCanvas.getContext("2d");

  const tooltip = d3.select(container)
    .append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "white")
    .style("border", "1px solid #999")
    .style("padding", "6px 8px")
    .style("border-radius", "4px")
    .style("font", "12px sans-serif")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
    .style("display", "none");

  const [rows, world] = await Promise.all([
    FileAttachment("flights4.csv").csv(),
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
  ]);

  const countries = topojson.feature(world, world.objects.countries);

  const projection = d3.geoNaturalEarth1()
    .fitSize([width, height], countries);

  const path = d3.geoPath(projection);

  const zoomLayer = svg.append("g");

  zoomLayer.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#eef5ff");

  zoomLayer.append("g")
    .selectAll("path")
    .data(countries.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "white")
    .attr("stroke", "none");

  let minTime = Infinity;
  let maxTime = -Infinity;

  const flights = rows.map(row => {
    const feature = JSON.parse(row._geojson);

    const coords = feature.geometry.coordinates
      .map(d => {
        const lon = +d[0];
        const lat = +d[1];
        const alt = +d[2];
        const time = +d[3];
        const projected = projection([lon, lat]);

        if (!projected || !Number.isFinite(projected[0]) || !Number.isFinite(projected[1])) {
          return null;
        }

        minTime = Math.min(minTime, time);
        maxTime = Math.max(maxTime, time);

        return {
          lon,
          lat,
          alt,
          time,
          x: projected[0],
          y: projected[1]
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

    if (coords.length < 2) return null;

    return {
      icao24: row.icao24,
      origin_country: row.origin_country,
      callsign: row.callsign,
      airline: row.airline,
      country: row.country,
      coords,
      startTime: coords[0].time,
      endTime: coords[coords.length - 1].time
    };
  }).filter(Boolean);

  function addSampledLineToPath(path2d, coords, maxPoints) {
    if (!coords.length) return;

    const step = Math.max(1, Math.ceil(coords.length / maxPoints));

    path2d.moveTo(coords[0].x, coords[0].y);

    for (let i = step; i < coords.length; i += step) {
      path2d.lineTo(coords[i].x, coords[i].y);
    }

    const last = coords[coords.length - 1];
    path2d.lineTo(last.x, last.y);
  }

  const backgroundPaths = {
    veryLow: new Path2D(),
    low: new Path2D(),
    med: new Path2D(),
    full: new Path2D()
  };

  for (const flight of flights) {
    addSampledLineToPath(backgroundPaths.veryLow, flight.coords, 40);
    addSampledLineToPath(backgroundPaths.low, flight.coords, 120);
    addSampledLineToPath(backgroundPaths.med, flight.coords, 300);
    addSampledLineToPath(backgroundPaths.full, flight.coords, Infinity);
  }

  slider.min = minTime;
  slider.max = maxTime;
  slider.value = minTime;
  slider.step = 40;

  let currentTime = minTime;
  let currentTransform = d3.zoomIdentity;
  let activePoints = [];

  let redrawQueued = false;
  let backgroundDirty = true;
  let isZooming = false;

  const baseRadius = 3.5;
  const basePointStrokeWidth = 0.8;
  const baseBgTrackWidth = 1;
  const baseTrailWidth = 1.5;

  function formatTime(ts) {
    return new Date(ts * 1000).toUTCString();
  }

  function clearCanvas(ctx) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width * dpr, height * dpr);
    ctx.restore();
  }

  function useZoomedCanvasCoordinates(ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(currentTransform.x, currentTransform.y);
    ctx.scale(currentTransform.k, currentTransform.k);
  }

  function useScreenCanvasCoordinates(ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function backgroundPathForZoom() {
    const k = currentTransform.k;

    if (isZooming) {
      if (k < 2) return backgroundPaths.veryLow;
      if (k < 5) return backgroundPaths.low;
      return backgroundPaths.med;
    }

    if (k < 1.5) return backgroundPaths.veryLow;
    if (k < 3) return backgroundPaths.low;
    if (k < 6) return backgroundPaths.med;
    return backgroundPaths.full;
  }

  function positionAtTime(flight, t) {
    const coords = flight.coords;

    if (t < flight.startTime || t > flight.endTime) return null;

    let i = d3.bisector(d => d.time).right(coords, t) - 1;

    if (i < 0) return null;

    if (i >= coords.length - 1) {
      const last = coords[coords.length - 1];
      return {
        ...last,
        index: coords.length - 1
      };
    }

    const a = coords[i];
    const b = coords[i + 1];

    if (!b || b.time === a.time) {
      return {
        ...a,
        index: i
      };
    }

    const p = (t - a.time) / (b.time - a.time);

    return {
      lon: a.lon + (b.lon - a.lon) * p,
      lat: a.lat + (b.lat - a.lat) * p,
      alt: a.alt + (b.alt - a.alt) * p,
      time: t,
      x: a.x + (b.x - a.x) * p,
      y: a.y + (b.y - a.y) * p,
      index: i
    };
  }

  function recomputeActivePoints() {
    activePoints = [];

    for (const flight of flights) {
      if (currentTime < flight.startTime || currentTime > flight.endTime) continue;

      const pos = positionAtTime(flight, currentTime);
      if (!pos) continue;

      activePoints.push({ flight, pos });
    }
  }

  function drawBackgroundTracks() {
    clearCanvas(bgCtx);
    useZoomedCanvasCoordinates(bgCtx);

    bgCtx.save();
    bgCtx.globalAlpha = 0.15;
    bgCtx.strokeStyle = "#555";
    bgCtx.lineWidth = baseBgTrackWidth / currentTransform.k;
    bgCtx.lineCap = "round";
    bgCtx.lineJoin = "round";

    bgCtx.stroke(backgroundPathForZoom());

    bgCtx.restore();
  }

  function addTrailToPath(path2d, coords, pos) {
    const stopIndex = pos.index;
    if (stopIndex <= 0) return;

    const k = currentTransform.k;

    const maxTrailPoints = isZooming
      ? (k < 2 ? 25 : k < 5 ? 60 : 120)
      : (k < 1.5 ? 60 : k < 3 ? 140 : k < 6 ? 300 : 700);

    const step = Math.max(1, Math.floor(stopIndex / maxTrailPoints));

    path2d.moveTo(coords[0].x, coords[0].y);

    for (let i = step; i <= stopIndex; i += step) {
      path2d.lineTo(coords[i].x, coords[i].y);
    }

    path2d.lineTo(pos.x, pos.y);
  }

  function drawDynamicLayer() {
    clearCanvas(dynCtx);
    useZoomedCanvasCoordinates(dynCtx);

    const trailPath = new Path2D();

    for (const d of activePoints) {
      addTrailToPath(trailPath, d.flight.coords, d.pos);
    }

    dynCtx.save();
    dynCtx.globalAlpha = 0.75;
    dynCtx.strokeStyle = "#1f77b4";
    dynCtx.lineWidth = baseTrailWidth / currentTransform.k;
    dynCtx.lineCap = "round";
    dynCtx.lineJoin = "round";
    dynCtx.stroke(trailPath);
    dynCtx.restore();
  }

  function drawPointLayer() {
    clearCanvas(pointCtx);
    useScreenCanvasCoordinates(pointCtx);

    pointCtx.save();

    for (const d of activePoints) {
      const x = currentTransform.applyX(d.pos.x);
      const y = currentTransform.applyY(d.pos.y);

      pointCtx.beginPath();
      pointCtx.arc(x, y, baseRadius, 0, Math.PI * 2);
      pointCtx.fillStyle = "#d62728";
      pointCtx.fill();

      pointCtx.lineWidth = basePointStrokeWidth;
      pointCtx.strokeStyle = "white";
      pointCtx.stroke();
    }

    pointCtx.restore();
  }

  function scheduleRedraw({ background = false } = {}) {
    backgroundDirty = backgroundDirty || background;

    if (redrawQueued) return;
    redrawQueued = true;

    requestAnimationFrame(() => {
      redrawQueued = false;

      if (backgroundDirty) {
        drawBackgroundTracks();
        backgroundDirty = false;
      }

      drawDynamicLayer();
      drawPointLayer();
    });
  }

  function updateForTime(t) {
    currentTime = +t;
    timeLabel.textContent = formatTime(currentTime);
    recomputeActivePoints();
    scheduleRedraw({ background: false });
  }

  function findNearestPoint(event) {
    const rect = svg.node().getBoundingClientRect();

    const sx = (event.clientX - rect.left) * width / rect.width;
    const sy = (event.clientY - rect.top) * height / rect.height;

    const [mx, my] = currentTransform.invert([sx, sy]);

    const maxDist = (baseRadius + 8) / currentTransform.k;
    const maxDist2 = maxDist * maxDist;

    let best = null;
    let bestDist2 = maxDist2;

    for (const d of activePoints) {
      const dx = d.pos.x - mx;
      const dy = d.pos.y - my;
      const dist2 = dx * dx + dy * dy;

      if (dist2 < bestDist2) {
        best = d;
        bestDist2 = dist2;
      }
    }

    return best;
  }

  svg.on("mousemove", event => {
    const nearest = findNearestPoint(event);

    if (!nearest) {
      tooltip.style("display", "none");
      return;
    }

    const { flight, pos } = nearest;
    const [tx, ty] = d3.pointer(event, container);

    tooltip
      .style("display", "block")
      .style("left", `${tx + 12}px`)
      .style("top", `${ty + 12}px`)
      .html(`
        <div><b>${flight.callsign || "Unknown callsign"}</b></div>
        <div>ICAO24: ${flight.icao24}</div>
        <div>Origin country: ${flight.origin_country || "Unknown"}</div>
        <div>Airline: ${flight.airline || "Unknown"}</div>
        <div>Airline country: ${flight.country || "Unknown"}</div>
        <div>Altitude: ${Number.isFinite(pos.alt) ? pos.alt.toFixed(0) : "Unknown"} m</div>
        <div>Time: ${formatTime(pos.time)}</div>
      `);
  });

  svg.on("mouseleave", () => {
    tooltip.style("display", "none");
  });

  const zoom = d3.zoom()
    .scaleExtent([1, 12])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("start", () => {
      isZooming = true;
      svg.style("cursor", "grabbing");
      tooltip.style("display", "none");
    })
    .on("zoom", event => {
      currentTransform = event.transform;

      zoomLayer.attr("transform", currentTransform);

      // Redraw sharply during zoom using simplified paths.
      scheduleRedraw({ background: true });
    })
    .on("end", () => {
      isZooming = false;
      svg.style("cursor", "grab");

      // Redraw once with better detail after zooming ends.
      scheduleRedraw({ background: true });
    });

  svg.call(zoom);

  slider.addEventListener("input", event => {
    updateForTime(event.target.value);
  });

  const resizeObserver = new ResizeObserver(() => {
    scheduleRedraw({ background: true });
  });
  resizeObserver.observe(chart);

  timeLabel.textContent = formatTime(currentTime);
  recomputeActivePoints();
  scheduleRedraw({ background: true });

  return container;
}


function _4(md){return(
md`Data source: OpenSky Network

Original from a kepler.gl demo named ["All the Flights in the World"](https://kepler.gl/demo/world_flights)`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["flights4.csv", {url: new URL("./files/5e513b2036bf7088e7380f9bee8d502fa739d80843bd227fe401e2e83222757a55d177900bf67b3057b2f644792eedb43d3d63eeb599a7f2bb1d82fca2818779.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer()).define(["html","d3","FileAttachment","topojson","ResizeObserver"], _3);
  main.variable(observer()).define(["md"], _4);
  return main;
}
