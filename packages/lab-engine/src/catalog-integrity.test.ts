import { expect, it } from 'vitest';
import { activityByLesson, chapterRoadmaps, legacyPractice, lessons, subjects } from '../../../apps/web/src/data/learning';
import { practiceGroups, practiceIds, practiceInfo } from '../../../apps/web/src/data/practice';
import { activeLabIds, archivedLabIds, isLabId, labDefinitions, labIds } from './runtime';

it('every available lesson has complete learning content and an actual matching runtime lab', () => {
  expect(lessons).toHaveLength(17); expect(practiceIds).toHaveLength(12);
  expect(new Set(lessons.map(item => item.id)).size).toBe(17);
  expect(lessons.filter(item => item.subjectId === 'physics')).toHaveLength(9);
  expect(lessons.filter(item => item.subjectId === 'chemistry')).toHaveLength(8);
  const quiz = lessons.flatMap(lesson => lesson.quiz);
  expect(quiz).toHaveLength(27);
  expect(new Set(quiz.map(question => question.id)).size).toBe(27);
  expect(new Set(quiz.map(question => question.stem)).size).toBe(27);
  for (const lesson of lessons) {
    expect(isLabId(lesson.id)).toBe(true);
    if (!isLabId(lesson.id)) throw new Error('Lesson without lab');
    expect(labDefinitions[lesson.id].subject).toBe(lesson.subjectId);
    expect(lesson.title.trim() && lesson.lead.trim()).toBeTruthy();
    expect(practiceInfo[lesson.id].label.length).toBeGreaterThan(0);
    expect(lesson.knowledge.length).toBeGreaterThan(0); expect(lesson.formulas.length).toBeGreaterThan(0);
    expect(lesson.exercise.prompt.length).toBeGreaterThan(0); expect(lesson.exercise.explanation.length).toBeGreaterThan(0);
    expect(lesson.exercise.hint.trim() && lesson.exercise.unit.trim()).toBeTruthy();
    expect(Number.isFinite(lesson.exercise.answer)).toBe(true); expect(lesson.exercise.tolerance).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(lesson.exercise.tolerance)).toBe(true);
    expect(lesson.quiz.length).toBeGreaterThan(0);
    for (const question of lesson.quiz) {
      expect(question.stem.trim() && question.explanation.trim()).toBeTruthy();
      expect(new Set(question.options).size).toBe(question.options.length);
      expect(question.options.length).toBeGreaterThan(1);
      expect(question.options.every(option => option.trim())).toBe(true);
      expect(question.options[question.correctIndex]).toBeTruthy();
    }
    const chapter = subjects.find(subject => subject.id === lesson.subjectId)?.chapters.find(chapter => chapter.id === lesson.chapterId);
    expect(chapter?.lessonIds).toContain(lesson.id);
  }
  expect(subjects.flatMap(subject => subject.chapters.flatMap(chapter => chapter.lessonIds)).sort()).toEqual(lessons.map(lesson => lesson.id).sort());
});

it('active and archived catalogs partition runtime IDs without losing compatible models', () => {
  expect(new Set([...activeLabIds, ...archivedLabIds]).size).toBe(labIds.length);
  expect(activeLabIds.length + archivedLabIds.length).toBe(labIds.length);
  expect(archivedLabIds).toEqual(['electrochemistry', 'atomic', 'chemistry', 'precipitation', 'gas-reaction']);
  expect(practiceIds).toEqual(activeLabIds);
  expect(practiceGroups).toHaveLength(9);
  expect(practiceGroups.flatMap(group => group.modes).sort()).toEqual([...activeLabIds].sort());
  for (const group of practiceGroups) {
    expect(group.modes).toContain(group.primary);
    expect(group.modes.every(id => labDefinitions[id].subject === labDefinitions[group.primary].subject)).toBe(true);
  }
  expect(lessons.map(item => item.id).sort()).toEqual([...activeLabIds, ...archivedLabIds].sort());
});

it('source roadmaps and activities link to real chapters and preserve the limits of the source', () => {
  const chapters = subjects.flatMap(subject => subject.chapters);
  expect(chapters).toHaveLength(15);
  expect(chapters.filter(chapter => !chapter.lessonIds.length).map(chapter => chapter.id)).toEqual(
    ['waves', 'thermal', 'nuclear', 'reactions', 'organic', 'bonding'],
  );
  expect(chapterRoadmaps.size).toBe(12);
  for (const roadmap of chapterRoadmaps.values()) {
    const chapter = subjects.find(subject => subject.id === roadmap.subjectId)?.chapters.find(item => item.id === roadmap.id);
    expect(chapter).toBeDefined();
    expect(roadmap.goal.trim()).toBeTruthy();
    expect(roadmap.topics).toHaveLength(3);
    expect(roadmap.steps).toHaveLength(3);
    for (const step of roadmap.steps) expect(step.title.trim() && step.description.trim() && step.checkpoint.trim()).toBeTruthy();
    if (roadmap.experimentId) expect(chapter?.lessonIds).toContain(roadmap.experimentId);
  }
  expect([...activityByLesson.keys()].sort()).toEqual(['chemistry', 'circuit', 'pendulum']);
  expect(legacyPractice.rubric).toHaveLength(4);
  const questionIds = new Set(lessons.flatMap(lesson => lesson.quiz.map(question => question.id)));
  for (const activity of activityByLesson.values()) {
    expect(lessons.some(lesson => lesson.id === activity.lessonId)).toBe(true);
    expect(activity.steps).toHaveLength(3);
    expect(activity.questions).toHaveLength(2);
    for (const question of activity.questions) {
      expect(question.stem.trim()).toBeTruthy();
      expect(questionIds.has(question.id)).toBe(false);
      questionIds.add(question.id);
      expect(question.options[question.correctIndex]).toBeTruthy();
      expect(question).not.toHaveProperty('explanation');
    }
  }
});
