Module = function(config) {

    Ext.apply(this.config);
    Module.superclass.constructor.call(this);
    this.init();
}

Ext.extend(Module, Ext.util.Observable, {

    id: '',
    cls: '',
    ct: {},
    panel: {},
    subtab: {},
    ready: false,
    rsm: {},
    ds: {},
    grid: {},
    gridPanel: {},
    cm: {},
    sf: {},
    form: {},
    sconn: new Ext.data.Connection({
	url: "/ssjs/dbops.js",
	method: 'POST'
	}),
    wconn: new Ext.data.Connection({
	url: "/ssjs/dbops.js",
	method: 'POST'
	}),
    fconn: new Ext.data.Connection({
	url: "/ssjs/fileops.js",
	method: 'POST'
	}),
    cr_grid: function(config) {

	var grid = new Ext.grid.EditorGridPanel({
    	    store: this.ds,
    	    colModel: this.cm,
    	    selModel: new Ext.grid.RowSelectionModel({singleSelect:true}),
    	    enableColLock:false,
	    title: config.title,
    	    loadMask: true,
	    monitorResize: true,
	    monitorWindowResize: true,
	    autoShow: true,
	    height: 320,
	    layout: 'fit',
	    view: new Ext.grid.GridView({epmtyText: 'No records availabale'}),
	    frame: true,
//	    autoExpandColumn: 'cl-name',
//	    autoExpandMax: 300,
	    bbar: (config && config.xtype == 'main') ? new Ext.PagingToolbar({
    		pageSize: 10,
		store: this.ds,
    		displayInfo: true,
    		displayMsg: 'Displaying records {0} - {1} of {2}',
    		emptyMsg: "No records to display",
		items: [
		    '-',
		    'Column Search',
		    this.sf
		    ]
		}) : null
	});

	return grid;
    
    },
    
    init: Ext.emptyFn
    
});


ModOPU = Ext.extend(Module, {

    initModule: function(that, ct, config) {
	this.id = "Parallel JavaScript IDE";
	this.cls = 'opu-icon';
	this.panel = new Ext.Panel({
	    hideBorders: false,
	    autoScroll: true,
	    bodyStyle: 'padding: 15px'
	});
	var tab = ct.add({
	    title: this.id,
	    hideBorders: (config && config.xtype == 'dependent') ? false: true,
	    autoScroll: true,
	    closable: true,
	    items: [this.panel]
	}).show();
	tab.module = this;
	this.tab = tab;
	this.tab.doLayout();
	this.initIface(config);
	return tab;
    },


    initIface: function(config) {
    
    	var treepanel = new Ext.ux.FileTreePanel({
		 height:250
		,autoWidth:true
		,id:'ftp'
		,title:'Workspace File Explorer'
		,rootPath:'workspaces/' + _agent
		,rootText:'Root ['+_agent + ']'
		,url: rootURL + '/fileops.js'
		,topMenu:true
		,autoScroll:true
		,enableProgress:false
		,enableUpload:true
		,that: this
		,baseParams:{user: _user, dbname: _agent, session: _session}
		,singleUpload:true
	});
	
    this.panel.add(treepanel);
    this.panel.doLayout();
    this.treepanel = treepanel;
    var treemodel = this.treepanel.getSelectionModel();
    this.treepanel.on('load', function(node) {
	if (/^Root/.test(node.text)) {
	    for (var j=0; j<node.childNodes.length; j++) {
		if (node.childNodes[j].text == "README") {
		    node.on('expand', function() {
			for (var j=0; j<this.childNodes.length; j++) {
			    if (this.childNodes[j].text == "README") {
				this.childNodes[j].select();
				break;
				}
			    }
			}, node, {single:"true"});
		    break;
		    }
		}
	    }
	});

    treepanel.getSelectionModel().on('beforeselect', function(sc, newNode, oldNode) {
	this.checkSave(oldNode, newNode);
	}, this);
	
    this.subtab = new Ext.TabPanel({
	    activeTab: 0,
	    hideBorders: true,
	    border: false,
	    bodyBorder: false,
	    autoWidth: true,
	    autoScroll: true,
	    autoHeight: true,
//	    height: 560,
	    monitorResize: true,
	    monitorWindowResize: true,
	    style: 'margin-top: 15px',
	    plain: true

	});

    this.panel.add(this.subtab);
    this.panel.doLayout();

    mce_panel = new Ext.Panel({
	    hideBorders: false,
	    autoScroll: true,
	    height:450,
	    html: '<!--<form method="post" action="http://87.251.211.195/savefile.js"> --> \
		<textarea id="elm1" name="elm1" rows="18" cols="80" style="width: 100%"> \
		</textarea> \
	<!--<div> \
		<a href="javascript:;" onmousedown="tinyMCE.get(\'elm1\').show();">[Show]</a> \
		<a href="javascript:;" onmousedown="tinyMCE.get(\'elm1\').hide();">[Hide]</a> \
		<a href="javascript:;" onmousedown="tinyMCE.get(\'elm1\').execCommand(\'Bold\');">[Bold]</a> \
		<a href="javascript:;" onmousedown="alert(tinyMCE.get(\'elm1\').getContent());">[Get contents]</a> \
		<a href="javascript:;" onmousedown="alert(tinyMCE.get(\'elm1\').selection.getContent());">[Get selected HTML]</a> \
		<a href="javascript:;" onmousedown="alert(tinyMCE.get(\'elm1\').selection.getContent({format : \'text\'}));">[Get selected text]</a> \
		<a href="javascript:;" onmousedown="alert(tinyMCE.get(\'elm1\').selection.getNode().nodeName);">[Get selected element]</a> \
		<a href="javascript:;" onmousedown="tinyMCE.execCommand(\'mceInsertContent\',false,\'<b>Hello world!!</b>\');">[Insert HTML]</a> \
		<a href="javascript:;" onmousedown="tinyMCE.execCommand(\'mceReplaceContent\',false,\'<b>{$selection}</b>\');">[Replace selection]</a> \
	</div> \
	<br /> \
	<input type="submit" name="save" value="Save" /> \
	<input type="reset" name="reset" value="Reset" /> \
</form> -->',
	    bodyStyle: 'padding: 15px'
	});

    ace_panel = new Ext.Panel({
	    hideBorders: true,
	    border: false,
	    bodyBorder: false,
	    height: 500,
	    html: '<div id="editor"></div>',
    	    bodyStyle: 'padding: 15px'
	});

    ace_panel.doLayout();

    this.subtab.add({
	xtype: 'panel',
	title: 'Text',
	hideBorders: true,
	border: false,
	bodyBorder: false,
	autoScroll: true,
	name: 'tab0',
	closable: false,
	autoheight: true,
//	height: 500,
	items: [
	    new Ext.Toolbar({
		height: 25,
		hideBorders: true,
		bodyBorder: false,
		border: false,
		style: 'padding: 0 5 5 5',
		items: [{
		    text: 'Run',
	    	    name: 'save_run_top',
	    	    width: 60,
	    	    handler: function() {
			Ext.MessageBox.show({
			    msg: 'Run this file?',
			    buttons: Ext.MessageBox.YESNO,
			    buttonId: 'yes',
			    closable: false,
			    width: 400,
			    modal: true,
			    fn: function(btn) {
				if (btn == 'yes') {
				    Ext.MessageBox.hide();
				    this.runFile();
				    }
				},
			    scope: this,
			    icon: Ext.MessageBox.QUESTION
			    });
	    		},
	    	    scope: this
	    	    },
	    	    {xtype: 'tbspacer',
	    	    width: 20
	    	    },
	    	    {xtype: 'displayfield',
	    	    width: 300,
	    	    name: 'filename'
	    	    },
	    	    {xtype: 'tbfill',
	    	    },
		    {xtype: 'displayfield',
	    	    width: 70,
	    	    name: 'entrytype',
	    	    value: 'Insert'
	    	    },
	    	    {xtype: 'tbspacer',
	    	    width: 50
	    	    },
	    	    {xtype: 'displayfield',
	    	    width: 70,
	    	    name: 'modified',
	    	    style: 'color: "red";',
	    	    value: ''
		    }]
		}),
	    ace_panel,
	    new Ext.Toolbar({
		height: 30,
		hideBorders: true,
		bodyBorder: false,
		border: false,
		style: 'padding: 4 5 5 5',
		items: [
		    {text: 'Save',
	    	    width: 60,
	    	    name: 'save_text',
	    	    handler: function() {
			Ext.MessageBox.show({
			    msg: 'Save file?',
			    buttons: Ext.MessageBox.YESNO,
			    buttonId: 'yes',
			    closable: false,
			    width: 400,
			    modal: true,
			    fn: function(btn) {
				if (btn == 'yes') {
				    Ext.MessageBox.hide();
				    this.saveFile();
				    }
				},
			    scope: this,
			    icon: Ext.MessageBox.QUESTION
			    });
	    		},
	    	    scope: this
	    	    }, {
	    	    text: 'Reset',
	    	    name: 'save_reset',
		    handler: function() {
			var sm = this.treepanel.getSelectionModel();
			var node = sm.getSelectedNode();
			this.treepanel.readNode(node);
			},
		    scope: this,
	    	    width: 60
		    }, {
		    text: 'Run',
	    	    name: 'save_run',
	    	    width: 60,
	    	    handler: function() {
			Ext.MessageBox.show({
			    msg: 'Run this file?',
			    buttons: Ext.MessageBox.YESNO,
			    buttonId: 'yes',
			    closable: false,
			    width: 400,
			    modal: true,
			    fn: function(btn) {
				if (btn == 'yes') {
				    Ext.MessageBox.hide();
				    this.runFile();
				    }
				},
			    scope: this,
			    icon: Ext.MessageBox.QUESTION
			    });
	    		},
	    	    scope: this
	    	    }]
		})
	    ]}).show();

    this.subtab.add({
	title: 'HTML',
	hideBorders: false,
	height: 530,
	autoScroll: true,
	closable: false,
	items: [
	    mce_panel,
	    new Ext.Toolbar({
		height: 30,
		hideBorders: true,
		bodyBorder: false,
		border: false,
		style: 'padding: 4 5 5 5',
		items: [
		    {text: 'Save',
	    	    width: 60,
	    	    name: 'save_html',
	    	    handler: function() {
			Ext.MessageBox.show({
			    msg: 'Save HTML file?',
			    buttons: Ext.MessageBox.YESNO,
			    buttonId: 'yes',
			    closable: false,
			    width: 400,
			    modal: true,
			    fn: function(btn) {
				if (btn == 'yes') {
				    Ext.MessageBox.hide();
				    this.saveFile();
				    }
				},
			    scope: this,
			    icon: Ext.MessageBox.QUESTION
			    });
	    		},
	    		scope: this
	    	    }, {
	    	    text: 'Reset',
	    	    name: 'save_reset_html',
		    handler: function() {
			var sm = this.treepanel.getSelectionModel();
			var node = sm.getSelectedNode();
			this.treepanel.readNode(node);
			},
		    scope: this,
	    	    width: 60
	    	    }]
		})
	    ]
	}).show();

    this.subtab.add({
	title: 'Image',
	hideBorders: true,
	autoScroll: true,
	closable: false,
	forceLayout: true,
	items: [
	    {xtype: 'panel',
	     forceLayout: true,
	     id: 'image',
	     html: '<img id="imagesrc" src="#" />'
	    }
	    ]
	});

    this.subtab.doLayout();

//    this.tinyMCE = tinyMCE;

    tinyMCE.init({ 
		mode : "textareas", 
		theme : "advanced", 
		plugins : "safari,pagebreak,style,layer,table,save,advhr,advimage,advlink,emotions,iespell,inlinepopups,insertdatetime,preview,media,searchreplace,print,contextmenu,paste,directionality,fullscreen,noneditable,visualchars,nonbreaking,xhtmlxtras,template", 
		theme_advanced_buttons1 : "save,newdocument,|,bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,styleselect,formatselect,fontselect,fontsizeselect", 
		theme_advanced_buttons2 : "cut,copy,paste,pastetext,pasteword,|,search,replace,|,bullist,numlist,|,outdent,indent,blockquote,|,undo,redo,|,link,unlink,anchor,image,cleanup,help,code,|,insertdate,inserttime,preview,|,forecolor,backcolor", 
		theme_advanced_buttons3 : "tablecontrols,|,hr,removeformat,visualaid,|,sub,sup,|,charmap,emotions,iespell,media,advhr,|,print,|,ltr,rtl,|,fullscreen", 
		theme_advanced_buttons4 : "insertlayer,moveforward,movebackward,absolute,|,styleprops,|,cite,abbr,acronym,del,ins,attribs,|,visualchars,nonbreaking,template,pagebreak", 
		theme_advanced_toolbar_location : "top", 
		theme_advanced_toolbar_align : "left", 
		theme_advanced_statusbar_location : "bottom", 
		theme_advanced_resizing : true, 
		content_css : "css/content.css", 
		preformatted: false,
		forced_root_block: false,
		force_p_newlines: false,
		force_br_newlines: true,
		template_external_list_url : "lists/template_list.js", 
		external_link_list_url : "lists/link_list.js", 
		external_image_list_url : "lists/image_list.js", 
		media_external_list_url : "lists/media_list.js", 
		template_replace_values : { 
			username : "Some User", 
			staffid : "991234" 
		} 
	}); 

	this.tinyMCE = tinyMCE;

	var editor = ace.edit("editor");
	this.editor = editor;
	editor.setTheme("ace/theme/monokai");
//	editor.getSession().setMode("ace/mode/javascript");

	this.subtab.activate(2);
	this.subtab.activate(0);

	var filename = this.subtab.find('name', 'filename')[0];
	var entrytype = this.subtab.find('name', 'entrytype')[0];
	var modified = this.subtab.find('name', 'modified')[0];
	this.filename = filename;
	this.entrytype = entrytype;
	this.modified = modified;

	editor.$blockScrolling = "Infinity";

	editor.getSession().on('changeOverwrite', function(e) {
	    entrytype.setValue(editor.getOverwrite()?'Overwrite':'Insert');
	    });
	editor.getSession().selection.moveCursorFileStart();
	

	editor.getSession().on('change', function(e) {
	    modified.setValue('<font color="red">Modified</font>');
	    });

    },
    
    checkSave: function(on, nn) {
	if (!on) return;
	if (_user == 'anonymous' || _agent == 'public') return;
	if (this.modified.getValue() !== '') {
	    var text = encodeURIComponent(this.editor.getSession().getValue());
	    Ext.MessageBox.show({
		msg: 'File ' + this.treepanel.getPath(on) + ' was modified!\nSave it now?',
		buttons: Ext.MessageBox.YESNO,
		buttonId: 'yes',
		closable: false,
		width: 400,
		modal: true,
		fn: function(btn) {
		    if (btn == 'yes') {
			Ext.MessageBox.hide();
			this.saveFile(on, text);
			}
		    },
		scope: this,
		icon: Ext.MessageBox.QUESTION
		});
	    }
    },

    saveFile: function(on, ontext) {

	var dir = '';
	if (on == undefined) {
	    var sm = this.treepanel.getSelectionModel();
	    var node = sm.getSelectedNode();
	    if(node && 0 !== node.getDepth() && node.isLeaf()) {
		dir = this.treepanel.getPath(node);
		}
	    else {
		alert('Cannot save non-file entity.');
		return;
		}
	    }
	else { dir = this.treepanel.getPath(on) }
	
	var text = (ontext != undefined) ? ontext: encodeURIComponent(this.editor.getSession().getValue());
    	prm = {cmd:'savefile', dir: dir, text: text, user: _user, dbname: _agent, session: _session};

	this.fconn.request({
	    params: prm,
	    success: function(r) {
		eval("o=" + r.responseText);
		try {
		    if (o.success !== true) {
			alert(o.message);
			}
		    else {
			this.modified.setValue('');
			Ext.example.msg("Success!", "File successfully saved.", 3);
			}
		    }
		catch(e) {
		    alert('Error while saving file: '+e);
		    }
		},
	    failure: function() {
		alert('Failed to save file. Connection is broken.');
		},
	    scope: this
	    });
    },

    runFile: function(on, ontext) {

	var dir = '';
	if (on == undefined) {
	    var sm = this.treepanel.getSelectionModel();
	    var node = sm.getSelectedNode();
	    if(node && 0 !== node.getDepth() && node.isLeaf()) {
		dir = this.treepanel.getPath(node);
		}
	    else {
		alert('Cannot run non-file entity.');
		return;
		}
	    }
	else { dir = this.treepanel.getPath(on) }
	
	var text = (ontext != undefined) ? ontext: encodeURIComponent(this.editor.getSession().getValue());
    	prm = {cmd:'runfile', agent: _agent, dir: dir, text: text, web_nr: _web_nr};

	this.fconn.request({
	    params: prm,
	    success: function(r) {
		eval("o=" + r.responseText);
		try {
		    if (o.success !== true) {
			alert(o.message);
			}
		    else {
			this.modified.setValue('');
			Ext.getCmp('south').expand();
			Ext.example.msg("Success!", "The program has started.", 3);
			}
		    }
		catch(e) {
		    alert('Error while launching file: '+e);
		    }
		},
	    failure: function() {
		alert('Failed to launch file. Connection is broken.');
		},
	    scope: this
	    });
    }

});

function formatFloat(value){
	var dot_pos = value.toString().indexOf(".");
	if (dot_pos == -1) return value + ".00";
	if (dot_pos == value.toString().length-2) return value + "0";
	else return value;
}

function formatDate(value){
        return value ? value.dateFormat('Y-m-d') : '';
}

function formatDateLong(value){
	if (value == '') return '';
        return value.substr(0,4)+'-'+value.substr(4,2)+'-'+
		 value.substr(6,2)+'&nbsp;&nbsp;'+
		 value.substr(8,2)+':'+value.substr(10,2);
}

function formatPtype(value){
    r = regs['paytipe'].ds.getById(value);
    return (r) ? r.get('reg-value'): 'N/A';
}

function formatStatus(value){

    r = regs['paysts'].ds.getById(value);
    var st;
    if (value == '1') st = 'color: green;';
    else if (value == '2') st = 'color: blue; font-weight: bold';
    else if (value == '3') st = 'color: red;';
    else st = 'color: #999; font-weight: bold;';

    return (r) ? String.format("<span style='"+st+"'>"+r.get('reg-value')+"</span>"): 'N/A';
}

function formatMethod(value){
    r = regs['paymeth'].ds.getById(value);
    return (r) ? r.get('reg-value'): 'N/A';
}


ModInfo = Ext.extend(Module, {

    initModule: function(that, ct, config) {
	this.moduleName = 'ModInfo';
	this.table = 'news';
	this.id = "Info";
	this.cls = 'clt-icon';
	this.ct = ct;
	this.panel = new Ext.Panel({
	    hideBorders: true,
	    html: "<center> Loading... </center>",
	    autoScroll: true,
	    bodyStyle: 'padding: 15px'
	});
	var tab = ct.add({
	    title: ' About Project ',
	    hideBorders: (config && config.xtype == 'dependent') ? false: true,
	    autoScroll: true,
	    closable: false,
	    items: [this.panel]
	}).show();
	tab.module = this;
	this.tab = tab;
	this.tab.doLayout();
	this.initIface(config);
	return tab;
    },


    initIface: function(config) {

        var sc = this;
        var el = document.getElementById('register');
        if (el) el.addEventListener('click', function(e) {
            sc.reg_window(sc, e);
            });
        var el_top;
        var cmp_top = Ext.getCmp('register_top');
        if (cmp_top) el_top = cmp_top.getEl();
        if (el_top) {
            el_top.removeAllListeners();
            el_top.on('click', function(e) {
                sc.reg_window(sc, e);
                });
            }

	prm = {cmd:'getinfo', user: _user, dbname: _agent, session: _session};

	this.fconn.request({
	    params: prm,
	    success: function(r) {
		eval("var o=" + r.responseText);
		if (o.success == true) {
		    o.text = o.text.replace(/<strong>/g, "<b>").replace(/<\/strong>/g, "</b>");
		    o.text = o.text.replace(/<em>/g, "<i>").replace(/<\/em>/g, "</i>");
		    this.panel.body.update("<span id='base' class='reset-this'>"+o.text+"</span><a href='#' id='register' style='display:none'><a>");
		    this.panel.render();
		    }
		else {
		    alert(o.message);
		    }
		},
	    failure: function() {
		alert('Failed to load info file. Connection is broken.');
		},
	    scope: this
	    });

    },

    reg_window: function(sc, e) {

	sc.ct.disable();
	sc.first = false;
	sc.dbname_ok_fl = false;
	sc.user_ok_fl = false;
	sc.p = {
		database_name: '',
		user_name: '',
		password: '',
		password2: '',
		dbname_status: '',
		user_status: '',
		password_status: '(Alpha-numeric only)',
		password2_status: ''
        	};

	var reg_win;
	if (!sc.reg_win) {
    	    reg_win = new Ext.Window({
                layout:'fit',
                width: 450,
                height:400,
                shadow: true,
                closeAction:'hide',
                plain: false,
		title: 'Create your personal workspace',
		listeners: {
		    hide: {
			fn: function () {
			    sc.ct.enable();
			    },
			scope: sc
			}
		    },

                items: [{
                    xtype: 'form',
                    height: 250,
                    width: 440,
                    autoScroll: false,
                    bodyBorder: false,
                    bodyPadding: 10,
                    padding: '15 10 0 10',
                    header: false,
                    frame: true,
                    deferredRender: false,
                    title: 'Create workspace',
                    items: [{
			    xtype: 'textarea',
			    height: 50,
			    width: 400,
			    readOnly: true,
			    hideLabel: true,
			    style: {'background-color': 'white'},
			    value: "When registered, you'll get your exclusive workspace " +
				   "(home directory), where you can create and edit your own " +
				   "parallel JS tasks, launch them and see the results in the console."
			    }, {
			    xtype: 'displayfield',
			    height: 10,
			    value: ''
			    }, {
                            xtype: 'compositefield',
                            height: 27,
                            width: 410,
                            layout: 'hbox',
                            fieldLabel: '',
                            hideLabel: true,
                            items: [{
				xtype: 'displayfield',
				width: 100,
				value: 'User login name:'
				}, {
        			xtype: 'textfield',
                            	width: 100,
				name: 'user_name',
				vtype: 'alphanum',
				maxLength: 20,
				enableKeyEvents: true,
				allowBlank: true,
				listeners: {
				    keyup: {
					fn: function (obj, e) {
					    sc.user_ok_fl = false;
					    var fld = sc.reg_win.items.get(0).getForm().findField('user_status');
					    if (obj.getValue().length == 0) {
						fld.setValue('<font color="red">This name is mandatory</font>');
						return;
						}
					    obj.setValue(obj.getValue().replace(/ /g, ''));
					    sc.wconn.request({
						params: 'mod=user_check&user=' + obj.getValue(),
						success: function(r) {
						    try {  
							eval('var o='+r.responseText);
							if (!o.success) {
							    fld.setValue('<font color="red">Unable to check</font>');
							    alert(o.message);
							    }
							else if (o.user_ok) {
								fld.setValue('<font color="green">User name Ok</font>');
								sc.user_ok_fl = true;
								}
							     else fld.setValue('<font color="red">This name is in use</font>');
							} 
						    catch(e) {alert("Error: " + e) };
						    },
						failure: function() { 
						    alert('Failed to connect: Call system administrator.');
						    },
						scope: sc
						});
					    },
					scope: sc
					}
				    },
				value: ''
				}, {
				xtype: 'displayfield',
				name: 'user_status',
				width: 150,
				value: ''
                                }]
			    }, {
                            xtype: 'compositefield',
                            height: 27,
                            width: 410,
                            layout: 'hbox',
                            fieldLabel: '',
                            hideLabel: true,
                            items: [{
				xtype: 'displayfield',
				width: 100,
				value: 'Workspace name:'
				}, {
        			xtype: 'textfield',
                            	width: 100,
				name: 'database_name',
				vtype: 'alphanum',
				maxLength: 20,
				enableKeyEvents: true,
				allowBlank: true,
				listeners: {
				    keyup: {
					fn: function (obj, e) {
					    sc.dbname_ok_fl = false;
					    var fld = sc.reg_win.items.get(0).getForm().findField('dbname_status');
					    if (obj.getValue().length == 0) {
						fld.setValue('<font color="red">This name is mandatory</font>');
						return;
						}
					    obj.setValue(obj.getValue().replace(/ /g, ''));
					    obj.setValue(obj.getValue().replace(/\./g, '_'));
					    sc.wconn.request({
						params: 'mod=dbname_check&dbname=' + obj.getValue(),
						success: function(r) {
						    try {  
							eval('var o='+r.responseText);
							if (!o.success) {
							    fld.setValue('<font color="red">Unable to check</font>');
							    alert(o.message);
							    }
							else if (o.dbname_ok) {
								fld.setValue('<font color="green">Workspace name Ok</font>');
								sc.dbname_ok_fl = true;
								}
							     else fld.setValue('<font color="red">This name is in use</font>');
							} 
						    catch(e) {alert("Error: " + e) };
						    },
						failure: function() { 
						    alert('Failed to connect: Call system administrator.');
						    },
						scope: sc
						});
					    },
					scope: sc
					}
				    },
				value: ''
				}, {
				xtype: 'displayfield',
				name: 'dbname_status',
				width: 150,
				value: ''
                                }]
			    }, {
                            xtype: 'compositefield',
                            height: 27,
                            width: 410,
                            layout: 'hbox',
                            fieldLabel: '',
                            hideLabel: true,
                            items: [{
				xtype: 'displayfield',
				width: 100,
				value: 'Choose password:'
				}, {
        			xtype: 'textfield',
                            	width: 100,
				name: 'password',
				inputType: 'password',
				vtype: 'alphanum',
				maxLength: 20,
				allowBlank: true,
				value: ''
				}, {
				xtype: 'displayfield',
				name: 'password_status',
				width: 150,
				value: '(Alpha-numeric only)'
                                }]
			    }, {
                            xtype: 'compositefield',
                            height: 27,
                            width: 410,
                            layout: 'hbox',
                            fieldLabel: '',
                            hideLabel: true,
                            items: [{
				xtype: 'displayfield',
				width: 100,
				value: 'Repeat password:'
				}, {
        			xtype: 'textfield',
                            	width: 100,
				name: 'password2',
				inputType: 'password',
				maxLength: 20,
				vtype: 'alphanum',
				allowBlank: true,
				value: ''
				}, {
				xtype: 'displayfield',
				name: 'password2_status',
				width: 150,
				value: ''
				}]
			    }, {
                            xtype: 'compositefield',
                            height: 27,
                            width: 410,
                            layout: 'hbox',
                            fieldLabel: '',
                            hideLabel: true,
                            items: [{
				xtype: 'displayfield',
				width: 100,
				value: 'User full name:'
				}, {
        			xtype: 'textfield',
                            	width: 200,
				name: 'full_name',
				maxLength: 100,
				allowBlank: true,
				value: ''
				}, {
				xtype: 'displayfield',
				name: 'name_status',
				width: 50,
				value: '&nbsp;(optional)'
                                }]
			    }, {
                            xtype: 'compositefield',
                            height: 27,
                            width: 410,
                            layout: 'hbox',
                            fieldLabel: '',
                            hideLabel: true,
                            items: [{
				xtype: 'displayfield',
				width: 100,
				value: 'E-Mail:'
				}, {
        			xtype: 'textfield',
                            	width: 200,
				name: 'e_mail',
				maxLength: 100,
				allowBlank: true,
				value: ''
				}, {
				xtype: 'displayfield',
				name: 'email_status',
				width: 50,
				value: '&nbsp;(optional)'
                                }]
			    }, {
                            xtype: 'compositefield',
                            height: 27,
                            width: 410,
                            layout: 'hbox',
                            fieldLabel: '',
                            hideLabel: true,
                            items: [{
				xtype: 'displayfield',
				width: 100,
				value: 'Company name:'
				}, {
        			xtype: 'textfield',
                            	width: 200,
				name: 'comp_name',
				maxLength: 100,
				allowBlank: true,
				value: ''
				}, {
				xtype: 'displayfield',
				name: 'comp_status',
				width: 50,
				value: '&nbsp;(optional)'
                                }]
                            }],
		    buttons: [{
                	text:'Create',
                	handler: function(){
			    var frm = sc.reg_win.items.get(0).getForm();
			    if (frm.findField('database_name').getValue().length == 0) {
				frm.findField('dbname_status').setValue('<font color="red">This name is mandatory</font>');
				alert('You must enter the workspace name');
				return;
				}
			    if (!sc.dbname_ok_fl) {
				frm.findField('dbname_status').setValue('<font color="red">Workspace name is in use</font>');
				alert('Workspace name is in use');
				return;
				}
			    frm.findField('dbname_status').setValue('');
        		    if (frm.findField('user_name').getValue().length == 0) {
				frm.findField('user_status').setValue('<font color="red">This name is mandatory</font>');
				alert('You must enter the user name');
				return;
				}
			    if (!sc.user_ok_fl) {
				frm.findField('user_status').setValue('<font color="red">User name is in use</font>');
				alert('User name is in use');
				return;
				}
			    frm.findField('user_status').setValue('');
			    
			    if (frm.findField('password').getValue().length == 0) {
				alert('You must enter the password');
				return;
				}
			    if (frm.findField('password').getValue().length < 6) {
				alert('The password must be at least 6 symbols');
				return;
				}
			    frm.findField('password2_status').setValue('');
			    if (frm.findField('password').getValue() != frm.findField('password2').getValue() ) {
				frm.findField('password2_status').setValue('<font color="red">Passwords do not match!</font>');
				alert('Passwords do not match!');
				return;
				}

			    sc.reg_mask = new Ext.LoadMask(sc.reg_win.getEl(), {msg: 'Creating workspace. Please Wait...', removeMask: false});
			    sc.reg_mask.show();

			    sc.wconn.request({
				params: 'mod=create_database'
					+ '&android=' + _android
					+ '&dbname=' + frm.findField('database_name').getValue()
					+ '&user_name=' + frm.findField('user_name').getValue()
					+ '&password=' + frm.findField('password').getValue()
					+ '&comp_name=' + frm.findField('comp_name').getValue()
					+ '&e_mail=' + frm.findField('e_mail').getValue()
					+ '&full_name=' + frm.findField('full_name').getValue(),
				success: function(r) {
				    sc.reg_mask.hide();
                    		    sc.reg_win.hide();
				    sc.ct.enable();
				    try {
					eval('var o='+r.responseText);
					if (!o.success) {
					    alert('Unable to create workspace.\n Error: '+o.message+'\nCall sytem administrator');
					    }
					else 
					    alert('Workspace successfully created.\nNow you can login with user name and password');
					} 
				    catch(e) {
					sc.reg_mask.hide();
                    			sc.reg_win.hide();
					sc.ct.enable();
					alert("Workspace creation error: " + e) 
					};
				    },
				failure: function() { 
				    sc.reg_mask.hide();
                    		    sc.reg_win.hide();
				    sc.ct.enable();
				    alert('Failed to connect: Call system administrator.');
				    },
				scope: sc
				});
                	    },
			scope: sc
            		},{
                	text: 'Cancel',
                	handler: function(){
//			    sc.ct.enable();
                    	    sc.reg_win.hide();
                	    }
            		}]
		    }]
        	});
    	    sc.reg_win = reg_win;
    	    }
	sc.reg_win.on('afterrender', function(o) { sc.first = true; });
	sc.reg_win.on('show', function(o) {
	    var pos = o.getPosition(true);
	    if (sc.first) o.setPosition(pos[0], pos[1] - 25);
	    sc.first = false;
	    }, sc, {delay: 25});

	sc.reg_win.items.get(0).getForm().setValues(sc.p);
	sc.reg_win.show(sc);

    }

});


var schema = {};
var colmodel = {};

ModNews = Ext.extend(Module, {

    ct: {},

    initModule: function(that, ct, config) {
	this.id = "News";
	this.cls = 'news-icon';

/* Not a common approach for modules
	this.panel = new Ext.Panel({
	    hideBorders: true,
	    autoScroll: true,
	    forceFit: true,
	    syncSize: true,
	    monitorResize: true,
	    bodyStyle: 'padding: 1px'
	});
	ct.add(this.panel).show();
	ct.doLayout();
*/
	this.ct = ct;
	return this.initIface(config);
    },


    initIface: function(config) {
    
	var ds = new Ext.data.Store({
    	    proxy: new Ext.data.ScriptTagProxy({
        	url: rootURL + '/dbops.js'
    	    }),

    	    reader: new Ext.data.JsonReader({
        	root: 'rows',
        	totalProperty: 'results',
		successProperty: 'success',
		messageProperty: 'message',
        	id: 'id'
    		}, schema['news']
	    ),

    	    remoteSort: true
	});

        ds.setDefaultSort('msgnr', 'desc');
	this.ds = ds;
	
        var cm = new Ext.grid.ColumnModel([{
		id: 'subj',
        	dataIndex: 'msg',
		width: 170,
		renderer: newshead
	    }, {
		dataIndex: 'cdate',
		renderer: newsdate,
		width: 60
	    }]);

	cm.menuDisabled = true;
	this.cm = cm;


	var grid = new Ext.grid.GridPanel({
            id:'news-grid',
	    store: ds,
	    cm: this.cm,
	    sm:new Ext.grid.RowSelectionModel({singleSelect:true}),
	    hideHeaders: true,
	    header: false,
	    trackMouseOver:false,
	    monitorResize: true,
	    autoScroll: true,
//	    autoHeight: true,
//	    autoExpandColumn: 'subj',
//	    layout: 'fit',
//	    forceFit: true,
	    loadMask: {msg:'Loading News...'},
	    viewConfig: {
		forceFit:true,
		hideHeaders: true,
		header: false,
		enableRowBody:true,
		emptyText: 'No News',
		getRowClass : function(record, rowIndex, p, ds){
		    p.body = '<div class="news-body">'+record.data.msg+'</div>';
		    return 'x-grid3-row-expanded';
		}
	    },
	    bbar: new Ext.PagingToolbar({
	        pageSize: 5,
	        store: ds,
//		displayInfo: true,
//		displayMsg: '{0} - {1} of {2}',
		emptyMsg: "No News"
	    })
	});

	this.grid = grid;
	this.gridPanel = this.ct.add(this.grid);
	this.grid.setHeight(this.ct.getInnerHeight());
	this.ct.doLayout();
	this.grid.syncSize();

	this.ct.on('resize', function() { this.grid.setWidth(this.ct.getSize().width); }, this);
	this.grid.setWidth(this.ct.getSize().width);
//	this.ct.on('resise', function() { this.grid.syncSize(); this.grid.setWidth(this.ct.getInnerWidth()); }, this);

	this.ds.baseParams = {mod: 'get_table', table: 'news', users: _user};
	this.ds.load({params:{start:0, limit:5, search: ''}});

	return this.grid;

	}
	
	
});


function newshead(value, p, record) {
        return String.format(
                '<div class="news-subj"><b>{0}:&nbsp;</b></div><div class="news-topic"><b>{1}</b></div>',
                record.data.msgnr, record.data.subj);

}

function newsdate(value, p, record) {
        return String.format(
                '<div class="news-date"><b>{0}</b><br>{1}</div>',
        	value.dateFormat('Y-m-d'), record.data['fr_user']);

}

schema['news'] =  [
            {name: 'msgnr'},
            {name: 'lang'},
            {name: 'msg'},
            {name: 'subj'},
            {name: 'to_user'},
            {name: 'type'},
            {name: 'sts'},
            {name: 'cdate', type: 'date', dateFormat: 'y/m/d'},
            {name: 'ctime'},
            {name: 'fr_user'},
	    {name: 'cat'}
];

ModTask = Ext.extend(Module, {

    initModule: function(that, ct, config) {
	this.tid = ++_tabid;
	var tid = this.tid;
	this.moduleName = "ModTask";
	this.table = "news";
	this.id = "t"+tid;
	this.cls = 'book-icon';
	this.panel = new Ext.Panel({
	    id: "Tab"+tid,
	    hideBorders: true,
	    autoScroll: true,
	    monitorResize: true,
	    monitorWindowResize: true,
	    padding: '0px'
	});
	var tab = ct.add({
	    title: 'Task #%t% - ',
	    hideBorders:  true,
	    autoHeight: false,
	    autoScroll: true,
	    monitorResize: true,
	    monitorWindowResize: true,
	    closable: true,
	    items: [this.panel]
	}).show();
	this.ct = ct;
	this.tab = tab;
	this.tab.tid = this.tid;
	this.tab.module = this;
	this.tab.doLayout();
//	this.loadSetup('trf,trfl', this.moduleName, this.initIface, this, config);
	return this.tab;
    },

    initIface: function(config) {

    }
});

