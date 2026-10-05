# End-to-end tests

These tests use Falcon SSO in a headed Chromium browser; they do not require a Falcon username, password, or TOTP secret.

1. Copy `.env.sample` to `.env` and set `FALCON_BASE_URL` and `APP_NAME` if the defaults do not match your tenant.
2. Run `npm run test:auth` and complete the SSO flow in the opened browser. Resume the Playwright pause after login to save the authenticated session locally.
3. Run `npm test`. A valid saved session is reused. If it expires, the setup project opens the SSO browser again.

The saved browser state is kept in `playwright/.auth/user.json`. Keep it private; Git ignores the auth-state directory, and Foundry packaging excludes both that state file and `.env`. The suite targets an already-installed app and does not install, uninstall, or sync registry credentials.