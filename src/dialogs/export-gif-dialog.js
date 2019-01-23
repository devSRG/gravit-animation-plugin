const fs = require('fs');
const path = require('path');
const GIF = require('../../lib/gif');

const WORKER_SCRIPT = '../../src/animation-panel/lib/gif.worker.js';

class ExportDialog {
    constructor(img_array, img_data) {
        this.img_array = img_array;
        this.img_data = img_data;
        this.blob_data = null;

        // eslint-disable-next-line no-unused-vars
        let loop_options = [
            {type: 'None', value: 1},
            {type: '2', value: 2},
            {type: '3', value: 3},
            {type: '4', value: 4},
            {type: 'Infinite', value: -1}
        ];
        let title = $('<div/>').append($('<h3/>').text('Export GIF'));
        let img_holder = $('<div/>')
            .addClass('gif-preview')
            .append([
                $('<div/>').addClass('gif-placeholder').text('GIF'),
                $('<div/>')
                    .addClass('gif-info')
                    .append([
                        $('<div/>').addClass('image-res').text('-'),
                        $('<div/>').addClass('image-size').text('-')
                    ])
            ]);
        let settings = $('<div/>')
            .addClass('gif-settings')
            .append([
                $('<div/>')
                    .append([
                        $('<label/>').text('FPS'),
                        $('<div/>').text('24')
                    ]),
                $('<div/>')
                    .append([
                        $('<label/>').text('Delay'),
                        $('<input/>')
                            .attr('type', 'text')
                            .val(0)
                            .gInputBox({
                                default: 0,
                                minValue: 0,
                                maxValue: 5000,
                                postfix: 'ms'
                            })
                    ]),
                $('<div/>')
                    .append([
                        $('<label/>').text('Loop'),
                        $('<input/>').attr('type', 'checkbox')
                    ]),
                $('<div/>')
                    .append([
                        $('<label/>').text('Output frames'),
                        $('<input/>').attr('type', 'checkbox')
                    ]),
                $('<div/>')
                    .append([
                        $('<div/>').addClass('clear'),
                        $('<button/>')
                            .text('Generate Preview')
                            .on('click', function() { this.addGIF(); }.bind(this))
                    ]),
                $('<div/>')
                    .addClass('file-name')
                    .append([
                        $('<label/>').text('File name'),
                        $('<input/>').attr('type', 'text')
                    ])
            ]);
        let content = $('<div/>').append([img_holder, settings]);

        this._dialog = $('<div/>').append(title).append(content);
        this._dialog.gDialog({
            className: 'ap-gif-export-dialog',
            buttons: [
                $('<button/>').text('Cancel').on('click', function() { this.close(); }.bind(this)),
                $('<button/>').text('Export').on('click', function() { this.save(); }.bind(this))
            ]
        });

    }

    addGIF() {
        let img_tag = $('<img/>');
        let target = $('.gif-settings');
        let inputs = target.find('input');
        let img_res = $('.image-res');
        let img_size = $('.image-size');

        //let selects = target.find('select');
        let options = {
            delay: parseInt(inputs[0].value),
            loop: inputs[1].checked,
            frames: inputs[2].checked
        };

        img_res.text('Generating GIF');
        img_size.text('');

        img_tag.on('load', function() { img_res.text(this.naturalWidth + 'px x ' + this.naturalHeight + 'px'); });
        img_tag.click(function() {
            let url = this.src;
            this.src = url;
        });

        this.saveTemp('tmp', options).then((result) => {
            // eslint-disable-next-line no-console
            console.log('GIF processed', result);

            let div = $('.gif-preview > div').eq(0);

            img_tag.attr('src', result.url);
            div.html(img_tag);
            img_size.text(Math.round(result.size / 1024) + ' kB');
        });
    }

    saveTemp(name, options) {
        let promise = new Promise(function(resolve) {
            let self = this;
            let fps = 24;
            let fps_ms = 1000 / fps;
            let page = gDesigner.getActiveDocument().getScene().getActivePage();

            let gif = new GIF({
                width: page.$w,
                height: page.$h,
                workers: 2,
                quality: 8,
                repeat: options.loop ? 0: -1,
                workerScript: WORKER_SCRIPT
            });

            for(let i = 0; i < this.img_array.length; i++) {
                let data = this.img_array[i].split(',')[1];

                gif.addFrame(this.img_data[i], {delay: fps_ms});

                if(options.frames) {
                    fs.writeFileSync(path.resolve(__dirname, '../../imgs/img00') + i +'.png', Buffer.from(data, 'base64'));
                }
            }
            if(options.delay != 0) {
                let frames = Math.round(options.delay / fps_ms);

                for(let i = 0; i < frames; i++) {
                    gif.addFrame(this.img_data[this.img_data.length - 1], {delay: 16.6});
                }
            }

            gif.on('finished', function(blob) {
                self.blob_data = blob;

                let data = URL.createObjectURL(blob);

                resolve({url: data, size: blob.size});
            });
            gif.render();
        }.bind(this));

        return promise;
    }

    save() {
        let input = $('.file-name').find('input');
        let file_name = input.val();

        if(file_name == null) return false;

        let reader = new FileReader();

        reader.onload = function() {
            let file_path = path.resolve(__dirname, '../../imgs/') + file_name + '.gif';
            let data = reader.result;
            let b64_data = data.split(',')[1];

            fs.writeFileSync(file_path, Buffer.from(b64_data, 'base64'));

            // eslint-disable-next-line no-console
            console.log('File writed successfully', path);
        };
        reader.readAsDataURL(this.blob_data);
    }

    open() {
        this._dialog.gDialog('open', true);
    }

    close() {
        this._dialog.gDialog('close');
    }

}
/*class TimelineDialog {
	constructor(imgArray, gif) {
		var title = $('<div/>').attr('style', 'margin-bottom:10px;').append($('<h3/>')).text('Image Timeline');
		var container = $('<div/>').attr('style', 'width:1200px;height:450px;')
		var imgCon = $('<div/>').attr('style', 'width:70%;height:inherit;overflow-y:scroll;float:left;');
		var gifPreview = $('<div/>').attr('style', 'width:30%;height:inherit;background:#333;float:left;');
		container.append(imgCon).append(gifPreview);
		for(var i = 0; i < imgArray.length; i++) {
			var img = $('<img/>').attr('src', imgArray[i]).attr('style', 'height:200px;background:#fff;margin: 0 5px 5px 0;');
			imgCon.append(img);
		}
		var imgGif = $('<img/>').attr('src', gif).attr('style', 'width:inherit;');
		gifPreview.append(imgGif);
		this._dialog = $('<div></div>').append(title).append(container);
		this._dialog.gDialog({
			className: 'g-timeline-dialog',
			buttons: [
				$('<button>Close</button>').on('click', () => {	this.close(); })
			]
		});
	}

	open() {
		this._dialog.gDialog('open', true);
	}

	close() {
		this._dialog.gDialog('close');
	}
}*/

module.exports = ExportDialog;