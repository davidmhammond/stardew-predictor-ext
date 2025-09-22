import * as util from '../util.js';

export default class ItemRegistry {
	byType;
	all = [];
	localizer;
	
	constructor (localizer) {
		this.localizer = localizer;
		this.clear();
	}
	
	get (itemType, itemId) {
		if (itemId == null) {
			let parts = util.parseItemId(itemType);
			
			if (parts != null) {
				itemType = parts[0];
				itemId = parts[1];
			}
		}
		
		let item = this.byType[itemType]?.get(itemId);
		
		if (item == null) {
			item = {
				itemType: itemType,
				itemId: itemId,
				spriteIndex: 543,
				texture: util.tx.mouseCursors,
				name: null,
				displayName: `(Unknown ${itemType}#${itemId})`,
				description: null,
				category: 0,
				type: null,
				data: null,
				qualifiedItemId: `(${itemType})${itemId}`,
				excludeFromRandomSale: false,
				isError: true,
			};
			
			this.addExtraItemProperties(item);
			Object.freeze(item);
		}
		
		return item;
	}
	
	resolve (itemId, details) {
		return this.get(this.getItemType(itemId, details), itemId);
	}
	
	getItemType (itemId, details) {
		let search;
		
		switch (details?.['@xsi:type']) {
		case 'BedFurniture':
		case 'FishTankFurniture':
		case 'Furniture':
		case 'RandomizedPlantFurniture':
		case 'StorageFurniture':
		case 'TV':
			return 'F';
		
		case 'Wallpaper':
			return (details.isFloor === 'true') ? 'FL' : 'WP';
		}
		
		switch (+(details?.category ?? 0)) {
		case -9: search = ['BC']; break;
		case -24: search = ['O', 'F']; break;
		case -95: search = ['H']; break;
		case -97: search = ['B']; break;
		case -98: search = ['W']; break;
		case -99: search = ['T', 'W']; break;
		case -100: search = ['P', 'S']; break;
		case -101: search = ['TR']; break;
		
		default:
			search = ['O', 'BC', 'F', 'W', 'B', 'H', 'M', 'P', 'S', 'T', 'TR', 'WP', 'FL'];
		}
		
		if (itemId != null) {
			for (let itemType of search) {
				if (this.byType[itemType]?.has(itemId)) {
					return itemType;
				}
			}
		}
		
		// No match found. Default to the first search type.
		
		return search[0];
	}
	
	clear () {
		this.byType = {};
		this.all.length = 0;
	}
	
	load (content) {
		this.clear();
		let empty = {};
		
		for (let [itemId, data] of Object.entries(content.Data.Objects)) {
			let category = data.Category;
			
			if (category === 0 && data.Type === 'Ring') {
				category = -96;
			}
			
			this.all.push({
				itemType: 'O',
				itemId: itemId,
				spriteIndex: data.SpriteIndex,
				texture: util.normalizeTexture(data.Texture) ?? util.tx.objectSpriteSheet,
				name: data.Name,
				displayName: this.localizer.parseText(data.DisplayName),
				description: this.localizer.parseText(data.Description),
				category: category,
				type: data.Type,
				data: data,
				excludeFromRandomSale: data.ExcludeFromRandomSale,
			});
		}
		
		for (let [itemId, data] of Object.entries(content.Data.BigCraftables)) {
			this.all.push({
				itemType: 'BC',
				itemId: itemId,
				spriteIndex: data.SpriteIndex,
				texture: util.normalizeTexture(data.Texture) ?? util.tx.bigCraftableSpriteSheet,
				name: data.Name,
				displayName: this.localizer.parseText(data.DisplayName),
				description: this.localizer.parseText(data.Description),
				category: -9,
				type: 'Crafting',
				data: data,
			});
		}
		
		for (let [itemId, data] of Object.entries(content.Data.Furniture)) {
			data = data.split('/');
			let spriteIndex = +(data[8] || -1);
			this.all.push({
				itemType: 'F',
				itemId: itemId,
				spriteIndex: spriteIndex > -1 ? spriteIndex : !isNaN(itemId) ? +itemId : -1,
				texture: util.normalizeTexture(data[9]) || 'TileSheets/furniture',
				name: data[0],
				displayName: this.localizer.parseText(data[7] ?? ''),
				description: null,
				category: -24,
				type: null,
				data: data,
				excludeFromRandomSale: data[10] === 'true',
			});
		}
		
		for (let [itemId, data] of Object.entries(content.Data.Weapons)) {
			this.all.push({
				itemType: 'W',
				itemId: itemId,
				spriteIndex: data.SpriteIndex,
				texture: data.Texture,
				name: data.Name,
				displayName: this.localizer.parseText(data.DisplayName),
				description: this.localizer.parseText(data.Description),
				category: ['47', '53', '66'].includes(itemId) ? -99 : -98,
				type: null,
				data: data,
			});
		}
		
		for (let [itemId, data] of Object.entries(content.Data.Boots)) {
			data = data.split('/');
			let spriteIndex = +(data[8] || -1);
			this.all.push({
				itemType: 'B',
				itemId: itemId,
				spriteIndex: spriteIndex > -1 ? spriteIndex : !isNaN(itemId) ? +itemId : -1,
				texture: util.normalizeTexture(data[9]) || util.tx.objectSpriteSheet,
				name: data[0],
				displayName: data[6],
				description: data[1],
				category: -97,
				type: null,
				data: data,
			});
		}
		
		for (let [itemId, data] of Object.entries(content.Data.hats)) {
			data = data.split('/');
			let spriteIndex = +(data[6] || -1);
			this.all.push({
				itemType: 'H',
				itemId: itemId,
				spriteIndex: spriteIndex > -1 ? spriteIndex : !isNaN(itemId) ? +itemId : -1,
				texture: util.normalizeTexture(data[7]) || util.tx.FarmerRenderer.hatsTexture,
				name: data[0],
				displayName: data[5],
				description: data[1],
				category: -95,
				type: null,
				data: data,
			});
		}
		
		for (let [itemId, data] of Object.entries(content.Data.Mannequins)) {
			this.all.push({
				itemType: 'M',
				itemId: itemId,
				spriteIndex: data.SheetIndex,
				texture: util.normalizeTexture(data.Texture) ?? 'TileSheets/Mannequins',
				name: itemId,
				displayName: this.localizer.parseText(data.DisplayName),
				description: this.localizer.parseText(data.Description),
				category: 0,
				type: null,
				data: data,
			});
		}
		
		for (let [itemId, data] of Object.entries(content.Data.Pants)) {
			this.all.push({
				itemType: 'P',
				itemId: itemId,
				spriteIndex: data.SpriteIndex,
				texture: util.normalizeTexture(data.Texture) ?? util.tx.FarmerRenderer.pantsTexture,
				name: data.Name,
				displayName: this.localizer.parseText(data.DisplayName),
				description: this.localizer.parseText(data.Description),
				category: -100,
				type: null,
				data: data,
			});
		}
		
		for (let [itemId, data] of Object.entries(content.Data.Shirts)) {
			this.all.push({
				itemType: 'S',
				itemId: itemId,
				spriteIndex: data.SpriteIndex,
				texture: util.normalizeTexture(data.Texture) ?? util.tx.FarmerRenderer.shirtsTexture,
				name: data.Name,
				displayName: this.localizer.parseText(data.DisplayName),
				description: this.localizer.parseText(data.Description),
				category: -100,
				type: null,
				data: data,
			});
		}
		
		for (let [itemId, data] of Object.entries(content.Data.Tools)) {
			this.all.push({
				itemType: 'T',
				itemId: itemId,
				spriteIndex: data.MenuSpriteIndex > -1 ? data.MenuSpriteIndex : data.SpriteIndex,
				texture: util.normalizeTexture(data.Texture),
				name: itemId,
				displayName: this.localizer.parseText(data.DisplayName),
				description: this.localizer.parseText(data.Description),
				category: -99,
				type: null,
				data: data,
			});
		}
		
		for (let [itemId, data] of Object.entries(content.Data.Trinkets)) {
			this.all.push({
				itemType: 'TR',
				itemId: itemId,
				spriteIndex: data.SheetIndex,
				texture: util.normalizeTexture(data.Texture) ?? util.tx.Tool.weaponsTexture,
				name: itemId,
				displayName: this.localizer.parseText(data.DisplayName),
				description: this.localizer.parseText(data.Description),
				category: -101,
				type: null,
				data: data,
			});
		}
		
		{
			let displayName = this.localizer.parseText('[LocalizedText Strings\\StringsFromCSFiles:Wallpaper.cs.13204]');
			let description = this.localizer.parseText('[LocalizedText Strings\\StringsFromCSFiles:Wallpaper.cs.13206]');
			
			for (let i = 0; i < 112; ++i) {
				this.all.push({
					itemType: 'WP',
					itemId: i + '',
					spriteIndex: i,
					texture: 'Maps/walls_and_floors',
					name: 'Wallpaper',
					displayName: displayName,
					description: description,
					category: 0,
					type: null,
					data: empty,
				});
			}
			
			for (let data of content.Data.AdditionalWallpaperFlooring) {
				if (!data.IsFlooring) {
					for (let i = 0; i < data.Count; ++i) {
						this.all.push({
							itemType: 'WP',
							itemId: `${data.Id}:${i}`,
							spriteIndex: i,
							texture: util.normalizeTexture(data.Texture),
							name: 'Wallpaper',
							displayName: displayName,
							description: description,
							category: 0,
							type: null,
							data: data,
						});
					}
				}
			}
		}
		
		{
			let displayName = this.localizer.parseText('[LocalizedText Strings\\StringsFromCSFiles:Wallpaper.cs.13203]');
			let description = this.localizer.parseText('[LocalizedText Strings\\StringsFromCSFiles:Wallpaper.cs.13205]');
			
			for (let i = 0; i < 88; ++i) {
				this.all.push({
					itemType: 'FL',
					itemId: i + '',
					spriteIndex: i,
					texture: 'Maps/walls_and_floors',
					name: 'Flooring',
					displayName: displayName,
					description: description,
					category: 0,
					type: null,
					data: empty,
				});
			}
			
			for (let data of content.Data.AdditionalWallpaperFlooring) {
				if (data.IsFlooring) {
					for (let i = 0; i < data.Count; ++i) {
						this.all.push({
							itemType: 'FL',
							itemId: `${data.Id}:${i}`,
							spriteIndex: i,
							texture: util.normalizeTexture(data.Texture),
							name: 'Flooring',
							displayName: displayName,
							description: description,
							category: 0,
							type: null,
							data: data,
						});
					}
				}
			}
		}
		
		for (let item of this.all) {
			if (!Object.hasOwn(this.byType, item.itemType)) {
				this.byType[item.itemType] = new Map();
			}
			
			this.addExtraItemProperties(item);
			Object.freeze(item);
			this.byType[item.itemType].set(item.itemId, item);
		}
	}
	
	addExtraItemProperties (item) {
		item.qualifiedItemId = `(${item.itemType})${item.itemId}`;
		item.excludeFromRandomSale ??= false;
		item.spriteRect = Object.freeze(util.getItemRect(item));
	};
};
