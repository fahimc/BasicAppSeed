var EventDispatcher=(function(){
	
	function EventDispatcher(){};
	
	EventDispatcher.prototype=
	{
		_events : [],
		addEventListener : function(name, callback) {
			if(!this._events[name])this._events[name]=[];
			this._events[name].push(callback);
		},
		removeEventListener : function(name, callback) {
			if(!this._events[name])return;
			for(var a=0;a<this._events[name].length;a++)
			{
				if(this._events[name][a]==callback)
				{
					this._events[name].splice(a,1);
					return;
				}
			}
			
		},
		dispatchEvent:function(name){
			if(!this._events[name])return;
			for(var a=0;a<this._events[name].length;a++)
			{
				this._events[name][a]();
			}
		}
	};
	
	return EventDispatcher;
})();

var DataModel=(function(){
	
	
	function DataModel(){};
	
	DataModel.prototype=
	{
		data:null,
		setData:function(data){
			
			this.data=data;
		},
		getCopyByID:function(name){
			return this.data[name];
		}
	};
	
	return new DataModel();
})();

var DataBinder = (function() {

	function DataBinder() {
	};

	DataBinder.prototype = {
		_dataModel : null,
		_binders : [],
		bind : function(model) {
			this._dataModel = model;

			this._binders = document.querySelectorAll("[data-bind]");
			this.setBinds();
		},
		setBinds : function() {
			var _this=this;
			var collection=[];
			for (var a = 0; a < this._binders.length; a++) {
				var prop = this._binders[a].getAttribute('data-bind');
				this._binders[a].setAttribute('bind-id',this._bindIndex);
				// var val = prop.split('.').reduce(this.toObj, this._dataModel);
				var d = this.getObj(prop, this._dataModel);
				
				//update dom
				if (d.obj[d.name])
					this._binders[a].innerHTML = d.obj[d.name];
				//set watcher
				if (d.obj)
					this.watch(d.obj, d.name, function(prop, oldval, val){return _this.onChange(d.obj, prop, oldval, val);});
				
				//update collection
				collection.push({
					elem:this._binders[a],
					obj:d.obj,
					name:d.name,
					prop:prop
				});
			}
			this._binders=collection;
		},
		toObj : function(obj, i) {
			return obj[i];
		},
		getObj : function(prop, obj) {
			var parts = prop.split('.');

			for (var a = 0; a < parts.length - 1; a++) {
				if (obj[parts[a]] != undefined)
					obj = obj[parts[a]];
			}

			return {
				obj : obj,
				name : parts.length ? parts[parts.length - 1] : prop
			};
		},
		watch : function(obj, prop, handler) {
			var oldval = obj[prop], newval = oldval, getter = function() {
				return newval;
			}, setter = function(val) {
				oldval = newval;
				return newval = handler.call(obj, prop, oldval, val);
			};
			if (
			delete obj[prop]) {// can't watch constants
				if (Object.defineProperty)// ECMAScript 5
					Object.defineProperty(obj, prop, {
						get : getter,
						set : setter
					});
				else if (Object.prototype.__defineGetter__ && Object.prototype.__defineSetter__) {// legacy
					Object.prototype.__defineGetter__.call(obj, prop, getter);
					Object.prototype.__defineSetter__.call(obj, prop, setter);
				}
			}
		},
		unwatch : function(obj,prop) {
			var val = obj[prop];
			delete obj[prop];
			// remove accessors
			obj[prop] = val;
		},
		onChange : function(obj, prop, oldval, val) {
			if( oldval!=val)this.updateBindedElem(obj, prop,val);
			return val;
		},
		updateBindedElem:function(obj,prop,val){
			for (var a = 0; a < this._binders.length; a++) {
				if(this._binders[a].obj==obj && prop ==this._binders[a].name)
				{
					this._binders[a].elem.innerHTML = val;
					return;
				}
			}
		},
		update:function(){
			for (var a = 0; a < this._binders.length; a++) {
				var d = this.getObj(this._binders[a].prop, this._dataModel);				
				//update dom
				if (d.obj[d.name])
					this._binders[a].elem.innerHTML = d.obj[d.name];
					this._binders[a].obj[this._binders[a].name]=d.obj[d.name];
			}
		}
	};

	return new DataBinder();
})();

var Localise = (function() {

	function Localise() {
	};

	var prototype = {
		LANG_PREFIX : "resource/lang/",
		LANG_SUFFIX : "copy.json",
		CSS_SUFFIX : "style.css",
		hasCSS : true,
		_client : null,
		_model : null,
		_cssTag : null,
		_updateBinds:false,
		_cssLoadHandler : null,
		
		lang : null,
		load : function(model,lang,up) {
			
			this._updateBinds=up;
			this._model = model;

			this.lang = lang?lang:String(navigator.language).toLowerCase();

			var _this = this;

			this._client = new XMLHttpRequest();
			this._client.open('GET', this.LANG_PREFIX + this.lang + "/" + this.LANG_SUFFIX+"?ts="+new Date().getTime());
			this._client.onreadystatechange = function() {
				if (this.readyState == 4)
					_this.onLangComplete(_this._client.responseText);
			};
			this._client.send();
		},
		onLangComplete : function(data) {
			
			if (data)
				this._model.setData(JSON.parse(data));
			this.loadCSS();
		},
		loadCSS : function() {
			if (!this.hasCSS)
				this.complete();
			if (this._cssTag) 
				document.getElementsByTagName("head")[0].removeChild(this._cssTag);
				
				this._cssTag = document.createElement("link");
				this._cssTag.setAttribute("rel", "stylesheet");
				this._cssTag.setAttribute("type", "text/css");
				var _this = this;
				this._cssLoadHandler = function() {
					_this.onCSSComplete();
				};
				
			document.getElementsByTagName("head")[0].appendChild(this._cssTag);
			this._cssTag.addEventListener('load', this._cssLoadHandler);
			this._cssTag.setAttribute("href", this.LANG_PREFIX + this.lang + "/" + this.CSS_SUFFIX);
		},
		onCSSComplete : function(data) {
			this._cssTag.removeEventListener('load', this._cssLoadHandler);
			this.complete();
		},
		complete : function() {
			if(this._updateBinds)DataBinder.update();
			this._updateBinds=false;
			this.dispatchEvent('complete');
		},
		
	};
	
	Localise.prototype=new EventDispatcher();
	
	for(name in prototype){
		Localise.prototype[name]=prototype[name];
	}
	
	return new Localise();

})();

(function() {
	function init() {
		window.addEventListener('load', onLoad);
	}

	function onLoad() {
		Localise.addEventListener('complete', onLocalised);
		Localise.load(DataModel);
	}

	function onLocalised() {
		Localise.removeEventListener('complete', onLocalised);
		bindData();

	}

	function bindData() {
		DataBinder.bind(DataModel);
	}


	window.onLangChange = function(lang) {
		Localise.load(DataModel, lang, true);

	};
	init();
})();
