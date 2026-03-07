/* ═══════════════════════════════════════════════════════════════════════════
   CRG READINGS — Community Semantic Network
   ─────────────────────────────────────────────────────────────────────────
   ARCHITECTURE
   ────────────────────────────────────────────────────────────────────────
   D3 force simulation with two custom forces:

   angular — pulls each term toward its target angle.
     Regular terms: angle = atan2(cohesion, valence) + compassRotation
     Derived terms: angle = fifthPoleAngle + 120°-offset (triangle clock hands)

   temporal — centripetal terms attract nearby nodes; centrifugal repel.

   OUTER DIAL (compass rose)
     Dragging the dial ring rotates compassRotation, re-seeds node positions,
     runs 300 synchronous ticks, and visually rotates the dial group.

   TRIANGLE (fifthPoleAngle)
     Three FFAF00 circles at dialR + poleOffset, 120° apart. Dragging any
     circle updates fifthPoleAngle, re-seeds derived nodes, runs 300 ticks.

   CATEGORY RADII
     instinctual = 120·scale  |  social = 250·scale  |  structural = 335·scale
     scale = dialR / 378 (baseline design radius)
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const TERMS = window.CRG_TERMS || [];
  const BOOKS = window.CRG_BOOKS || [];

  /* ── Colours ─────────────────────────────────────────────────────────────── */
  const MAGENTA = '#D62CFF';
  const YELLOW  = '#FFAF00';
  const MAP_BG  = '#0d0018';

  /* ── State ───────────────────────────────────────────────────────────────── */
  let activeTab    = 'readings';
  let activeTermId = null;

  /* ── DOM elements ────────────────────────────────────────────────────────── */
  const bookListEl      = document.getElementById('bookList');
  const mapViewEl       = document.getElementById('mapView');
  const detailEl        = document.getElementById('bookDetail');
  const detailContentEl = document.getElementById('bookDetailContent');
  const tabBtns         = document.querySelectorAll('.book-tab-btn');

  /* ── Tabs ────────────────────────────────────────────────────────────────── */
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === activeTab) return;
      activeTab = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab));
      renderBookList(activeTermId);
    });
  });

  /* ── Book list ───────────────────────────────────────────────────────────── */
  const workshopIntroEl  = document.getElementById('workshopIntro');
  const bookListSubheadEl = document.getElementById('bookListSubhead');

  function renderBookList(termId) {
    activeTermId = termId;
    const typeFilter = activeTab === 'workshops' ? 'workshop' : 'reading';
    let filtered = BOOKS.filter(b => b.type === typeFilter);
    if (termId) filtered = filtered.filter(b => b.terms && b.terms.includes(termId));

    // Workshop intro — show only on workshops tab with no term filter
    const intro = window.CRG_WORKSHOP_INTRO || '';
    if (activeTab === 'workshops' && !termId && intro) {
      workshopIntroEl.innerHTML = intro;
      workshopIntroEl.hidden = false;
    } else {
      workshopIntroEl.hidden = true;
    }

    // "Past Workshops" subheader — show on workshops tab only
    if (activeTab === 'workshops') {
      bookListSubheadEl.textContent = 'Past Workshops';
      bookListSubheadEl.hidden = false;
    } else {
      bookListSubheadEl.hidden = true;
    }

    if (!filtered.length) {
      bookListEl.innerHTML = '<li class="book-item book-item--empty">No entries found.</li>';
      return;
    }

    bookListEl.innerHTML = filtered.map(book => `
      <li class="book-item" data-id="${book.id}">
        ${book.dateLabel ? `<span class="book-date">${book.dateLabel}</span>` : ''}
        <span class="book-title">${book.title}</span>
        ${book.author     ? `<span class="book-author">${book.author}</span>`      : ''}
        ${book.contributor ? `<span class="book-contributor">${book.contributor}</span>` : ''}
      </li>
    `).join('');

    bookListEl.querySelectorAll('.book-item[data-id]').forEach(item => {
      item.addEventListener('click', () => {
        const book = BOOKS.find(b => String(b.id) === item.dataset.id);
        if (book) showDetail(book);
      });
    });
  }

  /* ── Book detail ─────────────────────────────────────────────────────────── */
  function showDetail(book) {
    const isWorkshop = book.type === 'workshop';

    // Date meta line
    let dateStr;
    if (isWorkshop) {
      const dateParts = [
        book.dateLabel ? book.dateLabel.charAt(0) + book.dateLabel.slice(1).toLowerCase() : '',
        book.customTime || '',
        book.location   || '',
      ].filter(Boolean);
      dateStr = dateParts.join(' · ');
    } else {
      dateStr = book.dateLabel
        ? 'Reading began ' + book.dateLabel.charAt(0) + book.dateLabel.slice(1).toLowerCase()
        : '';
    }

    // Note block — readings get two-col layout with flyer; workshops get note only
    const topCols = isWorkshop
      ? `<div class="detail-note">${book.note || ''}</div>`
      : `<div class="detail-top-cols">
          <div class="detail-note">${book.note || ''}</div>
          <div class="detail-flyer-placeholder">Flyer Pending</div>
        </div>`;

    const openingBlock = book.blurb ? `
      <hr class="dotted-divider">
      <p class="detail-section-label">Opening Remarks</p>
      <div class="detail-blurb">${book.blurb}</div>` : '';

    // Bottom action button
    const bottomBlock = isWorkshop
      ? (book.link ? `
          <div class="detail-annotations">
            <a href="${book.link}" target="_blank" rel="noopener" class="button-outline">Workshop Materials →</a>
          </div>` : '')
      : (book.bookstackUrl ? `
          <div class="detail-annotations">
            <a href="${book.bookstackUrl}" target="_blank" rel="noopener" class="button-outline">View Annotations →</a>
            <span class="detail-members-note">Members only · login required</span>
          </div>` : '');

    detailContentEl.innerHTML = `
      <a href="#" id="backToMap" class="back-link uppercase">← Back to Readings</a>
      <h2 class="detail-title">${book.title}</h2>
      <p class="detail-author">${book.author || ''}</p>
      ${book.contributor ? `<p class="detail-author">${book.contributor}</p>` : ''}
      ${dateStr ? `<p class="detail-meta">${dateStr}</p>` : ''}
      <hr class="dotted-divider">
      ${topCols}
      ${openingBlock}
      ${bottomBlock}
    `;

    detailContentEl.querySelector('#backToMap').addEventListener('click', e => {
      e.preventDefault();
      detailEl.hidden  = true;
      mapViewEl.hidden = false;
      detailEl.scrollTop = 0;
    });

    mapViewEl.hidden = true;
    detailEl.hidden  = false;
    detailEl.scrollTop = 0;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SEMANTIC NETWORK MAP
  ══════════════════════════════════════════════════════════════════════════ */

  function buildMap() {
    const svgEl = document.getElementById('wordMap');
    if (!svgEl) return;

    const svg = d3.select(svgEl);

    /* ── Node base fill — driven by temporal class ───────────────────────── */
    function nodeBaseFill(d) {
      if (d.center)                       return 'rgba(255,255,255,0.12)';
      if (d.temporal === 'centrifugal')   return 'rgba(255,255,255,0.9)';
      if (d.temporal === 'centripetal')   return 'none';
      if (d.temporal === 'neutral')       return 'rgba(255,210,0,1)';
      return 'rgba(255,255,255,0.5)';
    }

    /* ══════════════════════════════════════════════════════════════════════
       DRAW  — called once on init; rebuilds completely on resize
    ══════════════════════════════════════════════════════════════════════ */
    function draw() {
      const wrap = svgEl.parentElement;
      const rect = wrap.getBoundingClientRect();
      const W    = Math.round(rect.width);
      const H    = Math.round(rect.height);

      /* Container hasn't settled yet — retry next frame */
      if (W < 50 || H < 50) {
        requestAnimationFrame(draw);
        return;
      }

      svg.attr('width', W).attr('height', H);
      svg.selectAll('*').remove();

      /* ── Scale + category radii ─────────────────────────────────────── */
      const poleSymbolMargin = 52;
      const dialR  = Math.floor(Math.min(W / 2, H / 2) - poleSymbolMargin);
      const scale  = dialR / 378;
      const categoryRadius = {
        'instinctual': Math.round(120 * scale),
        'social':      Math.round(250 * scale),
        'structural':  Math.round(335 * scale),
      };

      /* ── Node initialisation ────────────────────────────────────────── */
      /* angle = atan2(cohesion, valence) maps axes onto compass:
           East  (+valence) → Rapture     North (–SVG y, +cohesion) → Harmony
           West  (–valence) → Rupture     South (+SVG y, –cohesion) → Dissonance  */
      const nodes = TERMS.map(t => {
        const r     = t.center ? 0 : (categoryRadius[t.category] || categoryRadius['social']);
        const angle = (t.center || (t.valence == null && t.cohesion == null))
          ? 0
          : Math.atan2(t.cohesion || 0, t.valence || 0);
        return {
          ...t,
          x:  W / 2 + r * Math.cos(angle),
          y:  H / 2 - r * Math.sin(angle), // –sin: integrating pole at top
          fx: t.center ? W / 2 : null,
          fy: t.center ? H / 2 : null,
        };
      });

      const centerNode = TERMS.find(t => t.center);
      const links = TERMS
        .filter(t => !t.center)
        .map(t => ({ source: centerNode ? centerNode.id : '', target: t.id }));

      /* ── Rotation state ──────────────────────────────────────────────── */
      let compassRotation = 0;           // radians; updated by rotateCompass()
      let fifthPoleAngle  = Math.PI / 4; // radians; independent of compassRotation

      /* ── Force simulation ───────────────────────────────────────────── */
      const sim = d3.forceSimulation(nodes)
        .force('link',      d3.forceLink(links).id(d => d.id).distance(110).strength(0.05))
        .force('charge',    d3.forceManyBody().strength(-120))
        .force('center',    d3.forceCenter(W / 2, H / 2))
        .force('collision', d3.forceCollide(40))
        .force('radial',    d3.forceRadial(
          d => d.center ? 0 : (categoryRadius[d.category] || categoryRadius['social']),
          W / 2, H / 2
        ).strength(0.9))

        /* Angular — pulls each term toward its editorial angle */
        .force('angular', function (alpha) {
          nodes.forEach(d => {
            if (d.center || d.valence == null) return;
            const targetAngle = d.derived
              ? (d.id === 'community' ? fifthPoleAngle
               : d.id === 'commons'   ? fifthPoleAngle + 2 * Math.PI / 3
               :                        fifthPoleAngle + 4 * Math.PI / 3)
              : Math.atan2(d.cohesion || 0, d.valence || 0) + compassRotation;
            const r       = categoryRadius[d.category] || categoryRadius['social'];
            const targetX = W / 2 + r * Math.cos(targetAngle);
            const targetY = H / 2 - r * Math.sin(targetAngle);
            const strength = r <= categoryRadius['instinctual'] ? 0.8
                           : r <= categoryRadius['social']      ? 0.6 : 0.45;
            d.vx += (targetX - d.x) * strength * alpha;
            d.vy += (targetY - d.y) * strength * alpha;
          });
        })

        /* Temporal — centripetal attract nearby; centrifugal repel */
        .force('temporal', function (alpha) {
          nodes.forEach(ni => {
            if (ni.center || !ni.temporal || ni.temporal === 'neutral') return;
            nodes.forEach(nj => {
              if (ni === nj || nj.center) return;
              const dx   = nj.x - ni.x;
              const dy   = nj.y - ni.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              if (dist > 180) return;
              const strength = ni.temporal === 'centripetal' ? -4 : 4;
              const f = (strength / (dist * dist)) * alpha;
              nj.vx += dx * f;
              nj.vy += dy * f;
            });
          });
        });

      /* ── SVG structure ───────────────────────────────────────────────── */

      /* Background */
      svg.append('rect').attr('width', W).attr('height', H).attr('fill', MAP_BG);

      /* Network label — fixed (not inside zoom group) */
      svg.append('text')
        .attr('x', 16).attr('y', 22)
        .attr('fill', 'rgba(255,255,255,0.28)')
        .style('font-family', '"triptych", sans-serif')
        .style('font-size', '0.57rem')
        .style('letter-spacing', '0.14em')
        .style('pointer-events', 'none')
        .text('COMMUNITY SEMANTIC NETWORK — VERSION 1.0');

      /* Radial gradient (magenta glow at centre) */
      const defs     = svg.append('defs');
      const gradient = defs.append('radialGradient')
        .attr('id', 'wordMapGradient')
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('cx', W / 2).attr('cy', H / 2).attr('r', 370);
      gradient.append('stop').attr('offset', '0%')
        .attr('stop-color', MAGENTA).attr('stop-opacity', 0.12);
      gradient.append('stop').attr('offset', '100%')
        .attr('stop-color', MAGENTA).attr('stop-opacity', 0);

      /* Root group (receives d3.zoom transform) */
      const g = svg.append('g');

      g.append('circle')
        .attr('cx', W / 2).attr('cy', H / 2).attr('r', 420)
        .attr('fill', 'url(#wordMapGradient)');

      /* ── Outer dial ring ────────────────────────────────────────────── */
      const dialGroup = g.append('g').attr('class', 'dial-ring');

      dialGroup.append('circle')
        .attr('cx', W / 2).attr('cy', H / 2).attr('r', dialR)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255,255,255,0.5)')
        .attr('stroke-width', 1)
        .attr('opacity', 0.85);

      /* 360 graduated tick marks — 5-level hierarchy */
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
          .attr('stroke',       `rgba(255,255,255,${op})`)
          .attr('stroke-width', sw);
      }

      /* Cardinal pole symbols — pure SVG paths with fill-rule=evenodd */
      const poleOffset = 16;
      const poleR      = 8;
      const poleFill   = 'rgba(255,255,255,0.85)';

      /* ● Rapture (East): solid filled circle */
      dialGroup.append('circle')
        .attr('cx', W / 2 + dialR + poleOffset).attr('cy', H / 2)
        .attr('r', poleR).attr('fill', poleFill);

      /* ○ Rupture (West): open ring */
      dialGroup.append('circle')
        .attr('cx', W / 2 - dialR - poleOffset).attr('cy', H / 2)
        .attr('r', poleR).attr('fill', 'none')
        .attr('stroke', poleFill).attr('stroke-width', 1.5);

      /* ⊕ Harmony (North) and ⊖ Dissonance (South) — circle + cutout */
      const circP       = `M ${poleR},0 A ${poleR},${poleR} 0 1,0 -${poleR},0 A ${poleR},${poleR} 0 1,0 ${poleR},0 Z`;
      const plusCutout  = `M -1,-6 L 1,-6 L 1,-1 L 6,-1 L 6,1 L 1,1 L 1,6 L -1,6 L -1,1 L -6,1 L -6,-1 L -1,-1 Z`;
      const minusCutout = `M -6,-1 L 6,-1 L 6,1 L -6,1 Z`;
      [
        { x: W / 2, y: H / 2 - dialR - poleOffset, d: `${circP} ${plusCutout}`  },
        { x: W / 2, y: H / 2 + dialR + poleOffset, d: `${circP} ${minusCutout}` },
      ].forEach(p => {
        dialGroup.append('path')
          .attr('transform', `translate(${p.x},${p.y})`)
          .attr('d', p.d)
          .attr('fill', poleFill)
          .attr('fill-rule', 'evenodd');
      });

      /* ── Orbital rings (category radii) ─────────────────────────────── */
      const ringGroup = g.append('g');
      Object.values(categoryRadius).forEach(r => {
        ringGroup.append('circle')
          .attr('cx', W / 2).attr('cy', H / 2).attr('r', r)
          .attr('fill', 'none')
          .attr('stroke', 'rgba(255,255,255,0.3)')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '5,4')
          .attr('opacity', 0.75);
      });

      /* ── Links (spokes from centre) ─────────────────────────────────── */
      const link = g.append('g')
        .selectAll('line').data(links).join('line')
        .attr('stroke',       d => d.target.derived ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)')
        .attr('stroke-width', d => d.target.derived ? 1.5 : 1);

      /* ── Nodes ───────────────────────────────────────────────────────── */
      const node = g.append('g')
        .selectAll('g').data(nodes).join('g')
        .style('cursor', 'pointer');

      /* Main circle */
      node.append('circle')
        .attr('r',            d => d.center ? 10 : d.derived ? 6 : 3)
        .attr('fill',         d => nodeBaseFill(d))
        .attr('stroke',       d => d.center ? 'rgba(255,255,255,0.3)' : d.derived ? 'rgba(255,255,255,0.6)' : MAGENTA)
        .attr('stroke-width', d => d.center ? 1 : d.derived ? 2 : 1.5);

      /* Dashed halo — derived nodes only */
      node.filter(d => d.derived)
        .append('circle')
        .attr('r', 10)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255,255,255,0.4)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2')
        .attr('opacity', 0.5);

      /* Outer ring — doxa (Type 1) nodes */
      node.filter(d => d.doxa && !d.center)
        .append('circle')
        .attr('r', 9)
        .attr('fill', 'none')
        .attr('stroke', YELLOW)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.5);

      /* Labels */
      node.append('text')
        .text(d => d.label)
        .attr('x', d => d.center ? -50 : 10)
        .attr('y', d => d.center ? -14 : 4)
        .style('font-size',   d => d.center ? '0.95rem' : '0.8rem')
        .style('font-family', '"triptych-roman", Georgia, serif')
        .attr('text-anchor',  d => d.center ? 'middle' : 'start')
        .attr('fill',         d => d.center ? 'rgba(255,255,255,0.65)' : d.derived ? 'rgba(214,44,255,0.9)' : MAGENTA)
        .style('letter-spacing', '0.03em')
        .style('pointer-events', 'none');

      /* ── Settle simulation + bloom animation ────────────────────────── */
      sim.stop();
      for (let i = 0; i < 300; ++i) sim.tick();

      /* Stash final positions; reset all to centre for bloom start */
      nodes.forEach(d => { d.finalX = d.x; d.finalY = d.y; d.x = W / 2; d.y = H / 2; });

      function applyPositions() {
        link
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        node.attr('transform', d => `translate(${d.x},${d.y})`);
      }
      applyPositions();

      /* Bloom: animate from centre to settled positions over 1200ms */
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

      /* ── Legend (bottom-right, two columns) ─────────────────────────── */
      const legR     = 6;
      const legBotY  = H - 30;
      const legRowH  = 20;
      const legFill  = 'rgba(255,255,255,0.75)';
      const legGroup = g.append('g');

      const legCircP  = `M ${legR},0 A ${legR},${legR} 0 1,0 -${legR},0 A ${legR},${legR} 0 1,0 ${legR},0 Z`;
      const legPlusC  = `M -1,-4 L 1,-4 L 1,-1 L 4,-1 L 4,1 L 1,1 L 1,4 L -1,4 L -1,1 L -4,1 L -4,-1 L -1,-1 Z`;
      const legMinusC = `M -4,-1 L 4,-1 L 4,1 L -4,1 Z`;

      [
        {
          x: W - 220,
          items: [
            { draw: r => r.append('circle').attr('r', legR).attr('fill', legFill),                                                             label: 'Rapture'     },
            { draw: r => r.append('circle').attr('r', legR).attr('fill', 'none').attr('stroke', legFill).attr('stroke-width', 1.5),            label: 'Rupture'     },
          ],
        },
        {
          x: W - 110,
          items: [
            { draw: r => r.append('path').attr('d', `${legCircP} ${legPlusC}` ).attr('fill', legFill).attr('fill-rule', 'evenodd'),            label: 'Harmony'     },
            { draw: r => r.append('path').attr('d', `${legCircP} ${legMinusC}`).attr('fill', legFill).attr('fill-rule', 'evenodd'),            label: 'Dissonance'  },
          ],
        },
      ].forEach(col => {
        col.items.forEach((item, i) => {
          const y   = legBotY - (col.items.length - 1 - i) * legRowH;
          const row = legGroup.append('g').attr('transform', `translate(${col.x},${y})`);
          item.draw(row);
          row.append('text')
            .attr('x', 14).attr('y', 0)
            .attr('dominant-baseline', 'middle')
            .style('font-size',   '0.7rem')
            .style('font-family', '"triptych-roman", Georgia, serif')
            .style('letter-spacing', '0.05em')
            .attr('fill', 'rgba(255,255,255,0.55)')
            .text(item.label);
        });
      });

      /* ══════════════════════════════════════════════════════════════════
         COMPASS ROTATION
      ══════════════════════════════════════════════════════════════════ */

      /* rotateCompass(deg): re-seeds node positions, runs 300 ticks, repaints */
      function rotateCompass(deg) {
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
      }

      /* Wide transparent stroke on dial ring = drag hit area */
      dialGroup.append('circle')
        .attr('cx', W / 2).attr('cy', H / 2).attr('r', dialR)
        .attr('fill', 'none')
        .attr('stroke', 'transparent')
        .attr('stroke-width', 40)
        .style('cursor', 'grab');

      let dragStartAngle    = null;
      let dragStartRotation = null;

      dialGroup.on('pointerdown', function (event) {
        event.preventDefault();
        const svgRect = svgEl.getBoundingClientRect();
        const px = event.clientX - svgRect.left;
        const py = event.clientY - svgRect.top;
        /* SVG y-down convention — note: NOT negated */
        dragStartAngle    = Math.atan2(py - H / 2, px - W / 2);
        dragStartRotation = compassRotation;
        dialGroup.style('cursor', 'grabbing');

        d3.select(window)
          .on('pointermove.compass', function (e) {
            const px2 = e.clientX - svgRect.left;
            const py2 = e.clientY - svgRect.top;
            let delta = Math.atan2(py2 - H / 2, px2 - W / 2) - dragStartAngle;
            /* Wrap to [–π, π] */
            if (delta >  Math.PI) delta -= 2 * Math.PI;
            if (delta < -Math.PI) delta += 2 * Math.PI;
            rotateCompass((dragStartRotation + delta) * 180 / Math.PI);
          })
          .on('pointerup.compass', function () {
            dragStartAngle    = null;
            dragStartRotation = null;
            dialGroup.style('cursor', 'grab');
            d3.select(window)
              .on('pointermove.compass', null)
              .on('pointerup.compass',   null);
          });
      });

      /* ══════════════════════════════════════════════════════════════════
         TRIANGLE (fifthPole) — three clock-hand circles for derived nodes
      ══════════════════════════════════════════════════════════════════ */

      const fifthPoleR = 6;
      const triOffsets = [0, 2 * Math.PI / 3, 4 * Math.PI / 3];
      const triIds     = ['community', 'commons', 'communal'];

      function triXY(i) {
        const angle = fifthPoleAngle + triOffsets[i];
        return {
          /* Standard math y-up convention (note: –sin puts 0° at top-right) */
          x: W / 2 + (dialR + poleOffset) * Math.cos(angle),
          y: H / 2 - (dialR + poleOffset) * Math.sin(angle),
        };
      }

      const triGroup = g.append('g').attr('class', 'tri-pole');

      triIds.forEach((id, i) => {
        const { x: tx, y: ty } = triXY(i);

        /* Large transparent hit area */
        triGroup.append('circle')
          .attr('class', `tri-hit-${id}`)
          .attr('cx', tx).attr('cy', ty)
          .attr('r', 16)
          .attr('fill', 'transparent')
          .style('cursor', 'grab');

        /* Visible warm circle */
        triGroup.append('circle')
          .attr('class', `tri-dot-${id}`)
          .attr('cx', tx).attr('cy', ty)
          .attr('r', fifthPoleR)
          .attr('fill', YELLOW)
          .style('pointer-events', 'none');
      });

      triGroup.on('pointerdown', function (event) {
        event.preventDefault();
        const svgRect = svgEl.getBoundingClientRect();
        /* Triangle drag uses standard math y-up (opposite of compass drag) */
        const startAngle          = Math.atan2(H / 2 - (event.clientY - svgRect.top),
                                               (event.clientX - svgRect.left) - W / 2);
        const startFifthPoleAngle = fifthPoleAngle;
        triGroup.style('cursor', 'grabbing');

        d3.select(window)
          .on('pointermove.fifthpole', function (e) {
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

            /* Reposition triangle circles */
            triIds.forEach((id, i) => {
              const { x: fx, y: fy } = triXY(i);
              triGroup.select(`.tri-hit-${id}`).attr('cx', fx).attr('cy', fy);
              triGroup.select(`.tri-dot-${id}`).attr('cx', fx).attr('cy', fy);
            });

            /* Re-run simulation so derived nodes follow the triangle */
            sim.alpha(1);
            for (let j = 0; j < 300; ++j) sim.tick();
            applyPositions();
          })
          .on('pointerup.fifthpole', function () {
            triGroup.style('cursor', 'grab');
            d3.select(window)
              .on('pointermove.fifthpole', null)
              .on('pointerup.fifthpole',   null);
          });
      });

      /* ── Node hover: filter book list ───────────────────────────────── */
      node
        .on('mouseenter', function (event, d) {
          if (d.center) return;
          renderBookList(d.id);
          d3.select(this).select('circle')
            .attr('fill', MAGENTA)
            .attr('r', d.derived ? 7 : 4);
        })
        .on('mouseleave', function (event, d) {
          if (d.center) return;
          renderBookList(null);
          d3.select(this).select('circle')
            .attr('fill', nodeBaseFill(d))
            .attr('r', d.derived ? 6 : 3);
        });

      /* ── Zoom ────────────────────────────────────────────────────────── */
      svg.call(
        d3.zoom()
          .scaleExtent([0.5, 2.5])
          .on('zoom', e => g.attr('transform', e.transform))
      );
    }

    /* ── Initial draw ────────────────────────────────────────────────── */
    draw();

    /* ── Responsive resize — rebuild entirely on size change ─────────── */
    let resizeTimer;
    new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(draw, 80);
    }).observe(svgEl.parentElement);
  }

  /* ── Init ────────────────────────────────────────────────────────────────── */
  renderBookList(null);
  buildMap();

})();
