define([
	"troopjs-dom/component/widget",
	"./config",
	"audio5js",
	"troopjs-util/merge"
], function (Widget, config, Audio5js, merge) {
	var ARRAY_PUSH = Array.prototype.push;
	var REMOVE = config.remove;
	var EVENTS = config.events;
	var METHODS = config.methods;
	var ATTRIBUTES = config.attributes;
	var SETTINGS = config.settings;
	var $ELEMENT = "$element";
	var DURATION = "duration";
	var PLAYING = "playing";

	function data(key, value_raw) {
		var me = this;
		var $element = me[$ELEMENT];
		var value_map = key in ATTRIBUTES
			? ATTRIBUTES[key].call(me, value_raw)
			: value_raw;

		// Remove
		if (value_map === REMOVE) {
			$element
				.removeAttr("data-" + key)
				.removeData(key);
		}
		// Set
		else {
			$element
				.attr("data-" + key, value_map)
				.data(key, value_map);
		}

		// Emit
		me.emit("audio5js/property", key, value_raw, value_map);
	}

	return Widget.extend({
		"sig/initialize": function () {
			var me = this;
			var events = {
				"canplay": function () {
					data.call(me, DURATION, this[DURATION]);
				}
			};
			var methods = {
				"play": function () {
					data.call(me, PLAYING, true);
				},
				"pause": function () {
					data.call(me, PLAYING, false);
				}
			};

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
									// Call custom
									if (events.hasOwnProperty(event)) {
										events[event].apply(this, arguments)
									}

									// Emit
									var args = [ EVENTS[event] ];
									ARRAY_PUSH.apply(args, arguments);
									me.emit.apply(me, args);
								}, self);
							});

						// Process METHODS
						Object
							.keys(METHODS)
							.forEach(function (method) {
								// Add handler
								me.on(METHODS[method], function () {
									// Call custom
									if (methods.hasOwnProperty(method)) {
										methods[method].apply(self, arguments);
									}

									// Call self
									return self[method].apply(self, arguments);
								});
							});

						me["prop"] = function (key) {
							return self[key];
						};

						// Resolve with self
						resolve(self);
					}
				}));
			});
		}
	});
});