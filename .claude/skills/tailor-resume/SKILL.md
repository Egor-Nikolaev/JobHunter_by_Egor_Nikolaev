---
name: tailor-resume
description: Tailor a resume and cover letter to one specific job description using the user's MASTER_RESUME and skills-bank, then compile a PDF via resume/tailor.js. Trigger when the user pastes a job description or vacancy link and asks to "tailor my resume", "make a CV for this job", "write a cover letter for this", or "apply to this".
---

# Tailor a resume + cover to one vacancy

Goal: from a single job description (JD), produce a targeted resume PDF and a
short cover letter, grounded ONLY in the user's real MASTER_RESUME. Never add a
skill or claim the user does not actually have.

## Inputs you need
- The JD text (paste) or a link the user gives you. If a link, ask them to paste
  the text if you cannot read it.
- `profile/MASTER_RESUME.md` (their real one). If only the example exists, run
  the `onboard` skill first.
- `config/skills-bank.json` (their real bank; falls back to the example).

## Steps
1. **Pick a slug** — short, filename-safe, e.g. `acme-pm`. This slug is the key
   that ties the output folder, the resume file, and any tracking together.
   Keep it consistent: **the filename is the application's identity.**
2. **Save the JD** to a temp file, e.g. `examples/<slug>_jd.txt` (or reuse a path
   the user gives). It is just text.
3. **Choose language + headline**: `en` or `ru`, and a headline drawn from the
   user's summary that matches the JD's title (e.g. "Product Manager (AI)").
4. **Run the tailor script:**
   ```bash
   node resume/tailor.js <slug> <en|ru> <path/to/jd.txt> "<headline>"
   ```
   It runs the ATS match, injects the matched skills row + headline into the
   template, and compiles `output/<slug>/cv.pdf` (needs tectonic).
5. **Review the ATS output** it prints (coverage %, matched skills). If coverage
   is low, that usually means the user's skills-bank is missing synonyms the JD
   uses — suggest additions, but only for skills they truly have.
6. **Write the cover letter** yourself (Claude), 4–8 sentences, in the user's
   voice, mapping 2–3 of their real, defensible achievements to the JD's needs.
   Save it to `output/<slug>/cover.md`. No invented metrics.
7. **Show the user** the PDF path, the cover, and the ATS coverage. Let them edit
   before anything is sent.

## Guardrails
- The resume body comes from MASTER_RESUME; the matcher only reorders/surfaces
  skills that are BOTH in the bank AND in the JD. If the JD wants something the
  user lacks, say so plainly rather than fabricating it.
- Do not send anything here. Applying is a separate, explicit step via the
  `engine/channels/*` scripts, which are dry-run by default.
