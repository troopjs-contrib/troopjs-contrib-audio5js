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

			return me.emit("audio5js/do/load", me[SRC]).then(me.log, me.error, me.info);
		},

		"on/audio5js/error": function () {
			var me = this;

			me[$ELEMENT]
				.find(".error")
					.text("Unable to load url " + me[SRC])
					.end()
				.find("button")
					.prop("disabled", true);
		},

    "on/audio5js/buffering": function (toggle) {
      this.info(toggle ? "buffering" : "buffered");
    },

		"on/audio5js/progress": function (loaded) {
			var me = this;
			var duration = me.prop("duration") || 0;

			me[$ELEMENT]
				.find(".duration")
					.text(Math.floor(duration / 60) + ":" + Math.floor(duration % 60))
					.end()
				.find(".loaded")
					.val(loaded);
		},

		"on/audio5js/timeupdate": function (position, duration) {
			this[$ELEMENT]
				.find(".position")
					.text(Math.floor(position / 60) + ":" + Math.floor(position % 60))
					.end()
				.find(".duration")
					.text(Math.floor(duration / 60) + ":" + Math.floor(duration % 60))
					.end()
				.find(".progress")
					.val(position === 0 || duration === 0 ? 0 : (position / duration) * 100);
		},

		"dom:[data-action='play']/click": function () {
			var me = this;

			me.emit("audio5js/do/play").then(me.log, me.error, me.info);
		},

		"dom:[data-action='pause']/click": function () {
			var me = this;

			me.emit("audio5js/do/pause").then(me.log, me.error, me.info);
		},

		"dom:.progress/click": function ($event) {
			var me = this;
			var $target = $($event.target);

			me.emit("audio5js/do/seek", ($event.pageX - $target.offset().left) / $target.width() * me.prop("duration")).then(me.log, me.error, me.info);
		},

		"dom:.volume/change": function ($event) {
			var me = this;
			var $target = $($event.target);

			me.emit("audio5js/do/volume", parseFloat($target.val())).then(me.log, me.error, me.info);
		}
	});
});