var os = require('os');
var dialog = require('electron').remote.dialog;

class SettingsDialog {
    constructor() {
        var settings = [
            {
                title: 'FPS',
                description: 'Set the frame rate per second',
                type: 'select',
                values: [15, 24, 30, 60]
            },
            {
                title: 'Temp',
                description: 'Set path to temporary file location',
                type: 'path',
                values: os.tmpdir()
            },
            {
                title: 'Switch',
                description: 'Description',
                type: 'switch',
                values: []
            }
        ];

        var title = $('<h3/>').text('Settings');
        var content = $('<div/>')
            .append(settings.map(e => {
                return(
                    $('<div/>')
                        .addClass('setting')
                        .append([
                            $('<div/>')
                                .addClass('text')
                                .append([
                                    $('<label/>').text(e.title),
                                    $('<span/>').text(e.description)
                                ]),
                            $('<div/>')
                                .addClass('editor')
                                .append(this.createElement(e.type, e.values))
                        ])
                );
            }));

        this._dialog = $('<div/>').append(title).append(content);
        this._dialog.gDialog({
            className: 'ap-gif-settings-dialog',
            buttons: [
                $('<button/>').text('Cancel').on('click', function() { this.close(); }.bind(this)),
                $('<button/>').text('Save').on('click', function() { this.save(); }.bind(this))
            ]
        });
    }

    open() {
        this._dialog.gDialog('open', true);
    }

    close() {
        this._dialog.gDialog('close');
    }

    save() {
        return true;
    }

    createElement(type, values) {
        switch(type) {
        case 'path':
            return $('<div/>').addClass('path-input').append([
                $('<input/>').attr('type', 'text').val(values),
                $('<span/>').text('F').on('click', function(e) { this.openDialog(e); }.bind(this))
            ]);
        case 'input':
            return $('<input/>').attr('type', 'text').val(values);
        case 'select':
            return $('<select/>').append(values.map(e => $('<option/>').val(e).text(e)));
        case 'switch':
            return $('<label/>').addClass('g-switch').append([
                $('<input/>').attr('type', 'checkbox'),
                $('<div/>')
            ]);
        default:
            throw new Error('No such element type');
        }
    }

    openDialog(event) {
        var input = $(event.target).prev();
        var path = dialog.showOpenDialog({properties: ['openDirectory']});
        input.val(path);
    }
}

module.exports = SettingsDialog;