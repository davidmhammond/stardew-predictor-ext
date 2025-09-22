import * as util from '../util.js';

export let initialize = function (core, extension) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.inventories;
	let baseUtil = core.baseUtil;
	
	let lib = extension.lib;
	
	core.addDataFile('Data/Locations');
	
	core.addSaveLoader(function (xmlDoc, wasChanged) {
		let tracker = new lib.ItemTracker();
		ext.tools = tracker.tools;
		ext.itemCounts = tracker.itemCounts;
		
		ext.playerInventory = [];
		ext.chests = [];
		ext.maxItems = 12;
		
		if (xmlDoc == null) {
			return;
		}
		
		ext.maxItems = +$(xmlDoc).find(':root > player > maxItems').first().text();
		
		$(xmlDoc).find(':root > player > items').first().each(function () {
			let items = util.getElementDetails(this);
			
			for (let item of util.getDetailsMultiple(items, 'Item')) {
				if (util.nilOrDetails(item) === null) {
					ext.playerInventory.push(null);
				}
				else {
					tracker.loadItem(ext.playerInventory, item);
				}
			}
		});
		
		$(xmlDoc).find(':root > locations > GameLocation, :root > locations > GameLocation > buildings > Building > indoors').each(function () {
			let location = this;
			let locationId =
				$(this).find('> uniqueName').first().text() ||
				$(this).find('> name').first().text();
			
			switch (this.getAttributeNS(util.ns.xsi, 'type')) {
			case 'FarmHouse':
			case 'IslandFarmHouse': {
				let locationDetails = util.getElementDetails(this, {
					includeChildren: [
						'fridge',
						'fridgePosition',
					],
				});
				
				// See StardewValley.GameLocation:GetFridge()
				//
				// A fridge position of (0, 0) indicates that it hasn't been unlocked yet.
				
				if (+(locationDetails.fridgePosition?.X ?? 0) !== 0 && +(locationDetails.fridgePosition?.Y ?? 0) !== 0) {
					ext.chests.push(...tracker.getFridge(locationDetails, locationId));
				}
				
				break;
			}}
			
			$(this).find('> objects > item > value > Object').each(function () {
				switch (this.getAttributeNS(util.ns.xsi, 'type')) {
				case 'Chest':
					ext.chests.push(...tracker.getChests('objects', util.getElementDetails(this), locationId));
					break;
				}
			});
			
			$(this).find('> furniture > Furniture').each(function () {
				switch (this.getAttributeNS(util.ns.xsi, 'type')) {
				case 'StorageFurniture':
					ext.chests.push(...tracker.getChests('furniture', util.getElementDetails(this), locationId));
					break;
				}
			});
			
			$(this).find('> buildings > Building').each(function () {
				if ($(this).find('> buildingChests > Chest').length > 0) {
					ext.chests.push(...tracker.getChests('buildings', util.getElementDetails(this), locationId));
				}
			});
		});
	});
	
	core.addPredictor('inventories', 'Inventories', function (isSearch, offset, extra) {
		let output = '';
		
		output += '<div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: start;">';
		
		output += '<div>';
		output += '<h4>Player</h4>';
		output += '<div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: start;">';
		output += lib.getInventoryHTML(ext.playerInventory, 12, 3, ext.maxItems, 'Player inventory');
		output += '</div></div>';
		
		let chestLocationMap = new Map();
		
		for (let chest of ext.chests) {
			let chestLocation = chestLocationMap.get(chest.locationId);
			
			if (chestLocation == null) {
				let locationTitle = null;
				
				if (core.isExtensionEnabled('maps')) {
					locationTitle = core.extVars.maps.locations[chest.locationId]?.displayName;
				}
				else {
					locationTitle = core.content.Data.Locations[chest.locationId]?.DisplayName;
					
					if (locationTitle != null) {
						locationTitle = core.localizer.parseText(locationTitle);
					}
				}
				
				if (locationTitle == null) {
					locationTitle = chest.locationId;
				}
				
				chestLocation = {
					locationId: chest.locationId,
					locationTitle: locationTitle,
					chests: [],
				};
				chestLocationMap.set(chest.locationId, chestLocation);
			}
			
			chestLocation.chests.push(chest);
		}
		
		let chestLocations = chestLocationMap.values().toArray();
		chestLocations.sort(function (a, b) {
			return a.locationTitle.localeCompare(b.locationTitle);
		});
		
		for (let chestLocation of chestLocations) {
			output += '<div>';
			output += `<h4>${util.escapeHTML(chestLocation.locationTitle)}</h4>`;
			output += '<div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: start;">';
			chestLocation.chests.sort(function (a, b) {
				return (a.y - b.y) || (a.x - b.x);
			});
			
			for (let chest of chestLocation.chests) {
				output += lib.getChestHTML(chest);
			}
			
			output += '</div></div>';
		}
		
		output += '</div>';
		return output;
	});
	
	lib.toolTypes = [
		'Axe',
		'ErrorTool',
		'FishingRod',
		'GenericTool',
		'Hoe',
		'Lantern',
		'MeleeWeapon',
		'MilkPail',
		'Pan',
		'Pickaxe',
		'Raft',
		'Shears',
		'Slingshot',
		'Tool',
		'Wand',
		'WateringCan',
	];
	
	lib.isInventoryFeature = function (kind, details) {
		switch (kind) {
		case 'buildings':
			return details.buildingChests?.Chest != null;
		
		case 'furniture':
			return details['@xsi:type'] === 'StorageFurniture';
		
		case 'objects':
		case 'special':
			return details['@xsi:type'] === 'Chest';
		}
		
		return false;
	};
	
	lib.getChestHTML = function (chest) {
		let width = 12;
		let height = 3;
		
		switch (chest.type) {
		case 'Chest':
			if (chest.chestItem != null) {
				switch (chest.chestItem.qualifiedItemId) {
				case '(BC)BigChest':
				case '(BC)BigStoneChest':
					width = 14;
					height = 5;
					break;
				}
			}
			
			break;
		
		case 'StorageFurniture':
			// Always show at least one empty slot at the end, to visually
			// reinforce that it isn't full.
			
			height = Math.max(1, Math.ceil((chest.items.length + 1) / width));
			break;
		}
		
		let chestName = chest.name ?? chest.chestItem?.displayName ?? 'Unknown';
		
		if (chest.x != null || chest.y != null) {
			chestName += ` at (${chest.x}, ${chest.y})`;
		}
		
		return lib.getInventoryHTML(chest.items, width, height, null, chestName);
	};
	
	lib.getInventoryHTML = function (items, width = 12, height = 3, maxItems = null, caption = null) {
		height = Math.max(height, Math.ceil(items.length / width));
		maxItems ??= width * height;
		
		let output = '';
		output += `<table class="output inventory" style="--cols: ${width};">`;
		
		if (caption != null) {
			output += `<thead><th colspan="${width}">${util.escapeHTML(caption)}</th></thead>`;
		}
		
		output += '<tbody>';
		let i = 0;
		
		for (let y = 0; y < height; ++y) {
			output += '<tr>';
			
			for (let x = 0; x < width; ++x) {
				let details = items[i];
				let className = 'inventory-slot';
				
				if (i >= maxItems) {
					className += ' unavailable';
				}
				
				output += `<td class="${className}">`;
				
				if (details != null) {
					let item = core.items.resolve(details.itemId, details);
					output += core.getItemHTML(item.itemType, item.itemId, 'imageLink', +(details.stack ?? 1), +(details.quality ?? 0), details);
				}
				
				output += '</td>';
				++i;
			}
			
			output += '</tr>';
		}
		
		output += '</tbody></table>';
		return output;
	};
	
	// Shortcuts to ItemTracker methods without tracking.
	
	lib.getFridge = function (locationDetails, locationId) {
		return (new lib.ItemTracker()).getFridge(locationDetails, locationId);
	};
	
	lib.getChests = function (kind, details, locationId) {
		return (new lib.ItemTracker()).getChests(kind, details, locationId);
	};
	
	//== Chest class ==//
	
	lib.Chest = class {
		type = null;
		
		locationId = null;
		x = null;
		y = null;
		name = null;
		chestItem = null;
		items = [];
		
		constructor (type) {
			this.type = type;
		}
		
		setLocation (locationId, tileX, tileY) {
			this.locationId = locationId;
			this.x = (tileX == null) ? null : +tileX;
			this.y = (tileY == null) ? null : +tileY;
		}
	}
	
	//== ItemTracker class ==//
	
	lib.ItemTracker = class {
		itemCounts = new Map();
		tools = [];
		
		getFridge (locationDetails, locationId) {
			let details = util.rootDetails(locationDetails, 'fridge');
			details['@xsi:type'] = 'Chest';
			details.itemId = '130'; // Chest
			details.fridge = 'true';
			details.tileLocation = locationDetails.fridgePosition;
			return this.getChests('special', details, locationId);
		}
		
		getChests (kind, details, locationId) {
			let chests = [];
			
			if (lib.isInventoryFeature(kind, details)) {
				switch (kind) {
				case 'buildings': {
					for (let entry of util.getDetailsMultiple(details.buildingChests, 'Chest')) {
						let chest = new lib.Chest(entry['@xsi:type'] ?? 'Chest');
						chests.push(chest);
						chest.setLocation(locationId, details.tileX, details.tileY);
						chest.name = `${details.buildingType} (${entry.name})`;
						chest.chestItem = core.items.resolve(entry.itemId, entry);
						this.loadItems(chest, entry);
					}
					
					break;
				}
				case 'furniture': {
					let chest = new lib.Chest(details['@xsi:type'] ?? 'Furniture');
					chests.push(chest);
					chest.setLocation(locationId, details.tileLocation?.X, details.tileLocation?.Y);
					chest.chestItem = core.items.get('F', details.itemId);
					this.loadItems(chest, details);
					break;
				}
				case 'objects':
				case 'special': {
					let type = details['@xsi:type'] ?? 'Object';
					let chest = new lib.Chest(type);
					chests.push(chest);
					chest.setLocation(locationId, details.tileLocation?.X, details.tileLocation?.Y);
					chest.chestItem = core.items.resolve(details.itemId, details);
					this.loadItems(chest, details);
					
					if (details.fridge === 'true') {
						chest.name = 'Fridge';
					}
					else if (details.giftbox === 'true') {
						chest.name = 'Gift Box';
					}
					
					break;
				}}
			}
			
			return chests;
		}
		
		loadItems (chest, details) {
			switch (chest.type) {
			case 'Chest':
				for (let itemDetails of util.getDetailsMultiple(details.items, 'Item')) {
					this.loadItem(chest.items, itemDetails);
				}
				
				break;
			
			case 'StorageFurniture':
				for (let itemDetails of util.getDetailsMultiple(details, 'heldItems')) {
					this.loadItem(chest.items, itemDetails);
				}
				
				break;
			}
		}
		
		loadItem (inventoryList, details) {
			let item = core.items.resolve(details.itemId, details);
			inventoryList.push(details);
			
			let counts = this.itemCounts.get(item.qualifiedItemId);
			
			if (counts == null) {
				counts = {
					total: 0,
					0: 0,
					1: 0,
					2: 0,
					4: 0,
				};
				this.itemCounts.set(item.qualifiedItemId, counts);
			}
			
			let stack = +(details.stack ?? 1);
			let quality = +(details.quality ?? 0);
			counts.total += stack;
			
			if (quality >= 0 && Object.hasOwn(counts, quality)) {
				counts[quality] += stack;
			}
			
			if (lib.toolTypes.includes(details['@xsi:type'])) {
				this.tools.push(details);
			}
		};
	};
};
