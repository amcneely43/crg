/* ═══════════════════════════════════════════════════════
   CRG Community Semantic Network — Word Map (D3 v7)
   Data source: window.TERMS (output by words.php)
═══════════════════════════════════════════════════════ */

// Temporal-class base fill — drives both initial render and all reset paths.
// centrifugal: white interior (pushes outward, rupturing)
// centripetal: transparent interior (pulls inward, rapt)
// neutral:     yellow interior (receives force, neither pushes nor pulls)
function nodeBaseFill(d) {
  if (d.center) return 'rgba(255,255,255,0.12)';
  if (d.temporal === 'centrifugal') return 'rgba(255,255,255,0.9)';
  if (d.temporal === 'centripetal') return 'none';
  if (d.temporal === 'neutral')     return 'rgba(255,210,0,1)';
  return 'rgba(255,255,255,0.5)'; // fallback
}

// Global hook for external code to highlight nodes by term ID array.
let highlightTerms = function() {};

function buildWordMap() {
  const svg = d3.select('#wordMap');
  const el  = document.getElementById('wordMap');

  // Read dimensions via getBoundingClientRect() — more reliable than
  // clientWidth/clientHeight, which can return 0 (Safari/SVG) or a
  // near-zero transient value while flex layout is still settling.
  // A minimum of 50px on each axis ensures we have a real layout rect.
  const wrap = el.parentElement;
  const rect = wrap.getBoundingClientRect();
  const W    = Math.round(rect.width);
  const H    = Math.round(rect.height);

  // Guard: container hasn't reached a usable size yet — retry next frame.
  if (W < 50 || H < 50) {
    requestAnimationFrame(buildWordMap);
    return;
  }

  // Clear any partial state from a previous (failed) build attempt.
  svg.selectAll('*').remove();

  // Scale all radii to fit within the SVG, leaving room for pole symbols.
  // poleSymbolMargin must be > poleOffset + approx glyph cap-height so the
  // N/S symbols stay inside SVG bounds (which are clipped by the page container).
  const poleSymbolMargin = 52;
  const dialR = Math.floor(Math.min(W / 2, H / 2) - poleSymbolMargin);
  const scale = dialR / 378; // 378 is the baseline design radius
  const categoryRadius = {
    'instinctual': Math.round(120 * scale),
    'social':      Math.round(250 * scale),
    'structural':  Math.round(335 * scale),
  };

  // Initialize nodes with angular positions derived from valence + cohesion.
  // angle = atan2(cohesion, valence) maps the two axes onto the compass:
  //   East  (right)  = rapt pole       (valence  +1)
  //   North (top)    = harmony pole    (cohesion +1)
  //   West  (left)   = rupture pole    (valence  -1)
  //   South (bottom) = dissonance pole (cohesion -1)
  const nodes = TERMS.map(t => {
    const r     = t.center ? 0 : (categoryRadius[t.category] || categoryRadius['social']);
    const angle = (t.center || (t.valence == null && t.cohesion == null))
      ? 0
      : Math.atan2(t.cohesion || 0, t.valence || 0);
    return {
      ...t,
      x:  W / 2 + r * Math.cos(angle),
      y:  H / 2 - r * Math.sin(angle), // SVG y-axis inverted: –sin puts integrating at top
      fx: t.center ? W / 2 : null,
      fy: t.center ? H / 2 : null,
    };
  });

  const centerNode = TERMS.find(t => t.center);
  const links = TERMS
    .filter(t => !t.center)
    .map(t => ({ source: centerNode.id, target: t.id }));

  let compassRotation = 0;              // radians; updated by rotateCompass()
  let fifthPoleAngle  = Math.PI / 4;  // radians; absolute, independent of compassRotation

  const sim = d3.forceSimulation(nodes)
    .force('link',      d3.forceLink(links).id(d => d.id).distance(110).strength(0.05))
    .force('charge',    d3.forceManyBody().strength(-120))
    .force('center',    d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(40))
    .force('radial',    d3.forceRadial(
      d => d.center ? 0 : (categoryRadius[d.category] || categoryRadius['social']),
      W / 2, H / 2
    ).strength(0.9))

    // Angular force — pulls each term toward its editorially assigned angle.
    // Strength is scaled by ring size: smaller rings need stronger correction
    // because charge interactions are more intense at close range.
    .force('angular', function(alpha) {
      nodes.forEach(d => {
        if (d.center || d.valence == null) return;
        // Each derived node has its own angular offset (120° apart), forming
        // a rotating triangle. All other nodes follow compassRotation.
        // Derived nodes target their circle's angle directly (no base offset)
        // so they align radially with their respective triangle circle.
        // All other nodes use valence/cohesion + compassRotation as before.
        const targetAngle = d.derived
          ? (d.id === 'community' ? fifthPoleAngle
           : d.id === 'commons'   ? fifthPoleAngle + 2 * Math.PI / 3
           :                        fifthPoleAngle + 4 * Math.PI / 3)
          : Math.atan2(d.cohesion || 0, d.valence || 0) + compassRotation;
        const r = categoryRadius[d.category] || categoryRadius['social'];
        const targetX = W / 2 + r * Math.cos(targetAngle);
        const targetY = H / 2 - r * Math.sin(targetAngle);
        // Stronger pull for inner rings where charge forces compete more
        const strength = r <= 120 ? 0.8 : r <= 250 ? 0.6 : 0.45;
        d.vx += (targetX - d.x) * strength * alpha;
        d.vy += (targetY - d.y) * strength * alpha;
      });
    })

    // Temporal force — centripetal terms attract nearby nodes (gravity wells);
    // centrifugal terms repel nearby nodes (dispersal).
    // Force falls off with distance²; limited to 180px radius to stay subtle.
    .force('temporal', function(alpha) {
      nodes.forEach(ni => {
        if (ni.center || !ni.temporal || ni.temporal === 'neutral') return;
        nodes.forEach(nj => {
          if (ni === nj || nj.center) return;
          const dx   = nj.x - ni.x;
          const dy   = nj.y - ni.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist > 180) return;
          // centripetal: negative strength pulls nj toward ni
          // centrifugal: positive strength pushes nj away from ni
          const strength = ni.temporal === 'centripetal' ? -4 : 4;
          const f = (strength / (dist * dist)) * alpha;
          nj.vx += dx * f;
          nj.vy += dy * f;
        });
      });
    });

  // ── Radial gradient ──────────────────────────────────────────────────────
  const defs = svg.append('defs');
  const gradient = defs.append('radialGradient')
    .attr('id', 'wordMapGradient')
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('cx', W / 2).attr('cy', H / 2).attr('r', 370);
  gradient.append('stop')
    .attr('offset', '0%').attr('stop-color', '#D62CFF').attr('stop-opacity', 0.12);
  gradient.append('stop')
    .attr('offset', '100%').attr('stop-color', '#D62CFF').attr('stop-opacity', 0);

  const g = svg.append('g');

  // Gradient background
  g.append('circle')
    .attr('cx', W / 2).attr('cy', H / 2).attr('r', 420)
    .attr('fill', 'url(#wordMapGradient)');

  // ── Outer dial ring ──────────────────────────────────────────────────────
  const dialGroup = g.append('g').attr('class', 'dial-ring');

  dialGroup.append('circle')
    .attr('cx', W / 2).attr('cy', H / 2).attr('r', dialR)
    .attr('fill', 'none')
    .attr('stroke', 'rgba(255,255,255,0.5)')
    .attr('stroke-width', 1)
    .attr('opacity', 0.85);

  // Compass-style ticks every 1° with a 5-level hierarchy
  for (let deg = 0; deg < 360; deg += 1) {
    const rad        = (deg * Math.PI) / 180;
    const isCardinal = deg % 90 === 0;
    const isMajor30  = deg % 30 === 0;
    const isMajor10  = deg % 10 === 0;
    const isMajor5   = deg % 5  === 0;
    const innerR = isCardinal ? dialR - 20 : isMajor30 ? dialR - 13 : isMajor10 ? dialR - 8 : isMajor5 ? dialR - 5 : dialR - 3;
    const sw     = isCardinal ? 1.5 : isMajor30 ? 1 : isMajor10 ? 0.75 : 0.5;
    const op     = isCardinal ? 0.9 : isMajor30 ? 0.65 : isMajor10 ? 0.45 : isMajor5 ? 0.3 : 0.18;
    dialGroup.append('line')
      .attr('x1', W / 2 + innerR * Math.cos(rad))
      .attr('y1', H / 2 + innerR * Math.sin(rad))
      .attr('x2', W / 2 + dialR  * Math.cos(rad))
      .attr('y2', H / 2 + dialR  * Math.sin(rad))
      .attr('stroke',       'rgba(255,255,255,' + op + ')')
      .attr('stroke-width', sw);
  }

  // Cardinal pole symbols at the four compass cardinals — all pure SVG.
  const poleOffset = 16;
  const poleR      = 8;
  const poleFill   = 'rgba(255,255,255,0.85)';

  // ● — Presence (East): solid filled circle.
  dialGroup.append('circle')
    .attr('cx', W/2 + dialR + poleOffset).attr('cy', H/2)
    .attr('r', poleR).attr('fill', poleFill);

  // ○ — Absence (West): open ring.
  dialGroup.append('circle')
    .attr('cx', W/2 - dialR - poleOffset).attr('cy', H/2)
    .attr('r', poleR).attr('fill', 'none')
    .attr('stroke', poleFill).attr('stroke-width', 1.5);

  // ⊕ and ⊖ — North and South (Integration / Alienation axis).
  const circP       = `M ${poleR},0 A ${poleR},${poleR} 0 1,0 -${poleR},0 A ${poleR},${poleR} 0 1,0 ${poleR},0 Z`;
  const plusCutout  = `M -1,-6 L 1,-6 L 1,-1 L 6,-1 L 6,1 L 1,1 L 1,6 L -1,6 L -1,1 L -6,1 L -6,-1 L -1,-1 Z`;
  const minusCutout = `M -6,-1 L 6,-1 L 6,1 L -6,1 Z`;
  [
    { x: W/2, y: H/2 - dialR - poleOffset, d: `${circP} ${plusCutout}`  },
    { x: W/2, y: H/2 + dialR + poleOffset, d: `${circP} ${minusCutout}` },
  ].forEach(p => {
    dialGroup.append('path')
      .attr('transform', `translate(${p.x},${p.y})`)
      .attr('d', p.d)
      .attr('fill', 'rgba(255,255,255,0.85)')
      .attr('fill-rule', 'evenodd')
      .attr('opacity', 1);
  });

  // ── Orbital rings ────────────────────────────────────────────────────────
  const ringGroup = g.append('g').attr('class', 'orbital-rings');
  Object.values(categoryRadius).forEach(r => {
    ringGroup.append('circle')
      .attr('cx', W / 2).attr('cy', H / 2).attr('r', r)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,255,255,0.3)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,4')
      .attr('opacity', 0.75);
  });

  // ── Links ────────────────────────────────────────────────────────────────
  const link = g.append('g')
    .selectAll('line').data(links).join('line')
    .attr('stroke',       d => d.target.derived ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)')
    .attr('stroke-width', d => d.target.derived ? 1.5 : 1);

  // ── Nodes ────────────────────────────────────────────────────────────────
  const node = g.append('g')
    .selectAll('g').data(nodes).join('g')
    .style('cursor', 'pointer');

  node.append('circle')
    .attr('r',            d => d.center ? 10 : d.derived ? 6 : 3)
    .attr('fill',         d => nodeBaseFill(d))
    .attr('stroke',       d => d.center ? 'rgba(255,255,255,0.3)' : d.derived ? 'rgba(255,255,255,0.6)' : '#D62CFF')
    .attr('stroke-width', d => d.center ? 1 : d.derived ? 2 : 1.5);

  // Dashed halo ring — derived nodes only
  node.filter(d => d.derived)
    .append('circle')
    .attr('class', 'derived-ring')
    .attr('r', 10)
    .attr('fill', 'none')
    .attr('stroke', 'rgba(255,255,255,0.4)')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '2,2')
    .attr('opacity', 0.5);

  node.append('text')
    .text(d => d.label)
    .attr('x', d => d.center ? -50 : 10)
    .attr('y', d => d.center ? -14 : 4)
    .attr('font-size',      d => d.center ? '0.95rem' : '0.8rem')
    .attr('font-family',    '"triptych-roman", Georgia, serif')
    .attr('text-anchor',    d => d.center ? 'middle' : 'start')
    .attr('fill',           d => d.center ? 'rgba(255,255,255,0.65)' : d.derived ? 'rgba(214,44,255,0.9)' : '#D62CFF')
    .attr('letter-spacing', '0.03em');

  // Triangle group sits between links and nodes
  const triangleGroup = g.insert('g', 'g:last-child').attr('class', 'triangle-lines');

  // ── Highlight API (for external callers) ─────────────────────────────────
  highlightTerms = function(termIds) {
    node.select('circle')
      .attr('fill',   d => nodeBaseFill(d))
      .attr('stroke', d => d.center ? 'rgba(255,255,255,0.3)' : d.derived ? 'rgba(255,255,255,0.6)' : '#D62CFF')
      .attr('r',      d => d.center ? 10 : d.derived ? 6 : 3);
    triangleGroup.selectAll('line').remove();
    if (!termIds || termIds.length === 0) return;
    const hoverColor = termIds.length >= 3 ? '#FFAF00' : '#D62CFF';
    node.filter(d => termIds.includes(d.id))
      .select('circle')
      .attr('fill',   hoverColor)
      .attr('stroke', d => d.center ? '#333' : hoverColor)
      .attr('r',      d => d.center ? 12 : d.derived ? 8 : 5);
    const matched = nodes.filter(n => termIds.includes(n.id));
    if (matched.length >= 2) {
      for (let i = 0; i < matched.length; i++) {
        for (let j = i + 1; j < matched.length; j++) {
          triangleGroup.append('line')
            .attr('x1', matched[i].x).attr('y1', matched[i].y)
            .attr('x2', matched[j].x).attr('y2', matched[j].y)
            .attr('stroke', hoverColor)
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '4,3')
            .attr('opacity', 0.55);
        }
      }
    }
  };

  // ── Settle simulation synchronously, then bloom from center ──────────────
  sim.stop();
  for (let i = 0; i < 300; ++i) sim.tick();

  nodes.forEach(d => { d.finalX = d.x; d.finalY = d.y; d.x = W / 2; d.y = H / 2; });

  function applyPositions() {
    link
      .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    node.attr('transform', d => `translate(${d.x},${d.y})`);
  }
  applyPositions();

  // Bloom: animate every node and link from center to its settled position.
  const BLOOM_DUR = 1200;
  node.transition().duration(BLOOM_DUR).ease(d3.easeCubicOut)
    .attrTween('transform', d => {
      const xi = d3.interpolateNumber(W / 2, d.finalX);
      const yi = d3.interpolateNumber(H / 2, d.finalY);
      return t => `translate(${xi(t)},${yi(t)})`;
    });
  link.transition().duration(BLOOM_DUR).ease(d3.easeCubicOut)
    .attrTween('x1', d => d3.interpolateNumber(W / 2, d.source.finalX))
    .attrTween('y1', d => d3.interpolateNumber(H / 2, d.source.finalY))
    .attrTween('x2', d => d3.interpolateNumber(W / 2, d.target.finalX))
    .attrTween('y2', d => d3.interpolateNumber(H / 2, d.target.finalY));

  // ── Pole legend (bottom-right, two columns) ──────────────────────────────
  const legR     = 6;
  const legBotY  = H - 30;
  const legRowH  = 20;
  const legFill  = 'rgba(255,255,255,0.75)';
  const legGroup = g.append('g').attr('class', 'map-legend');

  const legCircP  = `M ${legR},0 A ${legR},${legR} 0 1,0 -${legR},0 A ${legR},${legR} 0 1,0 ${legR},0 Z`;
  const legPlusC  = `M -1,-4 L 1,-4 L 1,-1 L 4,-1 L 4,1 L 1,1 L 1,4 L -1,4 L -1,1 L -4,1 L -4,-1 L -1,-1 Z`;
  const legMinusC = `M -4,-1 L 4,-1 L 4,1 L -4,1 Z`;

  const legCols = [
    {
      x: W - 220,
      items: [
        { draw: r => r.append('circle').attr('r', legR).attr('fill', legFill),                                                              label: 'Rapt'        },
        { draw: r => r.append('circle').attr('r', legR).attr('fill', 'none').attr('stroke', legFill).attr('stroke-width', 1.5),             label: 'Rupture'     },
      ],
    },
    {
      x: W - 110,
      items: [
        { draw: r => r.append('path').attr('d', `${legCircP} ${legPlusC}`) .attr('fill', legFill).attr('fill-rule', 'evenodd'), label: 'Harmony'     },
        { draw: r => r.append('path').attr('d', `${legCircP} ${legMinusC}`).attr('fill', legFill).attr('fill-rule', 'evenodd'), label: 'Dissonance'  },
      ],
    },
  ];

  legCols.forEach(col => {
    col.items.forEach((item, i) => {
      const y   = legBotY - (col.items.length - 1 - i) * legRowH;
      const row = legGroup.append('g').attr('transform', `translate(${col.x},${y})`);
      item.draw(row);
      row.append('text')
        .attr('x', 14).attr('y', 0)
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '0.7rem')
        .attr('font-family', '"triptych-roman", Georgia, serif')
        .attr('letter-spacing', '0.05em')
        .attr('fill', 'rgba(255,255,255,0.55)')
        .text(item.label);
    });
  });

  // ── Compass rotation ─────────────────────────────────────────────────────
  window.rotateCompass = function(deg) {
    compassRotation = deg * Math.PI / 180;
    nodes.forEach(d => {
      if (d.center) return;
      const r     = categoryRadius[d.category] || categoryRadius['social'];
      const angle = Math.atan2(d.cohesion || 0, d.valence || 0) + compassRotation;
      d.x  = W / 2 + r * Math.cos(angle);
      d.y  = H / 2 - r * Math.sin(angle);
      d.vx = 0;
      d.vy = 0;
    });
    sim.alpha(1);
    for (let i = 0; i < 300; ++i) sim.tick();
    applyPositions();
    dialGroup.attr('transform', `rotate(${deg},${W / 2},${H / 2})`);
  };

  // Drag-to-rotate: transparent wide stroke around the dial ring as hit area.
  dialGroup.append('circle')
    .attr('cx', W / 2).attr('cy', H / 2).attr('r', dialR)
    .attr('fill', 'none')
    .attr('stroke', 'transparent')
    .attr('stroke-width', 40)
    .style('cursor', 'grab');

  let dragStartAngle    = null;
  let dragStartRotation = null;

  dialGroup.on('pointerdown', function(event) {
    event.preventDefault();
    const svgRect = el.getBoundingClientRect();
    const px = event.clientX - svgRect.left;
    const py = event.clientY - svgRect.top;
    dragStartAngle    = Math.atan2(py - H / 2, px - W / 2);
    dragStartRotation = compassRotation;
    dialGroup.style('cursor', 'grabbing');

    d3.select(window)
      .on('pointermove.compass', function(e) {
        const px2 = e.clientX - svgRect.left;
        const py2 = e.clientY - svgRect.top;
        let delta = Math.atan2(py2 - H / 2, px2 - W / 2) - dragStartAngle;
        if (delta >  Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        rotateCompass((dragStartRotation + delta) * 180 / Math.PI);
      })
      .on('pointerup.compass', function() {
        dragStartAngle    = null;
        dragStartRotation = null;
        dialGroup.style('cursor', 'grab');
        d3.select(window)
          .on('pointermove.compass', null)
          .on('pointerup.compass', null);
      });
  });

  // ── Triangular pole (three community conceptions) ────────────────────────
  const fifthPoleR = 6;
  const triOffsets = [0, 2 * Math.PI / 3, 4 * Math.PI / 3];
  const triColors  = ['#FFAF00', '#FFAF00', '#FFAF00'];
  // Three limit-cases of community; 'commons' placeholder on the triangle
  const triIds     = ['community', 'commons', 'communal'];

  function triXY(i) {
    const angle = fifthPoleAngle + triOffsets[i];
    return {
      x: W / 2 + (dialR + poleOffset) * Math.cos(angle),
      y: H / 2 - (dialR + poleOffset) * Math.sin(angle),
    };
  }

  const triGroup = g.append('g').attr('class', 'tri-pole');
  triIds.forEach((id, i) => {
    const { x: tx, y: ty } = triXY(i);
    triGroup.append('circle')
      .attr('class', `tri-hit-${id}`)
      .attr('cx', tx).attr('cy', ty)
      .attr('r', 16)
      .attr('fill', 'transparent')
      .style('cursor', 'grab');
    triGroup.append('circle')
      .attr('class', `tri-dot-${id}`)
      .attr('cx', tx).attr('cy', ty)
      .attr('r', fifthPoleR)
      .attr('fill', triColors[i])
      .style('pointer-events', 'none');
  });

  triGroup.on('pointerdown', function(event) {
    event.preventDefault();
    const svgRect = el.getBoundingClientRect();
    const startAngle          = Math.atan2(H / 2 - (event.clientY - svgRect.top),
                                           (event.clientX - svgRect.left) - W / 2);
    const startFifthPoleAngle = fifthPoleAngle;
    triGroup.style('cursor', 'grabbing');

    d3.select(window)
      .on('pointermove.fifthpole', function(e) {
        const px = e.clientX - svgRect.left;
        const py = e.clientY - svgRect.top;
        let delta = Math.atan2(H / 2 - py, px - W / 2) - startAngle;
        if (delta >  Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        const rawAngle = startFifthPoleAngle + delta;
        const snap     = 0.9375 * Math.PI / 180;
        const snapped  = Math.round(rawAngle / snap) * snap;
        if (snapped === fifthPoleAngle) return;
        fifthPoleAngle = snapped;
        triIds.forEach((id, i) => {
          const { x: fx, y: fy } = triXY(i);
          triGroup.select(`.tri-hit-${id}`).attr('cx', fx).attr('cy', fy);
          triGroup.select(`.tri-dot-${id}`).attr('cx', fx).attr('cy', fy);
        });
        sim.alpha(1);
        for (let j = 0; j < 300; ++j) sim.tick();
        applyPositions();
      })
      .on('pointerup.fifthpole', function() {
        triGroup.style('cursor', 'grab');
        d3.select(window)
          .on('pointermove.fifthpole', null)
          .on('pointerup.fifthpole', null);
      });
  });

  // ── Node interaction ─────────────────────────────────────────────────────
  const tooltip = document.getElementById('mapTooltip');

  node
    .on('mouseenter', function(event, d) {
      if (d.center) return;
      d3.select(this).select('circle').attr('fill', '#D62CFF').attr('r', d.derived ? 7 : 4);
      if (tooltip) {
        tooltip.textContent = d.label;
        tooltip.style.opacity = 1;
      }
    })
    .on('mousemove', function(event) {
      if (tooltip) {
        tooltip.style.left = (event.clientX + 12) + 'px';
        tooltip.style.top  = (event.clientY - 10) + 'px';
      }
    })
    .on('mouseleave', function(event, d) {
      if (d.center) return;
      d3.select(this).select('circle').attr('fill', d => nodeBaseFill(d)).attr('r', d.derived ? 6 : 3);
      if (tooltip) tooltip.style.opacity = 0;
    });

  svg.call(d3.zoom()
    .scaleExtent([0.5, 2.5])
    .on('zoom', e => g.attr('transform', e.transform)));
}

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('wordMap') && typeof TERMS !== 'undefined') {
    requestAnimationFrame(() => requestAnimationFrame(() => buildWordMap()));
  }
});
