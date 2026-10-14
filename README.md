## Export Software Frontend

Built on top of [fe-zen-arch](https://github.com/shivamkj/fe-zen-arch.git) — the core shared architecture for B2B SaaS frontends.

### Libraries

- **React 19** [Docs](https://react.dev/reference/react)
- **Tailwind CSS** [Docs](https://tailwindcss.com/docs/installation)
- **React Query** [Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- **React Hook Form** [Docs](https://www.react-hook-form.com/get-started)
- **Zustand** [Docs](https://zustand.docs.pmnd.rs/)

### Setup & Commands

```bash
git submodule update --init --recursive  # init fe-zen-arch submodule
pnpm install                            # install dependencies
pnpm dev                                # dev server on port 5173
pnpm exec tsc --noEmit                  # TypeScript strict type checking
pnpm build                              # production bundle build
```

---

## Refactoring & Architectural Improvements

The Shipping Bill creation application has been refactored according to the assignment requirements to improve maintainability, separation of concerns, and mock service boundaries:

### 1. Decomposed Monolith into Focused Components
- **Before:** `shipping-bill-form.tsx` was a single **1,762-line file** that combined form state, UI styling, nested invoice tables, inline async search, and API sync.
- **After:** The form is now decomposed into focused, single-responsibility sub-components:
  - `src/shipping-bills/schema/bill.schema.ts`: Zen-arch form validation schema and field rules.
  - `src/shipping-bills/components/common/async-combobox.tsx`: Reusable async searchable dropdown with debounce, loading, empty states, and cached initial label resolution.
  - `src/shipping-bills/components/common/party-picker.tsx`: Exporter/Consignee/Buyer party and branch selection with "+ Add new" and "+ Add branch".
  - `src/shipping-bills/components/tabs/shipment-basics-tab.tsx`: Tab 1 managing parties, route, cargo package details, and regulatory exceptions.
  - `src/shipping-bills/components/tabs/invoices-tab.tsx`: Tab 2 managing multiple invoices and items.
  - `src/shipping-bills/components/invoices/invoice-editor.tsx`: Invoice charges (freight, insurance, commission, discount, packing) and terms.
  - `src/shipping-bills/components/invoices/goods-item-editor.tsx`: Goods line item with HS/RITC codes, scheme codes (drawback/RoDTEP/RoSCTL conditionals), PMV, IGST, and AR4 details.
  - `src/shipping-bills/components/tabs/documents-tab.tsx`: Tab 3 managing container details, packing list carton ranges, e-Sanchit documents, and scheme licences.
  - `src/shipping-bills/shipping-bill-form.tsx`: Reduced to a lean ~180-line orchestrator handling form submit, tab error navigation, and quick-add modals.

### 2. API-Ready Asynchronous Mock Service Layer
- **Before:** Components directly imported hardcoded data arrays (`@/data/e-sanchit-codes`, `@/data/quantity-code`, `@/data/scheme-codes`, `@/data/states`, `@/data/types`, `@/data/trade-agrements`), violating service layer isolation.
- **After:** Pure async Promise-based services in `src/services/` with simulated latency, search query filtering, and graceful fallback:
  - `masterDataService`: Asynchronous lookups for ports (Indian loading ports vs destination ports), incentive schemes, units of measurement, states, and document codes.
  - `partyService`: Asynchronous search and lookup for Exporters, Consignees, and Buyers, with branch search and quick-creation.
  - `shippingBillService`: Unified CRUD, local storage persistence, and ICEGATE flat file (.sb) export. Real HTTP endpoints can replace this mock layer with zero UI changes.

### 3. Strict Zero New Dependencies Compliance
- The refactored solution respects the rule: **"Adding new dependencies are not allowed"**.
- Built strictly with existing dependencies (`react`, `react-hook-form`, `core`, `ui`, `icons`).

---

## AI Usage & Approach

As required by the assignment guidelines:

1. **Tools Used:**
   - Antigravity AI agentic coding assistant for code analysis, repository inspection, architecture design, and incremental refactoring.

2. **How AI Was Used:**
   - **Repository Analysis:** Audited the starter repository to identify TypeScript compile errors, circular dependencies, duplicated code, and direct array imports in UI components.
   - **Service Layer Design:** Modeled the asynchronous service interfaces (`masterDataService`, `partyService`, `shippingBillService`) to fulfill the requirement of keeping mock data out of UI components.
   - **Component Decomposition:** Extracted nested subsections (goods editor, containers, packing ranges, supporting documents) into modular files.

3. **Engineering Judgment & Validation:**
   - **Submodule HTTPS Correction:** Identified and resolved the SSH submodule URL failure (`git@github.com:...` to `https://github.com/...`) to ensure automated CI and cross-platform compatibility.
   - **TypeScript Strict Compliance:** Diagnosed and resolved existing typing errors in the starter code (`SubmitButton` unused, `clsx` parameter counts, generic `InputError` path typing, and unused variables).
   - **Preserved Domain Logic:** Verified that ICEGATE-specific rules (e.g. Drawback inputs showing only when scheme permits, auto-calculation of line item totals and invoice totals, and port country derivation) remained 100% functional.
   - **Validation:** Validated both strict TypeScript type checking (`tsc --noEmit`) and production Vite build bundle (`vite build`), ensuring zero warnings or build failures.
