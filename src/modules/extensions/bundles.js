import * as util from '../util.js';

export let initialize = function (core, extension) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.bundles;
	let baseUtil = core.baseUtil;
	
	let roomOrder =
	{
		'Crafts Room': 1,
		'Pantry': 2,
		'Fish Tank': 3,
		'Boiler Room': 4,
		'Bulletin Board': 5,
		'Vault': 6,
		'Abandoned Jaja Mart': 7,
	};
	
	core.addSaveLoader(function (xmlDoc, wasChanged) {
		ext.bundles = [];
		
		if (xmlDoc == null) {
			return;
		}
		
		let bundleCompletions = {};
		
		$(xmlDoc).find(':root > locations > GameLocation > bundles > item').each(function () {
			let values = [];
			
			$(this).find('> value > ArrayOfBoolean > boolean').each(function () {
				values.push($(this).text() === 'true');
			});
			
			bundleCompletions[+$(this).find('> key > int').first().text()] = values;
		});
		
		$(xmlDoc).find(':root > bundleData > item').each(function () {
			let key = $(this).find('> key > string').first().text().split('/');
			let value = $(this).find('> value > string').first().text().split('/');
			let itemData = value[2].split(' ');
			let bundleItems = [];
			for (let i = 0; i < itemData.length; i += 3) {
				bundleItems.push({
					itemId: itemData[i],
					stack: +itemData[i + 1],
					quality: +itemData[i + 2],
					complete: bundleCompletions[key[1]][i / 3],
				});
			}
			let reward;
			if (value[1] == '') {
				reward = null;
			} else {
				let rewardData = value[1].split(' ');
				reward = {
					itemType: util.convertOldItemType(rewardData[0], rewardData[1]),
					itemId: rewardData[1],
					stack: +rewardData[2],
				};
			}
			ext.bundles.push({
				room: key[0],
				roomOrder: roomOrder[key[0]] || 999,
				name: value[0],
				order: +key[1],
				itemsRequired: value.length > 4 ? +(value[4] || 1) : 1,
				items: bundleItems,
				reward: reward,
			});
		});
		
		ext.bundles.sort(function (a, b) {
			let cmp;
			cmp = a.roomOrder - b.roomOrder;
			if (cmp == 0) {
				cmp = a.order - b.order;
			}
			return cmp;
		});
	});
	
	core.addPredictor('bundles', 'Bundles', function (isSearch, offset, extra) {
		let output = '';
		output += '<table class="output"><thead><tr><th>Bundle</th><th>Acceptable items</th><th>Inventories</th><th>Progress</th><th>Remaining</th><th>Reward</th></tr></thead>\n<tbody>';
		let currentRoom = null;
		
		for (let i = 0; i < ext.bundles.length; ++i) {
			let bundle = ext.bundles[i];
			
			if (bundle.room !== currentRoom) {
				output += '<tr><th colspan="6">' + bundle.room + '</th></tr>';
				currentRoom = bundle.room;
			}
			
			output += '<tr><td>' + bundle.name + '</td><td>';
			let inventoryOutput = '';
			
			let completeItems = [];
			let completableItems = 0;
			
			for (let j = 0; j < bundle.items.length; ++j) {
				let item = bundle.items[j];
				let name = core.getItemHTML('O', item.itemId, 'imageLink', item.stack, item.quality);
				
				if (item.complete) {
					completeItems.push(name);
					name = '<span style="opacity: .25;">' + name + '</span>';
				}
				else if (core.isExtensionEnabled('inventories')) {
					if (item.itemId === '-1') {
						inventoryOutput += '<span style="display:inline-block; margin: 0 2px;">' + core.getItemHTML('O', item.itemId, 'imageLink', common.player.money) + '</span>';
						
						if (common.player.money >= item.stack) {
							++completableItems;
						}
					}
					else {
						let count = core.extVars.inventories.itemCounts.get(`(O)${item.itemId}`);
						
						if (count != null) {
							let total = 0;
							
							for (let quality = item.quality; quality <= 4; ++quality) {
								if (count[quality] > 0) {
									total += count[quality];
									inventoryOutput += '<span style="display:inline-block; margin: 0 2px;">' + core.getItemHTML('O', item.itemId, 'imageLink', count[quality], quality) + '</span>';
								}
							}
							
							if (total >= item.stack) {
								++completableItems;
							}
						}
					}
				}
				
				output += '<span style="display:inline-block; margin: 0 2px;">' + name + '</span>';
			}
			
			output += '</td><td>';
			output += inventoryOutput;
			output += '</td><td>';
			let remaining = bundle.itemsRequired;
			let completeItemsIndex = 0;
			
			for (let i = 0; i < bundle.itemsRequired; ++i) {
				let positionX = -512;
				let positionY = -244;
				
				if (completeItemsIndex < completeItems.length) {
					positionX = -620;
					--remaining;
				}
				else if (completeItemsIndex < completeItems.length + completableItems) {
					positionX = -530;
					positionY = -262;
				}
				
				let url = util.contentURI('LooseSprites/JunimoNote.png');
				output += `<span style="display: inline-block; width: 18px; height: 16px; background:url('${url}') ${positionX}px ${positionY}px no-repeat; padding: 1px 0px; margin: 0 2px;">${completeItems[completeItemsIndex] ?? ''}</span>`;
				++completeItemsIndex;
			}
			
			output += '</td><td>' + remaining + '</td><td>';
			let name;
			
			if (bundle.reward === null) {
				name = '(None)';
			} else {
				name = core.getItemHTML(bundle.reward.itemType, bundle.reward.itemId, 'imageLink', bundle.reward.stack);
			}
			
			if (remaining == 0) {
				name = '<span style="opacity: .25;">' + name + '</span>';
			}
			
			output += name + '</td></tr>';
		}
		
		output += '</tbody></table>';
		return output;
	});
};
