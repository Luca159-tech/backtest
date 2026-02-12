const currentPage = document.body.dataset.page || '';
const isUsefulLinksPage = currentPage === 'useful-links.html';

const headerMarkup = `
  <div class="navbar">
    <div class="container">
      <a class="logo" href="index.html">Memory Systems Lab</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <ul class="nav-links" id="site-nav">
        <li><a href="index.html">Home</a></li>
        <li><a href="about.html">About Me</a></li>
        <li class="nav-item">
          <button type="button" data-dropdown aria-haspopup="true" aria-expanded="false">Projects ▾</button>
          <div class="dropdown">
            <a href="projects.html#recall">Project 1: Recall &amp; Memorisation</a>
            <a href="projects.html#logic">Project 2: Logic Gates &amp; SaaS</a>
          </div>
        </li>
        <li class="nav-item">
          <button type="button" data-dropdown aria-haspopup="true" aria-expanded="false">Account ▾</button>
          <div class="dropdown">
            <a href="login.html">Login</a>
          </div>
        </li>
        <li><a href="contact.html">Contact Me</a></li>
      </ul>
    </div>
  </div>
`;

const footerMarkup = `
  <div class="site-footer">
    <div class="container footer-grid">
      <section class="footer-column">
        <h2 class="footer-heading">Memory Systems Lab</h2>
        <p>Building cognitive infrastructure for structured recall.</p>
      </section>
      <section class="footer-column">
        <h2 class="footer-heading">
          <a href="useful-links.html"${isUsefulLinksPage ? ' aria-current="page"' : ''}>Useful Links</a>
        </h2>
        <nav aria-label="Useful links">
          <ul class="footer-links">
            <li>
              <a href="https://apps.ankiweb.net/" target="_blank" rel="noopener noreferrer">
                Anki <span class="sr-only">(opens in new tab)</span><span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              <a href="https://example.com" target="_blank" rel="noopener noreferrer">
                TODO: Spaced-repetition guide <span class="sr-only">(opens in new tab)</span><span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              <a href="https://example.org" target="_blank" rel="noopener noreferrer">
                TODO: Memory research index <span class="sr-only">(opens in new tab)</span><span aria-hidden="true">↗</span>
              </a>
            </li>
            <li><a href="useful-links.html"${isUsefulLinksPage ? ' aria-current="page"' : ''}>Useful Links hub</a></li>
          </ul>
        </nav>
      </section>
    </div>
  </div>
`;

const siteHeader = document.querySelector('#site-header');
if (siteHeader) {
  siteHeader.innerHTML = headerMarkup;
}

const siteFooter = document.querySelector('#site-footer');
if (siteFooter) {
  siteFooter.innerHTML = footerMarkup;
}

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const dropdownButtons = document.querySelectorAll('[data-dropdown]');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', navLinks.classList.contains('open') ? 'true' : 'false');
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
      const itemButton = item.querySelector('[data-dropdown]');
      itemButton?.setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      parent.classList.add('open');
      button.setAttribute('aria-expanded', 'true');
    } else {
      button.setAttribute('aria-expanded', 'false');
    }
  });
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.nav-item')) {
    document.querySelectorAll('.nav-item.open').forEach((item) => {
      item.classList.remove('open');
      const itemButton = item.querySelector('[data-dropdown]');
      itemButton?.setAttribute('aria-expanded', 'false');
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
      navToggle?.setAttribute('aria-expanded', 'false');
    }
  });
});
