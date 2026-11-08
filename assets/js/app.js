(function () {

  var _raw  = localStorage.getItem('agapalert_user');
  var _user = null;
  if (_raw) {
    try { _user = JSON.parse(_raw); } catch (e) { _user = null; }
  }
  if (!_user) {
    window.location.href = 'login.html';
    return;
  }

  // Background session check — redirect if server session is gone
  fetch('api/me.php', { credentials: 'same-origin' })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.ok) {
        localStorage.removeItem('agapalert_user');
        window.location.href = 'login.html';
        return;
      }
      // Keep localStorage in sync with DB (role/status may have changed)
      localStorage.setItem('agapalert_user', JSON.stringify(data.user));
    })
    .catch(function () { /* offline — keep going with cached user */ });

  var _isOfficial = _user.role === 'official';
  var _isAdmin    = _user.role === 'admin';
  var _isPending  = _user.role === 'official' && _user.status === 'pending';

  // Sign-out and user info are handled in the sidebar footer (see _updateSidebarUserChip)

  /* ── Helpers ─────────────────────────────────────────────────────────────── */
  var $ = function (s) { return document.querySelector(s); };

  var ic = function (name, extra) {
    return '<svg class="i"' + (extra || '') + '><use href="#i-' + name + '"/></svg>';
  };

  var LOGO = 'assets/img/logo.png';

  /* ── Copy strings (EN / FIL) ─────────────────────────────────────────────── */
  var D = {
    en: {
      map: 'Live map', sh: 'Shelters', rp: 'Reports', inc: 'Incidents',
      hot: 'Hotlines', sos: 'Request rescue', pubb: 'Publish advisory',
      goNow: 'Go now', near: 'Nearest shelter', walk: 'min on foot',
      left: 'places left', route: 'Show route', shown: 'Route shown',
      close: 'Close', todo: 'What to do',
      wind: 'Wind', rain: 'Rain', space: 'Shelter space',
      upd: 'Updated', saved: 'Saved',
      off1: 'No connection.',
      off2: 'Showing saved information. Numbers may be out of date.',
      offb: 'Send SOS by SMS',
      l_flood: 'Flood zone', l_sh: 'Shelters', l_inc: 'Incidents',
      callTxt: 'Call', issuer: 'MDRRMO Santa Barbara', alarm: 'Alarm',
      lv: ['Normal', 'Watch', 'Warning', 'Critical'],
      ti: [
        'Conditions normal',
        'Monitor flood conditions',
        'Preparatory evacuation advised',
        'Forced evacuation in effect'
      ],
      td: [
        [
          'Keep your phone charged and alerts on.',
          'Know which shelter is nearest to your home.',
          'Check this page again if heavy rain starts.'
        ],
        [
          'Pack your go-bag: water, food, medicines, documents.',
          'Agree a meeting place with your family.',
          'Be ready to leave if the level reaches 6.0 m.'
        ],
        [
          'Leave low-lying and riverside homes now.',
          'Take your go-bag, IDs and medicines.',
          'Walk to Dalongue Barangay Evacuation Hall, 0.4 km away.'
        ],
        [
          'Leave now and avoid flooded roads.',
          'Go to the nearest high-ground shelter.',
          'If you cannot leave, call the MDRRMO on (075) 518-2024.'
        ]
      ],
      // UI labels
      weather: 'Weather', lastRefresh: 'Last refreshed', now: 'just now',
      centersOpen: 'open near Dalongue',
      hide: 'Hide', details: 'Details',
      contact: 'Contact', supplies: 'Supplies',
      updateCount: 'Update the number of people:', save: 'Save',
      rpTitleOff: 'Incident Queue', rpTitleRes: 'Community Reports',
      rpSubOff: 'Every SOS is surfaced regardless of trust level.',
      rpSubRes: 'Reports from people in your area.',
      repBtn: 'Report an Incident',
      loadMore: 'Load more…', loading: 'Loading…',
      cancel: 'Cancel', confirmBtn: 'Confirm',
      // SOS form
      sosHint: 'Press and hold the button for 1 second to send an SOS.',
      holdBtn: 'Hold to send SOS',
      decrease: 'Decrease', increase: 'Increase',
      people: 'person', peoplePl: 'people',
      depAnkle: 'Ankle-deep', depKnee: 'Knee-deep',
      depWaist: 'Waist-deep', depChest: 'Chest-deep or higher',
      phonePlaceholder: 'Your phone number (optional)',
      phoneLbl: 'Phone number',
      sosLocNote: 'Your location will be used for rescue.',
      sendSms: 'Send SMS',
      // SOS sent
      sosSent: 'SOS Sent',
      sosBody: 'Help is on the way. Stay in a safe place.',
      s1: 'Received', s2: 'Seen by your barangay', s3: 'Help is coming',
      sosCancelBtn: 'I am safe, cancel the SOS',
      savedOffline: 'Saved locally — will send when connected.',
      // SOS cancel confirm
      sosSafeTitle: 'Cancel the SOS?',
      sosSafeBody: 'Your barangay will be informed that you are safe. Only cancel if you are truly safe.',
      sosSafeOk: 'Yes, I am safe',
      sosSafeToast: 'SOS cancelled. Your barangay has been informed you are safe.',
      // Report form
      repFormTitle: 'Report an Incident',
      typFlood: 'Flood', typMedical: 'Medical', typRelief: 'Relief', typDebris: 'Debris',
      repTitlePlaceholder: 'What is happening?', repTitleLbl: 'Title',
      repDescPlaceholder: 'Describe the situation (optional)', repDescLbl: 'Description',
      repLocLbl: 'Location', repLocNote: 'The location can be changed if needed.',
      repSend: 'Send Report',
      repRequired: 'Please describe the incident.',
      repSentOk: 'Report sent.', repSentOffline: 'Saved. Will send when signal is available.',
      // Publish advisory form
      areas: 'Areas', reach: 'Reach',
      reachDisabled: 'registered (enable SMS in config)',
      reachLoading: 'Loading count…',
      pubReview: 'Review the Critical advisory',
      pubConfirm: 'Confirm and publish the Critical advisory',
      pubSend: 'Publish (SMS + dashboard · ',
      pubFooter: 'Published as MDRRMO Santa Barbara. Residents will see it within ~1 min; SMS if configured.',
      pubToast: 'Advisory published — Level ',
      pubFor: 'for Barangay Dalongue',
      pubOffline: 'No connection — updated locally only.',
      pubLocalOnly: 'Updated locally only. ',
      pubLvLabel: ['', 'Watch', 'Warning'],
      pubConfirmTitle: 'Publish Level ',
      pubConfirmBody: 'All residents will see this advisory. An SMS will also be sent if configured.',
      pubConfirmOk: 'Publish advisory',
      // Route
      routeDrawing: 'Drawing route to ',
      // Incident advance
      advLabel: ['Acknowledge', 'Dispatch', 'Resolve'],
      advTitle: ['Acknowledge the incident?', 'Dispatch help for this incident?', 'Resolve this incident?'],
      advBody: [
        'Acknowledge this incident?',
        'Dispatch help for this incident?',
        'Resolve this incident? It will be closed and can no longer be changed.'
      ],
      advFail: 'Status could not be updated.',
      // Shelter update
      shelterCapErr: 'Cannot exceed capacity (',
      shelterNoDb: 'No database connection.',
      shelterUpdated: 'Occupancy of ',
      shelterUpdatedSuffix: ' updated.',
      shelterNoServer: 'Could not reach the server.',
      shelterClose: 'Close', shelterOpen: 'Open',
      shelterCloseBody: 'The shelter will be closed to new arrivals.',
      shelterOpenBody: 'The shelter will be reopened to residents.',
      shelterStatusUpdated: 'Shelter status updated.',
      shelterSaveTitle: 'Update shelter occupancy?',
      shelterCloseTitle: 'Close the shelter?',
      shelterOpenTitle: 'Open the shelter?',
      // Sign out
      signOutTitle: 'Sign out?',
      signOutBody: 'You will leave your account. You will need to sign in again.',
      signOutOk: 'Sign out',
      // Location
      locFound: 'Location found — your position is now shown on the map.',
      // Map offline
      mapOffline: 'Internet is needed to view the map. Markers and routes still work.',
      // Time ago
      secAgo: 's ago', minAgo: 'm', hrAgo: 'h ago', dayAgo: 'd ago',
      // Admin panel
      adminTitle: 'Administrator Panel',
      adminSub: 'Manage officials, invite codes, and user accounts.',
      adminTabPending: 'Requests',
      adminTabFlood: 'Flood Level',
      adminTabShelters: 'Shelters',
      adminTabCodes: 'Invite Codes',
      adminTabOfficials: 'Officials',
      adminPendingTitle: 'Official Requests',
      adminPendingSub: 'Accounts using invite codes awaiting approval.',
      adminPendingBadge: 'pending',
      adminPendingEmpty: 'No pending requests.',
      adminPendingLoad: 'Could not load the requests.',
      adminApproveBtn: 'Approve', adminRejectBtn: 'Reject',
      adminApproveTitle: 'Approve the request?',
      adminApproveBody: 'Official access will be granted to ',
      adminApproveOk: 'Approve',
      adminApproveToast: 'Official access has been granted.',
      adminRejectTitle: 'Reject the request?',
      adminRejectBody: 'The request of ',
      adminRejectBodySuffix: ' will be rejected.',
      adminRejectOk: 'Reject',
      adminRejectToast: 'Request rejected.',
      adminFloodTitle: 'Set the Flood Level',
      adminFloodSub: "The new level will immediately appear on all residents' dashboards.",
      adminFloodCurrentPrefix: 'Current: Level ',
      adminFloodLevelLbl: 'Alert Level',
      adminFloodWindLbl: 'Wind (km/h)',
      adminFloodRainLbl: 'Rain (mm/h)',
      adminFloodNotesLbl: 'Notes (optional)',
      adminFloodNotesPlaceholder: 'e.g. River rising since this morning',
      adminFloodBtn: 'Update Level',
      adminFloodUpdating: 'Updating…',
      adminFloodHint: 'Update every hour or when the river level changes.',
      adminFloodUpdated: 'Level updated to Level ',
      adminFloodFail: 'Could not update.',
      adminFloodNoServer: 'Could not reach the server.',
      adminFloodConfirmTitle: 'Update the flood level?',
      adminFloodConfirmBody: 'The level will be set to <b>Level ',
      adminFloodConfirmBodySms: '</b>. An SMS will be sent to residents.',
      adminFloodConfirmBodyNoSms: '</b>.',
      adminFloodConfirmOk: 'Update',
      adminShelterTitle: 'Shelter Occupancy',
      adminShelterSub: 'Update how many people are at each evacuation center.',
      adminShelterLoad: 'Could not load the shelters.',
      adminShelterEmpty: 'No shelters in the database.',
      adminShelterFull: '% full',
      adminShelterCountLbl: 'Number of people:',
      adminShelterSaveBtn: 'Save',
      adminShelterOpenBtn: 'Open', adminShelterCloseBtn: 'Close',
      adminShelterCapErr: 'Cannot exceed capacity (',
      adminShelterOccUpdated: 'Occupancy updated.',
      adminShelterFail: 'Could not update.',
      adminShelterNoServer: 'Could not reach the server.',
      adminShelterStatusUpdated: 'Shelter status updated.',
      adminShelterCloseTitle: 'Close the shelter?',
      adminShelterOpenTitle: 'Open the shelter?',
      adminShelterCloseBody: 'The shelter will be closed to new arrivals.',
      adminShelterOpenBody: 'The shelter will be reopened to residents.',
      adminShelterCloseOk: 'Close', adminShelterOpenOk: 'Open',
      adminCodesTitle: 'Invite Codes',
      adminCodesSub: 'Each code is single-use. Share directly with the official.',
      adminCodesLoad: 'Could not load the codes.',
      adminCodesNotUsed: 'Not yet used', adminCodesUsed: 'Already used', adminCodesExpired: 'Expired',
      adminCodesCopy: 'Code copied to clipboard.',
      adminCodesRevokeTitle: 'Revoke the invite code?',
      adminCodesRevokeBody: 'This code can no longer be used. This cannot be undone.',
      adminCodesRevokeOk: 'Revoke',
      adminCodesRevokeFail: 'Could not revoke the code.',
      adminCodesRevokeToast: 'Code revoked.',
      adminCodesGenNoteLbl: 'Note',
      adminCodesGenNoteOptional: '(optional)',
      adminCodesGenNotePlaceholder: 'e.g. Juan dela Cruz, Brgy. Dalongue',
      adminCodesGenBtn: 'Generate Code',
      adminCodesGenFail: 'Could not generate the code.',
      adminCodesGenToast: 'Code ',
      adminCodesGenToastSuffix: ' has been generated.',
      adminCodesGenNoServer: 'Could not reach the server.',
      adminCodesEmpty: 'No invite codes yet.',
      adminCodesThCode: 'Code', adminCodesThNote: 'Note',
      adminCodesThCreated: 'Created', adminCodesThStatus: 'Status',
      adminCodesThUsedBy: 'Used by',
      adminOfficialsTitle: 'Barangay Officials',
      adminOfficialsSub: 'All accounts with approved official access.',
      adminOfficialsLoad: 'Could not load officials.',
      adminOfficialsEmpty: 'No approved officials yet.',
      adminOfficialsActive: 'Active',
      adminOfficialsRevokeBtn: 'Revoke',
      adminOfficialsRevokeConfirm: 'Revoke official access? The user will become a resident again.',
      adminOfficialsRevokeToast: 'Official access has been revoked.',
      adminOfficialsFail: 'Failed.',
      adminOfficialsSuffix: ' official',
      adminOfficialsSuffixPl: ' officials',
      // Fail strings
      nabigo: 'Failed.',
      noServer: 'Could not reach the server.'
    },

    fil: {
      map: 'Mapa', sh: 'Likasan', rp: 'Mga ulat', inc: 'Mga insidente',
      hot: 'Hotline', sos: 'Humingi ng saklolo', pubb: 'Maglabas ng abiso',
      goNow: 'Pumunta na ngayon', near: 'Pinakamalapit na likasan',
      walk: 'minuto kung lalakad', left: 'puwesto pa',
      route: 'Ipakita ang ruta', shown: 'Ipinapakita ang ruta', close: 'Isara',
      todo: 'Ano ang gagawin',
      wind: 'Hangin', rain: 'Ulan', space: 'Puwesto sa likasan',
      upd: 'Na-update 14:05', saved: 'Na-save 14:05',
      off1: 'Walang koneksyon.',
      off2: 'Ipinapakita ang impormasyong na-save noong 14:05. Maaaring luma na ang mga numero.',
      offb: 'Magpadala ng SOS sa text',
      l_flood: 'Binabaha', l_sh: 'Likasan', l_inc: 'Insidente',
      callTxt: 'Tawagan', issuer: 'MDRRMO Santa Barbara, 14:05', alarm: 'Alarma',
      lv: ['Normal', 'Bantay', 'Babala', 'Kritikal'],
      ti: [
        'Normal ang kalagayan',
        'Bantayan ang lebel ng baha',
        'Maghanda nang lumikas',
        'Sapilitang paglikas na'
      ],
      td: [
        [
          'Panatilihing may charge ang telepono at bukas ang mga alerto.',
          'Alamin kung saan ang pinakamalapit na likasan.',
          'Bumalik dito kung magsimula ang malakas na ulan.'
        ],
        [
          'Ihanda ang go-bag: tubig, pagkain, gamot, mahahalagang papeles.',
          'Magkasundo ang pamilya kung saan magkikita.',
          'Maging handang lumikas kung umabot sa 6.0 m ang lebel.'
        ],
        [
          'Lumikas na mula sa mabababang lugar at tabing-ilog.',
          'Dalhin ang go-bag, ID, at gamot.',
          'Maglakad papunta sa Dalongue Barangay Evacuation Hall, 0.4 km ang layo.'
        ],
        [
          'Lumikas na ngayon at iwasan ang binabahang daan.',
          'Pumunta sa pinakamalapit na likasan sa mataas na lugar.',
          'Kung hindi makalikas, tumawag sa MDRRMO: (075) 518-2024.'
        ]
      ],
      // UI labels
      weather: 'Panahon', lastRefresh: 'Huling na-refresh', now: 'ngayon',
      centersOpen: 'bukas malapit sa Dalongue',
      hide: 'Itago', details: 'Detalye',
      contact: 'Makipag-ugnayan', supplies: 'Suplay',
      updateCount: 'I-update ang bilang ng tao:', save: 'I-save',
      rpTitleOff: 'Pila ng Insidente', rpTitleRes: 'Mga Ulat ng Komunidad',
      rpSubOff: 'Bawat SOS ay naihahatid, anuman ang antas ng tiwala.',
      rpSubRes: 'Mga ulat mula sa mga tao sa inyong lugar.',
      repBtn: 'Mag-ulat ng Insidente',
      loadMore: 'Mag-load ng mas marami…', loading: 'Kumukuha…',
      cancel: 'Kanselahin', confirmBtn: 'Kumpirmahin',
      // SOS form
      sosHint: 'Pindutin at hawakan ang pindutan ng 1 segundo para magpadala ng SOS.',
      holdBtn: 'Hawakan para magpadala ng SOS',
      decrease: 'Bawasan', increase: 'Dagdagan',
      people: 'tao', peoplePl: 'tao',
      depAnkle: 'Bukung-bukong', depKnee: 'Tuhod',
      depWaist: 'Baywang', depChest: 'Dibdib o mas mataas',
      phonePlaceholder: 'Iyong numero ng telepono (opsyonal)',
      phoneLbl: 'Numero ng telepono',
      sosLocNote: 'Gagamitin ang iyong lokasyon para sa rescue.',
      sendSms: 'Mag-SMS',
      // SOS sent
      sosSent: 'SOS Naipadala',
      sosBody: 'Inaaayos na ang tulong. Manatili sa ligtas na lugar.',
      s1: 'Natanggap', s2: 'Nakita ng iyong barangay', s3: 'Tulong paparating',
      sosCancelBtn: 'Ligtas na ako, kanselahin ang SOS',
      savedOffline: 'Nai-save nang lokal — ipapadala kapag may koneksyon.',
      // SOS cancel confirm
      sosSafeTitle: 'Kanselahin ang SOS?',
      sosSafeBody: 'Ipapaalam sa iyong barangay na ligtas ka na. Kanselahin lamang kung talagang ligtas ka.',
      sosSafeOk: 'Oo, ligtas na ako',
      sosSafeToast: 'SOS nakansela. Inabisuhan ang iyong barangay na ligtas ka na.',
      // Report form
      repFormTitle: 'Mag-ulat ng Insidente',
      typFlood: 'Baha', typMedical: 'Medikal', typRelief: 'Relief', typDebris: 'Debris',
      repTitlePlaceholder: 'Ano ang nangyayari?', repTitleLbl: 'Pamagat',
      repDescPlaceholder: 'Ilarawan ang sitwasyon (opsyonal)', repDescLbl: 'Paglalarawan',
      repLocLbl: 'Lokasyon', repLocNote: 'Maaaring baguhin ang lokasyon kung kinakailangan.',
      repSend: 'Ipadala ang Ulat',
      repRequired: 'Ilarawan ang insidente.',
      repSentOk: 'Ulat naipadala.', repSentOffline: 'Nai-save. Ipapadala kapag may signal.',
      // Publish advisory form
      areas: 'Mga Lugar', reach: 'Abot',
      reachDisabled: 'rehistrado (i-enable ang SMS sa config)',
      reachLoading: 'Kinukuha ang bilang…',
      pubReview: 'Suriin ang Kritikal na abiso',
      pubConfirm: 'Kumpirmahin at ilabas ang Kritikal na abiso',
      pubSend: 'Ilabas (SMS + dashboard · ',
      pubFooter: 'Inilalabas bilang MDRRMO Santa Barbara. Makikita ng mga residente sa loob ng ~1 min; SMS kung naka-configure.',
      pubToast: 'Abiso nailabas — Antas ',
      pubFor: 'para sa Barangay Dalongue',
      pubOffline: 'Walang koneksyon — na-update nang lokal lamang.',
      pubLocalOnly: 'Na-update nang lokal lamang. ',
      pubLvLabel: ['', 'Bantay', 'Babala'],
      pubConfirmTitle: 'Ilabas ang Antas ',
      pubConfirmBody: 'Makikita ng lahat ng residente ang abisong ito. Magpapadala rin ng SMS kung naka-configure.',
      pubConfirmOk: 'Ilabas ang abiso',
      // Route
      routeDrawing: 'Ginagawa ang ruta papunta sa ',
      // Incident advance
      advLabel: ['I-acknowledge', 'I-dispatch', 'I-resolve'],
      advTitle: ['I-acknowledge ang insidente?', 'I-dispatch ang tulong?', 'I-resolve ang insidente?'],
      advBody: [
        'I-acknowledge ang insidenteng ito?',
        'I-dispatch ang tulong para sa insidenteng ito?',
        'I-resolve ang insidenteng ito? Isasara ito at hindi na mababago.'
      ],
      advFail: 'Hindi na-update ang status.',
      // Shelter update
      shelterCapErr: 'Hindi maaaring lampas sa kapasidad (',
      shelterNoDb: 'Walang koneksyon sa database.',
      shelterUpdated: 'Na-update ang occupancy ng ',
      shelterUpdatedSuffix: '.',
      shelterNoServer: 'Walang koneksyon sa server.',
      shelterClose: 'Isara', shelterOpen: 'Buksan',
      shelterCloseBody: 'Isasara ang likasan sa mga bagong dumadating.',
      shelterOpenBody: 'Muling bubuksan ang likasan sa mga residente.',
      shelterStatusUpdated: 'Status ng likasan na-update.',
      shelterSaveTitle: 'I-update ang occupancy ng likasan?',
      shelterCloseTitle: 'Isara ang likasan?',
      shelterOpenTitle: 'Buksan ang likasan?',
      // Sign out
      signOutTitle: 'Mag-sign out?',
      signOutBody: 'Aalis ka sa iyong account. Kailangan mong mag-sign in ulit.',
      signOutOk: 'Sign out',
      // Location
      locFound: 'Nahanap ang lokasyon — makikita na ang iyong posisyon sa mapa.',
      // Map offline
      mapOffline: 'Kailangan ng internet para makita ang mapa. Gumagana pa rin ang mga marker at ruta.',
      // Time ago
      secAgo: ' segundo', minAgo: ' min', hrAgo: ' oras', dayAgo: ' araw',
      // Admin panel
      adminTitle: 'Panel ng Administrador',
      adminSub: 'Pamahalaan ang mga opisyal, invite code, at mga account ng gumagamit.',
      adminTabPending: 'Mga Kahilingan',
      adminTabFlood: 'Antas ng Baha',
      adminTabShelters: 'Mga Likasan',
      adminTabCodes: 'Mga Invite Code',
      adminTabOfficials: 'Mga Opisyal',
      adminPendingTitle: 'Mga Kahilingan ng Opisyal',
      adminPendingSub: 'Mga account na gumagamit ng invite code at naghihintay ng pag-apruba.',
      adminPendingBadge: 'naghihintay',
      adminPendingEmpty: 'Walang mga kahilingang naghihintay.',
      adminPendingLoad: 'Hindi ma-load ang mga kahilingan.',
      adminApproveBtn: 'Aprubahan', adminRejectBtn: 'Tanggihan',
      adminApproveTitle: 'Aprubahan ang kahilingan?',
      adminApproveBody: 'Ibibigay ang opisyal na access kay ',
      adminApproveOk: 'Aprubahan',
      adminApproveToast: 'Ibinigay na ang opisyal na access.',
      adminRejectTitle: 'Tanggihan ang kahilingan?',
      adminRejectBody: 'Tatanggihan ang kahilingan ni ',
      adminRejectBodySuffix: '. Hindi ito maaaring ibalik nang hindi muling nag-apply.',
      adminRejectOk: 'Tanggihan',
      adminRejectToast: 'Tinanggihan ang kahilingan.',
      adminFloodTitle: 'Itakda ang Antas ng Baha',
      adminFloodSub: 'Ang bagong antas ay agad na makikita sa dashboard ng lahat ng residente.',
      adminFloodCurrentPrefix: 'Kasalukuyan: Antas ',
      adminFloodLevelLbl: 'Antas ng Alerto',
      adminFloodWindLbl: 'Hangin (km/h)',
      adminFloodRainLbl: 'Ulan (mm/h)',
      adminFloodNotesLbl: 'Mga Tala (opsyonal)',
      adminFloodNotesPlaceholder: 'hal. Tumataas ang ilog mula kaninang umaga',
      adminFloodBtn: 'I-update ang Antas',
      adminFloodUpdating: 'Ina-update…',
      adminFloodHint: 'I-update ito kada oras o tuwing may pagbabago sa lebel ng ilog.',
      adminFloodUpdated: 'Antas na-update sa Antas ',
      adminFloodFail: 'Hindi na-update.',
      adminFloodNoServer: 'Hindi ma-reach ang server.',
      adminFloodConfirmTitle: 'I-update ang antas ng baha?',
      adminFloodConfirmBody: 'Itatakda ang antas sa <b>Antas ',
      adminFloodConfirmBodySms: '</b>. Magpapadala ng SMS sa mga residente.',
      adminFloodConfirmBodyNoSms: '</b>.',
      adminFloodConfirmOk: 'I-update',
      adminShelterTitle: 'Occupancy ng mga Likasan',
      adminShelterSub: 'I-update kung ilang tao na ang nasa bawat evacuation center.',
      adminShelterLoad: 'Hindi ma-load ang mga likasan.',
      adminShelterEmpty: 'Walang likasan sa database.',
      adminShelterFull: '% puno',
      adminShelterCountLbl: 'Bilang ng tao:',
      adminShelterSaveBtn: 'I-save',
      adminShelterOpenBtn: 'Buksan', adminShelterCloseBtn: 'Isara',
      adminShelterCapErr: 'Hindi maaaring lampas sa kapasidad (',
      adminShelterOccUpdated: 'Occupancy na-update.',
      adminShelterFail: 'Hindi na-update.',
      adminShelterNoServer: 'Hindi ma-reach ang server.',
      adminShelterStatusUpdated: 'Status ng likasan na-update.',
      adminShelterCloseTitle: 'Isara ang likasan?',
      adminShelterOpenTitle: 'Buksan ang likasan?',
      adminShelterCloseBody: 'Isasara ang likasan sa mga bagong dumadating.',
      adminShelterOpenBody: 'Muling bubuksan ang likasan sa mga residente.',
      adminShelterCloseOk: 'Isara', adminShelterOpenOk: 'Buksan',
      adminCodesTitle: 'Mga Invite Code',
      adminCodesSub: 'Isa-isang gamit ang bawat code. Ibahagi nang direkta sa opisyal.',
      adminCodesLoad: 'Hindi ma-load ang mga code.',
      adminCodesNotUsed: 'Hindi pa ginamit', adminCodesUsed: 'Ginamit na', adminCodesExpired: 'Nag-expire na',
      adminCodesCopy: 'Na-kopya ang code sa clipboard.',
      adminCodesRevokeTitle: 'Bawiin ang invite code?',
      adminCodesRevokeBody: 'Hindi na magagamit ang code na ito pagkatapos. Hindi ito mababawi.',
      adminCodesRevokeOk: 'Bawiin',
      adminCodesRevokeFail: 'Hindi mabawi ang code.',
      adminCodesRevokeToast: 'Nabawi ang code.',
      adminCodesGenNoteLbl: 'Tala',
      adminCodesGenNoteOptional: '(opsyonal)',
      adminCodesGenNotePlaceholder: 'hal. Juan dela Cruz, Brgy. Dalongue',
      adminCodesGenBtn: 'Gumawa ng Code',
      adminCodesGenFail: 'Hindi nagawa ang code.',
      adminCodesGenToast: 'Code ',
      adminCodesGenToastSuffix: ' nagawa na.',
      adminCodesGenNoServer: 'Hindi ma-reach ang server.',
      adminCodesEmpty: 'Wala pang invite code.',
      adminCodesThCode: 'Code', adminCodesThNote: 'Tala',
      adminCodesThCreated: 'Ginawa', adminCodesThStatus: 'Status',
      adminCodesThUsedBy: 'Ginamit ni',
      adminOfficialsTitle: 'Mga Opisyal ng Barangay',
      adminOfficialsSub: 'Lahat ng account na may aprubadong opisyal na access.',
      adminOfficialsLoad: 'Hindi ma-load ang mga opisyal.',
      adminOfficialsEmpty: 'Wala pang mga aprubadong opisyal.',
      adminOfficialsActive: 'Aktibo',
      adminOfficialsRevokeBtn: 'Bawiin',
      adminOfficialsRevokeConfirm: 'Bawiin ang opisyal na access? Magiging residente ulit ang user na ito.',
      adminOfficialsRevokeToast: 'Nabawi ang opisyal na access.',
      adminOfficialsFail: 'Nabigo.',
      adminOfficialsSuffix: ' opisyal',
      adminOfficialsSuffixPl: ' opisyal',
      // Fail strings
      nabigo: 'Nabigo.',
      noServer: 'Hindi ma-reach ang server.'
    }
  };

  // Fallback wind/rain values per alert level (overridden by live weather API)
  var LVD = [
    { w: 12,  r: 0.5  },
    { w: 38,  r: 8    },
    { w: 82,  r: 34   },
    { w: 105, r: 52   }
  ];

  // Evacuation centers (Barangay Dalongue only)
  var CT = [
    {
      n: 'Dalongue Barangay Evacuation Hall', b: 'Dalongue',
      k: 0.4, o: 42, c: 180, el: 18,
      e: '18 m high ground',
      f: 'Medical aid, generator power, rescue boats on site',
      s: 'Clean drinking water (800 L), ready-to-eat rice, hygiene kits, first aid station',
      p: '(075) 518-2024'
    }
  ];

  // Priority hotlines
  var HL = [
    ['Santa Barbara MDRRMO',        '(075) 518-2024', 'Flood rescue and boat dispatch'],
    ['Santa Barbara Mayor Emergency','0917-508-1122',  '24/7 disaster quick response'],
    ['National Emergency',           '911',            'Police, fire and ambulance']
  ];

  // Secondary hotlines (expandable)
  var HM = [
    ['Pangasinan PDRRMO',              '(075) 542-7000', 'Provincial rescue and air or boat assets'],
    ['Philippine Red Cross Pangasinan','(075) 522-2258', 'Medical response and relief aid'],
    ['PAGASA Weather Alert',           '(02) 8284-0800', 'Typhoon and Sinocalan river bulletins'],
    ['Coast Guard Pangasinan Station', '0917-819-4825',  'Flood and watercraft rescue'],
    ['DOH Health Emergency',           '1555',           'Emergency medical advice']
  ];

  // Incident statuses / priorities / trust levels
  var ST = ['New', 'Acknowledged', 'Dispatched', 'Resolved'];
  var SC = ['--rose', '--amb', '--blu', '--ok'];
  var AC = ['Acknowledge', 'Dispatch', 'Resolve'];
  var TB = ['Unverified', 'Phone confirmed', 'Verified household'];

  /* ── App state ───────────────────────────────────────────────────────────── */
  var S = {
    lv:    null,   /* null = loading; set by fetchFloodLevel before first render */
    role:  _isOfficial ? 'off' : 'res',
    tab:   'radar',
    net:   1,
    lang:  'fil',
    open:  null,
    more:  false,
    fl:    1,
    inc:   1,
    pubLv: 2,
    pubC:  0,
    pubReach: null,
    reps:  []
  };

  /* ── Utility functions ───────────────────────────────────────────────────── */
  var tt;        // toast timer

  function T(k) {
    // These four keys use the current time rather than a hardcoded value
    var t = nowHHMM();
    if (k === 'upd')    return (S.lang === 'fil' ? 'Na-update ' : 'Updated ') + t;
    if (k === 'saved')  return (S.lang === 'fil' ? 'Na-save '   : 'Saved ')   + t;
    if (k === 'issuer') return 'MDRRMO Santa Barbara, ' + t;
    if (k === 'off2')   return S.lang === 'fil'
      ? 'Ipinapakita ang impormasyong na-save noong ' + t + '. Maaaring luma na ang mga numero.'
      : 'Showing information saved at ' + t + '. Numbers may be out of date.';
    return D[S.lang] && D[S.lang][k] != null ? D[S.lang][k] : D.en[k];
  }

  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(tt);
    tt = setTimeout(function () { el.classList.remove('on'); }, 2600);
  }

  function off()  { return S.role === 'off'; }
  function tel(n) { return 'tel:' + n.replace(/[^0-9+]/g, ''); }
  function walk(c){ return Math.max(1, Math.round(c.k * 15)); }

  function nowHHMM() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  /* ── MapLibre GL map ─────────────────────────────────────────────────────── */
  var _map             = null;   // MapLibre map instance
  var _shelterMarkers  = [];     // maplibregl.Marker[]
  var _floodLayerId    = null;   // GeoJSON source/layer id for flood zone
  var _incidentMarkers = [];     // maplibregl.Marker[]
  var _routeLayerId    = null;   // GeoJSON source/layer id for route
  var _userMarker      = null;   // maplibregl.Marker for user position

  // Dalongue, Santa Barbara — map center [lon, lat] (MapLibre convention)
  var MAP_CENTER = [120.4150, 15.9650];
  var MAP_ZOOM   = 15;

  // Evacuation center coordinates [lon, lat]
  var CT_COORDS = [
    [120.4138, 15.9643]   // Dalongue Barangay Evacuation Hall
  ];

  // Flood zone polygon — GeoJSON [lon, lat] pairs
  var FLOOD_ZONE_COORDS = [
    [120.4100, 15.9680], [120.4150, 15.9690], [120.4190, 15.9670],
    [120.4210, 15.9650], [120.4200, 15.9620], [120.4170, 15.9600],
    [120.4130, 15.9610], [120.4110, 15.9630], [120.4100, 15.9680]
  ];

  function floodColor() {
    var lv = S.lv || 0;
    return lv === 0 ? '#3b82f6'
         : lv === 1 ? '#f59e0b'
         : lv === 2 ? '#f97316'
         :             '#ef4444';
  }

  /* ── MapLibre helpers ────────────────────────────────────────────────────── */

  // Remove a GeoJSON source+layer pair by id
  function _removeLayer(id) {
    if (!_map || !id) return;
    try { if (_map.getLayer(id))        _map.removeLayer(id); } catch(e) {}
    try { if (_map.getSource(id))       _map.removeSource(id); } catch(e) {}
    try { if (_map.getLayer(id+'-out')) _map.removeLayer(id+'-out'); } catch(e) {}
  }

  function initMap() {
    var el = document.getElementById('maplibre-map');
    if (!el || _map) return;

    _map = new maplibregl.Map({
      container: 'maplibre-map',
      style:     'https://tiles.openfreemap.org/styles/liberty',
      center:    MAP_CENTER,
      zoom:      MAP_ZOOM,
      pitch:     0,
      bearing:   0,
      attributionControl: false
    });

    // Minimal attribution
    _map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    _map.on('load', function () {
      _updateFloodLayer();
      _updateShelterMarkers();
      if (off()) _updateIncidentMarkers();
    });

    _map.on('error', function () {
      var container = document.getElementById('maplibre-map');
      if (container && !container.querySelector('.tile-error-msg')) {
        var msg = document.createElement('div');
        msg.className = 'tile-error-msg';
        msg.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);'
          + 'background:rgba(0,0,0,.7);color:#fff;padding:12px 20px;border-radius:8px;'
          + 'font-size:13px;text-align:center;z-index:9999;pointer-events:none;max-width:280px';
        msg.textContent = T('mapOffline');
        container.appendChild(msg);
      }
    });

    requestLocation();
  }


  function _updateFloodLayer() {
    if (!_map || !_map.loaded()) return;
    _removeLayer('flood-zone');
    if (!S.fl || S.lv === 0) return;
    var color = floodColor();
    _map.addSource('flood-zone', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [FLOOD_ZONE_COORDS] }
      }
    });
    _map.addLayer({
      id: 'flood-zone', type: 'fill',
      source: 'flood-zone',
      paint: { 'fill-color': color, 'fill-opacity': 0.25 }
    });
    _map.addLayer({
      id: 'flood-zone-out', type: 'line',
      source: 'flood-zone',
      paint: { 'line-color': color, 'line-width': 2, 'line-dasharray': [3, 2] }
    });
    _floodLayerId = 'flood-zone';
  }

  function _updateShelterMarkers() {
    if (!_map) return;
    _shelterMarkers.forEach(function (m) { m.remove(); });
    _shelterMarkers = [];
    CT.forEach(function (c, i) {
      var cap = c.c - c.o;
      var pct = Math.round(c.o / c.c * 100);
      var col = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#22c55e';
      var el = document.createElement('div');
      el.style.cssText = 'width:28px;height:28px;border-radius:50%;background:#2563eb;'
        + 'border:3px solid #fff;display:flex;align-items:center;justify-content:center;'
        + 'font-weight:700;font-size:12px;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.4);cursor:pointer';
      el.textContent = 'S';
      var popup = new maplibregl.Popup({ offset: 18 }).setHTML(
        '<b>' + (i + 1) + '. ' + c.n + '</b><br>' +
        c.b + '<br>' + c.k + ' km · ' + walk(c) + ' min walk<br>' +
        '<span style="color:' + col + '">' + cap + ' places left (' + pct + '% full)</span>' +
        (c.p ? '<br>📞 ' + c.p : '')
      );
      var marker = new maplibregl.Marker({ element: el })
        .setLngLat(CT_COORDS[i])
        .setPopup(popup)
        .addTo(_map);
      _shelterMarkers.push(marker);
    });
  }

  function _updateIncidentMarkers() {
    if (!_map) return;
    _incidentMarkers.forEach(function (m) { m.remove(); });
    _incidentMarkers = [];
    if (!S.inc) return;
    S.reps.filter(function (r) { return r.st < 3; }).forEach(function (r, idx) {
      // Approximate positions around map center
      var lon = MAP_CENTER[0] + (Math.floor(idx / 3) - 0.5) * 0.003;
      var lat = MAP_CENTER[1] + (idx % 3 - 1) * 0.003;
      var el = document.createElement('div');
      el.style.cssText = 'width:16px;height:16px;background:#ef4444;'
        + 'transform:rotate(45deg);border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.4);cursor:pointer';
      var popup = new maplibregl.Popup({ offset: 12 }).setHTML(
        '<b>' + r.pr + ' priority</b><br>' + r.t + '<br><small>' + r.w + '</small>'
      );
      var marker = new maplibregl.Marker({ element: el })
        .setLngLat([lon, lat])
        .setPopup(popup)
        .addTo(_map);
      _incidentMarkers.push(marker);
    });
  }

  function map() {
    return '<div class="map">'
      + '<div id="maplibre-map"></div>'
      + '<span class="tag mono' + (S.net ? '' : ' old') + '">'
          + (S.net ? T('upd') : T('saved'))
      + '</span>'
      + '<div class="lyr">'
          + '<button data-a="lfl" aria-pressed="' + (S.fl ? 'true' : 'false') + '">'
              + '<i style="background:' + floodColor() + ';opacity:.7"></i>'
              + T('l_flood')
          + '</button>'
          + (off()
              ? '<button data-a="linc" aria-pressed="' + (S.inc ? 'true' : 'false') + '">'
                  + '<i style="background:var(--rose);transform:rotate(45deg) scale(.8)"></i>'
                  + T('l_inc')
                + '</button>'
              : '')
      + '</div>'
      + '<div class="zm">'
          + '<button data-a="zin"  aria-label="Zoom in">'  + ic('plus')  + '</button>'
          + '<button data-a="zout" aria-label="Zoom out">' + ic('minus') + '</button>'
          + '<button data-a="zr"   aria-label="Center on my location">' + ic('loc') + '</button>'
      + '</div>'
      + '</div>';
  }

  function initMapAfterRender() {
    if (S.tab !== 'radar') return;
    setTimeout(function () {
      var el = document.getElementById('maplibre-map');
      if (!el) return;
      if (_map) {
        _map.remove();
        _map             = null;
        _userMarker      = null;
        _shelterMarkers  = [];
        _floodLayerId    = null;
        _incidentMarkers = [];
        _routeLayerId    = null;
      }
      initMap();
      if (_userLat !== null) _updateUserMarker();
    }, 100);
  }

  /* ── Capacity bar ────────────────────────────────────────────────────────── */
  function bar(c) {
    var p = c.o / c.c * 100;
    var colour = p > 90 ? 'var(--rose)' : p > 70 ? 'var(--amb)' : 'var(--ok)';
    return '<div class="bar"><i style="width:' + p + '%;background:' + colour + '"></i></div>'
      + '<span class="mute" style="font-size:13.5px">' + (c.c - c.o) + ' ' + T('left') + '</span>';
  }

  /* ── View renderers ──────────────────────────────────────────────────────── */
  function band() {
    var b = document.getElementById('band');
    if (!b) return;
    // Hide band entirely until flood level is loaded from the API
    if (S.lv === null) {
      b.dataset.l = '0';
      b.innerHTML = '';
      return;
    }
    b.dataset.l = S.lv;
    b.innerHTML = '<div class="bi">'
      + '<div>'
          + '<span class="k">' + (S.lv ? T('alarm') + ' ' + S.lv + ' · ' : '') + T('lv')[S.lv] + '</span>'
          + '<h2>' + T('ti')[S.lv] + '</h2>'
      + '</div>'
      + '<span class="by' + (S.net ? '' : ' old') + '">'
          + (S.lv ? T('issuer') : (S.net ? T('upd') : T('saved')))
      + '</span>'
      + '</div>';
  }

  function netbar() {
    $('#netbar').innerHTML = S.net
      ? ''
      : '<div class="net" role="status"><div>'
          + '<b>' + T('off1') + '</b>'
          + '<span>' + T('off2') + '</span>'
          + (!_isOfficial && !_isAdmin ? '<button class="btn s" data-a="sos">' + T('offb') + '</button>' : '')
        + '</div></div>';
  }

  function radar() {
    var lv = S.lv !== null ? S.lv : 0;   /* safe default until API responds */
    var L  = LVD[lv];
    var c  = CT[0];
    var u  = lv >= 2;
    var sp = CT.reduce(function (a, x) { return a + x.c - x.o; }, 0);
    var nw = S.reps.filter(function (r) { return r.st === 0; }).length;
    var o  = S.net ? '' : ' old';

    var teams = off()
      ? '<div class="sec"><p class="lb">' + (S.lang === 'fil' ? 'Mga koponan' : 'Response teams') + '</p>'
          + [
              ['Water Search and Rescue',    S.lang === 'fil' ? 'Aktibo sa Dalongue'    : 'Active in Dalongue',    '--ok'],
              ['Dalongue QRT boat crew',     S.lang === 'fil' ? 'Nagpapatrolya'         : 'On patrol',             '--ac'],
              ['MDRRMO logistics truck',     S.lang === 'fil' ? 'Naghihintay — Dalongue': 'On standby — Dalongue', '--amb']
            ].map(function (t) {
              return '<div class="rw"><span>' + t[0] + '</span>'
                + '<span class="dot" style="--c:var(' + t[2] + ')">' + t[1] + '</span></div>';
            }).join('')
          + '<button class="lk" data-a="tab" data-v="reports">' + nw + ' ' + (S.lang === 'fil' ? 'bagong insidente, suriin' : 'new incidents, review') + '</button>'
        + '</div>'
      : '';

    return '<div class="ph">'
        + '<div><h1>Dalongue, Santa Barbara</h1><p>Sinocalan River, Pangasinan</p></div>'
        + '<div class="facts' + o + (_dataLoaded ? '' : ' loading') + '">'
            + '<div>' + T('wind') + '<b>' + (_dataLoaded ? L.w + ' km/h' : '—') + '</b></div>'
            + '<div>' + T('rain') + '<b>' + (_dataLoaded ? L.r + ' mm/h' : '—') + '</b></div>'
            + '<div>' + T('space') + '<b>' + (_dataLoaded ? sp : '—') + '</b></div>'
            + '<div>' + T('weather') + '<b id="wx-tile">' + (W ? wxLabel(W.weather_condition) + ' · ' + W.temperature.toFixed(1) + '°C' : '—') + '</b></div>'
        + '</div>'
        + '<div id="refresh-bar" style="font-size:12px;color:var(--dim);text-align:right;padding:2px 0 6px">'
            + T('lastRefresh') + ': <span id="last-refresh">' + T('now') + '</span>'
        + '</div>'
      + '</div>'
      + '<div class="cols"><div>' + map() + '</div><aside>'
          + '<div class="sec">'
              + '<div class="go" data-l="' + lv + '">'
                  + '<p class="lb">' + (u ? T('goNow') : T('near')) + '</p>'
                  + '<h3>' + c.n + '</h3>'
                  + '<p class="mute">' + c.k + ' km, ' + walk(c) + ' ' + T('walk') + '</p>'
                  + bar(c)
                  + '<button class="btn ac w" data-a="route" data-v="0">' + ic('nav') + T('route') + '</button>'              + '</div>'
          + '</div>'
          + '<div class="sec">'
              + '<p class="lb">' + T('todo') + '</p>'
              + '<ol class="todo">'
                  + T('td')[lv].map(function (t) { return '<li><span>' + t + '</span></li>'; }).join('')
              + '</ol>'
          + '</div>'
          + teams
      + '</aside></div>';
  }

  function centers() {
    var isOff = _isOfficial || _isAdmin;
    return '<div class="ph"><div>'
        + '<h1>' + T('sh') + '</h1>'
        + '<p>' + CT.length + ' ' + T('centersOpen') + '</p>'
      + '</div></div>'
      + '<div class="led">'
          + CT.map(function (c, i) {
              var o = S.open === 'c' + i;
              return '<div class="r sh">'
                + '<div><b class="t">' + (i + 1) + '. ' + c.n + '</b><span class="mute">' + c.b + '</span></div>'
                + '<div class="mono">' + c.k.toFixed(1) + ' km</div>'
                + '<div>' + bar(c) + '</div>'
                + '<div class="ops">'
                    + '<button class="btn s" data-a="route" data-v="' + i + '">' + ic('nav') + T('route') + '</button>'
                    + '<button class="btn s o" data-a="open" data-v="c' + i + '" aria-expanded="' + o + '">'
                        + (o ? T('hide') : T('details'))
                    + '</button>'
                + '</div>'
                + '<div class="fold' + (o ? ' on' : '') + '"><div>'
                    + '<p>'
                        + c.e
                        + (c.p ? '. ' + T('contact') + ': ' + c.p : '') + '.'
                        + (c.f ? ' ' + c.f + '.' : '')
                        + (c.s ? ' ' + T('supplies') + ': ' + c.s + '.' : '')
                    + '</p>'
                    + (isOff
                        ? '<div class="rw" style="margin-top:10px;gap:8px;flex-wrap:wrap">'
                            + '<label style="font-size:13px;color:var(--mute);white-space:nowrap;margin:auto 0">' + T('updateCount') + '</label>'
                            + '<input type="number" min="0" max="' + c.c + '" value="' + c.o + '" id="socc-' + i + '"'
                                + ' style="width:80px;padding:4px 8px;border:1px solid var(--line2);border-radius:6px;background:var(--s2);color:var(--ink);font-size:14px">'
                            + '<button class="btn s" data-a="upd-shelter" data-v="' + i + '">' + T('save') + '</button>'
                          + '</div>'
                        : '')
                + '</div></div>'
              + '</div>';
            }).join('')
      + '</div>';
  }

  function reports() {
    var O = off();
    return '<div class="ph">'
        + '<div>'
            + '<h1>' + (O ? T('rpTitleOff') : T('rpTitleRes')) + '</h1>'
            + '<p>' + (O ? T('rpSubOff') : T('rpSubRes')) + '</p>'
        + '</div>'
        + '<button class="btn" data-a="rep">' + ic('plus') + T('repBtn') + '</button>'
      + '</div>'
      + '<div class="led" id="reports-led"></div>'
      + '<div style="text-align:center;padding:12px 0">'
          + '<button class="btn o" id="load-more-btn" style="display:none" data-a="load-more">' + T('loadMore') + '</button>'
      + '</div>';
  }

  function hotlines() {
    return '<div class="ph"><div>'
        + '<h1>' + T('hot') + '</h1>'
        + '<p>Tap a number to call. These work without internet.</p>'
      + '</div></div>'
      + '<div class="led hl">'
          + HL.map(function (h) {
              return '<div class="r">'
                + '<div><b class="t">' + h[0] + '</b><span class="mute">' + h[2] + '</span></div>'
                + '<a class="tel" href="' + tel(h[1]) + '">' + h[1] + '</a>'
              + '</div>';
            }).join('')
      + '</div>'
      + '<button class="lk" style="margin-top:8px" data-a="more" aria-expanded="' + S.more + '">'
          + (S.more ? 'Hide other numbers' : 'Other numbers (' + HM.length + ')')
          + ic('chev', S.more ? ' style="transform:rotate(180deg)"' : '')
      + '</button>'
      + '<div class="fold' + (S.more ? ' on' : '') + '" style="grid-column:auto">'
          + '<div class="led hl">'
              + HM.map(function (h) {
                  return '<div class="r" style="padding:14px 0">'
                    + '<div>'
                        + '<b class="t" style="font-size:15px">' + h[0] + '</b>'
                        + '<span class="mute">' + h[2] + '</span>'
                    + '</div>'
                    + '<a class="tel" style="font-size:20px" href="' + tel(h[1]) + '">' + h[1] + '</a>'
                  + '</div>';
                }).join('')
          + '</div>'
      + '</div>';
  }

  /* SVG paths for sidebar icons */
  var SB_ICONS = {
    map:    '<path d="M3 11l18-8-8 18-2-8z"/>',
    home:   '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    list:   '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    phone:  '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'
  };

  function sbIcon(name) {
    return '<span class="sb-icon"><svg viewBox="0 0 24 24" aria-hidden="true">'
      + (SB_ICONS[name] || '') + '</svg></span>';
  }

  function nav() {
    var T2 = [
      ['radar',    'map',   T('map')],
      ['centers',  'home',  T('sh')],
      ['reports',  'list',  off() ? T('inc') : T('rp')],
      ['hotlines', 'phone', T('hot')],
      _isAdmin ? ['admin', 'shield', 'Admin panel'] : null
    ];
    var n = S.reps.filter(function (r) { return r.st === 0; }).length;

    /* Sidebar nav */
    var tabsEl = document.getElementById('tabs');
    if (tabsEl) {
      tabsEl.innerHTML = T2.filter(Boolean).map(function (t) {
        var badge = (t[0] === 'reports' && off() && n)
          ? '<span class="n">' + n + '</span>' : '';
        return '<button data-a="tab" data-v="' + t[0] + '"'
          + (S.tab === t[0] ? ' aria-current="page"' : '')
          + ' data-tooltip="' + t[2] + '">'
          + sbIcon(t[1])
          + '<span class="sb-label">' + t[2] + '</span>'
          + badge
        + '</button>';
      }).join('');
    }

    /* Mobile bottom nav */
    $('#bn').innerHTML = T2.map(function (t) {
      return t
        ? '<button data-a="tab" data-v="' + t[0] + '"'
            + (S.tab === t[0] ? ' aria-current="page"' : '') + '>'
            + ic(t[1], ' style="width:22px;height:22px"') + t[2]
          + '</button>'
        : (_isOfficial || _isAdmin)
            ? ''
            : '<button class="sb" data-a="sos" aria-label="' + T('sos') + '">SOS</button>';
    }).join('');

    $('#sosb').textContent = T('sos');
    $('#sosb').style.display = (_isOfficial || _isAdmin) ? 'none' : '';
    $('#pub').innerHTML = off()
      ? '<button class="btn s o" data-a="pub">' + T('pubb') + '</button>'
      : '';

    /* Sidebar user chip */
    _updateSidebarUserChip();
  }

  /* ── Header user menu ────────────────────────────────────────────────────── */
  (function _initHeaderUserMenu() {
    var avatarSrc = _user.avatar_path ? _user.avatar_path : (_user.avatar || null);
    var roleLabel = _isAdmin ? 'Administrator'
      : _isOfficial ? (_isPending ? 'Official (pending)' : 'Barangay official')
      : 'Resident';

    // Populate avatar button
    var avatarEl = document.getElementById('hd-user-avatar');
    if (avatarEl) {
      avatarEl.innerHTML = avatarSrc
        ? '<img src="' + avatarSrc + '" alt="" style="width:30px;height:30px;border-radius:50%;object-fit:cover;display:block">'
        : '<span style="width:30px;height:30px;border-radius:50%;background:var(--ac);display:grid;place-items:center;font-weight:700;font-size:13px;color:var(--acon)">'
            + (_user.full_name ? _user.full_name.charAt(0).toUpperCase() : '?')
          + '</span>';
    }

    // Populate name/role in dropdown header
    var infoEl = document.getElementById('hd-user-info');
    if (infoEl) {
      infoEl.innerHTML = '<span class="hd-user-name">' + (_user.full_name || '') + '</span>'
        + '<span class="hd-user-role">' + roleLabel + '</span>';
    }

    // Dropdown toggle
    var menuEl    = document.getElementById('hd-user-menu');
    var userBtn   = document.getElementById('hd-user-btn');
    var dropdown  = document.getElementById('hd-user-dropdown');
    var signoutBtn = document.getElementById('hd-signout-btn');

    if (userBtn && dropdown) {
      userBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = dropdown.classList.toggle('open');
        userBtn.setAttribute('aria-expanded', String(open));
      });

      document.addEventListener('click', function (e) {
        if (!dropdown.contains(e.target) && e.target !== userBtn) {
          dropdown.classList.remove('open');
          userBtn.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          dropdown.classList.remove('open');
          userBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    if (signoutBtn) {
      signoutBtn.addEventListener('click', function () {
        confirm({
          title: T('signOutTitle'),
          body:  T('signOutBody'),
          okLabel: T('signOutOk'), okClass: 'o',
          onOk: function () {
            fetch('api/logout.php', { method: 'POST', credentials: 'same-origin' })
              .finally(function () {
                localStorage.removeItem('agapalert_user');
                window.location.href = 'login.html';
              });
          }
        });
      });
    }
  })();

  function _updateSidebarUserChip() {
    var el = document.getElementById('user-chip-side');
    if (!el) return;
    var avatarSrc = _user.avatar_path ? _user.avatar_path : (_user.avatar || null);
    var roleLabel = _isAdmin ? 'Administrator'
      : _isOfficial ? (_isPending ? 'Official (pending)' : 'Barangay official')
      : 'Resident';
    el.style.display = 'flex';
    // Avatar | name+role | settings gear (with dropdown)
    el.innerHTML = (avatarSrc
        ? '<img src="' + avatarSrc + '" alt="">'
        : '<div style="width:30px;height:30px;border-radius:50%;background:var(--ac);display:grid;place-items:center;font-weight:700;font-size:13px;color:var(--acon);flex-shrink:0">'
            + (_user.full_name ? _user.full_name.charAt(0).toUpperCase() : '?')
          + '</div>')
      + '<div class="uc-info">'
          + '<span class="uc-name">' + (_user.full_name || '') + '</span>'
          + '<span class="uc-role">' + roleLabel + '</span>'
      + '</div>';

    // Gear dropdown — use event delegation on the stable container
    // so it works even after innerHTML is rewritten on re-renders
    if (!el._gearBound) {
      el._gearBound = true;

      el.addEventListener('click', function (e) {
        if (e.target.closest('#signout-btn')) {
          confirm({
            title: T('signOutTitle'),
            body:  T('signOutBody'),
            okLabel: T('signOutOk'), okClass: 'o',
            onOk: function () {
              fetch('api/logout.php', { method: 'POST', credentials: 'same-origin' })
                .finally(function () {
                  localStorage.removeItem('agapalert_user');
                  window.location.href = 'login.html';
                });
            }
          });
        }
      });
    }

    // Clear the now-unused sb-actions block
    var actEl = document.getElementById('sb-actions');
    if (actEl) actEl.innerHTML = '';
  }

  /* ── Admin panel view ────────────────────────────────────────────────────── */
  function adminView() {
    if (!_isAdmin) return '<div class="pg"><p class="mute">Access denied.</p></div>';
    return '<div class="admin-main">'
      + '<div><h1 style="font-size:24px;margin:0 0 0.25rem;color:var(--ink);font-weight:700">' + T('adminTitle') + '</h1>'
          + '<p style="color:var(--mute);margin:0;font-size:14px">' + T('adminSub') + '</p></div>'
      + '<div class="admin-tabs" id="admin-tabs">'
          + '<button class="admin-tab active" data-tab="pending">' + T('adminTabPending') + ' <span class="tab-badge" id="tab-pending-count"></span></button>'
          + '<button class="admin-tab" data-tab="flood">' + T('adminTabFlood') + '</button>'
          + '<button class="admin-tab" data-tab="shelters">' + T('adminTabShelters') + '</button>'
          + '<button class="admin-tab" data-tab="codes">' + T('adminTabCodes') + '</button>'
          + '<button class="admin-tab" data-tab="officials">' + T('adminTabOfficials') + '</button>'
      + '</div>'
      + '<div class="tab-panel" id="panel-pending">'
          + '<div class="admin-section"><div class="admin-section-head"><div>'
              + '<h2>' + T('adminPendingTitle') + '</h2>'
              + '<p>' + T('adminPendingSub') + '</p>'
          + '</div><span class="badge badge-pending" id="pending-count">0 ' + T('adminPendingBadge') + '</span></div>'
          + '<div id="pending-list"></div></div>'
      + '</div>'
      + '<div class="tab-panel" id="panel-flood" style="display:none">'
          + '<div class="admin-section"><div class="admin-section-head"><div>'
              + '<h2>' + T('adminFloodTitle') + '</h2>'
              + '<p>' + T('adminFloodSub') + '</p>'
          + '</div><span class="badge" id="flood-current-badge">' + T('loading') + '</span></div>'
          + '<div class="gen-form" style="flex-direction:column;gap:1rem">'
              + '<div style="display:flex;gap:0.75rem;flex-wrap:wrap;width:100%">'
                  + '<div style="flex:1;min-width:160px"><label class="gen-label">' + T('adminFloodLevelLbl') + '</label>'
                      + '<select class="gen-input" id="flood-level">'
                          + '<option value="0">0 — ' + T('lv')[0] + '</option>'
                          + '<option value="1">1 — ' + T('lv')[1] + '</option>'
                          + '<option value="2">2 — ' + T('lv')[2] + '</option>'
                          + '<option value="3">3 — ' + T('lv')[3] + '</option>'
                      + '</select></div>'
                  + '<div style="flex:1;min-width:120px"><label class="gen-label">' + T('adminFloodWindLbl') + '</label>'
                      + '<input class="gen-input" id="flood-wind" type="number" step="0.1" min="0" placeholder="' + (S.lang === 'fil' ? 'hal. 12' : 'e.g. 12') + '"></div>'
                  + '<div style="flex:1;min-width:120px"><label class="gen-label">' + T('adminFloodRainLbl') + '</label>'
                      + '<input class="gen-input" id="flood-rain" type="number" step="0.1" min="0" placeholder="' + (S.lang === 'fil' ? 'hal. 0.5' : 'e.g. 0.5') + '"></div>'
              + '</div>'
              + '<div style="width:100%"><label class="gen-label">' + T('adminFloodNotesLbl') + '</label>'
                  + '<input class="gen-input" id="flood-notes" type="text" placeholder="' + T('adminFloodNotesPlaceholder') + '"></div>'
              + '<button class="gen-btn" id="flood-btn" style="align-self:flex-start">' + T('adminFloodBtn') + '</button>'
              + '<p style="font-size:12px;color:var(--dim);margin:0">' + T('adminFloodHint') + '</p>'
          + '</div></div>'
      + '</div>'
      + '<div class="tab-panel" id="panel-shelters" style="display:none">'
          + '<div class="admin-section"><div class="admin-section-head"><div>'
              + '<h2>' + T('adminShelterTitle') + '</h2>'
              + '<p>' + T('adminShelterSub') + '</p>'
          + '</div></div>'
          + '<div id="shelters-list"></div></div>'
      + '</div>'
      + '<div class="tab-panel" id="panel-codes" style="display:none">'
          + '<div class="admin-section"><div class="admin-section-head"><div>'
              + '<h2>' + T('adminCodesTitle') + '</h2>'
              + '<p>' + T('adminCodesSub') + '</p>'
          + '</div></div>'
          + '<div class="gen-form">'
              + '<div style="flex:1;min-width:180px"><label class="gen-label" for="gen-note">' + T('adminCodesGenNoteLbl') + ' <span style="text-transform:none;font-weight:400;letter-spacing:0;font-size:11.5px;color:var(--dim)">' + T('adminCodesGenNoteOptional') + '</span></label>'
                  + '<input class="gen-input" id="gen-note" type="text" placeholder="' + T('adminCodesGenNotePlaceholder') + '"></div>'
              + '<button class="gen-btn" id="gen-btn">' + T('adminCodesGenBtn') + '</button>'
          + '</div>'
          + '<table class="code-table"><thead><tr>'
              + '<th>' + T('adminCodesThCode') + '</th><th>' + T('adminCodesThNote') + '</th>'
              + '<th>' + T('adminCodesThCreated') + '</th><th>' + T('adminCodesThStatus') + '</th>'
              + '<th>' + T('adminCodesThUsedBy') + '</th><th></th>'
          + '</tr></thead>'
              + '<tbody id="code-tbody"></tbody></table>'
          + '<div id="code-empty" class="empty" style="display:none">' + T('adminCodesEmpty') + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="tab-panel" id="panel-officials" style="display:none">'
          + '<div class="admin-section"><div class="admin-section-head"><div>'
              + '<h2>' + T('adminOfficialsTitle') + '</h2>'
              + '<p>' + T('adminOfficialsSub') + '</p>'
          + '</div><span class="badge badge-active" id="officials-count">0' + T('adminOfficialsSuffix') + '</span></div>'
          + '<div id="officials-list"></div></div>'
      + '</div>'
    + '</div>';
  }

  function initAdminPanel() {
    /* ── Tab switching ─────────────────────────────────────────────────────── */
    var adminTabsEl = document.getElementById('admin-tabs');
    if (!adminTabsEl || adminTabsEl._init) return;
    adminTabsEl._init = true;

    adminTabsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.admin-tab');
      if (!btn) return;
      document.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.style.display = 'none'; });
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.tab).style.display = '';
    });

    var LEVEL_LABELS = T('lv');
    var LEVEL_BADGES = ['badge-active', 'badge-unused', 'badge-pending', 'badge-expired'];

    function api(url, options) {
      return fetch(url, Object.assign({ credentials: 'same-origin' }, options))
        .then(function (r) { return r.json(); });
    }

    /* ── Pending approvals ───────────────────────────────────────────────── */
    function renderPending() {
      var el    = document.getElementById('pending-list');
      var count = document.getElementById('pending-count');
      var badge = document.getElementById('tab-pending-count');
      if (!el) return;
      el.innerHTML = '<div class="empty">' + T('loading') + '</div>';

      api('api/admin/pending.php')
        .then(function (data) {
          if (!data.ok) { toast(T('adminPendingLoad')); return; }
          var pending = data.pending;
          if (count) { count.textContent = pending.length + ' ' + T('adminPendingBadge'); count.className = 'badge ' + (pending.length > 0 ? 'badge-pending' : 'badge-used'); }
          if (badge) { badge.textContent = pending.length; badge.className = 'tab-badge' + (pending.length > 0 ? ' on' : ''); }

          if (pending.length === 0) { el.innerHTML = '<div class="empty">' + T('adminPendingEmpty') + '</div>'; return; }

          el.innerHTML = pending.map(function (u) {
            return '<div class="approval-row">'
              + '<div class="approval-info"><strong>' + u.full_name + '</strong>'
                  + '<span>' + (u.email || u.phone_number || '') + (u.barangay_name ? ' &mdash; ' + u.barangay_name + (u.barangay_city ? ', ' + u.barangay_city : '') : '') + '</span></div>'
              + '<div class="approval-actions">'
                  + '<button class="btn-approve" data-id="' + u.id + '">' + T('adminApproveBtn') + '</button>'
                  + '<button class="btn-reject"  data-id="' + u.id + '">' + T('adminRejectBtn') + '</button>'
              + '</div></div>';
          }).join('');

          el.querySelectorAll('.btn-approve').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = parseInt(this.dataset.id);
              var name = btn.closest('.approval-row').querySelector('strong').textContent;
              confirm({
                title: T('adminApproveTitle'),
                body:  T('adminApproveBody') + '<b>' + name + '</b>.',
                okLabel: T('adminApproveOk'), okClass: 'ac',
                onOk: function () {
                  btn.disabled = true;
                  api('api/admin/pending.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: id, action: 'approve' }) })
                    .then(function (data) { if (!data.ok) { toast(data.error || T('nabigo')); btn.disabled = false; return; } renderPending(); renderOfficials(); toast(T('adminApproveToast')); });
                }
              });
            });
          });
          el.querySelectorAll('.btn-reject').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = parseInt(this.dataset.id);
              var name = btn.closest('.approval-row').querySelector('strong').textContent;
              confirm({
                title: T('adminRejectTitle'),
                body:  T('adminRejectBody') + '<b>' + name + '</b>' + T('adminRejectBodySuffix'),
                okLabel: T('adminRejectOk'), okClass: 'o',
                onOk: function () {
                  btn.disabled = true;
                  api('api/admin/pending.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: id, action: 'reject' }) })
                    .then(function (data) { if (!data.ok) { toast(data.error || T('nabigo')); btn.disabled = false; return; } renderPending(); toast(T('adminRejectToast')); });
                }
              });
            });
          });
        })
        .catch(function () { toast(T('adminPendingLoad')); });
    }

    /* ── Officials ───────────────────────────────────────────────────────── */
    function renderOfficials() {
      var el = document.getElementById('officials-list');
      var countEl = document.getElementById('officials-count');
      if (!el) return;
      el.innerHTML = '<div class="empty">' + T('loading') + '</div>';

      api('api/admin/officials.php')
        .then(function (data) {
          if (!data.ok) { toast(T('adminOfficialsLoad')); return; }
          var officials = data.officials;
          if (countEl) countEl.textContent = officials.length + T(officials.length === 1 ? 'adminOfficialsSuffix' : 'adminOfficialsSuffixPl');
          if (officials.length === 0) { el.innerHTML = '<div class="empty">' + T('adminOfficialsEmpty') + '</div>'; return; }

          el.innerHTML = officials.map(function (u) {
            var avatar = u.avatar_path ? '<img src="' + u.avatar_path + '" alt="">' : (u.full_name || '?').charAt(0).toUpperCase();
            return '<div class="officials-row">'
              + '<div class="officials-avatar">' + avatar + '</div>'
              + '<div class="officials-info"><strong>' + u.full_name + '</strong>'
                  + '<span>' + (u.barangay_name ? u.barangay_name + (u.barangay_city ? ', ' + u.barangay_city : '') : '') + (u.email ? ' &mdash; ' + u.email : '') + (!u.email && u.phone_number ? u.phone_number : '') + '</span></div>'
              + '<span class="badge badge-active" style="margin-right:0.5rem">' + T('adminOfficialsActive') + '</span>'
              + '<button class="btn-revoke" data-id="' + u.id + '">' + T('adminOfficialsRevokeBtn') + '</button>'
            + '</div>';
          }).join('');

          el.querySelectorAll('[data-id]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              if (!window.confirm(T('adminOfficialsRevokeConfirm'))) return;
              var id = parseInt(this.dataset.id); btn.disabled = true;
              api('api/admin/officials.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: id }) })
                .then(function (data) { if (!data.ok) { toast(data.error || T('adminOfficialsFail')); btn.disabled = false; return; } renderOfficials(); toast(T('adminOfficialsRevokeToast')); });
            });
          });
        })
        .catch(function () { toast(T('adminOfficialsLoad')); });
    }

    /* ── Invite codes ────────────────────────────────────────────────────── */
    function renderCodes() {
      var tbody = document.getElementById('code-tbody');
      var empty = document.getElementById('code-empty');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="6" style="padding:1.2rem;color:var(--dim)">' + T('loading') + '</td></tr>';

      api('api/admin/codes.php')
        .then(function (data) {
          if (!data.ok) { toast(T('adminCodesLoad')); return; }
          var codes = data.codes;
          if (codes.length === 0) { tbody.innerHTML = ''; if (empty) empty.style.display = ''; return; }
          if (empty) empty.style.display = 'none';

          tbody.innerHTML = codes.map(function (c) {
            var badgeCls = c.status === 'unused' ? 'badge-unused' : c.status === 'used' ? 'badge-used' : 'badge-expired';
            var badgeTxt = c.status === 'unused' ? T('adminCodesNotUsed') : c.status === 'used' ? T('adminCodesUsed') : T('adminCodesExpired');
            return '<tr>'
              + '<td><button class="code-mono" data-copy="' + c.code + '">' + c.code + '</button></td>'
              + '<td style="color:var(--mute)">' + (c.note || '<span style="color:var(--dim)">—</span>') + '</td>'
              + '<td style="color:var(--dim);font-size:13px">' + c.created_at.slice(0, 16).replace('T', ' ') + '</td>'
              + '<td><span class="badge ' + badgeCls + '">' + badgeTxt + '</span></td>'
              + '<td style="color:var(--dim);font-size:13px">' + (c.used_by_name || '—') + '</td>'
              + '<td>' + (c.status === 'unused' ? '<button class="btn-revoke" data-id="' + c.id + '">' + T('adminOfficialsRevokeBtn') + '</button>' : '') + '</td>'
            + '</tr>';
          }).join('');

          tbody.querySelectorAll('[data-copy]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              navigator.clipboard.writeText(this.dataset.copy).then(function () { toast(T('adminCodesCopy')); });
            });
          });
          tbody.querySelectorAll('[data-id]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = this.dataset.id;
              confirm({
                title: T('adminCodesRevokeTitle'),
                body:  T('adminCodesRevokeBody'),
                okLabel: T('adminCodesRevokeOk'), okClass: 'o',
                onOk: function () {
                  api('api/admin/codes.php?id=' + id, { method: 'DELETE' })
                    .then(function (data) { if (!data.ok) { toast(data.error || T('adminCodesRevokeFail')); return; } renderCodes(); toast(T('adminCodesRevokeToast')); });
                }
              });
            });
          });
        })
        .catch(function () { toast(T('adminCodesLoad')); });
    }

    var genBtn = document.getElementById('gen-btn');
    if (genBtn) {
      genBtn.addEventListener('click', function () {
        var note = document.getElementById('gen-note').value.trim();
        genBtn.disabled = true;
        api('api/admin/codes.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: note }) })
          .then(function (data) {
            genBtn.disabled = false;
            if (!data.ok) { toast(data.error || T('adminCodesGenFail')); return; }
            document.getElementById('gen-note').value = '';
            renderCodes();
            toast(T('adminCodesGenToast') + data.code + T('adminCodesGenToastSuffix'));
          })
          .catch(function () { genBtn.disabled = false; toast(T('adminCodesGenNoServer')); });
      });
    }

    /* ── Flood level ─────────────────────────────────────────────────────── */
    function renderFlood() {
      api('api/flood.php')
        .then(function (data) {
          if (!data.ok) return;
          var f = data.flood; var lv = parseInt(f.level) || 0;
          var bdg = document.getElementById('flood-current-badge');
          if (bdg) { bdg.textContent = T('adminFloodCurrentPrefix') + lv + ' — ' + LEVEL_LABELS[lv]; bdg.className = 'badge ' + LEVEL_BADGES[lv]; }
          var lvEl = document.getElementById('flood-level'); if (lvEl) lvEl.value = lv;
          var wEl = document.getElementById('flood-wind'); if (wEl && f.wind_kmh) wEl.value = parseFloat(f.wind_kmh);
          var rEl = document.getElementById('flood-rain'); if (rEl && f.rain_mmh) rEl.value = parseFloat(f.rain_mmh);
        }).catch(function () {});
    }

    var floodBtn = document.getElementById('flood-btn');
    if (floodBtn) {
      floodBtn.addEventListener('click', function () {
        var level = parseInt(document.getElementById('flood-level').value);
        var wind  = parseFloat(document.getElementById('flood-wind').value) || 0;
        var rain  = parseFloat(document.getElementById('flood-rain').value) || 0;
        var notes = document.getElementById('flood-notes').value.trim();

        function doFloodUpdate() {
          floodBtn.disabled = true; floodBtn.textContent = T('adminFloodUpdating');
          api('api/flood.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level: level, wind_kmh: wind, rain_mmh: rain, notes: notes, notify_sms: level >= 1 }) })
            .then(function (data) {
              floodBtn.disabled = false; floodBtn.textContent = T('adminFloodBtn');
              if (!data.ok) { toast(data.error || T('adminFloodFail')); return; }
              document.getElementById('flood-notes').value = '';
              renderFlood();
              var sms = data.sms || {};
              toast(T('adminFloodUpdated') + level + ' — ' + LEVEL_LABELS[level] + (sms.sent > 0 ? ' · ' + sms.sent + ' SMS' : ''));
            })
            .catch(function () { floodBtn.disabled = false; floodBtn.textContent = T('adminFloodBtn'); toast(T('adminFloodNoServer')); });
        }

        confirm({
          title: T('adminFloodConfirmTitle'),
          body:  T('adminFloodConfirmBody') + level + ' — ' + LEVEL_LABELS[level]
               + (level >= 1 ? T('adminFloodConfirmBodySms') : T('adminFloodConfirmBodyNoSms')),
          okLabel: T('adminFloodConfirmOk'), okClass: 'ac',
          onOk: doFloodUpdate
        });
      });
    }

    /* ── Shelters ────────────────────────────────────────────────────────── */
    function renderShelters() {
      var el = document.getElementById('shelters-list');
      if (!el) return;
      el.innerHTML = '<div class="empty">' + T('loading') + '</div>';

      api('api/admin/shelters.php')
        .then(function (data) {
          if (!data.ok) { toast(T('adminShelterLoad')); return; }
          var shelters = data.shelters;
          if (!shelters.length) { el.innerHTML = '<div class="empty">' + T('adminShelterEmpty') + '</div>'; return; }

          el.innerHTML = shelters.map(function (s) {
            var pct = s.capacity > 0 ? Math.round(s.occupancy / s.capacity * 100) : 0;
            var barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#22c55e';
            return '<div class="approval-row" style="flex-direction:column;align-items:stretch;gap:0.75rem">'
              + '<div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">'
                  + '<div style="flex:1;min-width:180px"><strong style="font-size:14px;color:var(--ink)">' + s.name + '</strong>'
                      + '<span style="display:block;font-size:12.5px;color:var(--mute)">' + (s.barangay_name || '') + (s.contact ? ' · ' + s.contact : '') + '</span></div>'
                  + '<span class="badge ' + (s.is_open ? 'badge-active' : 'badge-expired') + '">' + (s.is_open ? (S.lang === 'fil' ? 'Bukas' : 'Open') : (S.lang === 'fil' ? 'Sarado' : 'Closed')) + '</span>'
              + '</div>'
              + '<div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">'
                  + '<div style="flex:1;min-width:200px">'
                      + '<div style="height:8px;background:var(--s2);border-radius:4px;overflow:hidden;margin-bottom:4px">'
                          + '<div style="height:100%;width:' + pct + '%;background:' + barColor + ';border-radius:4px"></div></div>'
                      + '<span style="font-size:12.5px;color:var(--mute)">' + s.occupancy + ' / ' + s.capacity + ' (' + pct + T('adminShelterFull') + ')</span></div>'
                  + '<div style="display:flex;align-items:center;gap:0.5rem;flex-shrink:0">'
                      + '<label class="gen-label" style="margin:0;white-space:nowrap">' + T('adminShelterCountLbl') + '</label>'
                      + '<input class="gen-input" style="width:90px;padding:0.4rem 0.6rem" type="number" min="0" max="' + s.capacity + '" value="' + s.occupancy + '" id="occ-' + s.id + '">'
                      + '<button class="gen-btn" style="padding:0.4rem 0.9rem;font-size:13px" data-shelter-id="' + s.id + '" data-capacity="' + s.capacity + '">' + T('adminShelterSaveBtn') + '</button>'
                      + '<button class="btn-revoke" style="padding:0.35rem 0.75rem;font-size:12.5px" data-shelter-toggle="' + s.id + '" data-open="' + s.is_open + '">' + (s.is_open ? T('adminShelterCloseBtn') : T('adminShelterOpenBtn')) + '</button>'
                  + '</div>'
              + '</div>'
            + '</div>';
          }).join('');

          el.querySelectorAll('[data-shelter-id]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = parseInt(this.dataset.shelterId); var cap = parseInt(this.dataset.capacity);
              var occ = parseInt(document.getElementById('occ-' + id).value) || 0;
              if (occ > cap) { toast(T('adminShelterCapErr') + cap + ').'); return; }
              btn.disabled = true;
              api('api/admin/shelters.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id, occupancy: occ }) })
                .then(function (data) { btn.disabled = false; if (!data.ok) { toast(data.error || T('adminShelterFail')); return; } renderShelters(); toast(T('adminShelterOccUpdated')); })
                .catch(function () { btn.disabled = false; toast(T('adminShelterNoServer')); });
            });
          });
          el.querySelectorAll('[data-shelter-toggle]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = parseInt(this.dataset.shelterToggle); var isOpen = parseInt(this.dataset.open);
              var occ = parseInt(document.getElementById('occ-' + id).value) || 0;
              confirm({
                title: isOpen ? T('adminShelterCloseTitle') : T('adminShelterOpenTitle'),
                body:  isOpen ? T('adminShelterCloseBody') : T('adminShelterOpenBody'),
                okLabel: isOpen ? T('adminShelterCloseOk') : T('adminShelterOpenOk'), okClass: 'ac',
                onOk: function () {
                  btn.disabled = true;
                  api('api/admin/shelters.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id, occupancy: occ, is_open: isOpen ? 0 : 1 }) })
                    .then(function (data) { btn.disabled = false; if (!data.ok) { toast(data.error || T('adminShelterFail')); return; } renderShelters(); toast(T('adminShelterStatusUpdated')); })
                    .catch(function () { btn.disabled = false; });
                }
              });
            });
          });
        })
        .catch(function () { toast(T('adminShelterLoad')); });
    }

    /* ── Initial load ────────────────────────────────────────────────────── */
    renderPending();
    renderCodes();
    renderOfficials();
    renderFlood();
    renderShelters();
  }

  function render() {
    var scrollY = window.scrollY;
    var views   = { radar: radar, centers: centers, reports: reports, hotlines: hotlines, admin: adminView };
    $('#pg').innerHTML = (views[S.tab] || radar)();
    band();
    netbar();
    nav();
    if (S.tab === 'radar') { initMapAfterRender(); updateWeatherUI(); }
    if (S.tab === 'reports') {
      var led = document.getElementById('reports-led');
      if (led) { _renderReportRows(led); _renderLoadMore(); }
    }
    if (S.tab === 'admin') { initAdminPanel(); }
    document.documentElement.lang = S.lang === 'fil' ? 'fil' : 'en';

    // Sync language toggle pressed state
    document.querySelectorAll('#lg button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.v === S.lang));
    });

    window.scrollTo(0, scrollY);
  }

  /* ── Dialogs ─────────────────────────────────────────────────────────────── */
  var C   = 2 * Math.PI * 46;  // SOS ring circumference
  var n   = 1;                  // people count
  var dep = T('depKnee');            // flood depth default chip
  var raf = 0, t0 = 0, tm = [];
  var _stopCurrentSosPoll = null; // set by sent(), cleared by A.close()

  function dlg(h) {
    $('#dlg').innerHTML = h;
    $('#shade').classList.add('on');
  }

  function xb() {
    return '<button data-a="close" aria-label="Close" style="padding:6px">' + ic('x') + '</button>';
  }

  /**
   * confirm(opts) — reusable confirmation modal
   * opts: { title, body, okLabel, okClass, onOk }
   */
  function confirm(opts) {
    var okClass = opts.okClass || '';
    dlg(
      '<header><h3>' + opts.title + '</h3>' + xb() + '</header>'
      + '<p class="mute" style="width:100%;font-size:14px;line-height:1.6">' + opts.body + '</p>'
      + '<div style="display:flex;gap:8px;width:100%;justify-content:flex-end;margin-top:4px">'
          + '<button class="btn o" data-a="close">' + T('cancel') + '</button>'
          + '<button class="btn' + (okClass ? ' ' + okClass : '') + '" id="confirm-ok-btn">'
              + (opts.okLabel || T('confirmBtn'))
          + '</button>'
      + '</div>'
    );
    document.getElementById('confirm-ok-btn').addEventListener('click', function () {
      A.close();
      opts.onOk();
    });
  }

  function sosForm() {
    dlg(
      '<header><h3>' + T('sos') + '</h3>' + xb() + '</header>'
      + '<p class="mute" style="width:100%">' + T('sosHint') + '</p>'
      + '<div class="hb">'
          + '<svg viewBox="0 0 100 100" aria-hidden="true">'
              + '<circle class="tr" cx="50" cy="50" r="46"/>'
              + '<circle id="ring" cx="50" cy="50" r="46" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '"/>'
          + '</svg>'
          + '<button id="hold" aria-label="' + T('holdBtn') + '">' + (S.lang === 'fil' ? 'Hawakan' : 'Hold') + '</button>'
      + '</div>'
      + '<div class="stp">'
          + '<button data-a="m" aria-label="' + T('decrease') + '">&minus;</button>'
          + '<output id="pp">' + n + ' ' + (n === 1 ? T('people') : T('peoplePl')) + '</output>'
          + '<button data-a="p" aria-label="' + T('increase') + '">+</button>'
      + '</div>'
      + '<div class="chips" role="group" aria-label="' + (S.lang === 'fil' ? 'Lalim ng baha' : 'Flood depth') + '">'
          + [T('depAnkle'), T('depKnee'), T('depWaist'), T('depChest')].map(function (d) {
              return '<button class="chp" data-a="dep" data-v="' + d + '" aria-pressed="' + (d === dep) + '">' + d + '</button>';
            }).join('')
      + '</div>'
      + '<input class="fi" type="tel" id="sos-phone" placeholder="' + T('phonePlaceholder') + '" aria-label="' + T('phoneLbl') + '">'
      + '<p class="dim" style="font-size:13px">' + T('sosLocNote') + '</p>'
      + '<div style="display:flex;gap:8px;width:100%">'
          + '<a class="btn o" style="flex:1" href="tel:911">' + ic('phone') + (S.lang === 'fil' ? 'Tumawag sa 911' : 'Call 911') + '</a>'
          + '<button class="btn o" style="flex:1" data-a="sos-sms">' + T('sendSms') + '</button>'
      + '</div>'
    );

    var hold = $('#hold');
    hold.addEventListener('pointerdown', hs);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (e) {
      hold.addEventListener(e, hx);
    });
    hold.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) hs(e);
    });
    hold.addEventListener('keyup', hx);
  }

  function tick(now) {
    var p = Math.min((now - t0) / 1000, 1);
    var r = $('#ring');
    if (r) r.style.strokeDashoffset = C * (1 - p);
    if (p >= 1) { sent(); return; }
    raf = requestAnimationFrame(tick);
  }

  function hs(e) {
    e.preventDefault();
    cancelAnimationFrame(raf);
    t0  = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function hx() {
    cancelAnimationFrame(raf);
    var r = $('#ring');
    if (r) r.style.strokeDashoffset = C;
  }

  function sent() {
    try { navigator.vibrate && navigator.vibrate(80); } catch (e) {}

    // Build SOS details
    var phoneEl = $('#sos-phone');
    var phone   = phoneEl ? phoneEl.value.trim() : '';
    var title   = 'SOS: ' + n + ' ' + T('peoplePl') + ', ' + (S.lang === 'fil' ? 'baha sa ' : 'flooding at ') + dep.toLowerCase();
    var desc    = (S.lang === 'fil' ? 'Bilang ng tao: ' : 'Number of people: ') + n + '. '
                + (S.lang === 'fil' ? 'Lalim ng baha: ' : 'Flood depth: ') + dep + '.'
                + (phone ? (S.lang === 'fil' ? ' Telepono: ' : ' Phone: ') + phone : '');
    var locStr  = (_userLat !== null)
      ? 'Lat ' + _userLat.toFixed(5) + ', Lon ' + _userLon.toFixed(5)
      : 'Dalongue, Santa Barbara';

    // Show confirmation dialog immediately (don't wait for network)
    dlg(
      '<header><h3>' + T('sosSent') + '</h3>' + xb() + '</header>'
      + '<img src="' + LOGO + '" alt="" style="width:64px;height:64px;border-radius:50%">'
      + '<p class="mute" style="text-align:center">' + T('sosBody') + '</p>'
      + '<p class="mono dim" style="font-size:13px" id="sos-ref">' + T('loading') + '</p>'
      + '<ul class="tl">'
          + '<li id="s1">' + T('s1') + '</li>'
          + '<li id="s2">' + T('s2') + '</li>'
          + '<li id="s3">' + T('s3') + '</li>'
      + '</ul>'
      + '<a class="btn w" href="tel:911">' + ic('phone') + (S.lang === 'fil' ? 'Tumawag sa 911' : 'Call 911') + '</a>'
      + '<button class="ul" data-a="safe">' + T('sosCancelBtn') + '</button>'
    );

    // Mark step 1 (Natanggap) immediately — the report was received by the server
    tm.forEach(clearTimeout);
    tm = [setTimeout(function () {
      var el = $('#s1'); if (el) el.classList.add('d2');
    }, 300)];

    // Polling state
    var _sosReportId  = null;
    var _sosPollTimer = null;

    function _stopSosPoll() {
      if (_sosPollTimer) { clearInterval(_sosPollTimer); _sosPollTimer = null; }
    }

    function _pollSosStatus() {
      if (!_sosReportId) return;
      fetch('api/reports.php?id=' + _sosReportId, { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.ok || !data.report) return;
          var status = data.report.status;

          // Step 2 — official acknowledged
          if (status === 'acknowledged' || status === 'dispatched' || status === 'resolved') {
            var s2 = $('#s2');
            if (s2 && !s2.classList.contains('d2')) s2.classList.add('d2');
          }

          // Step 3 — dispatched or resolved
          if (status === 'dispatched' || status === 'resolved') {
            var s3 = $('#s3');
            if (s3 && !s3.classList.contains('d2')) s3.classList.add('d2');
            _stopSosPoll(); // done — no need to keep polling
          }
        })
        .catch(function () {}); // silent — offline is expected
    }

    // POST to database
    fetch('api/reports.php', {
      method:      'POST',
      credentials: 'same-origin',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({
        title:       title,
        description: desc,
        location:    locStr,
        is_sos:      1
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var refEl = $('#sos-ref');
        if (refEl) {
          refEl.textContent = data.ok
            ? 'Ref #' + data.id + ' · ' + n + ' ' + T('peoplePl') + ' · ' + dep
            : T('savedOffline');
        }
        if (data.ok && data.id) {
          _sosReportId = data.id;
          // Poll every 8 seconds for real status updates from officials
          _sosPollTimer = setInterval(_pollSosStatus, 8000);
          // Store stop function so A.close() can cancel it
          _stopCurrentSosPoll = _stopSosPoll;
        }
        fetchReports(true);
      })
      .catch(function () {
        var refEl = $('#sos-ref');
        if (refEl) refEl.textContent = T('savedOffline');
      });
  }

  function repForm() {
    var locStr = (_userLat !== null)
      ? _userLat.toFixed(4) + ', ' + _userLon.toFixed(4)
      : 'Dalongue, Santa Barbara';

    dlg(
      '<header><h3>' + T('repFormTitle') + '</h3>' + xb() + '</header>'
      + '<div class="chips" style="width:100%" role="group" aria-label="' + (S.lang === 'fil' ? 'Uri' : 'Type') + '">'
          + [T('typFlood'), T('typMedical'), T('typRelief'), T('typDebris')].map(function (t, i) {
              return '<button class="chp" data-a="rt" aria-pressed="' + (i === 0) + '">' + t + '</button>';
            }).join('')
      + '</div>'
      + '<input class="fi" id="rep-title" placeholder="' + T('repTitlePlaceholder') + '" aria-label="' + T('repTitleLbl') + '" required>'
      + '<textarea class="fi" id="rep-desc" placeholder="' + T('repDescPlaceholder') + '" aria-label="' + T('repDescLbl') + '" rows="3" style="resize:vertical"></textarea>'
      + '<div style="width:100%">'
          + '<label style="font-size:12px;color:var(--mute);display:block;margin-bottom:4px">' + T('repLocLbl') + '</label>'
          + '<input class="fi" id="rep-loc" value="' + locStr + '" aria-label="' + T('repLocLbl') + '" style="margin:0">'
      + '</div>'
      + '<p class="dim" style="width:100%;font-size:12px;margin-top:4px">' + T('repLocNote') + '</p>'
      + '<button class="btn ac w" data-a="rsend">' + T('repSend') + '</button>'
    );
  }

  function pubForm() {
    var levels = [T('lv')[1], T('lv')[2], T('lv')[3]];
    var r      = S.pubReach;
    var reachLabel = r
      ? (r.sms_enabled
          ? r.sms_capable + ' SMS · ' + r.registered + ' ' + (S.lang === 'fil' ? 'rehistrado' : 'registered')
          : r.registered + ' ' + T('reachDisabled'))
      : T('reachLoading');
    var btnReach = r ? (r.sms_capable || r.registered) : '…';

    dlg(
      '<header><h3>' + T('pubb') + '</h3>' + xb() + '</header>'
      + '<div class="chips" style="width:100%" role="group" aria-label="' + (S.lang === 'fil' ? 'Antas' : 'Level') + '">'
          + levels.map(function (lbl, i) {
              return '<button class="chp" data-a="pl" data-v="' + (i + 1) + '" aria-pressed="' + (S.pubLv === i + 1) + '">' + lbl + '</button>';
            }).join('')
      + '</div>'
      + '<textarea class="fi" id="pub-msg" aria-label="' + (S.lang === 'fil' ? 'Mensahe' : 'Message') + '">' + T('ti')[S.pubLv] + '. ' + T('td')[S.pubLv][0] + '</textarea>'
      + '<div class="rw" style="width:100%"><span>' + T('areas') + '</span><span>Barangay Dalongue</span></div>'
      + '<div class="rw" style="width:100%"><span>' + T('reach') + '</span><span class="mono">' + reachLabel + '</span></div>'
      + '<button class="btn w" data-a="pubgo" style="' + (S.pubC ? 'background:var(--rose);color:#fff' : '') + '">'
          + (S.pubLv === 3 && !S.pubC ? T('pubReview')
            : S.pubLv === 3           ? T('pubConfirm')
                                      : T('pubSend') + btnReach + ')')
      + '</button>'
      + '<p class="dim" style="font-size:13px;text-align:center">' + T('pubFooter') + '</p>'
    );
  }

  function fetchAlertReach(thenOpen) {
    fetch('api/flood.php?reach=1', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        S.pubReach = (data.ok && data.reach) ? data.reach : null;
        if (thenOpen) pubForm();
      })
      .catch(function () {
        S.pubReach = null;
        if (thenOpen) pubForm();
      });
  }

  /* ── Action handlers ─────────────────────────────────────────────────────── */
  var A = {
    tab:   function (v)     { S.tab = v; render(); },
    route: function (v) {
      var idx = +v;
      if (S.tab !== 'radar') {
        S.tab = 'radar';
        render();
        // Wait for map to initialise after render before drawing
        setTimeout(function () { _drawRoute(idx); }, 350);
      } else {
        // Map already visible — draw immediately (small delay for re-renders)
        setTimeout(function () { _drawRoute(idx); }, 50);
      }
      toast(T('routeDrawing') + CT[idx].n + '…');
    },
    open:  function (v)     { S.open = S.open === v ? null : v; render(); },
    more:  function ()      { S.more = !S.more; render(); },
    'load-more': function () {
      if (_reportPage < _reportPages) {
        _reportPage++;
        var btn = document.getElementById('load-more-btn');
        if (btn) { btn.disabled = true; btn.textContent = T('loading'); }
        fetchReports(false);
      }
    },
    'upd-shelter': function (v) {
      var idx = +v;
      var inp = document.getElementById('socc-' + idx);
      if (!inp) return;
      var occ = parseInt(inp.value) || 0;
      var cap = CT[idx].c;
      if (occ > cap) { toast(T('shelterCapErr') + cap + ').'); return; }
      // Need the DB shelter id — stored in CT when fetched
      var shelterId = CT[idx].dbId;
      if (!shelterId) { toast(T('shelterNoDb')); return; }
      fetch('api/admin/shelters.php', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shelterId, occupancy: occ })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.ok) { toast(data.error || T('adminShelterFail')); return; }
          CT[idx].o = occ;
          fetchShelters();
          toast(T('shelterUpdated') + CT[idx].n + T('shelterUpdatedSuffix'));
        })
        .catch(function () { toast(T('shelterNoServer')); });
    },
    adv:   function (v) {
      var r = S.reps[v];
      if (!r || r.st >= 3) return;
      var statusMap = ['acknowledged', 'dispatched', 'resolved'];
      var newStatus = statusMap[r.st];
      var labels = T('advLabel');
      var bodies = T('advBody');

      function doAdv() {
        if (r.id) {
          fetch('api/reports.php', {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: r.id, status: newStatus })
          })
            .then(function (res) { return res.json(); })
            .then(function (data) {
              if (data.ok) { r.st++; render(); }
              else toast(T('advFail'));
            })
            .catch(function () { r.st++; render(); });
        } else {
          r.st++; render();
        }
      }

      confirm({
        title: T('advTitle')[r.st],
        body:  bodies[r.st],
        okLabel: labels[r.st], okClass: 'ac',
        onOk: doAdv
      });
    },
    zin:   function ()      { if (_map) _map.zoomIn(); },
    zout:  function ()      { if (_map) _map.zoomOut(); },
    zr:    function ()      {
      if (_userLat !== null && _map) {
        _map.flyTo({ center: [_userLon, _userLat], zoom: 16 });
      } else {
        requestLocation();
        if (_map) _map.flyTo({ center: MAP_CENTER, zoom: MAP_ZOOM });
      }
    },
    lfl:   function ()      {
      S.fl = !S.fl;
      if (_map && _map.loaded()) {
        _removeLayer('flood-zone'); _floodLayerId = null;
        if (S.fl) _updateFloodLayer();
      }
      var b = document.querySelector('[data-a="lfl"]');
      if (b) b.setAttribute('aria-pressed', String(S.fl));
    },
    linc:  function ()      {
      S.inc = !S.inc;
      if (off()) _updateIncidentMarkers();
      var b = document.querySelector('[data-a="linc"]');
      if (b) b.setAttribute('aria-pressed', String(S.inc));
    },
    toast: function (v)     { toast(v); },
    sos:   sosForm,
    rep:   repForm,
    pub:   function ()      { S.pubC = 0; fetchAlertReach(true); },
    pl:    function (v)     { S.pubLv = +v; S.pubC = 0; pubForm(); },
    pubgo: function () {
      if (S.pubLv === 3 && !S.pubC) { S.pubC = 1; pubForm(); return; }

      var lv    = S.pubLv;
      var msgEl = document.getElementById('pub-msg');
      var notes = msgEl ? msgEl.value.trim() : '';
      if (!notes) notes = T('ti')[lv] + '. ' + T('td')[lv][0];
      var wind  = LVD[lv].w;
      var rain  = LVD[lv].r;

      function doPublish() {
        fetch('api/flood.php', {
          method:      'POST',
          credentials: 'same-origin',
          headers:     { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: lv, wind_kmh: wind, rain_mmh: rain, notes: notes, notify_sms: true })
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            A.close();
            S.lv   = lv;
            S.pubC = 0;
            render();
            if (!data.ok) { toast(T('pubLocalOnly') + (data.error || '')); return; }
            var sms = data.sms || {};
            var extra = sms.sent > 0 ? ' · ' + sms.sent + ' SMS ' + (S.lang === 'fil' ? 'naipadala' : 'sent') : (sms.note ? ' · SMS: ' + sms.note : '');
            toast(T('pubToast') + lv + ' — ' + T('lv')[lv] + ' ' + T('pubFor') + extra);
          })
          .catch(function () {
            A.close();
            S.lv   = lv;
            S.pubC = 0;
            render();
            toast(T('pubOffline'));
          });
      }

      // Level 3 already confirmed by the two-step button; levels 1 & 2 need a confirm
      if (S.pubC) {
        doPublish(); // level 3 second click — confirmed
      } else {
        var lvLabels = T('pubLvLabel');
        confirm({
          title: T('pubConfirmTitle') + lv + ' — ' + lvLabels[lv] + '?',
          body:  T('pubConfirmBody'),
          okLabel: T('pubConfirmOk'), okClass: 'ac',
          onOk: doPublish
        });
      }
    },
    close: function () {
      hx();
      tm.forEach(clearTimeout);
      if (_stopCurrentSosPoll) { _stopCurrentSosPoll(); _stopCurrentSosPoll = null; }
      $('#shade').classList.remove('on');
    },
    m: function () {
      n = Math.max(1, n - 1);
      $('#pp').textContent = n + ' ' + (n === 1 ? T('people') : T('peoplePl'));
    },
    p: function () {
      n = Math.min(20, n + 1);
      $('#pp').textContent = n + ' ' + (n === 1 ? T('people') : T('peoplePl'));
    },
    dep: function (v) {
      dep = v;
      document.querySelectorAll('[data-a="dep"]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.v === v));
      });
    },
    rt: function (v, el) {
      document.querySelectorAll('[data-a="rt"]').forEach(function (b) {
        b.setAttribute('aria-pressed', 'false');
      });
      el.setAttribute('aria-pressed', 'true');
    },
    rsend: function () {
      var titleEl = document.getElementById('rep-title');
      var descEl  = document.getElementById('rep-desc');
      var locEl   = document.getElementById('rep-loc');
      var title   = titleEl ? titleEl.value.trim() : '';
      var desc    = descEl  ? descEl.value.trim()  : '';
      var loc     = locEl   ? locEl.value.trim()   : '';
      if (!title) { toast(T('repRequired')); return; }
      fetch('api/reports.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title, description: desc, location: loc, is_sos: 0 })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          A.close();
          toast(data.message || (S.net ? T('repSentOk') : T('repSentOffline')));
          if (data.ok) fetchReports(true);
        })
        .catch(function () { A.close(); toast(T('repSentOffline')); });
    },
    safe: function () {
      confirm({
        title: T('sosSafeTitle'),
        body:  T('sosSafeBody'),
        okLabel: T('sosSafeOk'), okClass: 'ac',
        onOk: function () {
          A.close();
          toast(T('sosSafeToast'));
        }
      });
    },
    'sos-sms': function () {
      var body = encodeURIComponent(
        'SOS AGAPALERT: ' + n + ' tao nangangailangan ng tulong. '
        + 'Lalim ng baha: ' + dep + '. '
        + (_userLat !== null ? 'Lokasyon: ' + _userLat.toFixed(5) + ',' + _userLon.toFixed(5) : 'Dalongue, Santa Barbara')
        + '. Mangyaring sagutin agad.'
      );
      window.open('sms:+639175082024?body=' + body);
    }
  };

  /* ── Event delegation ────────────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]');
    if (!b || b.disabled) return;
    var a = A[b.dataset.a];
    if (a) a(b.dataset.v, b);
  });

  document.addEventListener('keydown', function (e) {
    var p = e.target.closest && e.target.closest('.pin');
    if ((e.key === 'Enter' || e.key === ' ') && p) {
      e.preventDefault();
      A.pin(p.dataset.v);
    }
    if (e.key === 'Escape') A.close();
  });

  $('#shade').addEventListener('click', function (e) {
    if (e.target.id === 'shade') A.close();
  });

  /* ── Theme toggle ────────────────────────────────────────────────────────── */
  var root     = document.documentElement;
  var themeBtn = document.getElementById('theme-btn');

  function applyTheme(dark) {
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    themeBtn.innerHTML = '<svg class="i"><use href="#i-' + (dark ? 'sun' : 'moon') + '"/></svg>';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    try { localStorage.setItem('agapalert_theme', dark ? 'dark' : 'light'); } catch (e) {}
  }

  var _savedTheme = localStorage.getItem('agapalert_theme');
  applyTheme(_savedTheme ? _savedTheme === 'dark' : true);

  themeBtn.addEventListener('click', function () {
    applyTheme(root.getAttribute('data-theme') !== 'dark');
  });

  // Language segmented control
  var _lgEl = document.getElementById('lg');
  if (_lgEl) {
    _lgEl.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b && b.dataset.v) { S.lang = b.dataset.v; render(); }
    });
  }

  /* ── Geolocation ─────────────────────────────────────────────────────────── */
  var _userLat = null;
  var _userLon = null;

  function _updateUserMarker() {
    if (!_map || _userLat === null) return;
    var el = document.createElement('div');
    el.style.cssText = 'width:18px;height:18px;border-radius:50%;background:#3b82f6;'
      + 'border:3px solid #fff;box-shadow:0 0 0 8px rgba(59,130,246,.2)';
    if (_userMarker) _userMarker.remove();
    _userMarker = new maplibregl.Marker({ element: el })
      .setLngLat([_userLon, _userLat])
      .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML('<b>Your location</b>'))
      .addTo(_map);
  }

  /* ── Route drawing ───────────────────────────────────────────────────────── */
  function _drawRoute(idx) {
    if (!_map) return;
    var dest = CT_COORDS[idx];
    if (!dest) return;

    // Remove existing route
    _removeLayer('route');
    _routeLayerId = null;

    var fromLon = _userLon !== null ? _userLon : MAP_CENTER[0];
    var fromLat = _userLat !== null ? _userLat : MAP_CENTER[1];

    function _setRouteBtn(shown) {
      document.querySelectorAll('[data-a="route"][data-v="' + idx + '"]').forEach(function (b) {
        b.innerHTML = ic('nav') + (shown ? T('shown') : T('route'));
      });
    }

    function _drawLine(coords) {
      var geojson = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords }
      };
      _map.addSource('route', { type: 'geojson', data: geojson });
      _map.addLayer({
        id: 'route', type: 'line', source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#00d4ff', 'line-width': 5, 'line-opacity': 0.9 }
      });
      _routeLayerId = 'route';
      // Fit map to route bounds
      var lons = coords.map(function(c){return c[0];});
      var lats = coords.map(function(c){return c[1];});
      _map.fitBounds(
        [[Math.min.apply(null,lons), Math.min.apply(null,lats)],
         [Math.max.apply(null,lons), Math.max.apply(null,lats)]],
        { padding: 60 }
      );
      _setRouteBtn(true);
    }

    // Try OSRM for a real walking route
    var url = 'https://router.project-osrm.org/route/v1/foot/'
      + fromLon + ',' + fromLat + ';'
      + dest[0] + ',' + dest[1]
      + '?overview=full&geometries=geojson';

    fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.routes || !data.routes[0]) {
          // Straight line fallback
          _drawLine([[fromLon, fromLat], [dest[0], dest[1]]]);
          return;
        }
        var coords = data.routes[0].geometry.coordinates; // already [lon,lat] for MapLibre
        var dist = (data.routes[0].distance / 1000).toFixed(1);
        var mins = Math.round(data.routes[0].duration / 60);
        _drawLine(coords);
        // Show popup at destination
        new maplibregl.Popup({ offset: 12, closeOnClick: true })
          .setLngLat(dest)
          .setHTML('<b>' + CT[idx].n + '</b><br>' + dist + ' km · ' + mins + ' min walk')
          .addTo(_map);
      })
      .catch(function () {
        _drawLine([[fromLon, fromLat], [dest[0], dest[1]]]);
      });
  }

  function requestLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        _userLat = pos.coords.latitude;
        _userLon = pos.coords.longitude;
        if (_map) {
          _map.flyTo({ center: [_userLon, _userLat], zoom: 16 });
          _updateUserMarker();
        }
        toast(T('locFound'));
      },
      function () { /* denied — stay on Dalongue */ },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  /* ── Weather fetch ───────────────────────────────────────────────────────── */
  // Dalongue, Santa Barbara, Pangasinan coordinates
  var WEATHER_LAT   = 15.9667;
  var WEATHER_LON   = 120.4167;
  var WEATHER_BRGID = 1;  // barangay_id for Dalongue

  // Live weather data from API (null until loaded)
  var W = null;

  function fetchWeather() {
    var url = 'api/weather.php?lat=' + WEATHER_LAT
            + '&lon=' + WEATHER_LON
            + '&barangay_id=' + WEATHER_BRGID;

    fetch(url, { credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.ok || !data.weather) return;
        W = data.weather;
        updateWeatherUI();
      })
      .catch(function () { /* offline — keep showing static values */ });
  }

  function updateWeatherUI() {
    if (!W) return;
    var factsEls = document.querySelectorAll('.facts > div');
    if (factsEls.length >= 2) {
      var dir = compassDir(W.wind_direction_deg);
      factsEls[0].innerHTML = T('wind') + '<b>' + Math.round(W.wind_speed_kmh) + ' km/h ' + dir + '</b>';
      factsEls[1].innerHTML = T('rain') + '<b>' + W.rain_mm.toFixed(1) + ' mm</b>';
    }
    // Update weather condition tile (index 3)
    if (factsEls.length >= 4 && W.weather_condition) {
      var condFil = wxLabel(W.weather_condition);
      factsEls[3].innerHTML = T('weather') + '<b>' + condFil + ' · ' + W.temperature.toFixed(1) + '°C</b>';
    }
  }

  function compassDir(deg) {
    if (deg == null) return '';
    var dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  // Weather condition translations (Filipino only — English uses the original key)
  var WX_FIL = {
    'Clear Sky':           'Maliwanag',
    'Mainly Clear':        'Halos Maliwanag',
    'Partly Cloudy':       'Bahagyang Maulap',
    'Overcast':            'Maulap',
    'Fog':                 'Ulap sa Lupa',
    'Rime Fog':            'Makapal na Ulap',
    'Light Drizzle':       'Ambon',
    'Moderate Drizzle':    'Katamtamang Ambon',
    'Dense Drizzle':       'Makapal na Ambon',
    'Slight Rain':         'Bahagyang Ulan',
    'Moderate Rain':       'Katamtamang Ulan',
    'Heavy Rain':          'Malakas na Ulan',
    'Slight Snow':         'Bahagyang Niyebe',
    'Moderate Snow':       'Katamtamang Niyebe',
    'Heavy Snow':          'Malakas na Niyebe',
    'Slight Shower':       'Mabilis na Ulan',
    'Moderate Shower':     'Katamtamang Shower',
    'Violent Shower':      'Malakas na Shower',
    'Thunderstorm':        'Kulog at Kidlat',
    'Thunderstorm + Hail': 'Bagyo at Yelo',
    'Severe Thunderstorm': 'Malakas na Bagyo'
  };

  // Returns the weather condition in the current language
  function wxLabel(condition) {
    if (!condition) return '';
    if (S.lang === 'fil') return WX_FIL[condition] || condition;
    return condition; // EN: use the original English key as-is
  }

  /* ── Live data fetch ─────────────────────────────────────────────────────── */

  var _lastRefresh = null;
  var _dataLoaded  = true;  // show data immediately, weather updates asynchronously

  function _updateRefreshTime() {
    _lastRefresh = new Date();
    var el = document.getElementById('last-refresh');
    if (el) el.textContent = nowHHMM();
  }

  function fetchFloodLevel() {
    fetch('api/flood.php', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok || !data.flood) return;
        var f = data.flood;
        var lv = Math.min(3, Math.max(0, parseInt(f.level) || 0));
        var firstLoad = S.lv === null;
        var changed   = S.lv !== lv;
        S.lv = lv;
        _updateRefreshTime();
        if (f.wind_kmh) LVD[lv].w = parseFloat(f.wind_kmh);
        if (f.rain_mmh) LVD[lv].r = parseFloat(f.rain_mmh);
        if (firstLoad || (changed && S.tab === 'radar')) render();
        else band();
      })
      .catch(function () {});
  }

  function fetchShelters() {
    fetch('api/shelters.php', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok || !data.shelters || !data.shelters.length) return;
        // Map DB shelters onto the CT array in order
        data.shelters.forEach(function (s, i) {
          if (!CT[i]) return;
          CT[i].dbId = parseInt(s.id);
          CT[i].c = parseInt(s.capacity)  || CT[i].c;
          CT[i].o = parseInt(s.occupancy) || 0;
          if (s.contact) CT[i].p = s.contact;
        });
        // Refresh shelter space in the facts bar if on radar tab
        if (S.tab === 'radar') {
          var sp = CT.reduce(function (a, x) { return a + x.c - x.o; }, 0);
          var factsEls = document.querySelectorAll('.facts > div');
          if (factsEls[2]) factsEls[2].innerHTML = T('space') + '<b>' + sp + '</b>';
        }
      })
      .catch(function () {});
  }

  var _reportPage     = 1;
  var _reportPages    = 1;
  var _reportLoading  = false;

  function _mapReport(r) {
    var stMap = { 'new': 0, 'acknowledged': 1, 'dispatched': 2, 'resolved': 3 };
    return {
      id:  r.id,
      t:   r.title,
      w:   r.location || r.barangay_name || 'Santa Barbara, Pangasinan',
      h:   timeAgo(r.created_at),
      st:  stMap[r.status] !== undefined ? stMap[r.status] : 0,
      pr:  r.is_sos ? T('lv')[3] : T('lv')[2],
      tr:  1,
      dt:  r.description || '',
      sos: r.is_sos ? 1 : 0
    };
  }

  function fetchReports(reset) {
    if (_reportLoading) return;
    if (reset) { _reportPage = 1; S.reps = []; }
    _reportLoading = true;

    fetch('api/reports.php?page=' + _reportPage + '&limit=20', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _reportLoading = false;
        if (!data.ok || !data.reports) return;
        var mapped = data.reports.map(_mapReport);
        if (_reportPage === 1) {
          S.reps = mapped;
        } else {
          // Append new page, avoid duplicates by id
          var ids = S.reps.map(function (r) { return r.id; });
          mapped.forEach(function (r) { if (ids.indexOf(r.id) === -1) S.reps.push(r); });
        }
        if (data.meta) _reportPages = data.meta.pages || 1;
        nav();
        // Refresh the reports tab list in place if it's currently visible
        if (S.tab === 'reports') {
          var led = document.querySelector('#pg .led');
          if (led) _renderReportRows(led);
          _renderLoadMore();
        }
      })
      .catch(function () { _reportLoading = false; });
  }

  function _renderReportRows(container) {
    var O    = off();
    var rows = S.reps.filter(function (r) { return O || !r.sos; });
    container.innerHTML = rows.map(function (r) {
      var i = S.reps.indexOf(r);
      var o = S.open === 'r' + i;
      return '<div class="r in">'
        + '<span class="mono dim">' + r.h + '</span>'
        + '<div>'
            + '<b class="t">' + r.t + '</b>'
            + '<span class="mute">' + r.w + '</span>'
            + (O
                ? '<div style="margin-top:6px;display:flex;gap:14px;flex-wrap:wrap">'
                    + '<span class="tg">' + ic('shield') + TB[r.tr] + '</span>'
                    + '<span class="tg">' + r.pr + (r.sos ? ' — SOS' : '') + '</span>'
                  + '</div>'
                : '')
        + '</div>'
        + '<span class="dot" style="--c:var(' + SC[r.st] + ')">' + ST[r.st] + '</span>'
        + '<div class="ops">'
            + (O && r.st < 3
                ? '<button class="btn s" data-a="adv" data-v="' + i + '">' + AC[r.st] + '</button>'
                : '')
            + (r.dt
                ? '<button class="btn s o" data-a="open" data-v="r' + i + '" aria-expanded="' + o + '">'
                    + (o ? T('hide') : T('details'))
                  + '</button>'
                : '')
        + '</div>'
        + (r.dt
            ? '<div class="fold' + (o ? ' on' : '') + '"><div><p>' + r.dt + '</p></div></div>'
            : '')
      + '</div>';
    }).join('') || '<div class="empty" style="padding:2rem;text-align:center;color:var(--dim)">' + (S.lang === 'fil' ? 'Walang mga ulat.' : 'No reports.') + '</div>';
  }

  function _renderLoadMore() {
    var btn = document.getElementById('load-more-btn');
    if (!btn) return;
    if (_reportPage < _reportPages) {
      btn.style.display = '';
      btn.disabled = false;
      btn.textContent = T('loadMore');
    } else {
      btn.style.display = 'none';
    }
  }

  function timeAgo(ts) {
    if (!ts) return '';
    var diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60)   return diff + T('secAgo');
    if (diff < 3600) return Math.floor(diff / 60) + T('minAgo');
    if (diff < 86400) return Math.floor(diff / 3600) + T('hrAgo');
    return Math.floor(diff / 86400) + T('dayAgo');
  }

  /* ── Initial render ──────────────────────────────────────────────────────── */
  var _urlTab = new URLSearchParams(window.location.search).get('tab');
  if (_urlTab && { radar: 1, centers: 1, reports: 1, hotlines: 1 }[_urlTab]) {
    S.tab = _urlTab;
  }

  /* ── Sidebar: collapse / expand + mobile toggle ───────────────────────── */
  (function initSidebar() {
    var sidebar   = document.getElementById('sidebar');
    var overlay   = document.getElementById('sb-overlay');
    var mobToggle = document.getElementById('sb-toggle');
    if (!sidebar) return;

    // Restore collapsed state from localStorage
    var _collapsed = localStorage.getItem('agapalert_sb_collapsed') === '1';

    function applyCollapsed(c) {
      _collapsed = c;
      sidebar.classList.toggle('collapsed', c);
      document.body.classList.toggle('sb-collapsed', c);
      localStorage.setItem('agapalert_sb_collapsed', c ? '1' : '0');
    }

    applyCollapsed(_collapsed);

    // Mobile: open sidebar
    if (mobToggle) {
      mobToggle.addEventListener('click', function () {
        var open = sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('on', open);
        mobToggle.setAttribute('aria-expanded', String(open));
      });
    }

    // Mobile: close via overlay click
    if (overlay) {
      overlay.addEventListener('click', function () {
        sidebar.classList.remove('open');
        overlay.classList.remove('on');
        if (mobToggle) mobToggle.setAttribute('aria-expanded', 'false');
      });
    }

    // Mobile: close on tab selection
    sidebar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-a="tab"]');
      if (btn && window.innerWidth < 900) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('on');
        if (mobToggle) mobToggle.setAttribute('aria-expanded', 'false');
      }
    });
  })();

  render();

  // Fetch live data on load
  fetchFloodLevel();
  fetchShelters();
  fetchReports(true);

  // Refresh flood level every minute (live abiso band), shelters/reports every 5 minutes
  setInterval(fetchFloodLevel, 60 * 1000);
  setInterval(fetchShelters,   5 * 60 * 1000);
  setInterval(function () { fetchReports(true); }, 5 * 60 * 1000);

  // Fetch live weather on load, then refresh every 10 minutes
  fetchWeather();
  setInterval(fetchWeather, 10 * 60 * 1000);

  // Show flash message left by login / register
  var _flashRaw = localStorage.getItem('agapalert_flash');
  if (_flashRaw) {
    localStorage.removeItem('agapalert_flash');
    try {
      var _f = JSON.parse(_flashRaw);
      toast(_f.message);
    } catch (e) {}
  }

})();