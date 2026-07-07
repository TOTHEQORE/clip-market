const state = { user: null };

async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : {},
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

function el(tag, attrs, children) {
  attrs = attrs || {};
  children = children || [];
  const node = document.createElement(tag);
  Object.keys(attrs).forEach(function (k) {
    const v = attrs[k];
    if (k === 'class') node.className = v;
    else if (k.indexOf('on') === 0 && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(function (child) {
    if (child === null || child === undefined) return;
    if (typeof child === 'string') node.appendChild(document.createTextNode(child));
    else node.appendChild(child);
  });
  return node;
}

function money(n) {
  return '$' + (Number(n) || 0).toFixed(2);
}

async function loadUser() {
  try {
    const data = await api('/auth/me');
    state.user = data.user;
  } catch (e) {
    state.user = null;
  }
}

async function logout() {
  await api('/auth/logout', { method: 'POST' });
  state.user = null;
  navigate('#/');
}

const routes = {
  '#/': renderHome,
  '#/login': renderLogin,
  '#/register': renderRegister,
  '#/brand': renderBrandDashboard,
  '#/creator': renderCreatorDashboard,
  '#/new-campaign': renderNewCampaign,
};

function navigate(hash) {
  if (window.location.hash === hash) {
    render();
  } else {
    window.location.hash = hash;
  }
}

function buildShell() {
  const appRoot = document.getElementById('app');
  appRoot.innerHTML = '';
  const header = el('header', { class: 'topbar' });
  const headerInner = el('div', { class: 'container topbar-inner' });
  const logo = el('a', { href: '#/', class: 'brand-logo' }, ['Clip', el('span', {}, 'Market')]);
  const nav = el('nav', { class: 'nav-links', id: 'nav' });
  headerInner.appendChild(logo);
  headerInner.appendChild(nav);
  header.appendChild(headerInner);

const main = el('main', { class: 'container', id: 'main-content' });

const footer = el('footer', { class: 'footer' });
  const footerInner = el('div', { class: 'container' });
  footerInner.appendChild(el('p', {}, 'ClipMarket is an independent demo marketplace for UGC clipping campaigns. Not affiliated with any other clipping platform.'));
  footer.appendChild(footerInner);

appRoot.appendChild(header);
  appRoot.appendChild(main);
  appRoot.appendChild(footer);
}

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = '';
  if (state.user) {
    const dashHref = state.user.role === 'brand' ? '#/brand' : '#/creator';
    nav.appendChild(el('a', { href: dashHref }, 'Dashboard'));
    nav.appendChild(el('span', {}, state.user.name + ' (' + state.user.role + ')'));
    nav.appendChild(el('button', { onclick: logout }, 'Log out'));
  } else {
    nav.appendChild(el('a', { href: '#/login' }, 'Log in'));
    nav.appendChild(el('a', { href: '#/register', class: 'primary' }, 'Get Started'));
  }
}

async function render() {
  renderNav();
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  const hash = window.location.hash || '#/';
  const view = routes[hash] || renderNotFound;
  const content = await view();
  main.appendChild(content);
}

async function renderHome() {
  const wrap = el('div', {});
  wrap.appendChild(el('div', { class: 'hero' }, [
    el('h1', {}, 'Get paid to clip. Get clips that convert.'),
    el('p', { class: 'subtitle' }, 'ClipMarket connects brands running clipping campaigns with creators who cut, caption and post. Browse open campaigns below.'),
    ]));

let data;
  try {
    data = await api('/campaigns');
  } catch (e) {
    wrap.appendChild(el('div', { class: 'alert error' }, 'Could not load campaigns.'));
    return wrap;
  }

const grid = el('div', { class: 'grid' });
  if (!data.campaigns.length) {
    grid.appendChild(el('div', { class: 'empty-state' }, 'No campaigns yet. Check back soon.'));
  }
  data.campaigns.forEach(function (c) {
    grid.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'badge' }, money(c.cpm) + ' CPM'),
      el('div', { class: 'campaign-title' }, c.title),
      el('div', { class: 'campaign-brand' }, 'by ' + c.brandName),
      el('div', { class: 'campaign-brief' }, c.brief),
      el('div', { class: 'stat-row' }, [
        el('span', {}, ['Budget ', el('strong', {}, money(c.budget))]),
        el('span', {}, ['Spent ', el('strong', {}, money(c.spent))]),
        ]),
      el('a', { href: state.user ? '#/creator' : '#/register', class: 'btn', style: 'margin-top:16px;display:block;text-align:center;' }, state.user ? 'Submit a clip' : 'Sign up to submit'),
      ]));
  });
  wrap.appendChild(grid);
  return wrap;
}

function renderLogin() {
  const wrap = el('div', {});
  wrap.appendChild(el('h1', {}, 'Log in'));
  const errorBox = el('div', {});
  const form = el('form', { class: 'stacked' });
  const email = el('input', { type: 'email', placeholder: 'Email', required: 'true' });
  const password = el('input', { type: 'password', placeholder: 'Password', required: 'true' });
  form.appendChild(el('div', {}, [el('label', {}, 'Email'), email]));
  form.appendChild(el('div', {}, [el('label', {}, 'Password'), password]));
  form.appendChild(el('button', { class: 'btn', type: 'submit' }, 'Log in'));
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errorBox.innerHTML = '';
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email: email.value, password: password.value } });
      state.user = data.user;
      navigate(state.user.role === 'brand' ? '#/brand' : '#/creator');
    } catch (err) {
      errorBox.appendChild(el('div', { class: 'alert error' }, err.message));
    }
  });
  wrap.appendChild(errorBox);
  wrap.appendChild(form);
  wrap.appendChild(el('p', { class: 'subtitle' }, ['No account? ', el('a', { href: '#/register' }, 'Register here')]));
  return wrap;
}

function renderRegister() {
  const wrap = el('div', {});
  wrap.appendChild(el('h1', {}, 'Create your account'));
  const errorBox = el('div', {});
  const form = el('form', { class: 'stacked' });

const name = el('input', { type: 'text', placeholder: 'Full name', required: 'true' });
  const email = el('input', { type: 'email', placeholder: 'Email', required: 'true' });
  const password = el('input', { type: 'password', placeholder: 'Password', required: 'true' });

const creatorRadio = el('input', { type: 'radio', name: 'role', value: 'creator', id: 'role-creator' });
  const brandRadio = el('input', { type: 'radio', name: 'role', value: 'brand', id: 'role-brand' });
  creatorRadio.checked = true;

form.appendChild(el('div', {}, [el('label', {}, 'Full name'), name]));
  form.appendChild(el('div', {}, [el('label', {}, 'Email'), email]));
  form.appendChild(el('div', {}, [el('label', {}, 'Password'), password]));
  form.appendChild(el('div', { class: 'role-toggle' }, [
    el('label', {}, [creatorRadio, ' Creator - submit clips, earn money']),
    el('label', {}, [brandRadio, ' Brand - post campaigns, pay for views']),
    ]));
  form.appendChild(el('button', { class: 'btn', type: 'submit' }, 'Create account'));

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  errorBox.innerHTML = '';
  const role = brandRadio.checked ? 'brand' : 'creator';
  try {
    const data = await api('/auth/register', { method: 'POST', body: { name: name.value, email: email.value, password: password.value, role: role } });
    state.user = data.user;
    navigate(role === 'brand' ? '#/brand' : '#/creator');
  } catch (err) {
    errorBox.appendChild(el('div', { class: 'alert error' }, err.message));
  }
});

wrap.appendChild(errorBox);
  wrap.appendChild(form);
  return wrap;
}

async function renderNewCampaign() {
  if (!state.user || state.user.role !== 'brand') {
    navigate('#/login');
    return el('div', {});
  }
  const wrap = el('div', {});
  wrap.appendChild(el('h1', {}, 'Post a clipping campaign'));
  const errorBox = el('div', {});
  const form = el('form', { class: 'stacked' });
  const title = el('input', { type: 'text', placeholder: 'Campaign title', required: 'true' });
  const brief = el('textarea', { placeholder: 'What should creators clip? Describe the source content and the vibe you want.' });
  const requirements = el('textarea', { placeholder: 'Format requirements (length, captions, watermark, hashtags, etc.)' });
  const budget = el('input', { type: 'number', min: '1', placeholder: 'Total budget (USD)', required: 'true' });
  const cpm = el('input', { type: 'number', min: '0.01', step: '0.01', placeholder: 'Rate per 1,000 views (USD)', required: 'true' });

form.appendChild(el('div', {}, [el('label', {}, 'Title'), title]));
  form.appendChild(el('div', {}, [el('label', {}, 'Brief'), brief]));
  form.appendChild(el('div', {}, [el('label', {}, 'Requirements'), requirements]));
  form.appendChild(el('div', {}, [el('label', {}, 'Budget (USD)'), budget]));
  form.appendChild(el('div', {}, [el('label', {}, 'CPM - pay per 1,000 views (USD)'), cpm]));
  form.appendChild(el('button', { class: 'btn', type: 'submit' }, 'Publish campaign'));

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  errorBox.innerHTML = '';
  try {
    await api('/campaigns', { method: 'POST', body: {
      title: title.value,
      brief: brief.value,
      requirements: requirements.value,
      budget: Number(budget.value),
      cpm: Number(cpm.value)
    } });
    navigate('#/brand');
  } catch (err) {
    errorBox.appendChild(el('div', { class: 'alert error' }, err.message));
  }
});

wrap.appendChild(errorBox);
  wrap.appendChild(form);
  return wrap;
}

async function renderBrandDashboard() {
  if (!state.user || state.user.role !== 'brand') {
    navigate('#/login');
    return el('div', {});
  }
  const wrap = el('div', {});
  wrap.appendChild(el('div', { class: 'stat-row', style: 'justify-content:space-between;align-items:center;border:none;padding-top:0;' }, [
    el('h1', {}, 'Your campaigns'),
    el('a', { href: '#/new-campaign', class: 'btn' }, '+ New campaign'),
    ]));

let data;
  try {
    data = await api('/campaigns');
  } catch (e) {
    wrap.appendChild(el('div', { class: 'alert error' }, 'Could not load campaigns.'));
    return wrap;
  }
  const mine = data.campaigns.filter(function (c) { return c.brandId === state.user.id; });
  if (!mine.length) {
    wrap.appendChild(el('div', { class: 'empty-state' }, 'You have not posted any campaigns yet.'));
    return wrap;
  }

for (const c of mine) {
  const card = el('div', { class: 'card', style: 'margin-bottom:16px;' });
  card.appendChild(el('div', { class: 'campaign-title' }, c.title));
  card.appendChild(el('div', { class: 'stat-row' }, [
    el('span', {}, ['Budget ', el('strong', {}, money(c.budget))]),
    el('span', {}, ['Spent ', el('strong', {}, money(c.spent))]),
    el('span', {}, ['CPM ', el('strong', {}, money(c.cpm))]),
    ]));

  const subsWrap = el('div', {});
  card.appendChild(subsWrap);
  try {
    const subData = await api('/submissions/campaign/' + c.id);
    if (!subData.submissions.length) {
      subsWrap.appendChild(el('p', { class: 'subtitle' }, 'No submissions yet.'));
    } else {
      const table = el('table', {});
      table.appendChild(el('tr', {}, [
        el('th', {}, 'Creator'), el('th', {}, 'Clip'), el('th', {}, 'Views'), el('th', {}, 'Payout'), el('th', {}, 'Status'), el('th', {}, 'Actions'),
        ]));
      subData.submissions.forEach(function (s) {
        const viewsInput = el('input', { type: 'number', min: '0', value: String(s.views), style: 'width:100px;' });
        const saveBtn = el('button', { class: 'btn secondary', type: 'button' }, 'Update views');
        saveBtn.addEventListener('click', async function () {
          await api('/submissions/' + s.id, { method: 'PATCH', body: { views: Number(viewsInput.value) } });
          render();
        });
        const approveBtn = el('button', { class: 'btn', type: 'button' }, 'Approve');
        approveBtn.addEventListener('click', async function () {
          await api('/submissions/' + s.id, { method: 'PATCH', body: { status: 'approved' } });
          render();
        });
        const rejectBtn = el('button', { class: 'btn danger', type: 'button' }, 'Reject');
        rejectBtn.addEventListener('click', async function () {
          await api('/submissions/' + s.id, { method: 'PATCH', body: { status: 'rejected' } });
          render();
        });
        const actions = el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;' }, [viewsInput, saveBtn, approveBtn, rejectBtn]);
        table.appendChild(el('tr', {}, [
          el('td', {}, s.creatorName),
          el('td', {}, el('a', { href: s.clipUrl, target: '_blank' }, 'View clip')),
          el('td', {}, String(s.views)),
          el('td', {}, money(s.payout)),
          el('td', {}, el('span', { class: 'status-pill status-' + s.status }, s.status)),
          el('td', {}, actions),
          ]));
      });
      subsWrap.appendChild(table);
    }
  } catch (e) {
    subsWrap.appendChild(el('p', {}, 'Could not load submissions.'));
  }

  wrap.appendChild(card);
}
  return wrap;
}

async function renderCreatorDashboard() {
  if (!state.user || state.user.role !== 'creator') {
    navigate('#/login');
    return el('div', {});
  }
  const wrap = el('div', {});

let mineData;
  try {
    mineData = await api('/submissions/mine');
  } catch (e) {
    mineData = { submissions: [], totalEarnings: 0 };
  }

wrap.appendChild(el('div', { class: 'card balance-card', style: 'margin-bottom:24px;' }, [
  el('div', {}, [el('div', { class: 'subtitle' }, 'Approved earnings'), el('div', { class: 'balance-amount' }, money(mineData.totalEarnings))]),
  ]));

wrap.appendChild(el('h2', {}, 'Open campaigns'));
  let data;
  try {
    data = await api('/campaigns');
  } catch (e) {
    data = { campaigns: [] };
  }
  const grid = el('div', { class: 'grid' });
  data.campaigns.forEach(function (c) {
    const urlInput = el('input', { type: 'url', placeholder: 'Link to your posted clip (TikTok/Reels/Shorts)' });
    const submitBtn = el('button', { class: 'btn', type: 'button', style: 'margin-top:10px;width:100%;' }, 'Submit clip');
    const msg = el('div', {});
    submitBtn.addEventListener('click', async function () {
      if (!urlInput.value) { return; }
      try {
        await api('/submissions', { method: 'POST', body: { campaignId: c.id, clipUrl: urlInput.value } });
        msg.innerHTML = '';
        msg.appendChild(el('div', { class: 'alert success' }, 'Submitted! Track it below once the brand reviews it.'));
        urlInput.value = '';
        render();
      } catch (err) {
        msg.innerHTML = '';
        msg.appendChild(el('div', { class: 'alert error' }, err.message));
      }
    });
    grid.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'badge' }, money(c.cpm) + ' / 1,000 views'),
      el('div', { class: 'campaign-title' }, c.title),
      el('div', { class: 'campaign-brand' }, 'by ' + c.brandName),
      el('div', { class: 'campaign-brief' }, c.brief),
      c.requirements ? el('div', { class: 'campaign-brief' }, 'Requirements: ' + c.requirements) : null,
      urlInput,
      submitBtn,
      msg,
      ]));
  });
  wrap.appendChild(grid);

wrap.appendChild(el('h2', { style: 'margin-top:32px;' }, 'Your submissions'));
  if (!mineData.submissions.length) {
    wrap.appendChild(el('div', { class: 'empty-state' }, 'You have not submitted any clips yet.'));
  } else {
    const table = el('table', {});
    table.appendChild(el('tr', {}, [
      el('th', {}, 'Clip'), el('th', {}, 'Views'), el('th', {}, 'Payout'), el('th', {}, 'Status'),
      ]));
    mineData.submissions.forEach(function (s) {
      table.appendChild(el('tr', {}, [
        el('td', {}, el('a', { href: s.clipUrl, target: '_blank' }, 'View clip')),
        el('td', {}, String(s.views)),
        el('td', {}, money(s.payout)),
        el('td', {}, el('span', { class: 'status-pill status-' + s.status }, s.status)),
        ]));
    });
    wrap.appendChild(table);
  }

return wrap;
}

function renderNotFound() {
  return el('div', { class: 'empty-state' }, 'Page not found.');
}

document.addEventListener('DOMContentLoaded', async function () {
  buildShell();
  await loadUser();
  render();
});
window.addEventListener('hashchange', render);
