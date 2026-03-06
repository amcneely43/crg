function tooltip() {
  const tooltip = document.querySelector('.tooltip');
  const text = document.querySelector('.tooltip-text');
  if (!tooltip || !text) return;

  document.addEventListener('click', event => {
    if (event.target !== tooltip) {
      text.classList.remove('show');
    } else {
      text.classList.toggle('show');
    }
  });
}
