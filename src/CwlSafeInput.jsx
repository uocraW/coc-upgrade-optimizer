import React from 'react';
import { getDisplayName } from './displayNames.js';
import { HOME_HERO_OPTIONS } from './HeroAwakeInput.jsx';
import { getUiText } from './uiText.js';

export default function CwlSafeInput({
    value = [],
    onChange,
    displayLanguage = 'zh',
}) {
    const selectedHeroIds = Array.isArray(value) ? value : [];
    const text = getUiText(displayLanguage);

    const toggleHero = (heroId) => {
        const nextHeroIds = selectedHeroIds.includes(heroId)
            ? selectedHeroIds.filter((candidate) => candidate !== heroId)
            : [...selectedHeroIds, heroId];
        onChange?.(nextHeroIds);
    };

    return (
        <div className="glass-card rounded-2xl p-4 space-y-3 bg-dark-750 border border-dark-700">
            <div>
                <label className="text-2xs uppercase tracking-widest text-amber-400 font-bold block mb-1">
                    {text.cwlSafe}
                </label>
                <p className="text-2xs text-dark-500">
                    {text.cwlSafeHelp}
                </p>
            </div>

            <div>
                <label className="text-2xs text-dark-400 font-semibold uppercase tracking-wider block mb-2">
                    {text.protectedHeroes}
                </label>
                <div className="flex flex-wrap gap-2">
                    {HOME_HERO_OPTIONS.map((heroId) => {
                        const checked = selectedHeroIds.includes(heroId);

                        return (
                            <label
                                key={`cwl-safe-${heroId}`}
                                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                                    checked
                                        ? 'border-amber-400 bg-amber-500/10 text-amber-200'
                                        : 'border-dark-600 text-dark-300 hover:border-dark-500 hover:text-dark-100'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleHero(heroId)}
                                    className="sr-only"
                                />
                                <span
                                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                                        checked ? 'bg-amber-400' : 'bg-dark-600'
                                    }`}
                                ></span>
                                {getDisplayName(heroId, displayLanguage)}
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
