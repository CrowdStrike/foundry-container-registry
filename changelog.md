# 📦 Multi-Cloud Image Support

This summary covers changes from baseline commit
`7458a121dd398532d515d136bc35bd68f32cae2d` on the
`multi-cloud-image-support` branch.

## 🔄 Registry Synchronization

- Adds multi-cloud and regional repositories for four container image families.
- Identifies cloud-specific repositories as regional variants.
- Retains valid older tags and sorts sensor tags by semantic version.
- Filters invalid sensor tags and includes optional image build dates.
- Uses an available registry variant when its counterpart is unavailable.
- Preserves the existing collection if a required source has no usable results.
- Uses `Request.FnID` to gate writes to the Foundry collection.
- Omits registry credentials from image records and checks collection API errors.

## 🖥️ Registry UI

- Groups variants under one normalized product name and sorts names
  alphabetically without regard to case.
- Filters dated builds older than 18 calendar months and retains undated tags.
- Recalculates the latest tag and digest after filtering.
- Shows “No recent images” when no products have recent builds.
- Shows details and tag tables for each available registry variant.
- Places paths beside latest tags for paired variants and beside the description
  for single-variant products.
- Adds responsive details and optional build-date display.
- Updates PatternFly, React, TypeScript, Webpack, and related dependencies.

## ⏰ Automation and App Configuration

- Adds an automatically provisioned daily sync workflow at 07:38 UTC.
- Skips overlapping scheduled runs and retains manual synchronization.

## 📚 Documentation

- Documents regional availability, tag handling, and fallback behavior.
- Explains when to manually sync after a function update.

**Files:** `README.md`

## 🧪 Tests and Dependencies

- Adds Go tests for source selection, request detection, tag handling, and writes.
- Adds UI grouping/filtering tests and authenticated Playwright E2E setup.
- Updates the Foundry Go SDK and the UI dependency toolchain.
