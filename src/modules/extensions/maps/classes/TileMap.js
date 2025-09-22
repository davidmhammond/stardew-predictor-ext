import Layer from './Layer.js';
import TileSheet from './TileSheet.js';
import Warp from './Warp.js';

import * as mapsUtil from '../mapsUtil.js';
import * as util from '../../../util.js';

export default class TileMap {
	path;
	sourceMaps;
	
	width = 0;
	height = 0;
	tileWidth = 16;
	tileHeight = 16;
	
	minX = 0;
	minY = 0;
	maxX = 0;
	maxY = 0;
	warps = [];
	
	properties = {};
	tileSheets = [];
	layerList = [];
	layers = {};
	appliedOverrides = new Set();
	
	constructor (path, sourceMaps) {
		this.path = path;
		this.sourceMaps = sourceMaps;
	}
	
	//== Loading ==//
	
	loadXMLDoc (xmlDoc, location) {
		let map = this;
		
		$(xmlDoc).find(':root > properties > property').each(function () {
			mapsUtil.addMapPropertyElement(map.properties, this);
		});
		
		$(xmlDoc).find(':root > tileset').each(function () {
			let $image = $(this).find('> image').first();
			let imageSource = $image.attr('source');
			
			// See StardewValley.GameLocation:updateSeasonalTileSheets()
			
			if (!(location.type !== 'Summit' && (location.details.isOutdoors !== 'true' || location.name === 'Desert'))) {
				imageSource = imageSource.replace(/(^|\/)(?:spring|summer|fall|winter)(_[^\/]*)$/, function (match, p1, p2) {
					return `${p1}${location.getSeasonName()}${p2}`;
				});
			}
			
			let tileSheet = new TileSheet(this.getAttribute('name'), util.normalizeTexture(`Maps/${imageSource}`));
			tileSheet.loadElement(this);
			map.addTileSheet(tileSheet);
			
			$(this).find('> tile').each(function () {
				let properties = {};
				tileSheet.tileProperties[this.getAttribute('id')] = properties;
				
				$(this).find('> properties > property').each(function () {
					mapsUtil.addMapPropertyElement(properties, this);
				});
			});
		});
		
		map.tileSheets.sort(function (a, b) {
			return a.firstGid - b.firstGid;
		});
		
		let attrTemplates = [];
		
		for (let [index, tileSheet] of map.tileSheets.entries()) {
			tileSheet.index = index;
			attrTemplates.push({
				tileSheetIndex: index,
				shared: true,
				properties: {},
			});
		}
		
		let layerMap = new Map();
		
		$(xmlDoc).find(':root > layer').each(function () {
			let layer = new Layer(this.getAttribute('name'), +this.getAttribute('width'), +this.getAttribute('height'));
			map.layerList.push(layer);
			map.layers[layer.name] = layer;
			map.width = Math.max(map.width, layer.width);
			map.height = Math.max(map.height, layer.height);
			
			$(this).find('> properties > property').each(function () {
				mapsUtil.addMapPropertyElement(layer.properties, this);
			});
			
			let lastGid = null;
			let tile = -1;
			let attributes;
			
			for (let [index, gid] of $(this).find('> data').first().text().trim().split(/,\s*/).entries()) {
				if (gid !== lastGid) {
					lastGid = gid;
					gid = +gid;
					let match = null;
					
					for (let tileSheet of map.tileSheets) {
						if (gid < tileSheet.firstGid) {
							break;
						}
						
						match = tileSheet;
					}
					
					if (match === null) {
						tile = -1;
						attributes = attrTemplates[0];
					}
					else {
						tile = gid - match.firstGid;
						attributes = attrTemplates[match.index];
					}
				}
				
				layer.tiles[index] = tile;
				layer.tileAttributes[index] = attributes;
			}
		});
		
		this.sortLayers();
		
		$(xmlDoc).find(':root > objectgroup').each(function () {
			let layer = map.layers[this.getAttribute('name')];
			
			$(this).find('> object').each(function () {
				let tileIndex = Math.floor(+this.getAttribute('x') / 16) + Math.floor(+this.getAttribute('y') / 16) * layer.width;
				let attributes = map.getTileAttributesForModification(layer, tileIndex);
				
				$(this).find('> properties > property').each(function () {
					mapsUtil.addMapPropertyElement(attributes.properties, this);
				});
			});
		});
		
		//map.width = map.layerList[0].width;
		//map.height = map.layerList[0].height;
		map.tileWidth = map.tileSheets[0].tileWidth;
		map.tileHeight = map.tileSheets[0].tileHeight;
		map.maxX = map.width;
		map.maxY = map.height;
		
		if (map.properties.Warp != null) {
			let warpData = map.properties.Warp.split(' ');
			
			for (let i = 0; i < warpData.length; i += 5) {
				map.addWarp(new Warp(warpData[i], warpData[i + 1], warpData[i + 2], warpData[i + 3], warpData[i + 4]));
			}
		}
	}
	
	importMap (map) {
		this.width = map.width;
		this.height = map.height;
		this.tileWidth = map.tileWidth;
		this.tileHeight = map.tileHeight;
		
		this.minX = map.minX;
		this.minY = map.minY;
		this.maxX = map.maxX;
		this.maxY = map.maxY;
		this.warps = [...map.warps];
		
		this.properties = window.structuredClone(map.properties);
		
		for (let mapTileSheet of map.tileSheets) {
			let tileSheet = new TileSheet(mapTileSheet.name, mapTileSheet.texture);
			tileSheet.importTileSheet(mapTileSheet);
			this.addTileSheet(tileSheet);
		}
		
		for (let mapLayer of map.layerList) {
			let layer = new Layer(mapLayer.name, mapLayer.width, mapLayer.height);
			this.layerList.push(layer);
			this.layers[layer.name] = layer;
			layer.index = mapLayer.index;
			layer.properties = window.structuredClone(mapLayer.properties);
			layer.tiles.set(mapLayer.tiles);
			
			for (let [tileIndex, attrs] of mapLayer.tileAttributes.entries()) {
				layer.tileAttributes[tileIndex] = attrs.shared ? attrs : window.structuredClone(attrs);
			}
		}
	}
	
	applyMapOverride (mapName, sourceRect = null, destRect = null) {
		this.applyMapOverrideCustom(mapName, mapName, sourceRect, destRect);
	}
	
	applyMapOverrideCustom (overrideMap, overrideKey, sourceRect = null, destRect = null, perTileCustomAction = null) {
		// See StardewValley.GameLocation:ApplyMapOverride()
		
		if (this.appliedOverrides.has(overrideKey)) {
			return;
		}
		
		this.appliedOverrides.add(overrideKey);
		
		if (typeof overrideMap === 'string') {
			overrideMap = this.sourceMaps[`Maps/${overrideMap}`];
		}
		
		// Translate tilesheets.
		
		let tileSheetLookup = {};
		
		for (let overrideTileSheet of overrideMap.tileSheets) {
			let tileSheet = this.getTileSheetByName(overrideTileSheet.name);
			
			if (tileSheet === null || tileSheet.texture !== overrideTileSheet.texture) {
				tileSheet = new TileSheet(this.getAddedMapOverrideTilesheetId(overrideKey, overrideTileSheet.name), overrideTileSheet.texture);
				tileSheet.importTileSheet(overrideTileSheet);
				this.addTileSheet(tileSheet);
			}
			else if (tileSheet.tileCount < overrideTileSheet.tileCount) {
				tileSheet.width = overrideTileSheet.width;
				tileSheet.height = overrideTileSheet.height;
				
				for (let i = tileSheet.tileCount; i < overrideTileSheet.tileCount; ++i) {
					if (Object.hasOwn(overrideTileSheet.tileProperties, i)) {
						tileSheet.tileProperties[i] = {...overrideTileSheet.tileProperties[i]};
					}
				}
			}
			
			tileSheetLookup[overrideTileSheet.index] = tileSheet;
		}
		
		// Translate layers.
		
		let layerLookup = {};
		let layersDirty = false;
		let emptyAttrs = {
			tileSheetIndex: 0,
			shared: true,
			properties: {},
		};
		
		for (let overrideLayer of overrideMap.layerList) {
			if (!Object.hasOwn(this.layers, overrideLayer.name)) {
				let layer = new Layer(overrideLayer.name, this.width, this.height);
				this.layerList.push(layer);
				this.layers[layer.name] = layer;
				layer.tiles.fill(-1);
				layer.tileAttributes.fill(emptyAttrs);
				layersDirty = true;
			}
			
			layerLookup[overrideLayer.index] = this.layers[overrideLayer.name];
		}
		
		if (layersDirty) {
			this.sortLayers();
		}
		
		// Copy tiles.
		
		sourceRect ??= new util.Rect(0, 0, overrideMap.width, overrideMap.height);
		destRect ??= new util.Rect(0, 0, this.width, this.height);
		
		for (let x = 0; x < sourceRect.width; ++x) {
			for (let y = 0; y < sourceRect.height; ++y) {
				if (perTileCustomAction != null) {
					perTileCustomAction(destRect.x + x, destRect.y + y);
				}
				
				let lowerLayerOverridden = false;
				
				for (let overrideLayer of overrideMap.layerList) {
					let targetLayer = layerLookup[overrideLayer.index];
					let sourceTileIndex = overrideLayer.getTileIndex(sourceRect.x + x, sourceRect.y + y);
					let destTileIndex = targetLayer.getTileIndex(destRect.x + x, destRect.y + y);
					
					if (targetLayer == null || destRect.x + x >= targetLayer.width || destRect.y + y >= targetLayer.Height || (!lowerLayerOverridden && overrideLayer.tiles[sourceTileIndex] < 0)) {
						continue;
					}
					
					lowerLayerOverridden = true;
					
					if (sourceRect.x + x >= overrideLayer.width || sourceRect.y + y >= overrideLayer.height) {
						continue;
					}
					
					targetLayer.tiles[destTileIndex] = overrideLayer.tiles[sourceTileIndex];
					let overrideAttributes = overrideLayer.tileAttributes[sourceTileIndex];
					let targetAttributes = this.getTileAttributesForModification(targetLayer, destTileIndex);
					targetAttributes.tileSheetIndex = tileSheetLookup[overrideAttributes.tileSheetIndex].index;
					targetAttributes.properties = {...overrideAttributes.properties};
				}
			}
		}
	}
	
	addWarp (warp) {
		this.warps.push(warp);
		this.minX = Math.min(this.minX, warp.x);
		this.minY = Math.min(this.minY, warp.y);
		this.maxX = Math.max(this.maxX, warp.x + 1);
		this.maxY = Math.max(this.maxY, warp.y + 1);
	}
	
	getAddedMapOverrideTilesheetId (overrideKey, tileSheetName) {
		return `zzzzz_${overrideKey}_${tileSheetName}`;
	}
	
	sortLayers () {
		let layerTypes = [
			'Back',
			'Buildings',
			'Front',
			'Paths',
			'AlwaysFront',
		];
		
		for (let layer of this.layerList) {
			for (let [layerTypeIndex, layerType] of layerTypes) {
				if (layer.name.startsWith(layerType)) {
					let sortIndex = +(layer.name.substring(layerType.length) || 0);
					
					if (!isNaN(sortIndex)) {
						layer.sortKey = [layerTypeIndex, sortIndex];
						break;
					}
				}
			}
		}
		
		this.layerList.sort(function (a, b) {
			return ((a.sortKey?.[0] ?? layerTypes.length) - (b.sortKey?.[0] ?? layerTypes.length)) ||
				((a.sortKey?.[1] ?? 0) - (b.sortKey?.[1] ?? 0));
		});
		
		for (let [index, layer] of this.layerList.entries()) {
			delete layer.sortKey;
			layer.index = index;
		}
	}
	
	//== Tilesheets ==//
	
	getTileSheetByName (name) {
		for (let tileSheet of this.tileSheets) {
			if (tileSheet.name === name) {
				return tileSheet;
			}
		}
		
		return null;
	}
	
	addTileSheet (tileSheet) {
		tileSheet.index = this.tileSheets.length;
		this.tileSheets.push(tileSheet);
	}
	
	//== Tiles ==//
	
	getTileIndex (tileX, tileY) {
		if (!this.isTileOnMap(tileX, tileY)) {
			return null;
		}
		
		return tileX + tileY * this.width;
	}
	
	getTileX (tileIndex) {
		return tileIndex % this.width;
	}
	
	getTileY (tileIndex) {
		return Math.floor(tileIndex / this.width);
	}
	
	isTileOnMap (tileX, tileY) {
		return (tileX >= 0 && tileY >= 0 && tileX < this.width && tileY < this.height);
	}
	
	hasTile (tileX, tileY, layerName, tileSheetName = null) {
		return this.getTile(tileX, tileY, layerName, tileSheetName) >= 0;
	}
	
	getTile (tileX, tileY, layerName, tileSheetName = null) {
		if (!Object.hasOwn(this.layers, layerName)) {
			return -1;
		}
		
		let layer = this.layers[layerName];
		let tileIndex = layer.getTileIndex(tileX, tileY);
		
		if (tileSheetName != null) {
			let tileSheetIndex = layer.tileAttributes[tileIndex]?.tileSheetIndex;
			
			if (tileSheetIndex == null || this.tileSheets[tileSheetIndex]?.name !== tileSheetName) {
				return -1;
			}
		}
		
		return layer.tiles[tileIndex] ?? -1;
	}
	
	removeTile (tileX, tileY, layerName) {
		let layer = this.layers[layerName];
		layer.tiles[layer.getTileIndex(tileX, tileY)] = -1;
	}
	
	setTile (tileX, tileY, tile, layerName, tileSheetName, action = null, copyProperties = true) {
		// See StardewValley.GameLocation:setMapTile()
		
		let layer = this.layers[layerName];
		let tileIndex = layer.getTileIndex(tileX, tileY);
		let tileSheetIndex = this.getTileSheetByName(tileSheetName).index;
		let attributes = this.getTileAttributesForModification(layer, tileIndex);
		
		if (layer.tiles[tileIndex] < 0) {
			copyProperties = false;
		}
		else if (attributes.tileSheetIndex === tileSheetIndex) {
			copyProperties = true;
		}
		
		layer.tiles[tileIndex] = tile;
		attributes.tileSheetIndex = tileSheetIndex;
		
		if (!copyProperties) {
			attributes.properties = {};
		}
		
		if (action != null && layerName === 'Buildings') {
			attributes.properties.Action = action;
		}
	}
	
	getTileAttributes (tileX, tileY, layerName, tileSheetName = null) {
		if (!Object.hasOwn(this.layers, layerName)) {
			return null;
		}
		
		let layer = this.layers[layerName];
		let tileIndex = layer.getTileIndex(tileX, tileY);
		let attrs = layer.tileAttributes[tileIndex];
		
		if (attrs == null) {
			return null;
		}
		
		if (tileSheetName != null) {
			if (this.tileSheets[attrs.tileSheetIndex]?.name !== tileSheetName) {
				return null;
			}
		}
		
		return attrs;
	}
	
	getTileSheetAt (tileX, tileY, layerName) {
		if (!Object.hasOwn(this.layers, layerName)) {
			return null;
		}
		
		let layer = this.layers[layerName];
		let tileIndex = layer.getTileIndex(tileX, tileY);
		let tileSheetIndex = layer.tileAttributes[tileIndex]?.tileSheetIndex;
		
		if (tileSheetIndex === null) {
			return null;
		}
		
		return this.tileSheets[tileSheetIndex] ?? null;
	}
	
	removeTileProperty (tileX, tileY, layerName, key) {
		let layer = this.layers[layerName];
		let attributes = this.getTileAttributesForModification(layer, layer.getTileIndex(tileX, tileY));
		delete attributes.properties[key];
	}
	
	setTileProperty (tileX, tileY, layerName, key, value) {
		let layer = this.layers[layerName];
		let attributes = this.getTileAttributesForModification(layer, layer.getTileIndex(tileX, tileY));
		attributes.properties[key] = value;
	}
	
	getTileAttributesForModification (layer, tileIndex) {
		let attributes = layer.tileAttributes[tileIndex];
		
		if (attributes.shared) {
			attributes = {
				tileSheetIndex: attributes.tileSheetIndex,
				properties: {...attributes.properties},
			};
			layer.tileAttributes[tileIndex] = attributes;
		}
		
		return attributes;
	}
};
