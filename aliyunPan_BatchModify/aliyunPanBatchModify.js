// ==UserScript==
// @name         阿里云盘-批量修改文件名-剧集刮削
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  用于阿里云盘批量修改文件名，主要为剧集刮削准备
// @author       You
// @match        https://www.aliyundrive.com/drive/folder/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=aliyundrive.com
// @grant        none
// @require      https://cdn.staticfile.org/jquery/3.6.0/jquery.min.js
// @run-at       document-body
// @license      GPLv3
// ==/UserScript==
 
(function() {
    'use strict';
 
    var $ = $ || window.$;
 
    var obj = {
	    files: [],
        randomFillParam: -1,
        url: location.href
    };
 
    obj.reset = function () {
        obj.files = [];
		obj.randomFillParam = -1;
		obj.url = location.href;
    };
 
    obj.initBatchButton = function () {
        if ($(".button--batch").length) {
            return;
        }
        if ($("#root header").length) {
            var html = '';
            html += '<div style="margin:0px 8px;"></div><button class="button--2Aa4u primary--3AJe5 small---B8mi button--batch">批量修改</button>';
            $("#root header:eq(0)").append(html);
            $(".button--batch").on("click", obj.showModifyPage);
        }else {
            setTimeout(obj.initBatchButton, 1000);
        }
    };
 
    obj.init = function () {
        var send = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(data) {
            this.addEventListener("load", function(event) {
                if(this.readyState == 4 && this.status == 200) {
                    var response = this.response, responseURL = this.responseURL;
                    try { response = JSON.parse(response) } catch (error) { };
                    if (responseURL.endsWith("/file/get_path")) {
                        obj.initBatchButton();
                    	//设置路径名
                        if (response instanceof Object && response.items) {
                        	obj.path = "/";
                        	var items = response.items;
                        	for(var i=items.length-1; i>=0; i--) {
                        		obj.path += items[i].name+"/";
                        	}
                        }
                    }else if (responseURL.indexOf("/file/list") > 0) {
                        if (document.querySelector(".ant-modal-mask")) {
                            //排除【保存 移动 等行为触发】
                            return;
                        }
                        if (response && response.items) {
                            if(obj.url && obj.url == location.href) {
                                obj.files = obj.files.concat(response.items);
                            }else {
                                obj.reset();
                                obj.files = response.items;
                            }
                        }
                    }
                }
            }, false);
            send.apply(this, arguments);
        };
    };
 
    obj.showModifyPage = function() {
        var html = `
			<div class="ant-modal-root ant-modal-batch-modify">
				<div class="ant-modal-mask"></div>
				<div tabindex="-1" class="ant-modal-wrap" role="dialog">
					<div role="document" class="ant-modal modal-wrapper--2yJKO" style="width: 666px;">
						<div class="ant-modal-content">
							<div class="ant-modal-header">
								<div class="ant-modal-title" id="rcDialogTitle1">扩展：批量重命名剧集</div>
							</div>
							<div class="ant-modal-body">
								<div class="icon-wrapper--3dbbo">
									<span data-role="icon" data-render-as="svg" data-icon-type="PDSClose" class="close-icon--33bP0 icon--d-ejA ">
										<svg viewBox="0 0 1024 1024">
											<use xlink:href="#PDSClose"></use>
										</svg>
									</span>
								</div>
								<div class="content-wrapper--1_WJv">
									<!-- <div class="cover--2pw-Z">
										<div class="file-cover--37ssA" data-size="XL">
											<img alt="others" class="fileicon--2Klqk fileicon--vNn4M " draggable="false" src="https://img.alicdn.com/imgextra/i1/O1CN01NVSzRz25VFRGlsewQ_!!6000000007531-2-tps-140-140.png">
										</div>
									</div> -->
								    当前路径地址：<input class="ant-input ant-input-borderless input--3oFR6 batch-path" type="text" value=""  disabled>
                                    <br/><br/>
 
									修改前名字模板：<input style="margin-bottom:8px" class="ant-input ant-input-borderless input--3oFR6 batch-before" type="text" value="" placeholder="使用$$标记集数，例如: show-name_xxx_$02$_xxx">
                                    <button class="button--2Aa4u primary--3AJe5 small---B8mi batch-randomFill">随机填充</button>
                                    <br/><br/>
 
									修改后名字模板：
									<input class="ant-input ant-input-borderless input--3oFR6 batch-after" type="text" value="" placeholder="前缀，按照格式[剧名_S季], 例如: show-name_S01"><br/>
									<input class="ant-input ant-input-borderless input--3oFR6 batch-after-suff" type="text" value="" placeholder="后缀，选填，影片参数信息，例如: 1080p_AAC">
								</div>
							</div>
							<div class="ant-modal-footer">
								<div class="footer--3Q0je">
									<button style="float:left" class="button--2Aa4u primary--3AJe5 small---B8mi batch-clear">清空</button>
									&nbsp&nbsp&nbsp&nbsp&nbsp
									<button class="button--2Aa4u warn--3AJe5 small---B8mi batch-modify">修改</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			`;
 
        $("body").append(html);
        $(".ant-modal-batch-modify .icon-wrapper--3dbbo").one("click", function () {
            $(".ant-modal-batch-modify").remove();
        });
        $(".ant-modal-batch-modify .ant-modal-wrap").on("click", function (event) {
            if ($(event.target).closest(".ant-modal-content").length == 0) {
                $(".ant-modal-batch-modify").remove();
            }
        });
        $(".batch-path").val(obj.path);
        $(".batch-clear").on("click", obj.clear);
        $(".batch-modify").on("click", obj.batchModify);
        $(".batch-randomFill").on("click", obj.randomFill);
    };
 
    obj.clear = function() {
    	$(".batch-before").val("");
        $(".batch-after").val("");
        $(".batch-after-suff").val("");
    };
 
    obj.disableButton = function() {
    	$(".batch-randomFill").attr('disabled',true);
        $(".batch-clear").attr('disabled',true);
        $(".batch-modify").attr('disabled',true);
    };
 
    obj.enableButton = function() {
    	$(".batch-randomFill").attr('disabled',false);
        $(".batch-clear").attr('disabled',false);
        $(".batch-modify").attr('disabled',false);
    };
 
    obj.batchModify = function() {
        obj.disableButton();
        //滚动到底，自动获取所有文件
        obj.pageScroll();
 
    	var nameBefore = $(".batch-before").val();
        var nameAfter = $(".batch-after").val();
        var suff = $(".batch-after-suff").val();
 
        if(isBlank(nameBefore) || isBlank(nameAfter)) {
        	alert("修改名字不能为空！");
            obj.enableButton();
        	return;
        }
 
        if(nameBefore === nameAfter) {
        	alert("修改前后名字不能一样！");
            obj.enableButton();
        	return;
        }
 
        if(!obj.files) {
        	alert("当前路径文件为空！");
            obj.enableButton();
        	return;
        }
 
        //检查集数标记
        var pos = [];
        var cnt = 0;
        for(var i=0; i<nameBefore.length; i++) {
        	if(nameBefore[i] == '$') {
        		pos[cnt++] = i;
        	}
        }
        if(cnt != 2) {
        	alert("集数标记有误！");
            obj.enableButton();
        	return;
        }
 
        //解析token
        var token = JSON.parse(localStorage.getItem("token"));
    	if(!token) {
    		alert("请先登录！");
            obj.enableButton();
    		return;
    	}
        var tokenStr = token.token_type + " " + token.access_token;
 
        var count = 0;
        for(var f of obj.files) {
            //检查文件是否应该修改
        	if(f.category != "video") continue;
        	if(f.name.length < nameBefore.length-2) continue;
            if(count > 200) break;
 
            //拼接新名字
        	var episode = f.name.substring(pos[0], pos[1]-1);
            if(!$.isNumeric(episode)) continue;
        	var newName = nameAfter+"E"+episode;
        	if(!isBlank(suff)) newName += "_"+suff;
        	if(!isBlank(f.file_extension)) newName += "."+f.file_extension;
 
        	obj.ajaxModify(f, newName, tokenStr);
            count++;
        	//console.log(f.name + " -> " + newName);
        }
 
        $(".ant-modal-batch-modify").remove();
        alert("完成修改【"+count+"】个文件");
 
        setTimeout(function() {window.location.reload()}, 500);
    }
 
    obj.ajaxModify = function(file, newName, token) {
    	$.ajax({
            type: "post",
            url: "https://api.aliyundrive.com/v3/file/update",
            data: JSON.stringify({
            	"drive_id": file.drive_id,
            	"file_id": file.file_id,
            	"name": newName,
            	"check_name_mode": "refuse"
            }),
            headers: {
            	"authority": "api.aliyundrive.com",
                "authorization": token,
                "content-type": "application/json;charset=UTF-8"
            },
            async: false, //批量修改文件多时，无法预估请求时间，关闭异步保证所有文件修改成功
            success: function (response) {
            	file.name = newName;
            },
            error: function (error) {
                console.error("modify error", error);
            }
        });
    }
 
    function isBlank(str) {
    	if(str == null || str === '') return true;
    	else if(str.trim() === '') return true;
    	else return false;
    }
 
    obj.randomFill = function() {
    	if(!obj.files) {
        	alert("当前路径文件为空！");
        	return;
        }
 
        var flag = true;
        for(var i=0; i<obj.files.length&&flag; i++) {
            obj.randomFillParam = (obj.randomFillParam+1) % obj.files.length;
            if(obj.files[obj.randomFillParam].category == "video") {
                flag = false;
            }
        }
 
        if(flag) {
            alert("没有vedio格式的文件！");
            return;
        }
 
    	$(".batch-before").val(obj.files[obj.randomFillParam].name);
    }
 
    obj.pageScroll = function () {
	    var i = 1;
	    var element = document.documentElement;
	    element.scrollTop = 0; // 不管他在哪里，都让他先回到最上面
 
	    // 设置定时器，时间即为滚动速度
	    function scroll() {
	        if (element.scrollTop + element.clientHeight == element.scrollHeight) {
	            clearInterval(interval);
	            console.log('已经到底部了');
	        } else {
	            element.scrollTop += 300;
	            //console.log(i);
	            i += 1;
	        }
	    }
	    // 定义ID
	    var interval = setInterval(scroll, 300);
	}
 
    obj.init();
    setTimeout(obj.initBatchButton, 1000);
 
})();