import * as util from '../util.js';

export let initialize = function (core, extension) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.skills;
	let baseUtil = core.baseUtil;
	
	let skills = [{
		name: 'Farming',
		key: 'farming',
		prof1Choices: [0, 1],
		prof2Choices: [2, 3, 4, 5]
	}, {
		name: 'Mining',
		key: 'mining',
		prof1Choices: [18, 19],
		prof2Choices: [20, 21, 22, 23],
	}, {
		name: 'Foraging',
		key: 'foraging',
		prof1Choices: [12, 13],
		prof2Choices: [14, 15, 16, 17],
	}, {
		name: 'Fishing',
		key: 'fishing',
		prof1Choices: [6, 7],
		prof2Choices: [8, 9, 10, 11],
	}, {
		name: 'Combat',
		key: 'combat',
		prof1Choices: [24, 25],
		prof2Choices: [26, 27, 28, 29],
	}];
	
	let levels = [
		100,
		380,
		770,
		1300,
		2150,
		3300,
		4800,
		6900,
		10000,
		15000,
		Infinity,
	];
	
	let professionNames = {
		0: 'Rancher',
		1: 'Tiller',
		2: 'Coopmaster',
		3: 'Shepherd',
		4: 'Artisan',
		5: 'Agriculturist',
		6: 'Fisher',
		7: 'Trapper',
		8: 'Angler',
		9: 'Pirate',
		10: 'Mariner',
		11: 'Luremaster',
		12: 'Forester',
		13: 'Gatherer',
		14: 'Lumberjack',
		15: 'Tapper',
		16: 'Botanist',
		17: 'Tracker',
		18: 'Miner',
		19: 'Geologist',
		20: 'Blacksmith',
		21: 'Prospector',
		22: 'Excavator',
		23: 'Gemologist',
		24: 'Fighter',
		25: 'Scout',
		26: 'Brute',
		27: 'Defender',
		28: 'Acrobat',
		29: 'Desperado',
	};
	
	core.addSaveLoader(function (xmlDoc, wasChanged) {
		ext.xp = {
			farming: 0,
			fishing: 0,
			foraging: 0,
			mining: 0,
			combat: 0,
			luck: 0,
		};
		
		if (xmlDoc == null) {
			return;
		}
		
		$(xmlDoc).find(':root > player > experiencePoints').first().each(function () {
			let values = $(this).children('int');
			ext.xp.farming = +values[0].textContent;
			ext.xp.fishing = +values[1].textContent;
			ext.xp.foraging = +values[2].textContent;
			ext.xp.mining = +values[3].textContent;
			ext.xp.combat = +values[4].textContent;
			ext.xp.luck = +values[5].textContent;
		});
	});
	
	core.addPredictor('skills', 'Skills', function (isSearch, offset, extra) {
		let output = '';
		output += '<table class="output"><thead><tr>';
		
		output += '<th>Skill</th>';
		output += '<th>Level</th>';
		output += '<th>Total XP</th>';
		output += '<th>Level Up Progress</th>';
		output += '<th>Level Up Examples</th>';
		output += '<th>Prof. 1</th>';
		output += '<th>Prof. 2</th>';
		
		output += '</tr></thead><tbody>';
		
		for (let skill of skills) {
			let level = common.player[skill.key + 'Level'];
			let xp = ext.xp[skill.key];
			let relXP = xp - (levels[level - 1] ?? 0);
			let levelUpRelXP = levels[level] - (levels[level - 1] ?? 0);
			let xpRemaining = levelUpRelXP - relXP;
			let prof1 = null;
			let prof2 = null;
			
			for (let profID of skill.prof1Choices) {
				if (common.player.professions.has(profID)) {
					prof1 = profID;
					break;
				}
			}
			
			for (let profID of skill.prof2Choices) {
				if (common.player.professions.has(profID)) {
					prof2 = profID;
					break;
				}
			}
			
			output += '<tr>';
			output += `<td>${util.wikify(skill.name)}</td>`;
			
			output += `<td>${level}</td>`;
			output += `<td>${xp}</td>`;
			
			if (levelUpRelXP === Infinity) {
				output += `<td style="text-align: left;">${relXP}</td>`;
				output += '<td style="text-align: left;">(Max level)</td>';
			}
			else {
				output += `<td style="text-align: left;"><span class="range xp-range"><span class="range-bar" style="width: ${100 * relXP / levelUpRelXP}%"></span></span> ${relXP} / ${levelUpRelXP}</td>`;
				
				let examples = [];
				
				switch (skill.key) {
				case 'farming':
					examples.push(Math.ceil(xpRemaining / 8) + ' parsnips');
					examples.push(Math.ceil(xpRemaining / 17) + ' kale');
					examples.push(Math.ceil(xpRemaining / 6) + ' hops');
					examples.push(Math.ceil(xpRemaining / 38) + ' ancient fruit');
					break;
				
				case 'mining':
					examples.push(Math.ceil(xpRemaining / 3) + ' dark grey rocks');
					examples.push(Math.ceil(xpRemaining / 5) + ' copper nodes');
					examples.push(Math.ceil(xpRemaining / 12) + ' iron nodes');
					examples.push(Math.ceil(xpRemaining / 18) + ' gold nodes');
					break;
				
				case 'foraging':
					examples.push(Math.ceil(xpRemaining / 16) + ' trees+stumps');
					examples.push(Math.ceil(xpRemaining / 25) + ' large stumps');
					examples.push(Math.ceil(xpRemaining / 7) + ' forageables');
					examples.push(Math.ceil(xpRemaining / 3) + ' spring onions');
					break;
				
				case 'fishing':
					examples.push(Math.ceil(xpRemaining / 13) + ' base sardines');
					examples.push(Math.ceil(xpRemaining / 45) + ' perfect iridium sardines');
					examples.push(Math.ceil(xpRemaining / 40) + ' gold catfish');
					break;
				
				case 'combat':
					examples.push(Math.ceil(xpRemaining / 3) + ' green slimes');
					examples.push(Math.ceil(xpRemaining / 15) + ' shadow brutes/shamans');
					break;
				}
				
				output += `<td style="text-align: left;">${examples.join(' | ')}</td>`;
			}
			
			output += `<td>${professionNames[prof1] ?? ''}</td>`;
			output += `<td>${professionNames[prof2] ?? ''}</td>`;
			
			output += '</tr>';
		}
		
		output += '</tbody></table>';
		return output;
	});
};
