const pastrdgs = document.querySelector('.past-readings');
const button  = document.querySelector('.load-more');
let page      = parseInt(pastrdgs.getAttribute('data-page'), 10) || 1;

const fetchProjects = async () => {
  const url = `${window.location.pathname}.json?page=${page + 1}`;

  try {
    const response = await fetch(url);
    const { html, more } = await response.json();

    // Append returned list items
    pastrdgs.insertAdjacentHTML('beforeend', html);

    page++;
    pastrdgs.setAttribute('data-page', page);

    // Keep hover covers on the readings page
    hoverReveal('.past-readings li');

    // Hide Load More when there are no more pages
    button.hidden = !more;

  } catch (error) {
    console.log('Fetch error: ', error);
  }
};

document.addEventListener("DOMContentLoaded", function() {
  if (!pastrdgs || !button) return;
  button.addEventListener('click', fetchProjects);

  // Initial hover binding
  hoverReveal('.past-readings li');
});
