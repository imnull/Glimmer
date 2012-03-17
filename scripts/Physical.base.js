/** 
 *
 * Physical.base.js
 * (c) 2011-2012 mk31415926535@gmail.com
 * Physical.base.js may be freely distributed under the MIT license.
 *
 * */
 
(function(w){

	/*
	 * An object to store common data and functions
	 */
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

	/*
	 * Well, a point object, and it can calculate.
	 */
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

	/*
	 * As its name showing, it's a segment also can be call a 'vector'.
	 */
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
	
	w.Angle = Angle;
	w.Point = Point;
	w.Segment = Segment;
	w.MOUSE_DOWN = 'ontouchstart' in document ? 'touchstart' : 'mousedown';
	w.MOUSE_UP= 'ontouchend' in document ? 'touchend' : 'mouseup';
	w.MOUSE_MOVE= 'ontouchmove' in document ? 'touchmove' : 'mousemove';

})(window);