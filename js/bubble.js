var stop, staticx;
var img = new Image();
// 此处替换为你的透明气泡PNG图片路径
img.src = "/img/bubble.png";

// 粒子构造类（重命名注释，逻辑适配气泡）
function Bubble(x, y, s, r, fn) {
    this.x = x;
    this.y = y;
    this.s = s;
    this.r = r;
    this.fn = fn;
}

Bubble.prototype.draw = function (cxt) {
    cxt.save();
    // 气泡增加半透明效果，适配海边柔和氛围感
    cxt.globalAlpha = 0.55;
    var xc = 40 * this.s / 4;
    cxt.translate(this.x, this.y);
    cxt.rotate(this.r);
    cxt.drawImage(img, 0, 0, 40 * this.s, 40 * this.s)
    cxt.restore();
}

Bubble.prototype.update = function () {
    this.x = this.fn.x(this.x, this.y);
    this.y = this.fn.y(this.y, this.y);
    this.r = this.fn.r(this.r);
    // 气泡飘出屏幕顶部/左右边界时，重新从海面底部生成
    if (this.x > window.innerWidth || this.x < 0 || this.y < 0) {
        this.r = getRandom('fnr');
        if (Math.random() > 0.4) {
            // 从屏幕底部海面随机X位置重生
            this.x = getRandom('x');
            this.y = window.innerHeight;
            this.s = getRandom('s');
            this.r = getRandom('r');
        } else {
            // 从屏幕右侧海面重生
            this.x = window.innerWidth;
            this.y = getRandom('y_bottom');
            this.s = getRandom('s');
            this.r = getRandom('r');
        }
    }
}

BubbleList = function () {
    this.list = [];
}
BubbleList.prototype.push = function (bubble) {
    this.list.push(bubble);
}
BubbleList.prototype.update = function () {
    for (var i = 0, len = this.list.length; i < len; i++) {
        this.list[i].update();
    }
}
BubbleList.prototype.draw = function (cxt) {
    for (var i = 0, len = this.list.length; i < len; i++) {
        this.list[i].draw(cxt);
    }
}
BubbleList.prototype.get = function (i) {
    return this.list[i];
}
BubbleList.prototype.size = function () {
    return this.list.length;
}

function getRandom(option) {
    var ret, random;
    switch (option) {
        case 'x':
            ret = Math.random() * window.innerWidth;
            break;
        // 仅底部海面区域生成初始气泡
        case 'y_bottom':
            ret = window.innerHeight - Math.random() * window.innerHeight * 0.3;
            break;
        // 气泡尺寸缩小，避免过大遮挡画面
        case 's':
            ret = 0.3 + Math.random() * 0.6;
            break;
        case 'r':
            ret = Math.random() * 3;
            break;
        // 海风左右轻微漂移，晃动幅度降低
        case 'fnx':
            random = -0.3 + Math.random() * 0.6;
            ret = function (x, y) {
                return x + 0.4 * random;
            };
            break;
        // 核心改动：y值持续减小 = 向上上浮，速度放缓
        case 'fny':
            random = 0.8 + Math.random() * 0.6
            ret = function (y) {
                return y - random;
            };
            break;
        // 气泡缓慢旋转
        case 'fnr':
            random = Math.random() * 0.015;
            ret = function (r) {
                return r + random;
            };
            break;
    }
    return ret;
}

function startBubble() {
    requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame;
    var canvas = document.createElement('canvas'),
        cxt;
    staticx = true;
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.setAttribute('style', 'position: fixed;left: 0;top: 0;pointer-events: none;z-index: 1;');
    canvas.setAttribute('id', 'canvas_bubble');
    document.getElementsByTagName('body')[0].appendChild(canvas);
    cxt = canvas.getContext('2d');
    var bubbleList = new BubbleList();
    // 粒子总数从50改为30，画面更清爽不遮挡人物
    for (var i = 0; i < 30; i++) {
        var bubble, randomX, randomY, randomS, randomR, randomFnx, randomFny;
        randomX = getRandom('x');
        randomY = getRandom('y_bottom');
        randomR = getRandom('r');
        randomS = getRandom('s');
        randomFnx = getRandom('fnx');
        randomFny = getRandom('fny');
        randomFnR = getRandom('fnr');
        bubble = new Bubble(randomX, randomY, randomS, randomR, {
            x: randomFnx,
            y: randomFny,
            r: randomFnR
        });
        bubble.draw(cxt);
        bubbleList.push(bubble);
    }
    stop = requestAnimationFrame(function () {
        cxt.clearRect(0, 0, canvas.width, canvas.height);
        bubbleList.update();
        bubbleList.draw(cxt);
        stop = requestAnimationFrame(arguments.callee);
    })
}

// 修复原代码resize ID错误，窗口缩放重绘画布
window.onresize = function () {
    var canvasBubble = document.getElementById('canvas_bubble');
    if (canvasBubble) {
        canvasBubble.width = window.innerWidth;
        canvasBubble.height = window.innerHeight;
    }
}

img.onload = function () {
    startBubble();
}

// 开关气泡动画函数（替换原stopp）
function toggleBubble() {
    if (staticx) {
        var child = document.getElementById("canvas_bubble");
        if (child) child.parentNode.removeChild(child);
        window.cancelAnimationFrame(stop);
        staticx = false;
    } else {
        startBubble();
    }
}