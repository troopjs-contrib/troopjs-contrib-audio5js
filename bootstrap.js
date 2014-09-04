require({
	"packages": [
		{
			"name": "jquery",
			"location": "bower_components/jquery/dist",
			"main": "jquery"
		},
		{
			"name": "poly",
			"location": "bower_components/poly",
			"main": "es5"
		},
		{
			"name": "when",
			"location": "bower_components/when",
			"main": "when"
		},
		{
			"name": "requirejs-text",
			"location": "bower_components/requirejs-text"
		},
		{
			"name": "troopjs",
			"location": "bower_components/troopjs",
			"main": "maxi"
		},
		{
			"name": "audio5js",
			"location": "bower_components/audio5js",
			"main": "audio5"
		},
		{
			"name": "troopjs-contrib-audiojs",
			"location": "."
		}
	],

	"map": {
		"*": {
			"json": "troopjs-requirejs/json",
			"text": "requirejs-text/text"
		}
	},

	"deps": [
		"require",
		"jquery",
		"troopjs"
	],

	"callback": function (localRequire, jQuery) {
		localRequire([
			"troopjs-dom/application/widget"
		], function (Application) {
			jQuery(function ($) {
				Application($("html"), "bootstrap").start();
			});
		});
	}
});