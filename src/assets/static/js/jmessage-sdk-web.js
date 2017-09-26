(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["io"] = factory();
	else
		root["io"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var JMessage = __webpack_require__(1);
	window.JMessage = module.exports = JMessage;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var Thenjs = __webpack_require__(2);
	var Base64 = __webpack_require__(5);
	var Channel = __webpack_require__(6);
	var JConstant = __webpack_require__(59);
	var MsgBuilder = __webpack_require__(60);
	var MsgContentBuilder = __webpack_require__(61);
	var MD5 = __webpack_require__(62)();
	var Util = __webpack_require__(63);

	var JMessage = function(opt) {
	    var _opt = opt ? opt : {};
	    this.opts = {
	        address : _opt.address ? _opt.address : JConstant.WSS_ADDRESS,
	        upload_file :  _opt.upload_file ? _opt.upload_file : JConstant.UPLOAD_FILE,
	        debug : _opt.debug ? true : false
	    };
	    this.channel = new Channel(this.opts);
	    // msg sync tack
	    this.syncTask = 0;
	    //receipt report 
	    this.msgReceipTask = 0;
	};


	/**
	 * 初始化API
	 */
	JMessage.prototype.init = function(args) {
	     var self = this;
	     self.autoDiscon = true; // 默认断线行为是自动断线，比如网络异常断线
	    if(args.flag === JConstant.SYNC_TYPE_OPEN || args.flag === JConstant.SYNC_TYPE_CLOSE){
	        self.channel.sync_type = args.flag;
	    }
	    this.channel.client.on(JConstant.EVENTS.INIT, function(data) {
	        if (data && data.code === 0) {
	            self.current_appkey = args.appkey;
	        }
	        self.channel.client.removeListener(JConstant.EVENTS.INIT);
	    });
	    args.fromPlatForm = JConstant.FROM_PLATFORM;
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.INIT)
	        .setData(args)
	        .send();
	};

	/**
	 * 退出
	 */
	 JMessage.prototype.loginOut = function() {
	    if(this.current_user){
	         this.autoDiscon = false; //手动断线不触发 disconnect事件
	         this.channel.client.close();
	         var dataCache=this.channel.dataCache;
	         for(var i in dataCache){ 
	           dataCache[i].cleanAckTimeout();
	           dataCache[i].cleanRespTimeout();
	         } 
	         this.current_user=null;
	         this.current_appkey = null;
	         this.channel.init(this.channel.opts);
	         //this.channel.client.connect(); 
	    } 
	};


	/**
	 * 登录
	 * Params:
	 *  - username  用户名
	 *  - password  密码
	 *  - is_md5    密码是否MD5
	 */
	JMessage.prototype.login  = function(args) {
	    this.__checkInit();
	    if (!args.is_md5) {
	        args.password = MD5(args.password);
	    }
	    args.version = JConstant.SDK_VERSION;
	    var self = this;
	    this.channel.client.on(JConstant.EVENTS.LOGIN, function (data) {
	        if (data && data.code ===0) {
	            self.current_user = args.username; 
	            Util.StorageUtils.removeItems(self.current_user);
	            self.channel.sync_key = 0;
	            self.channel.sync_event_key = 0;
	            self.channel.msg_receipt_key = 0;
	            self.channel.report_key = JConstant.RECEIPT_REPORT_KEY + self.current_appkey + '-' + self.current_user;
	            self.channel.ses_key = JConstant.SESSION_KEY + self.current_appkey + '-' + self.current_user;
	            self.channel.conversations_key =JConstant.CONVERSATION_KEY + self.current_appkey + '-' + self.current_user;
	            self._syncCheckTask(); // 同步check任务
	            self._receiptReportTask(); // 消息已读回执批量 任务
	            self._initConversation();
	            self.lastMsgs = {};
	            self.channel.client.removeListener(JConstant.EVENTS.LOGIN);

	            self._addEventListen();
	            
	           self.firstLogin = false;
	      }
	    });
	    var packet = new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.LOGIN)
	        .setData(args);
	    setTimeout(function(){
	       packet.send();
	    }, 500);
	    return packet;
	};


	/**
	 * 初始化 conversation 数据结构
	 * Params:
	 */
	JMessage.prototype._initConversation = function() {
	    var self = this;
	    var conversations = Util.StorageUtils.getItem(self.channel.conversations_key);
	    if(conversations === null){
	       conversations = JSON.stringify({});
	       Util.StorageUtils.addItem(self.channel.conversations_key,conversations);
	    }
	    self.conversations = JSON.parse(conversations);
	};

	/**
	 * msg receipt report 请求任务定时器
	 * Params:
	 */
	JMessage.prototype._receiptReportTask  = function() {
	    var self = this;
	    if(Util.StorageUtils.getItem(self.channel.report_key) === null){
	       var report = {'reports':[]};
	       Util.StorageUtils.addItem(self.channel.report_key,JSON.stringify(report));
	    }
	    self.msgReceipTask=setInterval(function (){
	        self._receiptReport();
	    },JConstant.RECEIPT_REPORT_INTERVAL);
	};

	/**
	 * 数据同步请求任务定时器
	 * Params:
	 */
	JMessage.prototype._syncCheckTask  = function() {
	    var self = this;
	    self._syncCheck({'sync_key' : self.channel.sync_key , 'sync_type' : self.channel.sync_type,'sync_event_key':self.channel.sync_event_key,'msg_receipt_key':self.channel.msg_receipt_key}).onSuccess(function(da){
	                            if (da && da.code === 0) {
	                                self.channel.sync_key = da.sync_key;
	                                self.channel.sync_type = da.sync_type;
	                                self.channel.sync_event_key = da.sync_event_key;
	                                self.channel.msg_receipt_key = da.msg_receipt_key;
	                            }
	                });
	             
	    self.syncTask=setInterval(function(){
	                  self._syncCheck({'sync_key' : self.channel.sync_key , 'sync_type' : self.channel.sync_type,'sync_event_key':self.channel.sync_event_key,'msg_receipt_key':self.channel.msg_receipt_key}).onSuccess(function(da){
	                            if (da && da.code === 0) {
	                                self.channel.sync_key = da.sync_key;
	                                self.channel.sync_type = da.sync_type;
	                                self.channel.sync_event_key = da.sync_event_key;
	                                self.channel.msg_receipt_key = da.msg_receipt_key;
	                            }
	                  });
	           },JConstant.SYNC_INTERVAL);
	};

	/**
	 * 数据同步请求
	 * Params:
	 *  - sync_key  同步点
	 *  - sync_type 是否漫游
	 */
	JMessage.prototype._syncCheck  = function(args) {
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.SYNC_CHECK)
	        .setData(args)
	        .send();
	};

	/**
	 * 注册
	 * Params:
	 *  - username  用户名
	 *  - password  密码
	 *  - is_md5    密码是否MD5
	 *  - nick_name 昵称
	 *  - birthday  生日
	 *  - signature 签名
	 *  - gender    性别，0位置, 1男，2女
	 *  - region    地区
	 *  - address   地址
	 *  - media_id  头像id 开发者从自己的服务器上获取
	 *  - extras    自定义字段
	 *  - 
	 */
	JMessage.prototype.register = function(args) {
	    this.__checkInit();
	    if (!args.is_md5) {
	        args.password = MD5(args.password);
	    }
	    return new MsgBuilder(this.channel)
	           .setEvent(JConstant.EVENTS.REGISTER)
	           .setData(args)
	           .send();
	};


	/**
	 * 获取用户信息
	 * Params:
	 *  - username  用户名
	 *  - appkey    跨应用查询时必填，目标应用的appkey
	 */
	JMessage.prototype.getUserInfo = function(args) {
	    this.__checkLogin();
	    if (Util.StringUtils.isBlack(args.appkey)) {
	        args.appkey = this.current_appkey;
	    }
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.GET_ACROSS_USER_INFO)
	        .setData(args)
	        .send();
	};

	/**
	 * 更新个人用户信息
	 * Params:
	 *  - nick_name 昵称
	 *  - birthday  生日
	 *  - signature 签名
	 *  - gender    性别，0位置, 1男，2女
	 *  - region    地区
	 *  - address   地址
	 *  - extras    自定义字段
	 */
	JMessage.prototype.updateSelfInfo = function(args) {
	    this.__checkLogin();
	    if (!Util.StringUtils.isBlack(args.avatar)) {
	        // 用户头像更新必须走updateSelfAvatar接口
	        delete args.avatar;
	    }
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.UPDATE_SELF_INFO)
	        .setData(args)
	        .send();
	};

	/**
	 * 更新个人头像
	 * Params:
	 *  - avatar    头像FormData对象
	 */
	JMessage.prototype.updateSelfAvatar = function(args) {
	    this.__checkLogin();
	    var builder = new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.UPDATE_SELF_INFO);

	    var self = this;
	    this.__uploadFile({
	        appkey : self.current_appkey,
	        username : self.current_user,
	        file : args.avatar,
	        type : 'image'
	    }, function(err, content) {
	        if (err) {
	            if (err.is_timeout) return builder.timeout && builder.timeout(err.data);;
	            return builder.fail && builder.fail(err.data);
	        }
	        builder
	            .setData({avatar:content.media_id})
	            .send();
	    });
	    return builder;

	};

	/**
	 * 更新个人密码
	 * Params:
	 *  - old_pwd   旧的密码
	 *  - new_pwd   新的密码
	 *  - is_md5    密码是否MD5
	 */
	JMessage.prototype.updateSelfPwd = function (args) {
	    this.__checkLogin();
	    if (!args.is_md5) {
	        args.old_pwd = MD5(args.old_pwd);
	        args.new_pwd = MD5(args.new_pwd);
	    }
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.UPDATE_SELF_PWD)
	        .setData(args)
	        .send();
	};

	/**
	 * 获取会话列表
	 */
	JMessage.prototype.getConversation = function() {
	    this.__checkLogin();
	    var self = this;
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.GET_CONVERSATIONS)
	        .setData({})
	        .send()
	        .addHook(function(data,success){
	            data.conversations.forEach(function(item){
	                 var key;
	                 if(item.type === 3){ 
	                     self[item.key] = item.utime; // 单聊会话 保存最新的更新时间 ，用户信息更新事件需要对比
	                     delete item.utime;
	                     key = item.appkey+item.username;
	                  }else{
	                     key = item.key;
	                     item.gid = item.key;
	                  }

	                  if(self.conversations[key]){
	                     
	                     // 获取extras
	                     if(self.conversations[key].extras){
	                        item.extras = self.conversations[key].extras;
	                     }else{
	                        item.extras = {};
	                     }
	                     
	                     //获取unread_msg_count
	                     if(self.syncTime && self.conversations[key].last_time && self.conversations[key].last_time === self.syncTime ){ // 已经同步过 && 同步时间=缓存里面的时间
	                        item.unread_msg_count = self.conversations[key].unread_msg_count;
	                     }else{
	                        item.unread_msg_count = 0; // 未同步直接等于0
	                     }
	                
	                  }else{
	                     item.extras = {};
	                     item.unread_msg_count = 0;
	                     self.conversations[key] = {};
	                     self.conversations[key].extras = {};
	                     self.conversations[key].unread_msg_count =0;
	                     self.elf.conversations[key].msg_time = [];
	                  }
	                   
	            });
	            Util.StorageUtils.addItem(self.channel.conversations_key,JSON.stringify(self.conversations));
	            success && success(data);
	        });
	};


	/** 
	 * 重置会话未读数
	 * gid
	 * appkey
	 * username
	 * 
	 */
	 JMessage.prototype.resetUnreadCount =function(args){
	    var self = this;
	    var key;
	    if(args.gid){
	       key = args.gid;
	    }else{ 
	      if(!args.appkey){
	        args.appkey = self.current_appkey;
	       } 
	       key = args.appkey + args.username;
	    }
	    self.conversations[key] = (self.conversations[key] === undefined ? {} : self.conversations[key]);
	    // =0 不需要更新
	    if(self.conversations[key].unread_msg_count != 0){
	       if(args.gid){
	           self._updateGroupUnreadCount({'gid':args.gid});
	       }else{
	           self._updateSingleUnreadCount({'appkey':args.appkey,'username':args.username});
	       }
	    }
	   
	    self.conversations[key].unread_msg_count = 0;
	    self.conversations[key].msg_time = [];
	    var recent_time = new Date().getTime();
	    if(self.lastMsgs[key]){
	          recent_time = self.lastMsgs[key].last_msg_time;
	    }
	    self.conversations[key].recent_time = recent_time;
	    self.current_conversation = key;
	    Util.StorageUtils.addItem(self.channel.conversations_key,JSON.stringify(self.conversations));
	 }


	/** 
	 * 获取会话未读数
	 * gid
	 * appkey
	 * username
	 * 
	 */
	 JMessage.prototype.getUnreadMsgCnt =function(args){
	    var self = this;
	    var key;
	    if(args.gid){
	       key = args.gid;
	    }else{ 
	       key = args.appkey + args.username;
	    }

	     self.conversations[key] = (self.conversations[key] === undefined ? {} : self.conversations[key]);
	     return self.conversations[key].unread_msg_count ? self.conversations[key].unread_msg_count : 0;
	 }


	/** 消息相关API START **/


	/**
	 * 消息撤回
	 * Params:
	 *  - msgId         需要撤销的消息id
	 */
	JMessage.prototype.msgRetract = function(args) {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.MSG_RETRACT)
	        .setData(args)
	        .send();
	};



	/**
	 * 发送单聊文本消息
	 * Params:
	 *  - target_username   目标用户名
	 *  - target_nickname   目标用户昵称
	 *  - content           聊天文本
	 *  - extras            附加字段，字典类型
	 *  - appkey            跨应用时必填，目标应用的appkey
	 */
	JMessage.prototype.sendSingleMsg = function(args) {
	    return this.__sendMsg({
	        type : 'single',
	        target_id : args.target_username,
	        target_name : args.target_nickname,
	        content : args.content,
	        extras : args.extras,
	        msg_body : args.msg_body,
	        appkey : args.appkey,
	        no_offline : args.no_offline,
	        no_notification : args.no_notification,
	        custom_notification : args.custom_notification,
	        nead_receipt : args.nead_receipt
	    });
	};

	/**
	 * 发送群聊文本消息
	 * Params:
	 *  - target_username   目标群组ID
	 *  - target_nickname   目标群组名称
	 *  - content           聊天文本
	 *  - extras            附加字段，字典类型
	 */
	JMessage.prototype.sendGroupMsg = function(args) {
	    return this.__sendMsg({
	        type : 'group',
	        target_id : args.target_gid,
	        target_name : args.target_gname,
	        content : args.content,
	        extras : args.extras,
	        msg_body : args.msg_body,
	        at_list : args.at_list,
	        no_offline : args.no_offline,
	        no_notification : args.no_notification,
	        custom_notification : args.custom_notification,
	        nead_receipt : args.nead_receipt
	    });
	};

	/**
	 * 发送单聊图片消息
	 * Params:
	 *  - target_username   目标用户名
	 *  - target_gname      目标用户昵称
	 *  - image             图片的DataForm对象
	 *  - msg_body          消息体
	 *  - extras            附加字段，字典类型
	 *  - appkey            跨应用时必填，目标应用的appkey
	 */
	JMessage.prototype.sendSinglePic = function(args) {
	    return this.__sendPic({
	        type : 'single',
	        target_id : args.target_username,
	        target_name : args.target_nickname,
	        file : args.image,
	        msg_body : args.msg_body,
	        extras : args.extras,
	        appkey : args.appkey,
	        no_offline : args.no_offline,
	        no_notification : args.no_notification,
	        custom_notification : args.custom_notification,
	        nead_receipt : args.nead_receipt
	    });
	};

	/**
	 * 发送群聊图片消息
	 * Params:
	 *  - target_gid        目标群组ID
	 *  - target_gname      目标群组名称
	 *  - image             图片的DataForm对象
	 *  - msg_body          消息体
	 *  - extras            附加字段，字典类型
	 */
	JMessage.prototype.sendGroupPic = function(args) {
	    return this.__sendPic({
	        type : 'group',
	        target_id : args.target_gid,
	        target_name : args.target_gname,
	        file : args.image,
	        msg_body : args.msg_body,
	        extras : args.extras,
	        no_offline : args.no_offline,
	        no_notification : args.no_notification,
	        custom_notification : args.custom_notification,
	        nead_receipt : args.nead_receipt
	    });
	};

	/**
	 * 发送单聊文件消息
	 * Params:
	 *  - target_username   目标用户名
	 *  - target_nickname   目标用户昵称
	 *  - file              文件的DataForm对象
	 *  - extras            附加字段，字典类型
	 *  - appkey            跨应用时必填，目标应用的appkey
	 */
	JMessage.prototype.sendSingleFile = function(args) {
	    return this.__sendFile({
	        type : 'single',
	        target_id : args.target_username,
	        target_name : args.target_nickname,
	        file : args.file,
	        msg_body : args.msg_body,
	        extras : args.extras,
	        appkey : args.appkey,
	        no_offline : args.no_offline,
	        no_notification : args.no_notification,
	        custom_notification : args.custom_notification,
	        nead_receipt : args.nead_receipt
	    });
	};

	/**
	 * 发送群聊文件消息
	 * Params:
	 *  - target_gid        目标群组ID
	 *  - target_gname      目标群组名称
	 *  - file              文件的DataForm对象
	 *  - extras            附加字段，字典类型
	 */
	JMessage.prototype.sendGroupFile = function(args) {
	    return this.__sendFile({
	        type : 'group',
	        target_id : args.target_gid,
	        target_name : args.target_gname,
	        file : args.file,
	        msg_body : args.msg_body,
	        extras : args.extras,
	        no_offline : args.no_offline,
	        no_notification : args.no_notification,
	        custom_notification : args.custom_notification,
	        nead_receipt : args.nead_receipt
	    });
	};

	/**
	 * 发送单聊地理位置消息
	 * Params:
	 *  - target_username   目标用户名
	 *  - target_nickname   目标用户昵称
	 *  - latitude          地理位置latitude
	 *  - longitude         地理位置longitude
	 *  - scale             地理位置scale
	 *  - label             地理位置label
	 *  - extras            附加字段，字典类型
	 *  - appkey            跨应用时必填，目标应用的appkey
	 */
	JMessage.prototype.sendSingleLocation = function(args) {
	    return this.__sendLocation({
	        type : 'single',
	        target_id : args.target_username,
	        target_name : args.target_nickname,
	        latitude : args.latitude,
	        longitude : args.longitude,
	        scale : args.scale,
	        label : args.label,
	        msg_body : args.msg_body,
	        extras : args.extras,
	        appkey : args.appkey,
	        no_offline : args.no_offline,
	        no_notification : args.no_notification,
	        custom_notification : args.custom_notification,
	        nead_receipt : args.nead_receipt
	    });
	};


	/**
	 * 发送群聊地理位置消息
	 * Params:
	 *  - target_gid        目标群组ID
	 *  - target_gname      目标群组名称
	 *  - latitude          地理位置latitude
	 *  - longitude         地理位置longitude
	 *  - scale             地理位置scale
	 *  - label             地理位置label
	 *  - extras            附加字段，字典类型
	 */
	JMessage.prototype.sendGroupLocation = function(args) {
	    return this.__sendLocation({
	        type : 'group',
	        target_id : args.target_gid,
	        target_name : args.target_gname,
	        latitude : args.latitude,
	        longitude : args.longitude,
	        scale : args.scale,
	        label : args.label,
	        msg_body : args.msg_body,
	        extras : args.extras,
	        no_offline : args.no_offline,
	        no_notification : args.no_notification,
	        custom_notification : args.custom_notification,
	        nead_receipt : args.nead_receipt
	    });
	};

	/**
	 * 发送单聊自定义消息
	 * Params:
	 *  - target_username   目标用户名
	 *  - target_nickname   目标用户昵称
	 *  - custom            自定义消息对象
	 *  - appkey            跨应用时必填，目标应用的appkey
	 */
	JMessage.prototype.sendSingleCustom = function(args) {
	    return this.__sendCustom({
	        type : 'single',
	        target_id : args.target_username,
	        target_name : args.target_nickname,
	        custom : args.custom,
	        extras : args.extras,
	        msg_body : args.msg_body,
	        appkey : args.appkey,
	        no_offline : args.no_offline,
	        no_notification : args.no_notification,
	        custom_notification : args.custom_notification,
	        nead_receipt : args.nead_receipt
	    });
	};


	/**
	 * 发送群聊自定义消息
	 * Params:
	 *  - target_gid        目标群组ID
	 *  - target_gname      目标群组名称
	 *  - custom            自定义消息对象
	 */
	JMessage.prototype.sendGroupCustom = function (args) {
	    return this.__sendCustom({
	        type : 'group',
	        target_id : args.target_gid,
	        target_name : args.target_gname,
	        custom : args.custom,
	        msg_body : args.msg_body,
	        extras : args.extras,
	        no_offline : args.no_offline,
	        no_notification : args.no_notification,
	        custom_notification : args.custom_notification,
	        nead_receipt : args.nead_receipt
	    });
	};

	/** 消息相关API END **/

	/** 群组管理API START **/

	/**
	 * 创建群组
	 * Params:
	 *  - group_name        群组名称
	 *  - group_description 群简介
	 *  - avatar    头像FormData对象
	 */
	JMessage.prototype.createGroup = function(args) {
	    this.__checkLogin();
	    var self = this;
	    var build = new MsgBuilder(this.channel).setEvent(JConstant.EVENTS.CREATE_GROUP);
	    if(!args.avatar){ // 没设置头像
	        build.setData(args).send();
	    }else{ // 有头像
	      this.__uploadFile({
	            appkey : self.current_appkey,
	            username : self.current_user,
	            file : args.avatar,
	            type : 'image'
	        }, function(err, content) {
	            if (err) {
	                if (err.is_timeout) return build.timeout && build.timeout(err.data);;
	                return build.fail && build.fail(err.data);
	            }
	            delete args.avatar;
	            args.media_id = content.media_id;
	            build.setData(args)
	                 .send();
	        });
	    }
	    return build;
	};

	/**
	 * 退出群组
	 * Params:
	 *  - gid   群组ID
	 */
	JMessage.prototype.exitGroup = function(args) {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.EXIT_GROUP)
	        .setData(args)
	        .send();
	};

	/**
	 * 获取群组列表
	 */
	JMessage.prototype.getGroups = function() {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.GET_GROUPS_LIST)
	        .setData({})
	        .send();
	};

	/**
	 * 获取群组信息
	 * Params:
	 *  - gid   群组ID
	 */
	JMessage.prototype.getGroupInfo = function(args) {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.GET_GROUP_INFO)
	        .setData(args)
	        .send();
	};

	/**
	 * 更新群组信息
	 * Params:
	 *  - gid               群组ID
	 *  - group_name        群组名称
	 *  - group_description 群简介
	 *  - avatar  群头像 
	 */
	JMessage.prototype.updateGroupInfo = function(args) {
	    this.__checkLogin();
	    var self = this;
	    var build = new MsgBuilder(this.channel).setEvent(JConstant.EVENTS.UPDATE_GROUP_INFO);
	   
	    if(!args.avatar){ // 没设置头像
	        build.setData(args).send();
	    }else{ // 有头像
	      this.__uploadFile({
	            appkey : self.current_appkey,
	            username : self.current_user,
	            file : args.avatar,
	            type : 'image'
	        }, function(err, content) {
	            if (err) {
	                if (err.is_timeout) return build.timeout && build.timeout(err.data);;
	                return build.fail && build.fail(err.data);
	            }
	            delete args.avatar;
	            args.media_id = content.media_id;
	            build.setData(args)
	                 .send();
	        });
	    }
	    return build;
	};

	/**
	 * 获取群组成员
	 * Params:
	 *  - gid       群组ID
	 */
	JMessage.prototype.getGroupMembers = function(args) {
	    this.__checkLogin();
	     var self = this;
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.GET_GROUP_MEMBERS)
	        .setData(args)
	        .send()
	        .onUserInfoGet(function(uid,mtime){
	              self[uid] = mtime;
	        });
	};

	/**
	 * 增加群组成员
	 * Params:
	 *  - gid               群组ID
	 *  - member_usernames  用户username列表
	 *  - appkey            跨应用时必填，目标应用的appkey
	 */
	JMessage.prototype.addGroupMembers = function(args) {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.ADD_ACROSS_GROUP_MEMBER)
	        .setData(args)
	        .send();
	};

	/**
	 * 删除群组成员
	 * Params:
	 *  - gid               群组ID
	 *  - member_usernames  用户username列表
	 *  - appkey            跨应用时必填，目标应用的appkey
	 * @param args
	 */
	JMessage.prototype.delGroupMembers = function(args) {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.DEL_ACROSS_GROUP_MEMBER)
	        .setData(args)
	        .send();
	};

	/** 群组管理API END **/

	/** 免打扰相关API START **/


	/**
	 * 获取免打扰列表
	 */
	JMessage.prototype.getNoDisturb = function() {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.NO_DISTURB)
	        .setData({version: 0})
	        .send();
	};

	/**
	 * 增加用户免打扰
	 * Params:
	 *  - target_name  用户名
	 *  - appkey    跨应用时必填，目标应用的appkey
	 */
	JMessage.prototype.addSingleNoDisturb = function(args) {
	    this.__checkLogin();
	    args.version = 0;
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.ADD_MSG_NO_DISTURB_SINGLE)
	        .setData(args)
	        .send();
	};

	/**
	 * 删除用户免打扰
	 * Params:
	 *  - target_name   用户名
	 *  - appkey     跨应用时必填，目标应用的appkey
	 */
	JMessage.prototype.delSingleNoDisturb = function(args) {
	    this.__checkLogin();
	    args.version = 0;
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.DELETE_MSG_NO_DISTURB_SINGLE)
	        .setData(args)
	        .send();
	};

	/**
	 * 增加群组免打扰
	 * Params:
	 *  - gid  群组ID
	 */
	JMessage.prototype.addGroupNoDisturb = function(args) {
	    this.__checkLogin();
	    args.version = 0;
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.ADD_MSG_NO_DISTURB_GROUP)
	        .setData(args)
	        .send();
	};

	/**
	 * 删除群组免打扰
	 * Params:
	 *  - gid  群组ID
	 */
	JMessage.prototype.delGroupNoDisturb = function(args) {
	    this.__checkLogin();
	    args.version = 0;
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.DELETE_MSG_NO_DISTURB_GROUP)
	        .setData(args)
	        .send();
	};

	/**
	 * 打开全局免打扰
	 */
	JMessage.prototype.addGlobalNoDisturb = function() {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.ADD_MSG_NO_DISTURB_GLOBAL)
	        .setData({version: 0})
	        .send();
	};

	/**
	 * 关闭全局免打扰
	 */
	JMessage.prototype.delGlobalNoDisturb = function() {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.DELETE_MSG_NO_DISTURB_GLOBAL)
	        .setData({version: 0})
	        .send();

	};

	/**
	 * 获取黑名单列表
	 */
	JMessage.prototype.getBlacks = function() {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.GET_BLACK_LIST)
	        .setData({version: 0})
	        .send();
	};

	/**
	 * 增加用户黑名单
	 * Params
	 *  - member_usernames Member User对象
	 *
	 * MemberUser:
	 *  - username  用户名
	 *  - appkey    跨应用的时候为目标AppKey，否则为自身AppKey
	 */
	JMessage.prototype.addSingleBlacks = function(args) {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.ADD_BLACK_LIST)
	        .setData(args)
	        .send();
	};

	/**
	 * 删除用户黑名单
	 * Params
	 *  - member_usernames Member User对象
	 *
	 * MemberUser:
	 *  - username  用户名
	 *  - appkey    跨应用的时候为目标AppKey，否则为自身AppKey
	 */
	JMessage.prototype.delSingleBlacks = function(args) {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.DEL_BLACK_LIST)
	        .setData(args)
	        .send();
	};

	/**
	 * 好友列表
	 */
	JMessage.prototype.getFriendList = function() {
	    this.__checkLogin();
	    var self = this;
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.GET_FRIEND_LIST)
	        .setData({})
	        .send()
	        .onUserInfoGet(function(uid,mtime){
	              self[uid] = mtime;
	        });
	};

	/**
	 * 好友添加
	 * Params:
	 *  -   target_name   用户名
	 *  -   why           邀请原因，邀请方填写邀请原因
	 *  -   appkey        跨应用的时候为目标AppKey，否则为自身AppKey
	 */
	JMessage.prototype.addFriend = function(args) {
	    this.__checkLogin();
	    args.from_type = JConstant.FRIEND_INVITE;
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.ADD_FRIEND)
	        .setData(args)
	        .send();
	};

	/**
	 * 同意添加好友邀请
	 * Params:
	 *  -   target_name   用户名
	 *  -   appkey        跨应用的时候为目标AppKey，否则为自身AppKey
	 */
	JMessage.prototype.acceptFriend = function(args) {
	    this.__checkLogin();
	    args.why = 'yes';
	    args.from_type = JConstant.FRIEND_INVITED;
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.ADD_FRIEND)
	        .setData(args)
	        .send();
	};

	/**
	 * 拒绝添加好友邀请
	 * Params:
	 *  -   target_name   用户名
	 *  -   why           被邀请方填其他内容表示拒绝邀请方请求
	 *  -   appkey        跨应用的时候为目标AppKey，否则为自身AppKey
	 */
	JMessage.prototype.declineFriend = function(args) {
	    this.__checkLogin();
	    if(!(args.why && args.why.trim() != '')){ // 没有设置理由的情况下 设置个默认值 no
	      args.why = 'no';
	    }
	    args.from_type = JConstant.FRIEND_INVITED;
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.ADD_FRIEND)
	        .setData(args)
	        .send();
	};

	/**
	 * 删除好友
	 * Params:
	 *  -   target_name   用户名
	 *  -   appkey        跨应用的时候为目标AppKey，否则为自身AppKey
	 */
	JMessage.prototype.delFriend= function(args) {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.DEL_FRIEND)
	        .setData(args)
	        .send();
	};

	/**
	 * 修改好友备注
	 * Params:
	 *  -   target_name   用户名
	 *  -   memo_name     名称备注
	 *  -   memo_others   其他备注
	 *  -   appkey        跨应用的时候为目标AppKey，否则为自身AppKey
	 */
	JMessage.prototype.updateFriendMemo= function(args) {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.UPDATE_FRIEND_MEMO)
	        .setData(args)
	        .send();
	};


	/**
	 * 增加群组黑名单
	 * Params:
	 *  - gid   群组ID
	 */
	JMessage.prototype.addGroupShield = function(args) {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.ADD_MSG_SHIELD_GROUP)
	        .setData(args)
	        .send();
	};


	/**
	 * 删除群组黑名单
	 * Params:
	 *  - gid   群组ID
	 */
	JMessage.prototype.delGroupShield = function(args) {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.DEL_MSG_SHIELD_GROUP)
	        .setData(args)
	        .send();
	};

	/**
	 * 获取免打扰列表
	 * Params:
	 */
	JMessage.prototype.groupShieldList = function() {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.LIST_SHIELD_GROUP )
	        .setData({})
	        .send();
	};

	/**
	 * 获取资源url
	 * Params:
	 *  - media Id  资源ID
	 */
	JMessage.prototype.getResource = function(args) {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.GET_RESOURCE)
	        .setData(args)
	        .send();
	};

	 /** 未读数更新
	 * Params:
	 *  - gid
	 */
	JMessage.prototype._updateGroupUnreadCount = function(args) {
	    this.__checkLogin();
	    args.type = 4;
	    new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.UNREAD_GROUP_COUNT)
	        .setData(args)
	        .send();
	};

	 /** 未读数更新
	 * Params:
	 *  - appkey
	 *  - username
	 */
	JMessage.prototype._updateSingleUnreadCount = function(args) {
	    this.__checkLogin();
	    args.type = 3;
	    new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.UNREAD_SINGLE_COUNT)
	        .setData(args)
	        .send();
	};

	 /** 消息未读列表
	 * Params:
	 *  - msg_id 
	 */
	JMessage.prototype.msgUnreadList = function(args) {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.MSG_UNREAD_LIST)
	        .setData(args)
	        .send();
	};

	/** 消息已读回执
	 * Params: 
	 *  - gid
	 *  - msg_ids 已读消息id列表
	 */
	JMessage.prototype.addGroupReceiptReport = function(args) {
	    this.__checkLogin();
	    var self = this;
	    if(!(args.msg_ids instanceof Array)){
	        console.error('msg_ids is not Array type!');
	        return;
	    }
	    args.key = args.gid;
	    args.type = 4;
	    var reports = JSON.parse(Util.StorageUtils.getItem(self.channel.report_key));
	    reports['reports'].push(args);
	    Util.StorageUtils.addItem(self.channel.report_key,JSON.stringify(reports));
	    return;
	};

	/** 消息已读回执
	 * Params: 
	 *  - appkey
	 *  - username
	 *  - msg_ids 已读消息id列表
	 */
	JMessage.prototype.addSingleReceiptReport = function(args) {
	    this.__checkLogin();
	    var self = this;
	    if(!(args.msg_ids instanceof Array)){
	        console.error('msg_ids is not Array type!');
	        return;
	    }
	    if(!args.appkey){
	        args.appkey = self.current_appkey;
	    }
	    args.type = 3;
	    args.key = args.appkey+args.username;
	    var reports = JSON.parse(Util.StorageUtils.getItem(self.channel.report_key));
	    reports['reports'].push(args);
	    Util.StorageUtils.addItem(self.channel.report_key,JSON.stringify(reports));
	    return;
	};

	/**
	 * 消息透传 单用户
	 * Params: 
	 * -  target_appkey
	 * -  target_username
	 * -  cmd  string
	 */
	JMessage.prototype.transSingleMsg = function(args) {
	    this.__checkInit();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.TRANS_MSG_SINGLE)
	        .setData(args)
	        .send();
	    }  

	/**
	 * 消息透传 群
	 * Params: 
	 * -  gid     群id
	 * -  cmd string
	 */
	JMessage.prototype.transGroupMsg = function(args) {
	    this.__checkInit();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.TRANS_MSG_GROUP)
	        .setData(args)
	        .send();
	}  

	/**
	 * 会话置顶 无回调函数
	 * Params: 
	 * -  gid
	 * - appkey
	 * - username
	 */
	JMessage.prototype.updateConversation = function(args) {
	    this.__checkInit();
	    var self = this;
	    if(!args.appkey){
	        args.appkey = self.current_appkey;
	    }
	    var key;
	    if(args.gid){
	        key = args.gid;
	    }else if(args.username){
	        key = args.appkey+args.username;
	    }

	    if(key && args.extras){
	        if(!self.conversations[key]){
	           self.conversations[key] = {};
	        }
	        self.conversations[key].extras = args.extras; 
	    }
	    Util.StorageUtils.addItem(self.channel.conversations_key,JSON.stringify(self.conversations));
	}  



	JMessage.prototype.isInit = function() {
	      return !(!this.current_appkey);  
	};

	JMessage.prototype.isLogin = function() {
	    return  !(!this.current_user);
	};

	JMessage.prototype.isConnect = function() {
	    return  !(!this.channel.client.connected);
	};

	/** 免打扰相关API END **/

	/**       事件相关           **/

	JMessage.prototype._addEventListen = function(){
	    var self = this;
	    self.channel.client.on(JConstant.EVENTS.MSG_SYNC, function(data) {
	            self._onMsgReceive(data);
	        });

	    self.channel.client.on(JConstant.EVENTS.EVENT_NOTIFICATION, function(data) {
	            self._onEventNotification(data); 
	        });

	    self.channel.client.on(JConstant.EVENTS.SYNC_CONVERSATION, function(data) {
	            self._onSyncConversation(data);   
	        });

	    self.channel.client.on(JConstant.EVENTS.SYNC_EVENT, function(data) {
	           self._onSyncEvent(data);  
	       });

	    self.channel.client.on(JConstant.EVENTS.SYNC_RECEIPT, function(data) {
	        self._onSyncMsgReceipt(data); 
	    });

	    self.channel.client.on(JConstant.EVENTS.RECEIPT_CHANGE, function(data) {  
	         self._onMsgReceiptChange(data);
	    });

	    self.channel.client.on(JConstant.EVENTS.TRANS_MSG_REC, function(data) {
	        self._onTransMsgRec(data);
	    });

	    self.channel.client.on('disconnect', function(){
	            self._onDisconnect();
	    });
	}

	/**
	 * 聊天消息接收事件
	 */
	JMessage.prototype.onMsgReceive = function(fn) {
	    this._onMsgReceiveFn = fn;   
	};

	/**
	 * 实时消息监听处理函数
	 */
	JMessage.prototype._onMsgReceive = function(data){
	        var msgRecv = [];
	        var self = this;
	        Array.prototype.push.apply(msgRecv,data.messages.map(function (item) {
	            return {
	                msg_id: item.msg_id,
	                msg_type: item.msg_type,
	                from_uid: item.from_uid,
	                from_gid: item.from_gid
	            };
	        }));

	        data.messages.forEach(function(item) {
	            
	            //检测发送方信息是否更新，更新就触发事件通知用户
	            if(item.content.sui_mtime && self[item.from_uid] && (item.content.sui_mtime > (new Date(self[item.from_uid]).getTime()/1000))){
	                  self[item.from_uid] = item.content.sui_mtime*1000;
	                  var userData = {};
	                  userData.from_username = item.content.from_id;
	                  userData.from_appkey = item.content.from_appkey;
	                  userData.mtime = item.content.sui_mtime;
	                  delete item.content.sui_mtime;
	                  self._updateInfoEventFun &&  self._updateInfoEventFun(userData);
	            }
	            var key;
	            if(item.msg_type === 3){
	                item.key = item.from_uid;
	                item.from_username = item.content.from_id;
	                item.from_appkey = item.content.from_appkey;
	                key = item.from_appkey + item.from_username;
	            }else{
	                item.key = item.from_gid;
	                key = item.from_gid;
	            }

	             //delete item.from_uid; 兼容之前版本 暂时不删除 2.3.1 加
	             //delete item.from_gid; 

	            if(item.msg_level === 0) {
	                item.msg_level = 'normal';
	            } else if(item.msg_level === 1) {
	                item.msg_level = 'across';
	            }
	           
	           
	            // 设置真实的会话 key
	            if(item.from_appkey === self.current_appkey && item.from_username === self.current_user){
	                  // Android bug, tagert appkey may null
	                  var target_appkey = (item.content.target_appkey === undefined || item.content.target_appkey === '') ? item.content.from_appkey : item.content.target_appkey;
	                  key = target_appkey + item.content.target_id;
	            }

	          
	            self.lastMsgs[key] = {'last_msg_time' : item.ctime_ms};

	            // 会话不存在 新增会话数据
	            if(!self.conversations[key]){
	                self.conversations[key] = {};
	                self.conversations[key].extras = {};
	                self.conversations[key].unread_msg_count = 0;
	                self.conversations[key].last_time = self.syncTime;
	                self.conversations[key].msg_time = [];
	            }

	             // 已经切换到了当前会话
	            if(self.current_conversation === key){
	                self.conversations[key].recent_time = item.ctime_ms;
	                self.conversations[key].unread_msg_count = 0;
	                self.conversations[key].msg_time = [];
	            }else{
	                self.conversations[key].unread_msg_count = self.conversations[key].unread_msg_count +1;
	                self.conversations[key].msg_time.push(item.ctime_ms);
	            }           
	        });
	        Util.StorageUtils.addItem(self.channel.conversations_key,JSON.stringify(self.conversations));
	        this._onMsgReceiveFn && this._onMsgReceiveFn(data); 
	}

	/**
	 * TODO  大版本更新的时候， 优化事件业务处理  ， 当前版本优化的话可能会引起老用户兼容性问题
	 * 事件通知
	 */
	JMessage.prototype.onEventNotification = function(fn) {
	    this._onEventNotificationFn = fn;
	};

	JMessage.prototype._onEventNotification = function(data){
	        var self = this;
	             // 多端在线未读数处理   
	       if(data.event_type === 200){
	          if(data.description.type === 3){
	              self._dealMutlReadEvent(data.description.type,data.ctime_ms,data.description.appkey,data.description.username);
	          }else{
	              self._dealMutlReadEvent(data.description.type,data.ctime_ms,data.description.gid);
	          }
	          return;
	    }
	        var userData = self.__eventDateFilter(data);
	        self._onEventNotificationFn && self._onEventNotificationFn(userData);
	        if (data.event_type === 1){ // type=1需要rec
	             var eventRecv={"event_id" : data.event_id,"event_type" : data.event_type,"from_uid" : data.from_uid, "gid" : data.gid};
	             new MsgBuilder(self.channel)
	                .setEvent(JConstant.EVENTS.EVENT_NOTIFICATION)
	                .setData(eventRecv)
	                .send();
	        }
	        if(JConstant.LOGIN_OUT_EVENT.indexOf(data.event_type)!=-1){
	            self.loginOut();
	        }  
	}


	/**
	 * 数据同步监听
	 */
	JMessage.prototype.onSyncConversation = function(fn) {
	    this._onSyncConversationFn = fn;
	};

	JMessage.prototype._onSyncConversation = function(data) {
	   var self = this;
	   self.channel.sync_key=data.sync_key;   
	   // 记录第一次 同步的时间，用于会话未读数计算  
	   if(!self.syncTime){
	      self.syncTime = new Date().getTime();
	   }   
	   if(data.messages){
	       
	       // 计算未读数
	       data.messages.forEach(function(item){

	           var unread_msg_count = 0;
	           var key;
	           if(item.msg_type === 3){ // 单聊
	               key = item.from_appkey + item.from_username;
	           }else{
	              key = item.from_gid;
	           }
	           var last_msg_time = item.msgs[item.msgs.length-1].ctime_ms;
	           if(self.current_conversation === key){ // 已经停留在当前会话
	               self.conversations[key] = (self.conversations[key] === undefined ? {} : self.conversations[key]);
	               self.conversations[key].unread_msg_count = unread_msg_count;
	               self.conversations[key].last_time = self.syncTime;
	               self.conversations[key].recent_time = last_msg_time;
	               self.conversations[key].msg_time = [];
	           }else if(!self.conversations[key] || !self.conversations[key].recent_time){ // 不存在 默认直接用 unsync_count
	               unread_msg_count = item.unsync_count;
	               self.conversations[key] = (self.conversations[key] === undefined ? {} : self.conversations[key]);
	               self.conversations[key].unread_msg_count = unread_msg_count;
	               self.conversations[key].last_time = self.syncTime;
	               self.conversations[key].msg_time = [];
	           }else{ 
	             
	              /**  根据 last_time 计算未读数
	                *  计算方法： msg.ctime_ms > last_time && 不是自己的消息， unread_msg_count++
	                *  自己发的消息， unread_msg_count = 0；
	                */
	              var recent_time = self.conversations[key].recent_time;
	              
	              item.msgs.forEach(function(it){
	                 if(it.ctime_ms <= recent_time || (it.content.from_appkey === self.current_appkey && it.content.from_id === self.current_user)){
	                    unread_msg_count = 0;
	                    self.conversations[key].msg_time = [];
	                }else{
	                    unread_msg_count++;
	                    self.conversations[key].msg_time.push(it.ctime_ms);
	                }
	              });

	               self.conversations[key].unread_msg_count = unread_msg_count;
	               self.conversations[key].last_time = self.syncTime;
	           
	           }
	          

	          self.lastMsgs[key] = {'last_msg_time': last_msg_time};
	          delete item.unsync_count;
	          item.unread_msg_count = unread_msg_count;

	       });
	       Util.StorageUtils.addItem(self.channel.conversations_key,JSON.stringify(self.conversations));
	       self._onSyncConversationFn && (data.messages.length > 0) && self._onSyncConversationFn(data.messages);  
	    }
	    var syncAck={'sync_key' : self.channel.sync_key};
	    new MsgBuilder(self.channel)
	          .setEvent(JConstant.EVENTS.SYNC_CONVERSATION_ACK)
	          .setData(syncAck)
	          .send(); 
	}

	/**
	 * 事件同步监听
	 */
	JMessage.prototype.onSyncEvent = function(fn) {
	    this._onSyncEventFn = fn;
	};

	JMessage.prototype._onSyncEvent = function(data){
	    var self = this;
	    self.channel.sync_event_key=data.sync_key;
	    var syncAck={'sync_key' : self.channel.sync_event_key};
	    new MsgBuilder(self.channel)
	        .setEvent(JConstant.EVENTS.SYNC_EVENT_ACK)
	        .setData(syncAck)
	        .send();  
	                
	    setTimeout(function(){ 
	            if(self._onSyncEventFn && data.events && (data.events.length>0)) {
	                var eventRecv = [];
	                data.events.forEach(function(item){
	                
	                     if(item.event_type === 200){
	                          if(item.description.type === 3){
	                              self._dealMutlReadEvent(item.description.type,item.ctime_ms,item.description.appkey,item.description.username);
	                           }else{
	                             self._dealMutlReadEvent(item.description.type,item.ctime_ms,item.description.gid);
	                           }
	                      }else{
	                           eventRecv.push(self.__eventDateFilter(item));
	                      }
	                 });

	               self._onSyncEventFn(eventRecv);
	            }  
	       }, 1700);
	  
	}

	/**
	 * msg receipt 同步监听
	 */
	JMessage.prototype.onSyncMsgReceipt = function(fn) {
	    this._onSyncMsgReceiptFn = fn;
	};

	JMessage.prototype._onSyncMsgReceipt =function(data){
	    var self = this;
	    self.channel.msg_receipt_key=data.sync_key;   
	    if(self._onSyncMsgReceiptFn && data.receipts && (data.receipts.length>0)) {
	        var tmp = {};
	        var results = []; // 合并之后的结果
	             
	        data.receipts.forEach(function(item){
	          var key = item.gid;
	          if(item.type === 3){
	              key= item.appkey+item.username;
	          }
	          if(tmp[key]){ // 已经存在会话 合并
	              var index = Number(tmp[key]);
	              Array.prototype.push.apply(results[index].receipt_msgs,item.receipt_msgs); // 合并
	          }else if(item.receipt_msgs.length > 0){
	              tmp[key] = String(results.length);
	              results.push(item);
	          }
	    });
	             
	    setTimeout(function(){
	        self._onSyncMsgReceiptFn && (results.length>0) && self._onSyncMsgReceiptFn(results);
	       }, 1500);
	    }  
	        // 客户端收到消息receipt同步后，需要给服务端ack
	    var syncAck={'sync_key' : self.channel.msg_receipt_key};
	    new MsgBuilder(self.channel)
	        .setEvent(JConstant.EVENTS.SYNC_RECEIPT_ACK)
	        .setData(syncAck)
	        .send(); 
	}

	/**
	 * msg receipt 在线更新已读数监听
	 */
	JMessage.prototype.onMsgReceiptChange = function(fn) {
	    this._onMsgReceiptChangeFn = fn;
	};

	JMessage.prototype._onMsgReceiptChange = function(data) {
	    this._onMsgReceiptChangeFn && this._onMsgReceiptChangeFn(data);
	};


	/**
	 * 用户信息更新事件
	 */
	JMessage.prototype.onUserInfUpdate = function(fn) {
	    this._updateInfoEventFun = fn;
	}


	/**
	 * 多端在线事件触发会话未读数更新事件
	 */
	JMessage.prototype.onMutiUnreadMsgUpdate = function(fn){
	    this._conversationUpdateFun = fn;
	}


	/**
	 * 消息透传通知
	 */
	JMessage.prototype.onTransMsgRec = function(fn) {
	    this._onTransMsgRecFn = fn;
	};

	JMessage.prototype._onTransMsgRec = function(data) {
	    this._onTransMsgRecFn && this._onTransMsgRecFn(data);
	};


	/**
	 * socket异常断开,需要用户设置监听处理函数
	 */
	JMessage.prototype.onDisconnect = function(fn) {
	    this._onDisconnectFn = fn;
	};

	JMessage.prototype._onDisconnect = function() {
	    var self = this;
	    clearTimeout(self.syncTask); //清除消息同步定时任务
	    clearTimeout(self.msgReceipTask);
	    if(self.autoDiscon ){
	        self.current_appkey =null;
	        self.current_user = null;
	        self._onDisconnectFn && self._onDisconnectFn();
	    }
	};

	/*********************私有方法*************************/

	/**
	 * event type =200 ，计算未读数
	 * key 会话key gid || appkey+username
	 */
	JMessage.prototype._dealMutlReadEvent = function(type,theTime,gidorappkey,username){
	    var self =this;
	    var key;
	    var json={};
	    json.type = type;
	    if(type === 3){
	        key = gidorappkey+username;
	        json.username = username;
	        json.appkey = gidorappkey;
	    }else{
	        key = gidorappkey;
	        json.gid = gidorappkey;
	    }
	    self.conversations[key] = (self.conversations[key] === undefined ? {'msg_time':[],'unread_msg_count':0} : self.conversations[key]);
	    self.conversations[key].recent_time = theTime;
	    // 已经是当前会话
	    if(self.current_conversation === key){
	        self.conversations[key].unread_msg_count = 0;
	        self.conversations[key].msg_time = [];
	    }else{
	        var oldCount = self.conversations[key].unread_msg_count;
	        var msg_time = self.conversations[key].msg_time;
	        var newTime = [];
	        var newCount = 0;
	        msg_time.forEach(function(item){
	            if(msg_time > item){
	                newCount++;
	                newTime.push(item);
	            }
	        });
	        self.conversations[key].msg_time = newTime;
	        if(newCount < oldCount){
	            self.conversations[key].unread_msg_count = newCount;
	            json.unreadCount = newCount;
	            Util.StorageUtils.addItem(self.channel.conversations_key,JSON.stringify(self.conversations));
	            self._conversationUpdateFun && self._conversationUpdateFun(json);

	        }
	    }
	}


	/**
	 *  消息回执定时任务 task
	 */
	JMessage.prototype._receiptReport = function(){
	    var self = this;
	    var reports = JSON.parse(Util.StorageUtils.getItem(self.channel.report_key));
	   
	    if(reports.reports.length > 0){
	        var tmp = {};
	        var results = []; // 合并之后的结果
	        reports.reports.forEach(function(item){
	            if(tmp[item.key]){ // 已经存在会话 合并
	                var index = Number(tmp[item.key]);
	                Array.prototype.push.apply(results[index].msg_ids,item.msg_ids); // 合并
	            }else{
	                tmp[item.key] = String(results.length);
	                results.push(item);
	            }
	        });

	        for(var i=0;i<results.length;i++){
	           results[i].msg_ids = Util.ArrayUtils.delRepeatItem(results[i].msg_ids);
	           delete results[i].key;
	        }
	        new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.RECEIPT_REPORT)
	        .setData({'sessions':results})
	        .send();

	        Util.StorageUtils.addItem(self.channel.report_key,JSON.stringify({'reports':[]}));
	    }
	};


	JMessage.prototype.__eventDateFilter = function(item) {
	    var userData = {};
	        userData.event_id = item.event_id;
	        userData.event_type = item.event_type;
	        userData.from_username = item.from_username;
	        userData.gid = item.gid;
	        userData.to_usernames = item.to_usernames;
	        //@Deprecated 2.3.1
	        userData.ctime = item.ctime;
	        userData.extra = item.extra;
	        userData.return_code = item.return_code;
	        userData.from_appkey =item.from_appkey; 
	        userData.msg_ids = item.msg_ids; 
	        userData.from_gid = item.from_gid;
	        userData.msgid_list = item.msgid_list;
	        userData.to_groups = item.to_groups;
	        userData.new_owner = item.new_owner; //新群主
	        userData.group_name = item.group_name;
	        userData.ctime_ms = item.ctime_ms;
	        userData.media_id = item.media_id;
	        userData.from_nickname = item.from_nickname;

	        if(item.event_type === 100 && item.extra === 7){ // 好友更新
	             userData.description = JSON.parse(item.description); 
	         }else{
	             userData.description = item.description; 
	         }

	        if(item.event_type === 55 && item.from_gid === 0){ // 消息撤回事件 && 单聊
	            userData.type = 0; // 单聊
	        }else if(item.event_type === 55 && item.from_gid != 0){ // 消息撤回事件 && 群聊
	            userData.type = 1; // 群聊
	        }
	       return userData; 
	};

	JMessage.prototype.__checkConnect = function() {
	    if (!this.channel.client.connected) {
	        throw new Error('wss socket not connect')
	    }
	};


	JMessage.prototype.__checkInit = function() {
	    if (!this.current_appkey) {
	        throw new Error('must init first')
	    }
	};

	JMessage.prototype.__checkLogin = function() {
	    if (!this.current_user) {
	        throw new Error('must login first');
	    }
	};

	JMessage.prototype.__getUploadToken = function() {
	    this.__checkLogin();
	    return new MsgBuilder(this.channel)
	        .setEvent(JConstant.EVENTS.GET_UPLOAD_TOKEN)
	        .setData({})
	        .send();
	};

	JMessage.prototype.__uploadFile0 = function(args, callback) {
	    var self = this;
	    var xhr = new XMLHttpRequest();
	    xhr.open('POST', self.opts.upload_file + '?type=' + args.type);
	    xhr.setRequestHeader('X-App-Key', args.appkey);
	    xhr.setRequestHeader('jm-channel', JConstant.PLAT_CHANNEL);
	    xhr.setRequestHeader('Authorization', 'Basic ' + Base64.btoa(args.username + ':' + args.token));
	    xhr.onreadystatechange = function() {
	        if(this.readyState === 4) {
	            if (this.status === 200) {
	                var content = JSON.parse(this.responseText);
	                callback(null, content);
	            } else {
	                try {
	                   var error = JSON.parse(this.responseText);
	                   if(error.error.code === 898061){
	                      callback({"code":880210,"message":"file size exceed the limit"});
	                   }else {
	                      callback(error);
	                   }
	                  } catch (err) {
	                    callback({"code":880210,"message":"file size exceed the limit"});
	                  }
	            }
	        }
	    };
	    xhr.send(args.file);
	};

	JMessage.prototype.__uploadFile = function(args, callback) {
	    var self = this;
	    Thenjs(function(cont) {
	        self.__getUploadToken()
	            .onSuccess(function(data) {
	                cont(null, data.uptoken);
	            }).onFail(function(data) {
	                cont(data)
	            }).onTimeout(function(data) {
	                callback({
	                    is_timeout : true,
	                    data : data
	                });
	            });
	    }).then(function(cont, token) {
	        self.__uploadFile0({
	            type : args.type,
	            file : args.file,
	            appkey : args.appkey,
	            username : args.username,
	            token : token
	        }, cont);
	    }).then(function(cont, content) {
	        callback(null, content);
	    }).fail(function(cont, err) {
	        callback({data:err});
	    });
	};

	JMessage.prototype.__sendMsg = function(args) {
	    this.__checkLogin();
	    var self = this;
	    return new MsgBuilder(this.channel)
	        .setEvent('single' === args.type ? JConstant.EVENTS.S_SINGLE_TEXT : JConstant.EVENTS.SEND_GROUP_MSG)
	        .setData(new MsgContentBuilder(this.current_user, this.current_appkey)
	            .setType(args.type)
	            .setAppkey(args.appkey)
	            .setNeadReceipt(args.nead_receipt)
	            .setTarget(args.target_id, args.target_name)
	            .setText(args.content ? args.content : args.msg_body.text,args.content ? args.extras : args.msg_body.extras)
	            .setAtList(args.at_list)
	            .setNoOffline(args.no_offline === true ? true : false)
	            .setNoNotification(args.no_notification === true ? true : false)
	            .setCustomNotification(args.custom_notification)
	            .build()).send();
	};

	JMessage.prototype.__sendPic = function(args) {
	    this.__checkLogin();
	    var builder = new MsgBuilder(this.channel)
	        .setEvent('single' === args.type ? JConstant.EVENTS.S_SINGLE_TEXT : JConstant.EVENTS.SEND_GROUP_MSG);

	    var self = this;
	    var msgContent = new MsgContentBuilder(self.current_user, self.current_appkey).setType(args.type)
	                 .setAppkey(args.appkey)
	                 .setNeadReceipt(args.nead_receipt)
	                 .setTarget(args.target_id, args.target_name)
	                 .setNoOffline(args.no_offline === true ? true : false)
	                 .setNoNotification(args.no_notification === true ? true : false)
	                 .setCustomNotification(args.custom_notification);
	    
	   if(args.file){
	      this.__uploadFile({
	          appkey : self.current_appkey,
	          username : self.current_user,
	          file : args.file,
	          type : 'image'
	       }, function(err, content) {
	          if (err) {
	              if (err.is_timeout) return builder.timeout && builder.timeout(err.data);;
	              return builder.fail && builder.fail(err.data);
	            }
	          builder.setData(msgContent.setImage(content, args.extras).build()).send();
	         });
	   }else{ 
	       builder.setData(msgContent.setImage(args.msg_body, args.msg_body.extras).build()).send();
	   }
	   return builder;
	};


	JMessage.prototype.__sendFile = function (args) {
	    this.__checkLogin();
	    var builder = new MsgBuilder(this.channel)
	        .setEvent('single' === args.type ? JConstant.EVENTS.S_SINGLE_TEXT : JConstant.EVENTS.SEND_GROUP_MSG);
	    var self = this;
	    var msgContent = new MsgContentBuilder(self.current_user, self.current_appkey).setType(args.type)
	                .setAppkey(args.appkey)
	                .setNeadReceipt(args.nead_receipt)
	                .setTarget(args.target_id, args.target_name)
	                .setNoOffline(args.no_offline === true ? true : false)
	                .setNoNotification(args.no_notification === true ? true : false)
	                .setCustomNotification(args.custom_notification);

	   if(args.file){
	       this.__uploadFile({
	           appkey : self.current_appkey,
	           username : self.current_user,
	           file : args.file,
	           type : 'file'
	        }, function(err, content) {
	           if (err) {
	               if (err.is_timeout) return builder.timeout && builder.timeout(err.data);
	               return builder.fail && builder.fail(err.data);
	           }
	            builder.setData(msgContent.setFile(content, args.extras).build()).send();
	       });
	    }else{
	       builder.setData(msgContent.setFile(args.msg_body, args.msg_body.extras).build()).send();
	    }
	    return builder;
	};

	JMessage.prototype.__sendLocation = function(args) {
	    this.__checkLogin();
	    var self = this;
	    return new MsgBuilder(this.channel)
	        .setEvent('single' === args.type ? JConstant.EVENTS.S_SINGLE_TEXT : JConstant.EVENTS.SEND_GROUP_MSG)
	        .setData(new MsgContentBuilder(this.current_user, this.current_appkey)
	            .setType(args.type)
	            .setAppkey(args.appkey)
	            .setNeadReceipt(args.nead_receipt)
	            .setTarget(args.target_id, args.target_name)
	            .setLocation(args.latitude ? args : args.msg_body,args.latitude ? args.extras : args.msg_body.extras)
	            .setNoOffline(args.no_offline === true ? true : false)
	            .setNoNotification(args.no_notification === true ? true : false)
	            .setCustomNotification(args.custom_notification)
	            .build()).send();
	};


	JMessage.prototype.__sendCustom = function(args) {
	    this.__checkLogin();
	    var self = this;
	    return new MsgBuilder(this.channel)
	        .setEvent('single' === args.type ? JConstant.EVENTS.S_SINGLE_TEXT : JConstant.EVENTS.SEND_GROUP_MSG)
	        .setData(new MsgContentBuilder(this.current_user, this.current_appkey)
	            .setType(args.type)
	            .setAppkey(args.appkey)
	            .setNeadReceipt(args.nead_receipt)
	            .setTarget(args.target_id, args.target_name)
	            .setCustom(args.custom ? args.custom : args.msg_body,args.custom ? args.extras : args.msg_body.extras)
	            .setNoOffline(args.no_offline === true ? true : false)
	            .setNoNotification(args.no_notification === true ? true : false)
	            .setCustomNotification(args.custom_notification)
	            .build()).send();
	};


	module.exports = JMessage;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(setImmediate) {// **Github:** https://github.com/teambition/then.js
	//
	// **License:** MIT

	/* global module, define, setImmediate, console */
	;(function (root, factory) {
	  'use strict'

	  if (typeof module === 'object' && typeof module.exports === 'object') {
	    module.exports = factory()
	  } else if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	  } else {
	    root.Thenjs = factory()
	  }
	}(typeof window === 'object' ? window : this, function () {
	  'use strict'

	  var maxTickDepth = 100
	  var toString = Object.prototype.toString
	  var hasOwnProperty = Object.prototype.hasOwnProperty
	  var nextTick = typeof setImmediate === 'function' ? setImmediate : function (fn) {
	    setTimeout(fn, 0)
	  }
	  var isArray = Array.isArray || function (obj) {
	    return toString.call(obj) === '[object Array]'
	  }

	  // 将 `arguments` 转成数组，效率比 `[].slice.call` 高很多
	  function slice (args, start) {
	    start = start || 0
	    if (start >= args.length) return []
	    var len = args.length
	    var ret = Array(len - start)
	    while (len-- > start) ret[len - start] = args[len]
	    return ret
	  }

	  function map (array, iterator) {
	    var res = []
	    for (var i = 0, len = array.length; i < len; i++) res.push(iterator(array[i], i, array))
	    return res
	  }

	  // 同步执行函数，同时捕捉异常
	  function carry (errorHandler, fn) {
	    try {
	      fn.apply(null, slice(arguments, 2))
	    } catch (error) {
	      errorHandler(error)
	    }
	  }

	  // 异步执行函数，同时捕捉异常
	  function defer (errorHandler, fn) {
	    var args = arguments
	    nextTick(function () {
	      carry.apply(null, args)
	    })
	  }

	  function toThunk (object) {
	    if (object == null) return object
	    if (typeof object.toThunk === 'function') return object.toThunk()
	    if (typeof object.then === 'function') {
	      return function (callback) {
	        object.then(function (res) {
	          callback(null, res)
	        }, callback)
	      }
	    } else return object
	  }

	  function arrayToTasks (array, iterator) {
	    return map(array, function (value, index, list) {
	      return function (done) {
	        iterator(done, value, index, list)
	      }
	    })
	  }

	  // ## **Thenjs** 主函数
	  function Thenjs (start, debug) {
	    var self = this
	    var cont
	    if (start instanceof Thenjs) return start
	    if (!(self instanceof Thenjs)) return new Thenjs(start, debug)
	    self._chain = 0
	    self._success = self._parallel = self._series = null
	    self._finally = self._error = self._result = self._nextThen = null
	    if (!arguments.length) return self

	    cont = genContinuation(self, debug)
	    start = toThunk(start)
	    if (start === void 0) cont()
	    else if (typeof start === 'function') defer(cont, start, cont)
	    else cont(null, start)
	  }

	  Thenjs.defer = defer

	  Thenjs.parallel = function (tasks, debug) {
	    return new Thenjs(function (cont) {
	      carry(cont, parallel, cont, tasks)
	    }, debug)
	  }

	  Thenjs.series = function (tasks, debug) {
	    return new Thenjs(function (cont) {
	      carry(cont, series, cont, tasks)
	    }, debug)
	  }

	  Thenjs.each = function (array, iterator, debug) {
	    return new Thenjs(function (cont) {
	      carry(cont, parallel, cont, arrayToTasks(array, iterator))
	    }, debug)
	  }

	  Thenjs.eachSeries = function (array, iterator, debug) {
	    return new Thenjs(function (cont) {
	      carry(cont, series, cont, arrayToTasks(array, iterator))
	    }, debug)
	  }

	  Thenjs.parallelLimit = function (tasks, limit, debug) {
	    return new Thenjs(function (cont) {
	      parallelLimit(cont, tasks, limit)
	    }, debug)
	  }

	  Thenjs.eachLimit = function (array, iterator, limit, debug) {
	    return new Thenjs(function (cont) {
	      parallelLimit(cont, arrayToTasks(array, iterator), limit)
	    }, debug)
	  }

	  Thenjs.nextTick = function (fn) {
	    var args = slice(arguments, 1)
	    nextTick(function () {
	      fn.apply(null, args)
	    })
	  }

	  // 全局 error 监听
	  Thenjs.onerror = function (error) {
	    console.error('Thenjs caught error: ', error)
	    throw error
	  }

	  var proto = Thenjs.prototype
	  // **Thenjs** 对象上的 **finally** 方法
	  proto.fin = proto['finally'] = function (finallyHandler) {
	    return thenFactory(function (cont, self) {
	      self._finally = wrapTaskHandler(cont, finallyHandler)
	    }, this)
	  }

	  // **Thenjs** 对象上的 **then** 方法
	  proto.then = function (successHandler, errorHandler) {
	    return thenFactory(function (cont, self) {
	      if (successHandler) self._success = wrapTaskHandler(cont, successHandler)
	      if (errorHandler) self._error = wrapTaskHandler(cont, errorHandler)
	    }, this)
	  }

	  // **Thenjs** 对象上的 **fail** 方法
	  proto.fail = proto['catch'] = function (errorHandler) {
	    return thenFactory(function (cont, self) {
	      self._error = wrapTaskHandler(cont, errorHandler)
	      // 对于链上的 fail 方法，如果无 error ，则穿透该链，将结果输入下一链
	      self._success = function () {
	        var args = slice(arguments)
	        args.unshift(null)
	        cont.apply(null, args)
	      }
	    }, this)
	  }

	  // **Thenjs** 对象上的 **parallel** 方法
	  proto.parallel = function (tasks) {
	    return thenFactory(function (cont, self) {
	      self._parallel = function (_tasks) {
	        parallel(cont, tasks || _tasks)
	      }
	    }, this)
	  }

	  // **Thenjs** 对象上的 **series** 方法
	  proto.series = function (tasks) {
	    return thenFactory(function (cont, self) {
	      self._series = function (_tasks) {
	        series(cont, tasks || _tasks)
	      }
	    }, this)
	  }

	  // **Thenjs** 对象上的 **each** 方法
	  proto.each = function (array, iterator) {
	    return thenFactory(function (cont, self) {
	      self._parallel = function (_array, _iterator) {
	        // 优先使用定义的参数，如果没有定义参数，则从上一链结果从获取
	        // `_array`, `_iterator` 来自于上一链的 **cont**，下同
	        parallel(cont, arrayToTasks(array || _array, iterator || _iterator))
	      }
	    }, this)
	  }

	  // **Thenjs** 对象上的 **eachSeries** 方法
	  proto.eachSeries = function (array, iterator) {
	    return thenFactory(function (cont, self) {
	      self._series = function (_array, _iterator) {
	        series(cont, arrayToTasks(array || _array, iterator || _iterator))
	      }
	    }, this)
	  }

	  // **Thenjs** 对象上的 **parallelLimit** 方法
	  proto.parallelLimit = function (tasks, limit) {
	    return thenFactory(function (cont, self) {
	      self._parallel = function (_tasks) {
	        parallelLimit(cont, tasks || _tasks, limit)
	      }
	    }, this)
	  }

	  // **Thenjs** 对象上的 **eachLimit** 方法
	  proto.eachLimit = function (array, iterator, limit) {
	    return thenFactory(function (cont, self) {
	      self._series = function (_array, _iterator) {
	        parallelLimit(cont, arrayToTasks(array || _array, iterator || _iterator), limit)
	      }
	    }, this)
	  }

	  // **Thenjs** 对象上的 **toThunk** 方法
	  proto.toThunk = function () {
	    var self = this
	    return function (callback) {
	      if (self._result) {
	        callback.apply(null, self._result)
	        self._result = false
	      } else if (self._result !== false) {
	        self._finally = self._error = callback
	      }
	    }
	  }

	  // util.inspect() implementation
	  proto.inspect = function () {
	    var obj = {}
	    for (var key in this) {
	      if (!hasOwnProperty.call(this, key)) continue
	      obj[key] = key === '_nextThen' ? (this[key] && this[key]._chain) : this[key]
	    }
	    return obj
	  }

	  // 核心 **continuation** 方法
	  // **continuation** 收集任务结果，触发下一个链，它被注入各个 handler
	  // 其参数采用 **node.js** 的 **callback** 形式：(error, arg1, arg2, ...)
	  function continuation () {
	    var self = this
	    var args = slice(arguments)

	    // then链上的结果已经处理，若重复执行 cont 则直接跳过；
	    if (self._result === false) return
	    // 第一次进入 continuation，若为 debug 模式则执行，对于同一结果保证 debug 只执行一次；
	    if (!self._result && self._chain) {
	      self.debug.apply(self, ['\nChain ' + self._chain + ': '].concat(slice(args)))
	    }
	    // 标记已进入 continuation 处理
	    self._result = false

	    carry(function (err) {
	      if (err === args[0]) continuationError(self, err)
	      else continuation.call(self._nextThen, err)
	    }, continuationExec, self, args)
	  }

	  function continuationExec (ctx, args) {
	    if (args[0] == null) args[0] = null
	    else {
	      args = [args[0]]
	      if (!ctx._finally) throw args[0]
	    }
	    if (ctx._finally) return ctx._finally.apply(null, args)
	    var success = ctx._success || ctx._parallel || ctx._series
	    if (success) return success.apply(null, slice(args, 1))
	    // 对于正确结果，**Thenjs** 链上没有相应 handler 处理，则在 **Thenjs** 链上保存结果，等待下一次处理。
	    ctx._result = args
	  }

	  function continuationError (ctx, err) {
	    var _nextThen = ctx
	    var errorHandler = ctx._error || ctx._finally

	    // 获取后链的 error handler
	    while (!errorHandler && _nextThen._nextThen) {
	      _nextThen = _nextThen._nextThen
	      errorHandler = _nextThen._error || _nextThen._finally
	    }

	    if (errorHandler) {
	      return carry(function (_err) {
	        // errorHandler 存在则 _nextThen._nextThen 必然存在
	        continuation.call(_nextThen._nextThen, _err)
	      }, errorHandler, err)
	    }
	    // 如果定义了全局 **onerror**，则用它处理
	    if (Thenjs.onerror) return Thenjs.onerror(err)
	    // 对于 error，如果没有任何 handler 处理，则保存到链上最后一个 **Thenjs** 对象，等待下一次处理。
	    while (_nextThen._nextThen) _nextThen = _nextThen._nextThen
	    _nextThen._result = [err]
	  }

	  function genContinuation (ctx, debug) {
	    function cont () {
	      return continuation.apply(ctx, arguments)
	    }
	    // 标记 cont，cont 作为 handler 时不会被注入 cont，见 `wrapTaskHandler`
	    cont._isCont = true
	    // 设置并开启 debug 模式
	    if (debug) {
	      proto.debug = typeof debug === 'function' ? debug : defaultDebug
	      ctx._chain = 1
	    }
	    return cont
	  }

	  // 注入 cont，执行 fn，并返回新的 **Thenjs** 对象
	  function thenFactory (fn, ctx, debug) {
	    var nextThen = new Thenjs()
	    var cont = genContinuation(nextThen, debug)

	    // 注入 cont，初始化 handler
	    fn(cont, ctx)
	    if (!ctx) return nextThen
	    ctx._nextThen = nextThen
	    if (ctx._chain) nextThen._chain = ctx._chain + 1
	    // 检查上一链的结果是否处理，未处理则处理，用于续接 **Thenjs** 链
	    if (ctx._result) {
	      nextTick(function () {
	        continuation.apply(ctx, ctx._result)
	      })
	    }
	    return nextThen
	  }

	  // 封装 handler，`_isCont` 判定 handler 是不是 `cont` ，不是则将 `cont` 注入成第一个参数
	  function wrapTaskHandler (cont, handler) {
	    return handler._isCont ? handler : function () {
	      var args = slice(arguments)
	      args.unshift(cont)
	      handler.apply(null, args)
	    }
	  }

	  // ## **parallel** 函数
	  // 并行执行一组 `task` 任务，`cont` 处理最后结果
	  function parallel (cont, tasks) {
	    if (!isArray(tasks)) return cont(errorify(tasks, 'parallel'))
	    var pending = tasks.length
	    var result = []

	    if (pending <= 0) return cont(null, result)
	    for (var i = 0, len = pending; i < len; i++) tasks[i](genNext(i))

	    function genNext (index) {
	      function next (error, value) {
	        if (pending <= 0) return
	        if (error != null) {
	          pending = 0
	          cont(error)
	        } else {
	          result[index] = value
	          return !--pending && cont(null, result)
	        }
	      }
	      next._isCont = true
	      return next
	    }
	  }

	  // ## **series** 函数
	  // 串行执行一组 `array` 任务，`cont` 处理最后结果
	  function series (cont, tasks) {
	    if (!isArray(tasks)) return cont(errorify(tasks, 'series'))
	    var i = 0
	    var end = tasks.length - 1
	    var run
	    var result = []
	    var stack = maxTickDepth

	    if (end < 0) return cont(null, result)
	    next._isCont = true
	    tasks[0](next)

	    function next (error, value) {
	      if (error != null) return cont(error)
	      result[i] = value
	      if (++i > end) return cont(null, result)
	      // 先同步执行，嵌套达到 maxTickDepth 时转成一次异步执行
	      run = --stack > 0 ? carry : (stack = maxTickDepth, defer)
	      run(cont, tasks[i], next)
	    }
	  }

	  function parallelLimit (cont, tasks, limit) {
	    var index = 0
	    var pending = 0
	    var len = tasks.length
	    var queue = []
	    var finished = false

	    limit = limit >= 1 ? Math.floor(limit) : Number.MAX_VALUE
	    // eslint-disable-next-line
	    do { checkNext() } while (index < len && pending < limit)

	    function checkNext () {
	      if (finished) return
	      if (index >= len) {
	        finished = true
	        return parallel(cont, queue)
	      }
	      if (pending >= limit) return
	      pending++
	      queue.push(evalTask())
	    }

	    function evalTask () {
	      return new Thenjs(tasks[index++]).fin(function (next, err, res) {
	        if (err != null) {
	          finished = true
	          return cont(err)
	        }
	        pending--
	        checkNext()
	        next(null, res)
	      }).toThunk()
	    }
	  }

	  // 默认的 `debug` 方法
	  function defaultDebug () {
	    console.log.apply(console, arguments)
	  }

	  // 参数不合法时生成相应的错误
	  function errorify (obj, method) {
	    return new Error('The argument ' + (obj && obj.toString()) + ' in "' + method + '" is not Array!')
	  }

	  Thenjs.NAME = 'Thenjs'
	  Thenjs.VERSION = '2.0.3'
	  return Thenjs
	}))

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).setImmediate))

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(4).nextTick;
	var apply = Function.prototype.apply;
	var slice = Array.prototype.slice;
	var immediateIds = {};
	var nextImmediateId = 0;

	// DOM APIs, for completeness

	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) { timeout.close(); };

	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(window, this._id);
	};

	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};

	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};

	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);

	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};

	// That's not how node.js implements it but the exposed api is the same.
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
	  var id = nextImmediateId++;
	  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

	  immediateIds[id] = true;

	  nextTick(function onNextTick() {
	    if (immediateIds[id]) {
	      // fn.call() is faster so we optimize for the common use-case
	      // @see http://jsperf.com/call-apply-segu
	      if (args) {
	        fn.apply(null, args);
	      } else {
	        fn.call(null);
	      }
	      // Prevent ids from leaking
	      exports.clearImmediate(id);
	    }
	  });

	  return id;
	};

	exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
	  delete immediateIds[id];
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).setImmediate, __webpack_require__(3).clearImmediate))

/***/ },
/* 4 */
/***/ function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};

	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.

	var cachedSetTimeout;
	var cachedClearTimeout;

	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	;(function () {

	  var object =  true ? exports : self; // #8: web workers
	  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

	  function InvalidCharacterError(message) {
	    this.message = message;
	  }
	  InvalidCharacterError.prototype = new Error;
	  InvalidCharacterError.prototype.name = 'InvalidCharacterError';

	  // encoder
	  // [https://gist.github.com/999166] by [https://github.com/nignag]
	  object.btoa || (
	  object.btoa = function (input) {
	    var str = String(input);
	    for (
	      // initialize result and counter
	      var block, charCode, idx = 0, map = chars, output = '';
	      // if the next str index does not exist:
	      //   change the mapping table to "="
	      //   check if d has no fractional digits
	      str.charAt(idx | 0) || (map = '=', idx % 1);
	      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
	      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
	    ) {
	      charCode = str.charCodeAt(idx += 3/4);
	      if (charCode > 0xFF) {
	        throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
	      }
	      block = block << 8 | charCode;
	    }
	    return output;
	  });

	  // decoder
	  // [https://gist.github.com/1020396] by [https://github.com/atk]
	  object.atob || (
	  object.atob = function (input) {
	    var str = String(input).replace(/=+$/, '');
	    if (str.length % 4 == 1) {
	      throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
	    }
	    for (
	      // initialize result and counters
	      var bc = 0, bs, buffer, idx = 0, output = '';
	      // get next character
	      buffer = str.charAt(idx++);
	      // character found in table? initialize bit storage and add its ascii value;
	      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
	        // and if not first of each 4 characters,
	        // convert the first 8 bits to one ascii character
	        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
	    ) {
	      // try to find character in table (0-63, not found => -1)
	      buffer = chars.indexOf(buffer);
	    }
	    return output;
	  });

	}());


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var Emitter = __webpack_require__(7);
	var io = __webpack_require__(8);
	var JConstant = __webpack_require__(59);

	var Channel = function(opt) {
	    this.init(opt);
	};


	Channel.prototype.init = function(opts) {
	    this.opts = opts;
	    // 消息缓存,会暂存在dataCache里，再收到resp后消息
	    this.dataCache = {};
	    // 完全存储在内容中的临时数据，关闭浏览器后消失
	    this.memStore = {};

	    this.sync_key=0;
	    this.sync_type=0;
	    
	    // 初始化WS
	    this.client = io(this.opts['address'], {
	        'transports': ['websocket', 'polling']
	    });

	    // handler all event to *
	    var self = this;
	    var emit = Emitter.prototype.emit;
	    var onevent = this.client.onevent;
	    this.client.onevent = function(packet) {
	        var args = packet.data || [];
	        onevent.call(self.client, packet);
	        emit.apply(self.client, ['*'].concat(args));
	    };
	    this.client.on('*', function(data, event) {
	        self.onReceive(data, event);
	    });
	};

	Channel.prototype.onReceive = function(event, data) {
	    this.opts.debug && console.info('---<- event:%s, data:%s', event, JSON.stringify(data));

	    if (event === JConstant.EVENTS.EVENT_NOTIFICATION || event === JConstant.EVENTS.MSG_SYNC || event === JConstant.EVENTS.SYNC_CONVERSATION || event === JConstant.EVENTS.SYNC_EVENT || event === JConstant.EVENTS.SYNC_RECEIPT || event === JConstant.EVENTS.RECEIPT_CHANGE){
	        // ignore
	        return;
	    }

	    var msg = this.dataCache[data.rid];
	    delete data['rid'];
	    if (msg) {
	       
	        //获取用户uid-mtime用来用户信息更新事件监听，会话列表，群成员，好友
	        if(data.code === 0 && event === JConstant.EVENTS.GET_GROUP_MEMBERS){
	             data.member_list.forEach(function(item){
	                  msg.userInfoGet && msg.userInfoGet(item.uid,item.mtime);
	                  delete item.uid;
	                  delete item.mtime
	             });
	        }else if(data.code === 0 && event === JConstant.EVENTS.GET_FRIEND_LIST){
	             data.friend_list.forEach(function(item){
	                  msg.userInfoGet && msg.userInfoGet(item.uid,item.mtime*1000);
	                  delete item.uid;
	             });
	        }else if(data.code === 0 && event === JConstant.EVENTS.GET_BLACK_LIST){
	             data.black_list.forEach(function(item){
	                  delete item.uid;
	             });
	        }else if(data.code === 0 && event === JConstant.EVENTS.GET_ACROSS_USER_INFO){
	             delete data.user_info.uid;
	        }


	        if (event === JConstant.EVENTS.ACK) {
	            msg.ack && msg.ack({rid: data.rid, data: msg.data});
	            msg.cleanAckTimeout();
	        } else {
	            if (data.code && data.code !== 0) {
	                msg.fail && msg.fail(data);
	            } else if(event != JConstant.EVENTS.S_SINGLE_TEXT_ && event != JConstant.EVENTS.SEND_GROUP_MSG){
	                if(msg.hook){ // sdk 层函数,先内部处理，在回调外部 success 函数
	                    msg.hook(data,msg.success);
	                }else{
	                   msg.success && msg.success(data);
	                }
	            }else{
	                //消息发送类接口success回调函数增加一个参数，获取发送内容
	                msg.data.msg_id=data.msg_id;
	                msg.success && msg.success(data,msg.data);
	                msg.innerCall && msg.innerCall(data.msg_id);
	            }
	            msg.cleanRespTimeout();
	            delete this.dataCache[msg.rid];
	        }
	    }
	};



	Channel.prototype.generateRid = function() {
	    var rid = Math.floor(Math.random() * (1 - 2147483647) + 2147483647);
	    while (this.dataCache[rid]) {
	        rid = Math.floor(Math.random() * (1 - 2147483647) + 2147483647);
	    }
	    return rid;
	};

	Channel.prototype.send = function(event, data) {
	    this.opts.debug && console.info('--->- event:%s, data:%s', event, JSON.stringify(data));
	    this.client.emit(event, data);
	};

	module.exports = Channel;







/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Expose `Emitter`.
	 */

	if (true) {
	  module.exports = Emitter;
	}

	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */

	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};

	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */

	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}

	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
	    .push(fn);
	  return this;
	};

	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.once = function(event, fn){
	  function on() {
	    this.off(event, on);
	    fn.apply(this, arguments);
	  }

	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};

	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};

	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }

	  // specific event
	  var callbacks = this._callbacks['$' + event];
	  if (!callbacks) return this;

	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks['$' + event];
	    return this;
	  }

	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};

	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */

	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks['$' + event];

	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }

	  return this;
	};

	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */

	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks['$' + event] || [];
	};

	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */

	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var url = __webpack_require__(9);
	var parser = __webpack_require__(14);
	var Manager = __webpack_require__(25);
	var debug = __webpack_require__(11)('socket.io-client');

	/**
	 * Module exports.
	 */

	module.exports = exports = lookup;

	/**
	 * Managers cache.
	 */

	var cache = exports.managers = {};

	/**
	 * Looks up an existing `Manager` for multiplexing.
	 * If the user summons:
	 *
	 *   `io('http://localhost/a');`
	 *   `io('http://localhost/b');`
	 *
	 * We reuse the existing instance based on same scheme/port/host,
	 * and we initialize sockets for each namespace.
	 *
	 * @api public
	 */

	function lookup (uri, opts) {
	  if (typeof uri === 'object') {
	    opts = uri;
	    uri = undefined;
	  }

	  opts = opts || {};

	  var parsed = url(uri);
	  var source = parsed.source;
	  var id = parsed.id;
	  var path = parsed.path;
	  var sameNamespace = cache[id] && path in cache[id].nsps;
	  var newConnection = opts.forceNew || opts['force new connection'] ||
	                      false === opts.multiplex || sameNamespace;

	  var io;

	  if (newConnection) {
	    debug('ignoring socket cache for %s', source);
	    io = Manager(source, opts);
	  } else {
	    if (!cache[id]) {
	      debug('new io instance for %s', source);
	      cache[id] = Manager(source, opts);
	    }
	    io = cache[id];
	  }
	  if (parsed.query && !opts.query) {
	    opts.query = parsed.query;
	  } else if (opts && 'object' === typeof opts.query) {
	    opts.query = encodeQueryString(opts.query);
	  }
	  return io.socket(parsed.path, opts);
	}
	/**
	 *  Helper method to parse query objects to string.
	 * @param {object} query
	 * @returns {string}
	 */
	function encodeQueryString (obj) {
	  var str = [];
	  for (var p in obj) {
	    if (obj.hasOwnProperty(p)) {
	      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
	    }
	  }
	  return str.join('&');
	}
	/**
	 * Protocol version.
	 *
	 * @api public
	 */

	exports.protocol = parser.protocol;

	/**
	 * `connect`.
	 *
	 * @param {String} uri
	 * @api public
	 */

	exports.connect = lookup;

	/**
	 * Expose constructors for standalone build.
	 *
	 * @api public
	 */

	exports.Manager = __webpack_require__(25);
	exports.Socket = __webpack_require__(54);


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {
	/**
	 * Module dependencies.
	 */

	var parseuri = __webpack_require__(10);
	var debug = __webpack_require__(11)('socket.io-client:url');

	/**
	 * Module exports.
	 */

	module.exports = url;

	/**
	 * URL parser.
	 *
	 * @param {String} url
	 * @param {Object} An object meant to mimic window.location.
	 *                 Defaults to window.location.
	 * @api public
	 */

	function url (uri, loc) {
	  var obj = uri;

	  // default to window.location
	  loc = loc || global.location;
	  if (null == uri) uri = loc.protocol + '//' + loc.host;

	  // relative path support
	  if ('string' === typeof uri) {
	    if ('/' === uri.charAt(0)) {
	      if ('/' === uri.charAt(1)) {
	        uri = loc.protocol + uri;
	      } else {
	        uri = loc.host + uri;
	      }
	    }

	    if (!/^(https?|wss?):\/\//.test(uri)) {
	      debug('protocol-less url %s', uri);
	      if ('undefined' !== typeof loc) {
	        uri = loc.protocol + '//' + uri;
	      } else {
	        uri = 'https://' + uri;
	      }
	    }

	    // parse
	    debug('parse %s', uri);
	    obj = parseuri(uri);
	  }

	  // make sure we treat `localhost:80` and `localhost` equally
	  if (!obj.port) {
	    if (/^(http|ws)$/.test(obj.protocol)) {
	      obj.port = '80';
	    } else if (/^(http|ws)s$/.test(obj.protocol)) {
	      obj.port = '443';
	    }
	  }

	  obj.path = obj.path || '/';

	  var ipv6 = obj.host.indexOf(':') !== -1;
	  var host = ipv6 ? '[' + obj.host + ']' : obj.host;

	  // define unique id
	  obj.id = obj.protocol + '://' + host + ':' + obj.port;
	  // define href
	  obj.href = obj.protocol + '://' + host + (loc && loc.port === obj.port ? '' : (':' + obj.port));

	  return obj;
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 10 */
/***/ function(module, exports) {

	/**
	 * Parses an URI
	 *
	 * @author Steven Levithan <stevenlevithan.com> (MIT license)
	 * @api private
	 */

	var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

	var parts = [
	    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
	];

	module.exports = function parseuri(str) {
	    var src = str,
	        b = str.indexOf('['),
	        e = str.indexOf(']');

	    if (b != -1 && e != -1) {
	        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
	    }

	    var m = re.exec(str || ''),
	        uri = {},
	        i = 14;

	    while (i--) {
	        uri[parts[i]] = m[i] || '';
	    }

	    if (b != -1 && e != -1) {
	        uri.source = src;
	        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
	        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
	        uri.ipv6uri = true;
	    }

	    return uri;
	};


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {
	/**
	 * This is the web browser implementation of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = __webpack_require__(12);
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = 'undefined' != typeof chrome
	               && 'undefined' != typeof chrome.storage
	                  ? chrome.storage.local
	                  : localstorage();

	/**
	 * Colors.
	 */

	exports.colors = [
	  'lightseagreen',
	  'forestgreen',
	  'goldenrod',
	  'dodgerblue',
	  'darkorchid',
	  'crimson'
	];

	/**
	 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
	 * and the Firebug extension (any Firefox version) are known
	 * to support "%c" CSS customizations.
	 *
	 * TODO: add a `localStorage` variable to explicitly enable/disable colors
	 */

	function useColors() {
	  // is webkit? http://stackoverflow.com/a/16459606/376773
	  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	  return (typeof document !== 'undefined' && 'WebkitAppearance' in document.documentElement.style) ||
	    // is firebug? http://stackoverflow.com/a/398120/376773
	    (window.console && (console.firebug || (console.exception && console.table))) ||
	    // is firefox >= v31?
	    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
	    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
	}

	/**
	 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	 */

	exports.formatters.j = function(v) {
	  try {
	    return JSON.stringify(v);
	  } catch (err) {
	    return '[UnexpectedJSONParseError]: ' + err.message;
	  }
	};


	/**
	 * Colorize log arguments if enabled.
	 *
	 * @api public
	 */

	function formatArgs() {
	  var args = arguments;
	  var useColors = this.useColors;

	  args[0] = (useColors ? '%c' : '')
	    + this.namespace
	    + (useColors ? ' %c' : ' ')
	    + args[0]
	    + (useColors ? '%c ' : ' ')
	    + '+' + exports.humanize(this.diff);

	  if (!useColors) return args;

	  var c = 'color: ' + this.color;
	  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

	  // the final "%c" is somewhat tricky, because there could be other
	  // arguments passed either before or after the %c, so we need to
	  // figure out the correct index to insert the CSS into
	  var index = 0;
	  var lastC = 0;
	  args[0].replace(/%[a-z%]/g, function(match) {
	    if ('%%' === match) return;
	    index++;
	    if ('%c' === match) {
	      // we only are interested in the *last* %c
	      // (the user may have provided their own)
	      lastC = index;
	    }
	  });

	  args.splice(lastC, 0, c);
	  return args;
	}

	/**
	 * Invokes `console.log()` when available.
	 * No-op when `console.log` is not a "function".
	 *
	 * @api public
	 */

	function log() {
	  // this hackery is required for IE8/9, where
	  // the `console.log` function doesn't have 'apply'
	  return 'object' === typeof console
	    && console.log
	    && Function.prototype.apply.call(console.log, console, arguments);
	}

	/**
	 * Save `namespaces`.
	 *
	 * @param {String} namespaces
	 * @api private
	 */

	function save(namespaces) {
	  try {
	    if (null == namespaces) {
	      exports.storage.removeItem('debug');
	    } else {
	      exports.storage.debug = namespaces;
	    }
	  } catch(e) {}
	}

	/**
	 * Load `namespaces`.
	 *
	 * @return {String} returns the previously persisted debug modes
	 * @api private
	 */

	function load() {
	  var r;
	  try {
	    return exports.storage.debug;
	  } catch(e) {}

	  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	  if (typeof process !== 'undefined' && 'env' in process) {
	    return process.env.DEBUG;
	  }
	}

	/**
	 * Enable namespaces listed in `localStorage.debug` initially.
	 */

	exports.enable(load());

	/**
	 * Localstorage attempts to return the localstorage.
	 *
	 * This is necessary because safari throws
	 * when a user disables cookies/localstorage
	 * and you attempt to access it.
	 *
	 * @return {LocalStorage}
	 * @api private
	 */

	function localstorage(){
	  try {
	    return window.localStorage;
	  } catch (e) {}
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = debug.debug = debug;
	exports.coerce = coerce;
	exports.disable = disable;
	exports.enable = enable;
	exports.enabled = enabled;
	exports.humanize = __webpack_require__(13);

	/**
	 * The currently active debug mode names, and names to skip.
	 */

	exports.names = [];
	exports.skips = [];

	/**
	 * Map of special "%n" handling functions, for the debug "format" argument.
	 *
	 * Valid key names are a single, lowercased letter, i.e. "n".
	 */

	exports.formatters = {};

	/**
	 * Previously assigned color.
	 */

	var prevColor = 0;

	/**
	 * Previous log timestamp.
	 */

	var prevTime;

	/**
	 * Select a color.
	 *
	 * @return {Number}
	 * @api private
	 */

	function selectColor() {
	  return exports.colors[prevColor++ % exports.colors.length];
	}

	/**
	 * Create a debugger with the given `namespace`.
	 *
	 * @param {String} namespace
	 * @return {Function}
	 * @api public
	 */

	function debug(namespace) {

	  // define the `disabled` version
	  function disabled() {
	  }
	  disabled.enabled = false;

	  // define the `enabled` version
	  function enabled() {

	    var self = enabled;

	    // set `diff` timestamp
	    var curr = +new Date();
	    var ms = curr - (prevTime || curr);
	    self.diff = ms;
	    self.prev = prevTime;
	    self.curr = curr;
	    prevTime = curr;

	    // add the `color` if not set
	    if (null == self.useColors) self.useColors = exports.useColors();
	    if (null == self.color && self.useColors) self.color = selectColor();

	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }

	    args[0] = exports.coerce(args[0]);

	    if ('string' !== typeof args[0]) {
	      // anything else let's inspect with %o
	      args = ['%o'].concat(args);
	    }

	    // apply any `formatters` transformations
	    var index = 0;
	    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
	      // if we encounter an escaped % then don't increase the array index
	      if (match === '%%') return match;
	      index++;
	      var formatter = exports.formatters[format];
	      if ('function' === typeof formatter) {
	        var val = args[index];
	        match = formatter.call(self, val);

	        // now we need to remove `args[index]` since it's inlined in the `format`
	        args.splice(index, 1);
	        index--;
	      }
	      return match;
	    });

	    // apply env-specific formatting
	    args = exports.formatArgs.apply(self, args);

	    var logFn = enabled.log || exports.log || console.log.bind(console);
	    logFn.apply(self, args);
	  }
	  enabled.enabled = true;

	  var fn = exports.enabled(namespace) ? enabled : disabled;

	  fn.namespace = namespace;

	  return fn;
	}

	/**
	 * Enables a debug mode by namespaces. This can include modes
	 * separated by a colon and wildcards.
	 *
	 * @param {String} namespaces
	 * @api public
	 */

	function enable(namespaces) {
	  exports.save(namespaces);

	  var split = (namespaces || '').split(/[\s,]+/);
	  var len = split.length;

	  for (var i = 0; i < len; i++) {
	    if (!split[i]) continue; // ignore empty strings
	    namespaces = split[i].replace(/[\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*?');
	    if (namespaces[0] === '-') {
	      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
	    } else {
	      exports.names.push(new RegExp('^' + namespaces + '$'));
	    }
	  }
	}

	/**
	 * Disable debug output.
	 *
	 * @api public
	 */

	function disable() {
	  exports.enable('');
	}

	/**
	 * Returns true if the given mode name is enabled, false otherwise.
	 *
	 * @param {String} name
	 * @return {Boolean}
	 * @api public
	 */

	function enabled(name) {
	  var i, len;
	  for (i = 0, len = exports.skips.length; i < len; i++) {
	    if (exports.skips[i].test(name)) {
	      return false;
	    }
	  }
	  for (i = 0, len = exports.names.length; i < len; i++) {
	    if (exports.names[i].test(name)) {
	      return true;
	    }
	  }
	  return false;
	}

	/**
	 * Coerce `val`.
	 *
	 * @param {Mixed} val
	 * @return {Mixed}
	 * @api private
	 */

	function coerce(val) {
	  if (val instanceof Error) return val.stack || val.message;
	  return val;
	}


/***/ },
/* 13 */
/***/ function(module, exports) {

	/**
	 * Helpers.
	 */

	var s = 1000
	var m = s * 60
	var h = m * 60
	var d = h * 24
	var y = d * 365.25

	/**
	 * Parse or format the given `val`.
	 *
	 * Options:
	 *
	 *  - `long` verbose formatting [false]
	 *
	 * @param {String|Number} val
	 * @param {Object} options
	 * @throws {Error} throw an error if val is not a non-empty string or a number
	 * @return {String|Number}
	 * @api public
	 */

	module.exports = function (val, options) {
	  options = options || {}
	  var type = typeof val
	  if (type === 'string' && val.length > 0) {
	    return parse(val)
	  } else if (type === 'number' && isNaN(val) === false) {
	    return options.long ?
				fmtLong(val) :
				fmtShort(val)
	  }
	  throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val))
	}

	/**
	 * Parse the given `str` and return milliseconds.
	 *
	 * @param {String} str
	 * @return {Number}
	 * @api private
	 */

	function parse(str) {
	  str = String(str)
	  if (str.length > 10000) {
	    return
	  }
	  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str)
	  if (!match) {
	    return
	  }
	  var n = parseFloat(match[1])
	  var type = (match[2] || 'ms').toLowerCase()
	  switch (type) {
	    case 'years':
	    case 'year':
	    case 'yrs':
	    case 'yr':
	    case 'y':
	      return n * y
	    case 'days':
	    case 'day':
	    case 'd':
	      return n * d
	    case 'hours':
	    case 'hour':
	    case 'hrs':
	    case 'hr':
	    case 'h':
	      return n * h
	    case 'minutes':
	    case 'minute':
	    case 'mins':
	    case 'min':
	    case 'm':
	      return n * m
	    case 'seconds':
	    case 'second':
	    case 'secs':
	    case 'sec':
	    case 's':
	      return n * s
	    case 'milliseconds':
	    case 'millisecond':
	    case 'msecs':
	    case 'msec':
	    case 'ms':
	      return n
	    default:
	      return undefined
	  }
	}

	/**
	 * Short format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtShort(ms) {
	  if (ms >= d) {
	    return Math.round(ms / d) + 'd'
	  }
	  if (ms >= h) {
	    return Math.round(ms / h) + 'h'
	  }
	  if (ms >= m) {
	    return Math.round(ms / m) + 'm'
	  }
	  if (ms >= s) {
	    return Math.round(ms / s) + 's'
	  }
	  return ms + 'ms'
	}

	/**
	 * Long format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtLong(ms) {
	  return plural(ms, d, 'day') ||
	    plural(ms, h, 'hour') ||
	    plural(ms, m, 'minute') ||
	    plural(ms, s, 'second') ||
	    ms + ' ms'
	}

	/**
	 * Pluralization helper.
	 */

	function plural(ms, n, name) {
	  if (ms < n) {
	    return
	  }
	  if (ms < n * 1.5) {
	    return Math.floor(ms / n) + ' ' + name
	  }
	  return Math.ceil(ms / n) + ' ' + name + 's'
	}


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var debug = __webpack_require__(15)('socket.io-parser');
	var json = __webpack_require__(18);
	var Emitter = __webpack_require__(21);
	var binary = __webpack_require__(22);
	var isBuf = __webpack_require__(24);

	/**
	 * Protocol version.
	 *
	 * @api public
	 */

	exports.protocol = 4;

	/**
	 * Packet types.
	 *
	 * @api public
	 */

	exports.types = [
	  'CONNECT',
	  'DISCONNECT',
	  'EVENT',
	  'ACK',
	  'ERROR',
	  'BINARY_EVENT',
	  'BINARY_ACK'
	];

	/**
	 * Packet type `connect`.
	 *
	 * @api public
	 */

	exports.CONNECT = 0;

	/**
	 * Packet type `disconnect`.
	 *
	 * @api public
	 */

	exports.DISCONNECT = 1;

	/**
	 * Packet type `event`.
	 *
	 * @api public
	 */

	exports.EVENT = 2;

	/**
	 * Packet type `ack`.
	 *
	 * @api public
	 */

	exports.ACK = 3;

	/**
	 * Packet type `error`.
	 *
	 * @api public
	 */

	exports.ERROR = 4;

	/**
	 * Packet type 'binary event'
	 *
	 * @api public
	 */

	exports.BINARY_EVENT = 5;

	/**
	 * Packet type `binary ack`. For acks with binary arguments.
	 *
	 * @api public
	 */

	exports.BINARY_ACK = 6;

	/**
	 * Encoder constructor.
	 *
	 * @api public
	 */

	exports.Encoder = Encoder;

	/**
	 * Decoder constructor.
	 *
	 * @api public
	 */

	exports.Decoder = Decoder;

	/**
	 * A socket.io Encoder instance
	 *
	 * @api public
	 */

	function Encoder() {}

	/**
	 * Encode a packet as a single string if non-binary, or as a
	 * buffer sequence, depending on packet type.
	 *
	 * @param {Object} obj - packet object
	 * @param {Function} callback - function to handle encodings (likely engine.write)
	 * @return Calls callback with Array of encodings
	 * @api public
	 */

	Encoder.prototype.encode = function(obj, callback){
	  debug('encoding packet %j', obj);

	  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
	    encodeAsBinary(obj, callback);
	  }
	  else {
	    var encoding = encodeAsString(obj);
	    callback([encoding]);
	  }
	};

	/**
	 * Encode packet as string.
	 *
	 * @param {Object} packet
	 * @return {String} encoded
	 * @api private
	 */

	function encodeAsString(obj) {
	  var str = '';
	  var nsp = false;

	  // first is type
	  str += obj.type;

	  // attachments if we have them
	  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
	    str += obj.attachments;
	    str += '-';
	  }

	  // if we have a namespace other than `/`
	  // we append it followed by a comma `,`
	  if (obj.nsp && '/' != obj.nsp) {
	    nsp = true;
	    str += obj.nsp;
	  }

	  // immediately followed by the id
	  if (null != obj.id) {
	    if (nsp) {
	      str += ',';
	      nsp = false;
	    }
	    str += obj.id;
	  }

	  // json data
	  if (null != obj.data) {
	    if (nsp) str += ',';
	    str += json.stringify(obj.data);
	  }

	  debug('encoded %j as %s', obj, str);
	  return str;
	}

	/**
	 * Encode packet as 'buffer sequence' by removing blobs, and
	 * deconstructing packet into object with placeholders and
	 * a list of buffers.
	 *
	 * @param {Object} packet
	 * @return {Buffer} encoded
	 * @api private
	 */

	function encodeAsBinary(obj, callback) {

	  function writeEncoding(bloblessData) {
	    var deconstruction = binary.deconstructPacket(bloblessData);
	    var pack = encodeAsString(deconstruction.packet);
	    var buffers = deconstruction.buffers;

	    buffers.unshift(pack); // add packet info to beginning of data list
	    callback(buffers); // write all the buffers
	  }

	  binary.removeBlobs(obj, writeEncoding);
	}

	/**
	 * A socket.io Decoder instance
	 *
	 * @return {Object} decoder
	 * @api public
	 */

	function Decoder() {
	  this.reconstructor = null;
	}

	/**
	 * Mix in `Emitter` with Decoder.
	 */

	Emitter(Decoder.prototype);

	/**
	 * Decodes an ecoded packet string into packet JSON.
	 *
	 * @param {String} obj - encoded packet
	 * @return {Object} packet
	 * @api public
	 */

	Decoder.prototype.add = function(obj) {
	  var packet;
	  if ('string' == typeof obj) {
	    packet = decodeString(obj);
	    if (exports.BINARY_EVENT == packet.type || exports.BINARY_ACK == packet.type) { // binary packet's json
	      this.reconstructor = new BinaryReconstructor(packet);

	      // no attachments, labeled binary but no binary data to follow
	      if (this.reconstructor.reconPack.attachments === 0) {
	        this.emit('decoded', packet);
	      }
	    } else { // non-binary full packet
	      this.emit('decoded', packet);
	    }
	  }
	  else if (isBuf(obj) || obj.base64) { // raw binary data
	    if (!this.reconstructor) {
	      throw new Error('got binary data when not reconstructing a packet');
	    } else {
	      packet = this.reconstructor.takeBinaryData(obj);
	      if (packet) { // received final buffer
	        this.reconstructor = null;
	        this.emit('decoded', packet);
	      }
	    }
	  }
	  else {
	    throw new Error('Unknown type: ' + obj);
	  }
	};

	/**
	 * Decode a packet String (JSON data)
	 *
	 * @param {String} str
	 * @return {Object} packet
	 * @api private
	 */

	function decodeString(str) {
	  var p = {};
	  var i = 0;

	  // look up type
	  p.type = Number(str.charAt(0));
	  if (null == exports.types[p.type]) return error();

	  // look up attachments if type binary
	  if (exports.BINARY_EVENT == p.type || exports.BINARY_ACK == p.type) {
	    var buf = '';
	    while (str.charAt(++i) != '-') {
	      buf += str.charAt(i);
	      if (i == str.length) break;
	    }
	    if (buf != Number(buf) || str.charAt(i) != '-') {
	      throw new Error('Illegal attachments');
	    }
	    p.attachments = Number(buf);
	  }

	  // look up namespace (if any)
	  if ('/' == str.charAt(i + 1)) {
	    p.nsp = '';
	    while (++i) {
	      var c = str.charAt(i);
	      if (',' == c) break;
	      p.nsp += c;
	      if (i == str.length) break;
	    }
	  } else {
	    p.nsp = '/';
	  }

	  // look up id
	  var next = str.charAt(i + 1);
	  if ('' !== next && Number(next) == next) {
	    p.id = '';
	    while (++i) {
	      var c = str.charAt(i);
	      if (null == c || Number(c) != c) {
	        --i;
	        break;
	      }
	      p.id += str.charAt(i);
	      if (i == str.length) break;
	    }
	    p.id = Number(p.id);
	  }

	  // look up json data
	  if (str.charAt(++i)) {
	    p = tryParse(p, str.substr(i));
	  }

	  debug('decoded %s as %j', str, p);
	  return p;
	}

	function tryParse(p, str) {
	  try {
	    p.data = json.parse(str);
	  } catch(e){
	    return error();
	  }
	  return p; 
	};

	/**
	 * Deallocates a parser's resources
	 *
	 * @api public
	 */

	Decoder.prototype.destroy = function() {
	  if (this.reconstructor) {
	    this.reconstructor.finishedReconstruction();
	  }
	};

	/**
	 * A manager of a binary event's 'buffer sequence'. Should
	 * be constructed whenever a packet of type BINARY_EVENT is
	 * decoded.
	 *
	 * @param {Object} packet
	 * @return {BinaryReconstructor} initialized reconstructor
	 * @api private
	 */

	function BinaryReconstructor(packet) {
	  this.reconPack = packet;
	  this.buffers = [];
	}

	/**
	 * Method to be called when binary data received from connection
	 * after a BINARY_EVENT packet.
	 *
	 * @param {Buffer | ArrayBuffer} binData - the raw binary data received
	 * @return {null | Object} returns null if more binary data is expected or
	 *   a reconstructed packet object if all buffers have been received.
	 * @api private
	 */

	BinaryReconstructor.prototype.takeBinaryData = function(binData) {
	  this.buffers.push(binData);
	  if (this.buffers.length == this.reconPack.attachments) { // done with buffer list
	    var packet = binary.reconstructPacket(this.reconPack, this.buffers);
	    this.finishedReconstruction();
	    return packet;
	  }
	  return null;
	};

	/**
	 * Cleans up binary packet reconstruction variables.
	 *
	 * @api private
	 */

	BinaryReconstructor.prototype.finishedReconstruction = function() {
	  this.reconPack = null;
	  this.buffers = [];
	};

	function error(data){
	  return {
	    type: exports.ERROR,
	    data: 'parser error'
	  };
	}


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * This is the web browser implementation of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = __webpack_require__(16);
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = 'undefined' != typeof chrome
	               && 'undefined' != typeof chrome.storage
	                  ? chrome.storage.local
	                  : localstorage();

	/**
	 * Colors.
	 */

	exports.colors = [
	  'lightseagreen',
	  'forestgreen',
	  'goldenrod',
	  'dodgerblue',
	  'darkorchid',
	  'crimson'
	];

	/**
	 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
	 * and the Firebug extension (any Firefox version) are known
	 * to support "%c" CSS customizations.
	 *
	 * TODO: add a `localStorage` variable to explicitly enable/disable colors
	 */

	function useColors() {
	  // is webkit? http://stackoverflow.com/a/16459606/376773
	  return ('WebkitAppearance' in document.documentElement.style) ||
	    // is firebug? http://stackoverflow.com/a/398120/376773
	    (window.console && (console.firebug || (console.exception && console.table))) ||
	    // is firefox >= v31?
	    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
	    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
	}

	/**
	 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	 */

	exports.formatters.j = function(v) {
	  return JSON.stringify(v);
	};


	/**
	 * Colorize log arguments if enabled.
	 *
	 * @api public
	 */

	function formatArgs() {
	  var args = arguments;
	  var useColors = this.useColors;

	  args[0] = (useColors ? '%c' : '')
	    + this.namespace
	    + (useColors ? ' %c' : ' ')
	    + args[0]
	    + (useColors ? '%c ' : ' ')
	    + '+' + exports.humanize(this.diff);

	  if (!useColors) return args;

	  var c = 'color: ' + this.color;
	  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

	  // the final "%c" is somewhat tricky, because there could be other
	  // arguments passed either before or after the %c, so we need to
	  // figure out the correct index to insert the CSS into
	  var index = 0;
	  var lastC = 0;
	  args[0].replace(/%[a-z%]/g, function(match) {
	    if ('%%' === match) return;
	    index++;
	    if ('%c' === match) {
	      // we only are interested in the *last* %c
	      // (the user may have provided their own)
	      lastC = index;
	    }
	  });

	  args.splice(lastC, 0, c);
	  return args;
	}

	/**
	 * Invokes `console.log()` when available.
	 * No-op when `console.log` is not a "function".
	 *
	 * @api public
	 */

	function log() {
	  // this hackery is required for IE8/9, where
	  // the `console.log` function doesn't have 'apply'
	  return 'object' === typeof console
	    && console.log
	    && Function.prototype.apply.call(console.log, console, arguments);
	}

	/**
	 * Save `namespaces`.
	 *
	 * @param {String} namespaces
	 * @api private
	 */

	function save(namespaces) {
	  try {
	    if (null == namespaces) {
	      exports.storage.removeItem('debug');
	    } else {
	      exports.storage.debug = namespaces;
	    }
	  } catch(e) {}
	}

	/**
	 * Load `namespaces`.
	 *
	 * @return {String} returns the previously persisted debug modes
	 * @api private
	 */

	function load() {
	  var r;
	  try {
	    r = exports.storage.debug;
	  } catch(e) {}
	  return r;
	}

	/**
	 * Enable namespaces listed in `localStorage.debug` initially.
	 */

	exports.enable(load());

	/**
	 * Localstorage attempts to return the localstorage.
	 *
	 * This is necessary because safari throws
	 * when a user disables cookies/localstorage
	 * and you attempt to access it.
	 *
	 * @return {LocalStorage}
	 * @api private
	 */

	function localstorage(){
	  try {
	    return window.localStorage;
	  } catch (e) {}
	}


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = debug;
	exports.coerce = coerce;
	exports.disable = disable;
	exports.enable = enable;
	exports.enabled = enabled;
	exports.humanize = __webpack_require__(17);

	/**
	 * The currently active debug mode names, and names to skip.
	 */

	exports.names = [];
	exports.skips = [];

	/**
	 * Map of special "%n" handling functions, for the debug "format" argument.
	 *
	 * Valid key names are a single, lowercased letter, i.e. "n".
	 */

	exports.formatters = {};

	/**
	 * Previously assigned color.
	 */

	var prevColor = 0;

	/**
	 * Previous log timestamp.
	 */

	var prevTime;

	/**
	 * Select a color.
	 *
	 * @return {Number}
	 * @api private
	 */

	function selectColor() {
	  return exports.colors[prevColor++ % exports.colors.length];
	}

	/**
	 * Create a debugger with the given `namespace`.
	 *
	 * @param {String} namespace
	 * @return {Function}
	 * @api public
	 */

	function debug(namespace) {

	  // define the `disabled` version
	  function disabled() {
	  }
	  disabled.enabled = false;

	  // define the `enabled` version
	  function enabled() {

	    var self = enabled;

	    // set `diff` timestamp
	    var curr = +new Date();
	    var ms = curr - (prevTime || curr);
	    self.diff = ms;
	    self.prev = prevTime;
	    self.curr = curr;
	    prevTime = curr;

	    // add the `color` if not set
	    if (null == self.useColors) self.useColors = exports.useColors();
	    if (null == self.color && self.useColors) self.color = selectColor();

	    var args = Array.prototype.slice.call(arguments);

	    args[0] = exports.coerce(args[0]);

	    if ('string' !== typeof args[0]) {
	      // anything else let's inspect with %o
	      args = ['%o'].concat(args);
	    }

	    // apply any `formatters` transformations
	    var index = 0;
	    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
	      // if we encounter an escaped % then don't increase the array index
	      if (match === '%%') return match;
	      index++;
	      var formatter = exports.formatters[format];
	      if ('function' === typeof formatter) {
	        var val = args[index];
	        match = formatter.call(self, val);

	        // now we need to remove `args[index]` since it's inlined in the `format`
	        args.splice(index, 1);
	        index--;
	      }
	      return match;
	    });

	    if ('function' === typeof exports.formatArgs) {
	      args = exports.formatArgs.apply(self, args);
	    }
	    var logFn = enabled.log || exports.log || console.log.bind(console);
	    logFn.apply(self, args);
	  }
	  enabled.enabled = true;

	  var fn = exports.enabled(namespace) ? enabled : disabled;

	  fn.namespace = namespace;

	  return fn;
	}

	/**
	 * Enables a debug mode by namespaces. This can include modes
	 * separated by a colon and wildcards.
	 *
	 * @param {String} namespaces
	 * @api public
	 */

	function enable(namespaces) {
	  exports.save(namespaces);

	  var split = (namespaces || '').split(/[\s,]+/);
	  var len = split.length;

	  for (var i = 0; i < len; i++) {
	    if (!split[i]) continue; // ignore empty strings
	    namespaces = split[i].replace(/\*/g, '.*?');
	    if (namespaces[0] === '-') {
	      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
	    } else {
	      exports.names.push(new RegExp('^' + namespaces + '$'));
	    }
	  }
	}

	/**
	 * Disable debug output.
	 *
	 * @api public
	 */

	function disable() {
	  exports.enable('');
	}

	/**
	 * Returns true if the given mode name is enabled, false otherwise.
	 *
	 * @param {String} name
	 * @return {Boolean}
	 * @api public
	 */

	function enabled(name) {
	  var i, len;
	  for (i = 0, len = exports.skips.length; i < len; i++) {
	    if (exports.skips[i].test(name)) {
	      return false;
	    }
	  }
	  for (i = 0, len = exports.names.length; i < len; i++) {
	    if (exports.names[i].test(name)) {
	      return true;
	    }
	  }
	  return false;
	}

	/**
	 * Coerce `val`.
	 *
	 * @param {Mixed} val
	 * @return {Mixed}
	 * @api private
	 */

	function coerce(val) {
	  if (val instanceof Error) return val.stack || val.message;
	  return val;
	}


/***/ },
/* 17 */
/***/ function(module, exports) {

	/**
	 * Helpers.
	 */

	var s = 1000;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var y = d * 365.25;

	/**
	 * Parse or format the given `val`.
	 *
	 * Options:
	 *
	 *  - `long` verbose formatting [false]
	 *
	 * @param {String|Number} val
	 * @param {Object} options
	 * @return {String|Number}
	 * @api public
	 */

	module.exports = function(val, options){
	  options = options || {};
	  if ('string' == typeof val) return parse(val);
	  return options.long
	    ? long(val)
	    : short(val);
	};

	/**
	 * Parse the given `str` and return milliseconds.
	 *
	 * @param {String} str
	 * @return {Number}
	 * @api private
	 */

	function parse(str) {
	  str = '' + str;
	  if (str.length > 10000) return;
	  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
	  if (!match) return;
	  var n = parseFloat(match[1]);
	  var type = (match[2] || 'ms').toLowerCase();
	  switch (type) {
	    case 'years':
	    case 'year':
	    case 'yrs':
	    case 'yr':
	    case 'y':
	      return n * y;
	    case 'days':
	    case 'day':
	    case 'd':
	      return n * d;
	    case 'hours':
	    case 'hour':
	    case 'hrs':
	    case 'hr':
	    case 'h':
	      return n * h;
	    case 'minutes':
	    case 'minute':
	    case 'mins':
	    case 'min':
	    case 'm':
	      return n * m;
	    case 'seconds':
	    case 'second':
	    case 'secs':
	    case 'sec':
	    case 's':
	      return n * s;
	    case 'milliseconds':
	    case 'millisecond':
	    case 'msecs':
	    case 'msec':
	    case 'ms':
	      return n;
	  }
	}

	/**
	 * Short format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function short(ms) {
	  if (ms >= d) return Math.round(ms / d) + 'd';
	  if (ms >= h) return Math.round(ms / h) + 'h';
	  if (ms >= m) return Math.round(ms / m) + 'm';
	  if (ms >= s) return Math.round(ms / s) + 's';
	  return ms + 'ms';
	}

	/**
	 * Long format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function long(ms) {
	  return plural(ms, d, 'day')
	    || plural(ms, h, 'hour')
	    || plural(ms, m, 'minute')
	    || plural(ms, s, 'second')
	    || ms + ' ms';
	}

	/**
	 * Pluralization helper.
	 */

	function plural(ms, n, name) {
	  if (ms < n) return;
	  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
	  return Math.ceil(ms / n) + ' ' + name + 's';
	}


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module, global) {/*! JSON v3.3.2 | http://bestiejs.github.io/json3 | Copyright 2012-2014, Kit Cambridge | http://kit.mit-license.org */
	;(function () {
	  // Detect the `define` function exposed by asynchronous module loaders. The
	  // strict `define` check is necessary for compatibility with `r.js`.
	  var isLoader = "function" === "function" && __webpack_require__(20);

	  // A set of types used to distinguish objects from primitives.
	  var objectTypes = {
	    "function": true,
	    "object": true
	  };

	  // Detect the `exports` object exposed by CommonJS implementations.
	  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

	  // Use the `global` object exposed by Node (including Browserify via
	  // `insert-module-globals`), Narwhal, and Ringo as the default context,
	  // and the `window` object in browsers. Rhino exports a `global` function
	  // instead.
	  var root = objectTypes[typeof window] && window || this,
	      freeGlobal = freeExports && objectTypes[typeof module] && module && !module.nodeType && typeof global == "object" && global;

	  if (freeGlobal && (freeGlobal["global"] === freeGlobal || freeGlobal["window"] === freeGlobal || freeGlobal["self"] === freeGlobal)) {
	    root = freeGlobal;
	  }

	  // Public: Initializes JSON 3 using the given `context` object, attaching the
	  // `stringify` and `parse` functions to the specified `exports` object.
	  function runInContext(context, exports) {
	    context || (context = root["Object"]());
	    exports || (exports = root["Object"]());

	    // Native constructor aliases.
	    var Number = context["Number"] || root["Number"],
	        String = context["String"] || root["String"],
	        Object = context["Object"] || root["Object"],
	        Date = context["Date"] || root["Date"],
	        SyntaxError = context["SyntaxError"] || root["SyntaxError"],
	        TypeError = context["TypeError"] || root["TypeError"],
	        Math = context["Math"] || root["Math"],
	        nativeJSON = context["JSON"] || root["JSON"];

	    // Delegate to the native `stringify` and `parse` implementations.
	    if (typeof nativeJSON == "object" && nativeJSON) {
	      exports.stringify = nativeJSON.stringify;
	      exports.parse = nativeJSON.parse;
	    }

	    // Convenience aliases.
	    var objectProto = Object.prototype,
	        getClass = objectProto.toString,
	        isProperty, forEach, undef;

	    // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
	    var isExtended = new Date(-3509827334573292);
	    try {
	      // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
	      // results for certain dates in Opera >= 10.53.
	      isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
	        // Safari < 2.0.2 stores the internal millisecond time value correctly,
	        // but clips the values returned by the date methods to the range of
	        // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
	        isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
	    } catch (exception) {}

	    // Internal: Determines whether the native `JSON.stringify` and `parse`
	    // implementations are spec-compliant. Based on work by Ken Snyder.
	    function has(name) {
	      if (has[name] !== undef) {
	        // Return cached feature test result.
	        return has[name];
	      }
	      var isSupported;
	      if (name == "bug-string-char-index") {
	        // IE <= 7 doesn't support accessing string characters using square
	        // bracket notation. IE 8 only supports this for primitives.
	        isSupported = "a"[0] != "a";
	      } else if (name == "json") {
	        // Indicates whether both `JSON.stringify` and `JSON.parse` are
	        // supported.
	        isSupported = has("json-stringify") && has("json-parse");
	      } else {
	        var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
	        // Test `JSON.stringify`.
	        if (name == "json-stringify") {
	          var stringify = exports.stringify, stringifySupported = typeof stringify == "function" && isExtended;
	          if (stringifySupported) {
	            // A test function object with a custom `toJSON` method.
	            (value = function () {
	              return 1;
	            }).toJSON = value;
	            try {
	              stringifySupported =
	                // Firefox 3.1b1 and b2 serialize string, number, and boolean
	                // primitives as object literals.
	                stringify(0) === "0" &&
	                // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
	                // literals.
	                stringify(new Number()) === "0" &&
	                stringify(new String()) == '""' &&
	                // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
	                // does not define a canonical JSON representation (this applies to
	                // objects with `toJSON` properties as well, *unless* they are nested
	                // within an object or array).
	                stringify(getClass) === undef &&
	                // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
	                // FF 3.1b3 pass this test.
	                stringify(undef) === undef &&
	                // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
	                // respectively, if the value is omitted entirely.
	                stringify() === undef &&
	                // FF 3.1b1, 2 throw an error if the given value is not a number,
	                // string, array, object, Boolean, or `null` literal. This applies to
	                // objects with custom `toJSON` methods as well, unless they are nested
	                // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
	                // methods entirely.
	                stringify(value) === "1" &&
	                stringify([value]) == "[1]" &&
	                // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
	                // `"[null]"`.
	                stringify([undef]) == "[null]" &&
	                // YUI 3.0.0b1 fails to serialize `null` literals.
	                stringify(null) == "null" &&
	                // FF 3.1b1, 2 halts serialization if an array contains a function:
	                // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
	                // elides non-JSON values from objects and arrays, unless they
	                // define custom `toJSON` methods.
	                stringify([undef, getClass, null]) == "[null,null,null]" &&
	                // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
	                // where character escape codes are expected (e.g., `\b` => `\u0008`).
	                stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
	                // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
	                stringify(null, value) === "1" &&
	                stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
	                // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
	                // serialize extended years.
	                stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
	                // The milliseconds are optional in ES 5, but required in 5.1.
	                stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
	                // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
	                // four-digit years instead of six-digit years. Credits: @Yaffle.
	                stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
	                // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
	                // values less than 1000. Credits: @Yaffle.
	                stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
	            } catch (exception) {
	              stringifySupported = false;
	            }
	          }
	          isSupported = stringifySupported;
	        }
	        // Test `JSON.parse`.
	        if (name == "json-parse") {
	          var parse = exports.parse;
	          if (typeof parse == "function") {
	            try {
	              // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
	              // Conforming implementations should also coerce the initial argument to
	              // a string prior to parsing.
	              if (parse("0") === 0 && !parse(false)) {
	                // Simple parsing test.
	                value = parse(serialized);
	                var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
	                if (parseSupported) {
	                  try {
	                    // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
	                    parseSupported = !parse('"\t"');
	                  } catch (exception) {}
	                  if (parseSupported) {
	                    try {
	                      // FF 4.0 and 4.0.1 allow leading `+` signs and leading
	                      // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
	                      // certain octal literals.
	                      parseSupported = parse("01") !== 1;
	                    } catch (exception) {}
	                  }
	                  if (parseSupported) {
	                    try {
	                      // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
	                      // points. These environments, along with FF 3.1b1 and 2,
	                      // also allow trailing commas in JSON objects and arrays.
	                      parseSupported = parse("1.") !== 1;
	                    } catch (exception) {}
	                  }
	                }
	              }
	            } catch (exception) {
	              parseSupported = false;
	            }
	          }
	          isSupported = parseSupported;
	        }
	      }
	      return has[name] = !!isSupported;
	    }

	    if (!has("json")) {
	      // Common `[[Class]]` name aliases.
	      var functionClass = "[object Function]",
	          dateClass = "[object Date]",
	          numberClass = "[object Number]",
	          stringClass = "[object String]",
	          arrayClass = "[object Array]",
	          booleanClass = "[object Boolean]";

	      // Detect incomplete support for accessing string characters by index.
	      var charIndexBuggy = has("bug-string-char-index");

	      // Define additional utility methods if the `Date` methods are buggy.
	      if (!isExtended) {
	        var floor = Math.floor;
	        // A mapping between the months of the year and the number of days between
	        // January 1st and the first of the respective month.
	        var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
	        // Internal: Calculates the number of days between the Unix epoch and the
	        // first day of the given month.
	        var getDay = function (year, month) {
	          return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
	        };
	      }

	      // Internal: Determines if a property is a direct property of the given
	      // object. Delegates to the native `Object#hasOwnProperty` method.
	      if (!(isProperty = objectProto.hasOwnProperty)) {
	        isProperty = function (property) {
	          var members = {}, constructor;
	          if ((members.__proto__ = null, members.__proto__ = {
	            // The *proto* property cannot be set multiple times in recent
	            // versions of Firefox and SeaMonkey.
	            "toString": 1
	          }, members).toString != getClass) {
	            // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
	            // supports the mutable *proto* property.
	            isProperty = function (property) {
	              // Capture and break the object's prototype chain (see section 8.6.2
	              // of the ES 5.1 spec). The parenthesized expression prevents an
	              // unsafe transformation by the Closure Compiler.
	              var original = this.__proto__, result = property in (this.__proto__ = null, this);
	              // Restore the original prototype chain.
	              this.__proto__ = original;
	              return result;
	            };
	          } else {
	            // Capture a reference to the top-level `Object` constructor.
	            constructor = members.constructor;
	            // Use the `constructor` property to simulate `Object#hasOwnProperty` in
	            // other environments.
	            isProperty = function (property) {
	              var parent = (this.constructor || constructor).prototype;
	              return property in this && !(property in parent && this[property] === parent[property]);
	            };
	          }
	          members = null;
	          return isProperty.call(this, property);
	        };
	      }

	      // Internal: Normalizes the `for...in` iteration algorithm across
	      // environments. Each enumerated key is yielded to a `callback` function.
	      forEach = function (object, callback) {
	        var size = 0, Properties, members, property;

	        // Tests for bugs in the current environment's `for...in` algorithm. The
	        // `valueOf` property inherits the non-enumerable flag from
	        // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
	        (Properties = function () {
	          this.valueOf = 0;
	        }).prototype.valueOf = 0;

	        // Iterate over a new instance of the `Properties` class.
	        members = new Properties();
	        for (property in members) {
	          // Ignore all properties inherited from `Object.prototype`.
	          if (isProperty.call(members, property)) {
	            size++;
	          }
	        }
	        Properties = members = null;

	        // Normalize the iteration algorithm.
	        if (!size) {
	          // A list of non-enumerable properties inherited from `Object.prototype`.
	          members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
	          // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
	          // properties.
	          forEach = function (object, callback) {
	            var isFunction = getClass.call(object) == functionClass, property, length;
	            var hasProperty = !isFunction && typeof object.constructor != "function" && objectTypes[typeof object.hasOwnProperty] && object.hasOwnProperty || isProperty;
	            for (property in object) {
	              // Gecko <= 1.0 enumerates the `prototype` property of functions under
	              // certain conditions; IE does not.
	              if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
	                callback(property);
	              }
	            }
	            // Manually invoke the callback for each non-enumerable property.
	            for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
	          };
	        } else if (size == 2) {
	          // Safari <= 2.0.4 enumerates shadowed properties twice.
	          forEach = function (object, callback) {
	            // Create a set of iterated properties.
	            var members = {}, isFunction = getClass.call(object) == functionClass, property;
	            for (property in object) {
	              // Store each property name to prevent double enumeration. The
	              // `prototype` property of functions is not enumerated due to cross-
	              // environment inconsistencies.
	              if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
	                callback(property);
	              }
	            }
	          };
	        } else {
	          // No bugs detected; use the standard `for...in` algorithm.
	          forEach = function (object, callback) {
	            var isFunction = getClass.call(object) == functionClass, property, isConstructor;
	            for (property in object) {
	              if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
	                callback(property);
	              }
	            }
	            // Manually invoke the callback for the `constructor` property due to
	            // cross-environment inconsistencies.
	            if (isConstructor || isProperty.call(object, (property = "constructor"))) {
	              callback(property);
	            }
	          };
	        }
	        return forEach(object, callback);
	      };

	      // Public: Serializes a JavaScript `value` as a JSON string. The optional
	      // `filter` argument may specify either a function that alters how object and
	      // array members are serialized, or an array of strings and numbers that
	      // indicates which properties should be serialized. The optional `width`
	      // argument may be either a string or number that specifies the indentation
	      // level of the output.
	      if (!has("json-stringify")) {
	        // Internal: A map of control characters and their escaped equivalents.
	        var Escapes = {
	          92: "\\\\",
	          34: '\\"',
	          8: "\\b",
	          12: "\\f",
	          10: "\\n",
	          13: "\\r",
	          9: "\\t"
	        };

	        // Internal: Converts `value` into a zero-padded string such that its
	        // length is at least equal to `width`. The `width` must be <= 6.
	        var leadingZeroes = "000000";
	        var toPaddedString = function (width, value) {
	          // The `|| 0` expression is necessary to work around a bug in
	          // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
	          return (leadingZeroes + (value || 0)).slice(-width);
	        };

	        // Internal: Double-quotes a string `value`, replacing all ASCII control
	        // characters (characters with code unit values between 0 and 31) with
	        // their escaped equivalents. This is an implementation of the
	        // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
	        var unicodePrefix = "\\u00";
	        var quote = function (value) {
	          var result = '"', index = 0, length = value.length, useCharIndex = !charIndexBuggy || length > 10;
	          var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);
	          for (; index < length; index++) {
	            var charCode = value.charCodeAt(index);
	            // If the character is a control character, append its Unicode or
	            // shorthand escape sequence; otherwise, append the character as-is.
	            switch (charCode) {
	              case 8: case 9: case 10: case 12: case 13: case 34: case 92:
	                result += Escapes[charCode];
	                break;
	              default:
	                if (charCode < 32) {
	                  result += unicodePrefix + toPaddedString(2, charCode.toString(16));
	                  break;
	                }
	                result += useCharIndex ? symbols[index] : value.charAt(index);
	            }
	          }
	          return result + '"';
	        };

	        // Internal: Recursively serializes an object. Implements the
	        // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
	        var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
	          var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
	          try {
	            // Necessary for host object support.
	            value = object[property];
	          } catch (exception) {}
	          if (typeof value == "object" && value) {
	            className = getClass.call(value);
	            if (className == dateClass && !isProperty.call(value, "toJSON")) {
	              if (value > -1 / 0 && value < 1 / 0) {
	                // Dates are serialized according to the `Date#toJSON` method
	                // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
	                // for the ISO 8601 date time string format.
	                if (getDay) {
	                  // Manually compute the year, month, date, hours, minutes,
	                  // seconds, and milliseconds if the `getUTC*` methods are
	                  // buggy. Adapted from @Yaffle's `date-shim` project.
	                  date = floor(value / 864e5);
	                  for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
	                  for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
	                  date = 1 + date - getDay(year, month);
	                  // The `time` value specifies the time within the day (see ES
	                  // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
	                  // to compute `A modulo B`, as the `%` operator does not
	                  // correspond to the `modulo` operation for negative numbers.
	                  time = (value % 864e5 + 864e5) % 864e5;
	                  // The hours, minutes, seconds, and milliseconds are obtained by
	                  // decomposing the time within the day. See section 15.9.1.10.
	                  hours = floor(time / 36e5) % 24;
	                  minutes = floor(time / 6e4) % 60;
	                  seconds = floor(time / 1e3) % 60;
	                  milliseconds = time % 1e3;
	                } else {
	                  year = value.getUTCFullYear();
	                  month = value.getUTCMonth();
	                  date = value.getUTCDate();
	                  hours = value.getUTCHours();
	                  minutes = value.getUTCMinutes();
	                  seconds = value.getUTCSeconds();
	                  milliseconds = value.getUTCMilliseconds();
	                }
	                // Serialize extended years correctly.
	                value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
	                  "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
	                  // Months, dates, hours, minutes, and seconds should have two
	                  // digits; milliseconds should have three.
	                  "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
	                  // Milliseconds are optional in ES 5.0, but required in 5.1.
	                  "." + toPaddedString(3, milliseconds) + "Z";
	              } else {
	                value = null;
	              }
	            } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
	              // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
	              // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
	              // ignores all `toJSON` methods on these objects unless they are
	              // defined directly on an instance.
	              value = value.toJSON(property);
	            }
	          }
	          if (callback) {
	            // If a replacement function was provided, call it to obtain the value
	            // for serialization.
	            value = callback.call(object, property, value);
	          }
	          if (value === null) {
	            return "null";
	          }
	          className = getClass.call(value);
	          if (className == booleanClass) {
	            // Booleans are represented literally.
	            return "" + value;
	          } else if (className == numberClass) {
	            // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
	            // `"null"`.
	            return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
	          } else if (className == stringClass) {
	            // Strings are double-quoted and escaped.
	            return quote("" + value);
	          }
	          // Recursively serialize objects and arrays.
	          if (typeof value == "object") {
	            // Check for cyclic structures. This is a linear search; performance
	            // is inversely proportional to the number of unique nested objects.
	            for (length = stack.length; length--;) {
	              if (stack[length] === value) {
	                // Cyclic structures cannot be serialized by `JSON.stringify`.
	                throw TypeError();
	              }
	            }
	            // Add the object to the stack of traversed objects.
	            stack.push(value);
	            results = [];
	            // Save the current indentation level and indent one additional level.
	            prefix = indentation;
	            indentation += whitespace;
	            if (className == arrayClass) {
	              // Recursively serialize array elements.
	              for (index = 0, length = value.length; index < length; index++) {
	                element = serialize(index, value, callback, properties, whitespace, indentation, stack);
	                results.push(element === undef ? "null" : element);
	              }
	              result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
	            } else {
	              // Recursively serialize object members. Members are selected from
	              // either a user-specified list of property names, or the object
	              // itself.
	              forEach(properties || value, function (property) {
	                var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
	                if (element !== undef) {
	                  // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
	                  // is not the empty string, let `member` {quote(property) + ":"}
	                  // be the concatenation of `member` and the `space` character."
	                  // The "`space` character" refers to the literal space
	                  // character, not the `space` {width} argument provided to
	                  // `JSON.stringify`.
	                  results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
	                }
	              });
	              result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
	            }
	            // Remove the object from the traversed object stack.
	            stack.pop();
	            return result;
	          }
	        };

	        // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
	        exports.stringify = function (source, filter, width) {
	          var whitespace, callback, properties, className;
	          if (objectTypes[typeof filter] && filter) {
	            if ((className = getClass.call(filter)) == functionClass) {
	              callback = filter;
	            } else if (className == arrayClass) {
	              // Convert the property names array into a makeshift set.
	              properties = {};
	              for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
	            }
	          }
	          if (width) {
	            if ((className = getClass.call(width)) == numberClass) {
	              // Convert the `width` to an integer and create a string containing
	              // `width` number of space characters.
	              if ((width -= width % 1) > 0) {
	                for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
	              }
	            } else if (className == stringClass) {
	              whitespace = width.length <= 10 ? width : width.slice(0, 10);
	            }
	          }
	          // Opera <= 7.54u2 discards the values associated with empty string keys
	          // (`""`) only if they are used directly within an object member list
	          // (e.g., `!("" in { "": 1})`).
	          return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
	        };
	      }

	      // Public: Parses a JSON source string.
	      if (!has("json-parse")) {
	        var fromCharCode = String.fromCharCode;

	        // Internal: A map of escaped control characters and their unescaped
	        // equivalents.
	        var Unescapes = {
	          92: "\\",
	          34: '"',
	          47: "/",
	          98: "\b",
	          116: "\t",
	          110: "\n",
	          102: "\f",
	          114: "\r"
	        };

	        // Internal: Stores the parser state.
	        var Index, Source;

	        // Internal: Resets the parser state and throws a `SyntaxError`.
	        var abort = function () {
	          Index = Source = null;
	          throw SyntaxError();
	        };

	        // Internal: Returns the next token, or `"$"` if the parser has reached
	        // the end of the source string. A token may be a string, number, `null`
	        // literal, or Boolean literal.
	        var lex = function () {
	          var source = Source, length = source.length, value, begin, position, isSigned, charCode;
	          while (Index < length) {
	            charCode = source.charCodeAt(Index);
	            switch (charCode) {
	              case 9: case 10: case 13: case 32:
	                // Skip whitespace tokens, including tabs, carriage returns, line
	                // feeds, and space characters.
	                Index++;
	                break;
	              case 123: case 125: case 91: case 93: case 58: case 44:
	                // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
	                // the current position.
	                value = charIndexBuggy ? source.charAt(Index) : source[Index];
	                Index++;
	                return value;
	              case 34:
	                // `"` delimits a JSON string; advance to the next character and
	                // begin parsing the string. String tokens are prefixed with the
	                // sentinel `@` character to distinguish them from punctuators and
	                // end-of-string tokens.
	                for (value = "@", Index++; Index < length;) {
	                  charCode = source.charCodeAt(Index);
	                  if (charCode < 32) {
	                    // Unescaped ASCII control characters (those with a code unit
	                    // less than the space character) are not permitted.
	                    abort();
	                  } else if (charCode == 92) {
	                    // A reverse solidus (`\`) marks the beginning of an escaped
	                    // control character (including `"`, `\`, and `/`) or Unicode
	                    // escape sequence.
	                    charCode = source.charCodeAt(++Index);
	                    switch (charCode) {
	                      case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
	                        // Revive escaped control characters.
	                        value += Unescapes[charCode];
	                        Index++;
	                        break;
	                      case 117:
	                        // `\u` marks the beginning of a Unicode escape sequence.
	                        // Advance to the first character and validate the
	                        // four-digit code point.
	                        begin = ++Index;
	                        for (position = Index + 4; Index < position; Index++) {
	                          charCode = source.charCodeAt(Index);
	                          // A valid sequence comprises four hexdigits (case-
	                          // insensitive) that form a single hexadecimal value.
	                          if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
	                            // Invalid Unicode escape sequence.
	                            abort();
	                          }
	                        }
	                        // Revive the escaped character.
	                        value += fromCharCode("0x" + source.slice(begin, Index));
	                        break;
	                      default:
	                        // Invalid escape sequence.
	                        abort();
	                    }
	                  } else {
	                    if (charCode == 34) {
	                      // An unescaped double-quote character marks the end of the
	                      // string.
	                      break;
	                    }
	                    charCode = source.charCodeAt(Index);
	                    begin = Index;
	                    // Optimize for the common case where a string is valid.
	                    while (charCode >= 32 && charCode != 92 && charCode != 34) {
	                      charCode = source.charCodeAt(++Index);
	                    }
	                    // Append the string as-is.
	                    value += source.slice(begin, Index);
	                  }
	                }
	                if (source.charCodeAt(Index) == 34) {
	                  // Advance to the next character and return the revived string.
	                  Index++;
	                  return value;
	                }
	                // Unterminated string.
	                abort();
	              default:
	                // Parse numbers and literals.
	                begin = Index;
	                // Advance past the negative sign, if one is specified.
	                if (charCode == 45) {
	                  isSigned = true;
	                  charCode = source.charCodeAt(++Index);
	                }
	                // Parse an integer or floating-point value.
	                if (charCode >= 48 && charCode <= 57) {
	                  // Leading zeroes are interpreted as octal literals.
	                  if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
	                    // Illegal octal literal.
	                    abort();
	                  }
	                  isSigned = false;
	                  // Parse the integer component.
	                  for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
	                  // Floats cannot contain a leading decimal point; however, this
	                  // case is already accounted for by the parser.
	                  if (source.charCodeAt(Index) == 46) {
	                    position = ++Index;
	                    // Parse the decimal component.
	                    for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
	                    if (position == Index) {
	                      // Illegal trailing decimal.
	                      abort();
	                    }
	                    Index = position;
	                  }
	                  // Parse exponents. The `e` denoting the exponent is
	                  // case-insensitive.
	                  charCode = source.charCodeAt(Index);
	                  if (charCode == 101 || charCode == 69) {
	                    charCode = source.charCodeAt(++Index);
	                    // Skip past the sign following the exponent, if one is
	                    // specified.
	                    if (charCode == 43 || charCode == 45) {
	                      Index++;
	                    }
	                    // Parse the exponential component.
	                    for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
	                    if (position == Index) {
	                      // Illegal empty exponent.
	                      abort();
	                    }
	                    Index = position;
	                  }
	                  // Coerce the parsed value to a JavaScript number.
	                  return +source.slice(begin, Index);
	                }
	                // A negative sign may only precede numbers.
	                if (isSigned) {
	                  abort();
	                }
	                // `true`, `false`, and `null` literals.
	                if (source.slice(Index, Index + 4) == "true") {
	                  Index += 4;
	                  return true;
	                } else if (source.slice(Index, Index + 5) == "false") {
	                  Index += 5;
	                  return false;
	                } else if (source.slice(Index, Index + 4) == "null") {
	                  Index += 4;
	                  return null;
	                }
	                // Unrecognized token.
	                abort();
	            }
	          }
	          // Return the sentinel `$` character if the parser has reached the end
	          // of the source string.
	          return "$";
	        };

	        // Internal: Parses a JSON `value` token.
	        var get = function (value) {
	          var results, hasMembers;
	          if (value == "$") {
	            // Unexpected end of input.
	            abort();
	          }
	          if (typeof value == "string") {
	            if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
	              // Remove the sentinel `@` character.
	              return value.slice(1);
	            }
	            // Parse object and array literals.
	            if (value == "[") {
	              // Parses a JSON array, returning a new JavaScript array.
	              results = [];
	              for (;; hasMembers || (hasMembers = true)) {
	                value = lex();
	                // A closing square bracket marks the end of the array literal.
	                if (value == "]") {
	                  break;
	                }
	                // If the array literal contains elements, the current token
	                // should be a comma separating the previous element from the
	                // next.
	                if (hasMembers) {
	                  if (value == ",") {
	                    value = lex();
	                    if (value == "]") {
	                      // Unexpected trailing `,` in array literal.
	                      abort();
	                    }
	                  } else {
	                    // A `,` must separate each array element.
	                    abort();
	                  }
	                }
	                // Elisions and leading commas are not permitted.
	                if (value == ",") {
	                  abort();
	                }
	                results.push(get(value));
	              }
	              return results;
	            } else if (value == "{") {
	              // Parses a JSON object, returning a new JavaScript object.
	              results = {};
	              for (;; hasMembers || (hasMembers = true)) {
	                value = lex();
	                // A closing curly brace marks the end of the object literal.
	                if (value == "}") {
	                  break;
	                }
	                // If the object literal contains members, the current token
	                // should be a comma separator.
	                if (hasMembers) {
	                  if (value == ",") {
	                    value = lex();
	                    if (value == "}") {
	                      // Unexpected trailing `,` in object literal.
	                      abort();
	                    }
	                  } else {
	                    // A `,` must separate each object member.
	                    abort();
	                  }
	                }
	                // Leading commas are not permitted, object property names must be
	                // double-quoted strings, and a `:` must separate each property
	                // name and value.
	                if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
	                  abort();
	                }
	                results[value.slice(1)] = get(lex());
	              }
	              return results;
	            }
	            // Unexpected token encountered.
	            abort();
	          }
	          return value;
	        };

	        // Internal: Updates a traversed object member.
	        var update = function (source, property, callback) {
	          var element = walk(source, property, callback);
	          if (element === undef) {
	            delete source[property];
	          } else {
	            source[property] = element;
	          }
	        };

	        // Internal: Recursively traverses a parsed JSON object, invoking the
	        // `callback` function for each value. This is an implementation of the
	        // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
	        var walk = function (source, property, callback) {
	          var value = source[property], length;
	          if (typeof value == "object" && value) {
	            // `forEach` can't be used to traverse an array in Opera <= 8.54
	            // because its `Object#hasOwnProperty` implementation returns `false`
	            // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
	            if (getClass.call(value) == arrayClass) {
	              for (length = value.length; length--;) {
	                update(value, length, callback);
	              }
	            } else {
	              forEach(value, function (property) {
	                update(value, property, callback);
	              });
	            }
	          }
	          return callback.call(source, property, value);
	        };

	        // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
	        exports.parse = function (source, callback) {
	          var result, value;
	          Index = 0;
	          Source = "" + source;
	          result = get(lex());
	          // If a JSON string contains multiple tokens, it is invalid.
	          if (lex() != "$") {
	            abort();
	          }
	          // Reset the parser state.
	          Index = Source = null;
	          return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
	        };
	      }
	    }

	    exports["runInContext"] = runInContext;
	    return exports;
	  }

	  if (freeExports && !isLoader) {
	    // Export for CommonJS environments.
	    runInContext(root, freeExports);
	  } else {
	    // Export for web browsers and JavaScript engines.
	    var nativeJSON = root.JSON,
	        previousJSON = root["JSON3"],
	        isRestored = false;

	    var JSON3 = runInContext(root, (root["JSON3"] = {
	      // Public: Restores the original value of the global `JSON` object and
	      // returns a reference to the `JSON3` object.
	      "noConflict": function () {
	        if (!isRestored) {
	          isRestored = true;
	          root.JSON = nativeJSON;
	          root["JSON3"] = previousJSON;
	          nativeJSON = previousJSON = null;
	        }
	        return JSON3;
	      }
	    }));

	    root.JSON = {
	      "parse": JSON3.parse,
	      "stringify": JSON3.stringify
	    };
	  }

	  // Export for asynchronous module loaders.
	  if (isLoader) {
	    !(__WEBPACK_AMD_DEFINE_RESULT__ = function () {
	      return JSON3;
	    }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  }
	}).call(this);

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(19)(module), (function() { return this; }())))

/***/ },
/* 19 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 20 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {module.exports = __webpack_amd_options__;

	/* WEBPACK VAR INJECTION */}.call(exports, {}))

/***/ },
/* 21 */
/***/ function(module, exports) {

	
	/**
	 * Expose `Emitter`.
	 */

	module.exports = Emitter;

	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */

	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};

	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */

	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}

	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks[event] = this._callbacks[event] || [])
	    .push(fn);
	  return this;
	};

	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.once = function(event, fn){
	  var self = this;
	  this._callbacks = this._callbacks || {};

	  function on() {
	    self.off(event, on);
	    fn.apply(this, arguments);
	  }

	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};

	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};

	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }

	  // specific event
	  var callbacks = this._callbacks[event];
	  if (!callbacks) return this;

	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks[event];
	    return this;
	  }

	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};

	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */

	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks[event];

	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }

	  return this;
	};

	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */

	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks[event] || [];
	};

	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */

	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {/*global Blob,File*/

	/**
	 * Module requirements
	 */

	var isArray = __webpack_require__(23);
	var isBuf = __webpack_require__(24);

	/**
	 * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
	 * Anything with blobs or files should be fed through removeBlobs before coming
	 * here.
	 *
	 * @param {Object} packet - socket.io event packet
	 * @return {Object} with deconstructed packet and list of buffers
	 * @api public
	 */

	exports.deconstructPacket = function(packet){
	  var buffers = [];
	  var packetData = packet.data;

	  function _deconstructPacket(data) {
	    if (!data) return data;

	    if (isBuf(data)) {
	      var placeholder = { _placeholder: true, num: buffers.length };
	      buffers.push(data);
	      return placeholder;
	    } else if (isArray(data)) {
	      var newData = new Array(data.length);
	      for (var i = 0; i < data.length; i++) {
	        newData[i] = _deconstructPacket(data[i]);
	      }
	      return newData;
	    } else if ('object' == typeof data && !(data instanceof Date)) {
	      var newData = {};
	      for (var key in data) {
	        newData[key] = _deconstructPacket(data[key]);
	      }
	      return newData;
	    }
	    return data;
	  }

	  var pack = packet;
	  pack.data = _deconstructPacket(packetData);
	  pack.attachments = buffers.length; // number of binary 'attachments'
	  return {packet: pack, buffers: buffers};
	};

	/**
	 * Reconstructs a binary packet from its placeholder packet and buffers
	 *
	 * @param {Object} packet - event packet with placeholders
	 * @param {Array} buffers - binary buffers to put in placeholder positions
	 * @return {Object} reconstructed packet
	 * @api public
	 */

	exports.reconstructPacket = function(packet, buffers) {
	  var curPlaceHolder = 0;

	  function _reconstructPacket(data) {
	    if (data && data._placeholder) {
	      var buf = buffers[data.num]; // appropriate buffer (should be natural order anyway)
	      return buf;
	    } else if (isArray(data)) {
	      for (var i = 0; i < data.length; i++) {
	        data[i] = _reconstructPacket(data[i]);
	      }
	      return data;
	    } else if (data && 'object' == typeof data) {
	      for (var key in data) {
	        data[key] = _reconstructPacket(data[key]);
	      }
	      return data;
	    }
	    return data;
	  }

	  packet.data = _reconstructPacket(packet.data);
	  packet.attachments = undefined; // no longer useful
	  return packet;
	};

	/**
	 * Asynchronously removes Blobs or Files from data via
	 * FileReader's readAsArrayBuffer method. Used before encoding
	 * data as msgpack. Calls callback with the blobless data.
	 *
	 * @param {Object} data
	 * @param {Function} callback
	 * @api private
	 */

	exports.removeBlobs = function(data, callback) {
	  function _removeBlobs(obj, curKey, containingObject) {
	    if (!obj) return obj;

	    // convert any blob
	    if ((global.Blob && obj instanceof Blob) ||
	        (global.File && obj instanceof File)) {
	      pendingBlobs++;

	      // async filereader
	      var fileReader = new FileReader();
	      fileReader.onload = function() { // this.result == arraybuffer
	        if (containingObject) {
	          containingObject[curKey] = this.result;
	        }
	        else {
	          bloblessData = this.result;
	        }

	        // if nothing pending its callback time
	        if(! --pendingBlobs) {
	          callback(bloblessData);
	        }
	      };

	      fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
	    } else if (isArray(obj)) { // handle array
	      for (var i = 0; i < obj.length; i++) {
	        _removeBlobs(obj[i], i, obj);
	      }
	    } else if (obj && 'object' == typeof obj && !isBuf(obj)) { // and object
	      for (var key in obj) {
	        _removeBlobs(obj[key], key, obj);
	      }
	    }
	  }

	  var pendingBlobs = 0;
	  var bloblessData = data;
	  _removeBlobs(bloblessData);
	  if (!pendingBlobs) {
	    callback(bloblessData);
	  }
	};

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 23 */
/***/ function(module, exports) {

	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};


/***/ },
/* 24 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {
	module.exports = isBuf;

	/**
	 * Returns true if obj is a buffer or an arraybuffer.
	 *
	 * @api private
	 */

	function isBuf(obj) {
	  return (global.Buffer && global.Buffer.isBuffer(obj)) ||
	         (global.ArrayBuffer && obj instanceof ArrayBuffer);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var eio = __webpack_require__(26);
	var Socket = __webpack_require__(54);
	var Emitter = __webpack_require__(7);
	var parser = __webpack_require__(14);
	var on = __webpack_require__(56);
	var bind = __webpack_require__(57);
	var debug = __webpack_require__(11)('socket.io-client:manager');
	var indexOf = __webpack_require__(52);
	var Backoff = __webpack_require__(58);

	/**
	 * IE6+ hasOwnProperty
	 */

	var has = Object.prototype.hasOwnProperty;

	/**
	 * Module exports
	 */

	module.exports = Manager;

	/**
	 * `Manager` constructor.
	 *
	 * @param {String} engine instance or engine uri/opts
	 * @param {Object} options
	 * @api public
	 */

	function Manager (uri, opts) {
	  if (!(this instanceof Manager)) return new Manager(uri, opts);
	  if (uri && ('object' === typeof uri)) {
	    opts = uri;
	    uri = undefined;
	  }
	  opts = opts || {};

	  opts.path = opts.path || '/socket.io';
	  this.nsps = {};
	  this.subs = [];
	  this.opts = opts;
	  this.reconnection(opts.reconnection !== false);
	  this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
	  this.reconnectionDelay(opts.reconnectionDelay || 1000);
	  this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
	  this.randomizationFactor(opts.randomizationFactor || 0.5);
	  this.backoff = new Backoff({
	    min: this.reconnectionDelay(),
	    max: this.reconnectionDelayMax(),
	    jitter: this.randomizationFactor()
	  });
	  this.timeout(null == opts.timeout ? 20000 : opts.timeout);
	  this.readyState = 'closed';
	  this.uri = uri;
	  this.connecting = [];
	  this.lastPing = null;
	  this.encoding = false;
	  this.packetBuffer = [];
	  this.encoder = new parser.Encoder();
	  this.decoder = new parser.Decoder();
	  this.autoConnect = opts.autoConnect !== false;
	  if (this.autoConnect) this.open();
	}

	/**
	 * Propagate given event to sockets and emit on `this`
	 *
	 * @api private
	 */

	Manager.prototype.emitAll = function () {
	  this.emit.apply(this, arguments);
	  for (var nsp in this.nsps) {
	    if (has.call(this.nsps, nsp)) {
	      this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
	    }
	  }
	};

	/**
	 * Update `socket.id` of all sockets
	 *
	 * @api private
	 */

	Manager.prototype.updateSocketIds = function () {
	  for (var nsp in this.nsps) {
	    if (has.call(this.nsps, nsp)) {
	      this.nsps[nsp].id = this.engine.id;
	    }
	  }
	};

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Manager.prototype);

	/**
	 * Sets the `reconnection` config.
	 *
	 * @param {Boolean} true/false if it should automatically reconnect
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.reconnection = function (v) {
	  if (!arguments.length) return this._reconnection;
	  this._reconnection = !!v;
	  return this;
	};

	/**
	 * Sets the reconnection attempts config.
	 *
	 * @param {Number} max reconnection attempts before giving up
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.reconnectionAttempts = function (v) {
	  if (!arguments.length) return this._reconnectionAttempts;
	  this._reconnectionAttempts = v;
	  return this;
	};

	/**
	 * Sets the delay between reconnections.
	 *
	 * @param {Number} delay
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.reconnectionDelay = function (v) {
	  if (!arguments.length) return this._reconnectionDelay;
	  this._reconnectionDelay = v;
	  this.backoff && this.backoff.setMin(v);
	  return this;
	};

	Manager.prototype.randomizationFactor = function (v) {
	  if (!arguments.length) return this._randomizationFactor;
	  this._randomizationFactor = v;
	  this.backoff && this.backoff.setJitter(v);
	  return this;
	};

	/**
	 * Sets the maximum delay between reconnections.
	 *
	 * @param {Number} delay
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.reconnectionDelayMax = function (v) {
	  if (!arguments.length) return this._reconnectionDelayMax;
	  this._reconnectionDelayMax = v;
	  this.backoff && this.backoff.setMax(v);
	  return this;
	};

	/**
	 * Sets the connection timeout. `false` to disable
	 *
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.timeout = function (v) {
	  if (!arguments.length) return this._timeout;
	  this._timeout = v;
	  return this;
	};

	/**
	 * Starts trying to reconnect if reconnection is enabled and we have not
	 * started reconnecting yet
	 *
	 * @api private
	 */

	Manager.prototype.maybeReconnectOnOpen = function () {
	  // Only try to reconnect if it's the first time we're connecting
	  if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
	    // keeps reconnection from firing twice for the same reconnection loop
	    this.reconnect();
	  }
	};

	/**
	 * Sets the current transport `socket`.
	 *
	 * @param {Function} optional, callback
	 * @return {Manager} self
	 * @api public
	 */

	Manager.prototype.open =
	Manager.prototype.connect = function (fn, opts) {
	  debug('readyState %s', this.readyState);
	  if (~this.readyState.indexOf('open')) return this;

	  debug('opening %s', this.uri);
	  this.engine = eio(this.uri, this.opts);
	  var socket = this.engine;
	  var self = this;
	  this.readyState = 'opening';
	  this.skipReconnect = false;

	  // emit `open`
	  var openSub = on(socket, 'open', function () {
	    self.onopen();
	    fn && fn();
	  });

	  // emit `connect_error`
	  var errorSub = on(socket, 'error', function (data) {
	    debug('connect_error');
	    self.cleanup();
	    self.readyState = 'closed';
	    self.emitAll('connect_error', data);
	    if (fn) {
	      var err = new Error('Connection error');
	      err.data = data;
	      fn(err);
	    } else {
	      // Only do this if there is no fn to handle the error
	      self.maybeReconnectOnOpen();
	    }
	  });

	  // emit `connect_timeout`
	  if (false !== this._timeout) {
	    var timeout = this._timeout;
	    debug('connect attempt will timeout after %d', timeout);

	    // set timer
	    var timer = setTimeout(function () {
	      debug('connect attempt timed out after %d', timeout);
	      openSub.destroy();
	      socket.close();
	      socket.emit('error', 'timeout');
	      self.emitAll('connect_timeout', timeout);
	    }, timeout);

	    this.subs.push({
	      destroy: function () {
	        clearTimeout(timer);
	      }
	    });
	  }

	  this.subs.push(openSub);
	  this.subs.push(errorSub);

	  return this;
	};

	/**
	 * Called upon transport open.
	 *
	 * @api private
	 */

	Manager.prototype.onopen = function () {
	  debug('open');

	  // clear old subs
	  this.cleanup();

	  // mark as open
	  this.readyState = 'open';
	  this.emit('open');

	  // add new subs
	  var socket = this.engine;
	  this.subs.push(on(socket, 'data', bind(this, 'ondata')));
	  this.subs.push(on(socket, 'ping', bind(this, 'onping')));
	  this.subs.push(on(socket, 'pong', bind(this, 'onpong')));
	  this.subs.push(on(socket, 'error', bind(this, 'onerror')));
	  this.subs.push(on(socket, 'close', bind(this, 'onclose')));
	  this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
	};

	/**
	 * Called upon a ping.
	 *
	 * @api private
	 */

	Manager.prototype.onping = function () {
	  this.lastPing = new Date();
	  this.emitAll('ping');
	};

	/**
	 * Called upon a packet.
	 *
	 * @api private
	 */

	Manager.prototype.onpong = function () {
	  this.emitAll('pong', new Date() - this.lastPing);
	};

	/**
	 * Called with data.
	 *
	 * @api private
	 */

	Manager.prototype.ondata = function (data) {
	  this.decoder.add(data);
	};

	/**
	 * Called when parser fully decodes a packet.
	 *
	 * @api private
	 */

	Manager.prototype.ondecoded = function (packet) {
	  this.emit('packet', packet);
	};

	/**
	 * Called upon socket error.
	 *
	 * @api private
	 */

	Manager.prototype.onerror = function (err) {
	  debug('error', err);
	  this.emitAll('error', err);
	};

	/**
	 * Creates a new socket for the given `nsp`.
	 *
	 * @return {Socket}
	 * @api public
	 */

	Manager.prototype.socket = function (nsp, opts) {
	  var socket = this.nsps[nsp];
	  if (!socket) {
	    socket = new Socket(this, nsp, opts);
	    this.nsps[nsp] = socket;
	    var self = this;
	    socket.on('connecting', onConnecting);
	    socket.on('connect', function () {
	      socket.id = self.engine.id;
	    });

	    if (this.autoConnect) {
	      // manually call here since connecting evnet is fired before listening
	      onConnecting();
	    }
	  }

	  function onConnecting () {
	    if (!~indexOf(self.connecting, socket)) {
	      self.connecting.push(socket);
	    }
	  }

	  return socket;
	};

	/**
	 * Called upon a socket close.
	 *
	 * @param {Socket} socket
	 */

	Manager.prototype.destroy = function (socket) {
	  var index = indexOf(this.connecting, socket);
	  if (~index) this.connecting.splice(index, 1);
	  if (this.connecting.length) return;

	  this.close();
	};

	/**
	 * Writes a packet.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Manager.prototype.packet = function (packet) {
	  debug('writing packet %j', packet);
	  var self = this;
	  if (packet.query && packet.type === 0) packet.nsp += '?' + packet.query;

	  if (!self.encoding) {
	    // encode, then write to engine with result
	    self.encoding = true;
	    this.encoder.encode(packet, function (encodedPackets) {
	      for (var i = 0; i < encodedPackets.length; i++) {
	        self.engine.write(encodedPackets[i], packet.options);
	      }
	      self.encoding = false;
	      self.processPacketQueue();
	    });
	  } else { // add packet to the queue
	    self.packetBuffer.push(packet);
	  }
	};

	/**
	 * If packet buffer is non-empty, begins encoding the
	 * next packet in line.
	 *
	 * @api private
	 */

	Manager.prototype.processPacketQueue = function () {
	  if (this.packetBuffer.length > 0 && !this.encoding) {
	    var pack = this.packetBuffer.shift();
	    this.packet(pack);
	  }
	};

	/**
	 * Clean up transport subscriptions and packet buffer.
	 *
	 * @api private
	 */

	Manager.prototype.cleanup = function () {
	  debug('cleanup');

	  var subsLength = this.subs.length;
	  for (var i = 0; i < subsLength; i++) {
	    var sub = this.subs.shift();
	    sub.destroy();
	  }

	  this.packetBuffer = [];
	  this.encoding = false;
	  this.lastPing = null;

	  this.decoder.destroy();
	};

	/**
	 * Close the current socket.
	 *
	 * @api private
	 */

	Manager.prototype.close =
	Manager.prototype.disconnect = function () {
	  debug('disconnect');
	  this.skipReconnect = true;
	  this.reconnecting = false;
	  if ('opening' === this.readyState) {
	    // `onclose` will not fire because
	    // an open event never happened
	    this.cleanup();
	  }
	  this.backoff.reset();
	  this.readyState = 'closed';
	  if (this.engine) this.engine.close();
	};

	/**
	 * Called upon engine close.
	 *
	 * @api private
	 */

	Manager.prototype.onclose = function (reason) {
	  debug('onclose');

	  this.cleanup();
	  this.backoff.reset();
	  this.readyState = 'closed';
	  this.emit('close', reason);

	  if (this._reconnection && !this.skipReconnect) {
	    this.reconnect();
	  }
	};

	/**
	 * Attempt a reconnection.
	 *
	 * @api private
	 */

	Manager.prototype.reconnect = function () {
	  if (this.reconnecting || this.skipReconnect) return this;

	  var self = this;

	  if (this.backoff.attempts >= this._reconnectionAttempts) {
	    debug('reconnect failed');
	    this.backoff.reset();
	    this.emitAll('reconnect_failed');
	    this.reconnecting = false;
	  } else {
	    var delay = this.backoff.duration();
	    debug('will wait %dms before reconnect attempt', delay);

	    this.reconnecting = true;
	    var timer = setTimeout(function () {
	      if (self.skipReconnect) return;

	      debug('attempting reconnect');
	      self.emitAll('reconnect_attempt', self.backoff.attempts);
	      self.emitAll('reconnecting', self.backoff.attempts);

	      // check again for the case socket closed in above events
	      if (self.skipReconnect) return;

	      self.open(function (err) {
	        if (err) {
	          debug('reconnect attempt error');
	          self.reconnecting = false;
	          self.reconnect();
	          self.emitAll('reconnect_error', err.data);
	        } else {
	          debug('reconnect success');
	          self.onreconnect();
	        }
	      });
	    }, delay);

	    this.subs.push({
	      destroy: function () {
	        clearTimeout(timer);
	      }
	    });
	  }
	};

	/**
	 * Called upon successful reconnect.
	 *
	 * @api private
	 */

	Manager.prototype.onreconnect = function () {
	  var attempt = this.backoff.attempts;
	  this.reconnecting = false;
	  this.backoff.reset();
	  this.updateSocketIds();
	  this.emitAll('reconnect', attempt);
	};


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	
	module.exports = __webpack_require__(27);


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	
	module.exports = __webpack_require__(28);

	/**
	 * Exports parser
	 *
	 * @api public
	 *
	 */
	module.exports.parser = __webpack_require__(35);


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * Module dependencies.
	 */

	var transports = __webpack_require__(29);
	var Emitter = __webpack_require__(7);
	var debug = __webpack_require__(46)('engine.io-client:socket');
	var index = __webpack_require__(52);
	var parser = __webpack_require__(35);
	var parseuri = __webpack_require__(10);
	var parsejson = __webpack_require__(53);
	var parseqs = __webpack_require__(43);

	/**
	 * Module exports.
	 */

	module.exports = Socket;

	/**
	 * Socket constructor.
	 *
	 * @param {String|Object} uri or options
	 * @param {Object} options
	 * @api public
	 */

	function Socket (uri, opts) {
	  if (!(this instanceof Socket)) return new Socket(uri, opts);

	  opts = opts || {};

	  if (uri && 'object' === typeof uri) {
	    opts = uri;
	    uri = null;
	  }

	  if (uri) {
	    uri = parseuri(uri);
	    opts.hostname = uri.host;
	    opts.secure = uri.protocol === 'https' || uri.protocol === 'wss';
	    opts.port = uri.port;
	    if (uri.query) opts.query = uri.query;
	  } else if (opts.host) {
	    opts.hostname = parseuri(opts.host).host;
	  }

	  this.secure = null != opts.secure ? opts.secure
	    : (global.location && 'https:' === location.protocol);

	  if (opts.hostname && !opts.port) {
	    // if no port is specified manually, use the protocol default
	    opts.port = this.secure ? '443' : '80';
	  }

	  this.agent = opts.agent || false;
	  this.hostname = opts.hostname ||
	    (global.location ? location.hostname : 'localhost');
	  this.port = opts.port || (global.location && location.port
	      ? location.port
	      : (this.secure ? 443 : 80));
	  this.query = opts.query || {};
	  if ('string' === typeof this.query) this.query = parseqs.decode(this.query);
	  this.upgrade = false !== opts.upgrade;
	  this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
	  this.forceJSONP = !!opts.forceJSONP;
	  this.jsonp = false !== opts.jsonp;
	  this.forceBase64 = !!opts.forceBase64;
	  this.enablesXDR = !!opts.enablesXDR;
	  this.timestampParam = opts.timestampParam || 't';
	  this.timestampRequests = opts.timestampRequests;
	  this.transports = opts.transports || ['polling', 'websocket'];
	  this.readyState = '';
	  this.writeBuffer = [];
	  this.prevBufferLen = 0;
	  this.policyPort = opts.policyPort || 843;
	  this.rememberUpgrade = opts.rememberUpgrade || false;
	  this.binaryType = null;
	  this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
	  this.perMessageDeflate = false !== opts.perMessageDeflate ? (opts.perMessageDeflate || {}) : false;

	  if (true === this.perMessageDeflate) this.perMessageDeflate = {};
	  if (this.perMessageDeflate && null == this.perMessageDeflate.threshold) {
	    this.perMessageDeflate.threshold = 1024;
	  }

	  // SSL options for Node.js client
	  this.pfx = opts.pfx || null;
	  this.key = opts.key || null;
	  this.passphrase = opts.passphrase || null;
	  this.cert = opts.cert || null;
	  this.ca = opts.ca || null;
	  this.ciphers = opts.ciphers || null;
	  this.rejectUnauthorized = opts.rejectUnauthorized === undefined ? null : opts.rejectUnauthorized;
	  this.forceNode = !!opts.forceNode;

	  // other options for Node.js client
	  var freeGlobal = typeof global === 'object' && global;
	  if (freeGlobal.global === freeGlobal) {
	    if (opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0) {
	      this.extraHeaders = opts.extraHeaders;
	    }

	    if (opts.localAddress) {
	      this.localAddress = opts.localAddress;
	    }
	  }

	  // set on handshake
	  this.id = null;
	  this.upgrades = null;
	  this.pingInterval = null;
	  this.pingTimeout = null;

	  // set on heartbeat
	  this.pingIntervalTimer = null;
	  this.pingTimeoutTimer = null;

	  this.open();
	}

	Socket.priorWebsocketSuccess = false;

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Socket.prototype);

	/**
	 * Protocol version.
	 *
	 * @api public
	 */

	Socket.protocol = parser.protocol; // this is an int

	/**
	 * Expose deps for legacy compatibility
	 * and standalone browser access.
	 */

	Socket.Socket = Socket;
	Socket.Transport = __webpack_require__(34);
	Socket.transports = __webpack_require__(29);
	Socket.parser = __webpack_require__(35);

	/**
	 * Creates transport of the given type.
	 *
	 * @param {String} transport name
	 * @return {Transport}
	 * @api private
	 */

	Socket.prototype.createTransport = function (name) {
	  debug('creating transport "%s"', name);
	  var query = clone(this.query);

	  // append engine.io protocol identifier
	  query.EIO = parser.protocol;

	  // transport name
	  query.transport = name;

	  // session id if we already have one
	  if (this.id) query.sid = this.id;

	  var transport = new transports[name]({
	    agent: this.agent,
	    hostname: this.hostname,
	    port: this.port,
	    secure: this.secure,
	    path: this.path,
	    query: query,
	    forceJSONP: this.forceJSONP,
	    jsonp: this.jsonp,
	    forceBase64: this.forceBase64,
	    enablesXDR: this.enablesXDR,
	    timestampRequests: this.timestampRequests,
	    timestampParam: this.timestampParam,
	    policyPort: this.policyPort,
	    socket: this,
	    pfx: this.pfx,
	    key: this.key,
	    passphrase: this.passphrase,
	    cert: this.cert,
	    ca: this.ca,
	    ciphers: this.ciphers,
	    rejectUnauthorized: this.rejectUnauthorized,
	    perMessageDeflate: this.perMessageDeflate,
	    extraHeaders: this.extraHeaders,
	    forceNode: this.forceNode,
	    localAddress: this.localAddress
	  });

	  return transport;
	};

	function clone (obj) {
	  var o = {};
	  for (var i in obj) {
	    if (obj.hasOwnProperty(i)) {
	      o[i] = obj[i];
	    }
	  }
	  return o;
	}

	/**
	 * Initializes transport to use and starts probe.
	 *
	 * @api private
	 */
	Socket.prototype.open = function () {
	  var transport;
	  if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') !== -1) {
	    transport = 'websocket';
	  } else if (0 === this.transports.length) {
	    // Emit error on next tick so it can be listened to
	    var self = this;
	    setTimeout(function () {
	      self.emit('error', 'No transports available');
	    }, 0);
	    return;
	  } else {
	    transport = this.transports[0];
	  }
	  this.readyState = 'opening';

	  // Retry with the next transport if the transport is disabled (jsonp: false)
	  try {
	    transport = this.createTransport(transport);
	  } catch (e) {
	    this.transports.shift();
	    this.open();
	    return;
	  }

	  transport.open();
	  this.setTransport(transport);
	};

	/**
	 * Sets the current transport. Disables the existing one (if any).
	 *
	 * @api private
	 */

	Socket.prototype.setTransport = function (transport) {
	  debug('setting transport %s', transport.name);
	  var self = this;

	  if (this.transport) {
	    debug('clearing existing transport %s', this.transport.name);
	    this.transport.removeAllListeners();
	  }

	  // set up transport
	  this.transport = transport;

	  // set up transport listeners
	  transport
	  .on('drain', function () {
	    self.onDrain();
	  })
	  .on('packet', function (packet) {
	    self.onPacket(packet);
	  })
	  .on('error', function (e) {
	    self.onError(e);
	  })
	  .on('close', function () {
	    self.onClose('transport close');
	  });
	};

	/**
	 * Probes a transport.
	 *
	 * @param {String} transport name
	 * @api private
	 */

	Socket.prototype.probe = function (name) {
	  debug('probing transport "%s"', name);
	  var transport = this.createTransport(name, { probe: 1 });
	  var failed = false;
	  var self = this;

	  Socket.priorWebsocketSuccess = false;

	  function onTransportOpen () {
	    if (self.onlyBinaryUpgrades) {
	      var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
	      failed = failed || upgradeLosesBinary;
	    }
	    if (failed) return;

	    debug('probe transport "%s" opened', name);
	    transport.send([{ type: 'ping', data: 'probe' }]);
	    transport.once('packet', function (msg) {
	      if (failed) return;
	      if ('pong' === msg.type && 'probe' === msg.data) {
	        debug('probe transport "%s" pong', name);
	        self.upgrading = true;
	        self.emit('upgrading', transport);
	        if (!transport) return;
	        Socket.priorWebsocketSuccess = 'websocket' === transport.name;

	        debug('pausing current transport "%s"', self.transport.name);
	        self.transport.pause(function () {
	          if (failed) return;
	          if ('closed' === self.readyState) return;
	          debug('changing transport and sending upgrade packet');

	          cleanup();

	          self.setTransport(transport);
	          transport.send([{ type: 'upgrade' }]);
	          self.emit('upgrade', transport);
	          transport = null;
	          self.upgrading = false;
	          self.flush();
	        });
	      } else {
	        debug('probe transport "%s" failed', name);
	        var err = new Error('probe error');
	        err.transport = transport.name;
	        self.emit('upgradeError', err);
	      }
	    });
	  }

	  function freezeTransport () {
	    if (failed) return;

	    // Any callback called by transport should be ignored since now
	    failed = true;

	    cleanup();

	    transport.close();
	    transport = null;
	  }

	  // Handle any error that happens while probing
	  function onerror (err) {
	    var error = new Error('probe error: ' + err);
	    error.transport = transport.name;

	    freezeTransport();

	    debug('probe transport "%s" failed because of error: %s', name, err);

	    self.emit('upgradeError', error);
	  }

	  function onTransportClose () {
	    onerror('transport closed');
	  }

	  // When the socket is closed while we're probing
	  function onclose () {
	    onerror('socket closed');
	  }

	  // When the socket is upgraded while we're probing
	  function onupgrade (to) {
	    if (transport && to.name !== transport.name) {
	      debug('"%s" works - aborting "%s"', to.name, transport.name);
	      freezeTransport();
	    }
	  }

	  // Remove all listeners on the transport and on self
	  function cleanup () {
	    transport.removeListener('open', onTransportOpen);
	    transport.removeListener('error', onerror);
	    transport.removeListener('close', onTransportClose);
	    self.removeListener('close', onclose);
	    self.removeListener('upgrading', onupgrade);
	  }

	  transport.once('open', onTransportOpen);
	  transport.once('error', onerror);
	  transport.once('close', onTransportClose);

	  this.once('close', onclose);
	  this.once('upgrading', onupgrade);

	  transport.open();
	};

	/**
	 * Called when connection is deemed open.
	 *
	 * @api public
	 */

	Socket.prototype.onOpen = function () {
	  debug('socket open');
	  this.readyState = 'open';
	  Socket.priorWebsocketSuccess = 'websocket' === this.transport.name;
	  this.emit('open');
	  this.flush();

	  // we check for `readyState` in case an `open`
	  // listener already closed the socket
	  if ('open' === this.readyState && this.upgrade && this.transport.pause) {
	    debug('starting upgrade probes');
	    for (var i = 0, l = this.upgrades.length; i < l; i++) {
	      this.probe(this.upgrades[i]);
	    }
	  }
	};

	/**
	 * Handles a packet.
	 *
	 * @api private
	 */

	Socket.prototype.onPacket = function (packet) {
	  if ('opening' === this.readyState || 'open' === this.readyState ||
	      'closing' === this.readyState) {
	    debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

	    this.emit('packet', packet);

	    // Socket is live - any packet counts
	    this.emit('heartbeat');

	    switch (packet.type) {
	      case 'open':
	        this.onHandshake(parsejson(packet.data));
	        break;

	      case 'pong':
	        this.setPing();
	        this.emit('pong');
	        break;

	      case 'error':
	        var err = new Error('server error');
	        err.code = packet.data;
	        this.onError(err);
	        break;

	      case 'message':
	        this.emit('data', packet.data);
	        this.emit('message', packet.data);
	        break;
	    }
	  } else {
	    debug('packet received with socket readyState "%s"', this.readyState);
	  }
	};

	/**
	 * Called upon handshake completion.
	 *
	 * @param {Object} handshake obj
	 * @api private
	 */

	Socket.prototype.onHandshake = function (data) {
	  this.emit('handshake', data);
	  this.id = data.sid;
	  this.transport.query.sid = data.sid;
	  this.upgrades = this.filterUpgrades(data.upgrades);
	  this.pingInterval = data.pingInterval;
	  this.pingTimeout = data.pingTimeout;
	  this.onOpen();
	  // In case open handler closes socket
	  if ('closed' === this.readyState) return;
	  this.setPing();

	  // Prolong liveness of socket on heartbeat
	  this.removeListener('heartbeat', this.onHeartbeat);
	  this.on('heartbeat', this.onHeartbeat);
	};

	/**
	 * Resets ping timeout.
	 *
	 * @api private
	 */

	Socket.prototype.onHeartbeat = function (timeout) {
	  clearTimeout(this.pingTimeoutTimer);
	  var self = this;
	  self.pingTimeoutTimer = setTimeout(function () {
	    if ('closed' === self.readyState) return;
	    self.onClose('ping timeout');
	  }, timeout || (self.pingInterval + self.pingTimeout));
	};

	/**
	 * Pings server every `this.pingInterval` and expects response
	 * within `this.pingTimeout` or closes connection.
	 *
	 * @api private
	 */

	Socket.prototype.setPing = function () {
	  var self = this;
	  clearTimeout(self.pingIntervalTimer);
	  self.pingIntervalTimer = setTimeout(function () {
	    debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
	    self.ping();
	    self.onHeartbeat(self.pingTimeout);
	  }, self.pingInterval);
	};

	/**
	* Sends a ping packet.
	*
	* @api private
	*/

	Socket.prototype.ping = function () {
	  var self = this;
	  this.sendPacket('ping', function () {
	    self.emit('ping');
	  });
	};

	/**
	 * Called on `drain` event
	 *
	 * @api private
	 */

	Socket.prototype.onDrain = function () {
	  this.writeBuffer.splice(0, this.prevBufferLen);

	  // setting prevBufferLen = 0 is very important
	  // for example, when upgrading, upgrade packet is sent over,
	  // and a nonzero prevBufferLen could cause problems on `drain`
	  this.prevBufferLen = 0;

	  if (0 === this.writeBuffer.length) {
	    this.emit('drain');
	  } else {
	    this.flush();
	  }
	};

	/**
	 * Flush write buffers.
	 *
	 * @api private
	 */

	Socket.prototype.flush = function () {
	  if ('closed' !== this.readyState && this.transport.writable &&
	    !this.upgrading && this.writeBuffer.length) {
	    debug('flushing %d packets in socket', this.writeBuffer.length);
	    this.transport.send(this.writeBuffer);
	    // keep track of current length of writeBuffer
	    // splice writeBuffer and callbackBuffer on `drain`
	    this.prevBufferLen = this.writeBuffer.length;
	    this.emit('flush');
	  }
	};

	/**
	 * Sends a message.
	 *
	 * @param {String} message.
	 * @param {Function} callback function.
	 * @param {Object} options.
	 * @return {Socket} for chaining.
	 * @api public
	 */

	Socket.prototype.write =
	Socket.prototype.send = function (msg, options, fn) {
	  this.sendPacket('message', msg, options, fn);
	  return this;
	};

	/**
	 * Sends a packet.
	 *
	 * @param {String} packet type.
	 * @param {String} data.
	 * @param {Object} options.
	 * @param {Function} callback function.
	 * @api private
	 */

	Socket.prototype.sendPacket = function (type, data, options, fn) {
	  if ('function' === typeof data) {
	    fn = data;
	    data = undefined;
	  }

	  if ('function' === typeof options) {
	    fn = options;
	    options = null;
	  }

	  if ('closing' === this.readyState || 'closed' === this.readyState) {
	    return;
	  }

	  options = options || {};
	  options.compress = false !== options.compress;

	  var packet = {
	    type: type,
	    data: data,
	    options: options
	  };
	  this.emit('packetCreate', packet);
	  this.writeBuffer.push(packet);
	  if (fn) this.once('flush', fn);
	  this.flush();
	};

	/**
	 * Closes the connection.
	 *
	 * @api private
	 */

	Socket.prototype.close = function () {
	  if ('opening' === this.readyState || 'open' === this.readyState) {
	    this.readyState = 'closing';

	    var self = this;

	    if (this.writeBuffer.length) {
	      this.once('drain', function () {
	        if (this.upgrading) {
	          waitForUpgrade();
	        } else {
	          close();
	        }
	      });
	    } else if (this.upgrading) {
	      waitForUpgrade();
	    } else {
	      close();
	    }
	  }

	  function close () {
	    self.onClose('forced close');
	    debug('socket closing - telling transport to close');
	    self.transport.close();
	  }

	  function cleanupAndClose () {
	    self.removeListener('upgrade', cleanupAndClose);
	    self.removeListener('upgradeError', cleanupAndClose);
	    close();
	  }

	  function waitForUpgrade () {
	    // wait for upgrade to finish since we can't send packets while pausing a transport
	    self.once('upgrade', cleanupAndClose);
	    self.once('upgradeError', cleanupAndClose);
	  }

	  return this;
	};

	/**
	 * Called upon transport error
	 *
	 * @api private
	 */

	Socket.prototype.onError = function (err) {
	  debug('socket error %j', err);
	  Socket.priorWebsocketSuccess = false;
	  this.emit('error', err);
	  this.onClose('transport error', err);
	};

	/**
	 * Called upon transport close.
	 *
	 * @api private
	 */

	Socket.prototype.onClose = function (reason, desc) {
	  if ('opening' === this.readyState || 'open' === this.readyState || 'closing' === this.readyState) {
	    debug('socket close with reason: "%s"', reason);
	    var self = this;

	    // clear timers
	    clearTimeout(this.pingIntervalTimer);
	    clearTimeout(this.pingTimeoutTimer);

	    // stop event from firing again for transport
	    this.transport.removeAllListeners('close');

	    // ensure transport won't stay open
	    this.transport.close();

	    // ignore further transport communication
	    this.transport.removeAllListeners();

	    // set ready state
	    this.readyState = 'closed';

	    // clear session id
	    this.id = null;

	    // emit close event
	    this.emit('close', reason, desc);

	    // clean buffers after, so users can still
	    // grab the buffers on `close` event
	    self.writeBuffer = [];
	    self.prevBufferLen = 0;
	  }
	};

	/**
	 * Filters upgrades, returning only those matching client transports.
	 *
	 * @param {Array} server upgrades
	 * @api private
	 *
	 */

	Socket.prototype.filterUpgrades = function (upgrades) {
	  var filteredUpgrades = [];
	  for (var i = 0, j = upgrades.length; i < j; i++) {
	    if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
	  }
	  return filteredUpgrades;
	};

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * Module dependencies
	 */

	var XMLHttpRequest = __webpack_require__(30);
	var XHR = __webpack_require__(32);
	var JSONP = __webpack_require__(49);
	var websocket = __webpack_require__(50);

	/**
	 * Export transports.
	 */

	exports.polling = polling;
	exports.websocket = websocket;

	/**
	 * Polling transport polymorphic constructor.
	 * Decides on xhr vs jsonp based on feature detection.
	 *
	 * @api private
	 */

	function polling (opts) {
	  var xhr;
	  var xd = false;
	  var xs = false;
	  var jsonp = false !== opts.jsonp;

	  if (global.location) {
	    var isSSL = 'https:' === location.protocol;
	    var port = location.port;

	    // some user agents have empty `location.port`
	    if (!port) {
	      port = isSSL ? 443 : 80;
	    }

	    xd = opts.hostname !== location.hostname || port !== opts.port;
	    xs = opts.secure !== isSSL;
	  }

	  opts.xdomain = xd;
	  opts.xscheme = xs;
	  xhr = new XMLHttpRequest(opts);

	  if ('open' in xhr && !opts.forceJSONP) {
	    return new XHR(opts);
	  } else {
	    if (!jsonp) throw new Error('JSONP disabled');
	    return new JSONP(opts);
	  }
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {// browser shim for xmlhttprequest module

	var hasCORS = __webpack_require__(31);

	module.exports = function (opts) {
	  var xdomain = opts.xdomain;

	  // scheme must be same when usign XDomainRequest
	  // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
	  var xscheme = opts.xscheme;

	  // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
	  // https://github.com/Automattic/engine.io-client/pull/217
	  var enablesXDR = opts.enablesXDR;

	  // XMLHttpRequest can be disabled on IE
	  try {
	    if ('undefined' !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
	      return new XMLHttpRequest();
	    }
	  } catch (e) { }

	  // Use XDomainRequest for IE8 if enablesXDR is true
	  // because loading bar keeps flashing when using jsonp-polling
	  // https://github.com/yujiosaka/socke.io-ie8-loading-example
	  try {
	    if ('undefined' !== typeof XDomainRequest && !xscheme && enablesXDR) {
	      return new XDomainRequest();
	    }
	  } catch (e) { }

	  if (!xdomain) {
	    try {
	      return new global[['Active'].concat('Object').join('X')]('Microsoft.XMLHTTP');
	    } catch (e) { }
	  }
	};

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 31 */
/***/ function(module, exports) {

	
	/**
	 * Module exports.
	 *
	 * Logic borrowed from Modernizr:
	 *
	 *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
	 */

	try {
	  module.exports = typeof XMLHttpRequest !== 'undefined' &&
	    'withCredentials' in new XMLHttpRequest();
	} catch (err) {
	  // if XMLHttp support is disabled in IE then it will throw
	  // when trying to create
	  module.exports = false;
	}


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * Module requirements.
	 */

	var XMLHttpRequest = __webpack_require__(30);
	var Polling = __webpack_require__(33);
	var Emitter = __webpack_require__(7);
	var inherit = __webpack_require__(44);
	var debug = __webpack_require__(46)('engine.io-client:polling-xhr');

	/**
	 * Module exports.
	 */

	module.exports = XHR;
	module.exports.Request = Request;

	/**
	 * Empty function
	 */

	function empty () {}

	/**
	 * XHR Polling constructor.
	 *
	 * @param {Object} opts
	 * @api public
	 */

	function XHR (opts) {
	  Polling.call(this, opts);
	  this.requestTimeout = opts.requestTimeout;

	  if (global.location) {
	    var isSSL = 'https:' === location.protocol;
	    var port = location.port;

	    // some user agents have empty `location.port`
	    if (!port) {
	      port = isSSL ? 443 : 80;
	    }

	    this.xd = opts.hostname !== global.location.hostname ||
	      port !== opts.port;
	    this.xs = opts.secure !== isSSL;
	  } else {
	    this.extraHeaders = opts.extraHeaders;
	  }
	}

	/**
	 * Inherits from Polling.
	 */

	inherit(XHR, Polling);

	/**
	 * XHR supports binary
	 */

	XHR.prototype.supportsBinary = true;

	/**
	 * Creates a request.
	 *
	 * @param {String} method
	 * @api private
	 */

	XHR.prototype.request = function (opts) {
	  opts = opts || {};
	  opts.uri = this.uri();
	  opts.xd = this.xd;
	  opts.xs = this.xs;
	  opts.agent = this.agent || false;
	  opts.supportsBinary = this.supportsBinary;
	  opts.enablesXDR = this.enablesXDR;

	  // SSL options for Node.js client
	  opts.pfx = this.pfx;
	  opts.key = this.key;
	  opts.passphrase = this.passphrase;
	  opts.cert = this.cert;
	  opts.ca = this.ca;
	  opts.ciphers = this.ciphers;
	  opts.rejectUnauthorized = this.rejectUnauthorized;
	  opts.requestTimeout = this.requestTimeout;

	  // other options for Node.js client
	  opts.extraHeaders = this.extraHeaders;

	  return new Request(opts);
	};

	/**
	 * Sends data.
	 *
	 * @param {String} data to send.
	 * @param {Function} called upon flush.
	 * @api private
	 */

	XHR.prototype.doWrite = function (data, fn) {
	  var isBinary = typeof data !== 'string' && data !== undefined;
	  var req = this.request({ method: 'POST', data: data, isBinary: isBinary });
	  var self = this;
	  req.on('success', fn);
	  req.on('error', function (err) {
	    self.onError('xhr post error', err);
	  });
	  this.sendXhr = req;
	};

	/**
	 * Starts a poll cycle.
	 *
	 * @api private
	 */

	XHR.prototype.doPoll = function () {
	  debug('xhr poll');
	  var req = this.request();
	  var self = this;
	  req.on('data', function (data) {
	    self.onData(data);
	  });
	  req.on('error', function (err) {
	    self.onError('xhr poll error', err);
	  });
	  this.pollXhr = req;
	};

	/**
	 * Request constructor
	 *
	 * @param {Object} options
	 * @api public
	 */

	function Request (opts) {
	  this.method = opts.method || 'GET';
	  this.uri = opts.uri;
	  this.xd = !!opts.xd;
	  this.xs = !!opts.xs;
	  this.async = false !== opts.async;
	  this.data = undefined !== opts.data ? opts.data : null;
	  this.agent = opts.agent;
	  this.isBinary = opts.isBinary;
	  this.supportsBinary = opts.supportsBinary;
	  this.enablesXDR = opts.enablesXDR;
	  this.requestTimeout = opts.requestTimeout;

	  // SSL options for Node.js client
	  this.pfx = opts.pfx;
	  this.key = opts.key;
	  this.passphrase = opts.passphrase;
	  this.cert = opts.cert;
	  this.ca = opts.ca;
	  this.ciphers = opts.ciphers;
	  this.rejectUnauthorized = opts.rejectUnauthorized;

	  // other options for Node.js client
	  this.extraHeaders = opts.extraHeaders;

	  this.create();
	}

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Request.prototype);

	/**
	 * Creates the XHR object and sends the request.
	 *
	 * @api private
	 */

	Request.prototype.create = function () {
	  var opts = { agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR };

	  // SSL options for Node.js client
	  opts.pfx = this.pfx;
	  opts.key = this.key;
	  opts.passphrase = this.passphrase;
	  opts.cert = this.cert;
	  opts.ca = this.ca;
	  opts.ciphers = this.ciphers;
	  opts.rejectUnauthorized = this.rejectUnauthorized;

	  var xhr = this.xhr = new XMLHttpRequest(opts);
	  var self = this;

	  try {
	    debug('xhr open %s: %s', this.method, this.uri);
	    xhr.open(this.method, this.uri, this.async);
	    try {
	      if (this.extraHeaders) {
	        xhr.setDisableHeaderCheck(true);
	        for (var i in this.extraHeaders) {
	          if (this.extraHeaders.hasOwnProperty(i)) {
	            xhr.setRequestHeader(i, this.extraHeaders[i]);
	          }
	        }
	      }
	    } catch (e) {}
	    if (this.supportsBinary) {
	      // This has to be done after open because Firefox is stupid
	      // http://stackoverflow.com/questions/13216903/get-binary-data-with-xmlhttprequest-in-a-firefox-extension
	      xhr.responseType = 'arraybuffer';
	    }

	    if ('POST' === this.method) {
	      try {
	        if (this.isBinary) {
	          xhr.setRequestHeader('Content-type', 'application/octet-stream');
	        } else {
	          xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
	        }
	      } catch (e) {}
	    }

	    try {
	      xhr.setRequestHeader('Accept', '*/*');
	    } catch (e) {}

	    // ie6 check
	    if ('withCredentials' in xhr) {
	      xhr.withCredentials = true;
	    }

	    if (this.requestTimeout) {
	      xhr.timeout = this.requestTimeout;
	    }

	    if (this.hasXDR()) {
	      xhr.onload = function () {
	        self.onLoad();
	      };
	      xhr.onerror = function () {
	        self.onError(xhr.responseText);
	      };
	    } else {
	      xhr.onreadystatechange = function () {
	        if (4 !== xhr.readyState) return;
	        if (200 === xhr.status || 1223 === xhr.status) {
	          self.onLoad();
	        } else {
	          // make sure the `error` event handler that's user-set
	          // does not throw in the same tick and gets caught here
	          setTimeout(function () {
	            self.onError(xhr.status);
	          }, 0);
	        }
	      };
	    }

	    debug('xhr data %s', this.data);
	    xhr.send(this.data);
	  } catch (e) {
	    // Need to defer since .create() is called directly fhrom the constructor
	    // and thus the 'error' event can only be only bound *after* this exception
	    // occurs.  Therefore, also, we cannot throw here at all.
	    setTimeout(function () {
	      self.onError(e);
	    }, 0);
	    return;
	  }

	  if (global.document) {
	    this.index = Request.requestsCount++;
	    Request.requests[this.index] = this;
	  }
	};

	/**
	 * Called upon successful response.
	 *
	 * @api private
	 */

	Request.prototype.onSuccess = function () {
	  this.emit('success');
	  this.cleanup();
	};

	/**
	 * Called if we have data.
	 *
	 * @api private
	 */

	Request.prototype.onData = function (data) {
	  this.emit('data', data);
	  this.onSuccess();
	};

	/**
	 * Called upon error.
	 *
	 * @api private
	 */

	Request.prototype.onError = function (err) {
	  this.emit('error', err);
	  this.cleanup(true);
	};

	/**
	 * Cleans up house.
	 *
	 * @api private
	 */

	Request.prototype.cleanup = function (fromError) {
	  if ('undefined' === typeof this.xhr || null === this.xhr) {
	    return;
	  }
	  // xmlhttprequest
	  if (this.hasXDR()) {
	    this.xhr.onload = this.xhr.onerror = empty;
	  } else {
	    this.xhr.onreadystatechange = empty;
	  }

	  if (fromError) {
	    try {
	      this.xhr.abort();
	    } catch (e) {}
	  }

	  if (global.document) {
	    delete Request.requests[this.index];
	  }

	  this.xhr = null;
	};

	/**
	 * Called upon load.
	 *
	 * @api private
	 */

	Request.prototype.onLoad = function () {
	  var data;
	  try {
	    var contentType;
	    try {
	      contentType = this.xhr.getResponseHeader('Content-Type').split(';')[0];
	    } catch (e) {}
	    if (contentType === 'application/octet-stream') {
	      data = this.xhr.response || this.xhr.responseText;
	    } else {
	      if (!this.supportsBinary) {
	        data = this.xhr.responseText;
	      } else {
	        try {
	          data = String.fromCharCode.apply(null, new Uint8Array(this.xhr.response));
	        } catch (e) {
	          var ui8Arr = new Uint8Array(this.xhr.response);
	          var dataArray = [];
	          for (var idx = 0, length = ui8Arr.length; idx < length; idx++) {
	            dataArray.push(ui8Arr[idx]);
	          }

	          data = String.fromCharCode.apply(null, dataArray);
	        }
	      }
	    }
	  } catch (e) {
	    this.onError(e);
	  }
	  if (null != data) {
	    this.onData(data);
	  }
	};

	/**
	 * Check if it has XDomainRequest.
	 *
	 * @api private
	 */

	Request.prototype.hasXDR = function () {
	  return 'undefined' !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
	};

	/**
	 * Aborts the request.
	 *
	 * @api public
	 */

	Request.prototype.abort = function () {
	  this.cleanup();
	};

	/**
	 * Aborts pending requests when unloading the window. This is needed to prevent
	 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
	 * emitted.
	 */

	Request.requestsCount = 0;
	Request.requests = {};

	if (global.document) {
	  if (global.attachEvent) {
	    global.attachEvent('onunload', unloadHandler);
	  } else if (global.addEventListener) {
	    global.addEventListener('beforeunload', unloadHandler, false);
	  }
	}

	function unloadHandler () {
	  for (var i in Request.requests) {
	    if (Request.requests.hasOwnProperty(i)) {
	      Request.requests[i].abort();
	    }
	  }
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */

	var Transport = __webpack_require__(34);
	var parseqs = __webpack_require__(43);
	var parser = __webpack_require__(35);
	var inherit = __webpack_require__(44);
	var yeast = __webpack_require__(45);
	var debug = __webpack_require__(46)('engine.io-client:polling');

	/**
	 * Module exports.
	 */

	module.exports = Polling;

	/**
	 * Is XHR2 supported?
	 */

	var hasXHR2 = (function () {
	  var XMLHttpRequest = __webpack_require__(30);
	  var xhr = new XMLHttpRequest({ xdomain: false });
	  return null != xhr.responseType;
	})();

	/**
	 * Polling interface.
	 *
	 * @param {Object} opts
	 * @api private
	 */

	function Polling (opts) {
	  var forceBase64 = (opts && opts.forceBase64);
	  if (!hasXHR2 || forceBase64) {
	    this.supportsBinary = false;
	  }
	  Transport.call(this, opts);
	}

	/**
	 * Inherits from Transport.
	 */

	inherit(Polling, Transport);

	/**
	 * Transport name.
	 */

	Polling.prototype.name = 'polling';

	/**
	 * Opens the socket (triggers polling). We write a PING message to determine
	 * when the transport is open.
	 *
	 * @api private
	 */

	Polling.prototype.doOpen = function () {
	  this.poll();
	};

	/**
	 * Pauses polling.
	 *
	 * @param {Function} callback upon buffers are flushed and transport is paused
	 * @api private
	 */

	Polling.prototype.pause = function (onPause) {
	  var self = this;

	  this.readyState = 'pausing';

	  function pause () {
	    debug('paused');
	    self.readyState = 'paused';
	    onPause();
	  }

	  if (this.polling || !this.writable) {
	    var total = 0;

	    if (this.polling) {
	      debug('we are currently polling - waiting to pause');
	      total++;
	      this.once('pollComplete', function () {
	        debug('pre-pause polling complete');
	        --total || pause();
	      });
	    }

	    if (!this.writable) {
	      debug('we are currently writing - waiting to pause');
	      total++;
	      this.once('drain', function () {
	        debug('pre-pause writing complete');
	        --total || pause();
	      });
	    }
	  } else {
	    pause();
	  }
	};

	/**
	 * Starts polling cycle.
	 *
	 * @api public
	 */

	Polling.prototype.poll = function () {
	  debug('polling');
	  this.polling = true;
	  this.doPoll();
	  this.emit('poll');
	};

	/**
	 * Overloads onData to detect payloads.
	 *
	 * @api private
	 */

	Polling.prototype.onData = function (data) {
	  var self = this;
	  debug('polling got data %s', data);
	  var callback = function (packet, index, total) {
	    // if its the first message we consider the transport open
	    if ('opening' === self.readyState) {
	      self.onOpen();
	    }

	    // if its a close packet, we close the ongoing requests
	    if ('close' === packet.type) {
	      self.onClose();
	      return false;
	    }

	    // otherwise bypass onData and handle the message
	    self.onPacket(packet);
	  };

	  // decode payload
	  parser.decodePayload(data, this.socket.binaryType, callback);

	  // if an event did not trigger closing
	  if ('closed' !== this.readyState) {
	    // if we got data we're not polling
	    this.polling = false;
	    this.emit('pollComplete');

	    if ('open' === this.readyState) {
	      this.poll();
	    } else {
	      debug('ignoring poll - transport state "%s"', this.readyState);
	    }
	  }
	};

	/**
	 * For polling, send a close packet.
	 *
	 * @api private
	 */

	Polling.prototype.doClose = function () {
	  var self = this;

	  function close () {
	    debug('writing close packet');
	    self.write([{ type: 'close' }]);
	  }

	  if ('open' === this.readyState) {
	    debug('transport open - closing');
	    close();
	  } else {
	    // in case we're trying to close while
	    // handshaking is in progress (GH-164)
	    debug('transport not open - deferring close');
	    this.once('open', close);
	  }
	};

	/**
	 * Writes a packets payload.
	 *
	 * @param {Array} data packets
	 * @param {Function} drain callback
	 * @api private
	 */

	Polling.prototype.write = function (packets) {
	  var self = this;
	  this.writable = false;
	  var callbackfn = function () {
	    self.writable = true;
	    self.emit('drain');
	  };

	  parser.encodePayload(packets, this.supportsBinary, function (data) {
	    self.doWrite(data, callbackfn);
	  });
	};

	/**
	 * Generates uri for connection.
	 *
	 * @api private
	 */

	Polling.prototype.uri = function () {
	  var query = this.query || {};
	  var schema = this.secure ? 'https' : 'http';
	  var port = '';

	  // cache busting is forced
	  if (false !== this.timestampRequests) {
	    query[this.timestampParam] = yeast();
	  }

	  if (!this.supportsBinary && !query.sid) {
	    query.b64 = 1;
	  }

	  query = parseqs.encode(query);

	  // avoid port if default for schema
	  if (this.port && (('https' === schema && Number(this.port) !== 443) ||
	     ('http' === schema && Number(this.port) !== 80))) {
	    port = ':' + this.port;
	  }

	  // prepend ? to query
	  if (query.length) {
	    query = '?' + query;
	  }

	  var ipv6 = this.hostname.indexOf(':') !== -1;
	  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
	};


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */

	var parser = __webpack_require__(35);
	var Emitter = __webpack_require__(7);

	/**
	 * Module exports.
	 */

	module.exports = Transport;

	/**
	 * Transport abstract constructor.
	 *
	 * @param {Object} options.
	 * @api private
	 */

	function Transport (opts) {
	  this.path = opts.path;
	  this.hostname = opts.hostname;
	  this.port = opts.port;
	  this.secure = opts.secure;
	  this.query = opts.query;
	  this.timestampParam = opts.timestampParam;
	  this.timestampRequests = opts.timestampRequests;
	  this.readyState = '';
	  this.agent = opts.agent || false;
	  this.socket = opts.socket;
	  this.enablesXDR = opts.enablesXDR;

	  // SSL options for Node.js client
	  this.pfx = opts.pfx;
	  this.key = opts.key;
	  this.passphrase = opts.passphrase;
	  this.cert = opts.cert;
	  this.ca = opts.ca;
	  this.ciphers = opts.ciphers;
	  this.rejectUnauthorized = opts.rejectUnauthorized;
	  this.forceNode = opts.forceNode;

	  // other options for Node.js client
	  this.extraHeaders = opts.extraHeaders;
	  this.localAddress = opts.localAddress;
	}

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Transport.prototype);

	/**
	 * Emits an error.
	 *
	 * @param {String} str
	 * @return {Transport} for chaining
	 * @api public
	 */

	Transport.prototype.onError = function (msg, desc) {
	  var err = new Error(msg);
	  err.type = 'TransportError';
	  err.description = desc;
	  this.emit('error', err);
	  return this;
	};

	/**
	 * Opens the transport.
	 *
	 * @api public
	 */

	Transport.prototype.open = function () {
	  if ('closed' === this.readyState || '' === this.readyState) {
	    this.readyState = 'opening';
	    this.doOpen();
	  }

	  return this;
	};

	/**
	 * Closes the transport.
	 *
	 * @api private
	 */

	Transport.prototype.close = function () {
	  if ('opening' === this.readyState || 'open' === this.readyState) {
	    this.doClose();
	    this.onClose();
	  }

	  return this;
	};

	/**
	 * Sends multiple packets.
	 *
	 * @param {Array} packets
	 * @api private
	 */

	Transport.prototype.send = function (packets) {
	  if ('open' === this.readyState) {
	    this.write(packets);
	  } else {
	    throw new Error('Transport not open');
	  }
	};

	/**
	 * Called upon open
	 *
	 * @api private
	 */

	Transport.prototype.onOpen = function () {
	  this.readyState = 'open';
	  this.writable = true;
	  this.emit('open');
	};

	/**
	 * Called with data.
	 *
	 * @param {String} data
	 * @api private
	 */

	Transport.prototype.onData = function (data) {
	  var packet = parser.decodePacket(data, this.socket.binaryType);
	  this.onPacket(packet);
	};

	/**
	 * Called with a decoded packet.
	 */

	Transport.prototype.onPacket = function (packet) {
	  this.emit('packet', packet);
	};

	/**
	 * Called upon close.
	 *
	 * @api private
	 */

	Transport.prototype.onClose = function () {
	  this.readyState = 'closed';
	  this.emit('close');
	};


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * Module dependencies.
	 */

	var keys = __webpack_require__(36);
	var hasBinary = __webpack_require__(37);
	var sliceBuffer = __webpack_require__(38);
	var after = __webpack_require__(39);
	var utf8 = __webpack_require__(40);

	var base64encoder;
	if (global && global.ArrayBuffer) {
	  base64encoder = __webpack_require__(41);
	}

	/**
	 * Check if we are running an android browser. That requires us to use
	 * ArrayBuffer with polling transports...
	 *
	 * http://ghinda.net/jpeg-blob-ajax-android/
	 */

	var isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

	/**
	 * Check if we are running in PhantomJS.
	 * Uploading a Blob with PhantomJS does not work correctly, as reported here:
	 * https://github.com/ariya/phantomjs/issues/11395
	 * @type boolean
	 */
	var isPhantomJS = typeof navigator !== 'undefined' && /PhantomJS/i.test(navigator.userAgent);

	/**
	 * When true, avoids using Blobs to encode payloads.
	 * @type boolean
	 */
	var dontSendBlobs = isAndroid || isPhantomJS;

	/**
	 * Current protocol version.
	 */

	exports.protocol = 3;

	/**
	 * Packet types.
	 */

	var packets = exports.packets = {
	    open:     0    // non-ws
	  , close:    1    // non-ws
	  , ping:     2
	  , pong:     3
	  , message:  4
	  , upgrade:  5
	  , noop:     6
	};

	var packetslist = keys(packets);

	/**
	 * Premade error packet.
	 */

	var err = { type: 'error', data: 'parser error' };

	/**
	 * Create a blob api even for blob builder when vendor prefixes exist
	 */

	var Blob = __webpack_require__(42);

	/**
	 * Encodes a packet.
	 *
	 *     <packet type id> [ <data> ]
	 *
	 * Example:
	 *
	 *     5hello world
	 *     3
	 *     4
	 *
	 * Binary is encoded in an identical principle
	 *
	 * @api private
	 */

	exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
	  if ('function' == typeof supportsBinary) {
	    callback = supportsBinary;
	    supportsBinary = false;
	  }

	  if ('function' == typeof utf8encode) {
	    callback = utf8encode;
	    utf8encode = null;
	  }

	  var data = (packet.data === undefined)
	    ? undefined
	    : packet.data.buffer || packet.data;

	  if (global.ArrayBuffer && data instanceof ArrayBuffer) {
	    return encodeArrayBuffer(packet, supportsBinary, callback);
	  } else if (Blob && data instanceof global.Blob) {
	    return encodeBlob(packet, supportsBinary, callback);
	  }

	  // might be an object with { base64: true, data: dataAsBase64String }
	  if (data && data.base64) {
	    return encodeBase64Object(packet, callback);
	  }

	  // Sending data as a utf-8 string
	  var encoded = packets[packet.type];

	  // data fragment is optional
	  if (undefined !== packet.data) {
	    encoded += utf8encode ? utf8.encode(String(packet.data)) : String(packet.data);
	  }

	  return callback('' + encoded);

	};

	function encodeBase64Object(packet, callback) {
	  // packet data is an object { base64: true, data: dataAsBase64String }
	  var message = 'b' + exports.packets[packet.type] + packet.data.data;
	  return callback(message);
	}

	/**
	 * Encode packet helpers for binary types
	 */

	function encodeArrayBuffer(packet, supportsBinary, callback) {
	  if (!supportsBinary) {
	    return exports.encodeBase64Packet(packet, callback);
	  }

	  var data = packet.data;
	  var contentArray = new Uint8Array(data);
	  var resultBuffer = new Uint8Array(1 + data.byteLength);

	  resultBuffer[0] = packets[packet.type];
	  for (var i = 0; i < contentArray.length; i++) {
	    resultBuffer[i+1] = contentArray[i];
	  }

	  return callback(resultBuffer.buffer);
	}

	function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
	  if (!supportsBinary) {
	    return exports.encodeBase64Packet(packet, callback);
	  }

	  var fr = new FileReader();
	  fr.onload = function() {
	    packet.data = fr.result;
	    exports.encodePacket(packet, supportsBinary, true, callback);
	  };
	  return fr.readAsArrayBuffer(packet.data);
	}

	function encodeBlob(packet, supportsBinary, callback) {
	  if (!supportsBinary) {
	    return exports.encodeBase64Packet(packet, callback);
	  }

	  if (dontSendBlobs) {
	    return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
	  }

	  var length = new Uint8Array(1);
	  length[0] = packets[packet.type];
	  var blob = new Blob([length.buffer, packet.data]);

	  return callback(blob);
	}

	/**
	 * Encodes a packet with binary data in a base64 string
	 *
	 * @param {Object} packet, has `type` and `data`
	 * @return {String} base64 encoded message
	 */

	exports.encodeBase64Packet = function(packet, callback) {
	  var message = 'b' + exports.packets[packet.type];
	  if (Blob && packet.data instanceof global.Blob) {
	    var fr = new FileReader();
	    fr.onload = function() {
	      var b64 = fr.result.split(',')[1];
	      callback(message + b64);
	    };
	    return fr.readAsDataURL(packet.data);
	  }

	  var b64data;
	  try {
	    b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
	  } catch (e) {
	    // iPhone Safari doesn't let you apply with typed arrays
	    var typed = new Uint8Array(packet.data);
	    var basic = new Array(typed.length);
	    for (var i = 0; i < typed.length; i++) {
	      basic[i] = typed[i];
	    }
	    b64data = String.fromCharCode.apply(null, basic);
	  }
	  message += global.btoa(b64data);
	  return callback(message);
	};

	/**
	 * Decodes a packet. Changes format to Blob if requested.
	 *
	 * @return {Object} with `type` and `data` (if any)
	 * @api private
	 */

	exports.decodePacket = function (data, binaryType, utf8decode) {
	  if (data === undefined) {
	    return err;
	  }
	  // String data
	  if (typeof data == 'string') {
	    if (data.charAt(0) == 'b') {
	      return exports.decodeBase64Packet(data.substr(1), binaryType);
	    }

	    if (utf8decode) {
	      data = tryDecode(data);
	      if (data === false) {
	        return err;
	      }
	    }
	    var type = data.charAt(0);

	    if (Number(type) != type || !packetslist[type]) {
	      return err;
	    }

	    if (data.length > 1) {
	      return { type: packetslist[type], data: data.substring(1) };
	    } else {
	      return { type: packetslist[type] };
	    }
	  }

	  var asArray = new Uint8Array(data);
	  var type = asArray[0];
	  var rest = sliceBuffer(data, 1);
	  if (Blob && binaryType === 'blob') {
	    rest = new Blob([rest]);
	  }
	  return { type: packetslist[type], data: rest };
	};

	function tryDecode(data) {
	  try {
	    data = utf8.decode(data);
	  } catch (e) {
	    return false;
	  }
	  return data;
	}

	/**
	 * Decodes a packet encoded in a base64 string
	 *
	 * @param {String} base64 encoded message
	 * @return {Object} with `type` and `data` (if any)
	 */

	exports.decodeBase64Packet = function(msg, binaryType) {
	  var type = packetslist[msg.charAt(0)];
	  if (!base64encoder) {
	    return { type: type, data: { base64: true, data: msg.substr(1) } };
	  }

	  var data = base64encoder.decode(msg.substr(1));

	  if (binaryType === 'blob' && Blob) {
	    data = new Blob([data]);
	  }

	  return { type: type, data: data };
	};

	/**
	 * Encodes multiple messages (payload).
	 *
	 *     <length>:data
	 *
	 * Example:
	 *
	 *     11:hello world2:hi
	 *
	 * If any contents are binary, they will be encoded as base64 strings. Base64
	 * encoded strings are marked with a b before the length specifier
	 *
	 * @param {Array} packets
	 * @api private
	 */

	exports.encodePayload = function (packets, supportsBinary, callback) {
	  if (typeof supportsBinary == 'function') {
	    callback = supportsBinary;
	    supportsBinary = null;
	  }

	  var isBinary = hasBinary(packets);

	  if (supportsBinary && isBinary) {
	    if (Blob && !dontSendBlobs) {
	      return exports.encodePayloadAsBlob(packets, callback);
	    }

	    return exports.encodePayloadAsArrayBuffer(packets, callback);
	  }

	  if (!packets.length) {
	    return callback('0:');
	  }

	  function setLengthHeader(message) {
	    return message.length + ':' + message;
	  }

	  function encodeOne(packet, doneCallback) {
	    exports.encodePacket(packet, !isBinary ? false : supportsBinary, true, function(message) {
	      doneCallback(null, setLengthHeader(message));
	    });
	  }

	  map(packets, encodeOne, function(err, results) {
	    return callback(results.join(''));
	  });
	};

	/**
	 * Async array map using after
	 */

	function map(ary, each, done) {
	  var result = new Array(ary.length);
	  var next = after(ary.length, done);

	  var eachWithIndex = function(i, el, cb) {
	    each(el, function(error, msg) {
	      result[i] = msg;
	      cb(error, result);
	    });
	  };

	  for (var i = 0; i < ary.length; i++) {
	    eachWithIndex(i, ary[i], next);
	  }
	}

	/*
	 * Decodes data when a payload is maybe expected. Possible binary contents are
	 * decoded from their base64 representation
	 *
	 * @param {String} data, callback method
	 * @api public
	 */

	exports.decodePayload = function (data, binaryType, callback) {
	  if (typeof data != 'string') {
	    return exports.decodePayloadAsBinary(data, binaryType, callback);
	  }

	  if (typeof binaryType === 'function') {
	    callback = binaryType;
	    binaryType = null;
	  }

	  var packet;
	  if (data == '') {
	    // parser error - ignoring payload
	    return callback(err, 0, 1);
	  }

	  var length = ''
	    , n, msg;

	  for (var i = 0, l = data.length; i < l; i++) {
	    var chr = data.charAt(i);

	    if (':' != chr) {
	      length += chr;
	    } else {
	      if ('' == length || (length != (n = Number(length)))) {
	        // parser error - ignoring payload
	        return callback(err, 0, 1);
	      }

	      msg = data.substr(i + 1, n);

	      if (length != msg.length) {
	        // parser error - ignoring payload
	        return callback(err, 0, 1);
	      }

	      if (msg.length) {
	        packet = exports.decodePacket(msg, binaryType, true);

	        if (err.type == packet.type && err.data == packet.data) {
	          // parser error in individual packet - ignoring payload
	          return callback(err, 0, 1);
	        }

	        var ret = callback(packet, i + n, l);
	        if (false === ret) return;
	      }

	      // advance cursor
	      i += n;
	      length = '';
	    }
	  }

	  if (length != '') {
	    // parser error - ignoring payload
	    return callback(err, 0, 1);
	  }

	};

	/**
	 * Encodes multiple messages (payload) as binary.
	 *
	 * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
	 * 255><data>
	 *
	 * Example:
	 * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
	 *
	 * @param {Array} packets
	 * @return {ArrayBuffer} encoded payload
	 * @api private
	 */

	exports.encodePayloadAsArrayBuffer = function(packets, callback) {
	  if (!packets.length) {
	    return callback(new ArrayBuffer(0));
	  }

	  function encodeOne(packet, doneCallback) {
	    exports.encodePacket(packet, true, true, function(data) {
	      return doneCallback(null, data);
	    });
	  }

	  map(packets, encodeOne, function(err, encodedPackets) {
	    var totalLength = encodedPackets.reduce(function(acc, p) {
	      var len;
	      if (typeof p === 'string'){
	        len = p.length;
	      } else {
	        len = p.byteLength;
	      }
	      return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
	    }, 0);

	    var resultArray = new Uint8Array(totalLength);

	    var bufferIndex = 0;
	    encodedPackets.forEach(function(p) {
	      var isString = typeof p === 'string';
	      var ab = p;
	      if (isString) {
	        var view = new Uint8Array(p.length);
	        for (var i = 0; i < p.length; i++) {
	          view[i] = p.charCodeAt(i);
	        }
	        ab = view.buffer;
	      }

	      if (isString) { // not true binary
	        resultArray[bufferIndex++] = 0;
	      } else { // true binary
	        resultArray[bufferIndex++] = 1;
	      }

	      var lenStr = ab.byteLength.toString();
	      for (var i = 0; i < lenStr.length; i++) {
	        resultArray[bufferIndex++] = parseInt(lenStr[i]);
	      }
	      resultArray[bufferIndex++] = 255;

	      var view = new Uint8Array(ab);
	      for (var i = 0; i < view.length; i++) {
	        resultArray[bufferIndex++] = view[i];
	      }
	    });

	    return callback(resultArray.buffer);
	  });
	};

	/**
	 * Encode as Blob
	 */

	exports.encodePayloadAsBlob = function(packets, callback) {
	  function encodeOne(packet, doneCallback) {
	    exports.encodePacket(packet, true, true, function(encoded) {
	      var binaryIdentifier = new Uint8Array(1);
	      binaryIdentifier[0] = 1;
	      if (typeof encoded === 'string') {
	        var view = new Uint8Array(encoded.length);
	        for (var i = 0; i < encoded.length; i++) {
	          view[i] = encoded.charCodeAt(i);
	        }
	        encoded = view.buffer;
	        binaryIdentifier[0] = 0;
	      }

	      var len = (encoded instanceof ArrayBuffer)
	        ? encoded.byteLength
	        : encoded.size;

	      var lenStr = len.toString();
	      var lengthAry = new Uint8Array(lenStr.length + 1);
	      for (var i = 0; i < lenStr.length; i++) {
	        lengthAry[i] = parseInt(lenStr[i]);
	      }
	      lengthAry[lenStr.length] = 255;

	      if (Blob) {
	        var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
	        doneCallback(null, blob);
	      }
	    });
	  }

	  map(packets, encodeOne, function(err, results) {
	    return callback(new Blob(results));
	  });
	};

	/*
	 * Decodes data when a payload is maybe expected. Strings are decoded by
	 * interpreting each byte as a key code for entries marked to start with 0. See
	 * description of encodePayloadAsBinary
	 *
	 * @param {ArrayBuffer} data, callback method
	 * @api public
	 */

	exports.decodePayloadAsBinary = function (data, binaryType, callback) {
	  if (typeof binaryType === 'function') {
	    callback = binaryType;
	    binaryType = null;
	  }

	  var bufferTail = data;
	  var buffers = [];

	  var numberTooLong = false;
	  while (bufferTail.byteLength > 0) {
	    var tailArray = new Uint8Array(bufferTail);
	    var isString = tailArray[0] === 0;
	    var msgLength = '';

	    for (var i = 1; ; i++) {
	      if (tailArray[i] == 255) break;

	      if (msgLength.length > 310) {
	        numberTooLong = true;
	        break;
	      }

	      msgLength += tailArray[i];
	    }

	    if(numberTooLong) return callback(err, 0, 1);

	    bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
	    msgLength = parseInt(msgLength);

	    var msg = sliceBuffer(bufferTail, 0, msgLength);
	    if (isString) {
	      try {
	        msg = String.fromCharCode.apply(null, new Uint8Array(msg));
	      } catch (e) {
	        // iPhone Safari doesn't let you apply to typed arrays
	        var typed = new Uint8Array(msg);
	        msg = '';
	        for (var i = 0; i < typed.length; i++) {
	          msg += String.fromCharCode(typed[i]);
	        }
	      }
	    }

	    buffers.push(msg);
	    bufferTail = sliceBuffer(bufferTail, msgLength);
	  }

	  var total = buffers.length;
	  buffers.forEach(function(buffer, i) {
	    callback(exports.decodePacket(buffer, binaryType, true), i, total);
	  });
	};

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 36 */
/***/ function(module, exports) {

	
	/**
	 * Gets the keys for an object.
	 *
	 * @return {Array} keys
	 * @api private
	 */

	module.exports = Object.keys || function keys (obj){
	  var arr = [];
	  var has = Object.prototype.hasOwnProperty;

	  for (var i in obj) {
	    if (has.call(obj, i)) {
	      arr.push(i);
	    }
	  }
	  return arr;
	};


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {
	/*
	 * Module requirements.
	 */

	var isArray = __webpack_require__(23);

	/**
	 * Module exports.
	 */

	module.exports = hasBinary;

	/**
	 * Checks for binary data.
	 *
	 * Right now only Buffer and ArrayBuffer are supported..
	 *
	 * @param {Object} anything
	 * @api public
	 */

	function hasBinary(data) {

	  function _hasBinary(obj) {
	    if (!obj) return false;

	    if ( (global.Buffer && global.Buffer.isBuffer && global.Buffer.isBuffer(obj)) ||
	         (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
	         (global.Blob && obj instanceof Blob) ||
	         (global.File && obj instanceof File)
	        ) {
	      return true;
	    }

	    if (isArray(obj)) {
	      for (var i = 0; i < obj.length; i++) {
	          if (_hasBinary(obj[i])) {
	              return true;
	          }
	      }
	    } else if (obj && 'object' == typeof obj) {
	      // see: https://github.com/Automattic/has-binary/pull/4
	      if (obj.toJSON && 'function' == typeof obj.toJSON) {
	        obj = obj.toJSON();
	      }

	      for (var key in obj) {
	        if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
	          return true;
	        }
	      }
	    }

	    return false;
	  }

	  return _hasBinary(data);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 38 */
/***/ function(module, exports) {

	/**
	 * An abstraction for slicing an arraybuffer even when
	 * ArrayBuffer.prototype.slice is not supported
	 *
	 * @api public
	 */

	module.exports = function(arraybuffer, start, end) {
	  var bytes = arraybuffer.byteLength;
	  start = start || 0;
	  end = end || bytes;

	  if (arraybuffer.slice) { return arraybuffer.slice(start, end); }

	  if (start < 0) { start += bytes; }
	  if (end < 0) { end += bytes; }
	  if (end > bytes) { end = bytes; }

	  if (start >= bytes || start >= end || bytes === 0) {
	    return new ArrayBuffer(0);
	  }

	  var abv = new Uint8Array(arraybuffer);
	  var result = new Uint8Array(end - start);
	  for (var i = start, ii = 0; i < end; i++, ii++) {
	    result[ii] = abv[i];
	  }
	  return result.buffer;
	};


/***/ },
/* 39 */
/***/ function(module, exports) {

	module.exports = after

	function after(count, callback, err_cb) {
	    var bail = false
	    err_cb = err_cb || noop
	    proxy.count = count

	    return (count === 0) ? callback() : proxy

	    function proxy(err, result) {
	        if (proxy.count <= 0) {
	            throw new Error('after called too many times')
	        }
	        --proxy.count

	        // after first error, rest are passed to err_cb
	        if (err) {
	            bail = true
	            callback(err)
	            // future error callbacks will go to error handler
	            callback = err_cb
	        } else if (proxy.count === 0 && !bail) {
	            callback(null, result)
	        }
	    }
	}

	function noop() {}


/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module, global) {/*! https://mths.be/wtf8 v1.0.0 by @mathias */
	;(function(root) {

		// Detect free variables `exports`
		var freeExports = typeof exports == 'object' && exports;

		// Detect free variable `module`
		var freeModule = typeof module == 'object' && module &&
			module.exports == freeExports && module;

		// Detect free variable `global`, from Node.js or Browserified code,
		// and use it as `root`
		var freeGlobal = typeof global == 'object' && global;
		if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
			root = freeGlobal;
		}

		/*--------------------------------------------------------------------------*/

		var stringFromCharCode = String.fromCharCode;

		// Taken from https://mths.be/punycode
		function ucs2decode(string) {
			var output = [];
			var counter = 0;
			var length = string.length;
			var value;
			var extra;
			while (counter < length) {
				value = string.charCodeAt(counter++);
				if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
					// high surrogate, and there is a next character
					extra = string.charCodeAt(counter++);
					if ((extra & 0xFC00) == 0xDC00) { // low surrogate
						output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
					} else {
						// unmatched surrogate; only append this code unit, in case the next
						// code unit is the high surrogate of a surrogate pair
						output.push(value);
						counter--;
					}
				} else {
					output.push(value);
				}
			}
			return output;
		}

		// Taken from https://mths.be/punycode
		function ucs2encode(array) {
			var length = array.length;
			var index = -1;
			var value;
			var output = '';
			while (++index < length) {
				value = array[index];
				if (value > 0xFFFF) {
					value -= 0x10000;
					output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
					value = 0xDC00 | value & 0x3FF;
				}
				output += stringFromCharCode(value);
			}
			return output;
		}

		/*--------------------------------------------------------------------------*/

		function createByte(codePoint, shift) {
			return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
		}

		function encodeCodePoint(codePoint) {
			if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
				return stringFromCharCode(codePoint);
			}
			var symbol = '';
			if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
				symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
			}
			else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
				symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
				symbol += createByte(codePoint, 6);
			}
			else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
				symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
				symbol += createByte(codePoint, 12);
				symbol += createByte(codePoint, 6);
			}
			symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
			return symbol;
		}

		function wtf8encode(string) {
			var codePoints = ucs2decode(string);
			var length = codePoints.length;
			var index = -1;
			var codePoint;
			var byteString = '';
			while (++index < length) {
				codePoint = codePoints[index];
				byteString += encodeCodePoint(codePoint);
			}
			return byteString;
		}

		/*--------------------------------------------------------------------------*/

		function readContinuationByte() {
			if (byteIndex >= byteCount) {
				throw Error('Invalid byte index');
			}

			var continuationByte = byteArray[byteIndex] & 0xFF;
			byteIndex++;

			if ((continuationByte & 0xC0) == 0x80) {
				return continuationByte & 0x3F;
			}

			// If we end up here, it’s not a continuation byte.
			throw Error('Invalid continuation byte');
		}

		function decodeSymbol() {
			var byte1;
			var byte2;
			var byte3;
			var byte4;
			var codePoint;

			if (byteIndex > byteCount) {
				throw Error('Invalid byte index');
			}

			if (byteIndex == byteCount) {
				return false;
			}

			// Read the first byte.
			byte1 = byteArray[byteIndex] & 0xFF;
			byteIndex++;

			// 1-byte sequence (no continuation bytes)
			if ((byte1 & 0x80) == 0) {
				return byte1;
			}

			// 2-byte sequence
			if ((byte1 & 0xE0) == 0xC0) {
				var byte2 = readContinuationByte();
				codePoint = ((byte1 & 0x1F) << 6) | byte2;
				if (codePoint >= 0x80) {
					return codePoint;
				} else {
					throw Error('Invalid continuation byte');
				}
			}

			// 3-byte sequence (may include unpaired surrogates)
			if ((byte1 & 0xF0) == 0xE0) {
				byte2 = readContinuationByte();
				byte3 = readContinuationByte();
				codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
				if (codePoint >= 0x0800) {
					return codePoint;
				} else {
					throw Error('Invalid continuation byte');
				}
			}

			// 4-byte sequence
			if ((byte1 & 0xF8) == 0xF0) {
				byte2 = readContinuationByte();
				byte3 = readContinuationByte();
				byte4 = readContinuationByte();
				codePoint = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |
					(byte3 << 0x06) | byte4;
				if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
					return codePoint;
				}
			}

			throw Error('Invalid WTF-8 detected');
		}

		var byteArray;
		var byteCount;
		var byteIndex;
		function wtf8decode(byteString) {
			byteArray = ucs2decode(byteString);
			byteCount = byteArray.length;
			byteIndex = 0;
			var codePoints = [];
			var tmp;
			while ((tmp = decodeSymbol()) !== false) {
				codePoints.push(tmp);
			}
			return ucs2encode(codePoints);
		}

		/*--------------------------------------------------------------------------*/

		var wtf8 = {
			'version': '1.0.0',
			'encode': wtf8encode,
			'decode': wtf8decode
		};

		// Some AMD build optimizers, like r.js, check for specific condition patterns
		// like the following:
		if (
			true
		) {
			!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
				return wtf8;
			}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		}	else if (freeExports && !freeExports.nodeType) {
			if (freeModule) { // in Node.js or RingoJS v0.8.0+
				freeModule.exports = wtf8;
			} else { // in Narwhal or RingoJS v0.7.0-
				var object = {};
				var hasOwnProperty = object.hasOwnProperty;
				for (var key in wtf8) {
					hasOwnProperty.call(wtf8, key) && (freeExports[key] = wtf8[key]);
				}
			}
		} else { // in Rhino or a web browser
			root.wtf8 = wtf8;
		}

	}(this));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(19)(module), (function() { return this; }())))

/***/ },
/* 41 */
/***/ function(module, exports) {

	/*
	 * base64-arraybuffer
	 * https://github.com/niklasvh/base64-arraybuffer
	 *
	 * Copyright (c) 2012 Niklas von Hertzen
	 * Licensed under the MIT license.
	 */
	(function(){
	  "use strict";

	  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

	  // Use a lookup table to find the index.
	  var lookup = new Uint8Array(256);
	  for (var i = 0; i < chars.length; i++) {
	    lookup[chars.charCodeAt(i)] = i;
	  }

	  exports.encode = function(arraybuffer) {
	    var bytes = new Uint8Array(arraybuffer),
	    i, len = bytes.length, base64 = "";

	    for (i = 0; i < len; i+=3) {
	      base64 += chars[bytes[i] >> 2];
	      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
	      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
	      base64 += chars[bytes[i + 2] & 63];
	    }

	    if ((len % 3) === 2) {
	      base64 = base64.substring(0, base64.length - 1) + "=";
	    } else if (len % 3 === 1) {
	      base64 = base64.substring(0, base64.length - 2) + "==";
	    }

	    return base64;
	  };

	  exports.decode =  function(base64) {
	    var bufferLength = base64.length * 0.75,
	    len = base64.length, i, p = 0,
	    encoded1, encoded2, encoded3, encoded4;

	    if (base64[base64.length - 1] === "=") {
	      bufferLength--;
	      if (base64[base64.length - 2] === "=") {
	        bufferLength--;
	      }
	    }

	    var arraybuffer = new ArrayBuffer(bufferLength),
	    bytes = new Uint8Array(arraybuffer);

	    for (i = 0; i < len; i+=4) {
	      encoded1 = lookup[base64.charCodeAt(i)];
	      encoded2 = lookup[base64.charCodeAt(i+1)];
	      encoded3 = lookup[base64.charCodeAt(i+2)];
	      encoded4 = lookup[base64.charCodeAt(i+3)];

	      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
	      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
	      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
	    }

	    return arraybuffer;
	  };
	})();


/***/ },
/* 42 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * Create a blob builder even when vendor prefixes exist
	 */

	var BlobBuilder = global.BlobBuilder
	  || global.WebKitBlobBuilder
	  || global.MSBlobBuilder
	  || global.MozBlobBuilder;

	/**
	 * Check if Blob constructor is supported
	 */

	var blobSupported = (function() {
	  try {
	    var a = new Blob(['hi']);
	    return a.size === 2;
	  } catch(e) {
	    return false;
	  }
	})();

	/**
	 * Check if Blob constructor supports ArrayBufferViews
	 * Fails in Safari 6, so we need to map to ArrayBuffers there.
	 */

	var blobSupportsArrayBufferView = blobSupported && (function() {
	  try {
	    var b = new Blob([new Uint8Array([1,2])]);
	    return b.size === 2;
	  } catch(e) {
	    return false;
	  }
	})();

	/**
	 * Check if BlobBuilder is supported
	 */

	var blobBuilderSupported = BlobBuilder
	  && BlobBuilder.prototype.append
	  && BlobBuilder.prototype.getBlob;

	/**
	 * Helper function that maps ArrayBufferViews to ArrayBuffers
	 * Used by BlobBuilder constructor and old browsers that didn't
	 * support it in the Blob constructor.
	 */

	function mapArrayBufferViews(ary) {
	  for (var i = 0; i < ary.length; i++) {
	    var chunk = ary[i];
	    if (chunk.buffer instanceof ArrayBuffer) {
	      var buf = chunk.buffer;

	      // if this is a subarray, make a copy so we only
	      // include the subarray region from the underlying buffer
	      if (chunk.byteLength !== buf.byteLength) {
	        var copy = new Uint8Array(chunk.byteLength);
	        copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
	        buf = copy.buffer;
	      }

	      ary[i] = buf;
	    }
	  }
	}

	function BlobBuilderConstructor(ary, options) {
	  options = options || {};

	  var bb = new BlobBuilder();
	  mapArrayBufferViews(ary);

	  for (var i = 0; i < ary.length; i++) {
	    bb.append(ary[i]);
	  }

	  return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
	};

	function BlobConstructor(ary, options) {
	  mapArrayBufferViews(ary);
	  return new Blob(ary, options || {});
	};

	module.exports = (function() {
	  if (blobSupported) {
	    return blobSupportsArrayBufferView ? global.Blob : BlobConstructor;
	  } else if (blobBuilderSupported) {
	    return BlobBuilderConstructor;
	  } else {
	    return undefined;
	  }
	})();

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 43 */
/***/ function(module, exports) {

	/**
	 * Compiles a querystring
	 * Returns string representation of the object
	 *
	 * @param {Object}
	 * @api private
	 */

	exports.encode = function (obj) {
	  var str = '';

	  for (var i in obj) {
	    if (obj.hasOwnProperty(i)) {
	      if (str.length) str += '&';
	      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
	    }
	  }

	  return str;
	};

	/**
	 * Parses a simple querystring into an object
	 *
	 * @param {String} qs
	 * @api private
	 */

	exports.decode = function(qs){
	  var qry = {};
	  var pairs = qs.split('&');
	  for (var i = 0, l = pairs.length; i < l; i++) {
	    var pair = pairs[i].split('=');
	    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
	  }
	  return qry;
	};


/***/ },
/* 44 */
/***/ function(module, exports) {

	
	module.exports = function(a, b){
	  var fn = function(){};
	  fn.prototype = b.prototype;
	  a.prototype = new fn;
	  a.prototype.constructor = a;
	};

/***/ },
/* 45 */
/***/ function(module, exports) {

	'use strict';

	var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
	  , length = 64
	  , map = {}
	  , seed = 0
	  , i = 0
	  , prev;

	/**
	 * Return a string representing the specified number.
	 *
	 * @param {Number} num The number to convert.
	 * @returns {String} The string representation of the number.
	 * @api public
	 */
	function encode(num) {
	  var encoded = '';

	  do {
	    encoded = alphabet[num % length] + encoded;
	    num = Math.floor(num / length);
	  } while (num > 0);

	  return encoded;
	}

	/**
	 * Return the integer value specified by the given string.
	 *
	 * @param {String} str The string to convert.
	 * @returns {Number} The integer value represented by the string.
	 * @api public
	 */
	function decode(str) {
	  var decoded = 0;

	  for (i = 0; i < str.length; i++) {
	    decoded = decoded * length + map[str.charAt(i)];
	  }

	  return decoded;
	}

	/**
	 * Yeast: A tiny growing id generator.
	 *
	 * @returns {String} A unique id.
	 * @api public
	 */
	function yeast() {
	  var now = encode(+new Date());

	  if (now !== prev) return seed = 0, prev = now;
	  return now +'.'+ encode(seed++);
	}

	//
	// Map each character to its index.
	//
	for (; i < length; i++) map[alphabet[i]] = i;

	//
	// Expose the `yeast`, `encode` and `decode` functions.
	//
	yeast.encode = encode;
	yeast.decode = decode;
	module.exports = yeast;


/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {
	/**
	 * This is the web browser implementation of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = __webpack_require__(47);
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = 'undefined' != typeof chrome
	               && 'undefined' != typeof chrome.storage
	                  ? chrome.storage.local
	                  : localstorage();

	/**
	 * Colors.
	 */

	exports.colors = [
	  'lightseagreen',
	  'forestgreen',
	  'goldenrod',
	  'dodgerblue',
	  'darkorchid',
	  'crimson'
	];

	/**
	 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
	 * and the Firebug extension (any Firefox version) are known
	 * to support "%c" CSS customizations.
	 *
	 * TODO: add a `localStorage` variable to explicitly enable/disable colors
	 */

	function useColors() {
	  // is webkit? http://stackoverflow.com/a/16459606/376773
	  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	  return (typeof document !== 'undefined' && 'WebkitAppearance' in document.documentElement.style) ||
	    // is firebug? http://stackoverflow.com/a/398120/376773
	    (window.console && (console.firebug || (console.exception && console.table))) ||
	    // is firefox >= v31?
	    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
	    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
	}

	/**
	 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	 */

	exports.formatters.j = function(v) {
	  try {
	    return JSON.stringify(v);
	  } catch (err) {
	    return '[UnexpectedJSONParseError]: ' + err.message;
	  }
	};


	/**
	 * Colorize log arguments if enabled.
	 *
	 * @api public
	 */

	function formatArgs() {
	  var args = arguments;
	  var useColors = this.useColors;

	  args[0] = (useColors ? '%c' : '')
	    + this.namespace
	    + (useColors ? ' %c' : ' ')
	    + args[0]
	    + (useColors ? '%c ' : ' ')
	    + '+' + exports.humanize(this.diff);

	  if (!useColors) return args;

	  var c = 'color: ' + this.color;
	  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

	  // the final "%c" is somewhat tricky, because there could be other
	  // arguments passed either before or after the %c, so we need to
	  // figure out the correct index to insert the CSS into
	  var index = 0;
	  var lastC = 0;
	  args[0].replace(/%[a-z%]/g, function(match) {
	    if ('%%' === match) return;
	    index++;
	    if ('%c' === match) {
	      // we only are interested in the *last* %c
	      // (the user may have provided their own)
	      lastC = index;
	    }
	  });

	  args.splice(lastC, 0, c);
	  return args;
	}

	/**
	 * Invokes `console.log()` when available.
	 * No-op when `console.log` is not a "function".
	 *
	 * @api public
	 */

	function log() {
	  // this hackery is required for IE8/9, where
	  // the `console.log` function doesn't have 'apply'
	  return 'object' === typeof console
	    && console.log
	    && Function.prototype.apply.call(console.log, console, arguments);
	}

	/**
	 * Save `namespaces`.
	 *
	 * @param {String} namespaces
	 * @api private
	 */

	function save(namespaces) {
	  try {
	    if (null == namespaces) {
	      exports.storage.removeItem('debug');
	    } else {
	      exports.storage.debug = namespaces;
	    }
	  } catch(e) {}
	}

	/**
	 * Load `namespaces`.
	 *
	 * @return {String} returns the previously persisted debug modes
	 * @api private
	 */

	function load() {
	  var r;
	  try {
	    return exports.storage.debug;
	  } catch(e) {}

	  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	  if (typeof process !== 'undefined' && 'env' in process) {
	    return process.env.DEBUG;
	  }
	}

	/**
	 * Enable namespaces listed in `localStorage.debug` initially.
	 */

	exports.enable(load());

	/**
	 * Localstorage attempts to return the localstorage.
	 *
	 * This is necessary because safari throws
	 * when a user disables cookies/localstorage
	 * and you attempt to access it.
	 *
	 * @return {LocalStorage}
	 * @api private
	 */

	function localstorage(){
	  try {
	    return window.localStorage;
	  } catch (e) {}
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = debug.debug = debug;
	exports.coerce = coerce;
	exports.disable = disable;
	exports.enable = enable;
	exports.enabled = enabled;
	exports.humanize = __webpack_require__(48);

	/**
	 * The currently active debug mode names, and names to skip.
	 */

	exports.names = [];
	exports.skips = [];

	/**
	 * Map of special "%n" handling functions, for the debug "format" argument.
	 *
	 * Valid key names are a single, lowercased letter, i.e. "n".
	 */

	exports.formatters = {};

	/**
	 * Previously assigned color.
	 */

	var prevColor = 0;

	/**
	 * Previous log timestamp.
	 */

	var prevTime;

	/**
	 * Select a color.
	 *
	 * @return {Number}
	 * @api private
	 */

	function selectColor() {
	  return exports.colors[prevColor++ % exports.colors.length];
	}

	/**
	 * Create a debugger with the given `namespace`.
	 *
	 * @param {String} namespace
	 * @return {Function}
	 * @api public
	 */

	function debug(namespace) {

	  // define the `disabled` version
	  function disabled() {
	  }
	  disabled.enabled = false;

	  // define the `enabled` version
	  function enabled() {

	    var self = enabled;

	    // set `diff` timestamp
	    var curr = +new Date();
	    var ms = curr - (prevTime || curr);
	    self.diff = ms;
	    self.prev = prevTime;
	    self.curr = curr;
	    prevTime = curr;

	    // add the `color` if not set
	    if (null == self.useColors) self.useColors = exports.useColors();
	    if (null == self.color && self.useColors) self.color = selectColor();

	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }

	    args[0] = exports.coerce(args[0]);

	    if ('string' !== typeof args[0]) {
	      // anything else let's inspect with %o
	      args = ['%o'].concat(args);
	    }

	    // apply any `formatters` transformations
	    var index = 0;
	    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
	      // if we encounter an escaped % then don't increase the array index
	      if (match === '%%') return match;
	      index++;
	      var formatter = exports.formatters[format];
	      if ('function' === typeof formatter) {
	        var val = args[index];
	        match = formatter.call(self, val);

	        // now we need to remove `args[index]` since it's inlined in the `format`
	        args.splice(index, 1);
	        index--;
	      }
	      return match;
	    });

	    // apply env-specific formatting
	    args = exports.formatArgs.apply(self, args);

	    var logFn = enabled.log || exports.log || console.log.bind(console);
	    logFn.apply(self, args);
	  }
	  enabled.enabled = true;

	  var fn = exports.enabled(namespace) ? enabled : disabled;

	  fn.namespace = namespace;

	  return fn;
	}

	/**
	 * Enables a debug mode by namespaces. This can include modes
	 * separated by a colon and wildcards.
	 *
	 * @param {String} namespaces
	 * @api public
	 */

	function enable(namespaces) {
	  exports.save(namespaces);

	  var split = (namespaces || '').split(/[\s,]+/);
	  var len = split.length;

	  for (var i = 0; i < len; i++) {
	    if (!split[i]) continue; // ignore empty strings
	    namespaces = split[i].replace(/[\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*?');
	    if (namespaces[0] === '-') {
	      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
	    } else {
	      exports.names.push(new RegExp('^' + namespaces + '$'));
	    }
	  }
	}

	/**
	 * Disable debug output.
	 *
	 * @api public
	 */

	function disable() {
	  exports.enable('');
	}

	/**
	 * Returns true if the given mode name is enabled, false otherwise.
	 *
	 * @param {String} name
	 * @return {Boolean}
	 * @api public
	 */

	function enabled(name) {
	  var i, len;
	  for (i = 0, len = exports.skips.length; i < len; i++) {
	    if (exports.skips[i].test(name)) {
	      return false;
	    }
	  }
	  for (i = 0, len = exports.names.length; i < len; i++) {
	    if (exports.names[i].test(name)) {
	      return true;
	    }
	  }
	  return false;
	}

	/**
	 * Coerce `val`.
	 *
	 * @param {Mixed} val
	 * @return {Mixed}
	 * @api private
	 */

	function coerce(val) {
	  if (val instanceof Error) return val.stack || val.message;
	  return val;
	}


/***/ },
/* 48 */
/***/ function(module, exports) {

	/**
	 * Helpers.
	 */

	var s = 1000
	var m = s * 60
	var h = m * 60
	var d = h * 24
	var y = d * 365.25

	/**
	 * Parse or format the given `val`.
	 *
	 * Options:
	 *
	 *  - `long` verbose formatting [false]
	 *
	 * @param {String|Number} val
	 * @param {Object} options
	 * @throws {Error} throw an error if val is not a non-empty string or a number
	 * @return {String|Number}
	 * @api public
	 */

	module.exports = function (val, options) {
	  options = options || {}
	  var type = typeof val
	  if (type === 'string' && val.length > 0) {
	    return parse(val)
	  } else if (type === 'number' && isNaN(val) === false) {
	    return options.long ?
				fmtLong(val) :
				fmtShort(val)
	  }
	  throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val))
	}

	/**
	 * Parse the given `str` and return milliseconds.
	 *
	 * @param {String} str
	 * @return {Number}
	 * @api private
	 */

	function parse(str) {
	  str = String(str)
	  if (str.length > 10000) {
	    return
	  }
	  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str)
	  if (!match) {
	    return
	  }
	  var n = parseFloat(match[1])
	  var type = (match[2] || 'ms').toLowerCase()
	  switch (type) {
	    case 'years':
	    case 'year':
	    case 'yrs':
	    case 'yr':
	    case 'y':
	      return n * y
	    case 'days':
	    case 'day':
	    case 'd':
	      return n * d
	    case 'hours':
	    case 'hour':
	    case 'hrs':
	    case 'hr':
	    case 'h':
	      return n * h
	    case 'minutes':
	    case 'minute':
	    case 'mins':
	    case 'min':
	    case 'm':
	      return n * m
	    case 'seconds':
	    case 'second':
	    case 'secs':
	    case 'sec':
	    case 's':
	      return n * s
	    case 'milliseconds':
	    case 'millisecond':
	    case 'msecs':
	    case 'msec':
	    case 'ms':
	      return n
	    default:
	      return undefined
	  }
	}

	/**
	 * Short format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtShort(ms) {
	  if (ms >= d) {
	    return Math.round(ms / d) + 'd'
	  }
	  if (ms >= h) {
	    return Math.round(ms / h) + 'h'
	  }
	  if (ms >= m) {
	    return Math.round(ms / m) + 'm'
	  }
	  if (ms >= s) {
	    return Math.round(ms / s) + 's'
	  }
	  return ms + 'ms'
	}

	/**
	 * Long format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtLong(ms) {
	  return plural(ms, d, 'day') ||
	    plural(ms, h, 'hour') ||
	    plural(ms, m, 'minute') ||
	    plural(ms, s, 'second') ||
	    ms + ' ms'
	}

	/**
	 * Pluralization helper.
	 */

	function plural(ms, n, name) {
	  if (ms < n) {
	    return
	  }
	  if (ms < n * 1.5) {
	    return Math.floor(ms / n) + ' ' + name
	  }
	  return Math.ceil(ms / n) + ' ' + name + 's'
	}


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {
	/**
	 * Module requirements.
	 */

	var Polling = __webpack_require__(33);
	var inherit = __webpack_require__(44);

	/**
	 * Module exports.
	 */

	module.exports = JSONPPolling;

	/**
	 * Cached regular expressions.
	 */

	var rNewline = /\n/g;
	var rEscapedNewline = /\\n/g;

	/**
	 * Global JSONP callbacks.
	 */

	var callbacks;

	/**
	 * Noop.
	 */

	function empty () { }

	/**
	 * JSONP Polling constructor.
	 *
	 * @param {Object} opts.
	 * @api public
	 */

	function JSONPPolling (opts) {
	  Polling.call(this, opts);

	  this.query = this.query || {};

	  // define global callbacks array if not present
	  // we do this here (lazily) to avoid unneeded global pollution
	  if (!callbacks) {
	    // we need to consider multiple engines in the same page
	    if (!global.___eio) global.___eio = [];
	    callbacks = global.___eio;
	  }

	  // callback identifier
	  this.index = callbacks.length;

	  // add callback to jsonp global
	  var self = this;
	  callbacks.push(function (msg) {
	    self.onData(msg);
	  });

	  // append to query string
	  this.query.j = this.index;

	  // prevent spurious errors from being emitted when the window is unloaded
	  if (global.document && global.addEventListener) {
	    global.addEventListener('beforeunload', function () {
	      if (self.script) self.script.onerror = empty;
	    }, false);
	  }
	}

	/**
	 * Inherits from Polling.
	 */

	inherit(JSONPPolling, Polling);

	/*
	 * JSONP only supports binary as base64 encoded strings
	 */

	JSONPPolling.prototype.supportsBinary = false;

	/**
	 * Closes the socket.
	 *
	 * @api private
	 */

	JSONPPolling.prototype.doClose = function () {
	  if (this.script) {
	    this.script.parentNode.removeChild(this.script);
	    this.script = null;
	  }

	  if (this.form) {
	    this.form.parentNode.removeChild(this.form);
	    this.form = null;
	    this.iframe = null;
	  }

	  Polling.prototype.doClose.call(this);
	};

	/**
	 * Starts a poll cycle.
	 *
	 * @api private
	 */

	JSONPPolling.prototype.doPoll = function () {
	  var self = this;
	  var script = document.createElement('script');

	  if (this.script) {
	    this.script.parentNode.removeChild(this.script);
	    this.script = null;
	  }

	  script.async = true;
	  script.src = this.uri();
	  script.onerror = function (e) {
	    self.onError('jsonp poll error', e);
	  };

	  var insertAt = document.getElementsByTagName('script')[0];
	  if (insertAt) {
	    insertAt.parentNode.insertBefore(script, insertAt);
	  } else {
	    (document.head || document.body).appendChild(script);
	  }
	  this.script = script;

	  var isUAgecko = 'undefined' !== typeof navigator && /gecko/i.test(navigator.userAgent);

	  if (isUAgecko) {
	    setTimeout(function () {
	      var iframe = document.createElement('iframe');
	      document.body.appendChild(iframe);
	      document.body.removeChild(iframe);
	    }, 100);
	  }
	};

	/**
	 * Writes with a hidden iframe.
	 *
	 * @param {String} data to send
	 * @param {Function} called upon flush.
	 * @api private
	 */

	JSONPPolling.prototype.doWrite = function (data, fn) {
	  var self = this;

	  if (!this.form) {
	    var form = document.createElement('form');
	    var area = document.createElement('textarea');
	    var id = this.iframeId = 'eio_iframe_' + this.index;
	    var iframe;

	    form.className = 'socketio';
	    form.style.position = 'absolute';
	    form.style.top = '-1000px';
	    form.style.left = '-1000px';
	    form.target = id;
	    form.method = 'POST';
	    form.setAttribute('accept-charset', 'utf-8');
	    area.name = 'd';
	    form.appendChild(area);
	    document.body.appendChild(form);

	    this.form = form;
	    this.area = area;
	  }

	  this.form.action = this.uri();

	  function complete () {
	    initIframe();
	    fn();
	  }

	  function initIframe () {
	    if (self.iframe) {
	      try {
	        self.form.removeChild(self.iframe);
	      } catch (e) {
	        self.onError('jsonp polling iframe removal error', e);
	      }
	    }

	    try {
	      // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
	      var html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
	      iframe = document.createElement(html);
	    } catch (e) {
	      iframe = document.createElement('iframe');
	      iframe.name = self.iframeId;
	      iframe.src = 'javascript:0';
	    }

	    iframe.id = self.iframeId;

	    self.form.appendChild(iframe);
	    self.iframe = iframe;
	  }

	  initIframe();

	  // escape \n to prevent it from being converted into \r\n by some UAs
	  // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
	  data = data.replace(rEscapedNewline, '\\\n');
	  this.area.value = data.replace(rNewline, '\\n');

	  try {
	    this.form.submit();
	  } catch (e) {}

	  if (this.iframe.attachEvent) {
	    this.iframe.onreadystatechange = function () {
	      if (self.iframe.readyState === 'complete') {
	        complete();
	      }
	    };
	  } else {
	    this.iframe.onload = complete;
	  }
	};

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * Module dependencies.
	 */

	var Transport = __webpack_require__(34);
	var parser = __webpack_require__(35);
	var parseqs = __webpack_require__(43);
	var inherit = __webpack_require__(44);
	var yeast = __webpack_require__(45);
	var debug = __webpack_require__(46)('engine.io-client:websocket');
	var BrowserWebSocket = global.WebSocket || global.MozWebSocket;
	var NodeWebSocket;
	if (typeof window === 'undefined') {
	  try {
	    NodeWebSocket = __webpack_require__(51);
	  } catch (e) { }
	}

	/**
	 * Get either the `WebSocket` or `MozWebSocket` globals
	 * in the browser or try to resolve WebSocket-compatible
	 * interface exposed by `ws` for Node-like environment.
	 */

	var WebSocket = BrowserWebSocket;
	if (!WebSocket && typeof window === 'undefined') {
	  WebSocket = NodeWebSocket;
	}

	/**
	 * Module exports.
	 */

	module.exports = WS;

	/**
	 * WebSocket transport constructor.
	 *
	 * @api {Object} connection options
	 * @api public
	 */

	function WS (opts) {
	  var forceBase64 = (opts && opts.forceBase64);
	  if (forceBase64) {
	    this.supportsBinary = false;
	  }
	  this.perMessageDeflate = opts.perMessageDeflate;
	  this.usingBrowserWebSocket = BrowserWebSocket && !opts.forceNode;
	  if (!this.usingBrowserWebSocket) {
	    WebSocket = NodeWebSocket;
	  }
	  Transport.call(this, opts);
	}

	/**
	 * Inherits from Transport.
	 */

	inherit(WS, Transport);

	/**
	 * Transport name.
	 *
	 * @api public
	 */

	WS.prototype.name = 'websocket';

	/*
	 * WebSockets support binary
	 */

	WS.prototype.supportsBinary = true;

	/**
	 * Opens socket.
	 *
	 * @api private
	 */

	WS.prototype.doOpen = function () {
	  if (!this.check()) {
	    // let probe timeout
	    return;
	  }

	  var uri = this.uri();
	  var protocols = void (0);
	  var opts = {
	    agent: this.agent,
	    perMessageDeflate: this.perMessageDeflate
	  };

	  // SSL options for Node.js client
	  opts.pfx = this.pfx;
	  opts.key = this.key;
	  opts.passphrase = this.passphrase;
	  opts.cert = this.cert;
	  opts.ca = this.ca;
	  opts.ciphers = this.ciphers;
	  opts.rejectUnauthorized = this.rejectUnauthorized;
	  if (this.extraHeaders) {
	    opts.headers = this.extraHeaders;
	  }
	  if (this.localAddress) {
	    opts.localAddress = this.localAddress;
	  }

	  try {
	    this.ws = this.usingBrowserWebSocket ? new WebSocket(uri) : new WebSocket(uri, protocols, opts);
	  } catch (err) {
	    return this.emit('error', err);
	  }

	  if (this.ws.binaryType === undefined) {
	    this.supportsBinary = false;
	  }

	  if (this.ws.supports && this.ws.supports.binary) {
	    this.supportsBinary = true;
	    this.ws.binaryType = 'nodebuffer';
	  } else {
	    this.ws.binaryType = 'arraybuffer';
	  }

	  this.addEventListeners();
	};

	/**
	 * Adds event listeners to the socket
	 *
	 * @api private
	 */

	WS.prototype.addEventListeners = function () {
	  var self = this;

	  this.ws.onopen = function () {
	    self.onOpen();
	  };
	  this.ws.onclose = function () {
	    self.onClose();
	  };
	  this.ws.onmessage = function (ev) {
	    self.onData(ev.data);
	  };
	  this.ws.onerror = function (e) {
	    self.onError('websocket error', e);
	  };
	};

	/**
	 * Writes data to socket.
	 *
	 * @param {Array} array of packets.
	 * @api private
	 */

	WS.prototype.write = function (packets) {
	  var self = this;
	  this.writable = false;

	  // encodePacket efficient as it uses WS framing
	  // no need for encodePayload
	  var total = packets.length;
	  for (var i = 0, l = total; i < l; i++) {
	    (function (packet) {
	      parser.encodePacket(packet, self.supportsBinary, function (data) {
	        if (!self.usingBrowserWebSocket) {
	          // always create a new object (GH-437)
	          var opts = {};
	          if (packet.options) {
	            opts.compress = packet.options.compress;
	          }

	          if (self.perMessageDeflate) {
	            var len = 'string' === typeof data ? global.Buffer.byteLength(data) : data.length;
	            if (len < self.perMessageDeflate.threshold) {
	              opts.compress = false;
	            }
	          }
	        }

	        // Sometimes the websocket has already been closed but the browser didn't
	        // have a chance of informing us about it yet, in that case send will
	        // throw an error
	        try {
	          if (self.usingBrowserWebSocket) {
	            // TypeError is thrown when passing the second argument on Safari
	            self.ws.send(data);
	          } else {
	            self.ws.send(data, opts);
	          }
	        } catch (e) {
	          debug('websocket closed before onclose event');
	        }

	        --total || done();
	      });
	    })(packets[i]);
	  }

	  function done () {
	    self.emit('flush');

	    // fake drain
	    // defer to next tick to allow Socket to clear writeBuffer
	    setTimeout(function () {
	      self.writable = true;
	      self.emit('drain');
	    }, 0);
	  }
	};

	/**
	 * Called upon close
	 *
	 * @api private
	 */

	WS.prototype.onClose = function () {
	  Transport.prototype.onClose.call(this);
	};

	/**
	 * Closes socket.
	 *
	 * @api private
	 */

	WS.prototype.doClose = function () {
	  if (typeof this.ws !== 'undefined') {
	    this.ws.close();
	  }
	};

	/**
	 * Generates uri for connection.
	 *
	 * @api private
	 */

	WS.prototype.uri = function () {
	  var query = this.query || {};
	  var schema = this.secure ? 'wss' : 'ws';
	  var port = '';

	  // avoid port if default for schema
	  if (this.port && (('wss' === schema && Number(this.port) !== 443) ||
	    ('ws' === schema && Number(this.port) !== 80))) {
	    port = ':' + this.port;
	  }

	  // append timestamp to URI
	  if (this.timestampRequests) {
	    query[this.timestampParam] = yeast();
	  }

	  // communicate binary support capabilities
	  if (!this.supportsBinary) {
	    query.b64 = 1;
	  }

	  query = parseqs.encode(query);

	  // prepend ? to query
	  if (query.length) {
	    query = '?' + query;
	  }

	  var ipv6 = this.hostname.indexOf(':') !== -1;
	  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
	};

	/**
	 * Feature detection for WebSocket.
	 *
	 * @return {Boolean} whether this transport is available.
	 * @api public
	 */

	WS.prototype.check = function () {
	  return !!WebSocket && !('__initialize' in WebSocket && this.name === WS.prototype.name);
	};

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 51 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 52 */
/***/ function(module, exports) {

	
	var indexOf = [].indexOf;

	module.exports = function(arr, obj){
	  if (indexOf) return arr.indexOf(obj);
	  for (var i = 0; i < arr.length; ++i) {
	    if (arr[i] === obj) return i;
	  }
	  return -1;
	};

/***/ },
/* 53 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * JSON parse.
	 *
	 * @see Based on jQuery#parseJSON (MIT) and JSON2
	 * @api private
	 */

	var rvalidchars = /^[\],:{}\s]*$/;
	var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
	var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
	var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
	var rtrimLeft = /^\s+/;
	var rtrimRight = /\s+$/;

	module.exports = function parsejson(data) {
	  if ('string' != typeof data || !data) {
	    return null;
	  }

	  data = data.replace(rtrimLeft, '').replace(rtrimRight, '');

	  // Attempt to parse using the native JSON parser first
	  if (global.JSON && JSON.parse) {
	    return JSON.parse(data);
	  }

	  if (rvalidchars.test(data.replace(rvalidescape, '@')
	      .replace(rvalidtokens, ']')
	      .replace(rvalidbraces, ''))) {
	    return (new Function('return ' + data))();
	  }
	};
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var parser = __webpack_require__(14);
	var Emitter = __webpack_require__(7);
	var toArray = __webpack_require__(55);
	var on = __webpack_require__(56);
	var bind = __webpack_require__(57);
	var debug = __webpack_require__(11)('socket.io-client:socket');
	var hasBin = __webpack_require__(37);

	/**
	 * Module exports.
	 */

	module.exports = exports = Socket;

	/**
	 * Internal events (blacklisted).
	 * These events can't be emitted by the user.
	 *
	 * @api private
	 */

	var events = {
	  connect: 1,
	  connect_error: 1,
	  connect_timeout: 1,
	  connecting: 1,
	  disconnect: 1,
	  error: 1,
	  reconnect: 1,
	  reconnect_attempt: 1,
	  reconnect_failed: 1,
	  reconnect_error: 1,
	  reconnecting: 1,
	  ping: 1,
	  pong: 1
	};

	/**
	 * Shortcut to `Emitter#emit`.
	 */

	var emit = Emitter.prototype.emit;

	/**
	 * `Socket` constructor.
	 *
	 * @api public
	 */

	function Socket (io, nsp, opts) {
	  this.io = io;
	  this.nsp = nsp;
	  this.json = this; // compat
	  this.ids = 0;
	  this.acks = {};
	  this.receiveBuffer = [];
	  this.sendBuffer = [];
	  this.connected = false;
	  this.disconnected = true;
	  if (opts && opts.query) {
	    this.query = opts.query;
	  }
	  if (this.io.autoConnect) this.open();
	}

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Socket.prototype);

	/**
	 * Subscribe to open, close and packet events
	 *
	 * @api private
	 */

	Socket.prototype.subEvents = function () {
	  if (this.subs) return;

	  var io = this.io;
	  this.subs = [
	    on(io, 'open', bind(this, 'onopen')),
	    on(io, 'packet', bind(this, 'onpacket')),
	    on(io, 'close', bind(this, 'onclose'))
	  ];
	};

	/**
	 * "Opens" the socket.
	 *
	 * @api public
	 */

	Socket.prototype.open =
	Socket.prototype.connect = function () {
	  if (this.connected) return this;

	  this.subEvents();
	  this.io.open(); // ensure open
	  if ('open' === this.io.readyState) this.onopen();
	  this.emit('connecting');
	  return this;
	};

	/**
	 * Sends a `message` event.
	 *
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.send = function () {
	  var args = toArray(arguments);
	  args.unshift('message');
	  this.emit.apply(this, args);
	  return this;
	};

	/**
	 * Override `emit`.
	 * If the event is in `events`, it's emitted normally.
	 *
	 * @param {String} event name
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.emit = function (ev) {
	  if (events.hasOwnProperty(ev)) {
	    emit.apply(this, arguments);
	    return this;
	  }

	  var args = toArray(arguments);
	  var parserType = parser.EVENT; // default
	  if (hasBin(args)) { parserType = parser.BINARY_EVENT; } // binary
	  var packet = { type: parserType, data: args };

	  packet.options = {};
	  packet.options.compress = !this.flags || false !== this.flags.compress;

	  // event ack callback
	  if ('function' === typeof args[args.length - 1]) {
	    debug('emitting packet with ack id %d', this.ids);
	    this.acks[this.ids] = args.pop();
	    packet.id = this.ids++;
	  }

	  if (this.connected) {
	    this.packet(packet);
	  } else {
	    this.sendBuffer.push(packet);
	  }

	  delete this.flags;

	  return this;
	};

	/**
	 * Sends a packet.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Socket.prototype.packet = function (packet) {
	  packet.nsp = this.nsp;
	  this.io.packet(packet);
	};

	/**
	 * Called upon engine `open`.
	 *
	 * @api private
	 */

	Socket.prototype.onopen = function () {
	  debug('transport is open - connecting');

	  // write connect packet if necessary
	  if ('/' !== this.nsp) {
	    if (this.query) {
	      this.packet({type: parser.CONNECT, query: this.query});
	    } else {
	      this.packet({type: parser.CONNECT});
	    }
	  }
	};

	/**
	 * Called upon engine `close`.
	 *
	 * @param {String} reason
	 * @api private
	 */

	Socket.prototype.onclose = function (reason) {
	  debug('close (%s)', reason);
	  this.connected = false;
	  this.disconnected = true;
	  delete this.id;
	  this.emit('disconnect', reason);
	};

	/**
	 * Called with socket packet.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Socket.prototype.onpacket = function (packet) {
	  if (packet.nsp !== this.nsp) return;

	  switch (packet.type) {
	    case parser.CONNECT:
	      this.onconnect();
	      break;

	    case parser.EVENT:
	      this.onevent(packet);
	      break;

	    case parser.BINARY_EVENT:
	      this.onevent(packet);
	      break;

	    case parser.ACK:
	      this.onack(packet);
	      break;

	    case parser.BINARY_ACK:
	      this.onack(packet);
	      break;

	    case parser.DISCONNECT:
	      this.ondisconnect();
	      break;

	    case parser.ERROR:
	      this.emit('error', packet.data);
	      break;
	  }
	};

	/**
	 * Called upon a server event.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Socket.prototype.onevent = function (packet) {
	  var args = packet.data || [];
	  debug('emitting event %j', args);

	  if (null != packet.id) {
	    debug('attaching ack callback to event');
	    args.push(this.ack(packet.id));
	  }

	  if (this.connected) {
	    emit.apply(this, args);
	  } else {
	    this.receiveBuffer.push(args);
	  }
	};

	/**
	 * Produces an ack callback to emit with an event.
	 *
	 * @api private
	 */

	Socket.prototype.ack = function (id) {
	  var self = this;
	  var sent = false;
	  return function () {
	    // prevent double callbacks
	    if (sent) return;
	    sent = true;
	    var args = toArray(arguments);
	    debug('sending ack %j', args);

	    var type = hasBin(args) ? parser.BINARY_ACK : parser.ACK;
	    self.packet({
	      type: type,
	      id: id,
	      data: args
	    });
	  };
	};

	/**
	 * Called upon a server acknowlegement.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Socket.prototype.onack = function (packet) {
	  var ack = this.acks[packet.id];
	  if ('function' === typeof ack) {
	    debug('calling ack %s with %j', packet.id, packet.data);
	    ack.apply(this, packet.data);
	    delete this.acks[packet.id];
	  } else {
	    debug('bad ack %s', packet.id);
	  }
	};

	/**
	 * Called upon server connect.
	 *
	 * @api private
	 */

	Socket.prototype.onconnect = function () {
	  this.connected = true;
	  this.disconnected = false;
	  this.emit('connect');
	  this.emitBuffered();
	};

	/**
	 * Emit buffered events (received and emitted).
	 *
	 * @api private
	 */

	Socket.prototype.emitBuffered = function () {
	  var i;
	  for (i = 0; i < this.receiveBuffer.length; i++) {
	    emit.apply(this, this.receiveBuffer[i]);
	  }
	  this.receiveBuffer = [];

	  for (i = 0; i < this.sendBuffer.length; i++) {
	    this.packet(this.sendBuffer[i]);
	  }
	  this.sendBuffer = [];
	};

	/**
	 * Called upon server disconnect.
	 *
	 * @api private
	 */

	Socket.prototype.ondisconnect = function () {
	  debug('server disconnect (%s)', this.nsp);
	  this.destroy();
	  this.onclose('io server disconnect');
	};

	/**
	 * Called upon forced client/server side disconnections,
	 * this method ensures the manager stops tracking us and
	 * that reconnections don't get triggered for this.
	 *
	 * @api private.
	 */

	Socket.prototype.destroy = function () {
	  if (this.subs) {
	    // clean subscriptions to avoid reconnections
	    for (var i = 0; i < this.subs.length; i++) {
	      this.subs[i].destroy();
	    }
	    this.subs = null;
	  }

	  this.io.destroy(this);
	};

	/**
	 * Disconnects the socket manually.
	 *
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.close =
	Socket.prototype.disconnect = function () {
	  if (this.connected) {
	    debug('performing disconnect (%s)', this.nsp);
	    this.packet({ type: parser.DISCONNECT });
	  }

	  // remove socket from pool
	  this.destroy();

	  if (this.connected) {
	    // fire events
	    this.onclose('io client disconnect');
	  }
	  return this;
	};

	/**
	 * Sets the compress flag.
	 *
	 * @param {Boolean} if `true`, compresses the sending data
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.compress = function (compress) {
	  this.flags = this.flags || {};
	  this.flags.compress = compress;
	  return this;
	};


/***/ },
/* 55 */
/***/ function(module, exports) {

	module.exports = toArray

	function toArray(list, index) {
	    var array = []

	    index = index || 0

	    for (var i = index || 0; i < list.length; i++) {
	        array[i - index] = list[i]
	    }

	    return array
	}


/***/ },
/* 56 */
/***/ function(module, exports) {

	
	/**
	 * Module exports.
	 */

	module.exports = on;

	/**
	 * Helper for subscriptions.
	 *
	 * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
	 * @param {String} event name
	 * @param {Function} callback
	 * @api public
	 */

	function on (obj, ev, fn) {
	  obj.on(ev, fn);
	  return {
	    destroy: function () {
	      obj.removeListener(ev, fn);
	    }
	  };
	}


/***/ },
/* 57 */
/***/ function(module, exports) {

	/**
	 * Slice reference.
	 */

	var slice = [].slice;

	/**
	 * Bind `obj` to `fn`.
	 *
	 * @param {Object} obj
	 * @param {Function|String} fn or string
	 * @return {Function}
	 * @api public
	 */

	module.exports = function(obj, fn){
	  if ('string' == typeof fn) fn = obj[fn];
	  if ('function' != typeof fn) throw new Error('bind() requires a function');
	  var args = slice.call(arguments, 2);
	  return function(){
	    return fn.apply(obj, args.concat(slice.call(arguments)));
	  }
	};


/***/ },
/* 58 */
/***/ function(module, exports) {

	
	/**
	 * Expose `Backoff`.
	 */

	module.exports = Backoff;

	/**
	 * Initialize backoff timer with `opts`.
	 *
	 * - `min` initial timeout in milliseconds [100]
	 * - `max` max timeout [10000]
	 * - `jitter` [0]
	 * - `factor` [2]
	 *
	 * @param {Object} opts
	 * @api public
	 */

	function Backoff(opts) {
	  opts = opts || {};
	  this.ms = opts.min || 100;
	  this.max = opts.max || 10000;
	  this.factor = opts.factor || 2;
	  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
	  this.attempts = 0;
	}

	/**
	 * Return the backoff duration.
	 *
	 * @return {Number}
	 * @api public
	 */

	Backoff.prototype.duration = function(){
	  var ms = this.ms * Math.pow(this.factor, this.attempts++);
	  if (this.jitter) {
	    var rand =  Math.random();
	    var deviation = Math.floor(rand * this.jitter * ms);
	    ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
	  }
	  return Math.min(ms, this.max) | 0;
	};

	/**
	 * Reset the number of attempts.
	 *
	 * @api public
	 */

	Backoff.prototype.reset = function(){
	  this.attempts = 0;
	};

	/**
	 * Set the minimum duration
	 *
	 * @api public
	 */

	Backoff.prototype.setMin = function(min){
	  this.ms = min;
	};

	/**
	 * Set the maximum duration
	 *
	 * @api public
	 */

	Backoff.prototype.setMax = function(max){
	  this.max = max;
	};

	/**
	 * Set the jitter
	 *
	 * @api public
	 */

	Backoff.prototype.setJitter = function(jitter){
	  this.jitter = jitter;
	};



/***/ },
/* 59 */
/***/ function(module, exports) {

	var JConstant = {
	    SDK_VERSION : '2.4.0',
	    WSS_ADDRESS : 'wss://ws.im.jiguang.cn',
	    UPLOAD_FILE : 'https://sdk.im.jiguang.cn/resource',
	    ALLOW_MSG_TYPE : ['text', 'image', 'file', 'location', 'custom'],
	    LOGIN_OUT_EVENT : [1,2],
	    //来源
	    FROM_PLATFORM : 'j',
	    // ACK超时时间
	    ACK_TIMEOUT : 5000,
	    // 响应超时时间
	    RESP_TIMEOUT : 30000,
	    // 重试次数
	    RETRY_TIMES : 5,
	    //数据同步间隔
	    SYNC_INTERVAL : 150000,
	    //receipt report 间隔
	    RECEIPT_REPORT_INTERVAL : 5000,
	    //receipt report localstorage pre key
	    RECEIPT_REPORT_KEY:'report-',
	    // 会话key
	    CONVERSATION_KEY : 'conversations-',
	    //sync type标记
	    SYNC_TYPE_OPEN : 1,
	    SYNC_TYPE_CLOSE : 0,
	    //添加好友，1 邀请方 2被邀请方
	    FRIEND_INVITE : 1,
	    FRIEND_INVITED : 2,
	    //通道类型
	    PLAT_CHANNEL: 'w',
	    // 事件
	    EVENTS : {
	        ACK: 'ack',
	        INIT: 'c_init',
	        LOGIN: 'login',
	        REGISTER: 'register',
	        GET_USER_INFO: 'get_across_user_info',
	        GET_ACROSS_USER_INFO: 'get_across_user_info',
	        S_SINGLE_TEXT: 's_across_single_text',
	        S_SINGLE_TEXT_: 's_single_text',
	        MSG_SYNC: 'msg_sync',
	        MSG_RECV: 'msg_recv',
	        SEND_GROUP_MSG: 'send_group_msg',
	        CREATE_GROUP: 'create_group',
	        GET_GROUPS_LIST: 'get_groups_list',
	        GET_GROUP_INFO: 'get_group_info',
	        ADD_GROUP_MEMBER: 'add_group_member',
	        ADD_ACROSS_GROUP_MEMBER: 'add_across_group_member',
	        DEL_GROUP_MEMBER: 'del_group_member',
	        DEL_ACROSS_GROUP_MEMBER: 'del_across_group_member',
	        GET_GROUP_MEMBERS: 'get_group_members',
	        UPDATE_GROUP_INFO: 'update_group_info',
	        EXIT_GROUP: 'exit_group',
	        EVENT_NOTIFICATION: 'event_notification',
	        GET_CONVERSATIONS: 'get_conversations',
	        GET_UPLOAD_TOKEN: 'get_upload_token',
	        NO_DISTURB: 'no_disturb',
	        ADD_MSG_NO_DISTURB_SINGLE: 'add_msg_no_disturb_single',
	        DELETE_MSG_NO_DISTURB_SINGLE: 'delete_msg_no_disturb_single',
	        ADD_MSG_NO_DISTURB_GROUP: 'add_msg_no_disturb_group',
	        DELETE_MSG_NO_DISTURB_GROUP: 'delete_msg_no_disturb_group',
	        ADD_MSG_NO_DISTURB_GLOBAL: 'add_msg_no_disturb_global',
	        DELETE_MSG_NO_DISTURB_GLOBAL: 'delete_msg_no_disturb_global',
	        DISCONNECT: 'disconnect',
	        GET_BLACK_LIST: 'get_black_list',
	        ADD_BLACK_LIST: 'add_black_list',
	        DEL_BLACK_LIST: 'del_black_list',
	        UPDATE_SELF_INFO: 'update_user_inf',
	        UPDATE_SELF_PWD: 'update_user_pwd',
	        ADD_MSG_SHIELD_GROUP: 'add_msg_shield_group',
	        DEL_MSG_SHIELD_GROUP: 'del_msg_shield_group',
			ADD_FRIEND : 'add_friend',
			DEL_FRIEND : 'del_friend',
			UPDATE_FRIEND_MEMO : 'update_friend_memo',
			GET_FRIEND_LIST : 'get_friend_list',
	        SYNC_CHECK: 'sync_check',
	        SYNC_CONVERSATION: 'sync_conversation',
	        SYNC_CONVERSATION_ACK: 'sync_conversation_ack',
	        MSG_RETRACT: 'msg_retract',
	        GET_RESOURCE : 'get_resource',
	        LIST_SHIELD_GROUP : 'list_shield_group',
	        SYNC_EVENT_CHECK: 'sync_event_check',
	        SYNC_EVENT: 'sync_event',
	        SYNC_EVENT_ACK: 'sync_event_ack',
	        RECEIPT_REPORT : 'receipt_report',
	        SYNC_RECEIPT_ACK:'sync_receipt_ack',
	        SYNC_RECEIPT:'sync_receipt',
	        RECEIPT_CHANGE:'receipt_change',
	        UNREAD_GROUP_COUNT: 'unread_group_count',
	        UNREAD_SINGLE_COUNT: 'unread_single_count',
	        MSG_UNREAD_LIST : 'msg_unread_list',
	        TRANS_MSG_SINGLE : 'trans_msg_single',
	        TRANS_MSG_GROUP : 'trans_msg_group',
	        TRANS_MSG_REC : 'trans_msg_rec'
	    }
	};

	module.exports = JConstant;



/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var JConstant = __webpack_require__(59);

	var MsgBuilder = function(channel) {
	    this.channel = channel;
	    this.rid = this.channel.generateRid();
	    this.times = 1;
	};

	MsgBuilder.prototype.setEvent = function(event) {
	    this.event = event;
	    return this;
	};

	MsgBuilder.prototype.setData = function(data) {
	    this.data = data;
	    return this;
	};

	MsgBuilder.prototype.onSuccess = function(success) {
	    if (typeof success === 'function') {
	        this.success = success;
	    }
	    return this;
	};

	MsgBuilder.prototype.onFail = function(fail) {
	    if (typeof fail === 'function') {
	        this.fail = fail;
	    }
	    return this;
	};

	MsgBuilder.prototype.onTimeout = function(timeout) {
	    if (typeof timeout === 'function') {
	        this.timeout = timeout;
	        var self = this;
	        this.respTimeoutTaskId = setTimeout(function() {
	            self.respTimeoutTask()
	        }, JConstant.RESP_TIMEOUT);
	    }
	    return this;
	};

	MsgBuilder.prototype.onAck = function(ack) {
	    if (typeof ack === 'function') {
	        this.ack = ack;
	    }
	    return this;
	};

	MsgBuilder.prototype.onInnerCall = function(innerCall) {
	    if (typeof innerCall === 'function') {
	        this.innerCall = innerCall;
	    }
	    return this;
	};

	MsgBuilder.prototype.onUserInfoGet = function(userInfoGet) {
	    if (typeof userInfoGet === 'function') {
	        this.userInfoGet = userInfoGet;
	    }
	    return this;
	};

	MsgBuilder.prototype.addHook = function(hook) {
	    if (typeof hook === 'function') {
	        this.hook = hook;
	    }
	    return this;
	};

	MsgBuilder.prototype.ackTimeoutTask = function() {
	    if (this.times < JConstant.RETRY_TIMES) {
	        this.channel.send(this.event, this._data);
	        this.times++;
	        // schedule
	        var self = this;
	        this.ackTimeoutTaskId = setTimeout(function() {
	            self.ackTimeoutTask();
	        }, JConstant.ACK_TIMEOUT);
	    } else {
	        this.timeout && this.timeout({
	            rid : this.rid,
	            data : this.data,
	            response_timeout : false
	        });
	        delete this.channel.dataCache[this.rid];
	    }
	    return this;
	};


	MsgBuilder.prototype.respTimeoutTask = function() {
	    if (this.times < JConstant.RETRY_TIMES) {
	        this.channel.send(this.event, this._data);
	        this.times++;
	        // schedule
	        var self = this;
	        this.respTimeoutTaskId = setTimeout(function() {
	            self.respTimeoutTask()
	        }, JConstant.RESP_TIMEOUT);
	    } else {
	        this.timeout && this.timeout({
	            rid : this.rid,
	            data : this.data,
	            response_timeout : true
	        });
	        delete this.channel.dataCache[this.rid];
	    }
	    return this;
	};

	MsgBuilder.prototype.cleanAckTimeout = function() {
	    this.ackTimeoutTaskId && clearTimeout(this.ackTimeoutTaskId);
	    return this;
	};
	MsgBuilder.prototype.cleanRespTimeout = function() {
	    this.respTimeoutTaskId && clearTimeout(this.respTimeoutTaskId);
	    return this;
	};

	MsgBuilder.prototype.send = function() {
	    // valid
	    if (!this.event || !this.data) {
	        console.error('send fail，event and data can not empty');
	        return;
	    }

	    // schedule
	    var self = this;
	    this.ackTimeoutTaskId = setTimeout(function() {
	        self.ackTimeoutTask();
	    }, JConstant.ACK_TIMEOUT);

	    // send
	    this._data = (JSON.parse(JSON.stringify(this.data)));
	    this._data['rid'] = this.rid;
	    this.channel.send(this.event, this._data);
	    this.channel.dataCache[this.rid] = this;

	    return this;
	};

	module.exports = MsgBuilder;

/***/ },
/* 61 */
/***/ function(module, exports) {

	

	/**
	 * 聊天消息构建器
	 * @param client WS对象
	 * @param current_user 当前登录用户username
	 * @param current_appkey 当前登录用户appkey
	 * @constructor
	 */
	var MsgContentBuilder = function(current_user, current_appkey) {
	    this.current_user = current_user;
	    this.current_appkey = current_appkey;
	    this.version =1;
	    this.from_platform = 'web';
	};

	/**
	 * 设置是否需要回执
	 * @param read_receipt
	 * @returns {MsgContentBuilder}
	 */
	MsgContentBuilder.prototype.setNeadReceipt = function(need_receipt) {
	    this.need_receipt = need_receipt;
	    return this;
	};

	/**
	 * 设置未读数 群消息
	 * @param unread_count
	 * @returns {MsgContentBuilder}
	 */
	//MsgContentBuilder.prototype.setUnreadCount = function(unread_count) {
	  //  this.unread_count = unread_count;
	   // return this;
	//};

	/**
	 * 设置是否离线下发
	 * @param type 消息类型
	 * @returns {MsgContentBuilder}
	 */
	MsgContentBuilder.prototype.setNoOffline = function(no_offline) {
	    this.no_offline = no_offline;
	    return this;
	};

	/**
	 * 设置状态栏是否显示消息
	 * @param type 消息类型
	 * @returns {MsgContentBuilder}
	 */
	MsgContentBuilder.prototype.setNoNotification = function(no_notification) {
	    this.no_notification = no_notification;
	    return this;
	};

	/**
	 * 设置消息类型
	 * @param type 消息类型
	 * @returns {MsgContentBuilder}
	 */
	MsgContentBuilder.prototype.setType = function(type) {
	    this.type = type;
	    return this;
	};

	/**
	 * 设置@用户
	 * @param  at_list 用户数组[{‘appkey’:'','username':''}]
	 * @returns {MsgContentBuilder}
	 */
	MsgContentBuilder.prototype.setAtList = function(at_list) {
	    this.at_list = at_list;
	    return this;
	};

	/**
	 * 制定目标应用的Appkey，跨应用消息时必须制定
	 * @param appkey AppKey
	 * @returns {MsgContentBuilder}
	 */
	MsgContentBuilder.prototype.setAppkey = function(appkey) {
	    if (appkey) this.appkey = appkey;
	    return this;
	};

	/**
	 * 设置接收目标
	 * @param target 接收目标
	 * @param target_name 接收目标的昵称
	 * @returns {MsgContentBuilder}
	 */
	MsgContentBuilder.prototype.setTarget = function(target, target_name) {
	    this.target_id = target.toString();
	    this.target_name = target_name;
	    return this;
	};

	/**
	 * 设置发送者昵称
	 * @param from_name 发送者昵称
	 * @returns {MsgContentBuilder}
	 */
	MsgContentBuilder.prototype.setFromName = function(from_name) {
	    this.from_name = from_name;
	    return this;
	};

	/**
	 * 设置文本消息
	 * @param content 文本内容
	 * @param extras JSON格式的扩展字段，可为空
	 * @returns {MsgContentBuilder}
	 */
	MsgContentBuilder.prototype.setText = function(content, extras) {
	    this.msg_type = 'text';
	    this.msg_body = {
	        'text' : content
	    };
	    if (extras) this.msg_body['extras'] = extras;
	    return this;
	};

	/**
	 * 设置图片消息
	 * @param imgObj
	 * @param extras
	 * @returns {MsgContentBuilder}
	 */
	MsgContentBuilder.prototype.setImage = function(imgObj, extras) {
	    this.msg_type = 'image';
	    this.msg_body = {
	        'media_id' : imgObj.media_id,
	        'media_crc32' : imgObj.media_crc32,
	        'width' : imgObj.width,
	        'height' : imgObj.height,
	        'format' : imgObj.format,
	        'fsize' : imgObj.fsize
	    };
	    if (extras) this.msg_body['extras'] = extras;
	    return this;
	};

	/**
	 * 设置文件消息
	 * @param file
	 * @param extras
	 * @returns {MsgContentBuilder}
	 */
	MsgContentBuilder.prototype.setFile = function(file, extras) {
	    this.msg_type = 'file';
	    this.msg_body = {
	        'media_id' : file.media_id,
	        'media_crc32' : file.media_crc32,
	        'hash' : file.hash,
	        'fsize' : file.fsize,
	        'fname' : file.fname
	    };
	    if (extras) this.msg_body['extras'] = extras;
	    return this;
	};

	/**
	 * 设置 notification
	 * @returns {MsgContentBuilder}
	 */
	MsgContentBuilder.prototype.setCustomNotification = function(customNotification) {
	    if (customNotification) this.custom_notification = customNotification;
	    return this;
	};


	/**
	 * 设置地理位置消息
	 * @param location
	 * @param extras
	 * @returns {MsgContentBuilder}
	 */
	MsgContentBuilder.prototype.setLocation = function(location, extras) {
	    this.msg_type = 'location';
	    this.msg_body = {
	        'latitude' : location.latitude,
	        'longitude' : location.longitude,
	        'scale' : location.scale,
	        'label' : location.label
	    };
	    if (extras) this.msg_body['extras'] = extras;
	    return this;
	};

	/**
	 * 设置自定义消息
	 * @param custom
	 * @returns {MsgContentBuilder}
	 */
	MsgContentBuilder.prototype.setCustom = function(custom,extras) {
	    this.msg_type = 'custom';
	    this.msg_body = custom;
	    if (extras) this.msg_body['extras'] = extras;
	    return this;
	};



	MsgContentBuilder.prototype.build = function() {
	    var username = this.current_user;

	    if (this.type != 'single' && this.type != 'group' && this.type != 'across_single') return console.log('消息类型必须是single或group');
	    if(!this.target_id) return console.error('target_id不能为空');

	    if (this.msg_type == 'text') {
	        if (!this.msg_body['text'] && this.at_list && this.type !='single'){
	            this.msg_body['text'] = ' ';
	        }else if(!this.msg_body['text'] && !this.at_list){
	            return console.error('未设置文本消息内容');
	        } 
	    } else if (this.msg_type == 'custom') {
	        if (!this.msg_body) return console.error('custom对象不能为空');
	    } else if (this.msg_type == 'image') {
	        if (!this.msg_body['media_id']) return console.error('未设置image消息media_id字段');
	        if (!this.msg_body['media_crc32']) return console.error('未设置image消息media_crc32字段');
	        if (!this.msg_body['width']) return console.error('未设置image消息width字段');
	        if (!this.msg_body['height']) return console.error('未设置image消息height字段');
	    } else if (this.msg_type == 'file') {
	        if (!this.msg_body['media_id']) return console.error('未设置file消息media_id字段');
	        if (!this.msg_body['media_crc32']) return console.error('未设置file消息media_crc32字段');
	        if (!this.msg_body['fsize']) return console.error('未设置file消息fsize字段');
	        if (!this.msg_body['fname']) return console.error('未设置file消息fname字段');
	    } else if (this.msg_type == 'location') {
	        if (!this.msg_body['latitude']) return console.error('未设置location消息latitude字段');
	        if (!this.msg_body['longitude']) return console.error('未设置location消息longitude字段');
	        if (!this.msg_body['scale']) return console.error('未设置location消息scale字段');
	        if (!this.msg_body['label']) return console.error('未设置location消息label字段');
	    } else {
	        return console.error('请设置合法的msg_type');
	    }

	    // build return payload
	    var content = {
	        'version' : this.version,
	        'target_type' : this.type,
	        'from_platform' : this.from_platform,
	        'target_id' : this.target_id,
	        'target_name' : this.target_name,
	        'from_id' : username,
	        'from_name' : this.from_name,
	        'create_time' : new Date().getTime(),
	        'msg_type' : this.msg_type,
	        'msg_body' : this.msg_body
	    };

	    // 是否是跨应用消息
	    if(this.appkey) {
	        content['target_appkey'] = this.appkey;
	        content['from_appkey'] = this.current_appkey;
	    }

	    var payload = {
	        'content' : content
	    };
	    payload['no_offline'] = this.no_offline ;
	    payload['no_notification'] = this.no_notification;
	    payload['custom_notification'] = this.custom_notification;
	    payload['target_name'] = content.target_name;
	    payload['need_receipt'] = this.need_receipt;
	    //payload['unread_count'] = this.unread_count;
	    if ('single' == content.target_type) {
	        payload['target_id'] = content.target_id;
	    } else {
	        payload['target_gid'] = content.target_id;
	        if(this.at_list && (this.at_list instanceof Array)){
	           payload['users'] = this.at_list;
	        } else if(this.at_list && !(this.at_list instanceof Array)){
	           return console.error('参数值不合法，at_list必须为数组类型');
	        }
	    }
	    if (this.appkey) {
	        payload['appkey'] = this.appkey;
	    } else {
	        payload['appkey'] = this.current_appkey;
	    }

	    return payload;
	};

	module.exports = MsgContentBuilder;

/***/ },
/* 62 */
/***/ function(module, exports) {

	"use strict";

	module.exports = function() {
	  function safe_add (x, y) {
	    var lsw = (x & 0xFFFF) + (y & 0xFFFF)
	    var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
	    return (msw << 16) | (lsw & 0xFFFF)
	  }
	  function bit_rol (num, cnt) {
	    return (num << cnt) | (num >>> (32 - cnt))
	  }
	  function md5_cmn (q, a, b, x, s, t) {
	    return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b)
	  }
	  function md5_ff (a, b, c, d, x, s, t) {
	    return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t)
	  }
	  function md5_gg (a, b, c, d, x, s, t) {
	    return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t)
	  }
	  function md5_hh (a, b, c, d, x, s, t) {
	    return md5_cmn(b ^ c ^ d, a, b, x, s, t)
	  }
	  function md5_ii (a, b, c, d, x, s, t) {
	    return md5_cmn(c ^ (b | (~d)), a, b, x, s, t)
	  }
	  function binl_md5 (x, len) {
	    /* append padding */
	    x[len >> 5] |= 0x80 << (len % 32)
	    x[(((len + 64) >>> 9) << 4) + 14] = len

	    var i
	    var olda
	    var oldb
	    var oldc
	    var oldd
	    var a = 1732584193
	    var b = -271733879
	    var c = -1732584194
	    var d = 271733878

	    for (i = 0; i < x.length; i += 16) {
	      olda = a
	      oldb = b
	      oldc = c
	      oldd = d

	      a = md5_ff(a, b, c, d, x[i], 7, -680876936)
	      d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586)
	      c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819)
	      b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330)
	      a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897)
	      d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426)
	      c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341)
	      b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983)
	      a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416)
	      d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417)
	      c = md5_ff(c, d, a, b, x[i + 10], 17, -42063)
	      b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162)
	      a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682)
	      d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101)
	      c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290)
	      b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329)

	      a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510)
	      d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632)
	      c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713)
	      b = md5_gg(b, c, d, a, x[i], 20, -373897302)
	      a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691)
	      d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083)
	      c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335)
	      b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848)
	      a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438)
	      d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690)
	      c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961)
	      b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501)
	      a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467)
	      d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784)
	      c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473)
	      b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734)

	      a = md5_hh(a, b, c, d, x[i + 5], 4, -378558)
	      d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463)
	      c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562)
	      b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556)
	      a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060)
	      d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353)
	      c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632)
	      b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640)
	      a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174)
	      d = md5_hh(d, a, b, c, x[i], 11, -358537222)
	      c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979)
	      b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189)
	      a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487)
	      d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835)
	      c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520)
	      b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651)

	      a = md5_ii(a, b, c, d, x[i], 6, -198630844)
	      d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415)
	      c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905)
	      b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055)
	      a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571)
	      d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606)
	      c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523)
	      b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799)
	      a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359)
	      d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744)
	      c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380)
	      b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649)
	      a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070)
	      d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379)
	      c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259)
	      b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551)

	      a = safe_add(a, olda)
	      b = safe_add(b, oldb)
	      c = safe_add(c, oldc)
	      d = safe_add(d, oldd)
	    }
	    return [a, b, c, d]
	  }

	  function binl2rstr (input) {
	    var i
	    var output = ''
	    for (i = 0; i < input.length * 32; i += 8) {
	      output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF)
	    }
	    return output
	  }

	  function rstr2binl (input) {
	    var i
	    var output = []
	    output[(input.length >> 2) - 1] = undefined
	    for (i = 0; i < output.length; i += 1) {
	      output[i] = 0
	    }
	    for (i = 0; i < input.length * 8; i += 8) {
	      output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32)
	    }
	    return output
	  }

	  function rstr_md5 (s) {
	    return binl2rstr(binl_md5(rstr2binl(s), s.length * 8))
	  }

	  function rstr_hmac_md5 (key, data) {
	    var i
	    var bkey = rstr2binl(key)
	    var ipad = []
	    var opad = []
	    var hash
	    ipad[15] = opad[15] = undefined
	    if (bkey.length > 16) {
	      bkey = binl_md5(bkey, key.length * 8)
	    }
	    for (i = 0; i < 16; i += 1) {
	      ipad[i] = bkey[i] ^ 0x36363636
	      opad[i] = bkey[i] ^ 0x5C5C5C5C
	    }
	    hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8)
	    return binl2rstr(binl_md5(opad.concat(hash), 512 + 128))
	  }

	  function rstr2hex (input) {
	    var hex_tab = '0123456789abcdef'
	    var output = ''
	    var x
	    var i
	    for (i = 0; i < input.length; i += 1) {
	      x = input.charCodeAt(i)
	      output += hex_tab.charAt((x >>> 4) & 0x0F) +
	      hex_tab.charAt(x & 0x0F)
	    }
	    return output
	  }

	  function str2rstr_utf8 (input) {
	    return unescape(encodeURIComponent(input))
	  }

	  function raw_md5 (s) {
	    return rstr_md5(str2rstr_utf8(s))
	  }
	  function hex_md5 (s) {
	    return rstr2hex(raw_md5(s))
	  }
	  function raw_hmac_md5 (k, d) {
	    return rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d))
	  }
	  function hex_hmac_md5 (k, d) {
	    return rstr2hex(raw_hmac_md5(k, d))
	  }
	  function md5(string, key, raw) {
	    if (!key) {
	      if (!raw) {
	        return hex_md5(string)
	      }
	      return raw_md5(string)
	    }
	    if (!raw) {
	      return hex_hmac_md5(key, string)
	    }
	    return raw_hmac_md5(key, string)
	  }

	  return md5;
	};


/***/ },
/* 63 */
/***/ function(module, exports) {

	"use strict";

	var StringUtils = {};
	StringUtils.isBlack = function (str) {
	    return !(str && typeof str === 'string' && str.length > 0);
	};

	var StorageUtils = {};
	StorageUtils.addItem = function(key,val) {
	   window.localStorage && localStorage.setItem(key,val);
	}

	StorageUtils.removeItems = function(val) {
		if(window.localStorage){
			var length=localStorage.length;
			var ar = [];
	       for(var i=0;i<length;i++) {
	       	  if(localStorage.getItem(localStorage.key(i)) === val){
	                ar.push(localStorage.key(i));
	       	  }
	        }
	        ar.forEach(function(item){
	        	localStorage.removeItem(item);
	        });
		}
	    
	}

	StorageUtils.getItem = function(key) {
		if(window.localStorage){
			return localStorage.getItem(key);
		}else{
			return null;
		}
	}

	var ArrayUtils ={};
	ArrayUtils.delRepeatItem = function(array){
	   var tmp =[];
	   array.forEach(function(item){
	      if(tmp.indexOf(item) === -1 && item != null){
	        tmp.push(item);
	      }
	   });
	   return tmp;
	}


	module.exports = {
	    StringUtils : StringUtils,
	    StorageUtils : StorageUtils,
	    ArrayUtils : ArrayUtils
	};

/***/ }
/******/ ])
});
;