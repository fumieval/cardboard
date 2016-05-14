cardboard - a stopgap visualization web app
====

Usage

```
$ python3 -m http.server 8000
```

Then access `http://localhost:8000/cardboard.html?data=/path/to/foo.json;/path/to/bar.json`

The json files should be a list of objects like

```js
{ "xlabel": "x"
, "ylabel": "y"
, "xscale": "time"
, "xformat": "%H:%M:%S"
, "yformat":".00f"
, "class": "class"
, "type": "line"
, "tag": "unique tag to identify the set of series"
, "series": {"name":[[x0, y0], [x1, y1], [x2, y2], ... ]}
}
```

The results are grouped by the class name.
