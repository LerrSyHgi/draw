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

$(function(){
	_onorientationchange();
    
    initScreen();
    
    window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize",function(e){
    	_onorientationchange(e);
    }, false);
    
    var encode = encodeURIComponent,
        isDebug = false,
        AuthorizeServer = "http://game.163.com/weixin/authorize/?scope=snsapi_base&final_uri=",
        // nativeUrl = 'http://10.242.9.192:8080/';
        nativeUrl = location.href;
	
	//判断手机系统
	var u = navigator.userAgent;
	var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
	var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
	var sys = isiOS==true?"ios":"android";
	
	function Page(){
        this.init();
    }

    Page.prototype = {
    	isShare: false,
    	curPage: 1,
    	isimg: 0,
    	imginfo: null,
    	userData: {},
    	hotPage: 1,
    	newPage: 1,
    	rankType: 'hot',
        init : function(){
        	this.authorize();
        	this.initUI();
            this.render();
            this.bind();
            this.loadHot(1);
            this.loadNew(1);
        },
        render : function(){
            var that = this;
        },
        bind : function(){
        	this.showLayer();
        	this.start();
        	this.back();
        	this.rank();
        	this.rules();
        	this.tabs();
        	this.bindScroll();
        	this.binLikes();
        	this.bindSubmit();
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
                    	var wxid = getQueryString('wxid');    //分享用户wxid
                    	that.isimg = res.isimg
                    	that.userData = res.data;
                    	that._renderShare();
                    	if(res.imginfo){
                    		//用户已画过
                    		that.imginfo = res.imginfo;
                    		that.imginfo.headerimg = res.data.headerimg
                    		if(wxid!==null&&wxid!==res.data.wxid){
                    			that.isShare = true;
                    			that.getWorks(wxid);
                    		}else{
                    			var html = template('works',that.imginfo);
								$(".page-3 .result-box").html(html);
								that.renderPage();
                    		}
                    	}else{
                    		if(wxid!==null&&wxid!==res.data.wxid){
                    			that.isShare = true;
                    			that.getWorks(wxid);
                    		}else{
                    			that.renderPage();
                    		}
                    	}
						
                    }else{
                    	that.reAuthrize()
                    }
                }
            })
        },
        getWorks: function(wxid){
        	//根据wxid获取作品
        	var that = this;
        	$.ajax({
        		type:"get",
        		url:"http://www.huihaicenter.com/api/zjz2/api.php?action=getimg",
        		dataType: "json",
        		data: {
        			wxid: wxid
        		},
        		success: function(res){
        			if(res.status=="true"){
        				that.curPage = 3;
        				var html = template('works',res.imginfo);
        				$(".share").hide();
						$(".page-3 .result-box").html(html);
        			}
        			$(".page-3 .back").attr("data-target",1);
        			that.renderPage();
        		}
        	});
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
        	//console.log(this.userData.wxid)
        	//console.log(window.location.href.split("&")[0]+'&wxid='+this.userData.wxid)
			var share_title = $("#share_title").text();
			var share_url = window.location.href.split("&")[0]+'&wxid='+this.userData.wxid;
			var share_desc = $("#share_desc").text();
			var share_pic = $("#share_pic").attr("src");
			/*var mbshare = nie.require("nie.util.mobiShare2");
			
			mbshare.init({
				title: share_title,
				desc: share_desc,
				url: share_url,
				imgurl: share_pic,
				circleTitle: share_title,
				guideText: "分享给好友",
				qrcodeIcon: share_pic,
				shareCallback: function(res) {
				
				},
				wxSdkCallback: function() {
				
				}
			});*/
			wx.config(wx_config);
			wx.ready(function(){
				var shareMeta = {
					title: share_title,
				    desc: share_desc,
				    link: share_url,
				    imgUrl: share_pic
				}
				var shareMetaTimeline = {
					title: share_title,
					link: share_url,
					imgUrl: share_pic
				}
				//分享到朋友圈
				wx.onMenuShareTimeline($.extend(shareMetaTimeline,{
					success: function () {
				        //_czc.push(﻿['_trackEvent', 'share', '分享到朋友圈']);
				    }
				}));
		
				//分享给朋友
				wx.onMenuShareAppMessage($.extend(shareMeta,{
					success: function () {
				        //_czc.push(﻿['_trackEvent', 'share', '分享给好友']);
				    }
				}));
			})
        },
        _renderCanvas: function() {
        	$.jrDraw.init("#canvasContainer");
        	$("body").on("touchmove",function(event){
				event.preventDefault;
			}, false)
        },
        showLayer: function(){
        	$(".complete").click(function(){
        		var r=confirm("是否确认保存");
        		if(r){
        			$(".layer").addClass("show");
        		}
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
        			if(that.isShare){
        				var html = template('works',that.imginfo);
						$(".page-3 .result-box").html(html);
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
        		$(".share").show();
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
        },
        tabs: function(){
        	var that = this;
        	$(".tabs a").click(function(){
        		var type = $(this).data("type");
        		that.rankType = type;
        		var index = $(this).index();
        		$(".tab-container").eq(index).show();
        		$(".tab-container").eq(index).siblings().hide();
        	})
        },
        loadHot: function(page){
        	var that = this;
        	$.ajax({
           		url : 'http://www.huihaicenter.com/api/zjz2/api.php?action=list',
				type: "get",
				data: {
					sort:'hot',
					page: page
				},
				dataType: "json",
				success: function(result){
					if(result.data.length==0){
						$(".rank-box .lists").eq(0).next().show();
						that.hotPage = that.hotPage-1;
					}
					var html = template('listTpl',result);
					$(".rank-box .lists").eq(0).append(html);
				}
			})
        },
        loadNew: function(page){
        	var that = this;
        	$.ajax({
           		url : 'http://www.huihaicenter.com/api/zjz2/api.php?action=list',
				type: "get",
				data: {
					sort:'new',
					page: page
				},
				dataType: "json",
				success: function(result){
					if(result.data.length==0){
						$(".rank-box .lists").eq(1).next().show();
						that.newPage = that.newPage-1;
					}
					var html = template('listTpl',result);
					$(".rank-box .lists").eq(1).append(html);
				}
			})
        },
        bindScroll: function(){
        	var that = this;
        	$(window).scroll(function () {
        		if(that.curPage==4){
        			if ($(window).scrollTop() + $(window).height() >= $(document).height()) {  
				        if(that.rankType=="hot"){
				        	that.hotPage = that.hotPage+1;
				        	that.loadHot(that.hotPage);
				        }else{
				        	that.newPage = that.newPage+1;
				        	that.loadNew(that.newPage);
				        }
				    }
        		}
			}); 
        },
        binLikes: function(){
        	var that = this;
        	$(document).on("click",".like",function(){
        		var self = this;
        		var type = $(this).data("type");
        		var id = $(this).data("wid");
        		var wxid = that.userData.wxid;
        		$.ajax({
	           		url : 'http://www.huihaicenter.com/api/zjz2/api.php?action=vote',
					type: "get",
					data: {
						wxid: wxid,
						id: id,
						type: type
					},
					dataType: "json",
					success: function(result){
						if(result.status=="true"){
							var total = result.num;
							$("[data-cid='"+id+"']").find(".score").html(total+'<em>分</em>');
						}else{
							alert(result.msg)	
						}
					}
				})
        	})
        },
        bindSubmit: function(){
        	var that = this;
        	$(".subForm").click(function(){
        		var phone = $("#phone").val();
	        	if(phone==""){
					alert("请输入手机号");
					return;
				}
				if (!/^1[34578]\d{9}/.test(phone)) {
					alert('请输入正确的手机号码');
					return;
				}
				
				html2canvas($("#canvasContainer"), { 
                    onrendered: function(canvas) {
                        //生成base64图片数据  
                        var dataUrl = canvas.toDataURL("image/png");
                        $.ajax({
		               		url : 'http://www.huihaicenter.com/api/zjz2/api.php?action=img',
							type: "post",
							data: {
								wxid: that.userData.wxid,
								img:dataUrl,
								phone: phone,
								type:sys
							},
							dataType: "json",
							success: function(data){
								if(data.status=="true"){
									that.isimg = 1;
									var result = that.userData;
									result.img = data.img;
									result.id = data.id;
									result.total = 0;
									that.imginfo = result;
									var html = template('works',result);
									$(".page-3 .result-box").html(html);
									$(".page-2").hide();
									$(".page-3").show();
									that.curPage = 3;
									$(".page-3 .back").attr("data-target",1);
									$("body").off("touchmove");
								}else{
									alert(data.msg)
								}
								$(".layer").removeClass("show");
							}
						})
                    }  
               	});
				
				/*var dataUrl = $("#canvasMain")[0].toDataURL("image/png");
				
               	$.ajax({
               		url : 'http://www.huihaicenter.com/api/zjz2/api.php?action=img',
					type: "post",
					data: {
						wxid: that.userData.wxid,
						img:dataUrl,
						phone: phone,
						type:sys
					},
					dataType: "json",
					success: function(data){
						if(data.status=="true"){
							that.isimg = 1;
							var result = that.userData;
							result.img = data.img;
							result.id = data.id;
							result.total = 0;
							that.imginfo = result;
							var html = template('works',result);
							$(".page-3 .result-box").html(html);
							$(".page-2").hide();
							$(".page-3").show();
							that.curPage = 3;
							$(".page-3 .back").attr("data-target",1);
							$("body").off("touchmove");
						}else{
							alert(data.msg)
						}
						$(".layer").removeClass("show");
					}
				})*/
        	})
        }
    }

	new Page();
})
