/* All names, addresses, schedules and contact details below are fictional demo data. */
window.FOOD_RESOURCES = (() => {
  // These attributes are invented for testing. null means unknown, never inaccessible.
  // No sample accessibility information has been independently verified.
  const sampleAccess = id => ({
    stepFree: [1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,18].includes(id) ? true : null,
    washroom: [1,4,6,9,11,12,15,16,18].includes(id) ? true : [2,7,13].includes(id) ? false : null,
    seating: [1,3,4,6,8,9,11,12,14,15,16,18].includes(id) ? true : [2,7,13].includes(id) ? false : null,
    lowBarrier: [1,2,3,6,9,12,13,14,15].includes(id) ? true : null,
    verification: 'unverified',
    verifiedAt: null
  });
  const make = (id, name, category, audience, neighbourhood, address, days, hours, cost, registration, languages, description, descriptionZh = '') => ({
    id, name, category, audience, neighbourhood, address, days, hours, cost, registration,
    accessibility: sampleAccess(id), languages, description, descriptionZh,
    sampleCost: ({4:5,7:3,16:4,18:5,20:2})[id] || 0,
    phone: id <= 5 ? `604-555-01${String(id).padStart(2, '0')}` : '',
    website: id % 3 === 0 ? 'https://example.org' : '',
    lastVerified: 'September 2026'
  });
  return [
    make(1, 'Neighbourhood Table', 'meal', ['everyone'], 'Kitsilano', '120 Example Avenue', [1,2,3,4,5], '12:00–14:00', 'free', 'drop-in', ['English', '中文'], 'A warm lunch and a welcoming place to sit. Everyone is welcome.', '提供热午餐和舒适的用餐空间，欢迎所有人。'),
    make(2, 'Westside Pantry', 'groceries', ['everyone'], 'Kitsilano', '245 Sample Street', [2,4,6], '10:00–13:00', 'free', 'drop-in', ['English', '中文'], 'Pick up a small bag of pantry staples and seasonal produce.', '领取一小袋食品和当季蔬果。'),
    make(3, 'After School Kitchen', 'youth', ['youth'], 'Kitsilano', '310 Demo Lane', [1,2,3,4,5], '15:00–17:00', 'free', 'drop-in', ['English'], 'An after-school snack and simple meal for young people under 18.', '为未满18岁的青少年提供课后点心和简餐。'),
    make(4, 'Cook & Connect', 'cooking', ['adult','senior','young-adult'], 'Kitsilano', '420 Example Road', [3], '17:30–19:30', 'low-cost', 'required', ['English', '中文'], 'Prepare a shared meal together. Sample session cost: $5.', '一起烹饪并分享美食。示例活动费用为5加元。'),
    make(5, 'Little Sprouts Garden', 'garden', ['everyone'], 'Kitsilano', '510 Sample Walk', [0,6], '10:00–12:00', 'free', 'drop-in', ['English'], 'Learn to grow vegetables in a shared outdoor garden.', '在社区户外花园学习种植蔬菜。'),
    make(6, 'Point Grey Lunch Circle', 'meal', ['everyone'], 'West Point Grey', '630 Example Avenue', [1,3,5], '11:30–13:00', 'free', 'drop-in', ['English'], 'A simple sit-down lunch with neighbours.'),
    make(7, 'Point Grey Produce Share', 'groceries', ['everyone'], 'West Point Grey', '740 Sample Street', [4,6], '13:00–16:00', 'low-cost', 'drop-in', ['English'], 'A small seasonal produce bag. Sample cost: $3.'),
    make(8, 'Young Adult Supper Club', 'youth', ['young-adult'], 'West Point Grey', '850 Demo Lane', [2,4], '17:00–19:00', 'free', 'required', ['English'], 'A shared evening meal for young adults ages 18–24.'),
    make(9, 'Kerrisdale Community Lunch', 'meal', ['everyone'], 'Kerrisdale', '960 Example Road', [0,2,4], '12:00–13:30', 'free', 'drop-in', ['English', '中文'], 'Drop in for a hot lunch and friendly conversation.'),
    make(10, 'Family Pantry Pickup', 'groceries', ['family'], 'Kerrisdale', '1070 Sample Avenue', [3,6], '09:30–12:00', 'free', 'required', ['English', '中文'], 'A weekly grocery hamper for households with children.'),
    make(11, 'Kerrisdale Shared Kitchen', 'cooking', ['everyone'], 'Kerrisdale', '1180 Demo Street', [6], '14:00–16:00', 'free', 'required', ['English', '中文'], 'Practise everyday cooking skills in a small community group.'),
    make(12, 'Marpole Daily Table', 'meal', ['everyone'], 'Marpole', '1290 Example Lane', [0,1,2,3,4,5,6], '17:00–18:30', 'free', 'drop-in', ['English', '中文', 'Punjabi'], 'An evening meal served every day in a community space.'),
    make(13, 'Marpole Grocery Basket', 'groceries', ['everyone'], 'Marpole', '1300 Sample Road', [1,5], '10:00–14:00', 'free', 'drop-in', ['English', 'Punjabi'], 'Basic groceries and produce, while sample supplies last.'),
    make(14, 'Youth Snack Stop', 'youth', ['youth','young-adult'], 'Marpole', '1410 Demo Avenue', [1,2,3,4,5], '14:30–18:00', 'free', 'drop-in', ['English'], 'Snacks and takeaway food for young people under 25.'),
    make(15, 'Marpole Grow Together', 'garden', ['everyone'], 'Marpole', '1520 Example Street', [0,3], '10:00–12:00', 'free', 'drop-in', ['English', '中文'], 'Try planting and harvesting in raised, accessible garden beds.'),
    make(16, 'Dunbar Seniors Lunch', 'meal', ['senior'], 'Dunbar', '1630 Sample Lane', [2,5], '12:00–13:30', 'low-cost', 'required', ['English'], 'A social lunch for adults age 65 and over. Sample cost: $4.'),
    make(17, 'Dunbar Community Cupboard', 'groceries', ['everyone'], 'Dunbar', '1740 Demo Road', [0,1,2,3,4,5,6], '09:00–18:00', 'free', 'drop-in', ['English'], 'A small outdoor cupboard with shelf-stable foods to take as needed.'),
    make(18, 'Family Cooking Afternoon', 'cooking', ['family'], 'Dunbar', '1850 Example Avenue', [0], '14:00–16:30', 'low-cost', 'required', ['English'], 'Children and caregivers cook together. Sample cost: $5 per family.'),
    make(19, 'Dunbar Seed & Grow', 'garden', ['everyone'], 'Dunbar', '1960 Sample Street', [6], '09:30–11:30', 'free', 'drop-in', ['English'], 'Share seeds and learn beginner-friendly growing skills.'),
    make(20, 'Point Grey Garden Club', 'garden', ['everyone'], 'West Point Grey', '2070 Demo Lane', [0], '10:00–12:00', 'low-cost', 'required', ['English'], 'A guided community gardening session. Sample cost: $2.')
  ];
})();
