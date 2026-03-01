/**
 * Error Presentation and Message Formatting
 * Formats validation/scheduling errors for user-friendly display
 */

/**
 * Error/Warning severity levels
 */
const SEVERITY = {
    CRITICAL: 'critical', // Blocks scheduling
    ERROR: 'error', // Significant issue but might be recoverable
    WARNING: 'warning', // Non-blocking informational message
    INFO: 'info', // Helpful context
};

/**
 * Deduplicates and categorizes validation messages
 * Prevents message flooding on every render
 */
export class ValidationMessageManager {
    constructor() {
        this.seenMessages = new Map(); // Track dedupe timeouts
        this.messageCache = [];
        this.dedupeWindow = 5000; // 5 second dedup window
    }

    /**
     * Adds a message, deduplicating recent duplicates
     * @param {string} message - Message text
     * @param {string} severity - CRITICAL, ERROR, WARNING, INFO
     * @param {string} category - Error category for grouping
     * @returns {boolean} - True if message was added (not duplicate)
     */
    addMessage(message, severity = SEVERITY.WARNING, category = 'general') {
        const msgKey = `${severity}:${message}`;
        const now = Date.now();

        // Check if we've seen this message recently
        if (this.seenMessages.has(msgKey)) {
            const lastSeen = this.seenMessages.get(msgKey);
            if (now - lastSeen < this.dedupeWindow) {
                return false; // Duplicate, skip it
            }
        }

        this.seenMessages.set(msgKey, now);

        const msg = {
            id: `${category}_${Math.random().toString(36).substr(2, 9)}`,
            text: message,
            severity,
            category,
            timestamp: now,
        };

        this.messageCache.push(msg);

        // Keep only last 50 messages
        if (this.messageCache.length > 50) {
            this.messageCache.shift();
        }

        return true;
    }

    /**
     * Gets messages grouped by severity, with limit
     */
    getMessages(maxPerSeverity = 5) {
        const grouped = {};
        const order = [
            SEVERITY.CRITICAL,
            SEVERITY.ERROR,
            SEVERITY.WARNING,
            SEVERITY.INFO,
        ];

        for (const severity of order) {
            grouped[severity] = this.messageCache
                .filter((m) => m.severity === severity)
                .slice(0, maxPerSeverity);
        }

        return grouped;
    }

    /**
     * Gets summary counts per severity
     */
    getSummary() {
        const summary = {};
        for (const severity of Object.values(SEVERITY)) {
            summary[severity] = this.messageCache.filter(
                (m) => m.severity === severity,
            ).length;
        }
        return summary;
    }

    /**
     * Clears all messages
     */
    clear() {
        this.messageCache = [];
        this.seenMessages.clear();
    }

    /**
     * Formats messages for display in UI
     */
    format(maxPerSeverity = 5) {
        const grouped = this.getMessages(maxPerSeverity);
        const lines = [];

        if (grouped[SEVERITY.CRITICAL].length > 0) {
            lines.push('🔴 Critical Issues:');
            grouped[SEVERITY.CRITICAL].forEach((m) => {
                lines.push(`  • ${m.text}`);
            });
        }

        if (grouped[SEVERITY.ERROR].length > 0) {
            lines.push('❌ Errors:');
            grouped[SEVERITY.ERROR].forEach((m) => {
                lines.push(`  • ${m.text}`);
            });
        }

        if (grouped[SEVERITY.WARNING].length > 0) {
            lines.push('⚠️ Warnings:');
            grouped[SEVERITY.WARNING].forEach((m) => {
                lines.push(`  • ${m.text}`);
            });
        }

        if (lines.length === 0) {
            lines.push('✅ No issues found');
        }

        return lines.join('\n');
    }
}

/**
 * Categorizes errors by type for better UX
 */
export function categorizeError(error) {
    const msg = error.message || String(error);

    if (msg.includes('parsing') || msg.includes('JSON')) {
        return {
            category: 'json_parse',
            title: 'Invalid JSON',
            guidance:
                'Make sure you pasted valid JSON. Check for unclosed quotes or brackets.',
        };
    }

    if (msg.includes('mapping') || msg.includes('Unmapped')) {
        return {
            category: 'mapping',
            title: 'Unknown Buildings/Heroes',
            guidance:
                'Some buildings in your JSON are not recognized. Try updating the mapping data.',
        };
    }

    if (msg.includes('time') || msg.includes('HH:MM')) {
        return {
            category: 'time_format',
            title: 'Invalid Time Format',
            guidance:
                'Use HH:MM format (e.g., 07:00 for 7am). Hours 00-23, minutes 00-59.',
        };
    }

    if (msg.includes('cycle') || msg.includes('overflow')) {
        return {
            category: 'schedule_logic',
            title: 'Scheduling Error',
            guidance:
                'Check your prerequisites and hero requirements. There may be a circular dependency.',
        };
    }

    if (msg.includes('required') || msg.includes('missing')) {
        return {
            category: 'missing_data',
            title: 'Missing Required Data',
            guidance:
                'Make sure you exported the correct base (Home or Builder).',
        };
    }

    return {
        category: 'unknown',
        title: 'Unexpected Error',
        guidance:
            'This error is unexpected. Try re-exporting your data and pasting it again.',
    };
}

/**
 * Formats error with guidance for user
 */
export function formatErrorWithGuidance(error) {
    const categorized = categorizeError(error);

    return {
        title: categorized.title,
        message: error.message || String(error),
        guidance: categorized.guidance,
        category: categorized.category,
    };
}

/**
 * Creates a sticky error alert (doesn't auto-dismiss)
 * Used for blocking errors in scheduling
 */
export function createStickyErrorAlert(errorList) {
    if (!Array.isArray(errorList) || errorList.length === 0) {
        return null;
    }

    const hasCritical = errorList.some((e) => e.severity === SEVERITY.CRITICAL);

    return {
        visible: true,
        sticky: true,
        type: hasCritical ? 'critical' : 'error',
        title: hasCritical ? 'Cannot Schedule' : 'Schedule Error',
        messages: errorList.slice(0, 5),
        dismissible: false,
        required_action: true,
    };
}

/**
 * Creates a dismissible warning alert
 * Auto-dismisses after timeout
 */
export function createWarningAlert(warningList, timeoutMs = 8000) {
    if (!Array.isArray(warningList) || warningList.length === 0) {
        return null;
    }

    return {
        visible: true,
        sticky: false,
        type: 'warning',
        title: `${warningList.length} Warning${warningList.length !== 1 ? 's' : ''}`,
        messages: warningList.slice(0, 3),
        dismissible: true,
        timeout: timeoutMs,
    };
}

/**
 * Accessibility-friendly error announcement
 * For screen readers
 */
export function generateAccessibleAnnouncement(errorSummary) {
    const parts = [];

    if (errorSummary.criticalCount > 0) {
        parts.push(
            `${errorSummary.criticalCount} critical error${errorSummary.criticalCount !== 1 ? 's' : ''}`,
        );
    }

    if (errorSummary.errorCount > 0) {
        parts.push(
            `${errorSummary.errorCount} error${errorSummary.errorCount !== 1 ? 's' : ''}`,
        );
    }

    if (errorSummary.warningCount > 0) {
        parts.push(
            `${errorSummary.warningCount} warning${errorSummary.warningCount !== 1 ? 's' : ''}`,
        );
    }

    if (parts.length === 0) {
        return 'Validation complete. No issues found.';
    }

    return `Validation found: ${parts.join(', ')}. Review the messages below.`;
}

/**
 * Formats skipped items report
 * User-friendly summary of what was skipped
 */
export function formatSkippedItemsReport(unmappedIds, base = 'home') {
    if (!unmappedIds || unmappedIds.length === 0) {
        return null;
    }

    const buildingIds = unmappedIds
        .filter((u) => u.type === 'building')
        .map((u) => u.id);
    const heroIds = unmappedIds
        .filter((u) => u.type === 'hero')
        .map((u) => u.id);

    const lines = [];
    if (buildingIds.length > 0) {
        lines.push(
            `Skipped ${buildingIds.length} unmapped building(s): ${buildingIds.slice(0, 3).join(', ')}${buildingIds.length > 3 ? '...' : ''}`,
        );
    }

    if (heroIds.length > 0) {
        lines.push(
            `Skipped ${heroIds.length} unmapped hero(es): ${heroIds.slice(0, 3).join(', ')}${heroIds.length > 3 ? '...' : ''}`,
        );
    }

    return lines.join('\n');
}

/**
 * Converts validation results to an alert object for display
 */
export function convertValidationToAlert(validation) {
    const alert = {
        hasErrors: validation.errors && validation.errors.length > 0,
        hasWarnings: validation.warnings && validation.warnings.length > 0,
        errorCount: validation.errors?.length || 0,
        warningCount: validation.warnings?.length || 0,
        canProceed: !validation.errors || validation.errors.length === 0,
    };

    if (alert.hasErrors) {
        alert.errorAlert = createStickyErrorAlert(
            validation.errors.map((e) => ({
                text: e,
                severity: SEVERITY.ERROR,
            })),
        );
    }

    if (alert.hasWarnings) {
        alert.warningAlert = createWarningAlert(
            validation.warnings.map((w) => ({
                text: w,
                severity: SEVERITY.WARNING,
            })),
        );
    }

    return alert;
}

// Export severity levels
export { SEVERITY };
