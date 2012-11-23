////////////////////////////////////////////////////////
////  Text Drop                                     ////
////  jQuery plugin by Otto Nascarella              ////
////  GPL 2 licence.                                ////
////                                                ////
////  Syntax:                                       ////
////  $(paragraph).textdrop({options},[callback]);  ////
////////////////////////////////////////////////////////

;(function($, undefined){
"use strict";

$.fn.textdrop = function(options, externalCall) {
	var duration, delay, easing, leFont, doc, body, isTouchDevice, collectionLength, mouse;

	if (options === undefined) options = {};

	doc = document;
	body = doc.body || $('body')[0];
	duration = options.duration || 1000;
	delay = options.delay || 0;
	easing = options.easing || "swing";
	leFont = options.fontSize || this.css('font-size');
	isTouchDevice = ('ontouchstart' in window);
	collectionLength = this.length;
	mouse = {};

	if (typeof options === 'number') duration = options;
	else if (typeof options === 'function') externalCall = options;

	function updateMouse(e) {
		mouse.stopped = false;
		mouse.x = e.pageX;
		mouse.y = e.pageY;
	}

	function updateTouchPosition(e) {
		e = (e.originalEvent) ? e.originalEvent : e;
		if (e.type === "touchmove") e.preventDefault();
		mouse.stopped = false;
		mouse.x = e.touches[0].pageX;
		mouse.y = e.touches[0].pageY;
	}

	if (!isTouchDevice) {
		$(doc).bind("mousemove.textdrop", updateMouse);
	} else {
		$(doc).bind('touchmove.textdrop touchstart.textdrop', updateTouchPosition);
	}

	///extends HTMLDocument, in case it does not have contains method
	if (typeof doc.contains !== "function") {
		doc.contains = function(element) {
			while (element) {
				if (element === document) return true;
				element = element.parentNode;
			}
			return false;
		};
	}

	this.each(function(index) {

		var self = $(this),
			parent = self.parent(),
			flyingArray = [],
			array = [],
			k = 0,
			t = {},
			originalStyle = {},
			span, children, selfCopy;

		/// analises animation type and arranges array accordingly
		selfCopy = self.html();

		if (options.type) {
			if (options.type === "word") {
				array = self.html().replace(/\n/g, "").replace(/<br(>|\/>|\s\/>)/gi," \n ").split(" ");
				k = array.length;
				while (k--) {
					array.splice(k, 0," ");
				}
				array.shift();
			}
		} else {
			array = self.html().replace(/\n/g, "").replace(/<br(>|\/>|\s\/>)/gi,"\n").split("");
		}

		///timers
		t = {
			mouse: 0,
			letter: 0,
			halt: 0
		};

		originalStyle = {
			size:    self.css('font-size'),
			family:  self.css('font-family'),
			color:   self.css('color'),
			bgcolor: self.css('background-color'),
			textShadow: self.css('text-shadow'),
			fontWeight: self.css('font-weight')
		};
		
		mouse.stopped = false;
		
		self.empty();

		/// Splits paragraph into spans of word/letters
		for (k = 0; k < array.length; k++) {
			if (array[k] === "\n") {
				span = $(doc.createElement('br')).appendTo(self);
			} else {
				span = $(doc.createElement('span'))
							.html(array[k])
							.css('visibility','hidden')
							.appendTo(self);
			}
		}
		
		///set letter/word *kounter
		k = -1;

		children = self.children();

		function animateSpan() {
			var pos, el, flying, animObj;
			k++;
			
			el = children[k];
			pos = $(el).offset();
			
			if (!doc.contains(self[0]) || pos === undefined) { ///if elements are not on document anymore
				return false;
			}
			

			if (k >= array.length) return;

			if (array[k] === "\n") {
				animateSpan();
				return;
			}

			originalStyle.size = self.css('font-size');
			flying = $(doc.createElement('span'))
							.addClass('flying').html(array[k])
							.css({
									position: 'absolute',
									top: mouse.y,
									left: mouse.x,
									color: originalStyle.color,
									backgroundColor: originalStyle.bgcolor,
									fontFamily: originalStyle.family,
									fontSize: leFont,
									textShadow: originalStyle.textShadow,
									fontWeight: originalStyle.fontWeight
								})
							.data('eq', el); //saves a reference of original span on data-eq
				
			animObj = {top: pos.top, left: pos.left, fontSize: originalStyle.size};
			if (originalStyle.fontSize === leFont) delete animObj.fontSize;
			
			flying.appendTo(parent);
			flyingArray.push(flying);
			
			if (k === array.length-1) { ///its last character of element

				collectionLength--;
				if (collectionLength === 0) { // if it's last character of last element
					flying.animate(animObj, duration, easing, callback);
					return;
	
				} else { ///last character not last element

					flying.animate(animObj, duration, easing, halt);
					if (mouse.stopped === false) {
						clearTimeout(t.letter);
						t.letter = setTimeout(animateSpan, 200);
					}
				
				}

			} else { /// animate characters

				flying.animate(animObj, duration, easing);

				if (mouse.stopped === false) {
					clearTimeout(t.letter);
					///time between letters
					t.letter = setTimeout(animateSpan, 200);
				}
				
			} //// animate flying
		}

		function halt() {
			clearTimeout(t.letter);
			clearTimeout(t.mouse);
			clearTimeout(t.halt);

			if (!isTouchDevice) {
				$(doc).unbind('mousemove.textdrop', animateSpan);
				$(doc).unbind('mousemove.textdrop', onMouseMove);
			} else {
				$(doc).unbind('touchstart.textdrop', onTouchStart);
				$(doc).unbind('touchend.textdrop', onTouchEnd);
			}


			$(flyingArray).each(function() {
				this.stop(true,false);
				this.remove();
			});

			self.empty().html(selfCopy).css('visibility','visible');
		}

		// internal callback function
		function callback() {
			halt();
			$(doc).unbind("mousemove.textdrop", updateMouse);
			$(doc).unbind("touchstart.textdrop", updateTouchPosition);
			$(doc).unbind("touchmove.textdrop", updateTouchPosition);
			if (typeof externalCall === "function") externalCall.apply(self[0]);
		}

		/// tell us whether mouse pointer has stopped
		function onMouseMove(e) {
			clearTimeout(t.mouse);
			t.mouse = setTimeout(function() {
				clearTimeout(t.letter);
				mouse.stopped = true;
				$(doc).one('mousemove.textdrop', animateSpan);
			}, 100); ///how long the mouse pointer should be stopped to consider a mousestop
		}
		
		function onTouchStart(e) {
			animateSpan();
		}


		function onTouchEnd(e) {
			mouse.stopped = true;
			$(doc).one('touchstart.textdrop', onTouchStart);
		}

		/// starts 'show' after delay
		if (isTouchDevice) {
			t.mouse = setTimeout(function(e) {
				$(doc).one('touchmove.textdrop touchstart.textdrop', onTouchStart);
				$(doc).bind('touchend.textdrop', onTouchEnd);
			}, delay);

		} else {

			t.mouse = setTimeout(function() {
				$(doc).bind('mousemove.textdrop', onMouseMove);
				$(doc).one ('mousemove.textdrop', animateSpan);
			}, delay);

		}

	}); ///end of each

	return this;
}; /// textdrop


}(jQuery));