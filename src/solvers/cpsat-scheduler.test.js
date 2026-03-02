/**
 * Tests for CP-SAT Scheduler (Phase 8b Task 1)
 * Verifies OR-Tools integration and trivial problem solving
 */

const { testTrivialProblem, initSolver, solveWithCPSAT } = require('./cpsat-scheduler');

describe('Phase 8b Task 1: OR-Tools Integration', () => {
  test('OR-Tools can be instantiated', () => {
    const solver = initSolver();
    expect(solver).toBeDefined();
  });

  test('Trivial problem solves correctly (minimize X where X >= 10)', () => {
    const result = testTrivialProblem();

    expect(result.success).toBe(true);
    expect(result.answer).toBe(result.expected);
    expect(result.answer).toBe(10);
  });

  test('CP-SAT solver stub returns expected structure', () => {
    const result = solveWithCPSAT([], {});

    expect(result).toHaveProperty('schedule');
    expect(result).toHaveProperty('makespan');
    expect(result).toHaveProperty('solveTime');
    expect(result).toHaveProperty('status');
  });
});
