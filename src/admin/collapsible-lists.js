const managedSections = new Set(['section-papers', 'section-courses', 'section-research', 'section-cv']);
let pendingOpenSection = null;

const valueFor = (card, suffixes) => {
  for (const suffix of suffixes) {
    const input = card.querySelector(`[id$="-${suffix}-zh"], [id$="-${suffix}-en"], [id$="-${suffix}"]`);
    if (input?.value?.trim()) return input.value.trim();
  }
  return '';
};

function labelFor(card, index) {
  const section = card.closest('.settings-section')?.id || '';
  if (section === 'section-papers') {
    const title = valueFor(card, ['title']);
    const year = valueFor(card, ['time']);
    return [title || `成果 ${index + 1}`, year].filter(Boolean).join(' · ');
  }
  if (section === 'section-courses') {
    const title = valueFor(card, ['title']);
    const term = valueFor(card, ['term']);
    return [title || `课程 ${index + 1}`, term].filter(Boolean).join(' · ');
  }
  if (section === 'section-research') {
    const title = valueFor(card, ['title']);
    return title || `研究条目 ${index + 1}`;
  }
  if (section === 'section-cv') {
    const school = valueFor(card, ['school']);
    const company = valueFor(card, ['company']);
    const degree = valueFor(card, ['degree']);
    const title = valueFor(card, ['title']);
    return [school || company || `履历 ${index + 1}`, degree || title].filter(Boolean).join(' · ');
  }
  return `第 ${index + 1} 项`;
}

function enhanceSection(section) {
  if (!managedSections.has(section.id)) return;
  const rawCards = [...section.querySelectorAll('.list-item')].filter(card => !card.closest('.collapsible-entry'));
  rawCards.forEach(card => {
    const details = document.createElement('details');
    details.className = 'collapsible-entry';
    const summary = document.createElement('summary');
    const title = document.createElement('span');
    title.className = 'collapsible-title';
    const state = document.createElement('span');
    state.className = 'collapsible-state';
    state.textContent = '展开';
    summary.append(title, state);

    const body = document.createElement('div');
    body.className = 'collapsible-body';
    while (card.firstChild) body.append(card.firstChild);
    details.append(summary, body);
    card.replaceWith(details);

    const updateTitle = () => {
      const siblings = [...details.parentElement.children].filter(node => node.matches?.('.collapsible-entry'));
      title.textContent = labelFor(details, Math.max(0, siblings.indexOf(details)));
    };
    updateTitle();
    body.addEventListener('input', updateTitle);
    body.addEventListener('change', updateTitle);
    details.addEventListener('toggle', () => { state.textContent = details.open ? '收起' : '展开'; });

    const oldHeader = body.querySelector(':scope > .item-header');
    if (oldHeader) {
      oldHeader.classList.add('collapsible-actions');
      oldHeader.querySelector('strong')?.remove();
    }
  });

  if (pendingOpenSection === section.id) {
    const entries = section.querySelectorAll('.collapsible-entry');
    const last = entries[entries.length - 1];
    if (last) {
      last.open = true;
      last.querySelector('.collapsible-state').textContent = '收起';
      queueMicrotask(() => last.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }
    pendingOpenSection = null;
  }
}

function enhanceAll() {
  managedSections.forEach(id => {
    const section = document.getElementById(id);
    if (section) enhanceSection(section);
  });
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button?.textContent?.trim().startsWith('＋ 添加')) return;
  const section = button.closest('.settings-section');
  if (section && managedSections.has(section.id)) pendingOpenSection = section.id;
}, true);

const observer = new MutationObserver(() => enhanceAll());
observer.observe(document.documentElement, { childList: true, subtree: true });
queueMicrotask(enhanceAll);
