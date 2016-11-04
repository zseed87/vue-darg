;(() => {
    //轻触，两次轻触（双击），长按，滑动，滑动结束，左滑动，右滑动，上滑动，下滑动，拖拽，旋转，轻捏（放大/缩小）
    const EventList = 'tap,longPress,swipe,swipeLeft,swipeRight,swipeUp,swipeDown,pan,rotate,pinch'.split(',');

    //判断是否为数字类型
    const isNumber = (num) => {
        return num === +num;
    };

    const isString = (str) => {
        return str === str + '';
    };

    const isFunction = (fn) => {
        return ({}).toString.call(fn) === '[object Function]';
    };

    const arrDel = (arr, elem) => {
        let idx = isNumber(elem) ? elem : arr.indexOf(elem);
        idx > -1 && arr.splice(idx, 1);
    };

    //计算旋转角度
    const getAngle = (x, y) => {
        let angle = Math.atan(Math.abs(y / x)) / Math.PI * 180;
        if(x <= 0 && y <= 0){
            angle = 180 - angle;
        }else if(x <= 0 && y >= 0){
            angle += 180;
        }else if(x >= 0 && y >= 0){
            angle = 360 - angle;
        }
        return angle;
    };

    const createPoint = () => {
        return Object.defineProperties({}, {
            length: {
                get(){
                    return Object.keys(this).length;
                },
                set(){
                    return false;
                },
                enumerable: false
            },
            keys: {
                value(p){
                    return this[Object.keys(this)[p]];
                },
                writable: false,
                enumerable: false
            },
            empty: {
                value(){
                    for(let p in this){
                        if(this.hasOwnProperty(p)){
                            delete this[p];
                        }
                    }
                },
                writable: false,
                enumerable: false
            }
        });
    };

    //定义滑动事件
    const bindEvent = (node) => {
        node.__bind_custom_event__ = true;

        //坐标点
        let point = {
            target: null,               //事件触发DOM节点
            scale: 0,                   //放大缩小变量
            angle: 0,                   //变化角度值
            startX: 0,                  //开始触摸 X坐标点
            startY: 0,                  //开始触摸 Y坐标点
            endX: 0,                    //结束触摸 X坐标点
            endY: 0,                    //结束触摸 Y坐标点
            left: 0,                    //事件未触发时 DOM节点相对父节点的 X坐标
            top: 0,                     //事件未触发时 DOM节点相对父节点的 Y坐标
            width: 0,                   //事件未触发时 DOM节点width值
            height: 0,                  //事件未触发时 DOM节点height值
            rotate: 0,                  //事件未触发时 DOM节点rotate值
            diffX: 0,                   //触摸 X坐标偏移量
            diffY: 0                    //触摸 Y坐标偏移量
        };

        let startStamp = 0,             //事件结束时间戳
            endStamp = 0,               //事件开始时间戳
            startDistance = 0,          //两点触摸开始触摸间距值
            endDistance = 0,            //两点触摸结束触摸间距值
            startAngle = 0,             //两点触摸开始触摸角度值
            endAngle = 0,               //两点触摸结束触摸角度值
            longPressTimeout = null;    //长按事件定时器

        let handler = (e) => {
            point.target = e.target;
            let touch = null,
                touch2 = null,
                disX = 0,
                disY = 0;
            switch(e.type){
                case 'touchstart':
                    clearTimeout(longPressTimeout);
                    //保存开始坐标点
                    touch = e.touches[0];
                    point.startX = touch.clientX;
                    point.startY = touch.clientY;
                    point.left = e.target.offsetLeft;
                    point.top = e.target.offsetTop;
                    point.width = e.target.offsetWidth;
                    point.height = e.target.offsetHeight;
                    point.rotate = +e.target.style['-webkit-transform'].match(/(rotate\(([\-\+]?\d+(\.\d+)?)deg\))/i)[2];

                    //如果是两点触摸则计算开始触摸间距、角度
                    if(e.touches.length > 1){
                        touch2 = e.touches[1];
                        disX = touch2.clientX - point.startX;
                        disY = touch2.clientY - point.startY;
                        startDistance = Math.sqrt(disX * disX + disY * disY);
                        startAngle = getAngle(disX, disY);
                    }else{
                        //开始时间戳
                        startStamp = +new Date();

                        //长按定时器
                        longPressTimeout = setTimeout(() => {
                            node.trigger('longPress', point, e);
                        }, 800);

                    }
                    break;
                case 'touchmove':
                    //保存移动中的坐标点
                    touch = e.changedTouches[0];
                    point.endX = touch.clientX;
                    point.endY = touch.clientY;
                    point.diffX = point.endX - point.startX;
                    point.diffY = point.endY - point.startY;

                    //如果是两点触摸则计算移动触摸间距、角度
                    if(e.changedTouches.length > 1){
                        touch2 = e.changedTouches[1];
                        disX = touch2.clientX - point.endX;
                        disY = touch2.clientY - point.endY;
                        endDistance = Math.sqrt(disX * disX + disY * disY);
                        endAngle= getAngle(disX, disY);

                        point.scale = endDistance / startDistance;
                        point.angle = startAngle - endAngle;

                        node.trigger('rotate', point, e);
                        node.trigger('pinch', point, e);
                    }else{
                        clearTimeout(longPressTimeout);
                        node.trigger('pan', point, e);
                    }
                    break;
                case 'touchcancel':
                case 'touchend':
                    clearTimeout(longPressTimeout);
                    //结束时间戳
                    endStamp = +new Date();
                    //结束坐标点
                    let diffX = point.diffX,
                        diffY = point.diffY,
                        _diffX = Math.abs(diffX),
                        _diffY = Math.abs(diffY);

                    //手指和屏幕的接触时间要小于500毫秒
                    if(endStamp - startStamp < 500){
                        //手指移动的位移要大于10像素，触发发生滑动事件
                        if(_diffX > 10 || _diffY > 10){
                            if(_diffX < _diffY && diffY < 0){
                                //上滑动
                                node.trigger('swipeUp', point, e);
                            }else if(_diffX < _diffY && diffY > 0){
                                //下滑动
                                node.trigger('swipeDown', point, e);
                            }else if(_diffX > _diffY && diffX < 0){
                                //左滑动
                                node.trigger('swipeLeft', point, e);
                            }else if(_diffX > _diffY && diffX > 0){
                                //右滑动
                                node.trigger('swipeRight', point, e);
                            }
                            node.trigger('swipe', point, e);
                        }else{
                            //手指移动的位移要小于10像素，触发轻触（点击）事件
                            node.trigger('tap', point, e);
                        }
                    }
                    //重置坐标点
                    point.startX = point.startY = point.endX = point.endY = point.diffX = point.diffY = point.offsetLeft = point.offsetTop = 0;
                    break;
            };
        };

        node.addEventListener('touchstart', handler, false);
        node.addEventListener('touchmove', handler, false);
        node.addEventListener('touchend', handler, false);
        node.addEventListener('touchcancel', handler, false);
    };

    //事件触发
    Element.prototype.trigger = function(type, data, e){
        let event = document.createEvent('HTMLEvents');
        event.initEvent(type, true, true);
        event.data = data || {};
        event.target = this;

        //取消默认、冒泡事件
        if(e && e instanceof Event){
            let oldPreventDefault = event.preventDefault,
                oldStopPropagation = event.stopPropagation;
            event.preventDefault = function(){
                e.preventDefault();
                oldPreventDefault.apply(event, arguments);
            };
            event.stopPropagation = function(){
                e.stopPropagation();
                oldStopPropagation.apply(event, arguments);
            };
        }

        //分发事件
        this.dispatchEvent(event);
        return this;
    };

    //重写事件监听函数
    let oldEventListener = Element.prototype.addEventListener;

    //判断事件委托时，当前元素是否匹配
    const matches = Element.prototype.matches ||
        Element.prototype.matchesSelector ||
        Element.prototype.webkitMatchesSelector;

    Element.prototype.addEventListener = Element.prototype.on = function(event){
        let node = this,
            args = [...arguments],
            selector = null,
            callback = null,

            eventArr = String(event).split('.'),
            eventNameSpace = eventArr[1] || 'all';

        event = eventArr[0];

        isString(args[1]) && (selector = args[1]);

        if(selector && isFunction(args[2])){
            callback = args[2];
        }else if(isFunction(args[1])){
            callback = args[1];
        }else{
            callback = () => {};
        }

        //是当前自定义是事件，则绑定自定义事件
        EventList.indexOf(event) > -1 &&
        !this.__bind_custom_event__ &&
        bindEvent(node);

        //记录委托的事件
        node.__custom_event_live__ = node.__custom_event_live__ || {};
        node.__custom_event_live__[eventNameSpace] = node.__custom_event_live__[eventNameSpace] || {};
        node.__custom_event_live__[eventNameSpace][event] = node.__custom_event_live__[eventNameSpace][event] || [];

        if(selector){
            //事件委托回调函数
            let handler = (e) => {
                let target = e.target;
                //如果是自定义事件则target 为 e.data.target
                if(EventList.indexOf(event) > -1 && target === node && e.data && e.data.target){
                    target = e.data.target;
                }
                //匹配选中的子节点
                let selected = matches.call(target, selector);
                while(!selected && target.parentNode && target !== node){
                    target = target.parentNode;
                    selected = matches.call(target, selector);
                }
                if(selected){
                    callback.call(target, e);
                }
            };

            node.__custom_event_live__[eventNameSpace][event].push(handler);
            oldEventListener.call(node, event, handler, false);
        }else{
            node.__custom_event_live__[eventNameSpace][event].push(callback);
            oldEventListener.call(node, event, callback, false);
        }

        return node;
    };

    Element.prototype.off = function(event, handler){
        let node = this,
            eventArr = String(event).split('.'),
            eventNameSpace = eventArr[1] || 'all';

        let hasEventMap = () => node.__custom_event_live__ &&
            node.__custom_event_live__[eventNameSpace] &&
            node.__custom_event_live__[eventNameSpace][event] &&
            node.__custom_event_live__[eventNameSpace][event].length;

        event = eventArr[0];

        if(isFunction(handler)){
            node.removeEventListener(event, handler, false);
            hasEventMap() && arrDel(node.__custom_event_live__[eventNameSpace][event], handler);
        }else if(hasEventMap()){
            node.__custom_event_live__[eventNameSpace][event].forEach((cb) => {
                node.removeEventListener(event, cb, false);
            });
            delete node.__custom_event_live__[eventNameSpace][event];
        }

        return node;
    };

    //只触发一次的事件
    Element.prototype.one = function(event, callback){
        let node = this;
        let one = function(e){
            node.removeEventListener(event, callback, false);
            callback.call(this, e);
        };
        node.addEventListener(event, one, false);
        return node;
    };
})();