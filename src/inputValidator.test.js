import { validatePlayerJSON } from './inputValidator.js';

describe('input validator', () => {
    test('ignores structured building metadata without surfacing warnings', () => {
        const result = validatePlayerJSON(
            {
                buildings: [
                    { data: 1000001, lvl: 18, cnt: 1 },
                    {
                        data: 1000097,
                        types: [
                            {
                                data: 103000008,
                                modules: [{ data: 102000024, lvl: 1 }],
                            },
                        ],
                    },
                ],
                heroes: [],
                guardians: [{ data: 107000000, lvl: 1 }],
            },
            'home',
        );

        expect(result.valid).toBe(true);
        expect(result.data.buildings).toHaveLength(1);
        expect(result.warnings).toHaveLength(0);
        expect(
            result.warnings.some((warning) =>
                warning.includes('malformed building'),
            ),
        ).toBe(false);
    });

    test('accepts TH18 hero levels within configured caps', () => {
        const result = validatePlayerJSON(
            {
                buildings: [{ data: 1000006, lvl: 18, cnt: 1 }],
                heroes: [
                    { data: 28000000, lvl: 78 },
                    { data: 28000001, lvl: 84 },
                    { data: 28000002, lvl: 57 },
                    { data: 28000004, lvl: 45 },
                    { data: 28000006, lvl: 57 },
                    { data: 28000007, lvl: 5 },
                ],
                guardians: [{ data: 107000000, lvl: 1 }],
            },
            'home',
        );

        expect(result.valid).toBe(true);
        expect(
            result.warnings.some((warning) =>
                warning.includes('unusual level'),
            ),
        ).toBe(false);
    });
});
