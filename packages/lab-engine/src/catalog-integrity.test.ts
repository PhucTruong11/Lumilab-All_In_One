import { expect, it } from 'vitest';
import { lessons, subjects } from '../../../apps/web/src/data/learning';
import { practiceIds, practiceInfo } from '../../../apps/web/src/data/practice';
import { activeLabIds, archivedLabIds, isLabId, labDefinitions, labIds } from './runtime';

it('every published lesson has complete learning content and an actual matching runtime lab', () => {
  expect(lessons).toHaveLength(9); expect(practiceIds).toHaveLength(9);
  expect(new Set(lessons.map(item => item.id)).size).toBe(9);
  expect(lessons.filter(item => item.subjectId === 'physics')).toHaveLength(6);
  expect(lessons.filter(item => item.subjectId === 'chemistry')).toHaveLength(3);
  for (const lesson of lessons) {
    expect(isLabId(lesson.id)).toBe(true);
    if (!isLabId(lesson.id)) throw new Error('Lesson without lab');
    expect(practiceIds).toContain(lesson.id); expect(labDefinitions[lesson.id].subject).toBe(lesson.subjectId);
    expect(practiceInfo[lesson.id].label.length).toBeGreaterThan(0);
    expect(lesson.knowledge.length).toBeGreaterThan(0); expect(lesson.formulas.length).toBeGreaterThan(0);
    expect(lesson.exercise.prompt.length).toBeGreaterThan(0); expect(lesson.exercise.explanation.length).toBeGreaterThan(0);
    expect(Number.isFinite(lesson.exercise.answer)).toBe(true); expect(lesson.exercise.tolerance).toBeGreaterThanOrEqual(0);
    const chapter = subjects.find(subject => subject.id === lesson.subjectId)?.chapters.find(chapter => chapter.id === lesson.chapterId);
    expect(chapter?.lessonIds).toContain(lesson.id);
  }
  for (const subject of subjects) for (const chapter of subject.chapters) for (const id of chapter.lessonIds) expect(lessons.some(lesson => lesson.id === id)).toBe(true);
});

it('active and archived catalogs partition runtime IDs without losing compatible models', () => {
  expect(new Set([...activeLabIds, ...archivedLabIds]).size).toBe(labIds.length);
  expect(activeLabIds.length + archivedLabIds.length).toBe(labIds.length);
  expect(archivedLabIds).toEqual(['electrochemistry', 'atomic']);
  expect(lessons.map(item => item.id).sort()).toEqual([...activeLabIds].sort());
});
