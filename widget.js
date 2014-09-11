define([
	"troopjs-dom/component/widget",
	"./config",
	"audio5js",
	"troopjs-util/merge",
	"poly/array"
], function (Widget, config, Audio5js, merge) {
	var ARRAY_PUSH = Array.prototype.push;
	var EVENTS = config.events;
	var METHODS = config.methods;
	var SETTINGS = config.settings;
	var PLAY = "play";
	var PAUSE = "pause";
	var SEEK = "seek";
	var LOAD = "load";
	var METHOD_EVENT = {
		"seek": "seeked",
		"load": "loadstart"
	};

	return Widget.extend({
		"sig/initialize": function () {
			var me = this;
			var promises = {};
			var methods = [ PLAY, PAUSE, SEEK, LOAD ].reduce(function (result, method) {
				result[method] = function () {
					var self = this;
					var args = arguments;

					switch (method) {
						case PLAY:
							if (promises.hasOwnProperty(PAUSE)) {
								promises[PAUSE].then(function () {
									delete promises[PAUSE];
								});
							}
							break;

						case PAUSE:
							if (promises.hasOwnProperty(PLAY)) {
								promises[PLAY].then(function () {
									delete promises[PLAY];
								});
							}
							break;

						default:
							if (promises.hasOwnProperty(method)) {
								delete promises[method];
							}
					}

					// Return new or existing promise
					return promises.hasOwnProperty(method)
						? promises[method]
						: promises[method] = me.task(function (resolve) {
							// Add player event handler (once)
							self.one(METHOD_EVENT.hasOwnProperty(method) ? METHOD_EVENT[method] : method, resolve);

							// Exec player method
							self[method].apply(self, args);
						});
				};

				return result;
			}, {});

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