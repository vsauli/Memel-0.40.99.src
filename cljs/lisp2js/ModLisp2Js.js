ModLisp2Js = Ext.extend(Module, {

    initModule: function(ct, config) {
	this.id = "LISP interpreter";
	this.cls = 'opu-icon';
	this.panel = new Ext.Panel({
	    hideBorders: false,
	    autoScroll: true,
	    bodyStyle: 'padding: 15px'
	});
	var tab = ct.add({
	    title: 'OPU model',
	    hideBorders: true,
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
    
	var form = new Ext.form.FormPanel({
    	    labelAlign: 'right',
    	    labelWidth: 80,
	    buttonAlign: 'left',
	    items: [{
		xtype: 'fieldset',
		id: 'lisp-form',
		maskDisable: false,
		autoHeight: true,
		width: 600,
		hideBorders: true,
		title: 'LISP Interpreter',
		items: [{
		    	xtype: 'textarea',
        		fieldLabel: 'LISP Code',
        		name: 'lisp-code',
        		grow: true,
        		preventScrollbars:false,
			anchor: '95%',
        		value: ''
		    }, {
		    	xtype: 'textarea',
        		fieldLabel: 'JSON Code',
        		name: 'json-code',
        		grow: true,
        		preventScrollbars:false,
			anchor: '95%',
        		value: ''
		    }, {
		    	xtype: 'textarea',
        		fieldLabel: 'Result',
        		name: 'result',
        		grow: true,
        		preventScrollbars:false,
			anchor: '95%',
        		value: ''
		}]
	    }],
	    buttons: [{
		text: 'Show JSON',
		handler: function() {
		    var f = this.ownerCt.getForm();
		    f.findField('json-code').setValue(lisp2js(f.findField('lisp-code').getValue(),true));
		    }
		}, {
		text: 'Interpret',
		handler: function() {
		    var f = this.ownerCt.getForm();
		    f.findField('result').setValue(lisp2js(f.findField('lisp-code').getValue(),false));
		    }
	    }]
	});
	
	this.form = form;
	this.panel.add(this.form);
	this.panel.doLayout();	


    }
    
});
