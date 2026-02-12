import './style.css';
import { bookTitle, chapters } from './src/bookContent.js';

const app = document.querySelector('#app');

// State
let bookmarks = JSON.parse(localStorage.getItem('sherlock-bookmarks')) || [];

// Render Logic
function render() {
  app.innerHTML = `
    <aside>
      <h1>${bookTitle}</h1>
      
      <div class="nav-section">
        <h2>Chapters</h2>
        <ul class="chapter-list">
          ${chapters.map((chap, index) => `
            <li data-index="${index}">${chap.title}</li>
          `).join('')}
        </ul>
      </div>

      <div class="nav-section">
        <h2>Bookmarks</h2>
        <ul class="bookmark-list" id="bookmark-list">
          ${renderBookmarks()}
        </ul>
      </div>
    </aside>
    <main id="content">
      ${chapters.map((chap, index) => `
        <article id="chapter-${index}">
          ${chap.content}
        </article>
      `).join('')}
    </main>
  `;

  attachEvents();
}

function renderBookmarks() {
  if (bookmarks.length === 0) return '<li><em>No bookmarks yet.</em></li>';
  return bookmarks.map((bm, i) => `
    <li class="bookmark-item" data-id="${bm.id}">
      <span class="goto-bookmark">Section ${bm.label}</span>
      <span class="delete-bookmark" data-index="${i}">×</span>
    </li>
  `).join('');
}

function attachEvents() {
  // Navigation
  document.querySelectorAll('.chapter-list li').forEach(item => {
    item.addEventListener('click', (e) => {
      const index = e.target.dataset.index;
      document.getElementById(`chapter-${index}`).scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Paragraph Interactions (Bookmarking)
  const paragraphs = document.querySelectorAll('main p');
  paragraphs.forEach((p, index) => {
    // Assign stable ID if not present
    if (!p.id) p.id = `para-${index}`;
    p.classList.add('bookmarkable');

    // Add bookmark button
    const btn = document.createElement('span');
    btn.className = 'bookmark-btn';
    btn.textContent = '🔖';
    btn.title = 'Bookmark this paragraph';
    btn.onclick = () => addBookmark(p.id, index);
    p.prepend(btn);
  });

  // Bookmark List Events
  document.querySelectorAll('.goto-bookmark').forEach(item => {
    item.addEventListener('click', (e) => {
      const id = e.target.closest('li').dataset.id;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.backgroundColor = '#fae10033';
        setTimeout(() => el.style.backgroundColor = 'transparent', 2000);
      }
    });
  });

  document.querySelectorAll('.delete-bookmark').forEach(item => {
    item.addEventListener('click', (e) => {
      const index = e.target.dataset.index;
      removeBookmark(index);
    });
  });
}

// Logic
function addBookmark(id, index) {
  if (bookmarks.some(b => b.id === id)) return;

  // Get snippet text, excluding the bookmark button
  const el = document.getElementById(id);
  const clone = el.cloneNode(true);
  const btn = clone.querySelector('.bookmark-btn');
  if (btn) btn.remove();

  const snippet = clone.textContent.trim().substring(0, 20) + '...';

  bookmarks.push({ id, label: `#${index + 1} (${snippet})`, timestamp: Date.now() });
  saveBookmarks();
  render(); // Re-render to show new bookmark
}

function removeBookmark(index) {
  bookmarks.splice(index, 1);
  saveBookmarks();
  render();
}

function saveBookmarks() {
  localStorage.setItem('sherlock-bookmarks', JSON.stringify(bookmarks));
}

// Init
render();
