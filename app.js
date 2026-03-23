(function () {
    'use strict';

    var currentMode = 'number';
    var speechRate = 0.85;
    var repeatCount = 1;
    var swiper = null;
    var selectedVoice = null;
    var isSpeaking = false;

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
        function tryLoad() {
            var voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                selectedVoice =
                    voices.find(function (v) { return v.lang === 'en-US' && v.localService === false && v.name.includes('Natural'); }) ||
                    voices.find(function (v) { return v.lang === 'en-US' && v.name.includes('Online'); }) ||
                    voices.find(function (v) { return v.lang === 'en-US' && v.name.includes('Natural'); }) ||
                    voices.find(function (v) { return v.lang === 'en-US' && v.name.includes('Microsoft'); }) ||
                    voices.find(function (v) { return v.lang === 'en-US'; }) ||
                    voices.find(function (v) { return v.lang.startsWith('en'); });
            }
        }
        tryLoad();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = tryLoad;
        }
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
            breakpoints: {
                768: {
                    slidesPerView: 1.8,
                    spaceBetween: 20
                },
                1024: {
                    slidesPerView: 2.5,
                    spaceBetween: 24
                }
            },
            on: {
                slideChangeTransitionEnd: function () {
                    var activeIndex = swiper.activeIndex;
                    var totalSlides = swiper.slides.length;
                    if (activeIndex >= totalSlides - 1) {
                        addSlide();
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

    function formatDate(date) {
        return MONTHS[date.month] + ' ' + date.day + ', ' + date.year;
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
        return MONTHS[content.date.month] + ' ' + toOrdinal(content.date.day) + ', ' + content.date.year;
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
        } else {
            content.type = 'date';
            content.date = generateDate();
            content.display = formatDate(content.date);
        }
        content.speech = buildSpeechText(content);
        content.spellOut = content.type === 'number' ? numberToWords(content.value) : content.speech;

        var slideEl = document.createElement('div');
        slideEl.className = 'swiper-slide';

        var label = content.type === 'number' ? 'Number' : 'Date';
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
                return;
            }
            var content = slideEl._content;
            speakWithRepeat(content.speech, playBtn);
        });

        revealBtn.addEventListener('click', function () {
            var valueEl = slideEl.querySelector('.card-value');
            var placeholder = slideEl.querySelector('.card-placeholder');
            valueEl.classList.add('revealed');
            placeholder.classList.add('hidden');
            revealBtn.disabled = true;
            revealBtn.textContent = '已显示';
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
