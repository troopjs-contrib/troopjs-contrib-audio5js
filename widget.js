define([
	"troopjs-dom/component/widget",
	"./config",
	"audio5js",
	"troopjs-util/merge",
	"when",
	"poly/array"
], function (Widget, config, Audio5js, merge, when) {
	var ARRAY_PUSH = Array.prototype.push;
	var EVENTS = config.events;
	var METHODS = config.methods;
	var SETTINGS = config.settings;
	var CALLEE = "callee";
	var DEFERRED = "deferred";
	var PROMISE = "promise";
	var RESOLVE = "resolve";
	var PLAY = "play";
	var PAUSE = "pause";
	var PLAYING = "playing";
	var METHOD_EVENT = {
		"seek": "seeked",
		"load": "loadstart"
	};

	return Widget.extend({
		"sig/initialize": function () {
			var me = this;

			// Generate method overrides
			var methods = [ PLAY, PAUSE, "seek", "load" ].reduce(function (result, method) {
				result[method] = function () {
					var self = this;
					var args = arguments;
					var callee = args[CALLEE];
					var deferred;

					if (callee.hasOwnProperty(DEFERRED)) {
						// Use DEFERRED if it exists
						deferred = callee[DEFERRED];
					}
					else {
						// Otherwise create and use resolved deferred
						(deferred = callee[DEFERRED] = when.defer()).resolve();
					}

					switch (method) {
						case PLAY:
							// If we're playing, just return promise
							if (self[PLAYING]) {
								return deferred[PROMISE];
							}
							break;

						case PAUSE:
							// If we're not playing, just return promise
							if (!self[PLAYING]) {
								return deferred[PROMISE];
							}
							break;

						default:
							// Reject previous deferred
							deferred.reject();
					}

					// Map method_event if needed
					var method_event = METHOD_EVENT.hasOwnProperty(method)
						? METHOD_EVENT[method]
						: method;

					// Create new deferred
					deferred = callee[DEFERRED] = when.defer();

					// Add rejection handler ...
					deferred[PROMISE].otherwise(function () {
						// ... that removes the internal handler
						self.off(method_event, deferred[RESOLVE]);
					});

					// Add internal handler (once)
					self.one(method_event, deferred[RESOLVE]);

					// Exec player method
					self[method].apply(self, args);

					// Return promise
					return deferred[PROMISE];
				};

				return result;
			}, {});

			// Wrap player instantiation in task
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
									// Return result from override or player
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