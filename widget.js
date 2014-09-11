define([
	"troopjs-dom/component/widget",
	"./config",
	"audio5js",
	"troopjs-util/merge"
], function (Widget, config, Audio5js, merge) {
	var ARRAY_PUSH = Array.prototype.push;
	var EVENTS = config.events;
	var METHODS = config.methods;
	var SETTINGS = config.settings;

	return Widget.extend({
		"sig/initialize": function () {
			var me = this;
			var methods = {};

			return me.task(function (resolve) {
				// Create player
				new Audio5js(merge.call({}, SETTINGS, {
					"format_time": false,
					"throw_errors": false,
					"ready": function () {
						var self = this;

						// Process EVENTS
						Object
							.keys(EVENTS)
							.forEach(function (event) {
								self.on(event, function () {
									var args = [ EVENTS[event] ];
									ARRAY_PUSH.apply(args, arguments);
									return me.emit.apply(me, args);
								}, self);
							});

						// Process METHODS
						Object
							.keys(METHODS)
							.forEach(function (method) {
								me.on(METHODS[method], function () {
									return methods.hasOwnProperty(method)
										? methods[method].apply(self, arguments)
										: self[method].apply(self, arguments);
								});
							});

						// Add prop callbacks
						me.on("audio5js/do/prop", me["prop"] = function prop(key) {
							return self[key];
						});

						// Resolve with ready emission
						resolve(me.emit("audio5js/ready"));
					}
				}));
			});
		}
	});
});