(function () {

  /* ── Confirm helper ──────────────────────────────────────────────────────── */
  function confirm(opts) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,5,15,.7);display:flex;align-items:center;justify-content:center;z-index:999;padding:20px;backdrop-filter:blur(4px)';
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--s1,#fff);border:1px solid var(--line2,#ddd);border-radius:12px;padding:24px;width:min(400px,100%);display:flex;flex-direction:column;gap:14px;box-shadow:0 12px 40px rgba(0,0,0,.4)';
    box.innerHTML = '<h3 style="margin:0;font-size:18px;font-weight:700;color:var(--ink,#111)">' + opts.title + '</h3>'
      + '<p style="margin:0;font-size:14px;color:var(--mute,#666);line-height:1.6">' + opts.body + '</p>'
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
  if (!user) { window.location.href = 'login.html'; return; }

  /* ── Theme ───────────────────────────────────────────────────────────────── */
  var root     = document.documentElement;
  var themeBtn = document.getElementById('theme-btn');

  function applyTheme(dark) {
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    themeBtn.innerHTML = dark
      ? '<svg class="i"><use href="#i-sun"/></svg>'
      : '<svg class="i"><use href="#i-moon"/></svg>';
    try { localStorage.setItem('agapalert_theme', dark ? 'dark' : 'light'); } catch (e) {}
  }

  var saved = localStorage.getItem('agapalert_theme');
  applyTheme(saved ? saved === 'dark' : true);
  themeBtn.addEventListener('click', function () {
    applyTheme(root.getAttribute('data-theme') !== 'dark');
  });

  /* ── Header chip ─────────────────────────────────────────────────────────── */
  var chip = document.getElementById('user-chip');
  document.getElementById('user-role').textContent =
    user.role === 'admin'    ? 'Administrador' :
    user.role === 'official' ? (user.status === 'pending' ? 'Opisyal (naghihintay)' : 'Opisyal ng Barangay') :
    'Residente';
  chip.style.display = 'flex';

  document.getElementById('signout-btn').addEventListener('click', function () {
    fetch('api/logout.php', { method: 'POST', credentials: 'same-origin' })
      .finally(function () {
        localStorage.removeItem('agapalert_user');
        window.location.href = 'login.html';
      });
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

  /* ── Chip avatar ─────────────────────────────────────────────────────────── */
  function updateChipAvatar() {
    var nameEl    = document.getElementById('user-name');
    var avatarSrc = user.avatar_path || null;
    if (avatarSrc) {
      nameEl.innerHTML = '<img src="' + avatarSrc + '" alt="" style="width:26px;height:26px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:4px">' + (user.full_name || '');
    } else {
      nameEl.textContent = user.full_name || '';
    }
  }
  updateChipAvatar();

  /* ── Populate fields ─────────────────────────────────────────────────────── */
  function populate() {
    var initial   = (user.full_name || '?').charAt(0).toUpperCase();
    var avatarEl  = document.getElementById('avatar-el');
    var initialEl = document.getElementById('avatar-initial');
    var removeBtn = document.getElementById('avatar-remove');
    var avatarSrc = user.avatar_path || null;

    if (avatarSrc) {
      initialEl.style.display = 'none';
      var existImg = avatarEl.querySelector('img');
      if (!existImg) {
        var img = document.createElement('img');
        img.alt = user.full_name || '';
        avatarEl.appendChild(img);
        existImg = img;
      }
      existImg.src = avatarSrc;
      removeBtn.style.display = 'block';
    } else {
      initialEl.style.display = '';
      initialEl.textContent   = initial;
      var oldImg = avatarEl.querySelector('img');
      if (oldImg) oldImg.remove();
      removeBtn.style.display = 'none';
    }

    document.getElementById('display-name').textContent = user.full_name || '—';
    document.getElementById('display-sub').textContent  =
      (user.barangay_name ? user.barangay_name + (user.barangay_city ? ', ' + user.barangay_city : '') : '')
      || (user.email || user.phone_number || '');

    var badge   = document.getElementById('role-badge');
    var isAdmin = user.role === 'admin';
    var isOff   = user.role === 'official';
    var isPend  = isOff && user.status === 'pending';
    badge.textContent = isAdmin ? 'Administrador' : isPend ? 'Opisyal — naghihintay' : isOff ? 'Opisyal ng Barangay' : 'Residente';
    badge.className   = 'role-badge ' + (isAdmin ? 'role-admin' : isPend ? 'role-pending' : isOff ? 'role-official' : 'role-resident');

    document.getElementById('pending-notice').style.display  = isPend             ? '' : 'none';
    document.getElementById('official-notice').style.display = (isOff && !isPend) ? '' : 'none';

    document.getElementById('pf-name').value  = user.full_name    || '';
    document.getElementById('pf-phone').value = user.phone_number || '';
    document.getElementById('pf-email').value = user.email        || '';
    document.getElementById('pf-brgy').value  = user.barangay_id  ? String(user.barangay_id) : '';
  }

  populate();

  /* ── Avatar upload ───────────────────────────────────────────────────────── */
  document.getElementById('avatar-input').addEventListener('change', function () {
    var file = this.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { alert('Ang larawan ay dapat wala pang 4 MB.'); return; }

    var formData = new FormData();
    formData.append('avatar', file);

    fetch('api/profile/avatar.php', { method: 'POST', credentials: 'same-origin', body: formData })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok) { alert(data.error || 'Nabigo ang pag-upload.'); return; }
        user.avatar_path = data.avatar_path;
        localStorage.setItem('agapalert_user', JSON.stringify(user));
        populate();
        updateChipAvatar();
      })
      .catch(function () { alert('Nabigo ang pag-upload. Suriin ang iyong koneksyon.'); });

    this.value = '';
  });

  document.getElementById('avatar-remove').addEventListener('click', function () {
    confirm({
      title: 'Remove profile picture?',
      body:  'Your profile picture will be deleted. You can upload a new one any time.',
      okLabel: 'Remove', okClass: 'o',
      onOk: function () {
        fetch('api/profile/avatar.php', { method: 'DELETE', credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data.ok) return;
            user.avatar_path = null;
            localStorage.setItem('agapalert_user', JSON.stringify(user));
            populate();
            updateChipAvatar();
          });
      }
    });
  });

  document.getElementById('avatar-el').addEventListener('click', function () {
    document.getElementById('avatar-input').click();
  });

  /* ── Validation helpers ──────────────────────────────────────────────────── */
  function showErr(id, msg) {
    var el = document.getElementById('err-' + id);
    if (!el) return;
    el.textContent   = msg;
    el.style.display = msg ? 'block' : 'none';
    var inp = document.getElementById('pf-' + id);
    if (inp) inp.classList.toggle('error', !!msg);
  }
  function clearErrs(ids) { ids.forEach(function (id) { showErr(id, ''); }); }

  function flashStatus(id) {
    var el = document.getElementById(id);
    el.classList.add('on');
    setTimeout(function () { el.classList.remove('on'); }, 2500);
  }

  /* ── Save personal info ──────────────────────────────────────────────────── */
  document.getElementById('save-info').addEventListener('click', function () {
    clearErrs(['name', 'phone', 'email', 'brgy']);

    var name  = document.getElementById('pf-name').value.trim();
    var phone = document.getElementById('pf-phone').value.trim();
    var email = document.getElementById('pf-email').value.trim().toLowerCase();
    var brgy  = document.getElementById('pf-brgy').value;
    var ok    = true;

    if (name.length < 2) { showErr('name', 'Ilagay ang iyong buong pangalan.'); ok = false; }
    if (phone && !/^[0-9+()\-\s]{7,40}$/.test(phone)) { showErr('phone', 'Mukhang mali ang numero ng mobile.'); ok = false; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr('email', 'Mukhang mali ang email address.'); ok = false; }
    if (!brgy) { showErr('brgy', 'Piliin ang iyong barangay.'); ok = false; }
    if (!ok) return;

    var btn  = document.getElementById('save-info');
    btn.disabled = true;

    fetch('api/profile/update.php', {
      method:      'POST',
      credentials: 'same-origin',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ full_name: name, phone_number: phone || null, email: email || null, barangay_id: parseInt(brgy, 10) }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        btn.disabled = false;
        if (!data.ok) {
          if (data.errors) Object.keys(data.errors).forEach(function (f) { showErr(f === 'phone_number' ? 'phone' : f, data.errors[f]); });
          return;
        }
        user = data.user;
        localStorage.setItem('agapalert_user', JSON.stringify(user));
        populate();
        updateChipAvatar();
        flashStatus('info-saved');
      })
      .catch(function () { btn.disabled = false; showErr('name', 'Hindi ma-reach ang server.'); });
  });

  /* ── Save password ───────────────────────────────────────────────────────── */
  document.getElementById('save-pw').addEventListener('click', function () {
    clearErrs(['pw1', 'pw2']);
    var pw1 = document.getElementById('pf-pw1').value;
    var pw2 = document.getElementById('pf-pw2').value;
    var ok  = true;

    if (!pw1 || pw1.length < 8) { showErr('pw1', 'Hindi bababa sa 8 na character.'); ok = false; }
    if (pw1 !== pw2)             { showErr('pw2', 'Hindi magkatugma ang mga password.'); ok = false; }
    if (!ok) return;

    confirm({
      title: 'Baguhin ang password?',
      body:  'Papalitan ang iyong kasalukuyang password. Kailangan mong gamitin ang bagong password sa susunod na pag-sign in.',
      okLabel: 'Baguhin', okClass: 'ac',
      onOk: function () {
        var btn = document.getElementById('save-pw');
        btn.disabled = true;
        fetch('api/profile/password.php', {
          method:      'POST',
          credentials: 'same-origin',
          headers:     { 'Content-Type': 'application/json' },
          body:        JSON.stringify({ password: pw1, password_confirm: pw2 }),
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            btn.disabled = false;
            if (!data.ok) {
              if (data.errors) Object.keys(data.errors).forEach(function (f) { showErr(f, data.errors[f]); });
              return;
            }
            document.getElementById('pf-pw1').value = '';
            document.getElementById('pf-pw2').value = '';
            flashStatus('pw-saved');
          })
          .catch(function () { btn.disabled = false; showErr('pw1', 'Hindi ma-reach ang server.'); });
      }
    });
  });

  /* ── Sign out ────────────────────────────────────────────────────────────── */
  document.getElementById('signout-page').addEventListener('click', function () {
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

  /* ── Delete account ──────────────────────────────────────────────────────── */
  document.getElementById('delete-account').addEventListener('click', function () {
    if (!confirm('Burahin ang iyong account? Hindi ito maaaring ibalik.')) return;
    fetch('api/logout.php', { method: 'POST', credentials: 'same-origin' })
      .finally(function () {
        localStorage.removeItem('agapalert_user');
        window.location.href = 'login.html';
      });
  });

})();
