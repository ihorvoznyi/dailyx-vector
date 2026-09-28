/* @ds-bundle: {"format":4,"namespace":"Vector","components":[{"name":"Button"},{"name":"Badge"},{"name":"Delta"},{"name":"SegmentedControl"},{"name":"Card"},{"name":"StatTile"},{"name":"Sparkline"},{"name":"TrendChart"},{"name":"FunnelChart"},{"name":"AllocationBar"},{"name":"HoldingsTable"},{"name":"SourceStatus"},{"name":"ProgressRing"},{"name":"Icon"},{"name":"SkillNode"},{"name":"SkillPanel"},{"name":"SkillTree"},{"name":"HypothesisCanvas"},{"name":"HypothesisPanel"},{"name":"EvidenceMeter"},{"name":"ForestPlot"},{"name":"CalibrationChart"},{"name":"FreedomMeter"},{"name":"ActionQueue"},{"name":"ClientCard"},{"name":"ProjectCard"},{"name":"PayoutBar"},{"name":"IncomeForecast"},{"name":"ChannelLens"},{"name":"ChannelFunnel"},{"name":"ChannelHealth"},{"name":"ChannelPortfolio"},{"name":"ChannelPicker"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, useMemo = React.useMemo;

  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  var reduced = function () { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  var SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)'];

  /* ---------- number formatting ---------- */
  function fmt(v, o) {
    o = o || {};
    if (v == null || isNaN(v)) return '—';
    var d = o.decimals != null ? o.decimals : 0, s;
    if (o.compact) {
      var a = Math.abs(v), u = '';
      if (a >= 1e9) { v = v / 1e9; u = 'B'; } else if (a >= 1e6) { v = v / 1e6; u = 'M'; } else if (a >= 1e4) { v = v / 1e3; u = 'K'; }
      s = v.toLocaleString('en-US', { minimumFractionDigits: u ? 1 : d, maximumFractionDigits: u ? 1 : d }) + u;
    } else {
      s = v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    }
    if (s.charAt(0) === '-') return '−' + (o.prefix || '') + s.slice(1) + (o.suffix || '');
    return (o.prefix || '') + s + (o.suffix || '');
  }

  function useCountUp(target, dur) {
    var st = useState(reduced() ? target : 0), val = st[0], set = st[1];
    var from = useRef(reduced() ? target : 0);
    useEffect(function () {
      if (reduced()) { set(target); return; }
      var start = null, a = from.current, raf;
      function step(t) {
        if (start == null) start = t;
        var p = Math.min(1, (t - start) / (dur || 900));
        var e = 1 - Math.pow(1 - p, 4);
        var v = a + (target - a) * e;
        from.current = v; set(v);
        if (p < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
      return function () { cancelAnimationFrame(raf); };
    }, [target]);
    return val;
  }

  function useWidth(fallback) {
    var ref = useRef(null), st = useState(fallback || 600);
    useEffect(function () {
      if (!ref.current || typeof ResizeObserver === 'undefined') return;
      var ro = new ResizeObserver(function (en) { var w = en[0].contentRect.width; if (w > 0) st[1](w); });
      ro.observe(ref.current);
      return function () { ro.disconnect(); };
    }, []);
    return [ref, st[0]];
  }

  function niceTicks(min, max, n) {
    if (min === max) { max = min + 1; }
    var span = max - min, step = Math.pow(10, Math.floor(Math.log10(span / n))), err = (n * step) / span;
    if (err <= 0.15) step *= 10; else if (err <= 0.35) step *= 5; else if (err <= 0.75) step *= 2;
    var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, t = [];
    for (var v = lo; v <= hi + step / 2; v += step) t.push(Math.round(v * 1e6) / 1e6);
    return t;
  }

  /* ---------- Button ---------- */
  function Button(p) {
    var variant = p.variant || 'ghost', size = p.size || 'md';
    var rest = Object.assign({}, p); delete rest.variant; delete rest.size; delete rest.icon; delete rest.loading; delete rest.children; delete rest.className;
    return h('button', Object.assign({ type: 'button' }, rest, { className: cx('vx-btn', 'vx-btn-' + variant, size === 'sm' && 'vx-btn-sm', p.className), 'aria-busy': p.loading || undefined }),
      p.loading ? h('span', { className: 'vx-spin', 'aria-hidden': true }, '↻') : p.icon ? h('span', { 'aria-hidden': true }, p.icon) : null,
      p.children);
  }

  /* ---------- Badge ---------- */
  function Badge(p) {
    return h('span', { className: cx('vx-badge', p.tone && p.tone !== 'neutral' && 'vx-badge-' + p.tone) }, p.children);
  }

  /* ---------- Delta ---------- */
  function Delta(p) {
    var v = p.value, invert = !!p.invert;
    var dir = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
    var good = dir === 'flat' ? 'flat' : ((dir === 'up') !== invert ? 'up' : 'down');
    var glyph = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '■';
    var abs = Math.abs(v);
    var text = p.format === 'abs' ? fmt(abs, { prefix: p.prefix, suffix: p.suffix, decimals: p.decimals != null ? p.decimals : 0, compact: p.compact }) : fmt(abs, { suffix: '%', decimals: p.decimals != null ? p.decimals : 1 });
    var sign = dir === 'up' ? '+' : dir === 'down' ? '−' : '';
    var label = (dir === 'up' ? 'up ' : dir === 'down' ? 'down ' : 'unchanged ') + text;
    return h('span', { className: cx('vx-delta', 'vx-delta-' + good, p.plain && 'vx-delta-plain'), 'aria-label': label, title: label },
      h('span', { 'aria-hidden': true, style: { fontSize: '9px' } }, glyph), sign + text);
  }

  /* ---------- SegmentedControl ---------- */
  function SegmentedControl(p) {
    var opts = (p.options || []).map(function (o) { return typeof o === 'string' ? { value: o, label: o } : o; });
    var inner = useState(p.defaultValue || (opts[0] && opts[0].value));
    var value = p.value != null ? p.value : inner[0];
    var refs = useRef({}), wrap = useRef(null), th = useState({ left: 3, width: 0 });
    useEffect(function () {
      var el = refs.current[value];
      if (el) th[1]({ left: el.offsetLeft, width: el.offsetWidth });
    }, [value, opts.length]);
    function pick(v) { inner[1](v); if (p.onChange) p.onChange(v); }
    function key(e) {
      var i = opts.findIndex(function (o) { return o.value === value; });
      if (e.key === 'ArrowRight') { e.preventDefault(); var n = opts[(i + 1) % opts.length]; pick(n.value); refs.current[n.value].focus(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); var q = opts[(i - 1 + opts.length) % opts.length]; pick(q.value); refs.current[q.value].focus(); }
    }
    return h('div', { className: 'vx-seg', role: 'tablist', 'aria-label': p.label || 'Range', ref: wrap, onKeyDown: key },
      h('span', { className: 'vx-seg-thumb', style: { left: th[0].left + 'px', width: th[0].width + 'px' }, 'aria-hidden': true }),
      opts.map(function (o) {
        var sel = o.value === value;
        return h('button', { key: o.value, type: 'button', role: 'tab', 'aria-selected': sel ? 'true' : 'false', tabIndex: sel ? 0 : -1, ref: function (el) { refs.current[o.value] = el; }, onClick: function () { pick(o.value); } }, o.label);
      }));
  }

  /* ---------- Card ---------- */
  function Card(p) {
    var head = p.title || p.eyebrow || p.action;
    return h('section', { className: cx('vx-card', p.className), style: Object.assign({ animationDelay: (p.delay || 0) + 'ms' }, p.style) },
      head ? h('header', { className: 'vx-card-head' },
        h('div', null,
          p.eyebrow ? h('div', { className: 'vx-eyebrow', style: { marginBottom: 4 } }, p.eyebrow) : null,
          p.title ? h('h3', { className: 'vx-card-title' }, p.title) : null,
          p.meta ? h('p', { className: 'vx-card-meta' }, p.meta) : null),
        p.action || null) : null,
      p.children);
  }

  /* ---------- Sparkline ---------- */
  function Sparkline(p) {
    var data = p.data || [], w = p.width || 96, hgt = p.height || 28;
    if (data.length < 2) return null;
    var min = Math.min.apply(null, data), max = Math.max.apply(null, data), span = max - min || 1;
    var pts = data.map(function (v, i) { return [(i / (data.length - 1)) * w, hgt - 2 - ((v - min) / span) * (hgt - 4)]; });
    var d = pts.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' ');
    var tone = p.tone && p.tone !== 'auto' ? p.tone : (data[data.length - 1] >= data[0] ? 'up' : 'down');
    var col = tone === 'up' ? 'var(--up)' : tone === 'down' ? 'var(--down)' : 'var(--ink-muted)';
    var id = useMemo(function () { return 'sp' + Math.random().toString(36).slice(2, 8); }, []);
    return h('svg', { width: w, height: hgt, viewBox: '0 0 ' + w + ' ' + hgt, role: 'img', 'aria-label': p.label || 'trend', style: { overflow: 'visible', flex: 'none' } },
      h('defs', null, h('linearGradient', { id: id, x1: 0, y1: 0, x2: 0, y2: 1 },
        h('stop', { offset: '0%', stopColor: col, stopOpacity: 0.28 }), h('stop', { offset: '100%', stopColor: col, stopOpacity: 0 }))),
      p.fill === false ? null : h('path', { className: 'vx-fade', d: d + ' L' + w + ' ' + hgt + ' L0 ' + hgt + ' Z', fill: 'url(#' + id + ')' }),
      h('path', { key: d, className: 'vx-draw', d: d, fill: 'none', stroke: col, strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', pathLength: 1, style: { '--len': 1 } }),
      h('circle', { className: 'vx-fade', cx: pts[pts.length - 1][0], cy: pts[pts.length - 1][1], r: 2.5, fill: col }));
  }

  /* ---------- StatTile ---------- */
  function StatTile(p) {
    var v = useCountUp(p.value || 0, 900);
    var f = p.format || {};
    return h(Card, { delay: p.delay, className: p.className },
      h('div', { className: 'vx-stat' },
        h('div', { className: 'vx-stat-top' },
          h('span', { className: 'vx-eyebrow' }, p.label),
          p.source ? h(Badge, null, p.source) : null),
        h('div', { className: cx('vx-stat-value', p.hero && 'is-hero'), 'aria-label': fmt(p.value, f) }, fmt(v, f)),
        h('div', { className: 'vx-stat-foot' },
          h('div', null,
            p.delta != null ? h(Delta, { value: p.delta, invert: p.invert, format: p.deltaFormat, prefix: f.prefix, compact: f.compact }) : null,
            p.deltaLabel ? h('span', { className: 'vx-stat-ctx' }, p.deltaLabel) : null),
          p.spark ? h(Sparkline, { data: p.spark, tone: p.invert ? (p.delta > 0 ? 'down' : 'up') : 'auto', width: 88, height: 28 }) : null)));
  }

  /* ---------- TrendChart ---------- */
  function TrendChart(p) {
    var wr = useWidth(640), ref = wr[0], W = wr[1];
    var H = p.height || 220, pad = { t: 12, r: 8, b: 26, l: 52 };
    var series = p.series || [];
    var f = p.format || {};
    var hov = useState(null), hi = hov[0], setHi = hov[1];
    var n = series[0] ? series[0].data.length : 0;
    var all = [];
    series.forEach(function (s) { s.data.forEach(function (d) { all.push(d.y); }); });
    var lo = Math.min.apply(null, all), top = Math.max.apply(null, all);
    if (p.zero) lo = Math.min(0, lo);
    var ticks = niceTicks(lo, top, 4), y0 = ticks[0], y1 = ticks[ticks.length - 1];
    var iw = Math.max(10, W - pad.l - pad.r), ih = H - pad.t - pad.b;
    var X = function (i) { return pad.l + (n > 1 ? (i / (n - 1)) * iw : iw / 2); };
    var Y = function (v) { return pad.t + ih - ((v - y0) / (y1 - y0 || 1)) * ih; };
    var gid = useMemo(function () { return 'tc' + Math.random().toString(36).slice(2, 8); }, []);
    var sig = series.map(function (s) { return s.name + s.data.length + (s.data[0] && s.data[0].y) + (s.data[n - 1] && s.data[n - 1].y); }).join('|');
    var xEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 90))));
    function move(e) {
      var r = e.currentTarget.getBoundingClientRect(), x = e.clientX - r.left;
      var i = Math.round(((x - pad.l) / iw) * (n - 1));
      setHi(Math.max(0, Math.min(n - 1, i)));
    }
    var colorOf = function (s, i) { return s.color || SERIES[i % SERIES.length]; };
    return h('div', { className: 'vx-chart', ref: ref },
      h('svg', { height: H, viewBox: '0 0 ' + W + ' ' + H, onMouseMove: move, onMouseLeave: function () { setHi(null); }, role: 'img', 'aria-label': p.label || (series[0] && series[0].name) || 'trend chart' },
        h('defs', null, series.map(function (s, i) {
          return h('linearGradient', { key: i, id: gid + i, x1: 0, y1: 0, x2: 0, y2: 1 },
            h('stop', { offset: '0%', stopColor: colorOf(s, i), stopOpacity: i === 0 ? 0.26 : 0.1 }),
            h('stop', { offset: '100%', stopColor: colorOf(s, i), stopOpacity: 0 }));
        })),
        ticks.map(function (t) {
          return h('g', { key: t },
            h('line', { className: 'vx-grid', x1: pad.l, x2: W - pad.r, y1: Y(t), y2: Y(t), strokeOpacity: t === y0 ? 1 : 0.55 }),
            h('text', { className: 'vx-tick', x: pad.l - 10, y: Y(t) + 4, textAnchor: 'end' }, fmt(t, { prefix: f.prefix, suffix: f.suffix, compact: true })));
        }),
        series[0] ? series[0].data.map(function (d, i) {
          if (i % xEvery !== 0 && i !== n - 1) return null;
          if (i !== n - 1 && n - 1 - i < xEvery * 0.6) return null;
          return h('text', { key: i, className: 'vx-tick', x: X(i), y: H - 6, textAnchor: i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle' }, d.x);
        }) : null,
        series.map(function (s, i) {
          var line = s.data.map(function (d, j) { return (j ? 'L' : 'M') + X(j).toFixed(1) + ' ' + Y(d.y).toFixed(1); }).join(' ');
          var area = line + ' L' + X(n - 1) + ' ' + Y(y0) + ' L' + X(0) + ' ' + Y(y0) + ' Z';
          return h('g', { key: sig + i },
            s.area === false ? null : h('path', { className: 'vx-fade', d: area, fill: 'url(#' + gid + i + ')' }),
            h('path', { className: s.dashed ? 'vx-fade' : 'vx-draw', d: line, fill: 'none', stroke: colorOf(s, i), strokeWidth: i === 0 ? 2 : 1.5, strokeDasharray: s.dashed ? '4 4' : undefined, strokeLinejoin: 'round', strokeLinecap: 'round', pathLength: s.dashed ? undefined : 1, style: s.dashed ? undefined : { '--len': 1 } }));
        }),
        (p.markers || []).map(function (m, j) {
          var i = typeof m.at === 'number' ? m.at : (series[0] ? series[0].data.findIndex(function (d) { return d.x === m.at; }) : -1);
          if (i == null || i < 0 || i >= n) return null;
          var col = m.tone === 'info' ? 'var(--info)' : m.tone === 'up' ? 'var(--up)' : m.tone === 'warn' ? 'var(--warn)' : m.tone === 'down' ? 'var(--down)' : 'var(--ink-faint)';
          var right = X(i) > W - 90;
          return h('g', { key: 'mk' + j },
            h('line', { x1: X(i), x2: X(i), y1: pad.t, y2: pad.t + ih, stroke: col, strokeWidth: 1.5, strokeDasharray: '4 3' }),
            h('text', { className: 'vx-tick', x: right ? X(i) - 5 : X(i) + 5, y: pad.t + 9 + (m.row || 0) * 13, textAnchor: right ? 'end' : 'start', style: { fill: col } }, m.label));
        }),
        hi != null ? h('g', null,
          h('line', { className: 'vx-cross', x1: X(hi), x2: X(hi), y1: pad.t, y2: pad.t + ih }),
          series.map(function (s, i) { return h('circle', { key: i, cx: X(hi), cy: Y(s.data[hi].y), r: 4, fill: 'var(--bg-100)', stroke: colorOf(s, i), strokeWidth: 2 }); })) : null),
      hi != null ? h('div', { className: 'vx-tip', style: { left: Math.min(Math.max(X(hi), 70), W - 70) + 'px', top: Y(series[0].data[hi].y) + 'px' } },
        h('div', { className: 'vx-faint', style: { marginBottom: 4 } }, series[0].data[hi].label || series[0].data[hi].x),
        series.map(function (s, i) {
          return h('div', { key: i, className: 'vx-tip-row' }, h('span', { className: 'vx-sw', style: { background: colorOf(s, i) } }), h('span', { className: 'vx-muted' }, s.name), h('span', { className: 'vx-num', style: { marginLeft: 'auto', paddingLeft: 12, color: 'var(--ink)' } }, fmt(s.data[hi].y, f)));
        })) : null,
      series.length > 1 && p.legend !== false ? h('div', { className: 'vx-legend' }, series.map(function (s, i) {
        return h('span', { key: i, className: 'vx-row', style: { gap: 6 } }, h('span', { className: 'vx-sw', style: { background: colorOf(s, i) } }), s.name);
      })) : null);
  }

  /* ---------- FunnelChart ---------- */
  function FunnelChart(p) {
    var st = p.stages || [], max = st.length ? st[0].value || 1 : 1, out = [];
    st.forEach(function (s, i) {
      if (i > 0) {
        var prev = st[i - 1].value, conv = prev ? (s.value / prev) * 100 : 0;
        out.push(h('div', { key: 'c' + i, className: 'vx-fconv', 'aria-hidden': true }, h('span'), h('span', null, '↳ ' + fmt(conv, { decimals: conv < 10 ? 1 : 0 }) + '% ' + (s.convLabel || 'convert')), h('span')));
      }
      var pct = Math.max(1.5, (s.value / max) * 100);
      out.push(h('div', { key: s.label, className: 'vx-fstage' },
        h('span', { className: 'vx-muted', style: { fontSize: 14 } }, s.label),
        h('div', { className: 'vx-fbar-track' }, h('div', { className: 'vx-fbar', style: { width: pct + '%', animationDelay: i * 90 + 'ms', opacity: 1 - i * 0.14, background: s.color } })),
        h('span', { className: 'vx-num', style: { textAlign: 'right', fontSize: 16, color: 'var(--ink)' } }, fmt(s.value, p.format))));
    });
    var first = st[0], last = st[st.length - 1];
    return h('div', null,
      h('div', { className: 'vx-funnel', role: 'list', 'aria-label': 'Funnel' }, out),
      first && last && p.summary !== false ? h('div', { className: 'vx-row', style: { marginTop: 16, justifyContent: 'space-between' } },
        h('span', { className: 'vx-faint', style: { fontSize: 12 } }, first.label + ' → ' + last.label),
        h('span', { className: 'vx-num', style: { color: 'var(--up)', fontSize: 16 } }, fmt((last.value / (first.value || 1)) * 100, { decimals: 1, suffix: '%' }))) : null);
  }

  /* ---------- AllocationBar ---------- */
  function AllocationBar(p) {
    var items = p.items || [], total = items.reduce(function (a, b) { return a + b.value; }, 0) || 1, f = p.format || {};
    return h('div', null,
      h('div', { className: 'vx-alloc-bar', role: 'img', 'aria-label': items.map(function (it) { return it.label + ' ' + Math.round((it.value / total) * 100) + '%'; }).join(', ') },
        items.map(function (it, i) {
          return h('div', { key: it.label, className: 'vx-alloc-seg', style: { flex: it.value + ' 1 0', background: it.color || SERIES[i % SERIES.length], animationDelay: i * 80 + 'ms' } });
        })),
      h('ul', { className: 'vx-alloc-list' }, items.map(function (it, i) {
        return h('li', { key: it.label, className: 'vx-alloc-item' },
          h('span', { className: 'vx-sw', style: { width: 10, height: 10, background: it.color || SERIES[i % SERIES.length] } }),
          h('span', { style: { minWidth: 0 } }, h('div', { style: { fontWeight: 600 } }, it.label), it.detail ? h('div', { className: 'vx-faint', style: { fontSize: 12, lineHeight: '16px' } }, it.detail) : null),
          h('span', { className: 'vx-num', style: { fontSize: 16 } }, fmt(it.value, f)),
          h('span', { className: 'vx-num vx-faint', style: { fontSize: 12, textAlign: 'right' } }, Math.round((it.value / total) * 100) + '%'));
      })));
  }

  /* ---------- HoldingsTable ---------- */
  function HoldingsTable(p) {
    var rows = p.rows || [], f = p.format || { prefix: '$', decimals: 2 };
    return h('div', { style: { overflowX: 'auto' } }, h('table', { className: 'vx-table' },
      h('thead', null, h('tr', null, h('th', null, 'Symbol'), h('th', { className: 'r' }, 'Qty'), h('th', { className: 'r' }, 'Price'), h('th', { className: 'r' }, 'Value'), h('th', { className: 'r' }, 'Day'))),
      h('tbody', null, rows.map(function (r) {
        return h('tr', { key: r.symbol },
          h('td', null, h('div', { className: 'vx-sym' }, r.symbol), r.name ? h('div', { className: 'vx-faint', style: { fontSize: 12, lineHeight: '16px' } }, r.name) : null),
          h('td', { className: 'r vx-num vx-muted' }, fmt(r.qty, { decimals: r.qty % 1 ? 2 : 0 })),
          h('td', { className: 'r vx-num vx-muted' }, fmt(r.price, f)),
          h('td', { className: 'r vx-num' }, fmt(r.value != null ? r.value : r.qty * r.price, f)),
          h('td', { className: 'r' }, h(Delta, { value: r.change, plain: true })));
      }))));
  }

  /* ---------- SourceStatus ---------- */
  var STATUS = { live: ['up', 'Live'], syncing: ['info', 'Syncing'], stale: ['warn', 'Stale'], error: ['down', 'Error'] };
  function SourceStatus(p) {
    var s = STATUS[p.status] || STATUS.live;
    var mark = p.mark || (p.name || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();
    return h('div', { className: 'vx-src' },
      h('span', { className: 'vx-src-mark', 'aria-hidden': true }, mark),
      h('div', { className: 'vx-src-body' },
        h('div', { className: 'vx-src-name' }, p.name),
        h('div', { className: 'vx-src-detail' }, [p.detail, p.lastSync].filter(Boolean).join(' · '))),
      h(Badge, { tone: s[0] }, h('span', { className: cx('vx-dot', 'vx-dot-' + (p.status || 'live')), 'aria-hidden': true }), s[1]));
  }

  /* ---------- ProgressRing ---------- */
  function ProgressRing(p) {
    var size = p.size || 48, sw = p.stroke || 5, r = (size - sw) / 2, c = 2 * Math.PI * r;
    var v = Math.max(0, Math.min(1, p.value || 0));
    var st = useState(reduced() ? v : 0);
    useEffect(function () { var t = setTimeout(function () { st[1](v); }, 30); return function () { clearTimeout(t); }; }, [v]);
    var col = p.tone === 'warn' ? 'var(--warn)' : p.tone === 'down' ? 'var(--down)' : p.tone === 'info' ? 'var(--info)' : 'var(--up)';
    return h('span', { className: 'vx-ring', role: 'img', 'aria-label': (p.label || 'progress') + ' ' + Math.round(v * 100) + '%' },
      h('svg', { width: size, height: size },
        h('circle', { className: 'vx-ring-track', cx: size / 2, cy: size / 2, r: r, fill: 'none', strokeWidth: sw }),
        h('circle', { className: 'vx-ring-bar', cx: size / 2, cy: size / 2, r: r, fill: 'none', stroke: col, strokeWidth: sw, strokeDasharray: c, strokeDashoffset: c * (1 - st[0]) })),
      p.showValue === false ? null : h('span', { className: 'vx-ring-label', style: { fontSize: size >= 64 ? 14 : 11 } }, p.center != null ? p.center : Math.round(v * 100) + '%'));
  }

  /* ---------- Icons ---------- */
  var ICONS = {
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
    money: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.6-.6-3-1.5M12 6.5v11"/>',
    chart: '<path d="M4 20h16"/><path d="M6 16v-3M10 16v-6M14 16v-4M18 16V7"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>',
    invoice: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5"/><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.5 3.5 5.2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6"/>',
    pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
    megaphone: '<path d="M3 10v4h4l8 5V5L7 10z"/><path d="M18 9a4 4 0 0 1 0 6"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/>',
    rocket: '<path d="M12 3c3 2 5 5.5 5 9.5L15 16H9l-2-3.5C7 8.5 9 5 12 3z"/><circle cx="12" cy="10" r="1.8"/><path d="M9 16l-2 4 3-1M15 16l2 4-3-1"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c2 2 10 2 12 0v-5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-4.5"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    repeat: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>',
    bank: '<path d="M3 9l9-5 9 5z"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    minus: '<path d="M5 12h14"/>',
    fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'
  };
  function Icon(p) {
    var s = p.size || 20;
    return h('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: p.stroke || 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': p.label ? undefined : true, role: p.label ? 'img' : undefined, 'aria-label': p.label, className: p.className, style: p.style, dangerouslySetInnerHTML: { __html: ICONS[p.name] || ICONS.target } });
  }
  Icon.names = Object.keys(ICONS);

  /* ---------- Skill tree: model ---------- */
  function skillProgress(n) {
    if (!n || (n.goal && !n.title)) return 0;
    if (n.metric) return Math.max(0, Math.min(1, (n.metric.current || 0) / (n.metric.target || 1)));
    if (n.steps && n.steps.length) return n.steps.filter(function (s) { return s.done; }).length / n.steps.length;
    if (n.maxLevel) return Math.max(0, Math.min(1, (n.level || 0) / n.maxLevel));
    return Math.max(0, Math.min(1, n.progress || 0));
  }
  function nodeState(n, byId) {
    if (n.goal && !n.title) return 'goal';
    var p = skillProgress(n);
    if (p >= 1) return 'mastered';
    if (p > 0) return 'active';
    var ok = (n.requires || []).every(function (id) { var r = byId[id]; return r && skillProgress(r) >= 1; });
    return ok ? 'available' : 'locked';
  }
  var STATE_LABEL = { locked: 'Locked', available: 'Ready to start', active: 'In progress', mastered: 'Mastered', goal: 'Set your own goal' };
  var STATE_TONE = { locked: 'neutral', available: 'warn', active: 'up', mastered: 'up', goal: 'neutral' };
  function indexNodes(nodes) { var m = {}; nodes.forEach(function (n) { m[n.id] = n; }); return m; }
  function tierOf(row, rows) { var t = rows <= 1 ? 1 : 1 - row / (rows - 1); return t > 0.66 ? 'Advanced' : t > 0.33 ? 'Intermediate' : 'Basics'; }

  /* hex geometry: flat-top, stretched; slant = 22% of width */
  var HEX_W = 156, HEX_H = 112, HEX_GAP = 8, SLANT = 0.22;
  var PITCH_X = HEX_W * (1 - SLANT) + HEX_GAP, PITCH_Y = HEX_H + HEX_GAP;
  function cellXY(col, row) { return [col * PITCH_X, row * PITCH_Y + (col % 2 ? PITCH_Y / 2 : 0)]; }
  function nearestCell(x, y) {
    var col = Math.round(x / PITCH_X), row = Math.round((y - (Math.abs(col) % 2 ? PITCH_Y / 2 : 0)) / PITCH_Y);
    return [col, row];
  }
  function hexPath(w, hgt, r) {
    var s = w * SLANT, pts = [[s, 0], [w - s, 0], [w, hgt / 2], [w - s, hgt], [s, hgt], [0, hgt / 2]], d = '';
    for (var i = 0; i < 6; i++) {
      var p0 = pts[(i + 5) % 6], p1 = pts[i], p2 = pts[(i + 1) % 6];
      var v1 = [p0[0] - p1[0], p0[1] - p1[1]], v2 = [p2[0] - p1[0], p2[1] - p1[1]];
      var l1 = Math.hypot(v1[0], v1[1]), l2 = Math.hypot(v2[0], v2[1]);
      var a = [p1[0] + v1[0] / l1 * r, p1[1] + v1[1] / l1 * r], b = [p1[0] + v2[0] / l2 * r, p1[1] + v2[1] / l2 * r];
      d += (i ? 'L' : 'M') + a[0].toFixed(2) + ' ' + a[1].toFixed(2) + 'Q' + p1[0] + ' ' + p1[1] + ' ' + b[0].toFixed(2) + ' ' + b[1].toFixed(2);
    }
    return d + 'Z';
  }
  var HEX_D = hexPath(HEX_W, HEX_H, 7);
  var uid = 0;

  /* ---------- SkillNode (hex tile) ---------- */
  function SkillNode(p) {
    var n = p.node || p, state = p.state || nodeState(n, {}), prog = p.progress != null ? p.progress : skillProgress(n);
    var cid = useMemo(function () { return 'vxh' + (++uid); }, []);
    var fillH = HEX_H * prog;
    var label = state === 'goal' ? 'Set your own goal' : n.title;
    var meta = state === 'goal' ? null : state === 'mastered' ? '1 pt' : state === 'locked' ? null :
      n.metric ? Math.round(prog * 100) + '%' : n.steps && n.steps.length ? n.steps.filter(function (s) { return s.done; }).length + '/' + n.steps.length : n.maxLevel ? (n.level || 0) + '/' + n.maxLevel : prog > 0 ? Math.round(prog * 100) + '%' : null;
    return h('div', { className: cx('vx-hex', 'is-' + state, p.selected && 'is-selected', p.dragging && 'is-dragging', p.dim && 'is-dim'), style: p.style },
      h('svg', { className: 'vx-hex-svg', width: HEX_W, height: HEX_H, viewBox: '0 0 ' + HEX_W + ' ' + HEX_H, 'aria-hidden': true },
        h('defs', null, h('clipPath', { id: cid }, h('path', { d: HEX_D }))),
        h('path', { className: 'vx-hex-body', d: HEX_D }),
        state === 'active' ? h('g', { clipPath: 'url(#' + cid + ')' },
          h('rect', { className: 'vx-hex-fill', x: 0, y: HEX_H - fillH, width: HEX_W, height: fillH }),
          h('line', { className: 'vx-hex-level', x1: 0, x2: HEX_W, y1: HEX_H - fillH, y2: HEX_H - fillH })) : null,
        h('path', { className: 'vx-hex-edge', d: HEX_D })),
      h('button', { type: 'button', className: 'vx-hex-hit', onPointerDown: p.onPointerDown, onClick: p.onClick, onKeyDown: p.onKeyDown, 'aria-pressed': p.selected ? 'true' : 'false',
        'aria-label': label + ', ' + STATE_LABEL[state] + (state === 'active' ? ', ' + Math.round(prog * 100) + '%' : '') },
        h('span', { className: 'vx-hex-ico' }, h(Icon, { name: state === 'goal' ? 'plus' : state === 'mastered' ? (n.icon || 'check') : n.icon, size: 20 })),
        h('span', { className: 'vx-hex-title' }, label),
        meta ? h('span', { className: 'vx-hex-meta' }, meta) : null,
        state === 'locked' ? h('span', { className: 'vx-hex-lock' }, h(Icon, { name: 'lock', size: 11, stroke: 2 })) : null));
  }

  /* ---------- SkillPanel (node detail) ---------- */
  function SkillPanel(p) {
    var n = p.node, byId = p.byId || {}, nodes = p.nodes || [];
    var draft = useState(''), dv = draft[0];
    useEffect(function () { draft[1](''); }, [n && n.id]);
    if (!n) return null;
    var state = nodeState(n, byId), prog = skillProgress(n);
    var upd = function (patch) { if (p.onChange) p.onChange(Object.assign({}, n, patch)); };
    var unlocks = nodes.filter(function (m) { return (m.requires || []).indexOf(n.id) >= 0; });
    var chip = function (m) {
      var ms = nodeState(m, byId);
      return h('button', { key: m.id, type: 'button', className: cx('vx-chip', 'is-' + ms), onClick: function () { if (p.onSelect) p.onSelect(m.id); } },
        h(Icon, { name: ms === 'mastered' ? 'check' : ms === 'locked' ? 'lock' : m.icon, size: 13, stroke: 2 }), m.title || 'Goal');
    };
    var body;
    if (state === 'goal') {
      body = h('form', { className: 'vx-panel-sec', onSubmit: function (e) { e.preventDefault(); if (dv.trim()) upd({ title: dv.trim(), icon: 'flag', steps: [{ id: 's1', label: 'Define what done looks like', done: false }] }); } },
        h('label', { className: 'vx-eyebrow', htmlFor: 'vx-goal-in' }, 'Your goal'),
        h('input', { id: 'vx-goal-in', className: 'vx-input', value: dv, placeholder: 'e.g. Land a $20K contract', onChange: function (e) { draft[1](e.target.value); }, autoFocus: true }),
        h(Button, { variant: 'primary', type: 'submit', disabled: !dv.trim() }, 'Save goal'));
    } else {
      body = h(React.Fragment, null,
        n.description ? h('p', { className: 'vx-panel-desc' }, n.description) : null,
        n.metric ? h('div', { className: 'vx-panel-sec' },
          h('div', { className: 'vx-row', style: { justifyContent: 'space-between' } }, h('span', { className: 'vx-eyebrow' }, 'Tracked automatically'), h(Badge, { tone: 'info' }, n.metric.source || 'Source')),
          h('div', { className: 'vx-row', style: { justifyContent: 'space-between', alignItems: 'baseline' } },
            h('span', { className: 'vx-muted' }, n.metric.label),
            h('span', { className: 'vx-num', style: { fontSize: 16 } }, fmt(n.metric.current, n.metric.format), h('span', { className: 'vx-faint' }, ' / ' + fmt(n.metric.target, n.metric.format)))),
          h('div', { className: 'vx-meter' }, h('div', { className: 'vx-meter-bar', style: { width: prog * 100 + '%' } })),
          h('span', { className: 'vx-faint', style: { fontSize: 12 } }, 'Read-only · updates on every sync')) : null,
        !n.metric && n.steps && n.steps.length ? h('div', { className: 'vx-panel-sec' },
          h('span', { className: 'vx-eyebrow' }, 'Steps · ' + n.steps.filter(function (s) { return s.done; }).length + ' of ' + n.steps.length),
          h('ul', { className: 'vx-checks' }, n.steps.map(function (s, i) {
            return h('li', { key: s.id || i }, h('button', { type: 'button', role: 'checkbox', 'aria-checked': s.done ? 'true' : 'false', className: cx('vx-check', s.done && 'on'), onClick: function () {
              var steps = n.steps.map(function (x, j) { return j === i ? Object.assign({}, x, { done: !x.done }) : x; });
              upd({ steps: steps, doneAt: steps.every(function (x) { return x.done; }) ? (n.doneAt || new Date().toISOString().slice(0, 10)) : null });
            } }, h('span', { className: 'vx-check-box' }, s.done ? h(Icon, { name: 'check', size: 12, stroke: 2.5 }) : null), s.label));
          }))) : null,
        !n.metric && !(n.steps && n.steps.length) && n.maxLevel ? h('div', { className: 'vx-panel-sec' },
          h('span', { className: 'vx-eyebrow' }, 'Level'),
          h('div', { className: 'vx-row' },
            h(Button, { size: 'sm', variant: 'ghost', 'aria-label': 'Level down', disabled: !(n.level > 0), onClick: function () { upd({ level: Math.max(0, (n.level || 0) - 1) }); } }, h(Icon, { name: 'minus', size: 14 })),
            h('span', { className: 'vx-num', style: { minWidth: 48, textAlign: 'center', fontSize: 16 } }, (n.level || 0) + ' / ' + n.maxLevel),
            h(Button, { size: 'sm', variant: 'ghost', 'aria-label': 'Level up', disabled: (n.level || 0) >= n.maxLevel, onClick: function () { upd({ level: Math.min(n.maxLevel, (n.level || 0) + 1) }); } }, h(Icon, { name: 'plus', size: 14 })))) : null,
        (n.requires || []).length ? h('div', { className: 'vx-panel-sec' }, h('span', { className: 'vx-eyebrow' }, 'Requires'), h('div', { className: 'vx-row' }, n.requires.map(function (id) { return byId[id] ? chip(byId[id]) : null; }))) : null,
        unlocks.length ? h('div', { className: 'vx-panel-sec' }, h('span', { className: 'vx-eyebrow' }, 'Unlocks'), h('div', { className: 'vx-row' }, unlocks.map(chip))) : null,
        n.notes ? h('div', { className: 'vx-panel-sec' }, h('span', { className: 'vx-eyebrow' }, 'Notes'), h('p', { className: 'vx-panel-desc', style: { margin: 0 } }, n.notes)) : null);
    }
    return h('aside', { className: cx('vx-panel', p.className), 'aria-label': (n.title || 'Goal') + ' details' },
      h('header', { className: 'vx-panel-head' },
        h('span', { className: cx('vx-panel-ico', 'is-' + state) }, h(Icon, { name: state === 'goal' ? 'plus' : n.icon, size: 20 })),
        h('div', { style: { minWidth: 0, flex: 1 } },
          h('div', { className: 'vx-eyebrow' }, (n.tier || '') + (n.tier ? ' · ' : '') + (state === 'mastered' ? '1 pt earned' : '0 / 1 pt')),
          h('h3', { className: 'vx-card-title', style: { marginTop: 2 } }, n.title || 'Set your own goal')),
        p.onClose ? h('button', { type: 'button', className: 'vx-icon-btn', 'aria-label': 'Close', onClick: p.onClose }, h(Icon, { name: 'close', size: 16 })) : null),
      state === 'goal' ? null : h('div', { className: 'vx-panel-status' },
        h(ProgressRing, { value: prog, size: 56, tone: state === 'available' ? 'warn' : 'up', label: n.title }),
        h('div', null, h(Badge, { tone: STATE_TONE[state] }, STATE_LABEL[state]),
          h('div', { className: 'vx-faint', style: { fontSize: 12, marginTop: 6 } }, n.doneAt ? 'Mastered ' + n.doneAt : n.startedAt ? 'Started ' + n.startedAt : state === 'locked' ? 'Master what it requires first' : 'Not started'))),
      h('div', { className: 'vx-panel-body' }, body),
      state !== 'goal' && !n.metric && state !== 'locked' ? h('footer', { className: 'vx-panel-foot' },
        state === 'mastered'
          ? h(Button, { variant: 'quiet', size: 'sm', onClick: function () { upd({ doneAt: null, level: n.maxLevel ? 0 : n.level, progress: 0, steps: n.steps && n.steps.map(function (s) { return Object.assign({}, s, { done: false }); }) }); } }, 'Reset progress')
          : h(Button, { variant: 'primary', size: 'sm', icon: h(Icon, { name: 'check', size: 14, stroke: 2.25 }), onClick: function () { upd({ doneAt: new Date().toISOString().slice(0, 10), level: n.maxLevel || n.level, progress: 1, steps: n.steps && n.steps.map(function (s) { return Object.assign({}, s, { done: true }); }) }); } }, 'Mark mastered')) : null);
  }

  /* ---------- SkillTree (canvas) ---------- */
  function SkillTree(p) {
    var inner = useState(p.defaultNodes || p.nodes || []);
    var nodes = p.nodes && p.onChange ? p.nodes : inner[0];
    function commit(next) { inner[1](next); if (p.onChange) p.onChange(next); }
    var byId = indexNodes(nodes);
    var selS = useState(p.defaultSelected || null), selected = p.selected !== undefined ? p.selected : selS[0];
    var glideS = useState(false), glideT = useRef(null);
    function glide() { glideS[1](true); clearTimeout(glideT.current); glideT.current = setTimeout(function () { glideS[1](false); }, 320); }
    function select(id) {
      selS[1](id);
      var m = id ? byIdRef.current[id] : null;
      if (p.onSelect) p.onSelect(m);
      var sz = sizeRef.current, v = viewRef.current;
      if (m && sz.w >= 640) {
        var c = cellXY(m.col, m.row), right = v.x + (c[0] + HEX_W) * v.k, limit = sz.w - 364 - 24;
        if (right > limit) { glide(); viewS[1]({ k: v.k, x: v.x - (right - limit), y: v.y }); }
      }
    }
    var wrapRef = useRef(null), sizeS = useState({ w: 900, h: p.height || 640 }), size = sizeS[0], sizeRef = useRef(size); sizeRef.current = size;
    var viewS = useState(null), view = viewS[0] || { x: 0, y: 0, k: 1 };
    var dragS = useState(null), drag = dragS[0];
    var panningS = useState(false);
    var g = useRef({ pointers: {}, mode: null });

    var rows = 0, minC = 1e9, maxC = -1e9, minR = 1e9;
    nodes.forEach(function (n) { rows = Math.max(rows, n.row + 1); minC = Math.min(minC, n.col); maxC = Math.max(maxC, n.col); minR = Math.min(minR, n.row); });
    function bounds() {
      var a = cellXY(minC, minR), b = cellXY(maxC, rows - 1);
      return { x0: a[0] - 24, y0: Math.min(a[1], cellXY(minC + 1, minR)[1]) - 24, x1: b[0] + HEX_W + 24, y1: Math.max(b[1], cellXY(maxC - 1, rows - 1)[1]) + PITCH_Y + HEX_H + 72 };
    }
    function fit(sz) {
      sz = sz || size; var b = bounds(), padL = 56;
      var k = Math.min((sz.w - padL - 24) / (b.x1 - b.x0), (sz.h - 32) / (b.y1 - b.y0), 1.1);
      k = Math.max(0.35, k);
      if (!arguments[1]) glide();
      viewS[1]({ k: k, x: padL + (sz.w - padL - 24 - (b.x1 - b.x0) * k) / 2 - b.x0 * k, y: 16 + (sz.h - 32 - (b.y1 - b.y0) * k) / 2 - b.y0 * k });
    }
    useEffect(function () {
      var el = wrapRef.current; if (!el) return;
      var first = true;
      var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function (en) {
        var r = en[0].contentRect, sz = { w: r.width, h: r.height }; sizeS[1](sz);
        if (first) { first = false; fit(sz, true); }
      }) : null;
      if (ro) ro.observe(el); else fit({ w: el.clientWidth, h: el.clientHeight });
      return function () { if (ro) ro.disconnect(); };
    }, []);
    var viewRef = useRef(view); viewRef.current = view;
    function zoomAt(f, cx0, cy0, smooth) {
      if (smooth) glide();
      var v = viewRef.current, k = Math.max(0.35, Math.min(2.2, v.k * f)), r = k / v.k;
      viewS[1]({ k: k, x: cx0 - (cx0 - v.x) * r, y: cy0 - (cy0 - v.y) * r });
    }
    useEffect(function () {
      var el = wrapRef.current; if (!el) return;
      function wheel(e) {
        if (e.target.closest && e.target.closest('.vx-panel')) return;
        e.preventDefault();
        var r = el.getBoundingClientRect(), v = viewRef.current;
        if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
        else viewS[1]({ k: v.k, x: v.x - e.deltaX, y: v.y - e.deltaY });
      }
      function key(e) { if (e.key === 'Escape') select(null); }
      el.addEventListener('wheel', wheel, { passive: false });
      el.addEventListener('keydown', key);
      return function () { el.removeEventListener('wheel', wheel); el.removeEventListener('keydown', key); };
    }, []);

    function local(e) { var r = wrapRef.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function onDown(e, nodeId) {
      if (e.button != null && e.button !== 0) return;
      var st = g.current, pt = local(e);
      st.pointers[e.pointerId] = pt;
      var ids = Object.keys(st.pointers);
      if (ids.length === 2) {
        var a = st.pointers[ids[0]], b = st.pointers[ids[1]];
        st.mode = 'pinch'; st.pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: viewRef.current.k };
        dragS[1](null); return;
      }
      st.start = pt; st.moved = false; st.view0 = viewRef.current;
      if (nodeId && p.editable !== false) { st.mode = 'node'; st.node = nodeId; }
      else if (nodeId) { st.mode = 'click'; st.node = nodeId; }
      else { st.mode = 'pan'; }
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    }
    function onMove(e) {
      var st = g.current; if (!st.mode) return;
      var pt = local(e); st.pointers[e.pointerId] = pt;
      if (st.mode === 'pinch') {
        var ids = Object.keys(st.pointers); if (ids.length < 2) return;
        var a = st.pointers[ids[0]], b = st.pointers[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        zoomAt((st.pinch.k * d / st.pinch.d) / viewRef.current.k, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); return;
      }
      var dx = pt[0] - st.start[0], dy = pt[1] - st.start[1];
      if (!st.moved && Math.hypot(dx, dy) < 5) return;
      st.moved = true;
      if (st.mode === 'pan') { panningS[1](true); viewS[1]({ k: st.view0.k, x: st.view0.x + dx, y: st.view0.y + dy }); }
      if (st.mode === 'node') {
        var n = byIdRef.current[st.node], c = cellXY(n.col, n.row), k = viewRef.current.k;
        var wx = c[0] + dx / k, wy = c[1] + dy / k, cell = nearestCell(wx, wy);
        dragS[1]({ id: st.node, x: wx, y: wy, col: cell[0], row: cell[1] });
      }
    }
    var byIdRef = useRef(byId); byIdRef.current = byId;
    var nodesRef = useRef(nodes); nodesRef.current = nodes;
    function onUp(e) {
      var st = g.current;
      delete st.pointers[e.pointerId];
      if (st.mode === 'pinch') { if (Object.keys(st.pointers).length === 0) st.mode = null; return; }
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
      panningS[1](false);
      if (st.mode === 'node' && st.moved) {
        var n = byIdRef.current[st.node], c = cellXY(n.col, n.row), k = viewRef.current.k, pt = local(e);
        var cell = nearestCell(c[0] + (pt[0] - st.start[0]) / k, c[1] + (pt[1] - st.start[1]) / k);
        if (cell[1] >= 0 && (cell[0] !== n.col || cell[1] !== n.row)) {
          var other = nodesRef.current.filter(function (m) { return m.col === cell[0] && m.row === cell[1]; })[0];
          commit(nodesRef.current.map(function (m) {
            if (m.id === n.id) return Object.assign({}, m, { col: cell[0], row: cell[1] });
            if (other && m.id === other.id) return Object.assign({}, m, { col: n.col, row: n.row });
            return m;
          }));
        }
      } else if (!st.moved) {
        if (st.node) select(st.node === selRef.current ? null : st.node); else select(null);
      }
      dragS[1](null); st.mode = null; st.node = null; st.pointers = {};
    }
    var selRef = useRef(selected); selRef.current = selected;

    var sel = selected ? byId[selected] : null;
    var related = {};
    if (sel) { related[sel.id] = 1; (sel.requires || []).forEach(function (id) { related[id] = 1; }); nodes.forEach(function (m) { if ((m.requires || []).indexOf(sel.id) >= 0) related[m.id] = 1; }); }
    var edges = [];
    if (sel) {
      var center = function (m) { var c = cellXY(m.col, m.row); return [c[0] + HEX_W / 2, c[1] + HEX_H / 2]; };
      var line = function (from, to, lit, key) {
        var a = center(from), b = center(to);
        edges.push(h('path', { key: key, className: cx('vx-link', lit ? 'is-lit' : 'is-dim'), d: 'M' + a[0] + ' ' + a[1] + ' L' + b[0] + ' ' + b[1] }));
      };
      (sel.requires || []).forEach(function (id) { if (byId[id]) line(byId[id], sel, skillProgress(byId[id]) >= 1, 'r' + id); });
      nodes.forEach(function (m) { if ((m.requires || []).indexOf(sel.id) >= 0) line(sel, m, skillProgress(sel) >= 1, 'u' + m.id); });
    }
    var counted = nodes.filter(function (n) { return !(n.goal && !n.title); });
    var score = counted.filter(function (n) { return skillProgress(n) >= 1; }).length;
    var b = bounds(), startC = cellXY(Math.round((minC + maxC) / 2), rows - 1);
    var ghost = drag && (drag.col !== byId[drag.id].col || drag.row !== byId[drag.id].row) && drag.row >= 0 ? cellXY(drag.col, drag.row) : null;
    var narrow = size.w < 640;

    return h('div', { className: cx('vx-canvas', panningS[0] && 'is-panning', sel && 'has-panel', narrow && 'is-narrow'), ref: wrapRef, tabIndex: -1, style: { height: p.height || 640, backgroundSize: 24 * view.k + 'px ' + 24 * view.k + 'px', backgroundPosition: view.x + 'px ' + view.y + 'px' },
      onPointerDown: function (e) { if (e.target === wrapRef.current || e.target.classList.contains('vx-world')) onDown(e, null); }, role: 'application', 'aria-label': p.label || 'Skill tree canvas' },
      h('div', { className: cx('vx-world', glideS[0] && 'is-gliding'), style: { transform: 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.k + ')', width: b.x1, height: b.y1 } },
        h('svg', { className: 'vx-links', width: b.x1, height: b.y1, 'aria-hidden': true }, edges),
        ghost ? h('svg', { className: 'vx-ghost', width: HEX_W, height: HEX_H, style: { left: ghost[0], top: ghost[1] }, 'aria-hidden': true }, h('path', { d: HEX_D })) : null,
        nodes.map(function (n) {
          var isDrag = drag && drag.id === n.id, c = isDrag ? [drag.x, drag.y] : cellXY(n.col, n.row);
          var inTier = Object.assign({}, n, { tier: n.tier || tierOf(n.row, rows) });
          return h(SkillNode, { key: n.id, node: inTier, state: nodeState(n, byId), selected: selected === n.id, dragging: isDrag, 
            style: { left: c[0], top: c[1] },
            onPointerDown: function (e) { e.stopPropagation(); onDown(e, n.id); },
            onKeyDown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(n.id); } } });
        }),
        p.start !== false ? h('div', { className: 'vx-start', style: { left: startC[0] + HEX_W / 2, top: startC[1] + HEX_H + PITCH_Y / 2 + 28 } }, h(Icon, { name: 'flag', size: 14, stroke: 2 }), 'Start here') : null),
      h('div', { className: 'vx-rail', 'aria-hidden': true }, h('span', null, 'Advanced'), h('i'), h('span', null, 'Basics')),
      h('div', { className: 'vx-hud vx-hud-tl' },
        h('div', { className: 'vx-eyebrow' }, 'Total score'),
        h('div', { className: 'vx-row', style: { gap: 6, alignItems: 'baseline' } }, h('span', { className: 'vx-num', style: { fontSize: 22, lineHeight: '26px', color: 'var(--ink)' } }, score), h('span', { className: 'vx-num vx-faint' }, '/ ' + counted.length + ' pts')),
        h('div', { className: 'vx-meter', style: { width: 120 } }, h('div', { className: 'vx-meter-bar', style: { width: (counted.length ? score / counted.length : 0) * 100 + '%' } })),
        h('div', { className: 'vx-faint', style: { fontSize: 11 } }, '1 tile = 1 point')),
      h('div', { className: 'vx-hud vx-hud-tr vx-zoom' },
        h('button', { type: 'button', className: 'vx-icon-btn', 'aria-label': 'Zoom out', onClick: function () { zoomAt(1 / 1.2, size.w / 2, size.h / 2, true); } }, h(Icon, { name: 'minus', size: 16 })),
        h('span', { className: 'vx-num vx-muted', style: { fontSize: 12, minWidth: 40, textAlign: 'center' } }, Math.round(view.k * 100) + '%'),
        h('button', { type: 'button', className: 'vx-icon-btn', 'aria-label': 'Zoom in', onClick: function () { zoomAt(1.2, size.w / 2, size.h / 2, true); } }, h(Icon, { name: 'plus', size: 16 })),
        h('button', { type: 'button', className: 'vx-icon-btn', 'aria-label': 'Fit to screen', onClick: function () { fit(); } }, h(Icon, { name: 'fit', size: 16 }))),
      sel ? null : h('div', { className: 'vx-hud vx-hud-bl vx-faint' }, narrow ? 'Drag to pan · pinch to zoom · tap a tile' : 'Drag to pan · ⌘/Ctrl + scroll to zoom · drag a tile to move it · click to open'),
      sel ? h(SkillPanel, { key: sel.id, className: narrow ? 'is-sheet' : null, node: Object.assign({}, sel, { tier: sel.tier || tierOf(sel.row, rows) }), byId: byId, nodes: nodes, onClose: function () { select(null); }, onSelect: select,
        onChange: function (m) { var clean = Object.assign({}, m); if (!byId[m.id].tier) delete clean.tier; commit(nodes.map(function (x) { return x.id === m.id ? clean : x; })); } }) : null);
  }
  SkillTree.stateOf = nodeState;
  SkillTree.progressOf = skillProgress;

  /* ---------- Hypotheses: shared ---------- */
  var HSTATUS = {
    idea: { label: 'Idea', tone: 'neutral', glyph: '·' },
    draft: { label: 'Draft', tone: 'neutral', glyph: '○' },
    running: { label: 'Running', tone: 'info', glyph: '◐' },
    supported: { label: 'Supported', tone: 'up', glyph: '✓' },
    refuted: { label: 'Refuted', tone: 'down', glyph: '✕' },
    inconclusive: { label: 'Inconclusive', tone: 'neutral', glyph: '≈' }
  };
  var METHODS = [{ value: 'alternate', label: 'Alternate A/B' }, { value: 'before-after', label: 'Before / after' }, { value: 'tagged', label: 'Tagged' }];
  function dayNum(s) { return s ? Math.floor(Date.parse(s + 'T00:00:00Z') / 864e5) : null; }
  function dayStr(n) { return new Date(n * 864e5).toISOString().slice(0, 10); }
  function shortDate(s) { if (!s) return ''; var d = new Date(s + 'T00:00:00Z'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
  function signed(v, unit, d) { if (v == null) return '—'; var s = fmt(Math.abs(v), { decimals: d == null ? 0 : d }); return (v > 0 ? '+' : v < 0 ? '−' : '±') + s + (unit || ''); }
  function evidenceWord(p, thr) {
    thr = thr || 0.95;
    if (p == null) return ['No data yet', 'neutral'];
    if (p >= thr) return ['Strong evidence it works', 'up'];
    if (p <= 1 - thr) return ['Strong evidence it hurts', 'down'];
    if (p >= 0.75) return ['Leaning better', 'info'];
    if (p <= 0.25) return ['Leaning worse', 'warn'];
    return ['No clear difference yet', 'neutral'];
  }

  /* ---------- EvidenceMeter ---------- */
  function EvidenceMeter(p) {
    var v = p.value, thr = p.threshold || 0.95, w = evidenceWord(v, thr);
    var col = { up: 'var(--up)', down: 'var(--down)', info: 'var(--info)', warn: 'var(--warn)', neutral: 'var(--ink-faint)' }[w[1]];
    var st = useState(reduced() ? v : 0.5);
    useEffect(function () { var t = setTimeout(function () { st[1](v == null ? 0.5 : v); }, 30); return function () { clearTimeout(t); }; }, [v]);
    var shown = st[0];
    return h('div', { className: 'vx-evi', role: 'img', 'aria-label': (p.label || 'B beats A') + ' ' + (v == null ? 'no data' : Math.round(v * 100) + '%') + ', ' + w[0] },
      h('div', { className: 'vx-row', style: { justifyContent: 'space-between', alignItems: 'baseline' } },
        h('span', { className: 'vx-muted', style: { fontSize: 12 } }, p.label || 'Chance B beats A'),
        h('span', { className: 'vx-num', style: { fontSize: p.compact ? 14 : 20, color: col } }, v == null ? '—' : Math.round(v * 100) + '%')),
      h('div', { className: 'vx-evi-track' },
        h('div', { className: 'vx-evi-fill', style: { left: Math.min(shown, 0.5) * 100 + '%', width: Math.abs(shown - 0.5) * 100 + '%', background: col } }),
        h('span', { className: 'vx-evi-tick is-mid', style: { left: '50%' } }),
        h('span', { className: 'vx-evi-tick', style: { left: (1 - thr) * 100 + '%' } }),
        h('span', { className: 'vx-evi-tick', style: { left: thr * 100 + '%' } }),
        v == null ? null : h('span', { className: 'vx-evi-dot', style: { left: shown * 100 + '%', background: col } })),
      p.compact ? null : h('div', { className: 'vx-evi-scale' }, h('span', null, 'Hurts'), h('span', null, 'Coin flip'), h('span', null, 'Works')),
      p.compact ? null : h('div', { style: { fontSize: 12, color: col, marginTop: 4 } }, w[0]));
  }

  /* ---------- ForestPlot ---------- */
  function ForestPlot(p) {
    var wr = useWidth(640), ref = wr[0], W = wr[1];
    var rows = p.rows || [], unit = p.unit || 'pp', RH = 36, labelW = p.compact ? 0 : W < 520 ? 120 : 220, valW = p.compact ? 118 : 104, top = 6, H = rows.length * RH + 34;
    var lo = p.domain ? p.domain[0] : Math.min(-5, Math.min.apply(null, rows.map(function (r) { return r.lo; }))),
        hi = p.domain ? p.domain[1] : Math.max(5, Math.max.apply(null, rows.map(function (r) { return r.hi; })));
    var m = Math.max(Math.abs(lo), Math.abs(hi)); lo = -m; hi = m;
    var ticks = p.compact ? [lo, 0, hi] : niceTicks(lo, hi, 4).filter(function (t) { return t >= lo - 1e-9 && t <= hi + 1e-9; });
    var x0 = labelW + (p.compact ? 4 : 8), x1 = W - valW - 8, X = function (v) { return x0 + ((v - lo) / (hi - lo)) * (x1 - x0); };
    var toneOf = function (r) { return r.status === 'running' ? 'info' : r.lo > 0 ? 'up' : r.hi < 0 ? 'down' : 'flat'; };
    var col = { info: 'var(--info)', up: 'var(--up)', down: 'var(--down)', flat: 'var(--ink-faint)' };
    return h('div', { className: 'vx-chart', ref: ref },
      h('svg', { height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': p.label || 'Effect sizes with 90% intervals' },
        ticks.map(function (t) { return h('g', { key: t }, h('line', { className: 'vx-grid', x1: X(t), x2: X(t), y1: top, y2: H - 24, strokeOpacity: t === 0 ? 0 : 0.5 }), h('text', { className: 'vx-tick', x: X(t), y: H - 6, textAnchor: 'middle' }, signed(t, unit))); }),
        h('line', { x1: X(0), x2: X(0), y1: top - 2, y2: H - 22, stroke: 'var(--line-control)', strokeDasharray: '3 3' }),
        rows.map(function (r, i) {
          var y = top + i * RH + RH / 2, tn = toneOf(r), c = col[tn];
          return h('g', { key: r.code || i, className: 'vx-forest-row', style: { cursor: p.onSelect ? 'pointer' : 'default' }, onClick: p.onSelect ? function () { p.onSelect(r); } : undefined },
            h('rect', { x: 0, y: y - RH / 2, width: W, height: RH, fill: 'transparent' }),
            p.compact ? null : h('text', { x: 0, y: y + 4, className: 'vx-forest-code' }, r.code || ''),
            p.compact ? null : h('text', { x: r.code ? 44 : 0, y: y + 4, className: 'vx-forest-label' }, r.label.length > (W < 520 ? 12 : 26) ? r.label.slice(0, W < 520 ? 11 : 25) + '…' : r.label),
            h('path', { className: 'vx-draw', d: 'M' + X(r.lo) + ' ' + y + ' L' + X(r.hi) + ' ' + y, stroke: c, strokeWidth: 2, strokeLinecap: 'round', strokeDasharray: tn === 'info' ? undefined : undefined, pathLength: 1, style: { '--len': 1, animationDelay: i * 70 + 'ms' } }),
            h('rect', { className: 'vx-fade', x: X(r.est) - 5, y: y - 5, width: 10, height: 10, rx: 2, fill: tn === 'info' ? 'var(--bg-100)' : c, stroke: c, strokeWidth: 2, transform: 'rotate(45 ' + X(r.est) + ' ' + y + ')' }),
            h('text', { x: W, y: y + 4, textAnchor: 'end', className: 'vx-forest-val', fill: c === col.flat ? 'var(--ink-muted)' : c }, signed(r.est, unit) + '  [' + signed(r.lo, '') + ', ' + signed(r.hi, '') + ']'));
        })),
      p.legend === false ? null : h('div', { className: 'vx-legend' },
        h('span', { className: 'vx-row', style: { gap: 6 } }, h('span', { className: 'vx-sw', style: { background: 'var(--up)' } }), 'Helps (interval above 0)'),
        h('span', { className: 'vx-row', style: { gap: 6 } }, h('span', { className: 'vx-sw', style: { background: 'var(--down)' } }), 'Hurts'),
        h('span', { className: 'vx-row', style: { gap: 6 } }, h('span', { className: 'vx-sw', style: { background: 'var(--ink-faint)' } }), 'Can’t tell'),
        h('span', { className: 'vx-row', style: { gap: 6 } }, h('span', { className: 'vx-sw', style: { background: 'var(--info)' } }), 'Still running')));
  }

  /* ---------- CalibrationChart ---------- */
  function CalibrationChart(p) {
    var wr = useWidth(360), ref = wr[0], W = Math.min(wr[1], p.maxWidth || 420);
    var preds = p.predictions || [], H = Math.min(W, 300), pad = { l: 40, r: 12, t: 12, b: 34 };
    var bins = [];
    for (var b = 5; b < 10; b++) {
      var inBin = preds.filter(function (q) { var c = Math.max(0.5, q.confidence); return c >= b / 10 && (c < (b + 1) / 10 || (b === 9 && c <= 1)); });
      if (inBin.length) bins.push({ x: inBin.reduce(function (a, q) { return a + Math.max(0.5, q.confidence); }, 0) / inBin.length, y: inBin.filter(function (q) { return q.correct; }).length / inBin.length, n: inBin.length });
    }
    var X = function (v) { return pad.l + ((v - 0.5) / 0.5) * (W - pad.l - pad.r); };
    var Y = function (v) { return pad.t + (1 - v) * (H - pad.t - pad.b); };
    var brier = preds.length ? preds.reduce(function (a, q) { var d = q.confidence - (q.correct ? 1 : 0); return a + d * d; }, 0) / preds.length : null;
    var meanConf = preds.length ? preds.reduce(function (a, q) { return a + q.confidence; }, 0) / preds.length : 0;
    var hit = preds.length ? preds.filter(function (q) { return q.correct; }).length / preds.length : 0;
    var gap = meanConf - hit;
    var verdict = Math.abs(gap) < 0.06 ? ['Well calibrated', 'up'] : gap > 0 ? ['Overconfident by ' + Math.round(gap * 100) + ' pts', 'warn'] : ['Underconfident by ' + Math.round(-gap * 100) + ' pts', 'info'];
    var line = bins.map(function (q, i) { return (i ? 'L' : 'M') + X(q.x) + ' ' + Y(q.y); }).join(' ');
    return h('div', null,
      h('div', { className: 'vx-row', style: { justifyContent: 'space-between', marginBottom: 12 } },
        h(Badge, { tone: verdict[1] }, verdict[0]),
        h('span', { className: 'vx-faint', style: { fontSize: 12 } }, 'Brier ', h('span', { className: 'vx-num', style: { color: 'var(--ink)' } }, brier == null ? '—' : brier.toFixed(3)), ' · n=' + preds.length)),
      h('div', { className: 'vx-chart', ref: ref },
        h('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Calibration: predicted confidence against how often it came true. ' + verdict[0] },
          [0.5, 0.6, 0.7, 0.8, 0.9, 1].map(function (t) { return h('g', { key: 'x' + t }, h('line', { className: 'vx-grid', x1: X(t), x2: X(t), y1: pad.t, y2: H - pad.b, strokeOpacity: 0.45 }), h('text', { className: 'vx-tick', x: X(t), y: H - pad.b + 16, textAnchor: 'middle' }, Math.round(t * 100) + '%')); }),
          [0, 0.25, 0.5, 0.75, 1].map(function (t) { return h('g', { key: 'y' + t }, h('line', { className: 'vx-grid', x1: pad.l, x2: W - pad.r, y1: Y(t), y2: Y(t), strokeOpacity: 0.45 }), h('text', { className: 'vx-tick', x: pad.l - 8, y: Y(t) + 4, textAnchor: 'end' }, Math.round(t * 100) + '%')); }),
          h('path', { d: 'M' + X(0.5) + ' ' + Y(0.5) + ' L' + X(1) + ' ' + Y(1), stroke: 'var(--line-control)', strokeDasharray: '4 4', strokeWidth: 1.5 }),
          h('text', { className: 'vx-tick', x: X(0.97), y: Y(0.97) - 8, textAnchor: 'end' }, 'perfect'),
          line ? h('path', { className: 'vx-draw', d: line, fill: 'none', stroke: 'var(--up)', strokeWidth: 2, pathLength: 1, style: { '--len': 1 } }) : null,
          bins.map(function (q, i) { return h('circle', { key: i, className: 'vx-fade', cx: X(q.x), cy: Y(q.y), r: 4 + Math.sqrt(q.n) * 2.2, fill: 'var(--up)', fillOpacity: 0.25, stroke: 'var(--up)', strokeWidth: 2 }, h('title', null, q.n + ' predictions at ~' + Math.round(q.x * 100) + '% → ' + Math.round(q.y * 100) + '% came true')); }),
          h('text', { className: 'vx-tick', x: (pad.l + W - pad.r) / 2, y: H - 2, textAnchor: 'middle' }, 'How sure I said I was'))));
  }

  /* ---------- HypothesisPanel ---------- */
  function Statement(p) {
    var hy = p.hypothesis, m = p.metric || {};
    return h('p', { className: 'vx-stmt' }, 'If I ', h('b', null, hy.change || '…'), ', then ', h('b', null, m.label || 'the metric'), ' will ',
      h('b', { style: { color: hy.direction === 'down' ? 'var(--down)' : 'var(--up)' } }, (hy.direction === 'down' ? '▼ fall ' : '▲ rise ') + (hy.amount || '')),
      ' within ', h('b', null, (hy.windowDays || '…') + ' days'), hy.because ? ', because ' + hy.because : '', '.');
  }
  function Field(p) { return h('label', { className: 'vx-field' }, h('span', { className: 'vx-eyebrow' }, p.label), p.children); }

  function HypothesisPanel(p) {
    var hy = p.hypothesis, metrics = p.metrics || [], today = p.today || new Date().toISOString().slice(0, 10);
    var fs = useState(hy || {}), f = fs[0];
    useEffect(function () { fs[1](hy || {}); }, [hy && hy.id]);
    if (!hy) return null;
    var metric = metrics.filter(function (m) { return m.id === (hy.status === 'draft' ? f.metric : hy.metric); })[0];
    var st = HSTATUS[hy.status] || HSTATUS.draft;
    var upd = function (patch) { if (p.onChange) p.onChange(Object.assign({}, hy, patch)); };
    var set = function (k) { return function (e) { var o = {}; o[k] = e && e.target ? e.target.value : e; fs[1](Object.assign({}, f, o)); }; };
    var concluded = hy.status === 'supported' || hy.status === 'refuted' || hy.status === 'inconclusive';
    var body;
    if (hy.status === 'draft' || hy.status === 'idea') {
      body = h(React.Fragment, null,
        h('p', { className: 'vx-panel-desc', style: { fontSize: 12 } }, 'Write it down before you start. Once running, these fields lock so the goalposts can’t move.'),
        h(Field, { label: 'If I…' }, h('input', { className: 'vx-input', value: f.change || '', placeholder: 'add a 60-second Loom to every proposal', onChange: set('change') })),
        h(Field, { label: 'then this metric' }, h('select', { className: 'vx-input', value: f.metric || '', onChange: set('metric') }, metrics.map(function (m) { return h('option', { key: m.id, value: m.id }, m.label); }))),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) minmax(0, 1fr)', gap: 8, alignItems: 'end' } },
          h(Field, { label: 'will' }, h(SegmentedControl, { label: 'Direction', options: [{ value: 'up', label: '▲ RISE' }, { value: 'down', label: '▼ FALL' }], value: f.direction || 'up', onChange: set('direction') })),
          h(Field, { label: 'by' }, h('input', { className: 'vx-input', value: f.amount || '', placeholder: '5pp', onChange: set('amount') })),
          h(Field, { label: 'within' }, h('input', { className: 'vx-input', type: 'number', value: f.windowDays || '', placeholder: '21', onChange: set('windowDays') }))),
        h(Field, { label: 'because' }, h('textarea', { className: 'vx-input', rows: 2, value: f.because || '', placeholder: 'clients see my face and trust a person, not a template', onChange: set('because') })),
        h(Field, { label: 'Method' }, h(SegmentedControl, { label: 'Method', options: METHODS, value: f.method || 'alternate', onChange: set('method') })),
        h(Field, { label: 'Stop rule' }, h('input', { className: 'vx-input', value: f.stopRule || '', placeholder: '30 proposals or 21 days', onChange: set('stopRule') })),
        h(Field, { label: 'Kill rule' }, h('input', { className: 'vx-input', value: f.killRule || '', placeholder: 'reply rate < 20% after 15', onChange: set('killRule') })),
        h(Field, { label: 'How sure am I? ' + Math.round((f.confidence || 0.6) * 100) + '%' }, h('input', { type: 'range', className: 'vx-range', min: 50, max: 99, value: Math.round((f.confidence || 0.6) * 100), onChange: function (e) { fs[1](Object.assign({}, f, { confidence: +e.target.value / 100 })); } })));
    } else {
      var effectRow = hy.effect ? h(ForestPlot, { compact: true, domain: [-30, 30], rows: [{ code: '', label: 'Effect', est: hy.effect.est, lo: hy.effect.lo, hi: hy.effect.hi, status: hy.status }], unit: hy.effect.unit, legend: false, label: 'Effect with 90% interval' }) : null;
      var markers = [];
      if (metric && metric.series && hy.startedAt) {
        var sd = dayNum(hy.startedAt), best = 0;
        metric.series.forEach(function (d, i) { if (Math.abs(dayNum(d.date) - sd) < Math.abs(dayNum(metric.series[best].date) - sd)) best = i; });
        markers.push({ at: best, label: (hy.code || 'H') + ' start', tone: 'info' });
        if (hy.endedAt) { var ed = dayNum(hy.endedAt), be = 0; metric.series.forEach(function (d, i) { if (Math.abs(dayNum(d.date) - ed) < Math.abs(dayNum(metric.series[be].date) - ed)) be = i; }); markers.push({ at: be, label: 'end', tone: 'neutral', row: 1 }); }
      }
      var predictedRight = concluded && hy.status !== 'inconclusive' ? (hy.status === 'supported') === ((hy.confidence || 0.5) >= 0.5) : null;
      body = h(React.Fragment, null,
        h('div', { className: 'vx-panel-sec' }, h(Statement, { hypothesis: hy, metric: metric }),
          h('span', { className: 'vx-faint vx-row', style: { fontSize: 12, gap: 6 } }, h(Icon, { name: 'lock', size: 12, stroke: 2 }), 'Pre-registered ' + shortDate(hy.startedAt) + ' · ' + (METHODS.filter(function (x) { return x.value === hy.method; })[0] || METHODS[0]).label)),
        h('div', { className: 'vx-panel-sec' }, h(EvidenceMeter, { value: hy.pBetter, label: hy.method === 'before-after' ? 'Chance after beats before' : 'Chance B beats A' })),
        effectRow ? h('div', { className: 'vx-panel-sec' }, h('span', { className: 'vx-eyebrow' }, 'Effect · 90% interval'), effectRow) : null,
        h('div', { className: 'vx-panel-sec' },
          h('div', { className: 'vx-row', style: { justifyContent: 'space-between' } }, h('span', { className: 'vx-eyebrow' }, 'Sample'), h('span', { className: 'vx-num', style: { fontSize: 12 } }, (hy.n || 0) + ' / ' + (hy.nTarget || '?'))),
          h('div', { className: 'vx-meter' }, h('div', { className: 'vx-meter-bar', style: { width: Math.min(1, (hy.n || 0) / (hy.nTarget || 1)) * 100 + '%', background: hy.status === 'running' ? 'var(--info)' : undefined } })),
          h('span', { className: 'vx-faint', style: { fontSize: 12 } }, 'Stop: ' + (hy.stopRule || '—') + (hy.killRule ? ' · Kill: ' + hy.killRule : ''))),
        metric && metric.series ? h('div', { className: 'vx-panel-sec' }, h('span', { className: 'vx-eyebrow' }, metric.label + ' · ' + (metric.source || '')), h(TrendChart, { height: 132, series: [{ name: metric.label, data: metric.series }], format: metric.format, markers: markers })) : null,
        h('div', { className: 'vx-panel-sec' }, h('span', { className: 'vx-eyebrow' }, 'My prediction'),
          h('div', { className: 'vx-row' }, h('span', { className: 'vx-num' }, Math.round((hy.confidence || 0.5) * 100) + '% sure'),
            predictedRight == null ? h('span', { className: 'vx-faint', style: { fontSize: 12 } }, concluded ? 'Inconclusive — not scored' : 'Scored when it ends') : h(Badge, { tone: predictedRight ? 'up' : 'down' }, predictedRight ? '✓ Called it' : '✕ Got it wrong'))),
        hy.adoptedTo ? h('div', { className: 'vx-panel-sec' }, h('span', { className: 'vx-eyebrow' }, 'Adopted'), h('span', { className: 'vx-chip is-mastered', style: { alignSelf: 'flex-start' } }, h(Icon, { name: 'check', size: 13, stroke: 2 }), 'Levels up: ' + hy.adoptedTo)) : null,
        hy.notes ? h('div', { className: 'vx-panel-sec' }, h('span', { className: 'vx-eyebrow' }, 'Notes'), h('p', { className: 'vx-panel-desc', style: { margin: 0 } }, hy.notes)) : null);
    }
    var foot = null;
    if (hy.status === 'draft' || hy.status === 'idea') foot = h(Button, { variant: 'primary', size: 'sm', disabled: !(f.change && f.metric), onClick: function () { if (p.onChange) p.onChange(Object.assign({}, hy, f, { status: 'running', startedAt: today, n: 0, pBetter: null, nTarget: hy.nTarget || parseInt(f.stopRule, 10) || 30 })); } }, 'Start experiment');
    else if (hy.status === 'running') foot = h(Button, { variant: 'ghost', size: 'sm', onClick: function () { upd({ status: 'inconclusive', endedAt: today, notes: (hy.notes ? hy.notes + ' ' : '') + 'Stopped early on ' + shortDate(today) + '.' }); } }, 'Stop early');
    else if (hy.status === 'supported' && !hy.adoptedTo) foot = h(Button, { variant: 'primary', size: 'sm', icon: h(Icon, { name: 'check', size: 14, stroke: 2.25 }), onClick: function () { upd({ adoptedTo: hy.skill || 'Skill tree' }); } }, 'Adopt into skill tree');
    return h('aside', { className: cx('vx-panel', p.className), 'aria-label': (hy.code || 'Hypothesis') + ' details' },
      h('header', { className: 'vx-panel-head' },
        h('span', { className: cx('vx-hyp-code', 'is-' + hy.status) }, hy.code || 'H'),
        h('div', { style: { minWidth: 0, flex: 1 } },
          h('div', { className: 'vx-row', style: { gap: 6 } }, h(Badge, { tone: st.tone }, st.glyph + ' ' + st.label), hy.status === 'running' && p.conflict ? h(Badge, { tone: 'warn' }, 'Confounded') : null),
          h('h3', { className: 'vx-card-title', style: { marginTop: 6 } }, hy.title || (p.lever ? p.lever.label : 'New hypothesis') + ' → ' + (metric ? metric.label : '…'))),
        p.onClose ? h('button', { type: 'button', className: 'vx-icon-btn', 'aria-label': 'Close', onClick: p.onClose }, h(Icon, { name: 'close', size: 16 })) : null),
      p.conflict && hy.status === 'running' ? h('div', { className: 'vx-warnbar' }, 'Another experiment is running on ' + (metric ? metric.label : 'this metric') + '. You won’t know which change moved it.') : null,
      h('div', { className: 'vx-panel-body' }, body),
      foot ? h('footer', { className: 'vx-panel-foot' }, foot) : null);
  }

  /* ---------- HypothesisCanvas ---------- */
  var MW = 236, MH = 92, MGAP = 44, LW = 212, LH = 52;
  function HypothesisCanvas(p) {
    var levS = useState(p.levers || []), levers = levS[0];
    var hypS = useState(p.hypotheses || []), hyps = hypS[0];
    var metrics = p.metrics || [], today = p.today || new Date().toISOString().slice(0, 10), todayN = dayNum(today);
    var selS = useState(p.defaultSelected ? { type: 'hyp', id: p.defaultSelected } : null), sel = selS[0];
    var wrapRef = useRef(null), sizeS = useState({ w: 900, h: p.height || 640 }), size = sizeS[0], sizeRef = useRef(size); sizeRef.current = size;
    var viewS = useState({ x: 0, y: 0, k: 1 }), view = viewS[0], viewRef = useRef(view); viewRef.current = view;
    var glideS = useState(false), glideT = useRef(null);
    var dragS = useState(null), drag = dragS[0];
    var tS = useState(null), tDay = tS[0], playRef = useRef(null);
    var g = useRef({});
    var MX = p.metricX || 640;
    var mPos = {}; metrics.forEach(function (m, i) { mPos[m.id] = [MX, 24 + i * (MH + MGAP)]; });
    var levRef = useRef(levers); levRef.current = levers;
    var hypRef = useRef(hyps); hypRef.current = hyps;

    function commitH(next) { hypS[1](next); if (p.onChange) p.onChange(next); }
    function commitL(next) { levS[1](next); if (p.onLeversChange) p.onLeversChange(next); }
    function glide() { glideS[1](true); clearTimeout(glideT.current); glideT.current = setTimeout(function () { glideS[1](false); }, 320); }
    function bounds() {
      var x0 = 0, y0 = 0, x1 = MX + MW, y1 = metrics.length * (MH + MGAP);
      levers.forEach(function (l) { x0 = Math.min(x0, l.x); y0 = Math.min(y0, l.y); y1 = Math.max(y1, l.y + LH); });
      return { x0: x0 - 16, y0: y0 - 16, x1: x1 + 16, y1: y1 + 16 };
    }
    function fit(sz, instant) {
      sz = sz || sizeRef.current; var b = bounds(), padL = 20, padR = (selS[0] && sz.w >= 700 ? 380 : 20), padT = 84, padB = 76;
      var k = Math.max(0.35, Math.min((sz.w - padL - padR) / (b.x1 - b.x0), (sz.h - padT - padB) / (b.y1 - b.y0), 1.05));
      if (!instant) glide();
      viewS[1]({ k: k, x: padL + (sz.w - padL - padR - (b.x1 - b.x0) * k) / 2 - b.x0 * k, y: padT + (sz.h - padT - padB - (b.y1 - b.y0) * k) / 2 - b.y0 * k });
    }
    function zoomAt(f, cx0, cy0, smooth) {
      if (smooth) glide();
      var v = viewRef.current, k = Math.max(0.35, Math.min(2.2, v.k * f)), r = k / v.k;
      viewS[1]({ k: k, x: cx0 - (cx0 - v.x) * r, y: cy0 - (cy0 - v.y) * r });
    }
    useEffect(function () {
      var el = wrapRef.current; if (!el) return;
      var first = true;
      var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function (en) { var r = en[0].contentRect, sz = { w: r.width, h: r.height }; sizeS[1](sz); sizeRef.current = sz; if (first) { first = false; fit(sz, true); } }) : null;
      if (ro) ro.observe(el); else fit({ w: el.clientWidth, h: el.clientHeight }, true);
      function wheel(e) {
        if (e.target.closest && e.target.closest('.vx-panel')) return;
        e.preventDefault(); var r = el.getBoundingClientRect(), v = viewRef.current;
        if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
        else viewS[1]({ k: v.k, x: v.x - e.deltaX, y: v.y - e.deltaY });
      }
      function key(e) { if (e.key === 'Escape') selS[1](null); }
      el.addEventListener('wheel', wheel, { passive: false }); el.addEventListener('keydown', key);
      return function () { if (ro) ro.disconnect(); el.removeEventListener('wheel', wheel); el.removeEventListener('keydown', key); clearInterval(playRef.current); };
    }, []);

    function local(e) { var r = wrapRef.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function toWorld(pt) { var v = viewRef.current; return [(pt[0] - v.x) / v.k, (pt[1] - v.y) / v.k]; }
    function begin(e, mode, id) {
      if (e.button != null && e.button !== 0) return;
      e.stopPropagation();
      var st = g.current; st.mode = mode; st.id = id; st.start = local(e); st.moved = false; st.view0 = viewRef.current;
      if (mode === 'lever') { var l = levRef.current.filter(function (x) { return x.id === id; })[0]; st.l0 = [l.x, l.y]; }
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    }
    function move(e) {
      var st = g.current; if (!st.mode) return;
      var pt = local(e), dx = pt[0] - st.start[0], dy = pt[1] - st.start[1];
      if (!st.moved && Math.hypot(dx, dy) < 5) return;
      st.moved = true;
      if (st.mode === 'pan') { dragS[1]({ type: 'pan' }); viewS[1]({ k: st.view0.k, x: st.view0.x + dx, y: st.view0.y + dy }); }
      if (st.mode === 'lever') { var k = viewRef.current.k; dragS[1]({ type: 'lever', id: st.id, x: st.l0[0] + dx / k, y: st.l0[1] + dy / k }); }
      if (st.mode === 'link') { var w = toWorld(pt); dragS[1]({ type: 'link', id: st.id, x: w[0], y: w[1], over: metricAt(w) }); }
    }
    function metricAt(w) { for (var i = 0; i < metrics.length; i++) { var q = mPos[metrics[i].id]; if (w[0] >= q[0] - 24 && w[0] <= q[0] + MW && w[1] >= q[1] && w[1] <= q[1] + MH) return metrics[i].id; } return null; }
    function end(e) {
      var st = g.current;
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end);
      var pt = local(e), k = viewRef.current.k;
      if (st.mode === 'lever' && st.moved) commitL(levRef.current.map(function (l) { return l.id === st.id ? Object.assign({}, l, { x: Math.round(st.l0[0] + (pt[0] - st.start[0]) / k), y: Math.round(st.l0[1] + (pt[1] - st.start[1]) / k) }) : l; }));
      else if (st.mode === 'lever') selS[1]({ type: 'lever', id: st.id });
      else if (st.mode === 'link') {
        var target = metricAt(toWorld(pt));
        if (target) {
          var hs = hypRef.current, num = hs.reduce(function (a, x) { var n = parseInt(String(x.code || '').replace(/\D/g, ''), 10); return isNaN(n) ? a : Math.max(a, n); }, 0) + 1;
          var nh = { id: 'h' + num + '-' + Math.random().toString(36).slice(2, 6), code: 'H-' + (num < 10 ? '0' : '') + num, lever: st.id, metric: target, status: 'draft', createdAt: today, confidence: 0.6, method: 'alternate', direction: 'up', change: (levRef.current.filter(function (l) { return l.id === st.id; })[0] || {}).label };
          commitH(hs.concat([nh])); selS[1]({ type: 'hyp', id: nh.id });
        }
      } else if (st.mode === 'pan' && !st.moved) selS[1](null);
      dragS[1](null); st.mode = null;
    }

    /* time travel */
    var starts = hyps.map(function (x) { return dayNum(x.createdAt || x.startedAt); }).filter(function (x) { return x != null; });
    var tMin = starts.length ? Math.min.apply(null, starts) : todayN - 90, tNow = tDay == null ? todayN : tDay;
    function asOf(x) {
      if (tDay == null) return x;
      var c = dayNum(x.createdAt || x.startedAt), s = dayNum(x.startedAt), e = dayNum(x.endedAt);
      if (c != null && tNow < c) return null;
      if (s == null || tNow < s) return Object.assign({}, x, { status: x.status === 'idea' ? 'idea' : 'draft' });
      if (e == null || tNow < e) {
        var fr = e ? (tNow - s) / Math.max(1, e - s) : (tNow - s) / Math.max(1, todayN - s);
        fr = Math.max(0, Math.min(1, fr));
        return Object.assign({}, x, { status: 'running', n: Math.round((e ? x.nTarget : x.n) * fr), pBetter: x.pBetter == null ? null : 0.5 + (x.pBetter - 0.5) * fr });
      }
      return x;
    }
    function play() {
      clearInterval(playRef.current);
      var t = tMin; tS[1](t);
      playRef.current = setInterval(function () { t += Math.max(1, Math.round((todayN - tMin) / 90)); if (t >= todayN) { clearInterval(playRef.current); tS[1](null); } else tS[1](t); }, 50);
    }

    var shown = hyps.map(asOf).filter(Boolean);
    var runningBy = {}; shown.forEach(function (x) { if (x.status === 'running') runningBy[x.metric] = (runningBy[x.metric] || 0) + 1; });
    var withConv = metrics.filter(function (m) { return m.conversion != null; });
    var bottleneck = withConv.length ? withConv.reduce(function (a, m) { return m.conversion < a.conversion ? m : a; }).id : null;
    var levById = {}; levers.forEach(function (l) { levById[l.id] = (drag && drag.type === 'lever' && drag.id === l.id) ? Object.assign({}, l, { x: drag.x, y: drag.y }) : l; });
    var byMetric = {}; shown.forEach(function (x) { (byMetric[x.metric] = byMetric[x.metric] || []).push(x); });
    Object.keys(byMetric).forEach(function (k) { byMetric[k].sort(function (a, b) { return (levById[a.lever] || {}).y - (levById[b.lever] || {}).y; }); });
    var selHyp = sel && sel.type === 'hyp' ? hyps.filter(function (x) { return x.id === sel.id; })[0] : null;
    var related = function (x) { if (!sel) return true; if (sel.type === 'hyp') return x.id === sel.id; if (sel.type === 'lever') return x.lever === sel.id; if (sel.type === 'metric') return x.metric === sel.id; return true; };

    var edges = [], chips = [];
    shown.forEach(function (x) {
      var l = levById[x.lever], mp = mPos[x.metric]; if (!l || !mp) return;
      var list = byMetric[x.metric], idx = list.indexOf(x), off = (idx - (list.length - 1) / 2) * 14;
      var a = [l.x + LW, l.y + LH / 2], b = [mp[0], mp[1] + MH / 2 + off], dx = Math.max(60, (b[0] - a[0]) * 0.45);
      var c1 = [a[0] + dx, a[1]], c2 = [b[0] - dx, b[1]];
      var mid = [0.125 * a[0] + 0.375 * c1[0] + 0.375 * c2[0] + 0.125 * b[0], 0.125 * a[1] + 0.375 * c1[1] + 0.375 * c2[1] + 0.125 * b[1]];
      var conflict = x.status === 'running' && runningBy[x.metric] > 1;
      var strength = x.pBetter == null ? 0 : Math.abs(x.pBetter - 0.5) * 2;
      var cls = cx('vx-hedge', 'is-' + x.status, conflict && 'is-conflict', !related(x) && 'is-dim', selHyp && selHyp.id === x.id && 'is-sel');
      edges.push(h('path', { key: x.id, className: cls, d: 'M' + a[0] + ' ' + a[1] + ' C' + c1[0] + ' ' + c1[1] + ' ' + c2[0] + ' ' + c2[1] + ' ' + b[0] + ' ' + b[1], style: { strokeWidth: x.status === 'supported' || x.status === 'refuted' ? 2 + strength * 3 : undefined } }));
      edges.push(h('path', { key: x.id + 'a', className: cx('vx-harrow', 'is-' + x.status, conflict && 'is-conflict', !related(x) && 'is-dim'), d: 'M' + (b[0] - 9) + ' ' + (b[1] - 5) + ' L' + b[0] + ' ' + b[1] + ' L' + (b[0] - 9) + ' ' + (b[1] + 5) }));
      var st = HSTATUS[x.status] || HSTATUS.draft, u = x.effect ? x.effect.unit : '';
      var info = x.status === 'running' ? h(React.Fragment, null, h(ProgressRing, { value: Math.min(1, (x.n || 0) / (x.nTarget || 1)), size: 18, stroke: 3, tone: conflict ? 'warn' : 'info', showValue: false, label: 'sample' }), h('span', { className: 'vx-num' }, (x.n || 0) + '/' + (x.nTarget || '?')), x.pBetter != null ? h('span', { className: 'vx-num vx-faint' }, Math.round(x.pBetter * 100) + '%') : null)
        : x.status === 'supported' || x.status === 'refuted' || x.status === 'inconclusive' ? h('span', { className: 'vx-num' }, st.glyph + ' ' + (x.effect ? signed(x.effect.est, u) : st.label))
        : h('span', null, st.label);
      chips.push(h('button', { key: x.id, type: 'button', className: cx('vx-hchip', 'is-' + x.status, conflict && 'is-conflict', !related(x) && 'is-dim', selHyp && selHyp.id === x.id && 'is-sel'), style: { left: mid[0], top: mid[1] },
        onPointerDown: function (e) { e.stopPropagation(); }, onClick: function () { selS[1]({ type: 'hyp', id: x.id }); }, 'aria-label': (x.code || '') + ' ' + st.label },
        h('span', { className: 'vx-hchip-code' }, x.code), info));
    });
    var linkLine = null;
    if (drag && drag.type === 'link') { var ll = levById[drag.id], a0 = [ll.x + LW, ll.y + LH / 2]; linkLine = h('path', { className: 'vx-hedge is-linking', d: 'M' + a0[0] + ' ' + a0[1] + ' C' + (a0[0] + 80) + ' ' + a0[1] + ' ' + (drag.x - 80) + ' ' + drag.y + ' ' + drag.x + ' ' + drag.y }); }
    var connectors = metrics.slice(1).map(function (m, i) { var a = mPos[metrics[i].id], b = mPos[m.id], x = a[0] + MW / 2; return h('path', { key: 'c' + m.id, className: 'vx-mconn', d: 'M' + x + ' ' + (a[1] + MH + 6) + ' L' + x + ' ' + (b[1] - 8) + ' M' + (x - 5) + ' ' + (b[1] - 13) + ' L' + x + ' ' + (b[1] - 8) + ' L' + (x + 5) + ' ' + (b[1] - 13) }); });
    var b = bounds(), narrow = size.w < 700;
    var counts = {}; shown.forEach(function (x) { counts[x.status] = (counts[x.status] || 0) + 1; });

    return h('div', { className: cx('vx-canvas', 'vx-hcanvas', drag && drag.type === 'pan' && 'is-panning', selHyp && 'has-panel', narrow && 'is-narrow'), ref: wrapRef, tabIndex: -1, role: 'application', 'aria-label': p.label || 'Hypothesis map',
      style: { height: p.height || 640, backgroundSize: 24 * view.k + 'px ' + 24 * view.k + 'px', backgroundPosition: view.x + 'px ' + view.y + 'px' },
      onPointerDown: function (e) { if (e.target === wrapRef.current || (e.target.classList && e.target.classList.contains('vx-world'))) begin(e, 'pan'); } },
      h('div', { className: cx('vx-world', glideS[0] && 'is-gliding'), style: { transform: 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.k + ')', width: b.x1, height: b.y1 } },
        h('div', { className: 'vx-hcol-label', style: { left: 0, top: -34 } }, 'Levers · what I do'),
        h('div', { className: 'vx-hcol-label', style: { left: MX, top: -34 } }, 'Metrics · live from sources'),
        h('svg', { className: 'vx-links', width: b.x1 + 40, height: b.y1 + 40, 'aria-hidden': true }, connectors, edges, linkLine),
        chips,
        levers.map(function (l0) {
          var l = levById[l0.id], mine = shown.filter(function (x) { return x.lever === l.id; });
          var isSel = sel && sel.type === 'lever' && sel.id === l.id, dim = sel && sel.type !== 'lever' ? !mine.some(related) : sel && !isSel;
          return h('div', { key: l.id, className: cx('vx-lever', isSel && 'is-sel', dim && 'is-dim', drag && drag.type === 'lever' && drag.id === l.id && 'is-dragging'), style: { left: l.x, top: l.y, width: LW, height: LH } },
            h('button', { type: 'button', className: 'vx-lever-body', onPointerDown: function (e) { begin(e, 'lever', l.id); }, onKeyDown: function (e) { if (e.key === 'Enter') selS[1]({ type: 'lever', id: l.id }); } },
              h('span', { className: 'vx-lever-ico' }, h(Icon, { name: l.icon || 'target', size: 16 })),
              h('span', { className: 'vx-lever-label' }, l.label),
              mine.length ? h('span', { className: 'vx-lever-n vx-num' }, mine.length) : null),
            h('button', { type: 'button', className: cx('vx-port', drag && drag.type === 'link' && drag.id === l.id && 'is-on'), title: 'Drag to a metric to create a hypothesis', 'aria-label': 'Create hypothesis from ' + l.label, onPointerDown: function (e) { begin(e, 'link', l.id); } }));
        }),
        metrics.map(function (m) {
          var q = mPos[m.id], isSel = sel && sel.type === 'metric' && sel.id === m.id, isOver = drag && drag.type === 'link' && drag.over === m.id;
          var dim = sel && sel.type !== 'metric' ? !(byMetric[m.id] || []).some(related) : sel && !isSel;
          return h('button', { key: m.id, type: 'button', className: cx('vx-metric', isSel && 'is-sel', isOver && 'is-target', dim && 'is-dim', bottleneck === m.id && 'is-bottleneck'), style: { left: q[0], top: q[1], width: MW, height: MH },
            onPointerDown: function (e) { e.stopPropagation(); }, onClick: function () { selS[1](isSel ? null : { type: 'metric', id: m.id }); } },
            h('div', { className: 'vx-row', style: { justifyContent: 'space-between', flexWrap: 'nowrap' } },
              h('span', { className: 'vx-eyebrow' }, m.label),
              runningBy[m.id] > 1 ? h(Badge, { tone: 'warn' }, runningBy[m.id] + ' running') : bottleneck === m.id ? h(Badge, { tone: 'warn' }, 'Bottleneck') : null),
            h('div', { className: 'vx-row', style: { justifyContent: 'space-between', flexWrap: 'nowrap', alignItems: 'flex-end' } },
              h('div', null, h('div', { className: 'vx-num', style: { fontSize: 22, lineHeight: '26px', color: 'var(--ink)' } }, fmt(m.value, m.format)),
                h('div', { className: 'vx-faint', style: { fontSize: 11, lineHeight: '14px' } }, m.note || m.source || '')),
              m.spark ? h(Sparkline, { data: m.spark, width: 72, height: 26 }) : null));
        })),
      h('div', { className: 'vx-hud vx-hud-tl vx-hlegend' },
        ['running', 'supported', 'refuted', 'inconclusive', 'draft', 'idea'].map(function (k) {
          return h('span', { key: k, className: 'vx-row', style: { gap: 6, flexWrap: 'nowrap' } }, h('svg', { width: 18, height: 8, 'aria-hidden': true }, h('path', { className: 'vx-hedge is-' + k, d: 'M1 4 L17 4', style: { strokeWidth: k === 'supported' || k === 'refuted' ? 3 : undefined } })), HSTATUS[k].label, h('span', { className: 'vx-num vx-faint' }, counts[k] || 0));
        })),
      h('div', { className: 'vx-hud vx-hud-tr vx-zoom' },
        h('button', { type: 'button', className: 'vx-icon-btn', 'aria-label': 'Zoom out', onClick: function () { zoomAt(1 / 1.2, size.w / 2, size.h / 2, true); } }, h(Icon, { name: 'minus', size: 16 })),
        h('span', { className: 'vx-num vx-muted', style: { fontSize: 12, minWidth: 40, textAlign: 'center' } }, Math.round(view.k * 100) + '%'),
        h('button', { type: 'button', className: 'vx-icon-btn', 'aria-label': 'Zoom in', onClick: function () { zoomAt(1.2, size.w / 2, size.h / 2, true); } }, h(Icon, { name: 'plus', size: 16 })),
        h('button', { type: 'button', className: 'vx-icon-btn', 'aria-label': 'Fit to screen', onClick: function () { fit(); } }, h(Icon, { name: 'fit', size: 16 })),
        h('span', { style: { width: 1, height: 20, background: 'var(--line-strong)', margin: '0 4px' } }),
        h('button', { type: 'button', className: 'vx-icon-btn', style: { width: 'auto', padding: '0 8px', fontSize: 12, gap: 4, display: 'inline-flex' }, onClick: function () {
          var v = viewRef.current, sz = sizeRef.current, id = 'l' + Math.random().toString(36).slice(2, 7);
          commitL(levRef.current.concat([{ id: id, label: p.newLeverLabel || 'New lever', icon: 'bulb', x: Math.round((sz.w * 0.3 - v.x) / v.k), y: Math.round((sz.h * 0.5 - v.y) / v.k) }]));
        } }, h(Icon, { name: 'plus', size: 14 }), 'Lever')),
      h('div', { className: 'vx-hud vx-hscrub' },
        h('button', { type: 'button', className: 'vx-icon-btn', 'aria-label': 'Replay history', onClick: play }, h('svg', { width: 14, height: 14, viewBox: '0 0 14 14' }, h('path', { d: 'M3 2 L12 7 L3 12 Z', fill: 'currentColor' }))),
        h('input', { type: 'range', className: 'vx-range', min: tMin, max: todayN, value: tNow, 'aria-label': 'Show the map as of date', onChange: function (e) { clearInterval(playRef.current); var v = +e.target.value; tS[1](v >= todayN ? null : v); } }),
        h('span', { className: 'vx-num', style: { fontSize: 12, minWidth: 64, textAlign: 'right', color: tDay == null ? 'var(--ink-muted)' : 'var(--info)' } }, tDay == null ? 'Today' : shortDate(dayStr(tNow)))),
      !selHyp && !narrow ? h('div', { className: 'vx-hud vx-hud-bl vx-faint', style: { bottom: 64 } }, 'Drag from a lever’s ● to a metric to create a hypothesis · click a label to open it') : null,
      selHyp ? h(HypothesisPanel, { key: selHyp.id, className: narrow ? 'is-sheet' : null, hypothesis: asOf(selHyp) || selHyp, lever: levById[selHyp.lever], metrics: metrics, today: today, conflict: runningBy[selHyp.metric] > 1,
        onClose: function () { selS[1](null); }, onChange: function (nh) { commitH(hypRef.current.map(function (x) { return x.id === nh.id ? nh : x; })); } }) : null);
  }

  /* ---------- Work & money: shared ---------- */
  var CERTAINTY = [
    { key: 'received', label: 'Received', note: 'in the bank', cls: 'c-received' },
    { key: 'secured', label: 'Secured', note: 'prepaid, escrow or invoiced', cls: 'c-secured' },
    { key: 'committed', label: 'Committed', note: 'agreed, not funded', cls: 'c-committed' },
    { key: 'pipeline', label: 'Pipeline', note: 'proposed, weighted by odds', cls: 'c-pipeline' }
  ];
  var money = function (v, o) { return fmt(v, Object.assign({ prefix: '$' }, o || {})); };
  var perHour = function (v) { return v == null ? '—' : money(v) + '/h'; };

  /* ---------- PayoutBar ---------- */
  function PayoutBar(p) {
    var parts = p.parts || {}, total = CERTAINTY.reduce(function (a, c) { return a + (parts[c.key] || 0); }, 0) || 1;
    var shown = CERTAINTY.filter(function (c) { return parts[c.key]; });
    return h('div', { className: 'vx-payout' },
      p.total !== false ? h('div', { className: 'vx-row', style: { justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 } },
        h('span', { className: 'vx-eyebrow' }, p.label || 'Compensation'),
        h('span', { className: 'vx-num', style: { fontSize: p.compact ? 14 : 16 } }, money(total))) : null,
      h('div', { className: 'vx-payout-bar', role: 'img', 'aria-label': shown.map(function (c) { return c.label + ' ' + money(parts[c.key]); }).join(', ') },
        shown.map(function (c, i) { return h('div', { key: c.key, className: 'vx-payout-seg ' + c.cls, style: { flex: parts[c.key] + ' 1 0', animationDelay: i * 80 + 'ms' } }); })),
      p.legend === false ? null : h('div', { className: 'vx-payout-legend' }, shown.map(function (c) {
        return h('span', { key: c.key, className: 'vx-row', style: { gap: 6, flexWrap: 'nowrap' } }, h('span', { className: 'vx-sw ' + c.cls }), h('span', { className: 'vx-muted' }, c.label), h('span', { className: 'vx-num' }, money(parts[c.key])));
      })));
  }

  /* ---------- FreedomMeter ---------- */
  function FreedomMeter(p) {
    var cost = p.monthlyCost || 1, rec = p.recurring || 0, act = p.active || 0;
    var ratio = rec / cost, scale = Math.max(1.3, (rec + act) / cost * 1.05);
    var X = function (v) { return Math.min(100, (v / cost) / scale * 100); };
    var gap = Math.max(0, cost - rec), months = p.recurringGrowth > 0 && gap > 0 ? Math.ceil(gap / p.recurringGrowth) : null;
    var st = useState(reduced() ? 1 : 0); useEffect(function () { var t = setTimeout(function () { st[1](1); }, 40); return function () { clearTimeout(t); }; }, []);
    var pct = useCountUp(Math.round(ratio * 100), 900);
    var stat = function (label, value, sub, tone) { return h('div', { className: 'vx-fm-stat' }, h('span', { className: 'vx-eyebrow' }, label), h('span', { className: 'vx-num', style: { fontSize: 20, lineHeight: '24px', color: tone ? 'var(--' + tone + ')' : 'var(--ink)' } }, value), sub ? h('span', { className: 'vx-faint', style: { fontSize: 12 } }, sub) : null); };
    return h('div', { className: 'vx-fm' },
      h('div', { className: 'vx-fm-head' },
        h('div', null,
          h('div', { className: 'vx-num vx-fm-big' }, Math.round(pct) + '%'),
          h('div', { className: 'vx-muted', style: { maxWidth: 360 } }, 'of my monthly costs are covered by income that arrives without me trading hours for it')),
        ratio >= 1 ? h(Badge, { tone: 'up' }, '✓ Free: recurring covers costs') : months ? h(Badge, { tone: 'info' }, '≈ ' + months + ' mo to freedom at +' + money(p.recurringGrowth) + '/mo') : h(Badge, { tone: 'warn' }, 'Recurring income is flat')),
      h('div', { className: 'vx-fm-track', role: 'img', 'aria-label': 'Recurring ' + money(rec) + ', active ' + money(act) + ', monthly cost ' + money(cost) },
        h('div', { className: 'vx-fm-rec', style: { width: st[0] * X(rec) + '%' } }),
        h('div', { className: 'vx-fm-act', style: { left: X(rec) + '%', width: st[0] * (X(rec + act) - X(rec)) + '%' } }),
        h('div', { className: 'vx-fm-cost', style: { left: X(cost) + '%' } }, h('span', null, 'Costs ' + money(cost) + '/mo'))),
      h('div', { className: 'vx-fm-legend' },
        h('span', { className: 'vx-row', style: { gap: 6 } }, h('span', { className: 'vx-sw', style: { background: 'var(--up)' } }), 'Recurring ' + money(rec) + '/mo', h('span', { className: 'vx-faint' }, 'retainers, products, subscriptions')),
        h('span', { className: 'vx-row', style: { gap: 6 } }, h('span', { className: 'vx-sw c-committed' }), 'Active ' + money(act) + '/mo', h('span', { className: 'vx-faint' }, 'projects, hourly'))),
      h('div', { className: 'vx-fm-stats' },
        stat('Runway', fmt(p.runwayMonths, { decimals: 1 }) + ' mo', 'liquid cash ÷ costs', p.runwayMonths < 3 ? 'down' : p.runwayMonths < 6 ? 'warn' : null),
        stat('Hours / week', (p.hoursPerWeek || 0) + 'h', 'target ' + (p.targetHours || '—') + 'h', p.targetHours && p.hoursPerWeek > p.targetHours * 1.3 ? 'warn' : null),
        stat('Effective rate', perHour(p.effectiveRate), 'all income ÷ all hours'),
        stat('Freedom gap', gap ? money(gap) + '/mo' : '—', gap ? 'recurring still needed' : 'covered', gap ? null : 'up')));
  }

  /* ---------- ActionQueue ---------- */
  function actionValue(a, horizon) { return (a.amount || 0) * (a.probability == null ? 1 : a.probability) * (a.recurring ? (horizon || 12) : 1); }
  function ActionQueue(p) {
    var horizon = p.horizonMonths || 12, base = p.baselineRate || 0;
    var inner = useState(p.actions || []), list = p.onChange ? p.actions : inner[0];
    var set = function (next) { inner[1](next); if (p.onChange) p.onChange(next); };
    var rows = list.map(function (a) { var v = actionValue(a, horizon); return Object.assign({}, a, { value: v, roi: v / Math.max(0.05, a.hours || 0.05) }); })
      .sort(function (a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0) || b.roi - a.roi; });
    var maxLog = Math.log10(Math.max.apply(null, rows.map(function (r) { return r.roi; }).concat([base * 4, 10])));
    var W = function (r) { return Math.max(3, Math.min(100, (Math.log10(Math.max(1, r)) / maxLog) * 100)); };
    var fmtHours = function (x) { return x < 1 ? Math.round(x * 60) + ' min' : fmt(x, { decimals: x % 1 ? 1 : 0 }) + 'h'; };
    return h('div', { className: 'vx-aq' },
      h('div', { className: 'vx-aq-head' }, h('span', null, 'Action'), h('span', { className: 'r' }, 'Expected'), h('span', { className: 'r' }, 'Effort'), h('span', null, 'Return per hour')),
      rows.map(function (a, i) {
        var below = base && a.roi < base;
        return h('div', { key: a.id, className: cx('vx-aq-row', a.done && 'is-done', below && 'is-below') },
          h('div', { className: 'vx-aq-main' },
            h('button', { type: 'button', role: 'checkbox', 'aria-checked': a.done ? 'true' : 'false', 'aria-label': 'Done: ' + a.title, className: cx('vx-check-box', 'vx-aq-check', a.done && 'on'), onClick: function () { set(list.map(function (x) { return x.id === a.id ? Object.assign({}, x, { done: !x.done }) : x; })); } }, a.done ? h(Icon, { name: 'check', size: 12, stroke: 2.5 }) : null),
            h('div', { style: { minWidth: 0 } },
              h('div', { className: 'vx-aq-title' }, a.title),
              h('div', { className: 'vx-row', style: { gap: 6, marginTop: 4 } },
                a.context ? h('span', { className: 'vx-aq-ctx' }, a.context) : null,
                a.recurring ? h(Badge, { tone: 'up' }, '↻ Recurring') : null,
                a.kind ? h('span', { className: 'vx-faint', style: { fontSize: 12 } }, a.kind) : null))),
          h('div', { className: 'r' }, h('div', { className: 'vx-num' }, money(a.value)),
            (a.recurring || (a.probability != null && a.probability < 1)) ? h('div', { className: 'vx-faint', style: { fontSize: 11 } }, (a.recurring ? money(a.amount) + '/mo × ' + horizon : money(a.amount)) + (a.probability != null && a.probability < 1 ? ' × ' + Math.round(a.probability * 100) + '%' : '')) : null),
          h('div', { className: 'r vx-num vx-muted' }, fmtHours(a.hours || 0)),
          h('div', { className: 'vx-aq-roi' },
            h('div', { className: 'vx-aq-track' },
              h('div', { className: 'vx-aq-bar', style: { width: W(a.roi) + '%', animationDelay: i * 50 + 'ms' } }),
              base ? h('span', { className: 'vx-aq-base', style: { left: W(base) + '%' }, title: 'My baseline: ' + perHour(base) }) : null),
            h('span', { className: 'vx-num', style: { color: below ? 'var(--ink-faint)' : 'var(--ink)' } }, perHour(Math.round(a.roi)))));
      }),
      base ? h('div', { className: 'vx-aq-foot' }, h('span', { className: 'vx-aq-base-key' }), 'Baseline ' + perHour(base) + ' — what an hour of billable work pays. Below it, bill hours instead.') : null);
  }

  /* ---------- ClientCard ---------- */
  var KIND = { project: 'Project', retainer: 'Retainer', hourly: 'Hourly', product: 'Product', lead: 'Lead' };
  function ClientCard(p) {
    var c = p.client || p, rate = c.effectiveRate, base = p.baselineRate;
    var status = { active: ['up', 'Active'], paused: ['warn', 'Paused'], lead: ['info', 'Lead'], past: ['neutral', 'Past'] }[c.status || 'active'];
    var recurring = c.kind === 'retainer' || c.kind === 'product';
    return h('button', { type: 'button', className: cx('vx-card', 'vx-client', p.selected && 'is-sel'), onClick: p.onClick, style: { animationDelay: (p.delay || 0) + 'ms' } },
      h('div', { className: 'vx-client-head' },
        h('span', { className: 'vx-src-mark' }, c.mark || (c.name || '?').slice(0, 2).toUpperCase()),
        h('div', { style: { minWidth: 0, flex: 1 } },
          h('div', { className: 'vx-src-name' }, c.name),
          h('div', { className: 'vx-src-detail' }, [KIND[c.kind] || c.kind, c.source].filter(Boolean).join(' · '))),
        h(Badge, { tone: status[0] }, status[1])),
      c.building ? h('div', { className: 'vx-client-building' }, h('span', { className: 'vx-eyebrow' }, c.kind === 'product' ? 'Shipping' : 'Building'), h('span', null, c.building)) : null,
      recurring
        ? h('div', { className: 'vx-row', style: { justifyContent: 'space-between', alignItems: 'baseline' } }, h('span', { className: 'vx-eyebrow' }, 'Recurring'), h('span', { className: 'vx-num', style: { fontSize: 16, color: 'var(--up)' } }, '↻ ' + money(c.mrr) + '/mo'))
        : c.payout ? h(PayoutBar, { parts: c.payout, compact: true, legend: false, label: c.kind === 'lead' ? 'Potential' : 'Contract' }) : null,
      h('div', { className: 'vx-client-stats' },
        h('div', null, h('span', { className: 'vx-eyebrow' }, 'Earned'), h('span', { className: 'vx-num' }, money(c.earned || 0))),
        h('div', null, h('span', { className: 'vx-eyebrow' }, 'Per hour'), h('span', { className: 'vx-num', style: { color: rate == null ? 'var(--ink-faint)' : base && rate < base ? 'var(--warn)' : 'var(--ink)' } }, perHour(rate))),
        h('div', null, h('span', { className: 'vx-eyebrow' }, 'Next'), h('span', { className: 'vx-num' }, c.next ? money(c.next.amount) : '—'), c.next ? h('span', { className: 'vx-faint', style: { fontSize: 11 } }, c.next.date) : null)));
  }

  /* ---------- ProjectCard ---------- */
  var MS = { paid: ['up', '✓ Paid'], done: ['info', 'Delivered'], active: ['info', 'In progress'], next: ['neutral', 'Next'], blocked: ['warn', 'Blocked'] };
  function ProjectCard(p) {
    var pr = p.project || p, ms = pr.milestones || [];
    var total = ms.reduce(function (a, m) { return a + (m.amount || 0); }, 0);
    var projRate = pr.hoursEstimate ? total / Math.max(pr.hoursEstimate, pr.hoursLogged || 0) : null;
    var plannedRate = pr.hoursEstimate ? total / pr.hoursEstimate : null;
    var over = pr.hoursLogged && pr.progress != null && pr.hoursEstimate ? pr.hoursLogged / Math.max(0.01, pr.progress) - pr.hoursEstimate : 0;
    var forecastRate = over > 0 ? total / (pr.hoursEstimate + over) : plannedRate;
    return h(Card, { eyebrow: pr.client + (pr.kind ? ' · ' + (KIND[pr.kind] || pr.kind) : ''), title: pr.title, meta: pr.summary, action: pr.due ? h(Badge, null, 'Due ' + pr.due) : null },
      h('div', { className: 'vx-stack', style: { gap: 18 } },
        h(PayoutBar, { parts: pr.payout }),
        h('div', null,
          h('div', { className: 'vx-row', style: { justifyContent: 'space-between', marginBottom: 6 } }, h('span', { className: 'vx-eyebrow' }, 'Milestones'), h('span', { className: 'vx-num vx-faint', style: { fontSize: 12 } }, Math.round((pr.progress || 0) * 100) + '% done')),
          h('ol', { className: 'vx-ms' }, ms.map(function (m, i) {
            var s = MS[m.status] || MS.next;
            return h('li', { key: i, className: 'vx-ms-row is-' + (m.status || 'next') },
              h('span', { className: 'vx-ms-dot' }),
              h('span', { className: 'vx-ms-title' }, m.title),
              h(Badge, { tone: s[0] }, s[1]),
              h('span', { className: 'vx-num vx-ms-amt' }, money(m.amount)));
          }))),
        pr.hoursEstimate ? h('div', { className: 'vx-ms-hours' },
          h('div', { className: 'vx-row', style: { justifyContent: 'space-between' } }, h('span', { className: 'vx-eyebrow' }, 'Hours'), h('span', { className: 'vx-num', style: { fontSize: 12 } }, (pr.hoursLogged || 0) + ' logged / ' + pr.hoursEstimate + ' planned')),
          h('div', { className: 'vx-meter' }, h('div', { className: 'vx-meter-bar', style: { width: Math.min(100, (pr.hoursLogged || 0) / pr.hoursEstimate * 100) + '%', background: over > 0 ? 'var(--warn)' : undefined } })),
          h('div', { className: 'vx-row', style: { justifyContent: 'space-between', fontSize: 12 } },
            h('span', { className: 'vx-faint' }, 'Planned ' + perHour(Math.round(plannedRate))),
            over > 0 ? h('span', { style: { color: 'var(--warn)' } }, '▼ Heading for ' + perHour(Math.round(forecastRate)) + ' · ~' + Math.round(over) + 'h over') : h('span', { style: { color: 'var(--up)' } }, 'On estimate'))) : null,
        p.footer || null));
  }

  /* ---------- IncomeForecast ---------- */
  function IncomeForecast(p) {
    var wr = useWidth(640), ref = wr[0], W = wr[1], H = p.height || 220, pad = { t: 16, r: 8, b: 26, l: 52 };
    var weeks = p.weeks || [], keys = ['received', 'secured', 'committed', 'pipeline'];
    var tot = function (w) { return keys.reduce(function (a, k) { return a + (w[k] || 0); }, 0); };
    var top = Math.max.apply(null, weeks.map(tot).concat([p.weeklyCost || 0])) * 1.1 || 1;
    var ticks = niceTicks(0, top, 4), y1 = ticks[ticks.length - 1];
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b, bw = iw / Math.max(1, weeks.length);
    var Y = function (v) { return pad.t + ih - (v / y1) * ih; };
    var hov = useState(null), hi = hov[0];
    var cum = 0, covered = weeks.filter(function (w) { return (w.received || 0) + (w.secured || 0) + (w.committed || 0) >= (p.weeklyCost || 0); }).length;
    return h('div', null,
      h('div', { className: 'vx-chart', ref: ref, onMouseLeave: function () { hov[1](null); } },
        h('svg', { height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Expected income by week, ' + covered + ' of ' + weeks.length + ' weeks cover costs without pipeline' },
          ticks.map(function (t) { return h('g', { key: t }, h('line', { className: 'vx-grid', x1: pad.l, x2: W - pad.r, y1: Y(t), y2: Y(t), strokeOpacity: t === 0 ? 1 : 0.5 }), h('text', { className: 'vx-tick', x: pad.l - 10, y: Y(t) + 4, textAnchor: 'end' }, fmt(t, { prefix: '$', compact: true }))); }),
          weeks.map(function (w, i) {
            var x = pad.l + i * bw + bw * 0.18, bwi = bw * 0.64, acc = 0;
            return h('g', { key: i, onMouseEnter: function () { hov[1](i); } },
              h('rect', { x: pad.l + i * bw, y: pad.t, width: bw, height: ih, fill: hi === i ? 'var(--bg-200)' : 'transparent' }),
              keys.map(function (k) {
                var v = w[k] || 0; if (!v) return null;
                var y = Y(acc + v), hh = Y(acc) - Y(acc + v); acc += v;
                return h('rect', { key: k, className: 'vx-if-seg c-' + k, x: x, y: y, width: bwi, height: Math.max(0, hh - 1.5), rx: 3, style: { animationDelay: i * 40 + 'ms' } });
              }),
              (i % Math.ceil(weeks.length / Math.max(2, Math.floor(iw / 70))) === 0) ? h('text', { className: 'vx-tick', x: x + bwi / 2, y: H - 6, textAnchor: 'middle' }, w.label) : null);
          }),
          p.weeklyCost ? h('g', null,
            h('line', { x1: pad.l, x2: W - pad.r, y1: Y(p.weeklyCost), y2: Y(p.weeklyCost), stroke: 'var(--warn)', strokeWidth: 1.5, strokeDasharray: '5 4' }),
            h('text', { className: 'vx-tick', x: W - pad.r, y: Y(p.weeklyCost) - 6, textAnchor: 'end', style: { fill: 'var(--warn)' } }, 'Costs ' + money(p.weeklyCost) + '/wk')) : null),
        hi != null ? h('div', { className: 'vx-tip', style: { left: Math.min(Math.max(pad.l + (hi + 0.5) * bw, 90), W - 90) + 'px', top: Y(tot(weeks[hi])) + 'px' } },
          h('div', { className: 'vx-faint', style: { marginBottom: 4 } }, 'Week of ' + weeks[hi].label),
          CERTAINTY.map(function (c) { var v = weeks[hi][c.key]; return v ? h('div', { key: c.key, className: 'vx-tip-row' }, h('span', { className: 'vx-sw ' + c.cls }), h('span', { className: 'vx-muted' }, c.label), h('span', { className: 'vx-num', style: { marginLeft: 'auto', paddingLeft: 12, color: 'var(--ink)' } }, money(v))) : null; }),
          (weeks[hi].items || []).length ? h('div', { style: { borderTop: '1px solid var(--line-strong)', marginTop: 6, paddingTop: 6 } }, weeks[hi].items.map(function (t, j) { return h('div', { key: j, className: 'vx-faint' }, t); })) : null) : null),
      h('div', { className: 'vx-legend' }, CERTAINTY.map(function (c) { return h('span', { key: c.key, className: 'vx-row', style: { gap: 6 } }, h('span', { className: 'vx-sw ' + c.cls }), c.label, h('span', { className: 'vx-faint' }, c.note)); })));
  }

  /* ---------- Channels: presets ---------- */
  var UNIVERSAL = ['Reach', 'Attention', 'Conversation', 'Meeting', 'Win'];
  var CHANNELS = {
    upwork: { id: 'upwork', name: 'Upwork', mark: 'UW', blurb: 'Proposals on posted jobs, paid in Connects', stages: ['Proposals sent', 'Viewed', 'Replied', 'Interviewed', 'Hired'], cost: 'Connects', verb: 'proposal' },
    email: { id: 'email', name: 'Cold email', mark: 'CE', blurb: 'Sequences to a sourced list, from warmed domains', stages: ['Emails sent', 'Opened', 'Replied', 'Meetings booked', 'Won'], cost: 'Tools & domains', verb: 'email', flags: { 1: 'Opens are estimates: mail privacy features pre-load images' } },
    linkedin: { id: 'linkedin', name: 'LinkedIn', mark: 'LI', blurb: 'Connection requests, then DMs to a warm first line', stages: ['Invites sent', 'Accepted', 'Replied', 'Calls booked', 'Won'], cost: 'Sales tools', verb: 'invite' },
    content: { id: 'content', name: 'Content', mark: 'CT', blurb: 'Posts that bring people to you', stages: ['Posts', 'Profile visits', 'Inbound DMs', 'Calls', 'Won'], cost: 'Tools', verb: 'post' },
    referrals: { id: 'referrals', name: 'Referrals', mark: 'RF', blurb: 'Asking happy clients and peers for intros', stages: ['Asks made', 'Intros', 'Calls', 'Proposals', 'Won'], cost: 'Gifts & fees', verb: 'ask' },
    marketplace: { id: 'marketplace', name: 'Other marketplace', mark: 'MK', blurb: 'Any platform with bids or applications', stages: ['Applications', 'Shortlisted', 'Replied', 'Calls', 'Hired'], cost: 'Fees', verb: 'application' }
  };

  /* ---------- ChannelLens (tabs) ---------- */
  function ChannelLens(p) {
    var items = p.items || [];
    return h('div', { className: 'vx-lens', role: 'tablist', 'aria-label': p.label || 'Channel' }, items.map(function (it) {
      var sel = it.id === p.value;
      return h('button', { key: it.id, type: 'button', role: 'tab', 'aria-selected': sel ? 'true' : 'false', className: cx('vx-lens-tab', sel && 'is-sel'), onClick: function () { if (p.onChange) p.onChange(it.id); } },
        h('span', { className: 'vx-lens-mark' }, it.mark || '∑'),
        h('span', { className: 'vx-lens-text' }, h('span', { className: 'vx-lens-name' }, it.name), it.sub ? h('span', { className: 'vx-lens-sub' }, it.sub) : null),
        it.badge ? h('span', { className: cx('vx-lens-badge', it.badgeTone && 'is-' + it.badgeTone) }, it.badge) : null);
    }));
  }

  /* ---------- ChannelFunnel (leak ribbons) ---------- */
  function wrapWords(s, max) { var out = [], cur = ''; String(s).split(' ').forEach(function (w) { if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }); if (cur) out.push(cur); return out; }
  function ChannelFunnel(p) {
    var wr = useWidth(720), ref = wr[0], W = Math.max(wr[1], p.minWidth || 560);
    var st = p.stages || [], n = st.length, top = 12, Hn = p.bandHeight || 104, colW = 12, H = top + Hn + 92;
    if (n < 2) return null;
    var padX = 8, X = function (i) { return padX + i * ((W - 2 * padX - colW) / (n - 1)); };
    var rates = st.slice(1).map(function (s, i) { return st[i].value ? s.value / st[i].value : 0; });
    var base = p.baseline || [];
    var score = rates.map(function (r, i) { return base[i] ? r / base[i] : null; });
    var leak = -1, worst = Infinity;
    rates.forEach(function (r, i) { if (st[i].flag || st[i + 1].flag) return; var s = score[i] != null ? score[i] : 9; if (s < worst && s < 0.97) { worst = s; leak = i; } });
    var sig = st.map(function (s) { return s.value; }).join('|');
    return h('div', { className: 'vx-chart vx-cf-wrap', ref: ref },
      h('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, style: { width: W }, role: 'img', 'aria-label': st.map(function (s) { return s.label + ' ' + s.value; }).join(', ') + (leak >= 0 ? '. Biggest leak: ' + st[leak].label + ' to ' + st[leak + 1].label : '') },
        rates.map(function (r, i) {
          var x0 = X(i) + colW, x1 = X(i + 1), xm = (x0 + x1) / 2, rr = Math.max(0.04, Math.min(1, r));
          var y1t = top + (1 - rr) * Hn / 2, y1b = top + (1 + rr) * Hn / 2;
          var d = 'M' + x0 + ' ' + top + ' C' + xm + ' ' + top + ' ' + xm + ' ' + y1t + ' ' + x1 + ' ' + y1t + ' L' + x1 + ' ' + y1b + ' C' + xm + ' ' + y1b + ' ' + xm + ' ' + (top + Hn) + ' ' + x0 + ' ' + (top + Hn) + ' Z';
          var dpp = base[i] != null ? (r - base[i]) * 100 : null, isLeak = i === leak;
          return h('g', { key: sig + i, className: 'vx-fade', style: { animationDelay: i * 110 + 'ms' } },
            h('path', { d: d, className: cx('vx-cf-band', isLeak && 'is-leak') }),
            h('text', { x: xm + colW / 2, y: top + Hn / 2 - 2, textAnchor: 'middle', className: 'vx-cf-rate' }, fmt(r * 100, { decimals: r < 0.1 ? 1 : 0 }) + '%'),
            dpp != null ? h('text', { x: xm + colW / 2, y: top + Hn / 2 + 14, textAnchor: 'middle', className: 'vx-cf-delta', style: { fill: Math.abs(dpp) < 0.5 ? 'var(--ink-muted)' : dpp > 0 ? 'var(--up)' : 'var(--down)' } }, (dpp > 0.5 ? '▲ +' : dpp < -0.5 ? '▼ −' : '■ ') + fmt(Math.abs(dpp), { decimals: Math.abs(dpp) < 10 ? 1 : 0 }) + 'pp') : null,
            isLeak ? h('text', { x: xm + colW / 2, y: top + Hn + 4 - 2, textAnchor: 'middle', className: 'vx-cf-leak' }, 'BIGGEST LEAK') : null);
        }),
        st.map(function (s, i) {
          var lines = wrapWords(s.label, 14), flagged = !!s.flag;
          return h('g', { key: i },
            h('rect', { x: X(i), y: top, width: colW, height: Hn, rx: 4, className: cx('vx-cf-col', flagged && 'is-flag') }),
            h('text', { x: X(i) + colW / 2, y: top + Hn + 30, textAnchor: i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle', className: 'vx-cf-val', transform: null, dx: i === 0 ? -colW / 2 : i === n - 1 ? colW / 2 : 0 }, (flagged ? '≈' : '') + fmt(s.value, p.format)),
            lines.map(function (ln, j) { return h('text', { key: j, x: X(i) + colW / 2, dx: i === 0 ? -colW / 2 : i === n - 1 ? colW / 2 : 0, y: top + Hn + 48 + j * 15, textAnchor: i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle', className: 'vx-cf-label' }, ln); }),
            p.universal !== false && s.universal ? h('text', { x: X(i) + colW / 2, dx: i === 0 ? -colW / 2 : i === n - 1 ? colW / 2 : 0, y: top + Hn + 48 + lines.length * 15 + 2, textAnchor: i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle', className: 'vx-cf-uni' }, s.universal.toUpperCase()) : null);
        })),
      st.some(function (s) { return s.flag; }) ? h('div', { className: 'vx-faint', style: { fontSize: 12, marginTop: 6 } }, st.filter(function (s) { return s.flag; }).map(function (s) { return '≈ ' + s.label + ': ' + s.flag; }).join(' · ')) : null,
      base.length ? h('div', { className: 'vx-faint', style: { fontSize: 12, marginTop: 4 } }, '▲▼ against ' + (p.baselineLabel || 'my own 90-day average') + '. Ribbons show the share kept at each step.') : null);
  }

  /* ---------- ChannelHealth ---------- */
  var HEALTH = { ok: ['up', 'Healthy'], watch: ['warn', 'Watch'], fix: ['down', 'Fix'], info: ['neutral', 'Note'] };
  function ChannelHealth(p) {
    return h('div', { className: 'vx-health' }, (p.items || []).map(function (it, i) {
      var s = HEALTH[it.status || 'info'];
      return h('div', { key: i, className: 'vx-health-tile is-' + (it.status || 'info') },
        h('div', { className: 'vx-row', style: { justifyContent: 'space-between', flexWrap: 'nowrap' } }, h('span', { className: 'vx-eyebrow' }, it.label), h(Badge, { tone: s[0] }, s[1])),
        h('div', { className: 'vx-num', style: { fontSize: 22, lineHeight: '26px', color: 'var(--ink)' } }, it.value, it.unit ? h('span', { className: 'vx-faint', style: { fontSize: 13 } }, ' ' + it.unit) : null),
        it.meter ? h('div', { className: 'vx-meter' }, h('div', { className: 'vx-meter-bar', style: { width: Math.min(100, it.meter[0] / it.meter[1] * 100) + '%', background: it.status === 'fix' ? 'var(--down)' : it.status === 'watch' ? 'var(--warn)' : undefined } })) : null,
        it.note ? h('div', { className: 'vx-faint', style: { fontSize: 12, lineHeight: '16px' } }, it.note) : null);
    }));
  }

  /* ---------- ChannelPortfolio ---------- */
  function channelRoi(c) { return c.hours90 ? ((c.won || 0) - (c.cost || 0)) / c.hours90 : null; }
  function ChannelPortfolio(p) {
    var list = (p.channels || []).map(function (c, i) { var hrs = c.hours90 != null ? c.hours90 : (c.hoursPerWeek || 0) * 13; var cc = Object.assign({}, c, { hours90: hrs, color: c.color || SERIES[i % SERIES.length] }); cc.roi = channelRoi(cc); return cc; });
    var base = p.baselineRate || 0;
    var totH = list.reduce(function (a, c) { return a + (c.hoursPerWeek || 0); }, 0) || 1, totW = list.reduce(function (a, c) { return a + (c.won || 0); }, 0) || 1;
    var verdict = function (c) { if (c.ageDays != null && c.ageDays < 45) return ['neutral', 'Too early']; if (c.roi == null) return ['neutral', '—']; if (c.roi >= base * 1.5) return ['up', 'Add hours']; if (c.roi >= base * 0.8) return ['info', 'Hold']; return ['warn', 'Trim']; };
    /* rebalance: move hours from the weakest mature channel to the strongest with room */
    var mature = list.filter(function (c) { return !(c.ageDays != null && c.ageDays < 45) && c.roi != null && c.hoursPerWeek > 0; });
    var donor = mature.slice().sort(function (a, b) { return a.roi - b.roi; })[0];
    var plan = [], gain = 0;
    if (donor && donor.roi < base) {
      var give = Math.min(Math.round(donor.hoursPerWeek * 0.5), 4);
      mature.filter(function (c) { return c !== donor && c.roi > donor.roi; }).sort(function (a, b) { return b.roi - a.roi; }).forEach(function (r) {
        if (give <= 0) return;
        var room = r.maxHours != null ? Math.max(0, r.maxHours - r.hoursPerWeek) : give, take = Math.min(room, give);
        if (take > 0) { plan.push({ to: r, hours: take }); gain += take * (r.roi - donor.roi) * 4.33; give -= take; }
      });
    }
    var maxRoi = Math.max.apply(null, list.map(function (c) { return c.roi || 0; }).concat([base * 2]));
    var RW = function (v) { return Math.max(2, Math.min(100, Math.log10(Math.max(1, v)) / Math.log10(Math.max(10, maxRoi)) * 100)); };
    var split = function (key, tot, label) {
      return h('div', { className: 'vx-pf-split' }, h('div', { className: 'vx-row', style: { justifyContent: 'space-between' } }, h('span', { className: 'vx-eyebrow' }, label), h('span', { className: 'vx-num vx-faint', style: { fontSize: 12 } }, key === 'hoursPerWeek' ? tot + 'h / week' : money(tot) + ' · 90 days')),
        h('div', { className: 'vx-alloc-bar', style: { height: 14 } }, list.map(function (c, i) { return c[key] ? h('div', { key: c.id, className: 'vx-alloc-seg', title: c.name + ' ' + Math.round(c[key] / tot * 100) + '%', style: { flex: c[key] + ' 1 0', background: c.color, animationDelay: i * 70 + 'ms' } }) : null; })));
    };
    return h('div', { className: 'vx-pf' },
      h('div', { className: 'vx-pf-splits' }, split('hoursPerWeek', totH, 'Where my hours go'), split('won', totW, 'Where my money comes from')),
      h('div', { className: 'vx-pf-legend' }, list.map(function (c) { return h('span', { key: c.id, className: 'vx-row', style: { gap: 6 } }, h('span', { className: 'vx-sw', style: { background: c.color } }), c.name, h('span', { className: 'vx-faint vx-num' }, Math.round((c.hoursPerWeek || 0) / totH * 100) + '% → ' + Math.round((c.won || 0) / totW * 100) + '%')); })),
      h('div', { className: 'vx-pf-table' },
        h('div', { className: 'vx-pf-row is-head' }, h('span', null, 'Channel'), h('span', { className: 'r' }, 'Hours/wk'), h('span', { className: 'r' }, 'Won · 90d'), h('span', { className: 'r' }, 'First $'), h('span', null, 'Return per hour'), h('span', null, '')),
        list.map(function (c, i) {
          var v = verdict(c);
          return h('button', { key: c.id, type: 'button', className: 'vx-pf-row', onClick: p.onSelect ? function () { p.onSelect(c.id); } : undefined },
            h('span', { className: 'vx-row', style: { flexWrap: 'nowrap', gap: 10, minWidth: 0 } }, h('span', { className: 'vx-src-mark', style: { boxShadow: 'inset 3px 0 0 ' + c.color } }, c.mark), h('span', { style: { minWidth: 0 } }, h('span', { className: 'vx-src-name', style: { display: 'block' } }, c.name), h('span', { className: 'vx-src-detail', style: { display: 'block' } }, c.wins + (c.wins === 1 ? ' win · ' : ' wins · ') + (c.cost ? money(c.cost) + ' ' + (c.costLabel || 'cost') : 'no cash cost')))),
            h('span', { className: 'r vx-num' }, (c.hoursPerWeek || 0) + 'h'),
            h('span', { className: 'r vx-num' }, money(c.won || 0)),
            h('span', { className: 'r vx-num vx-muted' }, c.daysToFirst != null ? c.daysToFirst + 'd' : '—'),
            h('span', { className: 'vx-aq-roi' }, h('span', { className: 'vx-aq-track' }, h('span', { className: 'vx-aq-bar', style: { display: 'block', width: RW(c.roi || 0) + '%', background: c.roi != null && c.roi < base ? 'var(--ink-faint)' : undefined, animationDelay: i * 60 + 'ms' } }), base ? h('span', { className: 'vx-aq-base', style: { left: RW(base) + '%' } }) : null), h('span', { className: 'vx-num', style: { minWidth: 58, textAlign: 'right', fontSize: 13 } }, c.roi == null ? '—' : perHour(Math.round(c.roi)))),
            h('span', { style: { textAlign: 'right' } }, h(Badge, { tone: v[0] }, v[1])));
        })),
      plan.length ? h('div', { className: 'vx-pf-plan' },
        h('div', { className: 'vx-row', style: { gap: 10, flexWrap: 'nowrap', alignItems: 'flex-start' } },
          h('span', { className: 'vx-pf-plan-ico' }, h(Icon, { name: 'repeat', size: 16 })),
          h('div', null,
            h('div', { style: { fontWeight: 600, color: 'var(--ink)' } }, 'Rebalance: move ' + plan.reduce(function (a, x) { return a + x.hours; }, 0) + 'h/week out of ' + donor.name + ' → ' + plan.map(function (x) { return x.to.name + ' (+' + x.hours + 'h)'; }).join(', ')),
            h('div', { className: 'vx-muted', style: { fontSize: 13, marginTop: 2 } }, '≈ ', h('span', { className: 'vx-num', style: { color: 'var(--up)' } }, '+' + money(Math.round(gain / 10) * 10) + '/month'), ' if returns hold. They usually fall as a channel scales, so re-check in 4 weeks.'))),
        p.onApply ? h(Button, { variant: 'ghost', size: 'sm', onClick: function () { p.onApply(plan, donor); } }, 'Try for 4 weeks') : null) : null);
  }

  /* ---------- ChannelPicker (setup) ---------- */
  function ChannelPicker(p) {
    var st = useState(p.value || {}), val = p.onChange ? (p.value || {}) : st[0];
    var set = function (next) { st[1](next); if (p.onChange) p.onChange(next); };
    var ids = p.options || Object.keys(CHANNELS);
    var tot = Object.keys(val).reduce(function (a, k) { return a + val[k]; }, 0);
    return h('div', { className: 'vx-pick' },
      h('div', { className: 'vx-pick-grid' }, ids.map(function (id) {
        var c = CHANNELS[id], on = val[id] != null;
        return h('div', { key: id, className: cx('vx-pick-tile', on && 'is-on') },
          h('button', { type: 'button', className: 'vx-pick-hit', 'aria-pressed': on ? 'true' : 'false', onClick: function () { var n = Object.assign({}, val); if (on) delete n[id]; else n[id] = 4; set(n); } },
            h('span', { className: 'vx-src-mark' }, c.mark),
            h('span', { style: { minWidth: 0, flex: 1 } }, h('span', { className: 'vx-src-name', style: { display: 'block' } }, c.name), h('span', { className: 'vx-faint', style: { fontSize: 12, lineHeight: '16px', display: 'block' } }, c.blurb)),
            h('span', { className: cx('vx-check-box', on && 'on'), style: on ? { background: 'var(--up)', borderColor: 'var(--up)' } : null }, on ? h(Icon, { name: 'check', size: 12, stroke: 2.5 }) : null)),
          on ? h('div', { className: 'vx-pick-hours' },
            h('span', { className: 'vx-eyebrow' }, 'Hours a week'),
            h('span', { className: 'vx-row', style: { gap: 4, flexWrap: 'nowrap' } },
              h('button', { type: 'button', className: 'vx-icon-btn', style: { width: 26, height: 26 }, 'aria-label': 'Fewer hours', onClick: function () { var n = Object.assign({}, val); n[id] = Math.max(1, n[id] - 1); set(n); } }, h(Icon, { name: 'minus', size: 14 })),
              h('span', { className: 'vx-num', style: { minWidth: 44, textAlign: 'center' } }, val[id] + 'h/wk'),
              h('button', { type: 'button', className: 'vx-icon-btn', style: { width: 26, height: 26 }, 'aria-label': 'More hours', onClick: function () { var n = Object.assign({}, val); n[id] = Math.min(40, n[id] + 1); set(n); } }, h(Icon, { name: 'plus', size: 14 })))) : null);
      })),
      h('div', { className: 'vx-pick-foot' },
        h('span', { className: 'vx-muted' }, Object.keys(val).length ? Object.keys(val).length + ' bets · ' : 'Pick the channels you actually work · ', h('span', { className: 'vx-num', style: { color: 'var(--ink)' } }, tot + 'h'), ' a week on getting clients'),
        p.onDone ? h(Button, { variant: 'primary', disabled: !Object.keys(val).length, onClick: function () { p.onDone(val); } }, 'Build my dashboard') : null));
  }

  window.Vector = Object.assign(window.Vector || {}, {
    Button: Button, Badge: Badge, Delta: Delta, SegmentedControl: SegmentedControl, Card: Card, StatTile: StatTile, Sparkline: Sparkline,
    TrendChart: TrendChart, FunnelChart: FunnelChart, AllocationBar: AllocationBar, HoldingsTable: HoldingsTable, SourceStatus: SourceStatus,
    ProgressRing: ProgressRing, Icon: Icon, SkillNode: SkillNode, SkillPanel: SkillPanel, SkillTree: SkillTree,
    EvidenceMeter: EvidenceMeter, ForestPlot: ForestPlot, CalibrationChart: CalibrationChart, HypothesisPanel: HypothesisPanel, HypothesisCanvas: HypothesisCanvas,
    FreedomMeter: FreedomMeter, ActionQueue: ActionQueue, ClientCard: ClientCard, ProjectCard: ProjectCard, PayoutBar: PayoutBar, IncomeForecast: IncomeForecast,
    ChannelLens: ChannelLens, ChannelFunnel: ChannelFunnel, ChannelHealth: ChannelHealth, ChannelPortfolio: ChannelPortfolio, ChannelPicker: ChannelPicker, channels: CHANNELS, universalStages: UNIVERSAL, format: fmt
  });
})();
