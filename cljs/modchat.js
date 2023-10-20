var mod_chat_this; // Scope for setInterval

ModChat = Ext.extend(Module, {

    ct: {},
    chat_view: {},
    users_ds: {},
    msg_pn: {},
    conn: {},
    form: {},
    pollconn: {},

    initModule: function(that, ct, config) {
	this.id = "Chat";
	this.cls = 'chat-icon';

	msg_pn = new Ext.form.FormPanel({
	    bodyStyle: 'padding: 10px 10px 10px 10px;',
	    hideBorders: true,
	    id: 'chat-chat-p',
	    labelAlign: 'right',
	    layout: 'column',
	    items: [{
		width: 80,
		items: [{
			xtype: 'displayfield',
			width: 80,
			name: 'chat-user',
			anchor: '95%',
			value: _user + " >: "
		    }]
		}, {
		    columnWidth: 0.99,
		    items: [{
		        width: 610, 
        		xtype: 'textfield',
        		name: 'chat-msg',
        		allowBlank: true,
			emptyText: "Enter command or press '?' for help",
			anchor: '95%',
        		value: ''
		    }]
		}],
		buttons: []
	    }).show();

	this.ct = ct;
	this.msg_pn = msg_pn;
	this.form = this.msg_pn.getForm();
	this.ct.add(this.msg_pn);
	this.ct.doLayout();
	mod_chat_this = this;
	this.initIface(config);
	this.msg_pn.getForm().findField('chat-msg').on('specialkey',this.postmsg, this);
	return this;
    },


    initIface: function(config) {
        
	var ds = new Ext.data.Store({
    	    proxy: new Ext.data.MemoryProxy(),
    	    reader: new Ext.data.JsonReader({
        	root: 'rows',
        	totalProperty: 'results',
        	id: 'id'
    		}, [{name: 'msg'},{name:'fr-user'},{name: 'to-user'}]
	    ),
	});

	this.ds = ds;

        var cm = new Ext.grid.ColumnModel([{
		id: 'msg',
		style: 'padding-left: 15px;',
		dataIndex: 'msg',
		renderer: function (value, p, record) {
		    var tokens = value.split(' ');
		    var pattern = '';
		    var f;
		    if (new RegExp("system", "i").test(tokens[0]))
			f = '<div class="chat-msg" style="color:blue">{0}</div>';
		    else if (new RegExp("opu", "i").test(tokens[0]))
			f = '<div class="chat-msg" style="color:green">{0}</div>';
		    else f = '<div class="chat-msg" style="color:black">{0}</div>';
		    if (tokens[1] != undefined && /error/i.test(tokens[1]))
			f = '<div class="chat-msg" style="color:red">{0}</div>';
		    if (tokens[2] != undefined && /error/i.test(tokens[2]))
			f = '<div class="chat-msg" style="color:red">{0}</div>';
		    return String.format(f, "<pre>"+value+"</pre>");
		},
		width: 710
	    }]);

	cm.menuDisabled = true;

	this.cm = cm;

	var grid = new Ext.grid.GridPanel({
            id:'msg-grid',
	    store: ds,
	    cm: this.cm,
	    sm:new Ext.grid.RowSelectionModel({singleSelect:true}),
	    hideHeaders: true,
	    hideBorders: true,
	    bodyStyle: 'padding-left: 10px', 
	    header: false,
	    autoHeight: true,
	    forceFit: true,
	    trackMouseOver:false,
	    monitorResize: true,
	    autoScroll: true,
	    loadMask: false,
	    viewConfig: {
		forceFit:true,
		hideHeaders: true,
		header: false,
		emptyText: 'No Messages'
	    }
	});

	this.grid = grid;
	this.cm = cm;
	var cont = Ext.getCmp('chat-messages');
	this.gridPanel = cont.add(this.grid);
	cont.doLayout();
	this.cont = cont;
    
	this.ds.load('on', function() {
	    Ext.getCmp('chat-messages').getEl().findParent('div.x-panel-body', 2, true).scroll("b",500, false);
	}, this);

	layout.getComponent('south').on('resize', function() {
	    Ext.getCmp('chat-messages').setWidth(Ext.getCmp('chat-center').getSize().width - 20);
	    this.grid.setWidth(this.ct.getSize().width - 20);
	    Ext.getCmp('chat-messages').getEl().findParent('div.x-panel-body', 2, true).scroll("b",500, false);
	}, this, {delay:1000});

	if (!("WebSocket" in window)) {
	    this.setOwnMsg('', "WebSocket NOT supported by your browser. Try another browser. Chrome is recommended.");
	    return;
	    }
	
	var me = this;
	var ws = new WebSocket("ws://"+document.location.hostname+":8890/echo");
	
	ws.onopen = function() {
	    var str = JSON.stringify({'command':'hello', 'message': 'WEB,127.0.0.1,20000,' + _user})
//	    console.log(str);
	    ws.send(str);

	    }
	    
	ws.onmessage = function(reply) {
	    var o = JSON.parse(reply.data.toString(), null);
	    switch (o.command) {
		case 'helloack':
		    _web_nr = o.web_nr;
		    _ws = ws;
		    ws.send(JSON.stringify({command: 'ready', web_nr: o.web_nr}));
		    break;
		case 'msg':
		    var m = JSON.stringify(o.message);
		    var ma = m.replace(/\"/g, '').replace(/\r/g, '').replace(/\n$/, '').split(/\\n/);
//"
		    for (var mi = 0; mi<ma.length; mi++) me.setOwnMsg('', ma[mi]);
		    break;
		case 'ping':
		    // pong !
		    break;
		case 'remotedom':
		    var m = o.message;
		    var tasknum = o.tasknum*1;
		    if (!Tasks[tasknum]) {
			var tasknamepath = o.taskname.split('/');
//		    	var taskname = (tasknamepath.length > 0) ? tasknamepath[tasknamepath.length-1] : '';
			var taskname = tasknamepath[tasknamepath.length-1] || '';
			Tasks[tasknum] = {};
			Tasks[tasknum].vars = {};
			Tasks[tasknum].vars.document = window.document;
			var tb = new TabItem({module: "ModTask"}).addTab();
			Tasks[tasknum].tab = tb;
			Tasks[tasknum].tid = "Tab"+tb.module.tid;
			tb.setTitle("Task #"+tasknum+" - "+taskname);
			}
		    var __tvar = Tasks[tasknum].vars;
		    var __tid = Tasks[tasknum].tid;
		    __tvar.__tid = __tid;
		    with(__tvar) {
			try {
			    for (var ci=0; ci<m.length; ci++) {
				if (/(var|let|const)\s(?![=,;])/.test(m[ci])) {
				    me.setOwnMsg('', "Error: __remoteDOM: " +
					"Variable declarations are forbidden. " +
					"Use undeclared variables.\n" + m[ci]);
				    }
				else eval(m[ci]);
				}
			    }
			catch(ex) {
			    me.setOwnMsg('', "Error: __remoteDOM: " + ex + "\n  " + m[ci]);
			    }
			}
//		    me.setOwnMsg('', 'dom length = ' + m.length);
		    break;
		case 'chuser':
		    _user = o.user;
		    me.form.findField('chat-user').setRawValue(_user + " >:");
		    break;
		case 'shellcmd':
		    if (o.subcmd == "clear") {
			me.ds.removeAll();
			me.grid.getView().refresh();
			break;
			}
		    var m = JSON.stringify(o.msg);
		    var ma = m.replace(/\"/g, '').replace(/\r/g, '').replace(/\n$/, '').split('\\n');
//"
		    for (var mi = 0; mi<ma.length; mi++) me.setOwnMsg('', ma[mi]);
		    break;
		default:
		    me.setOwnMsg('', 'Server error: Unrecognized command "' + o.command + '" received.');
		}
	    }
	    
	ws.onclose = function(evt) {
//	    evt.stopEvent();
	    me.setOwnMsg('', 'Console session is closed by server. Refresh this page to reconnect.');
	    _ws = null;
	    }

	ws.onerror = function(error) {
	    me.setOwnMsg('', 'Web client: Transmission error: ', error);
//	    console.log('Transmission error: ', error);
	    }
	    
	this.ws = ws;

	return this.grid;

	},
	
    postmsg: function(o, e) {
    
	var v = o.getValue();
	var k = e.getKey();
	var scope = this;
	
	if (k == e.RETURN) {
	    if (v == '') {
		e.stopEvent();
		return;
	    }

	    if (_ws) {
		var field = this.form.findField('chat-msg');
		_ws.send(JSON.stringify({command: 'shell', msg: field.getRawValue(), user: _user, web_nr: _web_nr}));
		this.setOwnMsg('', _user + '>: ' + field.getRawValue());
		field.setValue('');
	    } else { this.setOwnMsg('', "Server error: Server is inaccessible."); }

	    e.stopEvent();
	}
	
    },
	
    setOwnMsg: function(r, msg) {
	var o = {'results': 1, rows: [{'msg': msg}]};
	this.ds.loadData(o, true);
//	this.grid.getView().refresh();
	Ext.getCmp('chat-messages').getEl().findParent('div.x-panel-body', 2, true).scroll("b",500, false);

    }

});
