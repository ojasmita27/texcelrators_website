(function () {
    function iconForTitle(title) {
        const t = String(title || '').toLowerCase();
        if (t.includes('purpose')) return 'fa-bullseye';
        if (t.includes('objectives')) return 'fa-compass';
        if (t.includes('membership')) return 'fa-user-check';
        if (t.includes('leadership')) return 'fa-sitemap';
        if (t.includes('meetings')) return 'fa-comments';
        if (t.includes('project')) return 'fa-microchip';
        if (t.includes('financial')) return 'fa-wallet';
        if (t.includes('event')) return 'fa-calendar-check';
        if (t.includes('conduct')) return 'fa-scale-balanced';
        if (t.includes('amendments')) return 'fa-pen-to-square';
        if (t.includes('approval')) return 'fa-signature';
        return 'fa-file-lines';
    }

    function sanitize() {
        const section = document.getElementById('rules-section');
        if (!section) return null;

        section.querySelectorAll('select').forEach((el) => el.remove());

        const cards = Array.from(section.querySelectorAll('[data-rules-section], .sop-card, .rules-section-card'));
        cards.forEach((card) => {
            if (!card.classList.contains('sop-card')) {
                card.classList.add('sop-card');
            }

            const h3 = card.querySelector('h3');
            if (h3 && !h3.classList.contains('sop-card-title')) {
                h3.classList.add('sop-card-title');
            }

            let header = card.querySelector('.sop-card-header');
            if (!header) {
                header = document.createElement('header');
                header.className = 'sop-card-header';

                const icon = document.createElement('i');
                icon.className = 'fas sop-card-icon';

                if (h3) {
                    icon.classList.add(iconForTitle(h3.textContent));
                    h3.parentNode.insertBefore(header, h3);
                    header.appendChild(icon);
                    header.appendChild(h3);
                } else {
                    icon.classList.add('fa-file-lines');
                    header.appendChild(icon);
                    const fallbackTitle = document.createElement('h3');
                    fallbackTitle.className = 'sop-card-title';
                    fallbackTitle.textContent = card.id || 'Section';
                    header.appendChild(fallbackTitle);
                    card.insertBefore(header, card.firstChild);
                }
            }

            const body = card.querySelector('.rules-section-body, .sop-card-body') || card;
            if (!body.classList.contains('sop-card-body')) {
                body.classList.add('sop-card-body');
            }
        });

        const tocButtons = Array.from(section.querySelectorAll('#rulesToc button, #rulesToc [data-section-target]'));
        tocButtons.forEach((btn) => {
            btn.classList.add('sop-nav-item');
            if (!btn.querySelector('.sop-nav-icon')) {
                const title = (btn.textContent || '').trim();
                const icon = document.createElement('i');
                icon.className = `fas sop-nav-icon ${iconForTitle(title)}`;
                const label = document.createElement('span');
                label.className = 'sop-nav-label';
                label.textContent = title;
                btn.textContent = '';
                btn.appendChild(icon);
                btn.appendChild(label);
            }
        });

        const shellHost = section.querySelector('.sop-shell') || section.querySelector(':scope > div:last-child');
        if (shellHost && !shellHost.classList.contains('sop-shell')) {
            shellHost.classList.add('sop-shell');
        }

        const contentWrap = section.querySelector('#rulesContent') ? section.querySelector('#rulesContent').parentElement : null;
        if (contentWrap && !contentWrap.classList.contains('sop-content')) {
            contentWrap.classList.add('sop-content');
        }

        const actions = section.querySelector('.panel-header > div:last-child');
        if (actions && !actions.classList.contains('sop-actions')) {
            actions.classList.add('sop-actions');
        }

        const acceptance = section.querySelector('#rulesAcceptanceCard');
        if (acceptance) {
            acceptance.classList.add('sop-card', 'sop-acceptance');
            const label = acceptance.querySelector('label');
            if (label) {
                let header = acceptance.querySelector('.sop-card-header');
                if (!header) {
                    header = document.createElement('header');
                    header.className = 'sop-card-header';
                    header.innerHTML = '<i class="fas fa-check-circle sop-card-icon"></i><h3 class="sop-card-title">Acknowledgement</h3>';
                    acceptance.insertBefore(header, acceptance.firstChild);
                }
            }
            acceptance.querySelectorAll('p').forEach((p) => p.classList.add('sop-card-body'));
        }

        return section;
    }

    function initObservers(section) {
        const toc = section.querySelector('#rulesToc');
        const cards = Array.from(section.querySelectorAll('#rulesContent .sop-card'));
        const progressBar = section.querySelector('#rulesProgressBar');
        const progressText = section.querySelector('#rulesProgressText');
        if (!toc || !cards.length) return;

        const byId = new Map();
        toc.querySelectorAll('[data-section-target]').forEach((item) => {
            item.classList.add('sop-nav-item');
            byId.set(item.getAttribute('data-section-target'), item);
        });

        const setActive = (id) => {
            byId.forEach((el, key) => {
                const active = key === id;
                el.classList.toggle('is-active', active);
                el.setAttribute('aria-current', active ? 'true' : 'false');
            });
        };

        const updateProgress = () => {
            const top = window.scrollY + 120;
            let seen = 0;
            cards.forEach((card) => {
                const y = card.getBoundingClientRect().top + window.scrollY;
                if (y <= top) seen += 1;
            });
            const pct = Math.max(0, Math.min(100, Math.round((seen / cards.length) * 100)));
            if (progressBar) progressBar.style.width = `${pct}%`;
            if (progressText) progressText.textContent = `${pct}% read`;
        };

        if (cards[0]) setActive(cards[0].id);
        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                const vis = entries.filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (vis[0] && vis[0].target && vis[0].target.id) {
                    setActive(vis[0].target.id);
                }
            }, {
                root: null,
                rootMargin: '-20% 0px -58% 0px',
                threshold: [0.2, 0.4, 0.6]
            });
            cards.forEach((c) => io.observe(c));
        }

        toc.querySelectorAll('[data-section-target]').forEach((item) => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-section-target');
                const target = document.getElementById(id);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActive(id);
                }
            });
        });
    }

    function init() {
        const section = sanitize();
        if (!section) return;

        const whiteRow = section.querySelector('.rules-controls, .rules-actions, #expandAllRulesButton')
            ? (section.querySelector('.rules-controls, .rules-actions') || section.querySelector('#expandAllRulesButton')?.parentElement)
            : null;
        if (whiteRow) {
            if (whiteRow.id === 'expandAllRulesButton' || whiteRow.id === 'collapseAllRulesButton') {
                whiteRow.remove();
            } else if (whiteRow.querySelector('#expandAllRulesButton') || whiteRow.querySelector('#collapseAllRulesButton')) {
                whiteRow.remove();
            }
        }

        initObservers(section);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
