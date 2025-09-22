import * as util from '../util.js';

export let initialize = function (core, extension) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.calendar;
	let baseUtil = core.baseUtil;
	let lib = extension.lib;
	
	core.addDataFile('Data/Characters');
	
	let festivalDates = {
		12: 'Egg Festival',
		23: 'Flower Dance',
		38: 'Luau',
		55: 'Moonlight Jellies',
		71: 'Stardew Valley Fair',
		82: 'Sprit\'s Eve',
		91: 'Festival of Ice',
		108: 'Winter Star',
	};
	
	let passiveFestivalDates = {
		14: 'Desert Festival',
		15: 'Desert Festival',
		16: 'Desert Festival',
		47: 'Trout Derby',
		48: 'Trout Derby',
		95: 'Squid Fest',
		96: 'Squid Fest',
		98: 'Night Market',
		99: 'Night Market',
		100: 'Night Market',
	};
	
	let clinicDates = {
		1: ['Evelyn'],
		3: ['Abigail'],
		8: ['Willy'],
		10: ['Vincent', 'Jodi'],
		15: ['Leah'],
		17: ['Jodi'],
		22: ['George', 'Evelyn'],
		24: ['Pam'],
		29: ['Evelyn'],
		31: ['Sebastian'],
		36: ['Elliott'],
		43: ['Alex'],
		45: ['Robin'],
		50: ['George', 'Evelyn'],
		52: ['Demetrius'],
		57: ['Evelyn'],
		59: ['Gus'],
		64: ['Lewis'],
		66: ['Sam'],
		73: ['Marnie'],
		78: ['George', 'Evelyn'],
		80: ['Caroline'],
		85: ['Evelyn'],
		87: ['Penny'],
		92: ['Haley'],
		94: ['Emily'],
		99: ['Clint'],
		101: ['Jas', 'Marnie'],
		106: ['George', 'Evelyn'],
	};
	
	let canIDs = [
		'JodiAndKent',
		'EmilyAndHaley',
		'Mayor',
		'Museum',
		'Blacksmith',
		'Saloon',
		'Evelyn',
		'JojaMart',
	];
	
	core.addSaveLoader(function (xmlDoc, wasChanged) {
		ext.characterInfo = [];
		ext.birthdayCharacters = [];
		ext.toolUpgrade = null;
		
		if (xmlDoc == null) {
			return;
		}
		
		let todayDate = (save.daysPlayed - 1) % 112;
		
		$(xmlDoc).find(':root > locations > GameLocation').each(function () {
			$(this).find('> characters > NPC').each(function () {
				let character = {
					name: $(this).find('> name').html(),
					birthdayDate: null,
				};
				
				let birthdaySeason = $(this).find('> birthday_Season').first().text();
				
				if (birthdaySeason != '') {
					let birthdayDayOfMonth = +$(this).find('> birthday_Day').first().text() - 1;
					character.birthdayDate = util.seasonNumberMap.get(birthdaySeason) * 28 + birthdayDayOfMonth;
					
					if (character.birthdayDate === todayDate) {
						ext.birthdayCharacters.push(character);
					}
				}
				
				ext.characterInfo.push(character);
			});
		});
		
		let daysLeftForToolUpgrade = +$(xmlDoc).find(':root > player > daysLeftForToolUpgrade').first().text();
		
		$(xmlDoc).find(':root > player > toolBeingUpgraded').each(function () {
			ext.toolUpgrade = {
				name: $(this).find('> name').first().text(),
				itemId: $(this).find('> itemId').first().text(),
				upgradeLevel: +$(this).find('> upgradeLevel').first().text(),
				daysLeft: daysLeftForToolUpgrade,
			};
		});
	});
	
	core.addTodaySummaryWriter('calendar.birthday', 'Birthday', function () {
		let output = '';
		
		for (let character of ext.birthdayCharacters) {
			output += '<span class="result">Birthday: <b>' + util.wikify(character.name) + '</b></span><br>';
		}
		
		return output;
	}, 400);
	
	core.addPredictor('calendar', 'Calendar', function (isSearch, offset, extra) {
		let output = '';
		let startMonth = Math.floor((save.daysPlayed - 1) / 28);
		
		for (let monthsAhead = 0; monthsAhead < 4; ++monthsAhead) {
			let month = startMonth + monthsAhead; // Total months elapsed (0-indexed).
			let year = Math.floor(month / 4); // Year (0-indexed).
			let season = month % 4; // Month of the year (0-indexed).
			let seasonName = save.seasonNames[season];
			
			// Predict bookseller days.
			
			let booksellerDays = util.getBooksellerDays(core, year + 1, season);
			
			output += `<table class="calendar" style="width: 100%; table-layout: fixed;"><thead><tr><th colspan="7">${seasonName}, Year ${year + 1}</th></tr>\n`
			output += '<tr><th>M</th><th>T</th><th>W</th><th>Th</th><th>F</th><th>Sa</th><th>Su</th></tr></thead>\n<tbody>';
			
			for (let week = 0; week < 4; ++week) {
				output += '<tr>';
				
				for (let weekDay = 0; weekDay < 7; ++weekDay) {
					let dayOfMonth = week * 7 + weekDay; // Day of the month (0-indexed).
					let day = month * 28 + dayOfMonth; // Total game days elapsed (0-indexed).
					let date = day % 112; // Day of the year (0-indexed).
					let weather = 'Sun';
					let isFestival = false;
					
					if (Object.hasOwn(festivalDates, date)) {
						weather = '<strong>' + festivalDates[date] + '</strong>'; // Festival.
						isFestival = true;
					}
					else if (day === save.daysPlayed - 1) {
						weather = common.weather; // Today.
					}
					else if (day === save.daysPlayed) {
						weather = common.weatherForTomorrow; // Tomorrow.
					}
					else {
						weather = predictWeather(day);
					}
					
					let icon = lib.getWeatherIcon(isFestival ? 'Festival' : weather, season);
					let cellClass = 'calendar-cell';
					
					if (day < save.daysPlayed - 1) {
						cellClass += ' past';
					} else if (day === save.daysPlayed - 1) {
						cellClass += ' current';
					}
					else {
						cellClass += ' future';
					}
					
					output += `<td class="${cellClass}" style="height: 8em; white-space: normal;"><div class="calendar-cell-inner"><span class="date">${week * 7 + weekDay + 1}</span> <span>${icon} ${weather}</span><br>`;
					
					let dayEvents = [];
					
					// Check for birthdays.
					
					let birthdayOutputs = [];
					
					for (let character of ext.characterInfo) {
						if (character.birthdayDate === date) {
							let characterData = core.content.Data.Characters[character.name];
							let url = util.contentURI(`Characters/${characterData.TextureName ?? character.name}.png`);
							let portrait = `<span style="display: inline-block; background: url('${url}') 0 0 no-repeat; width: 16px; height: 24px; vertical-align: bottom;" title="${character.name}"></span>`;
							portrait = util.wikify('Love', character.name, portrait);
							birthdayOutputs.push(portrait);
						}
					}
					
					if (birthdayOutputs.length > 0) {
						dayEvents.push({
							text: '<span style="line-height: 24px;">' + birthdayOutputs.join(' ') + '</span> <span style="line-height: 24px; vertical-align: middle;">Birthday</span>',
							className: 'cal-event-birthday',
						});
					}
					
					if (ext.toolUpgrade !== null && ext.toolUpgrade.daysLeft === day - save.daysPlayed + 1) {
						dayEvents.push({text: `${ext.toolUpgrade.name} ready`});
					}
					
					// Passive festivals.
					
					if (Object.hasOwn(passiveFestivalDates, date)) {
						dayEvents.push({text: passiveFestivalDates[date]});
					}
					
					// Bookseller.
					
					if (booksellerDays.includes(dayOfMonth + 1)) {
						dayEvents.push({text: 'Bookseller'});
					}
					
					// Predict garbage treasure.
					
					for (let whichCan = 0; whichCan < 8; whichCan++) {
						let rng = core.createSpecificDaySaveRandom(day + 1, 777 + baseUtil.getHashFromString(canIDs[whichCan]));
						
						for (let i = rng.Next(0, 100); i > 0; --i) {
							rng.NextDouble();
						}
						
						for (let i = rng.Next(0, 100); i > 0; --i) {
							rng.NextDouble();
						}
						
						rng.NextDouble();
						
						if (save.trashCansChecked[0] >= 20 && rng.NextDouble() < 0.002) {
							dayEvents.push({text: 'Trash: Garbage Hat'});
						} else if (save.trashCansChecked[0] >= 50 && rng.NextDouble() < 0.002) {
							dayEvents.push({text: 'Trash: Trash Catalogue'});
						}
					}
					
					switch (date) {
					case 14:
					case 15:
					case 16:
					case 17:
						dayEvents.push({text: 'Salmonberry season'});
						break;
					
					case 39:
					case 40:
					case 41:
						dayEvents.push({text: 'Extra forageables at the beach'});
						break;
					
					case 63:
					case 64:
					case 65:
					case 66:
						dayEvents.push({text: 'Blackberry season'});
						break;
					}
					
					for (name of clinicDates[date] ?? []) {
						dayEvents.push({text: `Clinic: ${name}`});
					}
					
					if (weekDay === 4 || weekDay === 6) {
						dayEvents.push({
							text: 'Traveling cart',
							className: 'cal-event-weekly',
						});
					}
					
					if (weekDay === 6 && month < 8) {
						dayEvents.push({
							text: 'Queen of Sauce',
							className: 'cal-event-weekly',
						});
					}
					
					for (let dayEvent of dayEvents) {
						output += `<div class="cal-event ${dayEvent.className ?? ''}">${dayEvent.text}</div>`;
					}
					
					output += '</div></td>';
				}
				
				output += '</tr>\n';
			}
			
			output += '</tbody></table>\n<br>\n';
		}
		
		return output;
	});
	
	lib.getWeatherIcon = function (weather, season) {
		let iconTexture = util.tx.mouseCursors;
		let sheetX;
		let sheetY;
		
		switch (weather) {
		case 'Storm': sheetX = 413; sheetY = 346; break;
		case 'Rain': sheetX = 465; sheetY = 333; break;
		case 'Snow': sheetX = 465; sheetY = 346; break;
		
		case 'Wind':
			sheetX = (season === 2) ? 413 : 465;
			sheetY = 359;
			break;
		
		case 'Green Rain':
			iconTexture = util.tx.mouseCursors_1_6;
			sheetX = 178;
			sheetY = 363;
			break;
		
		case 'Festival':
			sheetX = 413;
			sheetY = 372;
			break;
		
		case 'Sun':
		default:
			sheetX = 413;
			sheetY = 333;
			break;
		}
		
		let url = util.contentURI(`${iconTexture}.png`);
		return `<span style="display: inline-block; background: url('${url}') ${-sheetX}px ${-sheetY}px no-repeat; width: 13px; height: 13px;"></span>`;
	};
	
	let predictWeather = function (day) {
		let year = Math.floor(day / 112) + 1;
		let season = Math.floor(day / 28) % 4;
		++day; // Use 1-indexed day numbers to match the vanilla code.
		
		// The following is mainly copied from vanilla predictGreenRain().
		
		let rng = new CSRandom(baseUtil.getRandomSeed(year * 777, save.gameID));
		let grDays = [ 5, 6, 7, 14, 15, 16, 18, 23 ];
		let greenRainDay = grDays[rng.Next(grDays.length)];
		
		let weatherTown = 'Sun';
		if (day == 1 || day == 2 || day == 4 || (day % 28) == 1) {
			weatherTown = 'Sun';
		} else if (day == 3) {
			weatherTown = 'Rain';
		//} else if (festivalDays.hasOwnProperty(day % 112)) {
			//weatherTown = festivalDays[day % 112];
		} else {
			switch(season) {
			case 0:
			case 2:
				rng = new CSRandom(baseUtil.getRandomSeed(baseUtil.getHashFromString("location_weather"), save.gameID, day-1));
				if (rng.NextDouble() < 0.183) {
					weatherTown = 'Rain';
				}
				break;
			case 1:
				// The -28 is because we are only using this for summer
				let dayOfMonth = (day % 112) - 28;
				rng = new CSRandom(baseUtil.getRandomSeed(day-1, save.gameID/2, baseUtil.getHashFromString("summer_rain_chance")));
				if (dayOfMonth == greenRainDay) {
					weatherTown = 'Green Rain';
				} else if (dayOfMonth % 13 == 0) {
					weatherTown = 'Storm';
				} else {
					let rainChance = 0.12 + 0.003*(dayOfMonth-1);
					if (rng.NextDouble() < rainChance) {
						weatherTown = 'Rain';
					}
				}
				break;
			}
		}
		
		return weatherTown;
	};
};
