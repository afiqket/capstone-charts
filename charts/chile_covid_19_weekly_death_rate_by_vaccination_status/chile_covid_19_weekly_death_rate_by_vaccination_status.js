function _1(md){return(
md`# Chile: COVID-19 weekly death rate by vaccination status`
)}

function _2(d3,rawData)
{
  const W = 960, H = 560;
  const margin = { top: 105, right: 130, bottom: 100, left: 65 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const seriesDef = [
    { key: "0 or 1 dose", label: "0 or 1 dose", color: "#c0523a" },
    { key: "2 doses",     label: "2 doses",     color: "#8c6d3f" },
    { key: "3 doses",     label: "3 doses",     color: "#2e8b6e" },
    { key: "4 doses",     label: "4 doses",     color: "#4472c4" }
  ];

  // Filter "All ages" and parse dates
  const parseDate = d3.timeParse("%Y-%m-%d");
  const allAgesData = rawData
    .filter(d => d.Entity === "All ages" && d.Day)
    .map(d => ({
      date: parseDate(d.Day),
      ...Object.fromEntries(seriesDef.map(s => [s.key, d[s.key] !== "" && d[s.key] != null ? +d[s.key] : null]))
    }))
    .filter(d => d.date)
    .sort((a,b) => a.date - b.date);

  const allDates = allAgesData.map(d => d.date);
  let currentDateIdx = allDates.length - 1;
  let playing = false, timer = null;
  let viewMode = "line";

  const formatDate = d3.timeFormat("%b %-d, %Y");
  const formatDateShort = d3.timeFormat("%b %-d, %Y");

  // ── Container ─────────────────────────────────────────────────────────────
  const container = d3.create("div")
    .style("font-family","sans-serif")
    .style("user-select","none")
    .style("position","relative");

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  // Title
  const titleEl = svg.append("text")
    .attr("x",margin.left).attr("y",28)
    .style("font-size","18px").style("font-weight","bold").style("fill","#111");

  // Subtitle
  svg.append("foreignObject")
    .attr("x",margin.left).attr("y",36)
    .attr("width",W-margin.left-20).attr("height",40)
    .append("xhtml:div")
    .style("font-size","10.5px").style("color","#555").style("line-height","1.4")
    .text("Death rates are calculated as the number of deaths in each group, divided by the total number of people in this group. This is given per 100,000 people.");

  // ── View toggle buttons ───────────────────────────────────────────────────
  const btnY = 78, btnH = 22;
  const btnDefs = [
    { label:"Line", mode:"line", x:margin.left },
    { label:"Bar",  mode:"bar",  x:margin.left+62 }
  ];
  const btnGs = btnDefs.map(b => {
    const g = svg.append("g").style("cursor","pointer");
    const rect = g.append("rect")
      .attr("x",b.x).attr("y",btnY).attr("width",56).attr("height",btnH)
      .attr("rx",4).attr("fill","#f0f0f0").attr("stroke","#ccc").attr("stroke-width",1);
    g.append("text")
      .attr("x",b.x+28).attr("y",btnY+14)
      .style("font-size","11px").style("text-anchor","middle").style("fill","#333")
      .text(b.label);
    g.on("click",() => { viewMode=b.mode; updateView(); });
    return {rect, mode:b.mode};
  });

  function styleButtons() {
    btnGs.forEach(({rect,mode}) => {
      rect.attr("fill", mode===viewMode ? "#dce8f5" : "#f0f0f0")
          .attr("stroke", mode===viewMode ? "#4472c4" : "#ccc");
    });
  }

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Scales ────────────────────────────────────────────────────────────────
  const xScaleLine = d3.scaleTime()
    .domain(d3.extent(allDates))
    .range([0,innerW]);

  const maxVal = d3.max(allAgesData, d => d3.max(seriesDef, s => d[s.key]||0));
  const yScale = d3.scaleLinear().domain([0, Math.ceil(maxVal)+1]).range([innerH,0]);

  // ── Gridlines ─────────────────────────────────────────────────────────────
  const gridG = mainG.append("g");
  const yTicks = d3.range(0, Math.ceil(maxVal)+2, 2);
  yTicks.forEach(v => {
    gridG.append("line")
      .attr("x1",0).attr("x2",innerW)
      .attr("y1",yScale(v)).attr("y2",yScale(v))
      .attr("stroke", v===0?"#bbb":"#e0e0e0")
      .attr("stroke-dasharray", v===0?"0":"4,3").attr("stroke-width",1);
    gridG.append("text")
      .attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
      .style("font-size","10px").style("fill","#888").style("text-anchor","end")
      .text(v);
  });
  mainG.append("line").attr("x1",0).attr("x2",innerW).attr("y1",innerH).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);
  mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);

  // ── X axis ────────────────────────────────────────────────────────────────
  const xAxisG = mainG.append("g");
  const xTicks = xScaleLine.ticks(6);
  xTicks.forEach(t => {
    xAxisG.append("text")
      .attr("x",xScaleLine(t)).attr("y",innerH+18)
      .style("font-size","10px").style("fill","#888").style("text-anchor","middle")
      .text(d3.timeFormat("%b %-d, %Y")(t));
  });

  // ── Line / dot elements ───────────────────────────────────────────────────
  const lineG  = mainG.append("g");
  const dotsG  = mainG.append("g");
  const endLabG = svg.append("g");

  // Cursor elements
  const cursorLine = mainG.append("line")
    .attr("y1",0).attr("y2",innerH)
    .attr("stroke","#ccc").attr("stroke-width",1)
    .style("display","none").style("pointer-events","none");
  const hoverDots = seriesDef.map(s =>
    mainG.append("circle").attr("r",5).attr("fill","white")
      .attr("stroke",s.color).attr("stroke-width",2)
      .style("display","none").style("pointer-events","none")
  );

  // ── Bar elements ──────────────────────────────────────────────────────────
  const barG = mainG.append("g");

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.12))");
  const ttDate = ttG.append("text").attr("x",14).attr("y",26)
    .style("font-size","14px").style("font-weight","bold").style("fill","#111");
  ttG.append("text").attr("x",14).attr("y",42)
    .style("font-size","11px").style("fill","#888").text("in doses");
  const ttRows = ttG.append("g").attr("transform","translate(0,50)");

  function showTT(date, row, mx, my) {
    ttDate.text(formatDate(date));
    ttRows.selectAll("*").remove();

    // Sort by value desc
    const vals = seriesDef
      .map(s => ({...s, value: row[s.key]}))
      .filter(s => s.value != null)
      .sort((a,b) => b.value - a.value);

    const rowH = 26;
    vals.forEach((s,i) => {
      const g = ttRows.append("g").attr("transform",`translate(0,${i*rowH})`);
      g.append("rect").attr("x",14).attr("y",3).attr("width",14).attr("height",14)
        .attr("rx",2).attr("fill",s.color);
      g.append("text").attr("x",34).attr("y",14)
        .style("font-size","12px").style("fill","#111").text(s.label);
      g.append("text").attr("x",220).attr("y",14)
        .style("font-size","12px").style("font-weight","bold").style("fill","#111")
        .style("text-anchor","end")
        .text(d3.format(".2f")(s.value));
    });

    const ttW = 235, ttH = 58 + vals.length * rowH;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx+ttW+20>W ? mx-ttW-8 : mx+14;
    const ty = Math.max(0, Math.min(my-ttH/2, H-ttH-10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTT() {
    ttG.style("display","none");
    cursorLine.style("display","none");
    hoverDots.forEach(d=>d.style("display","none"));
  }

  // ── Draw line ─────────────────────────────────────────────────────────────
  function drawLine() {
    lineG.style("display",null);
    dotsG.style("display",null);
    xAxisG.style("display",null);
    endLabG.style("display",null);
    barG.style("display","none");
    gridG.style("display",null);

    const lineFn = d3.line()
      .x(d => xScaleLine(d.date))
      .y(d => yScale(d.value))
      .defined(d => d.value != null);

    seriesDef.forEach(s => {
      const data = allAgesData
        .filter(d => d[s.key] != null)
        .map(d => ({date:d.date, value:d[s.key]}));

      lineG.selectAll(`path.l-${s.key.replace(/\s/g,"_")}`).data([data])
        .join("path")
        .attr("class",`l-${s.key.replace(/\s/g,"_")}`)
        .attr("fill","none").attr("stroke",s.color).attr("stroke-width",1.8)
        .attr("d",lineFn);

      dotsG.selectAll(`circle.d-${s.key.replace(/\s/g,"_")}`).data(data)
        .join("circle")
        .attr("class",`d-${s.key.replace(/\s/g,"_")}`)
        .attr("cx",d=>xScaleLine(d.date)).attr("cy",d=>yScale(d.value))
        .attr("r",2).attr("fill",s.color).attr("opacity",0.7);

      // End label
      const last = data[data.length-1];
      if (last) {
        const ex = margin.left + xScaleLine(last.date) + 6;
        const ey = margin.top + yScale(last.value);
        endLabG.selectAll(`text.el-${s.key.replace(/\s/g,"_")}`).data([last])
          .join("text")
          .attr("class",`el-${s.key.replace(/\s/g,"_")}`)
          .attr("x",ex).attr("y",ey).attr("dy","0.35em")
          .style("font-size","10px").style("font-weight","bold").style("fill",s.color)
          .text(s.label);
      }
    });

    // Hover overlay
    mainG.select(".line-hover").remove();
    mainG.append("rect")
      .attr("class","line-hover")
      .attr("width",innerW).attr("height",innerH)
      .attr("fill","transparent")
      .on("mousemove",function(event){
        const [mx,my] = d3.pointer(event);
        const hoverDate = xScaleLine.invert(mx);
        // Snap to nearest data point
        const closest = allAgesData.reduce((best,d) =>
          Math.abs(d.date-hoverDate) < Math.abs(best.date-hoverDate) ? d : best
        );

        cursorLine.attr("x1",xScaleLine(closest.date)).attr("x2",xScaleLine(closest.date))
          .style("display",null);
        seriesDef.forEach((s,i)=>{
          const v=closest[s.key];
          if(v!=null){
            hoverDots[i].attr("cx",xScaleLine(closest.date)).attr("cy",yScale(v))
              .style("display",null);
          } else hoverDots[i].style("display","none");
        });

        const [sx,sy]=d3.pointer(event,svg.node());
        showTT(closest.date,closest,sx,sy);
      })
      .on("mouseleave",hideTT);
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

    const currentDate = allDates[currentDateIdx];
    const row = allAgesData.reduce((best,d) =>
      Math.abs(d.date-currentDate)<Math.abs(best.date-currentDate)?d:best
    );

    barG.selectAll("*").remove();

    // Sort by value desc
    const vals = seriesDef
      .map(s=>({...s, value: row[s.key]}))
      .filter(s=>s.value!=null)
      .sort((a,b)=>b.value-a.value);

    const maxBarVal = d3.max(vals,d=>d.value);
    const xBar = d3.scaleLinear().domain([0,maxBarVal*1.15]).range([0,innerW-60]);
    const barH=70, barGap=40;

    vals.forEach((s,i)=>{
      const y = i*(barH+barGap)+10;
      barG.append("text")
        .attr("x",-8).attr("y",y+barH/2).attr("dy","0.35em")
        .style("font-size","12px").style("font-weight","bold").style("fill","#333")
        .style("text-anchor","end").text(s.label);
      barG.append("rect")
        .attr("x",0).attr("y",y)
        .attr("width",xBar(s.value)).attr("height",barH)
        .attr("fill",s.color).attr("rx",2);
      barG.append("text")
        .attr("x",xBar(s.value)+8).attr("y",y+barH/2).attr("dy","0.35em")
        .style("font-size","12px").style("fill","#333")
        .text(d3.format(".2f")(s.value));
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────
  function updateView() {
    styleButtons();
    if (viewMode==="line") {
      titleEl.text("Chile: COVID-19 weekly death rate by vaccination status, All ages");
      drawLine();
    } else {
      const d = allDates[currentDateIdx];
      titleEl.text(`Chile: COVID-19 weekly death rate by vaccination status, All ages, ${formatDateShort(d)}`);
      drawBar();
    }
  }

  // ── Year slider (date slider) ─────────────────────────────────────────────
  const sliderY  = H-50;
  const sliderX0 = 90, sliderX1 = W-60;
  const xSlider  = d3.scalePoint().domain(d3.range(allDates.length)).range([sliderX0,sliderX1]);
  const sliderG  = svg.append("g");

  const playBtn = sliderG.append("text")
    .attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555")
    .text("▶");

  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","11px").style("fill","#888").style("text-anchor","middle")
    .text(formatDateShort(allDates[0]));
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","11px").style("fill","#888").style("text-anchor","middle")
    .text(formatDateShort(allDates[allDates.length-1]));
  sliderG.append("line")
    .attr("x1",sliderX0).attr("x2",sliderX1)
    .attr("y1",sliderY).attr("y2",sliderY)
    .attr("stroke","#ccc").attr("stroke-width",4).attr("stroke-linecap","round");

  const handle = sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","pointer");

  function updateDateIdx(idx) {
    currentDateIdx = Math.max(0, Math.min(allDates.length-1, idx));
    handle.attr("cx",xSlider(currentDateIdx));
    if (viewMode==="bar") updateView();
  }
  updateDateIdx(currentDateIdx);

  sliderG.append("rect")
    .attr("x",sliderX0).attr("y",sliderY-12)
    .attr("width",sliderX1-sliderX0).attr("height",24)
    .attr("fill","transparent").style("cursor","pointer")
    .on("click",function(event){
      const [mx]=d3.pointer(event);
      const idx = Math.round((mx-sliderX0)/(sliderX1-sliderX0)*(allDates.length-1));
      updateDateIdx(idx);
    });

  handle.call(d3.drag().on("drag",function(event){
    const mx=Math.max(sliderX0,Math.min(sliderX1,event.x));
    const idx=Math.round((mx-sliderX0)/(sliderX1-sliderX0)*(allDates.length-1));
    updateDateIdx(idx);
  }));

  playBtn.on("click",()=>{
    if(playing){
      clearInterval(timer); playing=false; playBtn.text("▶");
    } else {
      if(currentDateIdx===allDates.length-1) updateDateIdx(0);
      playing=true; playBtn.text("⏸");
      timer=setInterval(()=>{
        if(currentDateIdx<allDates.length-1) updateDateIdx(currentDateIdx+1);
        else { clearInterval(timer); playing=false; playBtn.text("▶"); }
      },120);
    }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-28)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333")
    .text("Data source: ");
  svg.append("text").attr("x",margin.left+82).attr("y",H-28)
    .style("font-size","10.5px").style("fill","#333")
    .text("Departamento de Epidemiología, Ministerio de Salud de Chile. (2023) – processed by Our World in Data");
  svg.append("foreignObject")
    .attr("x",margin.left).attr("y",H-20)
    .attr("width",W-margin.left-20).attr("height",18)
    .append("xhtml:div")
    .style("font-size","10px").style("color","#555")
    .html("<strong>Note:</strong> The mortality rate for the 'All ages' group is age-standardized to account for the different vaccination rates of older and younger people.");
  svg.append("text").attr("x",W-10).attr("y",H-4)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/coronavirus | CC BY");

  updateView();
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("chile-covid-19-mortality-rate-by-vaccination-status.csv").csv()
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["chile-covid-19-mortality-rate-by-vaccination-status.csv", {url: new URL("./files/d484e0722a13b5879467806a621c2dece9480ad2dc267e0f63cfbd47affef2e9bd8b4644079451351a6a538d9e36bbdc48861c11c5be8bea27a4e5185814297b.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","rawData"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
