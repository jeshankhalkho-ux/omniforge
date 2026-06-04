import './style.css';

// Import tool initialization delegates
import { initDocumentTool } from './tools/documentTools.js';
import { initImageTool } from './tools/imageTools.js';
import { initVideoTool } from './tools/videoTools.js';
import { initTextTool } from './tools/textTools.js';
import { initCryptoTool } from './tools/cryptoTools.js';

// Define tools metadata
const TOOLS = [
  // Document Tools
  { id: 'pdf-merger', name: 'PDF Merger', desc: 'Combine multiple PDF documents into a single file.', cat: 'doc' },
  { id: 'pdf-splitter', name: 'PDF Splitter', desc: 'Extract pages or range of pages from your PDF file.', cat: 'doc' },
  { id: 'pdf-compressor', name: 'PDF Compressor', desc: 'Downscale and compress PDF file sizes locally.', cat: 'doc' },
  { id: 'pdf-to-image', name: 'PDF to Image', desc: 'Convert PDF pages into high quality PNG or JPEG images.', cat: 'doc' },
  { id: 'image-to-pdf', name: 'Image to PDF', desc: 'Convert images (PNG, JPG) into structured PDF pages.', cat: 'doc' },
  { id: 'pdf-protector', name: 'PDF Password Protector', desc: 'Secure your PDF files with encryption passwords.', cat: 'doc' },
  { id: 'pdf-unlocker', name: 'PDF Unlocker', desc: 'Remove password restriction bounds from unlocked files.', cat: 'doc' },

  // Image Tools
  { id: 'image-resizer', name: 'Image Resizer', desc: 'Scale image dimensions keeping original aspect ratios.', cat: 'img' },
  { id: 'image-compressor', name: 'Image Compressor', desc: 'Reduce image file sizes via quality percentage sliders.', cat: 'img' },
  { id: 'bg-remover', name: 'Background Remover', desc: 'Erase color screens/backdrop weights transparently.', cat: 'img' },
  { id: 'image-cropper', name: 'Image Cropper', desc: 'Crop custom bounds using interactive grab corners.', cat: 'img' },
  { id: 'watermark-adder', name: 'Watermark Adder', desc: 'Overlay customizable text grids onto your photos.', cat: 'img' },
  { id: 'image-converter', name: 'Format Converter', desc: 'Instantly convert JPG ↔ PNG ↔ WebP file layouts.', cat: 'img' },
  { id: 'screenshot-beautifier', name: 'Screenshot Beautifier', desc: 'Wrap graphics inside beautiful browser/macOS device mockups.', cat: 'img' },

  // Video Tools
  { id: 'video-compressor', name: 'Video Compressor', desc: 'Re-encode and shrink video bits locally in-browser.', cat: 'vid' },
  { id: 'video-trimmer', name: 'Video Trimmer', desc: 'Trim duration ranges of video files via frame capture.', cat: 'vid' },
  { id: 'video-to-gif', name: 'Video to GIF', desc: 'Sample video timestamps and render to animated GIF.', cat: 'vid' },
  { id: 'audio-extractor', name: 'Audio Extractor', desc: 'Rip high fidelity WAV soundtracks from video clips.', cat: 'vid' },
  { id: 'video-converter', name: 'Video Format Converter', desc: 'Record container changes from MP4 to WebM structures.', cat: 'vid' },

  // Text Tools
  { id: 'word-counter', name: 'Word & Char Counter', desc: 'Analyze text statistics, word density, and reading speeds.', cat: 'txt' },
  { id: 'case-converter', name: 'Case Converter', desc: 'Transform character cases to UPPER, camel, slug, etc.', cat: 'txt' },
  { id: 'diff-checker', name: 'Text Diff Checker', desc: 'Compare text versions side-by-side highlighting lines.', cat: 'txt' },
  { id: 'dup-remover', name: 'Duplicate Line Remover', desc: 'Filter out identical line blocks, sorting items.', cat: 'txt' },
  { id: 'pass-generator', name: 'Password Generator', desc: 'Create strong passwords with customizable parameters.', cat: 'txt' },
  { id: 'qr-generator', name: 'QR Code Generator', desc: 'Convert text, numbers or links into scannable QR cards.', cat: 'txt' },
  { id: 'barcode-generator', name: 'Barcode Generator', desc: 'Generate standard CODE128 or EAN barcodes.', cat: 'txt' },

  // Security Tools
  { id: 'pass-strength', name: 'Password Strength Checker', desc: 'Estimate cracking speeds, entropy, and complexity metrics.', cat: 'sec' },
  { id: 'hash-generator', name: 'Hash Generator', desc: 'Compute MD5, SHA-1, SHA-256 and SHA-512 values.', cat: 'sec' },
  { id: 'hash-verifier', name: 'File Hash Verifier', desc: 'Compare hash signatures of local files for security.', cat: 'sec' },
  { id: 'base64-codec', name: 'Base64 Encoder/Decoder', desc: 'Translate strings into safe base64 arrays.', cat: 'sec' },
  { id: 'url-codec', name: 'URL Encoder/Decoder', desc: 'Escape or parse URL parameters seamlessly.', cat: 'sec' },
  { id: 'jwt-decoder', name: 'JWT Decoder', desc: 'Inspect payloads, expiry times, and alg warning headers.', cat: 'sec' },
  { id: 'aes-playground', name: 'Encryption Playground', desc: 'Secure messages using AES-GCM password encryptions.', cat: 'sec' }
];

// App State
let activeToolId = null;
let currentTheme = localStorage.getItem('theme') || 'dark';

// DOM Elements
const sidebarDocs = document.getElementById('navDocs');
const sidebarImages = document.getElementById('navImages');
const sidebarVideos = document.getElementById('navVideos');
const sidebarText = document.getElementById('navText');
const sidebarSecurity = document.getElementById('navSecurity');

const contentWrapper = document.getElementById('contentWrapper');
const searchInput = document.getElementById('toolSearch');
const topHeaderTitle = document.getElementById('topHeaderTitle');
const themeToggle = document.getElementById('themeToggle');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');

// Progress Bar Container (will inject on top header if active)
let globalProgressBar = null;

// Initialize App
function initApp() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();
  
  populateSidebar();
  renderDashboard();

  // Bind Listeners
  searchInput.addEventListener('input', handleSearch);
  themeToggle.addEventListener('click', toggleTheme);
  
  mobileMenuBtn.onclick = () => {
    sidebar.classList.toggle('open');
  };

  // Close sidebar on mobile clicking item
  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== mobileMenuBtn) {
      sidebar.classList.remove('open');
    }
  });

  // Inject Progress Bar
  const pBar = document.createElement('div');
  pBar.className = 'progress-bar-container';
  pBar.innerHTML = `<div class="progress-bar-fill" id="globalProgressFill"></div>`;
  document.querySelector('.top-header').after(pBar);
  globalProgressBar = pBar;
}

// Global App Utilities passed to tools
const HELPERS = {
  showProgress: (percent) => {
    if (globalProgressBar) {
      globalProgressBar.style.display = 'block';
      globalProgressBar.querySelector('#globalProgressFill').style.width = `${percent}%`;
    }
  },
  hideProgress: () => {
    if (globalProgressBar) {
      globalProgressBar.style.display = 'none';
      globalProgressBar.querySelector('#globalProgressFill').style.width = '0%';
    }
  },
  showToast: (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.borderLeft = `4px solid ${type === 'success' ? 'var(--cat-img)' : type === 'warning' ? 'var(--cat-sec)' : 'var(--cat-vid)'}`;
    toast.innerHTML = `
      <span style="font-weight: 600;">${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
  downloadFile: (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  formatBytes: (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },
  setupDragAndDrop: (dropzone, fileInput, callback) => {
    dropzone.onclick = () => fileInput.click();
    
    fileInput.onchange = () => {
      if (fileInput.files.length > 0) {
        callback(fileInput.files);
      }
    };

    dropzone.ondragover = (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    };

    dropzone.ondragleave = () => {
      dropzone.classList.remove('dragover');
    };

    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        callback(e.dataTransfer.files);
      }
    };
  },
  escapeHtml: (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
  copyToClipboard: (text) => {
    navigator.clipboard.writeText(text).then(() => {
      HELPERS.showToast('Copied to clipboard!');
    }).catch(err => {
      HELPERS.showToast('Failed to copy: ' + err, 'error');
    });
  },
  dataURLtoBlob: (dataurl) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
};

// Populate Left Navigation Sidebar
function populateSidebar() {
  const categories = {
    doc: sidebarDocs,
    img: sidebarImages,
    vid: sidebarVideos,
    txt: sidebarText,
    sec: sidebarSecurity
  };

  // Reset structures
  Object.values(categories).forEach(c => c.innerHTML = '');

  TOOLS.forEach((tool) => {
    const li = document.createElement('li');
    li.className = `nav-item ${activeToolId === tool.id ? 'active' : ''}`;
    li.setAttribute('data-id', tool.id);
    
    // Choose categories visual highlights
    let catDot = '🔵';
    if (tool.cat === 'img') catDot = '🟢';
    if (tool.cat === 'vid') catDot = '🔴';
    if (tool.cat === 'txt') catDot = '🟣';
    if (tool.cat === 'sec') catDot = '🟡';

    li.innerHTML = `
      <span>${catDot}</span>
      <span>${tool.name}</span>
    `;

    li.onclick = () => {
      loadTool(tool.id);
      sidebar.classList.remove('open'); // close mobile sidebar
    };

    if (categories[tool.cat]) {
      categories[tool.cat].appendChild(li);
    }
  });
}

// Router to load tool layout
function loadTool(toolId) {
  activeToolId = toolId;
  
  // Update sidebar active highlights
  document.querySelectorAll('.nav-item').forEach((item) => {
    if (item.getAttribute('data-id') === toolId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  const tool = TOOLS.find(t => t.id === toolId);
  if (!tool) {
    renderDashboard();
    return;
  }

  // Configure main layout title
  topHeaderTitle.textContent = tool.name;

  contentWrapper.innerHTML = `
    <div class="tool-view-header">
      <button class="back-to-dashboard-btn" id="backToDashBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="5" y1="12" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Dashboard
      </button>
      <span class="quick-tag" style="background-color: var(--border-color); color: var(--text-muted); border-color: transparent;">Category: ${tool.cat.toUpperCase()}</span>
    </div>
    <div class="tool-workspace" id="toolWorkspace"></div>
  `;

  document.getElementById('backToDashBtn').onclick = () => renderDashboard();

  const workspace = document.getElementById('toolWorkspace');
  
  // Delegate rendering based on tool metadata category
  if (tool.cat === 'doc') {
    initDocumentTool(tool.id, workspace, HELPERS);
  } else if (tool.cat === 'img') {
    initImageTool(tool.id, workspace, HELPERS);
  } else if (tool.cat === 'vid') {
    initVideoTool(tool.id, workspace, HELPERS);
  } else if (tool.cat === 'txt') {
    initTextTool(tool.id, workspace, HELPERS);
  } else if (tool.cat === 'sec') {
    initCryptoTool(tool.id, workspace, HELPERS);
  }
}

// Render Dashboard layout
function renderDashboard() {
  activeToolId = null;
  topHeaderTitle.textContent = 'OmniForge Dashboard';
  
  // Clean active tags in sidebar
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  contentWrapper.innerHTML = `
    <div class="dashboard-view">
      <div class="dashboard-hero">
        <h1>Simplify Your Daily Tasks</h1>
        <p>A curated collection of offline tools for documents, images, video compression, text editing, and hash encryptions. Everything runs locally in your sandbox.</p>
      </div>

      <!-- PDF / Document section -->
      <section class="tool-category-section" id="dashCatDoc">
        <div class="category-header">
          <span class="category-title" style="color: var(--cat-doc);">📄 Document Tools</span>
          <span class="category-badge cat-doc-bg" id="badgeDoc">7</span>
        </div>
        <div class="tools-grid" id="gridDocs"></div>
      </section>

      <!-- Images section -->
      <section class="tool-category-section" id="dashCatImg">
        <div class="category-header">
          <span class="category-title" style="color: var(--cat-img);">🖼️ Image Tools</span>
          <span class="category-badge cat-img-bg" id="badgeImg">7</span>
        </div>
        <div class="tools-grid" id="gridImages"></div>
      </section>

      <!-- Videos section -->
      <section class="tool-category-section" id="dashCatVid">
        <div class="category-header">
          <span class="category-title" style="color: var(--cat-vid);">🎥 Video Tools</span>
          <span class="category-badge cat-vid-bg" id="badgeVid">5</span>
        </div>
        <div class="tools-grid" id="gridVideos"></div>
      </section>

      <!-- Text section -->
      <section class="tool-category-section" id="dashCatTxt">
        <div class="category-header">
          <span class="category-title" style="color: var(--cat-txt);">✍️ Text Tools</span>
          <span class="category-badge cat-txt-bg" id="badgeTxt">7</span>
        </div>
        <div class="tools-grid" id="gridText"></div>
      </section>

      <!-- Security section -->
      <section class="tool-category-section" id="dashCatSec">
        <div class="category-header">
          <span class="category-title" style="color: var(--cat-sec);">🔒 Security Tools</span>
          <span class="category-badge cat-sec-bg" id="badgeSec">7</span>
        </div>
        <div class="tools-grid" id="gridSecurity"></div>
      </section>
    </div>
  `;

  // Draw Category Cards
  renderGrid('doc', 'gridDocs', 'badgeDoc');
  renderGrid('img', 'gridImages', 'badgeImg');
  renderGrid('vid', 'gridVideos', 'badgeVid');
  renderGrid('txt', 'gridText', 'badgeTxt');
  renderGrid('sec', 'gridSecurity', 'badgeSec');
}

function renderGrid(category, gridId, badgeId, filterQuery = '') {
  const grid = document.getElementById(gridId);
  const badge = document.getElementById(badgeId);
  if (!grid) return;

  grid.innerHTML = '';
  
  const filtered = TOOLS.filter((tool) => {
    const matchCat = tool.cat === category;
    const matchQuery = tool.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
                       tool.desc.toLowerCase().includes(filterQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  badge.textContent = filtered.length;
  
  // Hide section wrapper if empty grid
  const wrapper = grid.closest('.tool-category-section');
  if (filtered.length === 0) {
    if (wrapper) wrapper.style.display = 'none';
  } else {
    if (wrapper) wrapper.style.display = 'flex';
  }

  filtered.forEach((tool) => {
    const card = document.createElement('div');
    card.className = `tool-card ${tool.cat}`;
    
    // Choose icon layout
    let svgIcon = '📄';
    if (tool.cat === 'img') svgIcon = '🖼️';
    if (tool.cat === 'vid') svgIcon = '🎥';
    if (tool.cat === 'txt') svgIcon = '✍️';
    if (tool.cat === 'sec') svgIcon = '🔒';

    card.innerHTML = `
      <div class="tool-icon-wrapper">
        <span style="font-size: 1.5rem;">${svgIcon}</span>
      </div>
      <h3>${tool.name}</h3>
      <p>${tool.desc}</p>
    `;

    card.onclick = () => loadTool(tool.id);
    grid.appendChild(card);
  });
}

// Live Search logic
function handleSearch() {
  const query = searchInput.value.toLowerCase();
  
  // 1. Filter Sidebar Elements
  const items = document.querySelectorAll('.nav-item');
  items.forEach((item) => {
    const toolText = item.textContent.toLowerCase();
    if (toolText.includes(query)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });

  // 2. Filter sections titles in sidebar
  document.querySelectorAll('.nav-section').forEach((sect) => {
    const listItems = sect.querySelectorAll('.nav-item');
    const hasVisible = Array.from(listItems).some(item => item.style.display !== 'none');
    sect.style.display = hasVisible ? 'block' : 'none';
  });

  // 3. Filter Dashboard elements (if dashboard is open)
  if (activeToolId === null) {
    renderGrid('doc', 'gridDocs', 'badgeDoc', query);
    renderGrid('img', 'gridImages', 'badgeImg', query);
    renderGrid('vid', 'gridVideos', 'badgeVid', query);
    renderGrid('txt', 'gridText', 'badgeTxt', query);
    renderGrid('sec', 'gridSecurity', 'badgeSec', query);
  }
}

// Theme management
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const darkIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
  `;
  const lightIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
  `;
  themeToggle.innerHTML = currentTheme === 'dark' ? lightIcon : darkIcon;
}

// Start app on DOMContentLoaded
window.addEventListener('DOMContentLoaded', initApp);
