document.addEventListener('DOMContentLoaded', () => {

    const DEFAULTS = {
        profile: {
            github: 'aaasiroglu',
            medium: 'aaasiroglu',
            linkedin: 'https://www.linkedin.com/in/asiroglu'
        },
        linkedinPosts: [],
        github: { show: true, maxRepos: 6, pinned: [] },
        medium: { show: true, maxPosts: 6 }
    };

    let CONFIG = DEFAULTS;
    const configUrl = 'assets/data/content.json';
    const configPromise = fetch(configUrl)
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then(json => { CONFIG = Object.assign({}, DEFAULTS, json); })
        .catch(() => { /* keep defaults */ });

    configPromise.then(() => {
        if (CONFIG.ui && CONFIG.ui.minimal) {
            document.body.classList.add('minimal');
        }
    });

    // Scroll progress bar
    const progressEl = document.getElementById('progress-bar');
    function updateProgressBar() {
        if (!progressEl) return;
        const doc = document.documentElement;
        const total = doc.scrollHeight - doc.clientHeight;
        const scrolled = total > 0 ? (window.scrollY / total) * 100 : 0;
        progressEl.style.width = `${scrolled}%`;
    }
    window.addEventListener('scroll', updateProgressBar, { passive: true });
    updateProgressBar();

    // Reveal-on-scroll helper
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    function addReveal(elOrNodeList) {
        if (!elOrNodeList) return;
        if (NodeList.prototype.isPrototypeOf(elOrNodeList) || Array.isArray(elOrNodeList)) {
            elOrNodeList.forEach(el => addReveal(el));
            return;
        }
        const el = elOrNodeList;
        if (!el) return;
        el.classList.add('reveal');
        revealObserver.observe(el);
    }

    // Add reveal to key section containers
    addReveal(document.querySelector('#categories .container'));
    addReveal(document.querySelector('#linkedin .container'));
    addReveal(document.querySelector('#writing .container'));
    addReveal(document.querySelector('#opensource .container'));
    addReveal(document.querySelector('#about .container'));
    addReveal(document.querySelector('#contact .container'));

    // Heartbeat dots layer setup
    const heartbeatLayer = document.getElementById('heartbeat-layer');
    const headerEl = document.getElementById('header');
    const navbarHeight = 44;
    let beatDots = [];
    let beatMeta = [];
    let baseBeat = 1.2; // seconds per cycle
    let rafPending = false;
    function generateHeartbeatDots() {
        if (!heartbeatLayer || !headerEl) return;
        const count = 365; // requested density
        heartbeatLayer.innerHTML = '';
        beatDots = [];
        beatMeta = [];
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.className = 'heartbeat-dot' + (i % 3 === 0 ? ' alt' : '');
            const x0 = Math.random() * 100;
            const y0 = Math.random() * 100;
            dot.style.left = x0 + '%';
            dot.style.top = y0 + '%';
            const delay = (Math.random() * baseBeat).toFixed(2);
            const speed = (baseBeat + Math.random() * 0.6).toFixed(2);
            dot.style.animationDelay = `-${delay}s`;
            dot.style.animationDuration = `${speed}s`;
            heartbeatLayer.appendChild(dot);
            beatDots.push(dot);
            // parameter along the line [-0.5 .. 0.5]
            const t = (i / (count - 1)) - 0.5;
            beatMeta.push({ el: dot, x0, y0, t });
        }
        updateDotPositions();
    }
    function setHeartbeatSpeed(multiplier) {
        beatDots.forEach(d => {
            const dur = parseFloat(getComputedStyle(d).animationDuration) || baseBeat;
            const n = Math.max(0.5, Math.min(2.5, dur * multiplier));
            d.style.animationDuration = `${n}s`;
        });
    }
    function updateDotPositions() {
        if (!headerEl || !heartbeatLayer || beatMeta.length === 0) return;
        const rect = headerEl.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, (0 - rect.top) / rect.height));
        // Rotate the alignment line from 0deg to 180deg as we scroll header
        const angle = progress * Math.PI; // 0..pi radians
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        // How strongly we align to the line (ease-in)
        const align = Math.pow(progress, 0.9);
        // Line extent in percent
        const extent = 40; // line half-length (percent)
        beatMeta.forEach(m => {
            // target position on line through center (50%,50%)
            const tx = 50 + m.t * extent * dx;
            const ty = 50 + m.t * extent * dy;
            const x = m.x0 * (1 - align) + tx * align;
            const y = m.y0 * (1 - align) + ty * align;
            m.el.style.left = x + '%';
            // In strip mode, top is forced to 50% via CSS; still set for header
            m.el.style.top = y + '%';
        });
    }
    function updateHeartbeatOnScroll() {
        if (!headerEl || !heartbeatLayer) return;
        if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(() => {
                rafPending = false;
                const rect = headerEl.getBoundingClientRect();
                const progress = Math.min(1, Math.max(0, (0 - rect.top) / rect.height));
                // Slow down as we scroll down: 1 at top -> 1.8 at bottom
                const speedMul = 1 + progress * 0.8;
                setHeartbeatSpeed(speedMul);
                // Collapse into strip after header leaves viewport top
                if (rect.bottom <= navbarHeight) {
                    heartbeatLayer.classList.add('heartbeat-strip');
                } else {
                    heartbeatLayer.classList.remove('heartbeat-strip');
                }
                updateDotPositions();
            });
        }
    }
    // Initialize
    generateHeartbeatDots();
    window.addEventListener('resize', () => { generateHeartbeatDots(); });
    window.addEventListener('scroll', updateHeartbeatOnScroll, { passive: true });
    updateHeartbeatOnScroll();

    // Map initialization
    const map = L.map('map', {
        center: [39.9334, 32.8597], // Turkey center
        zoom: 6,
        zoomControl: false,
        attributionControl: false
    });

    // Add dark theme tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    // Milestone data
    const milestones = [
        {
            category: 'professional',
            title: 'IMM Directorate of GIS',
            year: 'Nov 2024 - Present',
            description: 'GIS Specialist',
            coordinates: [41.037938, 28.972503],
            location: 'Istanbul, Turkey'
        },
        {
            category: 'academic',
            title: 'Istanbul Technical University',
            year: '2024 - Present',
            description: 'Master of Science in Geomatics Engineering',
            coordinates: [41.104499, 29.020751],
            location: 'Istanbul, Turkey'
        },
        {
            category: 'professional',
            title: 'Enerjisa Energy',
            year: 'Oct 2023 - Jun 2024',
            description: 'Data Engineering Long Term Intern (ITalent)',
            coordinates: [40.928677, 29.146474],
            location: 'Istanbul, Turkey'
        },
        {
            category: 'professional',
            title: 'Ministry of Defense General Directorate of Mapping',
            year: 'Jul 2023 - Aug 2023',
            description: 'Geomatics Engineer Intern',
            coordinates: [39.9334, 32.8597],
            location: 'Ankara, Turkey'
        },
        {
            category: 'professional',
            title: 'Entalpi',
            year: 'Dec 2021 - Jul 2023',
            description: 'Part-Time Reporting Analyst (Power BI)',
            coordinates: [41.0816, 29.0121],
            location: 'Istanbul, Turkey'
        },
        {
            category: 'academic',
            title: 'Istanbul Technical University',
            year: '2019-2024',
            description: 'Bachelor of Science in Geomatics Engineering',
            coordinates: [41.104870, 29.020563],
            location: 'Istanbul, Turkey'
        },
        {
            category: 'academic',
            title: 'Beşir Balcıoğlu Anatolian High School',
            year: '2015-2019',
            description: 'High School Education',
            coordinates: [40.986272, 28.667364],
            location: 'Istanbul, Turkey'
        },
        {
            category: 'academic',
            title: 'Gaziosmanpaşa Middle School',
            year: '2011-2015',
            description: 'Middle School Education',
            coordinates: [40.310344, 36.552147],
            location: 'Istanbul, Turkey'
        },
        {
            category: 'academic',
            title: 'Ömer Gültekin Yavuz Selim Primary School',
            year: '2007-2011',
            description: 'Primary Education',
            coordinates: [41.019350, 28.585900],
            location: 'Istanbul, Turkey'
        }
    ];

    // Create markers and timeline items
    const markers = [];
    const timelineItems = [];
    const timeline = document.querySelector('.timeline');
    const categoryButtons = document.querySelectorAll('.category-btn');

    milestones.forEach((milestone, index) => {
        // Create marker
        const marker = L.marker(milestone.coordinates, {
            icon: L.divIcon({
                className: `custom-marker ${milestone.category}`,
                html: `<div class="marker-pin ${milestone.category}"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            })
        }).addTo(map);

        // Create tooltip
        const tooltip = L.tooltip({
            className: 'custom-tooltip',
            direction: 'top',
            offset: L.point(0, -10),
            opacity: 0,
            permanent: false,
            interactive: true
        })
        .setContent(`
            <h3>${milestone.title}</h3>
            <div class="year">${milestone.year}</div>
            <div class="description">${milestone.description}</div>
        `);

        marker.bindTooltip(tooltip);

        // Show tooltip on hover
        marker.on('mouseover', function() {
            this.openTooltip();
        });

        // Hide tooltip on mouseout
        marker.on('mouseout', function() {
            this.closeTooltip();
        });

        markers.push(marker);

        // Create timeline item
        const timelineItem = document.createElement('div');
        timelineItem.className = `timeline-item ${milestone.category}`;
        timelineItem.innerHTML = `
            <div class="timeline-content">
                <h3>${milestone.title}</h3>
                <div class="year">${milestone.year}</div>
                <div class="description">${milestone.description}</div>
            </div>
        `;
        timeline.appendChild(timelineItem);
        timelineItems.push(timelineItem);

        // Add click event to timeline item
        timelineItem.addEventListener('click', () => {
            map.flyTo(milestone.coordinates, 13, {
                duration: 1.5,
                easeLinearity: 0.25
            });
            marker.openTooltip();
            highlightItem(timelineItem);
        });

        // Add click event to marker
        marker.on('click', () => {
            map.flyTo(milestone.coordinates, 13, {
                duration: 1.5,
                easeLinearity: 0.25
            });
            highlightItem(timelineItem);
        });
    });

    // Category filtering
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Filter timeline items and markers
            timelineItems.forEach((item, index) => {
                if (category === 'all' || item.classList.contains(category)) {
                    item.style.display = 'block';
                    markers[index].addTo(map);
                } else {
                    item.style.display = 'none';
                    markers[index].removeFrom(map);
                }
            });
        });
    });

    // Timeline scroll handling
    const timelineContainer = document.querySelector('.timeline-container');
    let isScrolling = false;
    let scrollTimeout;

    timelineContainer.addEventListener('scroll', () => {
        if (!isScrolling) {
            isScrolling = true;
            clearTimeout(scrollTimeout);
        }

        const containerRect = timelineContainer.getBoundingClientRect();
        const containerCenter = containerRect.top + containerRect.height / 2;

        timelineItems.forEach((item, index) => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.top + itemRect.height / 2;
            const distance = Math.abs(containerCenter - itemCenter);

            if (distance < itemRect.height / 2) {
                highlightItem(item);
                map.flyTo(milestones[index].coordinates, 13, {
                    duration: 1.5,
                    easeLinearity: 0.25
                });
            }
        });

        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 150);
    });

    // Helper function to highlight timeline item
    function highlightItem(item) {
        timelineItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
    }

    // Initialize content
    categoryButtons[0].click(); // Click "All" button by default

    // Intersection Observer for timeline items
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    timelineItems.forEach(item => observer.observe(item));

    (async function renderGitHub() {
        await configPromise;
        const container = document.getElementById('github-list');
        if (!container) return;
        if (!CONFIG.github?.show) { container.innerHTML = ''; return; }
    const username = CONFIG.profile?.github || DEFAULTS.profile.github;
    const perPage = CONFIG.github?.maxRepos || 6;
    const pinned = Array.isArray(CONFIG.github?.pinned) ? CONFIG.github.pinned : [];
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=${perPage}`;

        fetch(url, {
            headers: { 'Accept': 'application/vnd.github+json' }
        })
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then(async repos => {
            if (!Array.isArray(repos) || repos.length === 0) {
                container.innerHTML = `<p class="section-lead">No repositories found. <a href="https://github.com/${username}" target="_blank">View profile</a>.</p>`;
                return;
            }
            // Reorder so pinned repos appear first
            const byName = new Map(repos.map(r => [r.name, r]));
            const pinnedRepos = pinned.map(name => byName.get(name)).filter(Boolean);
            const restRepos = repos.filter(r => !pinned.includes(r.name));
            const finalList = [...pinnedRepos, ...restRepos].slice(0, perPage);

            const wantExcerpt = CONFIG.github?.readme?.showExcerpt;
            const maxChars = CONFIG.github?.readme?.maxChars || 180;

            async function getReadmeExcerpt(repo) {
                if (!wantExcerpt) return '';
                async function tryBranch(branch) {
                    const rawUrl = `https://raw.githubusercontent.com/${username}/${repo.name}/${branch}/README.md`;
                    const res = await fetch(rawUrl);
                    if (!res.ok) return '';
                    const text = await res.text();
                    const clean = text
                        .replace(/\r/g, '')
                        .replace(/\n+/g, ' ')
                        .replace(/[#>*`_\[\]]/g, ' ')
                        .trim();
                    return clean.length > maxChars ? clean.slice(0, maxChars).trim() + '…' : clean;
                }
                // Try default_branch -> main -> master
                const b1 = repo.default_branch || 'main';
                const first = await tryBranch(b1);
                if (first) return first;
                if (b1 !== 'master') {
                    const second = await tryBranch('master');
                    if (second) return second;
                }
                return '';
            }

            const cards = await Promise.all(finalList.map(async repo => {
                const desc = repo.description ? repo.description : '';
                const excerpt = await getReadmeExcerpt(repo);
                const details = excerpt || desc;
                const lang = repo.language ? `<span class="tag"><i class="fas fa-code"></i>${repo.language}</span>` : '';
                const stars = repo.stargazers_count ? `<span class="tag"><i class="fas fa-star"></i>${repo.stargazers_count}</span>` : '';
                const forks = repo.forks_count ? `<span class="tag"><i class="fas fa-code-branch"></i>${repo.forks_count}</span>` : '';
                const pinnedBadge = pinned.includes(repo.name) ? `<span class="tag"><i class=\"fas fa-thumbtack\"></i>Pinned</span>` : '';
                return `
                    <article class="card reveal">
                        <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
                        <p>${details || ''}</p>
                        <div class="meta">${pinnedBadge}${lang}${stars}${forks}</div>
                    </article>
                `;
            }));
            container.innerHTML = cards.join('');
            addReveal(container.querySelectorAll('.card'));
        })
        .catch(() => {
            container.innerHTML = `<p class="section-lead">Unable to load GitHub repos now (rate limit?). <a href="https://github.com/${username}" target="_blank">Open my GitHub</a>.</p>`;
        });
    })();

    (async function renderMedium() {
        await configPromise;
        const container = document.getElementById('medium-list');
        if (!container) return;
        if (!CONFIG.medium?.show) { container.innerHTML = ''; return; }
        const handle = (CONFIG.profile?.medium || DEFAULTS.profile.medium).replace(/^@/, '');
        const rssUrl = `https://medium.com/feed/@${encodeURIComponent(handle)}`;
        const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        const count = CONFIG.medium?.maxPosts || 6;

        fetch(api)
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then(data => {
            if (!data || !Array.isArray(data.items)) throw new Error('No items');
            const posts = data.items.filter(i => i.categories && i.categories.length).slice(0, count);
            if (posts.length === 0) throw new Error('No posts');
            const html = posts.map(p => {
                const date = new Date(p.pubDate);
                const pretty = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                const img = p.thumbnail ? `<img src="${p.thumbnail}" alt="${p.title}" style="width:100%;height:160px;object-fit:cover;border-radius:10px;margin-bottom:0.75rem;"/>` : '';
                return `
                    <article class="card reveal">
                        ${img}
                        <h3><a href="${p.link}" target="_blank">${p.title}</a></h3>
                        <div class="meta"><span class="tag"><i class="far fa-calendar"></i>${pretty}</span></div>
                    </article>
                `;
            }).join('');
            container.innerHTML = html;
            addReveal(container.querySelectorAll('.card'));
        })
        .catch(() => {
            container.innerHTML = `<p class="section-lead">Can't load Medium posts (CORS). Add posts manually or visit <a href="https://medium.com/@${handle}" target="_blank">Medium profile</a>.</p>`;
        });
    })();

    // ---------- LinkedIn Highlights ----------
    (async function renderLinkedIn() {
        await configPromise;
        const container = document.getElementById('linkedin-list');
        if (!container) return;
        const posts = Array.isArray(CONFIG.linkedinPosts) ? CONFIG.linkedinPosts : [];
        if (posts.length === 0) {
            container.innerHTML = `<p class="section-lead">Add your public LinkedIn post URLs in assets/data/content.json (linkedinPosts) to embed them here.</p>`;
            return;
        }
        const html = posts.map(item => {
            const url = typeof item === 'string' ? item : item.url;
            const caption = typeof item === 'object' && item.caption ? item.caption : '';
            const embedSrc = toLinkedInEmbed(url);
            if (embedSrc) {
                return `
                    <div class="linkedin-embed reveal">
                        <iframe src="${embedSrc}" allowfullscreen="" title="LinkedIn post"></iframe>
                        ${caption ? `<div class="section-lead" style="padding: 0.75rem 1rem;">${caption}</div>` : ''}
                    </div>
                `;
            }
            return `
                <article class="card reveal">
                    <h3>LinkedIn Post</h3>
                    ${caption ? `<p>${caption}</p>` : ''}
                    <p><a href="${url}" target="_blank">Open on LinkedIn</a></p>
                </article>
            `;
        }).join('');
        container.innerHTML = html;
        addReveal(container.querySelectorAll('.linkedin-embed, .card'));

        function toLinkedInEmbed(postUrl) {
            try {
                const u = new URL(postUrl);
                // Try to find known patterns
                // activity ID
                const activityMatch = u.href.match(/activity:(\d+)/);
                if (activityMatch) {
                    return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityMatch[1]}`;
                }
                // ugcPost ID
                const ugcMatch = u.href.match(/ugcPost:(\d+)/);
                if (ugcMatch) {
                    return `https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:${ugcMatch[1]}`;
                }
                // share ID
                const shareMatch = u.href.match(/share:(\d+)/);
                if (shareMatch) {
                    return `https://www.linkedin.com/embed/feed/update/urn:li:share:${shareMatch[1]}`;
                }
                // Some localized patterns like tr.linkedin.com/posts/... may include the activity id at the end
                const localized = u.href.match(/(\d{12,})/);
                if (localized) {
                    return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${localized[1]}`;
                }
                return null;
            } catch (_) { return null; }
        }
    })();

    // ---------- Sliders controls (Contact) ----------
    function sliderScrollBy(id, delta) {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollBy({ left: delta, behavior: 'smooth' });
    }
    const contactPrev = document.getElementById('contact-prev');
    const contactNext = document.getElementById('contact-next');
    if (contactPrev && contactNext) {
        const amount = 360;
        contactPrev.addEventListener('click', () => { sliderScrollBy('contact-slider', -amount); setHeartbeatSpeed(1.5); });
        contactNext.addEventListener('click', () => { sliderScrollBy('contact-slider', amount); setHeartbeatSpeed(1.5); });
    }
});

// Mobile Menu Functionality
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link, .mobile-nav-button');

function toggleMobileMenu() {
    mobileMenu.classList.toggle('active');
    mobileMenuBtn.classList.toggle('active');
    document.body.classList.toggle('menu-open');
    
    // Update ARIA attributes for accessibility
    const isOpen = mobileMenu.classList.contains('active');
    mobileMenuBtn.setAttribute('aria-expanded', isOpen);
}

function closeMobileMenu() {
    mobileMenu.classList.remove('active');
    mobileMenuBtn.classList.remove('active');
    document.body.classList.remove('menu-open');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
}

// Event listeners
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
}

// Initialize smooth scrolling
enhanceSmoothScrolling();
mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
        setTimeout(closeMobileMenu, 150); // Small delay for smooth transition
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('active') && 
        !mobileMenu.contains(e.target) && 
        !mobileMenuBtn.contains(e.target)) {
        closeMobileMenu();
    }
});

// Close menu on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        closeMobileMenu();
    }
});

// Touch and Swipe Gesture Support
class TouchGestureHandler {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.minSwipeDistance = 50;
        this.maxVerticalDistance = 100;
        
        this.init();
    }
    
    init() {
        // Touch events for mobile menu swipe
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // Add touch feedback to interactive elements
        this.addTouchFeedback();
        
        // Handle device orientation changes
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    }
    
    handleTouchStart(e) {
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
    }
    
    handleTouchMove(e) {
        // Prevent scroll when mobile menu is open
        if (mobileMenu.classList.contains('active')) {
            e.preventDefault();
        }
    }
    
    handleTouchEnd(e) {
        this.endX = e.changedTouches[0].clientX;
        this.endY = e.changedTouches[0].clientY;
        
        this.handleSwipe();
    }
    
    handleSwipe() {
        const deltaX = this.endX - this.startX;
        const deltaY = Math.abs(this.endY - this.startY);
        
        // Only process horizontal swipes
        if (deltaY > this.maxVerticalDistance) return;
        
        const isMenuOpen = mobileMenu.classList.contains('active');
        
        // Swipe right to open menu (from left edge)
        if (deltaX > this.minSwipeDistance && this.startX < 50 && !isMenuOpen) {
            toggleMobileMenu();
        }
        
        // Swipe left to close menu
        if (deltaX < -this.minSwipeDistance && isMenuOpen) {
            closeMobileMenu();
        }
    }
    
    addTouchFeedback() {
        // Add haptic feedback for touch devices (if supported)
        const interactiveElements = document.querySelectorAll('.btn, .mobile-nav-link, .contact-card, .skill-item, .about-card');
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                // Add visual feedback
                element.style.transform = 'scale(0.98)';
                
                // Haptic feedback (if supported)
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            }, { passive: true });
            
            element.addEventListener('touchend', () => {
                // Remove visual feedback
                setTimeout(() => {
                    element.style.transform = '';
                }, 150);
            }, { passive: true });
        });
    }
    
    handleOrientationChange() {
        // Close mobile menu on orientation change
        setTimeout(() => {
            if (mobileMenu.classList.contains('active')) {
                closeMobileMenu();
            }
            
            // Recalculate viewport height for mobile browsers
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }, 100);
    }
}

// Viewport Height Fix for Mobile
function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Initialize viewport height
setVH();
window.addEventListener('resize', setVH);

// Enhanced Performance Monitoring for Mobile
class MobilePerformanceOptimizer {
    constructor() {
        this.isLowEndDevice = this.detectLowEndDevice();
        this.init();
    }
    
    detectLowEndDevice() {
        // Simple heuristic to detect low-end devices
        const cores = navigator.hardwareConcurrency || 1;
        const memory = navigator.deviceMemory || 1;
        
        return cores <= 2 || memory <= 2;
    }
    
    init() {
        if (this.isLowEndDevice) {
            // Disable complex animations on low-end devices
            document.body.classList.add('low-performance');
            
            // Reduce animation frame rate
            this.limitAnimationFrameRate();
        }
        
        // Monitor performance
        this.monitorPerformance();
    }
    
    limitAnimationFrameRate() {
        let lastTime = 0;
        const targetFPS = 30;
        const interval = 1000 / targetFPS;
        
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(callback) {
            const currentTime = Date.now();
            const timeToCall = Math.max(0, interval - (currentTime - lastTime));
            
            const id = window.setTimeout(() => {
                callback(currentTime + timeToCall);
            }, timeToCall);
            
            lastTime = currentTime + timeToCall;
            return id;
        };
    }
    
    monitorPerformance() {
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) {
                        console.warn('Long task detected:', entry.duration);
                    }
                }
            });
            
            try {
                observer.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                // Longtask API not supported
            }
        }
    }
}

// Initialize touch gestures and performance optimization
document.addEventListener('DOMContentLoaded', () => {
    new TouchGestureHandler();
    new MobilePerformanceOptimizer();
    
    // Initialize horizontal scroll for content sections
    initializeHorizontalScroll();
});

// Horizontal scroll initialization for mobile content sections
function initializeHorizontalScroll() {
    const scrollContainers = document.querySelectorAll('.linkedin-grid, .card-grid, #linkedin-list, #medium-list, #github-list');
    
    scrollContainers.forEach(container => {
        if (!container) return;
        
        // Add scroll indicators
        addScrollIndicators(container);
        
        // Add touch scroll enhancement
        let isScrolling = false;
        
        container.addEventListener('scroll', () => {
            if (!isScrolling) {
                isScrolling = true;
                updateScrollIndicators(container);
                
                setTimeout(() => {
                    isScrolling = false;
                }, 100);
            }
        }, { passive: true });
        
        // Initial scroll indicator state
        updateScrollIndicators(container);
    });
}

function addScrollIndicators(container) {
    // Remove existing indicators
    const existingIndicator = container.parentElement.querySelector('.scroll-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Add scroll indicator
    const indicator = document.createElement('div');
    indicator.className = 'scroll-indicator';
    indicator.innerHTML = '→';
    indicator.style.cssText = `
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255, 149, 0, 0.9);
        color: #000;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: bold;
        pointer-events: none;
        z-index: 10;
        transition: opacity 0.3s ease;
    `;
    
    // Position the parent relatively
    container.parentElement.style.position = 'relative';
    container.parentElement.appendChild(indicator);
}

function updateScrollIndicators(container) {
    const indicator = container.parentElement.querySelector('.scroll-indicator');
    if (!indicator) return;
    
    const isScrollable = container.scrollWidth > container.clientWidth;
    const isAtEnd = Math.abs(container.scrollWidth - container.clientWidth - container.scrollLeft) < 5;
    
    if (!isScrollable || isAtEnd) {
        indicator.style.opacity = '0';
    } else {
        indicator.style.opacity = '1';
    }
}

// Smooth scrolling enhancement for mobile
function enhanceSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Close mobile menu if open
                if (mobileMenu.classList.contains('active')) {
                    closeMobileMenu();
                }
                
                // Smooth scroll with mobile-friendly offset
                const navHeight = document.getElementById('navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize smooth scrolling
enhanceSmoothScrolling();
