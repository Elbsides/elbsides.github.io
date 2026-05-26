// Shared sponsor-slide logic for the Elbsides infoscreen decks
// (intermission, introduction, closing). Edit here once.
//
// Usage:
//     <link rel="stylesheet" href="sponsors.css">
//     <script src="sponsors.js"></script>
//     <script>
//         populateSponsors(2026, [
//             ['platinum-sponsors', 'platinum',  'Platinum Sponsor'],
//             ['gold-sponsors',     'gold',      'Gold Sponsors'],
//             // ...
//         ]);
//     </script>
//
// Sponsor includes live at github.com/Elbsides/www and mix root-relative
// `/assets/...` paths with absolute `https://elbsides.eu/assets/...` URLs.
// rewriteAssetSrc() rewrites both forms to raw.githubusercontent.com so
// every logo loads from the canonical repo regardless of host.

(function (global) {
    const ASSET_REPO_BASE = 'https://raw.githubusercontent.com/Elbsides/www/refs/heads/main';

    function rewriteAssetSrc(src) {
        if (!src) return src;
        if (src.startsWith('/assets/')) return ASSET_REPO_BASE + src;
        const m = src.match(/^https?:\/\/(?:www\.)?elbsides\.eu(\/assets\/.*)$/i);
        if (m) return ASSET_REPO_BASE + m[1];
        return src;
    }

    function sponsorIncludeUrl(year, tier) {
        return `${ASSET_REPO_BASE}/${year}/includes/${tier}.html`;
    }

    function fillSponsorImages(tag, url, title) {
        const container = document.getElementById(tag);
        if (!container) return;
        fetch(url)
            .then(response => response.text())
            .then(html => {
                const titleEl = document.createElement('h2');
                titleEl.textContent = title;
                container.appendChild(titleEl);

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const imgs = doc.querySelectorAll('img');
                if (!imgs.length) return;

                // Cap the per-row count so a small set (1–4 logos) doesn't
                // stretch into a single huge box. Beyond that, auto-fit in
                // the CSS handles wrapping onto further rows.
                const grid = document.createElement('div');
                grid.className = 'sponsor-grid';
                if (imgs.length <= 4) {
                    grid.style.gridTemplateColumns = `repeat(${imgs.length}, minmax(180px, 1fr))`;
                }
                container.appendChild(grid);

                imgs.forEach(img => {
                    img.removeAttribute('id');
                    img.removeAttribute('class');
                    img.removeAttribute('width');
                    img.removeAttribute('height');
                    img.src = rewriteAssetSrc(img.getAttribute('src'));
                    const box = document.createElement('div');
                    box.className = 'sponsor-box';
                    box.appendChild(img);
                    grid.appendChild(box);
                });
            })
            .catch(error => console.error('Error loading sponsor images:', error));
    }

    function populateSponsors(year, tiers) {
        tiers.forEach(([tag, tier, title]) =>
            fillSponsorImages(tag, sponsorIncludeUrl(year, tier), title));
    }

    global.rewriteAssetSrc = rewriteAssetSrc;
    global.sponsorIncludeUrl = sponsorIncludeUrl;
    global.fillSponsorImages = fillSponsorImages;
    global.populateSponsors = populateSponsors;
})(window);
