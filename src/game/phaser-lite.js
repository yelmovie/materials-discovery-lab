// 앱용 Phaser 묶음(2026-11-21, D10): phaser/src/phaser-core.js를 ESM으로 옮기고(소리 묶음·global 대입 제외) 지도·실험 화면이 쓰는 도형(원·타원)·Zone·Math.Clamp만 더했다.
// 등록만 하고 내보내지 않는 CommonJS 파일(팩토리·생성기)은 값 없이 실행만 한다(개발 서버의 사전 묶음이 이런 파일에는 기본값을 만들지 않는다).
// vite.config.ts가 'phaser'를 이 파일로 바꾸고, 빌드 표식으로 WebGL 코드를 뺀다(CANVAS 렌더 전용). 앱 코드의 import 'phaser'와 타입은 그대로다.
import 'phaser/src/polyfills/requestVideoFrame.js';
import CONST from 'phaser/src/const.js';
import Extend from 'phaser/src/utils/object/Extend.js';
import Clamp from 'phaser/src/math/Clamp.js';
import Arc from 'phaser/src/gameobjects/shape/arc/Arc.js';
import Ellipse from 'phaser/src/gameobjects/shape/ellipse/Ellipse.js';
import Zone from 'phaser/src/gameobjects/zone/Zone.js';
import m0 from 'phaser/src/animations/index.js';
import m1 from 'phaser/src/renderer/BlendModes.js';
import m2 from 'phaser/src/cache/index.js';
import m3 from 'phaser/src/cameras/2d/index.js';
import m4 from 'phaser/src/core/index.js';
import m5 from 'phaser/src/utils/Class.js';
import m6 from 'phaser/src/data/index.js';
import m7 from 'phaser/src/display/mask/index.js';
import m8 from 'phaser/src/dom/index.js';
import m9 from 'phaser/src/events/index.js';
import m10 from 'phaser/src/fx/index.js';
import m11 from 'phaser/src/core/Game.js';
import m12 from 'phaser/src/gameobjects/DisplayList.js';
import m13 from 'phaser/src/gameobjects/GameObjectCreator.js';
import m14 from 'phaser/src/gameobjects/GameObjectFactory.js';
import m15 from 'phaser/src/gameobjects/UpdateList.js';
import m16 from 'phaser/src/gameobjects/components/index.js';
import m17 from 'phaser/src/gameobjects/BuildGameObject.js';
import m18 from 'phaser/src/gameobjects/BuildGameObjectAnimation.js';
import m19 from 'phaser/src/gameobjects/GameObject.js';
import m20 from 'phaser/src/gameobjects/graphics/Graphics.js';
import m21 from 'phaser/src/gameobjects/image/Image.js';
import m22 from 'phaser/src/gameobjects/layer/Layer.js';
import m23 from 'phaser/src/gameobjects/sprite/Sprite.js';
import m24 from 'phaser/src/gameobjects/text/Text.js';
import 'phaser/src/gameobjects/graphics/GraphicsFactory.js';
const m25 = {};
import 'phaser/src/gameobjects/image/ImageFactory.js';
const m26 = {};
import 'phaser/src/gameobjects/layer/LayerFactory.js';
const m27 = {};
import 'phaser/src/gameobjects/sprite/SpriteFactory.js';
const m28 = {};
import 'phaser/src/gameobjects/text/TextFactory.js';
const m29 = {};
import 'phaser/src/gameobjects/graphics/GraphicsCreator.js';
const m30 = {};
import 'phaser/src/gameobjects/image/ImageCreator.js';
const m31 = {};
import 'phaser/src/gameobjects/layer/LayerCreator.js';
const m32 = {};
import 'phaser/src/gameobjects/sprite/SpriteCreator.js';
const m33 = {};
import 'phaser/src/gameobjects/text/TextCreator.js';
const m34 = {};
import m35 from 'phaser/src/input/index.js';
import m36 from 'phaser/src/loader/filetypes/AnimationJSONFile.js';
import m37 from 'phaser/src/loader/filetypes/AtlasJSONFile.js';
import m38 from 'phaser/src/loader/filetypes/AudioFile.js';
import 'phaser/src/loader/filetypes/AudioSpriteFile.js';
const m39 = {};
import m40 from 'phaser/src/loader/filetypes/HTML5AudioFile.js';
import m41 from 'phaser/src/loader/filetypes/ImageFile.js';
import m42 from 'phaser/src/loader/filetypes/JSONFile.js';
import m43 from 'phaser/src/loader/filetypes/MultiAtlasFile.js';
import m44 from 'phaser/src/loader/filetypes/PluginFile.js';
import m45 from 'phaser/src/loader/filetypes/ScriptFile.js';
import m46 from 'phaser/src/loader/filetypes/SpriteSheetFile.js';
import m47 from 'phaser/src/loader/filetypes/TextFile.js';
import m48 from 'phaser/src/loader/filetypes/XMLFile.js';
import m49 from 'phaser/src/loader/File.js';
import m50 from 'phaser/src/loader/FileTypesManager.js';
import m51 from 'phaser/src/loader/GetURL.js';
import m52 from 'phaser/src/loader/LoaderPlugin.js';
import m53 from 'phaser/src/loader/MergeXHRSettings.js';
import m54 from 'phaser/src/loader/MultiFile.js';
import m55 from 'phaser/src/loader/XHRLoader.js';
import m56 from 'phaser/src/loader/XHRSettings.js';
import m57 from 'phaser/src/math/Between.js';
import m58 from 'phaser/src/math/DegToRad.js';
import m59 from 'phaser/src/math/FloatBetween.js';
import m60 from 'phaser/src/math/RadToDeg.js';
import m61 from 'phaser/src/math/Vector2.js';
import m62 from 'phaser/src/plugins/index.js';
import m63 from 'phaser/src/renderer/index.js';
import m64 from 'phaser/src/scale/index.js';
import m65 from 'phaser/src/renderer/ScaleModes.js';
import m66 from 'phaser/src/scene/Scene.js';
import m67 from 'phaser/src/scene/index.js';
import m68 from 'phaser/src/structs/index.js';
import m69 from 'phaser/src/textures/index.js';
import m70 from 'phaser/src/time/index.js';
import m71 from 'phaser/src/tweens/index.js';
// 팩토리 등록(add.circle·add.ellipse·add.zone)
import 'phaser/src/gameobjects/shape/arc/ArcFactory.js';
import 'phaser/src/gameobjects/shape/ellipse/EllipseFactory.js';
import 'phaser/src/gameobjects/zone/ZoneFactory.js';
var Phaser = {

    Animations: m0,
    BlendModes: m1,
    Cache: m2,
    Cameras: { Scene2D: m3 },
    Core: m4,
    Class: m5,
    Data: m6,
    Display: { Masks: m7 },
    DOM: m8,
    Events: m9,
    FX: m10,
    Game: m11,
    GameObjects: {
        DisplayList: m12,
        GameObjectCreator: m13,
        GameObjectFactory: m14,
        UpdateList: m15,
        Components: m16,
        BuildGameObject: m17,
        BuildGameObjectAnimation: m18,
        GameObject: m19,
        Graphics: m20,
        Image: m21,
        Layer: m22,
        Sprite: m23,
        Text: m24,
        Factories: {
            Graphics: m25,
            Image: m26,
            Layer: m27,
            Sprite: m28,
            Text: m29
        },
        Creators: {
            Graphics: m30,
            Image: m31,
            Layer: m32,
            Sprite: m33,
            Text: m34
        }
    },
    Input: m35,
    Loader: {
        FileTypes: {
            AnimationJSONFile: m36,
            AtlasJSONFile: m37,
            AudioFile: m38,
            AudioSpriteFile: m39,
            HTML5AudioFile: m40,
            ImageFile: m41,
            JSONFile: m42,
            MultiAtlasFile: m43,
            PluginFile: m44,
            ScriptFile: m45,
            SpriteSheetFile: m46,
            TextFile: m47,
            XMLFile: m48
        },
        File: m49,
        FileTypesManager: m50,
        GetURL: m51,
        LoaderPlugin: m52,
        MergeXHRSettings: m53,
        MultiFile: m54,
        XHRLoader: m55,
        XHRSettings: m56
    },
    Math: {
        Between: m57,
        DegToRad: m58,
        FloatBetween: m59,
        RadToDeg: m60,
        Vector2: m61
    },
    Plugins: m62,
    Renderer: m63,
    Scale: m64,
    ScaleModes: m65,
    Scene: m66,
    Scenes: m67,
    Structs: m68,
    Textures: m69,
    Time: m70,
    Tweens: m71
};
Phaser.Math.Clamp = Clamp;
Phaser.GameObjects.Arc = Arc;
Phaser.GameObjects.Ellipse = Ellipse;
Phaser.GameObjects.Zone = Zone;
Phaser = Extend(false, Phaser, CONST);
export default Phaser;
