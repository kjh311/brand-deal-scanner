# Project Specification: Brand Deal Auditor

## Overview
A privacy-focused web application designed to help influencers and creators audit brand contracts, identify red flags, and generate professional counter-offers.

## Technical Stack
- **Frontend:** React/Next.js, hosted on Vercel.
- **Styling/UI:** Dark-mode, Cupertino-style aesthetics, GSAP for animations.
- **Backend/Database:** Supabase (PostgreSQL).
- **Business Logic:** Supabase Edge Functions (TypeScript).
- **Authentication:** Supabase Auth (Google/Apple).
- **AI/Dev Framework:** Antigravity.
- **Integrations:** Stripe (Payments), n8n (Notifications/Workflows), GitHub Actions (CI/CD).

## MVP: Core Features & Functionality

### 1. Brand Deal Scan
- **Input Handling:** PDF, Word (docx), image (OCR), and raw text copy-paste.
- **Analysis:** Identify legal jargon, obligations, and high-risk clauses.
- **Translation:** Plain-English summaries of complex legalese.
- **Risk Highlighting:** Identify and explain "gotchas" and predatory terms.
- **Counter-Offers:** AI-generated email templates with "Style Switchers" (Firm, Friendly, Casual).
- **Strategy:** Automated "Next Steps" list for usage rights and renegotiation.
- **Disclaimer:** Mandatory UI overlay/checkbox for legal non-advice.

### 2. Stripe Payments & Monetization
- **Credit Tiers:** 
    - Starter ($19/mo): 5 credits.
    - Pro ($49/mo): 20 credits.
    - Power ($79/mo): 100 credits.
- **One-Off Purchase:** 1 scan for $10.
- **Subscriber Perks:** $10 "Top-up" for 5 additional scans.
- **Freemium Hook:** 1 free scan; email response remains blurred until conversion.
- **Promotion Engine:** Coupon code support and admin-tool for manual credit grants.

### 3. Data Management (Supabase)
- **Privacy-First:** Raw contract files are NEVER stored. Only AI-generated summaries persist.
- **History:** Searchable history of past audits.
- **Negotiation Tracking:** Link multiple versions into a single project thread (Version History).
- **Account:** Track credit balances and auto-rollover logic.

### 4. AI Engine & Privacy
- **Data Sovereignty:** API calls must explicitly opt out of model training.
- **Prompting:** Pre-loaded library of common influencer industry red flags.

### 5. UI/UX Enhancements
- **Deal Health Score:** 0–100 risk assessment score.
- **Red Flag Library:** Browsable database of common traps (e.g., "Morality Clauses").
- **PDF Export:** Branded "Contract Audit Report" for users.
- **Nudge System:** Automated email reminders for un-finalized audits via n8n.

## Non-Functional Requirements (Privacy & Security)
- **Privacy-First Architecture:** Raw document text must be processed in-memory within the Edge Function. No persistence of source documents.
- **RLS Enforcement:** PostgreSQL Row Level Security (RLS) is mandatory to ensure users only access their own data.
- **Stripe Webhooks:** Securely route billing events to Edge Functions for real-time credit updates.

## Suggested Database Schema Outline
- `profiles`: user_id, auth_metadata, credit_balance, subscription_tier.
- `audit_projects`: project_id, user_id, project_name, created_at.
- `audit_history`: audit_id, project_id, user_id, risk_score, raw_summary, counter_offer_json, created_at.

## ICEBOX: Future Roadmap
- **Affiliate Program:** Referral system.
- **Renewal/Action Calendar:** Advanced notification system for contract milestones.
- **Agency Dashboard:** Multi-seat management for agencies.