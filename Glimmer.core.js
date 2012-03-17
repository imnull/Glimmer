/** 
 *
 * Glimmer.core.js
 * (c) 2011-2012 mk31415926535@gmail.com
 * Glimmer.core.js may be freely distributed under the MIT license.
 *
 * */

(function(w){
	var Angle = {
		one : Math.PI / 180,
		PI2 : Math.PI * 2,
		R4 : Math.PI / 4,
		R8 : Math.PI / 8,
		R16 : Math.PI / 16,
		dot : 1000,
		getDegree : function(radian){
			return Math.round(radian / Angle.one * Angle.dot) / Angle.dot;
		},
		getRadian : function(degree){
			return degree * Angle.one
		},
		degree : function(d){
			return (d % 360) * Angle.one;
		}
	}


	function Point(x, y){
		this.x = x || 0;
		this.y = y || 0;
	}
	Point.prototype = {
		clone : function(){
			return new Point(this.x, this.y);
		},
		angle : function(p){
			var x = this.x - p.x, y = this.y - p.y, a = Math.atan2(y, x);
			if(a < 0) a += Math.PI * 2;
			return a;
		},
		length : function(p){
			var x = this.x - p.x, y = this.y - p.y;
			return Math.sqrt(x * x + y * y);
		},
		xmultiply : function(p){
			return this.x * p.y - this.y * p.x;
		},
		center : function(p){
			return new Point((p.x - this.x) / 2, (p.y - this.y) / 2);
		},
		move : function(angle, distance, callback){
			var x = distance * Math.cos(angle);
			var y = distance * Math.sin(angle);
			this.x += x;
			this.y += y;
			if((x != 0 || y != 0) && typeof callback === 'function'){
				callback(this, x, y);
			}
		},
		rotate : function(origin, angle, distance){
			distance = distance || this.length(origin);
			this.x = origin.x + distance * Math.cos(angle);
			this.y = origin.y + distance * Math.sin(angle);
		},
		center : function(origin){
			return new Point((this.x + origin.x) / 2, (this.y + origin.y) / 2)
		},
		subtract : function(p){
			return new Point(this.x - p.x, this.y - p.y); 
		}
	}


	function Segment(o, e){
		this.o = o;
		this.e = e;
		this.length = this.e.length(this.o);
		this.angle = this.e.angle(this.o);
		this.center = this.e.center(this.o);
	}
	Segment.create = function(ox, oy, x, y){
		return new Segment(new Point(ox, oy), new Point(x, y));
	}
	Segment.prototype = {
		clone : function(){
			return new Segment(this.o.clone(), this.e.clone());
		},
		rotate: function(angle){
			this.angle += angle;
			this.e.rotate(this.o, this.angle, this.length);
		},
		rotateCenter : function(angle){
			this.angle = angle;
			var c = this.e.center(this.o);
			var l = this.length * .5;
			this.e.rotate(c, this.angle, l);
			this.o.rotate(c, this.angle + Math.PI, l);
		},
		xmultiply : function(seg){
			var p1 = this.o.subtract(seg.o),
				p2 = this.e.subtract(seg.o),
				p3 = seg.e.subtract(seg.o),
				v = p1.xmultiply(p3) * p2.xmultiply(p3);
			p1 = p2 = p3 = null;
			return v;
		},
		crossCheck : function(seg){
			var x1 = this.xmultiply(seg);
			var x2 = seg.xmultiply(this);
			return x1 < 0 && x2 < 0;
		},
	    cross : function(seg){
	    	if(!this.crossCheck(seg)){
	    		return null;
	    	}
	        var ret = this.o.clone();
	        var A = this.o, B = this.e, _A = seg.o, _B = seg.e;
	        var t = ( (_A.x - A.x) * (_B.y - _A.y) - (_B.x - _A.x) * (_A.y - A.y) ) /
	        	( (B.x - A.x) * (_B.y - _A.y) - (_B.x - _A.x) * (B.y - A.y) )
	        	;
	        ret.x+=(B.x-A.x)*t;
	        ret.y+=(B.y-A.y)*t;
	        return ret;
	    },
		reflect : function(seg){
			if(!this.crossCheck(seg)){
	    		return null;
	    	}
	    	var cr = this.cross(seg), e = cr.clone();
			e.move(this.angle * 2 - seg.angle, seg.length - cr.length(seg.o));
			return [new Segment(seg.o, cr), new Segment(cr, e)];
			//return [seg.o, cr, e];
		},
		move : function(x, y){
			if(typeof x != 'number' || typeof y != 'number') return;
			var r = this.length * .5;
			this.center.x = x;
			this.center.y = y;
			var o = this.center.clone();
			var e = this.center.clone();
			e.move(this.angle, r);
			o.move(this.angle + Math.PI, r);
			this.o = o;
			this.e = e;
		}
	}

	function ArrayEach(arr, callback){
		for(var i = 0, len = arr.length; i < len; i++){
			if(!!callback(arr[i], arr, i)) return;
		}
	}

	function Reflectors(ctx){
		this.arr = [];
		this.path = [];
		this.ctx = ctx;
	}
	Reflectors.prototype = {
		add : function(r){
			this.arr.push(r);
		},
		clear : function(){
			this.arr = [];
		},
		each : function(callback){
			if(typeof callback != 'function') return;
			ArrayEach(this.arr, callback);
		},
		cross : function(seg, reflector){
			var dis = null, r = null, d;
			ArrayEach(this.arr, function(elem, elems, i){
				if(elem != reflector && elem.crossCheck(seg)){
					d = elem.cross(seg).length(seg.o);
					if(typeof dis != 'number' || d < dis){
						dis = d;
						r = elem;
					}
				}
			});
			ar = dis = p = d = null;
			return r;
		},
		reflect : function(seg, reflector){
			var r = this.cross(seg, reflector);
			if(!r) {
				this.path.push(seg);
			} else {
				var path = r.reflect(seg);
				this.path.push(path[0]);
				this.reflect(path[1], r);
			}
		},
		drawReflectors : function(callback){
			var unactived = [];
			for(var i = 0, len = this.arr.length; i < len; i++){
				if(!this.arr[i].active){
					unactived.push(this.arr[i]);
					continue;
				}
				if(typeof callback === 'function'){
					callback(this.ctx, this.arr[i]);
				} else if( typeof this.arr[i].draw === 'function'){
					this.arr[i].draw();
				}
			}
			for(var i = 0, len = unactived.length; i < len; i++){
				if(typeof callback === 'function'){
					callback(this.ctx, unactived[i]);
				} else if( typeof unactived[i].draw === 'function'){
					unactived[i].draw();
				}
			}
			unactived = null;
		}
	}
	function eventPosition(evt){
		function getEvent(e){
			return e.touches && e.touches.length ? e.touches[0] : e;
		};

		evt = getEvent(evt);
		var x, y;
		if('pageX' in evt){
			x = evt.pageX - evt.target.offsetLeft;
			y = evt.pageY - evt.target.offsetTop;
		} else if('offsetX' in evt){
			x = evt.offsetX;
			y = evt.offsetY;
		} else if('clientX' in evt){
			x = evt.clientX - evt.target.offsetLeft;
			y = evt.clientY - evt.target.offsetTop;
		} else {
			x = y = 0;
		}
		return { x : x, y : y };
	}
	var Glimmer = {
		//线性光
		LinearLight : function(x, y, distance, angle){
			var _x = distance * Math.cos(angle);
			var _y = distance * Math.sin(angle);
			var seg = Segment.create(x, y, _x, _y);
			return seg;
		},
		Reflector : function(ctx, cx, cy, width, angle
			, downCallback
			, moveCallback
			, upCallback
			, rollCallback
			){
			var cp = new Point(cx, cy);
			var o = cp.clone(), e = cp.clone();
			angle = Angle.getRadian(angle);
			o.move(angle, width / 2);
			e.move(angle + Math.PI, width / 2);

			var seg = new Segment(o, e);

			seg.draw = function(){
				if(typeof this.state === 'string' && typeof this[this.state + 'DrawCallback'] === 'function'){
					this[this.state + 'DrawCallback'](ctx);
				} else {

					ctx.save();
					ctx.lineWidth = 2;
					var c = this.center;
					ctx.beginPath();
					ctx.arc(c.x, c.y, this.length * .5, 0, Angle.PI2, false);
					ctx.stroke();

					ctx.beginPath();
					ctx.arc(c.x, c.y, ctx.lineWidth || 1, 0, Angle.PI2, true);
					ctx.stroke();

					ctx.moveTo(this.o.x, this.o.y);
					ctx.lineTo(this.e.x, this.e.y);			
					ctx.stroke();

					ctx.save();
					ctx.lineWidth = 10;
					ctx.beginPath();
					ctx.arc(c.x, c.y, this.length * .5 + ctx.lineWidth * .5 + 3, 0, Angle.PI2, true);
					ctx.stroke();
					ctx.restore();

					c = null;

					ctx.restore();
				}
			}
			this.bindEvent(ctx, seg, downCallback, moveCallback, upCallback, rollCallback);
			return seg;
		},
		bindEvent : function(ctx, seg, downCallback, moveCallback, upCallback, rollCallback){
			var cvs = ctx.canvas;
			//cvs.addEventListener(MOUSE_DOWN, mousedown, false);
			//cvs.addEventListener(MOUSE_UP, mouseup, false);

			document.addEventListener(MOUSE_DOWN, mousedown, false);
			document.addEventListener(MOUSE_UP, mouseup, false);

			function mousedown(e){
				e.preventDefault();
				if(e.target != cvs) return;
				cvs.globalActive = true;
				var mp = eventPosition(e);
				var dis = seg.center.length(mp) - seg.length * .5;
				if(dis <= 0){
					if(!!Glimmer.eventTarget) return;
					Glimmer.eventTarget = true;
					seg.initDrag = new Point(seg.center.x - mp.x, seg.center.y - mp.y);
					seg.state = 'move';
					seg.active = true;
					cvs.addEventListener(MOUSE_MOVE, mousemove);
					downCallback(ctx, seg, e);
				} else if(dis > 0 && dis <= 13){
					if(!!Glimmer.eventTarget) return;
					Glimmer.eventTarget = true;
					mp = new Point(mp.x, mp.y);
					seg.initStartAngle = mp.angle(seg.center);
					seg.initOffsetAngle = seg.initStartAngle - seg.angle;
					seg.runtimeDistance = mp.length(seg.center);
					seg.state = 'roll';
					seg.active = true;
					cvs.addEventListener(MOUSE_MOVE, mouseroll);
					downCallback(ctx, seg, e);
				}
			}

			function mouseroll(e){
				e.preventDefault();
				rollCallback(ctx, seg, e);
			}

			function mousemove(e){
				e.preventDefault();
				moveCallback(ctx, seg, e);
			}

			function mouseup(e){
				e.preventDefault();
				cvs.globalActive = false;
				seg.active = false;
				delete seg.state;
				delete Glimmer.eventTarget;
				cvs.removeEventListener(MOUSE_MOVE, mousemove); 
				cvs.removeEventListener(MOUSE_MOVE, mouseroll); 
				upCallback(ctx, seg, e);
			}
		}
	}

	w.Angle = Angle;
	w.Point = Point;
	w.Segment = Segment;
	w.Reflectors = Reflectors;
	w.Glimmer = Glimmer;
	w.eventPosition = eventPosition;
	
	w.MOUSE_DOWN = 'ontouchstart' in document ? 'touchstart' : 'mousedown';
	w.MOUSE_UP= 'ontouchend' in document ? 'touchend' : 'mouseup';
	w.MOUSE_MOVE= 'ontouchmove' in document ? 'touchmove' : 'mousemove';

	console.log(w.MOUSE_DOWN, w.MOUSE_UP, w.MOUSE_MOVE);

})(window);