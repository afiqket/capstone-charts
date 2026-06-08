function _1(md){return(
md`# Obesity in men vs. women`
)}

function _2(rawData,d3)
{
  const W = 900, H = 620;
  const margin = { top: 90, right: 160, bottom: 80, left: 70 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const COL_MEN    = "Obesity in men";
  const COL_WOMEN  = "Obesity in women";
  const COL_REGION = "World region according to OWID";

  const REGION_COLORS = {
    "North America": "#f4a06e",
    "South America": "#8b2020",
    "Africa":        "#a855a8",
    "Europe":        "#4e79a7",
    "Asia":          "#27ae60",
    "Oceania":       "#17c3c3"
  };
  const REGION_ORDER = ["North America","South America","Africa","Europe","Asia","Oceania"];

  // Parse
  const allData = rawData
    .filter(d => d[COL_MEN] != null && d[COL_MEN] !== "" && d[COL_WOMEN] != null && d[COL_WOMEN] !== "")
    .map(d => ({
      entity: d.Entity,
      year:   +d.Year,
      men:    +d[COL_MEN],
      women:  +d[COL_WOMEN],
      region: d[COL_REGION] || "Other"
    }));

  const allYears = [...new Set(allData.map(d => d.year))].sort((a,b) => a-b);
  let currentYear = allYears[allYears.length - 1];
  let highlightRegion = null;
  let playing = false, timer = null;

  // Labels to show (notable countries)
  const LABELS = new Set([
    "American Samoa","Tuvalu","Samoa","French Polynesia","Kuwait","Bahamas",
    "Belize","Croatia","Canada","Brazil","Antigua and Barbuda","Dominica",
    "Serbia","Albania","Azerbaijan","Afghanistan","Andorra","Denmark",
    "China","Mali","Bangladesh","Africa (WHO)","Americas (WHO)","Equatorial Guinea"
  ]);

  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background","#fff");

  // Title & subtitle
  const titleEl = svg.append("text").attr("x", margin.left).attr("y", 22)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");

  const subtitleLines = [
    "Obesity is defined as having a body-mass index (BMI) equal to, or greater than, 30.",
    "BMI is a person's weight (in kilograms) divided by their height (in meters) squared."
  ];
  subtitleLines.forEach((line, i) => {
    svg.append("text").attr("x", margin.left).attr("y", 36 + i * 13)
      .style("font-size","10.5px").style("fill","#555").text(line);
  });

  // Leyenda
  let lx = margin.left + innerW + 10;
  REGION_ORDER.forEach((r, i) => {
    svg.append("rect").attr("x", lx).attr("y", margin.top + i*22).attr("width",12).attr("height",12)
      .attr("fill", REGION_COLORS[r] || "#aaa").attr("rx",6)
      .style("cursor","pointer")
      .on("click", () => { highlightRegion = highlightRegion === r ? null : r; render(); });
    svg.append("text").attr("x", lx+16).attr("y", margin.top + i*22 + 10)
      .style("font-size","11px").style("fill","#333").style("cursor","pointer")
      .text(r)
      .on("click", () => { highlightRegion = highlightRegion === r ? null : r; render(); });
  });

  const mainG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Tooltip
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.15))");
  const ttName  = ttG.append("text").attr("x",12).attr("y",20).style("font-size","13px").style("font-weight","bold").style("fill","#111");
  const ttYear  = ttG.append("text").attr("x",12).attr("y",34).style("font-size","11px").style("fill","#888");
  const ttLbl1  = ttG.append("text").attr("x",12).attr("y",52).style("font-size","10.5px").style("fill","#555");
  const ttVal1  = ttG.append("text").attr("x",12).attr("y",66).style("font-size","13px").style("font-weight","bold").style("fill","#111");
  const ttLbl2  = ttG.append("text").attr("x",12).attr("y",84).style("font-size","10.5px").style("fill","#555");
  const ttVal2  = ttG.append("text").attr("x",12).attr("y",98).style("font-size","13px").style("font-weight","bold").style("fill","#111");

  function showTooltip(d, mx, my) {
    ttName.text(d.entity);
    ttYear.text(d.year);
    ttLbl1.text("Obesity in women (% of adults)");
    ttVal1.text(d3.format(".2f")(d.women) + "%");
    ttLbl2.text("Obesity in men (% of adults)");
    ttVal2.text(d3.format(".2f")(d.men) + "%");
    const ttW = 220, ttH = 110;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 10 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 30, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── RENDER ────────────────────────────────────────────────────────────────
  function render() {
    mainG.selectAll("*").remove();
    titleEl.text(`Obesity in men vs. women, ${currentYear}`);

    const yearData = allData.filter(d => d.year === currentYear);
    if (!yearData.length) return;

    const maxVal = Math.ceil(d3.max(yearData, d => Math.max(d.men, d.women)) / 10) * 10;
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, maxVal]).range([innerH, 0]);

    // Gridlines
    d3.range(0, maxVal + 1, 10).forEach(v => {
      mainG.append("line")
        .attr("x1",xScale(v)).attr("x2",xScale(v)).attr("y1",0).attr("y2",innerH)
        .attr("stroke","#e8e8e8").attr("stroke-width",1);
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke","#e8e8e8").attr("stroke-width",1);
      mainG.append("text").attr("x",xScale(v)).attr("y",innerH+18)
        .style("font-size","10px").style("fill","#888").style("text-anchor","middle").text(v+"%");
      if (v > 0) mainG.append("text").attr("x",-6).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","10px").style("fill","#888").style("text-anchor","end").text(v+"%");
    });

    // Línea diagonal (igualdad)
    mainG.append("line")
      .attr("x1",xScale(0)).attr("y1",yScale(0))
      .attr("x2",xScale(maxVal)).attr("y2",yScale(maxVal))
      .attr("stroke","#ccc").attr("stroke-dasharray","5,4").attr("stroke-width",1.2);

    // Axis labels
    mainG.append("text").attr("x",innerW/2).attr("y",innerH+38)
      .style("font-size","12px").style("font-weight","bold").style("fill","#333").style("text-anchor","middle")
      .text("Obesity in women (% of adults)");
    mainG.append("text")
      .attr("transform",`translate(-48,${innerH/2}) rotate(-90)`)
      .style("font-size","12px").style("font-weight","bold").style("fill","#333").style("text-anchor","middle")
      .text("Obesity in men (% of adults)");

    // Borders
    mainG.append("line").attr("x1",0).attr("x2",innerW).attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb");
    mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH).attr("stroke","#bbb");

    // Dots
    yearData.forEach(d => {
      const color = REGION_COLORS[d.region] || "#aaa";
      const isHighlighted = !highlightRegion || highlightRegion === d.region;
      const dotColor = isHighlighted ? color : "#ddd";
      const cx = xScale(d.women), cy = yScale(d.men);

      const circle = mainG.append("circle")
        .attr("cx", cx).attr("cy", cy)
        .attr("r", 5)
        .attr("fill", dotColor)
        .attr("opacity", isHighlighted ? 0.85 : 0.4)
        .style("cursor","pointer")
        .on("mousemove", function(event) {
          const [sx,sy] = d3.pointer(event, svg.node());
          showTooltip(d, sx, sy);
        })
        .on("mouseleave", hideTooltip);

      // Labels for notable countries
      if (isHighlighted && LABELS.has(d.entity)) {
        mainG.append("text")
          .attr("x", cx + 7).attr("y", cy).attr("dy","0.35em")
          .style("font-size","9.5px").style("fill", color)
          .text(d.entity);
      }
    });
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY = H - 42;
  const sliderX0 = 90, sliderX1 = W - 60;
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
    render();
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
      },400);
    }
  });

  // Footer
  svg.append("text").attr("x",margin.left).attr("y",H-26)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-26)
    .style("font-size","10.5px").style("fill","#333")
    .text("World Health Organization – Global Health Observatory (2025) – processed by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-13)
    .style("font-size","9.5px").style("fill","#555")
    .text("Note: To allow for comparisons between countries and over time, this metric is age-standardized.");
  svg.append("text").attr("x",W-10).attr("y",H-13)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/obesity | CC BY");

  render();
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("obesity-in-men-vs-obesity-in-women.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["obesity-in-men-vs-obesity-in-women.csv", {url: new URL("./files/5c7c66c94ae2548719490cdfb01f34a42f47cb2c964a3e6d165237a7d9d6527c27e4e634e110926f3612708e7981058d4bd80b53eae957194d8f2092d6fadffb.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
