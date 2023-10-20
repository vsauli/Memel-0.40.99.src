var actions = [];


Trolis = function() {

    var app = "Trolis";

    return {
    
	app: app,

	news: {},
	
	chat: false,
	
	tabs:[],
	
	conn: {},
	
	modules: [],

	init: function() {
	
	    Ext.getCmp('east-panel').activate(1);
	    Ext.getCmp('east-panel').activate(0);
	    this.initUser();
	},
	
	initUser: function() {
	    this.getModules();
	    this.showNews();
	    this.setChat();
	},

	loginOk: function(r) {
	    var o;
	    eval('o='+r.responseText);
	    if (!o.success) {
		Ext.MessageBox.alert('Errors', o.message);
		return;
		}
	    Ext.getCmp('t-user').setValue("");
	    Ext.getCmp('t-password').setValue("");
	    if (_ws) _ws.send(JSON.stringify({command: 'chown', oldOwner: _user, newOwner: o.user, web_nr: _web_nr}));
	    _user = o.user;
	    _agent = o.agent;
	    _cluster = o.cluster;
	    _session = o.session;
	    _setup = o.setup;
	    var ct = Ext.getCmp("centertab");
	    ct.removeAll(true);
//	    for (var i=0; i<ct.items.length;i++) {
//		ct.items.get(i).destroy();
//		ct.items.removeAt(i);
//		}
	    for (var im in this.tabs) {
		delete this.tabs[im];
		}
	    this.modules = [];
	    for (var i=0; i<o.modules.length; i++) {
		this.modules.push(o.modules[i]);
		}
	    this.modules.push({module: 'ModOPU', id: 'Parallel<br>JavaScript<br>IDE', cls: 'opu-icon', pane: 'module'});
	    Ext.getCmp('d-user').hide();
	    Ext.getCmp('t-user').hide();
	    Ext.getCmp('d-password').hide();
	    Ext.getCmp('t-password').hide();
	    Ext.getCmp('login-btn').hide();
	    Ext.getCmp('register_top').hide();
	    Ext.getCmp('user-agent').show();
	    Ext.getCmp('logout-btn').show();
//	    layout.getComponent('west').hide();
//	    layout.getComponent('west').collapse();
//	    layout.getComponent('east-panel').expand();
	    Ext.getCmp('user-agent').setValue(_user + '@' + _agent);
	
	    TrolisApp.initUser();
	},
	
	loginFail: function() {
	    Ext.MessageBox.alert('Errors', 'Login failed. Check connection.');
	},
	    
	login: function(o, e) {
	    var scope = this;
	    var conn = new Ext.data.Connection({
		url: rootURL + '/dbops.js',
		method: 'POST'
		});

	    conn.request({
		params: 'mod=login' + '&user=' + Ext.getCmp('t-user').getRawValue() +
				'&passwd=' + Ext.getCmp('t-password').getRawValue(),
		success: TrolisApp.loginOk,
		failure: TrolisApp.loginFail,
		scope: scope
		});

	},
	
	logout: function(o, e) {
	    var conn = new Ext.data.Connection({
		url: rootURL + '/dbops.js',
		method: 'POST'
		});

	    conn.request({
		params: 'mod=logout' + '&user=' + _user + '&session=' + _session,
		success: Ext.emptyFn,
		failure: Ext.emptyFn,
		scope: this
		});

	    if (_ws) _ws.send(JSON.stringify({command: 'chown', oldOwner: _user, newOwner: 'anonymous', web_nr: _web_nr}));
	    
	    _user = 'anonymous';
	    _agent = 'public';
	    Ext.getCmp('user-agent').hide();
	    Ext.getCmp('logout-btn').hide();
	    Ext.getCmp('d-user').show();
	    Ext.getCmp('t-user').show();
	    Ext.getCmp('d-password').show();
	    Ext.getCmp('t-password').show();
	    Ext.getCmp('login-btn').show();
	    Ext.getCmp('register_top').show();
//	    Ext.getCmp('west').show();
//	    Ext.getCmp('west').collapse();
	    Ext.getCmp('east-panel').collapse();

	    var ct = Ext.getCmp("centertab");
	    for (var i=0; i<ct.items.length;) {
		ct.items.get(i).destroy();
		}
	    for (var im in this.tabs) {
		delete this.tabs[im];
		}
	    this.modules = [];
	    this.modules.push({module: 'ModOPU', id: 'Parallel<br>JavaScript<br>IDE', cls: 'opu-icon', pane: 'module'});
	    this.modules.push({module: 'ModInfo', id: 'Readme', cls: 'book-icon', pane: 'module'});

	    this.setModulePanel('module');
	    this.setModulePanel('tool');

	},

	getModules: function() {
	    if (_user == '' || _user == 'anonymous') {
		this.modules = [];
		this.modules.push({module: 'ModOPU', id: 'Parallel<br>JavaScript<br>IDE', cls: 'opu-icon', pane: 'module'});
		} 

	    this.setModulePanel('module');
	    this.setModulePanel('tool');
	},
	
	setModulePanel: function(pane) {
	    var a = [];
	    var i = 0;
	    var pn;
	    var pn0 = null;
	    var tm = this.modules;
	    this.tm = tm;
	    a[0] = Ext.getCmp(pane + '-panel-1');
	    a[1] = Ext.getCmp(pane + '-panel-2');

	    while(i < 2) {
		var p = pane + '-panel-';
		var arr = a[i].findByType('box');
		for (var j = 0; j<arr.length; j++) {
		    if (arr[j].id !== p +(i+1)) {
			a[i].remove(arr[j]);
		    }
		}
		i++;
	    }

	    for (var j = 0; j < this.modules.length; j++) {
	        if (this.modules[j].pane != pane) continue;
		var pn = new Ext.Panel({
		    forceLayout: true,
		    xtype: 'box',
		    monitorResize: true,
//		    layout: 'hbox', 
		    cls: this.modules[j].cls,
		    html: this.modules[j].id,
		    id: 'panel-' + this.modules[j].id
		});
		if (j==0) pn0 = pn;
		a[i % 2].add(pn);
		a[i % 2].doLayout(false, true);
		i++;
	    }
	    i = 0;
	    while(i < 2) {
		a[i].cascade(function(){
		    var theid = (!this.getEl())? this : this.getEl();
		    if (theid.id !== pane + '-panel-'+(i+1)) {
			if (theid.relayEvent) theid.relayEvent('click', this);
			this.on('render', function(e, t) {
			    this.el.relayEvent('click', this);
			});
			var scope = this;
			this.on('click', function(e, t){
			    for (var m='', k=0; k<TrolisApp.modules.length; k++) {
				if ('panel-'+TrolisApp.modules[k].id === this.id) 
				    {m = TrolisApp.modules[k];}
			    }
			    if (m === '') { alert('Module misconfiguration.'); }
			    else new TabItem({module: m.module},TrolisApp.tabs).addTab();
			}, this);
		    }
		});
		i++;
	    }
	    m = {module: 'ModInfo', id: 'Readme', cls: 'book-icon', pane: 'module'};
	    if (pane == m.pane) new TabItem({module: m.module},TrolisApp.tabs).addTab();
	    if (pn0 && pane == 'module') pn0.fireEvent('click');
	},
	
	showNews: function() {
	    
	    this.news = Ext.getCmp('news-grid');

	    if (!this.news) {
		this.news = new ModNews().initModule(this, layout.findById('west')).show();
	    }
	
	},
	
	setChat: function() {

//	    return; // disabled
	    if (!this.chat) {
		this.chat = new ModChat().initModule(this, Ext.getCmp('chat-chat'));
	    }
//	    else {
//		this.chat.ds.baseParams.users = _user;
//		this.chat.users_ds.baseParams.users = _user;
//	    }
	
	},
	
	loadModule: function(m, cb, sc) {
	
	    this.mconn = new Ext.data.Connection({
		url: rootURL + "/dbops.js",
		method: 'GET'
	    });

	    if (!window[m]) {
		this.mconn.request({
		    params: 'mod=get_module&user=' + _user + '&session=' + _session + '&module=' + m,
		    success: function(r) {
			try { eval('var a; ' + r.responseText)} catch(e) {alert(e) };
			cb(m, sc);
		    },
		    failure: function() { alert('Failed to load module: ' + m); },
		    scope: this
		});
	    }
	    else {
		cb(m, sc);
	    }	
	}

    };
};


var regs = [];

Registry = function(regname, noload) {

    var idvalue = 'reg-key';
    if (regname == 'repfld') idvalue = 'id';

    this.ds = new Ext.data.Store({
        proxy: new Ext.data.ScriptTagProxy({
            url: rootURL + '/dbops.js'
        }),

        // create reader that reads the Registry records
        reader: new Ext.data.JsonReader({
            root: 'rows',
            totalProperty: 'results',
            id: idvalue
        }, [
            {name: 'reg-key'},
            {name: 'reg-value'},
            {name: 'reg-value3'},
            {name: 'reg-value4'}
       ]),

        remoteSort: false
    });
    if (regname == 'port' || regname == 'portto' || regname == 'ship' || regname == 'nation' || regname == 'age' || regname == 'repfld') {
	this.ds.setDefaultSort('reg-value', 'asc');
	}
    else if (regname == 'svc' || regname == 'ltype') this.ds.setDefaultSort('reg-key', 'asc');
    if (!noload)
	this.ds.load({params:{mod:'get_reg',start:0, limit:0, table: regname, cluster: _cluster, user: _user, dbname: _agent}});
}

TabItem = function(config, tabs) {

	ct = Ext.getCmp("centertab");

//	layout.getComponent("east").collapse();
	Ext.getCmp('east-panel').collapse();

	this.moduleName = "Main";
	this.tab = {};
	this.config = config;

	var m = this.config.module;

	this.conn = new Ext.data.Connection({
	    url: rootURL + "/dbops.js",
	    method: 'GET'
	});

	this.addTab = function() {
	    TrolisApp.loadModule(m, this.launchTab, this);
	    return this.tab;
	};

	this.launchTab = function(m, sc) {
	    if (!window[m]) {
		alert('Module ' + m + ' is not found');
		return false;
	    }
	
	    for (var i=0; i<ct.items.length; i++) {
		if (m == 'ModTask') break;
		if (m == ct.items.get(i).module.moduleName) {
		    if (config.inst == undefined || 
			config.inst == 1) {
			ct.setActiveTab(i);
			alert('Module: '+ m + '. Only one instance of this module is allowed.');
			return false;
			}
		    }
		}

	    sc.tab = new window[m]().initModule(sc, ct, config);
	    sc.tab.show();
	    TrolisApp.tabs[sc.tab.module.tid] = sc.tab;
	    }
}

function getFormObj(sc) {

    var o = sc.ownerCt;
    if (_ext_version >= "3.0.0") o = o.ownerCt; // one container deeper
    return o;
}

function saveExcel(EO) {

    alert(EO.Name);
//    Sheets.Item(1).saveAs("C:\temp.xls");
//    EO.ActiveWindow.close(false);
}
