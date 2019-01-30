const fs = require('fs');
const {CONSTANTS, shortID, longID, updateStatus} = require('./util/util');
const Animate = require('./animate-property');

const ExportDialog = require('./dialogs/export-gif-dialog');
const SettingsDialog = require('./dialogs/settings-dialog');

const _core = GravitDesigner.framework.core,
    GLength = _core.GLength,
    GObject = _core.GObject,
    GColor = _core.GColor;

const GProperties = GravitDesigner.GProperties;

const ANIMATE = CONSTANTS.ANIMATE;

let anim = [];

let count = 1,
    count_t = 1,
    count_s = 1,
    count_r = 1,
    count_c = 1;

let ELEMENTS = Animate.data.ELEMENTS;

let self;

function AnimationPanel() {}

GObject.inherit(AnimationPanel, GProperties);

AnimationPanel.prototype._panel = null;
AnimationPanel.prototype._toolbar = null;

AnimationPanel.prototype.init = function (panel, toolbar) {
    self = this;

    this._toolbar = toolbar.addClass('animation-property-toolbar');
    this._panel = panel.addClass('animation-property-panel');

    $('<label/>')
        .text('Animation Panel')
        .appendTo(this._toolbar);
    $('<button/>')
        .addClass('gravit-icon-export')
        .attr('data-title', 'Export GIF')
        .attr('disabled', Animate.imgs.image_data != undefined ? false: true)
        .on('click', function() { this.exportGIF(); }.bind(this))
        .appendTo(this._toolbar);
    $('<button/>')
        .addClass('gravit-icon-settings')
        .attr('data-title', 'Open settings')
        .on('click', () => { (new SettingsDialog()).open(); })
        .appendTo(this._toolbar);

    $('<input/>')
        .addClass('file-dialog')
        .attr('type', 'file')
        .attr('accept', '.animate')
        .css('display', 'none')
        .on('change', function() { read(this.files); })
        .appendTo(this._panel);

    let sub_toolbar_sections = [
        $('<div/>')
            .addClass('st-section')
            .append([
                $('<button/>')
                    .addClass('gravit-icon-ellipse')
                    .attr('data-title', 'Open Animate file')
                    .on('click', function() { importFile(); }),
                $('<button/>')
                    .addClass('gravit-icon-save')
                    .attr('data-title', 'Save Animate file')
                    .on('click', () => { save(); })
            ]),
        $('<div/>')
            .addClass('st-section')
            .append([
                $('<button/>')
                    .addClass('gravit-icon-circle')
                    .attr('data-title', 'Render')
                    .on('click', function(e) { Animate.render(); this.preview(e, 'object'); }.bind(this)),
                $('<button/>')
                    .addClass('gravit-icon-presentation')
                    .attr('data-title', 'Play')
                    .attr('disabled', true)
                    .on('click', function noop() {}),
                $('<button/>')
                    .addClass('gravit-icon-plus')
                    .attr('data-title', 'Add keyframe')
                    .on('click', function() { this.addKeyframe(); }.bind(this))
            ])
    ];

    let default_status = [
        $('<div/>')
            .addClass('status-msg')
            .append($('<label/>').text('')),
        $('<div/>')
            .append($('<label/>').text('Loop: '+ Animate.data.loop))
    ];

    $('<div/>')
        .addClass('sub-toolbar')
        .append(sub_toolbar_sections)
        .appendTo(this._panel);

    $('<div/>')
        .addClass('status-bar')
        .append(default_status)
        .appendTo(this._panel);
};

// eslint-disable-next-line no-unused-vars
AnimationPanel.prototype.isAvailable = function(transformMode) {
    return !!gDesigner.getActiveDocument();
};

// eslint-disable-next-line no-unused-vars
AnimationPanel.prototype.update = function(document, elements) {
    return true;
};

AnimationPanel.prototype.exportGIF = function() {
    let img_base64 = Animate.imgs.data_url;
    let img_data = Animate.imgs.image_data;

    let dialog = new ExportDialog(img_base64, img_data);

    dialog.open();
};

AnimationPanel.prototype.addKeyframe = function() {
    let LONG_ID = longID();

    let option_types = [
        ['Translate', ANIMATE.TYPE.TRANSLATE],
        ['Scale', ANIMATE.TYPE.SCALE],
        ['Rotate', ANIMATE.TYPE.ROTATE],
        ['Color', ANIMATE.TYPE.COLOR]
    ];

    let options = $('<div/>')
        .addClass('options')
        .append(option_types.map((option_type) => {
            return (
                $('<div/>')
                    .gPropertyRow({
                        columns: [
                            {
                                width: '90%',
                                content: $('<label/>').html(option_type[0])
                            },
                            {
                                width: '10%',
                                content: $('<span/>')
                                    .html('+')
                                    .on('click', function() {
                                        this.addAnimationLayer(LONG_ID, option_type[1]);
                                    }.bind(this))
                            }
                        ]
                    }).append($('<div/>').addClass('layer'))
            );
        }));

    $('<div/>').gPropertyRow({
        columns: [
            {
                width: '6%',
                content: $('<span/>')
                    .addClass('anim-marker')
                    .on('click', function(e) {
                        this.toggleAnimationState(e, 'keyframe');
                    }.bind(this))
            },
            {
                width: '78%',
                content: [
                    $('<label/>')
                        .html('Keyframe ' + count)
                        .on('click', function (e) { this.toggleKeyframe(e); }.bind(this))
                        .on('dblclick', function(e) { this.renameLayer(e); }.bind(this)),
                    $('<button/>')
                        .addClass('g-accordion')
                        .on('click', function (e) { this.toggleKeyframe(e); }.bind(this))
                        .append($('<span/>').addClass('gravit-icon-right'))
                ]
            },
            {
                width: '8%',
                content:
                                $('<span/>')
                                    .addClass('gravit-icon-presentation')
                                    .on('click', function(e) { this.preview(e, 'object'); }.bind(this))
            },
            {
                width: '8%',
                content:
                                $('<span/>')
                                    .on('click', function(e) { this.deleteKeyframe(e); }.bind(this))
                                    .addClass('gravit-icon-trash')
            }

        ]
    }).addClass('keyframe').attr('data-id', LONG_ID).append(options).appendTo(this._panel);

    count++;
    scrollOffset();

    return LONG_ID;
};

AnimationPanel.prototype.toggleKeyframe = function(event) {
    let row = $(event.target).closest('.content').find('button > span');
    let options = $(event.target).closest('.g-property-row').find('.options');

    if(row.hasClass('gravit-icon-down')) {
        row.removeClass('gravit-icon-down').addClass('gravit-icon-right');
        options.css({height: 0, overflow: 'hidden'});
    } else {
        row.removeClass('gravit-icon-right').addClass('gravit-icon-down');
        options.css({height: 'inherit'});
    }
    scrollOffset();
};

AnimationPanel.prototype.deleteKeyframe = function(event) {
    $(event.target).closest('.g-property-row').remove();
};

AnimationPanel.prototype.addAnimationLayer = function(keyframe_id, type, data = {}) {
    let accordion_btn = $('<button/>').addClass('g-accordion').on('click', function(e) { this.toggleAnimLayer(e); }.bind(this)).append($('<span/>').addClass('gravit-icon-down'));
    let keyframe = $(`[data-id=${keyframe_id}]`);
    let layer = keyframe.find('.options .layer');
    let parent = layer.parent();

    let origin_grid = $('<div/>')
        .addClass('origin-grid')
        .append([
            $('<div/>').addClass('tl').on('click', (e) => { setOrigin(e); }),
            $('<div/>').addClass('tm').on('click', (e) => { setOrigin(e); }),
            $('<div/>').addClass('tr').on('click', (e) => { setOrigin(e); }),
            $('<div/>').addClass('ml').on('click', (e) => { setOrigin(e); }),
            $('<div/>').addClass('mm selected').on('click', (e) => { setOrigin(e); }),
            $('<div/>').addClass('mr').on('click', (e) => { setOrigin(e); }),
            $('<div/>').addClass('bl').on('click', (e) => { setOrigin(e); }),
            $('<div/>').addClass('bm').on('click', (e) => { setOrigin(e); }),
            $('<div/>').addClass('br').on('click', (e) => { setOrigin(e); })
        ])
        .append($('<input/>').attr('type', 'hidden').val('MM'));

    let translate = $('<div/>')
        .gPropertyRow({
            columns: [
                {
                    width: '6%',
                    content: $('<span/>')
                        .addClass('anim-marker')
                        .on('click', function(e) { this.toggleAnimationState(e, ANIMATE.TYPE.TRANSLATE); }.bind(this))
                },
                {
                    width: '10%',
                    content: $('<label/>').html(count_t)
                },
                {
                    width: '25%',
                    content: [
                        $('<span/>')
                            .addClass('g-input-label')
                            .html('X'),
                        $('<input/>')
                            .attr('type', 'text')
                            .val(data.x || 0)
                            .on('change', function() {
                                let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                                $(this).gInputBox('value', cv);
                            })
                            .gInputBox({
                                minValue: -9999,
                                maxValue: 9999,
                                postfix: 'px'
                            })
                    ]
                },
                {
                    width: '25%',
                    content: [
                        $('<span/>')
                            .addClass('g-input-label')
                            .html('Y'),
                        $('<input/>')
                            .attr('type', 'text')
                            .val(data.y || 0)
                            .on('change', function() {
                                let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                                $(this).gInputBox('value', cv);
                            })
                            .gInputBox({
                                minValue: -9999,
                                maxValue: 9999,
                                postfix: 'px'
                            })
                    ]
                },
                {
                    width: '4%',
                    content: ''
                },
                {
                    width: '10%',
                    content: $('<span/>')
                        .addClass('gravit-icon-circle')
                        .attr('data-title', 'Onion skining')
                        .on('click', function(e) { this.toggleOnionSkin(e); }.bind(this))
                },
                {
                    width: '10%',
                    content: $('<span/>')
                        .addClass('gravit-icon-right')
                        .on('click', function(e) { this.preview(e, ANIMATE.TYPE.TRANSLATE); }.bind(this))
                },
                {
                    width: '10%',
                    content: $('<span/>')
                        .addClass('gravit-icon-trash')
                        .on('click', function(e) { this.deleteAnimationLayer(e); }.bind(this))
                }
            ]
        })
        .gPropertyRow({
            columns: [
                {
                    width: '10%',
                    content: ''
                },
                {
                    width: '25%',
                    content: $('<label/>').html('Duration')
                },
                {
                    width: '25%',
                    content: $('<input/>')
                        .attr('type', 'text')
                        .val(data.dur || 0)
                        .on('change', function() {
                            let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                            $(this).gInputBox('value', cv);
                        })
                        .gInputBox({
                            minValue: 0,
                            maxValue: 9999,
                            postfix: 'ms'
                        })
                },
                {
                    width: '20%',
                    content: $('<label/>').html('Delay')
                },
                {
                    width: '20%',
                    content: $('<input/>')
                        .attr('type', 'text')
                        .val(data.delay || 0)
                        .on('change', function() {
                            let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                            $(this).gInputBox('value', cv);
                        })
                        .gInputBox({
                            default: 0,
                            minValue: 1,
                            maxValue: 9999,
                            postfix: 'ms'
                        })
                }
            ]
        })
        .gPropertyRow({
            columns: [
                {
                    width: '10%',
                    content: ''
                },
                {
                    width: '25%',
                    content: $('<label/>').html('Easing')
                },
                {
                    width: '45%',
                    content: $('<select/>')
                        .append(Animate.data.easings.map((e) => {
                            return $('<option/>').attr('value', e).html(e);
                        }))
                },
                {
                    width: '20%',
                    content: $('<div/>').append(origin_grid.clone(true))
                }
            ]
        }).addClass('option translate-option').attr('data-id', shortID());

    let scale = $('<div/>')
        .gPropertyRow({
            columns: [
                {
                    width: '6%',
                    content: $('<span/>')
                        .addClass('anim-marker')
                        .on('click', function(e) { this.toggleAnimationState(e, ANIMATE.TYPE.SCALE); }.bind(this))
                },
                {
                    width: '10%',
                    content: $('<label/>').html(count_s)
                },
                {
                    width: '25%',
                    content: [
                        $('<span/>')
                            .addClass('g-input-label')
                            .html('X'),
                        $('<input/>')
                            .attr('type', 'text')
                            .val(data.x || 0)
                            .on('change', function() {
                                let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                                $(this).gInputBox('value', cv);
                            })
                            .gInputBox({
                                minValue: -9999,
                                maxValue: 9999,
                                postfix: 'px'
                            })
                    ]
                },
                {
                    width: '25%',
                    content: [
                        $('<span/>')
                            .addClass('g-input-label')
                            .html('Y'),
                        $('<input/>')
                            .attr('type', 'text')
                            .val(data.y || 0)
                            .on('change', function() {
                                let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                                $(this).gInputBox('value', cv);
                            })
                            .gInputBox({
                                minValue: -9999,
                                maxValue: 9999,
                                postfix: 'px'
                            })
                    ]
                },
                {
                    width: '14%',
                    content: ''
                },
                {
                    width: '10%',
                    content: $('<span/>')
                        .addClass('gravit-icon-right')
                        .on('click', function(e) { this.preview(e, ANIMATE.TYPE.SCALE); }.bind(this))
                },
                {
                    width: '10%',
                    content: $('<span/>')
                        .addClass('gravit-icon-trash')
                        .on('click', function(e) { this.deleteAnimationLayer(e); }.bind(this))
                }
            ]
        })
        .gPropertyRow({
            columns: [
                {
                    width: '10%',
                    content: ''
                },
                {
                    width: '25%',
                    content: $('<label/>')
                        .html('Duration')
                },
                {
                    width: '25%',
                    content: $('<input/>')
                        .attr('type', 'text')
                        .val(data.dur || 0)
                        .on('change', function() {
                            let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                            $(this).gInputBox('value', cv);
                        })
                        .gInputBox({
                            minValue: 0,
                            maxValue: 9999,
                            postfix: 'ms'
                        })
                },
                {
                    width: '20%',
                    content: $('<label/>').html('Delay')
                },
                {
                    width: '20%',
                    content: $('<input/>')
                        .attr('type', 'text')
                        .val(data.delay || 0)
                        .on('change', function() {
                            let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                            $(this).gInputBox('value', cv);
                        })
                        .gInputBox({
                            default: 0,
                            minValue: 1,
                            maxValue: 9999,
                            postfix: 'ms'
                        })
                }
            ]
        })
        .gPropertyRow({
            columns: [
                {
                    width: '10%',
                    content: ''
                },
                {
                    width: '25%',
                    content: $('<label/>').html('Easing')
                },
                {
                    width: '45%',
                    content: $('<select/>')
                        .append(Animate.data.easings.map((e) => {
                            return $('<option/>').attr('value', e).html(e);
                        }))
                },
                {
                    width: '20%',
                    content: $('<div/>').append(origin_grid.clone(true))
                }
            ]
        }).addClass('option scale-option').attr('data-id', shortID());

    let rotate = $('<div/>')
        .gPropertyRow({
            columns: [
                {
                    width: '6%',
                    content: $('<span/>')
                        .addClass('anim-marker')
                        .on('click', function(e) { this.toggleAnimationState(e, ANIMATE.TYPE.ROTATE); }.bind(this))
                },
                {
                    width: '10%',
                    content: $('<label/>').html(count_r)
                },
                {
                    width: '20%',
                    content: [
                        $('<span/>')
                            .addClass('g-input-label')
                            .html('X'),
                        $('<input/>')
                            .attr('type', 'text')
                            .val(data.x || 0)
                            .on('change', function() {
                                let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                                $(this).gInputBox('value', cv);
                            })
                            .gInputBox({
                                minValue: -9999,
                                maxValue: 9999,
                                postfix: '°'
                            })
                    ]
                },
                {
                    width: '20%',
                    content: [
                        $('<span/>')
                            .addClass('g-input-label')
                            .html('Y'),
                        $('<input/>')
                            .attr('type', 'text')
                            .val(data.y || 0)
                            .on('change', function() {
                                let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                                $(this).gInputBox('value', cv);
                            })
                            .gInputBox({
                                minValue: -9999,
                                maxValue: 9999,
                                postfix: '°'
                            })
                    ]
                },
                {
                    width: '20%',
                    content: [
                        $('<span/>')
                            .addClass('g-input-label')
                            .html('Z'),
                        $('<input/>')
                            .attr('type', 'text')
                            .val(data.z || 0)
                            .on('change', function() {
                                let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                                $(this).gInputBox('value', cv);
                            })
                            .gInputBox({
                                minValue: -9999,
                                maxValue: 9999,
                                postfix: '°'
                            })
                    ]
                },
                {
                    width: '4%',
                    content: ''
                },
                {
                    width: '10%',
                    content: $('<span/>')
                        .addClass('gravit-icon-right')
                        .on('click', function(e) { this.preview(e, ANIMATE.TYPE.ROTATE); }.bind(this))
                },
                {
                    width: '10%',
                    content: $('<span/>')
                        .addClass('gravit-icon-trash')
                        .on('click', function(e) { this.deleteAnimationLayer(e); }.bind(this))
                }
            ]
        })
        .gPropertyRow({
            columns: [
                {
                    width: '10%',
                    content: ''
                },
                {
                    width: '25%',
                    content: $('<label/>').html('Duration')
                },
                {
                    width: '25%',
                    content: $('<input/>')
                        .attr('type', 'text')
                        .val(data.dur || 0)
                        .on('change', function() {
                            let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                            $(this).gInputBox('value', cv);
                        })
                        .gInputBox({
                            minValue: 0,
                            maxValue: 9999,
                            postfix: 'ms'
                        })
                },
                {
                    width: '20%',
                    content: $('<label/>').html('Delay')
                },
                {
                    width: '20%',
                    content: $('<input/>')
                        .attr('type', 'text')
                        .val(data.delay || 0)
                        .on('change', function() {
                            let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                            $(this).gInputBox('value', cv);
                        })
                        .gInputBox({
                            minValue: 0,
                            maxValue: 9999,
                            postfix: 'ms'
                        })
                }
            ]
        })
        .gPropertyRow({
            columns: [
                {
                    width: '10%',
                    content: ''
                },
                {
                    width: '25%',
                    content: $('<label/>').html('Easing')
                },
                {
                    width: '45%',
                    content: $('<select/>')
                        .append(Animate.data.easings.map((e) => {
                            return $('<option/>').attr('value', e).html(e);
                        }))
                },
                {
                    width: '20%',
                    content: $('<div/>').append(origin_grid.clone(true))
                }
            ]
        }).addClass('option rotate-option').attr('data-id', shortID());

    let color = $('<div/>')
        .gPropertyRow({
            columns: [
                {
                    width: '6%',
                    content: $('<span/>')
                        .addClass('anim-marker')
                        .on('click', function(e) { this.toggleAnimationState(e, ANIMATE.TYPE.COLOR); }.bind(this))
                },
                {
                    width: '10%',
                    content: $('<label/>').html(count_c)
                },
                {
                    width: '20%',
                    content: [
                        $('<div/>')
                            .gPatternChooser({types: [GColor]})
                            .on('patternchange', (e,c,o) => { setColor(e,c,o); }),
                        $('<input/>').attr('type', 'hidden')
                    ]
                },
                {
                    width: '20%',
                    content: $('<label/>').html('Opacity')
                },
                {
                    width: '20%',
                    content: $('<input/>')
                        .attr('type', 'text')
                        .val(data.opt || 100)
                        .on('change', function() {
                            let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                            $(this).gInputBox('value', cv);
                        })
                        .gInputBox({
                            default: 100,
                            minValue: 0,
                            maxValue: 100,
                            postfix: '%'
                        })
                },
                {
                    width: '4%',
                    content: ''
                },
                {
                    width: '10%',
                    content: $('<span/>')
                        .addClass('gravit-icon-right')
                        .on('click', function(e) { this.preview(e, ANIMATE.TYPE.COLOR); }.bind(this))
                },
                {
                    width: '10%',
                    content: $('<span/>')
                        .addClass('gravit-icon-trash')
                        .on('click', function(e) { this.deleteAnimationLayer(e); }.bind(this))
                }
            ]
        })
        .gPropertyRow({
            columns: [
                {
                    width: '10%',
                    content: ''
                },
                {
                    width: '25%',
                    content: $('<label/>').html('Duration')
                },
                {
                    width: '25%',
                    content: $('<input/>')
                        .attr('type', 'text')
                        .val(data.dur || 0)
                        .on('change', function() {
                            let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                            $(this).gInputBox('value', cv);
                        })
                        .gInputBox({
                            minValue: 0,
                            maxValue: 9999,
                            postfix: 'ms'
                        })
                },
                {
                    width: '20%',
                    content: $('<label/>').html('Delay')
                },
                {
                    width: '20%',
                    content: $('<input/>')
                        .attr('type', 'text')
                        .val(data.delay || 0)
                        .on('change', function() {
                            let cv = GLength.parseEquationValue($(this).gInputBox('value'));
                            $(this).gInputBox('value', cv);
                        })
                        .gInputBox({
                            minValue: 0,
                            maxValue: 9999,
                            postfix: 'ms'
                        })
                }
            ]
        })
        .gPropertyRow({
            columns: [
                {
                    width: '10%',
                    content: ''
                },
                {
                    width: '25%',
                    content: $('<label/>').html('Easing')
                },
                {
                    width: '65%',
                    content: $('<select/>')
                        .append(Animate.data.easings.map((e) => {
                            return $('<option/>').attr('value', e).html(e);
                        }))
                }
            ]
        }).addClass('option color-option').attr('data-id', shortID());

    var header_content, row;

    switch(type) {
    case ANIMATE.TYPE.TRANSLATE:
        header_content = parent.eq(0).find('.columns > .column:first-child > .content');
        row = layer.eq(0);

        if(!header_content.has('button').length > 0) header_content.append(accordion_btn);

        row.append(translate);
        count_t++;
        break;

    case ANIMATE.TYPE.SCALE:
        header_content = parent.eq(1).find('.columns > .column:first-child > .content');
        row = layer.eq(1);

        if(!header_content.has('button').length > 0) header_content.append(accordion_btn);

        row.append(scale);
        count_s++;
        break;

    case ANIMATE.TYPE.ROTATE:
        header_content = parent.eq(2).find('.columns > .column:first-child > .content');
        row = layer.eq(2);

        if(!header_content.has('button').length > 0) header_content.append(accordion_btn);

        row.append(rotate);
        count_r++;
        break;

    case ANIMATE.TYPE.COLOR:
        header_content = parent.eq(3).find('.columns > .column:first-child > .content');
        row = layer.eq(3);

        if(!header_content.has('button').length > 0) header_content.append(accordion_btn);

        row.append(color);
        count_c++;
        break;

    default:
        break;
    }

    scrollOffset();
};

AnimationPanel.prototype.toggleAnimLayer = function(event) {
    let row = $(event.target).closest('.content').find('button > span');
    let layer = $(event.target).closest('.g-property-row').find('.layer');

    if(row.hasClass('gravit-icon-down')) {
        row.removeClass('gravit-icon-down').addClass('gravit-icon-right');
        layer.css({height: 0, overflow: 'hidden'});
    } else {
        row.removeClass('gravit-icon-right').addClass('gravit-icon-down');
        layer.css({height: 'inherit'});
    }
    scrollOffset();
};

AnimationPanel.prototype.deleteAnimationLayer = function(event) {
    let header = $(event.target).parents().eq(5);
    let content = header.find('.columns > .column > .content').first();
    let layer = $(event.target).closest('.layer');
    let id = $(event.target).closest('.option').data('id');

    removeAnimationData(id);

    $(event.target).closest('.g-property-row').remove();

    if(content.has('button') && layer.children().length == 0) content.find('button').remove();
};

AnimationPanel.prototype.renameLayer = function(event) {
    // eslint-disable-next-line no-unused-vars
    let target = $(event.target).closest('.g-property-row');
    /*let label = target.find('label').first();
    target
        .prepend($('<input/>')
                    .attr('type', 'text')
                    .attr('value', label.text())
                    .addClass('rename-input'));
    let input = target.find('input');
    input.focus();
    input.blur(function(event) { console.log('value',input.val());target.find('label').first().text(input.val());input.remove(); });*/
    return true;
};

AnimationPanel.prototype.preview = function(event, type) {
    var data;

    switch(type) {
    case ANIMATE.TYPE.TRANSLATE:
        data = fetchProperties(event, type);
        Animate.translate(data.element_id, data.x, data.y, data.dur, data.easing, data.origin);
        break;
    case ANIMATE.TYPE.SCALE:
        data = fetchProperties(event, type);
        Animate.scale(data.element_id, data.x, data.y, data.dur, data.easing, data.origin);
        break;
    case ANIMATE.TYPE.ROTATE:
        data = fetchProperties(event, type);
        Animate.rotate(data.element_id, data.r, data.dur, data.easing, data.origin);
        break;
    case ANIMATE.TYPE.COLOR:
        data = fetchProperties(event, type);
        Animate.color(data.element_id, data.clr, data.opt, data.dur, data.easing);
        break;
    case 'object':
        var duration = calculateDuration(anim);

        Animate.objects(anim, duration);
        break;
    default:
        return null;
    }
};

AnimationPanel.prototype.previewKeyframe = function() {
    let element = gDesigner.getActiveDocument().getEditor().getSelection()[0];
    Animate.object(element, anim);
};

AnimationPanel.prototype.toggleOnionSkin = function(event) {
    let el = $(event.target);
    if(el.hasClass('active')) {
        el.removeClass('active');
    } else {
        el.addClass('active');
    }
    Animate.toggleOnion();
};

AnimationPanel.prototype.toggleAnimationState = function(event, type) {
    let target = $(event.target);

    if(!target.hasClass('set')) {
        if(type == 'keyframe') {
            target.addClass('set');

            let markers = $(event.target).closest('.keyframe').find('.anim-markers').splice(0,1);

            markers.trigger('click');
        } else {
            let data = fetchProperties(event, type);
            if(data) {
                target.addClass('set');

                appendAnimationData(data);
            }
        }
    } else {
        target.removeClass('set');

        let id = target.closest('.option').data('id');

        removeAnimationData(id);
    }
};

// eslint-disable-next-line no-unused-vars
function easingChanged(ease) {

}

// eslint-disable-next-line no-unused-vars
function setColor(event, color, opacity) {
    let input = $(event.target).closest('.content').find('input')[0];

    input.value = color._value;
}

function scrollOffset() {
    let panel = document.getElementsByClassName('scrolling-panels')[0];

    panel.scrollTop = panel.scrollHeight;
}

// eslint-disable-next-line no-unused-vars
function appendKeyframeData(data) {
    if(!checkId(data.id).exists) {
        anim.push(data);
    }
}

function appendAnimationData(data) {
    if(!checkId(data.id).exists) {
        anim.push(data);
    }
}

function removeAnimationData(id) {
    let index = checkId(id).index;
    anim.splice(index, 1);
}

function checkId(id) {
    for (let i = 0; i < anim.length; i++) {
        if(anim[i].id == id) {
            return { 'exists': true, 'index': i };
        }
    }
    return { 'exists': false, 'index': null };
}

function fetchProperties(event, type) {
    let element = gDesigner.getActiveDocument().getEditor().getSelection();

    if(element == null) {
        updateStatus('Select an element.', 'error');

        return false;
    } else {
        element = element[0];
        ELEMENTS.push(element);
    }
    let target = $(event.target).closest('.option');

    let ID = target.data('id');
    let inputs = target.find('input');
    let selects = target.find('select');

    let x, y, dur, delay, origin, easing, color, opacity;
    let data;

    switch(type) {
    case ANIMATE.TYPE.TRANSLATE:
        x = parseInt(inputs[0].value) || 0;
        y = parseInt(inputs[1].value) || 0;
        dur = parseInt(inputs[2].value) || 0;
        delay = parseInt(inputs[3].value) || 0;
        origin = inputs[4].value;
        easing = selects[0].value;

        data =  {
            'id': ID,
            'type': ANIMATE.TYPE.TRANSLATE,
            'element_id': element._effId,
            'x': x,
            'y': y,
            'dur': dur,
            'delay': delay,
            'easing': easing,
            'origin': origin
        };

        return data;
    case ANIMATE.TYPE.SCALE:
        x = parseInt(inputs[0].value) || 0;
        y = parseInt(inputs[1].value) || 0;
        dur = parseInt(inputs[2].value) || 0;
        delay = parseInt(inputs[3].value) || 0;
        origin = inputs[4].value;
        easing = selects[0].value;

        data = {
            'id': ID,
            'type': ANIMATE.TYPE.SCALE,
            'element_id': element._effId,
            'x': x,
            'y': y,
            'dur': dur,
            'delay': delay,
            'easing': easing,
            'origin': origin
        };

        return data;
    case ANIMATE.TYPE.ROTATE:
        var r = parseInt(inputs[0].value) || 0;

        dur = parseInt(inputs[3].value) || 0;
        delay = parseInt(inputs[4].value) || 0;
        origin = inputs[5].value;
        easing = selects[0].value;

        data = {
            'id': ID,
            'type': ANIMATE.TYPE.ROTATE,
            'element_id': element._effId,
            'r': r,
            'dur': dur,
            'delay': delay,
            'easing': easing,
            'origin': origin
        };

        return data;
    case ANIMATE.TYPE.COLOR:
        color = JSON.parse('['+inputs[0].value+']');
        opacity = (inputs[1].value != '') ? parseInt(inputs[1].value) / 100 : 1;
        dur = parseInt(inputs[2].value) || 0;
        delay = parseInt(inputs[3].value) || 0;
        easing = selects[0].value;

        data = {
            'id': ID,
            'type': ANIMATE.TYPE.COLOR,
            'element_id': element._effId,
            'clr': color,
            'opt': opacity,
            'dur': dur,
            'delay': delay,
            'easing':easing
        };

        return data;
    default:
        return null;
    }
}

function calculateDuration(obj) {
    let max_duration = [];
    for(let i = 0; i < obj.length; i++) {
        max_duration.push(obj[i].dur + obj[i].delay);
    }
    return Math.max(...max_duration);
}

function setOrigin(event) {
    let parentNode = $(event.target.parentNode);
    let input = parentNode.find('input').first();

    parentNode.children().removeClass('selected');
    $(event.target).addClass('selected');
    input.val(event.target.classList[0].toUpperCase());
}

function importFile() {
    let dialog = $('.file-dialog');

    dialog.click();
}

function read(files) {
    let path = files.item(0).path;
    let json;

    fs.readFile(path, 'utf-8', (err, data) => {
        updateStatus('Loading file', 'info');

        if(err) throw err;

        json = JSON.parse(data);
        anim = json;

        constructUI(json);
    });
}

function constructUI(obj) {
    let id;

    if(obj.length > 0) {
        id = self.addKeyframe();
    }

    for(let i = 0; i < obj.length; i++) {
        if(obj[i].type == ANIMATE.TYPE.TRANSLATE) {
            self.addAnimationLayer(id, ANIMATE.TYPE.TRANSLATE, obj[i]);
        }
    }
}

function save() {
    let title = gDesigner.getActiveDocument().getTitle();
    if(title == 'Untitled') {
        updateStatus('Save your design.', 'warn');
        return false;
    }
    let dir = gDesigner.getActiveDocument().getStorage().getLastDirectory();
    let path = dir + '\\' + title + '.animate';
    let data = JSON.stringify(anim);
    fs.writeFile(path, data, (err) => {
        if(err) throw err;

        // eslint-disable-next-line no-console
        console.log('File written', path);
    });
}

module.exports = AnimationPanel;