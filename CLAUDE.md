# CLAUDE.md

## Project Overview

Personal design portfolio for Gabriel Wong, hosted at gabrielwong.co via GitHub Pages. Static site built with vanilla HTML, CSS, and JavaScript.

## Structure

- `/index.html` — Homepage with carousel of projects
- `/css/styles.css` — Main stylesheet; project-specific styles in `*-utils.css` files
- `/js/` — Scripts: carousel, case study navigation, experiments physics, hapticsense UI
- `/assets/images/` — Project images organized by project folder

### Case Study Pages

Each project lives in its own directory with an `index.html`:

- `/tai/` — TAI project
- `/hapticsense/` — HapticSense project
- `/hapticsense_ui/` — HapticSense UI project
- `/the_future_of_data_storage/` — DNA data storage project
- `/macos_timeline/` — macOS Timeline project
- `/experiments/` — Experiments page

## Tech Stack

- Vanilla HTML/CSS/JS (no framework or build step)
- Fonts: Playfair Display, Space Grotesk (Google Fonts)
- Hosting: GitHub Pages with custom domain (gabrielwong.co)

## Conventions

- CSS uses absolute paths from root (e.g., `/css/styles.css`)
- Each case study has its own `-utils.css` file for project-specific styles
- Images stored under `/assets/images/<project-name>/`
