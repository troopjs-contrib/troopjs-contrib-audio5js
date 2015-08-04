define([
	"require",
	"module",
	"troopjs-util/merge"
], function (localRequire, module, merge) {
	var PATH = localRequire
		.toUrl("audio5js")
		.split("/")
		.slice(0, -1)
		.join("/");

	return merge.call({
		"settings": {
			"swf_path": PATH + "/audio5js.swf"
		},

		"events": {
			"play": "audio5js/play",
			"pause": "audio5js/pause",
			"ended": "audio5js/ended",
			"error": "audio5js/error",
			"timeupdate": "audio5js/timeupdate",
			"ready": "audio5js/ready",
			"progress": "audio5js/progress",
			"loadstart": "audio5js/loadstart",
			"loadedmetadata": "audio5js/loadedmetadata",
			"canplay": "audio5js/canplay",
			"seeking": "audio5js/seeking",
			"seeked": "audio5js/seeked"
		},

		"methods": {
			"load": "audio5js/do/load",
			"play": "audio5js/do/play",
			"pause": "audio5js/do/pause",
			"volume": "audio5js/do/volume",
			"seek": "audio5js/do/seek"
		}
	}, module.config());
});