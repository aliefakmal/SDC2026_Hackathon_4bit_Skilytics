# Demo CV fixtures

These three fictional CVs are test fixtures for the onboarding CV reader. They cover a scanned PDF, a JPEG image, and a text PDF. The onboarding buttons serve identical copies from `src/artifacts/reskill-ai/public/demo/` at `/demo/demo-cv-1.pdf`, `/demo/demo-cv-2.jpeg`, and `/demo/demo-cv-3.pdf`.

When replacing a fixture, update its matching public copy as well. Keep real personal CVs out of this folder.


Demo buttons now apply the reviewed fictional data in `profiles.json` through `/api/profiles/:id/demo-cv`. They do not upload the sample, run OCR or call an LLM. Real uploads still use the CV reader. Update the matching data and SHA-256 when replacing a fixture. Contact details are intentionally omitted from the prefilled profile data.
