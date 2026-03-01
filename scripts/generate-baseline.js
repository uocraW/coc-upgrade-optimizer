/**
 * Phase 0 Baseline Generation Script
 *
 * Generates reproducible baseline outputs for scheduler regression testing.
 * Runs all dataset × configuration combinations and captures:
 * - Schedule outputs (tasks with timing)
 * - Makespan values
 * - Performance metrics
 * - Edge case behaviors
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Import scheduler (requires transpilation or running via node with --experimental-modules)
// For now, this script documents the process - actual execution requires build setup

const BASELINE_DIR = path.join(__dirname, '../docs/phase0-baseline');
const DATASETS_DIR = path.join(BASELINE_DIR, 'datasets');
const OUTPUTS_DIR = path.join(BASELINE_DIR, 'outputs');
const MEASUREMENTS_DIR = path.join(BASELINE_DIR, 'measurements');

/**
 * Test configurations to run against each dataset
 */
const TEST_CONFIGS = [
    {
        scheme: 'LPT',
        priority: false,
        boost: 0.05,
        startTime: '08:00',
        endTime: '23:00',
        base: 'home',
        label: 'lpt-nopri-active',
    },
    {
        scheme: 'LPT',
        priority: true,
        boost: 0.05,
        startTime: '08:00',
        endTime: '23:00',
        base: 'home',
        label: 'lpt-pri-active',
    },
    {
        scheme: 'SPT',
        priority: false,
        boost: 0.05,
        startTime: '08:00',
        endTime: '23:00',
        base: 'home',
        label: 'spt-nopri-active',
    },
    {
        scheme: 'SPT',
        priority: true,
        boost: 0.05,
        startTime: '08:00',
        endTime: '23:00',
        base: 'home',
        label: 'spt-pri-active',
    },
    {
        scheme: 'LPT',
        priority: false,
        boost: 0.05,
        startTime: '00:00',
        endTime: '23:59',
        base: 'home',
        label: 'lpt-nopri-fulltime',
    },
    {
        scheme: 'LPT',
        priority: false,
        boost: 0.1,
        startTime: '08:00',
        endTime: '23:00',
        base: 'home',
        label: 'lpt-nopri-boost10',
    },
];

/**
 * Find all dataset files
 */
function findDatasets() {
    if (!fs.existsSync(DATASETS_DIR)) {
        console.error(`Datasets directory not found: ${DATASETS_DIR}`);
        return [];
    }

    const files = fs
        .readdirSync(DATASETS_DIR)
        .filter((f) => f.endsWith('.json'))
        .map((f) => ({
            name: path.basename(f, '.json'),
            path: path.join(DATASETS_DIR, f),
        }));

    return files;
}

/**
 * Generate schedule for a dataset + config combination
 * NOTE: This requires the scheduler module to be importable in Node context
 * In production setup, this would use the actual generateSchedule function
 */
function generateScheduleForConfig(datasetPath, config) {
    // Placeholder for actual implementation
    // In real execution, this would:
    // 1. Import { generateSchedule } from '../src/scheduler.js'
    // 2. Load dataset JSON
    // 3. Call generateSchedule with config parameters
    // 4. Return { schedule, makespan, duration, iterations }

    return {
        config: config.label,
        dataset: path.basename(datasetPath),
        timestamp: new Date().toISOString(),
        note: 'Placeholder - requires Node ES module setup or build transpilation',
    };
}

/**
 * Save output to file
 */
function saveOutput(datasetName, configLabel, output) {
    const filename = `${datasetName}-${configLabel}.json`;
    const filepath = path.join(OUTPUTS_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
    console.log(`  ✓ Saved: ${filename}`);
}

/**
 * Main baseline generation process
 */
function generateBaseline() {
    console.log('=== Phase 0 Baseline Generation ===\n');

    // Ensure output directories exist
    [OUTPUTS_DIR, MEASUREMENTS_DIR].forEach((dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    const datasets = findDatasets();

    if (datasets.length === 0) {
        console.error(
            'No datasets found. Please add JSON files to docs/phase0-baseline/datasets/',
        );
        return;
    }

    console.log(`Found ${datasets.length} dataset(s):\n`);
    datasets.forEach((d) => console.log(`  - ${d.name}`));
    console.log('');

    const measurements = [];

    // Run all combinations
    for (const dataset of datasets) {
        console.log(`Processing: ${dataset.name}`);

        for (const config of TEST_CONFIGS) {
            const startTime = performance.now();

            const output = generateScheduleForConfig(dataset.path, config);

            const duration = performance.now() - startTime;

            saveOutput(dataset.name, config.label, output);

            measurements.push({
                dataset: dataset.name,
                config: config.label,
                scheme: config.scheme,
                priority: config.priority,
                boost: config.boost,
                duration_ms: duration.toFixed(2),
                makespan: output.makespan || 'N/A',
                iterations: output.iterations || 'N/A',
            });
        }

        console.log('');
    }

    // Save performance measurements as CSV
    const csvPath = path.join(MEASUREMENTS_DIR, 'performance.csv');
    const csvHeaders =
        'dataset,config,scheme,priority,boost,duration_ms,makespan,iterations\n';
    const csvRows = measurements
        .map(
            (m) =>
                `${m.dataset},${m.config},${m.scheme},${m.priority},${m.boost},${m.duration_ms},${m.makespan},${m.iterations}`,
        )
        .join('\n');

    fs.writeFileSync(csvPath, csvHeaders + csvRows);
    console.log(`✓ Saved performance measurements: performance.csv\n`);

    // Generate summary
    console.log('=== Summary ===');
    console.log(`Total datasets: ${datasets.length}`);
    console.log(`Total configurations: ${TEST_CONFIGS.length}`);
    console.log(`Total test runs: ${measurements.length}`);
    console.log(`Outputs saved to: ${OUTPUTS_DIR}`);
    console.log(`Measurements saved to: ${csvPath}`);
    console.log('\n✓ Baseline generation complete');
}

/**
 * Display usage instructions
 */
function showUsage() {
    console.log(`
Phase 0 Baseline Generation Script

SETUP REQUIRED:
  This script currently generates placeholders. To enable full functionality:
  
  1. Build the project or setup Node ES modules:
     npm run build
     
  2. Ensure scheduler.js exports are Node-compatible
  
  3. Add test datasets to docs/phase0-baseline/datasets/

USAGE:
  node scripts/generate-baseline.js

MANUAL TESTING (Current Approach):
  1. Open the app in browser
  2. Load each dataset from docs/phase0-baseline/datasets/
  3. Try each configuration (LPT/SPT, priority on/off, etc.)
  4. Copy schedule output from browser console
  5. Save to docs/phase0-baseline/outputs/ with naming pattern:
     {dataset-name}-{config-label}.json

OUTPUT STRUCTURE:
  docs/phase0-baseline/
    datasets/       - Input JSON files
    outputs/        - Generated schedules
    measurements/   - Performance CSV
    edge-cases/     - Documented behaviors
`);
}

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
        showUsage();
    } else {
        generateBaseline();
    }
}

module.exports = { generateBaseline, TEST_CONFIGS };
