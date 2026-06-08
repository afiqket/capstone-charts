function _1(md){return(
md`# Annual death rate by age group`
)}

function _2(rawData,d3)
{
  const W = 900, H = 640;
  const margin = { top: 65, right: 120, bottom: 80, left: 140 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const BAR_COLOR = "#6b7fad";
  const country = "United States";

  // Grupos de edad en el orden de la foto (de arriba a abajo: 85-89 → 0)
  const AGE_GROUPS = [
    "85–89 years old",
    "80–84 years old",
    "75–79 years old",
    "70–74 years old",
    "65–69 years old",
    "60–64 years old",
    "55–59 years old",
    "50–54 years old",
    "45–49 years old",
    "40–44 years old",
    "35–39 years old",
    "30–34 years old",
    "25–29 years old",
    "20–24 years old",
    "15–19 years old",
    "10–14 years old",
    "5–9 years old",
    "1–4 years old",
    "0 years old",
  ];

  const rows = rawData.filter(d => d.Entity === country);
  const years = [...new Set(rows.map(d => +d.Year))].sort((a,b) => a - b);
  let currentYear = years[0]; // igual que OWID arranca en el primer año
  const byYear = new Map(rows.map(r => [+r.Year, r]));

  let playing = false;
  let timer = null;

  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  const titleEl = svg.append("text").attr("x", margin.left).attr("y", 22)
    .style("font-size","16px").style("font-weight","bold").style("fill","#111");

  svg.append("text").attr("x", margin.left).attr("y", 38)
    .style("font-size","11px").style("fill","#555")
    .text("The annual death rate, per 1,000 people in a given age group.");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",20)
    .style("font-size","13px").style("font-weight","bold").style("fill","#111");
  const ttVal = ttG.append("text").attr("x",12).attr("y",38)
    .style("font-size","12px").style("fill","#555");

  function showTooltip(age, value, mx, my) {
    ttTitle.text(age);
    ttVal.text(`${d3.format(".2~f")(value)} per 1,000`);
    const ttW = 190, ttH = 50;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── RENDER ────────────────────────────────────────────────────────────────
  function render() {
    mainG.selectAll("*").remove();
    titleEl.text(`Annual death rate by age group, ${country}, ${currentYear}`);

    const row = byYear.get(currentYear);
    const barData = AGE_GROUPS.map(age => ({
      age,
      value: row && row[age] != null && row[age] !== "" ? +row[age] : null
    })).filter(d => d.value != null);

    if (!barData.length) {
      mainG.append("text").attr("x",innerW/2).attr("y",innerH/2)
        .style("text-anchor","middle").style("fill","#888").style("font-size","14px")
        .text("No data for this year");
      return;
    }

    const maxVal = d3.max(barData, d => d.value) * 1.05;
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const yScale = d3.scaleBand()
      .domain(barData.map(d => d.age))
      .range([0, innerH])
      .padding(0.18);

    // Línea eje Y
    mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
      .attr("stroke","#bbb").attr("stroke-width",1);

    // Barras
    mainG.selectAll(".bar").data(barData).join("rect")
      .attr("class","bar")
      .attr("x",0)
      .attr("y", d => yScale(d.age))
      .attr("width", d => xScale(d.value))
      .attr("height", yScale.bandwidth())
      .attr("fill", BAR_COLOR)
      .on("mousemove", function(event, d) {
        d3.selectAll(".bar").attr("opacity",0.5);
        d3.select(this).attr("opacity",1);
        const [mx,my] = d3.pointer(event, svg.node());
        showTooltip(d.age, d.value, mx, my);
      })
      .on("mouseleave", function() {
        d3.selectAll(".bar").attr("opacity",1);
        hideTooltip();
      });

    // Etiquetas izquierda (nombre del grupo)
    mainG.selectAll(".alabel").data(barData).join("text")
      .attr("class","alabel")
      .attr("x",-8)
      .attr("y", d => yScale(d.age) + yScale.bandwidth()/2)
      .attr("dy","0.35em")
      .style("text-anchor","end")
      .style("font-size","11.5px")
      .style("font-weight","bold")
      .style("fill","#333")
      .text(d => d.age);

    // Etiquetas derecha (valor)
    mainG.selectAll(".vlabel").data(barData).join("text")
      .attr("class","vlabel")
      .attr("x", d => xScale(d.value) + 6)
      .attr("y", d => yScale(d.age) + yScale.bandwidth()/2)
      .attr("dy","0.35em")
      .style("font-size","11px")
      .style("fill","#444")
      .text(d => d3.format(".3~g")(d.value));
  }

  render();

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY = H - 50;
  const sliderX0 = 90, sliderX1 = W - 60;
  const xSlider = d3.scalePoint().domain(years).range([sliderX0, sliderX1]);
  const sliderG = svg.append("g");

  const playBtn = sliderG.append("text").attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555").text("▶");

  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(years[0]);
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(years[years.length-1]);

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
      updateYear(years.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
    });

  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    updateYear(years.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
  }));

  playBtn.on("click", () => {
    if (playing) { clearInterval(timer); playing=false; playBtn.text("▶"); }
    else {
      if (currentYear === years[years.length-1]) updateYear(years[0]);
      playing=true; playBtn.text("⏸");
      timer = setInterval(() => {
        const idx = years.indexOf(currentYear);
        if (idx < years.length-1) updateYear(years[idx+1]);
        else { clearInterval(timer); playing=false; playBtn.text("▶"); }
      }, 200);
    }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-18)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-18)
    .style("font-size","10.5px").style("fill","#333")
    .text("Human Mortality Database (2025) – with minor processing by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-5)
    .style("font-size","10px").style("fill","#aaa")
    .text("OurWorldInData.org/life-expectancy | CC BY");

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("annual-death-rate-by-age-group.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["annual-death-rate-by-age-group.csv", {url: new URL("./files/3d3b259f3c8c657f2cf21da86beba55d73b410f3bb24eed6d811ae66f1855f1751bc7170cbfe48a2353c9437949bf92a226e224a0f7e845ec8b3f2a71f0ab7d5.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
