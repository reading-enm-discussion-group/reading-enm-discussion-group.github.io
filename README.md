# reading-enm-discussion-group.github.io

## Editing the site's content

This site's text lives entirely in the `_sections/` folder, as one Markdown file per section. To change what's on the page:

1. On GitHub, open the file for the section you want to change (e.g. `_sections/01-welcome.md`).
2. Click the pencil icon (top right) to edit it.
3. Edit the text below the `---` front matter block. You can use standard Markdown which is [documented here](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax).
4. Do not change the `nav_id` or other values unless you know what they do:
   - Filename number prefix must be unique — it's used to order the sections.
   - `nav_id` must be unique — it's used as the section's anchor link.
5. Scroll down and commit your change directly to the main branch.

GitHub Pages rebuilds the site automatically after your commit — the update is usually live within a minute.
