function _1(md){return(
md`# Share of countries that have had a woman as leader`
)}

function _2(rawData,d3)
{
  const W = 960, H = 560;
  const margin = { top: 100, right: 20, bottom: 80, left: 165 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const colA = "Any woman chief executive";
  const colD = "Democratically-elected woman chief executive";

  const seriesDef = [
    { key: colA, label: "Any woman chief executive",                    color: "#b85a38" },
    { key: colD, label: "Democratically-elected woman chief executive", color: "#6a7fb5" }
  ];

  // Filter World only
  const worldData = rawData.filter(d => d.Entity === "World" && d.Year != null);
  const allYears = worldData.map(d => +d.Year).sort((a,b) => a-b);
  let currentYear = Math.max(...allYears);
  let playing = false, timer = null;
  let viewMode = "line";

  // ── Container ─────────────────────────────────────────────────────────────
  const container = d3.create("div")
    .style("font-family", "sans-serif")
    .style("user-select", "none")
    .style("position", "relative");

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background", "#fff");

  // Title
  const titleEl = svg.append("text")
    .attr("x", margin.left).attr("y", 28)
    .style("font-size", "20px").style("font-weight", "bold").style("fill", "#111");

  // Subtitle
  svg.append("text")
    .attr("x", margin.left).attr("y", 46)
    .style("font-size", "10.5px").style("fill", "#555")
    .text("Share of current countries that have had a woman as chief executive since 1789.");

  // ── View toggle buttons ───────────────────────────────────────────────────
  const btnY = 62, btnH = 22;
  const btnDefs = [
    { label: "Line", mode: "line", x: margin.left },
    { label: "Bar",  mode: "bar",  x: margin.left + 62 }
  ];
  const btnGs = btnDefs.map(b => {
    const g = svg.append("g").style("cursor", "pointer");
    const rect = g.append("rect")
      .attr("x", b.x).attr("y", btnY).attr("width", 56).attr("height", btnH)
      .attr("rx", 4).attr("fill", "#f0f0f0").attr("stroke", "#ccc").attr("stroke-width", 1);
    g.append("text")
      .attr("x", b.x + 28).attr("y", btnY + 14)
      .style("font-size", "11px").style("text-anchor", "middle").style("fill", "#333")
      .text(b.label);
    g.on("click", () => { viewMode = b.mode; updateView(); });
    return { rect, mode: b.mode };
  });

  function styleButtons() {
    btnGs.forEach(({ rect, mode }) => {
      rect.attr("fill", mode === viewMode ? "#dce8f5" : "#f0f0f0")
          .attr("stroke", mode === viewMode ? "#4472c4" : "#ccc");
    });
  }

  const mainG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // ── Scales ────────────────────────────────────────────────────────────────
  const xScaleLine = d3.scaleLinear()
    .domain([d3.min(allYears), d3.max(allYears)])
    .range([0, innerW]);
  const yScale = d3.scaleLinear().domain([0, 47]).range([innerH, 0]);

  // ── Gridlines ────────────────────────────────────────────────────────────
  const gridG = mainG.append("g");
  [0, 5, 10, 15, 20, 25, 30, 35, 40, 45].forEach(v => {
    gridG.append("line")
      .attr("x1", 0).attr("x2", innerW)
      .attr("y1", yScale(v)).attr("y2", yScale(v))
      .attr("stroke", v === 0 ? "#bbb" : "#e0e0e0")
      .attr("stroke-dasharray", v === 0 ? "0" : "4,3")
      .attr("stroke-width", 1);
    gridG.append("text")
      .attr("x", -8).attr("y", yScale(v)).attr("dy", "0.35em")
      .style("font-size", "10px").style("fill", "#888").style("text-anchor", "end")
      .text(`${v}%`);
  });
  mainG.append("line").attr("x1",0).attr("x2",innerW).attr("y1",innerH).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);
  mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);

  // ── X axis ticks ──────────────────────────────────────────────────────────
  const xAxisG = mainG.append("g");
  [1789, 1850, 1900, 1950, 2025].forEach(y => {
    xAxisG.append("text")
      .attr("x", xScaleLine(y)).attr("y", innerH + 18)
      .style("font-size", "10px").style("fill", "#888").style("text-anchor", "middle")
      .text(y);
  });

  // ── Line chart elements ───────────────────────────────────────────────────
  const lineG  = mainG.append("g");
  const dotsG  = mainG.append("g");
  const endLabG = svg.append("g"); // end-of-line labels (outside mainG for space)

  // Línea vertical cursor + dots hover
  const cursorLine = mainG.append("line")
    .attr("y1",0).attr("y2",innerH)
    .attr("stroke","#ccc").attr("stroke-width",1)
    .style("display","none").style("pointer-events","none");
  const hoverDots = seriesDef.map(s =>
    mainG.append("circle").attr("r",5).attr("fill","white").attr("stroke-width",2)
      .attr("stroke", s.color).style("display","none").style("pointer-events","none")
  );

  // ── Bar chart elements ────────────────────────────────────────────────────
  const barG = mainG.append("g");

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.12))");
  const ttYear = ttG.append("text").attr("x",14).attr("y",26)
    .style("font-size","14px").style("font-weight","bold").style("fill","#111");
  const ttRows = ttG.append("g").attr("transform","translate(0,34)");
  ttG.append("text").attr("x",14).attr("y",120)
    .style("font-size","10px").style("fill","#aaa").style("font-style","italic")
    .text("Values are rounded to 2 significant figures");

  function showTT(year, vals, mx, my) {
    ttYear.text(year);
    ttRows.selectAll("*").remove();
    const rowH = 28;
    seriesDef.forEach((s, i) => {
      const v = vals[s.key];
      const g = ttRows.append("g").attr("transform",`translate(0,${i*rowH})`);
      g.append("rect").attr("x",14).attr("y",3).attr("width",14).attr("height",14)
        .attr("rx",2).attr("fill", s.color);
      g.append("text").attr("x",34).attr("y",14)
        .style("font-size","12px").style("fill","#111")
        .text(s.label);
      if (v != null) {
        g.append("text").attr("x",420).attr("y",14)
          .style("font-size","12px").style("font-weight","bold").style("fill","#111")
          .style("text-anchor","end")
          .text(`${Math.round(v)}%`);
      }
    });
    const ttW = 440, ttH = 130;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 14;
    const ty = Math.max(0, Math.min(my - ttH/2, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTT() {
    ttG.style("display","none");
    cursorLine.style("display","none");
    hoverDots.forEach(d => d.style("display","none"));
  }

  // ── Draw line ─────────────────────────────────────────────────────────────
  function drawLine() {
    lineG.style("display",null);
    dotsG.style("display",null);
    xAxisG.style("display",null);
    barG.style("display","none");
    endLabG.style("display",null);
    gridG.select("*").style("display",null);

    const lineFn = d3.line()
      .x(d => xScaleLine(d.year))
      .y(d => yScale(d.value))
      .defined(d => d.value != null);

    seriesDef.forEach(s => {
      const data = worldData
        .filter(d => d[s.key] != null && d[s.key] !== "")
        .map(d => ({ year: +d.Year, value: +d[s.key] }))
        .sort((a,b) => a.year - b.year);

      lineG.selectAll(`path.line-${s.key.replace(/\s/g,"_")}`).data([data])
        .join("path")
        .attr("class", `line-${s.key.replace(/\s/g,"_")}`)
        .attr("fill","none")
        .attr("stroke", s.color)
        .attr("stroke-width", 2)
        .attr("d", lineFn);

      // Dots (every year has a point — use small)
      dotsG.selectAll(`circle.dot-${s.key.replace(/\s/g,"_")}`).data(data)
        .join("circle")
        .attr("class",`dot-${s.key.replace(/\s/g,"_")}`)
        .attr("cx", d => xScaleLine(d.year))
        .attr("cy", d => yScale(d.value))
        .attr("r", 2)
        .attr("fill", s.color)
        .attr("opacity", 0.7);

      // End label
      const last = data[data.length - 1];
      if (last) {
        const ex = margin.left + xScaleLine(last.year) + 8;
        const ey = margin.top + yScale(last.value);
        endLabG.selectAll(`text.endlabel-${s.key.replace(/\s/g,"_")}`).data([last])
          .join("text")
          .attr("class",`endlabel-${s.key.replace(/\s/g,"_")}`)
          .attr("x", ex).attr("y", ey)
          .style("font-size","11px").style("font-weight","bold")
          .style("fill", s.color)
          .text(s.label);
      }
    });

    // Hover overlay
    mainG.select(".line-hover").remove();
    mainG.append("rect")
      .attr("class","line-hover")
      .attr("width",innerW).attr("height",innerH)
      .attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx, my] = d3.pointer(event);
        const year = Math.round(xScaleLine.invert(mx));
        const snapped = allYears.reduce((a,b) =>
          Math.abs(a-year)<Math.abs(b-year)?a:b);
        const row = worldData.find(d => +d.Year === snapped);
        if (!row) return hideTT();

        // Update cursor line + hover dots
        cursorLine.attr("x1",xScaleLine(snapped)).attr("x2",xScaleLine(snapped))
          .style("display",null);
        seriesDef.forEach((s,i) => {
          const v = row[s.key];
          if (v != null) {
            hoverDots[i].attr("cx",xScaleLine(snapped)).attr("cy",yScale(+v))
              .style("display",null);
          }
        });

        const vals = {};
        seriesDef.forEach(s => { vals[s.key] = row[s.key] != null ? +row[s.key] : null; });
        const [sx,sy] = d3.pointer(event, svg.node());
        showTT(snapped, vals, sx, sy);
      })
      .on("mouseleave", hideTT);
  }

  // ── Draw bar ──────────────────────────────────────────────────────────────
  function drawBar() {
    lineG.style("display","none");
    dotsG.style("display","none");
    xAxisG.style("display","none");
    endLabG.style("display","none");
    barG.style("display",null);
    mainG.select(".line-hover").remove();
    hideTT();

    const row = worldData.reduce((best, d) =>
      Math.abs(+d.Year - currentYear) < Math.abs(+best.Year - currentYear) ? d : best
    );

    barG.selectAll("*").remove();

    const xBar = d3.scaleLinear().domain([0, 50]).range([0, innerW - 50]);
    const barH = 80, barGap = 60;

    // Light vertical gridlines
    [0,10,20,30,40,50].forEach(v => {
      barG.append("line")
        .attr("x1",xBar(v)).attr("x2",xBar(v))
        .attr("y1",-10).attr("y2",(barH+barGap)*seriesDef.length)
        .attr("stroke","#e8e8e8").attr("stroke-width",1);
    });

    seriesDef.forEach((s, i) => {
      const val = row[s.key] != null ? +row[s.key] : 0;
      const y = i * (barH + barGap) + 20;

      // Label left (wrapped via foreignObject)
      barG.append("foreignObject")
        .attr("x", -margin.left).attr("y", y + barH/2 - 20)
        .attr("width", margin.left - 8).attr("height", 40)
        .append("xhtml:div")
        .style("font-size","12px").style("font-weight","bold").style("color","#333")
        .style("text-align","right").style("line-height","1.3")
        .text(s.label);

      // Bar
      barG.append("rect")
        .attr("x",0).attr("y",y)
        .attr("width", xBar(val)).attr("height", barH)
        .attr("fill", s.color).attr("rx",2);

      // Value
      barG.append("text")
        .attr("x", xBar(val)+8).attr("y", y+barH/2).attr("dy","0.35em")
        .style("font-size","13px").style("fill","#333")
        .text(`${Math.round(val)}%`);
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────
  function updateView() {
    styleButtons();
    if (viewMode === "line") drawLine();
    else drawBar();
  }

  // ── Year slider ───────────────────────────────────────────────────────────
  const sliderY  = H - 50;
  const sliderX0 = 90, sliderX1 = W - 60;
  const xSlider  = d3.scalePoint().domain(allYears).range([sliderX0, sliderX1]);
  const sliderG  = svg.append("g");

  const playBtn = sliderG.append("text")
    .attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555")
    .text("▶");

  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle")
    .text(allYears[0]);
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle")
    .text(allYears[allYears.length-1]);
  sliderG.append("line")
    .attr("x1",sliderX0).attr("x2",sliderX1)
    .attr("y1",sliderY).attr("y2",sliderY)
    .attr("stroke","#ccc").attr("stroke-width",4).attr("stroke-linecap","round");

  const handle = sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","pointer");

  function updateYear(y) {
    currentYear = y;
    handle.attr("cx", xSlider(y));
    if (viewMode === "line") {
      titleEl.text("Share of countries that have had a woman as leader");
    } else {
      titleEl.text(`Share of countries that have had a woman as leader, ${y}`);
      drawBar();
    }
  }
  updateYear(currentYear);

  sliderG.append("rect")
    .attr("x",sliderX0).attr("y",sliderY-12)
    .attr("width",sliderX1-sliderX0).attr("height",24)
    .attr("fill","transparent").style("cursor","pointer")
    .on("click", function(event) {
      const [mx] = d3.pointer(event);
      updateYear(allYears.reduce((a,b) =>
        Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
    });

  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    updateYear(allYears.reduce((a,b) =>
      Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
  }));

  playBtn.on("click", () => {
    if (playing) {
      clearInterval(timer); playing=false; playBtn.text("▶");
    } else {
      if (currentYear===allYears[allYears.length-1]) updateYear(allYears[0]);
      playing=true; playBtn.text("⏸");
      timer = setInterval(() => {
        const idx = allYears.indexOf(currentYear);
        if (idx<allYears.length-1) updateYear(allYears[idx+1]);
        else { clearInterval(timer); playing=false; playBtn.text("▶"); }
      }, 700);
    }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-28)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333")
    .text("Data source: ");
  svg.append("text").attr("x",margin.left+82).attr("y",H-28)
    .style("font-size","10.5px").style("fill","#333")
    .text("V-Dem (2026) – processed by Our World in Data");
  svg.append("foreignObject")
    .attr("x",margin.left).attr("y",H-20)
    .attr("width",W-margin.left-20).attr("height",18)
    .append("xhtml:div")
    .style("font-size","10px").style("color","#555")
    .html("<strong>Note:</strong> The chief executive is the head of government (such as Germany's Angela Merkel) or the head of state (such as Argentina's Cristina Fernández de Kirchner), whoever has more power. Democracies as identified by V-Dem's 'Regimes of the World' classification.");
  svg.append("text").attr("x",W-10).attr("y",H-4)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/women-rights | CC BY");

  updateView();
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("share-of-countries-that-have-had-a-woman-as-leader.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["share-of-countries-that-have-had-a-woman-as-leader.csv", {url: new URL("./files/892527e22ee063cfc9c87151c142008625f144f2fb1a8e98238d59cc4ec10f2cfc1509e7842e74e65ef2139b4e1c20923313cf8784aa1f62748ce266f13f02b9.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
