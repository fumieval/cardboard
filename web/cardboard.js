'use strict';
function genericPlot(sel, data)
{
  var traces = [];
  data.each(function(v, tag){
    var obj = CBOR.decode(v);
    Object.keys(obj).forEach(function(key){
      traces.push({ name: tag + " - " + key
        , x: obj[key].map(function(r){return r[0];})
        , y: obj[key].map(function(r){return r[1];})
        });
    });
  });
  Plotly.newPlot(sel.node(), traces, {margin: {t: 0}} );
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
