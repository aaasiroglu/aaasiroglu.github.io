// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
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
            category: 'academic',
            title: 'Ömer Gültekin Yavuz Selim Primary School',
            year: '2007-2011',
            description: 'Primary Education',
            coordinates: [41.019350, 28.585900],
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
            title: 'Beşir Balcıoğlu Anatolian High School',
            year: '2015-2019',
            description: 'High School Education',
            coordinates: [40.986272, 28.667364],
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
            category: 'professional',
            title: 'Entalpi',
            year: 'Dec 2021 - Jul 2023',
            description: 'Part-Time Reporting Analyst (Power BI)',
            coordinates: [41.0816, 29.0121],
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
            title: 'Enerjisa Energy',
            year: 'Oct 2023 - Jun 2024',
            description: 'Data Engineering Long Term Intern (ITalent)',
            coordinates: [40.928677, 29.146474],
            location: 'Istanbul, Turkey'
        },
        {
            category: 'academic',
            title: 'Istanbul Technical University',
            year: '2019-2024',
            description: 'Master of Science in Geomatics Engineering',
            coordinates: [41.104499, 29.020751],
            location: 'Istanbul, Turkey'
        },
        {
            category: 'professional',
            title: 'IMM Directorate of GIS',
            year: 'Nov 2024 - Present',
            description: 'GIS Specialist',
            coordinates: [41.037938, 28.972503],
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
});
  