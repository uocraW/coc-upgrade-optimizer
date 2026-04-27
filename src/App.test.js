import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('./BuilderTimeline.jsx', () => () => null);

import App, {
    flattenHeroAwakeMoments,
    formatScheduleWarningMessage,
    normalizeCwlSafeProtectedHeroIds,
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

test('prefills the JSON input with runnable example data on first load', () => {
    render(<App />);

    const jsonTextarea = screen.getByPlaceholderText(
        /#EXAMPLE","buildings/i,
    );
    expect(jsonTextarea.value).toContain('"tag"');
    expect(jsonTextarea.value).toContain('#9JYU89YQ');
    expect(jsonTextarea.value).toContain('"guardians"');
    expect(jsonTextarea.value).toContain('"lvl":18');
});

test('renders phase controls for strategy and reset actions', () => {
    render(<App />);

    expect(screen.getByText(/计划生成器/i)).toBeInTheDocument();

    // Check for strategy dropdown (Phase 8 multi-objective optimization)
    const strategySelect = screen.getByRole('combobox', {
        name: /优化策略/i,
    });
    expect(strategySelect).toBeInTheDocument();
    expect(strategySelect).toHaveValue('Balanced');

    const languageSelect = screen.getByRole('combobox', {
        name: /显示语言/i,
    });
    expect(languageSelect).toBeInTheDocument();

    // Verify options include legacy LPT/SPT and new profiles
    expect(screen.getByText(/长任务优先/i)).toBeInTheDocument();
    expect(screen.getByText(/短任务优先/i)).toBeInTheDocument();
    expect(screen.getByText(/english/i)).toBeInTheDocument();
    expect(screen.getByText(/均衡/i)).toBeInTheDocument();
    expect(screen.getByText(/CWL 安全/i)).toBeInTheDocument();
    expect(screen.getByText(/资源平滑/i)).toBeInTheDocument();
    expect(screen.queryByText(/select village/i)).not.toBeInTheDocument();
    expect(
        screen.queryByRole('option', { name: /builder base/i }),
    ).not.toBeInTheDocument();
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
        screen.getByRole('button', { name: /重置设置/i }),
    ).toBeInTheDocument();
    expect(
        screen.getByRole('button', { name: /重置进度/i }),
    ).toBeInTheDocument();
});

test('switches static UI labels between Chinese and English', () => {
    render(<App />);

    const languageSelect = screen.getByRole('combobox', {
        name: /显示语言/i,
    });

    fireEvent.change(languageSelect, { target: { value: 'en' } });

    expect(screen.getByText(/schedule generator/i)).toBeInTheDocument();
    expect(
        screen.getByRole('combobox', { name: /optimization strategy/i }),
    ).toBeInTheDocument();
    expect(
        screen.getByRole('button', { name: /generate schedule/i }),
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

test('formats CWL safe warnings for Chinese UI', () => {
    const formattedMessage = formatScheduleWarningMessage(
        'CWLSafeConflict|2026-05-02T00:00:00.000Z|2026-05-12T00:00:00.000Z|Archer_Queen,Grand_Warden',
        'zh',
    );

    expect(formattedMessage).toMatch(/CWL 安全窗/);
    expect(formattedMessage).toMatch(/弓箭女皇|女王|Archer Queen/);
    expect(formattedMessage).toMatch(/大守护者|Grand Warden/);
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

test('normalizes protected heroes for CWL safe strategy', () => {
    const protectedHeroIds = normalizeCwlSafeProtectedHeroIds([
        'Grand_Warden',
        'Grand_Warden',
        'Archer_Queen',
        'Unknown_Hero',
    ]);

    expect(protectedHeroIds).toEqual(['Archer_Queen', 'Grand_Warden']);
});
