import { render, screen } from '@testing-library/react';

jest.mock('./BuilderTimeline.jsx', () => () => null);

import App, {
    flattenHeroAwakeMoments,
    formatScheduleWarningMessage,
    normalizeHeroAwakeConstraints,
} from './App';

beforeEach(() => {
    window.localStorage.clear();
});

test('renders smart village tracker title', () => {
    render(<App />);
    const headingElement = screen.getByText(/coc upgrade tracker/i);
    expect(headingElement).toBeInTheDocument();
});

test('renders phase controls for strategy and reset actions', () => {
    render(<App />);

    expect(screen.getByText(/schedule generator/i)).toBeInTheDocument();

    // Check for strategy dropdown (Phase 8 multi-objective optimization)
    const strategySelect = screen.getByRole('combobox', {
        name: /optimization strategy/i,
    });
    expect(strategySelect).toBeInTheDocument();
    expect(strategySelect).toHaveValue('Balanced');

    const languageSelect = screen.getByRole('combobox', {
        name: /display language/i,
    });
    expect(languageSelect).toBeInTheDocument();

    // Verify options include legacy LPT/SPT and new profiles
    expect(screen.getByText(/longest processing time/i)).toBeInTheDocument();
    expect(screen.getByText(/shortest processing time/i)).toBeInTheDocument();
    expect(screen.getByText(/english/i)).toBeInTheDocument();
    expect(screen.getByText(/balanced/i)).toBeInTheDocument();
    expect(screen.getByText(/resource smoothing/i)).toBeInTheDocument();
    expect(
        screen.queryByRole('option', { name: /time maximization \(lpt\)/i }),
    ).not.toBeInTheDocument();
    expect(
        screen.queryByRole('option', { name: /hero availability/i }),
    ).not.toBeInTheDocument();
    expect(
        screen.queryByRole('option', { name: /rush mode/i }),
    ).not.toBeInTheDocument();

    expect(
        screen.getByRole('button', { name: /reset settings/i }),
    ).toBeInTheDocument();
    expect(
        screen.getByRole('button', { name: /reset progress/i }),
    ).toBeInTheDocument();
});

test('formats hero-awake conflict warnings for Chinese UI', () => {
    const formattedMessage = formatScheduleWarningMessage(
        'HeroAwakeConflict|2026-04-22T12:30:00.000Z|Barbarian_King,Archer_Queen',
        'zh',
    );

    expect(formattedMessage).toMatch(/无法满足英雄醒着规则/);
    expect(formattedMessage).toMatch(/野蛮人之王|蛮王|Barbarian King/);
    expect(formattedMessage).toMatch(/弓箭女皇|女王|Archer Queen/);
});

test('formats hero-awake conflict warnings for English UI', () => {
    const formattedMessage = formatScheduleWarningMessage(
        'HeroAwakeConflict|2026-04-22T12:30:00.000Z|Dragon_Duke',
        'en',
    );

    expect(formattedMessage).toMatch(/Cannot satisfy this hero-awake rule/i);
    expect(formattedMessage).toMatch(/Dragon Duke/i);
});

test('migrates legacy hero-awake rules into grouped time-point rules', () => {
    const normalizedConstraints = normalizeHeroAwakeConstraints([
        {
            heroId: 'Barbarian_King',
            requiredAt: '2026-04-25T20:30',
        },
        {
            heroId: 'Archer_Queen',
            requiredAt: '2026-04-25T20:30',
        },
        {
            requiredAt: '2026-04-26T19:00',
            heroIds: ['Grand_Warden'],
        },
    ]);

    expect(normalizedConstraints).toEqual([
        {
            requiredAt: '2026-04-25T20:30',
            heroIds: ['Barbarian_King', 'Archer_Queen'],
        },
        {
            requiredAt: '2026-04-26T19:00',
            heroIds: ['Grand_Warden'],
        },
    ]);
});

test('flattens grouped hero-awake rules for the scheduler', () => {
    const flattenedMoments = flattenHeroAwakeMoments([
        {
            requiredAt: '2026-04-25T20:30',
            heroIds: ['Barbarian_King', 'Archer_Queen'],
        },
    ]);

    expect(flattenedMoments).toHaveLength(2);
    expect(flattenedMoments.map((moment) => moment.heroId)).toEqual([
        'Barbarian_King',
        'Archer_Queen',
    ]);
    expect(flattenedMoments.every((moment) => Number.isFinite(moment.timestamp))).toBe(
        true,
    );
});
