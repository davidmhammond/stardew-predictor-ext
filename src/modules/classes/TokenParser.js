export default class TokenParser {
	customParser;
	
	constructor (customParser) {
		this.customParser = customParser;
	}
	
	parseText = function (string, rng) {
		// See StardewValley.TokenizableStrings.TokenParser:ParseText().
		
		let pos = string.indexOf('[');
		
		if (pos === -1) {
			return string;
		}
		
		let stack = [];
		
		do {
			stack.push(pos);
			
			for (++pos; pos < string.length && stack.length > 0; ++pos) {
				switch (string.charAt(pos)) {
				case '[':
					stack.push(pos);
					break;
				
				case ']':
					let start = stack.pop();
					let args = string.substring(start + 1, pos).split(/ /g);
					let replacement = Object.hasOwn(this.customParser, args[0]) ? this.customParser[args[0]](args, rng) : null;
					
					if (replacement != null) {
						string = string.substring(0, start) + replacement + string.substring(pos + 1);
						pos = start + replacement.length - 1;
					}
				}
			}
			
			pos = string.indexOf('[', pos);
		}
		while (pos !== -1);
		
		return string.replaceAll('\\n', '\n').replaceAll('\u00a0', ' ').replaceAll('\u200b', '');
	};
};
