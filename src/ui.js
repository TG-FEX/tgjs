$.fn.ellipsis = function() {
    function loop ($container, maxHeight, str) {
        if ($container.height() <= maxHeight) return;
        var init = false;
        var nodes = this.contents();
        var i = nodes.length - 2, item
        for (; i > -1 && $container.height() > maxHeight; i--) {
            item = nodes[i];
            if (item.nodeType == '3') {
                if (!init) init = !!$(item).after(str)
                var text = item.nodeValue.replace(/ {2,}/, ' ');
                while (item.nodeValue && $container.height() > maxHeight ){
                    text = text.substr(0, text.length - 1);
                    item.nodeValue = text;
                }
            }
        }
    }
    return function(str, container){
        return this.each(function(){
            // �������������ַ
            var container = container;
            var oldH, str = str || '<span class="ellipsis">...</span>'
            container = container || this;
            // ��ȡmax-height������������
            var maxHeight = window.getComputedStyle ? (getComputedStyle(container)['max-height'] || getComputedStyle(container)['maxHeight']) : container.currentStyle['max-height'];
            var match = maxHeight.match(/(0?\.?\d*)px$/);
            if (match) maxHeight = oldH = match[1];
            else return;
            // ��һ����Ԫ�ز���һ���иߣ�Ȼ��ȥ��
            var s = $('<span></span>', {
                html: 'o',
                css: {
                    position: 'absolute',
                    whiteSpace: 'nowrap',
                    left: '-999em'
                }
            }).appendTo(this);
            var lineHeight = s.height();
            s.remove();


            var line = Math.floor(maxHeight / lineHeight);
            maxHeight = line * lineHeight;

            // ȥ��һЩ��ʽ�����䳬����Χ
            container.style.maxHeight = 'none';
            container.style.overflowY = 'auto';
            container.style.height = 'auto';


            if ('webkitLineClamp' in this.style) {
                container.style.textOverflow = 'ellipsis';
                container.style.display = '-webkit-box';
                container.style.webkitBoxOrient = 'vertical';
                container.style.webkitLineClamp = line;
            } else loop.call($(this), $(container), maxHeight, str);


            // ������ʽ
            container.style.overflowY = 'hidden';
            container.style.maxHeight = oldH + 'px';
        })
    }
}();