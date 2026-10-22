# CLAUDE.md

## Project Overview

Personal design portfolio for Gabriel Wong, hosted at gabrielwong.co via GitHub Pages. Static site built with vanilla HTML, CSS, and JavaScript.

## Structure

- `/index.html` — Homepage: bio and a list of projects, each with a line-drawn figure plate
- `/about/` — About page
- `/css/site.css` — New stylesheet (notebook-index redesign) used by the homepage, About and short case studies
- `/css/styles.css` — Old stylesheet, still used by the full case study pages until they are restyled; project-specific styles in `*-utils.css` files
- `/js/` — Scripts: carousel, case study navigation, experiments physics, hapticsense UI
- `/assets/images/` — Project images organized by project folder

### Case Study Pages

Each project lives in its own directory with an `index.html`:

- `/tai/` — TAI project
- `/hapticsense/` — HapticSense short case study; `/hapticsense/full/` is the full version
- `/hapticsense_ui/` — HapticSense UI project
- `/the_future_of_data_storage/` — DNA data storage project
- `/macos_timeline/` — macOS Timeline project
- `/experiments/` — Experiments page

## Tech Stack

- Vanilla HTML/CSS/JS (no framework or build step)
- Fonts: Hanken Grotesk, Source Serif 4, IBM Plex Mono (new pages); Playfair Display, Space Grotesk (old pages)
- Hosting: GitHub Pages with custom domain (gabrielwong.co)

## Conventions

- CSS uses absolute paths from root (e.g., `/css/styles.css`)
- Each case study has its own `-utils.css` file for project-specific styles
- Images stored under `/assets/images/<project-name>/`
