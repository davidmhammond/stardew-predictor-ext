import * as util from '../util.js';

export let initialize = function (core, extension) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.recipes;
	let baseUtil = core.baseUtil;
	
	core.addDataFile('Data/TV/CookingChannel');
	
	core.addSaveLoader(function (xmlDoc, wasChanged) {
		ext.cookingRecipes = new Map();
		
		if (xmlDoc == null) {
			return;
		}
		
		$(xmlDoc).find(':root > player > cookingRecipes > item').each(function () {
			ext.cookingRecipes.set($(this).find('> key > string').first().text(), +$(this).find('> value > int').first().text());
		});
	});
	
	core.addTodaySummaryWriter('recipes.queenOfSauce', 'Queen of Sauce', function () {
		let output = '';
		let dayOfWeek =  (save.daysPlayed - 1) % 7;
		
		if (dayOfWeek === 6 || (dayOfWeek === 2 && save.daysPlayed > 7)) {
			let episode = Math.floor(save.daysPlayed / 7) % 32;
			
			if (dayOfWeek === 2) {
				// Re-run.
				
				let missedEpisodes = [];
				
				if (save.daysPlayed > 224) {
					episode = 33;
				}
				
				for (let i = 1; i <= episode; ++i) {
					if (!ext.cookingRecipes.has(core.content.Data.TV.CookingChannel[episode].split('/')[0])) {
						missedEpisodes.push(i);
					}
				}
				
				let rng = core.createDaySaveRandom();
				
				if (missedEpisodes.length > 0) {
					episode = missedEpisodes[rng.Next(missedEpisodes.length)];
				}
				else {
					episode = 1 + rng.Next(episode);
				}
			}
			
			let info = core.content.Data.TV.CookingChannel[episode].split('/');
			
			if (!ext.cookingRecipes.has(info[0])) {
				output += `<span class="result">Queen of Sauce: <b>${util.wikify(info[0])}</b></span><br>`;
			}
		}
		
		return output;
	}, 300);
};
