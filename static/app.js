document.addEventListener("DOMContentLoaded", () => {
    // ═══ AUTH & SETUP ═══
    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('user_name');
    
    if (!userId && !window.location.href.includes('login.html') && !window.location.href.includes('register.html')) {
        window.location.href = 'login.html';
        return;
    }
    
    if (document.getElementById('welcomeUser')) {
        document.getElementById('welcomeUser').textContent = `Welcome ${userName || 'Farmer'} to Gram Gyan Setu`;
        document.getElementById('profileName').textContent = userName || 'Guest User';
        
        const bal = localStorage.getItem('wallet_bal') || Math.floor(Math.random() * 5000 + 1000);
        localStorage.setItem('wallet_bal', bal);
        if (document.getElementById('profBal')) {
            document.getElementById('profBal').textContent = `₹${parseInt(bal).toLocaleString('en-IN')}`;
        }
    }

    // ═══ LANGUAGE TOGGLE ═══
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('change', () => {
            const lang = langToggle.value;
            if (window.applyTranslations) {
                window.applyTranslations(lang);
                let welcomeText = "Welcome to Gram Gyan Setu";
                if (lang === 'hi') welcomeText = "ग्राम ज्ञान सेतु में आपका स्वागत है";
                if (lang === 'mr') welcomeText = "ग्राम ज्ञान सेतू मध्ये आपले स्वागत आहे";
                if (document.getElementById('welcomeUser')) {
                    document.getElementById('welcomeUser').textContent = `${userName || ''}, ${welcomeText}`;
                }
            }
        });
    }

    // ═══ NAVIGATION ═══
    const navItems = document.querySelectorAll('.nav-links li');
    const views = document.querySelectorAll('.content-view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const targetId = 'view-' + item.getAttribute('data-target');
            views.forEach(view => {
                if (view.id === targetId) {
                    view.classList.remove('hidden');
                    view.style.animation = 'none';
                    view.offsetHeight; // trigger reflow
                    view.style.animation = 'fadeSlideUp 0.35s ease-out';
                } else {
                    view.classList.add('hidden');
                }
            });
        });
    });

    // ═══ TOAST NOTIFICATIONS ═══
    function showToast(message, type = 'success') {
        const existing = document.querySelector('.app-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'app-toast';
        const bgMap = { success: '#059669', error: '#dc2626', info: '#2563eb' };
        toast.style.background = bgMap[type] || bgMap.success;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('show'));
        });
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 350);
        }, 3000);
    }

    // ═══ CART (PERSISTED IN LOCALSTORAGE) ═══
    let cart = JSON.parse(localStorage.getItem('ggs_cart') || '[]');
    
    function updateCartCount() {
        const el = document.getElementById('cartCount');
        if (el) el.textContent = cart.length;
    }
    updateCartCount();
    
    window.addToCart = function(id, name, price) {
        cart.push({ id, name, price });
        localStorage.setItem('ggs_cart', JSON.stringify(cart));
        updateCartCount();
        showToast(`✓ ${name} added to cart`, 'success');
    };

    // ═══ DASHBOARD: Farm Stats (60s polling) ═══
    let lastFarmData = null;
    
    function loadRealtimeFarmStats() {
        if (!document.getElementById('farmStatsWidget')) return;
        
        fetch('/api/farm/stats')
            .then(r => r.json())
            .then(data => {
                if (data.status === 'success') {
                    const w = data.data;
                    
                    // Only update DOM if data actually changed
                    const dataKey = JSON.stringify(w);
                    if (dataKey === lastFarmData) return;
                    lastFarmData = dataKey;
                    
                    const elIns = document.getElementById('valInsect');
                    elIns.textContent = `${w.insect_level}%`;
                    elIns.style.color = w.insect_level > 50 ? '#ef4444' : (w.insect_level > 25 ? '#f59e0b' : '#10b981');
                    
                    const elWater = document.getElementById('valWater');
                    elWater.textContent = `${w.water_level}%`;
                    elWater.style.color = (w.water_level < 30 || w.water_level > 85) ? '#ef4444' : '#10b981';
                    
                    document.getElementById('valClay').textContent = `${w.clay_composition}%`;
                    document.getElementById('valWeather').textContent = `${w.weather}`;
                }
            })
            .catch(() => {}); // Silently fail, keep last values
    }

    // ═══ DASHBOARD: Insights ═══
    function loadInsights() {
        const container = document.getElementById('insightsContainer');
        if (!container) return;
        
        fetch('/api/insights')
            .then(r => r.json())
            .then(data => {
                if (data.status !== 'success' || !data.data.length) return;
                
                const frag = document.createDocumentFragment();
                data.data.forEach(insight => {
                    const div = document.createElement('div');
                    div.className = `insight-card insight-${insight.type}`;
                    div.innerHTML = `<h4>${insight.title}</h4><p>${insight.body}</p>`;
                    frag.appendChild(div);
                });
                container.innerHTML = '';
                container.appendChild(frag);
            })
            .catch(() => {});
    }

    // ═══ DASHBOARD: Advisories ═══
    function loadAdvisories() {
        const container = document.getElementById('advisoryContainer');
        if (!container || container.children.length > 0) return; // Only render once
        
        fetch('/api/advisories')
            .then(r => r.json())
            .then(data => {
                if (data.status !== 'success') return;
                
                const images = [
                    'https://images.unsplash.com/photo-1592982537447-6f23f33ccba3?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&q=80&w=800'
                ];
                
                const frag = document.createDocumentFragment();
                data.data.forEach((adv, i) => {
                    const card = document.createElement('div');
                    card.className = 'card fade-in';
                    card.style.animationDelay = `${i * 0.1}s`;
                    card.innerHTML = `
                        <img class="card-img" src="${images[i % images.length]}" alt="${adv.title}" loading="lazy">
                        <div class="card-body">
                            <h3>${adv.title}</h3>
                            <p>${adv.content}</p>
                        </div>`;
                    frag.appendChild(card);
                });
                container.appendChild(frag);
            });
    }

    // ═══ MARKETPLACE ═══
    function loadMarketplace(query = "") {
        const container = document.getElementById('marketContainer');
        if (!container) return;
        
        container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="loading-spinner"></div><p>Loading marketplace...</p></div>';
        
        fetch('/api/marketplace?search=' + encodeURIComponent(query))
            .then(r => r.json())
            .then(data => {
                container.innerHTML = '';
                if (!data.data || data.data.length === 0) {
                    container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><span class="empty-icon">🔍</span><p>No products found. Try a different search.</p></div>';
                    return;
                }
                
                const frag = document.createDocumentFragment();
                data.data.forEach((prod, idx) => {
                    const card = document.createElement('div');
                    card.className = 'product-card fade-in';
                    card.style.animationDelay = `${idx * 0.04}s`;
                    const safeName = prod.name.replace(/'/g, "\\'");
                    card.innerHTML = `
                        <img src="${prod.image}" alt="${prod.name}" loading="lazy">
                        <div class="product-body">
                            <span class="product-category">${prod.category}</span>
                            <h4>${prod.name}</h4>
                            <p class="product-meta">📍 ${prod.seller}</p>
                            <div class="product-price">₹${prod.price.toLocaleString('en-IN')}</div>
                            <button class="btn btn-primary" style="width:100%;" onclick="addToCart(${prod.id}, '${safeName}', ${prod.price})">🛒 Add to Cart</button>
                        </div>`;
                    frag.appendChild(card);
                });
                container.appendChild(frag);
            })
            .catch(() => {
                container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><span class="empty-icon">⚠️</span><p>Failed to load marketplace. Please refresh.</p></div>';
            });
    }

    const marketSearchBtn = document.getElementById('marketSearchBtn');
    const marketSearchInput = document.getElementById('marketSearchInput');
    if (marketSearchBtn) marketSearchBtn.addEventListener('click', () => loadMarketplace(marketSearchInput.value));
    if (marketSearchInput) marketSearchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); loadMarketplace(marketSearchInput.value); } });

    // Cart Checkout
    const viewCartBtn = document.getElementById('viewCartBtn');
    const checkoutArea = document.getElementById('checkoutArea');
    if (viewCartBtn) {
        viewCartBtn.addEventListener('click', () => {
            if (cart.length === 0) { showToast('Cart is empty. Add items first!', 'info'); return; }
            checkoutArea.classList.remove('hidden');
            checkoutArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const total = cart.reduce((s, item) => s + item.price, 0);
            document.getElementById('cartSummary').innerHTML = `<strong>Items:</strong> ${cart.length} &nbsp;|&nbsp; <strong>Total:</strong> ₹${total.toLocaleString('en-IN')}`;
        });
    }

    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', () => {
            const total = cart.reduce((s, item) => s + item.price, 0);
            placeOrderBtn.disabled = true;
            placeOrderBtn.textContent = 'Processing...';
            
            fetch('/api/order', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: parseInt(userId), total, payment_method: document.getElementById('paymentMethod').value })
            })
            .then(r => r.json())
            .then(data => {
                showToast('✓ ' + data.message, 'success');
                cart = [];
                localStorage.setItem('ggs_cart', '[]');
                updateCartCount();
                checkoutArea.classList.add('hidden');
            })
            .catch(() => showToast('Order failed. Please retry.', 'error'))
            .finally(() => { placeOrderBtn.disabled = false; placeOrderBtn.textContent = 'Place Order'; });
        });
    }

    // ═══ EDUCATION ═══
    function loadEducation(searchQuery = "", category = "All") {
        const container = document.getElementById('educationContainer');
        if (!container) return;
        
        let url = '/api/education';
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (category && category !== "All") params.append('category', category);
        if (params.toString()) url += '?' + params.toString();

        fetch(url).then(r => r.json()).then(data => {
            container.innerHTML = "";
            if (data.data.length === 0) {
                container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><span class="empty-icon">📚</span><p>No modules found matching your criteria.</p></div>';
                return;
            }
            
            const images = [
                'https://images.unsplash.com/photo-1595844730298-b960fad97351?auto=format&fit=crop&q=80&w=800',
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
                'https://images.unsplash.com/photo-1500937386664-56d1dfefcb03?auto=format&fit=crop&q=80&w=800',
                'https://images.unsplash.com/photo-1592982537447-6f23f33ccba3?auto=format&fit=crop&q=80&w=800'
            ];
            
            const frag = document.createDocumentFragment();
            data.data.forEach((edu, i) => {
                const img = images[i % images.length];
                const desc = edu.description || 'Interactive localized learning path.';
                const cat = edu.category || 'General';
                const card = document.createElement('div');
                card.className = 'edu-card fade-in';
                card.style.animationDelay = `${i * 0.06}s`;
                card.innerHTML = `
                    <div class="edu-img" style="background-image:url('${img}')">
                        <span class="edu-badge">${edu.type.toUpperCase()}</span>
                        <span class="edu-cat">${cat}</span>
                        <div class="edu-play" onclick="openVideo('${edu.title.replace(/'/g, "\\'")}')">▶</div>
                    </div>
                    <div class="edu-body">
                        <h3>${edu.title}</h3>
                        <p>${desc}</p>
                        <button class="btn btn-primary" onclick="openVideo('${edu.title.replace(/'/g, "\\'")}')" style="width:100%;background:var(--accent-dark);">▶ Watch Now</button>
                    </div>`;
                frag.appendChild(card);
            });
            container.appendChild(frag);
        });
    }
    
    const eduSearchBtn = document.getElementById('eduSearchBtn');
    const eduSearchInput = document.getElementById('eduSearchInput');
    const eduCategoryFilter = document.getElementById('eduCategoryFilter');
    
    function triggerEduSearch() {
        loadEducation(eduSearchInput?.value || '', eduCategoryFilter?.value || 'All');
    }
    
    if (eduSearchBtn) eduSearchBtn.addEventListener('click', triggerEduSearch);
    if (eduSearchInput) eduSearchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); triggerEduSearch(); } });
    if (eduCategoryFilter) eduCategoryFilter.addEventListener('change', triggerEduSearch);

    // ═══ VIDEO PLAYER ═══
    window.openVideo = function(title) {
        document.getElementById('videoTitle').textContent = "Now Playing: " + title;
        document.getElementById('youtubeFrame').src = "https://www.youtube.com/embed/p1o1Z0U752U?autoplay=1";
        document.getElementById('videoModal').classList.remove('hidden');
    };
    const closeVideoBtn = document.getElementById('closeVideoBtn');
    if (closeVideoBtn) closeVideoBtn.addEventListener('click', () => {
        document.getElementById('videoModal').classList.add('hidden');
        document.getElementById('youtubeFrame').src = "";
    });

    // ═══ INIT DASHBOARD ═══
    if (document.getElementById('farmStatsWidget')) {
        loadRealtimeFarmStats();
        loadInsights();
        loadAdvisories();
        loadMarketplace();
        loadEducation();
        // 60s polling instead of 10s — with change detection
        setInterval(loadRealtimeFarmStats, 60000);
        setInterval(loadInsights, 120000);
    }

    // ═══ PESTICIDE RISK ═══
    const riskForm = document.getElementById('riskForm');
    if (riskForm) {
        riskForm.addEventListener('submit', e => {
            e.preventDefault();
            const btn = document.getElementById('riskSubmitBtn');
            btn.disabled = true;
            btn.textContent = 'Calculating...';
            
            const chemical = document.getElementById('chemName').value;
            const dosage = document.getElementById('chemDosage').value;
            const crop = document.getElementById('chemCrop').value;
            
            fetch(`/api/pesticide-risk?chemical=${encodeURIComponent(chemical)}&dosage=${encodeURIComponent(dosage)}&crop=${encodeURIComponent(crop)}`)
                .then(r => r.json())
                .then(data => {
                    const res = data.data;
                    const resDiv = document.getElementById('riskResult');
                    resDiv.className = 'risk-result risk-' + res.category;
                    resDiv.innerHTML = `<strong>Risk Score: ${res.score}/100</strong><br>Category: ${res.category}<br><br>${res.recommendation}`;
                    resDiv.classList.remove('hidden');
                })
                .catch(() => showToast('Failed to calculate risk score.', 'error'))
                .finally(() => { btn.disabled = false; btn.textContent = 'Calculate Risk Score'; });
        });
    }

    // ═══ CHAT (TEXT) ═══
    const chatForm = document.getElementById('chatForm');
    const responseArea = document.getElementById('aiResponseArea');
    const synth = window.speechSynthesis;
    
    function addChatMessage(sender, text, isUser) {
        if (!responseArea) return;
        // Clear initial placeholder
        if (responseArea.querySelector('[data-i18n="aiWait"]')) {
            responseArea.innerHTML = '';
        }
        const msg = document.createElement('div');
        msg.className = `chat-msg ${isUser ? 'chat-msg-user' : 'chat-msg-ai'}`;
        msg.innerHTML = `<strong>${sender}</strong><span>${text}</span>`;
        responseArea.appendChild(msg);
        responseArea.scrollTop = responseArea.scrollHeight;
    }

    if (chatForm) {
        chatForm.addEventListener('submit', e => {
            e.preventDefault();
            const inputField = document.getElementById('chatInput');
            const query = inputField.value.trim();
            if (!query) return;
            
            addChatMessage('You', query, true);
            inputField.value = '';
            
            const lang = langToggle ? langToggle.value : 'en';
            
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, language: lang })
            })
            .then(r => r.json())
            .then(data => {
                if (data.status === 'success') {
                    addChatMessage('Gram Gyan AI', data.reply, false);
                    const utterance = new SpeechSynthesisUtterance(data.reply);
                    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-US';
                    utterance.rate = 0.95;
                    synth.speak(utterance);
                }
            })
            .catch(() => addChatMessage('System', 'Failed to connect to AI backend.', false));
        });
    }

    // ═══ VOICE ASSISTANT ═══
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        let recognition = null;
        let isVoiceActive = false;
        
        function setSiriState(state, text) {
            const siriStatus = document.getElementById('siriStatus');
            const siriText = document.getElementById('siriText');
            
            const stateMap = {
                listening: { label: '● LISTENING', color: 'rgba(16,185,129,0.9)', fallback: 'Speak now...' },
                processing: { label: '◉ PROCESSING', color: 'rgba(245,158,11,0.9)', fallback: 'Analyzing...' },
                responding: { label: '▶ RESPONDING', color: 'rgba(59,130,246,0.9)', fallback: 'Here is my answer:' },
                error: { label: '✕ ERROR', color: 'rgba(239,68,68,0.9)', fallback: 'Something went wrong.' }
            };
            
            const s = stateMap[state] || stateMap.listening;
            if (siriStatus) { siriStatus.innerHTML = s.label; siriStatus.style.color = s.color; }
            if (siriText) siriText.textContent = text || s.fallback;
        }
        
        function stopVoiceSession() {
            isVoiceActive = false;
            voiceBtn.classList.remove('recording');
            const overlay = document.getElementById('siriOverlay');
            if (overlay) overlay.classList.add('hidden');
            if (recognition) { try { recognition.abort(); } catch(e) {} }
            synth.cancel();
        }
        
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;
            
            recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) finalTranscript += transcript;
                    else interimTranscript += transcript;
                }
                
                const siriTranscript = document.getElementById('siriTranscript');
                if (interimTranscript && siriTranscript) siriTranscript.textContent = `"${interimTranscript}"`;
                
                if (finalTranscript) {
                    if (siriTranscript) siriTranscript.textContent = `"${finalTranscript}"`;
                    setSiriState('processing');
                    addChatMessage('You (Voice)', finalTranscript, true);
                    
                    const lang = langToggle ? langToggle.value : 'en';
                    fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: finalTranscript, language: lang })
                    })
                    .then(r => r.json())
                    .then(data => {
                        if (data.status === 'success') {
                            const shortReply = data.reply.length > 120 ? data.reply.substring(0, 120) + '...' : data.reply;
                            setSiriState('responding', shortReply);
                            addChatMessage('Gram Gyan AI', data.reply, false);
                            
                            const utterance = new SpeechSynthesisUtterance(data.reply);
                            utterance.rate = 0.95;
                            utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-US';
                            utterance.onend = () => setTimeout(() => stopVoiceSession(), 600);
                            synth.speak(utterance);
                        }
                    })
                    .catch(() => {
                        setSiriState('error', 'Network error. Please try again.');
                        setTimeout(() => stopVoiceSession(), 2000);
                    });
                }
            };
            
            recognition.onerror = (event) => {
                const errorMsgs = {
                    'no-speech': 'No speech detected. Tap mic to retry.',
                    'not-allowed': 'Microphone access denied.',
                    'network': 'Network error. Check connection.'
                };
                setSiriState('error', errorMsgs[event.error] || 'Voice recognition error.');
                setTimeout(() => stopVoiceSession(), 2500);
            };
            
            recognition.onend = () => {
                if (isVoiceActive && !synth.speaking) {
                    const siriStatus = document.getElementById('siriStatus');
                    if (siriStatus && siriStatus.textContent.includes('LISTENING')) {
                        setSiriState('error', 'No speech detected.');
                        setTimeout(() => stopVoiceSession(), 2000);
                    }
                }
            };
        }
        
        voiceBtn.addEventListener('click', () => {
            if (!recognition) { alert("Voice not supported. Use Chrome or Edge, or use the text chat."); return; }
            if (isVoiceActive) { stopVoiceSession(); return; }
            
            isVoiceActive = true;
            voiceBtn.classList.add('recording');
            
            // Navigate to advisory
            document.querySelector('.nav-links li[data-target="agri-advice"]').click();
            
            // Show Siri overlay
            document.getElementById('siriOverlay')?.classList.remove('hidden');
            
            const lang = langToggle ? langToggle.value : 'en';
            recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-US';
            setSiriState('listening', lang === 'hi' ? 'बोलिए...' : lang === 'mr' ? 'बोला...' : 'Speak now...');
            
            try { recognition.start(); }
            catch(e) { setSiriState('error', 'Could not start mic.'); setTimeout(() => stopVoiceSession(), 2000); }
        });
        
        document.getElementById('siriDismissBtn')?.addEventListener('click', () => stopVoiceSession());
    }

    // ═══ GLOBAL CHAT WIDGET ═══
    const globalChatBtn = document.getElementById('globalChatBtn');
    const globalChatWidget = document.getElementById('globalChatWidget');
    const closeGlobalChat = document.getElementById('closeGlobalChat');
    const globalChatForm = document.getElementById('globalChatForm');
    const globalChatBody = document.getElementById('globalChatBody');

    if (globalChatBtn && globalChatWidget) {
        globalChatBtn.addEventListener('click', () => globalChatWidget.classList.toggle('hidden'));
        closeGlobalChat?.addEventListener('click', () => globalChatWidget.classList.add('hidden'));
        
        globalChatForm?.addEventListener('submit', e => {
            e.preventDefault();
            const input = document.getElementById('globalChatInput');
            const query = input.value.trim();
            if (!query) return;
            
            const userMsg = document.createElement('div');
            userMsg.className = 'chat-msg chat-msg-user';
            userMsg.innerHTML = `<strong>You</strong>${query}`;
            globalChatBody.appendChild(userMsg);
            globalChatBody.scrollTop = globalChatBody.scrollHeight;
            input.value = '';
            
            const lang = langToggle ? langToggle.value : 'en';
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, language: lang })
            })
            .then(r => r.json())
            .then(data => {
                if (data.status === 'success') {
                    const aiMsg = document.createElement('div');
                    aiMsg.className = 'chat-msg chat-msg-ai';
                    aiMsg.innerHTML = `<strong>Gram Gyan AI</strong>${data.reply}`;
                    globalChatBody.appendChild(aiMsg);
                    globalChatBody.scrollTop = globalChatBody.scrollHeight;
                    
                    const utterance = new SpeechSynthesisUtterance(data.reply);
                    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-US';
                    synth.speak(utterance);
                }
            })
            .catch(() => {
                const errMsg = document.createElement('div');
                errMsg.className = 'chat-msg';
                errMsg.style.background = '#fef2f2';
                errMsg.style.borderLeft = '3px solid #ef4444';
                errMsg.innerHTML = '<strong>Error</strong>Failed to connect to AI backend.';
                globalChatBody.appendChild(errMsg);
            });
        });
    }

    // ═══ AI VISION SCANNER ═══
    const scannerBox = document.getElementById('scannerBox');
    const runScanBtn = document.getElementById('runScanBtn');
    const scanPreview = document.getElementById('scanPreview');
    const scannerLine = document.getElementById('scannerLine');
    const scannerText = document.getElementById('scannerText');
    const scanResult = document.getElementById('scanResult');

    if (scannerBox) {
        const actualInput = document.getElementById('actualImageInput');
        if (actualInput) {
            actualInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    scannerText.textContent = "Processing...";
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        setTimeout(() => {
                            scanPreview.src = ev.target.result;
                            scanPreview.classList.remove('hidden');
                            scannerText.classList.add('hidden');
                            runScanBtn.disabled = false;
                        }, 300);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        runScanBtn.addEventListener('click', () => {
            runScanBtn.textContent = "Scanning...";
            runScanBtn.disabled = true;
            scannerLine.classList.remove('hidden');
            scannerLine.style.animation = "scanAnim 1.2s infinite linear";
            
            setTimeout(() => {
                fetch('/api/scan-crop')
                    .then(r => r.json())
                    .then(data => {
                        scannerLine.classList.add('hidden');
                        scannerLine.style.animation = "none";
                        runScanBtn.textContent = "Run Deep Learning Scan";
                        runScanBtn.disabled = false;
                        
                        if (data.status === 'success') {
                            scanResult.innerHTML = `
                                <h3 style="color:#ef4444;margin:0 0 8px;">🦠 Detected: ${data.disease}</h3>
                                <p style="font-weight:700;color:var(--accent-dark);margin-bottom:8px;">Confidence: ${data.confidence}</p>
                                <p><strong>Symptoms:</strong> ${data.symptoms}</p>
                                <hr style="border:0;border-top:1px solid var(--border-light);margin:14px 0;">
                                <p><strong>Action Plan:</strong> ${data.action}</p>`;
                            scanResult.classList.remove('hidden');
                            
                            const utt = new SpeechSynthesisUtterance("Warning. " + data.disease + " detected. " + data.action);
                            synth.speak(utt);
                        }
                    });
            }, 2200);
        });
    }

    // ═══ GOVT SUBSIDY ═══
    const subsidyForm = document.getElementById('subsidyForm');
    if (subsidyForm) {
        subsidyForm.addEventListener('submit', e => {
            e.preventDefault();
            const btn = document.getElementById('subsidySubmitBtn');
            btn.disabled = true;
            btn.textContent = 'Evaluating...';
            
            fetch('/api/subsidy', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    land_area: parseFloat(document.getElementById('landArea').value),
                    state: document.getElementById('farmState').value,
                    gender: document.getElementById('farmGender').value,
                    social_category: document.getElementById('farmSocialCategory').value
                })
            })
            .then(r => r.json())
            .then(data => {
                const result = document.getElementById('subsidyResult');
                result.classList.remove('hidden');
                result.innerHTML = '<h3 style="margin-bottom:12px;color:var(--primary-dark);">✅ Eligible Schemes</h3>';
                
                data.schemes.forEach((s, idx) => {
                    const card = document.createElement('div');
                    card.className = 'subsidy-card';
                    card.style.animationDelay = `${0.1 * idx}s`;
                    card.innerHTML = `<h4>${s.name}</h4><div class="subsidy-amount">${s.amount}</div><p>${s.desc}</p>`;
                    result.appendChild(card);
                });
            })
            .catch(() => showToast('Failed to evaluate eligibility.', 'error'))
            .finally(() => { btn.disabled = false; btn.textContent = 'Evaluate Eligibility'; });
        });
    }

    // ═══ LOGOUT ═══
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        window.location.href = 'login.html';
    });
});
