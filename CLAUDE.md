# CLAUDE.md

## Project Overview

Personal design portfolio for Gabriel Wong, hosted at gabrielwong.co via GitHub Pages. Static site built with vanilla HTML, CSS, and JavaScript.

## Structure

- `/index.html` — Homepage: bio and a two-column grid of projects, each with a real project image
- `/about/` — About page
- `/css/site.css` — New stylesheet (notebook-index redesign) used by the homepage, About and short case studies
- `/css/full.css` — Extra styles for the full case study pages (`/<project>/full/`), loaded after site.css and the project's `*-utils.css` (charts, specimens, prototype)
- `/css/flipbook.css` + `/js/flipbook.js` — Page-turning magazine reader on the Data Storage short case study; pages are pre-rendered WebPs in `/assets/images/dna/mag/`
- `/js/` — Scripts used by the full case studies: back-to-top control, HapticSense UI prototype
- `/assets/images/` — Project images organized by project folder

### Case Study Pages

Each project lives in its own directory with an `index.html`:

Each project has a short case study at `/<project>/` (overview, facts, question, process, outcome; uses `/css/site.css`) and the full write-up at `/<project>/full/` (site.css + full.css + the project's utils).

- `/macos_timeline/` — macOS Timeline (01)
- `/hapticsense/` — HapticSense (02); `/hapticsense_ui/` holds its UI prototype styles
- `/the_future_of_data_storage/` — DNA data storage (03)
- `/tai/` — Tuskegee Airmen Inc. (04)
- `/experiments/` — Experiments grid

## Tech Stack

- Vanilla HTML/CSS/JS (no framework or build step)
- Fonts: Archivo (headlines, labels, UI; wide uppercase for titles and section heads via `font-stretch`) and Newsreader (body text). `--sans` is Archivo, `--serif` is Newsreader; small interface text uses the `.ui` class. The TAI full page also loads Chakra Petch and Poppins for its type specimen
- Hosting: GitHub Pages with custom domain (gabrielwong.co)

## Conventions

- CSS uses absolute paths from root (e.g., `/css/site.css`)
- Each case study has its own `-utils.css` file for project-specific styles
- Images stored under `/assets/images/<project-name>/`
