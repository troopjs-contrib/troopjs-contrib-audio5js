define([
	"troopjs-dom/component/widget",
	"./config",
	"audio5js",
	"troopjs-util/merge",
	"when",
	"when/poll",
	"poly/array"
], function (Widget, config, Audio5js, merge, when, poll) {
	var ARRAY_PUSH = Array.prototype.push;
	var ARRAY_FOREACH = Array.prototype.forEach;
	var EVENTS = config.events;
	var METHODS = config.methods;
	var SETTINGS = config.settings;
	var CALLEE = "callee";
	var DEFERRED = "deferred";
	var PROMISE = "promise";
	var RESOLVE = "resolve";
	var NOTIFY = "notify";
	var PLAY = "play";
	var PAUSE = "pause";
	var	PHASE = "phase";
	var PLAYING = "playing";
	var RESOLVE_EVENTS = {
		"seek": [ "seeked" ],
		"load": [ "canplay" ]
	};
	var NOTIFY_EVENTS = {
		"seek": [ "seeking" ],
		"load": [ "loadstart", "loadedmetadata" ]
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

					// Create new deferred
					deferred = callee[DEFERRED] = when.defer();

					// Iterate resolution events
					ARRAY_FOREACH.call(RESOLVE_EVENTS.hasOwnProperty(method) ? RESOLVE_EVENTS[method] : [ method ], function (resolve_event) {
						// Create resolve callback
						var resolve = function () {
							deferred[RESOLVE](resolve_event);
						};

						// Add resolution handler (once)
						self.one(resolve_event, resolve);

						// Add cleanup ...
						deferred[PROMISE].ensure(function () {
							// ... that removes the internal resolution handler
							self.off(resolve_event, resolve);
						});
					});

					// If we have notification events ...
					if (NOTIFY_EVENTS.hasOwnProperty(method)) {
						// ... iterate them
						ARRAY_FOREACH.call(NOTIFY_EVENTS[method], function (notify_event) {
							// Create notify callback
							var notify = function () {
								deferred[NOTIFY](notify_event);
							};

							// Add notification handler
							self.on(notify_event, notify);

							// Add cleanup ...
							deferred[PROMISE].ensure(function () {
								// ... that removes the internal notification handler
								self.off(notify_event, notify);
							});
						});
					}

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
				me.player = new Audio5js(merge.call({
					"format_time": false,
					"throw_errors": false,
					"ready": function () {
						var self = this;
						var _position_old = 0;
						var _position_new = 0;
						var _progress = 0;
						var _playing = false;

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
									return (methods.hasOwnProperty(method) ? methods[method].apply(self, arguments) : self[method].apply(self, arguments)) || method;
								});
							});

						// Add prop callbacks
						me.on("audio5js/do/prop", me["prop"] = function prop(key) {
							return self[key];
						});

						me.on("audio5js/timeupdate", function (position, duration) {
							_position_new = position;
						});

						me.on("audio5js/progress", function (load_percent) {
							_progress = load_percent;
						});

						me.on("audio5js/play", function () {
							_playing = true;
						});

						me.on("audio5js/pause", function () {
							_playing = false;
						});

						me.on("audio5js/ended", function () {
							_playing = false;
						});

						poll(
							function() {
								// explicit request to stop checking
								if(_playing === false) {
									me.emit("audio5js/buffering", false);
								}
								// audio is fully downloaded
								else if(_progress === 100) {
									me.emit("audio5js/buffering", false);
								}
								// position is the same as in the last iteration
								else if (_position_old === _position_new) {
									me.emit("audio5js/buffering", true);
								}
								// position is different to an iteration ago
								else {
									me.emit("audio5js/buffering", false);
								}

								_position_old = _position_new;
							},
							1000,
							function() {
								return ( (_progress === 100) || (me[PHASE] === "finalized") );
							});

						// Resolve with ready emission
						resolve(me.emit("audio5js/ready"));
					}
				}, SETTINGS));
			});
		}
	});
});