import Reveal from 'reveal.js';
import RevealNotes from 'reveal.js/plugin/notes/notes.esm.js';
import './style.css';

// Setup BroadcastChannel for presenter-speaker sync
const syncChannel = new BroadcastChannel('reveal_slides_sync');

// Simple Markdown Slide Parser
function renderMarkdownSlide(md) {
  let headerHtml = '';
  let bodyHtml = '';
  let inList = false;
  let isGrid = md.includes('class="grid-2-cols"');
  
  // Extract notes
  let notesHtml = '';
  const notesMatch = md.match(/Note:\s*([\s\S]*?)(?=(?:\n\n|\n---|\n--|$))/i);
  if (notesMatch) {
    notesHtml = `<aside class="notes">${notesMatch[1].trim()}</aside>`;
    md = md.replace(notesMatch[0], '');
  }
  
  // Clean comments
  const cleanMd = md.replace(/<!--[\s\S]*?-->/g, '');
  const lines = cleanMd.split('\n');
  
  let gridCols = [];
  let currentColHtml = '';
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    let lineHtml = '';
    if (line.startsWith('# ')) {
      headerHtml += `<h1 class="text-4-xl md:text-5xl font-bold mb-2">${line.slice(2)}</h1>`;
      continue;
    } else if (line.startsWith('## ')) {
      headerHtml += `<h2 class="text-2xl font-medium mb-6 opacity-80">${line.slice(3)}</h2>`;
      continue;
    }
    
    if (line.startsWith('### ')) {
      if (inList) {
        if (isGrid) currentColHtml += '</ul>';
        else bodyHtml += '</ul>';
        inList = false;
      }
      if (isGrid) {
        if (currentColHtml) {
          gridCols.push(`<div class="io-card flex-1 flex flex-col justify-start">${currentColHtml}</div>`);
        }
        currentColHtml = `<h3 class="text-xl font-semibold mb-3">${line.slice(4)}</h3>`;
      } else {
        bodyHtml += `<h3 class="text-xl font-semibold mb-3">${line.slice(4)}</h3>`;
      }
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      if (!inList) {
        lineHtml += '<ul class="list-disc pl-6 mb-4 space-y-2">';
        inList = true;
      }
      // Simple bold highlighting for list items
      let text = line.slice(2);
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-google-blue font-semibold">$1</strong>');
      lineHtml += `<li>${text}</li>`;
      if (isGrid) currentColHtml += lineHtml;
      else bodyHtml += lineHtml;
    } else {
      if (inList) {
        if (isGrid) currentColHtml += '</ul>';
        else bodyHtml += '</ul>';
        inList = false;
      }
      let text = line;
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-google-blue font-semibold">$1</strong>');
      lineHtml += `<p class="mb-4 leading-relaxed text-lg">${text}</p>`;
      if (isGrid) currentColHtml += lineHtml;
      else bodyHtml += lineHtml;
    }
  }
  
  if (inList) {
    if (isGrid) currentColHtml += '</ul>';
    else bodyHtml += '</ul>';
  }
  
  if (isGrid) {
    if (currentColHtml) {
      gridCols.push(`<div class="io-card flex-1 flex flex-col justify-start">${currentColHtml}</div>`);
    }
    bodyHtml += `<div class="grid-2-cols flex flex-col md:flex-row gap-6 w-full mt-4">${gridCols.join('')}</div>`;
  }
  
  return headerHtml + bodyHtml + notesHtml;
}

// Render Dashboard
async function renderDashboard() {
  document.body.className = 'theme-google-io-light min-h-screen';
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="py-8 px-6 md:px-12 border-b border-gray-200">
      <div class="max-w-6xl mx-auto flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-full bg-[#1a73e8] animate-pulse"></div>
          <span class="font-bold text-xl tracking-tight">Project <span class="text-gray-900">Everflow</span></span>
        </div>
        <div class="text-sm text-gray-500 font-medium">Local Presentation Library</div>
      </div>
    </header>
    <main class="flex-grow max-w-6xl mx-auto w-full py-12 px-6 md:px-12">
      <div class="mb-10">
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-gray-900">Your Presentations</h1>
        <p class="text-lg text-gray-600">Select a slide deck to start presenting, or invoke the AI to generate a new one.</p>
      </div>
      <div id="deck-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div class="col-span-full py-12 text-center text-gray-400">Loading presentations...</div>
      </div>
    </main>
  `;

  try {
    const res = await fetch('/api/presentations');
    const list = await res.json();
    const listEl = document.getElementById('deck-list');

    if (list.length === 0) {
      listEl.innerHTML = `
        <div class="col-span-full py-16 px-6 text-center border-2 border-dashed border-gray-300 rounded-3xl">
          <p class="text-xl font-medium text-gray-700 mb-2">No presentations found</p>
          <p class="text-gray-500 mb-6">Use the AI skill in your agent to generate a slide deck.</p>
          <code class="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-800 font-mono">/make-slides "Topic: Deep Modules"</code>
        </div>
      `;
      return;
    }

    listEl.innerHTML = list.map(deck => {
      const formattedDate = new Date(deck.mtime).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      return `
        <div class="io-card cursor-pointer flex flex-col justify-between h-64 hover:border-google-blue" onclick="location.hash='#/presentation/${deck.id}'">
          <div>
            <div class="flex items-center space-x-2 mb-4">
              <span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-google-blue capitalize">${deck.preset.replace('google-io-', '')}</span>
              <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 capitalize">${deck.accent}</span>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2 line-clamp-2">${deck.title}</h3>
          </div>
          <div class="flex justify-between items-center text-sm text-gray-500">
            <span>Last modified</span>
            <span class="font-semibold text-gray-700">${formattedDate}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    document.getElementById('deck-list').innerHTML = `
      <div class="col-span-full text-red-500 text-center py-12">Failed to load presentations: ${err.message}</div>
    `;
  }
}

// Render Presentation Viewer
async function renderPresentation(id) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="w-full h-screen flex items-center justify-center text-xl">Loading slide deck...</div>`;

  try {
    const res = await fetch(`/api/presentations/${id}`);
    if (!res.ok) throw new Error('Presentation not found');
    const deck = await res.json();

    const preset = deck.metadata.preset || 'google-io-light';
    const accent = deck.metadata.accent || 'blue';
    const transition = deck.metadata.transition || 'slide';

    // Apply theme & accent variables
    document.body.className = `theme-${preset} accent-${accent} w-full h-screen overflow-hidden`;

    // Process slides
    const slides = deck.content.split(/\n---\r?\n/).map(slideMd => {
      const cleanMd = slideMd.trim();
      if (!cleanMd) return '';
      const slideClasses = slideMd.includes('class="grid-2-cols"') ? 'class="grid-slide"' : '';
      return `<section ${slideClasses}>${renderMarkdownSlide(cleanMd)}</section>`;
    }).filter(html => html !== '').join('');

    app.innerHTML = `
      <div class="reveal">
        <div class="slides">
          ${slides}
        </div>
        <!-- Simple Top Bar Navigation -->
        <div class="fixed top-4 left-6 right-6 z-50 flex justify-between items-center pointer-events-none select-none">
          <div class="flex items-center space-x-3 pointer-events-auto cursor-pointer" onclick="location.hash='#/'">
            <span class="text-sm font-bold tracking-tight opacity-60 hover:opacity-100">&larr; Dashboard</span>
          </div>
          <div class="flex items-center space-x-3 pointer-events-auto">
            <button id="btn-speaker-view" class="px-4 py-2 bg-white/80 dark:bg-black/40 backdrop-blur border border-gray-300 dark:border-gray-700 text-sm font-semibold rounded-full hover:bg-white dark:hover:bg-black pointer-events-auto shadow-sm">
              Speaker View
            </button>
          </div>
        </div>
      </div>
    `;

    // Initialize Reveal.js
    const deckInstance = new Reveal({
      plugins: [RevealNotes],
      hash: false,
      respondToHashChanges: false,
      history: false,
      transition: transition,
      center: false,
      controls: true,
      progress: true,
      slideNumber: 'c/t',
    });

    await deckInstance.initialize();

    // Hook up Speaker View Button
    document.getElementById('btn-speaker-view').addEventListener('click', () => {
      window.open(`#/speaker/${id}`, '_blank');
    });

    // Broadcast state for Speaker View synchronization
    const sendStateUpdate = () => {
      const state = deckInstance.getState();
      const indices = deckInstance.getIndices();
      
      const currentSlide = deckInstance.getCurrentSlide();
      const notesEl = currentSlide ? currentSlide.querySelector('aside.notes') : null;
      const notes = notesEl ? notesEl.innerHTML : 'No speaker notes for this slide.';

      // Get next slide text preview
      let nextPreview = 'End of presentation';
      const allSlides = deckInstance.getSlides();
      const currentIndex = allSlides.indexOf(currentSlide);
      if (currentIndex !== -1 && currentIndex < allSlides.length - 1) {
        const nextSlide = allSlides[currentIndex + 1];
        const h1 = nextSlide.querySelector('h1');
        const h2 = nextSlide.querySelector('h2');
        nextPreview = (h1 ? h1.innerText : '') + (h2 ? ' - ' + h2.innerText : '');
      }

      syncChannel.postMessage({
        type: 'slidechanged',
        state,
        indices,
        notes,
        nextPreview,
        title: deck.metadata.title || id,
      });
    };

    deckInstance.on('slidechanged', sendStateUpdate);
    deckInstance.on('ready', sendStateUpdate);

    // Listen for speaker controller navigation events
    syncChannel.onmessage = (event) => {
      if (event.data.type === 'navigate') {
        deckInstance.setState(event.data.state);
      } else if (event.data.type === 'request_sync') {
        sendStateUpdate();
      }
    };

  } catch (err) {
    app.innerHTML = `
      <div class="flex flex-col items-center justify-center h-screen space-y-4">
        <div class="text-red-500 text-xl font-bold">Error loading presentation</div>
        <div class="text-gray-500">${err.message}</div>
        <button onclick="location.hash='#/'" class="px-6 py-2 bg-google-blue text-white rounded-full font-semibold">Back to Dashboard</button>
      </div>
    `;
  }
}

// Render Custom Speaker View Page
function renderSpeakerView(id) {
  document.body.className = 'theme-google-io-dark min-h-screen text-white bg-google-darkBg';
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="flex flex-col h-screen">
      <!-- Top header bar -->
      <header class="py-4 px-6 bg-google-darkCard border-b border-gray-800 flex justify-between items-center">
        <div>
          <span class="text-xs font-semibold uppercase tracking-wider text-google-blue">Speaker Controller</span>
          <h1 id="presentation-title" class="text-xl font-bold leading-tight">Loading...</h1>
        </div>
        <div class="flex items-center space-x-6">
          <div class="text-right">
            <span class="text-xs text-gray-500 block">Slide</span>
            <span id="slide-index" class="text-lg font-mono font-bold">-</span>
          </div>
          <div class="text-right border-l border-gray-800 pl-6">
            <span class="text-xs text-gray-500 block">Timer</span>
            <span id="timer-display" class="text-2xl font-mono font-bold text-google-green">00:00:00</span>
          </div>
          <button id="btn-timer-reset" class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-xs font-semibold rounded">Reset</button>
        </div>
      </header>

      <!-- Main workspace -->
      <div class="flex-grow flex overflow-hidden">
        <!-- Notes Panel (Left) -->
        <div class="w-2/3 p-8 flex flex-col justify-between overflow-y-auto">
          <div class="prose prose-invert max-w-none">
            <h2 class="text-lg text-gray-500 border-b border-gray-800 pb-2 mb-4 font-semibold">Speaker Notes</h2>
            <div id="notes-content" class="text-2xl leading-relaxed text-gray-300 font-medium whitespace-pre-line">
              Waiting for presentation sync...
            </div>
          </div>
          <div class="mt-8 flex space-x-4">
            <button id="btn-prev" class="px-6 py-3 bg-gray-800 hover:bg-gray-700 font-bold rounded-2xl flex-1 text-lg transition">&larr; Previous</button>
            <button id="btn-next" class="px-6 py-3 bg-google-blue hover:bg-blue-600 font-bold rounded-2xl flex-1 text-lg transition">Next &rarr;</button>
          </div>
        </div>

        <!-- Previews & Controls (Right) -->
        <div class="w-1/3 bg-google-darkCard p-8 border-l border-gray-800 flex flex-col justify-between">
          <div>
            <h2 class="text-sm uppercase tracking-wider text-gray-500 mb-3 font-bold">Next Slide Preview</h2>
            <div id="next-preview" class="p-6 bg-google-darkBg rounded-3xl border border-gray-800 text-lg text-gray-400 font-medium">
              -
            </div>
          </div>
          
          <div class="py-6 border-t border-gray-800">
            <h3 class="text-sm uppercase tracking-wider text-gray-500 mb-3 font-bold">Keyboard Shortcuts</h3>
            <div class="grid grid-cols-2 gap-3 text-xs text-gray-400 font-mono">
              <div><span class="px-2 py-0.5 bg-gray-800 rounded text-white mr-2">Space / &rarr;</span>Next</div>
              <div><span class="px-2 py-0.5 bg-gray-800 rounded text-white mr-2">&larr;</span>Prev</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Sync state variables
  let currentIndices = null;

  // Request state update from presentation window
  syncChannel.postMessage({ type: 'request_sync' });

  // Handle updates from presentation window
  syncChannel.onmessage = (event) => {
    if (event.data.type === 'slidechanged') {
      document.getElementById('presentation-title').innerText = event.data.title;
      document.getElementById('notes-content').innerHTML = event.data.notes;
      document.getElementById('next-preview').innerText = event.data.nextPreview;
      document.getElementById('slide-index').innerText = `${event.data.indices.h + 1} / ${event.data.indices.v || ''}`;
      currentIndices = event.data.indices;
    }
  };

  // Speaker notes controller buttons
  document.getElementById('btn-prev').addEventListener('click', () => {
    syncChannel.postMessage({ type: 'navigate', state: { indexh: Math.max(0, (currentIndices?.h || 0) - 1), indexv: 0 } });
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    syncChannel.postMessage({ type: 'navigate', state: { indexh: (currentIndices?.h || 0) + 1, indexv: 0 } });
  });

  // Handle keyboard navigation in speaker view
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      syncChannel.postMessage({ type: 'navigate', state: { indexh: (currentIndices?.h || 0) + 1, indexv: 0 } });
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      syncChannel.postMessage({ type: 'navigate', state: { indexh: Math.max(0, (currentIndices?.h || 0) - 1), indexv: 0 } });
    }
  });

  // Timer logic
  let startTime = Date.now();
  let timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const hrs = Math.floor(elapsed / 3600000).toString().padStart(2, '0');
    const mins = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2, '0');
    const secs = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${hrs}:${mins}:${secs}`;
  }, 1000);

  document.getElementById('btn-timer-reset').addEventListener('click', () => {
    startTime = Date.now();
  });

  // Cleanup timer on unload
  window.addEventListener('hashchange', () => {
    clearInterval(timerInterval);
  }, { once: true });
}

// Router
function handleRoute() {
  const hash = location.hash || '#/';
  
  if (hash === '#/') {
    renderDashboard();
  } else {
    const presentationMatch = hash.match(/^#\/presentation\/([^/]+)$/);
    if (presentationMatch) {
      renderPresentation(presentationMatch[1]);
      return;
    }

    const speakerMatch = hash.match(/^#\/speaker\/([^/]+)$/);
    if (speakerMatch) {
      renderSpeakerView(speakerMatch[1]);
      return;
    }

    // Default fallback
    location.hash = '#/';
  }
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);
