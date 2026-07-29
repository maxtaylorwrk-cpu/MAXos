# copilot-instructions.md

This repository contains backup and restore tooling for Max OS. Key points for automated agents and maintainers:

- Do not print or commit secrets.
- CI must use only synthetic fixtures and ephemeral databases; never use production credentials.
- Restore scripts refuse production-like targets by default and require explicit interactive confirmation to proceed.
- When updating backup logic, add or update tests and CI validation.
