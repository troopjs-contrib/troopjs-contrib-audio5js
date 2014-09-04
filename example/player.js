define([
	"../widget",
	"jquery"
], function (Widget, $) {
	var $ELEMENT = "$element";
	var SRC = "src";

	return Widget.extend(function ($element, name, src) {
		this[SRC] = src;
	}, {
		"sig/start": function () {
			var me = this;

			return me.emit("audio5js/do/load", me[SRC]);
		},

		"on/audio5js/canplay": function () {
			var duration = this.prop("duration") || 0;

			this[$ELEMENT]
				.find(".duration")
					.text(Math.floor(duration / 60) + ":" + Math.floor(duration % 60))
					.end()
				.find("button")
					.prop("disabled", false);
		},

		"on/audio5js/error": function () {
			var $element = this[$ELEMENT];

			$element
				.find(".error")
					.text("Unable to load url " + $element.data("mp3"))
					.end()
				.find("button")
					.prop("disabled", true);
		},

		"on/audio5js/progress": function (loaded) {
			this[$ELEMENT]
				.find(".loaded")
				.val(loaded);
		},

		"on/audio5js/timeupdate": function (position, duration) {
			var $element = this[$ELEMENT];

			$element
				.find(".played")
					.text(Math.floor(position / 60) + ":" + Math.floor(position % 60))
					.end()
				.find(".duration")
					.text(Math.floor(duration / 60) + ":" + Math.floor(duration % 60))
					.end()
				.find(".progress")
					.val(position === 0 && duration === 0 ? 0 : (position / duration) * 100);
		},

		"dom:[data-action='play']/click": function () {
			this.emit("audio5js/do/play");
		},

		"dom:[data-action='pause']/click": function () {
			this.emit("audio5js/do/pause");
		},

		"dom:[data-action='play-pause']/click": function () {
			this.emit("audio5js/do/play-pause");
		},

		"dom:.progress/click": function ($event) {
			var me = this;
			var $target = $($event.target);

			me.emit("audio5js/do/seek", ($event.pageX - $target.offset().left) / $target.width() * me.prop("duration"));
		},

		"dom:.volume/change": function ($event) {
			var $target = $($event.target);

			this.emit("audio5js/do/volume", parseFloat($target.val()));
		}
	});
});