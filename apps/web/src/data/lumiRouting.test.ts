import { describe, expect, it } from 'vitest';
import { lessons } from './learning';
import { routeLumiQuestion } from './lumiRouting';

describe('Lumi topic routing', () => {
  it.each([
    ['AgCl là gì', 'precipitation'],
    ['Bạc clorua là gì?', 'precipitation'],
    ['Axit HCl tác dụng với AgNO₃?', 'precipitation'],
    ['NaHCO₃ phản ứng với axit thế nào?', 'gas-reaction'],
    ['Mach RC nap tu dien nhu the nao?', 'capacitor'],
    ['Electron trong nguyên tử là gì?', 'atomic'],
    ['Chu kỳ của con lắc lò xo?', 'spring'],
    ['Con lắc lò xo tắt dần do đâu?', 'spring-damped'],
    ['Hai điện trở mắc song song', 'parallel-circuit'],
    ['Định luật Ôm là gì?', 'circuit'],
    ['Gia tốc trên mặt phẳng nghiêng', 'inclined-plane'],
    ['Ròng rọc hoạt động thế nào?', 'pulley'],
    ['Pin điện hóa hoạt động thế nào?', 'electrochemistry'],
    ['pH là gì?', 'chemistry'],
    ['Định luật II Newton', 'mechanics'],
    ['Con lắc đơn là gì?', 'pendulum'],
    ['Kali tác dụng với nước', 'alkali-water'],
    ['Đồng với HNO3', 'copper-nitric'],
    ['Clo tẩy màu thế nào?', 'chlorine-bleach'],
  ])('routes %s to %s', (question, expected) => {
    expect(routeLumiQuestion(question)).toBe(expected);
  });

  it('covers every lesson title without rerouting to a related lab', () => {
    for (const lesson of lessons) expect(routeLumiQuestion(lesson.title)).toBe(lesson.id);
  });

  it('retains context for follow-ups, including ambiguous quantities', () => {
    expect(routeLumiQuestion('Công thức nào?', 'pendulum')).toBe('pendulum');
    expect(routeLumiQuestion('Nó có tan trong nước không?', 'precipitation')).toBe('precipitation');
    expect(routeLumiQuestion('Khối lượng ảnh hưởng chu kỳ thế nào?', 'spring')).toBe('spring');
    expect(routeLumiQuestion('Vậy tại sao?', 'atomic')).toBe('atomic');
    expect(routeLumiQuestion('Cho mình xem lượt đã lưu', 'capacitor')).toBe('capacitor');
    expect(routeLumiQuestion('Giải thích dữ liệu này', 'circuit')).toBe('circuit');
  });

  it('switches on an explicit topic, and does not attach unrelated questions to the old lab', () => {
    expect(routeLumiQuestion('AgCL là gì', 'pendulum')).toBe('precipitation');
    expect(routeLumiQuestion('Bitcoin stock tomorrow', 'pendulum')).toBe('');
    expect(routeLumiQuestion('Ai là tổng thống?', 'circuit')).toBe('');
    expect(routeLumiQuestion('Công thức nào?')).toBe('');
  });
});
