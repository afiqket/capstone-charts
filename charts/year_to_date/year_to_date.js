function _1(md){return(
md`# Year-to-date`
)}

async function _2(FileAttachment,html)
{
  const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");

  const PLAY_DURATION_MS = 20000;

  const csvText = await FileAttachment("year_to_date.csv").text();
  const raw = d3.csvParse(csvText);

  const clean = v => String(v ?? "").replace(/^\uFEFF/, "").trim();

  function get(row, name) {
    const key = Object.keys(row).find(
      k => clean(k).toLowerCase() === name.toLowerCase()
    );
    return key ? row[key] : "";
  }

  const parseDate = d3.timeParse("%Y-%m-%d");
  const formatDate = d3.timeFormat("%d %b %Y");

  const allRows = raw
    .map(row => ({
      dateKey: clean(get(row, "Date")),
      date: parseDate(clean(get(row, "Date"))),
      asset: clean(get(row, "asset")),
      label: clean(get(row, "Label")),
      value: +clean(get(row, "Value")),
      size: +clean(get(row, "Size"))
    }))
    .filter(d => d.date && d.asset && Number.isFinite(d.value));

  // The actual current market position rows.
  // In this CSV, these are Label = Price move year-to-date and Size = 10.
  let currentRows = allRows.filter(
    d =>
      d.label.toLowerCase() === "price move year-to-date" ||
      d.size > 0
  );

  // Safety fallback: if Label parsing somehow fails, use Size > 0.
  if (!currentRows.length) {
    currentRows = allRows.filter(d => d.size > 0);
  }

  const wantedOrder = [
    "Gold",
    "European Stocks",
    "China Large Cap Stocks",
    "Bitcoin",
    "Emerging Market Stocks",
    "US 10-year Bonds",
    "Nvidia",
    "US Large Cap Stocks",
    "US dollar",
    "US Small Cap Stocks",
    "Tesla",
    "Crude Oil"
  ];

  const assetSet = new Set(currentRows.map(d => d.asset));

  const assetOrder = wantedOrder
    .filter(asset => assetSet.has(asset))
    .concat([...assetSet].filter(asset => !wantedOrder.includes(asset)));

  const dateKeys = [...new Set(currentRows.map(d => d.dateKey))]
    .sort(d3.ascending);

  const valueByDateAsset = d3.rollup(
    currentRows,
    v => v[0].value,
    d => d.dateKey,
    d => d.asset
  );

  const running = new Map(
    assetOrder.map(asset => [
      asset,
      {
        value: 0,
        min: 0,
        max: 0
      }
    ])
  );

  let frames = dateKeys
    .map(dateKey => {
      const values = new Map();

      for (const asset of assetOrder) {
        const previous = running.get(asset);

        const value =
          valueByDateAsset.get(dateKey)?.get(asset) ?? previous.value;

        previous.value = value;
        previous.min = Math.min(previous.min, value);
        previous.max = Math.max(previous.max, value);

        values.set(asset, {
          asset,
          value,
          min: previous.min,
          max: previous.max
        });
      }

      return {
        dateKey,
        date: parseDate(dateKey),
        values
      };
    })
    .filter(d => d.date);

  // Skip the all-zero first day.
  const firstNonZero = frames.findIndex(frame =>
    assetOrder.some(asset => Math.abs(frame.values.get(asset).value) > 1e-9)
  );

  if (firstNonZero > 0) {
    frames = frames.slice(firstNonZero);
  }

  if (!frames.length || !assetOrder.length) {
    return html`
      <div style="font-family:sans-serif; padding:20px;">
        <b>No drawable data found.</b><br>
        Parsed rows: ${allRows.length}<br>
        Current rows: ${currentRows.length}<br>
        Assets: ${assetOrder.length}<br>
        Dates: ${dateKeys.length}<br><br>
        Expected CSV columns: Date, asset, Label, Value, Size.
      </div>
    `;
  }

  const width = 1040;
  const height = 430;

  const margin = {
    top: 18,
    right: 50,
    bottom: 48,
    left: 280
  };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const pink = "#ef4f93";
  const grey = "#a9aeb4";
  const dark = "#303840";
  const muted = "#69737b";
  const grid = "#d7d7d7";

  const root = d3
    .create("div")
    .style("width", `${width}px`)
    .style("font-family", `"Inter", "Arial", sans-serif`)
    .style("background", "white")
    .style("color", dark);

  root.append("style").text(`
    .title {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 1px;
      margin-bottom: 10px;
      line-height: 1.1;
    }

    .title .pink {
      color: ${pink};
    }

    .subtitle {
      font-size: 24px;
      margin-bottom: 18px;
    }

    .legend {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      margin-bottom: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .pink-swatch {
      width: 20px;
      height: 20px;
      background: ${pink};
    }

    .range-swatch {
      width: 100px;
      height: 20px;
      background: ${grey};
      margin-left: 16px;
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: 280px;
      margin-bottom: 6px;
    }

    .play-button {
      border: none;
      background: transparent;
      color: ${dark};
      font-size: 25px;
      font-weight: 900;
      cursor: pointer;
      width: 28px;
      height: 28px;
      padding: 0;
      line-height: 1;
    }

    .date-label {
      font-size: 27px;
      font-weight: 800;
      letter-spacing: 2px;
      min-width: 230px;
    }

    .axis text {
      fill: ${muted};
      font-size: 20px;
    }

    .axis path,
    .axis line {
      display: none;
    }

    .asset-label {
      fill: ${muted};
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }

    .value-label {
      fill: ${dark};
      font-size: 12px;
      font-weight: 800;
      paint-order: stroke;
      stroke: white;
      stroke-width: 4px;
      stroke-linejoin: round;
    }
  `);

  root.append("div")
    .attr("class", "title")
    .html(`Whiplash in the <span class="pink">markets</span>: can your eyes keep up?`);

  root.append("div")
    .attr("class", "subtitle")
    .text("Selected asset price movements.");

  const legend = root.append("div").attr("class", "legend");

  legend.append("div")
    .attr("class", "legend-item")
    .html(`<div class="pink-swatch"></div><div>2025-to-date</div>`);

  legend.append("div")
    .attr("class", "legend-item")
    .html(`<div class="range-swatch"></div><div>Range</div>`);

  const controls = root.append("div").attr("class", "controls");

  const playButton = controls
    .append("button")
    .attr("class", "play-button")
    .text("▶");

  const sliderWidth = 325;
  const sliderHeight = 28;
  const sliderPad = 12;

  const sliderSvg = controls
    .append("svg")
    .attr("width", sliderWidth)
    .attr("height", sliderHeight)
    .style("overflow", "visible")
    .style("cursor", "pointer");

  const maxT = frames.length - 1;

  const sliderScale = d3.scaleLinear()
    .domain([0, maxT])
    .range([sliderPad, sliderWidth - sliderPad]);

  sliderSvg.append("line")
    .attr("x1", sliderScale.range()[0])
    .attr("x2", sliderScale.range()[1])
    .attr("y1", sliderHeight / 2)
    .attr("y2", sliderHeight / 2)
    .attr("stroke", "#dddddd")
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

  const handle = sliderSvg.append("circle")
    .attr("r", 11)
    .attr("cy", sliderHeight / 2)
    .attr("fill", "#444");

  const dateLabel = controls.append("div")
    .attr("class", "date-label");

  const svg = root.append("svg")
    .attr("width", width)
    .attr("height", height);

  const plot = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([-0.5, 0.4])
    .range([0, innerWidth]);

  const y = d3.scaleBand()
    .domain(assetOrder)
    .range([0, innerHeight])
    .paddingInner(0.42)
    .paddingOuter(0.12);

  const rangeHeight = 16;
  const squareSize = 16;

  const rowsG = plot.selectAll(".asset-row")
    .data(assetOrder)
    .join("g")
    .attr("class", "asset-row")
    .attr("transform", d => `translate(0,${y(d)})`);

  rowsG.append("line")
    .attr("x1", 0)
    .attr("x2", innerWidth)
    .attr("y1", y.bandwidth() / 2)
    .attr("y2", y.bandwidth() / 2)
    .attr("stroke", grid)
    .attr("stroke-width", 1.5);

  rowsG.append("text")
    .attr("class", "asset-label")
    .attr("x", -12)
    .attr("y", y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .text(d => d);

  rowsG.append("rect")
    .attr("class", "range-rect")
    .attr("height", rangeHeight)
    .attr("y", y.bandwidth() / 2 - rangeHeight / 2)
    .attr("fill", grey);

  rowsG.append("rect")
    .attr("class", "current-square")
    .attr("width", squareSize)
    .attr("height", squareSize)
    .attr("y", y.bandwidth() / 2 - squareSize / 2)
    .attr("fill", pink);

  rowsG.append("text")
    .attr("class", "value-label")
    .attr("y", y.bandwidth() / 2)
    .attr("dy", "0.35em");

  plot.append("line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y1", -2)
    .attr("y2", innerHeight + 2)
    .attr("stroke", "#555")
    .attr("stroke-width", 1.5);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},${margin.top + innerHeight + 12})`)
    .call(
      d3.axisBottom(x)
        .tickValues(d3.range(-0.5, 0.41, 0.1))
        .tickFormat(d3.format(".0%"))
    );

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function formatPercent(value) {
    let pct = Math.round(value * 1000) / 10;
    if (Math.abs(pct) < 0.05) pct = 0;

    const whole = Math.abs(pct - Math.round(pct)) < 1e-9;
    return `${whole ? d3.format(".0f")(pct) : d3.format(".1f")(pct)}%`;
  }

  function stateAt(t) {
    t = clamp(Number.isFinite(t) ? t : 0, 0, maxT);

    const i0 = clamp(Math.floor(t), 0, maxT);
    const i1 = clamp(i0 + 1, 0, maxT);
    const alpha = t - i0;

    const byAsset = new Map();

    for (const asset of assetOrder) {
      const d0 = frames[i0].values.get(asset);
      const d1 = frames[i1].values.get(asset);

      byAsset.set(asset, {
        asset,
        value: lerp(d0.value, d1.value, alpha),
        min: lerp(d0.min, d1.min, alpha),
        max: lerp(d0.max, d1.max, alpha)
      });
    }

    const dateIndex = clamp(Math.round(t), 0, maxT);

    return {
      date: frames[dateIndex].date,
      byAsset
    };
  }

  function update(t) {
    t = clamp(Number.isFinite(t) ? t : 0, 0, maxT);

    const state = stateAt(t);

    rowsG.each(function(asset) {
      const d = state.byAsset.get(asset);
      const g = d3.select(this);

      const minX = x(d.min);
      const maxX = x(d.max);
      const valueX = x(d.value);

      g.select(".range-rect")
        .attr("x", Math.min(minX, maxX))
        .attr("width", Math.max(0, Math.abs(maxX - minX)))
        .attr("opacity", Math.abs(d.max - d.min) < 1e-9 ? 0 : 1);

      g.select(".current-square")
        .attr("x", valueX - squareSize / 2);

    const labelGap = squareSize / 2 + 5;
    
    g.select(".value-label")
      .attr("x", valueX + labelGap)
      .attr("text-anchor", "start")
      .text(formatPercent(d.value));
        });

    handle.attr("cx", sliderScale(t));
    dateLabel.text(formatDate(state.date));
  }

  let currentT = 0;
  let playing = false;
  let raf = null;

  function pause() {
    playing = false;

    if (raf) {
      cancelAnimationFrame(raf);
    }

    raf = null;
    playButton.text("▶");
  }

  function play() {
    if (currentT >= maxT) {
      currentT = 0;
      update(currentT);
    }

    playing = true;
    playButton.text("⏸︎");

    const startT = currentT;
    const endT = maxT;
    const startTime = performance.now();

    const duration =
      PLAY_DURATION_MS * ((endT - startT) / Math.max(1, endT));

    function tick(now) {
      if (!playing) return;

      const p = clamp((now - startTime) / duration, 0, 1);
      currentT = startT + p * (endT - startT);

      update(currentT);

      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        currentT = endT;
        update(currentT);
        pause();
      }
    }

    raf = requestAnimationFrame(tick);
  }

  playButton.on("click", () => {
    playing ? pause() : play();
  });

  function setFromPointer(event) {
    const [mx] = d3.pointer(event, sliderSvg.node());
    const xPos = clamp(mx, sliderScale.range()[0], sliderScale.range()[1]);
    currentT = clamp(sliderScale.invert(xPos), 0, maxT);
    update(currentT);
  }

  sliderSvg.on("click", event => {
    pause();
    setFromPointer(event);
  });

  sliderSvg.call(
    d3.drag()
      .on("start", event => {
        pause();
        setFromPointer(event);
      })
      .on("drag", event => {
        setFromPointer(event);
      })
  );

  update(0);

  return root.node();
}


function _3(md){return(
md`[Original](https://flourish.studio/examples/?q=Year-to-date) by Scott Barber (@scottb) on Flourish `
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["year_to_date.csv", {url: new URL("./files/02d517bdf81be46c30b25c0665d9fb0dd985679b44a5db1a6cafb462bddde25e9501c8be28904f51bb4f92302e9fdd7c4515b29e96a5b92fd4b0535605fbe89b.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","html"], _2);
  main.variable(observer()).define(["md"], _3);
  return main;
}
