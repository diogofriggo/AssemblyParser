CodeMirror.defineMode("assembly", function() {
	
	function eat(match) {
      var ch = this.string.charAt(this.pos);
      if (typeof match == "string") var ok = ch == match;
      else var ok = ch && (match.test ? match.test(ch) : match(ch));
      if (ok) {++this.pos; return ch;}
    };
	
    function eatWhile(match) {
      var start = this.pos;
      while (this.eat(match)){}
      return this.pos > start;
    };

	return {
		token: function(stream) {
			//TODO: this needs heavy refactoring
			if(stream.eatSpace()) {
				return null;
			}
			if(stream.eatWhile(/[A-Za-z]/) && functions[stream.current()]) {
				return 'operator';
			}
			if(stream.eatWhile(/[A-Za-z:]/)) {
				return 'label';
			}
			if(stream.eatWhile(/[-\d]/)) {
				return 'number';
			}
			if(stream.peek() === '#') {
				stream.skipToEnd();
				return 'comment';
			}
			if(stream.eatWhile(/[\$\w]/) && registers[stream.current()]) {
				return 'register';
			}
			stream.next();
			return null;
		}
	};
});

CodeMirror.defineMIME("text/x-assembly","assembly");
