import React, { useState } from 'react';
import { generateSchedule, getProfileOptions } from './scheduler.js';
import { BUILDING_COLORS } from './colorMap';
import { TimelineCards } from './TimelineCards.jsx';
import BuilderTimeline from './BuilderTimeline.jsx';
import ActiveTimeInput from './ActiveTimeInput.jsx';
import HeroAwakeInput, { HOME_HERO_OPTIONS } from './HeroAwakeInput.jsx';
import CwlSafeInput from './CwlSafeInput.jsx';
import { validatePlayerJSON, generatePreflight } from './inputValidator.js';
import { auditMappingCoverage, validateAllConfigs } from './configValidator.js';
import { getDisplayName, normalizeDisplayLanguage } from './displayNames.js';
import { getCategoryLabel, getUiText } from './uiText.js';
import {
    ValidationMessageManager,
    createStickyErrorAlert,
    createWarningAlert,
    SEVERITY,
} from './errorPresentation.js';
import {
    cleanupStaleDoneState,
    loadPersisted,
    migratePersistenceIfNeeded,
    persistenceKeys,
    removePersisted,
    savePersisted,
} from './persistence';
import exampleVillageData from './data/example_th18.json';

migratePersistenceIfNeeded();

export function JsonInput({
    label = 'JSON Input',
    initial = '',
    onValid,
    onValidityChange,
    storageKey = persistenceKeys.jsonDraft,
    displayLanguage = 'zh',
}) {
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    const copy = getUiText(displayLanguage);

    const [text, setText] = React.useState(() => {
        try {
            const stored = loadPersisted(storageKey, null);
            if (stored && typeof stored === 'object') {
                if (stored.timestamp) {
                    const ts = stored.timestamp;
                    const ms = ts < 1e12 ? ts * 1000 : ts;
                    const age = Date.now() - ms;
                    if (age > SIX_HOURS_MS) {
                        removePersisted(storageKey);
                    } else {
                        return JSON.stringify(stored);
                    }
                } else {
                    return JSON.stringify(stored);
                }
            }

            if (typeof initial === 'string') return initial;
            return initial ? JSON.stringify(initial) : '';
        } catch (err) {
            console.error('Error loading from localStorage:', err);
            return '';
        }
    });

    const [error, setError] = React.useState('');
    const areaRef = React.useRef(null);

    const isValid = React.useMemo(() => {
        try {
            JSON.parse(text);
            return true;
        } catch {
            return false;
        }
    }, [text]);

    React.useEffect(() => {
        onValidityChange?.(isValid);

        if (isValid) {
            try {
                const obj = JSON.parse(text);
                onValid?.(obj);
                savePersisted(storageKey, obj);
            } catch {
                /* no-op */
            }
        }
    }, [isValid, text, onValid, onValidityChange, storageKey]);

    const handleFormat = () => {
        try {
            const obj = JSON.parse(text);
            setText(JSON.stringify(obj, null, 2));
            setError('');
        } catch (e) {
            setError(`${copy.cannotFormat}: ${e.message}`);
        }
    };

    const handleClear = () => {
        setText('');
        setError('');
        removePersisted(storageKey);
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold text-dark-100 uppercase tracking-wide">
                {label}
            </label>

            <textarea
                ref={areaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='{"tag":"#EXAMPLE","buildings":[...]}'
                spellCheck={false}
                className={`input-modern w-full h-[14vh] resize-none font-mono text-xs p-3 rounded-lg ${
                    isValid
                        ? 'border-dark-700'
                        : 'border-red-500/50 bg-red-950/20 ring-2 ring-red-500/20'
                }`}
            />

            <div className="flex gap-2 items-center">
                <button
                    onClick={handleFormat}
                    className="px-3 py-1.5 bg-dark-800 border border-dark-700 hover:border-amber-400/50 text-dark-100 text-xs font-medium rounded-lg transition-all hover:bg-dark-750"
                >
                    {copy.formatJson}
                </button>
                <button
                    onClick={handleClear}
                    className="px-5 py-2.5 bg-dark-800 border border-dark-700 hover:border-red-500/50 text-dark-100 text-sm font-medium rounded-xl transition-all hover:bg-dark-750"
                >
                    {copy.clear}
                </button>

                <div className="flex-1"></div>

                <div
                    className={`flex items-center gap-2 text-sm font-semibold ${
                        isValid ? 'text-amber-400' : 'text-red-400'
                    }`}
                >
                    <div
                        className={`w-2 h-2 rounded-full ${
                            isValid ? 'bg-amber-400' : 'bg-red-400'
                        }`}
                    ></div>
                    {isValid ? copy.validJson : copy.invalidJson}
                </div>
            </div>

            {error && <div className="text-sm text-red-400 mt-2">{error}</div>}
        </div>
    );
}

const taskKey = (t) => t.key || `${t.id}|L${t.level}|#${t.iter || 0}`;

const formatDuration = (seconds = 0) => {
    const total = Math.max(0, Number(seconds || 0));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const getTaskCategory = (id = '') => {
    const name = String(id).toLowerCase();
    if (
        name.includes('hero') ||
        name.includes('king') ||
        name.includes('queen') ||
        name.includes('warden') ||
        name.includes('champion') ||
        name.includes('prince') ||
        name.includes('duke')
    )
        return 'Hero';
    if (
        name.includes('mine') ||
        name.includes('collector') ||
        name.includes('storage') ||
        name.includes('drill')
    )
        return 'Resource';
    if (
        name.includes('barracks') ||
        name.includes('laboratory') ||
        name.includes('spell') ||
        name.includes('workshop') ||
        name.includes('camp') ||
        name.includes('clan_castle') ||
        name.includes('pet')
    )
        return 'Offense';
    return 'Defense';
};

// Build strategy options from legacy + Phase 8 objective profiles
const buildStrategyOptions = () => {
    const legacy = {
        LPT: {
            label: 'Longest Processing Time (Legacy)',
            short: 'LPT',
            description: 'Keeps builders busy with the longest upgrades first.',
        },
        SPT: {
            label: 'Shortest Processing Time (Legacy)',
            short: 'SPT',
            description: 'Clears quick wins to reveal long blockers sooner.',
        },
    };

    // Add Phase 8 objective profiles
    const profiles = getProfileOptions();
    const objectiveOptions = {};
    profiles.forEach((profile) => {
        objectiveOptions[profile.key] = {
            label: profile.name,
            short: profile.key,
            description: profile.description,
        };
    });

    return { ...legacy, ...objectiveOptions };
};

const STRATEGY_COPY = buildStrategyOptions();
const HIDDEN_STRATEGY_KEYS = new Set([
    'TimeMax',
    'HeroAvailability',
    'RushMode',
]);
const VISIBLE_STRATEGY_ENTRIES = Object.entries(STRATEGY_COPY).filter(
    ([key]) => !HIDDEN_STRATEGY_KEYS.has(key),
);

const BOOST_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
const DEFAULT_STRATEGY_KEY = 'Balanced';
const VALID_STRATEGY_KEYS = new Set(Object.keys(STRATEGY_COPY));
const VALID_HOME_HERO_IDS = new Set(HOME_HERO_OPTIONS);
const DEFAULT_CWL_SAFE_PROTECTED_HERO_IDS = [...HOME_HERO_OPTIONS];

const formatActiveWindowLabel = (windowState = {}) => {
    if (!windowState.enabled) return 'All day';
    const start = windowState.start || '??:??';
    const end = windowState.end || '??:??';
    return `${start} → ${end}`;
};

const HERO_AWAKE_CONFLICT_PATTERN =
    /^Warning: ([A-Za-z0-9_]+) is already upgrading and cannot be awake at (.+)\.$/;
const HERO_AWAKE_BLOCKING_CONFLICT_PATTERN =
    /^HeroAwakeConflict\|([^|]+)\|(.+)$/;
const CWL_SAFE_WARNING_PATTERN = /^CWLSafeConflict\|([^|]+)\|([^|]+)\|(.+)$/;

function formatLocalRuleTime(rawTime, displayLanguage = 'zh') {
    const parsedTime = new Date(rawTime);
    if (Number.isNaN(parsedTime.getTime())) return rawTime;

    const locale =
        normalizeDisplayLanguage(displayLanguage) === 'zh'
            ? 'zh-CN'
            : 'en-US';

    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(parsedTime);
}

function formatHeroNameList(heroIds = [], displayLanguage = 'zh') {
    const normalizedLanguage = normalizeDisplayLanguage(displayLanguage);
    const heroNames = heroIds
        .map((heroId) => getDisplayName(heroId, normalizedLanguage))
        .filter(Boolean);

    if (heroNames.length <= 1) {
        return heroNames[0] || '';
    }

    if (normalizedLanguage === 'zh') {
        return heroNames.join('、');
    }

    if (heroNames.length === 2) {
        return `${heroNames[0]} and ${heroNames[1]}`;
    }

    return `${heroNames.slice(0, -1).join(', ')}, and ${heroNames.at(-1)}`;
}

function normalizeHeroIds(heroIds = []) {
    const seen = new Set();

    return heroIds
        .filter(
            (heroId) =>
                typeof heroId === 'string' && VALID_HOME_HERO_IDS.has(heroId),
        )
        .filter((heroId) => {
            if (seen.has(heroId)) return false;
            seen.add(heroId);
            return true;
        })
        .sort(
            (left, right) =>
                HOME_HERO_OPTIONS.indexOf(left) - HOME_HERO_OPTIONS.indexOf(right),
        );
}

export function normalizeHeroAwakeConstraints(constraints = []) {
    if (!Array.isArray(constraints)) return [];

    const mergedByTime = new Map();
    const normalizedConstraints = [];

    const upsertConstraint = (requiredAt, heroIds) => {
        const normalizedRequiredAt =
            typeof requiredAt === 'string' ? requiredAt : '';
        const normalizedHeroIds = normalizeHeroIds(heroIds);

        if (normalizedRequiredAt) {
            const existing = mergedByTime.get(normalizedRequiredAt);
            if (existing) {
                existing.heroIds = normalizeHeroIds([
                    ...existing.heroIds,
                    ...normalizedHeroIds,
                ]);
                return;
            }
        }

        const nextConstraint = {
            requiredAt: normalizedRequiredAt,
            heroIds: normalizedHeroIds,
        };
        normalizedConstraints.push(nextConstraint);
        if (normalizedRequiredAt) {
            mergedByTime.set(normalizedRequiredAt, nextConstraint);
        }
    };

    constraints.forEach((constraint) => {
        if (!constraint || typeof constraint !== 'object') return;

        if (Array.isArray(constraint.heroIds)) {
            upsertConstraint(constraint.requiredAt, constraint.heroIds);
            return;
        }

        if (
            typeof constraint.requiredAt === 'string' &&
            typeof constraint.heroId === 'string' &&
            VALID_HOME_HERO_IDS.has(constraint.heroId)
        ) {
            upsertConstraint(constraint.requiredAt, [constraint.heroId]);
        }
    });

    return normalizedConstraints;
}

export function flattenHeroAwakeMoments(constraints = []) {
    return normalizeHeroAwakeConstraints(constraints)
        .filter(
            (constraint) =>
                constraint.requiredAt && Array.isArray(constraint.heroIds),
        )
        .flatMap((constraint) =>
            constraint.heroIds.map((heroId) => ({
                heroId,
                timestamp: Math.floor(
                    new Date(constraint.requiredAt).getTime() / 1000,
                ),
            })),
        )
        .filter((constraint) => Number.isFinite(constraint.timestamp));
}

export function normalizeCwlSafeProtectedHeroIds(heroIds = []) {
    return normalizeHeroIds(
        Array.isArray(heroIds) ? heroIds : DEFAULT_CWL_SAFE_PROTECTED_HERO_IDS,
    );
}

export function formatScheduleWarningMessage(message, displayLanguage = 'zh') {
    if (typeof message !== 'string') return String(message || '');

    const normalizedLanguage = normalizeDisplayLanguage(displayLanguage);
    const cwlSafeConflict = message.match(CWL_SAFE_WARNING_PATTERN);
    if (cwlSafeConflict) {
        const [, rawStart, rawEnd, rawHeroIds] = cwlSafeConflict;
        const heroIds = rawHeroIds.split(',').map((heroId) => heroId.trim());
        const formattedStart = formatLocalRuleTime(rawStart, normalizedLanguage);
        const formattedEnd = formatLocalRuleTime(rawEnd, normalizedLanguage);
        const heroNames = formatHeroNameList(heroIds, normalizedLanguage);

        if (normalizedLanguage === 'zh') {
            return `注意：${heroNames}当前已在升级中，并会覆盖 ${formattedStart} 至 ${formattedEnd} 的 CWL 安全窗。本次排程已继续生成，但本月联赛可能无法保证这些英雄可用。`;
        }

        const verb = heroIds.length > 1 ? 'are' : 'is';
        return `Warning: ${heroNames} ${verb} already upgrading and will overlap the CWL safe window from ${formattedStart} to ${formattedEnd}. Scheduling continued, but these heroes may be unavailable for this month's CWL.`;
    }

    const blockingConflict = message.match(HERO_AWAKE_BLOCKING_CONFLICT_PATTERN);
    if (blockingConflict) {
        const [, rawTime, rawHeroIds] = blockingConflict;
        const heroIds = rawHeroIds.split(',').map((heroId) => heroId.trim());
        const formattedTime = formatLocalRuleTime(rawTime, normalizedLanguage);
        const heroNames = formatHeroNameList(heroIds, normalizedLanguage);

        if (normalizedLanguage === 'zh') {
            return `无法满足英雄醒着规则：${formattedTime} 时，${heroNames}已经在升级中。`;
        }

        const verb = heroIds.length > 1 ? 'are' : 'is';
        return `Cannot satisfy this hero-awake rule: ${heroNames} ${verb} already upgrading at ${formattedTime}.`;
    }

    const heroAwakeConflict = message.match(HERO_AWAKE_CONFLICT_PATTERN);
    if (heroAwakeConflict) {
        const [, heroId, rawTime] = heroAwakeConflict;
        const heroName = getDisplayName(heroId, normalizedLanguage);
        const formattedTime = formatLocalRuleTime(rawTime, normalizedLanguage);

        if (normalizedLanguage === 'zh') {
            return `无法满足“王必须醒着”规则：${heroName} 在 ${formattedTime} 时已经在升级中。`;
        }

        return `Cannot satisfy this hero-awake rule: ${heroName} is already upgrading at ${formattedTime}.`;
    }

    return message;
}

// ---- zoom constants + helpers ----
const MIN = 0.005;
const MAX = 7;

export const toPxPerSec = (z) => MIN * Math.pow(MAX / MIN, z);
export const toZoom = (p) => Math.log(p / MIN) / Math.log(MAX / MIN);

// clamp normalized zoom to [ZOOM_MIN, ZOOM_MAX]
const ZOOM_MIN = 0.01;
const ZOOM_MAX = 0.9;
export const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

/** ---------- App with exponential zoom ---------- */
export default function App() {
    const [jsonData, setJsonData] = React.useState(null);
    const [jsonValid, setJsonValid] = React.useState(false);
    const [doneKeys, setDoneKeys] = React.useState(() => new Set());

    const [tasks, setTasks] = useState([]);
    const [makespan, setMakespan] = useState(0);
    const [startTime, setStartTime] = useState(Math.floor(Date.now() / 1000));
    // eslint-disable-next-line no-unused-vars
    const [err, setErr] = useState(false);
    const [scheduleType, setScheduleType] = useState(
        STRATEGY_COPY[DEFAULT_STRATEGY_KEY]?.label || DEFAULT_STRATEGY_KEY,
    );
    const [dynamicHeight, setHeight] = useState(300);
    const [activeTime, setActiveTime] = useState({
        enabled: false,
        start: null,
        end: null,
    });

    const persistedSettings = React.useMemo(
        () =>
            loadPersisted(persistenceKeys.settings, {
                builderBonusPct: 0,
                fixedPriority: false,
                preferredStrategy: DEFAULT_STRATEGY_KEY,
                displayLanguage: 'zh',
                heroAwakeConstraints: [],
                cwlSafeProtectedHeroIds: DEFAULT_CWL_SAFE_PROTECTED_HERO_IDS,
            }),
        [],
    );

    const [selectedPct, setSelectedPct] = useState(() => {
        return Number(persistedSettings.builderBonusPct || 0);
    });

    const village = 'home';

    const [priority, setPriority] = useState(() => {
        return Boolean(persistedSettings.fixedPriority);
    });

    const [preferredStrategy, setPreferredStrategy] = useState(() => {
        return VALID_STRATEGY_KEYS.has(persistedSettings.preferredStrategy)
            ? persistedSettings.preferredStrategy
            : DEFAULT_STRATEGY_KEY;
    });
    const [displayLanguage, setDisplayLanguage] = useState(() => {
        return normalizeDisplayLanguage(persistedSettings.displayLanguage);
    });
    const text = React.useMemo(
        () => getUiText(displayLanguage),
        [displayLanguage],
    );
    const [heroAwakeConstraints, setHeroAwakeConstraints] = useState(() => {
        return normalizeHeroAwakeConstraints(
            persistedSettings.heroAwakeConstraints,
        );
    });
    const [cwlSafeProtectedHeroIds, setCwlSafeProtectedHeroIds] = useState(() =>
        normalizeCwlSafeProtectedHeroIds(
            persistedSettings.cwlSafeProtectedHeroIds,
        ),
    );
    const [lastRunSignature, setLastRunSignature] = useState(null);
    const [scheduleStale, setScheduleStale] = useState(false);
    const [activeTimeResetToken, setActiveTimeResetToken] = useState(0);
    const [lastClearedDoneKeys, setLastClearedDoneKeys] = useState(null);

    const [validationAlert, setValidationAlert] = useState(null);
    const [preflightSummary, setPreflightSummary] = useState(null);
    const [mappingWarnings, setMappingWarnings] = useState(null);
    const [perfStats, setPerfStats] = useState({
        generationMs: null,
        iterations: null,
        taskCount: 0,
    });
    const validationAlertRef = React.useRef(null);
    const lastScrolledAlertKeyRef = React.useRef(null);

    React.useEffect(() => {
        savePersisted(persistenceKeys.settings, {
            builderBonusPct: selectedPct,
            fixedPriority: priority,
            preferredStrategy,
            displayLanguage,
            heroAwakeConstraints,
            cwlSafeProtectedHeroIds,
        });
    }, [
        selectedPct,
        priority,
        preferredStrategy,
        displayLanguage,
        heroAwakeConstraints,
        cwlSafeProtectedHeroIds,
    ]);

    const scheduleMode = React.useMemo(
        () => preferredStrategy,
        [preferredStrategy],
    );
    const doneStorageKey = React.useMemo(() => {
        const playerTag = jsonData?.tag || 'unknown';
        return persistenceKeys.done({
            village,
            playerTag,
            strategy: scheduleMode,
        });
    }, [jsonData?.tag, village, scheduleMode]);

    React.useEffect(() => {
        const parsed = loadPersisted(doneStorageKey, []);
        setDoneKeys(new Set(Array.isArray(parsed) ? parsed : []));

        cleanupStaleDoneState({
            village,
            playerTag: jsonData?.tag || 'unknown',
            strategy: scheduleMode,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doneStorageKey]);

    React.useEffect(() => {
        savePersisted(doneStorageKey, [...doneKeys]);
    }, [doneKeys, doneStorageKey]);

    const validationAlertScrollKey = React.useMemo(() => {
        if (!validationAlert?.visible) return null;

        const messageText = Array.isArray(validationAlert.messages)
            ? validationAlert.messages
                  .map((message) => message?.text || '')
                  .join('|')
            : '';

        return `${validationAlert.type || 'unknown'}:${validationAlert.title || ''}:${messageText}`;
    }, [validationAlert]);

    React.useEffect(() => {
        if (!validationAlertScrollKey) {
            lastScrolledAlertKeyRef.current = null;
            return;
        }

        if (lastScrolledAlertKeyRef.current === validationAlertScrollKey) {
            return;
        }

        validationAlertRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
        lastScrolledAlertKeyRef.current = validationAlertScrollKey;
    }, [validationAlertScrollKey]);

    const boostPercent = Math.round((Number(selectedPct) || 0) * 100);

    const computeDataDigest = React.useCallback((data) => {
        if (!data || typeof data !== 'object') {
            return 'no-data';
        }

        return JSON.stringify({
            tag: data.tag || 'unknown',
            timestamp: data.timestamp || null,
            buildings: Array.isArray(data.buildings)
                ? data.buildings.length
                : 0,
            heroes: Array.isArray(data.heroes) ? data.heroes.length : 0,
            buildings2: Array.isArray(data.buildings2)
                ? data.buildings2.length
                : 0,
            heroes2: Array.isArray(data.heroes2) ? data.heroes2.length : 0,
        });
    }, []);

    const buildSettingsSignature = React.useCallback(
        (strategyKey, dataShape) =>
            JSON.stringify({
                strategy: strategyKey,
                priority,
                village,
                boost: selectedPct,
                active: activeTime,
                heroAwakeConstraints,
                cwlSafeProtectedHeroIds,
                data: computeDataDigest(dataShape),
            }),
        [
            priority,
            village,
            selectedPct,
            activeTime,
            heroAwakeConstraints,
            cwlSafeProtectedHeroIds,
            computeDataDigest,
        ],
    );

    const currentSettingsSignature = React.useMemo(
        () => buildSettingsSignature(preferredStrategy, jsonData),
        [buildSettingsSignature, preferredStrategy, jsonData],
    );

    React.useEffect(() => {
        if (!lastRunSignature) return;
        setScheduleStale(currentSettingsSignature !== lastRunSignature);
    }, [currentSettingsSignature, lastRunSignature]);

    const colorForId = (name) => {
        return BUILDING_COLORS[name] || '#94a3b8';
    };

    const toggleDone = (task) => {
        const k = taskKey(task);
        setDoneKeys((prev) => {
            const next = new Set(prev);
            next.has(k) ? next.delete(k) : next.add(k);
            return next;
        });
    };

    const resetSettings = () => {
        const confirmed = window.confirm(text.resetSettingsConfirm);
        if (!confirmed) return;

        setPreferredStrategy(DEFAULT_STRATEGY_KEY);
        setScheduleType(
            STRATEGY_COPY[DEFAULT_STRATEGY_KEY]?.label ||
                DEFAULT_STRATEGY_KEY,
        );
        setSelectedPct(0);
        setPriority(false);
        setDisplayLanguage('zh');
        setHeroAwakeConstraints([]);
        setCwlSafeProtectedHeroIds(DEFAULT_CWL_SAFE_PROTECTED_HERO_IDS);
        setActiveTime({ enabled: false, start: null, end: null });
        setPreflightSummary(null);
        setMappingWarnings(null);
        setValidationAlert(null);
        setLastRunSignature(null);
        setScheduleStale(false);
        setActiveTimeResetToken((token) => token + 1);
        removePersisted(persistenceKeys.settings);
        removePersisted(persistenceKeys.activeTime('home'));
    };

    const resetProgress = () => {
        const confirmed = window.confirm(text.resetProgressConfirm);
        if (!confirmed) return;

        const snapshot = [...doneKeys];
        setLastClearedDoneKeys(snapshot);
        setDoneKeys(new Set());
    };

    const undoResetProgress = () => {
        if (!Array.isArray(lastClearedDoneKeys)) return;
        setDoneKeys(new Set(lastClearedDoneKeys));
        setLastClearedDoneKeys(null);
    };

    const runSchedule = (
        dataOverride = jsonData,
        strategy = preferredStrategy,
    ) => {
        const jD = dataOverride;
        if (!jD) {
            console.error('No JSON data provided');
            setErr(true);
            return;
        }

        setValidationAlert(null);
        const msgManager = new ValidationMessageManager();

        const inputValidation = validatePlayerJSON(jD, village);
        if (!inputValidation.valid) {
            const errorAlert = createStickyErrorAlert(
                inputValidation.errors.map((msg) => ({
                    text: msg,
                    severity: SEVERITY.CRITICAL,
                })),
            );
            setValidationAlert(errorAlert);
            setPreflightSummary(null);
            setMappingWarnings(null);
            setErr(true);
            return;
        }

        if (inputValidation.warnings?.length) {
            inputValidation.warnings.forEach((w) =>
                msgManager.addMessage(w, SEVERITY.WARNING, 'input_validation'),
            );
        }

        const sanitizedData = inputValidation.data || jD;
        const preflight =
            inputValidation.summary ||
            generatePreflight(sanitizedData, village);
        setPreflightSummary(preflight);

        const coverage = auditMappingCoverage(sanitizedData, village);
        if (coverage.coverage < 90) {
            msgManager.addMessage(
                `Only ${Math.round(coverage.coverage)}% of buildings/heroes have mappings. ` +
                    `${coverage.unmappedIds.length} items will be skipped during scheduling.`,
                SEVERITY.WARNING,
                'mapping_coverage',
            );
        }

        if (coverage.warnings?.length) {
            coverage.warnings.forEach((w) =>
                msgManager.addMessage(w, SEVERITY.WARNING, 'mapping_audit'),
            );
        }

        setMappingWarnings(coverage);

        const configValidation = validateAllConfigs(sanitizedData, village);
        if (!configValidation.valid && configValidation.warnings?.length) {
            configValidation.warnings.forEach((w) =>
                msgManager.addMessage(w, SEVERITY.WARNING, 'config_validation'),
            );
        }

        const summary = msgManager.getSummary();
        if (summary[SEVERITY.WARNING] > 0 || summary[SEVERITY.ERROR] > 0) {
            const warningMessages = [];
            const grouped = msgManager.getMessages(3);
            grouped[SEVERITY.WARNING].forEach((m) => {
                warningMessages.push({
                    text: m.text,
                    severity: SEVERITY.WARNING,
                });
            });
            if (warningMessages.length > 0) {
                setValidationAlert(createWarningAlert(warningMessages, 10000));
            } else {
                setValidationAlert(null);
            }
        } else {
            setValidationAlert(null);
        }

        let activeWindowStart =
            activeTime.enabled && activeTime.start ? activeTime.start : '00:00';
        let activeWindowEnd =
            activeTime.enabled && activeTime.end ? activeTime.end : '23:59';
        const heroAwakeMoments = flattenHeroAwakeMoments(heroAwakeConstraints);
        const cwlSafeSettings =
            strategy === 'CWLSafe'
                ? {
                      protectedHeroIds:
                          normalizeCwlSafeProtectedHeroIds(
                              cwlSafeProtectedHeroIds,
                          ),
                  }
                : null;
        const runStartPerf = performance.now();
        const {
            sch,
            numBuilders,
            startTime: runStart,
            err,
        } = generateSchedule(
            sanitizedData,
            false,
            strategy,
            priority,
            village,
            selectedPct,
            activeWindowStart,
            activeWindowEnd,
            { heroAwakeMoments, cwlSafeSettings },
        );
        const runDurationMs = performance.now() - runStartPerf;
        setErr(err);
        if (Array.isArray(err) && err[0]) {
            setValidationAlert(
                createStickyErrorAlert(
                    err.slice(1).map((message) => ({
                        text: formatScheduleWarningMessage(
                            message,
                            displayLanguage,
                        ),
                        severity: SEVERITY.CRITICAL,
                    })),
                ),
            );
            setTasks([]);
            setMakespan(0);
            setPerfStats({
                generationMs: Math.round(runDurationMs),
                iterations: null,
                taskCount: 0,
            });
            setLastRunSignature(null);
            setScheduleStale(false);
            return;
        }
        if (Array.isArray(err) && err.length > 1) {
            setValidationAlert(
                createWarningAlert(
                    err.slice(1).map((message) => ({
                        text: formatScheduleWarningMessage(
                            message,
                            displayLanguage,
                        ),
                        severity: SEVERITY.WARNING,
                    })),
                    10000,
                ),
            );
        }
        setTasks(sch.schedule);
        setMakespan(sch.makespan);
        setStartTime(runStart);
        setPerfStats({
            generationMs: Math.round(runDurationMs),
            iterations:
                Number.isFinite(sch.iterations) && sch.iterations >= 0
                    ? sch.iterations
                    : null,
            taskCount: sch.schedule.length,
        });
        setScheduleType(STRATEGY_COPY[strategy]?.label || strategy);
        const rowHeight = 40;
        const basePadding = 90;
        setHeight(numBuilders * rowHeight + basePadding);

        const runSignature = buildSettingsSignature(strategy, sanitizedData);
        setLastRunSignature(runSignature);
        setScheduleStale(false);

        sch.schedule.forEach((t) => {
            colorForId(t.id);
        });
    };

    const remainingTasks = React.useMemo(
        () => tasks.filter((task) => !doneKeys.has(taskKey(task))),
        [tasks, doneKeys],
    );

    const trackerStats = React.useMemo(() => {
        if (!tasks.length) {
            return {
                total: 0,
                completed: 0,
                remaining: 0,
                completionPct: 0,
                remainingDuration: 0,
                byCategory: {},
            };
        }

        let remainingDuration = 0;
        const byCategory = { Defense: 0, Resource: 0, Offense: 0, Hero: 0 };

        remainingTasks.forEach((task) => {
            remainingDuration += Number(task.duration || 0);
            const category = getTaskCategory(task.id);
            byCategory[category] = (byCategory[category] || 0) + 1;
        });

        const total = tasks.length;
        const remaining = remainingTasks.length;
        const completed = total - remaining;
        const completionPct = Math.round((completed / total) * 100);

        return {
            total,
            completed,
            remaining,
            completionPct,
            remainingDuration,
            byCategory,
        };
    }, [tasks, remainingTasks]);

    const recommendedTasks = React.useMemo(() => {
        return remainingTasks
            .map((task) => {
                const priorityBoost = Math.max(
                    0,
                    120 - Number(task.priority || 100) * 8,
                );
                const durationPenalty = Math.min(
                    70,
                    Number(task.duration || 0) / 3600,
                );
                const startsSoonBoost = Math.max(
                    0,
                    48 -
                        (Number(task.start || startTime) - Number(startTime)) /
                            3600,
                );
                const categoryBoost =
                    getTaskCategory(task.id) === 'Resource' ? 8 : 0;
                const score =
                    priorityBoost +
                    startsSoonBoost +
                    categoryBoost -
                    durationPenalty;
                return { ...task, smartScore: score };
            })
            .sort((a, b) => b.smartScore - a.smartScore || a.start - b.start)
            .slice(0, 8);
    }, [remainingTasks, startTime]);

    const appliedSettings = React.useMemo(() => {
        const strategyMeta = STRATEGY_COPY[scheduleMode];
        const activeHeroAwakeRuleCount = normalizeHeroAwakeConstraints(
            heroAwakeConstraints,
        ).filter(
            (constraint) =>
                constraint.requiredAt && constraint.heroIds.length > 0,
        ).length;
        const activeCwlProtectedHeroCount = normalizeCwlSafeProtectedHeroIds(
            cwlSafeProtectedHeroIds,
        ).length;

        return [
            {
                label: text.appliedStrategy,
                value:
                    text.strategyLabels?.[scheduleMode] ||
                    strategyMeta?.label ||
                    scheduleType,
            },
            { label: text.builderBoost, value: `${boostPercent}%` },
            {
                label: text.priorityMode,
                value: priority ? text.fixedPriorityMap : text.dynamicPriority,
            },
            {
                label: text.activeWindow,
                value: activeTime.enabled
                    ? formatActiveWindowLabel(activeTime)
                    : text.allDay,
            },
            {
                label: text.heroAwake,
                value:
                    activeHeroAwakeRuleCount > 0
                        ? text.ruleCount(activeHeroAwakeRuleCount)
                        : text.none,
            },
            {
                label: text.cwlSafe,
                value:
                    preferredStrategy === 'CWLSafe'
                        ? text.protectedHeroesCount(activeCwlProtectedHeroCount)
                        : text.none,
            },
        ];
    }, [
        text,
        scheduleMode,
        boostPercent,
        priority,
        activeTime,
        heroAwakeConstraints,
        cwlSafeProtectedHeroIds,
        preferredStrategy,
        scheduleType,
    ]);

    return (
        <div className="min-h-screen bg-dark-850">
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none"></div>

            <div className="relative">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-2xl font-bold text-dark-100 mb-6">
                        CoC Upgrade Tracker
                    </h1>

                    {validationAlert && (
                        <div
                            ref={validationAlertRef}
                            className={`mb-6 rounded-2xl p-4 border ${
                                validationAlert.type === 'critical'
                                    ? 'bg-red-900/20 border-red-500/50'
                                    : 'bg-amber-900/20 border-amber-500/50'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`text-lg ${
                                        validationAlert.type === 'critical'
                                            ? 'text-red-400'
                                            : 'text-amber-400'
                                    }`}
                                >
                                    {validationAlert.type === 'critical'
                                        ? '🔴'
                                        : '⚠️'}
                                </div>
                                <div className="flex-1">
                                    <h3
                                        className={`font-bold text-sm mb-2 ${
                                            validationAlert.type === 'critical'
                                                ? 'text-red-300'
                                                : 'text-amber-300'
                                        }`}
                                    >
                                        {validationAlert.title}
                                    </h3>
                                    <div className="space-y-1">
                                        {validationAlert.messages.map(
                                            (msg, idx) => (
                                                <div
                                                    key={idx}
                                                    className="text-xs text-dark-200"
                                                >
                                                    • {msg.text}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                                {validationAlert.dismissible && (
                                    <button
                                        onClick={() => setValidationAlert(null)}
                                        className="text-dark-400 hover:text-dark-200 text-lg"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {preflightSummary && (
                        <div className="mb-6 glass-card rounded-2xl p-4 border border-dark-600 bg-dark-800/50">
                            <h3 className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-2">
                                {text.validationSummary}
                            </h3>
                            <div className="text-xs text-dark-200 space-y-1">
                                <div>
                                    ✓ {preflightSummary.totalBuildings}{' '}
                                    {displayLanguage === 'zh' ? '个建筑' : 'buildings'} (
                                    {preflightSummary.ongoingBuildings}{' '}
                                    {displayLanguage === 'zh'
                                        ? '正在升级'
                                        : 'upgrading'}
                                    )
                                </div>
                                <div>
                                    ✓ {preflightSummary.totalHeroes}{' '}
                                    {displayLanguage === 'zh' ? '个英雄' : 'heroes'}
                                    {preflightSummary.ongoingHeroes > 0
                                        ? displayLanguage === 'zh'
                                            ? ` (${preflightSummary.ongoingHeroes} 正在升级)`
                                            : ` (${preflightSummary.ongoingHeroes} upgrading)`
                                        : ''}
                                </div>
                                {preflightSummary.totalGuardians > 0 && (
                                    <div>
                                        ✓ {preflightSummary.totalGuardians}{' '}
                                        {displayLanguage === 'zh'
                                            ? '个守护者'
                                            : 'guardians'}
                                        {preflightSummary.ongoingGuardians > 0
                                            ? displayLanguage === 'zh'
                                                ? ` (${preflightSummary.ongoingGuardians} 正在升级)`
                                                : ` (${preflightSummary.ongoingGuardians} upgrading)`
                                            : ''}
                                    </div>
                                )}
                                {preflightSummary.message && (
                                    <div className="text-dark-400">
                                        {preflightSummary.message}
                                    </div>
                                )}
                                {mappingWarnings &&
                                    mappingWarnings.coverage < 100 && (
                                        <div className="text-amber-400">
                                            ⚠️{' '}
                                            {Math.round(
                                                mappingWarnings.coverage,
                                            )}
                                            % {text.mappingCoverage} (
                                            {mappingWarnings.unmappedIds.length}{' '}
                                            {text.unmapped})
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr),minmax(320px,1fr)]">
                        <div className="glass-card rounded-2xl p-5 border border-dark-600">
                            <h2 className="text-lg font-bold text-dark-100 mb-4">
                                {text.scheduleGenerator}
                            </h2>
                            <JsonInput
                                label={text.jsonInputLabel}
                                storageKey={persistenceKeys.jsonDraft}
                                initial={exampleVillageData}
                                onValid={setJsonData}
                                onValidityChange={setJsonValid}
                                displayLanguage={displayLanguage}
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="glass-card rounded-2xl p-4 bg-dark-750 border border-dark-700">
                                <div>
                                    <label
                                        htmlFor="strategy-select"
                                        className="text-2xs uppercase tracking-widest text-amber-400 font-bold block mb-2"
                                    >
                                        {text.optimizationStrategy}
                                    </label>
                                    <p className="text-2xs text-dark-500 mb-3">
                                        {text.chooseBuilderPriority}
                                    </p>
                                    <select
                                        id="strategy-select"
                                        value={preferredStrategy}
                                        onChange={(e) =>
                                            setPreferredStrategy(e.target.value)
                                        }
                                        className="input-modern w-full font-bold text-sm py-2 cursor-pointer"
                                    >
                                        {VISIBLE_STRATEGY_ENTRIES.map(
                                            ([key, meta]) => (
                                                <option key={key} value={key}>
                                                    {text.strategyLabels?.[
                                                        key
                                                    ] || meta.label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <p className="text-2xs text-dark-400 mt-2 leading-snug">
                                        {
                                            text.strategyDescriptions?.[
                                                preferredStrategy
                                            ] ||
                                                STRATEGY_COPY[
                                                    preferredStrategy
                                                ].description
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="glass-card rounded-2xl p-4 space-y-3 bg-dark-750 border border-dark-700">
                                <div>
                                    <label
                                        htmlFor="display-language-select"
                                        className="text-2xs uppercase tracking-widest text-amber-400 font-bold block mb-2"
                                    >
                                        {text.displayLanguage}
                                    </label>
                                    <select
                                        id="display-language-select"
                                        value={displayLanguage}
                                        onChange={(e) =>
                                            setDisplayLanguage(
                                                normalizeDisplayLanguage(
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                        className="input-modern w-full font-bold text-sm py-2 cursor-pointer"
                                    >
                                        <option value="zh">中文</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xs uppercase tracking-widest text-amber-400 font-bold">
                                            {text.fixedPriority}
                                        </p>
                                        <p className="text-2xs text-dark-500">
                                            {text.useSavedPriority}
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={priority}
                                        onChange={(e) =>
                                            setPriority(e.target.checked)
                                        }
                                        className="w-5 h-5 rounded-lg bg-dark-800 border-2 border-dark-700 text-amber-400 focus:ring-2 focus:ring-amber-400 focus:ring-offset-0 cursor-pointer transition-all"
                                    />
                                </div>
                            </div>

                            <div className="glass-card rounded-2xl p-4 bg-dark-750 border border-dark-700 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xs uppercase tracking-widest text-amber-400 font-bold">
                                        {text.builderBoost}
                                    </span>
                                    <span className="text-sm font-black text-amber-300">
                                        {boostPercent}%
                                    </span>
                                </div>
                                <select
                                    value={selectedPct}
                                    onChange={(e) =>
                                        setSelectedPct(Number(e.target.value))
                                    }
                                    className="input-modern w-full font-bold text-sm py-2 cursor-pointer"
                                >
                                    {BOOST_OPTIONS.map((pct) => (
                                        <option key={pct} value={pct / 100}>
                                            {pct}%
                                        </option>
                                    ))}
                                </select>
                                <p className="text-2xs text-dark-500">
                                    {text.resourceReductionHelp}
                                </p>
                            </div>

                            <ActiveTimeInput
                                key={`${village}-${activeTimeResetToken}`}
                                onChange={setActiveTime}
                                storageKey={persistenceKeys.activeTime(village)}
                                displayLanguage={displayLanguage}
                            />

                            <HeroAwakeInput
                                value={heroAwakeConstraints}
                                onChange={setHeroAwakeConstraints}
                                displayLanguage={displayLanguage}
                            />

                            {preferredStrategy === 'CWLSafe' && (
                                <CwlSafeInput
                                    value={cwlSafeProtectedHeroIds}
                                    onChange={setCwlSafeProtectedHeroIds}
                                    displayLanguage={displayLanguage}
                                />
                            )}

                            <div className="flex flex-wrap gap-2 pt-2">
                                <button
                                    disabled={!jsonValid || !jsonData}
                                    onClick={() =>
                                        runSchedule(jsonData, preferredStrategy)
                                    }
                                    className="btn-primary px-6 py-2.5 text-sm font-bold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    {text.generateSchedule}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetSettings}
                                    className="px-4 py-2 text-xs font-bold rounded-lg border border-dark-600 text-dark-300 hover:text-dark-100 hover:border-amber-400 transition-colors"
                                >
                                    {text.resetSettings}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetProgress}
                                    className="px-4 py-2 text-xs font-bold rounded-lg border border-dark-600 text-dark-300 hover:text-dark-100 hover:border-amber-400 transition-colors"
                                >
                                    {text.resetProgress}
                                </button>
                                {Array.isArray(lastClearedDoneKeys) && (
                                    <button
                                        type="button"
                                        onClick={undoResetProgress}
                                        className="px-4 py-2 text-xs font-bold rounded-lg border border-amber-500/50 text-amber-300 hover:text-amber-100 hover:border-amber-400 transition-colors"
                                    >
                                        {text.undoResetProgress}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 mt-8">
                    {tasks.length > 0 && (
                        <div>
                            <div className="glass-card rounded-2xl p-8 mb-8">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <h2 className="text-xl font-bold text-dark-200 flex-1">
                                        {text.progress}
                                    </h2>
                                    {Number.isFinite(
                                        perfStats.generationMs,
                                    ) && (
                                        <span className="px-3 py-1 text-2xs font-bold uppercase tracking-wider text-dark-200 border border-dark-600 rounded-full bg-dark-800/70">
                                            {perfStats.generationMs}ms •{' '}
                                            {perfStats.taskCount} {text.tasks}
                                            {Number.isFinite(
                                                perfStats.iterations,
                                            )
                                                ? ` • ${perfStats.iterations} ${text.iterations}`
                                                : ''}
                                        </span>
                                    )}
                                    {scheduleStale && (
                                        <span className="px-3 py-1 text-2xs font-bold uppercase tracking-wider text-amber-300 border border-amber-400/40 rounded-full bg-amber-400/10">
                                            {text.rerunToRefresh}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-6">
                                    {appliedSettings.map((item) => (
                                        <div
                                            key={item.label}
                                            className="glass-card rounded-2xl px-3 py-2 bg-dark-800 border border-dark-700"
                                        >
                                            <div className="text-2xs uppercase tracking-widest text-amber-400/70 font-bold">
                                                {item.label}
                                            </div>
                                            <div className="text-sm font-semibold text-dark-100">
                                                {item.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                                    <div className="glass-card rounded-2xl p-4 bg-dark-750">
                                        <div className="text-2xs uppercase tracking-widest text-amber-400/60 font-bold mb-1.5">
                                            {text.completed}
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-dark-100">
                                                {trackerStats.completed}
                                            </span>
                                            <span className="text-base text-dark-400 font-bold">
                                                / {trackerStats.total}
                                            </span>
                                            <span className="text-amber-400 font-bold text-base ml-auto">
                                                {trackerStats.completionPct}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="glass-card rounded-2xl p-4 bg-dark-750 border border-dark-600">
                                        <div className="text-2xs uppercase tracking-widest text-amber-400/60 font-bold mb-1.5">
                                            {text.remaining}
                                        </div>
                                        <div className="text-2xl font-black text-dark-100">
                                            {trackerStats.remaining}
                                        </div>
                                        <div className="text-xs text-dark-400 mt-0.5 uppercase tracking-wider">
                                            {text.tasks}
                                        </div>
                                    </div>
                                    <div className="glass-card rounded-2xl p-4 bg-dark-750 border border-dark-600">
                                        <div className="text-2xs uppercase tracking-widest text-amber-400/60 font-bold mb-1.5">
                                            {text.timeLeft}
                                        </div>
                                        <div className="text-2xl font-black text-dark-100">
                                            {formatDuration(
                                                trackerStats.remainingDuration,
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 flex-wrap mb-6">
                                    {[
                                        'Defense',
                                        'Resource',
                                        'Offense',
                                        'Hero',
                                    ].map((label) => (
                                        <div
                                            key={label}
                                            className="px-3 py-2 bg-dark-750 backdrop-blur-sm border border-dark-600 rounded-lg"
                                        >
                                            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                                                {getCategoryLabel(
                                                    label,
                                                    displayLanguage,
                                                )}
                                            </span>
                                            <span className="text-dark-100 font-black text-sm ml-2">
                                                {trackerStats.byCategory?.[
                                                    label
                                                ] || 0}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="glass-card rounded-2xl overflow-hidden bg-dark-850/30 max-h-[32vh] overflow-y-auto border border-dark-600">
                                    {recommendedTasks.map((task, idx) => (
                                        <div
                                            key={`rec-${taskKey(task)}`}
                                            className={`group border-b border-dark-600 last:border-b-0 hover:bg-amber-400/10 transition-all ${
                                                idx % 2 === 0
                                                    ? 'bg-dark-800/50'
                                                    : 'bg-dark-850/80'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-4 p-3">
                                                <div className="flex-1">
                                                    <div className="font-black text-base text-dark-100 mb-1.5 group-hover:text-amber-400 transition-colors">
                                                        {getDisplayName(
                                                            task.id,
                                                            displayLanguage,
                                                        )}
                                                        <span className="ml-2 px-2.5 py-0.5 bg-amber-400/20 text-amber-400 rounded-lg text-xs font-bold">
                                                            {text.level}{' '}
                                                            {task.level}
                                                        </span>
                                                        <span className="ml-2 text-dark-400 text-sm font-medium">
                                                            #{task.iter}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-2xs">
                                                        <span className="px-2 py-0.5 bg-dark-750 text-amber-400/80 rounded-lg border border-dark-600 font-bold uppercase tracking-wider">
                                                            {getTaskCategory(
                                                                task.id,
                                                            )
                                                                ? getCategoryLabel(
                                                                      getTaskCategory(
                                                                          task.id,
                                                                      ),
                                                                      displayLanguage,
                                                                  )
                                                                : ''}
                                                        </span>
                                                        <span className="text-dark-400 font-medium">
                                                            {text.builder}{' '}
                                                            {Number(
                                                                task.worker,
                                                            ) + 1}
                                                        </span>
                                                        <span className="text-amber-400 font-bold">
                                                            {formatDuration(
                                                                task.duration,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        toggleDone(task)
                                                    }
                                                    className="btn-primary px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap"
                                                >
                                                    {text.markDone}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {recommendedTasks.length === 0 && (
                                        <div className="p-12 text-center">
                                            <div className="text-5xl mb-4">
                                                ✓
                                            </div>
                                            <p className="text-dark-400 text-sm font-bold uppercase tracking-wider">
                                                {text.allUpgradesComplete}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="glass-card rounded-2xl p-5 mb-6">
                                <h2 className="text-lg font-bold text-dark-100 mb-4">
                                    {text.timelineChart}
                                </h2>

                                <div className="flex items-center justify-between mb-4">
                                    <div className="glass-card rounded-2xl px-4 py-2 bg-dark-750 border border-dark-600">
                                        <span className="text-2xs uppercase tracking-widest text-amber-400/50 font-bold mr-2">
                                            {text.makespan}
                                        </span>
                                        <span className="font-black text-dark-100 text-base">
                                            {makespan}
                                        </span>
                                    </div>
                                    <div className="px-4 py-2 bg-gradient-to-r from-amber-400/15 to-amber-400/15 border border-amber-400/20 rounded-lg">
                                        <span className="font-black text-amber-400 text-sm uppercase tracking-wider">
                                            {text.strategyLabels?.[
                                                scheduleMode
                                            ] || scheduleType}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-2xs text-dark-400 mb-2.5 uppercase tracking-wider font-medium">
                                    {text.tipZoom}
                                </p>
                                <div className="bg-white rounded-2xl shadow-card-lg overflow-hidden">
                                    <BuilderTimeline
                                        tasks={tasks}
                                        start={startTime}
                                        height={dynamicHeight}
                                        doneKeys={doneKeys}
                                        onToggle={toggleDone}
                                        taskKeyFn={taskKey}
                                        displayLanguage={displayLanguage}
                                    />
                                </div>
                            </div>

                            <div className="glass-card rounded-2xl p-5 mb-6 border border-dark-600">
                                <h2 className="text-lg font-bold text-dark-100 mb-4">
                                    {text.timelineCards}
                                </h2>
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="glass-card rounded-2xl px-4 py-2 bg-dark-750 border border-dark-600">
                                            <span className="text-2xs uppercase tracking-widest text-amber-400/50 font-bold mr-2">
                                                {text.makespan}
                                            </span>
                                            <span className="font-black text-dark-100 text-base">
                                                {makespan}
                                            </span>
                                        </div>
                                        <div className="px-4 py-2 bg-gradient-to-r from-amber-400/15 to-amber-400/15 border border-amber-400/20 rounded-lg">
                                            <span className="font-black text-amber-400 text-sm uppercase tracking-wider">
                                                {text.strategyLabels?.[
                                                    scheduleMode
                                                ] || scheduleType}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="max-h-[42vh] overflow-y-auto pr-2">
                                        <TimelineCards
                                            tasks={tasks}
                                            colorForId={colorForId}
                                            doneKeys={doneKeys}
                                            onToggle={toggleDone}
                                            taskKeyFn={taskKey}
                                            displayLanguage={displayLanguage}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
