/* Pure matching logic, shared by the questionnaire and tests. */
window.FoodMatching = {
  vancouverDay(date = new Date()) {
    const day = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Vancouver', weekday: 'short' }).format(date);
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(day);
  },
  find(resources, answers, date = new Date()) {
    const day = this.vancouverDay(date);
    const matches = resources.filter(resource => {
      if (resource.category !== answers.need) return false;
      // "Everyone" means programs open to all ages, not every restricted program.
      if (!resource.audience.includes('everyone') && !resource.audience.includes(answers.audience)) return false;
      if (answers.neighbourhood !== 'any' && resource.neighbourhood !== answers.neighbourhood) return false;
      if ((answers.free || answers.need === 'meal') && resource.cost !== 'free') return false;
      if (answers.today && !resource.days.includes(day)) return false;
      if (answers.youth && !resource.audience.some(age => ['youth','young-adult'].includes(age))) return false;
      const accessNeeds = answers.accessNeeds || [];
      const access = resource.accessibility || {};
      if (accessNeeds.includes('information') && !['stepFree','washroom','seating','lowBarrier'].some(key => typeof access[key] === 'boolean')) return false;
      if (accessNeeds.some(key => key !== 'information' && access[key] !== true)) return false;
      return true;
    });
    // A preference changes ordering, while hard constraints never get relaxed.
    return answers.noRegistration ? matches.sort((a,b) => Number(a.registration === 'required') - Number(b.registration === 'required')) : matches;
  }
};

// Small, approximate pilot-area anchors, not neighbourhood boundaries or a GIS map.
// Coordinates are used only during this calculation and are never persisted.
window.FoodArea = {
  suggest(latitude, longitude, accuracy = 0) {
    if (![latitude, longitude, accuracy].every(Number.isFinite) || accuracy < 0 || accuracy > 3000) return null;
    if (latitude < 49.195 || latitude > 49.28 || longitude < -123.225 || longitude > -123.105) return null;
    const anchors = [
      ['Kitsilano',49.267,-123.165], ['West Point Grey',49.266,-123.205],
      ['Kerrisdale',49.234,-123.155], ['Marpole',49.211,-123.131], ['Dunbar',49.244,-123.185]
    ];
    return anchors.map(([name,lat,lon]) => ({name, distance: Math.hypot((latitude-lat)*111, (longitude-lon)*73)}))
      .sort((a,b) => a.distance-b.distance)[0].name;
  }
};
