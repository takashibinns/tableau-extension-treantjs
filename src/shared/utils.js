//	Utility functions used throughout the application
let util = {

	//	Helper function to log messages to console
  	log: function log(message){
  		const prefix = "TreanJS Extension: ";
  		console.log(prefix + message);
  	},
	
	//	Get a jquery selector, based on the element's ID
	getSelectorById: function(id){
		return '#' + id
	},

	//	Convert any valid CSS fill type (rgb, hex, standard color string) into a hex
	//	return { bg: 'background color hex', font: 'appropriate font color'}
	colorToHex: function(color) {

		// Returns the color as an array of [r, g, b, a]
	  	function colorToRGBA(color) {
		    var cvs, ctx;
		    cvs = document.createElement('canvas');
		    cvs.height = 1;
		    cvs.width = 1;
		    ctx = cvs.getContext('2d');
		    ctx.fillStyle = color;
		    ctx.fillRect(0, 0, 1, 1);
		    return ctx.getImageData(0, 0, 1, 1).data;
		}

		// Turns a number (0-255) into a 2-character hex number (00-ff)
		function byteToHex(num) {
		    return ('0'+num.toString(16)).slice(-2);
		}

		//	Calculate the font color (black/white), based on background color
		function getFontColor(rgb){

			//	Calculate color brightness difference
			//	https://www.w3.org/TR/AERT/#color-contrast
			var o = Math.round(((parseInt(rgb[0]) * 299) + (parseInt(rgb[1]) * 587) + (parseInt(rgb[2]) * 114)) /1000);

			//	125 is the magic number (range is 500)
			return (o>125) ? 'black' : 'white'
		}

		//	Convert whaterver was given as a color string -> rgb -> hex
	    var rgba, hex;
	    rgba = colorToRGBA(color);
	    hex = [0,1,2].map(
	        function(idx) { return byteToHex(rgba[idx]); }
	        ).join('');

	    //	Return an object w/ box the background and font colors
	    return {
	    	'background': "#"+hex,
	    	'font': getFontColor(rgba)
	    };
	}
}

module.exports = util;