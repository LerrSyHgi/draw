var initScreen=function(callback){
    //$("html").css("font-size",document.documentElement.clientHeight/document.documentElement.clientWidth<1.5 ? (document.documentElement.clientHeight/603*312.5+"%") : (document.documentElement.clientWidth/375*312.5+"%")); //单屏全屏布局时使用,短屏下自动缩放
    $("html").css("font-size",document.documentElement.clientWidth/375*312.5+"%");
    if(callback)callback();
}

function _onorientationchange(e){
    if(window.orientation==90||window.orientation==-90){
    	//横版
        $("#forhorview").css("display", "-webkit-box"); 
        $("#wrap").hide();
    }else{
    	//竖屏
    	var st=setTimeout(initScreen,300);
        $("#forhorview").css("display", "none");
        $("#wrap").show();
    }
}

nie.define(function(){
	_onorientationchange();
    
    initScreen();
    
    window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize",function(e){
    	_onorientationchange(e);
    }, false);
	
	function Page(){
        this.init();
    }

    Page.prototype = {
    	curPage: 1,
        init : function(){
        	this.initUI();
            this.render();
            this.bind();
        },
        render : function(){
            var that = this;
            that._renderShare();
            that.renderPage();
        },
        bind : function(){
        	this.createPicture();
        	this.start();
        	this.back();
        	this.rank();
        	this.rules();
        },
	    initUI: function () {
	    	//清空
	        $(".redraw").bind("click",function(){
	          $.jrDraw.clearMain();
	          $.jrDraw.clearTemp();
	        });
			
			//画笔粗细
			$(".pen").click(function(){
				var isOn = $(this).hasClass("on");
				if(isOn){
					return;
				}
				var value = $(this).data("value");
				$(this).addClass("on");
				$(this).siblings().removeClass("on");
				$.jrDraw.setLineWidth(value);
				$.jrDraw.setType(0);
			});
			
			//橡皮擦
			$(".eraser").click(function(){
				var isOn = $(this).hasClass("on");
				if(isOn){
					return;
				}
				$(this).addClass("on");
				$(this).siblings().removeClass("on");
				$.jrDraw.setType(1);
			});
			
			//颜色选择
	        $(".colors a").click(function(){
	        	var isOn = $(this).hasClass("on");
				if(isOn){
					return;
				}
				var value = $(this).data("value");
				$(this).addClass("on");
				$(this).siblings().removeClass("on");
			  	$.jrDraw.setColor(value);
			});
	    },
	    renderPage: function(){
	    	$(".page-"+this.curPage).show();
	    },
        _renderShare : function(){
			var share_title = $("#share_title").text();
			var share_url = $("#share_url").text();
			var share_desc = $("#share_desc").text();
			var share_pic = $("#share_pic").attr("src");
			var share_pic2 = $("#share_pic2").attr("src");
			var mbshare = nie.require("nie.util.mobiShare2");
			
			mbshare.init({
				title: share_title,
				desc: share_desc,
				url: share_url,
				imgurl: share_pic2,
				circleTitle: share_title,
				guideText: "分享给好友",
				qrcodeIcon: share_pic,
				shareCallback: function(res) {
				
				},
				wxSdkCallback: function() {
				
				}
			});
        },
        _renderCanvas: function() {
        	$.jrDraw.init("#canvasContainer");
        	$("body").on("touchmove",function(event){
				event.preventDefault;
			}, false)
        },
        createPicture: function(){
        	var that = this;
        	$(".complete").click(function(){
               	var dataUrl = $("#canvasMain")[0].toDataURL("image/png")
               	$.ajax({
					type: "get",  //post
					data: {img:dataUrl},
					dataType: "json",
					url: "data/data.json",
					success: function(data){
						if(data.status=="true"){
							$(".page-2").hide();
							$(".page-3").show();
							that.curPage = 3;
							$("body").off("touchmove");
						}
					}
				})
        	})
        },
        start: function(){
        	var that = this;
        	$(".draw").click(function(){
        		$(".page-1").hide();
	        	$(".page-2").show();
	        	that._renderCanvas(); //初始化canvas
	        	that.curPage = 2;
        	})
        },
        back: function(){
        	var that = this;
        	$(".back").click(function(){
        		var page = $(this).data("target");
        		$(".page-"+that.curPage).hide();
        		that.curPage = page;
        		$(".page-"+that.curPage).show();
        		if(that.curPage==2){
        			that._renderCanvas();
        		}else{
        			$("body").off("touchmove");
        		}
        	});
        },
        rank: function(){
        	var that = this;
        	$(".view").click(function(){
        		$(".page-1").hide();
        		$(".page-4").show();
        		that.curPage = 4;
        	});
        },
        rules: function(){
        	var that = this;
        	$(".eat").click(function(){
        		$(".page-1").hide();
        		$(".page-5").show();
        		that.curPage = 5;
        	});
        }
    }

	new Page();
})
