import { getDisplayName } from './displayNames.js';

describe('display names', () => {
    test('translates key TH18 entities to Chinese by default', () => {
        expect(getDisplayName('Dragon_Duke')).toBe('飞龙公爵');
        expect(getDisplayName('Longshot')).toBe('远袭者');
        expect(getDisplayName('Smasher')).toBe('粉碎者');
        expect(getDisplayName('Merged_Archer_Tower')).toBe('多人箭塔');
        expect(getDisplayName('Merged_Cannon')).toBe('跳弹加农炮');
        expect(getDisplayName('Merged_Archer_Cannon')).toBe('复合机械塔');
        expect(getDisplayName('Revenge_Tower')).toBe('复仇之塔');
    });

    test('matches ClashPost-style Chinese names for key utility buildings', () => {
        expect(getDisplayName('Crafting_Station')).toBe('精制台');
        expect(getDisplayName('Pet_House')).toBe('战宠小屋');
        expect(getDisplayName('Gold_Storage')).toBe('储金罐');
        expect(getDisplayName('Air_Sweeper')).toBe('空气炮');
        expect(getDisplayName('Firespitter')).toBe('火焰喷射器');
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
