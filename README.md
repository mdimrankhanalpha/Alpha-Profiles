# Alpha Profiles

A lightweight, responsive profile directory designed for GitHub Pages and mobile devices.

## Files

- `index.html` — page structure
- `style.css` — responsive cyber-luxury design
- `script.js` — loads, parses, searches, and displays profiles
- `Profiles.txt` — the only file you need to edit when adding or updating profiles

## Add a profile

Open `Profiles.txt`. Each profile uses this format:

```text
$
Profile Name
https://example.com/profile-photo.jpg
https://example.com/profile
$
```

The three lines after a `$` separator mean:

1. Profile name
2. Direct photo URL
3. Profile URL

Put a `$` separator between records. Keep each profile's name, photo URL, and profile URL on separate lines. Do not put `$` inside a profile's name or URL.

Example with two records:

```text
$
Alpha
https://example.com/alpha.jpg
https://github.com/mdimrankhanalpha
$
Another Profile
https://example.com/another.jpg
https://example.com/another-profile
$
```

You can add as many records as your hosting, text file size, and device resources reasonably support. The number of profiles is not hard-coded. Very large lists still require more memory and rendering time; no browser-based site can promise literally unlimited data or zero lag at every scale.

## Publish with GitHub Pages

1. Upload all five files to the same repository folder.
2. In the repository, open **Settings → Pages**.
3. Select the branch and folder containing the files, then save.
4. Open the published website. The profile list loads from `Profiles.txt`.

Because browsers generally block `fetch()` from local `file://` pages, test through GitHub Pages or a local web server rather than opening `index.html` directly.

## Notes

- Search matches profile names and profile URLs.
- Profile photos load lazily, and missing/broken photos show initials instead.
- Only HTTP and HTTPS links are accepted for photos and profile destinations.
- The text file is fetched without browser caching, but a hosting CDN may briefly serve an older copy after edits.
