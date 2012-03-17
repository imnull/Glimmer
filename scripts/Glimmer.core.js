/** 
 *
 * Glimmer.core.js
 * (c) 2011-2012 mk31415926535@gmail.com
 * Glimmer.core.js may be freely distributed under the MIT license.
 *
 * */

(function(w){
	/*
	 * foreach an array with int key
	 */
	function ArrayEach(arr, callback){
		for(var i = 0, len = arr.length; i < len; i++){
			if(!!callback(arr[i], arr, i)) return;
		}
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

	w.Reflectors = Reflectors;
	w.Glimmer = Glimmer;
	w.eventPosition = eventPosition;

})(window);