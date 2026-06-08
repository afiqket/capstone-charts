function _1(md){return(
md`# Share of countries testing bacterial infections for antibiotic susceptibility`
)}

function _2(rawData,d3)
{
  const REGIONS = [
    "African Region (WHO)",
    "Eastern Mediterranean (WHO)",
    "European Region (WHO)",
    "Region of the Americas (WHO)",
    "South-East Asia Region (WHO)",
    "Western Pacific Region (WHO)"
  ];
  const REGION_SHORT = {
    "African Region (WHO)":          ["African Region", "(WHO)"],
    "Eastern Mediterranean (WHO)":   ["Eastern Mediterranean", "(WHO)"],
    "European Region (WHO)":         ["European Region", "(WHO)"],
    "Region of the Americas (WHO)":  ["Region of the Americas", "(WHO)"],
    "South-East Asia Region (WHO)":  ["South-East Asia Region", "(WHO)"],
    "Western Pacific Region (WHO)":  ["Western Pacific Region", "(WHO)"]
  };

  const SERIES = [
    { key: "Bloodstream infections",     col: "Bloodstream infections",     color: "#4e79a7" },
    { key: "Gonorrhea infections",       col: "Gonorrhea infections",       color: "#b84c1a" },
    { key: "Gastrointestinal infections",col: "Gastrointestinal infections",color: "#8B6914" },
    { key: "Urinary tract infections",   col: "Urinary tract infections",   color: "#27ae60" }
  ];

  // Parse: deduplicate by region+year
  const seen = new Set();
  const parsed = rawData
    .filter(d => REGIONS.includes(d.Entity))
    .filter(d => {
      const k = d.Entity + "|" + d.Year;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    })
    .map(d => ({
      region: d.Entity,
      year:   +d.Year,
      ...Object.fromEntries(SERIES.map(s => [s.key, d[s.col] != null && d[s.col] !== "" ? +d[s.col] : null]))
    }));

  const byRegion = new Map(REGIONS.map(r => [r, parsed.filter(d => d.region === r).sort((a,b) => a.year - b.year)]));
  const allYears = [...new Set(parsed.map(d => d.year))].sort((a,b) => a-b);
  let currentYear = allYears[allYears.length - 1];
  let mode = "line";
  let playing = false, timer = null;

  // Layout
  const COLS_G = 3, ROWS_G = 2;
  const CW = 280, CH = 200;
  const cm = { top: 28, right: 10, bottom: 28, left: 42 };
  const iW = CW - cm.left - cm.right;
  const iH = CH - cm.top - cm.bottom;
  const PAD_X = 30, PAD_Y = 20;
  const W = COLS_G * CW + (COLS_G - 1) * PAD_X + 40;
  const H_HEADER = 110;
  const H_CHARTS = ROWS_G * CH + (ROWS_G - 1) * PAD_Y;
  const H_FOOTER = 55;
  const H = H_HEADER + H_CHARTS + H_FOOTER;

  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const btnRow = container.append("div").style("display","flex").style("gap","6px").style("margin-bottom","6px");
  const mkBtn = (label, active) => btnRow.append("button").text(label)
    .style("padding","4px 14px").style("border","1px solid #ccc").style("border-radius","4px")
    .style("cursor","pointer").style("font-size","13px")
    .style("background", active ? "#3a6fc4" : "#fff")
    .style("color",      active ? "#fff"    : "#333");

  const btnLine = mkBtn("📈 Line", true);
  const btnBar  = mkBtn("📊 Bar",  false);

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background","#fff");

  const titleEl = svg.append("text").attr("x", 10).attr("y", 22)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");

  svg.append("text").attr("x", 10).attr("y", 38)
    .style("font-size","10px").style("fill","#555")
    .text("Share of countries testing at least 80% of bacterially-confirmed infections for antibiotic susceptibility and reporting this to the WHO.");

  // Leyenda
  let lx = 10;
  SERIES.forEach(s => {
    svg.append("rect").attr("x",lx).attr("y",50).attr("width",14).attr("height",14)
      .attr("fill",s.color).attr("rx",2);
    svg.append("text").attr("x",lx+18).attr("y",61)
      .style("font-size","10.5px").style("fill","#333").text(s.key);
    lx += s.key.length * 6.5 + 30;
  });

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",5).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x",10).attr("y",18)
    .style("font-size","12px").style("font-weight","bold").style("fill","#111");

  function showTooltip(year, row, mx, my) {
    ttTitle.text(year);
    ttG.selectAll(".ttrow").remove();
    SERIES.forEach((s, i) => {
      if (row[s.key] == null) return;
      const g = ttG.append("g").attr("class","ttrow");
      g.append("rect").attr("x",10).attr("y",24+i*16).attr("width",10).attr("height",10)
        .attr("fill",s.color).attr("rx",2);
      g.append("text").attr("x",24).attr("y",33+i*16)
        .style("font-size","10px").style("fill","#333")
        .text(`${s.key}: ${d3.format(".1f")(row[s.key])}%`);
    });
    const ttH = 24 + SERIES.length * 16 + 6;
    const ttW = 240;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 10 > W ? mx - ttW - 6 : mx + 10;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  const chartsG = svg.append("g").attr("transform",`translate(10,${H_HEADER})`);

  function renderCharts() {
    chartsG.selectAll("*").remove();

    REGIONS.forEach((region, idx) => {
      const col = idx % COLS_G;
      const row = Math.floor(idx / COLS_G);
      const ox = col * (CW + PAD_X);
      const oy = row * (CH + PAD_Y);
      const g = chartsG.append("g").attr("transform",`translate(${ox},${oy})`);
      const pts = byRegion.get(region) || [];

      // Título región
      const [rLine1, rLine2] = REGION_SHORT[region] || [region, ""];
      const titleT = g.append("text").attr("x",cm.left).attr("y",10)
        .style("font-size","11px").style("font-weight","bold").style("fill","#222");
      titleT.append("tspan").text(rLine1 + " ");
      titleT.append("tspan").style("font-weight","normal").style("fill","#888").text(rLine2);

      if (mode === "line") {
        const xScale = d3.scaleLinear().domain(d3.extent(allYears)).range([cm.left, cm.left+iW]);
        const yScale = d3.scaleLinear().domain([0,100]).range([cm.top+iH, cm.top]);

        [0,20,40,60,80,100].forEach(v => {
          g.append("line")
            .attr("x1",cm.left).attr("x2",cm.left+iW)
            .attr("y1",yScale(v)).attr("y2",yScale(v))
            .attr("stroke", v===0?"#bbb":"#e8e8e8")
            .attr("stroke-dasharray",v===0?"0":"3,3").attr("stroke-width",1);
          g.append("text").attr("x",cm.left-4).attr("y",yScale(v)).attr("dy","0.35em")
            .style("font-size","8px").style("fill","#aaa").style("text-anchor","end").text(v+"%");
        });

        allYears.filter(y => y%2===0 || y===allYears[0] || y===allYears[allYears.length-1]).forEach(y => {
          g.append("text").attr("x",xScale(y)).attr("y",cm.top+iH+12)
            .style("font-size","8px").style("fill","#aaa").style("text-anchor","middle").text(y);
        });
        g.append("line").attr("x1",cm.left).attr("x2",cm.left+iW)
          .attr("y1",cm.top+iH).attr("y2",cm.top+iH).attr("stroke","#ccc").attr("stroke-width",1);

        SERIES.forEach(s => {
          const validPts = pts.filter(p => p[s.key] != null);
          if (validPts.length < 2) return;
          const lineGen = d3.line().x(p => xScale(p.year)).y(p => yScale(p[s.key])).curve(d3.curveMonotoneX);
          g.append("path").datum(validPts)
            .attr("fill","none").attr("stroke",s.color).attr("stroke-width",1.8).attr("d",lineGen);
          validPts.forEach(p => {
            g.append("circle").attr("cx",xScale(p.year)).attr("cy",yScale(p[s.key]))
              .attr("r",2).attr("fill",s.color);
          });
        });

        const hLine = g.append("line").attr("y1",cm.top).attr("y2",cm.top+iH)
          .attr("stroke","#999").attr("stroke-width",1).style("display","none");
        g.append("rect").attr("x",cm.left).attr("y",cm.top).attr("width",iW).attr("height",iH)
          .attr("fill","transparent")
          .on("mousemove", function(event) {
            const [mx] = d3.pointer(event);
            const yr = Math.round(xScale.invert(mx));
            const r = pts.find(p => p.year === yr);
            if (!r) return;
            hLine.attr("x1",xScale(yr)).attr("x2",xScale(yr)).style("display",null);
            const [sx,sy] = d3.pointer(event, svg.node());
            showTooltip(yr, r, sx, sy);
          })
          .on("mouseleave", () => { hLine.style("display","none"); hideTooltip(); });

      } else {
        const r = pts.find(p => p.year === currentYear);
        if (!r) return;

        const barData = SERIES
          .map(s => ({ key: s.key, val: r[s.key] ?? 0, color: s.color }))
          .filter(d => d.val != null)
          .sort((a,b) => b.val - a.val);

        const xScale = d3.scaleLinear().domain([0, 100]).range([cm.left, cm.left+iW]);
        const yScale = d3.scaleBand()
          .domain(barData.map(d => d.key))
          .range([cm.top, cm.top+iH]).padding(0.25);

        barData.forEach(d => {
          const y  = yScale(d.key);
          const bw = yScale.bandwidth();
          const cy = y + bw/2;

          g.append("rect").attr("x",cm.left).attr("y",y)
            .attr("width",xScale(d.val)-cm.left).attr("height",bw)
            .attr("fill","#6b7fad");

          const words = d.key.split(" ");
          const mid = Math.ceil(words.length/2);
          const line1 = words.slice(0,mid).join(" ");
          const line2 = words.slice(mid).join(" ");
          g.append("text").attr("x",cm.left-4).attr("y",cy-(line2?5:0)).attr("dy","0.35em")
            .style("text-anchor","end").style("font-size","8px").style("font-weight","bold").style("fill","#333")
            .text(line1);
          if (line2) {
            g.append("text").attr("x",cm.left-4).attr("y",cy+7).attr("dy","0.35em")
              .style("text-anchor","end").style("font-size","8px").style("font-weight","bold").style("fill","#333")
              .text(line2);
          }
          g.append("text").attr("x",xScale(d.val)+4).attr("y",cy).attr("dy","0.35em")
            .style("font-size","8.5px").style("fill","#444")
            .text(d3.format(".1f")(d.val)+"%");
        });

        g.append("line").attr("x1",cm.left).attr("x2",cm.left)
          .attr("y1",cm.top).attr("y2",cm.top+iH).attr("stroke","#bbb").attr("stroke-width",1);
      }
    });
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY = H_HEADER + H_CHARTS + 18;
  const sliderX0 = 90, sliderX1 = W - 30;
  const xSlider = d3.scalePoint().domain(allYears).range([sliderX0, sliderX1]);
  const sliderG = svg.append("g");

  const playBtn = sliderG.append("text").attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555").text("▶");

  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(allYears[0]);
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(allYears[allYears.length-1]);
  sliderG.append("line").attr("x1",sliderX0).attr("x2",sliderX1)
    .attr("y1",sliderY).attr("y2",sliderY)
    .attr("stroke","#ccc").attr("stroke-width",4).attr("stroke-linecap","round");

  const handle = sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","pointer");

  function updateYear(y) {
    currentYear = y;
    handle.attr("cx", xSlider(y));
    if (mode === "bar") { titleEl.text(`Share of countries testing bacterial infections for antibiotic susceptibility, ${currentYear}`); renderCharts(); }
  }
  updateYear(currentYear);

  sliderG.append("rect").attr("x",sliderX0).attr("y",sliderY-12)
    .attr("width",sliderX1-sliderX0).attr("height",24)
    .attr("fill","transparent").style("cursor","pointer")
    .on("click", function(event) {
      const [mx] = d3.pointer(event);
      updateYear(allYears.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
    });

  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    updateYear(allYears.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
  }));

  playBtn.on("click", () => {
    if (playing) { clearInterval(timer); playing=false; playBtn.text("▶"); }
    else {
      if (currentYear===allYears[allYears.length-1]) updateYear(allYears[0]);
      playing=true; playBtn.text("⏸");
      timer=setInterval(()=>{
        const idx=allYears.indexOf(currentYear);
        if(idx<allYears.length-1) updateYear(allYears[idx+1]);
        else{clearInterval(timer);playing=false;playBtn.text("▶");}
      },600);
    }
  });

  // ── Mode switching ────────────────────────────────────────────────────────
  function setMode(m) {
    mode = m;
    btnLine.style("background",m==="line"?"#3a6fc4":"#fff").style("color",m==="line"?"#fff":"#333");
    btnBar .style("background",m==="bar" ?"#3a6fc4":"#fff").style("color",m==="bar" ?"#fff":"#333");
    sliderG.style("display",m==="line"?"none":null);
    titleEl.text(m==="line"
      ? "Share of countries testing bacterial infections for antibiotic susceptibility"
      : `Share of countries testing bacterial infections for antibiotic susceptibility, ${currentYear}`);
    hideTooltip();
    renderCharts();
  }
  btnLine.on("click",()=>setMode("line"));
  btnBar .on("click",()=>setMode("bar"));

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",10).attr("y",H-14)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",90).attr("y",H-14)
    .style("font-size","10.5px").style("fill","#333")
    .text("World Health Organization (2024) – processed by Our World in Data");
  svg.append("text").attr("x",W-10).attr("y",H-14)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/antibiotics | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("share-of-countries-testing-confirmed-bacterial-infections-for-antibiotic-susceptibility.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["share-of-countries-testing-confirmed-bacterial-infections-for-antibiotic-susceptibility.csv", {url: new URL("./files/86cfbce86d195d2a041bb4c50a6ffc4a4953dc280c277b250f61ccb05b9a218cf541e474824487f9fac3521f9770840e88e051eaa571f994798838ec1208a926.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
