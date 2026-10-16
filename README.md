# Alpha Profiles — Responsive Black Edition

This version removes the visible “Alpha Profiles” heading. The top bar contains only a small search icon. The page uses a black background and responsive profile cards with circular photos, names, URLs, and right-side arrows.

## Add or update profiles
Edit only `Profiles.txt`. Use this format for each entry:

```text
$
Profile Name
https://example.com/photo.jpg
https://example.com/profile
$
```

The lines are the profile name, direct photo URL, and profile URL. Keep `$` on a line by itself between records. Do not write Pn, Pp, or Ur.

## Publish
Upload all five files to the same folder in your GitHub Pages repository and publish it through Settings → Pages. Test the published website rather than opening index.html directly as a file.

The supplied profiles and image links are examples; replace them with your own. The responsive layout adapts card dimensions and text to screen width, but browser/device rendering can still vary.
