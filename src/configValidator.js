/**
 * Mapping and Configuration Data Validation
 * Audits mapping coverage, validates consistency, detects issues
 */

import mapping from './data/mapping.json' with { type: 'json' };
import priority from './data/priority.json' with { type: 'json' };
import thConfig from './data/th.json' with { type: 'json' };
import bhConfig from './data/bh.json' with { type: 'json' };

const DEBUG = process.env.REACT_APP_DEBUG_VALIDATION === 'true' || false;

/**
 * Audits mapping coverage for known building/hero IDs
 * @param {Object} playerData - Player data from JSON export
 * @param {string} baseMode - 'home' or 'builder'
 * @returns {Object} { coverage: number, unmapped: [], warnings: [] }
 */
export function auditMappingCoverage(playerData, baseMode = 'home') {
    const buildingsKey = baseMode === 'home' ? 'buildings' : 'buildings2';
    const heroesKey = baseMode === 'home' ? 'heroes' : 'heroes2';

    const buildings = playerData[buildingsKey] || [];
    const heroes = playerData[heroesKey] || [];

    const unmappedIds = [];
    const warnings = [];

    // Check building mappings
    for (const building of buildings) {
        if (!mapping[building.data]) {
            unmappedIds.push({
                id: building.data,
                type: 'building',
                level: building.lvl,
            });
        }
    }

    // Check hero mappings
    for (const hero of heroes) {
        if (!mapping[hero.data]) {
            unmappedIds.push({
                id: hero.data,
                type: 'hero',
                level: hero.lvl,
            });
        }
    }

    const totalItems = buildings.length + heroes.length;
    const coverage =
        totalItems > 0
            ? ((totalItems - unmappedIds.length) / totalItems) * 100
            : 0;

    if (unmappedIds.length > 0) {
        warnings.push(
            `${unmappedIds.length} item(s) missing from mapping: ${unmappedIds.map((u) => `ID ${u.id} (${u.type})`).join(', ')}`,
        );
    }

    if (coverage < 90) {
        warnings.push(
            `Mapping coverage is only ${coverage.toFixed(1)}%. Schedule may be incomplete.`,
        );
    }

    return {
        coverage,
        unmappedIds,
        warnings,
        totalItems: totalItems - unmappedIds.length,
    };
}

/**
 * Validates that priority map entries match actual schedulable IDs
 * @returns {Object} { valid: boolean, missingPriorities: [], orphanedPriorities: [] }
 */
export function validatePriorityMap() {
    const warnings = [];
    const missingPriorities = [];
    const orphanedPriorities = [];

    // Get all mapped building/hero names
    const mappedNames = new Set(Object.values(mapping).flat());

    // Check if priority entries have corresponding mappings
    for (const priorityName of Object.keys(priority)) {
        if (!mappedNames.has(priorityName)) {
            orphanedPriorities.push(priorityName);
        }
    }

    if (orphanedPriorities.length > 0) {
        warnings.push(
            `Priority map has ${orphanedPriorities.length} entries with no corresponding mappings: ` +
                `${orphanedPriorities.slice(0, 5).join(', ')}${orphanedPriorities.length > 5 ? '...' : ''}`,
        );
    }

    return {
        valid: orphanedPriorities.length === 0,
        warnings,
        orphanedPriorities,
        missingPriorities,
        totalPriorityEntries: Object.keys(priority).length,
    };
}

/**
 * Validates that TH/BH config tables align with actual building counts
 * @param {number} currentTH - Current Town Hall level
 * @param {string} baseMode - 'home' or 'builder'
 * @returns {Object} { valid: boolean, warnings: [] }
 */
export function validateTHBHConfig(currentTH, baseMode = 'home') {
    const warnings = [];
    const config = baseMode === 'home' ? thConfig : bhConfig;

    if (!Array.isArray(config)) {
        warnings.push(`${baseMode} config is not an array`);
        return { valid: false, warnings };
    }

    if (currentTH < 1 || currentTH > config.length) {
        warnings.push(
            `TH level ${currentTH} is outside valid range: 1-${config.length}`,
        );
        return { valid: false, warnings };
    }

    // Verify config structure for current TH
    const thLevelConfig = config[currentTH - 1];
    if (!thLevelConfig) {
        warnings.push(`No config found for ${baseMode} TH level ${currentTH}`);
        return { valid: false, warnings };
    }

    // Check if it's an object (expected structure)
    if (typeof thLevelConfig !== 'object' || Array.isArray(thLevelConfig)) {
        warnings.push(`TH level ${currentTH} config has unexpected structure`);
        return { valid: false, warnings };
    }

    return { valid: true, warnings };
}

/**
 * Performs comprehensive config validation
 * @param {Object} playerData - Player data
 * @param {string} baseMode - 'home' or 'builder'
 * @returns {Object} { valid: boolean, warnings: [] }
 */
export function validateAllConfigs(playerData, baseMode = 'home') {
    const allWarnings = [];

    // Validate priority map
    const priorityCheck = validatePriorityMap();
    allWarnings.push(...priorityCheck.warnings);

    // Get current TH/BH level
    const buildingsKey = baseMode === 'home' ? 'buildings' : 'buildings2';
    const thBhName = baseMode === 'home' ? 'Town_Hall' : 'Builder_Hall';
    const buildings = playerData[buildingsKey] || [];

    const thBhBuilding = buildings.find((b) => mapping[b.data] === thBhName);
    if (!thBhBuilding) {
        allWarnings.push(
            `No Town/Builder Hall found in data. Using TH level 1 as default.`,
        );
    } else {
        const thCheck = validateTHBHConfig(thBhBuilding.lvl, baseMode);
        allWarnings.push(...thCheck.warnings);
    }

    return {
        valid: allWarnings.length === 0,
        warnings: allWarnings,
    };
}

/**
 * Creates a validation report for all data assets
 * Useful for CI/CD and debugging
 */
export function generateDataIntegrityReport() {
    const report = {
        timestamp: new Date().toISOString(),
        sections: {
            mapping: {
                entryCount: Object.keys(mapping).length,
                uniqueNames: new Set(Object.values(mapping).flat()).size,
            },
            priority: {
                entryCount: Object.keys(priority).length,
            },
            config: {
                thLevels: thConfig.length,
                bhLevels: bhConfig.length,
            },
        },
        issues: [],
    };

    // Validate priority map
    const priorityCheck = validatePriorityMap();
    if (priorityCheck.orphanedPriorities.length > 0) {
        report.issues.push({
            severity: 'warning',
            category: 'priority_map',
            message: `${priorityCheck.orphanedPriorities.length} orphaned priority entries`,
            entries: priorityCheck.orphanedPriorities,
        });
    }

    // Check for duplicate IDs in mapping
    const idCounts = {};
    let duplicateCount = 0;
    for (const id of Object.keys(mapping)) {
        idCounts[id] = (idCounts[id] || 0) + 1;
        if (idCounts[id] > 1 && idCounts[id] === 2) {
            duplicateCount++;
        }
    }

    if (duplicateCount > 0) {
        report.issues.push({
            severity: 'error',
            category: 'mapping_duplicates',
            message: `${duplicateCount} duplicate IDs in mapping`,
            count: duplicateCount,
        });
    }

    // Check for empty arrays in config
    let emptyLevels = 0;
    for (let i = 0; i < thConfig.length; i++) {
        if (!thConfig[i] || Object.keys(thConfig[i]).length === 0) {
            emptyLevels++;
        }
    }

    if (emptyLevels > 0) {
        report.issues.push({
            severity: 'error',
            category: 'th_config',
            message: `${emptyLevels} empty TH level(s) in config`,
            count: emptyLevels,
        });
    }

    if (DEBUG) {
        console.log('Data Integrity Report:', report);
    }

    return report;
}

/**
 * Performs data linting - checks for common consistency issues
 * Returns structured lint results
 */
export function lintDataConsistency() {
    const lintResults = {
        errors: [],
        warnings: [],
        info: [],
    };

    // Check 1: All mapped names exist in priority (optional but good to know)
    const mappedNames = new Set(Object.values(mapping).flat());
    const priorityNames = new Set(Object.keys(priority));

    for (const name of mappedNames) {
        if (!priorityNames.has(name)) {
            lintResults.info.push(
                `Building/hero "${name}" has no priority entry`,
            );
        }
    }

    // Check 2: Priority names exist in mapping
    for (const name of priorityNames) {
        if (!mappedNames.has(name)) {
            lintResults.errors.push(
                `Priority entry "${name}" has no corresponding mapping`,
            );
        }
    }

    // Check 3: TH/BH config has reasonable structure
    for (let level = 0; level < thConfig.length; level++) {
        const config = thConfig[level];
        if (!config || typeof config !== 'object') {
            lintResults.errors.push(
                `TH level ${level + 1} has invalid structure`,
            );
        } else {
            const buildingCount = Object.keys(config).length;
            if (buildingCount === 0) {
                lintResults.warnings.push(
                    `TH level ${level + 1} has no buildings`,
                );
            }
        }
    }

    return lintResults;
}
