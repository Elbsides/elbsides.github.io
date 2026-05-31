// Shared sponsor-slide logic for the Elbsides infoscreen decks
// (intermission, introduction, closing). Edit here once.
//
// Usage (in each deck, BEFORE Reveal.initialize so the inserted
// sections are present when reveal indexes the slide list):
//
//     <link rel="stylesheet" href="sponsors.css">
//     <div class="reveal"><div class="slides">
//         ... other slides ...
//         <div id="sponsor-slides"></div>     <!-- placeholder -->
//         ... other slides ...
//     </div></div>
//     <script src="sponsors.js"></script>
//     <script>
//         setupSponsors('#sponsor-slides', 2026, SPONSOR_TIERS);
//     </script>
//     <script> Reveal.initialize({...}); </script>
//
// `setupSponsors` replaces the placeholder with one <section> per tier
// (uniform attributes across decks) and then kicks off the async fetch
// that fills each section with logos from the Elbsides/www repo. Pass
// `[...SPONSOR_TIERS].reverse()` for a build-up ordering (closing deck).
//
// Sponsor includes live at github.com/Elbsides/www and mix root-relative
// `/assets/...` paths with absolute `https://elbsides.eu/assets/...` URLs.
// rewriteAssetSrc() rewrites both forms to raw.githubusercontent.com so
// every logo loads from the canonical repo regardless of host.

(function (global) {
    const ASSET_REPO_BASE = 'https://raw.githubusercontent.com/Elbsides/www/refs/heads/main';

    // Canonical tier list, top-down. Reverse for build-up ordering.
    const SPONSOR_TIERS = [
        ['platinum-sponsors',  'platinum',  'Platinum Sponsors'],
        ['gold-sponsors',      'gold',      'Gold Sponsors'],
        ['silver-sponsors',    'silver',    'Silver Sponsors'],
        ['bronze-sponsors',    'bronze',    'Bronze Sponsors'],
        ['community-sponsors', 'community', 'Community Sponsors'],
        ['partner-sponsors',   'partner',   'Partners'],
    ];

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

                // Two logos per row max: anything beyond 2 wraps onto a
                // second (or further) row. A lone trailing logo in an
                // odd-count tier (and a single-logo tier) is centered via
                // the :last-child:nth-child(odd) rule in sponsors.css.
                const grid = document.createElement('div');
                grid.className = 'sponsor-grid';
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

    // Replace a single placeholder element with one empty <section> per
    // tier, all sharing the same background/logo attributes. Must run
    // BEFORE Reveal.initialize so reveal sees the sections at index time.
    function insertSponsorSections(markerSelector, year, tiers, opts) {
        const o = opts || {};
        const marker = typeof markerSelector === 'string'
            ? document.querySelector(markerSelector)
            : markerSelector;
        if (!marker || !marker.parentNode) {
            console.warn('Sponsor marker not found:', markerSelector);
            return;
        }
        const parent = marker.parentNode;
        const logo = o.logo
            || `https://www.elbsides.eu/assets/${year}/logos/Elbsides_Logo_${year}.svg`;
        const bgPos = o.backgroundPosition || 'top 1% right 1%';
        const bgSize = o.backgroundSize || '15%';
        tiers.forEach(([tag]) => {
            const section = document.createElement('section');
            section.id = tag;
            section.setAttribute('data-background-image', logo);
            section.setAttribute('data-background-position', bgPos);
            section.setAttribute('data-background-size', bgSize);
            if (o.transition) section.setAttribute('data-transition', o.transition);
            parent.insertBefore(section, marker);
        });
        parent.removeChild(marker);
    }

    // One-call entry point: insert empty sections synchronously, then
    // kick off the async fetch+populate for each tier.
    function setupSponsors(markerSelector, year, tiers, opts) {
        insertSponsorSections(markerSelector, year, tiers, opts);
        populateSponsors(year, tiers);
    }

    global.SPONSOR_TIERS = SPONSOR_TIERS;
    global.rewriteAssetSrc = rewriteAssetSrc;
    global.sponsorIncludeUrl = sponsorIncludeUrl;
    global.fillSponsorImages = fillSponsorImages;
    global.populateSponsors = populateSponsors;
    global.insertSponsorSections = insertSponsorSections;
    global.setupSponsors = setupSponsors;
})(window);
