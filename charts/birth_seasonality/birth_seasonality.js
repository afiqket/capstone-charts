function _1(md){return(
md`# Birth seasonality`
)}

function _2(rawData,d3)
{
  const W = 900, H = 600;
  const margin = { top: 80, right: 100, bottom: 60, left: 110 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const COL_MAP = {
    "January":   "January",
    "February":  "February",
    "March":     "March",
    "April":     "April",
    "May":       "May",
    "June":      "June",
    "July":      "July",
    "August":    "August",
    "September": "September",
    "October":   "October",
    "November":  "November",
    "December":  "December"
  };
  const BAR_COLOR = "#4cA99A";
  const country = "United States";

  const countryRows = rawData
    .filter(d => d.Entity === country)
    .map(d => ({ year: +d.Year, ...Object.fromEntries(MONTHS.map(m => [m, d[m] != null && d[m] !== "" ? +d[m] : null])) }))
    .sort((a, b) => a.year - b.year);

  const years = countryRows.map(r => r.year);
  const byYear = new Map(countryRows.map(r => [r.year, r]));
  let currentYear = years[years.length - 1];
  let playing = false, timer = null;

  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background","#fff");

  // ── Título ────────────────────────────────────────────────────────────────
  const titleEl = svg.append("text").attr("x", margin.left).attr("y", 22)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");

  svg.append("text").attr("x", margin.left).attr("y", 38)
    .style("font-size","10.5px").style("fill","#555")
    .text("Average number of births per day and million people, in each month.");

  const mainG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",5).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttText = ttG.append("text").attr("x",10).attr("y",18)
    .style("font-size","12px").style("fill","#333");

  function showTooltip(label, value, mx, my) {
    ttText.text(`${label}: ${d3.format(".2f")(value)}`);
    const ttW = 180, ttH = 30;
    ttBg.attr("width", ttW).attr("height", ttH);
    ttG.style("display", null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 15, H - ttH - 10));
    ttG.attr("transform", `translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`Birth seasonality, ${country}, ${currentYear}`);

    const row = byYear.get(currentYear);
    const barData = MONTHS.map(m => ({ month: m, value: row && row[m] != null ? row[m] : null }))
                          .filter(d => d.value != null);

    if (!barData.length) {
      mainG.append("text").attr("x", innerW/2).attr("y", innerH/2)
        .style("text-anchor","middle").style("fill","#888").style("font-size","14px")
        .text("No data for this year");
      return;
    }

    const maxVal = d3.max(barData, d => d.value) * 1.08;
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(MONTHS).range([0, innerH]).padding(0.18);

    // Gridlines verticales
    xScale.ticks(5).forEach(v => {
      mainG.append("line")
        .attr("x1", xScale(v)).attr("x2", xScale(v))
        .attr("y1", 0).attr("y2", innerH)
        .attr("stroke","#e8e8e8").attr("stroke-width",1);
    });

    barData.forEach(d => {
      const y = yScale(d.month);
      const bw = yScale.bandwidth();

      // Barra
      mainG.append("rect")
        .attr("x", 0).attr("y", y)
        .attr("width", xScale(d.value)).attr("height", bw)
        .attr("fill", BAR_COLOR)
        .on("mousemove", function(event) {
          const [mx, my] = d3.pointer(event, svg.node());
          showTooltip(d.month, d.value, mx, my);
        })
        .on("mouseleave", hideTooltip);

      // Etiqueta mes (izquierda)
      mainG.append("text")
        .attr("x", -8).attr("y", y + bw/2).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","12px").style("font-weight","bold").style("fill","#333")
        .text(d.month);

      // Valor (derecha de la barra)
      mainG.append("text")
        .attr("x", xScale(d.value) + 6).attr("y", y + bw/2).attr("dy","0.35em")
        .style("font-size","12px").style("fill","#444")
        .text(d3.format(".2f")(d.value));
    });

    // Eje izquierdo
    mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
      .attr("stroke","#bbb").attr("stroke-width",1);
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY = H - 36;
  const sliderX0 = 90, sliderX1 = W - 60;
  const xSlider = d3.scalePoint().domain(years).range([sliderX0, sliderX1]);
  const sliderG = svg.append("g");

  const playBtn = sliderG.append("text").attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555").text("▶");

  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(years[0]);
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(years[years.length-1]);
  sliderG.append("line")
    .attr("x1",sliderX0).attr("x2",sliderX1).attr("y1",sliderY).attr("y2",sliderY)
    .attr("stroke","#ccc").attr("stroke-width",4).attr("stroke-linecap","round");

  const handle = sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","pointer");

  function updateYear(y) {
    currentYear = y;
    handle.attr("cx", xSlider(y));
    renderBar();
  }
  updateYear(currentYear);

  sliderG.append("rect")
    .attr("x",sliderX0).attr("y",sliderY-12)
    .attr("width",sliderX1-sliderX0).attr("height",24)
    .attr("fill","transparent").style("cursor","pointer")
    .on("click", function(event) {
      const [mx] = d3.pointer(event);
      updateYear(years.reduce((a,b) => Math.abs(xSlider(a)-mx) < Math.abs(xSlider(b)-mx) ? a : b));
    });

  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    updateYear(years.reduce((a,b) => Math.abs(xSlider(a)-mx) < Math.abs(xSlider(b)-mx) ? a : b));
  }));

  playBtn.on("click", () => {
    if (playing) { clearInterval(timer); playing = false; playBtn.text("▶"); }
    else {
      if (currentYear === years[years.length-1]) updateYear(years[0]);
      playing = true; playBtn.text("⏸");
      timer = setInterval(() => {
        const idx = years.indexOf(currentYear);
        if (idx < years.length-1) updateYear(years[idx+1]);
        else { clearInterval(timer); playing = false; playBtn.text("▶"); }
      }, 200);
    }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x", margin.left).attr("y", H - 14)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x", margin.left + 80).attr("y", H - 14)
    .style("font-size","10.5px").style("fill","#333")
    .text("Human Mortality Database (2025) – processed by Our World in Data");
  svg.append("text").attr("x", W - 20).attr("y", H - 14)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/fertility-rate | CC BY");

  renderBar();
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("births-per-month-annual.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["births-per-month-annual.csv", {url: new URL("./files/c5223a400177c36f8f66802f80d0d732ea222f3c0aa81209d7385047815a2678a62d15150f7bb434d457b6623abb454140fe968bce6246bff48be418ea4bc903.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
