var _user = "anonymous";
var _agent = "public";
var _session = '';
var _android = 0;
var _web_nr = -1;
var _ws = null;

var _tabid = 0;
var _lang = 'en';

var _login_form;

var Tasks = [];

var rootURL = '/ssjs';
var report_window;

var layout;

var _west = "";
var _north = "<div id='northpane' width='100%' style='background-color: blue; width: 100%; height: 100%; color: white; font: Arial,Verdana;'> \
	      <div id='trolis' position='relative' width='100' style='float: left;'>Parallel Javascript Machine " + _version + " " + _version_extra + "</div> \
	      <div id='login' position='relative' style='float: right; width: 520;'></div> \
	      </div>";


var _east = "";
var _center = "";
var _south = "You have no messages so far..."

window.onbeforeunload = function(e) {
    if (_ws) _ws.close();
    };

Ext.onReady(function(){

    Ext.BLANK_IMAGE_URL = '/cljs/images/s.gif';
    Ext.QuickTips.init();

    TrolisApp = new Trolis();
    
    layout = new Ext.Viewport({
        		    layout:'border',
			    monitorResize: true,
        		    items:[
			    {
                		region:'north',
//                		html: _north,
				height:32,
				border: false,
				items: [
				    new Ext.Toolbar({
					border: false,
					autoWidth: true,
					listeners: {
					    afterrender: function(e) {
						e.getEl().dom.style.background = 'blue';
						}
					    },
					height: 32,
					items: [{
					    xtype: 'displayfield',
					    style: {color: 'white', 'padding': '5px', 'font-family': 'Verdana, Arial', 'font-size': '11pt'},
					    value: '<b>Parallel Javascript Machine ' + _version + ' ' + _version_extra + '</b>'
					    },
					    '->',
					    {
					    xtype: 'displayfield',
					    id: 'd-user',
					    style: {color: 'white', 'padding-right': '5px', 'font-family': 'Verdana, Arial', 'font-size': '9pt'},
					    value: 'User:&nbsp;'
					    }, {
					    xtype: 'textfield',
					    height: 18,
    					    id: 't-user',
					    width: 60,
					    anchor: '95%',
					    value: ''
					    }, {
					    xtype: 'displayfield',
					    id: 'd-password',
					    style: {color: 'white', 'padding-right': '5px', 'padding-left': '10px', 'font-family': 'Verdana, Arial', 'font-size': '9pt'},
					    value: 'Password:&nbsp;'
					    }, {
					    xtype: 'textfield',
					    height: 18,
					    inputType: 'password',
    					    id: 't-password',
					    width: 60,
					    style: {'padding': '0 10px 0 0'},
					    anchor: '95%',
					    listeners: {
						specialkey: {
						    fn: function (o, e) {
							var k = e.getKey();
							if (k == e.RETURN) {
							    e.stopEvent();
							    TrolisApp.login();
							    }
							}
						    }
						},
					    value: ''
					    }, {
					    xtype: 'button',
					    width: 70,
					    cls: 'my-btn-over',
					    overCls: 'x-btn-over',
					    style: {'padding': '0 0 0 10px'},
					    text: 'Login',
					    id: 'login-btn',
					    anchor: '95%',
					    handler: TrolisApp.login,
					    scope: TrolisApp
					    }, {
					    xtype: 'tbspacer',
					    width: 10
					    }, {
					    xtype: 'displayfield',
					    name: 'register_top',
					    id: 'register_top',
					    value: '&nbsp;&nbsp;<a href="#" style="color:lightgrey;"><b>Register</b></a>'
					    }, {
					    xtype: 'displayfield',
					    id: 'user-agent',
					    hidden: true,
					    style: {color: 'yellow', 'padding': '0 10px 3px 0', 'font-family': 'Verdana, Arial', 'font-size': '10pt'},
					    value: 'user@public',
					    }, {
					    xtype: 'tbspacer',
					    width: 10
					    }, {
					    xtype: 'button',
					    width: 70,
					    cls: 'my-btn-over',
					    overCls: 'x-btn-over',
					    style: {'padding': '0 10px 0 10px'},
					    text: 'Logout',
					    id: 'logout-btn',
					    anchor: '95%',
					    hidden: true,
					    handler: TrolisApp.logout,
					    scope: TrolisApp
					    }]
					})
				    ]
            		    },
			    {
                		region:'south',
				id: 'south',
                		split:true,
//				layout: 'fit',
                		height: 300,
                		minSize: 100,
                		maxSize: 700,
                		collapsible: true,
                		collapsed: true,
				hideBorders: true,
//				autoScroll: true,
//				autoShow: true,
				autoHide: false,
                		title:'Console',
                		margins:'0 0 0 0',
                        	animate: true,
	                    	titlebar: true,
        			layout:'border',
				monitorResize: true,
				items: [{
					region: 'south',
					id: 'chat-chat',
					hideBorders: true,
					height: 35,
					minSize: 70,
					maxSize: 250
				    }, {
//				    	region: 'north',
//					hideBorders: true,
//					height: 1,
//					minSize: 1,
//					maxSize: 1
//				    }, {
					region: 'center',
					hideBorders: true,
					layout: 'card',
					id: 'chat-center',
//					autoHeight: true,
					autoScroll: true,
					activeItem: 0,
					deferredRender: false,
//					monitorResize: true,
					items: [{
					    hideBorders: true,
					    id: 'chat-messages',
//					    monitorResize: true,
					    autoWidth: true,
					    autoHeight: true
//					},{
//					    id: 'chat-news'
//					},{
//					    id: 'chat-tickets'
//					},{
//					    id: 'chat-email'
					}]
				    }]
            		    }, {
                		region:'east',
//				id: 'east',
                		title: 'Gadgets',
//				html: 'east',
	                    	titlebar: true,
				split: true,
                		collapsible: true,
                		collapsed: true,
				autohide: true,
                        	animate: true,
                		width: 202,
                		minSize: 175,
                		maxSize: 400,
//                		layout:'fit',
                		margins:'0 0 0 0',
                		xtype: 'tabpanel',
//                		items:
//                    		    new Ext.TabPanel({
					forceLayout: false,
					deferrerRender: true,
					id: 'east-panel',
					layoutOnTabChange: true,
					monitorResize: true,
                        		border:false,
					listeners: {
					    afterrender: {
						fn: function (o) {
						    o.setActiveTab(1);
						    o.setActiveTab(0);
						    },
						single: false
						}
					    },
//                        		activeTab: 0,
                        		tabPosition:'top',
                        		items:[{
					    forceLayout: true,
					    layout: 'column',
					    deferrerRender: false,
					    id: 'module-panel',
					    style: 'align: center',
                            		    title: 'Modules',
                            		    autoScroll:true,
					    hideBorders: true,
					    items: [{
						    forceLayout: true,
						    deferrerRender: false,
			    			    style: 'padding: 10px 10px 0px 20px',
						    hideBorders: true,
						    id: 'module-panel-1',
//						    layout: 'fit',
						    columnWidth: .5
						},{
						    forceLayout: true,
						    deferrerRender: false,
						    hideBorders: true,
						    style: 'padding: 10px 10px 0px 20px',
						    columnWidth: .5,
						    id: 'module-panel-2'
						}]

                        		}, {
					    layout: 'column',
					    id: 'tool-panel',
					    style: 'align: center',
                            		    title: 'Tools',
                            		    autoScroll:true,
					    hideBorders: true,
					    items: [{
			    			    style: 'padding: 10px 10px 0px 20px',
						    hideBorders: true,
						    id: 'tool-panel-1',
						    columnWidth: .5
					    },{
						    style: 'padding: 10px 10px 0px 20px',
						    hideBorders: true,
						    columnWidth: .5,
						    id: 'tool-panel-2'
					    }]
					}]
//                    		    })
				
            		    }, 
            		    {
                		region:'west',
//                		html: _west,  
				id: 'west',
                		title:'News',
                		split:true,
				hideBorders: true,
                		width: 300,
                		minSize: 200,
                		maxSize: 400,
                		collapsible: true,
                		margins:'0 0 0 0'
            		    },{
            			region: 'center',
				layout: 'fit',
				hideBorders: true,
				monitorResize: true,
				items: new Ext.TabPanel({
				    id: 'centertab',
    				    bufferResize: 200,
                		    margins:'0 0 0 0'

            			})
			    }]
    			});


TrolisApp.init();
//var south_el = Ext.DomQuery.selectNode('div.x-layout-collapsed-south');
//Ext.get(south_el).on('click', function() { 
//console.log('click');
//    return false;
//    });

//Ext.getCmp('chat-messages').on('show', function() {
//console.log('show');
//	Ext.getCmp('chat-messages').getEl().findParent('div.x-panel-body', 2, true).scroll("b",500, false);
//	}, this, {single:true});

var east_el = Ext.DomQuery.selectNode('div.x-layout-collapsed-east');
Ext.get(east_el).on('click', function() { 
    layout.getComponent('east-panel').setActiveTab(1);
    layout.getComponent('east-panel').setActiveTab(0); 
    return false;
    });

});
