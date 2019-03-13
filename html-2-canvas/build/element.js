"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _merge = require("./utils/merge");

var _merge2 = _interopRequireDefault(_merge);

var _line = require("./line");

var _line2 = _interopRequireDefault(_line);

var _unitSize = require("./unit-size");

var _unitSize2 = _interopRequireDefault(_unitSize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createBox() {
  return {
    top: _unitSize2.default.zero(),
    bottom: _unitSize2.default.zero(),
    left: _unitSize2.default.zero(),
    right: _unitSize2.default.zero()
  };
}

class ElementRenderer {
  constructor({ element, parent, renderer }) {
    this.children = [];
    this.element = element;
    this.parent = parent;
    this.renderer = renderer;
    this.format = {
      padding: createBox(),
      margin: createBox()
    };
    if (this.parent) {
      if (this.parent.format) {
        this.format = Object.keys(this.parent.format).reduce((s, key) => {
          for (let x in this.renderer.inheritableCSS) {
            if (key.indexOf(this.renderer.inheritableCSS[x]) > -1) {
              if (!s[key]) {
                s[key] = this.parent.format[key];
              } else if (typeof s[key] === "object" && typeof this.parent.format[key] === "object" && !(this.parent.format[key] instanceof _unitSize2.default) && !(s[key] instanceof _unitSize2.default)) {
                s[key] = (0, _merge2.default)({}, s[key], this.parent.format[key]);
              } else {
                s[key] = this.parent.format[key];
              }
            }
          }
          return s;
        }, this.format);
        // console.log("format", this.format);
      }
    }
    this.format = (0, _merge2.default)(this.format, element.format);
  }
  async process(yPos = 0) {
    if (this.renderer.doNotRender.indexOf(this.element.name) > -1) {
      this.bounding = Object.assign(createBox(), {
        topInner: _unitSize2.default.zero(),
        leftInner: _unitSize2.default.zero(),
        widthInner: _unitSize2.default.zero(),
        height: _unitSize2.default.zero()
      });
      return 0;
    }
    const parentWidthInner = this.parent.bounding.widthInner;
    // console.log("this.format.width", this.format.width);
    const width = this.format.width ? new _unitSize2.default(this.format.width.valueOf(this.element, parentWidthInner)) : // convert width to px if needed
    parentWidthInner.subtract(this.format.margin.left.valueOf(this.element, parentWidthInner), this.format.margin.right.valueOf(this.element, parentWidthInner));
    const top = this.format.margin.top.add(yPos);
    yPos += this.format.margin.top.valueOf(this.element);
    const left = this.parent.bounding.leftInner.add(this.format.margin.left.valueOf(this.element, parentWidthInner));
    this.bounding = {
      top,
      left,
      width,
      topInner: top.add(this.format.padding.top.valueOf(this.element)),
      leftInner: left.add(this.format.padding.left.valueOf(this.element)),
      widthInner: width.subtract(this.format.padding.left.valueOf(this.element), this.format.padding.right.valueOf(this.element)),
      height: _unitSize2.default.zero()
    };
    if (this.element.children) {
      let textElements = [];
      for (let x in this.element.children) {
        const child = this.element.children[x];
        if (this.renderer.lineTags.indexOf(child.name) > -1 || child.type === "text") {
          textElements.push(child);
        } else {
          if (textElements.length > 0) {
            const lr1 = new _line2.default({
              elements: textElements,
              parent: this,
              renderer: this.renderer });
            yPos += await lr1.process(yPos);
            if (lr1.bounding.height > 0) {
              this.children.push(lr1);
            }
            textElements = [];
          }
          const el = new ElementRenderer({
            element: child,
            parent: this,
            renderer: this.renderer
          });
          yPos = await el.process(yPos);
          if (el.bounding.height > 0) {
            this.children.push(el);
          }
        }
      }
      if (textElements.length > 0) {
        const lr2 = new _line2.default({
          elements: textElements,
          parent: this,
          renderer: this.renderer });
        yPos += await lr2.process(yPos);
        if (lr2.bounding.height > 0) {
          this.children.push(lr2);
        }
      }
    }
    this.bounding.height = this.bounding.height.add(yPos, this.format.padding.bottom.valueOf(this.element));
    const result = this.bounding.height + this.format.margin.bottom.valueOf(this.element);
    return result;
  }
  async render(cx2d) {
    cx2d.save();
    if (this.format.background) {
      if (this.format.background.color) {
        cx2d.beginPath();
        cx2d.rect(this.bounding.left.valueOf(), this.bounding.top.valueOf(), this.bounding.width.valueOf(), this.bounding.height.valueOf() - this.bounding.top.valueOf());
        cx2d.fillStyle = this.format.background.color;
        cx2d.fill();
      }
    }
    cx2d.restore();
    for (let x in this.children) {
      const element = this.children[x];
      await element.render(cx2d);
    }
  }
}
exports.default = ElementRenderer;
//# sourceMappingURL=element.js.map
