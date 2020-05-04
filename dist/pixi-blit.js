var pixi_blit;
(function (pixi_blit) {
    var BlitComponent = (function () {
        function BlitComponent() {
            this.sprite = null;
        }
        BlitComponent.prototype.tryRender = function (renderer) {
            if (this.sprite) {
                this.sprite.render(renderer);
                return true;
            }
            return false;
        };
        return BlitComponent;
    }());
    pixi_blit.BlitComponent = BlitComponent;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    var BLIT_STORAGE_MODE;
    (function (BLIT_STORAGE_MODE) {
        BLIT_STORAGE_MODE[BLIT_STORAGE_MODE["AUTO_DETECT"] = 0] = "AUTO_DETECT";
        BLIT_STORAGE_MODE[BLIT_STORAGE_MODE["RENDER_TEXTURE"] = 1] = "RENDER_TEXTURE";
        BLIT_STORAGE_MODE[BLIT_STORAGE_MODE["MSAA"] = 2] = "MSAA";
        BLIT_STORAGE_MODE[BLIT_STORAGE_MODE["WEBGL_CONTEXT"] = 3] = "WEBGL_CONTEXT";
    })(BLIT_STORAGE_MODE = pixi_blit.BLIT_STORAGE_MODE || (pixi_blit.BLIT_STORAGE_MODE = {}));
    var BlitRequest = (function () {
        function BlitRequest() {
            this.output = null;
            this.matchRes = false;
            this.doClear = false;
            this.rect = new PIXI.Rectangle();
        }
        return BlitRequest;
    }());
    pixi_blit.BlitRequest = BlitRequest;
    var CLEAR_MODES = PIXI.CLEAR_MODES;
    var RenderBuffer = (function () {
        function RenderBuffer(renderer, options) {
            this._storageMode = BLIT_STORAGE_MODE.RENDER_TEXTURE;
            this.parentRenderer = null;
            this.innerRenderer = null;
            this.innerTexture = null;
            this.clearBeforeBlit = CLEAR_MODES.AUTO;
            this._blitFilter = null;
            this._blitRequest = new BlitRequest();
            this.parentRenderer = renderer;
            this._dimensions = {
                width: options.width,
                height: options.height,
                resolution: options.resolution || 1,
                scaleMode: PIXI.SCALE_MODES.LINEAR,
            };
            this._blitFilter = new PIXI.filters.AlphaFilter();
            this._blitFilter.blendMode = PIXI.BLEND_MODES.NONE;
            this._storageMode = BLIT_STORAGE_MODE.WEBGL_CONTEXT;
            this._init(options);
        }
        RenderBuffer.prototype._init = function (options) {
            this.innerTexture = PIXI.RenderTexture.create(this._dimensions);
        };
        Object.defineProperty(RenderBuffer.prototype, "storageMode", {
            get: function () {
                return this._storageMode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderBuffer.prototype, "dimensions", {
            get: function () {
                return this._dimensions;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderBuffer.prototype, "width", {
            get: function () {
                return this._dimensions.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderBuffer.prototype, "height", {
            get: function () {
                return this._dimensions.height;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderBuffer.prototype, "resolution", {
            get: function () {
                return this._dimensions.resolution;
            },
            enumerable: true,
            configurable: true
        });
        RenderBuffer.prototype.renderAndBlit = function (container, renderTexture, clear, translation, skipUpdateTransform) {
            if (clear === void 0) { clear = false; }
            if (skipUpdateTransform === void 0) { skipUpdateTransform = false; }
            this.parentRenderer.render(container, this.innerTexture, clear, translation, skipUpdateTransform);
            if (renderTexture) {
                this.blit(renderTexture);
            }
        };
        RenderBuffer.prototype.blit = function (destination) {
            if (this.parentRenderer.context.isLost) {
                return;
            }
            var dimensions = this._dimensions;
            var req = this._blitRequest;
            req.rect.width = Math.min(dimensions.width, destination.width);
            req.rect.height = Math.min(dimensions.height, destination.height);
            req.matchRes = destination.baseTexture.resolution === dimensions.resolution;
            req.doClear = this.clearBeforeBlit == CLEAR_MODES.CLEAR || this.clearBeforeBlit == CLEAR_MODES.AUTO &&
                (destination.width > req.rect.width || destination.height > req.rect.height);
            req.output = destination;
            this._blitInner(req);
        };
        RenderBuffer.prototype._blitInner = function (req) {
            this._blitInnerTexture(req);
        };
        RenderBuffer.prototype._blitInnerTexture = function (req) {
            var renderer = this.parentRenderer;
            var gl = renderer.gl;
            var input = this.innerTexture;
            var output = req.output, rect = req.rect, matchRes = req.matchRes, doClear = req.doClear;
            if (matchRes) {
                if (doClear) {
                    renderer.renderTexture.bind(output);
                    renderer.renderTexture.clear();
                }
                renderer.renderTexture.bind(input);
                renderer.texture.bindForceLocation(output, 0);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                renderer.gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, rect.width, rect.height);
            }
            else {
                renderer.filter.applyOuterFilter(this._blitFilter, input, output, rect, doClear);
            }
        };
        RenderBuffer.create = function (renderer, options) {
            var storageMode = options.storageMode || BLIT_STORAGE_MODE.AUTO_DETECT;
            if (storageMode === BLIT_STORAGE_MODE.AUTO_DETECT) {
                if (renderer.context.webGLVersion === 2) {
                    storageMode = BLIT_STORAGE_MODE.MSAA;
                }
                else {
                    storageMode = BLIT_STORAGE_MODE.WEBGL_CONTEXT;
                }
            }
            switch (storageMode) {
                case BLIT_STORAGE_MODE.WEBGL_CONTEXT:
                    return new pixi_blit.RenderBufferGL1(renderer, options);
                case BLIT_STORAGE_MODE.MSAA:
                    return new pixi_blit.RenderBufferGL2(renderer, options);
                default:
                    return new RenderBuffer(renderer, options);
            }
        };
        RenderBuffer.prototype.dispose = function () {
            if (this.innerTexture) {
                this.innerTexture.baseTexture.dispose();
            }
        };
        RenderBuffer.prototype.destroy = function () {
            this.dispose();
            this.innerTexture = null;
            if (this.innerRenderer) {
                this.innerRenderer.destroy();
                this.innerRenderer = null;
            }
        };
        return RenderBuffer;
    }());
    pixi_blit.RenderBuffer = RenderBuffer;
})(pixi_blit || (pixi_blit = {}));
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var pixi_blit;
(function (pixi_blit) {
    var RenderBufferGL1 = (function (_super) {
        __extends(RenderBufferGL1, _super);
        function RenderBufferGL1() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        RenderBufferGL1.prototype._init = function (options) {
            this.innerRenderer = new PIXI.Renderer(__assign({ antialias: true, transparent: true }, this._dimensions));
        };
        RenderBufferGL1.prototype.renderAndBlit = function (container, renderTexture, clear, translation, skipUpdateTransform) {
            if (clear === void 0) { clear = false; }
            if (skipUpdateTransform === void 0) { skipUpdateTransform = false; }
            if (this.innerRenderer.context.isLost) {
                return;
            }
            this.innerRenderer.render(container, undefined, clear, translation, skipUpdateTransform);
            if (renderTexture) {
                this.blit(renderTexture);
            }
        };
        RenderBufferGL1.prototype._blitInner = function (req) {
            if (this.innerRenderer.context.isLost) {
                return;
            }
            var renderer = this.parentRenderer;
            var gl = renderer.gl;
            var sourceCanvas = this.innerRenderer.view;
            var output = req.output, rect = req.rect, matchRes = req.matchRes, doClear = req.doClear;
            var dimensions = this._dimensions;
            var ignoreInnerTexture = matchRes && rect.width == dimensions.width
                && rect.height == dimensions.height;
            if (ignoreInnerTexture) {
                if (doClear) {
                    renderer.renderTexture.bind(output);
                    renderer.renderTexture.clear();
                }
                renderer.texture.bindForceLocation(output, 0);
            }
            else {
                if (!this.innerTexture) {
                    this.innerTexture = PIXI.RenderTexture.create(this._dimensions);
                }
                renderer.texture.bindForceLocation(this.innerTexture, 0);
            }
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
            if (!ignoreInnerTexture) {
                this._blitInnerTexture(req);
            }
        };
        return RenderBufferGL1;
    }(pixi_blit.RenderBuffer));
    pixi_blit.RenderBufferGL1 = RenderBufferGL1;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    var inRect = new PIXI.Rectangle(0, 0, 1, 1);
    var outRect = new PIXI.Rectangle(0, 0, 1, 1);
    var RenderBufferGL2 = (function (_super) {
        __extends(RenderBufferGL2, _super);
        function RenderBufferGL2() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.useBlitForScale = true;
            return _this;
        }
        RenderBufferGL2.prototype._init = function (options) {
            this.innerTexture = PIXI.RenderTexture.create(this._dimensions);
            this._storageMode = pixi_blit.BLIT_STORAGE_MODE.MSAA;
            this._framebuffer = this.innerTexture.baseTexture.framebuffer;
            this._framebuffer.multisample = PIXI.MSAA_QUALITY.HIGH;
        };
        RenderBufferGL2.prototype.renderAndBlit = function (container, renderTexture, clear, translation, skipUpdateTransform) {
            if (clear === void 0) { clear = false; }
            if (skipUpdateTransform === void 0) { skipUpdateTransform = false; }
            this.parentRenderer.render(container, this.innerTexture, clear, translation, skipUpdateTransform);
            if (renderTexture) {
                this.blit(renderTexture);
            }
        };
        RenderBufferGL2.prototype._blitInner = function (req) {
            var renderer = this.parentRenderer;
            var gl = renderer.gl;
            var rect = req.rect, matchRes = req.matchRes, doClear = req.doClear;
            var resizeTo = req.output.baseTexture.framebuffer;
            var blitTo = matchRes ? resizeTo : null;
            var inputRes = this._dimensions.resolution;
            var outRes = req.output.baseTexture.resolution;
            if (doClear) {
                renderer.renderTexture.bind(req.output);
                renderer.renderTexture.clear();
            }
            renderer.renderTexture.bind(this.innerTexture);
            inRect.width = Math.round(rect.width * inputRes);
            inRect.height = Math.round(rect.height * inputRes);
            renderer.framebuffer.blit(blitTo, inRect, inRect);
            if (!matchRes) {
                if (this.useBlitForScale) {
                    outRect.width = Math.round(rect.width * outRes);
                    outRect.height = Math.round(rect.height * outRes);
                    renderer.framebuffer.blit(resizeTo, inRect, outRect);
                }
                else {
                    this._blitInnerTexture(req);
                }
            }
            renderer.renderTexture.bind(null);
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        };
        return RenderBufferGL2;
    }(pixi_blit.RenderBuffer));
    pixi_blit.RenderBufferGL2 = RenderBufferGL2;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    PIXI.blit = pixi_blit;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    var tempState = {
        sourceFrame: new PIXI.Rectangle(),
        destinationFrame: new PIXI.Rectangle(),
        resolution: 1,
    };
    function applyOuterFilter(filter, input, output, rect, clear) {
        if (clear === void 0) { clear = true; }
        var state = tempState;
        state.sourceFrame = rect;
        state.destinationFrame = input.frame;
        state.resolution = input.resolution;
        var saveFilterFrame = input.filterFrame;
        input.filterFrame = rect;
        var globalUniforms = this.globalUniforms.uniforms;
        globalUniforms.outputFrame = state.sourceFrame;
        globalUniforms.resolution = state.resolution;
        var inputSize = globalUniforms.inputSize;
        var inputPixel = globalUniforms.inputPixel;
        var inputClamp = globalUniforms.inputClamp;
        inputSize[0] = state.destinationFrame.width;
        inputSize[1] = state.destinationFrame.height;
        inputSize[2] = 1.0 / inputSize[0];
        inputSize[3] = 1.0 / inputSize[1];
        inputPixel[0] = inputSize[0] * state.resolution;
        inputPixel[1] = inputSize[1] * state.resolution;
        inputPixel[2] = 1.0 / inputPixel[0];
        inputPixel[3] = 1.0 / inputPixel[1];
        inputClamp[0] = 0.5 * inputPixel[2];
        inputClamp[1] = 0.5 * inputPixel[3];
        inputClamp[2] = (state.sourceFrame.width * inputSize[2]) - (0.5 * inputPixel[2]);
        inputClamp[3] = (state.sourceFrame.height * inputSize[3]) - (0.5 * inputPixel[3]);
        this.globalUniforms.update();
        filter.apply(this, input, output, clear ? PIXI.CLEAR_MODES.CLEAR : PIXI.CLEAR_MODES.NO, state);
        input.filterFrame = saveFilterFrame;
    }
    PIXI.systems.FilterSystem.prototype.applyOuterFilter = applyOuterFilter;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    function bindForceLocation(tex, location) {
        if (location === void 0) { location = 0; }
        var gl = this.gl;
        if (this.currentLocation !== location) {
            this.currentLocation = location;
            gl.activeTexture(gl.TEXTURE0 + location);
        }
        this.bind(tex, location);
    }
    PIXI.systems.TextureSystem.prototype.bindForceLocation = bindForceLocation;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    var CacheType;
    (function (CacheType) {
        CacheType[CacheType["Auto"] = 0] = "Auto";
        CacheType[CacheType["No_Cache"] = 1] = "No_Cache";
        CacheType[CacheType["Canvas2d"] = 2] = "Canvas2d";
        CacheType[CacheType["WebGL"] = 3] = "WebGL";
        CacheType[CacheType["RuntimeWebGL"] = 4] = "RuntimeWebGL";
    })(CacheType = pixi_blit.CacheType || (pixi_blit.CacheType = {}));
    var AbstractAtlasStorage = (function () {
        function AbstractAtlasStorage(type, options) {
            this.type = type;
            this.options = options;
            this.atlas = null;
        }
        AbstractAtlasStorage.prototype.bind = function (atlas) {
            this.atlas = atlas;
        };
        AbstractAtlasStorage.prototype.unbind = function () {
            this.atlas = null;
        };
        return AbstractAtlasStorage;
    }());
    pixi_blit.AbstractAtlasStorage = AbstractAtlasStorage;
    var Atlas = (function () {
        function Atlas(storage) {
            this.storage = storage;
            this.root = null;
            this.addedElements = [];
            this.pad = 1;
            this.isSingle = false;
            this.totalArea = 0;
            this.usedArea = 0;
            this.drawnElements = 0;
            this.mem = new pixi_blit.MemoryComponent();
            this.uniqId = pixi_blit.generateUid();
            this.root = this.createAtlasRoot();
            storage.bind(this);
        }
        Object.defineProperty(Atlas.prototype, "options", {
            get: function () {
                return this.storage.options;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Atlas.prototype, "type", {
            get: function () {
                return this.storage.type;
            },
            enumerable: true,
            configurable: true
        });
        Atlas.prototype.markSingle = function () {
            this.pad = 0;
            this.isSingle = true;
        };
        Atlas.prototype.hasNew = function () {
            return this.drawnElements < this.addedElements.length;
        };
        Atlas.prototype.markClean = function () {
            this.drawnElements = this.addedElements.length;
        };
        Atlas.prototype.destroy = function () {
            var addedElements = this.addedElements;
            this.mem.cacheStatus = pixi_blit.CacheStatus.Disposed;
            this.storage = null;
            for (var i = 0; i < addedElements.length; i++) {
                var elem = addedElements[i];
                if (elem.mem.cacheStatus === pixi_blit.CacheStatus.Hanging) {
                    elem.destroy();
                }
            }
        };
        Atlas.prototype.createAtlasRoot = function () {
            var res = pixi_blit.AtlasNode.allocate();
            res.rect.width = this.options.width;
            res.rect.height = this.options.height;
            return res;
        };
        Atlas.prototype.insert = function (elem) {
            var _a = this, pad = _a.pad, root = _a.root;
            elem.newAtlasNode = root.insert(elem.width + 2 * pad, elem.height + 2 * pad, elem);
            this.totalArea += elem.area;
            this.usedArea += elem.area;
            if (elem.newAtlasNode) {
                elem.newAtlas = this;
                this.addedElements.push(elem);
                return true;
            }
            return false;
        };
        Atlas.prototype.reset = function () {
            if (this.root) {
                this.root.freeSubtree();
            }
            this.root = this.createAtlasRoot();
            this.addedElements.length = 0;
            this.totalArea = 0;
            this.usedArea = 0;
            this.drawnElements = 0;
        };
        Atlas.prototype.calcHoldArea = function () {
            var addedElements = this.addedElements;
            var holdArea = 0;
            for (var i = 0; i < addedElements.length; i++) {
                var elem = addedElements[i];
                if (elem.mem.cacheStatus <= pixi_blit.CacheStatus.Drawn) {
                    holdArea += elem.area;
                }
            }
            this.usedArea = holdArea;
            return holdArea;
        };
        Atlas.prototype.attach = function () {
        };
        Atlas.prototype.prepareRender = function (elem) {
            var _a = this, pad = _a.pad, storage = _a.storage;
            if (elem.newAtlas === null) {
                if (elem.atlas === this) {
                    return;
                }
                else {
                    throw new Error("Atlas element init error: element belongs to another atlas");
                }
            }
            if (elem.newAtlas !== this) {
                throw new Error("Atlas element init error: element should be added to another atlas");
            }
            var prevAtlas = elem.atlas;
            var oldTexture = elem.texture;
            elem.atlas = this;
            elem.atlasNode = elem.newAtlasNode;
            elem.newAtlas = null;
            elem.newAtlasNode = null;
            var graphicsNode = elem.graphicsNode, atlasNode = elem.atlasNode, outerBounds = elem.outerBounds;
            graphicsNode.transform.position.set(-outerBounds.x + pad + atlasNode.rect.left, -outerBounds.y + pad + atlasNode.rect.top);
            graphicsNode._recursivePostUpdateTransform();
            elem.texture = new PIXI.Texture(storage.baseTexture, new PIXI.Rectangle(atlasNode.rect.left + pad, atlasNode.rect.top + pad, elem.width, elem.height));
            if (prevAtlas) {
                if (elem.oldAtlasSprite) {
                    elem.oldAtlasSprite = null;
                }
                else {
                    var sprite = elem.oldAtlasSprite = new PIXI.Sprite(oldTexture);
                    elem.oldAtlasSprite.position.set(elem.texture.frame.x, elem.texture.frame.y);
                    sprite._recursivePostUpdateTransform();
                }
            }
        };
        return Atlas;
    }());
    pixi_blit.Atlas = Atlas;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    var lightQueue = [];
    var newAtlases = [];
    var AtlasCollection = (function () {
        function AtlasCollection(storage) {
            var _this = this;
            this.storage = storage;
            this.list = [];
            this.singles = {};
            this.newSingles = [];
            this.drop = [];
            this.pool = [];
            this.frameRasterQueue = [];
            this.elemSortMethod = function (a, b) {
                if (b.width == a.width) {
                    return b.height - a.height;
                }
                return b.height - a.height;
            };
            this.isBig = function (elem) {
                var min = Math.min(elem.width, elem.height);
                var max = Math.max(elem.width, elem.height);
                var options = _this.storage.options;
                return max >= options.dim1MaxSize || min >= options.dim2MinSize && max >= options.dim2MaxSize;
            };
            this.atlasSortMethod = function (a, b) {
                if (a.usedArea - b.usedArea > 0) {
                    return 1;
                }
                if (a.usedArea - b.usedArea < 0) {
                    return -1;
                }
                return 0;
            };
            storage.bind(this);
            this.textureOptions = {
                width: storage.options.atlasSize,
                height: storage.options.atlasSize,
            };
        }
        AtlasCollection.prototype.addToQueue = function (raster) {
            if (raster.addingToCollection) {
                if (raster.addingToCollection !== this) {
                    throw new Error('Trying to add raster to second collection');
                }
                return;
            }
            raster.addingToCollection = this;
            this.frameRasterQueue.push(raster);
        };
        AtlasCollection.prototype.cacheSingleElem = function (elem) {
            var _a = this, storage = _a.storage, singles = _a.singles, newSingles = _a.newSingles;
            var stor = storage.createStorageBySize(elem);
            var atlas = new pixi_blit.Atlas(stor);
            atlas.markSingle();
            atlas.insert(elem);
            if (!elem.newAtlas) {
                throw new Error("Cant add element in single atlas");
            }
            newSingles.push(atlas);
            singles[atlas.uniqId] = atlas;
        };
        AtlasCollection.prototype.takeFromPool = function () {
            var atlas = new pixi_blit.Atlas(this.pool.pop()
                || this.storage.createStorageBySize(this.textureOptions));
            this.list.push(atlas);
            return atlas;
        };
        AtlasCollection.prototype.processQueue = function () {
            var queue = this.frameRasterQueue;
            var _a = this, isBig = _a.isBig, storage = _a.storage, list = _a.list;
            for (var i = 0; i < queue.length; i++) {
                var elem = queue[i];
                if (isBig(elem)) {
                    this.cacheSingleElem(elem);
                }
                else {
                    lightQueue.push(elem);
                }
            }
            queue.length = 0;
            if (lightQueue.length === 0) {
                return;
            }
            lightQueue.sort(this.elemSortMethod);
            var atlasList = storage.options.atlasAllowInsert ? list : newAtlases;
            for (var i = 0; i < lightQueue.length; i++) {
                var elem = lightQueue[i];
                for (var j = 0; j < atlasList.length; j++) {
                    if (atlasList[j].insert(elem)) {
                        break;
                    }
                }
                if (elem.newAtlas === null) {
                    var newAtlas = this.takeFromPool();
                    newAtlas.insert(elem);
                    if (!elem.newAtlas) {
                        throw new Error("Cant add element in shared atlas");
                    }
                    newAtlases.push(newAtlas);
                }
            }
            lightQueue.length = 0;
            newAtlases.length = 0;
        };
        AtlasCollection.prototype.gcTick = function () {
            var _a = this, list = _a.list, singles = _a.singles;
            for (var i = 0; i < list.length; i++) {
                var atlas = list[i];
                atlas.calcHoldArea();
                if (atlas.usedArea === 0) {
                    this.removeAtlas(atlas);
                }
            }
            for (var key in singles) {
                var atlas = singles[key];
                if (atlas.addedElements[0].mem.cacheStatus === pixi_blit.CacheStatus.Hanging) {
                    this.removeAtlas(atlas);
                }
            }
        };
        AtlasCollection.prototype.removeAtlas = function (atlas) {
            var _a = this, list = _a.list, pool = _a.pool;
            if (atlas.isSingle) {
                delete this.singles[atlas.uniqId];
                atlas.storage.dispose();
                atlas.destroy();
                return;
            }
            var ind = list.indexOf(atlas);
            if (ind < 0) {
                throw new Error('removed atlas not found in the list');
            }
            list.splice(ind, 1);
            atlas.mem.cacheStatus = pixi_blit.CacheStatus.Hanging;
            this.drop.push(atlas);
            atlas.storage.unbind();
            pool.push(atlas.storage);
        };
        AtlasCollection.prototype.tryRepack = function () {
            var list = this.list;
            for (var i = 0; i < list.length; i++) {
                list[i].calcHoldArea();
            }
            list.sort(this.atlasSortMethod);
            var N = 0;
            var _a = this.storage.options, atlasSize = _a.atlasSize, mergeThreshold = _a.mergeThreshold;
            while (list.length >= 1 && list[0].usedArea === 0) {
                this.removeAtlas(list[0]);
            }
            if (list.length >= 2) {
                if (list[0].usedArea + list[1].usedArea < atlasSize * atlasSize * mergeThreshold) {
                    N = 2;
                }
            }
            else if (list.length >= 3) {
                if (list[0].usedArea + list[1].usedArea + list[2].usedArea < 2 * atlasSize * atlasSize * mergeThreshold) {
                    N = 3;
                }
            }
            if (N == 0) {
                return;
            }
            for (var j = 0; j < N; j++) {
                for (var i = 0; i < list[j].addedElements.length; i++) {
                    var elem = list[j].addedElements[i];
                    if (elem.mem.cacheStatus <= pixi_blit.CacheStatus.Drawn) {
                        lightQueue.push(elem);
                    }
                }
            }
            lightQueue.sort(this.elemSortMethod);
            for (var j = 0; j + 1 < N; j++) {
                newAtlases.push(this.takeFromPool());
            }
            lightQueue.sort(this.elemSortMethod);
            var failFlag = false;
            for (var i = 0; i < lightQueue.length; i++) {
                var elem = lightQueue[i];
                for (var j = 0; j < newAtlases.length; j++) {
                    if (newAtlases[j].insert(elem)) {
                        break;
                    }
                }
                if (elem.newAtlas === null) {
                    failFlag = true;
                    break;
                }
            }
            if (failFlag) {
                list.length = list.length - newAtlases.length;
            }
            else {
                for (var j = N - 1; j >= 0; j--) {
                    this.removeAtlas(list[j]);
                }
            }
            lightQueue.length = 0;
            newAtlases.length = 0;
        };
        AtlasCollection.prototype.prerender = function () {
            this.storage.render();
            this.cleanup();
        };
        AtlasCollection.prototype.cleanup = function () {
            var drop = this.drop;
            for (var i = 0; i < drop.length; i++) {
                drop[i].destroy();
            }
            drop.length = 0;
        };
        return AtlasCollection;
    }());
    pixi_blit.AtlasCollection = AtlasCollection;
    var AtlasCollectionStorage = (function () {
        function AtlasCollectionStorage(type, options) {
            this.type = type;
            this.options = options;
            this.collection = null;
            this.options = Object.assign({
                dim1MaxSize: 512,
                dim2MinSize: 256,
                dim2MaxSize: 256,
                webglAntialias: true,
                canvasAntiConflation: false,
                atlasAllowInsert: false,
                atlasSize: 1024,
                atlasDivStep: 128,
                mergeThreshold: 0.8
            }, options);
        }
        AtlasCollectionStorage.prototype.bind = function (collection) {
            this.collection = collection;
        };
        AtlasCollectionStorage.prototype.render = function () {
            var _a = this.collection, list = _a.list, newSingles = _a.newSingles;
            for (var j = 0; j < list.length; j++) {
                this.renderSingle(list[j]);
            }
            for (var j = 0; j < newSingles.length; j++) {
                this.renderSingle(newSingles[j]);
            }
            newSingles.length = 0;
        };
        return AtlasCollectionStorage;
    }());
    pixi_blit.AtlasCollectionStorage = AtlasCollectionStorage;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    var AtlasNode = (function () {
        function AtlasNode() {
            this.childs = new Array();
            this.rect = new AtlasRectangle();
            this.data = null;
        }
        AtlasNode.prototype.insert = function (width, height, data) {
            if (this.childs.length > 0) {
                var newNode = this.childs[0].insert(width, height, data);
                if (newNode != null) {
                    return newNode;
                }
                return this.childs[1].insert(width, height, data);
            }
            else {
                var rect = this.rect;
                if (this.data != null)
                    return null;
                if (width > rect.width || height > rect.height)
                    return null;
                if (width == rect.width && height == rect.height) {
                    this.data = data;
                    return this;
                }
                this.childs.push(AtlasNode.allocate());
                this.childs.push(AtlasNode.allocate());
                var dw = rect.width - width;
                var dh = rect.height - height;
                if (dw > dh) {
                    this.childs[0].rect.set(rect.left, rect.top, width, rect.height);
                    this.childs[1].rect.set(rect.left + width, rect.top, rect.width - width, rect.height);
                }
                else {
                    this.childs[0].rect.set(rect.left, rect.top, rect.width, height);
                    this.childs[1].rect.set(rect.left, rect.top + height, rect.width, rect.height - height);
                }
                return this.childs[0].insert(width, height, data);
            }
        };
        AtlasNode.allocate = function () {
            return AtlasNode.pool.pop()
                || new AtlasNode();
        };
        AtlasNode.prototype.freeSubtree = function () {
            this.rect.set(0, 0, 1, 1);
            this.data = null;
            AtlasNode.pool.push(this);
            for (var i = 0; i < this.childs.length; i++) {
                this.childs[i].freeSubtree();
            }
            this.childs.length = 0;
        };
        AtlasNode.pool = [];
        return AtlasNode;
    }());
    pixi_blit.AtlasNode = AtlasNode;
    var AtlasRectangle = (function () {
        function AtlasRectangle(l, t, w, h) {
            if (l === void 0) { l = 0; }
            if (t === void 0) { t = 0; }
            if (w === void 0) { w = 0; }
            if (h === void 0) { h = 0; }
            this.left = l;
            this.top = t;
            this.width = w;
            this.height = h;
        }
        AtlasRectangle.prototype.set = function (l, t, w, h) {
            this.left = l;
            this.top = t;
            this.width = w;
            this.height = h;
        };
        return AtlasRectangle;
    }());
    pixi_blit.AtlasRectangle = AtlasRectangle;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    var CacheStatus;
    (function (CacheStatus) {
        CacheStatus[CacheStatus["Init"] = 0] = "Init";
        CacheStatus[CacheStatus["Drawn"] = 1] = "Drawn";
        CacheStatus[CacheStatus["Hanging"] = 2] = "Hanging";
        CacheStatus[CacheStatus["Disposed"] = 3] = "Disposed";
    })(CacheStatus = pixi_blit.CacheStatus || (pixi_blit.CacheStatus = {}));
    var uniqIdCounter = 0;
    function generateUid() {
        return ++uniqIdCounter;
    }
    pixi_blit.generateUid = generateUid;
    var MemoryComponent = (function () {
        function MemoryComponent() {
            this.touchedFrameNum = -1;
            this.touchedFrameCount = 0;
            this.touchedGc = 0;
            this.expire = -1;
            this.cacheStatus = CacheStatus.Init;
        }
        MemoryComponent.prototype.touchFrame = function (frame) {
            if (this.touchedFrameNum < frame) {
                this.touchedFrameNum = frame;
                this.touchedFrameCount = 0;
                if (this.cacheStatus === CacheStatus.Hanging) {
                    this.cacheStatus = CacheStatus.Drawn;
                }
            }
            this.touchedFrameCount++;
        };
        MemoryComponent.prototype.touchGc = function (gcNum, lastGcFrameNum) {
            var expire = this.expire;
            if (this.touchedFrameNum > lastGcFrameNum) {
                this.touchedGc = gcNum;
                if (this.cacheStatus === CacheStatus.Hanging) {
                    this.cacheStatus = CacheStatus.Drawn;
                }
            }
            else if (expire > 0 && this.touchedGc + expire < gcNum) {
                if (this.cacheStatus === CacheStatus.Drawn) {
                    this.cacheStatus = CacheStatus.Hanging;
                }
            }
        };
        return MemoryComponent;
    }());
    pixi_blit.MemoryComponent = MemoryComponent;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    var GeneratedCanvasGraphics = (function (_super) {
        __extends(GeneratedCanvasGraphics, _super);
        function GeneratedCanvasGraphics(model) {
            var _this = _super.call(this) || this;
            _this.model = model;
            return _this;
        }
        GeneratedCanvasGraphics.prototype._calculateBounds = function () {
            this._bounds.clear();
            this._bounds.addBoundsMatrix(this.model._genBounds, this.transform.worldTransform);
        };
        return GeneratedCanvasGraphics;
    }(PIXI.Container));
    pixi_blit.GeneratedCanvasGraphics = GeneratedCanvasGraphics;
    var RasterCache = (function () {
        function RasterCache(model, mat) {
            this.model = model;
            this.outerBounds = null;
            this.mem = new pixi_blit.MemoryComponent();
            this.type = pixi_blit.CacheType.Auto;
            this.graphicsNode = null;
            this.texture = new PIXI.Texture(PIXI.Texture.WHITE.baseTexture);
            this.addingToCollection = null;
            this.atlas = null;
            this.atlasNode = null;
            this.baseTexDirtyId = 0;
            this.atlasCanvasAntiConflation = false;
            this.newAtlas = null;
            this.newAtlasNode = null;
            this.oldAtlasSprite = null;
            this.uniqId = pixi_blit.generateUid();
            this.createdMat = mat.clone();
        }
        RasterCache.prototype.prepare = function () {
            var model = this.model;
            var vectorMode = model.vectorMode, generator = model.generator;
            if (this.type === pixi_blit.CacheType.Canvas2d
                && vectorMode === pixi_blit.VECTOR_MODE.GENERATED
                && generator.generateCanvas) {
                this.graphicsNode = generator.generateCanvas(model);
            }
            else {
                model.prepareVector();
                this.graphicsNode = new PIXI.Graphics(model.graphics.geometry);
            }
            this.graphicsNode.transform.setFromMatrix(this.createdMat);
            this.outerBounds = this.graphicsNode.getBounds();
        };
        Object.defineProperty(RasterCache.prototype, "area", {
            get: function () {
                return this.outerBounds.width * this.outerBounds.height;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RasterCache.prototype, "width", {
            get: function () {
                return this.outerBounds.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RasterCache.prototype, "height", {
            get: function () {
                return this.outerBounds.height;
            },
            enumerable: true,
            configurable: true
        });
        RasterCache.prototype.destroy = function () {
            this.atlas = null;
            this.atlasNode = null;
            this.texture = null;
            this.graphicsNode = null;
            this.mem.cacheStatus = pixi_blit.CacheStatus.Disposed;
        };
        return RasterCache;
    }());
    pixi_blit.RasterCache = RasterCache;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    var tempBounds = new PIXI.Bounds();
    var tempMat = new PIXI.Matrix();
    var tempRasters = [];
    var tempModels = [];
    var ShapeCache = (function () {
        function ShapeCache(renderer, root, options) {
            var _this = this;
            this.renderer = renderer;
            this.root = root;
            this.options = options;
            this.gcExpire = 100;
            this.models = {};
            this.rasters = {};
            this.runners = {
                gcTick: new PIXI.Runner('gcTick'),
                processQueue: new PIXI.Runner('processQueue'),
                prerender: new PIXI.Runner('prerender'),
                tryRepack: new PIXI.Runner('tryRepack'),
            };
            this.fillActiveElements = false;
            this.activeElements = [];
            this.atlases = [null, null, null, null, null];
            this.frameNum = 0;
            this.lastGcFrameNum = 0;
            this.gcNum = 0;
            this.tryRepack = false;
            this.maxBoundsForMips = 1024;
            this.defaultCacheType = pixi_blit.CacheType.WebGL;
            this.visitFrame = function (elem) {
                var model = elem.model;
                if (!_this.models[model.uniqId]) {
                    _this.models[model.uniqId] = model;
                    model.mem.expire = _this.gcExpire;
                }
                model.prepareBounds();
                var graphics = model.graphics;
                _this.activeElements.push(elem);
                if (graphics && _this.isEmpty(graphics)) {
                    elem.disable();
                    return;
                }
                model.mem.touchFrame(_this.frameNum);
                var cacheType = elem.preferredCache !== pixi_blit.CacheType.Auto ? elem.preferredCache
                    : model.preferredCache !== pixi_blit.CacheType.Auto ? model.preferredCache : _this.defaultCacheType;
                if (cacheType === pixi_blit.CacheType.WebGL
                    || cacheType === pixi_blit.CacheType.Canvas2d) {
                    var mip = _this.mipBehaviour(elem);
                    if (mip) {
                        if (mip.mem.cacheStatus === pixi_blit.CacheStatus.Init) {
                            mip.type = cacheType;
                            mip.prepare();
                            _this.atlases[mip.type].addToQueue(mip);
                        }
                        elem.enableRaster(mip);
                        mip.mem.touchFrame(_this.frameNum);
                        return;
                    }
                }
                model.prepareVector();
                elem.enableGraphics(model.graphics.geometry);
            };
            this.init();
        }
        ShapeCache.prototype.init = function () {
            var renderer = this.renderer;
            this.gcExpire = 100;
            var canvasOptions = Object.assign({
                size: 1024,
                textureCount: 30,
                canvasAntiConflation: false,
            }, this.options);
            var blitterOptions = Object.assign({
                size: 1024,
                textureCount: 30,
                webglAntialias: true,
                atlasAllowInsert: false,
            }, this.options);
            this.registerAtlas(pixi_blit.CacheType.Canvas2d, new pixi_blit.CanvasStorage(renderer, canvasOptions));
            this.registerAtlas(pixi_blit.CacheType.WebGL, new pixi_blit.BlitterStorage(renderer, blitterOptions));
        };
        ShapeCache.prototype.registerAtlas = function (type, storage) {
            var collection = new pixi_blit.AtlasCollection(storage);
            this.atlases[type] = collection;
            for (var key in this.runners) {
                this.runners[key].add(collection);
            }
            return collection;
        };
        ShapeCache.prototype.frameTick = function () {
            var _a = this, activeElements = _a.activeElements, runners = _a.runners;
            this.frameNum++;
            this.fillActiveElements = true;
            activeElements.length = 0;
            this.recFind(this.root, this.visitFrame);
            runners.processQueue.emit();
            if (this.tryRepack) {
                runners.tryRepack.emit();
                this.tryRepack = false;
            }
            this.runners.prerender.emit();
            for (var i = 0; i < activeElements.length; i++) {
                activeElements[i].prerender();
            }
            this.fillActiveElements = false;
        };
        ShapeCache.prototype.isEmpty = function (graphics) {
            graphics.finishPoly();
            return graphics.geometry.graphicsData.length === 0;
        };
        ShapeCache.prototype.mipBehaviour = function (elem) {
            var model = elem.model;
            var mat = tempMat.copyFrom(elem.transform.worldTransform);
            var elemBounds = tempBounds;
            var extraScaleX = elem.spriteGenerator ? Math.abs(elem.spriteGenerator.scaleX) : 1.0;
            var extraScaleY = elem.spriteGenerator ? Math.abs(elem.spriteGenerator.scaleY) : 1.0;
            mat.a = Math.sqrt(mat.a * mat.a + mat.b * mat.b) / extraScaleX;
            mat.d = Math.sqrt(mat.c * mat.c + mat.d * mat.d) / extraScaleY;
            mat.b = 0;
            mat.c = 0;
            mat.tx -= Math.round(mat.tx);
            mat.ty -= Math.round(mat.ty);
            model.copyBounds(elem.transform.worldTransform, elemBounds);
            if (elemBounds.maxX - elemBounds.minX > this.maxBoundsForMips
                || elemBounds.maxY - elemBounds.minY > this.maxBoundsForMips) {
                return null;
            }
            var matrixScale = Math.max(mat.a, mat.d);
            var mipLevel = Math.ceil(Math.log(matrixScale) / Math.LN2 - (1e-2));
            mipLevel = Math.min(Math.max(mipLevel, -pixi_blit.MIN_CACHE_LEVELS), pixi_blit.MAX_CACHE_LEVELS);
            var raster = model.mipCache[mipLevel];
            if (raster) {
                if (raster.mem.cacheStatus === pixi_blit.CacheStatus.Disposed) {
                    delete model.mipCache[mipLevel];
                }
                else {
                    return raster;
                }
            }
            mat.a = mat.d = Math.pow(2, mipLevel);
            mat.tx = mat.ty = 0;
            if (model.mipCache.length <= mipLevel) {
                model.mipCache.length = mipLevel + 1;
            }
            raster = model.mipCache[mipLevel] = new pixi_blit.RasterCache(model, mat);
            raster.mem.expire = this.gcExpire;
            this.rasters[raster.uniqId] = raster;
            return raster;
        };
        ShapeCache.prototype.recFind = function (elem, visit) {
            if (elem instanceof pixi_blit.VectorSprite) {
                visit(elem);
            }
            if (!elem.vectorChildren) {
                return;
            }
            var children = elem.children;
            for (var i = 0; i < children.length; i++) {
                this.recFind(children[i], visit);
            }
        };
        ShapeCache.prototype.gcTick = function () {
            this.gcNum++;
            for (var key in this.rasters) {
                var raster = this.rasters[key];
                var mem = raster.mem;
                if (mem.cacheStatus === pixi_blit.CacheStatus.Disposed) {
                    tempRasters.push(raster);
                }
                mem.touchGc(this.gcNum, this.lastGcFrameNum);
            }
            this.frameNum++;
            for (var key in this.models) {
                var model = this.models[key];
                var mem = model.mem;
                if (!model.isDisposable()) {
                    continue;
                }
                mem.touchGc(this.gcNum, this.lastGcFrameNum);
                if (mem.cacheStatus === pixi_blit.CacheStatus.Hanging) {
                    model.dispose();
                }
                tempModels.push(model);
            }
            for (var i = 0; i < tempRasters.length; i++) {
                delete this.rasters[tempRasters[i].uniqId];
            }
            tempRasters.length = 0;
            for (var i = 0; i < tempRasters.length; i++) {
                delete this.models[tempModels[i].uniqId];
            }
            tempModels.length = 0;
            this.lastGcFrameNum = this.frameNum;
            this.runners.gcTick.emit();
            this.tryRepack = true;
        };
        return ShapeCache;
    }());
    pixi_blit.ShapeCache = ShapeCache;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    pixi_blit.MIN_CACHE_LEVELS = 5;
    pixi_blit.MAX_CACHE_LEVELS = 3;
    var CANVAS_CONFLATION_MODE;
    (function (CANVAS_CONFLATION_MODE) {
        CANVAS_CONFLATION_MODE[CANVAS_CONFLATION_MODE["NO"] = 0] = "NO";
        CANVAS_CONFLATION_MODE[CANVAS_CONFLATION_MODE["YES"] = 1] = "YES";
        CANVAS_CONFLATION_MODE[CANVAS_CONFLATION_MODE["AUTO"] = 2] = "AUTO";
    })(CANVAS_CONFLATION_MODE = pixi_blit.CANVAS_CONFLATION_MODE || (pixi_blit.CANVAS_CONFLATION_MODE = {}));
    var VECTOR_MODE;
    (function (VECTOR_MODE) {
        VECTOR_MODE[VECTOR_MODE["INVALID"] = 0] = "INVALID";
        VECTOR_MODE[VECTOR_MODE["PROVIDED"] = 1] = "PROVIDED";
        VECTOR_MODE[VECTOR_MODE["GENERATED"] = 2] = "GENERATED";
    })(VECTOR_MODE = pixi_blit.VECTOR_MODE || (pixi_blit.VECTOR_MODE = {}));
    var VectorModel = (function () {
        function VectorModel(options) {
            this.mem = new pixi_blit.MemoryComponent();
            this.conflationMode = CANVAS_CONFLATION_MODE.AUTO;
            this.vectorMode = VECTOR_MODE.PROVIDED;
            this.dirtyBounds = false;
            this.dirtyGraphics = false;
            this.mipCache = [];
            this.instances = {};
            this.instanceCache = {};
            this._generator = null;
            this._graphics = null;
            this._genBounds = null;
            this.preferredCache = pixi_blit.CacheType.Auto;
            this.uniqId = pixi_blit.generateUid();
            options = options || {};
            if (options.generator) {
                this.generator = options.generator;
            }
            else if (options.graphics) {
                this.graphics = options.graphics;
            }
            this.params = options.params || {};
        }
        VectorModel.prototype.copyBounds = function (mat, out) {
            var _a = this._genBounds || this._graphics.geometry.bounds, minX = _a.minX, minY = _a.minY, maxX = _a.maxX, maxY = _a.maxY;
            out.clear();
            out.addFrameMatrix(mat, minX, maxX, minY, maxY);
        };
        Object.defineProperty(VectorModel.prototype, "generator", {
            get: function () {
                return this._generator;
            },
            set: function (value) {
                this._generator = value;
                this.vectorMode = VECTOR_MODE.GENERATED;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VectorModel.prototype, "graphics", {
            get: function () {
                return this._graphics;
            },
            set: function (value) {
                this._graphics = value;
                this.vectorMode = VECTOR_MODE.PROVIDED;
            },
            enumerable: true,
            configurable: true
        });
        VectorModel.prototype.prepareVector = function () {
            if (this.vectorMode === VECTOR_MODE.INVALID) {
                throw new Error('cant prepare empty VectorModel');
            }
            if (this.vectorMode === VECTOR_MODE.GENERATED) {
                this.mem.cacheStatus = pixi_blit.CacheStatus.Drawn;
                if (!this._graphics || this.dirtyGraphics) {
                    this.dirtyGraphics = false;
                    this._graphics = new PIXI.Graphics();
                    this.generator.generate(this);
                    this._graphics.finishPoly();
                }
            }
        };
        VectorModel.prototype.prepareBounds = function () {
            var _a = this, vectorMode = _a.vectorMode, _generator = _a._generator;
            if (vectorMode === VECTOR_MODE.GENERATED
                && (_generator.generateCanvas || _generator.generateBounds)) {
                if (!this._genBounds || this.dirtyBounds) {
                    this.dirtyBounds = false;
                    this._genBounds = new PIXI.Bounds();
                    _generator.generateBounds(this);
                }
                return;
            }
            this.prepareVector();
        };
        VectorModel.prototype.dispose = function (disposeRaster) {
            if (disposeRaster === void 0) { disposeRaster = false; }
            if (!this._graphics) {
                return;
            }
            if (this.vectorMode === VECTOR_MODE.GENERATED) {
                this._graphics.geometry.destroy();
                this._graphics.destroy();
                this._graphics = null;
            }
            if (disposeRaster) {
                this.disposeRaster();
            }
        };
        VectorModel.prototype.disposeRaster = function () {
            for (var i = 0; i < this.mipCache.length; i++) {
                var elem = this.mipCache[i];
                if (elem) {
                    this.mipCache[i] = null;
                    if (elem.mem.cacheStatus === pixi_blit.CacheStatus.Drawn) {
                        elem.mem.cacheStatus = pixi_blit.CacheStatus.Hanging;
                    }
                }
            }
        };
        VectorModel.prototype.reset = function () {
            this.dirtyBounds = true;
            this.dirtyGraphics = true;
            this.disposeRaster();
        };
        VectorModel.prototype.renderCanvas = function () {
        };
        VectorModel.prototype.isDisposable = function () {
            if (this.vectorMode !== VECTOR_MODE.GENERATED
                || !this._graphics) {
                return false;
            }
            var len = this._graphics.geometry.points.length;
            return len > 0;
        };
        return VectorModel;
    }());
    pixi_blit.VectorModel = VectorModel;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    var tempMat = new PIXI.Matrix();
    var VectorSprite = (function (_super) {
        __extends(VectorSprite, _super);
        function VectorSprite(model) {
            var _this = _super.call(this) || this;
            _this.model = model;
            _this.tint = 0xFFFFFF;
            _this.preferredCache = pixi_blit.CacheType.Auto;
            _this.activeCacheType = pixi_blit.CacheType.No_Cache;
            _this.activeRaster = null;
            _this.activeGraphics = null;
            _this.activeSprite = null;
            _this.rasterDirty = true;
            _this.spriteGenerator = null;
            return _this;
        }
        VectorSprite.prototype.enableRaster = function (raster) {
            if (this.activeRaster !== raster) {
                this.rasterDirty = true;
            }
            this.activeRaster = raster;
            this.activeCacheType = raster.type;
        };
        VectorSprite.prototype.enableGraphics = function (geom) {
            this.activeCacheType = pixi_blit.CacheType.No_Cache;
            if (this.activeGraphics && this.activeGraphics.geometry === geom) {
                return;
            }
            this.activeRaster = null;
            this.activeSprite = null;
            this.activeGraphics = new PIXI.Graphics(geom);
        };
        VectorSprite.prototype.disable = function () {
            this.activeCacheType = pixi_blit.CacheType.No_Cache;
            this.activeGraphics = null;
            this.activeRaster = null;
            this.activeSprite = null;
        };
        VectorSprite.prototype.updateTransform = function () {
            _super.prototype.updateTransform.call(this);
            if (this.activeSprite) {
                this.activeSprite.transform.updateTransform(this.transform);
                this.activeSprite.tint = this.tint;
                this.activeSprite.worldAlpha = this.worldAlpha;
            }
            if (this.activeGraphics) {
                this.activeGraphics.transform.updateTransform(this.transform);
                this.activeGraphics.tint = this.tint;
                this.activeGraphics.worldAlpha = this.worldAlpha;
            }
        };
        VectorSprite.prototype.prerender = function () {
            var activeRaster = this.activeRaster;
            if (activeRaster) {
                if (activeRaster.mem.cacheStatus > pixi_blit.CacheStatus.Drawn) {
                    throw Error("CacheStatus for active raster in vectorSprite is not Drawn!");
                }
                if (this.rasterDirty) {
                    if (!this.activeSprite) {
                        if (this.spriteGenerator) {
                            this.activeSprite = this.spriteGenerator.generateSprite();
                        }
                        else {
                            this.activeSprite = new PIXI.Sprite();
                        }
                    }
                    this.rasterDirty = false;
                    this.activeSprite.texture = activeRaster.texture;
                    tempMat.copyFrom(activeRaster.graphicsNode.transform.localTransform);
                    tempMat.tx = -activeRaster.outerBounds.x;
                    tempMat.ty = -activeRaster.outerBounds.y;
                    tempMat.invert();
                    this.activeSprite.transform.setFromMatrix(tempMat);
                }
            }
        };
        VectorSprite.prototype.containsPoint = function (point) {
            var _a = this, activeSprite = _a.activeSprite, activeGraphics = _a.activeGraphics;
            if (activeSprite && activeSprite.containsPoint) {
                return activeSprite.containsPoint(point);
            }
            else if (activeGraphics) {
                return activeGraphics.containsPoint(point);
            }
            return false;
        };
        VectorSprite.prototype.calculateBounds = function () {
            var _a = this, _bounds = _a._bounds, activeSprite = _a.activeSprite, activeGraphics = _a.activeGraphics;
            if (activeSprite) {
                activeSprite._bounds = this._bounds;
                activeSprite.calculateBounds();
            }
            else if (activeGraphics) {
                activeGraphics._bounds = this._bounds;
                activeGraphics.calculateBounds();
            }
        };
        VectorSprite.prototype._render = function (renderer) {
            var _a = this, activeRaster = _a.activeRaster, activeGraphics = _a.activeGraphics, activeSprite = _a.activeSprite;
            if (activeRaster) {
                activeSprite._render(renderer);
            }
            else if (activeGraphics) {
                activeGraphics._render(renderer);
            }
            else {
            }
        };
        return VectorSprite;
    }(PIXI.Container));
    pixi_blit.VectorSprite = VectorSprite;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    Object.assign(PIXI.DisplayObject.prototype, {
        vectorChildren: true,
    });
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    var updated = [];
    var bounds = new PIXI.Bounds();
    var CanvasAtlasResource = (function (_super) {
        __extends(CanvasAtlasResource, _super);
        function CanvasAtlasResource(storage) {
            var _this = _super.call(this, storage.options.width, storage.options.height) || this;
            _this.storage = storage;
            _this.defaultConflationMode = pixi_blit.CANVAS_CONFLATION_MODE.NO;
            _this.detectedConflationMode = pixi_blit.CANVAS_CONFLATION_MODE.NO;
            _this.mixedContent = false;
            return _this;
        }
        Object.defineProperty(CanvasAtlasResource.prototype, "source", {
            get: function () {
                return this.storage.canvas;
            },
            enumerable: true,
            configurable: true
        });
        CanvasAtlasResource.prototype.detectConflation = function () {
            var atlas = this.storage.atlas;
            var addedElements = atlas.addedElements;
            var hasYes = false, hasNo = false;
            for (var i = 0; i < addedElements.length; i++) {
                var elem = addedElements[i];
                var mode = elem.model.conflationMode !== pixi_blit.CANVAS_CONFLATION_MODE.AUTO ?
                    elem.model.conflationMode : this.defaultConflationMode;
                if (mode === pixi_blit.CANVAS_CONFLATION_MODE.NO) {
                    elem.atlasCanvasAntiConflation = false;
                    hasNo = true;
                }
                else {
                    elem.atlasCanvasAntiConflation = true;
                    hasYes = true;
                }
            }
            this.mixedContent = hasNo && hasYes;
            if (!this.mixedContent && hasYes) {
                this.detectedConflationMode = pixi_blit.CANVAS_CONFLATION_MODE.YES;
            }
            else {
                this.detectedConflationMode = pixi_blit.CANVAS_CONFLATION_MODE.NO;
            }
        };
        CanvasAtlasResource.prototype.fixImageData = function (imageData, fix) {
            if (fix === void 0) { fix = true; }
            if (!fix) {
                return imageData;
            }
            var data = imageData.data;
            var opaque = 0;
            var transparent = 0;
            for (var i = 3; i < data.length; i += 4) {
                if (data[i] > 0) {
                    if (data[i] == 255) {
                        opaque++;
                    }
                    else {
                        transparent++;
                    }
                }
            }
            if (opaque * 99 > transparent) {
                for (var i = 3; i < data.length; i += 4) {
                    if (data[i] > 153) {
                        data[i] = data[i] * 10 - 153 * 9;
                    }
                }
            }
            return imageData;
        };
        CanvasAtlasResource.prototype.upload = function (renderer, tex, glTex) {
            var _a = this, mixedContent = _a.mixedContent, detectedConflationMode = _a.detectedConflationMode;
            var _b = this.storage, atlas = _b.atlas, canvas = _b.canvas, context = _b.context;
            var addedElements = atlas.addedElements;
            var gl = renderer.gl;
            var w = canvas.width;
            var h = canvas.height;
            var dirtyId = glTex.dirtyId;
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            if (dirtyId < 0) {
                glTex.width = w;
                glTex.height = h;
                var initData = detectedConflationMode === pixi_blit.CANVAS_CONFLATION_MODE.NO
                    ? canvas : this.fixImageData(context.getImageData(0, 0, w, h));
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, initData);
                if (!mixedContent) {
                    return true;
                }
            }
            updated.length = 0;
            var area = 0;
            for (var i = 0; i < addedElements.length; i++) {
                var region = addedElements[i];
                if (region.baseTexDirtyId <= dirtyId) {
                    continue;
                }
                var rect = region.atlasNode.rect;
                updated.push(region);
                bounds.addFramePad(rect.left, rect.top, rect.left + rect.width, rect.top + rect.height, 0, 0);
                area += rect.width * rect.height;
            }
            var sq = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
            if (mixedContent || area * 2 < sq) {
                for (var i = 0; i < updated.length; i++) {
                    var rect = updated[i].atlasNode.rect;
                    gl.texSubImage2D(gl.TEXTURE_2D, 0, rect.left, rect.top, gl.RGBA, gl.UNSIGNED_BYTE, this.fixImageData(context.getImageData(rect.left, rect.top, rect.width, rect.height), updated[i].atlasCanvasAntiConflation));
                }
            }
            else {
                gl.texSubImage2D(gl.TEXTURE_2D, 0, bounds.minX, bounds.minY, gl.RGBA, gl.UNSIGNED_BYTE, this.fixImageData(context.getImageData(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY), detectedConflationMode === pixi_blit.CANVAS_CONFLATION_MODE.YES));
            }
            return true;
        };
        return CanvasAtlasResource;
    }(PIXI.resources.Resource));
    pixi_blit.CanvasAtlasResource = CanvasAtlasResource;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    var CanvasAtlasStorage = (function (_super) {
        __extends(CanvasAtlasStorage, _super);
        function CanvasAtlasStorage(options) {
            var _this = _super.call(this, pixi_blit.CacheType.Canvas2d, options) || this;
            _this.options = options;
            _this.canvasRt = null;
            _this.baseTex = null;
            _this.resource = null;
            _this.rootContainer = new PIXI.Container();
            _this.renderOnlyModified = true;
            _this.addedToHtml = false;
            _this.renderCanvas = function (renderer) {
                if (!_this.addedToHtml && CanvasAtlasStorage.CanvasHTMLContainer) {
                    _this.addedToHtml = true;
                    CanvasAtlasStorage.CanvasHTMLContainer.appendChild(_this.canvas);
                }
                var _a = _this, atlas = _a.atlas, renderOnlyModified = _a.renderOnlyModified, baseTex = _a.baseTex;
                var addedElements = atlas.addedElements;
                baseTex.update();
                for (var i = 0; i < addedElements.length; i++) {
                    var elem = addedElements[i];
                    var graphicsNode = elem.graphicsNode, mem = elem.mem;
                    if (renderOnlyModified && elem.atlas === atlas) {
                        continue;
                    }
                    elem.baseTexDirtyId = baseTex.dirtyId;
                    mem.cacheStatus = pixi_blit.CacheStatus.Drawn;
                    atlas.prepareRender(elem);
                    if (elem.oldAtlasSprite) {
                        elem.oldAtlasSprite.renderCanvas(renderer);
                        elem.oldAtlasSprite = null;
                    }
                    else {
                        graphicsNode.renderCanvas(renderer);
                    }
                }
            };
            _this.canvasRt = PIXI.RenderTexture.create(options);
            _this.rootContainer.renderCanvas = _this.renderCanvas;
            _this.resource = new pixi_blit.CanvasAtlasResource(_this);
            _this.baseTex = new PIXI.BaseTexture(_this.resource);
            return _this;
        }
        Object.defineProperty(CanvasAtlasStorage.prototype, "baseTexture", {
            get: function () {
                return this.baseTex;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CanvasAtlasStorage.prototype, "canvas", {
            get: function () {
                return this.canvasRt.baseTexture._canvasRenderTarget.canvas;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CanvasAtlasStorage.prototype, "context", {
            get: function () {
                return this.canvasRt.baseTexture._canvasRenderTarget.context;
            },
            enumerable: true,
            configurable: true
        });
        CanvasAtlasStorage.prototype.dispose = function () {
            if (this.addedToHtml) {
                CanvasAtlasStorage.CanvasHTMLContainer.removeChild(this.canvas);
            }
            this.baseTexture.dispose();
            var bt = this.canvasRt.baseTexture;
            if (bt._canvasRenderTarget) {
                bt._canvasRenderTarget.canvas.width = 0;
                bt._canvasRenderTarget.canvas.height = 0;
            }
        };
        CanvasAtlasStorage.CanvasHTMLContainer = null;
        return CanvasAtlasStorage;
    }(pixi_blit.AbstractAtlasStorage));
    pixi_blit.CanvasAtlasStorage = CanvasAtlasStorage;
    var CanvasStorage = (function (_super) {
        __extends(CanvasStorage, _super);
        function CanvasStorage(renderer, options) {
            var _this = _super.call(this, pixi_blit.CacheType.WebGL, options) || this;
            _this.renderer = renderer;
            _this.renderBuffer = null;
            _this.canvasRenderer = new PIXI.CanvasRenderer();
            return _this;
        }
        CanvasStorage.prototype.renderSingle = function (atlas) {
            var _a = this, canvasRenderer = _a.canvasRenderer, renderer = _a.renderer;
            if (!atlas.hasNew()) {
                return;
            }
            atlas.markClean();
            var storage = atlas.storage;
            canvasRenderer.render(storage.rootContainer, storage.canvasRt, false);
            renderer.texture.bind(storage.baseTex, 0);
        };
        CanvasStorage.prototype.createStorageBySize = function (size) {
            var atlas = new CanvasAtlasStorage({
                width: size.width,
                height: size.height
            });
            atlas.resource.defaultConflationMode = this.options.canvasAntiConflation ? pixi_blit.CANVAS_CONFLATION_MODE.YES : pixi_blit.CANVAS_CONFLATION_MODE.NO;
            return atlas;
        };
        return CanvasStorage;
    }(pixi_blit.AtlasCollectionStorage));
    pixi_blit.CanvasStorage = CanvasStorage;
})(pixi_blit || (pixi_blit = {}));
var pixi_blit;
(function (pixi_blit) {
    var WebGLAtlasStorage = (function (_super) {
        __extends(WebGLAtlasStorage, _super);
        function WebGLAtlasStorage(options) {
            var _this = _super.call(this, pixi_blit.CacheType.WebGL, options) || this;
            _this.options = options;
            _this.rt = null;
            _this.rootContainer = new PIXI.Container();
            _this.renderOnlyModified = false;
            _this.renderCopySeparate = false;
            _this.copies = [];
            _this.render = function (renderer) {
                var _a = _this, atlas = _a.atlas, renderOnlyModified = _a.renderOnlyModified, renderCopySeparate = _a.renderCopySeparate, copies = _a.copies;
                var addedElements = atlas.addedElements;
                for (var i = 0; i < addedElements.length; i++) {
                    var elem = addedElements[i];
                    var graphicsNode = elem.graphicsNode, mem = elem.mem;
                    if (renderOnlyModified && mem.cacheStatus !== pixi_blit.CacheStatus.Init) {
                        continue;
                    }
                    elem.oldAtlasSprite = null;
                    mem.cacheStatus = pixi_blit.CacheStatus.Drawn;
                    _this.atlas.prepareRender(elem);
                    if (elem.oldAtlasSprite) {
                        if (renderCopySeparate) {
                            copies.push(elem.oldAtlasSprite);
                        }
                        else {
                            elem.oldAtlasSprite.render(renderer);
                        }
                        elem.oldAtlasSprite = null;
                    }
                    else {
                        graphicsNode.render(renderer);
                    }
                }
            };
            _this.rt = PIXI.RenderTexture.create(options);
            _this.rootContainer.render = _this.render;
            return _this;
        }
        Object.defineProperty(WebGLAtlasStorage.prototype, "baseTexture", {
            get: function () {
                return this.rt.baseTexture;
            },
            enumerable: true,
            configurable: true
        });
        WebGLAtlasStorage.prototype.renderCopies = function (renderer) {
            var copies = this.copies;
            for (var i = 0; i < copies.length; i++) {
                copies[i].render(renderer);
            }
            copies.length = 0;
        };
        WebGLAtlasStorage.prototype.dispose = function () {
            this.rt.baseTexture.dispose();
        };
        return WebGLAtlasStorage;
    }(pixi_blit.AbstractAtlasStorage));
    pixi_blit.WebGLAtlasStorage = WebGLAtlasStorage;
    var BlitterStorage = (function (_super) {
        __extends(BlitterStorage, _super);
        function BlitterStorage(renderer, options) {
            var _this = _super.call(this, pixi_blit.CacheType.WebGL, options) || this;
            _this.renderer = renderer;
            _this.renderBuffer = null;
            var textureOptions = {
                width: options.atlasSize,
                height: options.atlasSize,
            };
            _this.renderBuffer = pixi_blit.RenderBuffer.create(renderer, textureOptions);
            return _this;
        }
        BlitterStorage.prototype.renderSingle = function (atlas) {
            var _a = this, renderBuffer = _a.renderBuffer, renderer = _a.renderer;
            if (!atlas.hasNew()) {
                return;
            }
            atlas.markClean();
            var storage = atlas.storage;
            storage.renderCopySeparate = true;
            renderBuffer.renderAndBlit(storage.rootContainer, storage.rt, true);
            if (storage.copies.length > 0) {
                renderer.renderTexture.bind(storage.rt);
                renderer.batch.flush();
                storage.renderCopies(renderer);
                renderer.batch.flush();
            }
        };
        BlitterStorage.prototype.createStorageBySize = function (size) {
            return new WebGLAtlasStorage({
                width: size.width,
                height: size.height
            });
        };
        return BlitterStorage;
    }(pixi_blit.AtlasCollectionStorage));
    pixi_blit.BlitterStorage = BlitterStorage;
})(pixi_blit || (pixi_blit = {}));
//# sourceMappingURL=pixi-blit.js.map