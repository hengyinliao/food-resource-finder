const paths = {
  meal: '<path d="M4 12h16a8 8 0 0 1-16 0ZM3 12h18M7 4v3m5-4v4m5-3v3M8 22h8"/>',
  groceries: '<path d="m6 9 3-6m9 6-3-6M3 9h18l-2 12H5L3 9Zm6 4v4m6-4v4"/>',
  youth: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4m1-17a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v3"/>',
  cooking: '<path d="M7 14a5 5 0 0 1-2-9 5 5 0 0 1 9-1 5 5 0 0 1 5 9v8H7v-7Zm0 3h12M11 8v4m4-4v4"/>',
  garden: '<path d="M12 22V11m0 5C4 17 3 11 3 7c7 0 10 3 9 9Zm0-5C11 4 16 2 22 2c0 6-3 10-10 9Z"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', check: '<path d="m5 12 4 4L19 6"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  print: '<path d="M7 8V3h10v5M7 17H3V8h18v9h-4M7 14h10v7H7v-7Zm10-3h1"/>',
};
const icon = name => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.check}</svg>`;
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const main = document.querySelector('#main');
const neighbourhoods = ['Kitsilano','West Point Grey','Kerrisdale','Marpole','Dunbar'];
const freshAnswers = () => ({need:'',audience:'',neighbourhood:'any',free:false,noRegistration:false,today:false,youth:false,accessNeeds:[]});
const settingsKey = 'food-finder-accessibility-v1';
const settings = {largeText:false,highContrast:false,simplified:false,reduceMotion:false};
let settingsSaved = true;
try {
  const stored = JSON.parse(localStorage.getItem(settingsKey) || '{}');
  Object.keys(settings).forEach(key => {if (typeof stored?.[key] === 'boolean') settings[key] = stored[key];});
} catch {settingsSaved = false;}
let answers = freshAnswers(), language = 'en', step = -1, visibleCount = 3;
let locationMode = 'choose', locationState = 'idle', suggestedArea = '', locationRequest = 0;
const expandedCards = new Set(), directionCards = new Set();
let mapOpen = false, howOpen = false;
const t = () => FOOD_COPY[language];
const replace = (text,key,value) => text.replace(`{${key}}`,esc(value));
const areaLabel = value => value === 'any' ? t().anywhere : value;
const accessKeys = ['stepFree','washroom','seating','lowBarrier'];
const hasAccessInfo = resource => accessKeys.some(key => typeof resource.accessibility?.[key] === 'boolean');
const detail = (label,value) => `<div><dt>${label}</dt><dd>${value}</dd></div>`;

function applySettings() {
  Object.entries(settings).forEach(([key,value]) => document.documentElement.classList.toggle(key,value));
}
function renderSettings() {
  const c = t(), panel = document.querySelector('#accessibility-panel');
  panel.innerHTML = `<div class="panel-heading"><h2 id="accessibility-title">${c.settingsTitle}</h2><button id="close-settings" class="text-button">${c.close} <span aria-hidden="true">×</span></button></div><p id="settings-note">${settingsSaved ? c.settingsNote : c.settingsUnavailable}</p><div class="settings-grid">${Object.entries(c.settings).map(([key,label]) => `<label class="setting"><input type="checkbox" id="setting-${key}" ${settings[key] ? 'checked' : ''}><span><strong>${label}</strong><small>${c.settingHints[key]}</small></span></label>`).join('')}</div>`;
  panel.querySelectorAll('input').forEach(input => input.addEventListener('change', () => {
    settings[input.id.replace('setting-','')] = input.checked;
    applySettings();
    try {localStorage.setItem(settingsKey,JSON.stringify(settings)); settingsSaved = true;} catch {settingsSaved = false;}
    panel.querySelector('#settings-note').textContent = settingsSaved ? t().settingsNote : t().settingsUnavailable;
  }));
  panel.querySelector('#close-settings').addEventListener('click',closeSettings);
}
function closeSettings() {
  document.querySelector('#accessibility-panel').hidden = true;
  const button = document.querySelector('#accessibility-button');
  button.setAttribute('aria-expanded','false'); button.focus();
}
function render(focus = false) {
  const c = t();
  document.documentElement.lang = language === 'zh' ? 'zh-Hans' : 'en';
  document.title = `Food Resource Finder ${c.prototype}`;
  document.querySelector('.skip-link').textContent = c.skip;
  document.querySelector('#prototype-label').textContent = c.prototype;
  document.querySelector('#home-link').setAttribute('aria-label',c.home);
  document.querySelector('#language-label').textContent = c.language;
  document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.language === language)));
  document.querySelector('#accessibility-button').textContent = c.accessibility;
  document.querySelector('#about-title').textContent = c.about;
  document.querySelector('#about-content').innerHTML = `<p>${c.aboutDesign}</p><p>${c.aboutAudience}</p>`;
  document.querySelector('#credit').textContent = c.credit;
  renderSettings();
  document.body.classList.toggle('results-view',step === 4);
  document.body.classList.toggle('home-view',step === -1);
  main.innerHTML = step === -1 ? renderHome() : step === 4 ? renderResults() : renderQuestion();
  bindEvents();
  if (focus) {main.querySelector('h1')?.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'});}
}
function demo() {return `<aside class="demo-notice"><span aria-hidden="true">i</span><p>${t().demoNotice}</p></aside>`;}

function renderHome() {
  const c = t();
  return `<section class="welcome"><div class="welcome-copy"><p class="eyebrow">${c.eyebrow}</p><h1 tabindex="-1">${c.homeTitle}</h1><p class="welcome-text">${c.homeText}</p><button id="begin" class="primary">${c.find}${icon('arrow')}</button><p class="privacy-note">${icon('check')}${c.privacy}</p></div><div class="welcome-art" aria-hidden="true"><svg viewBox="0 0 320 300" fill="none"><path d="M49 145C36 74 111 35 188 41c77 6 103 57 88 117-17 64-65 109-137 94-61-13-79-53-90-107Z" fill="#e6e9d9"/><ellipse cx="166" cy="245" rx="105" ry="12" fill="#d6d9c4"/><path d="M91 147h145l-16 86H108L91 147Z" fill="#e7be91" stroke="#8c603c" stroke-width="3"/><path d="M111 147c-11-41 2-79 37-102 5 42-9 76-23 102" fill="#8ca781"/><path d="M146 147c-8-50 18-83 43-101 4 44-9 75-29 101" fill="#496d50"/><path d="M160 147c20-42 48-60 79-55-8 31-35 52-63 55" fill="#b1c095" stroke="#496d50" stroke-width="2"/><path d="M112 147c-9-24-26-37-45-32 4 26 19 34 34 34" fill="#678764"/><path d="M102 166h124m-119 22h115m-109 22h106m-93-62 8 82m29-82v82m35-82-8 82" stroke="#8c603c" stroke-width="2"/><circle cx="73" cy="224" r="22" fill="#ba6b4e"/><path d="m65 199 8 8 10-9" stroke="#496d50" stroke-width="4"/><path d="M252 53v14m-7-7h14" stroke="#a57836" stroke-width="3" stroke-linecap="round"/></svg></div></section><section class="how-section"><button id="how-button" class="link-button" aria-expanded="${howOpen}" aria-controls="how-content">${c.how}<span aria-hidden="true">${howOpen ? '−' : '+'}</span></button><div id="how-content" ${howOpen ? '' : 'hidden'}><p>${c.howText}</p><p>${c.howPilot}</p></div><ol class="concepts">${c.concepts.map(([title,text],i) => `<li><span class="concept-number" aria-hidden="true">0${i+1}</span><div><h2>${title}</h2><p>${text}</p></div></li>`).join('')}</ol></section>${demo()}`;
}
function renderChoices(field,options) {
  const c = t();
  return `<fieldset class="choices ${field === 'audience' ? 'audience-choices' : ''}"><legend class="sr-only">${c.titles[step]}</legend>${Object.entries(options).map(([value,label]) => `<label class="choice"><input type="radio" name="${field}" value="${value}" ${answers[field] === value ? 'checked' : ''}>${field === 'need' ? `<span class="choice-icon">${icon(value)}</span>` : ''}<span class="choice-text"><strong>${label}</strong>${field === 'need' ? `<small class="choice-example">${c.needHints[value]}</small>` : ''}</span></label>`).join('')}</fieldset>${field === 'audience' ? `<p class="field-hint">${c.audienceHint}</p>` : ''}`;
}
function renderLocation() {
  const c = t(); let content = '';
  if (locationMode === 'choose') {
    content = `<div class="location-actions"><button id="help-area" class="primary">${icon('pin')}${c.helpArea}</button><button id="choose-area" class="secondary">${c.chooseArea}</button></div><p class="field-hint">${c.areaHint}</p>`;
  } else if (locationMode === 'manual') {
    content = `<label class="field-label" for="neighbourhood">${c.area}</label><select id="neighbourhood">${['any',...neighbourhoods].map(value => `<option value="${value}" ${answers.neighbourhood === value ? 'selected' : ''}>${value === 'any' ? c.any : value}</option>`).join('')}</select><p class="field-hint">${c.areaHint}</p><button class="text-button" id="help-area">${c.helpArea}</button>`;
  } else {
    content = `<div class="location-help"><p>${c.locationExplain}</p><p class="field-hint">${c.locationPrivacy}</p>${locationState === 'success' ? `<div class="area-suggestion" role="status"><h2>${replace(c.locationSuggestion,'area',suggestedArea)}</h2><p>${c.locationApproximate}</p><button class="primary" id="confirm-area">${replace(c.useArea,'area',suggestedArea)}</button></div>` : `<button id="use-location" class="primary" ${locationState === 'loading' ? 'disabled' : ''}>${locationState === 'loading' ? c.findingArea : c.useLocation}</button><p class="location-status" role="status">${locationState === 'loading' ? c.findingArea : locationState === 'idle' ? '' : c[locationState]}</p>`}<button id="choose-area" class="text-button">${c.chooseElsewhere}</button></div>`;
  }
  return `<div class="location-section">${content}<p class="current-area">${c.currentArea} <strong>${areaLabel(answers.neighbourhood)}</strong></p>${answers.neighbourhood !== 'any' || locationMode !== 'choose' ? `<button id="all-areas" class="text-button">${c.allAreas}</button>` : ''}</div>`;
}
function renderPreferences() {
  const c = t();
  return `<fieldset class="preferences"><legend>${c.preferenceLegend} <span class="optional">${c.optional}</span></legend>${Object.entries(c.preferences).map(([key,label]) => `<label class="check-choice"><input type="checkbox" name="${key}" ${answers[key] ? 'checked' : ''}><span><strong>${label}</strong><small>${c.preferenceHints[key]}</small></span></label>`).join('')}</fieldset><fieldset class="access-preferences" aria-describedby="access-hint access-filter-hint"><legend>${c.accessQuestion}</legend><p id="access-hint" class="field-hint">${c.accessHint}</p>${Object.entries(c.accessChoices).map(([key,label]) => `<label class="check-choice"><input type="checkbox" name="accessNeeds" value="${key}" ${(key === 'none' ? !answers.accessNeeds.length : answers.accessNeeds.includes(key)) ? 'checked' : ''}><span>${label}</span></label>`).join('')}<p id="access-filter-hint" class="field-hint">${c.accessFilterHint}</p></fieldset>`;
}
function renderQuestion() {
  const c = t();
  const content = step === 0 ? renderChoices('need',c.needs) : step === 1 ? renderChoices('audience',c.audiences) : step === 2 ? renderLocation() : renderPreferences();
  return `<section class="question-page"><div class="question-top"><button id="back" class="text-button"><span aria-hidden="true">←</span>${c.back}</button><span class="step-label">${c.step} ${step+1} ${c.of} 4</span><button id="restart" class="text-button">${c.restart}</button></div><ol class="progress" aria-label="${c.step} ${step+1} ${c.of} 4">${c.steps.map((label,i) => `<li class="${i <= step ? 'filled' : ''}" ${i === step ? 'aria-current="step"' : ''}><span class="sr-only">${label}</span></li>`).join('')}</ol><div class="question-heading"><h1 tabindex="-1">${c.titles[step]}</h1><p>${c.subtitles[step]}</p></div>${content}<div class="question-actions"><button id="next" class="primary" ${step < 2 && !answers[step === 0 ? 'need' : 'audience'] ? 'disabled' : ''}>${step === 3 ? c.results : c.continue}${icon('arrow')}</button></div></section>${demo()}`;
}
function schedule(resource) {
  const c = t();
  const days = resource.days.length === 7 ? c.daily : resource.days.join() === '1,2,3,4,5' ? c.weekdays : resource.days.map(day => c.days[day]).join(language === 'zh' ? '、' : ', ');
  const time = resource.hours.split('–').map(value => {
    if (language === 'zh') return value;
    const [hour,minute] = value.split(':').map(Number);
    return `${hour % 12 || 12}${minute ? ':'+String(minute).padStart(2,'0') : ''} ${hour >= 12 ? 'PM' : 'AM'}`;
  }).join('–');
  return `${days}<br><span class="hours">${time}</span>`;
}
function accessSummary(resource) {
  const c = t(), listed = accessKeys.filter(key => resource.accessibility?.[key] === true).map(key => c.accessLabels[key]);
  if (!hasAccessInfo(resource)) return `<span>${c.accessUnknown}</span>`;
  const unavailable = accessKeys.filter(key => resource.accessibility[key] === false).map(key => `${c.accessLabels[key]}: ${c.unavailable}`);
  const verification = resource.accessibility.verification === 'verified' && resource.accessibility.verifiedAt ? replace(c.accessVerified,'date',resource.accessibility.verifiedAt) : c.accessUnverified;
  return `${listed.length ? `<ul class="access-list">${listed.map(label => `<li>${label}</li>`).join('')}</ul>` : c.noListedAccess}${unavailable.length ? `<span class="print-only access-not-available">${unavailable.join(' · ')}</span>` : ''}<small class="access-verification">${verification}</small>`;
}
function renderCard(resource) {
  const c = t(), isOpen = expandedCards.has(resource.id), directionsOpen = directionCards.has(resource.id);
  const description = language === 'zh' && resource.descriptionZh ? resource.descriptionZh : resource.description;
  const age = resource.audience.map(value => c.ageLabels[value]).join(' / ');
  const verificationDate = resource.lastVerified === 'September 2026' ? c.month : resource.lastVerified;
  return `<article class="resource-card" aria-labelledby="resource-${resource.id}"><h2 id="resource-${resource.id}" lang="en" tabindex="-1">${esc(resource.name)}</h2><p class="category-label">${c.categories[resource.category]}</p><ul class="key-labels"><li>${resource.cost === 'free' ? c.free : c.lowCost}</li><li>${resource.registration === 'drop-in' ? c.noRegistration : c.registrationRequired}</li><li>${age}</li></ul><dl class="resource-overview">${detail(c.when,schedule(resource))}${detail(c.where,`${areaLabel(resource.neighbourhood)}<br><span lang="en">${esc(resource.address)}, Vancouver</span>`)}${detail(c.languages,resource.languages.map(value => c.languageNames[value] || esc(value)).join(' · '))}${detail(c.accessibilityLabel,accessSummary(resource))}</dl><div id="details-${resource.id}" class="resource-details" ${isOpen ? '' : 'hidden'}><p class="resource-description" lang="${language === 'zh' && resource.descriptionZh ? 'zh-Hans' : 'en'}">${esc(description)}</p><dl>${detail(c.age,age)}${detail(c.registration,resource.registration === 'drop-in' ? c.noRegistration : c.registrationRequired)}${detail(c.cost,resource.cost === 'free' ? c.free : replace(c.sampleCost,'amount',resource.sampleCost))}${resource.phone ? detail(c.phone,resource.phone) : ''}${resource.website ? detail(c.website,`<a href="${resource.website}" target="_blank" rel="noopener noreferrer">example.org <span aria-hidden="true">↗</span></a>`) : ''}</dl>${hasAccessInfo(resource) ? `<dl class="access-detail-list">${accessKeys.map(key => detail(c.accessLabels[key],resource.accessibility[key] === true ? c.available : resource.accessibility[key] === false ? c.unavailable : c.unknown)).join('')}</dl>` : ''}</div><p class="verified-note">${replace(c.verified,'date',verificationDate)} <span>(${c.sampleDate})</span></p><div class="card-actions"><button class="secondary" data-details="${resource.id}" aria-expanded="${isOpen}" aria-controls="details-${resource.id}">${isOpen ? c.hideDetails : c.details}<span aria-hidden="true">${isOpen ? '−' : '+'}</span></button><button class="text-button" data-directions="${resource.id}" aria-expanded="${directionsOpen}" aria-controls="directions-${resource.id}">${icon('pin')}${c.directions}</button></div><p id="directions-${resource.id}" class="directions-note" ${directionsOpen ? '' : 'hidden'}>${c.directionsNote}</p></article>`;
}
function renderResults() {
  const c = t(), matches = FoodMatching.find(FOOD_RESOURCES,answers), shown = matches.slice(0,visibleCount);
  const preferences = Object.keys(c.preferences).filter(key => answers[key]).map(key => c.preferences[key]);
  preferences.push(...answers.accessNeeds.map(key => c.accessChoices[key]));
  return `<section class="results-heading"><p class="eyebrow">${c.resultsEyebrow}</p><h1 tabindex="-1">${c.resultsTitle}</h1><p>${c.resultsText}</p></section><h1 class="print-only print-title">${c.printTitle}</h1><div class="results-summary"><dl>${detail(c.area,areaLabel(answers.neighbourhood))}${detail(c.need,c.needs[answers.need])}${detail(c.audience,c.audiences[answers.audience])}<div class="print-only"><dt>${c.language}</dt><dd>${language === 'zh' ? '中文' : 'English'}</dd></div></dl><p><strong>${c.preferencesLabel}:</strong> ${preferences.length ? preferences.join(' · ') : c.none}</p><button class="text-button" id="edit">${c.edit} <span aria-hidden="true">↗</span></button></div>${demo()}<p class="print-only print-updated">${c.updated}</p>${answers.today ? `<p class="field-hint">${c.todayNote}</p>` : ''}<div class="results-toolbar"><p id="results-count" role="status"><strong>${matches.length} ${matches.length === 1 ? c.match : c.matches}</strong><span>${c.showing} ${shown.length} / ${matches.length}</span></p><button class="primary" id="print" ${!matches.length ? 'disabled' : ''}>${icon('print')}${c.print}</button></div><div class="resource-list">${shown.map(renderCard).join('')}</div>${matches.length === 0 ? `<div class="empty-state"><h2>${c.emptyTitle}</h2><p>${c.emptyText}</p><button class="primary" id="empty-edit">${c.edit}${icon('arrow')}</button></div>` : ''}<div class="results-end">${matches.length > shown.length ? `<button class="secondary" id="more">${c.more} <span aria-hidden="true">+</span></button><p class="field-hint">${c.printHint}</p>` : matches.length ? `<p>${c.allShown}</p>` : ''}<div class="end-actions"><button id="back" class="text-button">← ${c.back}</button><button class="text-button" id="restart">${c.restart}</button></div></div><div class="map-feedback"><button id="map-question" class="link-button" aria-expanded="${mapOpen}" aria-controls="map-note">${c.map}</button><p id="map-note" ${mapOpen ? '' : 'hidden'}>${c.mapNote}</p></div><p class="print-only print-credit">${c.printCredit}</p>`;
}
function startAgain() {
  answers = freshAnswers(); step = -1; visibleCount = 3;
  locationRequest++; locationState = 'idle'; locationMode = 'choose'; suggestedArea = '';
  expandedCards.clear(); directionCards.clear(); mapOpen = false; howOpen = false; render(true);
}
function locationRender(focusId) {render(); if (focusId) main.querySelector(`#${focusId}`)?.focus();}
function requestLocation() {
  const request = ++locationRequest;
  if (!navigator.geolocation || !window.isSecureContext) {locationState = 'locationUnsupported'; locationRender('choose-area'); return;}
  locationState = 'loading'; locationRender('choose-area');
  const active = () => request === locationRequest && step === 2 && locationMode === 'help';
  // Late permission responses cannot overwrite choices after leaving this step.
  navigator.geolocation.getCurrentPosition(position => {
    if (!active()) return;
    suggestedArea = FoodArea.suggest(position.coords.latitude,position.coords.longitude,position.coords.accuracy) || '';
    locationState = suggestedArea ? 'success' : 'locationOutside';
    locationRender(suggestedArea ? 'confirm-area' : 'choose-area');
  }, error => {
    if (!active()) return;
    locationState = error.code === 1 ? 'locationDenied' : 'locationFailed'; locationRender('choose-area');
  }, {enableHighAccuracy:false,timeout:10000,maximumAge:0});
}
function bindEvents() {
  const on = (id,fn) => main.querySelector(`#${id}`)?.addEventListener('click',fn);
  on('begin', () => {step = 0; render(true);}); on('restart',startAgain);
  on('back', () => {locationRequest++; if (locationState === 'loading') locationState = 'idle'; step--; render(true);});
  on('next', () => {
    if (step < 2 && !answers[step === 0 ? 'need' : 'audience']) return;
    locationRequest++; if (locationState === 'loading') locationState = 'idle';
    step++; visibleCount = 3; expandedCards.clear(); directionCards.clear(); render(true);
  });
  main.querySelectorAll('input[type="radio"]').forEach(input => input.addEventListener('change', () => {answers[input.name] = input.value; main.querySelector('#next').disabled = false;}));
  main.querySelectorAll('.preferences input').forEach(input => input.addEventListener('change', () => {answers[input.name] = input.checked;}));
  main.querySelectorAll('input[name="accessNeeds"]').forEach(input => input.addEventListener('change', () => {
    const value = input.value;
    if (value === 'none') answers.accessNeeds = [];
    else if (value === 'information') answers.accessNeeds = input.checked ? ['information'] : [];
    else {answers.accessNeeds = answers.accessNeeds.filter(key => key !== 'information' && key !== value); if (input.checked) answers.accessNeeds.push(value);}
    main.querySelectorAll('input[name="accessNeeds"]').forEach(box => {box.checked = box.value === 'none' ? !answers.accessNeeds.length : answers.accessNeeds.includes(box.value);});
  }));
  on('help-area', () => {locationMode = 'help'; locationState = 'idle'; locationRequest++; locationRender('use-location');});
  on('choose-area', () => {locationMode = 'manual'; locationState = 'idle'; locationRequest++; locationRender('neighbourhood');});
  on('all-areas', () => {answers.neighbourhood = 'any'; locationMode = 'manual'; locationState = 'idle'; locationRequest++; locationRender('neighbourhood');});
  on('use-location',requestLocation);
  on('confirm-area', () => {answers.neighbourhood = suggestedArea; locationMode = 'manual'; locationRequest++; locationRender('next');});
  main.querySelector('#neighbourhood')?.addEventListener('change', event => {answers.neighbourhood = event.target.value; main.querySelector('.current-area strong').textContent = areaLabel(answers.neighbourhood);});
  ['edit','empty-edit'].forEach(id => on(id, () => {step = 0; render(true);})); on('print', () => window.print());
  on('more', () => {const oldCount = main.querySelectorAll('.resource-card').length; visibleCount += 3; render(); main.querySelectorAll('.resource-card h2')[oldCount]?.focus();});
  main.querySelectorAll('[data-details]').forEach(button => button.addEventListener('click', () => {
    const id = Number(button.dataset.details), open = !expandedCards.has(id);
    if (open) expandedCards.add(id); else expandedCards.delete(id);
    button.setAttribute('aria-expanded',String(open)); button.innerHTML = `${open ? t().hideDetails : t().details}<span aria-hidden="true">${open ? '−' : '+'}</span>`;
    document.querySelector(`#details-${id}`).hidden = !open;
  }));
  main.querySelectorAll('[data-directions]').forEach(button => button.addEventListener('click', () => {
    const id = Number(button.dataset.directions), open = !directionCards.has(id);
    if (open) directionCards.add(id); else directionCards.delete(id);
    button.setAttribute('aria-expanded',String(open)); document.querySelector(`#directions-${id}`).hidden = !open;
  }));
  on('how-button', () => {howOpen = !howOpen; main.querySelector('#how-button').setAttribute('aria-expanded',String(howOpen)); main.querySelector('#how-content').hidden = !howOpen; main.querySelector('#how-button span').textContent = howOpen ? '−' : '+';});
  on('map-question', () => {mapOpen = !mapOpen; main.querySelector('#map-question').setAttribute('aria-expanded',String(mapOpen)); main.querySelector('#map-note').hidden = !mapOpen;});
}
document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {language = button.dataset.language; render();}));
document.querySelector('#accessibility-button').addEventListener('click', () => {
  const panel = document.querySelector('#accessibility-panel'); panel.hidden = !panel.hidden;
  document.querySelector('#accessibility-button').setAttribute('aria-expanded',String(!panel.hidden));
});
document.querySelector('#accessibility-panel').addEventListener('keydown', event => {if (event.key === 'Escape') {event.preventDefault();closeSettings();}});
document.querySelector('#home-link').addEventListener('click', event => {event.preventDefault(); locationRequest++; step = -1; render(true);});
applySettings(); render();
