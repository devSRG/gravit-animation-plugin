const {CONSTANTS, updateStatus} = require('./util/util');
const Easing = require('./easings');

const _core = GravitDesigner.framework.core,
    _actions = GravitDesigner.actions;

const GPath = _core.GPath,
    GRectangle = _core.GRectangle,
    GEllipse = _core.GEllipse;

const GStylable = _core.GStylable,
    GRGBColor = _core.GRGBColor,
    GTransform = _core.GTransform;

const GGroupAction = _actions.GGroupAction;

const ANIMATE = CONSTANTS.ANIMATE;

let img_array = [],
    imgData_array = [],
    animate = [];

let fps = false,
    onion = false,
    loop = false,
    capture = false;

let ELEMENTS = [];

let fps_val = 24;

let Animate = {};

Animate.translate = function(id, x, y, dur, easing, origin) {
    var start = null,
        then = performance.now(),
        tot = 0,
        element = findElement(id),
        Easing = selectEase(easing),
        onion_skins = [],
        prev_delta_x = 0,
        prev_delta_y = 0;

    var page = gDesigner.getActiveDocument().getScene().getActivePage();

    gDesigner.getActiveDocument().getEditor().updateSelection(false, []);

    if(element instanceof GRectangle) {
        var bbox = element.getGeometryBBox();
    }

    var t_coord = originTransformation(origin);

    t_coord.x = (x == 0) ? 0: t_coord.x;
    t_coord.y = (y == 0) ? 0: t_coord.y;

    function step(timestamp) {
        if(!start) start = timestamp;
        var bbox = element.getGeometryBBox();

        var now = performance.now(),
            delta = now - then;

        if(tot + delta > dur) delta = dur - tot;
        tot += delta;

        var ease = Easing(tot / dur),
            tr_x = bbox.getWidth() * t_coord.x,
            tr_y = bbox.getHeight() * t_coord.y,
            delta_x = (x + tr_x) * ease,
            delta_y = (y + tr_y) * ease,
            adj_x = delta_x - prev_delta_x,
            adj_y = delta_y - prev_delta_y;

        prev_delta_x = delta_x;
        prev_delta_y = delta_y;

        if(element instanceof GPath) {
            element.setProperty('x', element.$x + (x * delta));
        } else {
            if(onion) {
                var clone = element.clone();
                var fill_layer = clone.getPaintLayers().getLastChild();

                clone.transform(new GTransform().translated(adj_x, adj_y));

                fill_layer.setProperty('_op', 0.2);
                fill_layer.setProperty('_bl', 'multiply');

                page.appendChild(clone);
                onion_skins.push(clone);
            }

            element.transform(new GTransform().translated(adj_x, adj_y));
        }
        then = now;

        if(timestamp - start <= dur || loop) {
            window.requestAnimationFrame(step);
        } else {
            //setTimeout(() => { reset([{element: id, x: orig_bbox.getX(), y: orig_bbox.getY(), type: 'translate'}]); }, 300);
            //elem.setProperty('x', initial_pos.x);
            //console.log(bbox.getX(), bbox.getY(), x, y);
            //setTimeout(() => { element.transform(new GTransform().translated(-x, -y)) }, 300);
            if(onion) {
                gDesigner.getActiveDocument().getEditor().updateSelection(false, onion_skins);
                var group = new GGroupAction({name: "Onion"});
                group.execute();
                gDesigner.getActiveDocument().getEditor().updateSelection(false, []);
            }
        }
    }

    window.requestAnimationFrame(step);
}

Animate.scale = function(id, x, y, dur, easing, origin) {
    /*var initial_pos = {
        'x': bbox.getX(),
        'y': bbox.getY()
    }*/
    var start = null,
        then = performance.now(),
        tot = 0,
        element = findElement(id),
        Easing = selectEase(easing),
        prev_delta_x = 0,
        prev_delta_y = 0;

    var t_coord = originTransformation(origin);

    gDesigner.getActiveDocument().getEditor().updateSelection(false, []);

    t_coord.x = (x == 0) ? 0: t_coord.x;
    t_coord.y = (y == 0) ? 0: t_coord.y;

    function step(timestamp) {
        if(!start) start = timestamp;

        var now = performance.now(),
            delta = now - then,
            bbox = element.getGeometryBBox();

        if(tot + delta > dur) delta = dur - tot;

        tot += delta;

        var ease = Easing(tot / dur),
            tr_x = bbox.getWidth() * t_coord.x,
            tr_y = bbox.getHeight() * t_coord.y,
            delta_x = x * ease,
            delta_y = y * ease,
            adj_x = delta_x - prev_delta_x,
            adj_y = delta_y - prev_delta_y,
            sx = 1 + (adj_x / bbox.getWidth()),
            sy = 1 + (adj_y / bbox.getHeight());

        prev_delta_x = delta_x;
        prev_delta_y = delta_y;

        element.transform(new GTransform()
            .translated(-(bbox.getX() + tr_x), -(bbox.getY() + tr_y))
            .scaled(sx, sy)
            .translated(bbox.getX() + tr_x, bbox.getY() + tr_y));

        then = now;

        if(timestamp - start <= dur) {
            window.requestAnimationFrame(step);
        }
    }

    window.requestAnimationFrame(step);
};

Animate.rotate = function(id, r, dur, easing, origin) {
    var start = null,
        then = performance.now(),
        tot = 0,
        element = findElement(id),
        Easing = selectEase(easing),
        prev_delta_r = 0,
        tot_r = 0;

    gDesigner.getActiveDocument().getEditor().updateSelection(false, []);

    var t_coord = originTransformation(origin);

    function step(timestamp) {
        if(!start) start = timestamp;

        var now = performance.now(),
            delta = now - then,
            bbox = element.getGeometryBBox();

        if(tot + delta > dur) delta = dur - tot;

        tot += delta;

        var ease = Easing(tot / dur),
            tr_x = bbox.getWidth() * t_coord.x,
            tr_y = bbox.getHeight() * t_coord.y,
            delta_r = r * ease,
            adj_deg_r = (delta_r - prev_delta_r),
            adj_rad_r = adj_deg_r * (Math.PI / 180);

        prev_delta_r = delta_r;
        tot_r += adj_deg_r;

        element.transform(new GTransform()
            .translated(-(bbox.getX() + tr_x), -(bbox.getY() + tr_y))
            .rotated(-adj_rad_r)
            .translated(bbox.getX() + tr_x, bbox.getY() + tr_y));

        then = now;

        if(timestamp - start <= dur) {
            window.requestAnimationFrame(step);
        }
    }

    window.requestAnimationFrame(step);
};

Animate.color = function(id, color, opacity, dur, easing) {
    var start = null,
        then = performance.now(),
        tot = 0,
        element = findElement(id),
        Easing = selectEase(easing),
        fill_layer = element.getPaintLayers().getFillLayers()[0],
        initial_color = fill_layer.getProperty('_pt')._value,
        initial_opacity = fill_layer.getProperty('_op'),
        i_r = initial_color[0],
        i_g = initial_color[1],
        i_b = initial_color[2],
        f_r = color[0],
        f_g = color[1],
        f_b = color[2];

    gDesigner.getActiveDocument().getEditor().updateSelection(false, []);

    function step(timestamp) {
        if(!start) start = timestamp;

        var now = performance.now(),
            delta = now - then;

        if(tot + delta > dur) delta = dur - tot;

        tot += delta;

        var ease = Easing(tot / dur),
            d_r = (f_r - i_r) * ease,
            d_g = (f_g - i_g) * ease,
            d_b = (f_b - i_b) * ease,
            d_o = (opacity - initial_opacity) * ease;

        var rgb = [i_r + d_r, i_g + d_g, i_b + d_b],
            f_o = initial_opacity + d_o;

        fill_layer.setProperty('_pt', new GRGBColor(rgb));
        fill_layer.setProperty('_op', f_o);
        then = now;

        if(timestamp - start < dur) {
            window.requestAnimationFrame(step);
        }
    }

    window.requestAnimationFrame(step);
};

Animate.objects = function(obj, dur) {
    var start = 0,
        then = performance.now(),
        fps_ms = 1000 / fps_val,
        tot_dur = fps ? Math.round(dur / fps_ms) : dur,
        elap_time = 0,
        diff = 0,
        prev_delta_x = [[],[],[]],
        prev_delta_y = [[],[],[]],
        d_r = [], d_g = [], d_b = [], d_o = [],
        initial_color = [],
        initial_opacity = [];

    gDesigner.getActiveDocument().getEditor().updateSelection(false, []);

    if(fps) updateStatus(`Generating ${tot_dur} frames at ${fps_val} FPS`, 'info');

    function step(timestamp) {
        if(!start) start = timestamp;

        var now = performance.now(),
            delta = now - then;

        if(capture) Animate.save();

        for(var i = 0; i < obj.length; i++) {
            if(obj[i].type == ANIMATE.TYPE.TRANSLATE) {
                var element = findElement(obj[i].element_id),
                    bbox = element.getGeometryBBox(),
                    x = obj[i].x,
                    y = obj[i].y,
                    dur_t = 0,
                    delay_t = 0,
                    Easing = selectEase(obj[i].easing),
                    ease = 0;

                var t_coord = originTransformation(obj[i].origin);

                t_coord.x = (obj[i].x == 0) ? 0: t_coord.x;
                t_coord.y = (obj[i].y == 0) ? 0: t_coord.y;

                if(fps) {
                    dur_t = Math.round(obj[i].dur / fps_ms);
                    delay_t = Math.round(obj[i].delay / fps_ms);
                    ease = Easing((diff - delay_t) / dur_t);
                } else {
                    dur_t = obj[i].dur;
                    delay_t = obj[i].delay;
                    ease = Easing((diff - delay_t) / dur_t);
                }

                if(diff >= delay_t && diff <= (dur_t+delay_t)) {
                    var tr_x = bbox.getWidth() * t_coord.x,
                        tr_y = bbox.getHeight() * t_coord.y,
                        delta_x = (x + tr_x) * ease,
                        delta_y = (y + tr_y) * ease,
                        adj_x = delta_x - prev_delta_x[0][i] || 0,
                        adj_y = delta_y - prev_delta_y[0][i] || 0;

                    (prev_delta_x[0][i] == undefined) ? prev_delta_x[0].push(delta_x) : prev_delta_x[0][i] = delta_x;
                    (prev_delta_y[0][i] == undefined) ? prev_delta_y[0].push(delta_y) : prev_delta_y[0][i] = delta_y;

                    element.transform(new GTransform().translated(adj_x, adj_y));
                }
            } else if(obj[i].type == ANIMATE.TYPE.SCALE) {
                var element = findElement(obj[i].element_id),
                    bbox = element.getGeometryBBox(),
                    x = obj[i].x,
                    y = obj[i].y,
                    dur_s = 0,
                    delay_s = 0,
                    Easing = selectEase(obj[i].easing),
                    ease = 0;

                var t_coord = originTransformation(obj[i].origin);

                t_coord.x = (obj[i].x == 0) ? 0: t_coord.x;
                t_coord.y = (obj[i].y == 0) ? 0: t_coord.y;

                if(fps) {
                    dur_s = Math.round(obj[i].dur / fps_ms);
                    delay_s = Math.round(obj[i].delay / fps_ms);
                    ease = Easing((elap_time - delay_s) / dur_s)
                } else {
                    dur_s = obj[i].dur;
                    delay_s = obj[i].delay;
                    ease = Easing((elap_time - delay_s) / dur_s);
                }

                if(diff >= delay_s && diff <= (dur_s + delay_s)) {
                    var tr_x = bbox.getWidth() * t_coord.x,
                        tr_y = bbox.getHeight() * t_coord.y,
                        delta_x = x * ease,
                        delta_y = y * ease,
                        adj_x = delta_x - prev_delta_x[1][i] || 0,
                        adj_y = delta_y - prev_delta_y[1][i] || 0,
                        sx = 1 + (adj_x / bbox.getWidth()),
                        sy = 1 + (adj_y / bbox.getHeight());

                    (prev_delta_x[1][i] == undefined) ? prev_delta_x[1].push(delta_x) : prev_delta_x[1][i] = delta_x;
                    (prev_delta_y[1][i] == undefined) ? prev_delta_y[1].push(delta_y) : prev_delta_y[1][i] = delta_y;

                    element.transform(new GTransform()
                        .translated(-(bbox.getX() + tr_x), -(bbox.getY() + tr_y))
                        .scaled(sx, sy)
                        .translated(bbox.getX() + tr_x, bbox.getY() + tr_y));
                }
            } else if(obj[i].type == ANIMATE.TYPE.COLOR) {
                var element = findElement(obj[i].element_id),
                    color = obj[i].clr,
                    opacity = obj[i].opt,
                    dur_c = 0,
                    delay_c = 0,
                    Easing = selectEase(obj[i].easing),
                    ease = 0,
                    fill_layer = element.getPaintLayers().getFillLayers()[0],
                    current_color = fill_layer.getProperty('_pt').getValue(),
                    current_opacity = fill_layer.getProperty('_op');

                if(fps) {
                    dur_c = Math.round(obj[i].dur / fps_ms);
                    delay_c = Math.round(obj[i].delay / fps_ms);
                    ease = Easing((elap_time - delay_c) / dur_c)
                } else {
                    dur_c = obj[i].dur;
                    delay_c = obj[i].delay;
                    ease = Easing((elap_time - delay_c) / dur_c);
                }

                /*var a_r = d_r[i] - prev_delta[2][i] || 0,
                    a_g = d_r[i] - prev_delta[2][i] || 0,
                    a_b = d_r[i] - prev_delta[2][i] || 0,
                    a_o = d_r[i] - prev_delta[2][i] || 0;*/

                if(diff >= delay_c && diff <= (dur_c + delay_c)) {
                    if(initial_color[i] == undefined) initial_color[i] = current_color;
                    if(initial_opacity[i] == undefined) initial_opacity[i] = current_opacity;

                    var color_changed = color.length !== 0 && color !== current_color;
                    var opacity_changed = opacity && opacity !== current_opacity;

                    if(color_changed && opacity_changed) {
                        var i_r = initial_color[i][0],
                            i_g = initial_color[i][1],
                            i_b = initial_color[i][2],
                            f_r = color[0],
                            f_g = color[1],
                            f_b = color[2];

                        var i_o = initial_opacity[i],
                            f_o = opacity;

                        var a_r = ((f_r - i_r) == 0) ? 0: (f_r - i_r) * ease,
                            a_g = ((f_g - i_g) == 0) ? 0: (f_g - i_g) * ease,
                            a_b = ((f_b - i_b) == 0) ? 0: (f_b - i_b) * ease;

                        var a_o = (f_o - i_o) * ease;

                        /* TODO: Fix colour easing values */
                        (d_r[i] == undefined) ? d_r.push((f_r - i_r) * ease) : d_r[i] += (f_r - i_r) * ease;
                        (d_g[i] == undefined) ? d_g.push((f_g - i_g) * ease) : d_g[i] += (f_g - i_g) * ease;
                        (d_b[i] == undefined) ? d_b.push((f_b - i_b) * ease) : d_b[i] += (f_b - i_b) * ease;

                        (d_o[i] == undefined) ? d_o.push((f_o - i_o) * ease) : d_o[i] += (f_o - i_o) * ease;

                        var rgb = [i_r + a_r, i_g + a_g, i_b + a_b];

                        fill_layer.setProperty('_pt', new GRGBColor(rgb));
                        fill_layer.setProperty('_op', i_o + a_o);
                    } else if(color_changed && !opacity_changed) {
                        var i_r = initial_color[i][0],
                            i_g = initial_color[i][1],
                            i_b = initial_color[i][2],
                            f_r = color[0],
                            f_g = color[1],
                            f_b = color[2];

                        var a_r = ((f_r - i_r) == 0) ? 0: (f_r - i_r) * ease,
                            a_g = ((f_g - i_g) == 0) ? 0: (f_g - i_g) * ease,
                            a_b = ((f_b - i_b) == 0) ? 0: (f_b - i_b) * ease;

                        /* TODO: Fix colour easing values */
                        (d_r[i] == undefined) ? d_r.push((f_r - i_r) * ease) : d_r[i] += (f_r - i_r) * ease;
                        (d_g[i] == undefined) ? d_g.push((f_g - i_g) * ease) : d_g[i] += (f_g - i_g) * ease;
                        (d_b[i] == undefined) ? d_b.push((f_b - i_b) * ease) : d_b[i] += (f_b - i_b) * ease;

                        var rgb = [i_r + a_r, i_g + a_g, i_b + a_b];

                        fill_layer.setProperty('_pt', new GRGBColor(rgb));
                    } else {
                        var i_o = initial_opacity[i],
                            f_o = opacity;

                        var a_o = (f_o - i_o) * ease;

                        (d_o[i] == undefined) ? d_o.push((f_o - i_o) * ease) : d_o[i] += (f_o - i_o) * ease;

                        fill_layer.setProperty('_op', i_o + a_o);
                    }
                }
            } else if(obj[i].type == ANIMATE.TYPE.ROTATE) {

            }
        }

        if(fps) {
            // eslint-disable-next-line no-console
            console.log('FPS', diff, elap_time, tot_dur);
            elap_time++;
            diff++;
        } else {
            if(elap_time + delta > tot_dur) delta = tot_dur - elap_time;
            elap_time += delta;
            diff = timestamp - start;
        }

        then = now;

        // eslint-disable-next-line no-console
        console.log('time elapsed',elap_time, delta, obj.length, tot_dur);

        if(diff <= tot_dur) {
            window.requestAnimationFrame(step);
        } else {
            // Reset transformations
        }

        if(loop) {
            window.requestAnimationFrame(step);
            start = 0;
        }
    }

    window.requestAnimationFrame(step);
};

Animate.save = function() {
    // eslint-disable-next-line no-console
    console.log('Saving frame');

    var page = gDesigner.getActiveDocument().getScene().getActivePage(),
        view = gDesigner.getActiveDocument().getActiveWindow().getView(),
        tmp_canvas = document.createElement('canvas'),
        context = tmp_canvas.getContext('2d');

    canvas = document.getElementsByTagName('canvas')[0];
    tmp_canvas.width = page.$w || 200;
    tmp_canvas.height = page.$h || 400;

    var shift_x = view.getScrollX(),
        shift_y = view.getScrollY();

    context.drawImage(canvas, shift_x, shift_y);

    var data_url = tmp_canvas.toDataURL('image/png');
    var image_data = context.getImageData(0, 0, tmp_canvas.width, tmp_canvas.height);

    Animate.imgs.data_url.push(data_url);
    Animate.imgs.image_data.push(image_data);
};

Animate.setFPS = function() {
    fps = fps ? !1 : !0;
};

Animate.setFPSValue = function(value) {
    fps_val = value;

    // eslint-disable-next-line no-console
    console.log('FPS VALUE', fps_val);
};

Animate.toggleOnion = function() {
    onion = onion ? !1: !0;
};

Animate.captureFrames = function() {
    capture = capture ? !1 : !0;
    Animate.setFPS();

    // eslint-disable-next-line no-console
    console.log('set capture', capture, 'set fps', fps)
};

Animate.loop = function() {
    loop = loop ? !1 : !0;

    // eslint-disable-next-line no-console
    console.log('set loop', loop);
}

Animate.imgs = {
    data_url: [],
    image_data: []
};

Animate.data = {
    ELEMENTS,
    loop,
    captureFrames: capture,
    easings: ['linear', 'easeIn', 'easeOut', 'easeInOut', 'easeOutElastic', 'easeOutSin', 'easeInBounce', 'easeOutBounce'],
    fps: [24, 60]
};

Animate.resetData = function() {
    Animate.imgs.data_url = [];
    Animate.imgs.image_data = [];
};

Animate.render = function() {
    Animate.resetData();
    Animate.captureFrames();
}

function selectEase(easing) {
    switch(easing) {
        case 'linear':
            return Easing.linear;
        case 'easeIn':
            return Easing.easeIn;
        case 'easeOut':
            return Easing.easeOut;
        case 'easeInOut':
            return Easing.easeInOut;
        case 'easeOutElastic':
            return Easing.easeOutElastic;
        case 'easeOutSin':
            return Easing.easeOutSin;
        case 'easeInBounce':
            return Easing.easeInBounce;
        case 'easeOutBounce':
            return Easing.easeOutBounce;
        default:
            throw new Error('No such easing available.');
            break;
    }
}

function originTransformation(origin) {
    /* Object Matrix

            0     0.5     1
    0   [  'TL',  'TM',  'TR'  ]
    0.5 [  'ML',  'MM',  'MR'  ]
    1   [  'BL',  'BM',  'BR'  ]

    */
    var ox, oy;

    switch(origin) {
        case 'TL':
            ox = 0; oy = 0;
            break;
        case 'TM':
            ox = 0.5; oy = 0;
            break;
        case 'TR':
            ox = 1; oy = 0;
            break;
        case 'ML':
            ox = 0; oy = 0.5;
            break;
        case 'MM':
            ox = 0.5; oy = 0.5;
            break;
        case 'MR':
            ox = 1; oy = 0.5;
            break;
        case 'BL':
            ox = 0; oy = 1;
            break;
        case 'BM':
            ox = 0.5; oy = 1;
            break;
        case 'BR':
            ox = 1; oy = 1;
            break;
    }
    // eslint-disable-next-line no-console
    console.log('Origin shifted', ox, oy);

    return { 'x': ox, 'y': oy };
}

async function reset(obj) {
    for (var i = 0; i < obj.length; i++) {
        await resetTransformation(obj[i]);

        // eslint-disable-next-line no-console
        console.log('INFO', obj[i])
    }
}

function resetTransformation(obj) {
    // eslint-disable-next-line no-console
    console.log('Resetting...');

    var element = selectById(obj.element);
    var bbox = element.getGeometryBBox();

    var x, y;

    switch(obj.type) {
        case ANIMATE.TYPE.TRANSLATE:
            // var t_coord = originTransformation(origin);
            // t_coord.x = (x == 0) ? 0: t_coord.x;
            // t_coord.y = (y == 0) ? 0: t_coord.y;
            x = (obj.x == bbox.getX()) ? 0: bbox.getX();
            y = (obj.y == bbox.getY()) ? 0: bbox.getY();

            // eslint-disable-next-line no-console
            console.log('x', x, 'y', y, bbox.getX(), bbox.getY());

            element.transform(new GTransform().translated(-x, -y));
            break;
        case ANIMATE.TYPE.SCALE:
            x = obj.x;
            y = obj.y;

            var sx = 1 - (x / bbox.getWidth()),
                sy = 1 - (y / bbox.getHeight());

            element.transform(new GTransform()
                .translated(bbox.getX() - (x / 2), bbox.getY() - (y / 2))
                .scaled(sx, sy))
                .translated(bbox.getX() + (x / 2), bbox.getX() - (y / 2));
            break;
        case ANIMATE.TYPE.ROTATE:
            break;
        case ANIMATE.TYPE.COLOR:
            break;
        default:
            break;
    }
}

function findElement(id) {
    let arr = ELEMENTS;

    for(let i = 0; i < arr.length; i++) {
        if(arr[i]._effId === id) {
            return arr[i];
        }
    }
}

module.exports = Animate;