function render(id,tpl,data){
	var j=$("#"+id),html=tpl(j,data);
	if(html){
		j.html(html);
	}
}

function v_items_loading(j){
	return "loading items...";
}

function v_item_help(j,data){
	return data.join(" ");
}

function v_config_form(j,data){
	j.empty();
	var f=$(document.createElement("form"));
	var ipt=$(document.createElement("input"));
	var pw=$(document.createElement("input"));
	var btn=$(document.createElement("input"));
	btn.attr("type","submit").attr("value","save");
	f.submit(function(){
		debug(ipt);
		debug(ipt.val());
		widget.setPreferenceForKey(ipt.val(),"username")
		API.init(ipt.val());
	});
	f.html("delicious account name").append(ipt).append(btn);
	j.append(f);
}

function v_common(j,data){
	return data;
}

function v_items(j,data){
	j.empty();
	$.each(data,function(i,item){
		var li=$(document.createElement("li"));
		li.html([
			'<a href="',item.u,'">',item.d,'</a>'
			,'<p>',item.n,'</p>'
		].join("")).hover(
			function(){
				render("footer",v_common,item.u);
			}
			,function(){
				render("footer",v_common," ");
			}
		).appendTo(j);
	});
}

function v_search(j,data){
	var search=$(document.createElement("input"));
	search.keyup(function(e){
		debug("search keyup: value="+this.value);
		var key=this.value.toLowerCase();
		if(key){
			$("ul#bundles li ul li").each(function(i,v){
				$(this).css("display","none");
			});
			$("ul#bundles li ul li[title*='"+this.value+"']").each(function(i,v){
				$(this).css("display","list-item");
			});
		}else{
			$("ul#bundles li ul li[title*='"+this.value+"']").each(function(i,v){
				$(this).css("display","list-item");
			});
		}
	}).appendTo(j);
}

function v_bundles(j,data){
	/*
	 * <ul id="bundles">
	 * <li>
	 *   <span>*</span>
	 *   <p>bundle name</p>
	 *   <ul>
	 *     <li>tag1</li>
	 *     <li>tag2</li>
	 *   </ul>
	 * </li>
	 * ..
	 * </ul>
	 */

	j.empty();

	var bundled_tags={};
	$.each(data,function(i,bundle){
		// toggle
		var span=$(document.createElement("span"));
		span.html("*").click(function(e){
			e.preventDefault();
			e.stopPropagation();
			debug("clicked: bundle *");
			var tags=this.parentNode.lastChild;
			tags.style.display=(tags.style.display == "none") ? "" : "none";
		});

		// <p>bundle.name</p>
		var p=$(document.createElement("p"));
		p.attr("title","bundle:"+bundle.name.toLowerCase()).html(bundle.name).click(function(e){
			debug("clicked: bundle.name("+this.innerHTML+")");
			e.preventDefault();
			//var label="bundle:"+bundle.name;
			var label="bundle:"+this.innerHTML;
			render("item_help",v_item_help,[" "]);
			API.get_items([label]).next(function(data){
				render("item_help",v_item_help,[label]);
				render("items",v_items,data);
			});
		});

		// bundle
		var li=$(document.createElement("li"));
		li.append(span).append(p);

		// bundle tags
		var tags=$(document.createElement("ul"));
		$.each(bundle.tags,function(i,tag){
			bundled_tags[tag]=true;

			var t=$(document.createElement("li"));
			// why some API.tags[some] is undefined? these are looks 1
			t.attr("title",tag.toLowerCase()).html(tag+"("+(API.tags[tag] || "1")+")").click(function(e){
				e.stopPropagation();
				debug("clicked: tag "+this.innerHTML);
				render("item_help",v_item_help,[" "]);
				API.get_items([tag]).next(function(data){
					render("item_help",v_item_help,["tag: "+tag]);
					render("items",v_items,data);
				});
			});
			tags.append(t);
		});
		li.append(tags);
		j.append(li);
	});
	var tags=[];
	$.each(API.tags,function(tag){
		tags.push(tag);
	});
	$.each(tags,function(i,tag){
		if(!bundled_tags[tag]){
		}
	});
}
