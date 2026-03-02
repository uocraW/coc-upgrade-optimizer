# Deployment Validation Guide

This guide provides step-by-step instructions for deploying the CoC Upgrade Tracker to GitHub Pages and validating the deployment.

---

## Overview

**Deployment Platform:** GitHub Pages  
**Repository:** SamBro2901/coc-upgrade-optimizer  
**Branch:** gh-pages (auto-managed by gh-pages package)  
**Production URL:** https://sambro2901.github.io/coc-upgrade-optimizer/  
**Build Tool:** react-scripts (Create React App)  
**Deploy Tool:** gh-pages npm package

---

## Pre-Deployment Requirements

### Development Environment

- [ ] Node.js 16+ installed
- [ ] npm 8+ installed
- [ ] Git configured with push access to repository
- [ ] Local repository up to date with remote main/master branch

### Code Quality Gates

- [ ] All unit tests passing (`npm test`)
- [ ] No ESLint errors or warnings in build output
- [ ] No TypeScript/editor diagnostics on modified files
- [ ] Code reviewed and approved (if team workflow requires)
- [ ] Release notes prepared in `docs/RELEASE_NOTES.md`

### Version Control

- [ ] All changes committed to main/master branch
- [ ] Working directory clean (`git status` shows no uncommitted changes)
- [ ] Remote repository synced (`git push origin master`)
- [ ] Release tag created (e.g., `v0.2.0`)

```bash
git tag -a v0.2.0 -m "Release v0.2.0 - Performance and persistence improvements"
git push origin v0.2.0
```

---

## Deployment Steps

### Step 1: Clean Build Environment

Remove previous build artifacts to ensure fresh build:

```bash
# Remove build directory
rm -rf build

# Optional: Clear npm cache if suspecting dependency issues
npm cache clean --force

# Optional: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Step 2: Run Full Test Suite

Validate all tests pass before building:

```bash
npm test -- --watchAll=false
```

**Expected Output:** All tests passing (11/11)  
**Action if Failed:** Fix failing tests before proceeding

### Step 3: Build Production Artifacts

Generate optimized production build:

```bash
npm run build
```

**Expected Output:**
- "Compiled successfully" message
- Build artifacts in `build/` directory
- File sizes displayed (main.js ~241 KB gzipped)
- No errors or warnings

**Action if Failed:**
- Check console output for specific errors
- Verify all source files have valid syntax
- Ensure all imports resolve correctly
- Fix errors and rebuild

### Step 4: Validate Build Artifacts

Inspect generated files:

```bash
# List build directory contents
ls -la build/

# Check main HTML file exists
cat build/index.html | head -20

# Verify asset manifest
cat build/asset-manifest.json
```

**Expected:**
- `index.html` present with asset references
- `static/js/` contains main bundle and chunks
- `static/css/` contains stylesheets
- `asset-manifest.json` lists all assets

### Step 5: Test Build Locally (Optional)

Serve build locally to verify before deploying:

```bash
# Install serve if not already installed
npm install -g serve

# Serve build on localhost:3000
serve -s build -l 3000
```

**Action:**
- Open http://localhost:3000 in browser
- Run quick smoke test (paste JSON, generate schedule)
- Verify no console errors
- Stop server with Ctrl+C when validated

### Step 6: Deploy to GitHub Pages

Deploy build to gh-pages branch:

```bash
npm run deploy
```

**What This Does:**
1. Runs `predeploy` script (`npm run build`)
2. Pushes `build/` contents to `gh-pages` branch
3. GitHub Pages automatically serves from `gh-pages` branch

**Expected Output:**
```
Published
```

**Action if Failed:**
- Check GitHub authentication (may need personal access token)
- Verify repository settings allow GitHub Pages
- Check network connectivity
- Review error message for specific issue

### Step 7: Wait for GitHub Pages Deployment

GitHub Pages may take 1-5 minutes to serve updated content:

- [ ] Open GitHub repository → Settings → Pages
- [ ] Verify "Your site is published at https://sambro2901.github.io/coc-upgrade-optimizer/"
- [ ] Note deployment timestamp
- [ ] Wait ~2 minutes for CDN propagation

### Step 8: Validate Production Deployment

Open production URL and perform initial validation:

**URL:** https://sambro2901.github.io/coc-upgrade-optimizer/

**Quick Validation:**
- [ ] Page loads without errors
- [ ] Browser console shows no 404s or JS errors
- [ ] UI renders correctly
- [ ] Version/build date matches expected (if displayed)

### Step 9: Run Full Smoke Test Suite

Execute comprehensive smoke tests from `docs/SMOKE_TEST_CHECKLIST.md`:

- [ ] Complete Test Suite (15 tests)
- [ ] Regression Validation (2 tests)
- [ ] Browser Compatibility (5 browsers)

**Action if Failed:**
- Document failures in GitHub Issues
- Triage severity (Critical/High/Medium/Low)
- If critical, proceed to rollback (see below)
- If non-critical, track for hotfix

### Step 10: Tag Successful Deployment

If all smoke tests pass, tag deployment as verified:

```bash
# Create deployment confirmation tag
git tag -a v0.2.0-deployed -m "v0.2.0 deployed and smoke tested"
git push origin v0.2.0-deployed
```

---

## Rollback Procedure

If critical issues discovered post-deployment:

### Immediate Rollback

```bash
# 1. Identify last known good commit
git log --oneline

# 2. Revert to previous working commit
git revert <bad-commit-hash>

# 3. Rebuild and redeploy
npm run deploy

# 4. Verify rollback successful
# Open production URL and confirm old version loaded
```

### Alternative: Force Previous Build

```bash
# 1. Checkout gh-pages branch
git checkout gh-pages

# 2. Reset to previous commit
git log --oneline
git reset --hard <previous-good-commit>

# 3. Force push
git push origin gh-pages --force

# 4. Return to main branch
git checkout master
```

**Caution:** Force pushing rewrites history; document reasons

---

## Post-Deployment Monitoring

### Day 1-3: Active Monitoring

- [ ] Check GitHub Issues for user reports
- [ ] Monitor browser console for JS errors (use error tracking if available)
- [ ] Review localStorage patterns in DevTools
- [ ] Test with different village JSON exports
- [ ] Validate on mobile devices

### Week 1: Daily Checks

- [ ] Review new GitHub Issues (respond within 24h)
- [ ] Test edge cases reported by users
- [ ] Monitor performance metrics if available
- [ ] Update smoke test checklist with new scenarios

### Week 2+: Weekly Checks

- [ ] Review open issues and prioritize fixes
- [ ] Plan hotfix releases for high-severity bugs
- [ ] Document lessons learned for next release
- [ ] Update roadmap based on user feedback

---

## Hotfix Deployment Process

For urgent fixes after release:

1. **Create Hotfix Branch**
   ```bash
   git checkout -b hotfix/v0.2.1 v0.2.0
   ```

2. **Implement Fix**
   - Make minimal targeted changes
   - Add regression test for specific bug
   - Verify fix locally

3. **Test Hotfix**
   ```bash
   npm test -- --watchAll=false
   npm run build
   ```

4. **Merge and Tag**
   ```bash
   git checkout master
   git merge hotfix/v0.2.1
   git tag -a v0.2.1 -m "Hotfix: [brief description]"
   git push origin master --tags
   ```

5. **Deploy Hotfix**
   ```bash
   npm run deploy
   ```

6. **Validate**
   - Run focused smoke tests on affected area
   - Verify fix resolves reported issue
   - Confirm no new regressions introduced

---

## Deployment Checklist Summary

Use this quick checklist for each deployment:

### Pre-Deploy
- [ ] Tests passing
- [ ] Build succeeds
- [ ] Release notes updated
- [ ] Git tag created
- [ ] Working directory clean

### Deploy
- [ ] `npm run deploy` executed
- [ ] GitHub Pages shows "published"
- [ ] Production URL loads

### Validate
- [ ] Full smoke test passed (15/15)
- [ ] Regression tests passed (2/2)
- [ ] Browser compatibility confirmed
- [ ] No critical console errors
- [ ] Deployment tag created

### Monitor
- [ ] Day 1-3: Active issue monitoring
- [ ] Week 1: Daily checks
- [ ] Week 2+: Weekly reviews

---

## Common Issues and Solutions

### Issue: `npm run deploy` fails with authentication error

**Solution:**
```bash
# Set up GitHub personal access token
# 1. GitHub → Settings → Developer settings → Personal access tokens
# 2. Generate new token with 'repo' scope
# 3. Use token as password when prompted

# Or configure Git credentials helper
git config --global credential.helper store
```

### Issue: GitHub Pages shows 404 after deployment

**Possible Causes:**
- `homepage` field in package.json incorrect
- Assets referenced with wrong base path
- Build artifacts not properly pushed

**Solution:**
```bash
# Verify homepage in package.json
cat package.json | grep homepage

# Should be: "homepage": "https://sambro2901.github.io/coc-upgrade-optimizer/"

# Check gh-pages branch exists and has contents
git checkout gh-pages
ls -la
git checkout master
```

### Issue: Old version still showing after deployment

**Cause:** Browser caching or CDN propagation delay

**Solution:**
- Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
- Try incognito/private browsing window
- Wait 5 minutes for GitHub CDN propagation
- Check deployment timestamp in GitHub Pages settings

### Issue: Build succeeds locally but fails in deployment

**Possible Causes:**
- Environment-specific dependencies
- Memory limits on CI/CD (not applicable for local deploy)
- Node/npm version mismatch

**Solution:**
```bash
# Verify Node version matches requirements
node --version  # Should be 16+
npm --version   # Should be 8+

# Clean and rebuild
rm -rf node_modules build
npm install
npm run build
npm run deploy
```

---

## Deployment History Template

Maintain deployment log in repository (e.g., `docs/DEPLOYMENT_HISTORY.md`):

```markdown
## v0.2.0 - 2026-03-01

**Deployed By:** [Your Name]  
**Commit:** abc123def  
**Build Time:** 14:30 UTC  
**Deployment Time:** 14:35 UTC  
**Validation:** Passed (22/22 smoke tests)

**Changes:**
- Versioned persistence layer
- Scheduler performance optimization
- Timeline incremental updates
- Test coverage expansion

**Issues:** None

**Rollback:** Not required
```

---

## Security Considerations

- [ ] No sensitive data (API keys, credentials) in source code
- [ ] All external dependencies from trusted sources
- [ ] `package-lock.json` committed to lock dependency versions
- [ ] Regular `npm audit` checks for vulnerabilities
- [ ] HTTPS enforced by GitHub Pages (default)

---

## Performance Validation

After deployment, validate performance metrics:

- [ ] Lighthouse score (Performance, Accessibility, Best Practices, SEO)
- [ ] First Contentful Paint <2s
- [ ] Time to Interactive <3s
- [ ] Bundle size <300KB gzipped
- [ ] Scheduler runtime <1s for typical villages (50-100 tasks)

**Run Lighthouse:**
1. Open DevTools in Chrome
2. Go to Lighthouse tab
3. Select "Performance" category
4. Click "Analyze page load"
5. Review scores and recommendations

---

## Accessibility Validation

- [ ] All interactive elements keyboard accessible
- [ ] Form inputs have labels
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader compatible
- [ ] No auto-playing content

---

## Final Checklist

Before considering deployment complete:

- [ ] Production URL loads without errors
- [ ] Full smoke test suite passed
- [ ] No critical console errors
- [ ] Performance acceptable
- [ ] Mobile responsiveness validated
- [ ] Deployment tag created
- [ ] Deployment history updated
- [ ] Team/users notified of release
- [ ] Monitoring schedule established

**Sign-off:** [Your Name] - [Date]

---

## Support and Escalation

For deployment issues:

1. Check this guide for common solutions
2. Review GitHub Issues for similar problems
3. Check GitHub Pages status: https://www.githubstatus.com/
4. Review build logs for specific errors
5. Reach out to repository maintainers if unresolved

**Emergency Contact:** [Maintainer GitHub handle]

---

## Continuous Improvement

After each deployment:

- [ ] Update this guide with new learnings
- [ ] Add new edge cases to smoke test checklist
- [ ] Review and optimize deployment process
- [ ] Document any manual steps that could be automated
- [ ] Gather feedback from users and incorporate into next release
