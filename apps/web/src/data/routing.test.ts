import { describe, expect, it } from 'vitest';
import { parseRoute } from '../routing';

describe('hash routing and root navigation', () => {
  it('returns lab catalog (main screen) when hash is empty or root', () => {
    expect(parseRoute('')).toEqual({ view: 'lab', labOpen: false });
    expect(parseRoute('#')).toEqual({ view: 'lab', labOpen: false });
    expect(parseRoute('#/')).toEqual({ view: 'lab', labOpen: false });
    expect(parseRoute('#lab')).toEqual({ view: 'lab', labOpen: false });
    expect(parseRoute('#/lab')).toEqual({ view: 'lab', labOpen: false });
  });

  it('opens specific lab when valid labId is given in hash', () => {
    expect(parseRoute('#lab/pendulum')).toEqual({
      view: 'lab',
      labOpen: true,
      labId: 'pendulum',
    });
    expect(parseRoute('#/lab/pendulum')).toEqual({
      view: 'lab',
      labOpen: true,
      labId: 'pendulum',
    });
    expect(parseRoute('#lab/circuit')).toEqual({
      view: 'lab',
      labOpen: true,
      labId: 'circuit',
    });
  });

  it('supports taskId parameter in hash', () => {
    expect(parseRoute('#lab/pendulum/task-1')).toEqual({
      view: 'lab',
      labOpen: true,
      labId: 'pendulum',
      taskId: 'task-1',
    });
  });

  it('falls back to catalog when labId is invalid or missing', () => {
    expect(parseRoute('#lab/unknown-lab')).toEqual({
      view: 'lab',
      labOpen: false,
      labId: undefined,
    });
  });

  it('correctly transitions from /#lab/pendulum to root / (main screen)', () => {
    const labRoute = parseRoute('#lab/pendulum');
    expect(labRoute).toEqual({ view: 'lab', labOpen: true, labId: 'pendulum' });

    // Transition to root URL (http://127.0.0.1:5175/ with empty hash)
    const rootRoute = parseRoute('');
    expect(rootRoute).toEqual({ view: 'lab', labOpen: false });
    expect(rootRoute?.labOpen).toBe(false);
  });

  it('handles other tabs', () => {
    expect(parseRoute('#library')).toEqual({ view: 'library', labOpen: false });
    expect(parseRoute('#/library')).toEqual({ view: 'library', labOpen: false });
    expect(parseRoute('#workspace')).toEqual({ view: 'workspace', labOpen: false });
    expect(parseRoute('#lumi')).toEqual({ view: 'lumi', labOpen: false });
  });

  it('ignores non-tab in-page anchors such as #main-content', () => {
    expect(parseRoute('#main-content')).toBeNull();
  });
});
