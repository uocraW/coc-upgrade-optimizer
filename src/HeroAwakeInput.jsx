import React from 'react';
import { getDisplayName } from './displayNames.js';
import { getUiText } from './uiText.js';

export const HOME_HERO_OPTIONS = [
    'Barbarian_King',
    'Archer_Queen',
    'Grand_Warden',
    'Royal_Champion',
    'Minion_Prince',
    'Dragon_Duke',
];

function buildDefaultConstraint() {
    return {
        requiredAt: '',
        heroIds: [],
    };
}

export default function HeroAwakeInput({
    value = [],
    onChange,
    displayLanguage = 'zh',
}) {
    const constraints = Array.isArray(value) ? value : [];
    const text = getUiText(displayLanguage);

    const updateConstraint = (index, nextPatch) => {
        const nextConstraints = constraints.map((constraint, constraintIndex) =>
            constraintIndex === index
                ? { ...constraint, ...nextPatch }
                : constraint,
        );
        onChange?.(nextConstraints);
    };

    const toggleHero = (index, heroId) => {
        const constraint = constraints[index] || buildDefaultConstraint();
        const currentHeroIds = Array.isArray(constraint.heroIds)
            ? constraint.heroIds
            : [];
        const nextHeroIds = currentHeroIds.includes(heroId)
            ? currentHeroIds.filter((candidate) => candidate !== heroId)
            : [...currentHeroIds, heroId];

        updateConstraint(index, { heroIds: nextHeroIds });
    };

    const addConstraint = () => {
        onChange?.([...constraints, buildDefaultConstraint()]);
    };

    const removeConstraint = (index) => {
        const nextConstraints = constraints.filter(
            (_, constraintIndex) => constraintIndex !== index,
        );
        onChange?.(nextConstraints);
    };

    return (
        <div className="glass-card rounded-2xl p-4 space-y-3 bg-dark-750 border border-dark-700">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <label className="text-2xs uppercase tracking-widest text-amber-400 font-bold block mb-1">
                        {text.heroAwakeTime}
                    </label>
                    <p className="text-2xs text-dark-500">
                        {text.heroAwakeHelp}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addConstraint}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-dark-600 text-dark-300 hover:text-dark-100 hover:border-amber-400 transition-colors"
                >
                    {text.add}
                </button>
            </div>

            {constraints.length === 0 ? (
                <div className="text-2xs text-dark-500 border border-dashed border-dark-600 rounded-xl px-3 py-3">
                    {text.noHeroAwakeRules}
                </div>
            ) : (
                <div className="space-y-3">
                    {constraints.map((constraint, index) => {
                        const selectedHeroIds = Array.isArray(constraint.heroIds)
                            ? constraint.heroIds
                            : [];

                        return (
                            <div
                                key={`hero-awake-${index}`}
                                className="rounded-xl border border-dark-700 bg-dark-800/60 p-3 space-y-3"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr),auto] gap-3 items-end">
                                    <div>
                                        <label className="text-2xs text-dark-400 font-semibold uppercase tracking-wider block mb-2">
                                            {text.mustBeAwakeAt}
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={constraint.requiredAt || ''}
                                            onChange={(e) =>
                                                updateConstraint(index, {
                                                    requiredAt: e.target.value,
                                                })
                                            }
                                            className="input-modern w-full px-3 py-2 text-sm font-medium rounded-lg"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeConstraint(index)}
                                        className="px-3 py-2 text-xs font-bold rounded-lg border border-dark-600 text-dark-300 hover:text-red-300 hover:border-red-400 transition-colors"
                                    >
                                        {text.remove}
                                    </button>
                                </div>

                                <div>
                                    <label className="text-2xs text-dark-400 font-semibold uppercase tracking-wider block mb-2">
                                        {text.heroes}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {HOME_HERO_OPTIONS.map((heroId) => {
                                            const checked =
                                                selectedHeroIds.includes(heroId);

                                            return (
                                                <label
                                                    key={`${constraint.requiredAt || 'empty'}-${heroId}`}
                                                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                                                        checked
                                                            ? 'border-amber-400 bg-amber-500/10 text-amber-200'
                                                            : 'border-dark-600 text-dark-300 hover:border-dark-500 hover:text-dark-100'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() =>
                                                            toggleHero(
                                                                index,
                                                                heroId,
                                                            )
                                                        }
                                                        className="sr-only"
                                                    />
                                                    <span
                                                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                                                            checked
                                                                ? 'bg-amber-400'
                                                                : 'bg-dark-600'
                                                        }`}
                                                    ></span>
                                                    {getDisplayName(
                                                        heroId,
                                                        displayLanguage,
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
