import { getDisplayName } from './displayNames.js';

describe('display names', () => {
    test('translates key TH18 entities to Chinese by default', () => {
        expect(getDisplayName('Dragon_Duke')).toBe('飞龙公爵');
        expect(getDisplayName('Longshot')).toBe('远袭者');
        expect(getDisplayName('Smasher')).toBe('粉碎者');
        expect(getDisplayName('Merged_Archer_Tower')).toBe('多管箭塔');
    });

    test('supports English display labels for translated entities', () => {
        expect(getDisplayName('Dragon_Duke', 'en')).toBe('Dragon Duke');
        expect(getDisplayName('Longshot', 'en')).toBe('Longshot');
        expect(getDisplayName('Builder_Hall', 'en')).toBe('Builder Hall');
        expect(getDisplayName('Merged_Archer_Tower', 'en')).toBe(
            'Merged Archer Tower',
        );
    });

    test('falls back to a humanized English label for unmapped ids', () => {
        expect(getDisplayName('Unknown_Test_Name')).toBe('Unknown Test Name');
    });
});
