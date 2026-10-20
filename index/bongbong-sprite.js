/*
 * 봉봉이 도트 애니메이션 모듈 (v2)
 *
 * 기본 사용법 (index.html 등 기존 페이지는 그대로 동작합니다)
 *   const dog = new BongbongSprite(hostElement, { scale: 0.6, fps: 10 });
 *   dog.idle();                       // 기본 동작 반복 (기본값: 제자리 걷기)
 *   dog.play('jump', () => {...});    // 'hi5' | 'jump' | 'sit' 한 번 재생 후 기본 동작으로 복귀
 *   dog.stop();                       // 정지하고 화면에서 제거
 *
 * v2에서 추가된 것
 *   new BongbongSprite(host, { base: 'beg' })   // 기본 동작을 'walk'(걷기) 또는 'beg'(앉아서 간식 조르기)로 지정
 *   dog.pose('stand')                // 애니메이션을 멈추고 한 장면만 보여주기
 *                                    //   'stand' 'sit' 'begA' 'begB' 'takeoff' 'up' 'apex' 'fall' 'land' + 감정 'e_happy' 'e_love' 'e_angry' 'e_sad' 'e_surprise' 'e_sleepy' 'e_sick' 'e_smug' 'e_cry' 'e_shy'
 *   dog.setScale(0.5)                // 화면 크기에 맞춰 크기 바꾸기
 *
 * 필요한 파일: bongbong_sprites.png (같은 폴더, 또는 options.sheet 로 경로 지정)
 */
(function (global) {
    // 시트 정보 (bongbong_sprites.png 를 다시 만들면 값도 같이 바꿔야 합니다)
    var META = { cellW: 214, cellH: 347, cols: 10, rows: 6, standTop: 147, ground: 337 };

    // 프레임 = [행, 열]
    var WALK = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (c) { return [0, c]; });
    function S(c) { return [1, c]; }          // 앉아서 손 흔들기 프레임 0~4
    var STAND = [1, 5], SIT34 = [1, 6], CROUCH = [1, 7];
    function J(c) { return [2, c]; }          // 점프 프레임 (높이 반영됨)
    function A(c) { return [3, c]; }          // 점프 자세 (높이 반영 없음: 게임에서 직접 움직일 때)

    var SEQ = {
        walk: WALK,
        // 멈춤 → 앉기 → 하이파이브(손 흔들기) → 일어서기
        hi5: [STAND, STAND, SIT34, SIT34, S(0), S(0), S(1), S(2), S(2), S(2), S(1), S(2), S(2), S(1),
              S(0), S(0), SIT34, STAND, STAND],
        // 웅크리기 → 두 번 점프 → 착지
        jump: [STAND, STAND, CROUCH, CROUCH, J(0), J(1), J(2), J(3), J(4), J(4),
               J(5), J(6), J(7), J(4), J(4), STAND, STAND],
        // 앉아서 기대하는 표정 (앞발 모으기)
        sit: [SIT34, SIT34, S(0), S(0), S(3), S(3), S(3), S(3), S(3), S(4), S(4), S(4), S(4), S(4),
              S(0), S(0), SIT34, STAND],
        // 앉아서 간식 조르기 (반복용)
        beg: [S(0), S(0), S(0), S(0), S(3), S(3), S(4), S(4), S(3), S(3), S(4), S(4), S(0), S(0)]
    };

    // 감정 표정 (앉은 정면): 4행 = 표정 A, 5행 = 표정 B (눈물/반짝임 등 2프레임 반복)
    var EMO = ['happy', 'love', 'angry', 'sad', 'surprise', 'sleepy', 'sick', 'smug', 'cry', 'shy'];
    EMO.forEach(function (n, i) {
        var q = [];
        for (var k = 0; k < 6; k++) { var f = (k % 2) ? [5, i] : [4, i]; q.push(f, f, f); }
        SEQ['e_' + n] = q;
    });

    var POSES = {
        stand: STAND, sit: S(0), begA: S(3), begB: S(4),
        takeoff: A(0), up: A(1), apex: A(2), fall: A(3), land: A(4)
    };

    EMO.forEach(function (n, i) { POSES['e_' + n] = [4, i]; POSES['e_' + n + '2'] = [5, i]; });

    function BongbongSprite(host, opts) {
        opts = opts || {};
        this.host = host;
        this.scale = opts.scale || 0.6;
        this.fps = opts.fps || 10;
        this.sheet = opts.sheet || 'bongbong_sprites.png';
        this.base = SEQ[opts.base] ? opts.base : 'walk';
        this.el = null;
        this.timer = null;
        this.seq = SEQ[this.base];
        this.name = this.base;
        this.i = 0;
        this.loop = true;
        this.onDone = null;
        this.frame = null;
        this._mount();
    }

    BongbongSprite.prototype._layout = function () {
        var s = this.scale, st = this.el.style;
        st.width = (META.cellW * s) + 'px';
        st.height = (META.cellH * s) + 'px';
        st.marginLeft = (-META.cellW * s / 2) + 'px';
        st.top = (-META.standTop * s) + 'px';
        st.backgroundSize = (META.cellW * META.cols * s) + 'px ' + (META.cellH * META.rows * s) + 'px';
    };

    BongbongSprite.prototype._mount = function () {
        var el = document.createElement('div');
        el.className = 'bb-sprite';
        el.style.cssText = 'position:absolute;left:50%;pointer-events:none;image-rendering:pixelated;' +
            'background-image:url("' + this.sheet + '");background-repeat:no-repeat;';
        this.host.appendChild(el);
        this.el = el;
        this._layout();
        this._draw();
    };

    BongbongSprite.prototype._draw = function () {
        if (!this.el) return;
        var f = this.frame || this.seq[this.i], s = this.scale;
        this.el.style.backgroundPosition = (-f[1] * META.cellW * s) + 'px ' + (-f[0] * META.cellH * s) + 'px';
    };

    BongbongSprite.prototype._start = function () {
        var self = this;
        clearInterval(this.timer);
        this.timer = setInterval(function () { self._tick(); }, 1000 / this.fps);
    };

    BongbongSprite.prototype._tick = function () {
        if (document.hidden) return;           // 화면이 안 보일 때는 멈춤
        this.i++;
        if (this.i >= this.seq.length) {
            if (this.loop) { this.i = 0; }
            else {
                var cb = this.onDone; this.onDone = null;
                this.idle();
                if (cb) cb();
                return;
            }
        }
        this._draw();
    };

    // 기본 동작 반복 (걷기 또는 간식 조르기)
    BongbongSprite.prototype.idle = function () {
        this.seq = SEQ[this.base]; this.name = this.base; this.i = 0; this.loop = true; this.onDone = null; this.frame = null;
        if (!this.el) this._mount();
        this._draw(); this._start();
    };

    // 'hi5' | 'jump' | 'sit' 한 번 재생 후 기본 동작으로 복귀
    BongbongSprite.prototype.play = function (name, onDone) {
        if (!SEQ[name] || name === 'walk' || name === 'beg') return this.idle();
        if (!this.el) this._mount();
        this.seq = SEQ[name]; this.name = name; this.i = 0; this.loop = false; this.onDone = onDone || null; this.frame = null;
        this._draw(); this._start();
    };

    // 애니메이션을 멈추고 한 장면만 보여주기
    BongbongSprite.prototype.pose = function (name) {
        var f = POSES[name]; if (!f) return;
        if (!this.el) this._mount();
        clearInterval(this.timer); this.timer = null;
        this.frame = f; this.name = 'pose:' + name; this.onDone = null;
        this._draw();
    };

    BongbongSprite.prototype.setScale = function (s) {
        this.scale = s;
        if (this.el) { this._layout(); this._draw(); }
    };

    // 정지하고 화면에서 제거
    BongbongSprite.prototype.stop = function () {
        clearInterval(this.timer); this.timer = null;
        if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
        this.el = null;
    };

    BongbongSprite.META = META;
    BongbongSprite.SEQ = SEQ;
    BongbongSprite.POSES = POSES;
    global.BongbongSprite = BongbongSprite;
})(window);
