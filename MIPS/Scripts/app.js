var functions = {
	j:		'000010', //2
	bne:	'000101', //5
	beq:	'000100', //4
	addi:	'001000', //8
	andi:	'001100', //12
	ori:	'001101', //13
	add:	'100000', //32
	sub:	'100010', //34
	and:	'100100', //36
	or:		'100101'  //37
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
	
function validate(input) {
	return true;
}

function parse(input) {
	var code = {
		op: '000000',
		shamt: '00000'
	};
	
	var parts = input.trim().split( /\s|,\s?/ );

	if (!functions[_.first(parts)]) return code;

	_.each(parts, function(part) {
		if (functions[part]) {
			code.funct = functions[part];
		}

		if (registers[part]) {
			if (code.rd) {
				if (code.rs) {
					code.rt = registers[part];
				} else {
					code.rs = registers[part];
				}
			} else {
				code.rd = registers[part];
			}
		}
	});

	return code;
}

$(function() {
	var Command = function(command){
		this.op = ko.observable(command.op);
		this.rs = ko.observable(command.rs);
		this.rt = ko.observable(command.rt);
		this.rd = ko.observable(command.rd);
		this.shamt = ko.observable(command.shamt);
		this.funct = ko.observable(command.funct);
	};

	var CommandsViewModel = {
		commands: ko.observableArray()
	};
	
	CodeMirror.fromTextArea($("#view")[0], {
		theme: 'ambiance',
		lineNumbers: true,
		onChange: function(editor){
			var lines = editor.getValue().split('\n');
			var commands = CommandsViewModel.commands;
			
			//add/update
			_.each(lines, function(line, i) {
				var command = commands()[i];
				var newCommand = parse(line);
				
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
});
