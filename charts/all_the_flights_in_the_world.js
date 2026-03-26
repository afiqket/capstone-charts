function _1(md){return(
md`# All the Flights in the World`
)}

function _2(md){return(
md`Two hours of flight data collected by OpenSky Network on September 3rd 2019`
)}

async function _3(html,d3,FileAttachment,topojson)
{
  const width = 1100;
  const height = 600;

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

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto")
    .style("background", "#f8f8f8")
    .style("cursor", "grab");

  container.appendChild(svg.node());

  const rows = await FileAttachment("flights3.csv").csv();

  const flights = rows.map(row => {
    const feature = JSON.parse(row._geojson);
    const coords = feature.geometry.coordinates.map(d => ({
      lon: +d[0],
      lat: +d[1],
      alt: +d[2],
      time: +d[3]
    }));

    return {
      ...row,
      feature,
      coords,
      icao24: row.icao24,
      origin_country: row.origin_country,
      callsign: row.callsign,
      airline: row.airline,
      country: row.country,
      startTime: d3.min(coords, d => d.time),
      endTime: d3.max(coords, d => d.time)
    };
  });

  const allTimes = flights.flatMap(f => f.coords.map(d => d.time));
  const minTime = d3.min(allTimes);
  const maxTime = d3.max(allTimes);

  slider.min = minTime;
  slider.max = maxTime;
  slider.value = minTime;
  slider.step = 40;

  const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
  const countries = topojson.feature(world, world.objects.countries);

  const projection = d3.geoNaturalEarth1()
    .fitSize([width, height], countries);

  const path = d3.geoPath(projection);

  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#eef5ff");

  const zoomLayer = svg.append("g");
  const mapLayer = zoomLayer.append("g");
  const bgTrackLayer = zoomLayer.append("g");
  const trailLayer = zoomLayer.append("g");
  const pointLayer = zoomLayer.append("g");

  mapLayer.selectAll("path")
    .data(countries.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "#e6e6e6")
    .attr("stroke", "#999")
    .attr("stroke-width", 0.5);

  const line = d3.line()
    .x(d => projection([d.lon, d.lat])[0])
    .y(d => projection([d.lon, d.lat])[1]);

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

  let currentZoomK = 1;
  const baseRadius = 3.5;
  const basePointStrokeWidth = 0.8;
  const baseBgTrackWidth = 1;
  const baseTrailWidth = 1.5;

  function getPositionAtTime(coords, t) {
    if (!coords.length) return null;
    if (t < coords[0].time || t > coords[coords.length - 1].time) return null;

    let i = d3.bisector(d => d.time).right(coords, t) - 1;
    i = Math.max(0, Math.min(i, coords.length - 2));

    const a = coords[i];
    const b = coords[i + 1];

    if (t === a.time) return a;
    if (!b || b.time === a.time) return a;

    const p = (t - a.time) / (b.time - a.time);

    return {
      lon: a.lon + (b.lon - a.lon) * p,
      lat: a.lat + (b.lat - a.lat) * p,
      alt: a.alt + (b.alt - a.alt) * p,
      time: t
    };
  }

  function getTrailUntil(coords, t) {
    if (!coords.length || t < coords[0].time) return [];
    if (t >= coords[coords.length - 1].time) return coords;

    const before = coords.filter(d => d.time <= t);
    const current = getPositionAtTime(coords, t);

    if (!current) return before;
    const last = before[before.length - 1];

    if (!last || last.time !== current.time) return [...before, current];
    return before;
  }

  function formatTime(ts) {
    return new Date(ts * 1000).toUTCString();
  }

  function update(t) {
    t = +t;
    timeLabel.textContent = formatTime(t);

    const activeFlights = flights
      .map(f => {
        const pos = getPositionAtTime(f.coords, t);
        return pos ? { ...f, pos, trail: getTrailUntil(f.coords, t) } : null;
      })
      .filter(Boolean);

    bgTrackLayer.selectAll("path")
      .data(flights, d => d.icao24)
      .join("path")
      .attr("d", d => line(d.coords))
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-width", baseBgTrackWidth / currentZoomK)
      .attr("opacity", 0.18);

    trailLayer.selectAll("path")
      .data(activeFlights, d => d.icao24)
      .join("path")
      .attr("d", d => line(d.trail))
      .attr("fill", "none")
      .attr("stroke", "#1f77b4")
      .attr("stroke-width", baseTrailWidth / currentZoomK)
      .attr("opacity", 0.7);

    pointLayer.selectAll("circle")
      .data(activeFlights, d => d.icao24)
      .join("circle")
      .attr("cx", d => projection([d.pos.lon, d.pos.lat])[0])
      .attr("cy", d => projection([d.pos.lon, d.pos.lat])[1])
      .attr("r", baseRadius / currentZoomK)
      .attr("fill", "#d62728")
      .attr("stroke", "white")
      .attr("stroke-width", basePointStrokeWidth / currentZoomK)
      .on("mouseenter", function(event, d) {
        tooltip.style("display", "block").html(`
          <div><b>${d.callsign || "Unknown callsign"}</b></div>
          <div>ICAO24: ${d.icao24}</div>
          <div>Origin country: ${d.origin_country}</div>
          <div>Airline: ${d.airline}</div>
          <div>Airline country: ${d.country}</div>
          <div>Altitude: ${d.pos.alt.toFixed(0)} m</div>
          <div>Time: ${formatTime(d.pos.time)}</div>
        `);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", `${event.offsetX + 12}px`)
          .style("top", `${event.offsetY + 12}px`);
      })
      .on("mouseleave", function() {
        tooltip.style("display", "none");
      });
  }

  const zoom = d3.zoom()
    .scaleExtent([1, 12])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("start", () => svg.style("cursor", "grabbing"))
    .on("end", () => svg.style("cursor", "grab"))
    .on("zoom", (event) => {
      currentZoomK = event.transform.k;
      zoomLayer.attr("transform", event.transform);

      bgTrackLayer.selectAll("path")
        .attr("stroke-width", baseBgTrackWidth / currentZoomK);

      trailLayer.selectAll("path")
        .attr("stroke-width", baseTrailWidth / currentZoomK);

      pointLayer.selectAll("circle")
        .attr("r", baseRadius / currentZoomK)
        .attr("stroke-width", basePointStrokeWidth / currentZoomK);
    });

  svg.call(zoom);

  slider.addEventListener("input", e => update(e.target.value));

  update(minTime);

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
    ["flights3.csv", {url: new URL("./files/400fecb5a57d58f2b15aa2317af59af9dda127554cc33342423e2520152d6dc80d6c609a66db76e87c0d4563ba365b63c0299fa28ef3939a758ea83fb4538faf.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer()).define(["html","d3","FileAttachment","topojson"], _3);
  main.variable(observer()).define(["md"], _4);
  return main;
}
