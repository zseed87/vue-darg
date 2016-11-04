;(() => {
    //轻触，两次轻触（双击），长按，滑动，滑动结束，左滑动，右滑动，上滑动，下滑动，拖拽，旋转，轻捏（放大/缩小）
    const EventList = 'tap,doubleTap,longPress,swipe,swipeEnd,swipeLeft,swipeRight,swipeUp,swipeDown,pan,rotate,pinch'.split(',');

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
            target: null,           //事件触发DOM节点
            startStamp: 0,          //事件开始时间戳
            endStamp: 0,            //事件结束时间戳
            startApart: 0,          //多点触摸开始触摸间距值
            endApart: 0,            //多点触摸结束触摸间距值
            startAngle: 0,          //多点触摸开始触摸角度值
            endAngle: 0,            //多点触摸结束触摸角度值
            startX: createPoint(),  //开始触摸 X坐标点
            startY: createPoint(),  //开始触摸 Y坐标点
            endX: createPoint(),    //结束触摸 X坐标点
            endY: createPoint(),    //结束触摸 Y坐标点
            diffX: createPoint(),   //触摸 X坐标偏移量
            diffY: createPoint()   //触摸 Y坐标偏移量
        };

        let handler = (e) => {
            point.target = e.target;

            switch(e.type){
                case 'touchstart':
                    //重置坐标点信息
                    point.startX.empty();
                    point.startY.empty();
                    point.diffX.empty();
                    point.diffY.empty();

                    //保存开始坐标点
                    [...e.touches].forEach((touch, idx) => {
                        let i = touch.identifier || idx;
                        point.startX[i] = point.endX[i] = touch.clientX;
                        point.startY[i] = point.endY[i] = touch.clientY;
                    });

                    //开始时间戳
                    point.startStamp = point.endStamp = +new Date();

                    //如果是多点触摸则计算开始触摸间距
                    if(e.touches.length > 1){
                        let start_x = point.startX.keys(1) - point.startX.keys(0);
                        let start_y = point.startY.keys(1) - point.startY.keys(0);
                        point.startApart = Math.sqrt(start_x * start_x + start_y * start_y);
                        point.startAngle= getAngle(start_x, start_y);
                    }

                    break;
                case 'touchmove':
                    //移动中的坐标点（结束坐标点）
                    [...e.touches].forEach((touch, idx) => {
                        let i = touch.identifier || idx;
                        point.endX[i] = touch.clientX;
                        point.endY[i] = touch.clientY;
                        isNumber(point.startX[i]) && (point.diffX[i] = point.endX[i] - point.startX[i]);
                        isNumber(point.startY[i]) && (point.diffY[i] = point.endY[i] - point.startY[i]);
                    });

                    //如果是多点触摸则计算移动触摸间距
                    if(e.touches.length > 1){
                        let end_x = point.endX.keys(1) - point.endX.keys(0);
                        let end_y = point.endY.keys(1) - point.endY.keys(0);
                        point.endApart = Math.sqrt(end_x * end_x + end_y * end_y);
                        point.endAngle= getAngle(end_x, end_y);
                    }

                    //触发滑动事件
                    node.trigger('swipe', point, e);

                    break;
                case 'touchcancel':
                case 'touchend':
                    //结束时间戳
                    point.endStamp = +new Date();

                    //重置结束坐标点
                    point.endX.empty();
                    point.endY.empty();

                    //结束坐标点
                    [...e.changedTouches].forEach((touch, idx) => {
                        let i = touch.identifier || idx,
                            diffX = Math.abs(point.diffX[i]),
                            diffY = Math.abs(point.diffY[i]),
                            _diffX = Math.abs(diffX),
                            _diffY = Math.abs(diffY);

                        if(_diffX > 0 || _diffY > 0){
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

                            //滑动结束事件
                            node.trigger('swipeEnd', point, e);
                        }else{
                            if(point.endStamp - point.startStamp > 500){
                                //长按事件
                                node.trigger('longPress', point, e);
                            }else{
                                //轻触事件（点击）
                                node.trigger('tap', point, e);
                            }
                        }
                    });
                    break;
            }
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
        event.eventName = type;
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