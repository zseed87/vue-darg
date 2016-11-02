;(function() {
    const ctx = '@@drag';
    let Drag = {install(Vue, options){
        Vue.directive('drag', {
            bind(el, binding, vnode){
                el[ctx] = {
                    el,
                    vm: vnode.context,
                    expression: binding.value,
                    dragable: false,
                    _onMove(e){
                        if(!dragable) return;
                        let left = e.clientX - el[ctx].disX;
                        let top = e.clientY - el[ctx].disY;
                        //left  当小于等于零时，设置为零 防止div拖出document之外
                        if (left <= 0) {
                            left = 0;
                        }
                        //当left 超过文档右边界  设置为右边界
                        else if (left >= document.documentElement.clientWidth - el.offsetWidth) {
                            left = document.documentElement.clientWidth - el.offsetWidth;
                        }
                        if (top <= 0) {
                            top = 0;
                        }
                        else if (top >= document.documentElement.clientHeight - el.offsetHeight) {
                            top = document.documentElement.clientHeight - el.offsetHeight;
                        }
                        el.style.left = left + 'px';
                        el.style.top = top + 'px';
                    },
                    _onUp(e){
                        dragable = false;
                        document.removeEventListener('mousemove', el[ctx]._onMove);
                        document.removeEventListener('mouseup', el[ctx]._onUp);
                    }
                };
                el.addEventListener('mousedown', (e) => {
                    el[ctx].disX = e.clientX - el.offsetLeft;
                    el[ctx].disY = e.clientY - el.offsetTop;
                    dragable = true;
                    document.addEventListener('mousemove', el[ctx]._onMove, false);
                    document.addEventListener('mouseup', el[ctx]._onUp, false);
                }, false);
            },
            unbind(el, binding, vnode){
                el[ctx] = null;
                el.removeEventListener('mousedown');
            }
        });
    }};

    if (typeof exports == "object") {
        module.exports = Drag;
    } else if (typeof define == "function") {
        define([], function() {
            return Drag; });
    } else if (window.Vue) {
        window.vueDrag = Drag;
        Vue.use(Drag);
    }
})();
