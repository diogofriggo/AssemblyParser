CodeMirror.defineMode("assembly", function() {
	return {
		token: function(stream) {
			if(stream.eatSpace()) {
				return null;
			}
			else if(stream.eatWhile(/\w/) && functions[stream.current()]) { //&&stream.current in functs
				return 'keyword';
			}
			else if(stream.eatWhile(/[\$\w]/) && registers[stream.current()]) {
				return 'number';
			}
			stream.next();
			return null;
		}
	};
});

CodeMirror.defineMIME("text/x-assembly","assembly");
