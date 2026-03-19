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
  const BLUE    = '#5B8FD4';
  const MAP_BG  = '#0d0018';

  /* ── State ───────────────────────────────────────────────────────────────── */
  let activeTab         = 'readings';
  let activeTermId      = null;
  let activeDoxaId      = null;
  const doxaCache       = new Map();
  let hasBloomedOnce    = false; // bloom only on first load, not on resize
  let satelliteExploded = false; // persists across redraws
  let mapNode           = null;  // D3 node selection, updated by draw()
  let mapG              = null;  // root SVG <g>, updated by draw()

  /* ── HTML-escape helper (plain-text fields rendered via innerHTML) ────────── */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── DOM elements ────────────────────────────────────────────────────────── */
  const bookListEl      = document.getElementById('bookList');
  const mapViewEl       = document.getElementById('mapView');
  const detailEl        = document.getElementById('bookDetail');
  const detailContentEl = document.getElementById('bookDetailContent');
  const tabBtns         = document.querySelectorAll('.book-tab-btn');
  const doxaPanelEl     = document.getElementById('doxaPanel');
  const doxaTermEl      = document.getElementById('doxaPanelTerm');
  const doxaBodyEl      = document.getElementById('doxaPanelBody');
  const doxaCloseBtn    = document.getElementById('doxaPanelClose');

  /* ── Doxa panel ─────────────────────────────────────────────────────────── */
  function closeDoxaPanel() {
    activeDoxaId = null;
    doxaPanelEl.hidden = true;
    doxaBodyEl.innerHTML = '<p class="doxa-panel-loading">Loading\u2026</p>';
  }

  async function openDoxaPanel(d) {
    if (activeDoxaId === d.id) { closeDoxaPanel(); return; }
    activeDoxaId = d.id;
    doxaTermEl.textContent = d.label;
    doxaBodyEl.innerHTML = '<p class="doxa-panel-loading">Loading\u2026</p>';
    doxaPanelEl.hidden = false;

    const term = (d.label || d.id).toLowerCase().replace(/\s+/g, '_');
    let edges;

    if (doxaCache.has(term)) {
      edges = doxaCache.get(term);
    } else {
      try {
        const res  = await fetch('https://api.conceptnet.io/c/en/' + encodeURIComponent(term));
        const data = await res.json();
        const allowed  = new Set(['RelatedTo', 'IsA', 'HasProperty']);
        const termUri  = '/c/en/' + term;
        edges = (data.edges || [])
          .filter(e =>
            allowed.has(e.rel.label) &&
            e.start.language === 'en' &&
            e.end.language   === 'en'
          )
          .map(e => {
            const other = e.start['@id'].startsWith(termUri) ? e.end : e.start;
            return {
              rel:   e.rel.label,
              label: other.label || other['@id'].replace(/.*\//, ''),
            };
          })
          .filter(e => e.label.toLowerCase() !== term.replace(/_/g, ' '));
        doxaCache.set(term, edges);
      } catch (_) {
        if (activeDoxaId === d.id) {
          doxaBodyEl.innerHTML = '<p class="doxa-panel-error">Could not load data.</p>';
        }
        return;
      }
    }

    if (activeDoxaId !== d.id) return; // closed while fetching

    if (!edges.length) {
      doxaBodyEl.innerHTML = '<p class="doxa-panel-empty">No relations found.</p>';
      return;
    }

    const relLabels = { RelatedTo: 'Related To', IsA: 'Is A', HasProperty: 'Has Property' };
    const groups = {};
    edges.forEach(e => { (groups[e.rel] = groups[e.rel] || []).push(e.label); });

    doxaBodyEl.innerHTML = Object.entries(groups)
      .map(([rel, labels]) =>
        '<p class="doxa-panel-rel">' + (relLabels[rel] || rel) + '</p>' +
        '<ul class="doxa-panel-list">' +
          labels.slice(0, 8).map(l => '<li>' + esc(l) + '</li>').join('') +
        '</ul>'
      ).join('');
  }

  if (doxaCloseBtn) doxaCloseBtn.addEventListener('click', closeDoxaPanel);

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
        ${book.dateLabel ? `<span class="book-date">${esc(book.dateLabel)}</span>` : ''}
        <span class="book-title">${esc(book.title)}</span>
        ${book.author      ? `<span class="book-author">${esc(book.author)}</span>`      : ''}
        ${book.contributor ? `<span class="book-contributor">${esc(book.contributor)}</span>` : ''}
      </li>
    `).join('');

    bookListEl.querySelectorAll('.book-item[data-id]').forEach(item => {
      item.addEventListener('click', () => {
        const book = BOOKS.find(b => String(b.id) === item.dataset.id);
        if (book) showDetail(book);
      });

      item.addEventListener('mouseenter', () => {
        const book = BOOKS.find(b => String(b.id) === item.dataset.id);
        if (!mapNode) return;

        /* Clear any stale lines from a previous hover */
        if (mapG) mapG.selectAll('.book-tri').remove();

        if (!book || !book.terms || !book.terms.length) return;
        const termSet = new Set(book.terms);

        /* Dim all nodes, highlight matched ones */
        mapNode.select('circle')
          .attr('opacity', d => termSet.has(d.id) ? 1 : 0.15);
        mapNode.filter(d => termSet.has(d.id)).select('circle')
          .attr('fill', MAGENTA)
          .attr('r', NODE_R);

        /* Draw constellation lines between matched nodes */
        if (mapG) {
          const matched = [];
          mapNode.each(d => { if (termSet.has(d.id)) matched.push(d); });
          if (matched.length > 1) {
            const triG = mapG.append('g').attr('class', 'book-tri');
            for (let a = 0; a < matched.length; a++) {
              for (let b = a + 1; b < matched.length; b++) {
                triG.append('line')
                  .attr('x1', matched[a].x).attr('y1', matched[a].y)
                  .attr('x2', matched[b].x).attr('y2', matched[b].y)
                  .attr('stroke', YELLOW)
                  .attr('stroke-width', 0.75)
                  .attr('stroke-dasharray', '3 3')
                  .attr('opacity', 0.7)
                  .style('pointer-events', 'none');
              }
            }
          }
        }
      });

      item.addEventListener('mouseleave', () => {
        if (!mapNode) return;
        mapNode.select('circle')
          .attr('opacity', 1)
          .attr('fill', d => nodeFill(d))
          .attr('r', NODE_R);
        if (mapG) mapG.selectAll('.book-tri').remove();
      });
    });
  }

  /* ── Book detail close button ────────────────────────────────────────────── */
  const closeBtn = document.getElementById('bookDetailClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      detailEl.classList.remove('slid-open');
      setTimeout(() => { detailEl.scrollTop = 0; }, 820);
    });
  }

  /* ── Book detail ─────────────────────────────────────────────────────────── */
  function showDetail(book) {
    const isWorkshop = book.type === 'workshop';

    // Date meta line
    let dateStr;
    if (isWorkshop) {
      const dateParts = [
        book.dateLabel  ? esc(book.dateLabel).charAt(0)  + esc(book.dateLabel).slice(1).toLowerCase()  : '',
        book.customTime ? esc(book.customTime) : '',
        book.location   ? esc(book.location)   : '',
      ].filter(Boolean);
      dateStr = dateParts.join(' · ');
    } else {
      dateStr = book.dateLabel
        ? 'Reading began ' + esc(book.dateLabel).charAt(0) + esc(book.dateLabel).slice(1).toLowerCase()
        : '';
    }

    // Note block — readings get two-col layout with flyer; workshops get cover image + note
    const flyerCol = `<div class="detail-flyer">
      ${book.flyerUrl
        ? `<img src="${book.flyerUrl}" alt="${esc(book.title)} flyer">`
        : `<div class="detail-flyer-placeholder">Flyer Pending</div>`}
      ${book.flyerBy ? `<p class="detail-flyer-by">Design by ${esc(book.flyerBy)}</p>` : ''}
    </div>`;

    const coverCol = isWorkshop && book.coverUrl
      ? `<div class="detail-flyer"><img src="${book.coverUrl}" alt="${esc(book.title)}"></div>`
      : '';

    const topCols = isWorkshop
      ? `<div class="detail-top-cols">
          ${coverCol}
          <div class="detail-note">${book.note || ''}</div>
        </div>`
      : `<div class="detail-top-cols">
          ${flyerCol}
          <div class="detail-note">${book.note || ''}</div>
        </div>`;

    const openingBlock = book.blurb ? `
      <hr class="dotted-divider">
      <p class="detail-section-label">${isWorkshop ? 'About Our Guest(s)' : 'Opening Remarks'}</p>
      <div class="detail-blurb">${book.blurb}</div>
      ${book.nominatedBy ? `<p class="detail-section-credit">— ${esc(book.nominatedBy)}</p>` : ''}` : '';

    // Supplementary resources
    const linksBlock = (book.links && book.links.length) ? `
      <hr class="dotted-divider">
      <p class="detail-section-label">Supplementary Resources</p>
      <ul class="detail-links-list detail-links">
        ${book.links.map(l => `<li><a href="${l.url}" target="_blank" rel="noopener">${esc(l.description)}</a></li>`).join('')}
      </ul>` : '';

    // Interlocutors
    const interlocutorsBlock = (book.interlocutors && book.interlocutors.length) ? `
      <hr class="dotted-divider">
      <p class="detail-section-label">Interlocutors</p>
      <ul class="detail-interlocutors-list detail-interlocutors">
        ${book.interlocutors.map(i => i.url
          ? `<li><a href="${i.url}" target="_blank" rel="noopener">${esc(i.name)}</a></li>`
          : `<li>${esc(i.name)}</li>`
        ).join('')}
      </ul>` : '';

    // Bottom action button — always last
    const bottomBlock = isWorkshop
      ? (book.link ? `
          <div class="detail-annotations">
            <a href="${book.link}" target="_blank" rel="noopener" class="button-outline">Link to Reading →</a>
          </div>` : '')
      : `
          <div class="detail-annotations">
            ${book.bookstackUrl
              ? `<a href="${book.bookstackUrl}" target="_blank" rel="noopener" class="button-outline">View Annotations →</a>`
              : `<span class="button-outline button-outline--disabled">View Annotations →</span>`}
          </div>`;

    const titleHtml = book.subtitle
      ? `${esc(book.title)}: ${esc(book.subtitle)}`
      : esc(book.title);

    detailContentEl.innerHTML = `
      <h2 class="detail-title">${titleHtml}</h2>
      <p class="detail-author">${esc(book.author)}</p>
      ${book.contributor ? `<p class="detail-author">${esc(book.contributor)}</p>` : ''}
      ${dateStr ? `<p class="detail-meta">${dateStr}</p>` : ''}
      <hr class="dotted-divider">
      ${topCols}
      ${openingBlock}
      ${linksBlock}
      ${interlocutorsBlock}
      ${bottomBlock}
    `;

    detailEl.scrollTop = 0;
    detailEl.classList.add('slid-open');
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SEMANTIC NETWORK MAP
  ══════════════════════════════════════════════════════════════════════════ */

  function buildMap() {
    const svgEl = document.getElementById('wordMap');
    if (!svgEl) return;

    const svg = d3.select(svgEl);

    /* ── Node fill + stroke — driven by core field and node type ────────── */
    const NODE_R = 3;
    function nodeFill(d) {
      if (d.center)  return '#000000';
      return d.core === 'filled' ? '#ffffff' : 'none';
    }
    function nodeStroke(d) {
      if (d.center)  return 'rgba(255,255,255,0.35)';
      if (d.derived) return BLUE;
      return MAGENTA;
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

      if (!TERMS.length) return; /* No terms yet — skip D3 initialisation */

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
      mapG = g;

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
        .attr('stroke',       d => d.target.derived ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0)')
        .attr('stroke-width', 1.5);

      /* ── Nodes ───────────────────────────────────────────────────────── */
      const node = g.append('g')
        .selectAll('g').data(nodes).join('g')
        .style('cursor', 'pointer');
      mapNode = node;

      /* Main circle — center node larger; all others uniform */
      node.append('circle')
        .attr('r',            d => d.center ? 9 : NODE_R)
        .attr('fill',         d => nodeFill(d))
        .attr('stroke',       d => nodeStroke(d))
        .attr('stroke-width', 1.5);

      /* Event horizon rings — center node only */
      const centerG = node.filter(d => d.center);
      [
        { r: 12, opacity: 0.38, width: 1    },
        { r: 14, opacity: 0.30, width: 0.9  },
        { r: 16, opacity: 0.23, width: 0.85 },
        { r: 18, opacity: 0.17, width: 0.75 },
        { r: 20, opacity: 0.13, width: 0.7  },
        { r: 22, opacity: 0.09, width: 0.6  },
        { r: 24, opacity: 0.06, width: 0.55 },
        { r: 26, opacity: 0.04, width: 0.45 },
        { r: 28, opacity: 0.02, width: 0.35 },
        { r: 30, opacity: 0.01, width: 0.25 },
      ].forEach(ring => {
        centerG.append('circle')
          .attr('r', ring.r)
          .attr('fill', 'none')
          .attr('stroke', 'white')
          .attr('stroke-width', ring.width)
          .attr('opacity', ring.opacity)
          .style('pointer-events', 'none');
      });

      /* Amber halo — doxa nodes (including Commons if doxa=true) */
      node.filter(d => d.doxa && !d.center)
        .append('circle')
        .attr('r', NODE_R + 5)
        .attr('fill', 'none')
        .attr('stroke', YELLOW)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.5);

      /* Labels */
      node.append('text')
        .text(d => d.label)
        .attr('x', d => d.center ? -50 : 10)
        .attr('y', d => d.center ? -14 : 4)
        .style('font-size',   d => d.center ? '0.8rem' : '0.65rem')
        .style('font-family', '"triptych-roman", Georgia, serif')
        .attr('text-anchor',  d => d.center ? 'middle' : 'start')
        .attr('fill',         d => d.center ? 'rgba(255,255,255,0.65)' : d.derived ? 'rgba(91,143,212,0.9)' : MAGENTA)
        .style('letter-spacing', '0.03em')
        .style('pointer-events', 'none');

      /* ── Settle simulation + bloom animation ────────────────────────── */
      sim.stop();
      for (let i = 0; i < 300; ++i) sim.tick();

      /* Stash final positions */
      nodes.forEach(d => { d.finalX = d.x; d.finalY = d.y; });

      function applyPositions() {
        link
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        node.attr('transform', d => `translate(${d.x},${d.y})`);
      }

      if (!hasBloomedOnce) {
        /* First load: reset to centre, bloom out */
        nodes.forEach(d => { d.x = W / 2; d.y = H / 2; });
        applyPositions();

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
        setTimeout(() => {
          hasBloomedOnce = true;
          nodes.forEach(d => { d.x = d.finalX; d.y = d.finalY; });
        }, BLOOM_DUR + 200);
      } else {
        /* Resize: jump straight to settled positions, no animation */
        nodes.forEach(d => { d.x = d.finalX; d.y = d.finalY; });
        applyPositions();
      }

      /* Legend is now an HTML panel (#legendPanel) positioned bottom-left
         of main.readings — see readings.php and global.css */

      /* ── Satellite 🛰️ — orbits just outside the dial ring ───────────── */
      if (!satelliteExploded) {
        const orbitR   = dialR + poleOffset + 30;
        const satGroup = g.append('g')
          .attr('transform', `translate(${W / 2},${H / 2})`);
        const satSpin  = satGroup.append('g').attr('class', 'satellite-spin');
        const satText  = satSpin.append('text')
          .attr('x', orbitR).attr('y', 0)
          .attr('dominant-baseline', 'middle')
          .attr('text-anchor', 'middle')
          .style('font-size', '1rem')
          .style('cursor', 'pointer')
          .style('user-select', 'none')
          .text('🛰️');

        satText.on('click', function (event) {
          event.stopPropagation();
          satelliteExploded = true;

          // Freeze the CSS animation at its current position before removing the class
          const frozenTransform = getComputedStyle(satSpin.node()).transform;
          satSpin.style('transform', frozenTransform);
          satSpin.classed('satellite-spin', false);

          // Explode in place — no coordinate conversion needed
          satText.text('💥');
          setTimeout(() => {
            satText.transition().duration(400).style('opacity', 0)
              .on('end', () => satGroup.remove());
          }, 200);
        });
      }

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
      const triIds     = ['community', 'commons', 'communism'];

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
            .attr('r', NODE_R);
        })
        .on('mouseleave', function (event, d) {
          if (d.center) return;
          renderBookList(null);
          d3.select(this).select('circle')
            .attr('fill', nodeFill(d))
            .attr('r', NODE_R);
        });

      /* ── Doxa node click → ConceptNet panel ─────────────────────────── */
      node.filter(d => d.doxa && !d.center)
        .on('click', function (event, d) {
          event.stopPropagation();
          openDoxaPanel(d);
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
  if (window.innerWidth > 440) buildMap(); // skip D3 on mobile

})();
