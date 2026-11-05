(function () {

  /* ── Confirm helper ──────────────────────────────────────────────────────── */
  function confirm(opts) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,5,15,.7);display:flex;align-items:center;justify-content:center;z-index:999;padding:20px;backdrop-filter:blur(4px)';
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--s1);border:1px solid var(--line2);border-radius:12px;padding:24px;width:min(400px,100%);display:flex;flex-direction:column;gap:14px;box-shadow:0 12px 40px rgba(0,0,0,.6)';
    box.innerHTML = '<h3 style="margin:0;font-size:18px;font-weight:700;color:var(--ink)">' + opts.title + '</h3>'
      + '<p style="margin:0;font-size:14px;color:var(--mute);line-height:1.6">' + opts.body + '</p>'
      + '<div style="display:flex;gap:8px;justify-content:flex-end">'
          + '<button class="btn o" id="ac-cancel">Kanselahin</button>'
          + '<button class="btn' + (opts.okClass ? ' ' + opts.okClass : ' ac') + '" id="ac-ok">' + (opts.okLabel || 'Kumpirmahin') + '</button>'
      + '</div>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    function close() { document.body.removeChild(overlay); }
    box.querySelector('#ac-cancel').addEventListener('click', close);
    box.querySelector('#ac-ok').addEventListener('click', function () { close(); opts.onOk(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  }

  /* ── Auth guard ──────────────────────────────────────────────────────────── */
  var raw  = localStorage.getItem('agapalert_user');
  var user = null;
  try { user = JSON.parse(raw); } catch (e) {}

  if (!user || user.role !== 'admin') {
    window.location.href = 'login.html';
    return;
  }

  fetch('api/me.php', { credentials: 'same-origin' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.ok || data.user.role !== 'admin') {
        localStorage.removeItem('agapalert_user');
        window.location.href = 'login.html';
      }
    })
    .catch(function () { /* offline — continue with cached user */ });

  document.getElementById('admin-name').textContent = user.full_name;

  /* ── Main navbar (same as dashboard) ─────────────────────────────────────── */
  var MAIN_NAV = [
    { tab: 'radar',    label: 'Live map',    href: 'index.html?tab=radar' },
    { tab: 'centers',  label: 'Shelters',    href: 'index.html?tab=centers' },
    { tab: 'reports',  label: 'Reports',     href: 'index.html?tab=reports' },
    { tab: 'hotlines', label: 'Hotlines',    href: 'index.html?tab=hotlines' },
    { tab: 'admin',    label: 'Admin panel', href: 'admin.html' }
  ];

  function renderMainNav() {
    var tabsEl = document.getElementById('main-tabs');
    var bnEl   = document.getElementById('bn');
    if (!tabsEl) return;

    tabsEl.innerHTML = MAIN_NAV.map(function (item) {
      if (item.tab === 'admin') {
        return '<button type="button" aria-current="page">' + item.label + '</button>';
      }
      return '<a href="' + item.href + '">' + item.label + '</a>';
    }).join('');

    if (bnEl) {
      bnEl.innerHTML = MAIN_NAV.map(function (item) {
        var cur = item.tab === 'admin' ? ' aria-current="page"' : '';
        if (item.tab === 'admin') {
          return '<button type="button"' + cur + '>' + item.label + '</button>';
        }
        return '<button type="button"' + cur + ' onclick="location.href=\'' + item.href + '\'">' + item.label + '</button>';
      }).join('');
    }
  }

  renderMainNav();

  /* ── Sign out ────────────────────────────────────────────────────────────── */
  document.getElementById('signout-btn').addEventListener('click', function () {
    confirm({
      title: 'Mag-sign out?',
      body:  'Aalis ka sa iyong account. Kailangan mong mag-sign in ulit.',
      okLabel: 'Sign out', okClass: 'o',
      onOk: function () {
        fetch('api/logout.php', { method: 'POST', credentials: 'same-origin' })
          .finally(function () {
            localStorage.removeItem('agapalert_user');
            window.location.href = 'login.html';
          });
      }
    });
  });

  /* ── Theme ───────────────────────────────────────────────────────────────── */
  var root      = document.documentElement;
  var themeBtn  = document.getElementById('theme-btn');
  var themeIcon = document.getElementById('theme-icon');

  var MOON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  var SUN  = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>';

  function applyTheme(dark) {
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    themeIcon.innerHTML = dark ? MOON : SUN;
    try { localStorage.setItem('agapalert_theme', dark ? 'dark' : 'light'); } catch (e) {}
  }

  applyTheme(localStorage.getItem('agapalert_theme') !== 'light');
  themeBtn.addEventListener('click', function () {
    applyTheme(root.getAttribute('data-theme') !== 'dark');
  });

  /* ── Settings dropdown ───────────────────────────────────────────────────── */
  var settingsBtn      = document.getElementById('settings-btn');
  var settingsDropdown = document.getElementById('settings-dropdown');

  settingsBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = settingsDropdown.classList.toggle('open');
    settingsBtn.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', function (e) {
    if (!settingsDropdown.contains(e.target) && e.target !== settingsBtn) {
      settingsDropdown.classList.remove('open');
      settingsBtn.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      settingsDropdown.classList.remove('open');
      settingsBtn.setAttribute('aria-expanded', 'false');
    }
  });

  /* ── Tab switching ───────────────────────────────────────────────────────── */
  document.getElementById('admin-tabs').addEventListener('click', function (e) {
    var btn = e.target.closest('.admin-tab');
    if (!btn) return;
    document.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-panel').forEach(function (p) { p.style.display = 'none'; });
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.tab).style.display = '';
  });

  /* ── Toast ───────────────────────────────────────────────────────────────── */
  var _tt;
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(_tt);
    _tt = setTimeout(function () { el.classList.remove('on'); }, 2400);
  }

  /* ── API helper ──────────────────────────────────────────────────────────── */
  function api(url, options) {
    return fetch(url, Object.assign({ credentials: 'same-origin' }, options))
      .then(function (r) { return r.json(); });
  }

  /* ── Invite codes ────────────────────────────────────────────────────────── */
  function renderCodes() {
    var tbody = document.getElementById('code-tbody');
    var empty = document.getElementById('code-empty');
    tbody.innerHTML = '<tr><td colspan="6" style="padding:1.2rem;color:var(--dim)">Kumukuha…</td></tr>';

    api('api/admin/codes.php')
      .then(function (data) {
        if (!data.ok) { toast('Hindi ma-load ang mga code.'); return; }
        var codes = data.codes;
        if (codes.length === 0) {
          tbody.innerHTML = '';
          empty.style.display = '';
          return;
        }
        empty.style.display = 'none';
        tbody.innerHTML = codes.map(function (c) {
          var badgeCls = c.status === 'unused' ? 'badge-unused' : c.status === 'used' ? 'badge-used' : 'badge-expired';
          var badgeTxt = c.status === 'unused' ? 'Hindi pa ginamit' : c.status === 'used' ? 'Ginamit na' : 'Nag-expire na';
          return '<tr>'
            + '<td><button class="code-mono" title="I-click para kopyahin" data-copy="' + c.code + '">' + c.code + '</button></td>'
            + '<td style="color:var(--mute)">' + (c.note || '<span style="color:var(--dim)">—</span>') + '</td>'
            + '<td style="color:var(--dim);font-size:13px">' + c.created_at.slice(0, 16).replace('T', ' ') + '</td>'
            + '<td><span class="badge ' + badgeCls + '">' + badgeTxt + '</span></td>'
            + '<td style="color:var(--dim);font-size:13px">' + (c.used_by_name || '—') + '</td>'
            + '<td>' + (c.status === 'unused' ? '<button class="btn-revoke" data-id="' + c.id + '">Bawiin</button>' : '') + '</td>'
          + '</tr>';
        }).join('');

        tbody.querySelectorAll('[data-copy]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            navigator.clipboard.writeText(this.dataset.copy)
              .then(function () { toast('Na-kopya ang code sa clipboard.'); });
          });
        });

        tbody.querySelectorAll('[data-id]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.dataset.id;
            confirm({
              title: 'Bawiin ang invite code?',
              body:  'Hindi na magagamit ang code na ito. Hindi ito mababawi.',
              okLabel: 'Bawiin', okClass: 'o',
              onOk: function () {
                api('api/admin/codes.php?id=' + id, { method: 'DELETE' })
                  .then(function (data) {
                    if (!data.ok) { toast(data.error || 'Hindi mabawi ang code.'); return; }
                    renderCodes();
                    toast('Nabawi ang code.');
                  });
              }
            });
          });
        });
      })
      .catch(function () { toast('Hindi ma-load ang mga code.'); });
  }

  document.getElementById('gen-btn').addEventListener('click', function () {
    var note = document.getElementById('gen-note').value.trim();
    var btn  = this;
    btn.disabled = true;

    api('api/admin/codes.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ note: note }),
    })
      .then(function (data) {
        btn.disabled = false;
        if (!data.ok) { toast(data.error || 'Hindi nagawa ang code.'); return; }
        document.getElementById('gen-note').value = '';
        renderCodes();
        toast('Code ' + data.code + ' nagawa na. I-click para kopyahin.');
      })
      .catch(function () { btn.disabled = false; toast('Hindi ma-reach ang server.'); });
  });

  /* ── Pending approvals ───────────────────────────────────────────────────── */
  function renderPending() {
    var el    = document.getElementById('pending-list');
    var count = document.getElementById('pending-count');
    var badge = document.getElementById('tab-pending-count');
    el.innerHTML = '<div class="empty">Kumukuha…</div>';

    api('api/admin/pending.php')
      .then(function (data) {
        if (!data.ok) { toast('Hindi ma-load ang mga kahilingan.'); return; }
        var pending = data.pending;
        count.textContent = pending.length + ' naghihintay';
        count.className   = 'badge ' + (pending.length > 0 ? 'badge-pending' : 'badge-used');
        badge.textContent = pending.length;
        badge.className   = 'tab-badge' + (pending.length > 0 ? ' on' : '');

        if (pending.length === 0) {
          el.innerHTML = '<div class="empty">Walang mga kahilingang naghihintay.</div>';
          return;
        }

        el.innerHTML = pending.map(function (u) {
          return '<div class="approval-row">'
            + '<div class="approval-info">'
                + '<strong>' + u.full_name + '</strong>'
                + '<span>'
                    + (u.email || u.phone_number || '')
                    + (u.barangay_name ? ' &mdash; ' + u.barangay_name + (u.barangay_city ? ', ' + u.barangay_city : '') : '')
                + '</span>'
            + '</div>'
            + '<div class="approval-actions">'
                + '<button class="btn-approve" data-id="' + u.id + '">Aprubahan</button>'
                + '<button class="btn-reject"  data-id="' + u.id + '">Tanggihan</button>'
            + '</div>'
          + '</div>';
        }).join('');

        el.querySelectorAll('.btn-approve').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = parseInt(this.dataset.id);
            var name = btn.closest('.approval-row').querySelector('strong').textContent;
            confirm({
              title: 'Aprubahan ang kahilingan?',
              body:  'Ibibigay ang opisyal na access kay <b>' + name + '</b>.',
              okLabel: 'Aprubahan', okClass: 'ac',
              onOk: function () {
                btn.disabled = true;
                api('api/admin/pending.php', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: id, action: 'approve' }),
                }).then(function (data) {
                  if (!data.ok) { toast(data.error || 'Nabigo.'); btn.disabled = false; return; }
                  renderPending(); renderOfficials(); toast('Ibinigay na ang opisyal na access.');
                });
              }
            });
          });
        });

        el.querySelectorAll('.btn-reject').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = parseInt(this.dataset.id);
            var name = btn.closest('.approval-row').querySelector('strong').textContent;
            confirm({
              title: 'Tanggihan ang kahilingan?',
              body:  'Tatanggihan ang kahilingan ni <b>' + name + '</b>.',
              okLabel: 'Tanggihan', okClass: 'o',
              onOk: function () {
                btn.disabled = true;
                api('api/admin/pending.php', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: id, action: 'reject' }),
                }).then(function (data) {
                  if (!data.ok) { toast(data.error || 'Nabigo.'); btn.disabled = false; return; }
                  renderPending(); toast('Tinanggihan ang kahilingan.');
                });
              }
            });
          });
        });
      })
      .catch(function () { toast('Hindi ma-load ang mga kahilingan.'); });
  }

  /* ── Officials ───────────────────────────────────────────────────────────── */
  function renderOfficials() {
    var el      = document.getElementById('officials-list');
    var countEl = document.getElementById('officials-count');
    el.innerHTML = '<div class="empty">Kumukuha…</div>';

    api('api/admin/officials.php')
      .then(function (data) {
        if (!data.ok) { toast('Hindi ma-load ang mga opisyal.'); return; }
        var officials = data.officials;
        countEl.textContent = officials.length + ' opisyal';

        if (officials.length === 0) {
          el.innerHTML = '<div class="empty">Wala pang mga aprubadong opisyal.</div>';
          return;
        }

        el.innerHTML = officials.map(function (u) {
          var avatar = u.avatar_path ? '<img src="' + u.avatar_path + '" alt="">' : (u.full_name || '?').charAt(0).toUpperCase();
          return '<div class="officials-row">'
            + '<div class="officials-avatar">' + avatar + '</div>'
            + '<div class="officials-info">'
                + '<strong>' + u.full_name + '</strong>'
                + '<span>'
                    + (u.barangay_name ? u.barangay_name + (u.barangay_city ? ', ' + u.barangay_city : '') : '')
                    + (u.email ? ' &mdash; ' + u.email : '')
                    + (!u.email && u.phone_number ? u.phone_number : '')
                + '</span>'
            + '</div>'
            + '<span class="badge badge-active" style="margin-right:0.5rem">Aktibo</span>'
            + '<button class="btn-revoke" data-id="' + u.id + '">Bawiin</button>'
          + '</div>';
        }).join('');

        el.querySelectorAll('[data-id]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (!confirm('Bawiin ang opisyal na access? Magiging residente ulit ang user na ito.')) return;
            var id = parseInt(this.dataset.id);
            btn.disabled = true;
            api('api/admin/officials.php', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: id }),
            }).then(function (data) {
              if (!data.ok) { toast(data.error || 'Nabigo.'); btn.disabled = false; return; }
              renderOfficials(); toast('Nabawi ang opisyal na access.');
            });
          });
        });
      })
      .catch(function () { toast('Hindi ma-load ang mga opisyal.'); });
  }

  /* ── Flood level ─────────────────────────────────────────────────────────── */
  var LEVEL_LABELS = ['Normal', 'Bantay', 'Babala', 'Kritikal'];
  var LEVEL_BADGES = ['badge-active', 'badge-unused', 'badge-pending', 'badge-expired'];

  function renderFlood() {
    api('api/flood.php')
      .then(function (data) {
        if (!data.ok) return;
        var f   = data.flood;
        var lv  = parseInt(f.level) || 0;
        var bdg = document.getElementById('flood-current-badge');
        bdg.textContent = 'Kasalukuyan: Antas ' + lv + ' — ' + LEVEL_LABELS[lv];
        bdg.className   = 'badge ' + LEVEL_BADGES[lv];

        // Pre-fill form
        document.getElementById('flood-level').value = lv;
        if (f.wind_kmh) document.getElementById('flood-wind').value = parseFloat(f.wind_kmh);
        if (f.rain_mmh) document.getElementById('flood-rain').value = parseFloat(f.rain_mmh);
      })
      .catch(function () {});
  }

  document.getElementById('flood-btn').addEventListener('click', function () {
    var btn   = this;
    var level = parseInt(document.getElementById('flood-level').value);
    var wind  = parseFloat(document.getElementById('flood-wind').value)  || 0;
    var rain  = parseFloat(document.getElementById('flood-rain').value)  || 0;
    var notes = document.getElementById('flood-notes').value.trim();

    confirm({
      title: 'I-update ang antas ng baha?',
      body:  'Itatakda ang antas sa <b>Antas ' + level + ' — ' + LEVEL_LABELS[level] + '</b>.'
           + (level >= 1 ? ' Magpapadala ng SMS sa mga residente.' : ''),
      okLabel: 'I-update', okClass: 'ac',
      onOk: function () {
        btn.disabled = true;
        btn.textContent = 'Ina-update…';
        api('api/flood.php', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ level: level, wind_kmh: wind, rain_mmh: rain, notes: notes, notify_sms: level >= 1 })
        })
          .then(function (data) {
            btn.disabled    = false;
            btn.textContent = 'I-update ang Antas';
            if (!data.ok) { toast(data.error || 'Hindi na-update.'); return; }
            document.getElementById('flood-notes').value = '';
            renderFlood();
            var sms = data.sms || {};
            var smsTxt = sms.sent > 0 ? ' · ' + sms.sent + ' SMS' : (sms.note ? ' · ' + sms.note : '');
            toast('Antas ng baha na-update sa Antas ' + level + ' — ' + LEVEL_LABELS[level] + smsTxt);
          })
          .catch(function () {
            btn.disabled    = false;
            btn.textContent = 'I-update ang Antas';
            toast('Hindi ma-reach ang server.');
          });
      }
    });
  });

  /* ── Shelter occupancy ───────────────────────────────────────────────────── */
  function renderShelters() {
    var el = document.getElementById('shelters-list');
    el.innerHTML = '<div class="empty">Kumukuha…</div>';

    api('api/admin/shelters.php')
      .then(function (data) {
        if (!data.ok) { toast('Hindi ma-load ang mga likasan.'); return; }
        var shelters = data.shelters;

        if (!shelters.length) {
          el.innerHTML = '<div class="empty">Walang likasan sa database. Mag-import ng database.sql.</div>';
          return;
        }

        el.innerHTML = shelters.map(function (s) {
          var pct = s.capacity > 0 ? Math.round(s.occupancy / s.capacity * 100) : 0;
          var barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#22c55e';
          return '<div class="approval-row" style="flex-direction:column;align-items:stretch;gap:0.75rem" id="shelter-row-' + s.id + '">'
            + '<div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">'
                + '<div style="flex:1;min-width:180px">'
                    + '<strong style="font-size:14px;color:var(--ink)">' + s.name + '</strong>'
                    + '<span style="display:block;font-size:12.5px;color:var(--mute)">'
                        + (s.barangay_name || '') + (s.contact ? ' · ' + s.contact : '')
                    + '</span>'
                + '</div>'
                + '<span class="badge ' + (s.is_open ? 'badge-active' : 'badge-expired') + '">'
                    + (s.is_open ? 'Bukas' : 'Sarado')
                + '</span>'
            + '</div>'
            + '<div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">'
                + '<div style="flex:1;min-width:200px">'
                    + '<div style="height:8px;background:var(--s2);border-radius:4px;overflow:hidden;margin-bottom:4px">'
                        + '<div style="height:100%;width:' + pct + '%;background:' + barColor + ';border-radius:4px;transition:width 0.3s"></div>'
                    + '</div>'
                    + '<span style="font-size:12.5px;color:var(--mute)">' + s.occupancy + ' / ' + s.capacity + ' (' + pct + '% puno)</span>'
                + '</div>'
                + '<div style="display:flex;align-items:center;gap:0.5rem;flex-shrink:0">'
                    + '<label class="gen-label" style="margin:0;white-space:nowrap">Bilang ng tao:</label>'
                    + '<input class="gen-input" style="width:90px;padding:0.4rem 0.6rem" type="number" min="0" max="' + s.capacity + '" value="' + s.occupancy + '" id="occ-' + s.id + '">'
                    + '<button class="gen-btn" style="padding:0.4rem 0.9rem;font-size:13px" data-shelter-id="' + s.id + '" data-capacity="' + s.capacity + '">I-save</button>'
                    + '<button class="btn-revoke" style="padding:0.35rem 0.75rem;font-size:12.5px" data-shelter-toggle="' + s.id + '" data-open="' + s.is_open + '">'
                        + (s.is_open ? 'Isara' : 'Buksan')
                    + '</button>'
                + '</div>'
            + '</div>'
          + '</div>';
        }).join('');

        // Save occupancy
        el.querySelectorAll('[data-shelter-id]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id  = parseInt(this.dataset.shelterId);
            var cap = parseInt(this.dataset.capacity);
            var occ = parseInt(document.getElementById('occ-' + id).value) || 0;
            if (occ > cap) { toast('Hindi maaaring lampas sa kapasidad (' + cap + ').'); return; }
            btn.disabled = true;
            api('api/admin/shelters.php', {
              method:  'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ id: id, occupancy: occ })
            }).then(function (data) {
              btn.disabled = false;
              if (!data.ok) { toast(data.error || 'Hindi na-update.'); return; }
              renderShelters();
              toast('Occupancy na-update.');
            }).catch(function () { btn.disabled = false; toast('Hindi ma-reach ang server.'); });
          });
        });

        // Toggle open/closed
        el.querySelectorAll('[data-shelter-toggle]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id     = parseInt(this.dataset.shelterToggle);
            var isOpen = parseInt(this.dataset.open);
            var occ    = parseInt(document.getElementById('occ-' + id).value) || 0;
            var action = isOpen ? 'Isara' : 'Buksan';
            confirm({
              title: action + ' ang likasan?',
              body:  isOpen ? 'Isasara ang likasan sa mga bagong dumadating.' : 'Muling bubuksan ang likasan sa mga residente.',
              okLabel: action, okClass: 'ac',
              onOk: function () {
                btn.disabled = true;
                api('api/admin/shelters.php', {
                  method:  'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body:    JSON.stringify({ id: id, occupancy: occ, is_open: isOpen ? 0 : 1 })
                }).then(function (data) {
                  btn.disabled = false;
                  if (!data.ok) { toast(data.error || 'Hindi na-update.'); return; }
                  renderShelters();
                  toast('Status ng likasan na-update.');
                }).catch(function () { btn.disabled = false; });
              }
            });
          });
        });
      })
      .catch(function () { toast('Hindi ma-load ang mga likasan.'); });
  }

  /* ── Initial load ────────────────────────────────────────────────────────── */
  renderPending();
  renderCodes();
  renderOfficials();
  renderFlood();
  renderShelters();

})();
