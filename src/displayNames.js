const DISPLAY_NAME_MAP = {
    Air_Bomb: '空中炸弹',
    Air_Defense: '防空火箭',
    Air_Sweeper: '吹风机',
    Archer_Queen: '弓箭女皇',
    Archer_Tower: '箭塔',
    Army_Camp: '兵营',
    'B.O.B_Control': '战争机器控制器',
    'B.O.B_Hut': '战争机器小屋',
    Barbarian_King: '野蛮人之王',
    Barracks: '训练营',
    Battle_Copter: '战争直升机',
    Blacksmith: '铁匠铺',
    Bomb: '炸弹',
    Bomb_Tower: '炸弹塔',
    Builder_Air_Bomb: '空中炸弹',
    Builder_Archer_Tower: '箭塔',
    Builder_Army_Camp: '兵营',
    Builder_Barracks: '训练营',
    Builder_Cannon: '加农炮',
    Builder_Elixir_Collector: '圣水收集器',
    Builder_Elixir_Storage: '圣水瓶',
    Builder_Gold_Mine: '金矿',
    Builder_Gold_Storage: '金库',
    Builder_Hall: '建筑大师大本营',
    Builder_Hidden_Tesla: '特斯拉电磁塔',
    Builder_XBow: '超级弩炮',
    Builders_Hut: '建筑工人小屋',
    Cannon: '加农炮',
    Clan_Castle: '部落城堡',
    Clock_Tower: '钟楼',
    Crafting_Station: '锻造台',
    Crusher: '粉碎机',
    Dark_Barracks: '暗黑训练营',
    Dark_Elixir_Drill: '暗黑重油钻井',
    Dark_Elixir_Storage: '暗黑重油罐',
    Dark_Spell_Factory: '暗黑法术工厂',
    Double_Cannon: '双管加农炮',
    Dragon_Duke: '飞龙公爵',
    Eagle_Artillery: '天鹰火炮',
    Elixir_Collector: '圣水收集器',
    Elixir_Storage: '圣水瓶',
    Firecrackers: '爆竹',
    Firespitter: '喷火器',
    Gem_Mine: '宝石矿井',
    Giant_Bomb: '巨型炸弹',
    Giant_Cannon: '巨型加农炮',
    Giga_Bomb: '巨型炸弹',
    Gold_Mine: '金矿',
    Gold_Storage: '金库',
    Grand_Warden: '大守护者',
    Guard_Post: '岗哨',
    Healing_Hut: '疗伤小屋',
    Helper_Hut: '助手小屋',
    Hero_Hall: '英雄殿堂',
    Hidden_Tesla: '特斯拉电磁塔',
    Inferno_Tower: '地狱之塔',
    Laboratory: '实验室',
    Lava_Launcher: '熔岩发射器',
    Longshot: '远袭者',
    Mega_Tesla: '超级特斯拉电磁塔',
    Merged_Archer_Cannon: '多重齿轮塔',
    Merged_Archer_Tower: '多管箭塔',
    Merged_Cannon: '弹射加农炮',
    Minion_Prince: '亡灵王子',
    Monolith: '巨石碑',
    Mortar: '迫击炮',
    Multi_Mortar: '多管迫击炮',
    'O.T.T.O_Outpost': '奥仔前哨站',
    Pet_House: '宠物小屋',
    Reinforcement_Camp: '增援营地',
    Revenge_Tower: '复仇塔',
    Roaster: '火焰喷射器',
    Royal_Champion: '飞盾战神',
    Scattershot: '投石炮',
    Seeking_Air_Mine: '搜空地雷',
    Skeleton_Trap: '骷髅陷阱',
    Smasher: '粉碎者',
    Spell_Factory: '法术工厂',
    Spell_Tower: '法术塔',
    Spring_Trap: '弹簧陷阱',
    Star_Laboratory: '星空实验室',
    Tornado_Trap: '飓风陷阱',
    Town_Hall: '大本营',
    Wall: '城墙',
    Wizard_Tower: '法师塔',
    Workshop: '攻城机器工坊',
    XBow: 'X连弩',
    Super_Wizard_Tower: '超级法师塔',
};

const SUPPORTED_DISPLAY_LANGUAGES = ['zh', 'en'];

function humanizeIdentifier(id = '') {
    return String(id).replaceAll('_', ' ').trim();
}

export function normalizeDisplayLanguage(language = 'zh') {
    return SUPPORTED_DISPLAY_LANGUAGES.includes(language) ? language : 'zh';
}

export function getDisplayName(id = '', language = 'zh') {
    const normalizedLanguage = normalizeDisplayLanguage(language);
    if (normalizedLanguage === 'en') {
        return humanizeIdentifier(id);
    }

    return DISPLAY_NAME_MAP[id] || humanizeIdentifier(id);
}

export { DISPLAY_NAME_MAP, SUPPORTED_DISPLAY_LANGUAGES };
