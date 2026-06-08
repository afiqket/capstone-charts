function _1(md){return(
md`# Zillow Home Value Index`
)}

function _d3(require){return(
require("d3@7")
)}

function _3(d3)
{
  // ════════════════════════════════════════════
  //  DATOS REALES DE ZILLOW
  // ════════════════════════════════════════════
 
  const zhviRaw = [
    {date:"30/04/1996",value:100000},{date:"31/05/1996",value:100100},{date:"30/06/1996",value:100300},
    {date:"31/07/1996",value:100500},{date:"31/08/1996",value:100800},{date:"30/09/1996",value:101000},
    {date:"31/10/1996",value:101300},{date:"30/11/1996",value:101500},{date:"31/12/1996",value:101900},
    {date:"31/01/1997",value:102200},{date:"28/02/1997",value:102500},{date:"31/03/1997",value:102800},
    {date:"30/04/1997",value:103000},{date:"31/05/1997",value:103300},{date:"30/06/1997",value:103600},
    {date:"31/07/1997",value:104000},{date:"31/08/1997",value:104400},{date:"30/09/1997",value:104700},
    {date:"31/10/1997",value:105200},{date:"30/11/1997",value:105600},{date:"31/12/1997",value:106100},
    {date:"31/01/1998",value:106600},{date:"28/02/1998",value:107200},{date:"31/03/1998",value:107700},
    {date:"30/04/1998",value:108200},{date:"31/05/1998",value:108800},{date:"30/06/1998",value:109400},
    {date:"31/07/1998",value:110000},{date:"31/08/1998",value:110600},{date:"30/09/1998",value:111100},
    {date:"31/10/1998",value:111700},{date:"30/11/1998",value:112300},{date:"31/12/1998",value:112900},
    {date:"31/01/1999",value:113500},{date:"28/02/1999",value:114000},{date:"31/03/1999",value:114400},
    {date:"30/04/1999",value:114900},{date:"31/05/1999",value:115400},{date:"30/06/1999",value:116100},
    {date:"31/07/1999",value:116800},{date:"31/08/1999",value:117500},{date:"30/09/1999",value:118300},
    {date:"31/10/1999",value:119000},{date:"30/11/1999",value:119700},{date:"31/12/1999",value:120600},
    {date:"31/01/2000",value:121500},{date:"29/02/2000",value:122300},{date:"31/03/2000",value:123000},
    {date:"30/04/2000",value:123600},{date:"31/05/2000",value:124200},{date:"30/06/2000",value:124800},
    {date:"31/07/2000",value:125300},{date:"31/08/2000",value:125800},{date:"30/09/2000",value:126200},
    {date:"31/10/2000",value:126700},{date:"30/11/2000",value:127200},{date:"31/12/2000",value:127900},
    {date:"31/01/2001",value:128600},{date:"28/02/2001",value:129300},{date:"31/03/2001",value:129900},
    {date:"30/04/2001",value:130600},{date:"31/05/2001",value:131200},{date:"30/06/2001",value:131700},
    {date:"31/07/2001",value:132200},{date:"31/08/2001",value:132800},{date:"30/09/2001",value:133300},
    {date:"31/10/2001",value:133900},{date:"30/11/2001",value:134600},{date:"31/12/2001",value:135200},
    {date:"31/01/2002",value:136000},{date:"28/02/2002",value:136700},{date:"31/03/2002",value:137400},
    {date:"30/04/2002",value:138100},{date:"31/05/2002",value:138800},{date:"30/06/2002",value:139500},
    {date:"31/07/2002",value:140100},{date:"31/08/2002",value:140800},{date:"30/09/2002",value:141500},
    {date:"31/10/2002",value:142300},{date:"30/11/2002",value:143200},{date:"31/12/2002",value:144000},
    {date:"31/01/2003",value:144800},{date:"28/02/2003",value:145500},{date:"31/03/2003",value:146200},
    {date:"30/04/2003",value:147100},{date:"31/05/2003",value:147900},{date:"30/06/2003",value:148800},
    {date:"31/07/2003",value:149700},{date:"31/08/2003",value:150600},{date:"30/09/2003",value:151600},
    {date:"31/10/2003",value:152600},{date:"30/11/2003",value:153800},{date:"31/12/2003",value:154900},
    {date:"31/01/2004",value:156100},{date:"29/02/2004",value:157400},{date:"31/03/2004",value:158700},
    {date:"30/04/2004",value:160100},{date:"31/05/2004",value:161600},{date:"30/06/2004",value:163100},
    {date:"31/07/2004",value:164800},{date:"31/08/2004",value:166400},{date:"30/09/2004",value:167900},
    {date:"31/10/2004",value:169300},{date:"30/11/2004",value:170700},{date:"31/12/2004",value:172000},
    {date:"31/01/2005",value:173200},{date:"28/02/2005",value:174400},{date:"31/03/2005",value:175700},
    {date:"30/04/2005",value:177100},{date:"31/05/2005",value:178700},{date:"30/06/2005",value:180300},
    {date:"31/07/2005",value:182000},{date:"31/08/2005",value:183700},{date:"30/09/2005",value:185300},
    {date:"31/10/2005",value:186800},{date:"30/11/2005",value:188200},{date:"31/12/2005",value:189600},
    {date:"31/01/2006",value:190900},{date:"28/02/2006",value:192100},{date:"31/03/2006",value:193300},
    {date:"30/04/2006",value:194500},{date:"31/05/2006",value:195500},{date:"30/06/2006",value:196600},
    {date:"31/07/2006",value:197500},{date:"31/08/2006",value:198200},{date:"30/09/2006",value:198700},
    {date:"31/10/2006",value:199100},{date:"30/11/2006",value:199300},{date:"31/12/2006",value:199500},
    {date:"31/01/2007",value:199700},{date:"28/02/2007",value:199900},{date:"31/03/2007",value:200100},
    {date:"30/04/2007",value:200400},{date:"31/05/2007",value:200500},{date:"30/06/2007",value:200000},
    {date:"31/07/2007",value:199200},{date:"31/08/2007",value:198400},{date:"30/09/2007",value:197700},
    {date:"31/10/2007",value:196700},{date:"30/11/2007",value:195700},{date:"31/12/2007",value:194600},
    {date:"31/01/2008",value:193300},{date:"29/02/2008",value:191900},{date:"31/03/2008",value:190400},
    {date:"30/04/2008",value:188800},{date:"31/05/2008",value:187000},{date:"30/06/2008",value:185100},
    {date:"31/07/2008",value:183400},{date:"31/08/2008",value:181700},{date:"30/09/2008",value:180000},
    {date:"31/10/2008",value:178500},{date:"30/11/2008",value:177000},{date:"31/12/2008",value:175600},
    {date:"31/01/2009",value:174300},{date:"28/02/2009",value:173000},{date:"31/03/2009",value:171600},
    {date:"30/04/2009",value:170100},{date:"31/05/2009",value:168500},{date:"30/06/2009",value:166800},
    {date:"31/07/2009",value:165700},{date:"31/08/2009",value:164800},{date:"30/09/2009",value:164000},
    {date:"31/10/2009",value:163400},{date:"30/11/2009",value:163100},{date:"31/12/2009",value:163000},
    {date:"31/01/2010",value:163000},{date:"28/02/2010",value:163200},{date:"31/03/2010",value:162800},
    {date:"30/04/2010",value:161900},{date:"31/05/2010",value:161400},{date:"30/06/2010",value:161400},
    {date:"31/07/2010",value:160900},{date:"31/08/2010",value:160100},{date:"30/09/2010",value:159200},
    {date:"31/10/2010",value:158300},{date:"30/11/2010",value:157600},{date:"31/12/2010",value:156600},
    {date:"31/01/2011",value:155300},{date:"28/02/2011",value:154300},{date:"31/03/2011",value:153500},
    {date:"30/04/2011",value:152800},{date:"31/05/2011",value:152200},{date:"30/06/2011",value:151600},
    {date:"31/07/2011",value:150900},{date:"31/08/2011",value:150400},{date:"30/09/2011",value:149900},
    {date:"31/10/2011",value:149600},{date:"30/11/2011",value:149400},{date:"31/12/2011",value:149200},
    {date:"31/01/2012",value:148800},{date:"29/02/2012",value:148700},{date:"31/03/2012",value:148800},
    {date:"30/04/2012",value:149100},{date:"31/05/2012",value:149500},{date:"30/06/2012",value:149900},
    {date:"31/07/2012",value:150300},{date:"31/08/2012",value:150800},{date:"30/09/2012",value:151400},
    {date:"31/10/2012",value:151900},{date:"30/11/2012",value:152400},{date:"31/12/2012",value:153100},
    {date:"31/01/2013",value:153700},{date:"28/02/2013",value:154300},{date:"31/03/2013",value:155200},
    {date:"30/04/2013",value:156200},{date:"31/05/2013",value:157100},{date:"30/06/2013",value:158100},
    {date:"31/07/2013",value:159300},{date:"31/08/2013",value:160300},{date:"30/09/2013",value:161300},
    {date:"31/10/2013",value:162200},{date:"30/11/2013",value:162900},{date:"31/12/2013",value:163500},
    {date:"31/01/2014",value:164400},{date:"28/02/2014",value:165000},{date:"31/03/2014",value:165700},
    {date:"30/04/2014",value:166500},{date:"31/05/2014",value:167300},{date:"30/06/2014",value:167900},
    {date:"31/07/2014",value:168700},{date:"31/08/2014",value:169500},{date:"30/09/2014",value:170100},
    {date:"31/10/2014",value:170600},{date:"30/11/2014",value:171200},{date:"31/12/2014",value:171700},
    {date:"31/01/2015",value:172300},{date:"28/02/2015",value:173000},{date:"31/03/2015",value:173700},
    {date:"30/04/2015",value:174500},{date:"31/05/2015",value:175500},{date:"30/06/2015",value:176500},
    {date:"31/07/2015",value:177500},{date:"31/08/2015",value:178100},{date:"30/09/2015",value:178800},
    {date:"31/10/2015",value:179500},{date:"30/11/2015",value:180300},{date:"31/12/2015",value:181100},
    {date:"31/01/2016",value:181800},{date:"29/02/2016",value:182600},{date:"31/03/2016",value:183500},
    {date:"30/04/2016",value:184600},{date:"31/05/2016",value:185800},{date:"30/06/2016",value:186900},
    {date:"31/07/2016",value:188100},{date:"31/08/2016",value:189300},{date:"30/09/2016",value:190600},
    {date:"31/10/2016",value:191900},{date:"30/11/2016",value:192900},{date:"31/12/2016",value:193900},
    {date:"31/01/2017",value:195000},{date:"28/02/2017",value:196200},{date:"31/03/2017",value:197400},
    {date:"30/04/2017",value:198800},{date:"31/05/2017",value:200200},{date:"30/06/2017",value:201300},
    {date:"31/07/2017",value:202400},{date:"31/08/2017",value:203800},{date:"30/09/2017",value:205000},
    {date:"31/10/2017",value:205900},{date:"30/11/2017",value:206900},{date:"31/12/2017",value:207900},
    {date:"31/01/2018",value:209300},{date:"28/02/2018",value:210900},{date:"31/03/2018",value:212400},
    {date:"30/04/2018",value:213700},{date:"31/05/2018",value:215100},{date:"30/06/2018",value:216500},
    {date:"31/07/2018",value:217700},{date:"31/08/2018",value:219000},{date:"30/09/2018",value:220300},
    {date:"31/10/2018",value:221800},{date:"30/11/2018",value:223300},{date:"31/12/2018",value:224700},
    {date:"31/01/2019",value:225800},{date:"28/02/2019",value:226700},{date:"31/03/2019",value:227000},
    {date:"30/04/2019",value:226800}
  ];
 
  const inventoryRaw = [
    {date:"01/01/2013",value:2021409},{date:"01/02/2013",value:2004278},{date:"01/03/2013",value:1982919},
    {date:"01/04/2013",value:1989676},{date:"01/05/2013",value:2000058},{date:"01/06/2013",value:1970982},
    {date:"01/07/2013",value:1933100},{date:"01/08/2013",value:1901770},{date:"01/09/2013",value:1904121},
    {date:"01/10/2013",value:1935135},{date:"01/11/2013",value:1936162},{date:"01/12/2013",value:1936933},
    {date:"01/01/2014",value:1944811},{date:"01/02/2014",value:1923663},{date:"01/03/2014",value:1934135},
    {date:"01/04/2014",value:1969699},{date:"01/05/2014",value:1970788},{date:"01/06/2014",value:1998356},
    {date:"01/07/2014",value:2021548},{date:"01/08/2014",value:1992136},{date:"01/09/2014",value:1993487},
    {date:"01/10/2014",value:2003761},{date:"01/11/2014",value:1983711},{date:"01/12/2014",value:1963656},
    {date:"01/01/2015",value:1939290},{date:"01/02/2015",value:1917102},{date:"01/03/2015",value:1929723},
    {date:"01/04/2015",value:1935436},{date:"01/05/2015",value:1888142},{date:"01/06/2015",value:1887400},
    {date:"01/07/2015",value:1910415},{date:"01/08/2015",value:1906954},{date:"01/09/2015",value:1906426},
    {date:"01/10/2015",value:1865307},{date:"01/11/2015",value:1844607},{date:"01/12/2015",value:1843148},
    {date:"01/01/2016",value:1806815},{date:"01/02/2016",value:1816095},{date:"01/03/2016",value:1839154},
    {date:"01/04/2016",value:1806489},{date:"01/05/2016",value:1812769},{date:"01/06/2016",value:1842364},
    {date:"01/07/2016",value:1827439},{date:"01/08/2016",value:1816357},{date:"01/09/2016",value:1783725},
    {date:"01/10/2016",value:1752733},{date:"01/11/2016",value:1752848},{date:"01/12/2016",value:1729066},
    {date:"01/01/2017",value:1717692},{date:"01/02/2017",value:1746981},{date:"01/03/2017",value:1735344},
    {date:"01/04/2017",value:1683057},{date:"01/05/2017",value:1655482},{date:"01/06/2017",value:1617748},
    {date:"01/07/2017",value:1596453},{date:"01/08/2017",value:1608003},{date:"01/09/2017",value:1584990},
    {date:"01/10/2017",value:1573993},{date:"01/11/2017",value:1592719},{date:"01/12/2017",value:1597075},
    {date:"01/01/2018",value:1604020},{date:"01/02/2018",value:1595038},{date:"01/03/2018",value:1568448},
    {date:"01/04/2018",value:1574922},{date:"01/05/2018",value:1594569},{date:"01/06/2018",value:1572953},
    {date:"01/07/2018",value:1555914},{date:"01/08/2018",value:1570739},{date:"01/09/2018",value:1592831},
    {date:"01/10/2018",value:1612182},{date:"01/11/2018",value:1597272},{date:"01/12/2018",value:1597642},
    {date:"01/01/2019",value:1621033},{date:"01/02/2019",value:1600969},{date:"01/03/2019",value:1565266},
    {date:"01/04/2019",value:1569388},{date:"01/05/2019",value:1580964},{date:"01/06/2019",value:1571541},
    {date:"01/07/2019",value:1575892}
  ];
 
  const zriRaw = [
    {date:"30/11/2010",value:1256},{date:"31/12/2010",value:1258},{date:"31/01/2011",value:1255},
    {date:"28/02/2011",value:1249},{date:"31/03/2011",value:1245},{date:"30/04/2011",value:1243},
    {date:"31/05/2011",value:1245},{date:"30/06/2011",value:1250},{date:"31/07/2011",value:1257},
    {date:"31/08/2011",value:1261},{date:"30/09/2011",value:1263},{date:"31/10/2011",value:1259},
    {date:"30/11/2011",value:1254},{date:"31/12/2011",value:1248},{date:"31/01/2012",value:1243},
    {date:"29/02/2012",value:1240},{date:"31/03/2012",value:1238},{date:"30/04/2012",value:1237},
    {date:"31/05/2012",value:1241},{date:"30/06/2012",value:1247},{date:"31/07/2012",value:1255},
    {date:"31/08/2012",value:1261},{date:"30/09/2012",value:1264},{date:"31/10/2012",value:1264},
    {date:"30/11/2012",value:1262},{date:"31/12/2012",value:1260},{date:"31/01/2013",value:1258},
    {date:"28/02/2013",value:1257},{date:"31/03/2013",value:1256},{date:"30/04/2013",value:1257},
    {date:"31/05/2013",value:1263},{date:"30/06/2013",value:1272},{date:"31/07/2013",value:1282},
    {date:"31/08/2013",value:1290},{date:"30/09/2013",value:1296},{date:"31/10/2013",value:1299},
    {date:"30/11/2013",value:1300},{date:"31/12/2013",value:1298},{date:"31/01/2014",value:1294},
    {date:"28/02/2014",value:1289},{date:"31/03/2014",value:1284},{date:"30/04/2014",value:1281},
    {date:"31/05/2014",value:1283},{date:"30/06/2014",value:1286},{date:"31/07/2014",value:1296},
    {date:"31/08/2014",value:1309},{date:"30/09/2014",value:1324},{date:"31/10/2014",value:1333},
    {date:"30/11/2014",value:1338},{date:"31/12/2014",value:1339},{date:"31/01/2015",value:1340},
    {date:"28/02/2015",value:1341},{date:"31/03/2015",value:1345},{date:"30/04/2015",value:1350},
    {date:"31/05/2015",value:1359},{date:"30/06/2015",value:1369},{date:"31/07/2015",value:1381},
    {date:"31/08/2015",value:1390},{date:"30/09/2015",value:1393},{date:"31/10/2015",value:1392},
    {date:"30/11/2015",value:1388},{date:"31/12/2015",value:1383},{date:"31/01/2016",value:1383},
    {date:"29/02/2016",value:1384},{date:"31/03/2016",value:1389},{date:"30/04/2016",value:1393},
    {date:"31/05/2016",value:1400},{date:"30/06/2016",value:1405},{date:"31/07/2016",value:1410},
    {date:"31/08/2016",value:1413},{date:"30/09/2016",value:1413},{date:"31/10/2016",value:1412},
    {date:"30/11/2016",value:1409},{date:"31/12/2016",value:1405},{date:"31/01/2017",value:1401},
    {date:"28/02/2017",value:1399},{date:"31/03/2017",value:1400},{date:"30/04/2017",value:1403},
    {date:"31/05/2017",value:1410},{date:"30/06/2017",value:1421},{date:"31/07/2017",value:1433},
    {date:"31/08/2017",value:1440},{date:"30/09/2017",value:1443},{date:"31/10/2017",value:1443},
    {date:"30/11/2017",value:1442},{date:"31/12/2017",value:1440},{date:"31/01/2018",value:1438},
    {date:"28/02/2018",value:1438},{date:"31/03/2018",value:1438},{date:"30/04/2018",value:1439},
    {date:"31/05/2018",value:1440},{date:"30/06/2018",value:1440},{date:"31/07/2018",value:1440},
    {date:"31/08/2018",value:1440},{date:"30/09/2018",value:1440},{date:"31/10/2018",value:1442},
    {date:"30/11/2018",value:1449},{date:"31/12/2018",value:1460},{date:"31/01/2019",value:1468},
    {date:"28/02/2019",value:1472},{date:"31/03/2019",value:1474},{date:"30/04/2019",value:1477}
  ];
 
  // ════════════════════════════════════════════
  //  CONFIG POR TAB
  // ════════════════════════════════════════════
  const tabConfig = {
    ZHVI: {
      data: zhviRaw,
      yFmt:   v => "$" + (v >= 1000 ? (v/1000).toFixed(0) + "K" : v),
      tipFmt: v => "$" + d3.format(",")(v),
      subtitle: v => `The <strong style="color:#2e86c1;">United States</strong> median home value is <strong style="color:#2e86c1;">$${d3.format(",")(v)}</strong>.`
    },
    Inventory: {
      data: inventoryRaw,
      yFmt:   v => d3.format(".2s")(v).replace(/G/,"B"),
      tipFmt: v => d3.format(",")(v) + " homes",
      subtitle: v => `There are currently <strong style="color:#2e86c1;">${d3.format(",")(v)}</strong> homes for sale in the <strong style="color:#2e86c1;">United States</strong>.`
    },
    ZRI: {
      data: zriRaw,
      yFmt:   v => "$" + d3.format(",")(v),
      tipFmt: v => "$" + d3.format(",")(v) + "/mo",
      subtitle: v => `The <strong style="color:#2e86c1;">United States</strong> median rent index is <strong style="color:#2e86c1;">$${d3.format(",")(v)}/mo</strong>.`
    }
  };
 
  const regions = ["United States"];
  const views   = ["ZHVI", "Inventory", "ZRI"];
 
  // ════════════════════════════════════════════
  //  STATE
  // ════════════════════════════════════════════
  let activeTab = "ZHVI";
 
  // ════════════════════════════════════════════
  //  WRAPPER
  // ════════════════════════════════════════════
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "font-family:'Helvetica Neue',Arial,sans-serif;background:#fff;max-width:960px;";
 
  // ── Tabs ──────────────────────────────────
  const tabBar = wrapper.appendChild(document.createElement("div"));
  tabBar.style.cssText = "display:flex;border-bottom:1px solid #ccc;margin-bottom:0;";
 
  const tabEls = {};
  views.forEach(tab => {
    const btn = tabBar.appendChild(document.createElement("button"));
    btn.textContent = tab;
    btn.style.cssText = `padding:8px 22px;border:1px solid transparent;border-bottom:none;
      background:#f5f5f5;font-size:0.88rem;cursor:pointer;color:#555;
      font-family:inherit;margin-right:2px;margin-bottom:-1px;border-radius:3px 3px 0 0;`;
    tabEls[tab] = btn;
    btn.addEventListener("click", () => {
      activeTab = tab;
      viewSelect.value = tab;
      setActiveTab(tab);
      renderChart();
    });
  });
 
  function setActiveTab(tab) {
    Object.entries(tabEls).forEach(([t, btn]) => {
      const on = t === tab;
      btn.style.background   = on ? "#fff" : "#f5f5f5";
      btn.style.color        = on ? "#222" : "#555";
      btn.style.fontWeight   = on ? "600"  : "400";
      btn.style.borderColor  = on ? "#ccc" : "transparent";
      btn.style.borderBottom = on ? "1px solid #fff" : "none";
    });
  }
  setActiveTab("ZHVI");
 
  // ── Header ────────────────────────────────
  const header = wrapper.appendChild(document.createElement("div"));
  header.style.cssText = "padding:20px 0 12px;";
 
  const title = header.appendChild(document.createElement("h2"));
  title.style.cssText = "margin:0 0 6px;font-size:1.4rem;font-weight:700;color:#111;";
  title.textContent = "Zillow Home Value Index";
 
  const subtitle = header.appendChild(document.createElement("p"));
  subtitle.style.cssText = "margin:0 0 16px;font-size:0.9rem;color:#333;line-height:1.5;";
 
  // ── Controls ──────────────────────────────
  const controls = wrapper.appendChild(document.createElement("div"));
  controls.style.cssText = "display:flex;gap:24px;align-items:flex-end;margin-bottom:18px;";
 
  const dropdownCSS = `padding:8px 32px 8px 10px;border:1px solid #aaa;border-radius:2px;
    font-size:0.9rem;font-family:inherit;background:#fff;cursor:pointer;min-width:300px;`;
 
  // Select Region
  const rg = controls.appendChild(document.createElement("div"));
  rg.style.cssText = "display:flex;flex-direction:column;gap:4px;";
  const rl = rg.appendChild(document.createElement("label"));
  rl.textContent = "Select Region";
  rl.style.cssText = "font-size:0.82rem;font-weight:700;color:#222;";
  const regionSelect = rg.appendChild(document.createElement("select"));
  regionSelect.style.cssText = dropdownCSS;
  regions.forEach(r => {
    const o = regionSelect.appendChild(document.createElement("option"));
    o.value = r; o.textContent = r;
  });
 
  // Select View
  const vg = controls.appendChild(document.createElement("div"));
  vg.style.cssText = "display:flex;flex-direction:column;gap:4px;";
  const vl = vg.appendChild(document.createElement("label"));
  vl.textContent = "Select View";
  vl.style.cssText = "font-size:0.82rem;font-weight:700;color:#222;";
  const viewSelect = vg.appendChild(document.createElement("select"));
  viewSelect.style.cssText = dropdownCSS;
  views.forEach(v => {
    const o = viewSelect.appendChild(document.createElement("option"));
    o.value = v; o.textContent = v;
  });
  viewSelect.addEventListener("change", () => {
    activeTab = viewSelect.value;
    setActiveTab(activeTab);
    renderChart();
  });
 
  // ── Chart area ────────────────────────────
  const chartDiv = wrapper.appendChild(document.createElement("div"));
 
  // ── Footer ────────────────────────────────
  const footer = wrapper.appendChild(document.createElement("p"));
  footer.style.cssText = "font-size:0.75rem;color:#999;margin-top:10px;";
  footer.textContent = "Zillow Economic Research | Source: Zillow Home Value Index";
 
  // ════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════
  const W = 860, H = 400;
  const M = { top: 30, right: 80, bottom: 45, left: 80 };
  const iW = W - M.left - M.right;
  const iH = H - M.top  - M.bottom;
 
  function parseDate(s) {
    const [d, m, y] = s.split("/");
    return new Date(+y, +m - 1, +d);
  }
 
  function renderChart() {
    chartDiv.innerHTML = "";
    const cfg  = tabConfig[activeTab];
    const data = cfg.data.map(d => ({ date: parseDate(d.date), value: d.value }));
    const last = data[data.length - 1];
 
    subtitle.innerHTML = `Select a region below to view data. ${cfg.subtitle(last.value)}`;
 
    const svg = d3.select(chartDiv).append("svg")
      .attr("width", W).attr("height", H).style("display","block");
 
    const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
 
    const x = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([0, iW]);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) * 1.1]).range([iH, 0]);
 
    // Grid
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickSize(-iW).tickFormat(""))
      .call(gg => gg.select(".domain").remove())
      .call(gg => gg.selectAll(".tick line").attr("stroke","#ebebeb"));
 
    // X axis — smart tick spacing based on data range
    const yearSpan = data[data.length-1].date.getFullYear() - data[0].date.getFullYear();
    const tickEvery = yearSpan > 10 ? d3.timeYear.every(5) : d3.timeYear.every(2);
 
    g.append("g")
      .attr("transform", `translate(0,${iH})`)
      .call(d3.axisBottom(x).ticks(tickEvery).tickFormat(d3.timeFormat("%Y")))
      .call(ax => ax.select(".domain").attr("stroke","#ccc"))
      .call(ax => ax.selectAll(".tick line").remove())
      .selectAll("text").style("font-size","12px").style("fill","#666");
 
    // Y axis
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(cfg.yFmt))
      .call(ax => ax.select(".domain").remove())
      .call(ax => ax.selectAll(".tick line").remove())
      .selectAll("text").style("font-size","12px").style("fill","#666");
 
    // Line
    g.append("path")
      .datum(data)
      .attr("fill","none").attr("stroke","#2e86c1").attr("stroke-width", 2.5)
      .attr("d", d3.line().x(d => x(d.date)).y(d => y(d.value)).curve(d3.curveCatmullRom.alpha(0.5)));
 
    // End label
    g.append("text")
      .attr("x", x(last.date) + 6).attr("y", y(last.value) - 8)
      .style("font-size","13px").style("font-weight","600").style("fill","#111")
      .text(cfg.tipFmt(last.value));
 
    // ── Tooltip ──────────────────────────────
    const bisect  = d3.bisector(d => d.date).left;
    const fmtDate = d3.timeFormat("%B %Y");
 
    const vLine = g.append("line")
      .attr("stroke","#bbb").attr("stroke-width",1).attr("stroke-dasharray","4")
      .attr("y1",0).attr("y2",iH).style("opacity",0);
 
    const dot = g.append("circle").attr("r",5)
      .attr("fill","#2e86c1").attr("stroke","#fff").attr("stroke-width",2).style("opacity",0);
 
    const tip  = g.append("g").style("opacity",0);
    const tipBg = tip.append("rect").attr("rx",4).attr("fill","#1a252f").attr("height",46);
    const tipT1 = tip.append("text").attr("fill","#ccc").style("font-size","11px").attr("x",8).attr("y",16);
    const tipT2 = tip.append("text").attr("fill","#3ab3c8").style("font-size","13px")
      .style("font-weight","600").attr("x",8).attr("y",35);
 
    svg.append("rect")
      .attr("transform",`translate(${M.left},${M.top})`)
      .attr("width",iW).attr("height",iH)
      .attr("fill","none").attr("pointer-events","all")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const i  = bisect(data, x.invert(mx), 1);
        const d0 = data[i-1], d1 = data[i] || d0;
        const d  = x.invert(mx) - d0.date > (d1.date - x.invert(mx)) ? d1 : d0;
        const cx = x(d.date), cy = y(d.value);
        vLine.attr("x1",cx).attr("x2",cx).style("opacity",1);
        dot.attr("cx",cx).attr("cy",cy).style("opacity",1);
        tipT1.text(fmtDate(d.date));
        tipT2.text(cfg.tipFmt(d.value));
        const tw = Math.max(tipT1.node().getComputedTextLength(), tipT2.node().getComputedTextLength()) + 16;
        tipBg.attr("width", tw);
        const tx = cx + tw + 12 > iW ? cx - tw - 4 : cx + 4;
        tip.attr("transform",`translate(${tx},${cy - 26})`).style("opacity",1);
      })
      .on("mouseleave", () => {
        vLine.style("opacity",0); dot.style("opacity",0); tip.style("opacity",0);
      });
  }
 
  renderChart();
  return wrapper;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer()).define(["d3"], _3);
  return main;
}
