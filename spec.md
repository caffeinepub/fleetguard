# FleetGuard

## Current State
The sign-up flow on LoginPage immediately triggers Internet Identity (II) login when the user clicks "Sign Up — New Company". After II auth, the OnboardingPage collects company info (name, industry, fleet size, phone) in step 2, then profile name in step 3, then payment in step 4.

## Requested Changes (Diff)

### Add
- Pre-login sign-up form on LoginPage (shown when user clicks "Sign Up — New Company") that collects:
  - Company Name (required)
  - Industry (dropdown, required)
  - Number of Vehicles (fleet size selector, required)
  - Phone Number (optional)
  - Email (optional)
- "Continue with Internet Identity" button on pre-login form triggers II login after saving all fields to sessionStorage
- "Back to Sign in" link to dismiss the pre-login form

### Modify
- `LoginPage.tsx`: instead of immediately calling `login()` on sign-up click, show inline pre-login form. On form submit, save fields to sessionStorage keys (`fleetguard_presignup_company`, `fleetguard_presignup_industry`, `fleetguard_presignup_fleetsize`, `fleetguard_presignup_phone`, `fleetguard_presignup_email`), set `fleetguard_signup_intent=1` in sessionStorage, then call `login()`.
- `OnboardingPage.tsx`: on mount read and clear the 5 presignup sessionStorage keys. Pre-populate `companyName`, `industry`, `fleetSize`, `phone` states from them. Since company info is already collected, the onboarding welcome step (step 1) should display the company name as a confirmation. The Company Info step (step 2) should be skipped — the welcome step "Get Started" button saves company settings to the backend (using the pre-populated values) and advances directly to step 3 (Your Profile). Update TOTAL_STEPS to 3. Save the email from presignup into the profile save call if the `saveProfile` mutation supports it, otherwise just discard it gracefully.

### Remove
- The standalone Company Information step (step 2) from OnboardingPage — that data is now collected before login.

## Implementation Plan
1. Modify `LoginPage.tsx`:
   - Add `showSignUpForm` boolean state
   - Add `signUpCompany`, `signUpIndustry`, `signUpFleetSize`, `signUpPhone`, `signUpEmail` states
   - "Sign Up — New Company" button sets `showSignUpForm = true` (does NOT call login)
   - Sign-up form UI: company name input, industry select, fleet size grid, phone input, email input
   - Form submit handler: validate required fields, save all to sessionStorage, set `fleetguard_signup_intent=1`, call `login()`
   - Back button resets form and sets `showSignUpForm = false`
2. Modify `OnboardingPage.tsx`:
   - Initialize state from sessionStorage presignup keys (and clear them in a useEffect)
   - Remove step 2 (Company Info form)
   - Step 1 (Welcome): show company name in heading, show company/industry/fleet summary. "Get Started" button calls `handleCompanyNext()` which saves company settings to backend and advances to step 2 (Profile)
   - Step 2 (Profile): name input (unchanged)
   - Step 3 (Payment): unchanged
   - Step 4: All set
   - Update `TOTAL_STEPS = 3` and `StepDots` accordingly
