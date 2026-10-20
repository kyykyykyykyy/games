/*
 * bongbong-fx.js — 도트 아이콘 / 효과 / 봉봉이 아바타 공용 모듈
 *
 *   BBFX.iconHTML('황금 뼈다귀', 2)           // pix_icons.png 의 도트 아이콘 (16px × 배율)
 *   BBFX.pop(layer, 'sparkle', 0, x, y, {})   // eat_fx.png 효과를 띄웠다가 사라지게
 *   const av = new BBFX.Avatar(hostEl, { scale: 0.26 });   // 봉봉이 아바타 (BongbongSprite 필요)
 *   av.react('love' | 'happy' | 'cheer' | 'angry' | 'grudge' | 'choke' | 'meh' | 'sick' | 'worry' | 'cry' | 'shy' | 'smug' | 'surprise' | 'sleep' | 'faint' ...);
 *   av.hop();                                  // 짧게 폴짝 + 반짝
 *
 * 필요한 파일: pix_icons.png, eat_fx.png, bongbong-sprite.js, bongbong_sprites.png
 */
(function (global) {
    var ICM = {"cols": 8, "rows": 6, "idx": {"소고기": 0, "돼지고기": 1, "닭고기": 2, "고구마": 3, "브로콜리": 4, "당근": 5, "연어": 6, "포도": 7, "양파": 8, "초콜릿": 9, "황금 뼈다귀": 10, "무지개 사탕": 11, "특효 영양제": 12, "행운의 간식": 13, "흙묻은 장갑": 14, "선물": 15, "dog": 16, "cart": 17, "fire": 18, "cat": 19, "home": 20, "bolt": 21, "heart": 22, "siren": 23, "hospital": 24, "timer": 25, "pot": 26, "bag": 27, "tree": 28, "paw": 29, "portal": 30, "gem": 31, "ball": 32, "box": 33, "party": 34, "딸기": 35, "치즈": 36, "메론": 37, "소다": 38, "원반": 43, "곰인형": 44, "개껌": 45, "테니스공": 39, "삑삑이 오리": 40, "로프": 41, "도넛 쿠션": 42}};
    var FXM = {"cell": 32, "cols": 6, "rows": 9, "fx": {"fire": {"row": 0, "frames": 4}, "steam": {"row": 1, "frames": 4}, "pot": {"row": 2, "frames": 4}, "sparkle": {"row": 3, "frames": 4}, "emote": {"row": 4, "frames": 6}, "stink": {"row": 5, "frames": 3}, "bubble": {"row": 6, "frames": 3}, "burst": {"row": 7, "frames": 4}, "cat": {"row": 8, "frames": 3}}};

    var st = document.createElement('style');
    st.textContent = '.bbx-shake{animation:bbxShake .14s steps(2) infinite}.bbx-sick{filter:hue-rotate(55deg) saturate(1.3) brightness(.92)}' +
        '.bbx-hop{animation:bbxHop .28s steps(3) 1}.bbx-fx{position:absolute;background:url("eat_fx.png") no-repeat;image-rendering:pixelated;pointer-events:none}' +
        '@keyframes bbxShake{0%{transform:translateX(-2px)}100%{transform:translateX(2px)}}@keyframes bbxHop{0%{transform:translateY(0)}50%{transform:translateY(-8px)}100%{transform:translateY(0)}}';
    document.head.appendChild(st);

    function iconHTML(name, k) {
        var i = ICM.idx[name]; if (i === undefined) return '❓';
        return '<i class="ic" style="--ix:' + (i % ICM.cols) + ';--iy:' + Math.floor(i / ICM.cols) + ';--is:' + (k || 1) + '"></i>';
    }

    // ---- 효과 스프라이트 (좌표 = 도트 좌표 × ppa) ----
    function fxSprite(layer, name, cx, cy, o) {
        o = o || {};
        var m = FXM.fx[name], ppa = o.ppa || 2, size = FXM.cell * ppa * (o.k || 1);
        var el = document.createElement('div');
        el.className = 'bbx-fx';
        el.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (cx * ppa - size / 2) + 'px;top:' + (cy * ppa - size / 2) + 'px;' +
            'background-size:' + (FXM.cols * size) + 'px ' + (FXM.rows * size) + 'px;';
        el._m = m; el._size = size;
        setFrame(el, o.frame || 0);
        layer.appendChild(el);
        return el;
    }
    function setFrame(el, f) { el.style.backgroundPosition = (-f * el._size) + 'px ' + (-el._m.row * el._size) + 'px'; }
    function loopFx(el, fps, seq) {
        var arr = seq || Array.apply(null, Array(el._m.frames)).map(function (_, k) { return k; }), i = 0;
        el._t = setInterval(function () { i = (i + 1) % arr.length; setFrame(el, arr[i]); }, 1000 / fps);
    }
    function pop(layer, name, frame, cx, cy, o) {
        o = o || {};
        var ppa = o.ppa || 2, el = fxSprite(layer, name, cx, cy, { frame: frame, k: o.k, ppa: ppa });
        if (o.fps) loopFx(el, o.fps, o.seq);
        function done() { clearInterval(el._t); if (el.parentNode) el.parentNode.removeChild(el); }
        var dx = (o.dx || 0) * ppa, dy = (o.dy || 0) * ppa;
        if (!el.animate) { setTimeout(done, o.ms || 900); return el; }
        var a = el.animate([
            { transform: 'translate(0,0) scale(.6)', opacity: 0 },
            { transform: 'translate(' + dx * 0.3 + 'px,' + dy * 0.3 + 'px) scale(1.05)', opacity: 1, offset: 0.2 },
            { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(1)', opacity: o.fade === false ? 1 : 0 }
        ], { duration: o.ms || 900, easing: 'steps(8,end)' });
        a.onfinish = done;
        return el;
    }

    // ---- 봉봉이 아바타 ----
    var REACT = {
        love:   { play: 'e_love', cls: 'm-bounce', em: [['emote', 0], ['emote', 0], ['emote', 0]], ms: 1900 },
        happy:  { play: 'e_happy', cls: 'm-bounce', em: [['sparkle'], ['sparkle'], ['sparkle']], ms: 1900 },
        cheer:  { play: 'jump', cls: 'm-dance', em: [['sparkle'], ['emote', 0], ['sparkle']], ms: 1900 },
        angry:  { play: 'e_angry', cls: 'bbx-shake', em: [['emote', 1], ['emote', 4]], ms: 1700 },
        grudge: { play: 'e_smug', em: [['emote', 2], ['emote', 5]], ms: 1700 },
        choke:  { play: 'e_surprise', cls: 'bbx-shake', em: [['emote', 2], ['emote', 3]], ms: 1700 },
        meh:    { play: 'e_smug', em: [['emote', 5]], ms: 1700 },
        sick:   { play: 'e_sick', cls: 'bbx-shake', em: [['stink'], ['stink'], ['emote', 2]], ms: 1900 },
        worry:  { play: 'e_sad', cls: 'bbx-shake', em: [['emote', 2], ['emote', 4]], ms: 1500 },
        cry:      { play: 'e_cry', cls: 'bbx-shake', em: [['emote', 2]], ms: 1900 },
        shy:      { play: 'e_shy', cls: 'm-wiggle', em: [['emote', 0]], ms: 1700 },
        smug:     { play: 'e_smug', em: [['sparkle']], ms: 1700 },
        surprise: { play: 'e_surprise', cls: 'm-bounce', em: [['emote', 4]], ms: 1300 },
        dance:    { pose: 'stand', cls: 'm-dance',  em: [['emote', 0], ['sparkle'], ['sparkle'], ['emote', 0]], ms: 2200 },
        spin:     { play: 'jump', cls: 'm-spin',    em: [['sparkle'], ['sparkle']], ms: 1900 },
        roll:     { pose: 'stand', cls: 'm-roll',   em: [['sparkle']], ms: 1300 },
        faint:    { play: 'e_sick', cls: 'm-faint',  em: [['emote', 2], ['emote', 3]], ms: 2600 },
        shiver:   { play: 'e_sad', cls: 'm-shiver', em: [['emote', 2], ['emote', 2]], ms: 1700 },
        tilt:     { pose: 'sit', cls: 'm-tilt',     em: [['emote', 3]], ms: 1500 },
        bounce:   { pose: 'begB', cls: 'm-bounce',  em: [['sparkle']], ms: 1000 },
        sleep:    { play: 'e_sleepy', cls: 'm-breath', em: [['emote', 5]], ms: 2600 },
        hello:    { play: 'hi5', em: [['sparkle']], ms: 2100 },
        wiggle:   { pose: 'begA', cls: 'm-wiggle',  em: [], ms: 1000 }
    };
    function Avatar(host, o) {
        o = o || {};
        var s = this.s = o.scale || 0.26;
        this.host = host; host.style.position = 'relative';
        this.dogHost = document.createElement('div');
        this.dogHost.style.cssText = 'position:absolute;left:50%;bottom:0;width:' + (214 * s) + 'px;height:' + (190 * s) + 'px;margin-left:' + (-107 * s) + 'px;transform-origin:50% 100%;z-index:2;';
        this.fx = document.createElement('div');
        this.fx.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;overflow:visible;z-index:3;';
        host.appendChild(this.dogHost); host.appendChild(this.fx);
        this.dog = (typeof BongbongSprite !== 'undefined') ? new BongbongSprite(this.dogHost, { scale: s, fps: 10, base: o.base || 'beg', sheet: o.sheet }) : null;
        if (this.dog) this.dog.idle();
        this.timer = null; this.lock = 0; this.busy = 0;
        var self = this;
        this.idleT = setInterval(function () {            // 가만히 있을 땐 혼자서 이것저것 해요
            if (document.hidden || Date.now() < self.busy || Math.random() < 0.35) return;
            var pool = ['tilt', 'wiggle', 'hello', 'bounce', 'sleep', 'shy', 'smug', 'happy', 'surprise', 'tilt', 'wiggle'];
            self.react(pool[Math.floor(Math.random() * pool.length)], true);
        }, 4200);
    }
    Avatar.prototype.emote = function (e) {
        var ppa = 2, W = this.host.clientWidth || 64, H = this.host.clientHeight || 64;
        var cx = (W / 2 + 4 + (Math.random() * 8 - 2)) / ppa, cy = (H - 190 * this.s - 6) / ppa;
        if (e[0] === 'emote') pop(this.fx, 'emote', e[1], cx, cy, { ppa: ppa, k: 1, dy: -6, ms: 1000 });
        else if (e[0] === 'sparkle') pop(this.fx, 'sparkle', 0, cx + Math.random() * 10 - 8, cy + Math.random() * 8, { ppa: ppa, fps: 10, seq: [0, 1, 2, 3], ms: 800, fade: true });
        else if (e[0] === 'stink') pop(this.fx, 'stink', Math.floor(Math.random() * 3), cx, cy + 4, { ppa: ppa, dy: -6, ms: 1100, k: 0.8 });
    };
    Avatar.prototype.react = function (kind, soft) {
        var self = this, r = REACT[kind] || REACT.meh;
        if (!this.dog) return;
        this.busy = Date.now() + r.ms + (soft ? 1500 : 4000);
        clearTimeout(this.timer);
        if (r.play) this.dog.play(r.play); else this.dog.pose(r.pose);
        this.dogHost.className = r.cls || '';
        r.em.forEach(function (e, i) { setTimeout(function () { self.emote(e); }, i * 320); });
        this.timer = setTimeout(function () { self.dogHost.className = ''; self.dog.idle(); }, r.ms);
    };
    Avatar.prototype.hop = function () {
        var self = this; if (!this.dog || Date.now() < this.lock) return;
        this.lock = Date.now() + 500;
        clearTimeout(this.timer);
        this.dog.pose('begB');
        this.dogHost.className = 'bbx-hop';
        this.emote(['sparkle']);
        this.timer = setTimeout(function () { self.dogHost.className = ''; self.dog.idle(); }, 420);
    };
    Avatar.prototype.destroy = function () { clearTimeout(this.timer); clearInterval(this.idleT); if (this.dog) this.dog.stop(); };

    global.BBFX = { ICM: ICM, FXM: FXM, iconHTML: iconHTML, fxSprite: fxSprite, setFrame: setFrame, pop: pop, Avatar: Avatar };
})(window);
