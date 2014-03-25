/* global
-------------------------------------------------- */
var editor = false;

/* document ready
-------------------------------------------------- */
$(document).ready(function() {

    function editorInterval() {
        if ($("textarea[data-revision=editor]").length) {
            if (!editor) {
                editor = new Revision({
                    "id": "editor"
                });
            }
        } else {
            editor = false;
        }
    }

    setInterval(editorInterval, 1000);
});

/* editor class
-------------------------------------------------- */
function Revision(additionalOptions) {

    var defaultOptions = {
        "lastRevision": 0,
        "waitingChanges": [],
        "sentChanges": [],
        "currentDocument": ""
    };

    $.extend(this, defaultOptions);
    $.extend(this, additionalOptions);

    this.init();
}

Revision.prototype = {

    init: function() {
        var self = this;

        $.ajax({
            url: "api/collaboration.json",
            type: "post",
            data: {
                "some": "data"
            },
            headers: {
                Session: window.sessionStorage.session
            },
            dataType: "json",
            success: function(data) {
                console.info(data);
            }
        });

        $("textarea[data-revision=" + self.id + "]").removeAttr("disabled");
    }
}

/* forcer
-------------------------------------------------- */
$(document).on("click", "#forcer", function() {

    var $editor = $("textarea[data-revision]");
    if ($editor.length) {

        setTimeout(function() {
            var start = $editor[0].selectionStart;
            var end = $editor[0].selectionEnd;

            var text = $editor.val();
            $editor.val(text + " BLJEH?!");

            $editor[0].selectionStart = start;
            $editor[0].selectionEnd = end;

        }, 2000);
    }
});