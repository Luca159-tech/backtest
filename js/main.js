const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const dropdownButtons = document.querySelectorAll('[data-dropdown]');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

dropdownButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    const parent = button.closest('.nav-item');
    if (!parent) return;

    const isOpen = parent.classList.contains('open');
    document.querySelectorAll('.nav-item.open').forEach((item) => {
      item.classList.remove('open');
    });

    if (!isOpen) {
      parent.classList.add('open');
    }
  });
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.nav-item')) {
    document.querySelectorAll('.nav-item.open').forEach((item) => {
      item.classList.remove('open');
    });
  }
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    const target = document.querySelector(targetId);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navLinks?.classList.remove('open');
    }
  });
});
