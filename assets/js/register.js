/**
 * register.js — creates an account via api/register.php
 *
 * Everyone signs up as a resident. Checking "I have an invite code"
 * submits the code to the backend, which validates it and sets the
 * account as a pending official.
 */

/* ── UI helpers ─────────────────────────────────────────────────────────────── */
function fieldError(fieldId, msg) {
  var el = document.getElementById('err-' + fieldId);
  if (!el) return;
  el.textContent = msg;
  var input = document.getElementById(fieldId) || document.querySelector('[name="' + fieldId + '"]');
  if (input) input.classList.toggle('is-invalid', !!msg);
}

function clearErrors() {
  ['full_name', 'email', 'phone', 'barangay_id',
   'password', 'password_confirm', 'invite_code'].forEach(function (f) {
    fieldError(f, '');
  });
}

function setLoading(loading) {
  var btn = document.querySelector('#register-form button[type="submit"]');
  btn.disabled    = loading;
  btn.textContent = loading ? 'Creating account…' : 'Create account';
}

/* ── Invite code toggle ─────────────────────────────────────────────────────── */
document.getElementById('has-invite').addEventListener('change', function () {
  var field = document.getElementById('invite-code-field');
  field.style.display = this.checked ? '' : 'none';
  if (!this.checked) {
    document.getElementById('invite_code').value = '';
    fieldError('invite_code', '');
  }
});

/* ── Form submission ────────────────────────────────────────────────────────── */
document.getElementById('register-form').addEventListener('submit', function (e) {
  e.preventDefault();
  clearErrors();

  var form      = e.target;
  var name      = form.full_name.value.trim();
  var phone     = form.phone.value.trim();
  var email     = form.email.value.trim().toLowerCase();
  var brgyId    = form.barangay_id.value;
  var pass      = form.password.value;
  var conf      = form.password_confirm.value;
  var hasInvite = document.getElementById('has-invite').checked;
  var code      = hasInvite ? form.invite_code.value.trim() : '';

  // Client-side pre-validation (mirrors server rules)
  var errors = {};

  if (name.length < 2 || name.length > 160)
    errors['full_name'] = 'Enter your full name.';

  if (!/^[0-9+()\-\s]{7,40}$/.test(phone))
    errors['phone'] = 'Enter a valid mobile number.';

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors['email'] = 'Enter a valid email address.';

  if (!brgyId)
    errors['barangay_id'] = 'Select your barangay.';

  if (pass.length < 8)
    errors['password'] = 'Password must be at least 8 characters.';
  else if (pass.length > 72)
    errors['password'] = 'Password is too long (max 72 characters).';

  if (pass !== conf)
    errors['password_confirm'] = 'Passwords do not match.';

  if (hasInvite && !code)
    errors['invite_code'] = 'Enter the invite code, or uncheck the box.';

  if (Object.keys(errors).length > 0) {
    Object.keys(errors).forEach(function (f) { fieldError(f, errors[f]); });
    return;
  }

  setLoading(true);

  var payload = {
    full_name:    name,
    phone_number: phone,
    email:        email || null,
    barangay_id:  parseInt(brgyId, 10),
    password:     pass,
  };
  if (hasInvite && code) payload.invite_code = code;

  fetch('api/register.php', {
    method:      'POST',
    credentials: 'same-origin',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(payload),
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.ok) {
        // Map server-side field errors back to the form
        if (data.errors) {
          Object.keys(data.errors).forEach(function (f) {
            // server uses phone_number, form uses phone
            var formField = f === 'phone_number' ? 'phone' : f;
            fieldError(formField, data.errors[f]);
          });
        } else {
          fieldError('full_name', data.error || 'Registration failed.');
        }
        setLoading(false);
        return;
      }

      // Cache user and redirect
      localStorage.setItem('agapalert_user', JSON.stringify(data.user));
      localStorage.setItem('agapalert_flash', JSON.stringify({
        type:    data.user.role === 'official' ? 'warning' : 'success',
        message: data.message,
      }));

      window.location.href = 'index.html';
    })
    .catch(function () {
      fieldError('full_name', 'Could not reach the server. Check your connection.');
      setLoading(false);
    });
});
