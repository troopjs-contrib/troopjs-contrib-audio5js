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
	var PLAYING = "playing";
	var RESOLVE_EVENTS = {
		"seek": [ "seeked" ],
		"load": [ "canplay" ]
	};
	var NOTIFY_EVENTS = {
		"seek": [ "seeking" ],
		"load": [ "loadstart", "loadedmetadata" ]
	};
	var $ELEMENT = "$element";
	var CUE_IN = "cueIn";

	var last_interval_position = 0;
	var last_position = 0;
	var last_load_percent = 0;
	var buffering_check_interval;

	function check_buffering(toggle) {

		var me = this;
		var $element = me[$ELEMENT];
		var $data = $element.data();

		var cue_in = CUE_IN in $data
			? parseFloat($data[CUE_IN])
				: 0;

		if(toggle) {
			// cue point has not been seeked yet
			if(last_position < cue_in) {
				me.emit("audio5js/is/buffering", true);
			}
			// cue point has been seeked
			else {
				buffering_check_interval = poll(function() {
					temp = last_position;

					// audio is fully downloaded
					if(last_load_percent == 100) {
						me.emit("audio5js/is/buffering", false);
					}
					// position is the same as in the last iteration
					else if (last_interval_position == temp) {
						me.emit("audio5js/is/buffering", true);
					}
					// position is different to an iteration ago
					else {
						me.emit("audio5js/is/buffering", false);
					}
					last_interval_position = temp;
				},
				1000,
				function() {
					return last_load_percent == 100;
				});
			}
		}
		else {
			// cue point has been seeked
			if(last_position >= cue_in) {
				buffering_check_interval.cancel();
				me.publish("audio5js/is/buffering", false);
			}
		}
	}

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
									return (methods.hasOwnProperty(method) ? methods[method].apply(self, arguments) : self[method].apply(self, arguments)) || method;
								});
							});

						// Add prop callbacks
						me.on("audio5js/do/prop", me["prop"] = function prop(key) {
							return self[key];
						});

						me.on("audio5js/timeupdate", function (position, duration) {
							last_position = position;
						});

						// Resolve with ready emission
						resolve(me.emit("audio5js/ready"));
					}
				}));
			});
		},

		"on/audio5js/progress": function (load_percent) {
			last_load_percent = load_percent;
		},

		"on/audio5js/play": function () {
			check_buffering.call(this, true);
		},

		"on/audio5js/pause": function () {
			check_buffering.call(this, false);
		},

		"on/audio5js/ended": function () {
			check_buffering.call(this, false);
		},

		"sig/stop": function () {
			check_buffering.call(this, false);
		},
	});
});