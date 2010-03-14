/**
 * @fileOverview extend built-in Object prototype
 * @author <a href="mailto:raimon49@hotmail.com">raimon</a>
 */

/**
 * trim spaces
 *
 * @return {String}
 */
String.prototype.trim = String.prototype.trim || (String.prototype.trim = function() {
	return this.replace(/^[ ]+|[ ]+$/g, "");
});

/**
 * escape special characters
 *
 * @return {String}
 */
String.prototype.escapeHtml = String.prototype.escapeHtml || (String.prototype.escapeHtml = function() {
	return this.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
});

/**
 * iteration each values
 *
 * @param {Function} func    callback function
 * @param {Object}   thisObj binding scope
 */
Array.prototype.forEach = Array.prototype.forEach || (Array.prototype.forEach = function(func, thisObj) {
	for (var i=0, l=this.length; i<l; ++i) {
		func.call(thisObj, this[i], i, this);
	};
});
