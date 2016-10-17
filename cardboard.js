'use strict';

function fromDataset(tag, dataset, queries, data) {
  var enabled=queries["enabled"];
  Object.keys(dataset).forEach(function(k){
        var vals = [];
        dataset[k].forEach(function(v){
            vals.push({x: v[0], y: v[1]});
        });
        data.push({
            key: tag + "-" + k,
            values: vals,
            disabled: enabled != undefined && decodeURIComponent(enabled).split(",").indexOf(k) == -1,
        });
  });
  data.sort(function(a,b){
      if( a.key < b.key ) return -1;
      if( a.key > b.key ) return 1;
      return 0;
  });
  return data;
}

function getQueries()
{
  var vars = [];
  window.location.href
      .slice(window.location.href.indexOf('?') + 1)
      .split('&')
      .forEach(function(q){
          var kv = q.split('=');
          vars.push(kv[0]);
          vars[kv[0]] = kv[1];
      }
  );
  return vars;
}

function addAffine(a, d)
{
  if (Date.prototype.isPrototypeOf(a))
  {
      return new Date(a.getTime() + d)
  } else {
      return a + d
  }
}

function addZoom(chart, svg) {

  var scaleExtent = 10;

  var yAxis       = chart.yAxis;
  var xAxis       = chart.xAxis;
  var xDomain     = chart.xDomain || xAxis.scale().domain;
  var yDomain     = chart.yDomain || yAxis.scale().domain;
  var redraw      = function() { chart.update() };

  var xScale = xAxis.scale();
  var yScale = yAxis.scale();

  var xBound = xScale.domain().slice();
  var yBound = yScale.domain().slice();

  var d3zoom = d3.behavior.zoom();

  function fixDomain(domain, boundary) {
    var d = boundary[1] - boundary[0];
    domain[0] = Math.min(Math.max(domain[0], boundary[0]), addAffine(boundary[1], -d/scaleExtent));
    domain[1] = Math.max(addAffine(boundary[0], d/scaleExtent), Math.min(domain[1], boundary[1]));
    return domain;
  };

  function zoomed() {
    yDomain(fixDomain(yScale.domain(), yBound));
    xDomain(fixDomain(xScale.domain(), xBound));
    redraw();
  };

  function unzoomed() {
    xDomain(x_boundary);
    yDomain(y_boundary);
    redraw();
    d3zoom.scale(1);
    d3zoom.translate([0,0]);
  };

  // initialize wrapper
  d3zoom.x(xScale).scaleExtent([1, scaleExtent]).on('zoom', zoomed);

  svg.call(d3zoom).on('dblclick.zoom', unzoomed);
};

function addChart(section, dataset, dataMap){
  var svg = section.append("svg");
  nv.addGraph(function() {
    var baseChart;
    switch(dataset["type"]) {
        case "line": baseChart = nv.models.lineChart(); break;
        case "scatter": baseChart = nv.models.scatterChart(); break;
    }
    var xscale;
    switch(dataset["xscale"]) {
        case "time": xscale = d3.time.scale.utc(); break;
        default: xscale = d3.scale.linear();
    }
    var chart = baseChart
        .margin({left: 100})  //Adjust chart margins to give the x-axis some breathing room.
        .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
        .showYAxis(true)        //Show the y-axis
        .showXAxis(true)        //Show the x-axis
        .xScale(xscale);
    ;
    if(dataset["xscale"] === "time")
    {
        chart.xAxis.tickFormat(d3.time.format('%H:%M:%S'));
        chart.x(function(d, i) {
            return new Date(d["x"]) });
    } else {
      chart.xAxis
          .axisLabel(dataset["xlabel"]).tickFormat(d3.format(dataset["xformat"]));
    };
    chart.yAxis
        .axisLabel(dataset["ylabel"])
        .tickFormat(d3.format(dataset["yformat"]));

    svg.datum(dataMap[dataset["class"]]).call(chart);

    addZoom(chart, svg);
    nv.utils.windowResize(chart.update);

    return chart;
  });
}

function addSection(section, dataset, dataMap){
  switch(dataset["type"]) {
      case "table": addTable(section, dataset, dataMap); break;
      default: baseChart = nv.models.scatterChart();
  }
}
