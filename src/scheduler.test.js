import cocData from './data/coc_data.json';
import {
    generateSchedule,
    generateTestFixture,
    validateAgainstFixture,
} from './scheduler';

function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
}

describe('scheduler core scenarios', () => {
    test('returns actionable error for invalid JSON payload', () => {
        const result = generateSchedule(null);
        expect(result.err[0]).toBe(true);
        expect(result.err[1]).toMatch(/Failed to parse building data from JSON/i);
    });

    test('is deterministic for same home input and settings', () => {
        const fixture = generateTestFixture(cloneData(cocData), 'LPT', false, 'home', 0);
        expect(fixture).not.toBeNull();

        const validation = validateAgainstFixture(
            fixture,
            cloneData(cocData),
            'LPT',
            false,
            'home',
            0,
        );

        expect(validation.match).toBe(true);
        expect(validation.differences).toEqual([]);
    });

    test('LPT and SPT strategies produce distinct snapshots on fixture data', () => {
        const lpt = generateTestFixture(cloneData(cocData), 'LPT', false, 'home', 0);
        const spt = generateTestFixture(cloneData(cocData), 'SPT', false, 'home', 0);

        expect(lpt).not.toBeNull();
        expect(spt).not.toBeNull();
        expect(lpt.snapshot).not.toEqual(spt.snapshot);
    });

    test('rejects invalid active-time windows with clear error', () => {
        const result = generateSchedule(
            cloneData(cocData),
            false,
            'LPT',
            false,
            'home',
            0,
            '7:00',
            '23:00',
        );

        expect(result.err[0]).toBe(true);
        expect(result.err[1]).toMatch(/Active time validation failed/i);
    });

    test('builder base schedule path is schedulable with fixture data', () => {
        const result = generateSchedule(
            cloneData(cocData),
            false,
            'LPT',
            false,
            'builder',
            0,
            '07:00',
            '23:00',
        );

        expect(result.err[0]).toBe(false);
        expect(result.sch.schedule.length).toBeGreaterThan(0);
        expect(result.numBuilders).toBeGreaterThanOrEqual(1);
    });

    test('keeps ongoing upgrades (priority 1) in scheduled output', () => {
        const result = generateSchedule(
            cloneData(cocData),
            false,
            'LPT',
            false,
            'home',
            0,
            '07:00',
            '23:00',
        );

        expect(result.err[0]).toBe(false);
        const ongoing = result.sch.schedule.filter((task) => task.priority === 1);
        expect(ongoing.length).toBeGreaterThan(0);
    });
});
