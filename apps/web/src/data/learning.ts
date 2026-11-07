import lessonData from './demo-lessons.json';
import legacyLearning from './legacy-learning.json';

export interface Question { id: string; stem: string; options: string[]; correctIndex: number; explanation: string }
export interface Lesson {
  id: string; subjectId: string; chapterId: string; title: string; lead: string;
  knowledge: { title: string; text: string }[];
  formulas: { expression: string; description: string }[];
  exercise: { id: string; prompt: string; unit: string; answer: number; tolerance: number; hint: string; explanation: string };
  quiz: Question[];
  activity?: { prediction: string; compare: string; reflection: string; rubric: string[] };
}
const currentSubjects = [
  { id: 'physics', name: 'Vật lí', symbol: '↔', description: 'Từ chuyển động đến những quy luật của tự nhiên.', chapters: [
    { id: 'oscillations', name: 'Dao động', description: 'Chu kỳ, tần số và con lắc đơn.' },
    { id: 'electricity', name: 'Dòng điện và mạch điện', description: 'Định luật Ôm và cách mắc dụng cụ đo.' },
    { id: 'mechanics', name: 'Chuyển động và lực', description: 'Vận tốc, gia tốc và hợp lực.' },
  ] },
  { id: 'chemistry', name: 'Hóa học', symbol: '⚗', description: 'Hiểu sự biến đổi của chất qua từng quan sát.', chapters: [
    { id: 'inorganic', name: 'Hóa học vô cơ', description: 'Kim loại kiềm, axit nitric và clo qua ba mô phỏng ảo.' },
    { id: 'solutions', name: 'Dung dịch và axit–bazơ', description: 'Nồng độ, trung hòa và chuẩn độ.' },
    { id: 'precipitation', name: 'Phản ứng tạo kết tủa', description: 'Dung dịch, chất giới hạn và kết tủa.' },
    { id: 'gas-reactions', name: 'Phản ứng tạo khí', description: 'Axit, bicarbonat và lượng CO₂.' },
  ] },
];

export const lessons: Lesson[] = lessonData;
export const lessonById = (id: string) => lessons.find(lesson => lesson.id === id)!;
export const chapterRoadmaps = new Map(legacyLearning.chapters.map(chapter => [chapter.id, chapter]));
export const legacyPractice = legacyLearning.practice;
export const activityByLesson = new Map(legacyPractice.activities.map(activity => [activity.lessonId, activity]));

// Keep legacy chapter order, then append chapters that only exist in the current app.
export const subjects = currentSubjects.map(subject => {
  const chapters = legacyLearning.chapters.filter(chapter => chapter.subjectId === subject.id);
  const order = [...new Set([...chapters.map(chapter => chapter.id), ...subject.chapters.map(chapter => chapter.id)])];
  return {
    ...subject,
    chapters: order.map(id => {
      const chapter = subject.chapters.find(item => item.id === id) ?? chapterRoadmaps.get(id)!;
      return { id, name: chapter.name, description: chapter.description,
        lessonIds: lessons.filter(lesson => lesson.subjectId === subject.id && lesson.chapterId === id).map(lesson => lesson.id) };
    }),
  };
});

export function downloadText(name: string, text: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob(type === 'application/json' ? [text] : ['\uFEFF', text], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readLocal<T>(key: string, fallback: T, valid: (value: unknown) => value is T): T {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) || 'null'); return valid(value) ? value : fallback; }
  catch { return fallback; }
}
