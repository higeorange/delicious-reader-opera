var API=(function(){

function _get(path){
	if(arguments.length == 0){
		throw "invalid argument(API _get)";
	}
	var url=API.BASE_URI+path+"?count=50";
	return $.getJSON(url).next(function(data){
		debug("_get: "+url);
		return data;
	})
}

var API={
	BASE_URI:"http://feeds.delicious.com/v2/json"
	,username: null
	,cache: {
		items: {}
	}
	,get_items: function(tags,no_render){
		var no_render=no_render || false;
		if(!!API.cache.items[tags]){
			return next(function(){
				return API.cache.items[tags];
			});
		}
		if(!API.username){
			throw "username is null.";
		}
		if(no_render == false){
			render("items",v_items_loading);
		}
		if(tags){
			return _get("/"+API.username+"/"+$.map(tags,function(tag){
				if(/^bundle:/.test(tag)){
					return "bundle:"+encodeURIComponent(tag.match(/^bundle:(.*)/)[1]);
				}else{
					return encodeURIComponent(tag);
				}
			}).join("+")).next(function(data){
				API.cache.items[tags]=data;
				return data;
			});
		}else{
			return _get("/"+API.username).next(function(data){
				API.cache.items[tags]=data;
				return data;
			});
		}
	}
	,get_tags: function(query){
		if(!API.username){
			throw "username is null.";
		}
		return _get("/tags/"+API.username);
	}
	,get_recent: function(){
		if(!API.username){
			throw "username is null.";
		}
		return this.get_items();
	}
	,get_bundles: function(){
		// API reserve XML only
		var url="https://api.del.icio.us/v1/tags/bundles/all";
		return $.get(url).next(function(data){
			var result=[];
			$.each(
				data.getElementsByTagName("bundle")
				,function(i,v){
					result.push({
						name: v.getAttribute("name")
						,tags: v.getAttribute("tags").split(" ")
					});
				}
			);
			debug(url);
			return result;
		});
	}
	,init: function(username){
		debug(username);
		API.username=username;
		render("items",v_common,"loading...");
		render("bundles",v_common,"loading...");
		next(function(){
			return API.get_items().next(function(d){
				API.recent=d;
				render("items",v_items,d);
			});
		}).next(function(){
			return API.get_tags().next(function(d){
				API.tags=d;
				var tags=[];
				$.each(API.tags,function(tag){
					tags.push(tag);
				});
				API.tags_array=tags;
				debug("called: init get_tags");
			});
		}).next(function(){
			return API.get_bundles().next(function(d){
				// find all unbundled tags
				var tmp_tags={};
				$.each(d,function(i,bundle){
					$.each(bundle.tags,function(i,tag){
						tmp_tags[tag]=true;
					});
				});
				var unbundled=[];
				$.each(API.tags_array,function(i,tag){
					if(!tmp_tags[tag]){
						unbundled.push(tag);
					}
				});
				d.push({
					name: "--unbundled"
					,tags: unbundled
				});

				API.bundles=d;
				render("bundles",v_bundles,d);
				debug("called: init get_bundles");
			});
		}).next(function(){
			// search field
			render("search",v_search);

			// background loading for cache
			render("status",v_common,"caching items..");
			var tags=Array.apply(null,API.tags_array); // clone
			setTimeout(function(){
				var tag=tags.shift();
				if(tag){
					render("status",v_common,"caching items("+tag+")");
					API.get_items([tag],true);
					setTimeout(arguments.callee,1200);
				}else{
					render("status",v_common,"caching done.");
					setTimeout(function(){
						render("status",v_common," ");
					},1000);
				}
			},10);
		}).error(function(){
			render("items",v_config_form);
		});
	}
}

return API;

})();
