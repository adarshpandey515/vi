function initNotificationsPlugin(editor) {
    if (editor.Notifications) {
        return editor.Notifications;
    }

    const API_ENDPOINTS = {
        logError: `${API_BASE_URL}/jsonLog`,
        fetchLogs: `${API_BASE_URL}/jsonLog`
    };

    const notificationConfig = {
        timeout: 3000,
        maxNotifications: 5,
        reverse: false,
        recordsPerPage: 5,
        icons: {
            error: '✖',
            warning: '⚠',
            info: 'ℹ',
        },
        i18n: {
            error: 'Error',
            warning: 'Warning',
            info: 'Info',
        }
    };

    let notificationContainer = document.getElementById('gjs-notifications-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'gjs-notifications-container';
        notificationContainer.className = 'gjs-notifications-wrapper';
        document.body.appendChild(notificationContainer);
    }

    const notifications = [];

    const style = document.createElement('style');
    style.textContent = `
        .gjs-notifications-wrapper { position: fixed; top: 60px; right: 20px; z-index: 10000; max-width: 400px; pointer-events: none; }
        .gjs-notification { background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,.15); margin-bottom: 12px; padding: 16px 20px; display: flex; align-items: flex-start; gap: 12px; animation: slideIn .3s ease-out; pointer-events: auto; border-left: 4px solid #ccc; transition: all .3s ease; }
        .gjs-notification:hover { box-shadow: 0 6px 16px rgba(0,0,0,.2); transform: translateX(-4px); }
        @keyframes slideIn { from { opacity: 0; transform: translateX(100%);} to { opacity: 1; transform: translateX(0);} }
        @keyframes slideOut { from { opacity: 1; transform: translateX(0);} to { opacity: 0; transform: translateX(100%);} }
        .gjs-notification.removing { animation: slideOut .3s ease-out forwards; }
        .gjs-notification__icon { font-size: 20px; font-weight: bold; flex-shrink: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
        .gjs-notification__content { flex: 1; min-width: 0; }
        .gjs-notification__type { font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; letter-spacing: .5px; }
        .gjs-notification__message { font-size: 14px; line-height: 1.4; color: #333; word-wrap: break-word; }
        .gjs-notification__close { background: none; border: none; font-size: 18px; cursor: pointer; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #666; flex-shrink: 0; transition: color .2s; }
        .gjs-notification__close:hover { color: #000; }
        .gjs-notification__error { border-left-color: #dc3545; }
        .gjs-notification__error .gjs-notification__icon, .gjs-notification__error .gjs-notification__type { color: #dc3545; }
        .gjs-notification__warning { border-left-color: #ffc107; }
        .gjs-notification__warning .gjs-notification__icon, .gjs-notification__warning .gjs-notification__type { color: #ffc107; }
        .gjs-notification__success { border-left-color: #28a745; }
        .gjs-notification__success .gjs-notification__icon, .gjs-notification__success .gjs-notification__type { color: #28a745; }
        .gjs-notification__info { border-left-color: #17a2b8; }
        .gjs-notification__info .gjs-notification__icon, .gjs-notification__info .gjs-notification__type { color: #17a2b8; }
        .gjs-notification__debug { border-left-color: #6c757d; }
        .gjs-notification__debug .gjs-notification__icon, .gjs-notification__debug .gjs-notification__type { color: #6c757d; }
        .gjs-notification__event { border-left-color: #17a2b8; }
        .gjs-notification__event .gjs-notification__icon, .gjs-notification__event .gjs-notification__type { color: #17a2b8; }
        .gjs-pn-btn.notifications-btn { position: relative; }
        .notifications-badge { position: absolute; top: 5px; right: 5px; background: #dc3545; color: #fff; border-radius: 10px; padding: 2px 6px; font-size: 10px; font-weight: bold; min-width: 18px; text-align: center; }
        .date-filter-container { background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px; display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }
        .date-filter-group { display: flex; flex-direction: column; gap: 5px; }
        .date-filter-label { font-size: 12px; font-weight: 600; color: #666; }
        .date-filter-input { padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; outline: none; transition: border-color .2s; }
        .date-filter-input:focus { border-color: #007bff; }
        .date-filter-button { padding: 7px 16px; border: none; border-radius: 4px; font-size: 13px; cursor: pointer; transition: all .2s; font-weight: 500; }
        .date-filter-button.submit { background: #007bff; color: #fff; }
        .date-filter-button.submit:hover { background: #0056b3; }
        .date-filter-button.reset { background: #6c757d; color: #fff; }
        .date-filter-button.reset:hover { background: #545b62; }
        .pagination-container { display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0; }
        .pagination-button { background: #007bff; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: background .2s; }
        .pagination-button:hover:not(:disabled) { background: #0056b3; }
        .pagination-button:disabled { background: #ccc; cursor: not-allowed; }
        .pagination-info { font-size: 13px; color: #666; }
        .loading-spinner { text-align: center; padding: 40px; color: #666; }
        .error-message { text-align: center; padding: 40px; color: #dc3545; }
    `;
    document.head.appendChild(style);

    function ensureXlsxLoaded() {
        return new Promise((resolve, reject) => {
            if (window.XLSX) return resolve(window.XLSX);
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
            s.onload = () => resolve(window.XLSX);
            s.onerror = () => reject(new Error('Failed to load XLSX library'));
            document.head.appendChild(s);
        });
    }

    function normalizeLevel(level) {
        const s = String(level || '').toLowerCase();
        if (!s) return 'info';
        if (s.startsWith('error')) return 'error';
        if (s.startsWith('warn')) return 'warning';
        if (s.startsWith('succ')) return 'success';
        if (s.startsWith('info')) return 'info';
        if (s.startsWith('debug')) return 'debug';
        if (s.startsWith('event')) return 'event';
        return 'info';
    }

    async function logToBackend({ level, message }) {
        try {
            const cleanMessage = typeof message === 'string'
                ? message.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
                : String(message);

            const response = await fetch(API_ENDPOINTS.logError, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    level: level || 'info',
                    message: cleanMessage
                })
            });

            if (!response.ok) {
                console.error('Failed to log');
            }
        } catch (error) {
            console.error('Error logging');
        }
    }


    async function fetchLogsFromBackend(fromDate = null, toDate = null) {
        try {
            let url = API_ENDPOINTS.fetchLogs;
            if (fromDate && toDate) url += `?from=${fromDate}&to=${toDate}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch logs');

            const data = await response.json();

            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.logs)) return data.logs;
            if (data && Array.isArray(data.data)) return data.data;
            return [];
        } catch (error) {
            console.error('Error fetching logs');
            throw error;
        }
    }

    function createNotificationElement(notification) {
        const { type, message, id } = notification;
        const icon = notificationConfig.icons[type] || notificationConfig.icons.info;
        const typeLabel = notificationConfig.i18n[type] || type;

        const notifEl = document.createElement('div');
        notifEl.className = `gjs-notification gjs-notification__${type}`;
        notifEl.setAttribute('data-notification-id', id);
        notifEl.innerHTML = `
            <div class="gjs-notification__icon">${icon}</div>
            <div class="gjs-notification__content">
                <div class="gjs-notification__type">${typeLabel}</div>
                <div class="gjs-notification__message">${message}</div>
            </div>
            <button class="gjs-notification__close" title="Close">×</button>
        `;

        const closeBtn = notifEl.querySelector('.gjs-notification__close');
        closeBtn.addEventListener('click', () => removeNotification(id));

        return notifEl;
    }

    const DEDUPE_WINDOW = 700;
    if (!notificationContainer._recentNotifications) notificationContainer._recentNotifications = {};
    function makeKey(type, message) {
        const msg = (typeof message === 'string') ? message.slice(0, 1000) : String(message).slice(0, 1000);
        return `${type}|${msg}`;
    }

    function shouldAllowNotification(type, message) {
        try {
            const key = makeKey(type, message);
            const now = Date.now();
            const last = notificationContainer._recentNotifications[key] || 0;
            if (now - last < DEDUPE_WINDOW) {
                return false;
            }
            notificationContainer._recentNotifications[key] = now;
            setTimeout(() => {
                const ts = notificationContainer._recentNotifications[key];
                if (ts && (Date.now() - ts) > (DEDUPE_WINDOW * 2)) {
                    delete notificationContainer._recentNotifications[key];
                }
            }, DEDUPE_WINDOW * 2);
            return true;
        } catch (e) {
            return true;
        }
    }

    function addNotification(notification) {
        const {
            type = 'info',
            message,
            timeout = notificationConfig.timeout,
            context = {}
        } = notification;

        if (!message) {
            return;
        }

        if (!shouldAllowNotification(type, message)) {
            return null;
        }

        logToBackend({ level: type, message, context });

        const id = Date.now() + Math.random();
        const notif = { id, type, message, timestamp: new Date(), context };
        notifications.push(notif);

        while (notifications.length > notificationConfig.maxNotifications) {
            const removed = notifications.shift();
            removeNotificationFromDOM(removed.id);
        }

        const notifEl = createNotificationElement(notif);
        if (notificationConfig.reverse) {
            notificationContainer.insertBefore(notifEl, notificationContainer.firstChild);
        } else {
            notificationContainer.appendChild(notifEl);
        }

        if (timeout > 0) setTimeout(() => removeNotification(id), timeout);

        updateBadge();
        editor.trigger('notifications:added', notif);
        editor.trigger('notifications:changed', notifications);
        return id;
    }

    function removeNotification(id) {
        const index = notifications.findIndex(n => n.id === id);
        if (index === -1) return;
        const notif = notifications[index];
        notifications.splice(index, 1);
        removeNotificationFromDOM(id);
        updateBadge();
        editor.trigger('notifications:removed', notif);
        editor.trigger('notifications:changed', notifications);
    }

    function removeNotificationFromDOM(id) {
        const notifEl = notificationContainer.querySelector(`[data-notification-id="${id}"]`);
        if (notifEl) {
            notifEl.classList.add('removing');
            setTimeout(() => { if (notifEl.parentNode) notifEl.parentNode.removeChild(notifEl); }, 300);
        }
    }

    function clearNotifications() {
        const toRemove = [...notifications];
        notifications.length = 0;
        toRemove.forEach(n => removeNotificationFromDOM(n.id));
        updateBadge();
        editor.trigger('notifications:cleared');
        editor.trigger('notifications:changed', notifications);
    }

    function updateBadge() {
        const badge = document.querySelector('.notifications-badge');
        const errorCount = notifications.filter(n => n.type === 'error').length;
        if (badge) {
            if (errorCount > 0) { badge.textContent = errorCount; badge.style.display = 'block'; }
            else { badge.style.display = 'none'; }
        }
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    function renderNotificationLogs(logs, currentPage, totalPages) {
        if (logs.length === 0) {
            return '<div style="text-align: center; padding: 40px; color: #999;">No notifications found</div>';
        }

        const startIndex = (currentPage - 1) * notificationConfig.recordsPerPage;
        const endIndex = startIndex + notificationConfig.recordsPerPage;
        const paginatedLogs = logs.slice(startIndex, endIndex);

        const colorMap = { error: '#dc3545', warning: '#ff9800', success: '#28a745', info: '#17a2b8', debug: '#6c757d', event: '#17a2b8' };

        return paginatedLogs.map(log => {
            const level = normalizeLevel(log.type || log.level || 'info');

            const icon = notificationConfig.icons[level] || notificationConfig.icons.info;
            const typeLabel = notificationConfig.i18n[level] || level;
            const color = colorMap[level] || '#17a2b8';
            const msg = log.message || '(No message)';
            const timestampStr = (log.date && log.time)
                ? `${formatDate(log.date)} ${log.time}`
                : (log.timestamp ? `${formatDate(log.timestamp)} ${new Date(log.timestamp).toLocaleTimeString()}` : '');

            return `
                <div style="background:#f8f9fa; border-radius:6px; padding:12px 16px; margin-bottom:10px; border-left:4px solid ${color}; transition:all .2s;"
                     onmouseover="this.style.background='#e9ecef'; this.style.transform='translateX(-2px)'"
                     onmouseout="this.style.background='#f8f9fa'; this.style.transform='translateX(0)'">
                    <div style="display:flex; align-items:flex-start; gap:10px;">
                        <div style="font-size:18px; color:${color}; font-weight:bold; flex-shrink:0;">${icon}</div>
                        <div style="flex:1;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <div style="font-size:11px; font-weight:600; text-transform:uppercase; color:${color}; letter-spacing:.5px;">${typeLabel}</div>
                                <div style="font-size:11px; color:#666;">${timestampStr}</div>
                            </div>
                            <div style="font-size:13px; color:#333; line-height:1.4; word-wrap:break-word;">${msg}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function showNotificationsModal(editor) {
        let allLogs = [];
        let currentPage = 1;
        let fromDate = getTodayDate();
        let toDate = getTodayDate();
        let selectedLevel = 'all';

        const renderModal = () => {
            const filteredLogs = selectedLevel === 'all'
                ? allLogs
                : allLogs.filter(l => normalizeLevel(l.type || l.level || 'info') === selectedLevel);
            const totalPages = Math.ceil(filteredLogs.length / notificationConfig.recordsPerPage);
            const notificationsList = renderNotificationLogs(filteredLogs, currentPage, totalPages);

            const modalContent = `
                <div class="date-filter-container">
                <div class="date-filter-group">
                    <label class="date-filter-label">From Date</label>
                    <input type="date" id="filter-from-date" class="date-filter-input" value="${fromDate}">
                </div>
                <div class="date-filter-group">
                    <label class="date-filter-label">To Date</label>
                    <input type="date" id="filter-to-date" class="date-filter-input" value="${toDate}">
                </div>

                <!-- NEW: Level filter -->
                <div class="date-filter-group">
                    <label class="date-filter-label">Level</label>
                    <select id="level-filter-select" class="date-filter-input">
                    <option value="all" ${selectedLevel === 'all' ? 'selected' : ''}>All</option>
                    <option value="info" ${selectedLevel === 'info' ? 'selected' : ''}>Info</option>
                    <option value="warning" ${selectedLevel === 'warning' ? 'selected' : ''}>Warning</option>
                    <option value="error" ${selectedLevel === 'error' ? 'selected' : ''}>Error</option>
                    <option value="success" ${selectedLevel === 'success' ? 'selected' : ''}>Success</option>
                    <option value="debug" ${selectedLevel === 'debug' ? 'selected' : ''}>Debug</option>
                    <option value="event" ${selectedLevel === 'event' ? 'selected' : ''}>Event</option>
                    </select>
                </div>

                <button id="submit-filter-btn" class="date-filter-button submit">Submit</button>
                <button id="reset-filter-btn" class="date-filter-button reset">Reset</button>
                <button id="export-excel-btn" class="date-filter-button submit">Export Excel</button>
                </div>

                <div style="max-height: 400px; overflow-y: auto; padding: 10px;">
                ${notificationsList}
                </div>

                ${totalPages > 1 ? `
                <div class="pagination-container">
                    <button id="prev-page-btn" class="pagination-button" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
                    <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
                    <button id="next-page-btn" class="pagination-button" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
                </div>` : ''}

                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0; text-align: center;">
                <div style="font-size: 12px; color: #666;">
                    Total: ${filteredLogs.length} notification${filteredLogs.length !== 1 ? 's' : ''}
                </div>
                </div>`;

            editor.Modal.setContent(modalContent);
            attachEventListeners(filteredLogs, totalPages);
            attachExportEventListener(filteredLogs);
        };


        const attachFilterEventListeners = () => {
            setTimeout(() => {
                const submitBtn = document.getElementById('submit-filter-btn');
                const resetBtn = document.getElementById('reset-filter-btn');
                const fromDateInput = document.getElementById('filter-from-date');
                const toDateInput = document.getElementById('filter-to-date');

                if (submitBtn) {
                    submitBtn.addEventListener('click', async () => {
                        const nextFrom = fromDateInput.value && fromDateInput.value.trim();
                        const nextTo = toDateInput.value && toDateInput.value.trim();
                        fromDate = nextFrom || '';
                        toDate = nextTo || '';
                        currentPage = 1;
                        await loadLogs();
                    });
                }

                if (resetBtn) {
                    resetBtn.addEventListener('click', async () => {
                        fromDate = '';
                        toDate = '';
                        if (fromDateInput) fromDateInput.value = '';
                        if (toDateInput) toDateInput.value = '';
                        currentPage = 1;
                        await loadLogs();
                    });
                }
            }, 100);
        };


        function attachExportEventListener(filteredLogs = []) {
            const exportBtn = document.getElementById('export-excel-btn');
            if (!exportBtn) return;

            exportBtn.addEventListener('click', async () => {
                const rows = Array.isArray(filteredLogs) ? filteredLogs : [];
                if (!rows.length) {
                    alert('No notifications to export.');
                    return;
                }

                try {
                    await ensureXlsxLoaded();
                } catch (e) {
                    console.error("XLSX load failed:");
                    alert("Excel library failed to load. Please check network/CDN or include xlsx.full.min.js.");
                    return;
                }

                const wsData = rows.map((log, index) => {
                    const typeValue = (normalizeLevel(log.type || log.level || 'info')).toUpperCase();
                    const dateValue = log.date ? log.date : (log.timestamp ? formatDate(log.timestamp) : '');
                    const timeValue = log.time ? log.time : (log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '');
                    const messageValue = log.message || '(No message)';
                    return { SNo: index + 1, Type: typeValue, Message: messageValue, Date: dateValue, Time: timeValue };
                });

                try {
                    const ws = XLSX.utils.json_to_sheet(wsData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Notifications");
                    const filename = `notifications_${getTodayDate()}.xlsx`;
                    XLSX.writeFile(wb, filename);
                    console.log(`Excel exported: ${filename}`);
                } catch (err) {
                    console.error("Excel export failed:");
                    alert("Failed to export Excel");
                }
            });
        }

        const attachEventListeners = (filteredLogs, totalPages) => {
            setTimeout(() => {
                const prevBtn = document.getElementById('prev-page-btn');
                const nextBtn = document.getElementById('next-page-btn');
                const levelSelect = document.getElementById('level-filter-select');

                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        if (currentPage > 1) {
                            currentPage--;
                            renderModal();
                        }
                    });
                }

                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        if (currentPage < totalPages) {
                            currentPage++;
                            renderModal();
                        }
                    });
                }

                if (levelSelect) {
                    levelSelect.addEventListener('change', () => {
                        selectedLevel = levelSelect.value || 'all';
                        currentPage = 1;
                        renderModal();
                    });
                }

                attachFilterEventListeners();
            }, 100);
        };

        const loadLogs = async () => {
            try {
                editor.Modal.setTitle('📬 Notifications');
                const skeleton = '<div class="loading-spinner">Loading...</div>';
                editor.Modal.setContent(skeleton);
                allLogs = await fetchLogsFromBackend(fromDate, toDate);
                renderModal();
            } catch (error) {
                const errMsg = 'Failed to load notifications. Please try again.';
                const wrap = (m) => `<div class="error-message">${m}</div>`;
                editor.Modal.setContent(wrap(errMsg));
            }
        };

        editor.Modal.setTitle('📬 Notifications');
        editor.Modal.open();
        await loadLogs();
    }

    editor.Commands.add('toggle-notifications', { run(ed) { showNotificationsModal(ed); } });
    editor.Commands.add('notifications:add', { run(ed, s, opts = {}) { addNotification(opts); } });
    editor.Commands.add('notifications:remove', { run(ed, s, opts = {}) { if (opts.id) removeNotification(opts.id); } });
    editor.Commands.add('notifications:clear', { run() { clearNotifications(); } });

    editor.on("load", () => {
        const devicesPanel = editor.Panels.getPanel("devices-c");
        if (devicesPanel) {
            const buttons = devicesPanel.get("buttons");
            buttons.add([{
                id: 'notifications-panel-btn',
                className: "fa fa-bell notifications-btn",
                command: "toggle-notifications",
                attributes: { title: "Notifications" }
            }]);
        }
    });

    setTimeout(() => {
        const btnEl = document.querySelector('.notifications-btn');
        if (btnEl && !btnEl.querySelector('.notifications-badge')) {
            const badge = document.createElement('span');
            badge.className = 'notifications-badge';
            badge.style.display = 'none';
            btnEl.appendChild(badge);
        }
    }, 100);

    editor.Notifications = {
        add: addNotification,
        remove: removeNotification,
        clear: clearNotifications,
        getAll: () => [...notifications],
        get: (id) => notifications.find(n => n.id === id)
    };

    (function exposeDesignerLogger() {
        let DEFAULT_CONTEXT = {};
        const emit = (level, message, ctx = {}) => {
            const merged = Object.assign({}, DEFAULT_CONTEXT, ctx);
            try {
                editor.Notifications.add({ type: level, message: (typeof message === 'string' ? message : JSON.stringify(message, null, 2)), context: merged, timeout: level === 'error' ? 0 : notificationConfig.timeout });
            } catch (e) {
                try { console.log(`[DesignerLogger:${level}]`, message, merged); } catch (err) { }
            }
        };

        const api = {
            log: (m, c) => emit('info', m, c),
            info: (m, c) => emit('info', m, c),
            warn: (m, c) => emit('warning', m, c),
            error: (m, c) => emit('error', m, c),
            success: (m, c) => emit('success', m, c),
            debug: (m, c) => emit('debug', m, c),
            event: (name, c = {}) => emit('event', `EVENT: ${name}`, c),
            try(fn, ctx = {}, onError) {
                try { return fn(); }
                catch (err) {
                    emit('error', err && err.stack ? err.stack : String(err), ctx);
                    if (onError) onError(err);
                }
            },
            setDefaultContext(ctx) { DEFAULT_CONTEXT = ctx || {}; }
        };

        window.DesignerLogger = api;

        try {
            if (!window.__designerLogger_consoleHooked) {
                window.__designerLogger_consoleHooked = true;
                const origError = console.error && console.error.bind(console) || function () { };
                const origWarn = console.warn && console.warn.bind(console) || function () { };

                console.error = function (...args) {
                    try { origError.apply(console, args); } catch (e) { }
                    try {
                        const combined = args.map(a => {
                            if (a instanceof Error) return `${a.message}\n${a.stack || ''}`;
                            try { return typeof a === 'string' ? a : JSON.stringify(a); } catch (e) { return String(a); }
                        }).join(' ');
                        window.DesignerLogger.error(combined, { source: 'console.error' });
                    } catch (e) {}
                };

                console.warn = function (...args) {
                    try { origWarn.apply(console, args); } catch (e) { }
                    try {
                        const combined = args.map(a => {
                            if (a instanceof Error) return `${a.message}\n${a.stack || ''}`;
                            try { return typeof a === 'string' ? a : JSON.stringify(a); } catch (e) { return String(a); }
                        }).join(' ');
                        window.DesignerLogger.warn(combined, { source: 'console.warn' });
                    } catch (e) {}
                };
            }
        } catch (e) {
            console.warn('Failed to hook console:');
        }
    })();

    return { add: addNotification, remove: removeNotification, clear: clearNotifications };
}

window.initNotificationsPlugin = initNotificationsPlugin;