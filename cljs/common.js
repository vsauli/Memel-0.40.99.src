isIE = (document.all ? 1 : 0);
isNS4 = (document.layers ? 1 : 0);
W3CDOM = (document.getElementById ? 1 : 0);

var glob_obj = this;

/* Some new method prototypes */

function extract_left(total_chars) {
    return this.substring(0, total_chars);
}

function extract_right(total_chars) {
    return this.substring(this.length - total_chars);
}

String.prototype.left = extract_left;
String.prototype.right = extract_right;

function trim_spaces(from_where) {

    var temp_string = this;
    
    if (arguments.length == 0) {
        from_where = "BOTH";
	}
	
    if (from_where.toUpperCase() == "LEFT" ||
        from_where.toUpperCase() == "BOTH") {
	while(temp_string.left(1) == " ") {
	    temp_string = temp_string.substring(1);
	    }
	}

    if (from_where.toUpperCase() == "RIGHT" ||
        from_where.toUpperCase() == "BOTH") {
	while(temp_string.right(1) == " ") {
	    temp_string = temp_string.substring(0, temp_string.length - 1);
	    }
	}
    return temp_string;
}

function to_Name(arg) {

    for (prop in arguments.valueOf().prototype) alert(prop);
    
    return arguments[0];
    
}
String.prototype.trim = trim_spaces;
String.prototype.toName = to_Name;

function add_zeros(num, pos) {

    var tnum;
    
    tnum = "00000000" + num;
    return tnum.right(pos);
    
}

function get_obj(obj) {

    if (isIE) return(eval("document.all." + obj));
    if (isNS4) return(eval("document.layers." + obj));
    if (W3CDOM) return(document.getElementById(obj));

}

function put_obj(obj, str) {

    if (isNS4) {
	obj.open();
	obj.write(str);
	obj.close();
	}
    else
        obj.innerHTML = str;

}

function put_button(str) {

    return("<table class='butttable' cellpadding='1' width='100%'><tr><td align='center' bgcolor='#8BA4CE' valign='center'>" + str + "</td></tr></table>");

}

function findPosX(obj) {

    var curleft = 0;
    if (obj.offsetParent) {
	while (obj.offsetParent) {
	    curleft += obj.offsetLeft
    	    obj = obj.offsetParent;
    	    }
	}
    else if (obj.x)
	curleft += obj.x;
    return curleft;
}
										
function findPosY(obj) {

    var curtop = 0;

    if (obj.offsetParent) {
        while (obj.offsetParent) {
	    curtop += obj.offsetTop
	    obj = obj.offsetParent;
	    }
	}
    else if (obj.y)
        curtop += obj.y;
    return curtop;
}
		

var Today = new Date();
var TodayChar = Today.getFullYear() + "-" + LZ(Today.getMonth()) + "-" + LZ(Today.getDate());

function LZ(x)
{
  return (x >= 10 || x < 0 ? "" : "0") + x;
  }

/*  
function lsign_scroll() {

    if( typeof( window.pageYOffset ) == 'number' ) {
        //Netscape compliant
	get_obj('lsign').style.top = window.pageYOffset;
	get_obj('lsign').style.left = window.pageXOffset;
	} 
    else if( document.body && ( document.body.scrollLeft || document.body.scrollTop ) ) {
	//DOM compliant
	get_obj('lsign').style.top = document.body.scrollTop;
	get_obj('lsign').style.left = document.body.scrollLeft;
	} 
    else if( document.documentElement && ( document.documentElement.scrollLeft || document.documentElement.scrollTop ) ) {
	//IE6 standards compliant mode
	get_obj('lsign').style.top = document.documentElement.scrollTop;
	get_obj('lsign').style.left = document.documentElement.scrollLeft;
	}
    
}
*/

Ext.example = function(){
    var msgCt;

    function createBox(t, s){
        return ['<div class="msg">',
                '<div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>',
                '<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc"><h3>', t, '</h3>', s, '</div></div></div>',
                '<div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>',
                '</div>'].join('');
    }
    return {
        msg : function(title, format, psec){
            if(!msgCt){
                msgCt = Ext.DomHelper.insertFirst(document.body, {id:'msg-div'}, true);
            }
            msgCt.alignTo(document, 't-t');
            var s = String.format.apply(String, Array.prototype.slice.call(arguments, 1));
            var m = Ext.DomHelper.append(msgCt, {html:createBox(title, s)}, true);
            m.slideIn('t').pause(psec).ghost("t", {remove:true});
        },

        init : function(){
            /*
            var t = Ext.get('exttheme');
            if(!t){ // run locally?
                return;
            }
            var theme = Cookies.get('exttheme') || 'aero';
            if(theme){
                t.dom.value = theme;
                Ext.getBody().addClass('x-'+theme);
            }
            t.on('change', function(){
                Cookies.set('exttheme', t.getValue());
                setTimeout(function(){
                    window.location.reload();
                }, 250);
            });*/

            var lb = Ext.get('lib-bar');
            if(lb){
                lb.show();
            }
        }
    };
}();


