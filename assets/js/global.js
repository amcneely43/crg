document.addEventListener('DOMContentLoaded', () => {
  toggleInfo();
  mobileNav();
  initAbout();               // safe ABOUT init (guards against missing nodes)
  hoverReveal('.book-title'); // hover preview
});

/* ------- UI: Info panel ------- */
function toggleInfo() {
  const info = document.querySelector('.info');
  const openbtn = document.getElementById('info');
  const mainPanel = document.body;
  if (!info || !openbtn) return;

  openbtn.onclick = function (e) {
    e.preventDefault(); // <-- FIXED
    openbtn.classList.toggle('active');
    info.classList.toggle('slid-open');
    mainPanel.classList.toggle('overlay');
  };

  const closebtn = document.getElementById('slide_close');
  if (!closebtn) return;
  closebtn.onclick = function (e) {
    e.preventDefault(); // <-- FIXED
    openbtn.classList.remove('active');
    info.classList.remove('slid-open');
    mainPanel.classList.remove('overlay');
  };
}

/* ------- UI: Mobile nav ------- */
function mobileNav() {
  const mnav = document.querySelector('.m-nav');
  const navarrow = document.getElementById('nav_arrow');
  if (!mnav || !navarrow) return;

  const img = navarrow.querySelector('.slide-close');
  navarrow.onclick = function (e) {
    e.preventDefault(); // <-- FIXED
    mnav.classList.toggle('show');
    if (img) img.classList.toggle('rotate');
  };
}

/* ------- Hover reveal for covers ------- */
function hoverReveal(selector) {
  const titles = document.querySelectorAll(selector);
  if (!titles.length) return;

  // Ensure the container exists
  let container = document.querySelector('.thumb-image');
  if (!container) {
    container = document.createElement('div');
    container.className = 'thumb-image hidden';
    const img = document.createElement('img');
    container.appendChild(img);
    document.body.appendChild(container);
  }

  const img = container.querySelector('img');
  if (!img) return;

  const show = (title) => {
    const src = title.dataset.src;
    if (!src) return;

    img.src = src;
    container.classList.remove('hidden');
  };

  const hide = () => {
    container.classList.add('hidden');
  };

  titles.forEach(title => {
    title.addEventListener('mouseenter', () => show(title));
    title.addEventListener('mouseleave', hide);

    // touch support (optional but harmless)
    title.addEventListener('touchstart', () => show(title), { passive: true });
    title.addEventListener('touchend', hide);
    title.addEventListener('touchcancel', hide);
  });
}

/* ------- ABOUT panel logic (null-safe) ------- */
function initAbout() {
  const BODY = document.body;
  const INFO = document.querySelector('.info');
  if (!INFO) return; // nothing to wire on pages without .info

  const ABOUT_CONTENT = INFO.querySelector('.content');
  if (!ABOUT_CONTENT) return;

  let menu_items = INFO.querySelectorAll('.menu-item');
  let sections = ABOUT_CONTENT.querySelectorAll('.content > div');
  let height_gap = BODY.getBoundingClientRect().width < 440 ? 98 : 10;

  INFO.addEventListener('click', event => {
    const menu_item = event.target.closest('.menu-item');
    if (!menu_item) return;
    menuHighlight(menu_items, menu_item);
    matchScroll(ABOUT_CONTENT, height_gap, menu_item.id.split('_')[1]);
  });

  ABOUT_CONTENT.addEventListener('scroll', () => {
    const posObj = {};
    sections.forEach((section, i) => {
      posObj[i] = section.getBoundingClientRect().y - height_gap;
    });
    scrollMatch(ABOUT_CONTENT, menu_items, sections, posObj);
  });
}

function menuHighlight(menu_items, item) {
  menu_items.forEach(mi => mi.classList.remove('active'));
  item.classList.add('active');
}

function matchScroll(ABOUT_CONTENT, height_gap, id) {
  const match = document.getElementById(id);
  if (!match) return;
  const scrollPosition = match.getBoundingClientRect().y - height_gap;
  ABOUT_CONTENT.scrollBy({ top: scrollPosition, behavior: 'smooth' });
}

function scrollMatch(ABOUT_CONTENT, menu_items, sections, posObj) {
  let last_element = sections[0];
  for (const key in posObj) {
    if (posObj[key] <= 180) last_element = sections[key];
  }
  if (!last_element) return;
  const reference_id = 'item_' + last_element.id;
  const menu_item = document.getElementById(reference_id);
  if (menu_item) menuHighlight(menu_items, menu_item);
}
