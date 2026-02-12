import './style.css';
import { bookTitle, chapters } from './src/bookContent.js';

const app = document.querySelector('#app');

// State
let bookmarks = JSON.parse(localStorage.getItem('sherlock-bookmarks')) || [];
let currentChapterIndex = 0;

// Handle Initial Hash
if (location.hash.startsWith('#chapter-')) {
  const idx = parseInt(location.hash.replace('#chapter-', ''), 10);
  if (!isNaN(idx) && chapters[idx]) {
    currentChapterIndex = idx;
  }
}

// Render Logic
function render() {
  const currentChapter = chapters[currentChapterIndex];

  app.innerHTML = `
    <aside>
      <h1>${bookTitle}</h1>
      
      <div class="nav-section">
        <h2>Chapters</h2>
        <ul class="chapter-list">
          ${chapters.map((chap, index) => `
            <li class="${index === currentChapterIndex ? 'active' : ''}" data-index="${index}">
              ${chap.title}
            </li>
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
      <article>
        <h2>${currentChapter.title}</h2>
        ${currentChapter.content}
      </article>
    </main>
  `;

  attachEvents();
  updateTitle();
}

function updateTitle() {
  document.title = `${chapters[currentChapterIndex].title} | Sherlock Holmes Reader`;
}

function renderBookmarks() {
  if (bookmarks.length === 0) return '<li><em>No bookmarks yet.</em></li>';
  return bookmarks.map((bm, i) => `
    <li class="bookmark-item" data-id="${bm.id}">
      <span class="goto-bookmark">${bm.label}</span>
      <span class="delete-bookmark" data-index="${i}">×</span>
    </li>
  `).join('');
}

function attachEvents() {
  // Select active chapter in sidebar
  document.querySelectorAll('.chapter-list li').forEach(item => {
    item.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index, 10);
      switchChapter(index);
    });
  });

  // Paragraph Interactions (Bookmarking)
  const paragraphs = document.querySelectorAll('main p');
  paragraphs.forEach((p, index) => {
    // Unique ID: chapterIndex + paragraphIndex
    const id = `ch-${currentChapterIndex}-p-${index}`;
    p.id = id;
    p.classList.add('bookmarkable');

    // Add bookmark button
    const btn = document.createElement('span');
    btn.className = 'bookmark-btn';
    btn.textContent = '🔖';
    btn.title = 'Bookmark this paragraph';
    btn.onclick = () => addBookmark(id, index);
    p.prepend(btn);
  });

  // Bookmark List Events
  document.querySelectorAll('.goto-bookmark').forEach(item => {
    item.addEventListener('click', handleBookmarkClick);
  });

  document.querySelectorAll('.delete-bookmark').forEach(item => {
    item.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index, 10);
      removeBookmark(index);
    });
  });
}

function switchChapter(index) {
  if (index === currentChapterIndex) return;
  currentChapterIndex = index;
  location.hash = `chapter-${index}`;
  render();
  window.scrollTo(0, 0);
}

async function handleBookmarkClick(e) {
  const id = e.target.closest('li').dataset.id;

  // Parse ID: ch-X-p-Y
  const match = id.match(/^ch-(\d+)-p-(\d+)$/);

  // Check if it's a legacy bookmark (para-X) or new format
  if (!match) {
    if (id.startsWith('para-')) {
      alert("This is an old bookmark from the previous version. It cannot be opened.");
      return;
    }
    return;
  }

  const chapterIdx = parseInt(match[1], 10);

  if (chapterIdx !== currentChapterIndex) {
    currentChapterIndex = chapterIdx;
    location.hash = `chapter-${chapterIdx}`;
    render();
    // Allow DOM to update
    await new Promise(r => setTimeout(r, 0)); // tick
  }

  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.backgroundColor = '#fae10033';
    setTimeout(() => el.style.backgroundColor = 'transparent', 2000);
  } else {
    console.warn("Element not found:", id);
  }
}

// Logic
function addBookmark(id, paraIndex) {
  if (bookmarks.some(b => b.id === id)) return;

  // Get snippet text
  const el = document.getElementById(id);
  const clone = el.cloneNode(true);
  const btn = clone.querySelector('.bookmark-btn');
  if (btn) btn.remove();

  const snippet = clone.textContent.trim().substring(0, 25) + '...';
  const chapTitle = chapters[currentChapterIndex].title;

  const label = `<span class="bm-chapter">${chapTitle}</span><span class="bm-snippet">${snippet}</span>`;

  bookmarks.push({ id, label, timestamp: Date.now() });
  saveBookmarks();
  render();
}

function removeBookmark(index) {
  bookmarks.splice(index, 1);
  saveBookmarks();
  render();
}

function saveBookmarks() {
  localStorage.setItem('sherlock-bookmarks', JSON.stringify(bookmarks));
}

// Global hash change listener for back/forward interactions
window.addEventListener('hashchange', () => {
  if (location.hash.startsWith('#chapter-')) {
    const idx = parseInt(location.hash.replace('#chapter-', ''), 10);
    if (!isNaN(idx) && idx !== currentChapterIndex && chapters[idx]) {
      currentChapterIndex = idx;
      render();
      window.scrollTo(0, 0);
    }
  }
});

// Init
render();
