var editor,
	functions,
	registers;

_.mixin(_.string.exports());

$(function() {
	functions = {
		j:	'000010', //2
		bne:	'000101', //5
		beq:	'000100', //4
		addi:	'001000', //8
		andi:	'001100', //12
		ori:	'001101', //13
		add:	'100000', //32
		sub:	'100010', //34
		and:	'100100', //36
		or:	'100101'  //37
	};

	registers = {
		$0:	'00000',
		$zero: '00000',
		$at: '00001',
		$v0: '00010',
		$v1: '00011',
		$a0: '00100',
		$a1: '00101',
		$a2: '00110',
		$a3: '00111',
		$t0: '01000',
		$t1: '01001',
		$t2: '01010',
		$t3: '01011',
		$t4: '01100',
		$t5: '01101',
		$t6: '01110',
		$t7: '01111',
		$s0: '10000',
		$s1: '10001',
		$s2: '10010',
		$s3: '10011',
		$s4: '10100',
		$s5: '10101',
		$s6: '10110',
		$s7: '10111',
		$t8: '11000',
		$t9: '11001',
		$k0: '11010',
		$k1: '11011',
		$gp: '11100',
		$sp: '11101',
		$fp: '11110',
		$ra: '11111'
	};
	
	var types = {
		and: 'rtype',
		or: 'rtype',
		add: 'rtype',
		sub: 'rtype',
		addi: 'itype',
		andi: 'itype',
		ori: 'itype',
		j: 'jtype',
		beq: 'itype',
		bne: 'itype'
	};

	var parsers = {
		rtype: parseRTypeCommand,
		itype: parseITypeCommand,
		jtype: parseJTypeCommand
	};

	function parseCommand(input) {
		var tokens = input.replace(/\w+:/, '').trim().split( /\s|,\s?/ );
		var funct = _.first(tokens);
		var type = types[funct];
		var code = {};
	
		if (type) {
			code = parsers[type](tokens);
			code.type = type;
		}
	
		return code;
	}

	function parseRTypeCommand(tokens) {
		var code = {
			funct: functions[_.first(tokens)],
			op: '000000',
			shamt: '00000'
		};
	
		_.chain(tokens).tail().each(function(token) {
			if (registers[token]) {
				if (code.rd) {
					if (code.rs) {
						if(code.rt) {
							console.error('Tried to reset code.rt for R-type');
						}
						else {
							code.rt = registers[token];
						}
					} else {
						code.rs = registers[token];
					}
				} else {
					code.rd = registers[token];
				}
			}
		});
	
		return code;
	}

	var MAX_16_BIT_UNSIGNED_VALUE = 32767;
	var MIN_16_BIT_SIGNED_VALUE = -32768;
	
	function isBranchOp(op) {
		return _.contains(['beq', 'bne'], op);
	}

	function getImmediate(op, token) {
		if(isBranchOp(op)) {
			return getAddr(token);
		}
		return toBin(parseInt(token));
	}

	function parseITypeCommand(tokens) {
		var op = _.first(tokens),
			code = {
				op: functions[op]
			};

		_.chain(tokens).tail().each(function(token) {
			if (registers[token]) {
				if (code.rs) {
					if (code.rt) {
						console.error('Tried to reset code.rt for I-type');
					} else {
						code.rt = registers[token];
					}
				} else {
					code.rs = registers[token];
				}
			}
			else if(code.rs && code.rt) {
				var immediate = getImmediate(op, token);
				if(code.imm) {
					console.error('Tried to reset code.imm for I-type');
				}
				else {
					code.imm = immediate;
				}
			}
		});
	
		return code;
	}

	function findLine(lines, text) {
		var regex = new RegExp(text),
		    fn = function(line) { return regex.test(line); },
		    lineFound = _.chain(lines).filter(fn).first().value();
		return _.indexOf(lines, lineFound);
	}

	function stripComments(text) {
		return text.replace( /#[^\n]*/g , '');
	}

	function stripLabels(text, exception) {
		var labels = _.chain(text.match( /\w+:/gm )).unique().without(exception + ':').value(),
		    labelsRegex = new RegExp(labels.join('|'), 'g');
		return text.replace(labelsRegex, '').replace(/^\s+$/gm, '');
	}

	function getAddr(label) {
		var text = editor.getValue(),
		    labelRegex = new RegExp(label + '\\n+'),
		    lines = stripComments(stripLabels(text, label)).replace(labelRegex, label).split( /\n+/ ),
		    sourceLineNumber = findLine(lines, label),
		    destinationLineNumber = findLine(lines, _.sprintf('\\b%s\\b:', label));
		return toBin(destinationLineNumber - sourceLineNumber);
	}

	function parseJTypeCommand(tokens) {
		var op = functions[_.first(tokens)];
		var label = _.chain(tokens).tail().first().value();
		var addr = getAddr(label);

		return {
			op: op,
			addr: addr
		};
	}
	
	function pad (str, max, char) {
	  return str.length < max ? pad(char + str, max, char) : str;
	}

	function flip (str){
		var i;
		var newStr = '';
		for(i = 0; i < str.length; i++){
			newStr += str[i] === '1' ? 0 : 1;
		}
		return newStr;
	}

	function toBin(num){
		if(num > MAX_16_BIT_UNSIGNED_VALUE || num < MIN_16_BIT_SIGNED_VALUE){
			return console.error('out of range');
		}
		if(num >= 0){
			return pad(num.toString(2), 16, '0');
		}
		var absolute = Math.abs(num).toString(2);
		var padded = pad(absolute, 16, '0');
		var flipped = flip(padded);    
		var summed = parseInt(flipped, 2) + 1;
		return summed.toString(2);
	}

	var Command = function(command){
		var self = this;
		self.op = ko.observable(command.op);
		self.rs = ko.observable(command.rs);
		self.rt = ko.observable(command.rt);
		self.rd = ko.observable(command.rd);
		self.shamt = ko.observable(command.shamt);
		self.funct = ko.observable(command.funct);
		self.imm = ko.observable(command.imm);
		self.addr = ko.observable(command.addr);
		self.type = ko.observable(command.type);
		self.isRType = ko.computed(function() { return this.type() === 'rtype'; }, this);
		self.isIType = ko.computed(function() { return this.type() === 'itype'; }, this);
		self.isJType = ko.computed(function() { return this.type() === 'jtype'; }, this);
		self.isEmpty = ko.computed(function() { return !this.op(); }, this);
	};

	var CommandsViewModel = {
		commands: ko.observableArray()
	};
	
	editor = CodeMirror.fromTextArea($("#view")[0], {
		theme: 'ambiance',
		lineNumbers: true,
		onChange: function(editor){
			var lines = editor.getValue().split('\n');
			var commands = CommandsViewModel.commands;
			
			//add/update
			_.each(lines, function(line, i) {
				var command = commands()[i];
				var newCommand = parseCommand(line);
				
				if(i >= commands().length) {
					CommandsViewModel.commands.push(new Command(newCommand));
				}
				else {
					command.op(newCommand.op);
					command.rs(newCommand.rs);
					command.rt(newCommand.rt);
					command.rd(newCommand.rd);
					command.shamt(newCommand.shamt);
					command.funct(newCommand.funct);
					command.imm(newCommand.imm);
					command.addr(newCommand.addr);
					command.type(newCommand.type);
				}
			});
			
			//remove
			var lineLength = lines.length;
			var commandLength = commands().length;
			if(lineLength < commandLength) {
				commands.splice(lineLength, commandLength);
			}
		}
	});
	
	ko.applyBindings(CommandsViewModel);
	
	editor.setValue(editor.getValue());
	
	$('.CodeMirror-scroll>div:last-child').resize(function(){
		$('.scroll .inner').height($(this).height());
	});

	$('.scroll').scroll(function(){
		$('.CodeMirror-scroll').scrollTop($(this).scrollTop());
		$('.output').scrollTop($(this).scrollTop());
	});
});
