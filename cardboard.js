
function fromDataset(tag, dataset, queries, data) {
  enabled=queries["enabled"];
  Object.keys(dataset).forEach(function(k){
        vals = [];
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
          kv = q.split('=');
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
  d3zoom.x(xScale).y(yScale).scaleExtent([1, scaleExtent]).on('zoom', zoomed);

  svg.call(d3zoom).on('dblclick.zoom', unzoomed);
};
