# CLAUDE.md

## Project Overview

Personal design portfolio for Gabriel Wong, hosted at gabrielwong.co via GitHub Pages. Static site built with vanilla HTML, CSS, and JavaScript.

## Structure

- `/index.html` — Homepage: bio and a list of projects, each with a line-drawn figure plate
- `/about/` — About page
- `/css/site.css` — New stylesheet (notebook-index redesign) used by the homepage, About and short case studies
- `/css/styles.css` — Old stylesheet, still used by the full case study pages until they are restyled; project-specific styles in `*-utils.css` files
- `/js/` — Scripts used by the full case studies: back-to-top control, HapticSense UI prototype
- `/assets/images/` — Project images organized by project folder

### Case Study Pages

Each project lives in its own directory with an `index.html`:

Each project has a short case study at `/<project>/` (abstract, facts, question, process, outcome; uses `/css/site.css`) and the full write-up at `/<project>/full/` (old styles).

- `/macos_timeline/` — macOS Timeline (Fig. 01)
- `/hapticsense/` — HapticSense (Fig. 02); `/hapticsense_ui/` holds its UI prototype styles
- `/the_future_of_data_storage/` — DNA data storage (Fig. 03)
- `/tai/` — Tuskegee Airmen Inc. (Fig. 04)
- `/experiments/` — Experiments grid

## Tech Stack

- Vanilla HTML/CSS/JS (no framework or build step)
- Fonts: Hanken Grotesk, Source Serif 4, IBM Plex Mono (new pages); Playfair Display, Space Grotesk (old pages)
- Hosting: GitHub Pages with custom domain (gabrielwong.co)

## Conventions

- CSS uses absolute paths from root (e.g., `/css/styles.css`)
- Each case study has its own `-utils.css` file for project-specific styles
- Images stored under `/assets/images/<project-name>/`
