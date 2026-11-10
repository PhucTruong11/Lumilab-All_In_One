import { lessons } from './learning';

function normalize(text: string) {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
}

// Specific compounds/submodels precede shared terms such as acid, circuit or mass.
const topics: [string, RegExp][] = [
  ['precipitation', /\b(agcl|agno3|bac clorua|bac nitrat|ket tua)\b/],
  ['gas-reaction', /\b(nahco3|bicarbonat\w*|hydrogencarbonat\w*|co2|khi cacbonic)\b/],
  ['spring-damped', /tat dan|luc can|ma sat dao dong/],
  ['inclined-plane', /mat phang nghieng|mat doc|doc nghieng|ma sat nghi/],
  ['pulley', /rong roc|pa-lang|palang|pa lang/],
  ['copper-nitric', /\b(hno3|no2)\b|axit nitric|dong.*nitric/],
  ['alkali-water', /kim loai kiem|\b(natri|kali)\b|\b(na|k)\b.*nuoc|mau ngon lua/],
  ['chlorine-bleach', /\b(clo|cl2|chlorine)\b|tay mau|nuoc javen/],
  ['atomic', /nguyen tu|hat nhan|proton|neutron/],
  ['electrochemistry', /pin dien hoa|dien cuc|anot|catot/],
  ['capacitor', /tu dien|dien dung|nap xa|phong dien|\brc\b/],
  ['parallel-circuit', /song song|dong nhanh|hai dien tro/],
  ['circuit', /mach|dien tro|ampe|von|\b(ohm|om)\b|noi tiep|cong tac|dong dien|hieu dien the/],
  ['chemistry', /chuan do|axit|acid|bazo|base|\b(hcl|naoh|ph)\b|trung hoa|chi thi|tuong duong/],
  ['spring', /lo xo|do cung|dan hoi/],
  ['pendulum', /con lac|chieu dai day|goc tha/],
  ['mechanics', /hop luc|newton/],
];
const generalTopics: [string, RegExp][] = [
  ['pendulum', /chu ky|khoi luong|tan so/],
  ['mechanics', /gia toc|chuyen dong/],
  ['atomic', /electron/],
];

export function routeLumiQuestion(question: string, previousLab = '') {
  const query = normalize(question);
  const title = lessons.find(item => query.includes(normalize(item.title)));
  const topic = topics.find(([id, pattern]) => pattern.test(query) && lessons.some(item => item.id === id));
  if (title || topic) return title?.id ?? topic![0];
  const general = generalTopics.find(([, pattern]) => pattern.test(query));
  const followup = /\b(no|vay|the con|tai sao|vi sao|cong thuc|vi du|giai thich them|chi tiet hon|bai tap|ket qua|so do|luot|du lieu|dieu do|chat nay|chat do)\b/.test(query);
  if ((general || followup) && lessons.some(item => item.id === previousLab)) return previousLab;
  return general?.[0] ?? '';
}
