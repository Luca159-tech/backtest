function initNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const dropdownButtons = document.querySelectorAll('[data-dropdown]');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  dropdownButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const parent = button.closest('.nav-item');
      if (!parent) return;

      const isOpen = parent.classList.contains('open');
      document.querySelectorAll('.nav-item.open').forEach((item) => item.classList.remove('open'));
      if (!isOpen) parent.classList.add('open');
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-item')) {
      document.querySelectorAll('.nav-item.open').forEach((item) => item.classList.remove('open'));
    }
  });
}

function setActiveLink() {
  const currentPage = document.body.dataset.page;
  if (!currentPage) return;

  document.querySelectorAll('.nav-links a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (href === currentPage || href.startsWith(`${currentPage}#`)) {
      link.style.color = 'var(--green-bright)';
    }
  });
}

async function loadLayout() {
  const headerTarget = document.querySelector('#site-header');
  const footerTarget = document.querySelector('#site-footer');

  if (!headerTarget || !footerTarget) {
    initNavigation();
    return;
  }

  try {
    const response = await fetch('layout.html');
    if (!response.ok) throw new Error(`Failed to load layout (${response.status})`);

    const html = await response.text();
    const parsed = new DOMParser().parseFromString(html, 'text/html');

    const header = parsed.querySelector('.site-header');
    const footer = parsed.querySelector('.site-footer');

    if (header) headerTarget.replaceWith(header);
    if (footer) footerTarget.replaceWith(footer);

    initNavigation();
    setActiveLink();
  } catch (error) {
    console.error(error);
  }
}

loadLayout();
