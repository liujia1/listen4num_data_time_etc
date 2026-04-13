(function () {
    'use strict';

    var currentMode = 'number';
    var speechRate = 0.85;
    var repeatCount = 1;
    var swiper = null;
    var selectedVoice = null;
    var isSpeaking = false;
    var useRandomVoice = false;
    var availableVoices = [];

    var MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    function init() {
        initVoices();
        initSwiper();
        bindEvents();
        addSlide();
        addSlide();
    }

    function initVoices() {
        var voiceSelect = document.getElementById('voiceSelect');
        
        function populateVoices() {
            var voices = speechSynthesis.getVoices();
            console.log('Available voices:', voices.length);
            
            if (voices.length > 0 && voiceSelect) {
                voiceSelect.innerHTML = '';
                
                // 筛选英文语音
                var englishVoices = voices.filter(function(v) {
                    return v.lang.startsWith('en');
                });
                
                console.log('English voices:', englishVoices.length);
                
                if (englishVoices.length === 0) {
                    englishVoices = voices;
                }
                
                // 按优先级排序：Natural > Online > Microsoft > en-US > 其他
                var priorityOrder = [
                    { name: 'Natural', weight: 5 },
                    { name: 'Online', weight: 4 },
                    { name: 'Microsoft', weight: 3 },
                    { name: 'Google', weight: 2 }
                ];
                
                englishVoices.sort(function(a, b) {
                    var aScore = 0, bScore = 0;
                    
                    priorityOrder.forEach(function(p) {
                        if (a.name.includes(p.name)) aScore += p.weight;
                        if (b.name.includes(p.name)) bScore += p.weight;
                    });
                    
                    if (a.lang === 'en-US') aScore += 1;
                    if (b.lang === 'en-US') bScore += 1;
                    
                    return bScore - aScore;
                });
                
                // 保存所有可用语音
                availableVoices = englishVoices;
                
                // 添加一个默认选项
                var defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = '请选择发音人';
                voiceSelect.appendChild(defaultOption);
                
                // 添加所有语音选项
                englishVoices.forEach(function(voice) {
                    var option = document.createElement('option');
                    option.value = voice.name;
                    option.textContent = voice.name + ' (' + voice.lang + ')';
                    voiceSelect.appendChild(option);
                });
                
                // 自动选择最优语音
                if (englishVoices.length > 0) {
                    selectedVoice = englishVoices[0];
                    voiceSelect.value = selectedVoice.name;
                    console.log('Auto-selected voice:', selectedVoice.name);
                }
            } else if (voiceSelect) {
                voiceSelect.innerHTML = '<option value="">加载中... (' + voices.length + ')</option>';
            }
        }
        
        // 立即尝试加载
        populateVoices();
        
        // 监听语音列表变化事件
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = populateVoices;
        }
        
        // 多次延迟重试，确保浏览器已加载语音
        setTimeout(populateVoices, 100);
        setTimeout(populateVoices, 300);
        setTimeout(populateVoices, 500);
        setTimeout(populateVoices, 1000);
        
        voiceSelect.addEventListener('change', function() {
            var selectedVoiceName = voiceSelect.value;
            var voices = speechSynthesis.getVoices();
            if (selectedVoiceName) {
                selectedVoice = voices.find(function(v) {
                    return v.name === selectedVoiceName;
                });
                console.log('Selected voice:', selectedVoice);
            }
        });

        // 随机发音人开关
        var randomVoiceToggle = document.getElementById('randomVoiceToggle');
        randomVoiceToggle.addEventListener('change', function() {
            useRandomVoice = randomVoiceToggle.checked;
            console.log('Random voice:', useRandomVoice);
            
            // 当开启随机发音人时，立即为当前幻灯片随机选择一个发音人
            if (useRandomVoice && availableVoices.length > 0) {
                var randomIndex = Math.floor(Math.random() * availableVoices.length);
                selectedVoice = availableVoices[randomIndex];
                console.log('Random voice enabled, selected:', selectedVoice.name);
                // 更新发音人选择下拉框
                voiceSelect.value = selectedVoice.name;
            }
        });
    }

    function initSwiper() {
        swiper = new Swiper('#mainSwiper', {
            slidesPerView: 1.15,
            centeredSlides: true,
            spaceBetween: 16,
            speed: 350,
            touchAngle: 30,
            touchRatio: 0.8,
            resistanceRatio: 0.3,
            on: {
                slideChangeTransitionEnd: function () {
                    var activeIndex = swiper.activeIndex;
                    var totalSlides = swiper.slides.length;
                    if (activeIndex >= totalSlides - 1) {
                        addSlide();
                    }
                    // 切换幻灯片时，如果启用了随机发音人，则随机选择一个
                    if (useRandomVoice && availableVoices.length > 0) {
                        var randomIndex = Math.floor(Math.random() * availableVoices.length);
                        selectedVoice = availableVoices[randomIndex];
                        console.log('Slide changed, random voice selected:', selectedVoice.name);
                        // 更新发音人选择下拉框
                        var voiceSelect = document.getElementById('voiceSelect');
                        if (voiceSelect) {
                            voiceSelect.value = selectedVoice.name;
                        }
                    }
                }
            }
        });
    }

    function generateNumber() {
        return Math.floor(Math.random() * 10000) + 1;
    }

    function generateDate() {
        var year = 2000 + Math.floor(Math.random() * 27);
        var month = Math.floor(Math.random() * 12);
        var maxDay = new Date(year, month + 1, 0).getDate();
        var day = Math.floor(Math.random() * maxDay) + 1;
        return { year: year, month: month, day: day };
    }

    function generateTime() {
        var is24Hour = Math.random() < 0.5;
        var hour, minute, period;
        
        if (is24Hour) {
            hour = Math.floor(Math.random() * 24);
            minute = Math.floor(Math.random() * 60);
            period = null;
        } else {
            hour = Math.floor(Math.random() * 12) + 1;
            minute = Math.floor(Math.random() * 60);
            period = Math.random() < 0.5 ? 'AM' : 'PM';
        }
        
        return { hour: hour, minute: minute, period: period, is24Hour: is24Hour };
    }

    function formatDate(date) {
        return MONTHS[date.month] + ' ' + date.day + ', ' + date.year;
    }

    function formatTime(time) {
        var minuteStr = time.minute < 10 ? '0' + time.minute : time.minute;
        if (time.is24Hour) {
            var hourStr = time.hour < 10 ? '0' + time.hour : time.hour;
            return hourStr + ':' + minuteStr;
        }
        return time.hour + ':' + minuteStr + ' ' + time.period;
    }

    function toOrdinal(n) {
        var s = ['th', 'st', 'nd', 'rd'];
        var v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    function buildSpeechText(content) {
        if (content.type === 'number') {
            var num = content.value;
            if (num >= 1000) {
                return num.toLocaleString('en-US');
            }
            return String(num);
        }
        if (content.type === 'date') {
            return MONTHS[content.date.month] + ' ' + toOrdinal(content.date.day) + ', ' + content.date.year;
        }
        if (content.time.is24Hour) {
            var hourStr = content.time.hour < 10 ? 'oh ' + hourToWords(content.time.hour) : hourToWords(content.time.hour);
            var minuteWords = minuteToWords24(content.time.minute);
            return hourStr + ' ' + minuteWords;
        }
        var hourWords = hourToWords(content.time.hour);
        var minuteWords = minuteToWords(content.time.minute);
        return hourWords + ' ' + minuteWords + ' ' + content.time.period;
    }

    function hourToWords(h) {
        if (h >= 13 && h <= 19) {
            var teens = ['thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
            return teens[h - 13];
        }
        var tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
        var ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        
        if (h < 13) {
            var ones_full = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
                'ten', 'eleven', 'twelve'];
            return ones_full[h];
        }
        if (h >= 20) {
            if (h % 10 === 0) return tens[Math.floor(h / 10)];
            return tens[Math.floor(h / 10)] + '-' + ones[h % 10];
        }
        return '';
    }

    function minuteToWords(m) {
        if (m === 0) return "o'clock";
        if (m === 15) return 'fifteen';
        if (m === 30) return 'thirty';
        if (m === 45) return 'forty-five';
        
        var tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
        var ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        
        if (m < 10) return ones[m];
        if (m < 20) {
            var teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
            return teens[m - 10];
        }
        if (m % 10 === 0) return tens[Math.floor(m / 10)];
        return tens[Math.floor(m / 10)] + '-' + ones[m % 10];
    }

    function minuteToWords24(m) {
        var tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
        var ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        
        if (m === 0) return 'hours';
        if (m < 10) return ones[m];
        if (m < 20) {
            var teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
            return teens[m - 10];
        }
        if (m % 10 === 0) return tens[Math.floor(m / 10)];
        return tens[Math.floor(m / 10)] + '-' + ones[m % 10];
    }

    function numberToWords(n) {
        if (n === 0) return 'zero';
        var ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
            'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
            'seventeen', 'eighteen', 'nineteen'];
        var tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

        function convertBelowThousand(num) {
            if (num === 0) return '';
            var result = '';
            if (num >= 100) {
                result += ones[Math.floor(num / 100)] + ' hundred';
                num %= 100;
                if (num > 0) result += ' and ';
            }
            if (num >= 20) {
                result += tens[Math.floor(num / 10)];
                num %= 10;
                if (num > 0) result += '-' + ones[num];
            } else if (num > 0) {
                result += ones[num];
            }
            return result;
        }

        if (n >= 1000) {
            var thousands = Math.floor(n / 1000);
            var remainder = n % 1000;
            var result = ones[thousands] + ' thousand';
            if (remainder > 0) {
                result += ' ' + convertBelowThousand(remainder);
            }
            return result;
        }
        return convertBelowThousand(n);
    }

    function addSlide() {
        var content = {};
        if (currentMode === 'number') {
            content.type = 'number';
            content.value = generateNumber();
            content.display = content.value.toLocaleString('en-US');
        } else if (currentMode === 'date') {
            content.type = 'date';
            content.date = generateDate();
            content.display = formatDate(content.date);
        } else {
            content.type = 'time';
            content.time = generateTime();
            content.display = formatTime(content.time);
        }
        content.speech = buildSpeechText(content);
        content.spellOut = content.type === 'number' ? numberToWords(content.value) : content.speech;

        var slideEl = document.createElement('div');
        slideEl.className = 'swiper-slide';

        var label = content.type === 'number' ? 'Number' : content.type === 'date' ? 'Date' : 'Time';
        var valueClass = content.type === 'date' ? 'card-value date-value' : 'card-value';

        slideEl.innerHTML =
            '<div class="card">' +
                '<div class="card-body">' +
                    '<div class="card-label">' + label + '</div>' +
                    '<div class="' + valueClass + '">' + escapeHtml(content.display) + '</div>' +
                    '<div class="card-placeholder">' +
                        '<div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></div>' +
                        '<div class="text">点击「朗读」开始听写</div>' +
                    '</div>' +
                '</div>' +
                '<div class="card-actions">' +
                    '<button class="btn btn-play">朗读</button>' +
                    '<button class="btn btn-reveal">显示答案</button>' +
                '</div>' +
            '</div>';

        slideEl._content = content;

        swiper.appendSlide(slideEl);
        bindSlideEvents(slideEl);
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function bindSlideEvents(slideEl) {
        var playBtn = slideEl.querySelector('.btn-play');
        var revealBtn = slideEl.querySelector('.btn-reveal');

        playBtn.addEventListener('click', function () {
            if (isSpeaking) {
                speechSynthesis.cancel();
                isSpeaking = false;
                playBtn.classList.remove('speaking');
                // 停止时不改变 selectedVoice，保持当前发音人
                return;
            }
            var content = slideEl._content;
            speakWithRepeat(content.speech, playBtn);
        });

        revealBtn.addEventListener('click', function () {
            var valueEl = slideEl.querySelector('.card-value');
            var placeholder = slideEl.querySelector('.card-placeholder');
            
            if (valueEl.classList.contains('revealed')) {
                // 关闭答案
                valueEl.classList.remove('revealed');
                placeholder.classList.remove('hidden');
                revealBtn.disabled = false;
                revealBtn.textContent = '显示答案';
            } else {
                // 显示答案
                valueEl.classList.add('revealed');
                placeholder.classList.add('hidden');
                revealBtn.disabled = false;
                revealBtn.textContent = '关闭答案';
            }
        });
    }

    function speakWithRepeat(text, btnEl) {
        if (repeatCount <= 1) {
            speakOnce(text, btnEl, function () {});
            return;
        }
        isSpeaking = true;
        if (btnEl) btnEl.classList.add('speaking');
        speakOnce(text, btnEl, function () {
            var remaining = repeatCount - 1;
            function doNext() {
                if (remaining <= 0) {
                    isSpeaking = false;
                    if (btnEl) btnEl.classList.remove('speaking');
                    return;
                }
                remaining--;
                setTimeout(function () {
                    speakOnce(text, btnEl, doNext);
                }, 800);
            }
            doNext();
        });
    }

    function speakOnce(text, btnEl, onDone) {
        speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = speechRate;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // 使用当前选中的发音人（可能在切换幻灯片时已随机选择）
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        utterance.onend = function () {
            if (onDone) onDone();
        };
        utterance.onerror = function (e) {
            if (onDone) onDone();
        };
        speechSynthesis.speak(utterance);
    }

    function bindEvents() {
        var tabs = document.querySelectorAll('.tab');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                if (tab.dataset.mode === currentMode) return;
                tabs.forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                currentMode = tab.dataset.mode;
                speechSynthesis.cancel();
                isSpeaking = false;
                swiper.removeAllSlides();
                addSlide();
                addSlide();
                swiper.slideTo(0, 0);
            });
        });

        var speedBtns = document.querySelectorAll('.speed-btn');
        speedBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                speedBtns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                speechRate = parseFloat(btn.dataset.speed);
            });
        });

        var repeatBtns = document.querySelectorAll('.repeat-btn');
        repeatBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                repeatBtns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                repeatCount = parseInt(btn.dataset.count, 10);
            });
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
