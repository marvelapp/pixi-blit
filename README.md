# pixi-blit
PixiJS v5 advanced buffer for caching and antialiasing.

### WebGL1

It works with WebGL1 despite the fact that there's no MSAA framebuffers API in WebGL1.

However, you have to take extra steps to ensure that resources for AA also live in temporary context of your buffer.

### Webpack, browserify, Angular

Its a bit tricky. You have to put this thing in one of your root files that are loaded before everything else!

Make sure that you dont have two copies of pixiJS: one from html, one from browserify, it happens. 

```
import * as PIXI from "pixi.js';
window.PIXI = PIXI;
import "pixi-blit"; //or require("pixi-blit")
```
