# Alpha Profiles — Black Minimal

A clean black profile directory inspired by the reference image. It has no login, account creation, notification labels, or large hero section. The top bar contains only the site name and a small search icon.

## Files
- `index.html` — page structure
- `style.css` — responsive black design for mobile, tablet, and desktop
- `script.js` — loads profiles and handles search
- `Profiles.txt` — profile data to edit

## Add a profile
Add a record to `Profiles.txt` using this exact format:

```text
$
Profile Name
https://example.com/photo.jpg
https://example.com/profile
$
```

The three lines are the profile name, direct photo URL, and profile destination URL. Keep `$` on a line by itself between records. Do not write `Pn`, `Pp`, or `Ur` in the file.

## Publish
Upload all five files into the same folder in your GitHub Pages repository and publish that folder using **Settings → Pages**. Test the published website rather than opening `index.html` with `file://`, because browsers generally block loading `Profiles.txt` that way.

The example profiles and photo URLs in `Profiles.txt` are placeholders. Replace them with your actual names, public photo URLs, and destination URLs. The layout is responsive, but no site can guarantee zero lag or perfect rendering on every device and arbitrarily large data set.
