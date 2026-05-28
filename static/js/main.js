/* ===== NLP LEARNING HUB — main.js ===== */

// ── Navigation ──────────────────────────────────────────
const sidebar  = document.getElementById('sidebar');
const overlay  = document.getElementById('overlay');
const hamburger = document.getElementById('hamburger');

hamburger?.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
});

overlay?.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
});

// Scroll spy
const navItems = document.querySelectorAll('.nav-item[data-section]');
const sections = document.querySelectorAll('.content-section[id], .hero[id]');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.section === current);
  });
}, { passive: true });

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const target = document.getElementById(item.dataset.section);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });
});

// ── Utility helpers ──────────────────────────────────────
function showLoading(el) {
  el.innerHTML = '<div style="display:flex;justify-content:center;padding:24px"><div class="loading-spinner"></div></div>';
}

function showError(el, msg) {
  el.innerHTML = `<div class="alert alert-warning">⚠ ${msg}</div>`;
}

function showPlaceholder(el, icon, text) {
  el.innerHTML = `<div class="result-placeholder"><div class="placeholder-icon">${icon}</div><span>${text}</span></div>`;
}

async function callAPI(endpoint, body) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Server error');
  return res.json();
}

// Copy code to clipboard
document.querySelectorAll('.btn-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const code = btn.closest('.code-block').querySelector('pre').innerText;
    navigator.clipboard.writeText(code).then(() => {
      btn.textContent = '✓ Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    });
  });
});

// Fill example text helper
function fillExample(textareaId, text) {
  const ta = document.getElementById(textareaId);
  if (ta) ta.value = text;
}

// ── TOKENIZATION ─────────────────────────────────────────
async function analyzeTokenization() {
  const text = document.getElementById('tok-input').value.trim();
  const result = document.getElementById('tok-result');
  if (!text) { showPlaceholder(result, '🔤', 'Enter text above and click Analyze'); return; }
  showLoading(result);
  try {
    const data = await callAPI('/api/tokenize', { text });
    renderTokenization(result, data);
  } catch (e) { showError(result, e.message); }
}

function renderTokenization(el, data) {
  const { tokens, count } = data;
  let html = `<div class="alert alert-info" style="margin-bottom:12px">
    Found <strong>${count} tokens</strong> total
  </div><div class="token-flow animate-in">`;
  tokens.forEach(t => {
    if (t.is_space) {
      html += `<div class="token-chip"><span class="token-text token-space">SPACE</span><span class="token-meta">space</span></div>`;
      return;
    }
    let cls = 'token-normal';
    let meta = 'word';
    if (t.is_punct)  { cls = 'token-punct';  meta = 'punct'; }
    else if (t.is_digit)  { cls = 'token-digit';  meta = 'number'; }
    else if (t.is_stop)   { cls = 'token-stop';   meta = 'stop'; }
    html += `<div class="token-chip">
      <span class="token-text ${cls}">${escHtml(t.text)}</span>
      <span class="token-meta">${meta}</span>
    </div>`;
  });
  html += '</div>';

  const stopCount    = tokens.filter(t => t.is_stop).length;
  const punctCount   = tokens.filter(t => t.is_punct).length;
  const alphaCount   = tokens.filter(t => t.is_alpha).length;
  html += `<div class="sw-stats" style="margin-top:12px">
    <div class="sw-stat"><div class="sw-stat-dot" style="background:#3b82f6"></div>${alphaCount} alphabetic</div>
    <div class="sw-stat"><div class="sw-stat-dot" style="background:#94a3b8"></div>${stopCount} stop words</div>
    <div class="sw-stat"><div class="sw-stat-dot" style="background:#eab308"></div>${punctCount} punctuation</div>
  </div>`;
  el.innerHTML = html;
}

document.getElementById('tok-analyze')?.addEventListener('click', analyzeTokenization);
document.getElementById('tok-example')?.addEventListener('click', () => {
  fillExample('tok-input', 'Apple is looking at buying U.K. startup for $1 billion!');
  analyzeTokenization();
});

// ── SENTENCES ────────────────────────────────────────────
async function analyzeSentences() {
  const text = document.getElementById('sent-input').value.trim();
  const result = document.getElementById('sent-result');
  if (!text) { showPlaceholder(result, '📝', 'Enter multi-sentence text and click Analyze'); return; }
  showLoading(result);
  try {
    const data = await callAPI('/api/sentences', { text });
    renderSentences(result, data);
  } catch (e) { showError(result, e.message); }
}

const SENT_COLORS = ['#6C63FF','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

function renderSentences(el, data) {
  const { sentences, count } = data;
  let html = `<div class="alert alert-info" style="margin-bottom:12px">
    Found <strong>${count} sentence${count !== 1 ? 's' : ''}</strong>
  </div><div class="sentence-list animate-in">`;
  sentences.forEach((s, i) => {
    const color = SENT_COLORS[i % SENT_COLORS.length];
    html += `<div class="sentence-item" style="border-left-color:${color};background:${color}0d">
      <span>${escHtml(s.text)}</span>
      <span class="sentence-badge" style="background:${color}20;color:${color}">#${i+1} · ${s.token_count} tokens</span>
    </div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}

document.getElementById('sent-analyze')?.addEventListener('click', analyzeSentences);
document.getElementById('sent-example')?.addEventListener('click', () => {
  fillExample('sent-input', 'Natural language processing is fascinating. spaCy makes it easy to analyze text. Sentence segmentation is one of its core features! Do you want to learn more?');
  analyzeSentences();
});

// ── POS TAGGING ──────────────────────────────────────────
async function analyzePOS() {
  const text = document.getElementById('pos-input').value.trim();
  const result = document.getElementById('pos-result');
  if (!text) { showPlaceholder(result, '🏷️', 'Enter text and click Analyze'); return; }
  showLoading(result);
  try {
    const data = await callAPI('/api/pos', { text });
    renderPOS(result, data);
  } catch (e) { showError(result, e.message); }
}

function posClass(pos) {
  const known = ['NOUN','VERB','ADJ','ADV','PROPN','DET','ADP','CCONJ','SCONJ','PRON','PUNCT','NUM','AUX'];
  return known.includes(pos) ? `pos-${pos}` : 'pos-DEFAULT';
}

function renderPOS(el, data) {
  const { tokens } = data;
  const posCounts = {};
  tokens.forEach(t => { posCounts[t.pos] = (posCounts[t.pos] || 0) + 1; });

  let html = '<div class="pos-flow animate-in">';
  tokens.forEach(t => {
    const cls = posClass(t.pos);
    html += `<div class="pos-chip ${cls}" title="${escHtml(t.explanation || t.pos)}">
      <span class="pos-word">${escHtml(t.text)}</span>
      <span class="pos-tag">${escHtml(t.pos)}</span>
    </div>`;
  });
  html += '</div>';

  // Legend
  html += '<div class="ner-legend" style="margin-top:12px">';
  Object.entries(posCounts).forEach(([pos, cnt]) => {
    const cls = posClass(pos);
    const mockEl = document.createElement('div');
    mockEl.className = `pos-chip ${cls}`;
    html += `<div class="legend-item">
      <div class="legend-dot" style="border-radius:3px;background:currentColor" class="${cls}"></div>
      <strong>${pos}</strong> (${cnt})
    </div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}

document.getElementById('pos-analyze')?.addEventListener('click', analyzePOS);
document.getElementById('pos-example')?.addEventListener('click', () => {
  fillExample('pos-input', 'The ancient dragon soared gracefully through the dark stormy sky above the misty mountains.');
  analyzePOS();
});

// ── NER ──────────────────────────────────────────────────
async function analyzeNER() {
  const text = document.getElementById('ner-input').value.trim();
  const result = document.getElementById('ner-result');
  if (!text) { showPlaceholder(result, '🎯', 'Enter text with names, places, organizations...'); return; }
  showLoading(result);
  try {
    const data = await callAPI('/api/ner', { text });
    renderNER(result, data);
  } catch (e) { showError(result, e.message); }
}

function nerClass(label) {
  const known = ['PERSON','ORG','GPE','LOC','PRODUCT','DATE','TIME','MONEY','PERCENT',
    'EVENT','NORP','FAC','WORK_OF_ART','LAW','LANGUAGE'];
  return known.includes(label) ? `ent-${label}` : 'ent-DEFAULT';
}

function renderNER(el, data) {
  const { entities, text } = data;
  if (!entities.length) {
    el.innerHTML = '<div class="alert alert-info">No named entities found. Try text with people, places, or organizations.</div>';
    return;
  }

  // Build annotated text
  let annotated = '';
  let last = 0;
  const sorted = [...entities].sort((a,b) => a.start - b.start);
  sorted.forEach(ent => {
    annotated += escHtml(text.slice(last, ent.start));
    const cls = nerClass(ent.label);
    annotated += `<span class="entity-span ${cls}" title="${escHtml(ent.explanation)}">
      ${escHtml(ent.text)}<span class="entity-label">${escHtml(ent.label)}</span>
    </span>`;
    last = ent.end;
  });
  annotated += escHtml(text.slice(last));

  // Legend
  const seen = {};
  entities.forEach(e => { seen[e.label] = e.explanation; });
  let legend = '<div class="ner-legend">';
  Object.entries(seen).forEach(([label, exp]) => {
    legend += `<div class="legend-item">
      <div class="legend-dot entity-span ${nerClass(label)}" style="width:14px;height:14px;border-radius:3px;display:inline-block"></div>
      <strong>${label}</strong> — ${exp || label}
    </div>`;
  });
  legend += '</div>';

  el.innerHTML = `<div class="alert alert-info" style="margin-bottom:12px">
      Found <strong>${entities.length} entit${entities.length !== 1 ? 'ies' : 'y'}</strong>
    </div>
    <div class="ner-text-display animate-in">${annotated}</div>
    ${legend}`;
}

document.getElementById('ner-analyze')?.addEventListener('click', analyzeNER);
document.getElementById('ner-example')?.addEventListener('click', () => {
  fillExample('ner-input', 'Elon Musk founded Tesla in California. Amazon was started by Jeff Bezos in Seattle in 1994. Apple released the iPhone in January 2007, which cost $499.');
  analyzeNER();
});

// ── DEPENDENCY ───────────────────────────────────────────
async function analyzeDependency() {
  const text = document.getElementById('dep-input').value.trim();
  const result = document.getElementById('dep-result');
  if (!text) { showPlaceholder(result, '🌳', 'Enter a sentence to see dependency relations'); return; }
  showLoading(result);
  try {
    const data = await callAPI('/api/dependency', { text });
    renderDependency(result, data);
  } catch (e) { showError(result, e.message); }
}

function renderDependency(el, data) {
  const { dependencies } = data;
  let html = `<div style="overflow-x:auto">
    <table class="dep-table animate-in">
      <thead>
        <tr>
          <th>Token</th>
          <th>POS</th>
          <th>Dependency</th>
          <th>Head</th>
          <th>Children</th>
          <th>Meaning</th>
        </tr>
      </thead>
      <tbody>`;
  dependencies.forEach(t => {
    const isRoot = t.dep === 'ROOT';
    html += `<tr>
      <td><strong>${escHtml(t.text)}</strong></td>
      <td><span class="pos-chip pos-${posClass(t.pos).replace('pos-','')} pos-inline">
        <span class="pos-tag" style="font-size:.7rem">${escHtml(t.pos)}</span>
      </span></td>
      <td><span class="dep-badge ${isRoot ? 'root-badge' : ''}">${escHtml(t.dep)}</span></td>
      <td>${isRoot ? '<em style="color:#94a3b8">—</em>' : escHtml(t.head)}</td>
      <td style="color:#64748b;font-size:.8rem">${t.children.length ? escHtml(t.children.join(', ')) : '<em>—</em>'}</td>
      <td class="dep-explanation">${escHtml(t.explanation)}</td>
    </tr>`;
  });
  html += '</tbody></table></div>';
  el.innerHTML = html;
}

document.getElementById('dep-analyze')?.addEventListener('click', analyzeDependency);
document.getElementById('dep-example')?.addEventListener('click', () => {
  fillExample('dep-input', 'The cat sat on the mat.');
  analyzeDependency();
});

// ── LEMMATIZATION ────────────────────────────────────────
async function analyzeLemma() {
  const text = document.getElementById('lem-input').value.trim();
  const result = document.getElementById('lem-result');
  if (!text) { showPlaceholder(result, '📚', 'Enter text to see lemmas'); return; }
  showLoading(result);
  try {
    const data = await callAPI('/api/lemma', { text });
    renderLemma(result, data);
  } catch (e) { showError(result, e.message); }
}

function renderLemma(el, data) {
  const { lemmas } = data;
  const changed = lemmas.filter(l => l.changed).length;
  let html = `<div class="alert alert-info" style="margin-bottom:12px">
    <strong>${changed}</strong> of ${lemmas.length} words were changed to their base form
  </div><div class="lemma-grid animate-in">`;
  lemmas.forEach(l => {
    html += `<div class="lemma-card ${l.changed ? 'changed' : ''}">
      <div class="lemma-original">${escHtml(l.text)}</div>
      <div class="lemma-arrow">↓ ${escHtml(l.pos)}</div>
      <div class="lemma-result">${escHtml(l.lemma)}</div>
    </div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}

document.getElementById('lem-analyze')?.addEventListener('click', analyzeLemma);
document.getElementById('lem-example')?.addEventListener('click', () => {
  fillExample('lem-input', 'The children were running quickly while their dogs barked loudly at the passing cars.');
  analyzeLemma();
});

// ── STOP WORDS ───────────────────────────────────────────
async function analyzeStopWords() {
  const text = document.getElementById('sw-input').value.trim();
  const result = document.getElementById('sw-result');
  if (!text) { showPlaceholder(result, '🚫', 'Enter text to identify stop words'); return; }
  showLoading(result);
  try {
    const data = await callAPI('/api/stopwords', { text });
    renderStopWords(result, data);
  } catch (e) { showError(result, e.message); }
}

function renderStopWords(el, data) {
  const { words, stop_count, content_count } = data;
  const total = stop_count + content_count;
  const stopPct = total ? Math.round(stop_count / total * 100) : 0;

  let html = `<div class="alert alert-info" style="margin-bottom:12px">
    <strong>${stopPct}%</strong> stop words ·
    <strong>${stop_count}</strong> stops removed →
    <strong>${content_count}</strong> content words remain
  </div>
  <div class="stopword-flow animate-in">`;
  words.forEach(w => {
    let cls = 'sw-content';
    if (w.is_punct) cls = 'sw-punct';
    else if (w.is_stop) cls = 'sw-stop';
    html += `<span class="sw-chip ${cls}" title="${w.is_stop ? 'Stop word' : w.is_punct ? 'Punctuation' : 'Content word'}">${escHtml(w.text)}</span>`;
  });
  html += `</div>
  <div class="sw-stats">
    <div class="sw-stat"><div class="sw-stat-dot" style="background:#3b82f6"></div>Content words</div>
    <div class="sw-stat"><div class="sw-stat-dot" style="background:#94a3b8"></div>Stop words (strikethrough)</div>
    <div class="sw-stat"><div class="sw-stat-dot" style="background:#eab308"></div>Punctuation</div>
  </div>`;
  el.innerHTML = html;
}

document.getElementById('sw-analyze')?.addEventListener('click', analyzeStopWords);
document.getElementById('sw-example')?.addEventListener('click', () => {
  fillExample('sw-input', 'Natural language processing is a fascinating field that combines the power of linguistics with computer science and machine learning.');
  analyzeStopWords();
});

// ── SIMILARITY ───────────────────────────────────────────
async function analyzeSimilarity() {
  const text1 = document.getElementById('sim-input1').value.trim();
  const text2 = document.getElementById('sim-input2').value.trim();
  const result = document.getElementById('sim-result');
  if (!text1 || !text2) { showPlaceholder(result, '🔗', 'Enter two texts above to compare them'); return; }
  showLoading(result);
  try {
    const data = await callAPI('/api/similarity', { text1, text2 });
    renderSimilarity(result, data);
  } catch (e) { showError(result, e.message); }
}

function renderSimilarity(el, data) {
  const { similarity, percentage, label } = data;
  const colors = {
    'Very High': '#10b981', 'High': '#06b6d4',
    'Moderate': '#f59e0b', 'Low': '#f97316', 'Very Low': '#ef4444'
  };
  const color = colors[label] || '#6C63FF';
  el.innerHTML = `<div class="similarity-result animate-in">
    <div class="sim-score" style="background:linear-gradient(135deg,${color},${color}99);-webkit-background-clip:text;background-clip:text">${percentage}%</div>
    <div class="sim-label" style="color:${color}">${label} Similarity</div>
    <div class="sim-bar-wrap">
      <div class="sim-bar" style="width:${percentage}%;background:linear-gradient(90deg,${color},${color}99)"></div>
    </div>
    <div class="sim-bar-label"><span>0% — No similarity</span><span>100% — Identical</span></div>
    <p style="margin-top:16px;font-size:.85rem;color:#64748b">
      Cosine similarity score: <strong>${similarity}</strong> — based on spaCy word vectors
    </p>
  </div>`;
}

document.getElementById('sim-analyze')?.addEventListener('click', analyzeSimilarity);
document.getElementById('sim-example')?.addEventListener('click', () => {
  document.getElementById('sim-input1').value = 'I love playing basketball with my friends on weekends.';
  document.getElementById('sim-input2').value = 'Playing sports and outdoor games is my favourite hobby.';
  analyzeSimilarity();
});

// ── FULL PIPELINE ────────────────────────────────────────
async function analyzeFullPipeline() {
  const text = document.getElementById('fp-input').value.trim();
  const result = document.getElementById('fp-result');
  if (!text) { showPlaceholder(result, '⚙️', 'Enter text to run the full spaCy pipeline'); return; }
  showLoading(result);
  try {
    const data = await callAPI('/api/full-pipeline', { text });
    renderFullPipeline(result, data);
  } catch (e) { showError(result, e.message); }
}

function renderFullPipeline(el, data) {
  const { stats, entities, sentences } = data;
  let html = `<div class="full-pipeline-stats animate-in">
    ${statCard('🔢', stats.char_count, 'Characters')}
    ${statCard('🔤', stats.token_count, 'Tokens')}
    ${statCard('📝', stats.sentence_count, 'Sentences')}
    ${statCard('🎯', stats.entity_count, 'Entities')}
    ${statCard('🚫', stats.stop_word_count, 'Stop Words')}
    ${statCard('📚', stats.unique_lemmas, 'Unique Lemmas')}
  </div>`;

  if (sentences.length) {
    html += `<div class="pipeline-result-section">
      <h4>📝 Sentences</h4>
      <div class="sentence-list">`;
    sentences.forEach((s, i) => {
      const c = SENT_COLORS[i % SENT_COLORS.length];
      html += `<div class="sentence-item" style="border-left-color:${c};background:${c}0d;font-size:.85rem">${escHtml(s)}</div>`;
    });
    html += '</div></div>';
  }

  if (entities.length) {
    html += `<div class="pipeline-result-section">
      <h4>🎯 Named Entities</h4>
      <div style="display:flex;flex-wrap:wrap;gap:8px">`;
    entities.forEach(e => {
      const cls = nerClass(e.label);
      html += `<span class="entity-span ${cls}" title="${escHtml(e.explanation)}">${escHtml(e.text)}<span class="entity-label">${escHtml(e.label)}</span></span>`;
    });
    html += '</div></div>';
  }

  el.innerHTML = html;
}

function statCard(icon, value, label) {
  return `<div class="stat-card">
    <div style="font-size:1.3rem;margin-bottom:4px">${icon}</div>
    <div class="stat-number">${value}</div>
    <div class="stat-label">${label}</div>
  </div>`;
}

document.getElementById('fp-analyze')?.addEventListener('click', analyzeFullPipeline);
document.getElementById('fp-example')?.addEventListener('click', () => {
  fillExample('fp-input', 'SpaceX, founded by Elon Musk in 2002, successfully launched its Falcon 9 rocket from Cape Canaveral on Tuesday morning. NASA has partnered with SpaceX to deliver supplies to the International Space Station. The mission cost approximately $62 million and lasted three days.');
  analyzeFullPipeline();
});

// ── HTML escape ──────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
