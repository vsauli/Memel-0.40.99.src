var n = 0;
var lpgm;

function getN() {
    return (""+(100000+(++n))).substring(1);
}

function l_eval(lpgm) {

    result = "nil";

    

    return result;

}


function lisp2json(lisp) {

    var json = lisp;

    json = json.replace(/(".*")/g, "__$1__");
    json = json.replace(/"/g, "__"); // replace double quotes with something unreadable
    //" (this is just for correct syntax highliting)

    json = json.replace(/\(\s*(\S*)/g, "($1"); // deblank "(" to the right
    json = json.replace(/(\S)(\(|\))/g, "$1 $2");    // add blank to the left of "(" or ")"

    json = json.replace(/\b(?=\S)(\S*)/g, ",%:\"$1\""); // Add ',%:' to list items
    json = json.replace(/\s(\()/g, ",%:$1"); // Add ',%:' near opening '('
    json = json.replace(/\(,%/g, "(fn"); // change first argument to 'fn'

    // Number %: tags and convert to _n tags

    var jn = "";
    while (json !== jn) {
	jn = json;
	json = jn.replace(/%:/, "_"+getN()+":");
	if (n > 10000) break; // prevent cycling
	}
    
    json = json.replace(/\(/g, "{"); // finally, replace parenthesis to brackets
    json = json.replace(/\)/g, "}");

    json = json.replace(/__/g, "\""); // restore double quotes 

    return json;

}

function lisp2js(lisp, json_only) {

    var json = lisp2json(lisp);
    if (json_only) return json;

    eval("lpgm = "+json);

    console.log(lpgm);

    return l_eval(lpgm);
    
}