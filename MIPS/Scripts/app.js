var functions = {
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

var registers = {
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
	beq: 'jtype',
	bne: 'jtype'
};

var parsers = {
	rtype: parseRTypeCommand,
	itype: parseITypeCommand,
	jtype: parseJTypeCommand
};

function parseCommand(input) {
	var tokens = input.trim().split( /\s|,\s?/ );
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
var MAX_16_BIT_SIGNED_VALUE = -32768;
	
function parseITypeCommand(tokens) {
	var code = {
		op: functions[_.first(tokens)]
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
		
		if(code.rs && code.rt) {
			var immediate = parseInt(token);
			if(_.isNumber(immediate) && immediate >= MAX_16_BIT_SIGNED_VALUE && immediate <= MAX_16_BIT_UNSIGNED_VALUE) {
				if(code.imm) {
					console.error('Tried to reset code.imm for I-type');
				}
				else {
					code.imm = immediate;
				}
			}
		}
	});
	
	return code;
}

function parseJTypeCommand(tokens) {
	return {
		op: functions[_.first(tokens)],
		addr: _.chain(tokens).tail().first()
	};
}

$(function() {
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
	
	var editor = CodeMirror.fromTextArea($("#view")[0], {
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
