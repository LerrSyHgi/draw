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

function getQueryString(name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i'),
        r = window.location.search.substr(1).match(reg);
    return (r != null) ? unescape(r[2]) : null;
}

nie.define(function(){
	_onorientationchange();
    
    initScreen();
    
    window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize",function(e){
    	_onorientationchange(e);
    }, false);
    
    var encode = encodeURIComponent,
        isDebug = true,
        AuthorizeServer = "http://game.163.com/weixin/authorize/?scope=snsapi_base&final_uri=",
        // nativeUrl = 'http://10.242.9.192:8080/';
        nativeUrl = location.href.split('?')[0];
	
	//判断手机系统
	var u = navigator.userAgent;
	var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
	var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
	var sys = isiOS==true?"ios":"android";
	
	function Page(){
        this.init();
    }

    Page.prototype = {
    	curPage: 1,
    	isimg: 0,
    	imginfo: {},
    	userData: {},
    	isFirst: false,
        init : function(){
        	this.authorize();
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
        authorize: function(){
            var code = getQueryString('code'),
                self = this;

            if (isDebug || code) {
                self.wxAuthrize(code);

            } else {
                self.reAuthrize();
            }
        },
        reAuthrize: function() {
            if (!isDebug) {
                setTimeout(function() {
                    window.location.href = AuthorizeServer + encode(nativeUrl);
                }, 500);
            } else {
                console.log('Debug Mode : window.location.href is not work!');
            }
        },
        wxAuthrize : function(code){
            var that = this;
            $.ajax({
                url : 'http://www.huihaicenter.com/api/zjz2/api.php?action=auth',
                dataType : 'json',
                data : {code:code} ,
                success : function(res){
                    if(res.status=="true"){
                    	that.userData = res.data;
                    	if(res.imginfo){
                    		that.imginfo = res.imginfo;
                    		that.imginfo.headerimg = res.data.headerimg
                    	}
                    	that.isimg = res.isimg
                    	$(".page-3 .back").attr("data-target",1);
                    }else{
                    	that.reAuthrize()
                    }
                }
            })
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
               	var dataUrl = $("#canvasMain")[0].toDataURL("image/png");
               	$.ajax({
               		url : 'http://www.huihaicenter.com/api/zjz2/api.php?action=img',
					type: "post",
					data: {
						wxid: that.userData.wxid,
						img:dataUrl,
						phone: '15958283763',
						type:sys
					},
					dataType: "json",
					success: function(data){
						if(data.status=="true"){
							var result = that.userData;
							result.img = data.img;
							result.total = 0;
							var html = template('works',result);
							$(".page-3 .works").html(html);
							$(".page-2").hide();
							$(".page-3").show();
							that.curPage = 3;
							that.isimg = 1;
							that.isFirst = true
							$(".page-3 .back").attr("data-target",1);
							$("body").off("touchmove");
						}else{
							alert(data.msg)
						}
					}
				})
        	})
        },
        start: function(){
        	var that = this;
        	$(".draw").click(function(){
        		if(!that.isimg){
        			$(".page-1").hide();
		        	$(".page-2").show();
		        	that._renderCanvas(); //初始化canvas
		        	that.curPage = 2;
        		}else{
        			console.log(that.isimg,that.isFirst,that.isimg&&!that.isFirst)
        			if(that.isimg&&!that.isFirst){
        				var result = that.imginfo;
						var html = template('works',result);
						$(".page-3 .works").html(html);
        			}
        			$(".page-1").hide();
		        	$(".page-3").show();
		        	that.curPage = 3;
        		}
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
