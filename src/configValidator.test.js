import {
    auditMappingCoverage,
    validateTHBHConfig,
} from './configValidator.js';

describe('config validator', () => {
    test('deduplicates repeated unmapped ids in mapping warnings', () => {
        const result = auditMappingCoverage(
            {
                buildings: [
                    { data: 19999999, lvl: 1 },
                    { data: 19999999, lvl: 1, cnt: 1 },
                ],
                heroes: [],
                guardians: [],
            },
            'home',
        );

        expect(result.unmappedIds).toHaveLength(2);
        expect(result.warnings).toContain(
            '2 item(s) missing from mapping: ID 19999999 (building) x2',
        );
    });

    test('accepts object-based TH config shape', () => {
        const result = validateTHBHConfig(18, 'home');

        expect(result.valid).toBe(true);
        expect(result.warnings).toHaveLength(0);
    });
});
