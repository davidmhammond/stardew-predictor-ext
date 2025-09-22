export let initialize = function (core, extension) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.cart;
	let baseUtil = core.baseUtil;
	let lib = this.lib;
	
	lib.resultData;
	lib.seedSearchBatchSize = 100;
	let searchJob = 0;
	
	core.addPageInitializer(function () {
		let $range = $('#cart-seed-range');
		let step = $range.val();
		
		$range.on('change', function () {
			$('#cart-seed').prop('step', this.value);
		});
		
		$('#cart-seed').prop('step', $range.val());
		
		if ($('#card-seed').val() === '0') {
			$('#cart-seed').val(Math.floor((Math.floor(Date.now() / 1000) - 1340323200) / step) * step);
		}
	});
	
	core.addPredictor('cart', 'Traveling\nCart', function (isSearch, offset, extra) {
		let resultsByDay = $('#cart-results-by-day').prop('checked');
		let seedFinder = $('#cart-seed-finder').prop('checked');
		let advSearch = $('#cart-advanced-filter').val().replace(/^[\r\n]+|[\r\n]+$/g, '');
		
		if (isSearch && !offset) {
			if (seedFinder && advSearch) {
				offset = '^';
			}
			else {
				isSearch = false;
			}
		}
		
		if (isSearch) {
			$('#cart-prev-year').prop('disabled', true);
			$('#cart-prev-week').prop('disabled', true);
			$('#cart-next-week').prop('disabled', true);
			$('#cart-next-year').prop('disabled', true);
			$('#cart-reset').html('Clear Search Results &amp; Reset Browsing');
		}
		else {
			seedFinder = false;
		}
		
		let seedStart = save.gameID;
		let seedEnd = 1;
		let advRegExps = [];
		let searchTerm;
		let searchStart;
		let searchEnd;
		
		if (seedFinder) {
			resultsByDay = true;
			seedStart = +($('#cart-seed').val() || 0);
			seedEnd = +($('#cart-seed-range').val() || 1);
			
			for (let pattern of advSearch.split(/\r?\n/g)) {
				if (pattern !== '') {
					advRegExps.push(new RegExp(pattern, 'i'));
				}
			}
			
			searchTerm = new RegExp(offset, 'i');
			searchStart = ($('#cart-search-all').prop('checked')) ? 0 : 7 * Math.floor((save.daysPlayed - 1) / 7);
			searchEnd = +$('#cart-search-range').val();
		}
		
		$('#async-cart').html('');
		let output = '';
		let seed = seedStart;
		$('#cart-search-button').prop('disabled', true);
		let mySearchJob = ++searchJob;
		
		let seedSearch = function () {
			if (searchJob !== mySearchJob) {
				// This search has been aborted.
				return;
			}
			
			let seedBreak = Math.min(seed + lib.seedSearchBatchSize, seedStart + seedEnd);
			$('#cart-search-status').text(Math.floor(100 * (seed - seedStart) / seedEnd) + '%');
			let output = '';
			
			seedLoop: for (; seed < seedBreak; ++seed) {
				let seedOutput = '';
				lib.resultData = [];
				
				if (seedFinder) {
					searchCartSeed(seed, searchTerm, searchStart, searchEnd);
				}
				else {
					seedOutput = predictCart_1_6(isSearch, offset);
				}
				
				if (isSearch && resultsByDay) {
					if (seedFinder && advRegExps.length > 0) {
						let searchKey = [];
						
						for (let result of lib.resultData) {
							searchKey.push(core.items.get(result[1], result[2]).displayName + '~' + result[3] + '~' + result[4]);
						}
						
						searchKey.sort();
						searchKey = searchKey.join('/');
						
						for (let regExp of advRegExps) {
							if (!regExp.test(searchKey)) {
								continue seedLoop;
							}
						}
					}
					
					seedOutput = '';
					let searchAll = $('#cart-search-all').prop('checked');
					let title;
					
					if (seedFinder) {
						title = `Seed: ${seed}`;
					}
					else {
						title = 'Search results over the ' +
						(searchAll ? 'first ' : 'next ') + $('#cart-search-range').val() + ' year(s)';
					}
					
					let style = '';
					
					if (seedFinder) {
						if (seed % 2 === 0) {
							style += 'float: left; clear: left; margin: 1em 0 0;';
						}
						else {
							style += 'float: left; margin: 1em 0 0 1em;';
						}
					}
					
					seedOutput += `<table class="output" style="${style}"><thead><tr><th colspan="3">${title}</th></tr>\n`;
					seedOutput += '<tr><th class="day">Day</th><th class="item">Items</th><th>Total Price</th></tr></thead>\n<tbody>';
					
					let searchStart = searchAll ? 0 : 7 * Math.floor((save.daysPlayed - 1) / 7);
					let searchEnd = +$('#cart-search-range').val();
					let matchingDays = 0;
					let i = 0;
					
					for (let offset = searchStart; offset < searchStart + searchEnd; offset += 7) {
						let days = [5, 7];
						let dayOfYear = offset % 112;
						
						if (dayOfYear === 98 || dayOfYear === 14) {
							days = [1, 2, 3, 5, 7];
						}
						
						let month = Math.floor(offset / 28);
						let monthName = save.seasonNames[month % 4];
						let year = 1 + Math.floor(offset / 112);
						
						for (let day of days) {
							let specialCart = (day !== 5 && day !== 7);
							let dayOfMonth = offset % 28 + day;
							let dayOfWeek = save.dayNames[day - 1];
							
							let searchKey = [];
							let dayOutput = '';
							let dayPrice = 0;
							
							if (i < lib.resultData.length && lib.resultData[i][0] === offset + day) {
								do {
									let result = lib.resultData[i];
									/*
									if (seedFinder) {
										searchKey.push(core.items.get(result[1], result[2]).displayName + '~' + result[3] + '~' + result[4]);
									}
									*/
									dayOutput += ' ' + core.getItemHTML(result[1], result[2], 'imageLink', result[3], 0, {'sp:note': `Price: ${baseUtil.addCommas(result[4])}g`});
									dayPrice += result[4];
									++i;
								}
								while (i < lib.resultData.length && lib.resultData[i][0] === offset + day);
							}
							/*
							if (seedFinder) {
								searchKey.sort();
								searchKey = searchKey.join('/');
								let foundMatch = false;
								
								for (let regExp of advRegExps) {
									if (regExp.test(searchKey)) {
										foundMatch = true;
									}
								}
								
								if (!foundMatch) {
									continue;
								}
							}
							*/
							
							dayPrice = (dayPrice === 0) ? '' : baseUtil.addCommas(dayPrice) + 'g';
							
							seedOutput += `<tr><td style="background: ${specialCart ? '#ccc' : 'none'}">${dayOfWeek} ${monthName} ${dayOfMonth}, Year ${year}</td><td>${dayOutput}</td><td>${dayPrice}</td></tr>`;
						}
					}
					
					seedOutput += '</tbody></table>';
				}
				
				output += seedOutput;
			}
			
			if (output !== '') {
				$('#async-cart').append(output);
			}
			
			if (seed >= seedStart + seedEnd) {
				$('#cart-search-button').prop('disabled', false);
				$('#cart-search-status').text('');
				
				if (seedFinder) {
					$('#async-cart').append('<p style="clear: both; padding-top: 1em;">End of results.</p>');
				}
			}
			else {
				window.setTimeout(seedSearch, 0);
			}
		};
		
		seedSearch();
		return output;
	});
	
	let addCommas = function (...args) {
		return baseUtil.addCommas(...args);
	}
	
	let getHashFromString = function (...args) {
		return baseUtil.getHashFromString(...args);
	}
	
	let getRandomSeed = function (...args) {
		return baseUtil.getRandomSeed(...args);
	}
	
	let wikify = function (...args) {
		return baseUtil.wikify(...args);
	}
	
	// Base predictor functions below, modified where noted by "CHANGED".
	
	let getRandomItems = function (rng, type, min, max, requirePrice, isRandomSale, doCategoryChecks = false, howMany = 1) {
		// partial implementation of StardewValley.Internal.ItemQueryResolver.DefaultResolvers.RANDOM_ITEMS()
		// with parameters specific to our limited needs
		// doCategoryChecks does the extra condition checks for the traveling cart's 10 random items
		var shuffledItems = {};
		for (const id in save[type]) {
			var key = rng.Next();
			if (isNaN(save[type][id].id)) {
				continue;
			}
			if (requirePrice && save[type][id].price == 0) {
				continue;
			}
			if (isRandomSale && save[type][id].offlimits) {
				continue;
			}
			var index = parseInt(save[type][id].id);
			if (index >= min && index <= max) {
				shuffledItems[key] = id;
			}
		}
		var selectedItems = [];
		var slot = 1;
		// All PerItemCondition checks happen here
		for (const key in shuffledItems) {
			if (doCategoryChecks && (save[type][shuffledItems[key]].category >= 0 || save[type][shuffledItems[key]].category === -999)) {
				continue;
			}
			if (doCategoryChecks && (save[type][shuffledItems[key]].type === 'Arch' || save[type][shuffledItems[key]].type === 'Minerals' || save[type][shuffledItems[key]].type === 'Quest')) {
				continue;
			}
			selectedItems.push(shuffledItems[key]);
			if (slot++ >= howMany) {
				break;
			}
		}
		return selectedItems;
	}
	
	let getRandomWallFloor = function (rng, min, max, extra, exclude = {}, howMany = 1) {
		// I don't even know where the wallpaper and floor data is defined and so we can't use the normal
		// getRandomItems() function which does checks against prices and such. Instead we have this hack
		// which just assumes everything in the range has a price and is not offlimits.
		// "extra" is for the number of IDs beyond the max that exist.
		var shuffledItems = {};
		for (var id = min; id <= max + extra; id++) {
			var key = rng.Next();
			shuffledItems[key] = id;
		}
		var selectedItems = [];
		var slot = 1;
		for (const key in shuffledItems) {
			if (exclude.hasOwnProperty(shuffledItems[key]) || shuffledItems[key] > max) {
				continue;
			}
			selectedItems.push(shuffledItems[key]);
			if (slot++ >= howMany) {
				break;
			}
		}
		return selectedItems;
	}
	
	let predictCart_1_6 = function (isSearch, offset) {
		// logic from StardewValley.Internal.ShopBuilder.GetShopStock(), StardewValley.Internal.ItemQueryResolver.TryResolve(),
		// and Data/Shops
		var output = '',
			month,
			monthName,
			year,
			dayOfMonth,
			dayOfWeek,
			slot,
			item,
			qty,
			price,
			name,
			searchTerm,
			searchStart,
			searchEnd,
			count,
			startDay,
			skillBookList = ["Stardew Valley Almanac", "Bait And Bobber", "Woodcutter's Weekly", "Mining Monthly", "Combat Quarterly"];
		// Hitting search without an actual search term will fall through to the default browse function; we might want
		// to add some sort of error message or other feedback.
		if (isSearch && typeof(offset) !== 'undefined' && offset !== '') {
			//$('#cart-prev-year').prop("disabled", true); // CHANGED: MOVED
			//$('#cart-prev-week').prop("disabled", true); // CHANGED: MOVED
			//$('#cart-next-week').prop("disabled", true); // CHANGED: MOVED
			//$('#cart-next-year').prop("disabled", true); // CHANGED: MOVED
			//$('#cart-reset').html("Clear Search Results &amp; Reset Browsing"); // CHANGED: MOVED
			// Note we are using the regexp matcher due to wanting to ignore case. The table header references offset still
			// so that it appears exactly as was typed in by the user.
			searchTerm = new RegExp(offset, "i");
			searchStart = ($('#cart-search-all').prop('checked')) ? 0 : 7 * Math.floor((save.daysPlayed - 1) / 7);
			searchEnd = +$('#cart-search-range').val() // CHANGED from: 112 * $('#cart-search-range').val();
			output += '<table class="output"><thead><tr><th colspan="4">Search results for &quot;' + offset + '&quot; over the ' +
				(($('#cart-search-all').prop('checked')) ? 'first ' : 'next ') + $('#cart-search-range').val() + ' year(s)</th></tr>\n';
			output += '<tr><th class="day">Day</th><th class="item">Item</th><th class="qty">Qty</th><th class="price">Price</th></tr>\n<tbody>';
			count = 0;
			// Much of the logic here is duplicated from the browsing section, but comments related to it have been removed.
			// Also, because output is purely a chronological list, we only need one RNG instance.
			for (offset = searchStart; offset < searchStart + searchEnd; offset += 7) {
				// It might make more sense to only bother with the date stuff when matches are found.
				var days = [5,7];
				var dayOfYear = offset % 112;
				if (dayOfYear === 98 || dayOfYear === 14) {
					days = [1,2,3,5,7];
				}
				month = Math.floor(offset / 28);
				monthName = save.seasonNames[month % 4];
				year = 1 + Math.floor(offset / 112);
				for (var i = 0; i < days.length; i++) {
					var seenRareSeed = false;
					dayOfMonth = offset % 28 + days[i];
					dayOfWeek = save.dayNames[days[i]-1];
					var rng =  new CSRandom(getRandomSeed(offset + days[i] + save.dayAdjust, save.gameID/2));
					var rngSynced;
					var pick = getRandomItems(rng, "objects", 2, 789, true, true, true, 10);
					var name, price, qty;
					for (var slot = 0; slot < 10; slot++) {
						price = Math.max(rng.Next(1,11) * 100, rng.Next(3,6) * save.objects[pick[slot]].price);
						qty = (rng.NextDouble() < 0.1) ? 5 : 1;
						if (save.objects[pick[slot]].name === 'Rare Seed') {
							seenRareSeed = true;
						}
						if (searchTerm.test(save.objects[pick[slot]].name)) {
							count++;
							lib.resultData.push([offset + days[i], 'O', save.objects[pick[slot]].id, qty, price]); // CHANGED: ADDED
							output += '<tr><td>' + dayOfWeek + ' ' + monthName + ' ' + dayOfMonth + ', Year ' + year + '</td><td>' +
								wikify(save.objects[pick[slot]].name) + "</td><td>" + qty + "</td><td>" + addCommas(price) + "g</td></tr>";
						}
					}
					if (save.originalGuarantee >= 0) {
						var dayOfPrediction = offset + days[i] + save.dayAdjust;
						var visitsNow = save.originalGuarantee - Math.floor(dayOfPrediction/7) - Math.floor((dayOfPrediction + 2)/7);
						if (dayOfPrediction >= 99) { visitsNow--; }
						if (dayOfPrediction >= 100) { visitsNow--; }
						if (dayOfPrediction >= 101) { visitsNow--; }
						if (visitsNow == 0) {
							name = save.objects["_485"].name;
							price = Math.max(rng.Next(1,11) * 100, rng.Next(3,6) * save.objects["_485"].price);
							qty = (rng.NextDouble() < 0.1) ? 5 : 1;
							if (searchTerm.test(name)) {
								count++;
								lib.resultData.push([offset + days[i], 'O', '485', qty, price]); // CHANGED: ADDED
								output += '<tr><td>' + dayOfWeek + ' ' + monthName + ' ' + dayOfMonth + ', Year ' + year + '</td><td>' +
									wikify(name) + "</td><td>" + qty + "</td><td>" + addCommas(price) + "g</td></tr>";
							}
						}
					}
					pick = getRandomItems(rng, "furniture", 0, 1612, true, true);
					name = save.furniture[pick[0]].name;
					price = rng.Next(1,11) * 250;
					qty = 1;
					if (searchTerm.test(name)) {
						count++;
						lib.resultData.push([offset + days[i], 'F', save.furniture[pick[0]].id, qty, price]); // CHANGED: ADDED
						output += '<tr><td>' + dayOfWeek + ' ' + monthName + ' ' + dayOfMonth + ', Year ' + year + '</td><td>' +
							wikify(name, "Furniture") + "</td><td>" + qty + "</td><td>" + addCommas(price) + "g</td></tr>";
					}
					if (month % 4 < 2) {
						if (!seenRareSeed) {
							name = 'Rare Seed';
							price = 1000;
							qty = (rng.NextDouble() < 0.1) ? 5 : 1;
							if (searchTerm.test(name)) {
								count++;
								lib.resultData.push([offset + days[i], 'O', '347', qty, price]); // CHANGED: ADDED
								output += '<tr><td>' + dayOfWeek + ' ' + monthName + ' ' + dayOfMonth + ', Year ' + year + '</td><td>' +
									wikify(name) + "</td><td>" + qty + "</td><td>" + addCommas(price) + "g</td></tr>";
							}
						}
					} else {
						rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_rarecrow"), save.gameID, offset + days[i] + save.dayAdjust));
						name = 'Rarecrow (Snowman)';
						if (rngSynced.NextDouble() < 0.4 && searchTerm.test(name)) {
							price = 4000;
							qty = 1;
							count++;
							lib.resultData.push([offset + days[i], 'BC', '136', qty, price]); // CHANGED: ADDED
							output += '<tr><td>' + dayOfWeek + ' ' + monthName + ' ' + dayOfMonth + ', Year ' + year + '</td><td>' +
								wikify(name) + "</td><td>" + qty + "</td><td>" + addCommas(price) + "g</td></tr>";
						}
					}
					if (month % 4 > 1) {
						rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_coffee_bean"), save.gameID, offset + days[i] + save.dayAdjust));
						name = 'Coffee Bean';
						if (rngSynced.NextDouble() < 0.25 && searchTerm.test(name)) {
							price = 2500;
							qty = 1;
							count++;
							lib.resultData.push([offset + days[i], 'O', '433', qty, price]); // CHANGED: ADDED
							output += '<tr><td>' + dayOfWeek + ' ' + monthName + ' ' + dayOfMonth + ', Year ' + year + '</td><td>' +
								wikify(name) + "</td><td>" + qty + "</td><td>" + addCommas(price) + "g</td></tr>";
						}
					}
					rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_fez"), save.gameID, offset + days[i] + save.dayAdjust));
					name = 'Red Fez';
					if (rngSynced.NextDouble() < 0.1 && searchTerm.test(name)) {
						price = 8000;
						qty = 1;
						count++;
						lib.resultData.push([offset + days[i], 'H', 'RedFez', qty, price]); // CHANGED: ADDED
						output += '<tr><td>' + dayOfWeek + ' ' + monthName + ' ' + dayOfMonth + ', Year ' + year + '</td><td>' +
							wikify(name, "Hats") + "</td><td>" + qty + "</td><td>" + addCommas(price) + "g</td></tr>";
					}
					if (save.ccComplete || save.jojaComplete) {
						rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_jojaCatalogue"), save.gameID, offset + days[i] + save.dayAdjust));
						name = 'Joja Catalogue';
						if (rngSynced.NextDouble() < 0.1 && searchTerm.test(name)) {
							price = 30000;
							qty = 1;
							count++;
							lib.resultData.push([offset + days[i], 'F', 'JojaCatalogue', qty, price]); // CHANGED: ADDED
							output += '<tr><td>' + dayOfWeek + ' ' + monthName + ' ' + dayOfMonth + ', Year ' + year + '</td><td>' +
								wikify(name) + "</td><td>" + qty + "</td><td>" + addCommas(price) + "g</td></tr>";
						}
						rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_junimoCatalogue"), save.gameID, offset + days[i] + save.dayAdjust));
						name = 'Junimo Catalogue';
						if (rngSynced.NextDouble() < 0.1 && searchTerm.test(name)) {
							price = 70000;
							qty = 1;
							count++;
							lib.resultData.push([offset + days[i], 'F', 'JunimoCatalogue', qty, price]); // CHANGED: ADDED
							output += '<tr><td>' + dayOfWeek + ' ' + monthName + ' ' + dayOfMonth + ', Year ' + year + '</td><td>' +
								wikify(name) + "</td><td>" + qty + "</td><td>" + addCommas(price) + "g</td></tr>";
						}
					}
					rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_retroCatalogue"), save.gameID, offset + days[i] + save.dayAdjust));
					name = 'Retro Catalogue';
					if (rngSynced.NextDouble() < 0.1 && searchTerm.test(name)) {
						price = 110000;
						qty = 1;
						count++;
						lib.resultData.push([offset + days[i], 'F', 'RetroCatalogue', qty, price]); // CHANGED: ADDED
						output += '<tr><td>' + dayOfWeek + ' ' + monthName + ' ' + dayOfMonth + ', Year ' + year + '</td><td>' +
							wikify(name) + "</td><td>" + qty + "</td><td>" + addCommas(price) + "g</td></tr>";
					}
					rngSynced = new CSRandom(getRandomSeed(getHashFromString("teaset"), save.gameID, offset + days[i] + save.dayAdjust));
					name = 'Tea Set';
					if (rngSynced.NextDouble() < 0.1 && searchTerm.test(name) && offset + save.dayAdjust >= 2688) {
						price = 1000000;
						qty = 1;
						count++;
						lib.resultData.push([offset + days[i], 'O', '341', qty, price]); // CHANGED: ADDED
						output += '<tr><td>' + dayOfWeek + ' ' + monthName + ' ' + dayOfMonth + ', Year ' + year + '</td><td>' +
							wikify(name) + "</td><td>" + qty + "</td><td>" + addCommas(price) + "g</td></tr>";
					}
					// Skill book not included yet until we can get more reliable identification of which book it is.
				}
			}
			output += '<tr><td colspan="4" class="count">Found ' + count + ' matching item(s)</td></tr></tbody></table>\n';
		} else {
			if (typeof(offset) === 'undefined' || offset === '') {
				offset = 7 * Math.floor((save.daysPlayed - 1) / 7);
			}
			// 1.6 adds traveling cart to a new 3-day Desert Festival.
			// The cart is technically also at the Ice Festival, but that has a fixed stock so we don't include it
			var days;
			var dayOfYear = offset % 112;
			var cartName = "Forest Cart";
			var nameOffset = 1;
			if (dayOfYear === 94 || dayOfYear === 10) {
				// Night Market and Desert Festival
				days = [5, 6, 7];
				$('#cart-next-week').val(offset + 4);
				$('#cart-prev-week').val(offset - 3);
				nameOffset = 5;
				cartName = (dayOfYear === 94) ? "Night Market<br/>Boat" : "Desert Festival<br/>Cart";
			} else {
				days = [5, 7];
				$('#cart-next-week').val(offset + 7);
				$('#cart-prev-week').val(offset - 7);
				if (dayOfYear === 7 || dayOfYear === 91 ) {
					// Weekend before a festival
					$('#cart-next-week').val(offset + 3);
				}
				if (dayOfYear === 14 || dayOfYear === 98 ) {
					// Weekend after a festival
					$('#cart-prev-week').val(offset - 4);
				}
			}
			$('#cart-next-year').val(offset + 112);
			$('#cart-prev-year').val(offset - 112);
			if (offset < 7) {
				$('#cart-prev-week').prop("disabled", true);
			} else {
				$('#cart-prev-week').prop("disabled", false);
			}
			if (offset < 112) {
				$('#cart-prev-year').prop("disabled", true);
			} else {
				$('#cart-prev-year').prop("disabled", false);
			}
			$('#cart-reset').val('reset');
			$('#cart-reset').html("Reset Browsing");
			$('#cart-next-week').prop("disabled", false);
			$('#cart-next-year').prop("disabled", false);
			// Reset search fields too
			$('#cart-search-text').val('');
			$('#cart-search-range').val(224); // CHANGED from: $('#cart-search-range').val(2);
			$('#cart-search-all').prop('checked', false);
			month = Math.floor(offset / 28);
			monthName = save.seasonNames[month % 4];
			year = 1 + Math.floor(offset / 112);
			dayOfMonth = offset % 28;
			
			output += '<table class="output"><thead><tr><th rowspan="2">' + cartName + '</th>';
			for (var d = 0; d < days.length; d++) {
				output += '<th colspan="3" class="multi">' + save.dayNames[days[d] - nameOffset] + ' ' +
					monthName + ' ' + (dayOfMonth + days[d]) + ', Year ' + year +	'</th>';
			}
			output += '</tr><tr>';
			for (var d = 0; d < days.length; d++) {
				output += '<th class="item">Item</th><th class="qty">Qty</th><th class="price">Price</th>';
			}
			output += '</tr><tbody>';
			var cart = {};
			for (var d = 0; d < days.length; d++) {
				cart[d] = {};
				cart[d].rng = new CSRandom(getRandomSeed(offset + days[d] + save.dayAdjust, save.gameID/2));
				cart[d].seenRareSeed = false;
				cart[d].selectedItems = {};
				var pick = getRandomItems(cart[d].rng, "objects", 2, 789, true, true, true, 10);
				for (var slot = 1; slot <= 10; slot++) {
					cart[d].selectedItems[slot] = {};
					cart[d].selectedItems[slot].name = save.objects[pick[slot-1]].name;
					if (cart[d].selectedItems[slot].name === "Rare Seed") {
						cart[d].seenRareSeed = true;
					}
					cart[d].selectedItems[slot].price = Math.max(cart[d].rng.Next(1,11) * 100, cart[d].rng.Next(3,6) * save.objects[pick[slot-1]].price);
					cart[d].selectedItems[slot].qty = (cart[d].rng.NextDouble() < 0.1) ? 5 : 1;
				}
			}
			for (var slot = 1; slot <= 10; slot++) {
				output += "<tr><td>Basic Item " + slot + "</td>";
				for (var d = 0; d < days.length; d++) {
					output += '<td class="item">' + wikify(cart[d].selectedItems[slot].name) + "</td><td>" + cart[d].selectedItems[slot].qty + "</td><td>" + addCommas(cart[d].selectedItems[slot].price) + "g</td>";
				}
				output += "</tr>";
			}
			// The Red Cabbage Y1 Guarantee which can only reliably look forward
			if (save.originalGuarantee >= 0) {
				output += "<tr><td>Year 1 Guarantee</td>";
				for (var d = 0; d < days.length; d++) {
					var dayOfPrediction = offset + days[d] + save.dayAdjust;
					var visitsNow = save.originalGuarantee - Math.floor(dayOfPrediction/7) - Math.floor((dayOfPrediction + 2)/7);
					if (dayOfPrediction >= 99) { visitsNow--; }
					if (dayOfPrediction >= 100) { visitsNow--; }
					if (dayOfPrediction >= 101) { visitsNow--; }
					if (visitsNow == 0) {
						name = save.objects["_485"].name;
						price = Math.max(cart[d].rng.Next(1,11) * 100, cart[d].rng.Next(3,6) * save.objects["_485"].price);
						qty = (cart[d].rng.NextDouble() < 0.1) ? 5 : 1;
						output += '<td class="item">' + wikify(name) + "</td><td>" + qty + "</td><td>" + addCommas(price) + "g</td>";
					} else if (visitsNow > 0) {
						output += '<td class="item">(' + visitsNow + (visitsNow == 1 ? ' visit' : ' visits') + " left)</td><td>--</td><td>--</td>";
					} else {
						output += '<td class="item">(Already passed)</td><td>--</td><td>--</td>';
					}
				}
				output += "</tr>";
			}
			output += '<tr><td>Furniture</td>';
			for (var d = 0; d < days.length; d++) {
				var pick = getRandomItems(cart[d].rng, "furniture", 0, 1612, true, true);
				name = save.furniture[pick[0]].name;
				price = cart[d].rng.Next(1,11) * 250;
				output += '<td class="item">' + wikify(name,'Furniture') + '</td><td>1</td><td>' + addCommas(price) + 'g</td>';
			}
			output += "</tr>";
			output += "<tr><td>Seasonal Special</td>";
			if (month % 4 < 2) {
				for (var d = 0; d < days.length; d++) {
					if (!cart[d].seenRareSeed) {
						name = wikify('Rare Seed');
						price = 1000;
						qty = (cart[d].rng.NextDouble() < 0.1) ? 5 : 1;
					} else {
						name = '(None)';
						price = '--';
						qty = '--';
					}
					output += '<td class="item">' + name + "</td><td>" + qty + "</td><td>" + addCommas(price) + (price == '--' ? '' : 'g') + "</td>";
				}
			} else {
				for (var d = 0; d < days.length; d++) {
					var rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_rarecrow"), save.gameID, offset + days[d] + save.dayAdjust));
					if (rngSynced.NextDouble() < 0.4) {
						name = wikify('Rarecrow (Snowman)');
						price = 4000;
						qty = 1;
					} else {
						name = '(None)';
						price = '--';
						qty = '--';
					}
					output += '<td class="item">' + name + "</td><td>" + qty + "</td><td>" + addCommas(price) + (price == '--' ? '' : 'g') + "</td>";
				}
			}
			output += "</tr>";
			output += "<tr><td>Coffee Bean</td>";
			if (month % 4 > 1) {
				for (var d = 0; d < days.length; d++) {
					var rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_coffee_bean"), save.gameID, offset + days[d] + save.dayAdjust));
					if (rngSynced.NextDouble() < 0.25) {
						name = wikify('Coffee Bean');
						price = 2500;
						qty = 1;
					} else {
						name = '(None)';
						price = '--';
						qty = '--';
					}
					output += '<td class="item">' + name + "</td><td>" + qty + "</td><td>" + addCommas(price) + (price == '--' ? '' : 'g') + "</td>";
				}
			} else {
				var span = days.length * 3;
				output += '<td class="item note" colspan="' + span + '">Only possible in Fall or Winter</td>';
			}
			output += "</tr>";
			output += "<tr><td>Red Fez</td>";
			for (var d = 0; d < days.length; d++) {
				var rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_fez"), save.gameID, offset + days[d] + save.dayAdjust));
				if (rngSynced.NextDouble() < 0.1) {
					name = wikify('Red Fez');
					price = 8000;
					qty = 1;
				} else {
					name = '(None)';
					price = '--';
					qty = '--';
				}
				output += '<td class="item">' + name + "</td><td>" + qty + "</td><td>" + addCommas(price) + (price == '--' ? '' : 'g') +  "</td>";
			}
			output += "</tr>";
			
			
			output += "<tr><td>Catalogue 1</td>";
			if (save.ccComplete) {
				for (var d = 0; d < days.length; d++) {
					var rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_jojaCatalogue"), save.gameID, offset + days[d] + save.dayAdjust));
					if (rngSynced.NextDouble() < 0.1) {
						name = wikify('Joja Catalogue');
						price = 30000;
						qty = 1;
					} else {
						name = '(None)';
						price = '--';
						qty = '--';
					}
					output += '<td class="item">' + name + "</td><td>" + qty + "</td><td>" + addCommas(price) + (price == '--' ? '' : 'g') +  "</td>";
				}
			} else {
				var span = days.length * 3;
				output += '<td class="item note" colspan="' + span + '">Only possible after Community Center Restoration</td>';
			}
			output += "</tr>";
			output += "<tr><td>Catalogue 2</td>";
			if (save.ccComplete || save.jojaComplete) {
				for (var d = 0; d < days.length; d++) {
					var rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_junimoCatalogue"), save.gameID, offset + days[d] + save.dayAdjust));
					if (rngSynced.NextDouble() < 0.1) {
						name = wikify('Junimo Catalogue');
						price = 70000;
						qty = 1;
					} else {
						name = '(None)';
						price = '--';
						qty = '--';
					}
					output += '<td class="item">' + name + "</td><td>" + qty + "</td><td>" + addCommas(price) + (price == '--' ? '' : 'g') +  "</td>";
				}
			} else {
				var span = days.length * 3;
				output += '<td class="item note" colspan="' + span + '">Only possible after Community Center Restoration</td>';
			}
			output += "</tr>";
			output += "<tr><td>Catalogue 3</td>";
			for (var d = 0; d < days.length; d++) {
				var rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_retroCatalogue"), save.gameID, offset + days[d] + save.dayAdjust));
				if (rngSynced.NextDouble() < 0.1) {
					name = wikify('Retro Catalogue');
					price = 110000;
					qty = 1;
				} else {
					name = '(None)';
					price = '--';
					qty = '--';
				}
				output += '<td class="item">' + name + "</td><td>" + qty + "</td><td>" + addCommas(price) + (price == '--' ? '' : 'g') +  "</td>";
			}
			output += "</tr>";
			output += "<tr><td>Y25 Tea Set</td>";
			if (offset + save.dayAdjust >= 2688) {
				for (var d = 0; d < days.length; d++) {
					var rngSynced = new CSRandom(getRandomSeed(getHashFromString("teaset"), save.gameID, offset + days[d] + save.dayAdjust));
					if (rngSynced.NextDouble() < 0.05)  {
						name = wikify('Tea Set');
						price = 1000000;
						qty = '∞';
					} else {
						name = '(None)';
						price = '--';
						qty = '--';
					}
					output += '<td class="item">' + name + "</td><td>" + qty + "</td><td>" + addCommas(price) + (price == '--' ? '' : 'g') +  "</td>";
				}
			} else {
				var span = days.length * 3;
				output += '<td class="item note" colspan="' + span + '">Only possible in Year 25 or later</td>';
			}
			output += "</tr>";
			output += "<tr><td>Skill Book</td>";
			for (var d = 0; d < days.length; d++) {
				var rngSynced = new CSRandom(getRandomSeed(getHashFromString("travelerSkillBook"), save.gameID, offset + days[d] + save.dayAdjust));
				if (rngSynced.NextDouble() < 0.05) {
					name = wikify(skillBookList[cart[d].rng.Next(skillBookList.length)]);
					price = 6000;
					qty = 1;
				} else {
					name = '(None)';
					price = '--';
					qty = '--';
				}
				output += '<td class="book item">' + name + "</td><td>" + qty + "</td><td>" + addCommas(price) + (price == '--' ? '' : 'g') +  "</td>";
			}
			output += "</tr>";
			output += '</tbody></table>\n';
		}
		return output;
	}
	
	let searchCartSeed = function (seed, searchTerm, searchStart, searchEnd) {
		// This is an optimized version of predictCart_1_6()'s search, for the seed finder.
		// The most significant change is that it uses the provided seed instead of save.gameID.
		
		var offset,
			month,
			year,
			dayOfMonth,
			slot,
			item,
			qty,
			price,
			name,
			count,
			startDay,
			skillBookList = ["Stardew Valley Almanac", "Bait And Bobber", "Woodcutter's Weekly", "Mining Monthly", "Combat Quarterly"];
		// Hitting search without an actual search term will fall through to the default browse function; we might want
		// to add some sort of error message or other feedback.
		// Note we are using the regexp matcher due to wanting to ignore case. The table header references offset still
		// so that it appears exactly as was typed in by the user.
		count = 0;
		// Much of the logic here is duplicated from the browsing section, but comments related to it have been removed.
		// Also, because output is purely a chronological list, we only need one RNG instance.
		for (offset = searchStart; offset < searchStart + searchEnd; offset += 7) {
			// It might make more sense to only bother with the date stuff when matches are found.
			var days = [5,7];
			var dayOfYear = offset % 112;
			if (dayOfYear === 98 || dayOfYear === 14) {
				days = [1,2,3,5,7];
			}
			month = Math.floor(offset / 28);
			year = 1 + Math.floor(offset / 112);
			for (var i = 0; i < days.length; i++) {
				var seenRareSeed = false;
				dayOfMonth = offset % 28 + days[i];
				var rng =  new CSRandom(getRandomSeed(offset + days[i] + save.dayAdjust, seed/2));
				var rngSynced;
				var pick = getRandomItems(rng, "objects", 2, 789, true, true, true, 10);
				var name, price, qty;
				for (var slot = 0; slot < 10; slot++) {
					price = Math.max(rng.Next(1,11) * 100, rng.Next(3,6) * save.objects[pick[slot]].price);
					qty = (rng.NextDouble() < 0.1) ? 5 : 1;
					if (save.objects[pick[slot]].name === 'Rare Seed') {
						seenRareSeed = true;
					}
					if (searchTerm.test(save.objects[pick[slot]].name)) {
						count++;
						lib.resultData.push([offset + days[i], 'O', save.objects[pick[slot]].id, qty, price]); // CHANGED: ADDED
					}
				}
				if (save.originalGuarantee >= 0) {
					var dayOfPrediction = offset + days[i] + save.dayAdjust;
					var visitsNow = save.originalGuarantee - Math.floor(dayOfPrediction/7) - Math.floor((dayOfPrediction + 2)/7);
					if (dayOfPrediction >= 99) { visitsNow--; }
					if (dayOfPrediction >= 100) { visitsNow--; }
					if (dayOfPrediction >= 101) { visitsNow--; }
					if (visitsNow == 0) {
						name = save.objects["_485"].name;
						price = Math.max(rng.Next(1,11) * 100, rng.Next(3,6) * save.objects["_485"].price);
						qty = (rng.NextDouble() < 0.1) ? 5 : 1;
						if (searchTerm.test(name)) {
							count++;
							lib.resultData.push([offset + days[i], 'O', '485', qty, price]); // CHANGED: ADDED
						}
					}
				}
				pick = getRandomItems(rng, "furniture", 0, 1612, true, true);
				name = save.furniture[pick[0]].name;
				price = rng.Next(1,11) * 250;
				qty = 1;
				if (searchTerm.test(name)) {
					count++;
					lib.resultData.push([offset + days[i], 'F', save.furniture[pick[0]].id, qty, price]); // CHANGED: ADDED
				}
				if (month % 4 < 2) {
					if (!seenRareSeed) {
						name = 'Rare Seed';
						price = 1000;
						qty = (rng.NextDouble() < 0.1) ? 5 : 1;
						if (searchTerm.test(name)) {
							count++;
							lib.resultData.push([offset + days[i], 'O', '347', qty, price]); // CHANGED: ADDED
						}
					}
				} else {
					rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_rarecrow"), seed, offset + days[i] + save.dayAdjust));
					name = 'Rarecrow (Snowman)';
					if (rngSynced.NextDouble() < 0.4 && searchTerm.test(name)) {
						price = 4000;
						qty = 1;
						count++;
						lib.resultData.push([offset + days[i], 'BC', '136', qty, price]); // CHANGED: ADDED
					}
				}
				if (month % 4 > 1) {
					rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_coffee_bean"), seed, offset + days[i] + save.dayAdjust));
					name = 'Coffee Bean';
					if (rngSynced.NextDouble() < 0.25 && searchTerm.test(name)) {
						price = 2500;
						qty = 1;
						count++;
						lib.resultData.push([offset + days[i], 'O', '433', qty, price]); // CHANGED: ADDED
					}
				}
				rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_fez"), seed, offset + days[i] + save.dayAdjust));
				name = 'Red Fez';
				if (rngSynced.NextDouble() < 0.1 && searchTerm.test(name)) {
					price = 8000;
					qty = 1;
					count++;
					lib.resultData.push([offset + days[i], 'H', 'RedFez', qty, price]); // CHANGED: ADDED
				}
				if (save.ccComplete || save.jojaComplete) {
					rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_jojaCatalogue"), seed, offset + days[i] + save.dayAdjust));
					name = 'Joja Catalogue';
					if (rngSynced.NextDouble() < 0.1 && searchTerm.test(name)) {
						price = 30000;
						qty = 1;
						count++;
						lib.resultData.push([offset + days[i], 'F', 'JojaCatalogue', qty, price]); // CHANGED: ADDED
					}
					rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_junimoCatalogue"), seed, offset + days[i] + save.dayAdjust));
					name = 'Junimo Catalogue';
					if (rngSynced.NextDouble() < 0.1 && searchTerm.test(name)) {
						price = 70000;
						qty = 1;
						count++;
						lib.resultData.push([offset + days[i], 'F', 'JunimoCatalogue', qty, price]); // CHANGED: ADDED
					}
				}
				rngSynced = new CSRandom(getRandomSeed(getHashFromString("cart_retroCatalogue"), seed, offset + days[i] + save.dayAdjust));
				name = 'Retro Catalogue';
				if (rngSynced.NextDouble() < 0.1 && searchTerm.test(name)) {
					price = 110000;
					qty = 1;
					count++;
					lib.resultData.push([offset + days[i], 'F', 'RetroCatalogue', qty, price]); // CHANGED: ADDED
				}
				rngSynced = new CSRandom(getRandomSeed(getHashFromString("teaset"), seed, offset + days[i] + save.dayAdjust));
				name = 'Tea Set';
				if (rngSynced.NextDouble() < 0.1 && searchTerm.test(name) && offset + save.dayAdjust >= 2688) {
					price = 1000000;
					qty = 1;
					count++;
					lib.resultData.push([offset + days[i], 'O', '341', qty, price]); // CHANGED: ADDED
				}
				// Skill book not included yet until we can get more reliable identification of which book it is.
			}
		}
	};
};
