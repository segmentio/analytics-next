/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 8971:
/*!**********************************************************!*\
  !*** ../../node_modules/@segment/facade/dist/address.js ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var obj_case_1 = __importDefault(__webpack_require__(/*! obj-case */ 8578));
function trait(a, b) {
    return function () {
        var traits = this.traits();
        var props = this.properties ? this.properties() : {};
        return (obj_case_1.default(traits, "address." + a) ||
            obj_case_1.default(traits, a) ||
            (b ? obj_case_1.default(traits, "address." + b) : null) ||
            (b ? obj_case_1.default(traits, b) : null) ||
            obj_case_1.default(props, "address." + a) ||
            obj_case_1.default(props, a) ||
            (b ? obj_case_1.default(props, "address." + b) : null) ||
            (b ? obj_case_1.default(props, b) : null));
    };
}
function default_1(proto) {
    proto.zip = trait("postalCode", "zip");
    proto.country = trait("country");
    proto.street = trait("street");
    proto.state = trait("state");
    proto.city = trait("city");
    proto.region = trait("region");
}
exports["default"] = default_1;
//# sourceMappingURL=address.js.map

/***/ }),

/***/ 7663:
/*!********************************************************!*\
  !*** ../../node_modules/@segment/facade/dist/alias.js ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Alias = void 0;
var inherits_1 = __importDefault(__webpack_require__(/*! inherits */ 5615));
var facade_1 = __webpack_require__(/*! ./facade */ 2265);
function Alias(dictionary, opts) {
    facade_1.Facade.call(this, dictionary, opts);
}
exports.Alias = Alias;
inherits_1.default(Alias, facade_1.Facade);
Alias.prototype.action = function () {
    return "alias";
};
Alias.prototype.type = Alias.prototype.action;
Alias.prototype.previousId = function () {
    return this.field("previousId") || this.field("from");
};
Alias.prototype.from = Alias.prototype.previousId;
Alias.prototype.userId = function () {
    return this.field("userId") || this.field("to");
};
Alias.prototype.to = Alias.prototype.userId;
//# sourceMappingURL=alias.js.map

/***/ }),

/***/ 3194:
/*!********************************************************!*\
  !*** ../../node_modules/@segment/facade/dist/clone.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.clone = void 0;
function clone(properties) {
    if (Object.prototype.toString.call(properties) === '[object Object]') {
        var temp = {};
        for (var key in properties) {
            temp[key] = clone(properties[key]);
        }
        return temp;
    }
    else if (Array.isArray(properties)) {
        return properties.map(clone);
    }
    else {
        return properties;
    }
}
exports.clone = clone;
//# sourceMappingURL=clone.js.map

/***/ }),

/***/ 7532:
/*!*********************************************************!*\
  !*** ../../node_modules/@segment/facade/dist/delete.js ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Delete = void 0;
var inherits_1 = __importDefault(__webpack_require__(/*! inherits */ 5615));
var facade_1 = __webpack_require__(/*! ./facade */ 2265);
function Delete(dictionary, opts) {
    facade_1.Facade.call(this, dictionary, opts);
}
exports.Delete = Delete;
inherits_1.default(Delete, facade_1.Facade);
Delete.prototype.type = function () {
    return "delete";
};
//# sourceMappingURL=delete.js.map

/***/ }),

/***/ 2265:
/*!*********************************************************!*\
  !*** ../../node_modules/@segment/facade/dist/facade.js ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Facade = void 0;
var address_1 = __importDefault(__webpack_require__(/*! ./address */ 8971));
var clone_1 = __webpack_require__(/*! ./clone */ 3194);
var is_enabled_1 = __importDefault(__webpack_require__(/*! ./is-enabled */ 7751));
var new_date_1 = __importDefault(__webpack_require__(/*! new-date */ 7639));
var obj_case_1 = __importDefault(__webpack_require__(/*! obj-case */ 8578));
var isodate_traverse_1 = __importDefault(__webpack_require__(/*! @segment/isodate-traverse */ 518));
function Facade(obj, opts) {
    opts = opts || {};
    this.raw = clone_1.clone(obj);
    if (!("clone" in opts))
        opts.clone = true;
    if (opts.clone)
        obj = clone_1.clone(obj);
    if (!("traverse" in opts))
        opts.traverse = true;
    if (!("timestamp" in obj))
        obj.timestamp = new Date();
    else
        obj.timestamp = new_date_1.default(obj.timestamp);
    if (opts.traverse)
        isodate_traverse_1.default(obj);
    this.opts = opts;
    this.obj = obj;
}
exports.Facade = Facade;
var f = Facade.prototype;
f.proxy = function (field) {
    var fields = field.split(".");
    field = fields.shift();
    var obj = this[field] || this.field(field);
    if (!obj)
        return obj;
    if (typeof obj === "function")
        obj = obj.call(this) || {};
    if (fields.length === 0)
        return this.opts.clone ? transform(obj) : obj;
    obj = obj_case_1.default(obj, fields.join("."));
    return this.opts.clone ? transform(obj) : obj;
};
f.field = function (field) {
    var obj = this.obj[field];
    return this.opts.clone ? transform(obj) : obj;
};
Facade.proxy = function (field) {
    return function () {
        return this.proxy(field);
    };
};
Facade.field = function (field) {
    return function () {
        return this.field(field);
    };
};
Facade.multi = function (path) {
    return function () {
        var multi = this.proxy(path + "s");
        if (Array.isArray(multi))
            return multi;
        var one = this.proxy(path);
        if (one)
            one = [this.opts.clone ? clone_1.clone(one) : one];
        return one || [];
    };
};
Facade.one = function (path) {
    return function () {
        var one = this.proxy(path);
        if (one)
            return one;
        var multi = this.proxy(path + "s");
        if (Array.isArray(multi))
            return multi[0];
    };
};
f.json = function () {
    var ret = this.opts.clone ? clone_1.clone(this.obj) : this.obj;
    if (this.type)
        ret.type = this.type();
    return ret;
};
f.rawEvent = function () {
    return this.raw;
};
f.options = function (integration) {
    var obj = this.obj.options || this.obj.context || {};
    var options = this.opts.clone ? clone_1.clone(obj) : obj;
    if (!integration)
        return options;
    if (!this.enabled(integration))
        return;
    var integrations = this.integrations();
    var value = integrations[integration] || obj_case_1.default(integrations, integration);
    if (typeof value !== "object")
        value = obj_case_1.default(this.options(), integration);
    return typeof value === "object" ? value : {};
};
f.context = f.options;
f.enabled = function (integration) {
    var allEnabled = this.proxy("options.providers.all");
    if (typeof allEnabled !== "boolean")
        allEnabled = this.proxy("options.all");
    if (typeof allEnabled !== "boolean")
        allEnabled = this.proxy("integrations.all");
    if (typeof allEnabled !== "boolean")
        allEnabled = true;
    var enabled = allEnabled && is_enabled_1.default(integration);
    var options = this.integrations();
    if (options.providers && options.providers.hasOwnProperty(integration)) {
        enabled = options.providers[integration];
    }
    if (options.hasOwnProperty(integration)) {
        var settings = options[integration];
        if (typeof settings === "boolean") {
            enabled = settings;
        }
        else {
            enabled = true;
        }
    }
    return !!enabled;
};
f.integrations = function () {
    return (this.obj.integrations || this.proxy("options.providers") || this.options());
};
f.active = function () {
    var active = this.proxy("options.active");
    if (active === null || active === undefined)
        active = true;
    return active;
};
f.anonymousId = function () {
    return this.field("anonymousId") || this.field("sessionId");
};
f.sessionId = f.anonymousId;
f.groupId = Facade.proxy("options.groupId");
f.traits = function (aliases) {
    var ret = this.proxy("options.traits") || {};
    var id = this.userId();
    aliases = aliases || {};
    if (id)
        ret.id = id;
    for (var alias in aliases) {
        var value = this[alias] == null
            ? this.proxy("options.traits." + alias)
            : this[alias]();
        if (value == null)
            continue;
        ret[aliases[alias]] = value;
        delete ret[alias];
    }
    return ret;
};
f.library = function () {
    var library = this.proxy("options.library");
    if (!library)
        return { name: "unknown", version: null };
    if (typeof library === "string")
        return { name: library, version: null };
    return library;
};
f.device = function () {
    var device = this.proxy("context.device");
    if (typeof device !== "object" || device === null) {
        device = {};
    }
    var library = this.library().name;
    if (device.type)
        return device;
    if (library.indexOf("ios") > -1)
        device.type = "ios";
    if (library.indexOf("android") > -1)
        device.type = "android";
    return device;
};
f.userAgent = Facade.proxy("context.userAgent");
f.timezone = Facade.proxy("context.timezone");
f.timestamp = Facade.field("timestamp");
f.channel = Facade.field("channel");
f.ip = Facade.proxy("context.ip");
f.userId = Facade.field("userId");
address_1.default(f);
function transform(obj) {
    return clone_1.clone(obj);
}
//# sourceMappingURL=facade.js.map

/***/ }),

/***/ 7748:
/*!********************************************************!*\
  !*** ../../node_modules/@segment/facade/dist/group.js ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Group = void 0;
var inherits_1 = __importDefault(__webpack_require__(/*! inherits */ 5615));
var is_email_1 = __importDefault(__webpack_require__(/*! ./is-email */ 6362));
var new_date_1 = __importDefault(__webpack_require__(/*! new-date */ 7639));
var facade_1 = __webpack_require__(/*! ./facade */ 2265);
function Group(dictionary, opts) {
    facade_1.Facade.call(this, dictionary, opts);
}
exports.Group = Group;
inherits_1.default(Group, facade_1.Facade);
var g = Group.prototype;
g.action = function () {
    return "group";
};
g.type = g.action;
g.groupId = facade_1.Facade.field("groupId");
g.created = function () {
    var created = this.proxy("traits.createdAt") ||
        this.proxy("traits.created") ||
        this.proxy("properties.createdAt") ||
        this.proxy("properties.created");
    if (created)
        return new_date_1.default(created);
};
g.email = function () {
    var email = this.proxy("traits.email");
    if (email)
        return email;
    var groupId = this.groupId();
    if (is_email_1.default(groupId))
        return groupId;
};
g.traits = function (aliases) {
    var ret = this.properties();
    var id = this.groupId();
    aliases = aliases || {};
    if (id)
        ret.id = id;
    for (var alias in aliases) {
        var value = this[alias] == null ? this.proxy("traits." + alias) : this[alias]();
        if (value == null)
            continue;
        ret[aliases[alias]] = value;
        delete ret[alias];
    }
    return ret;
};
g.name = facade_1.Facade.proxy("traits.name");
g.industry = facade_1.Facade.proxy("traits.industry");
g.employees = facade_1.Facade.proxy("traits.employees");
g.properties = function () {
    return this.field("traits") || this.field("properties") || {};
};
//# sourceMappingURL=group.js.map

/***/ }),

/***/ 5543:
/*!***********************************************************!*\
  !*** ../../node_modules/@segment/facade/dist/identify.js ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Identify = void 0;
var facade_1 = __webpack_require__(/*! ./facade */ 2265);
var obj_case_1 = __importDefault(__webpack_require__(/*! obj-case */ 8578));
var inherits_1 = __importDefault(__webpack_require__(/*! inherits */ 5615));
var is_email_1 = __importDefault(__webpack_require__(/*! ./is-email */ 6362));
var new_date_1 = __importDefault(__webpack_require__(/*! new-date */ 7639));
var trim = function (str) { return str.trim(); };
function Identify(dictionary, opts) {
    facade_1.Facade.call(this, dictionary, opts);
}
exports.Identify = Identify;
inherits_1.default(Identify, facade_1.Facade);
var i = Identify.prototype;
i.action = function () {
    return "identify";
};
i.type = i.action;
i.traits = function (aliases) {
    var ret = this.field("traits") || {};
    var id = this.userId();
    aliases = aliases || {};
    if (id)
        ret.id = id;
    for (var alias in aliases) {
        var value = this[alias] == null ? this.proxy("traits." + alias) : this[alias]();
        if (value == null)
            continue;
        ret[aliases[alias]] = value;
        if (alias !== aliases[alias])
            delete ret[alias];
    }
    return ret;
};
i.email = function () {
    var email = this.proxy("traits.email");
    if (email)
        return email;
    var userId = this.userId();
    if (is_email_1.default(userId))
        return userId;
};
i.created = function () {
    var created = this.proxy("traits.created") || this.proxy("traits.createdAt");
    if (created)
        return new_date_1.default(created);
};
i.companyCreated = function () {
    var created = this.proxy("traits.company.created") ||
        this.proxy("traits.company.createdAt");
    if (created) {
        return new_date_1.default(created);
    }
};
i.companyName = function () {
    return this.proxy("traits.company.name");
};
i.name = function () {
    var name = this.proxy("traits.name");
    if (typeof name === "string") {
        return trim(name);
    }
    var firstName = this.firstName();
    var lastName = this.lastName();
    if (firstName && lastName) {
        return trim(firstName + " " + lastName);
    }
};
i.firstName = function () {
    var firstName = this.proxy("traits.firstName");
    if (typeof firstName === "string") {
        return trim(firstName);
    }
    var name = this.proxy("traits.name");
    if (typeof name === "string") {
        return trim(name).split(" ")[0];
    }
};
i.lastName = function () {
    var lastName = this.proxy("traits.lastName");
    if (typeof lastName === "string") {
        return trim(lastName);
    }
    var name = this.proxy("traits.name");
    if (typeof name !== "string") {
        return;
    }
    var space = trim(name).indexOf(" ");
    if (space === -1) {
        return;
    }
    return trim(name.substr(space + 1));
};
i.uid = function () {
    return this.userId() || this.username() || this.email();
};
i.description = function () {
    return this.proxy("traits.description") || this.proxy("traits.background");
};
i.age = function () {
    var date = this.birthday();
    var age = obj_case_1.default(this.traits(), "age");
    if (age != null)
        return age;
    if (!(date instanceof Date))
        return;
    var now = new Date();
    return now.getFullYear() - date.getFullYear();
};
i.avatar = function () {
    var traits = this.traits();
    return (obj_case_1.default(traits, "avatar") || obj_case_1.default(traits, "photoUrl") || obj_case_1.default(traits, "avatarUrl"));
};
i.position = function () {
    var traits = this.traits();
    return obj_case_1.default(traits, "position") || obj_case_1.default(traits, "jobTitle");
};
i.username = facade_1.Facade.proxy("traits.username");
i.website = facade_1.Facade.one("traits.website");
i.websites = facade_1.Facade.multi("traits.website");
i.phone = facade_1.Facade.one("traits.phone");
i.phones = facade_1.Facade.multi("traits.phone");
i.address = facade_1.Facade.proxy("traits.address");
i.gender = facade_1.Facade.proxy("traits.gender");
i.birthday = facade_1.Facade.proxy("traits.birthday");
//# sourceMappingURL=identify.js.map

/***/ }),

/***/ 4303:
/*!********************************************************!*\
  !*** ../../node_modules/@segment/facade/dist/index.js ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Delete = exports.Screen = exports.Page = exports.Track = exports.Identify = exports.Group = exports.Alias = exports.Facade = void 0;
var facade_1 = __webpack_require__(/*! ./facade */ 2265);
Object.defineProperty(exports, "Facade", ({ enumerable: true, get: function () { return facade_1.Facade; } }));
var alias_1 = __webpack_require__(/*! ./alias */ 7663);
Object.defineProperty(exports, "Alias", ({ enumerable: true, get: function () { return alias_1.Alias; } }));
var group_1 = __webpack_require__(/*! ./group */ 7748);
Object.defineProperty(exports, "Group", ({ enumerable: true, get: function () { return group_1.Group; } }));
var identify_1 = __webpack_require__(/*! ./identify */ 5543);
Object.defineProperty(exports, "Identify", ({ enumerable: true, get: function () { return identify_1.Identify; } }));
var track_1 = __webpack_require__(/*! ./track */ 5616);
Object.defineProperty(exports, "Track", ({ enumerable: true, get: function () { return track_1.Track; } }));
var page_1 = __webpack_require__(/*! ./page */ 3644);
Object.defineProperty(exports, "Page", ({ enumerable: true, get: function () { return page_1.Page; } }));
var screen_1 = __webpack_require__(/*! ./screen */ 6871);
Object.defineProperty(exports, "Screen", ({ enumerable: true, get: function () { return screen_1.Screen; } }));
var delete_1 = __webpack_require__(/*! ./delete */ 7532);
Object.defineProperty(exports, "Delete", ({ enumerable: true, get: function () { return delete_1.Delete; } }));
exports["default"] = __assign(__assign({}, facade_1.Facade), { Alias: alias_1.Alias,
    Group: group_1.Group,
    Identify: identify_1.Identify,
    Track: track_1.Track,
    Page: page_1.Page,
    Screen: screen_1.Screen,
    Delete: delete_1.Delete });
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 6362:
/*!***********************************************************!*\
  !*** ../../node_modules/@segment/facade/dist/is-email.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var matcher = /.+\@.+\..+/;
function isEmail(string) {
    return matcher.test(string);
}
exports["default"] = isEmail;
//# sourceMappingURL=is-email.js.map

/***/ }),

/***/ 7751:
/*!*************************************************************!*\
  !*** ../../node_modules/@segment/facade/dist/is-enabled.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var disabled = {
    Salesforce: true,
};
function default_1(integration) {
    return !disabled[integration];
}
exports["default"] = default_1;
//# sourceMappingURL=is-enabled.js.map

/***/ }),

/***/ 3644:
/*!*******************************************************!*\
  !*** ../../node_modules/@segment/facade/dist/page.js ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Page = void 0;
var inherits_1 = __importDefault(__webpack_require__(/*! inherits */ 5615));
var facade_1 = __webpack_require__(/*! ./facade */ 2265);
var track_1 = __webpack_require__(/*! ./track */ 5616);
var is_email_1 = __importDefault(__webpack_require__(/*! ./is-email */ 6362));
function Page(dictionary, opts) {
    facade_1.Facade.call(this, dictionary, opts);
}
exports.Page = Page;
inherits_1.default(Page, facade_1.Facade);
var p = Page.prototype;
p.action = function () {
    return "page";
};
p.type = p.action;
p.category = facade_1.Facade.field("category");
p.name = facade_1.Facade.field("name");
p.title = facade_1.Facade.proxy("properties.title");
p.path = facade_1.Facade.proxy("properties.path");
p.url = facade_1.Facade.proxy("properties.url");
p.referrer = function () {
    return (this.proxy("context.referrer.url") ||
        this.proxy("context.page.referrer") ||
        this.proxy("properties.referrer"));
};
p.properties = function (aliases) {
    var props = this.field("properties") || {};
    var category = this.category();
    var name = this.name();
    aliases = aliases || {};
    if (category)
        props.category = category;
    if (name)
        props.name = name;
    for (var alias in aliases) {
        var value = this[alias] == null ? this.proxy("properties." + alias) : this[alias]();
        if (value == null)
            continue;
        props[aliases[alias]] = value;
        if (alias !== aliases[alias])
            delete props[alias];
    }
    return props;
};
p.email = function () {
    var email = this.proxy("context.traits.email") || this.proxy("properties.email");
    if (email)
        return email;
    var userId = this.userId();
    if (is_email_1.default(userId))
        return userId;
};
p.fullName = function () {
    var category = this.category();
    var name = this.name();
    return name && category ? category + " " + name : name;
};
p.event = function (name) {
    return name ? "Viewed " + name + " Page" : "Loaded a Page";
};
p.track = function (name) {
    var json = this.json();
    json.event = this.event(name);
    json.timestamp = this.timestamp();
    json.properties = this.properties();
    return new track_1.Track(json, this.opts);
};
//# sourceMappingURL=page.js.map

/***/ }),

/***/ 6871:
/*!*********************************************************!*\
  !*** ../../node_modules/@segment/facade/dist/screen.js ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Screen = void 0;
var inherits_1 = __importDefault(__webpack_require__(/*! inherits */ 5615));
var page_1 = __webpack_require__(/*! ./page */ 3644);
var track_1 = __webpack_require__(/*! ./track */ 5616);
function Screen(dictionary, opts) {
    page_1.Page.call(this, dictionary, opts);
}
exports.Screen = Screen;
inherits_1.default(Screen, page_1.Page);
Screen.prototype.action = function () {
    return "screen";
};
Screen.prototype.type = Screen.prototype.action;
Screen.prototype.event = function (name) {
    return name ? "Viewed " + name + " Screen" : "Loaded a Screen";
};
Screen.prototype.track = function (name) {
    var json = this.json();
    json.event = this.event(name);
    json.timestamp = this.timestamp();
    json.properties = this.properties();
    return new track_1.Track(json, this.opts);
};
//# sourceMappingURL=screen.js.map

/***/ }),

/***/ 5616:
/*!********************************************************!*\
  !*** ../../node_modules/@segment/facade/dist/track.js ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Track = void 0;
var inherits_1 = __importDefault(__webpack_require__(/*! inherits */ 5615));
var facade_1 = __webpack_require__(/*! ./facade */ 2265);
var identify_1 = __webpack_require__(/*! ./identify */ 5543);
var is_email_1 = __importDefault(__webpack_require__(/*! ./is-email */ 6362));
var obj_case_1 = __importDefault(__webpack_require__(/*! obj-case */ 8578));
function Track(dictionary, opts) {
    facade_1.Facade.call(this, dictionary, opts);
}
exports.Track = Track;
inherits_1.default(Track, facade_1.Facade);
var t = Track.prototype;
t.action = function () {
    return "track";
};
t.type = t.action;
t.event = facade_1.Facade.field("event");
t.value = facade_1.Facade.proxy("properties.value");
t.category = facade_1.Facade.proxy("properties.category");
t.id = facade_1.Facade.proxy("properties.id");
t.productId = function () {
    return (this.proxy("properties.product_id") || this.proxy("properties.productId"));
};
t.promotionId = function () {
    return (this.proxy("properties.promotion_id") ||
        this.proxy("properties.promotionId"));
};
t.cartId = function () {
    return this.proxy("properties.cart_id") || this.proxy("properties.cartId");
};
t.checkoutId = function () {
    return (this.proxy("properties.checkout_id") || this.proxy("properties.checkoutId"));
};
t.paymentId = function () {
    return (this.proxy("properties.payment_id") || this.proxy("properties.paymentId"));
};
t.couponId = function () {
    return (this.proxy("properties.coupon_id") || this.proxy("properties.couponId"));
};
t.wishlistId = function () {
    return (this.proxy("properties.wishlist_id") || this.proxy("properties.wishlistId"));
};
t.reviewId = function () {
    return (this.proxy("properties.review_id") || this.proxy("properties.reviewId"));
};
t.orderId = function () {
    return (this.proxy("properties.id") ||
        this.proxy("properties.order_id") ||
        this.proxy("properties.orderId"));
};
t.sku = facade_1.Facade.proxy("properties.sku");
t.tax = facade_1.Facade.proxy("properties.tax");
t.name = facade_1.Facade.proxy("properties.name");
t.price = facade_1.Facade.proxy("properties.price");
t.total = facade_1.Facade.proxy("properties.total");
t.repeat = facade_1.Facade.proxy("properties.repeat");
t.coupon = facade_1.Facade.proxy("properties.coupon");
t.shipping = facade_1.Facade.proxy("properties.shipping");
t.discount = facade_1.Facade.proxy("properties.discount");
t.shippingMethod = function () {
    return (this.proxy("properties.shipping_method") ||
        this.proxy("properties.shippingMethod"));
};
t.paymentMethod = function () {
    return (this.proxy("properties.payment_method") ||
        this.proxy("properties.paymentMethod"));
};
t.description = facade_1.Facade.proxy("properties.description");
t.plan = facade_1.Facade.proxy("properties.plan");
t.subtotal = function () {
    var subtotal = obj_case_1.default(this.properties(), "subtotal");
    var total = this.total() || this.revenue();
    if (subtotal)
        return subtotal;
    if (!total)
        return 0;
    if (this.total()) {
        var n = this.tax();
        if (n)
            total -= n;
        n = this.shipping();
        if (n)
            total -= n;
        n = this.discount();
        if (n)
            total += n;
    }
    return total;
};
t.products = function () {
    var props = this.properties();
    var products = obj_case_1.default(props, "products");
    if (Array.isArray(products)) {
        return products.filter(function (item) { return item !== null; });
    }
    return [];
};
t.quantity = function () {
    var props = this.obj.properties || {};
    return props.quantity || 1;
};
t.currency = function () {
    var props = this.obj.properties || {};
    return props.currency || "USD";
};
t.referrer = function () {
    return (this.proxy("context.referrer.url") ||
        this.proxy("context.page.referrer") ||
        this.proxy("properties.referrer"));
};
t.query = facade_1.Facade.proxy("options.query");
t.properties = function (aliases) {
    var ret = this.field("properties") || {};
    aliases = aliases || {};
    for (var alias in aliases) {
        var value = this[alias] == null ? this.proxy("properties." + alias) : this[alias]();
        if (value == null)
            continue;
        ret[aliases[alias]] = value;
        delete ret[alias];
    }
    return ret;
};
t.username = function () {
    return (this.proxy("traits.username") ||
        this.proxy("properties.username") ||
        this.userId() ||
        this.sessionId());
};
t.email = function () {
    var email = this.proxy("traits.email") ||
        this.proxy("properties.email") ||
        this.proxy("options.traits.email");
    if (email)
        return email;
    var userId = this.userId();
    if (is_email_1.default(userId))
        return userId;
};
t.revenue = function () {
    var revenue = this.proxy("properties.revenue");
    var event = this.event();
    var orderCompletedRegExp = /^[ _]?completed[ _]?order[ _]?|^[ _]?order[ _]?completed[ _]?$/i;
    if (!revenue && event && event.match(orderCompletedRegExp)) {
        revenue = this.proxy("properties.total");
    }
    return currency(revenue);
};
t.cents = function () {
    var revenue = this.revenue();
    return typeof revenue !== "number" ? this.value() || 0 : revenue * 100;
};
t.identify = function () {
    var json = this.json();
    json.traits = this.traits();
    return new identify_1.Identify(json, this.opts);
};
function currency(val) {
    if (!val)
        return;
    if (typeof val === "number") {
        return val;
    }
    if (typeof val !== "string") {
        return;
    }
    val = val.replace(/\$/g, "");
    val = parseFloat(val);
    if (!isNaN(val)) {
        return val;
    }
}
//# sourceMappingURL=track.js.map

/***/ }),

/***/ 518:
/*!*****************************************************************!*\
  !*** ../../node_modules/@segment/isodate-traverse/lib/index.js ***!
  \*****************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var isodate = __webpack_require__(/*! @segment/isodate */ 7237);

/**
 * Expose `traverse`.
 */
module.exports = traverse;

/**
 * Recursively traverse an object or array, and convert
 * all ISO date strings parse into Date objects.
 *
 * @param {Object} input - object, array, or string to convert
 * @param {Boolean} strict - only convert strings with year, month, and date
 * @return {Object}
 */
function traverse(input, strict) {
  if (strict === undefined) strict = true;
  if (input && typeof input === 'object') {
    return traverseObject(input, strict);
  } else if (Array.isArray(input)) {
    return traverseArray(input, strict);
  } else if (isodate.is(input, strict)) {
    return isodate.parse(input);
  }
  return input;
}

/**
 * Object traverser helper function.
 *
 * @param {Object} obj - object to traverse
 * @param {Boolean} strict - only convert strings with year, month, and date
 * @return {Object}
 */
function traverseObject(obj, strict) {
  Object.keys(obj).forEach(function(key) {
    obj[key] = traverse(obj[key], strict);
  });
  return obj;
}

/**
 * Array traverser helper function
 *
 * @param {Array} arr - array to traverse
 * @param {Boolean} strict - only convert strings with year, month, and date
 * @return {Array}
 */
function traverseArray(arr, strict) {
  arr.forEach(function(value, index) {
    arr[index] = traverse(value, strict);
  });
  return arr;
}


/***/ }),

/***/ 7237:
/*!********************************************************!*\
  !*** ../../node_modules/@segment/isodate/lib/index.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


/**
 * Matcher, slightly modified from:
 *
 * https://github.com/csnover/js-iso8601/blob/lax/iso8601.js
 */

var matcher = /^(\d{4})(?:-?(\d{2})(?:-?(\d{2}))?)?(?:([ T])(\d{2}):?(\d{2})(?::?(\d{2})(?:[,\.](\d{1,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?)?)?$/;

/**
 * Convert an ISO date string to a date. Fallback to native `Date.parse`.
 *
 * https://github.com/csnover/js-iso8601/blob/lax/iso8601.js
 *
 * @param {String} iso
 * @return {Date}
 */

exports.parse = function(iso) {
  var numericKeys = [1, 5, 6, 7, 11, 12];
  var arr = matcher.exec(iso);
  var offset = 0;

  // fallback to native parsing
  if (!arr) {
    return new Date(iso);
  }

  /* eslint-disable no-cond-assign */
  // remove undefined values
  for (var i = 0, val; val = numericKeys[i]; i++) {
    arr[val] = parseInt(arr[val], 10) || 0;
  }
  /* eslint-enable no-cond-assign */

  // allow undefined days and months
  arr[2] = parseInt(arr[2], 10) || 1;
  arr[3] = parseInt(arr[3], 10) || 1;

  // month is 0-11
  arr[2]--;

  // allow abitrary sub-second precision
  arr[8] = arr[8] ? (arr[8] + '00').substring(0, 3) : 0;

  // apply timezone if one exists
  if (arr[4] === ' ') {
    offset = new Date().getTimezoneOffset();
  } else if (arr[9] !== 'Z' && arr[10]) {
    offset = arr[11] * 60 + arr[12];
    if (arr[10] === '+') {
      offset = 0 - offset;
    }
  }

  var millis = Date.UTC(arr[1], arr[2], arr[3], arr[5], arr[6] + offset, arr[7], arr[8]);
  return new Date(millis);
};


/**
 * Checks whether a `string` is an ISO date string. `strict` mode requires that
 * the date string at least have a year, month and date.
 *
 * @param {String} string
 * @param {Boolean} strict
 * @return {Boolean}
 */

exports.is = function(string, strict) {
  if (typeof string !== 'string') {
    return false;
  }
  if (strict && (/^\d{4}-\d{2}-\d{2}/).test(string) === false) {
    return false;
  }
  return matcher.test(string);
};


/***/ }),

/***/ 5615:
/*!*******************************************************!*\
  !*** ../../node_modules/inherits/inherits_browser.js ***!
  \*******************************************************/
/***/ ((module) => {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}


/***/ }),

/***/ 7639:
/*!************************************************!*\
  !*** ../../node_modules/new-date/lib/index.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var isodate = __webpack_require__(/*! @segment/isodate */ 7237);
var milliseconds = __webpack_require__(/*! ./milliseconds */ 8101);
var seconds = __webpack_require__(/*! ./seconds */ 4834);

var objProto = Object.prototype;
var toStr = objProto.toString;

function isDate(value) {
  return toStr.call(value) === "[object Date]";
}

function isNumber(value) {
  return toStr.call(value) === "[object Number]";
}

/**
 * Returns a new Javascript Date object, allowing a variety of extra input types
 * over the native Date constructor.
 *
 * @param {Date|string|number} val
 */
module.exports = function newDate(val) {
  if (isDate(val)) return val;
  if (isNumber(val)) return new Date(toMs(val));

  // date strings
  if (isodate.is(val)) {
    return isodate.parse(val);
  }
  if (milliseconds.is(val)) {
    return milliseconds.parse(val);
  }
  if (seconds.is(val)) {
    return seconds.parse(val);
  }

  // fallback to Date.parse
  return new Date(val);
};

/**
 * If the number passed val is seconds from the epoch, turn it into milliseconds.
 * Milliseconds would be greater than 31557600000 (December 31, 1970).
 *
 * @param {number} num
 */
function toMs(num) {
  if (num < 31557600000) return num * 1000;
  return num;
}


/***/ }),

/***/ 8101:
/*!*******************************************************!*\
  !*** ../../node_modules/new-date/lib/milliseconds.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


/**
 * Matcher.
 */

var matcher = /\d{13}/;

/**
 * Check whether a string is a millisecond date string.
 *
 * @param {string} string
 * @return {boolean}
 */
exports.is = function (string) {
  return matcher.test(string);
};

/**
 * Convert a millisecond string to a date.
 *
 * @param {string} millis
 * @return {Date}
 */
exports.parse = function (millis) {
  millis = parseInt(millis, 10);
  return new Date(millis);
};


/***/ }),

/***/ 4834:
/*!**************************************************!*\
  !*** ../../node_modules/new-date/lib/seconds.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


/**
 * Matcher.
 */

var matcher = /\d{10}/;

/**
 * Check whether a string is a second date string.
 *
 * @param {string} string
 * @return {Boolean}
 */
exports.is = function (string) {
  return matcher.test(string);
};

/**
 * Convert a second string to a date.
 *
 * @param {string} seconds
 * @return {Date}
 */
exports.parse = function (seconds) {
  var millis = parseInt(seconds, 10) * 1000;
  return new Date(millis);
};


/***/ }),

/***/ 8578:
/*!********************************************!*\
  !*** ../../node_modules/obj-case/index.js ***!
  \********************************************/
/***/ ((module) => {


var identity = function(_){ return _; };


/**
 * Module exports, export
 */

module.exports = multiple(find);
module.exports.find = module.exports;


/**
 * Export the replacement function, return the modified object
 */

module.exports.replace = function (obj, key, val, options) {
  multiple(replace).call(this, obj, key, val, options);
  return obj;
};


/**
 * Export the delete function, return the modified object
 */

module.exports.del = function (obj, key, options) {
  multiple(del).call(this, obj, key, null, options);
  return obj;
};


/**
 * Compose applying the function to a nested key
 */

function multiple (fn) {
  return function (obj, path, val, options) {
    var normalize = options && isFunction(options.normalizer) ? options.normalizer : defaultNormalize;
    path = normalize(path);

    var key;
    var finished = false;

    while (!finished) loop();

    function loop() {
      for (key in obj) {
        var normalizedKey = normalize(key);
        if (0 === path.indexOf(normalizedKey)) {
          var temp = path.substr(normalizedKey.length);
          if (temp.charAt(0) === '.' || temp.length === 0) {
            path = temp.substr(1);
            var child = obj[key];

            // we're at the end and there is nothing.
            if (null == child) {
              finished = true;
              return;
            }

            // we're at the end and there is something.
            if (!path.length) {
              finished = true;
              return;
            }

            // step into child
            obj = child;

            // but we're done here
            return;
          }
        }
      }

      key = undefined;
      // if we found no matching properties
      // on the current object, there's no match.
      finished = true;
    }

    if (!key) return;
    if (null == obj) return obj;

    // the `obj` and `key` is one above the leaf object and key, so
    // start object: { a: { 'b.c': 10 } }
    // end object: { 'b.c': 10 }
    // end key: 'b.c'
    // this way, you can do `obj[key]` and get `10`.
    return fn(obj, key, val);
  };
}


/**
 * Find an object by its key
 *
 * find({ first_name : 'Calvin' }, 'firstName')
 */

function find (obj, key) {
  if (obj.hasOwnProperty(key)) return obj[key];
}


/**
 * Delete a value for a given key
 *
 * del({ a : 'b', x : 'y' }, 'X' }) -> { a : 'b' }
 */

function del (obj, key) {
  if (obj.hasOwnProperty(key)) delete obj[key];
  return obj;
}


/**
 * Replace an objects existing value with a new one
 *
 * replace({ a : 'b' }, 'a', 'c') -> { a : 'c' }
 */

function replace (obj, key, val) {
  if (obj.hasOwnProperty(key)) obj[key] = val;
  return obj;
}

/**
 * Normalize a `dot.separated.path`.
 *
 * A.HELL(!*&#(!)O_WOR   LD.bar => ahelloworldbar
 *
 * @param {String} path
 * @return {String}
 */

function defaultNormalize(path) {
  return path.replace(/[^a-zA-Z0-9\.]+/g, '').toLowerCase();
}

/**
 * Check if a value is a function.
 *
 * @param {*} val
 * @return {boolean} Returns `true` if `val` is a function, otherwise `false`.
 */

function isFunction(val) {
  return typeof val === 'function';
}


/***/ }),

/***/ 5177:
/*!******************************!*\
  !*** ./src/browser/index.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AnalyticsBrowser: () => (/* binding */ AnalyticsBrowser),
/* harmony export */   loadCDNSettings: () => (/* binding */ loadCDNSettings)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _lib_get_process_env__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../lib/get-process-env */ 6340);
/* harmony import */ var _lib_parse_cdn__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../lib/parse-cdn */ 2911);
/* harmony import */ var _core_analytics__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../core/analytics */ 8339);
/* harmony import */ var _core_context__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../core/context */ 8456);
/* harmony import */ var _lib_merged_options__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../lib/merged-options */ 5835);
/* harmony import */ var _segment_analytics_generic_utils__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @segment/analytics-generic-utils */ 8115);
/* harmony import */ var _plugins_env_enrichment__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../plugins/env-enrichment */ 6761);
/* harmony import */ var _plugins_remote_loader__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../plugins/remote-loader */ 2016);
/* harmony import */ var _plugins_segmentio__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../plugins/segmentio */ 9099);
/* harmony import */ var _core_buffer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../core/buffer */ 8347);
/* harmony import */ var _core_inspector__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../core/inspector */ 4077);
/* harmony import */ var _core_stats__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../core/stats */ 8900);
/* harmony import */ var _lib_global_analytics_helper__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../lib/global-analytics-helper */ 6091);
/* harmony import */ var _lib_fetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lib/fetch */ 8970);















function loadCDNSettings(writeKey, baseUrl) {
    return (0,_lib_fetch__WEBPACK_IMPORTED_MODULE_0__.fetch)("".concat(baseUrl, "/v1/projects/").concat(writeKey, "/settings"))
        .then(function (res) {
        if (!res.ok) {
            return res.text().then(function (errorResponseMessage) {
                throw new Error(errorResponseMessage);
            });
        }
        return res.json();
    })
        .catch(function (err) {
        console.error(err.message);
        throw err;
    });
}
function hasLegacyDestinations(settings) {
    return ((0,_lib_get_process_env__WEBPACK_IMPORTED_MODULE_1__.getProcessEnv)().NODE_ENV !== 'test' &&
        // just one integration means segmentio
        Object.keys(settings.integrations).length > 1);
}
function hasTsubMiddleware(settings) {
    var _a, _b, _c;
    return ((0,_lib_get_process_env__WEBPACK_IMPORTED_MODULE_1__.getProcessEnv)().NODE_ENV !== 'test' &&
        ((_c = (_b = (_a = settings.middlewareSettings) === null || _a === void 0 ? void 0 : _a.routingRules) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0) > 0);
}
/**
 * With AJS classic, we allow users to call setAnonymousId before the library initialization.
 * This is important because some of the destinations will use the anonymousId during the initialization,
 * and if we set anonId afterwards, that wouldn’t impact the destination.
 *
 * Also Ensures events can be registered before library initialization.
 * This is important so users can register to 'initialize' and any events that may fire early during setup.
 */
function flushPreBuffer(analytics, buffer) {
    (0,_core_buffer__WEBPACK_IMPORTED_MODULE_2__.flushSetAnonymousID)(analytics, buffer);
    (0,_core_buffer__WEBPACK_IMPORTED_MODULE_2__.flushOn)(analytics, buffer);
}
/**
 * Finish flushing buffer and cleanup.
 */
function flushFinalBuffer(analytics, queryString, buffer) {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__awaiter)(this, void 0, Promise, function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, flushQueryString(analytics, queryString)];
                case 1:
                    _a.sent();
                    (0,_core_buffer__WEBPACK_IMPORTED_MODULE_2__.flushAnalyticsCallsInNewTask)(analytics, buffer);
                    return [2 /*return*/];
            }
        });
    });
}
var getQueryString = function () {
    var _a, _b;
    var hash = (_a = window.location.hash) !== null && _a !== void 0 ? _a : '';
    var search = (_b = window.location.search) !== null && _b !== void 0 ? _b : '';
    var term = search.length ? search : hash.replace(/(?=#).*(?=\?)/, '');
    return term;
};
var flushQueryString = function (analytics, queryString) { return (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__awaiter)(void 0, void 0, Promise, function () {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__generator)(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!queryString.includes('ajs_')) return [3 /*break*/, 2];
                return [4 /*yield*/, analytics.queryString(queryString).catch(console.error)];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); };
function registerPlugins(writeKey, cdnSettings, analytics, options, pluginLikes, legacyIntegrationSources, preInitBuffer) {
    var _a, _b, _c;
    if (pluginLikes === void 0) { pluginLikes = []; }
    return (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__awaiter)(this, void 0, Promise, function () {
        var pluginsFromSettings, pluginSources, tsubMiddleware, _d, legacyDestinations, _e, schemaFilter, _f, mergedSettings, remotePlugins, basePlugins, shouldIgnoreSegmentio, _g, _h, ctx;
        var _this = this;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__generator)(this, function (_j) {
            switch (_j.label) {
                case 0:
                    flushPreBuffer(analytics, preInitBuffer);
                    pluginsFromSettings = pluginLikes === null || pluginLikes === void 0 ? void 0 : pluginLikes.filter(function (pluginLike) { return typeof pluginLike === 'object'; });
                    pluginSources = pluginLikes === null || pluginLikes === void 0 ? void 0 : pluginLikes.filter(function (pluginLike) {
                        return typeof pluginLike === 'function' &&
                            typeof pluginLike.pluginName === 'string';
                    });
                    if (!hasTsubMiddleware(cdnSettings)) return [3 /*break*/, 2];
                    return [4 /*yield*/, __webpack_require__.e(/*! import() | tsub-middleware */ "tsub-middleware").then(__webpack_require__.bind(__webpack_require__, /*! ../plugins/routing-middleware */ 31)).then(function (mod) {
                            return mod.tsubMiddleware(cdnSettings.middlewareSettings.routingRules);
                        })];
                case 1:
                    _d = _j.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _d = undefined;
                    _j.label = 3;
                case 3:
                    tsubMiddleware = _d;
                    if (!(hasLegacyDestinations(cdnSettings) || legacyIntegrationSources.length > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, __webpack_require__.e(/*! import() | ajs-destination */ "ajs-destination").then(__webpack_require__.bind(__webpack_require__, /*! ../plugins/ajs-destination */ 6555)).then(function (mod) {
                            return mod.ajsDestinations(writeKey, cdnSettings, analytics.integrations, options, tsubMiddleware, legacyIntegrationSources);
                        })];
                case 4:
                    _e = _j.sent();
                    return [3 /*break*/, 6];
                case 5:
                    _e = [];
                    _j.label = 6;
                case 6:
                    legacyDestinations = _e;
                    if (!cdnSettings.legacyVideoPluginsEnabled) return [3 /*break*/, 8];
                    return [4 /*yield*/, __webpack_require__.e(/*! import() | legacyVideos */ "legacyVideos").then(__webpack_require__.bind(__webpack_require__, /*! ../plugins/legacy-video-plugins */ 8162)).then(function (mod) {
                            return mod.loadLegacyVideoPlugins(analytics);
                        })];
                case 7:
                    _j.sent();
                    _j.label = 8;
                case 8:
                    if (!((_a = options.plan) === null || _a === void 0 ? void 0 : _a.track)) return [3 /*break*/, 10];
                    return [4 /*yield*/, __webpack_require__.e(/*! import() | schemaFilter */ "schemaFilter").then(__webpack_require__.bind(__webpack_require__, /*! ../plugins/schema-filter */ 3542)).then(function (mod) {
                            var _a;
                            return mod.schemaFilter((_a = options.plan) === null || _a === void 0 ? void 0 : _a.track, cdnSettings);
                        })];
                case 9:
                    _f = _j.sent();
                    return [3 /*break*/, 11];
                case 10:
                    _f = undefined;
                    _j.label = 11;
                case 11:
                    schemaFilter = _f;
                    mergedSettings = (0,_lib_merged_options__WEBPACK_IMPORTED_MODULE_4__.mergedOptions)(cdnSettings, options);
                    return [4 /*yield*/, (0,_plugins_remote_loader__WEBPACK_IMPORTED_MODULE_5__.remoteLoader)(cdnSettings, analytics.integrations, mergedSettings, options, tsubMiddleware, pluginSources).catch(function (err) {
                            console.error('Failed to load remote plugins', err);
                            return [];
                        })];
                case 12:
                    remotePlugins = _j.sent();
                    basePlugins = (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__spreadArray)((0,tslib__WEBPACK_IMPORTED_MODULE_3__.__spreadArray)([_plugins_env_enrichment__WEBPACK_IMPORTED_MODULE_6__.envEnrichment], legacyDestinations, true), remotePlugins, true);
                    if (schemaFilter) {
                        basePlugins.push(schemaFilter);
                    }
                    shouldIgnoreSegmentio = (((_b = options.integrations) === null || _b === void 0 ? void 0 : _b.All) === false &&
                        !options.integrations['Segment.io']) ||
                        (options.integrations && options.integrations['Segment.io'] === false);
                    if (!!shouldIgnoreSegmentio) return [3 /*break*/, 14];
                    _h = (_g = basePlugins).push;
                    return [4 /*yield*/, (0,_plugins_segmentio__WEBPACK_IMPORTED_MODULE_7__.segmentio)(analytics, mergedSettings['Segment.io'], cdnSettings.integrations)];
                case 13:
                    _h.apply(_g, [_j.sent()]);
                    _j.label = 14;
                case 14: return [4 /*yield*/, analytics.register.apply(analytics, (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__spreadArray)((0,tslib__WEBPACK_IMPORTED_MODULE_3__.__spreadArray)([], basePlugins, false), pluginsFromSettings, false))];
                case 15:
                    ctx = _j.sent();
                    // register user-defined plugins registered via analytics.register()
                    return [4 /*yield*/, (0,_core_buffer__WEBPACK_IMPORTED_MODULE_2__.flushRegister)(analytics, preInitBuffer)];
                case 16:
                    // register user-defined plugins registered via analytics.register()
                    _j.sent();
                    if (!Object.entries((_c = cdnSettings.enabledMiddleware) !== null && _c !== void 0 ? _c : {}).some(function (_a) {
                        var enabled = _a[1];
                        return enabled;
                    })) return [3 /*break*/, 18];
                    return [4 /*yield*/, __webpack_require__.e(/*! import() | remoteMiddleware */ "remoteMiddleware").then(__webpack_require__.bind(__webpack_require__, /*! ../plugins/remote-middleware */ 9231)).then(function (_a) {
                            var remoteMiddlewares = _a.remoteMiddlewares;
                            return (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__awaiter)(_this, void 0, void 0, function () {
                                var middleware, promises;
                                return (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__generator)(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, remoteMiddlewares(ctx, cdnSettings, options.obfuscate)];
                                        case 1:
                                            middleware = _b.sent();
                                            promises = middleware.map(function (mdw) {
                                                return analytics.addSourceMiddleware(mdw);
                                            });
                                            return [2 /*return*/, Promise.all(promises)];
                                    }
                                });
                            });
                        })];
                case 17:
                    _j.sent();
                    _j.label = 18;
                case 18: 
                // register any user-defined plugins added via analytics.addSourceMiddleware()
                return [4 /*yield*/, (0,_core_buffer__WEBPACK_IMPORTED_MODULE_2__.flushAddSourceMiddleware)(analytics, preInitBuffer)];
                case 19:
                    // register any user-defined plugins added via analytics.addSourceMiddleware()
                    _j.sent();
                    return [2 /*return*/, ctx];
            }
        });
    });
}
function loadAnalytics(settings, options, preInitBuffer) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (options === void 0) { options = {}; }
    return (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__awaiter)(this, void 0, Promise, function () {
        var queryString, cdnURL, cdnSettings, _k, disabled, retryQueue, analytics, plugins, classicIntegrations, segmentLoadOptions, ctx;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__generator)(this, function (_l) {
            switch (_l.label) {
                case 0:
                    // return no-op analytics instance if disabled
                    if (options.disable === true) {
                        return [2 /*return*/, [new _core_analytics__WEBPACK_IMPORTED_MODULE_8__.NullAnalytics(), _core_context__WEBPACK_IMPORTED_MODULE_9__.Context.system()]];
                    }
                    if (options.globalAnalyticsKey)
                        (0,_lib_global_analytics_helper__WEBPACK_IMPORTED_MODULE_10__.setGlobalAnalyticsKey)(options.globalAnalyticsKey);
                    // this is an ugly side-effect, but it's for the benefits of the plugins that get their cdn via getCDN()
                    if (settings.cdnURL)
                        (0,_lib_parse_cdn__WEBPACK_IMPORTED_MODULE_11__.setGlobalCDNUrl)(settings.cdnURL);
                    if (options.initialPageview) {
                        // capture the page context early, so it's always up-to-date
                        preInitBuffer.add(new _core_buffer__WEBPACK_IMPORTED_MODULE_2__.PreInitMethodCall('page', []));
                    }
                    queryString = getQueryString();
                    cdnURL = (_a = settings.cdnURL) !== null && _a !== void 0 ? _a : (0,_lib_parse_cdn__WEBPACK_IMPORTED_MODULE_11__.getCDN)();
                    if (!((_b = settings.cdnSettings) !== null && _b !== void 0)) return [3 /*break*/, 1];
                    _k = _b;
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, loadCDNSettings(settings.writeKey, cdnURL)];
                case 2:
                    _k = (_l.sent());
                    _l.label = 3;
                case 3:
                    cdnSettings = _k;
                    if (options.updateCDNSettings) {
                        cdnSettings = options.updateCDNSettings(cdnSettings);
                    }
                    if (!(typeof options.disable === 'function')) return [3 /*break*/, 5];
                    return [4 /*yield*/, options.disable(cdnSettings)];
                case 4:
                    disabled = _l.sent();
                    if (disabled) {
                        return [2 /*return*/, [new _core_analytics__WEBPACK_IMPORTED_MODULE_8__.NullAnalytics(), _core_context__WEBPACK_IMPORTED_MODULE_9__.Context.system()]];
                    }
                    _l.label = 5;
                case 5:
                    retryQueue = (_d = (_c = cdnSettings.integrations['Segment.io']) === null || _c === void 0 ? void 0 : _c.retryQueue) !== null && _d !== void 0 ? _d : true;
                    options = (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__assign)({ retryQueue: retryQueue }, options);
                    analytics = new _core_analytics__WEBPACK_IMPORTED_MODULE_8__.Analytics((0,tslib__WEBPACK_IMPORTED_MODULE_3__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_3__.__assign)({}, settings), { cdnSettings: cdnSettings, cdnURL: cdnURL }), options);
                    (0,_core_inspector__WEBPACK_IMPORTED_MODULE_12__.attachInspector)(analytics);
                    plugins = (_e = settings.plugins) !== null && _e !== void 0 ? _e : [];
                    classicIntegrations = (_f = settings.classicIntegrations) !== null && _f !== void 0 ? _f : [];
                    segmentLoadOptions = (_g = options.integrations) === null || _g === void 0 ? void 0 : _g['Segment.io'];
                    _core_stats__WEBPACK_IMPORTED_MODULE_13__.Stats.initRemoteMetrics((0,tslib__WEBPACK_IMPORTED_MODULE_3__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_3__.__assign)({}, cdnSettings.metrics), { host: (_h = segmentLoadOptions === null || segmentLoadOptions === void 0 ? void 0 : segmentLoadOptions.apiHost) !== null && _h !== void 0 ? _h : (_j = cdnSettings.metrics) === null || _j === void 0 ? void 0 : _j.host, protocol: segmentLoadOptions === null || segmentLoadOptions === void 0 ? void 0 : segmentLoadOptions.protocol }));
                    return [4 /*yield*/, registerPlugins(settings.writeKey, cdnSettings, analytics, options, plugins, classicIntegrations, preInitBuffer)];
                case 6:
                    ctx = _l.sent();
                    analytics.initialized = true;
                    analytics.emit('initialize', settings, options);
                    return [4 /*yield*/, flushFinalBuffer(analytics, queryString, preInitBuffer)];
                case 7:
                    _l.sent();
                    return [2 /*return*/, [analytics, ctx]];
            }
        });
    });
}
/**
 * The public browser interface for Segment Analytics
 *
 * @example
 * ```ts
 *  export const analytics = new AnalyticsBrowser()
 *  analytics.load({ writeKey: 'foo' })
 * ```
 * @link https://github.com/segmentio/analytics-next/#readme
 */
var AnalyticsBrowser = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__extends)(AnalyticsBrowser, _super);
    function AnalyticsBrowser() {
        var _this = this;
        var _a = (0,_segment_analytics_generic_utils__WEBPACK_IMPORTED_MODULE_14__.createDeferred)(), loadStart = _a.promise, resolveLoadStart = _a.resolve;
        _this = _super.call(this, function (buffer) {
            return loadStart.then(function (_a) {
                var settings = _a[0], options = _a[1];
                return loadAnalytics(settings, options, buffer);
            });
        }) || this;
        _this._resolveLoadStart = function (settings, options) {
            return resolveLoadStart([settings, options]);
        };
        return _this;
    }
    /**
     * Fully initialize an analytics instance, including:
     *
     * * Fetching settings from the segment CDN (by default).
     * * Fetching all remote destinations configured by the user (if applicable).
     * * Flushing buffered analytics events.
     * * Loading all middleware.
     *
     * Note:️  This method should only be called *once* in your application.
     *
     * @example
     * ```ts
     * export const analytics = new AnalyticsBrowser()
     * analytics.load({ writeKey: 'foo' })
     * ```
     */
    AnalyticsBrowser.prototype.load = function (settings, options) {
        if (options === void 0) { options = {}; }
        this._resolveLoadStart(settings, options);
        return this;
    };
    /**
     * Instantiates an object exposing Analytics methods.
     *
     * @example
     * ```ts
     * const ajs = AnalyticsBrowser.load({ writeKey: '<YOUR_WRITE_KEY>' })
     *
     * ajs.track("foo")
     * ...
     * ```
     */
    AnalyticsBrowser.load = function (settings, options) {
        if (options === void 0) { options = {}; }
        return new AnalyticsBrowser().load(settings, options);
    };
    AnalyticsBrowser.standalone = function (writeKey, options) {
        return AnalyticsBrowser.load({ writeKey: writeKey }, options).then(function (res) { return res[0]; });
    };
    return AnalyticsBrowser;
}(_core_buffer__WEBPACK_IMPORTED_MODULE_2__.AnalyticsBuffered));



/***/ }),

/***/ 2720:
/*!*****************************************!*\
  !*** ./src/conversion-sdk/bootstrap.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   bootstrapConversionAnalyticsFromWindow: () => (/* binding */ bootstrapConversionAnalyticsFromWindow)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _conversion_analytics_browser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./conversion-analytics-browser */ 7316);


/** Snippet stub lives here so `window.Analytics` stays free for other tools. */
function resolveStub(w) {
    var _a;
    return ((_a = w._ConversionAnalytics) !== null && _a !== void 0 ? _a : w.ConversionAnalytics);
}
function hydrateStub(stub, api) {
    Object.assign(stub, {
        instance: api.instance,
        init: api.init,
        start: api.start,
        stop: api.stop,
        flush: api.flush,
        track: api.track,
        identify: api.identify,
        page: api.page,
        getDebugInfo: api.getDebugInfo,
        getQueueSize: api.getQueueSize,
        config: api.config,
        version: api.version,
        loaded: api.loaded,
    });
}
function attachGlobal(w, api) {
    w.ConversionAnalytics = api;
    w._ConversionAnalytics = api;
}
function toConfig(stub) {
    var _a;
    var cfg = (_a = stub === null || stub === void 0 ? void 0 : stub.config) !== null && _a !== void 0 ? _a : {};
    return {
        endpoint: cfg.endpoint,
        appName: cfg.appName,
        debug: cfg.debug,
        flushIntervalMs: cfg.flushIntervalMs,
        batchSize: cfg.batchSize,
        retryAttempts: cfg.retryAttempts,
        headers: cfg.headers,
        getContext: cfg.getContext,
        getSessionId: cfg.getSessionId,
        getVisitorCountry: cfg.getVisitorCountry,
        isTrackingAllowed: cfg.isTrackingAllowed,
        respectDoNotTrack: cfg.respectDoNotTrack,
        onError: cfg.onError,
        defaultPhoneCountryCode: cfg.defaultPhoneCountryCode,
        enableGptSlotEvents: cfg.enableGptSlotEvents,
    };
}
function bootstrapConversionAnalyticsFromWindow() {
    var _a, _b, _c;
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
        var w, stub, config, analytics, api, apiRecord, queuedSnapshot, _i, queuedSnapshot_1, call, arg0, error_1, hostQueuedPage, error_2;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (typeof window === 'undefined') {
                        return [2 /*return*/];
                    }
                    w = window;
                    stub = resolveStub(w);
                    config = toConfig(stub);
                    return [4 /*yield*/, _conversion_analytics_browser__WEBPACK_IMPORTED_MODULE_1__.ConversionAnalyticsBrowser.load(config)];
                case 1:
                    analytics = _d.sent();
                    api = {
                        instance: analytics,
                        init: function (next) { return analytics.init(next); },
                        start: function () { return analytics.start(); },
                        stop: function () { return analytics.stop(); },
                        flush: function () { return analytics.flush(); },
                        track: function (event, payload, options) {
                            return analytics.track(event, payload, options);
                        },
                        identify: function (user, traits, options) {
                            return analytics.identify(user, traits, options);
                        },
                        page: function (name, properties, options) {
                            var props = typeof name === 'string'
                                ? (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({ name: name }, (typeof properties === 'object' && properties
                                    ? properties
                                    : {})) : typeof name === 'object' && name
                                ? name
                                : typeof properties === 'object' && properties
                                    ? properties
                                    : {};
                            return analytics.page(props, options);
                        },
                        getDebugInfo: function () { return analytics.getDebugInfo(); },
                        getQueueSize: function () { return analytics.getQueueSize(); },
                        config: config,
                        version: '1.0',
                        loaded: true,
                    };
                    apiRecord = api;
                    queuedSnapshot = ((_a = stub === null || stub === void 0 ? void 0 : stub.queue) === null || _a === void 0 ? void 0 : _a.length) ? stub.queue.slice() : [];
                    if (stub != null) {
                        hydrateStub(stub, apiRecord);
                        w.ConversionAnalytics = stub;
                        w._ConversionAnalytics = stub;
                    }
                    else {
                        attachGlobal(w, apiRecord);
                    }
                    _i = 0, queuedSnapshot_1 = queuedSnapshot;
                    _d.label = 2;
                case 2:
                    if (!(_i < queuedSnapshot_1.length)) return [3 /*break*/, 15];
                    call = queuedSnapshot_1[_i];
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 13, , 14]);
                    if (!(call.type === 'track')) return [3 /*break*/, 5];
                    return [4 /*yield*/, api.track(call.arguments[0], call.arguments[1], call.arguments[2])];
                case 4:
                    _d.sent();
                    return [3 /*break*/, 12];
                case 5:
                    if (!(call.type === 'identify')) return [3 /*break*/, 7];
                    return [4 /*yield*/, api.identify(call.arguments[0], call.arguments[1], call.arguments[2])];
                case 6:
                    _d.sent();
                    return [3 /*break*/, 12];
                case 7:
                    if (!(call.type === 'page')) return [3 /*break*/, 9];
                    return [4 /*yield*/, api.page(call.arguments[0], call.arguments[1], call.arguments[2])];
                case 8:
                    _d.sent();
                    return [3 /*break*/, 12];
                case 9:
                    if (!(call.type === 'init')) return [3 /*break*/, 10];
                    arg0 = call.arguments[0];
                    if (arg0 && typeof arg0 === 'object') {
                        api.init(arg0);
                    }
                    return [3 /*break*/, 12];
                case 10:
                    if (!(call.type === 'flush')) return [3 /*break*/, 12];
                    return [4 /*yield*/, api.flush()];
                case 11:
                    _d.sent();
                    _d.label = 12;
                case 12: return [3 /*break*/, 14];
                case 13:
                    error_1 = _d.sent();
                    (_b = config.onError) === null || _b === void 0 ? void 0 : _b.call(config, error_1);
                    return [3 /*break*/, 14];
                case 14:
                    _i++;
                    return [3 /*break*/, 2];
                case 15:
                    hostQueuedPage = queuedSnapshot.some(function (call) { return call.type === 'page'; });
                    if (!!hostQueuedPage) return [3 /*break*/, 19];
                    _d.label = 16;
                case 16:
                    _d.trys.push([16, 18, , 19]);
                    return [4 /*yield*/, api.page()];
                case 17:
                    _d.sent();
                    return [3 /*break*/, 19];
                case 18:
                    error_2 = _d.sent();
                    (_c = config.onError) === null || _c === void 0 ? void 0 : _c.call(config, error_2);
                    return [3 /*break*/, 19];
                case 19: return [2 /*return*/];
            }
        });
    });
}


/***/ }),

/***/ 4504:
/*!*************************************************!*\
  !*** ./src/conversion-sdk/collector-runtime.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   flushCollectorQueue: () => (/* binding */ flushCollectorQueue),
/* harmony export */   resolveCollectorBuffer: () => (/* binding */ resolveCollectorBuffer),
/* harmony export */   stopCollectorQueue: () => (/* binding */ stopCollectorQueue)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _plugins_conversion_collector_runtime_registry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../plugins/conversion-collector/runtime-registry */ 1322);


function resolveCollectorBuffer(analytics) {
    return (0,_plugins_conversion_collector_runtime_registry__WEBPACK_IMPORTED_MODULE_0__.getConversionCollectorBuffer)(analytics);
}
function flushCollectorQueue(analytics) {
    var _a, _b;
    return (_b = (_a = (0,_plugins_conversion_collector_runtime_registry__WEBPACK_IMPORTED_MODULE_0__.getConversionCollectorBuffer)(analytics)) === null || _a === void 0 ? void 0 : _a.flush()) !== null && _b !== void 0 ? _b : Promise.resolve();
}
function stopCollectorQueue(analytics) {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
        var buffer;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    buffer = (0,_plugins_conversion_collector_runtime_registry__WEBPACK_IMPORTED_MODULE_0__.getConversionCollectorBuffer)(analytics);
                    buffer === null || buffer === void 0 ? void 0 : buffer.stop();
                    if (!(buffer === null || buffer === void 0 ? void 0 : buffer.flushAll)) return [3 /*break*/, 2];
                    return [4 /*yield*/, buffer.flushAll()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, (buffer === null || buffer === void 0 ? void 0 : buffer.flush())];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}


/***/ }),

/***/ 398:
/*!**************************************!*\
  !*** ./src/conversion-sdk/config.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_INIT_CONFIG: () => (/* binding */ DEFAULT_INIT_CONFIG),
/* harmony export */   toCollectorSettings: () => (/* binding */ toCollectorSettings)
/* harmony export */ });
var DEFAULT_INIT_CONFIG = {
    endpoint: '/collector',
    flushIntervalMs: 2000,
    batchSize: 10,
    retryAttempts: 2,
    debug: false,
    respectDoNotTrack: false,
};
function toCollectorSettings(config) {
    var _a, _b, _c, _d, _e;
    return {
        endpoint: (_a = config.endpoint) !== null && _a !== void 0 ? _a : DEFAULT_INIT_CONFIG.endpoint,
        headers: config.headers,
        retryAttempts: (_b = config.retryAttempts) !== null && _b !== void 0 ? _b : DEFAULT_INIT_CONFIG.retryAttempts,
        flushIntervalMs: (_c = config.flushIntervalMs) !== null && _c !== void 0 ? _c : DEFAULT_INIT_CONFIG.flushIntervalMs,
        batchSize: (_d = config.batchSize) !== null && _d !== void 0 ? _d : DEFAULT_INIT_CONFIG.batchSize,
        appName: config.appName,
        getContext: config.getContext,
        getSessionId: config.getSessionId,
        getVisitorCountry: config.getVisitorCountry,
        defaultPhoneCountryCode: config.defaultPhoneCountryCode,
        isTrackingAllowed: config.isTrackingAllowed,
        respectDoNotTrack: (_e = config.respectDoNotTrack) !== null && _e !== void 0 ? _e : DEFAULT_INIT_CONFIG.respectDoNotTrack,
        enableGptSlotEvents: config.enableGptSlotEvents !== false,
    };
}


/***/ }),

/***/ 7316:
/*!************************************************************!*\
  !*** ./src/conversion-sdk/conversion-analytics-browser.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ConversionAnalyticsBrowser: () => (/* binding */ ConversionAnalyticsBrowser)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _conversion_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./conversion-client */ 2942);


var ConversionAnalyticsBrowser = /** @class */ (function () {
    function ConversionAnalyticsBrowser() {
        this.client = new _conversion_client__WEBPACK_IMPORTED_MODULE_0__.ConversionClient();
    }
    ConversionAnalyticsBrowser.load = function (config) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
            var analytics;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        analytics = new ConversionAnalyticsBrowser();
                        analytics.init(config);
                        return [4 /*yield*/, analytics.client.getAnalyticsInstance()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, analytics];
                }
            });
        });
    };
    ConversionAnalyticsBrowser.prototype.init = function (config) {
        this.client.init(config);
    };
    ConversionAnalyticsBrowser.prototype.start = function () {
        this.client.start();
    };
    ConversionAnalyticsBrowser.prototype.stop = function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
            return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.stop()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ConversionAnalyticsBrowser.prototype.track = function (event, payload, options) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
            return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.track(event, payload, options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ConversionAnalyticsBrowser.prototype.page = function (properties, options) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
            return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.page(properties, options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ConversionAnalyticsBrowser.prototype.identify = function (userOrEvent, traits, options) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
            return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.identify(userOrEvent, traits, options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ConversionAnalyticsBrowser.prototype.flush = function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
            return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.flush()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ConversionAnalyticsBrowser.prototype.getQueueSize = function () {
        return this.client.getQueueSize();
    };
    ConversionAnalyticsBrowser.prototype.getDebugInfo = function () {
        return this.client.getDebugInfo();
    };
    return ConversionAnalyticsBrowser;
}());



/***/ }),

/***/ 2942:
/*!*************************************************!*\
  !*** ./src/conversion-sdk/conversion-client.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ConversionClient: () => (/* binding */ ConversionClient)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _browser__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../browser */ 5177);
/* harmony import */ var _plugins_conversion_collector__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../plugins/conversion-collector */ 3093);
/* harmony import */ var _plugins_conversion_collector__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../plugins/conversion-collector */ 7234);
/* harmony import */ var _plugins_conversion_collector__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../plugins/conversion-collector */ 9721);
/* harmony import */ var _plugins_conversion_collector_lib_session__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../plugins/conversion-collector/lib/session */ 1644);
/* harmony import */ var _debug__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./debug */ 1522);
/* harmony import */ var _collector_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./collector-runtime */ 4504);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./config */ 398);
/* harmony import */ var _legacy_args__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./legacy-args */ 3753);








var CONVERSION_COLLECTOR_PLUGIN = 'Conversion Collector';
var ConversionClient = /** @class */ (function () {
    function ConversionClient() {
        this.config = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, _config__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_INIT_CONFIG);
        this.loadPromise = null;
        this.analytics = null;
        this.bootstrapGeneration = 0;
    }
    ConversionClient.prototype.init = function (config) {
        this.config = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, _config__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_INIT_CONFIG), config);
        this.lastError = undefined;
        var previousAnalytics = this.analytics;
        var previousLoadPromise = this.loadPromise;
        this.analytics = null;
        this.collectorBuffer = undefined;
        var generation = ++this.bootstrapGeneration;
        this.loadPromise = this.bootstrapWithTeardown(generation, previousAnalytics, previousLoadPromise);
    };
    ConversionClient.prototype.stopAnalyticsInstance = function (analytics) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            var _a;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0,_collector_runtime__WEBPACK_IMPORTED_MODULE_2__.stopCollectorQueue)(analytics)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, analytics.deregister(CONVERSION_COLLECTOR_PLUGIN)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ConversionClient.prototype.bootstrapWithTeardown = function (generation, previousAnalytics, previousLoadPromise) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            var previous, _a;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!previousAnalytics) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.stopAnalyticsInstance(previousAnalytics)];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 8];
                    case 2:
                        if (!previousLoadPromise) return [3 /*break*/, 8];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 7, , 8]);
                        return [4 /*yield*/, previousLoadPromise];
                    case 4:
                        previous = _b.sent();
                        if (!(previous !== this.analytics)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.stopAnalyticsInstance(previous)];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        _a = _b.sent();
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/, this.bootstrap(generation)];
                }
            });
        });
    };
    ConversionClient.prototype.bootstrap = function (generation) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            var collectorSettings, useGpt, plugins, analytics;
            var _this = this;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        collectorSettings = (0,_config__WEBPACK_IMPORTED_MODULE_1__.toCollectorSettings)(this.config);
                        useGpt = this.config.enableGptSlotEvents !== false;
                        plugins = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spreadArray)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spreadArray)([], (0,_plugins_conversion_collector__WEBPACK_IMPORTED_MODULE_3__.conversionPipelinePlugins)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, collectorSettings), { enableGptSlotEvents: false })), true), (useGpt ? [(0,_plugins_conversion_collector__WEBPACK_IMPORTED_MODULE_4__.conversionGptSlotEventsPlugin)()] : []), true);
                        return [4 /*yield*/, _browser__WEBPACK_IMPORTED_MODULE_5__.AnalyticsBrowser.load({
                                writeKey: 'conversion-pipeline',
                                cdnSettings: _plugins_conversion_collector__WEBPACK_IMPORTED_MODULE_6__.conversionCdnSettingsMinimal,
                                cdnURL: 'https://cdn.conversion-pipeline.local',
                                plugins: plugins,
                            }, {
                                integrations: { 'Segment.io': false },
                            })];
                    case 1:
                        analytics = (_a.sent())[0];
                        if (!(generation !== this.bootstrapGeneration)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.stopAnalyticsInstance(analytics)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, analytics];
                    case 3:
                        analytics.on('error', function (payload) {
                            var _a, _b, _c;
                            var reason = (_a = payload === null || payload === void 0 ? void 0 : payload.reason) !== null && _a !== void 0 ? _a : payload;
                            _this.lastError = reason instanceof Error ? reason.message : String(reason);
                            (_c = (_b = _this.config).onError) === null || _c === void 0 ? void 0 : _c.call(_b, reason);
                        });
                        if (this.config.debug) {
                            (0,_debug__WEBPACK_IMPORTED_MODULE_7__.mountDebugPanel)(function () { return _this.getDebugInfo(); });
                        }
                        this.analytics = analytics;
                        this.collectorBuffer = (0,_collector_runtime__WEBPACK_IMPORTED_MODULE_2__.resolveCollectorBuffer)(analytics);
                        return [2 /*return*/, analytics];
                }
            });
        });
    };
    ConversionClient.prototype.ready = function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                if (!this.loadPromise) {
                    throw new Error('Conversion analytics SDK is not initialized. Call init() first.');
                }
                return [2 /*return*/, this.loadPromise];
            });
        });
    };
    ConversionClient.prototype.start = function () {
        void this.ready();
    };
    ConversionClient.prototype.stop = function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            var analytics;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ready()];
                    case 1:
                        analytics = _a.sent();
                        return [4 /*yield*/, this.stopAnalyticsInstance(analytics)];
                    case 2:
                        _a.sent();
                        this.analytics = null;
                        this.collectorBuffer = undefined;
                        this.loadPromise = null;
                        return [2 /*return*/];
                }
            });
        });
    };
    ConversionClient.prototype.track = function (event, payload, options) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            var analytics, _a, eventName, properties;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.ready()];
                    case 1:
                        analytics = _b.sent();
                        _a = (0,_legacy_args__WEBPACK_IMPORTED_MODULE_8__.normalizeTrackCall)(event, payload), eventName = _a.eventName, properties = _a.properties;
                        return [4 /*yield*/, analytics.track(eventName, properties, options)];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ConversionClient.prototype.page = function (properties, options) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            var analytics;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ready()];
                    case 1:
                        analytics = _a.sent();
                        return [4 /*yield*/, analytics.page(properties !== null && properties !== void 0 ? properties : {}, options)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ConversionClient.prototype.identify = function (userOrEvent, traits, options) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            var analytics, _a, userId, normalizedTraits;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.ready()];
                    case 1:
                        analytics = _b.sent();
                        _a = (0,_legacy_args__WEBPACK_IMPORTED_MODULE_8__.normalizeIdentifyCall)(userOrEvent, traits), userId = _a.userId, normalizedTraits = _a.traits;
                        if (!userId) return [3 /*break*/, 3];
                        return [4 /*yield*/, analytics.identify(userId, normalizedTraits, options)];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                    case 3: return [4 /*yield*/, analytics.identify(normalizedTraits, options)];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ConversionClient.prototype.flush = function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            var analytics;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ready()];
                    case 1:
                        analytics = _a.sent();
                        return [4 /*yield*/, (0,_collector_runtime__WEBPACK_IMPORTED_MODULE_2__.flushCollectorQueue)(analytics)];
                    case 2:
                        _a.sent();
                        this.collectorBuffer = (0,_collector_runtime__WEBPACK_IMPORTED_MODULE_2__.resolveCollectorBuffer)(analytics);
                        return [2 /*return*/];
                }
            });
        });
    };
    ConversionClient.prototype.getQueueSize = function () {
        var _a, _b;
        return (_b = (_a = this.collectorBuffer) === null || _a === void 0 ? void 0 : _a.getSize()) !== null && _b !== void 0 ? _b : 0;
    };
    ConversionClient.prototype.getDebugInfo = function () {
        var _a, _b, _c, _d;
        return {
            endpoint: (_a = this.config.endpoint) !== null && _a !== void 0 ? _a : _config__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_INIT_CONFIG.endpoint,
            sessionId: (_d = (_c = (_b = this.config).getSessionId) === null || _c === void 0 ? void 0 : _c.call(_b)) !== null && _d !== void 0 ? _d : (0,_plugins_conversion_collector_lib_session__WEBPACK_IMPORTED_MODULE_9__.getOrCreateSessionId)(),
            queueSize: this.getQueueSize(),
            lastError: this.lastError,
        };
    };
    ConversionClient.prototype.getAnalyticsInstance = function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                return [2 /*return*/, this.ready()];
            });
        });
    };
    return ConversionClient;
}());



/***/ }),

/***/ 1522:
/*!*******************************************!*\
  !*** ./src/conversion-sdk/debug/index.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   copyToClipboard: () => (/* binding */ copyToClipboard),
/* harmony export */   mountDebugPanel: () => (/* binding */ mountDebugPanel)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

var PANEL_ID = 'bg-analytics-debug-panel';
function copyToClipboard(content) {
    var _a;
    if (typeof navigator !== 'undefined' && ((_a = navigator.clipboard) === null || _a === void 0 ? void 0 : _a.writeText)) {
        return navigator.clipboard.writeText(content);
    }
    return Promise.resolve();
}
function mountDebugPanel(getInfo) {
    var _this = this;
    if (typeof document === 'undefined') {
        return;
    }
    var existing = document.getElementById(PANEL_ID);
    if (existing) {
        return;
    }
    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.position = 'fixed';
    panel.style.bottom = '16px';
    panel.style.right = '16px';
    panel.style.zIndex = '99999';
    panel.style.padding = '10px';
    panel.style.background = '#111827';
    panel.style.color = '#f9fafb';
    panel.style.borderRadius = '8px';
    panel.style.font = '12px monospace';
    panel.style.maxWidth = '320px';
    panel.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    var title = document.createElement('div');
    title.textContent = 'Bg Analytics Debug';
    title.style.fontWeight = '700';
    title.style.marginBottom = '8px';
    var pre = document.createElement('pre');
    pre.style.margin = '0 0 8px 0';
    pre.style.whiteSpace = 'pre-wrap';
    var copyButton = document.createElement('button');
    copyButton.textContent = 'Copy debug JSON';
    copyButton.style.width = '100%';
    copyButton.style.border = '1px solid #374151';
    copyButton.style.background = '#1f2937';
    copyButton.style.color = '#f9fafb';
    copyButton.style.padding = '6px 8px';
    copyButton.style.borderRadius = '6px';
    copyButton.style.cursor = 'pointer';
    var render = function () {
        pre.textContent = JSON.stringify(getInfo(), null, 2);
    };
    copyButton.addEventListener('click', function () { return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(_this, void 0, void 0, function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, copyToClipboard(JSON.stringify(getInfo(), null, 2))];
                case 1:
                    _a.sent();
                    copyButton.textContent = 'Copied!';
                    setTimeout(function () {
                        copyButton.textContent = 'Copy debug JSON';
                    }, 1200);
                    return [2 /*return*/];
            }
        });
    }); });
    panel.appendChild(title);
    panel.appendChild(pre);
    panel.appendChild(copyButton);
    document.body.appendChild(panel);
    render();
    setInterval(render, 1000);
}


/***/ }),

/***/ 3753:
/*!*******************************************!*\
  !*** ./src/conversion-sdk/legacy-args.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   normalizeIdentifyCall: () => (/* binding */ normalizeIdentifyCall),
/* harmony export */   normalizeTrackCall: () => (/* binding */ normalizeTrackCall)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

function normalizeTrackCall(event, payload) {
    var _a, _b, _c;
    var normalizedName = typeof event === 'string' ? event : (_a = event.eventName) !== null && _a !== void 0 ? _a : 'unknown_event';
    var sourcePayload = typeof event === 'string' ? payload !== null && payload !== void 0 ? payload : {} : (_c = (_b = event.eventData) !== null && _b !== void 0 ? _b : payload) !== null && _c !== void 0 ? _c : {};
    var _d = sourcePayload !== null && sourcePayload !== void 0 ? sourcePayload : {}, _ignoredSnakeCase = _d.event_name, _ignoredCamelCase = _d.eventName, normalizedPayload = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__rest)(_d, ["event_name", "eventName"]);
    return {
        eventName: normalizedName,
        properties: normalizedPayload,
    };
}
function isIdentifyShape(value) {
    return (typeof value === 'object' &&
        value !== null &&
        ('userId' in value || 'traits' in value));
}
function normalizeIdentifyCall(userOrEvent, traits) {
    var _a, _b;
    if (typeof userOrEvent === 'string') {
        return { userId: userOrEvent, traits: traits !== null && traits !== void 0 ? traits : {} };
    }
    if (isIdentifyShape(userOrEvent)) {
        return {
            userId: userOrEvent.userId,
            traits: (_b = (_a = userOrEvent.traits) !== null && _a !== void 0 ? _a : traits) !== null && _b !== void 0 ? _b : {},
        };
    }
    return { traits: userOrEvent };
}


/***/ }),

/***/ 8339:
/*!*************************************!*\
  !*** ./src/core/analytics/index.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Analytics: () => (/* binding */ Analytics),
/* harmony export */   AnalyticsInstanceSettings: () => (/* binding */ AnalyticsInstanceSettings),
/* harmony export */   NullAnalytics: () => (/* binding */ NullAnalytics)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _arguments_resolver__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../arguments-resolver */ 7228);
/* harmony import */ var _connection__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../connection */ 6789);
/* harmony import */ var _context__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../context */ 8456);
/* harmony import */ var _segment_analytics_core__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @segment/analytics-core */ 643);
/* harmony import */ var _segment_analytics_generic_utils__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! @segment/analytics-generic-utils */ 3255);
/* harmony import */ var _events__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../events */ 5644);
/* harmony import */ var _plugin__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ../plugin */ 3742);
/* harmony import */ var _queue_event_queue__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../queue/event-queue */ 6458);
/* harmony import */ var _user__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../user */ 3398);
/* harmony import */ var _lib_bind_all__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../lib/bind-all */ 3057);
/* harmony import */ var _lib_priority_queue_persisted__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../lib/priority-queue/persisted */ 9732);
/* harmony import */ var _generated_version__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ../../generated/version */ 6452);
/* harmony import */ var _lib_priority_queue__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../lib/priority-queue */ 9797);
/* harmony import */ var _lib_get_global__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../lib/get-global */ 5120);
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../storage */ 2890);
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../storage */ 6054);
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../storage */ 6253);
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../storage */ 5790);
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../storage */ 8119);
/* harmony import */ var _lib_global_analytics_helper__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ../../lib/global-analytics-helper */ 6091);
/* harmony import */ var _buffer__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../buffer */ 8347);
/* harmony import */ var _plugins_segmentio__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../plugins/segmentio */ 9099);



















var deprecationWarning = 'This is being deprecated and will be not be available in future releases of Analytics JS';
// reference any pre-existing "analytics" object so a user can restore the reference
var global = (0,_lib_get_global__WEBPACK_IMPORTED_MODULE_0__.getGlobal)();
var _analytics = global === null || global === void 0 ? void 0 : global.analytics;
function createDefaultQueue(name, retryQueue, disablePersistance) {
    if (retryQueue === void 0) { retryQueue = false; }
    if (disablePersistance === void 0) { disablePersistance = false; }
    var maxAttempts = retryQueue ? 10 : 1;
    var priorityQueue = disablePersistance
        ? new _lib_priority_queue__WEBPACK_IMPORTED_MODULE_1__.PriorityQueue(maxAttempts, [])
        : new _lib_priority_queue_persisted__WEBPACK_IMPORTED_MODULE_2__.PersistedPriorityQueue(maxAttempts, name);
    return new _queue_event_queue__WEBPACK_IMPORTED_MODULE_3__.EventQueue(priorityQueue);
}
/**
 * The public settings that are set on the analytics instance
 */
var AnalyticsInstanceSettings = /** @class */ (function () {
    function AnalyticsInstanceSettings(settings, queue) {
        var _a;
        /**
         * Auto-track specific timeout setting for legacy purposes.
         */
        this.timeout = 300;
        this._getSegmentPluginMetadata = function () { var _a; return (_a = queue.plugins.find(_plugins_segmentio__WEBPACK_IMPORTED_MODULE_4__.isSegmentPlugin)) === null || _a === void 0 ? void 0 : _a.metadata; };
        this.writeKey = settings.writeKey;
        // this is basically just to satisfy typescript / so we don't need to change the function sig of every test.
        // when loadAnalytics is called, cdnSettings will always be available.
        var emptyCDNSettings = {
            integrations: {
                'Segment.io': {
                    apiKey: '',
                },
            },
        };
        this.cdnSettings = (_a = settings.cdnSettings) !== null && _a !== void 0 ? _a : emptyCDNSettings;
        this.cdnURL = settings.cdnURL;
    }
    Object.defineProperty(AnalyticsInstanceSettings.prototype, "apiHost", {
        get: function () {
            var _a, _b;
            return (_b = (_a = this._getSegmentPluginMetadata) === null || _a === void 0 ? void 0 : _a.call(this)) === null || _b === void 0 ? void 0 : _b.apiHost;
        },
        enumerable: false,
        configurable: true
    });
    return AnalyticsInstanceSettings;
}());

/* analytics-classic stubs */
function _stub() {
    console.warn(deprecationWarning);
}
var Analytics = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__extends)(Analytics, _super);
    function Analytics(settings, options, queue, user, group) {
        var _this = this;
        var _a, _b;
        _this = _super.call(this) || this;
        _this._debug = false;
        _this.initialized = false;
        _this.user = function () {
            return _this._user;
        };
        _this.init = _this.initialize.bind(_this);
        _this.log = _stub;
        _this.addIntegrationMiddleware = _stub;
        _this.listeners = _stub;
        _this.addEventListener = _stub;
        _this.removeAllListeners = _stub;
        _this.removeListener = _stub;
        _this.removeEventListener = _stub;
        _this.hasListeners = _stub;
        _this.add = _stub;
        _this.addIntegration = _stub;
        var cookieOptions = options === null || options === void 0 ? void 0 : options.cookie;
        var disablePersistance = (_a = options === null || options === void 0 ? void 0 : options.disableClientPersistence) !== null && _a !== void 0 ? _a : false;
        _this.queue =
            queue !== null && queue !== void 0 ? queue : createDefaultQueue("".concat(settings.writeKey, ":event-queue"), options === null || options === void 0 ? void 0 : options.retryQueue, disablePersistance);
        _this.settings = new AnalyticsInstanceSettings(settings, _this.queue);
        var storageSetting = options === null || options === void 0 ? void 0 : options.storage;
        _this._universalStorage = _this.createStore(disablePersistance, storageSetting, cookieOptions);
        _this._user =
            user !== null && user !== void 0 ? user : new _user__WEBPACK_IMPORTED_MODULE_6__.User((0,tslib__WEBPACK_IMPORTED_MODULE_5__.__assign)({ persist: !disablePersistance, storage: options === null || options === void 0 ? void 0 : options.storage }, options === null || options === void 0 ? void 0 : options.user), cookieOptions).load();
        _this._group =
            group !== null && group !== void 0 ? group : new _user__WEBPACK_IMPORTED_MODULE_6__.Group((0,tslib__WEBPACK_IMPORTED_MODULE_5__.__assign)({ persist: !disablePersistance, storage: options === null || options === void 0 ? void 0 : options.storage }, options === null || options === void 0 ? void 0 : options.group), cookieOptions).load();
        _this.eventFactory = new _events__WEBPACK_IMPORTED_MODULE_7__.EventFactory(_this._user);
        _this.integrations = (_b = options === null || options === void 0 ? void 0 : options.integrations) !== null && _b !== void 0 ? _b : {};
        _this.options = options !== null && options !== void 0 ? options : {};
        (0,_lib_bind_all__WEBPACK_IMPORTED_MODULE_8__["default"])(_this);
        return _this;
    }
    /**
     * Creates the storage system based on the settings received
     * @returns Storage
     */
    Analytics.prototype.createStore = function (disablePersistance, storageSetting, cookieOptions) {
        // DisablePersistance option overrides all, no storage will be used outside of memory even if specified
        if (disablePersistance) {
            return new _storage__WEBPACK_IMPORTED_MODULE_9__.UniversalStorage([new _storage__WEBPACK_IMPORTED_MODULE_10__.MemoryStorage()]);
        }
        else {
            if (storageSetting) {
                if ((0,_storage__WEBPACK_IMPORTED_MODULE_11__.isArrayOfStoreType)(storageSetting)) {
                    // We will create the store with the priority for customer settings
                    return new _storage__WEBPACK_IMPORTED_MODULE_9__.UniversalStorage((0,_storage__WEBPACK_IMPORTED_MODULE_12__.initializeStorages)((0,_storage__WEBPACK_IMPORTED_MODULE_12__.applyCookieOptions)(storageSetting.stores, cookieOptions)));
                }
            }
        }
        // We default to our multi storage with priority
        return new _storage__WEBPACK_IMPORTED_MODULE_9__.UniversalStorage((0,_storage__WEBPACK_IMPORTED_MODULE_12__.initializeStorages)([
            _storage__WEBPACK_IMPORTED_MODULE_13__.StoreType.LocalStorage,
            {
                name: _storage__WEBPACK_IMPORTED_MODULE_13__.StoreType.Cookie,
                settings: cookieOptions,
            },
            _storage__WEBPACK_IMPORTED_MODULE_13__.StoreType.Memory,
        ]));
    };
    Object.defineProperty(Analytics.prototype, "storage", {
        get: function () {
            return this._universalStorage;
        },
        enumerable: false,
        configurable: true
    });
    Analytics.prototype.track = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            var pageCtx, _a, name, data, opts, cb, segmentEvent;
            var _this = this;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_b) {
                pageCtx = (0,_buffer__WEBPACK_IMPORTED_MODULE_14__.popPageContext)(args);
                _a = _arguments_resolver__WEBPACK_IMPORTED_MODULE_15__.resolveArguments.apply(void 0, args), name = _a[0], data = _a[1], opts = _a[2], cb = _a[3];
                segmentEvent = this.eventFactory.track(name, data, opts, this.integrations, pageCtx);
                return [2 /*return*/, this._dispatch(segmentEvent, cb).then(function (ctx) {
                        _this.emit('track', name, ctx.event.properties, ctx.event.options);
                        return ctx;
                    })];
            });
        });
    };
    Analytics.prototype.page = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            var pageCtx, _a, category, page, properties, options, callback, segmentEvent;
            var _this = this;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_b) {
                pageCtx = (0,_buffer__WEBPACK_IMPORTED_MODULE_14__.popPageContext)(args);
                _a = _arguments_resolver__WEBPACK_IMPORTED_MODULE_15__.resolvePageArguments.apply(void 0, args), category = _a[0], page = _a[1], properties = _a[2], options = _a[3], callback = _a[4];
                segmentEvent = this.eventFactory.page(category, page, properties, options, this.integrations, pageCtx);
                return [2 /*return*/, this._dispatch(segmentEvent, callback).then(function (ctx) {
                        _this.emit('page', category, page, ctx.event.properties, ctx.event.options);
                        return ctx;
                    })];
            });
        });
    };
    Analytics.prototype.identify = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            var pageCtx, _a, id, _traits, options, callback, segmentEvent;
            var _this = this;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_b) {
                pageCtx = (0,_buffer__WEBPACK_IMPORTED_MODULE_14__.popPageContext)(args);
                _a = (0,_arguments_resolver__WEBPACK_IMPORTED_MODULE_15__.resolveUserArguments)(this._user).apply(void 0, args), id = _a[0], _traits = _a[1], options = _a[2], callback = _a[3];
                this._user.identify(id, _traits);
                segmentEvent = this.eventFactory.identify(this._user.id(), this._user.traits(), options, this.integrations, pageCtx);
                return [2 /*return*/, this._dispatch(segmentEvent, callback).then(function (ctx) {
                        _this.emit('identify', ctx.event.userId, ctx.event.traits, ctx.event.options);
                        return ctx;
                    })];
            });
        });
    };
    Analytics.prototype.group = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var pageCtx = (0,_buffer__WEBPACK_IMPORTED_MODULE_14__.popPageContext)(args);
        if (args.length === 0) {
            return this._group;
        }
        var _a = (0,_arguments_resolver__WEBPACK_IMPORTED_MODULE_15__.resolveUserArguments)(this._group).apply(void 0, args), id = _a[0], _traits = _a[1], options = _a[2], callback = _a[3];
        this._group.identify(id, _traits);
        var groupId = this._group.id();
        var groupTraits = this._group.traits();
        var segmentEvent = this.eventFactory.group(groupId, groupTraits, options, this.integrations, pageCtx);
        return this._dispatch(segmentEvent, callback).then(function (ctx) {
            _this.emit('group', ctx.event.groupId, ctx.event.traits, ctx.event.options);
            return ctx;
        });
    };
    Analytics.prototype.alias = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            var pageCtx, _a, to, from, options, callback, segmentEvent;
            var _this = this;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_b) {
                pageCtx = (0,_buffer__WEBPACK_IMPORTED_MODULE_14__.popPageContext)(args);
                _a = _arguments_resolver__WEBPACK_IMPORTED_MODULE_15__.resolveAliasArguments.apply(void 0, args), to = _a[0], from = _a[1], options = _a[2], callback = _a[3];
                segmentEvent = this.eventFactory.alias(to, from, options, this.integrations, pageCtx);
                return [2 /*return*/, this._dispatch(segmentEvent, callback).then(function (ctx) {
                        _this.emit('alias', to, from, ctx.event.options);
                        return ctx;
                    })];
            });
        });
    };
    Analytics.prototype.screen = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            var pageCtx, _a, category, page, properties, options, callback, segmentEvent;
            var _this = this;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_b) {
                pageCtx = (0,_buffer__WEBPACK_IMPORTED_MODULE_14__.popPageContext)(args);
                _a = _arguments_resolver__WEBPACK_IMPORTED_MODULE_15__.resolvePageArguments.apply(void 0, args), category = _a[0], page = _a[1], properties = _a[2], options = _a[3], callback = _a[4];
                segmentEvent = this.eventFactory.screen(category, page, properties, options, this.integrations, pageCtx);
                return [2 /*return*/, this._dispatch(segmentEvent, callback).then(function (ctx) {
                        _this.emit('screen', category, page, ctx.event.properties, ctx.event.options);
                        return ctx;
                    })];
            });
        });
    };
    Analytics.prototype.trackClick = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            var autotrack;
            var _a;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, __webpack_require__.e(/*! import() | auto-track */ "auto-track").then(__webpack_require__.bind(__webpack_require__, /*! ../auto-track */ 4875))];
                    case 1:
                        autotrack = _b.sent();
                        return [2 /*return*/, (_a = autotrack.link).call.apply(_a, (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__spreadArray)([this], args, false))];
                }
            });
        });
    };
    Analytics.prototype.trackLink = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            var autotrack;
            var _a;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, __webpack_require__.e(/*! import() | auto-track */ "auto-track").then(__webpack_require__.bind(__webpack_require__, /*! ../auto-track */ 4875))];
                    case 1:
                        autotrack = _b.sent();
                        return [2 /*return*/, (_a = autotrack.link).call.apply(_a, (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__spreadArray)([this], args, false))];
                }
            });
        });
    };
    Analytics.prototype.trackSubmit = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            var autotrack;
            var _a;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, __webpack_require__.e(/*! import() | auto-track */ "auto-track").then(__webpack_require__.bind(__webpack_require__, /*! ../auto-track */ 4875))];
                    case 1:
                        autotrack = _b.sent();
                        return [2 /*return*/, (_a = autotrack.form).call.apply(_a, (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__spreadArray)([this], args, false))];
                }
            });
        });
    };
    Analytics.prototype.trackForm = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            var autotrack;
            var _a;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, __webpack_require__.e(/*! import() | auto-track */ "auto-track").then(__webpack_require__.bind(__webpack_require__, /*! ../auto-track */ 4875))];
                    case 1:
                        autotrack = _b.sent();
                        return [2 /*return*/, (_a = autotrack.form).call.apply(_a, (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__spreadArray)([this], args, false))];
                }
            });
        });
    };
    Analytics.prototype.register = function () {
        var plugins = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            plugins[_i] = arguments[_i];
        }
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            var ctx, registrations;
            var _this = this;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = _context__WEBPACK_IMPORTED_MODULE_16__.Context.system();
                        registrations = plugins.map(function (xt) {
                            return _this.queue.register(ctx, xt, _this);
                        });
                        return [4 /*yield*/, Promise.all(registrations)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, ctx];
                }
            });
        });
    };
    Analytics.prototype.deregister = function () {
        var plugins = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            plugins[_i] = arguments[_i];
        }
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            var ctx, deregistrations;
            var _this = this;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = _context__WEBPACK_IMPORTED_MODULE_16__.Context.system();
                        deregistrations = plugins.map(function (pl) {
                            var plugin = _this.queue.plugins.find(function (p) { return p.name === pl; });
                            if (plugin) {
                                return _this.queue.deregister(ctx, plugin, _this);
                            }
                            else {
                                ctx.log('warn', "plugin ".concat(pl, " not found"));
                            }
                        });
                        return [4 /*yield*/, Promise.all(deregistrations)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, ctx];
                }
            });
        });
    };
    Analytics.prototype.debug = function (toggle) {
        // Make sure legacy ajs debug gets turned off if it was enabled before upgrading.
        if (toggle === false && localStorage.getItem('debug')) {
            localStorage.removeItem('debug');
        }
        this._debug = toggle;
        return this;
    };
    Analytics.prototype.reset = function () {
        this._user.reset();
        this._group.reset();
        this.emit('reset');
    };
    Analytics.prototype.timeout = function (timeout) {
        this.settings.timeout = timeout;
    };
    Analytics.prototype._dispatch = function (event, callback) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            var ctx;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_a) {
                ctx = new _context__WEBPACK_IMPORTED_MODULE_16__.Context(event);
                ctx.stats.increment('analytics_js.invoke', 1, [event.type]);
                if ((0,_connection__WEBPACK_IMPORTED_MODULE_17__.isOffline)() && !this.options.retryQueue) {
                    return [2 /*return*/, ctx];
                }
                return [2 /*return*/, (0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_18__.dispatch)(ctx, this.queue, this, {
                        callback: callback,
                        debug: this._debug,
                        timeout: this.settings.timeout,
                    })];
            });
        });
    };
    Analytics.prototype.addSourceMiddleware = function (fn) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            var _this = this;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.queue.criticalTasks.run(function () { return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(_this, void 0, void 0, function () {
                            var sourceMiddlewarePlugin, integrations, plugin;
                            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ../../plugins/middleware */ 1418))];
                                    case 1:
                                        sourceMiddlewarePlugin = (_a.sent()).sourceMiddlewarePlugin;
                                        integrations = {};
                                        this.queue.plugins.forEach(function (plugin) {
                                            if (plugin.type === 'destination') {
                                                return (integrations[plugin.name] = true);
                                            }
                                        });
                                        plugin = sourceMiddlewarePlugin(fn, integrations);
                                        return [4 /*yield*/, this.register(plugin)];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this];
                }
            });
        });
    };
    /* TODO: This does not have to return a promise? */
    Analytics.prototype.addDestinationMiddleware = function (integrationName) {
        var middlewares = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            middlewares[_i - 1] = arguments[_i];
        }
        this.queue.plugins
            .filter(_plugin__WEBPACK_IMPORTED_MODULE_19__.isDestinationPluginWithAddMiddleware)
            .forEach(function (p) {
            if (integrationName === '*' ||
                p.name.toLowerCase() === integrationName.toLowerCase()) {
                p.addMiddleware.apply(p, middlewares);
            }
        });
        return Promise.resolve(this);
    };
    Analytics.prototype.setAnonymousId = function (id) {
        return this._user.anonymousId(id);
    };
    Analytics.prototype.queryString = function (query) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            var queryString;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.options.useQueryString === false) {
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, __webpack_require__.e(/*! import() | queryString */ "queryString").then(__webpack_require__.bind(__webpack_require__, /*! ../query-string */ 4247))];
                    case 1:
                        queryString = (_a.sent()).queryString;
                        return [2 /*return*/, queryString(this, query)];
                }
            });
        });
    };
    /**
     * @deprecated This function does not register a destination plugin.
     *
     * Instantiates a legacy Analytics.js destination.
     *
     * This function does not register the destination as an Analytics.JS plugin,
     * all the it does it to invoke the factory function back.
     */
    Analytics.prototype.use = function (legacyPluginFactory) {
        legacyPluginFactory(this);
        return this;
    };
    Analytics.prototype.ready = function (callback) {
        if (callback === void 0) { callback = function (res) { return res; }; }
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_a) {
                return [2 /*return*/, Promise.all(this.queue.plugins.map(function (i) { return (i.ready ? i.ready() : Promise.resolve()); })).then(function (res) {
                        callback(res);
                        return res;
                    })];
            });
        });
    };
    // analytics-classic api
    Analytics.prototype.noConflict = function () {
        console.warn(deprecationWarning);
        (0,_lib_global_analytics_helper__WEBPACK_IMPORTED_MODULE_20__.setGlobalAnalytics)(_analytics !== null && _analytics !== void 0 ? _analytics : this);
        return this;
    };
    Analytics.prototype.normalize = function (msg) {
        console.warn(deprecationWarning);
        return this.eventFactory['normalize'](msg);
    };
    Object.defineProperty(Analytics.prototype, "failedInitializations", {
        get: function () {
            console.warn(deprecationWarning);
            return this.queue.failedInitializations;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Analytics.prototype, "VERSION", {
        get: function () {
            return _generated_version__WEBPACK_IMPORTED_MODULE_21__.version;
        },
        enumerable: false,
        configurable: true
    });
    /* @deprecated - noop */
    Analytics.prototype.initialize = function (_settings, _options) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_a) {
                console.warn(deprecationWarning);
                return [2 /*return*/, Promise.resolve(this)];
            });
        });
    };
    Analytics.prototype.pageview = function (url) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, Promise, function () {
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.warn(deprecationWarning);
                        return [4 /*yield*/, this.page({ path: url })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this];
                }
            });
        });
    };
    Object.defineProperty(Analytics.prototype, "plugins", {
        get: function () {
            var _a;
            console.warn(deprecationWarning);
            // @ts-expect-error
            return (_a = this._plugins) !== null && _a !== void 0 ? _a : {};
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Analytics.prototype, "Integrations", {
        get: function () {
            console.warn(deprecationWarning);
            var integrations = this.queue.plugins
                .filter(function (plugin) { return plugin.type === 'destination'; })
                .reduce(function (acc, plugin) {
                var name = "".concat(plugin.name
                    .toLowerCase()
                    .replace('.', '')
                    .split(' ')
                    .join('-'), "Integration");
                // @ts-expect-error
                var integration = window[name];
                if (!integration) {
                    return acc;
                }
                var nested = integration.Integration; // hack - Google Analytics function resides in the "Integration" field
                if (nested) {
                    acc[plugin.name] = nested;
                    return acc;
                }
                acc[plugin.name] = integration;
                return acc;
            }, {});
            return integrations;
        },
        enumerable: false,
        configurable: true
    });
    // snippet function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Analytics.prototype.push = function (args) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        var an = this;
        var method = args.shift();
        if (method) {
            if (!an[method])
                return;
        }
        an[method].apply(this, args);
    };
    return Analytics;
}(_segment_analytics_generic_utils__WEBPACK_IMPORTED_MODULE_22__.Emitter));

/**
 * @returns a no-op analytics instance that does not create cookies or localstorage, or send any events to segment.
 */
var NullAnalytics = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__extends)(NullAnalytics, _super);
    function NullAnalytics() {
        var _this = _super.call(this, { writeKey: '' }, { disableClientPersistence: true }) || this;
        _this.initialized = true;
        return _this;
    }
    return NullAnalytics;
}(Analytics));



/***/ }),

/***/ 7228:
/*!**********************************************!*\
  !*** ./src/core/arguments-resolver/index.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolveAliasArguments: () => (/* binding */ resolveAliasArguments),
/* harmony export */   resolveArguments: () => (/* binding */ resolveArguments),
/* harmony export */   resolvePageArguments: () => (/* binding */ resolvePageArguments),
/* harmony export */   resolveUserArguments: () => (/* binding */ resolveUserArguments)
/* harmony export */ });
/* harmony import */ var _segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @segment/analytics-core */ 441);

/**
 * Helper for the track method
 */
function resolveArguments(eventName, properties, options, callback) {
    var _a;
    var args = [eventName, properties, options, callback];
    var name = (0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(eventName) ? eventName.event : eventName;
    if (!name || !(0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isString)(name)) {
        throw new Error('Event missing');
    }
    var data = (0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(eventName)
        ? (_a = eventName.properties) !== null && _a !== void 0 ? _a : {}
        : (0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(properties)
            ? properties
            : {};
    var opts = {};
    if (!(0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isFunction)(options)) {
        opts = options !== null && options !== void 0 ? options : {};
    }
    if ((0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(eventName) && !(0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isFunction)(properties)) {
        opts = properties !== null && properties !== void 0 ? properties : {};
    }
    var cb = args.find(_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isFunction);
    return [name, data, opts, cb];
}
/**
 * Helper for page, screen methods
 */
function resolvePageArguments(category, name, properties, options, callback) {
    var resolvedProperties;
    var resolvedOptions;
    var resolvedCategory = null;
    var resolvedName = null;
    var args = [category, name, properties, options, callback];
    // The legacy logic is basically:
    // - If there is a string, it's the name
    // - If there are two strings, it's category and name
    var strings = args.filter(_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isString);
    if (strings.length === 1) {
        if ((0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isString)(args[1])) {
            resolvedName = args[1];
            resolvedCategory = null;
        }
        else {
            resolvedName = strings[0];
            resolvedCategory = null;
        }
    }
    else if (strings.length === 2) {
        if (typeof args[0] === 'string') {
            resolvedCategory = args[0];
        }
        if (typeof args[1] === 'string') {
            resolvedName = args[1];
        }
    }
    // handle: analytics.page('category', 'name', properties, options, callback)
    var resolvedCallback = args.find(_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isFunction);
    // handle:
    // - analytics.page('name')
    // - analytics.page('category', 'name')
    // - analytics.page(properties)
    // - analytics.page(properties, options)
    // - analytics.page('name', properties)
    // - analytics.page('name', properties, options)
    // - analytics.page('category', 'name', properties, options)
    // - analytics.page('category', 'name', properties, options, callback)
    // - analytics.page('category', 'name', callback)
    // - analytics.page(callback), etc
    // The legacy logic is basically:
    // - If there is a plain object, it's the properties
    // - If there are two plain objects, it's properties and options
    var objects = args.filter(_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isPlainObject);
    if (objects.length === 1) {
        if ((0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(args[2])) {
            resolvedOptions = {};
            resolvedProperties = args[2];
        }
        else if ((0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(args[3])) {
            resolvedProperties = {};
            resolvedOptions = args[3];
        }
        else {
            resolvedProperties = objects[0];
            resolvedOptions = {};
        }
    }
    else if (objects.length === 2) {
        resolvedProperties = objects[0];
        resolvedOptions = objects[1];
    }
    return [
        resolvedCategory,
        resolvedName,
        (resolvedProperties !== null && resolvedProperties !== void 0 ? resolvedProperties : (resolvedProperties = {})),
        (resolvedOptions !== null && resolvedOptions !== void 0 ? resolvedOptions : (resolvedOptions = {})),
        resolvedCallback,
    ];
}
/**
 * Helper for group, identify methods
 */
var resolveUserArguments = function (user) {
    return function () {
        var _a, _b, _c;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var values = {};
        // It's a stack so it's reversed so that we go through each of the expected arguments
        var orderStack = [
            'callback',
            'options',
            'traits',
            'id',
        ];
        // Read each argument and eval the possible values here
        for (var _d = 0, args_1 = args; _d < args_1.length; _d++) {
            var arg = args_1[_d];
            var current = orderStack.pop();
            if (current === 'id') {
                if ((0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isString)(arg) || (0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isNumber)(arg)) {
                    values.id = arg.toString();
                    continue;
                }
                if (arg === null || arg === undefined) {
                    continue;
                }
                // First argument should always be the id, if it is not a valid value we can skip it
                current = orderStack.pop();
            }
            // Traits and Options
            if ((current === 'traits' || current === 'options') &&
                (arg === null || arg === undefined || (0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(arg))) {
                values[current] = arg;
            }
            // Callback
            if ((0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isFunction)(arg)) {
                values.callback = arg;
                break; // This is always the last argument
            }
        }
        return [
            (_a = values.id) !== null && _a !== void 0 ? _a : user.id(),
            ((_b = values.traits) !== null && _b !== void 0 ? _b : {}),
            (_c = values.options) !== null && _c !== void 0 ? _c : {},
            values.callback,
        ];
    };
};
/**
 * Helper for alias method
 */
function resolveAliasArguments(to, from, options, callback) {
    if ((0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isNumber)(to))
        to = to.toString(); // Legacy behaviour - allow integers for alias calls
    if ((0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isNumber)(from))
        from = from.toString();
    var args = [to, from, options, callback];
    var _a = args.filter(_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isString), _b = _a[0], aliasTo = _b === void 0 ? to : _b, _c = _a[1], aliasFrom = _c === void 0 ? null : _c;
    var _d = args.filter(_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)[0], opts = _d === void 0 ? {} : _d;
    var resolvedCallback = args.find(_segment_analytics_core__WEBPACK_IMPORTED_MODULE_0__.isFunction);
    return [aliasTo, aliasFrom, opts, resolvedCallback];
}


/***/ }),

/***/ 8347:
/*!**********************************!*\
  !*** ./src/core/buffer/index.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AnalyticsBuffered: () => (/* binding */ AnalyticsBuffered),
/* harmony export */   PreInitMethodCall: () => (/* binding */ PreInitMethodCall),
/* harmony export */   PreInitMethodCallBuffer: () => (/* binding */ PreInitMethodCallBuffer),
/* harmony export */   callAnalyticsMethod: () => (/* binding */ callAnalyticsMethod),
/* harmony export */   flushAddSourceMiddleware: () => (/* binding */ flushAddSourceMiddleware),
/* harmony export */   flushAnalyticsCallsInNewTask: () => (/* binding */ flushAnalyticsCallsInNewTask),
/* harmony export */   flushOn: () => (/* binding */ flushOn),
/* harmony export */   flushRegister: () => (/* binding */ flushRegister),
/* harmony export */   flushSetAnonymousID: () => (/* binding */ flushSetAnonymousID),
/* harmony export */   hasBufferedPageContextAsLastArg: () => (/* binding */ hasBufferedPageContextAsLastArg),
/* harmony export */   popPageContext: () => (/* binding */ popPageContext)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _lib_is_thenable__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../lib/is-thenable */ 2842);
/* harmony import */ var _generated_version__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../generated/version */ 6452);
/* harmony import */ var _lib_global_analytics_helper__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../lib/global-analytics-helper */ 6091);
/* harmony import */ var _page__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../page */ 8838);
/* harmony import */ var _lib_version_type__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../lib/version-type */ 3831);






var flushSyncAnalyticsCalls = function (name, analytics, buffer) {
    buffer.getAndRemove(name).forEach(function (c) {
        // While the underlying methods are synchronous, the callAnalyticsMethod returns a promise,
        // which normalizes success and error states between async and non-async methods, with no perf penalty.
        callAnalyticsMethod(analytics, c).catch(console.error);
    });
};
var flushAddSourceMiddleware = function (analytics, buffer) { return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(void 0, void 0, void 0, function () {
    var _i, _a, c;
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_b) {
        switch (_b.label) {
            case 0:
                _i = 0, _a = buffer.getAndRemove('addSourceMiddleware');
                _b.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 4];
                c = _a[_i];
                return [4 /*yield*/, callAnalyticsMethod(analytics, c).catch(console.error)];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 *  Flush register plugin
 */
var flushRegister = function (analytics, buffer) { return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(void 0, void 0, void 0, function () {
    var _i, _a, c;
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_b) {
        switch (_b.label) {
            case 0:
                _i = 0, _a = buffer.getAndRemove('register');
                _b.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 4];
                c = _a[_i];
                return [4 /*yield*/, callAnalyticsMethod(analytics, c).catch(console.error)];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/];
        }
    });
}); };
var flushOn = flushSyncAnalyticsCalls.bind(undefined, 'on');
var flushSetAnonymousID = flushSyncAnalyticsCalls.bind(undefined, 'setAnonymousId');
var flushAnalyticsCallsInNewTask = function (analytics, buffer) {
    ;
    Object.keys(buffer.calls).forEach(function (m) {
        buffer.getAndRemove(m).forEach(function (c) {
            // No one remembers why this event loop optimization is/was neccessary. Lost to history.
            setTimeout(function () {
                callAnalyticsMethod(analytics, c).catch(console.error);
            }, 0);
        });
    });
};
var popPageContext = function (args) {
    if (hasBufferedPageContextAsLastArg(args)) {
        var ctx = args.pop();
        return (0,_page__WEBPACK_IMPORTED_MODULE_1__.createPageContext)(ctx);
    }
};
var hasBufferedPageContextAsLastArg = function (args) {
    var lastArg = args[args.length - 1];
    return (0,_page__WEBPACK_IMPORTED_MODULE_1__.isBufferedPageContext)(lastArg);
};
/**
 *  Represents a buffered method call that occurred before initialization.
 */
var PreInitMethodCall = /** @class */ (function () {
    function PreInitMethodCall(method, args, resolve, reject) {
        if (resolve === void 0) { resolve = function () { }; }
        if (reject === void 0) { reject = console.error; }
        this.method = method;
        this.resolve = resolve;
        this.reject = reject;
        this.called = false;
        this.args = args;
    }
    return PreInitMethodCall;
}());

/**
 *  Represents any and all the buffered method calls that occurred before initialization.
 */
var PreInitMethodCallBuffer = /** @class */ (function () {
    function PreInitMethodCallBuffer() {
        var calls = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            calls[_i] = arguments[_i];
        }
        this._callMap = {};
        this.add.apply(this, calls);
    }
    Object.defineProperty(PreInitMethodCallBuffer.prototype, "calls", {
        /**
         * Pull any buffered method calls from the window object, and use them to hydrate the instance buffer.
         */
        get: function () {
            this._pushSnippetWindowBuffer();
            return this._callMap;
        },
        set: function (calls) {
            this._callMap = calls;
        },
        enumerable: false,
        configurable: true
    });
    PreInitMethodCallBuffer.prototype.get = function (methodName) {
        var _a;
        return ((_a = this.calls[methodName]) !== null && _a !== void 0 ? _a : []);
    };
    /**
     * Get all buffered method calls for a given method name, and clear them from the buffer.
     */
    PreInitMethodCallBuffer.prototype.getAndRemove = function (methodName) {
        var calls = this.get(methodName);
        this.calls[methodName] = [];
        return calls;
    };
    PreInitMethodCallBuffer.prototype.add = function () {
        var _this = this;
        var calls = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            calls[_i] = arguments[_i];
        }
        calls.forEach(function (call) {
            var eventsExpectingPageContext = [
                'track',
                'screen',
                'alias',
                'group',
                'page',
                'identify',
            ];
            if (eventsExpectingPageContext.includes(call.method) &&
                !hasBufferedPageContextAsLastArg(call.args)) {
                call.args = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spreadArray)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spreadArray)([], call.args, true), [(0,_page__WEBPACK_IMPORTED_MODULE_1__.getDefaultBufferedPageContext)()], false);
            }
            if (_this.calls[call.method]) {
                _this.calls[call.method].push(call);
            }
            else {
                _this.calls[call.method] = [call];
            }
        });
    };
    PreInitMethodCallBuffer.prototype.clear = function () {
        // clear calls in the global snippet buffered array.
        this._pushSnippetWindowBuffer();
        // clear calls in this instance
        this.calls = {};
    };
    PreInitMethodCallBuffer.prototype.toArray = function () {
        var _a;
        return (_a = []).concat.apply(_a, Object.values(this.calls));
    };
    /**
     * Fetch the buffered method calls from the window object,
     * normalize them, and use them to hydrate the buffer.
     * This removes existing buffered calls from the window object.
     */
    PreInitMethodCallBuffer.prototype._pushSnippetWindowBuffer = function () {
        // if this is the npm version, we don't want to read from the window object.
        // This avoids namespace conflicts if there is a seperate analytics library on the page.
        if ((0,_lib_version_type__WEBPACK_IMPORTED_MODULE_2__.getVersionType)() === 'npm') {
            return undefined;
        }
        var wa = (0,_lib_global_analytics_helper__WEBPACK_IMPORTED_MODULE_3__.getGlobalAnalytics)();
        if (!Array.isArray(wa))
            return undefined;
        var buffered = wa.splice(0, wa.length);
        var calls = buffered.map(function (_a) {
            var methodName = _a[0], args = _a.slice(1);
            return new PreInitMethodCall(methodName, args);
        });
        this.add.apply(this, calls);
    };
    return PreInitMethodCallBuffer;
}());

/**
 *  Call method and mark as "called"
 *  This function should never throw an error
 */
function callAnalyticsMethod(analytics, call) {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
        var result, err_1;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (call.called) {
                        return [2 /*return*/, undefined];
                    }
                    call.called = true;
                    result = analytics[call.method].apply(analytics, call.args);
                    if (!(0,_lib_is_thenable__WEBPACK_IMPORTED_MODULE_4__.isThenable)(result)) return [3 /*break*/, 2];
                    // do not defer for non-async methods
                    return [4 /*yield*/, result];
                case 1:
                    // do not defer for non-async methods
                    _a.sent();
                    _a.label = 2;
                case 2:
                    call.resolve(result);
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    call.reject(err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
var AnalyticsBuffered = /** @class */ (function () {
    function AnalyticsBuffered(loader) {
        var _this = this;
        this.trackSubmit = this._createMethod('trackSubmit');
        this.trackClick = this._createMethod('trackClick');
        this.trackLink = this._createMethod('trackLink');
        this.pageView = this._createMethod('pageview');
        this.identify = this._createMethod('identify');
        this.reset = this._createMethod('reset');
        this.group = this._createMethod('group');
        this.track = this._createMethod('track');
        this.ready = this._createMethod('ready');
        this.alias = this._createMethod('alias');
        this.debug = this._createChainableMethod('debug');
        this.page = this._createMethod('page');
        this.once = this._createChainableMethod('once');
        this.off = this._createChainableMethod('off');
        this.on = this._createChainableMethod('on');
        this.addSourceMiddleware = this._createMethod('addSourceMiddleware');
        this.setAnonymousId = this._createMethod('setAnonymousId');
        this.addDestinationMiddleware = this._createMethod('addDestinationMiddleware');
        this.screen = this._createMethod('screen');
        this.register = this._createMethod('register');
        this.deregister = this._createMethod('deregister');
        this.user = this._createMethod('user');
        this.VERSION = _generated_version__WEBPACK_IMPORTED_MODULE_5__.version;
        this._preInitBuffer = new PreInitMethodCallBuffer();
        this._promise = loader(this._preInitBuffer);
        this._promise
            .then(function (_a) {
            var ajs = _a[0], ctx = _a[1];
            _this.instance = ajs;
            _this.ctx = ctx;
        })
            .catch(function () {
            // intentionally do nothing...
            // this result of this promise will be caught by the 'catch' block on this class.
        });
    }
    AnalyticsBuffered.prototype.then = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (_a = this._promise).then.apply(_a, args);
    };
    AnalyticsBuffered.prototype.catch = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (_a = this._promise).catch.apply(_a, args);
    };
    AnalyticsBuffered.prototype.finally = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (_a = this._promise).finally.apply(_a, args);
    };
    AnalyticsBuffered.prototype._createMethod = function (methodName) {
        var _this = this;
        return function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (_this.instance) {
                var result = (_a = _this.instance)[methodName].apply(_a, args);
                return Promise.resolve(result);
            }
            return new Promise(function (resolve, reject) {
                _this._preInitBuffer.add(new PreInitMethodCall(methodName, args, resolve, reject));
            });
        };
    };
    /**
     *  These are for methods that where determining when the method gets "flushed" is not important.
     *  These methods will resolve when analytics is fully initialized, and return type (other than Analytics)will not be available.
     */
    AnalyticsBuffered.prototype._createChainableMethod = function (methodName) {
        var _this = this;
        return function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (_this.instance) {
                void (_a = _this.instance)[methodName].apply(_a, args);
                return _this;
            }
            else {
                _this._preInitBuffer.add(new PreInitMethodCall(methodName, args));
            }
            return _this;
        };
    };
    return AnalyticsBuffered;
}());



/***/ }),

/***/ 6789:
/*!**************************************!*\
  !*** ./src/core/connection/index.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isOffline: () => (/* binding */ isOffline),
/* harmony export */   isOnline: () => (/* binding */ isOnline)
/* harmony export */ });
/* harmony import */ var _environment__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../environment */ 4082);

function isOnline() {
    if ((0,_environment__WEBPACK_IMPORTED_MODULE_0__.isBrowser)()) {
        return window.navigator.onLine;
    }
    return true;
}
function isOffline() {
    return !isOnline();
}


/***/ }),

/***/ 3858:
/*!*************************************!*\
  !*** ./src/core/constants/index.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SEGMENT_API_HOST: () => (/* binding */ SEGMENT_API_HOST)
/* harmony export */ });
var SEGMENT_API_HOST = 'api.segment.io/v1';


/***/ }),

/***/ 8456:
/*!***********************************!*\
  !*** ./src/core/context/index.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Context: () => (/* binding */ Context),
/* harmony export */   ContextCancelation: () => (/* reexport safe */ _segment_analytics_core__WEBPACK_IMPORTED_MODULE_2__.ContextCancelation)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _segment_analytics_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @segment/analytics-core */ 7070);
/* harmony import */ var _stats__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../stats */ 8900);



var Context = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(Context, _super);
    function Context(event, id) {
        return _super.call(this, event, id, new _stats__WEBPACK_IMPORTED_MODULE_1__.Stats()) || this;
    }
    Context.system = function () {
        return new this({ type: 'track', event: 'system' });
    };
    return Context;
}(_segment_analytics_core__WEBPACK_IMPORTED_MODULE_2__.CoreContext));




/***/ }),

/***/ 4082:
/*!***************************************!*\
  !*** ./src/core/environment/index.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isBrowser: () => (/* binding */ isBrowser),
/* harmony export */   isServer: () => (/* binding */ isServer)
/* harmony export */ });
function isBrowser() {
    return typeof window !== 'undefined';
}
function isServer() {
    return !isBrowser();
}


/***/ }),

/***/ 5644:
/*!**********************************!*\
  !*** ./src/core/events/index.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EventFactory: () => (/* binding */ EventFactory)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _lukeed_uuid__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lukeed/uuid */ 9659);
/* harmony import */ var _page__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../page */ 7579);
/* harmony import */ var _segment_analytics_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @segment/analytics-core */ 3210);





var EventFactory = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__extends)(EventFactory, _super);
    function EventFactory(user) {
        var _this = _super.call(this, {
            createMessageId: function () { return "ajs-next-".concat(Date.now(), "-").concat((0,_lukeed_uuid__WEBPACK_IMPORTED_MODULE_0__.v4)()); },
            onEventMethodCall: function (_a) {
                var options = _a.options;
                _this.maybeUpdateAnonId(options);
            },
            onFinishedEvent: function (event) {
                _this.addIdentity(event);
                return event;
            },
        }) || this;
        _this.user = user;
        return _this;
    }
    /**
     * Updates the anonymousId *globally* if it's provided in the options.
     * This should generally be done in the identify method, but some customers rely on this.
     */
    EventFactory.prototype.maybeUpdateAnonId = function (options) {
        (options === null || options === void 0 ? void 0 : options.anonymousId) && this.user.anonymousId(options.anonymousId);
    };
    /**
     * add user id / anonymous id to the event
     */
    EventFactory.prototype.addIdentity = function (event) {
        if (this.user.id()) {
            event.userId = this.user.id();
        }
        if (this.user.anonymousId()) {
            event.anonymousId = this.user.anonymousId();
        }
    };
    EventFactory.prototype.track = function (event, properties, options, integrationsOptions, pageCtx) {
        var ev = _super.prototype.track.call(this, event, properties, options, integrationsOptions);
        (0,_page__WEBPACK_IMPORTED_MODULE_2__.addPageContext)(ev, pageCtx);
        return ev;
    };
    EventFactory.prototype.page = function (category, page, properties, options, integrationsOptions, pageCtx) {
        var ev = _super.prototype.page.call(this, category, page, properties, options, integrationsOptions);
        (0,_page__WEBPACK_IMPORTED_MODULE_2__.addPageContext)(ev, pageCtx);
        return ev;
    };
    EventFactory.prototype.screen = function (category, screen, properties, options, integrationsOptions, pageCtx) {
        var ev = _super.prototype.screen.call(this, category, screen, properties, options, integrationsOptions);
        (0,_page__WEBPACK_IMPORTED_MODULE_2__.addPageContext)(ev, pageCtx);
        return ev;
    };
    EventFactory.prototype.identify = function (userId, traits, options, integrationsOptions, pageCtx) {
        var ev = _super.prototype.identify.call(this, userId, traits, options, integrationsOptions);
        (0,_page__WEBPACK_IMPORTED_MODULE_2__.addPageContext)(ev, pageCtx);
        return ev;
    };
    EventFactory.prototype.group = function (groupId, traits, options, integrationsOptions, pageCtx) {
        var ev = _super.prototype.group.call(this, groupId, traits, options, integrationsOptions);
        (0,_page__WEBPACK_IMPORTED_MODULE_2__.addPageContext)(ev, pageCtx);
        return ev;
    };
    EventFactory.prototype.alias = function (to, from, options, integrationsOptions, pageCtx) {
        var ev = _super.prototype.alias.call(this, to, from, options, integrationsOptions);
        (0,_page__WEBPACK_IMPORTED_MODULE_2__.addPageContext)(ev, pageCtx);
        return ev;
    };
    return EventFactory;
}(_segment_analytics_core__WEBPACK_IMPORTED_MODULE_3__.CoreEventFactory));



/***/ }),

/***/ 4077:
/*!*************************************!*\
  !*** ./src/core/inspector/index.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   attachInspector: () => (/* binding */ attachInspector)
/* harmony export */ });
/* harmony import */ var _lib_get_global__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../lib/get-global */ 5120);
var _a;
var _b;

var env = (0,_lib_get_global__WEBPACK_IMPORTED_MODULE_0__.getGlobal)();
// The code below assumes the inspector extension will use Object.assign
// to add the inspect interface on to this object reference (unless the
// extension code ran first and has already set up the variable)
var inspectorHost = ((_a = (_b = env)['__SEGMENT_INSPECTOR__']) !== null && _a !== void 0 ? _a : (_b['__SEGMENT_INSPECTOR__'] = {}));
var attachInspector = function (analytics) { var _a; return (_a = inspectorHost.attach) === null || _a === void 0 ? void 0 : _a.call(inspectorHost, analytics); };


/***/ }),

/***/ 7579:
/*!*******************************************!*\
  !*** ./src/core/page/add-page-context.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   addPageContext: () => (/* binding */ addPageContext)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _lib_pick__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../lib/pick */ 1193);
/* harmony import */ var _segment_analytics_page_tools__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @segment/analytics-page-tools */ 8838);



/**
 * Augments a segment event with information about the current page.
 * Page information like URL changes frequently, so this is meant to be captured as close to the event call as possible.
 * Things like `userAgent` do not change, so they can be added later in the flow.
 * We prefer not to add this information to this function, as it increases the main bundle size.
 */
var addPageContext = function (event, pageCtx) {
    if (pageCtx === void 0) { pageCtx = (0,_segment_analytics_page_tools__WEBPACK_IMPORTED_MODULE_0__.getDefaultPageContext)(); }
    var evtCtx = event.context; // Context should be set earlier in the flow
    var pageContextFromEventProps;
    if (event.type === 'page') {
        pageContextFromEventProps =
            event.properties && (0,_lib_pick__WEBPACK_IMPORTED_MODULE_1__.pick)(event.properties, Object.keys(pageCtx));
        event.properties = (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)({}, pageCtx), event.properties), (event.name ? { name: event.name } : {}));
    }
    evtCtx.page = (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)({}, pageCtx), pageContextFromEventProps), evtCtx.page);
};


/***/ }),

/***/ 3742:
/*!**********************************!*\
  !*** ./src/core/plugin/index.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isDestinationPluginWithAddMiddleware: () => (/* binding */ isDestinationPluginWithAddMiddleware)
/* harmony export */ });
var isDestinationPluginWithAddMiddleware = function (plugin) {
    // FYI: segment's plugin does not currently have an 'addMiddleware' method
    return 'addMiddleware' in plugin && plugin.type === 'destination';
};


/***/ }),

/***/ 9059:
/*!*************************************************************!*\
  !*** ./src/core/query-string/gracefulDecodeURIComponent.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   gracefulDecodeURIComponent: () => (/* binding */ gracefulDecodeURIComponent)
/* harmony export */ });
/**
 * Tries to gets the unencoded version of an encoded component of a
 * Uniform Resource Identifier (URI). If input string is malformed,
 * returns it back as-is.
 *
 * Note: All occurences of the `+` character become ` ` (spaces).
 **/
function gracefulDecodeURIComponent(encodedURIComponent) {
    try {
        return decodeURIComponent(encodedURIComponent.replace(/\+/g, ' '));
    }
    catch (_a) {
        return encodedURIComponent;
    }
}


/***/ }),

/***/ 6458:
/*!***************************************!*\
  !*** ./src/core/queue/event-queue.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EventQueue: () => (/* binding */ EventQueue)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _lib_priority_queue_persisted__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../lib/priority-queue/persisted */ 9732);
/* harmony import */ var _segment_analytics_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @segment/analytics-core */ 6108);
/* harmony import */ var _connection__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../connection */ 6789);




var EventQueue = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(EventQueue, _super);
    function EventQueue(nameOrQueue) {
        return _super.call(this, typeof nameOrQueue === 'string'
            ? new _lib_priority_queue_persisted__WEBPACK_IMPORTED_MODULE_1__.PersistedPriorityQueue(4, nameOrQueue)
            : nameOrQueue) || this;
    }
    EventQueue.prototype.flush = function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                if ((0,_connection__WEBPACK_IMPORTED_MODULE_2__.isOffline)())
                    return [2 /*return*/, []];
                return [2 /*return*/, _super.prototype.flush.call(this)];
            });
        });
    };
    return EventQueue;
}(_segment_analytics_core__WEBPACK_IMPORTED_MODULE_3__.CoreEventQueue));



/***/ }),

/***/ 8900:
/*!*********************************!*\
  !*** ./src/core/stats/index.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Stats: () => (/* binding */ Stats)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _segment_analytics_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @segment/analytics-core */ 4034);
/* harmony import */ var _remote_metrics__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./remote-metrics */ 148);



var remoteMetrics;
var Stats = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(Stats, _super);
    function Stats() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Stats.initRemoteMetrics = function (options) {
        remoteMetrics = new _remote_metrics__WEBPACK_IMPORTED_MODULE_1__.RemoteMetrics(options);
    };
    Stats.prototype.increment = function (metric, by, tags) {
        _super.prototype.increment.call(this, metric, by, tags);
        remoteMetrics === null || remoteMetrics === void 0 ? void 0 : remoteMetrics.increment(metric, tags !== null && tags !== void 0 ? tags : []);
    };
    return Stats;
}(_segment_analytics_core__WEBPACK_IMPORTED_MODULE_2__.CoreStats));



/***/ }),

/***/ 2822:
/*!******************************************!*\
  !*** ./src/core/stats/metric-helpers.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   recordIntegrationMetric: () => (/* binding */ recordIntegrationMetric)
/* harmony export */ });
function recordIntegrationMetric(ctx, _a) {
    var methodName = _a.methodName, integrationName = _a.integrationName, type = _a.type, _b = _a.didError, didError = _b === void 0 ? false : _b;
    ctx.stats.increment("analytics_js.integration.invoke".concat(didError ? '.error' : ''), 1, [
        "method:".concat(methodName),
        "integration_name:".concat(integrationName),
        "type:".concat(type),
    ]);
}


/***/ }),

/***/ 148:
/*!******************************************!*\
  !*** ./src/core/stats/remote-metrics.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RemoteMetrics: () => (/* binding */ RemoteMetrics)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _lib_fetch__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../lib/fetch */ 8970);
/* harmony import */ var _generated_version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../generated/version */ 6452);
/* harmony import */ var _lib_version_type__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../lib/version-type */ 3831);
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../constants */ 3858);





var createRemoteMetric = function (metric, tags, versionType) {
    var formattedTags = tags.reduce(function (acc, t) {
        var _a = t.split(':'), k = _a[0], v = _a[1];
        acc[k] = v;
        return acc;
    }, {});
    return {
        type: 'Counter',
        metric: metric,
        value: 1,
        tags: (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, formattedTags), { library: 'analytics.js', library_version: versionType === 'web' ? "next-".concat(_generated_version__WEBPACK_IMPORTED_MODULE_1__.version) : "npm:next-".concat(_generated_version__WEBPACK_IMPORTED_MODULE_1__.version) }),
    };
};
function logError(err) {
    console.error('Error sending segment performance metrics', err);
}
var RemoteMetrics = /** @class */ (function () {
    function RemoteMetrics(options) {
        var _this = this;
        var _a, _b, _c, _d, _e;
        this.host = (_a = options === null || options === void 0 ? void 0 : options.host) !== null && _a !== void 0 ? _a : _constants__WEBPACK_IMPORTED_MODULE_2__.SEGMENT_API_HOST;
        this.sampleRate = (_b = options === null || options === void 0 ? void 0 : options.sampleRate) !== null && _b !== void 0 ? _b : 1;
        this.flushTimer = (_c = options === null || options === void 0 ? void 0 : options.flushTimer) !== null && _c !== void 0 ? _c : 30 * 1000; /* 30s */
        this.maxQueueSize = (_d = options === null || options === void 0 ? void 0 : options.maxQueueSize) !== null && _d !== void 0 ? _d : 20;
        this.protocol = (_e = options === null || options === void 0 ? void 0 : options.protocol) !== null && _e !== void 0 ? _e : 'https';
        this.queue = [];
        if (this.sampleRate > 0) {
            var flushing_1 = false;
            var run_1 = function () {
                if (flushing_1) {
                    return;
                }
                flushing_1 = true;
                _this.flush().catch(logError);
                flushing_1 = false;
                setTimeout(run_1, _this.flushTimer);
            };
            run_1();
        }
    }
    RemoteMetrics.prototype.increment = function (metric, tags) {
        // All metrics are part of an allow list in Tracking API
        if (!metric.includes('analytics_js.')) {
            return;
        }
        // /m doesn't like empty tags
        if (tags.length === 0) {
            return;
        }
        if (Math.random() > this.sampleRate) {
            return;
        }
        if (this.queue.length >= this.maxQueueSize) {
            return;
        }
        var remoteMetric = createRemoteMetric(metric, tags, (0,_lib_version_type__WEBPACK_IMPORTED_MODULE_3__.getVersionType)());
        this.queue.push(remoteMetric);
        if (metric.includes('error')) {
            this.flush().catch(logError);
        }
    };
    RemoteMetrics.prototype.flush = function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            var _this = this;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.queue.length <= 0) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.send().catch(function (error) {
                                logError(error);
                                _this.sampleRate = 0;
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RemoteMetrics.prototype.send = function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            var payload, headers, url;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                payload = { series: this.queue };
                this.queue = [];
                headers = { 'Content-Type': 'text/plain' };
                url = "".concat(this.protocol, "://").concat(this.host, "/m");
                return [2 /*return*/, (0,_lib_fetch__WEBPACK_IMPORTED_MODULE_4__.fetch)(url, {
                        headers: headers,
                        body: JSON.stringify(payload),
                        method: 'POST',
                    })];
            });
        });
    };
    return RemoteMetrics;
}());



/***/ }),

/***/ 7601:
/*!*******************************************!*\
  !*** ./src/core/storage/cookieStorage.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CookieStorage: () => (/* binding */ CookieStorage)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var js_cookie__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! js-cookie */ 3478);
/* harmony import */ var _user_tld__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../user/tld */ 9894);



var ONE_YEAR = 365;
/**
 * Data storage using browser cookies
 */
var CookieStorage = /** @class */ (function () {
    function CookieStorage(options) {
        if (options === void 0) { options = CookieStorage.defaults; }
        this.options = (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, CookieStorage.defaults), options);
    }
    Object.defineProperty(CookieStorage, "defaults", {
        get: function () {
            return {
                maxage: ONE_YEAR,
                domain: (0,_user_tld__WEBPACK_IMPORTED_MODULE_2__.tld)(window.location.href),
                path: '/',
                sameSite: 'Lax',
            };
        },
        enumerable: false,
        configurable: true
    });
    CookieStorage.prototype.opts = function () {
        return {
            sameSite: this.options.sameSite,
            expires: this.options.maxage,
            domain: this.options.domain,
            path: this.options.path,
            secure: this.options.secure,
        };
    };
    CookieStorage.prototype.get = function (key) {
        var _a;
        try {
            var value = js_cookie__WEBPACK_IMPORTED_MODULE_0__["default"].get(String(key));
            if (value === undefined || value === null) {
                return null;
            }
            try {
                return (_a = JSON.parse(value)) !== null && _a !== void 0 ? _a : null;
            }
            catch (e) {
                return (value !== null && value !== void 0 ? value : null);
            }
        }
        catch (e) {
            return null;
        }
    };
    CookieStorage.prototype.set = function (key, value) {
        var storageKey = String(key);
        if (typeof value === 'string') {
            js_cookie__WEBPACK_IMPORTED_MODULE_0__["default"].set(storageKey, value, this.opts());
        }
        else if (value === null) {
            js_cookie__WEBPACK_IMPORTED_MODULE_0__["default"].remove(storageKey, this.opts());
        }
        else {
            js_cookie__WEBPACK_IMPORTED_MODULE_0__["default"].set(storageKey, JSON.stringify(value), this.opts());
        }
    };
    CookieStorage.prototype.remove = function (key) {
        return js_cookie__WEBPACK_IMPORTED_MODULE_0__["default"].remove(String(key), this.opts());
    };
    return CookieStorage;
}());



/***/ }),

/***/ 5790:
/*!***********************************!*\
  !*** ./src/core/storage/index.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CookieStorage: () => (/* reexport safe */ _cookieStorage__WEBPACK_IMPORTED_MODULE_2__.CookieStorage),
/* harmony export */   LocalStorage: () => (/* reexport safe */ _localStorage__WEBPACK_IMPORTED_MODULE_1__.LocalStorage),
/* harmony export */   MemoryStorage: () => (/* reexport safe */ _memoryStorage__WEBPACK_IMPORTED_MODULE_3__.MemoryStorage),
/* harmony export */   StoreType: () => (/* reexport safe */ _types__WEBPACK_IMPORTED_MODULE_0__.StoreType),
/* harmony export */   UniversalStorage: () => (/* reexport safe */ _universalStorage__WEBPACK_IMPORTED_MODULE_4__.UniversalStorage),
/* harmony export */   applyCookieOptions: () => (/* binding */ applyCookieOptions),
/* harmony export */   initializeStorages: () => (/* binding */ initializeStorages),
/* harmony export */   isArrayOfStoreType: () => (/* reexport safe */ _settings__WEBPACK_IMPORTED_MODULE_5__.isArrayOfStoreType),
/* harmony export */   isStoreTypeWithSettings: () => (/* reexport safe */ _settings__WEBPACK_IMPORTED_MODULE_5__.isStoreTypeWithSettings)
/* harmony export */ });
/* harmony import */ var _cookieStorage__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./cookieStorage */ 7601);
/* harmony import */ var _localStorage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./localStorage */ 6948);
/* harmony import */ var _memoryStorage__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./memoryStorage */ 6054);
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./settings */ 6253);
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./types */ 8119);
/* harmony import */ var _universalStorage__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./universalStorage */ 2890);











/**
 * Creates multiple storage systems from an array of StoreType and options
 * @param args StoreType and options
 * @returns Storage array
 */
function initializeStorages(args) {
    var storages = args.map(function (s) {
        var type;
        var settings;
        if ((0,_settings__WEBPACK_IMPORTED_MODULE_5__.isStoreTypeWithSettings)(s)) {
            type = s.name;
            settings = s.settings;
        }
        else {
            type = s;
        }
        switch (type) {
            case _types__WEBPACK_IMPORTED_MODULE_0__.StoreType.Cookie:
                return new _cookieStorage__WEBPACK_IMPORTED_MODULE_2__.CookieStorage(settings);
            case _types__WEBPACK_IMPORTED_MODULE_0__.StoreType.LocalStorage:
                return new _localStorage__WEBPACK_IMPORTED_MODULE_1__.LocalStorage();
            case _types__WEBPACK_IMPORTED_MODULE_0__.StoreType.Memory:
                return new _memoryStorage__WEBPACK_IMPORTED_MODULE_3__.MemoryStorage();
            default:
                throw new Error("Unknown Store Type: ".concat(s));
        }
    });
    return storages;
}
/**
 * Injects the CookieOptions into a the arguments for initializeStorage
 * @param storeTypes list of storeType
 * @param cookieOptions cookie Options
 * @returns arguments for initializeStorage
 */
function applyCookieOptions(storeTypes, cookieOptions) {
    return storeTypes.map(function (s) {
        if (cookieOptions && s === _types__WEBPACK_IMPORTED_MODULE_0__.StoreType.Cookie) {
            return {
                name: s,
                settings: cookieOptions,
            };
        }
        return s;
    });
}


/***/ }),

/***/ 6948:
/*!******************************************!*\
  !*** ./src/core/storage/localStorage.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LocalStorage: () => (/* binding */ LocalStorage)
/* harmony export */ });
/**
 * Data storage using browser's localStorage
 */
var LocalStorage = /** @class */ (function () {
    function LocalStorage() {
    }
    LocalStorage.prototype.localStorageWarning = function (key, state) {
        console.warn("Unable to access ".concat(String(key), ", localStorage may be ").concat(state));
    };
    LocalStorage.prototype.get = function (key) {
        var _a;
        try {
            var val = localStorage.getItem(String(key));
            if (val === null) {
                return null;
            }
            try {
                return (_a = JSON.parse(val)) !== null && _a !== void 0 ? _a : null;
            }
            catch (e) {
                return (val !== null && val !== void 0 ? val : null);
            }
        }
        catch (err) {
            this.localStorageWarning(key, 'unavailable');
            return null;
        }
    };
    LocalStorage.prototype.set = function (key, value) {
        try {
            localStorage.setItem(String(key), JSON.stringify(value));
        }
        catch (_a) {
            this.localStorageWarning(key, 'full');
        }
    };
    LocalStorage.prototype.remove = function (key) {
        try {
            return localStorage.removeItem(String(key));
        }
        catch (err) {
            this.localStorageWarning(key, 'unavailable');
        }
    };
    return LocalStorage;
}());



/***/ }),

/***/ 6054:
/*!*******************************************!*\
  !*** ./src/core/storage/memoryStorage.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MemoryStorage: () => (/* binding */ MemoryStorage)
/* harmony export */ });
/**
 * Data Storage using in memory object
 */
var MemoryStorage = /** @class */ (function () {
    function MemoryStorage() {
        this.cache = {};
    }
    MemoryStorage.prototype.get = function (key) {
        var _a;
        return ((_a = this.cache[String(key)]) !== null && _a !== void 0 ? _a : null);
    };
    MemoryStorage.prototype.set = function (key, value) {
        this.cache[String(key)] = value;
    };
    MemoryStorage.prototype.remove = function (key) {
        delete this.cache[String(key)];
    };
    return MemoryStorage;
}());



/***/ }),

/***/ 6253:
/*!**************************************!*\
  !*** ./src/core/storage/settings.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isArrayOfStoreType: () => (/* binding */ isArrayOfStoreType),
/* harmony export */   isStoreTypeWithSettings: () => (/* binding */ isStoreTypeWithSettings)
/* harmony export */ });
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./types */ 8119);

function isArrayOfStoreType(s) {
    return (s &&
        s.stores &&
        Array.isArray(s.stores) &&
        s.stores.every(function (e) { return Object.values(_types__WEBPACK_IMPORTED_MODULE_0__.StoreType).includes(e); }));
}
function isStoreTypeWithSettings(s) {
    return typeof s === 'object' && s.name !== undefined;
}


/***/ }),

/***/ 8119:
/*!***********************************!*\
  !*** ./src/core/storage/types.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   StoreType: () => (/* binding */ StoreType)
/* harmony export */ });
var StoreType = {
    Cookie: 'cookie',
    LocalStorage: 'localStorage',
    Memory: 'memory',
};


/***/ }),

/***/ 2890:
/*!**********************************************!*\
  !*** ./src/core/storage/universalStorage.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   UniversalStorage: () => (/* binding */ UniversalStorage)
/* harmony export */ });
// not adding to private method because those method names do not get minified atm, and does not use 'this'
var _logStoreKeyError = function (store, action, key, err) {
    console.warn("".concat(store.constructor.name, ": Can't ").concat(action, " key \"").concat(key, "\" | Err: ").concat(err));
};
/**
 * Uses multiple storages in a priority list to get/set values in the order they are specified.
 */
var UniversalStorage = /** @class */ (function () {
    function UniversalStorage(stores) {
        this.stores = stores;
    }
    UniversalStorage.prototype.get = function (key) {
        var val = null;
        for (var _i = 0, _a = this.stores; _i < _a.length; _i++) {
            var store = _a[_i];
            try {
                val = store.get(key);
                if (val !== undefined && val !== null) {
                    return val;
                }
            }
            catch (e) {
                _logStoreKeyError(store, 'get', String(key), e);
            }
        }
        return null;
    };
    UniversalStorage.prototype.set = function (key, value) {
        this.stores.forEach(function (store) {
            try {
                ;
                store.set(key, value);
            }
            catch (e) {
                _logStoreKeyError(store, 'set', String(key), e);
            }
        });
    };
    UniversalStorage.prototype.clear = function (key) {
        this.stores.forEach(function (store) {
            try {
                ;
                store.remove(key);
            }
            catch (e) {
                _logStoreKeyError(store, 'remove', String(key), e);
            }
        });
    };
    /*
      This is to support few scenarios where:
      - value exist in one of the stores ( as a result of other stores being cleared from browser ) and we want to resync them
      - read values in AJS 1.0 format ( for customers after 1.0 --> 2.0 migration ) and then re-write them in AJS 2.0 format
    */
    UniversalStorage.prototype.getAndSync = function (key) {
        var val = this.get(key);
        // legacy behavior, getAndSync can change the type of a value from number to string (AJS 1.0 stores numerical values as a number)
        var coercedValue = (typeof val === 'number' ? val.toString() : val);
        this.set(key, coercedValue);
        return coercedValue;
    };
    return UniversalStorage;
}());



/***/ }),

/***/ 3398:
/*!********************************!*\
  !*** ./src/core/user/index.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Group: () => (/* binding */ Group),
/* harmony export */   User: () => (/* binding */ User)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _lukeed_uuid__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lukeed/uuid */ 9659);
/* harmony import */ var _lib_bind_all__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../lib/bind-all */ 3057);
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../storage */ 8119);
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../storage */ 2890);
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../storage */ 6054);
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../storage */ 6253);
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../storage */ 5790);




var defaults = {
    persist: true,
    cookie: {
        key: 'ajs_user_id',
        oldKey: 'ajs_user',
    },
    localStorage: {
        key: 'ajs_user_traits',
    },
};
var User = /** @class */ (function () {
    function User(options, cookieOptions) {
        if (options === void 0) { options = defaults; }
        var _this = this;
        var _a, _b, _c, _d;
        this.options = {};
        this.id = function (id) {
            if (_this.options.disable) {
                return null;
            }
            var prevId = _this.identityStore.getAndSync(_this.idKey);
            if (id !== undefined) {
                _this.identityStore.set(_this.idKey, id);
                var changingIdentity = id !== prevId && prevId !== null && id !== null;
                if (changingIdentity) {
                    _this.anonymousId(null);
                }
            }
            var retId = _this.identityStore.getAndSync(_this.idKey);
            if (retId)
                return retId;
            var retLeg = _this.legacyUserStore.get(defaults.cookie.oldKey);
            return retLeg ? (typeof retLeg === 'object' ? retLeg.id : retLeg) : null;
        };
        this.anonymousId = function (id) {
            var _a, _b;
            if (_this.options.disable) {
                return null;
            }
            if (id === undefined) {
                var val = (_a = _this.identityStore.getAndSync(_this.anonKey)) !== null && _a !== void 0 ? _a : (_b = _this.legacySIO()) === null || _b === void 0 ? void 0 : _b[0];
                if (val) {
                    return val;
                }
            }
            if (id === null) {
                _this.identityStore.set(_this.anonKey, null);
                return _this.identityStore.getAndSync(_this.anonKey);
            }
            _this.identityStore.set(_this.anonKey, id !== null && id !== void 0 ? id : (0,_lukeed_uuid__WEBPACK_IMPORTED_MODULE_0__.v4)());
            return _this.identityStore.getAndSync(_this.anonKey);
        };
        this.traits = function (traits) {
            var _a;
            if (_this.options.disable) {
                return;
            }
            if (traits === null) {
                traits = {};
            }
            if (traits) {
                _this.traitsStore.set(_this.traitsKey, traits !== null && traits !== void 0 ? traits : {});
            }
            return (_a = _this.traitsStore.get(_this.traitsKey)) !== null && _a !== void 0 ? _a : {};
        };
        this.options = (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, defaults), options);
        this.cookieOptions = cookieOptions;
        this.idKey = (_b = (_a = options.cookie) === null || _a === void 0 ? void 0 : _a.key) !== null && _b !== void 0 ? _b : defaults.cookie.key;
        this.traitsKey = (_d = (_c = options.localStorage) === null || _c === void 0 ? void 0 : _c.key) !== null && _d !== void 0 ? _d : defaults.localStorage.key;
        this.anonKey = 'ajs_anonymous_id';
        this.identityStore = this.createStorage(this.options, cookieOptions);
        // using only cookies for legacy user store
        this.legacyUserStore = this.createStorage(this.options, cookieOptions, function (s) { return s === _storage__WEBPACK_IMPORTED_MODULE_2__.StoreType.Cookie; });
        // using only localStorage / memory for traits store
        this.traitsStore = this.createStorage(this.options, cookieOptions, function (s) { return s !== _storage__WEBPACK_IMPORTED_MODULE_2__.StoreType.Cookie; });
        var legacyUser = this.legacyUserStore.get(defaults.cookie.oldKey);
        if (legacyUser && typeof legacyUser === 'object') {
            legacyUser.id && this.id(legacyUser.id);
            legacyUser.traits && this.traits(legacyUser.traits);
        }
        (0,_lib_bind_all__WEBPACK_IMPORTED_MODULE_3__["default"])(this);
    }
    User.prototype.legacySIO = function () {
        var val = this.legacyUserStore.get('_sio');
        if (!val) {
            return null;
        }
        var _a = val.split('----'), anon = _a[0], user = _a[1];
        return [anon, user];
    };
    User.prototype.identify = function (id, traits) {
        if (this.options.disable) {
            return;
        }
        traits = traits !== null && traits !== void 0 ? traits : {};
        var currentId = this.id();
        if (currentId === null || currentId === id) {
            traits = (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, this.traits()), traits);
        }
        if (id) {
            this.id(id);
        }
        this.traits(traits);
    };
    User.prototype.logout = function () {
        this.anonymousId(null);
        this.id(null);
        this.traits({});
    };
    User.prototype.reset = function () {
        this.logout();
        this.identityStore.clear(this.idKey);
        this.identityStore.clear(this.anonKey);
        this.traitsStore.clear(this.traitsKey);
    };
    User.prototype.load = function () {
        return new User(this.options, this.cookieOptions);
    };
    User.prototype.save = function () {
        return true;
    };
    /**
     * Creates the right storage system applying all the user options, cookie options and particular filters
     * @param options UserOptions
     * @param cookieOpts CookieOptions
     * @param filterStores filter function to apply to any StoreTypes (skipped if options specify using a custom storage)
     * @returns a Storage object
     */
    User.prototype.createStorage = function (options, cookieOpts, filterStores) {
        var stores = [
            _storage__WEBPACK_IMPORTED_MODULE_2__.StoreType.LocalStorage,
            _storage__WEBPACK_IMPORTED_MODULE_2__.StoreType.Cookie,
            _storage__WEBPACK_IMPORTED_MODULE_2__.StoreType.Memory,
        ];
        // If disabled we won't have any storage functionality
        if (options.disable) {
            return new _storage__WEBPACK_IMPORTED_MODULE_4__.UniversalStorage([]);
        }
        // If persistance is disabled we will always fallback to Memory Storage
        if (!options.persist) {
            return new _storage__WEBPACK_IMPORTED_MODULE_4__.UniversalStorage([new _storage__WEBPACK_IMPORTED_MODULE_5__.MemoryStorage()]);
        }
        if (options.storage !== undefined && options.storage !== null) {
            if ((0,_storage__WEBPACK_IMPORTED_MODULE_6__.isArrayOfStoreType)(options.storage)) {
                // If the user only specified order of stores we will still apply filters and transformations e.g. not using localStorage if localStorageFallbackDisabled
                stores = options.storage.stores;
            }
        }
        // Disable LocalStorage
        if (options.localStorageFallbackDisabled) {
            stores = stores.filter(function (s) { return s !== _storage__WEBPACK_IMPORTED_MODULE_2__.StoreType.LocalStorage; });
        }
        // Apply Additional filters
        if (filterStores) {
            stores = stores.filter(filterStores);
        }
        return new _storage__WEBPACK_IMPORTED_MODULE_4__.UniversalStorage((0,_storage__WEBPACK_IMPORTED_MODULE_7__.initializeStorages)((0,_storage__WEBPACK_IMPORTED_MODULE_7__.applyCookieOptions)(stores, cookieOpts)));
    };
    User.defaults = defaults;
    return User;
}());

var groupDefaults = {
    persist: true,
    cookie: {
        key: 'ajs_group_id',
    },
    localStorage: {
        key: 'ajs_group_properties',
    },
};
var Group = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__extends)(Group, _super);
    function Group(options, cookie) {
        if (options === void 0) { options = groupDefaults; }
        var _this = _super.call(this, (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, groupDefaults), options), cookie) || this;
        _this.anonymousId = function (_id) {
            return undefined;
        };
        (0,_lib_bind_all__WEBPACK_IMPORTED_MODULE_3__["default"])(_this);
        return _this;
    }
    return Group;
}(User));



/***/ }),

/***/ 9894:
/*!******************************!*\
  !*** ./src/core/user/tld.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   tld: () => (/* binding */ tld)
/* harmony export */ });
/* harmony import */ var js_cookie__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! js-cookie */ 3478);

/**
 * Levels returns all levels of the given url.
 *
 * @param {string} url
 * @return {Array}
 * @api public
 */
function levels(url) {
    var host = url.hostname;
    var parts = host.split('.');
    var last = parts[parts.length - 1];
    var levels = [];
    // Ip address.
    if (parts.length === 4 && parseInt(last, 10) > 0) {
        return levels;
    }
    // Localhost.
    if (parts.length <= 1) {
        return levels;
    }
    // Create levels.
    for (var i = parts.length - 2; i >= 0; --i) {
        levels.push(parts.slice(i).join('.'));
    }
    return levels;
}
function parseUrl(url) {
    try {
        return new URL(url);
    }
    catch (_a) {
        return;
    }
}
function tld(url) {
    var parsedUrl = parseUrl(url);
    if (!parsedUrl)
        return;
    var lvls = levels(parsedUrl);
    // Lookup the real top level one.
    for (var i = 0; i < lvls.length; ++i) {
        var cname = '__tld__';
        var domain = lvls[i];
        var opts = { domain: '.' + domain };
        try {
            // cookie access throw an error if the library is ran inside a sandboxed environment (e.g. sandboxed iframe)
            js_cookie__WEBPACK_IMPORTED_MODULE_0__["default"].set(cname, '1', opts);
            if (js_cookie__WEBPACK_IMPORTED_MODULE_0__["default"].get(cname)) {
                js_cookie__WEBPACK_IMPORTED_MODULE_0__["default"].remove(cname, opts);
                return domain;
            }
        }
        catch (_) {
            return;
        }
    }
}


/***/ }),

/***/ 6452:
/*!**********************************!*\
  !*** ./src/generated/version.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   version: () => (/* binding */ version)
/* harmony export */ });
// This file is generated.
var version = '1.84.0-bg.6';


/***/ }),

/***/ 3057:
/*!*****************************!*\
  !*** ./src/lib/bind-all.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ bindAll)
/* harmony export */ });
function bindAll(obj) {
    var proto = obj.constructor.prototype;
    for (var _i = 0, _a = Object.getOwnPropertyNames(proto); _i < _a.length; _i++) {
        var key = _a[_i];
        if (key !== 'constructor') {
            var desc = Object.getOwnPropertyDescriptor(obj.constructor.prototype, key);
            if (!!desc && typeof desc.value === 'function') {
                obj[key] = obj[key].bind(obj);
            }
        }
    }
    return obj;
}


/***/ }),

/***/ 4083:
/*!***************************************!*\
  !*** ./src/lib/client-hints/index.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   clientHints: () => (/* binding */ clientHints)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

function clientHints(hints) {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
        var userAgentData;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
            userAgentData = navigator.userAgentData;
            if (!userAgentData)
                return [2 /*return*/, undefined];
            if (!hints)
                return [2 /*return*/, userAgentData.toJSON()];
            return [2 /*return*/, userAgentData
                    .getHighEntropyValues(hints)
                    .catch(function () { return userAgentData.toJSON(); })];
        });
    });
}


/***/ }),

/***/ 7610:
/*!***************************************!*\
  !*** ./src/lib/embedded-write-key.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   embeddedWriteKey: () => (/* binding */ embeddedWriteKey)
/* harmony export */ });
// This variable is used as an optional fallback for when customers
// host or proxy their own analytics.js.
try {
    window.analyticsWriteKey = '__WRITE_KEY__';
}
catch (_) {
    // @ eslint-disable-next-line
}
function embeddedWriteKey() {
    if (window.analyticsWriteKey === undefined) {
        return undefined;
    }
    // this is done so that we don't accidentally override every reference to __write_key__
    return window.analyticsWriteKey !== ['__', 'WRITE', '_', 'KEY', '__'].join('')
        ? window.analyticsWriteKey
        : undefined;
}


/***/ }),

/***/ 8970:
/*!**************************!*\
  !*** ./src/lib/fetch.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fetch: () => (/* binding */ fetch)
/* harmony export */ });
/* harmony import */ var unfetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! unfetch */ 8575);
/* harmony import */ var _get_global__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./get-global */ 5120);


/**
 * Wrapper around native `fetch` containing `unfetch` fallback.
 */
var fetch = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var global = (0,_get_global__WEBPACK_IMPORTED_MODULE_1__.getGlobal)();
    return ((global && global.fetch) || unfetch__WEBPACK_IMPORTED_MODULE_0__["default"]).apply(void 0, args);
};


/***/ }),

/***/ 5120:
/*!*******************************!*\
  !*** ./src/lib/get-global.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getGlobal: () => (/* binding */ getGlobal)
/* harmony export */ });
// This an imperfect polyfill for globalThis
var getGlobal = function () {
    if (typeof globalThis !== 'undefined') {
        return globalThis;
    }
    if (typeof self !== 'undefined') {
        return self;
    }
    if (typeof window !== 'undefined') {
        return window;
    }
    if (typeof global !== 'undefined') {
        return global;
    }
    return null;
};


/***/ }),

/***/ 6340:
/*!************************************!*\
  !*** ./src/lib/get-process-env.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getProcessEnv: () => (/* binding */ getProcessEnv)
/* harmony export */ });
/**
 * Returns `process.env` if it is available in the environment.
 * Always returns an object make it similarly easy to use as `process.env`.
 */
function getProcessEnv() {
    if (typeof process === 'undefined' || !process.env) {
        return {};
    }
    return process.env;
}


/***/ }),

/***/ 6091:
/*!********************************************!*\
  !*** ./src/lib/global-analytics-helper.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getGlobalAnalytics: () => (/* binding */ getGlobalAnalytics),
/* harmony export */   setGlobalAnalytics: () => (/* binding */ setGlobalAnalytics),
/* harmony export */   setGlobalAnalyticsKey: () => (/* binding */ setGlobalAnalyticsKey)
/* harmony export */ });
/**
 * Stores the global window analytics key
 */
var _globalAnalyticsKey = 'analytics';
/**
 * Gets the global analytics/buffer
 * @param key name of the window property where the buffer is stored (default: analytics)
 * @returns AnalyticsSnippet
 */
function getGlobalAnalytics() {
    return window[_globalAnalyticsKey];
}
/**
 * Replaces the global window key for the analytics/buffer object
 * @param key key name
 */
function setGlobalAnalyticsKey(key) {
    _globalAnalyticsKey = key;
}
/**
 * Sets the global analytics object
 * @param analytics analytics snippet
 */
function setGlobalAnalytics(analytics) {
    ;
    window[_globalAnalyticsKey] = analytics;
}


/***/ }),

/***/ 2842:
/*!********************************!*\
  !*** ./src/lib/is-thenable.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isThenable: () => (/* binding */ isThenable)
/* harmony export */ });
/**
 *  Check if  thenable
 *  (instanceof Promise doesn't respect realms)
 */
var isThenable = function (value) {
    return typeof value === 'object' &&
        value !== null &&
        'then' in value &&
        typeof value.then === 'function';
};


/***/ }),

/***/ 6238:
/*!********************************!*\
  !*** ./src/lib/load-script.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   loadScript: () => (/* binding */ loadScript),
/* harmony export */   unloadScript: () => (/* binding */ unloadScript)
/* harmony export */ });
function findScript(src) {
    var scripts = Array.prototype.slice.call(window.document.querySelectorAll('script'));
    return scripts.find(function (s) { return s.src === src; });
}
/**
 * Load a script from a URL and append it to the document.
 */
function loadScript(src, attributes) {
    var found = findScript(src);
    if (found !== undefined) {
        var status = found === null || found === void 0 ? void 0 : found.getAttribute('status');
        if (status === 'loaded') {
            return Promise.resolve(found);
        }
        if (status === 'loading') {
            return new Promise(function (resolve, reject) {
                found.addEventListener('load', function () { return resolve(found); });
                found.addEventListener('error', function (err) { return reject(err); });
            });
        }
    }
    return new Promise(function (resolve, reject) {
        var _a;
        var script = window.document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.async = true;
        script.setAttribute('status', 'loading');
        for (var _i = 0, _b = Object.entries(attributes !== null && attributes !== void 0 ? attributes : {}); _i < _b.length; _i++) {
            var _c = _b[_i], k = _c[0], v = _c[1];
            script.setAttribute(k, v);
        }
        script.onload = function () {
            script.onerror = script.onload = null;
            script.setAttribute('status', 'loaded');
            resolve(script);
        };
        script.onerror = function () {
            script.onerror = script.onload = null;
            script.setAttribute('status', 'error');
            reject(new Error("Failed to load ".concat(src)));
        };
        var firstExistingScript = window.document.querySelector('script');
        if (!firstExistingScript) {
            window.document.head.appendChild(script);
        }
        else {
            (_a = firstExistingScript.parentElement) === null || _a === void 0 ? void 0 : _a.insertBefore(script, firstExistingScript);
        }
    });
}
function unloadScript(src) {
    var found = findScript(src);
    if (found !== undefined) {
        found.remove();
    }
    return Promise.resolve();
}


/***/ }),

/***/ 5835:
/*!***********************************!*\
  !*** ./src/lib/merged-options.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   mergedOptions: () => (/* binding */ mergedOptions)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

/**
 * Merge legacy settings and initialized Integration option overrides.
 *
 * This will merge any options that were passed from initialization into
 * overrides for settings that are returned by the Segment CDN.
 *
 * i.e. this allows for passing options directly into destinations from
 * the Analytics constructor.
 */
function mergedOptions(cdnSettings, options) {
    var _a;
    var optionOverrides = Object.entries((_a = options.integrations) !== null && _a !== void 0 ? _a : {}).reduce(function (overrides, _a) {
        var _b, _c;
        var integration = _a[0], options = _a[1];
        if (typeof options === 'object') {
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, overrides), (_b = {}, _b[integration] = options, _b));
        }
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, overrides), (_c = {}, _c[integration] = {}, _c));
    }, {});
    return Object.entries(cdnSettings.integrations).reduce(function (integrationSettings, _a) {
        var _b;
        var integration = _a[0], settings = _a[1];
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, integrationSettings), (_b = {}, _b[integration] = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, settings), optionOverrides[integration]), _b));
    }, {});
}


/***/ }),

/***/ 1934:
/*!***********************************!*\
  !*** ./src/lib/on-page-change.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   onPageChange: () => (/* binding */ onPageChange)
/* harmony export */ });
/**
 * Register event listener on document that fires when:
 * * tab change or tab close (in mobile or desktop)
 * * click back / forward button
 * * click any link or perform any other navigation action
 * * soft refresh / hard refresh
 *
 * adapted from https://stackoverflow.com/questions/3239834/window-onbeforeunload-not-working-on-the-ipad/52864508#52864508,
 */
var onPageChange = function (cb) {
    var unloaded = false; // prevents double firing if both are supported
    window.addEventListener('pagehide', function () {
        if (unloaded)
            return;
        unloaded = true;
        cb(unloaded);
    });
    // using document instead of window because of bug affecting browsers before safari 14 (detail in footnotes https://caniuse.com/?search=visibilitychange)
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState == 'hidden') {
            if (unloaded)
                return;
            unloaded = true;
        }
        else {
            unloaded = false;
        }
        cb(unloaded);
    });
};


/***/ }),

/***/ 7106:
/*!****************************!*\
  !*** ./src/lib/p-while.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   pWhile: () => (/* binding */ pWhile)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

var pWhile = function (condition, action) { return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(void 0, void 0, Promise, function () {
    var loop;
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
        loop = function (actionResult) { return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(void 0, void 0, Promise, function () {
            var _a;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!condition(actionResult)) return [3 /*break*/, 2];
                        _a = loop;
                        return [4 /*yield*/, action()];
                    case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
                    case 2: return [2 /*return*/];
                }
            });
        }); };
        return [2 /*return*/, loop(undefined)];
    });
}); };


/***/ }),

/***/ 2911:
/*!******************************!*\
  !*** ./src/lib/parse-cdn.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getCDN: () => (/* binding */ getCDN),
/* harmony export */   getLegacyAJSPath: () => (/* binding */ getLegacyAJSPath),
/* harmony export */   getNextIntegrationsURL: () => (/* binding */ getNextIntegrationsURL),
/* harmony export */   setGlobalCDNUrl: () => (/* binding */ setGlobalCDNUrl)
/* harmony export */ });
/* harmony import */ var _global_analytics_helper__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./global-analytics-helper */ 6091);
/* harmony import */ var _embedded_write_key__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./embedded-write-key */ 7610);


var analyticsScriptRegex = /(https:\/\/.*)\/analytics\.js\/v1\/(?:.*?)\/(?:platform|analytics.*)?/;
var getCDNUrlFromScriptTag = function () {
    var cdn;
    var scripts = Array.prototype.slice.call(document.querySelectorAll('script'));
    scripts.forEach(function (s) {
        var _a;
        var src = (_a = s.getAttribute('src')) !== null && _a !== void 0 ? _a : '';
        var result = analyticsScriptRegex.exec(src);
        if (result && result[1]) {
            cdn = result[1];
        }
    });
    return cdn;
};
var _globalCDN; // set globalCDN as in-memory singleton
var getGlobalCDNUrl = function () {
    var _a;
    var result = _globalCDN !== null && _globalCDN !== void 0 ? _globalCDN : (_a = (0,_global_analytics_helper__WEBPACK_IMPORTED_MODULE_0__.getGlobalAnalytics)()) === null || _a === void 0 ? void 0 : _a._cdn;
    return result;
};
var setGlobalCDNUrl = function (cdn) {
    var globalAnalytics = (0,_global_analytics_helper__WEBPACK_IMPORTED_MODULE_0__.getGlobalAnalytics)();
    if (globalAnalytics) {
        globalAnalytics._cdn = cdn;
    }
    _globalCDN = cdn;
};
var getCDN = function () {
    var globalCdnUrl = getGlobalCDNUrl();
    if (globalCdnUrl)
        return globalCdnUrl;
    var cdnFromScriptTag = getCDNUrlFromScriptTag();
    if (cdnFromScriptTag) {
        return cdnFromScriptTag;
    }
    else {
        // it's possible that the CDN is not found in the page because:
        // - the script is loaded through a proxy
        // - the script is removed after execution
        // in this case, we fall back to the default Segment CDN
        return "https://cdn.segment.com";
    }
};
var getNextIntegrationsURL = function () {
    var cdn = getCDN();
    return "".concat(cdn, "/next-integrations");
};
/**
 * Replaces the CDN URL in the script tag with the one from Analytics.js 1.0
 *
 * @returns the path to Analytics JS 1.0
 **/
function getLegacyAJSPath() {
    var _a, _b, _c;
    var writeKey = (_a = (0,_embedded_write_key__WEBPACK_IMPORTED_MODULE_1__.embeddedWriteKey)()) !== null && _a !== void 0 ? _a : (_b = (0,_global_analytics_helper__WEBPACK_IMPORTED_MODULE_0__.getGlobalAnalytics)()) === null || _b === void 0 ? void 0 : _b._writeKey;
    var scripts = Array.prototype.slice.call(document.querySelectorAll('script'));
    var path = undefined;
    for (var _i = 0, scripts_1 = scripts; _i < scripts_1.length; _i++) {
        var s = scripts_1[_i];
        var src = (_c = s.getAttribute('src')) !== null && _c !== void 0 ? _c : '';
        var result = analyticsScriptRegex.exec(src);
        if (result && result[1]) {
            path = src;
            break;
        }
    }
    if (path) {
        return path.replace('analytics.min.js', 'analytics.classic.js');
    }
    return "https://cdn.segment.com/analytics.js/v1/".concat(writeKey, "/analytics.classic.js");
}


/***/ }),

/***/ 1193:
/*!*************************!*\
  !*** ./src/lib/pick.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   pick: () => (/* binding */ pick)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

/**
 * @example
 * pick({ 'a': 1, 'b': '2', 'c': 3 }, ['a', 'c'])
 * => { 'a': 1, 'c': 3 }
 */
function pick(object, keys) {
    return Object.assign.apply(Object, (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spreadArray)([{}], keys.map(function (key) {
        var _a;
        if (object && Object.prototype.hasOwnProperty.call(object, key)) {
            return _a = {}, _a[key] = object[key], _a;
        }
    }), false));
}


/***/ }),

/***/ 9732:
/*!*********************************************!*\
  !*** ./src/lib/priority-queue/persisted.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PersistedPriorityQueue: () => (/* binding */ PersistedPriorityQueue)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var ___WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! . */ 9797);
/* harmony import */ var _core_context__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../core/context */ 8456);
/* harmony import */ var _core_environment__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core/environment */ 4082);




var loc = {
    getItem: function () { },
    setItem: function () { },
    removeItem: function () { },
};
try {
    loc = (0,_core_environment__WEBPACK_IMPORTED_MODULE_0__.isBrowser)() && window.localStorage ? window.localStorage : loc;
}
catch (err) {
    console.warn('Unable to access localStorage', err);
}
function persisted(key) {
    var items = loc.getItem(key);
    return (items ? JSON.parse(items) : []).map(function (p) { return new _core_context__WEBPACK_IMPORTED_MODULE_1__.Context(p.event, p.id); });
}
function persistItems(key, items) {
    var existing = persisted(key);
    var all = (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spreadArray)((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spreadArray)([], items, true), existing, true);
    var merged = all.reduce(function (acc, item) {
        var _a;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)({}, acc), (_a = {}, _a[item.id] = item, _a));
    }, {});
    loc.setItem(key, JSON.stringify(Object.values(merged)));
}
function seen(key) {
    var stored = loc.getItem(key);
    return stored ? JSON.parse(stored) : {};
}
function persistSeen(key, memory) {
    var stored = seen(key);
    loc.setItem(key, JSON.stringify((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)({}, stored), memory)));
}
function remove(key) {
    loc.removeItem(key);
}
var now = function () { return new Date().getTime(); };
function mutex(key, onUnlock, attempt) {
    if (attempt === void 0) { attempt = 0; }
    var lockTimeout = 50;
    var lockKey = "persisted-queue:v1:".concat(key, ":lock");
    var expired = function (lock) { return new Date().getTime() > lock; };
    var rawLock = loc.getItem(lockKey);
    var lock = rawLock ? JSON.parse(rawLock) : null;
    var allowed = lock === null || expired(lock);
    if (allowed) {
        loc.setItem(lockKey, JSON.stringify(now() + lockTimeout));
        onUnlock();
        loc.removeItem(lockKey);
        return;
    }
    if (!allowed && attempt < 3) {
        setTimeout(function () {
            mutex(key, onUnlock, attempt + 1);
        }, lockTimeout);
    }
    else {
        console.error('Unable to retrieve lock');
    }
}
var PersistedPriorityQueue = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__extends)(PersistedPriorityQueue, _super);
    function PersistedPriorityQueue(maxAttempts, key) {
        var _this = _super.call(this, maxAttempts, []) || this;
        var itemsKey = "persisted-queue:v1:".concat(key, ":items");
        var seenKey = "persisted-queue:v1:".concat(key, ":seen");
        var saved = [];
        var lastSeen = {};
        mutex(key, function () {
            try {
                saved = persisted(itemsKey);
                lastSeen = seen(seenKey);
                remove(itemsKey);
                remove(seenKey);
                _this.queue = (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spreadArray)((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spreadArray)([], saved, true), _this.queue, true);
                _this.seen = (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)({}, lastSeen), _this.seen);
            }
            catch (err) {
                console.error(err);
            }
        });
        window.addEventListener('pagehide', function () {
            // we deliberately want to use the less powerful 'pagehide' API to only persist on events where the analytics instance gets destroyed, and not on tab away.
            if (_this.todo > 0) {
                var items_1 = (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spreadArray)((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spreadArray)([], _this.queue, true), _this.future, true);
                try {
                    mutex(key, function () {
                        persistItems(itemsKey, items_1);
                        persistSeen(seenKey, _this.seen);
                    });
                }
                catch (err) {
                    console.error(err);
                }
            }
        });
        return _this;
    }
    return PersistedPriorityQueue;
}(___WEBPACK_IMPORTED_MODULE_3__.PriorityQueue));



/***/ }),

/***/ 7536:
/*!******************************!*\
  !*** ./src/lib/to-facade.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   toFacade: () => (/* binding */ toFacade)
/* harmony export */ });
/* harmony import */ var _segment_facade__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @segment/facade */ 4303);
/* harmony import */ var _segment_facade__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_segment_facade__WEBPACK_IMPORTED_MODULE_0__);

function toFacade(evt, options) {
    var fcd = new _segment_facade__WEBPACK_IMPORTED_MODULE_0__.Facade(evt, options);
    if (evt.type === 'track') {
        fcd = new _segment_facade__WEBPACK_IMPORTED_MODULE_0__.Track(evt, options);
    }
    if (evt.type === 'identify') {
        fcd = new _segment_facade__WEBPACK_IMPORTED_MODULE_0__.Identify(evt, options);
    }
    if (evt.type === 'page') {
        fcd = new _segment_facade__WEBPACK_IMPORTED_MODULE_0__.Page(evt, options);
    }
    if (evt.type === 'alias') {
        fcd = new _segment_facade__WEBPACK_IMPORTED_MODULE_0__.Alias(evt, options);
    }
    if (evt.type === 'group') {
        fcd = new _segment_facade__WEBPACK_IMPORTED_MODULE_0__.Group(evt, options);
    }
    if (evt.type === 'screen') {
        fcd = new _segment_facade__WEBPACK_IMPORTED_MODULE_0__.Screen(evt, options);
    }
    Object.defineProperty(fcd, 'obj', {
        value: evt,
        writable: true,
    });
    return fcd;
}


/***/ }),

/***/ 3831:
/*!*********************************!*\
  !*** ./src/lib/version-type.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getVersionType: () => (/* binding */ getVersionType),
/* harmony export */   setVersionType: () => (/* binding */ setVersionType)
/* harmony export */ });
// Default value will be updated to 'web' in `bundle-umd.ts` for web build.
var _version = 'npm';
function setVersionType(version) {
    _version = version;
}
function getVersionType() {
    return _version;
}


/***/ }),

/***/ 2455:
/*!**********************************************************!*\
  !*** ./src/plugins/conversion-collector/batch-buffer.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BatchBuffer: () => (/* binding */ BatchBuffer)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _lib_event_queue_storage__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./lib/event-queue-storage */ 4358);
/* harmony import */ var _send_events__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./send-events */ 2860);



var BatchBuffer = /** @class */ (function () {
    function BatchBuffer(config) {
        this.config = config;
        this.queue = [];
        this.timer = null;
        this.flushing = false;
        this.hydrateFromStorage();
    }
    BatchBuffer.prototype.start = function () {
        var _this = this;
        if (this.timer) {
            return;
        }
        this.timer = setInterval(function () {
            void _this.flush();
        }, this.config.flushIntervalMs);
        void this.flush();
    };
    BatchBuffer.prototype.stop = function () {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    };
    BatchBuffer.prototype.enqueue = function (event) {
        this.queue.push(event);
        this.persistQueue();
        if (this.queue.length >= this.config.batchSize) {
            void this.flush();
        }
    };
    BatchBuffer.prototype.getSize = function () {
        return this.queue.length;
    };
    BatchBuffer.prototype.hydrateFromStorage = function () {
        var persisted = (0,_lib_event_queue_storage__WEBPACK_IMPORTED_MODULE_0__.readPersistedEventQueue)();
        if (persisted.length > 0) {
            this.queue = (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__spreadArray)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__spreadArray)([], persisted, true), this.queue, true);
            this.persistQueue();
        }
    };
    BatchBuffer.prototype.persistQueue = function () {
        (0,_lib_event_queue_storage__WEBPACK_IMPORTED_MODULE_0__.writePersistedEventQueue)(this.queue);
    };
    BatchBuffer.prototype.takeBatch = function (maxSize) {
        if (maxSize === void 0) { maxSize = this.config.batchSize; }
        return this.queue.splice(0, maxSize);
    };
    BatchBuffer.prototype.requeueFront = function (batch) {
        var _a;
        (_a = this.queue).unshift.apply(_a, batch);
        this.persistQueue();
    };
    BatchBuffer.prototype.flush = function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
            var batch, error_1;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.flushing || this.queue.length === 0) {
                            return [2 /*return*/];
                        }
                        this.flushing = true;
                        batch = this.takeBatch();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, (0,_send_events__WEBPACK_IMPORTED_MODULE_2__.sendEventsToCollect)(batch, this.config)];
                    case 2:
                        _a.sent();
                        this.persistQueue();
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 instanceof _send_events__WEBPACK_IMPORTED_MODULE_2__.CollectDeliveryError && !error_1.retryable) {
                            this.persistQueue();
                            throw error_1;
                        }
                        this.requeueFront(batch);
                        throw error_1;
                    case 4:
                        this.flushing = false;
                        if (this.queue.length >= this.config.batchSize) {
                            void this.flush();
                        }
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drains the queue. Uses sendBeacon on unload when the payload fits; otherwise keepalive fetch.
     */
    BatchBuffer.prototype.flushAll = function (options) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
            var batch, body, error_2, error_3;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.stop();
                        _a.label = 1;
                    case 1:
                        if (!(this.queue.length > 0)) return [3 /*break*/, 9];
                        batch = this.takeBatch(this.queue.length);
                        body = (0,_send_events__WEBPACK_IMPORTED_MODULE_2__.buildCollectRequestBody)(batch);
                        if (!(options === null || options === void 0 ? void 0 : options.unload)) return [3 /*break*/, 5];
                        if ((0,_send_events__WEBPACK_IMPORTED_MODULE_2__.sendCollectViaBeacon)(this.config.endpoint, body)) {
                            this.persistQueue();
                            return [3 /*break*/, 1];
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, (0,_send_events__WEBPACK_IMPORTED_MODULE_2__.deliverCollectPayload)(body, this.config, { keepalive: true })];
                    case 3:
                        _a.sent();
                        this.persistQueue();
                        return [3 /*break*/, 1];
                    case 4:
                        error_2 = _a.sent();
                        if (error_2 instanceof _send_events__WEBPACK_IMPORTED_MODULE_2__.CollectDeliveryError && !error_2.retryable) {
                            this.persistQueue();
                            throw error_2;
                        }
                        this.requeueFront(batch);
                        throw error_2;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, (0,_send_events__WEBPACK_IMPORTED_MODULE_2__.sendEventsToCollect)(batch, this.config)];
                    case 6:
                        _a.sent();
                        this.persistQueue();
                        return [3 /*break*/, 8];
                    case 7:
                        error_3 = _a.sent();
                        if (error_3 instanceof _send_events__WEBPACK_IMPORTED_MODULE_2__.CollectDeliveryError && !error_3.retryable) {
                            this.persistQueue();
                            throw error_3;
                        }
                        this.requeueFront(batch);
                        throw error_3;
                    case 8: return [3 /*break*/, 1];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return BatchBuffer;
}());



/***/ }),

/***/ 9721:
/*!**********************************************************!*\
  !*** ./src/plugins/conversion-collector/cdn-settings.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   conversionCdnSettingsMinimal: () => (/* binding */ conversionCdnSettingsMinimal)
/* harmony export */ });
/**
 * Minimal CDN settings for npm-only loads without calling the Segment CDN.
 * Pair with `integrations: { 'Segment.io': false }` and a custom collector plugin.
 */
var conversionCdnSettingsMinimal = {
    integrations: {
        'Segment.io': {
            apiKey: 'conversion-pipeline',
        },
    },
};


/***/ }),

/***/ 3986:
/*!*****************************************************************!*\
  !*** ./src/plugins/conversion-collector/context-to-envelope.ts ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   contextToEnvelope: () => (/* binding */ contextToEnvelope)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _lib_to_facade__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../lib/to-facade */ 7536);
/* harmony import */ var _lib_uuid__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./lib/uuid */ 5129);



function toIsoString(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'string' && value.length > 0) {
        return value;
    }
    return new Date().toISOString();
}
function resolveEventName(json) {
    if (typeof json.event === 'string' && json.event.length > 0) {
        return json.event;
    }
    if (typeof json.name === 'string' && json.name.length > 0) {
        return json.name;
    }
    return 'page';
}
function resolveEnvelopeType(json) {
    if (json.type === 'identify') {
        return 'identify';
    }
    if (json.type === 'track' || json.type === 'page' || json.type === 'screen') {
        return 'track';
    }
    return null;
}
/**
 * Maps an analytics-next context to the UTUA collector envelope (`version: 2`).
 */
function contextToEnvelope(ctx, analytics) {
    var _a, _b, _c, _d, _e, _f, _g;
    var json = (0,_lib_to_facade__WEBPACK_IMPORTED_MODULE_0__.toFacade)(ctx.event).json();
    var type = resolveEnvelopeType(json);
    if (!type) {
        return null;
    }
    var user = analytics.user();
    var timestamp = toIsoString(json.timestamp);
    var anonymousId = (_a = json.anonymousId) !== null && _a !== void 0 ? _a : user.anonymousId();
    var userId = (_c = (_b = json.userId) !== null && _b !== void 0 ? _b : user.id()) !== null && _c !== void 0 ? _c : undefined;
    var envelope = {
        type: type,
        anonymous_id: anonymousId,
        user_id: userId || undefined,
        context: ((_d = json.context) !== null && _d !== void 0 ? _d : {}),
        integrations: json.integrations,
        message_id: (function () {
            var _a;
            var id = (_a = json.messageId) !== null && _a !== void 0 ? _a : ctx.id;
            return typeof id === 'string' && (0,_lib_uuid__WEBPACK_IMPORTED_MODULE_1__.isValidUuidV4)(id) ? id : (0,_lib_uuid__WEBPACK_IMPORTED_MODULE_1__.generateUuidV4)();
        })(),
        original_timestamp: timestamp,
        timestamp: timestamp,
        version: 2,
    };
    if (type === 'track') {
        envelope.event_name = resolveEventName(json);
        var properties = (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)({}, ((_e = json.properties) !== null && _e !== void 0 ? _e : {}));
        delete properties.event_name;
        delete properties.eventName;
        envelope.properties =
            Object.keys(properties).length > 0 ? properties : undefined;
    }
    if (type === 'identify') {
        var traits = (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)({}, ((_f = json.traits) !== null && _f !== void 0 ? _f : {}));
        envelope.traits = Object.keys(traits).length > 0 ? traits : undefined;
        var properties = (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)({}, ((_g = json.properties) !== null && _g !== void 0 ? _g : {}));
        envelope.properties =
            Object.keys(properties).length > 0 ? properties : undefined;
    }
    return envelope;
}


/***/ }),

/***/ 2674:
/*!****************************************************************!*\
  !*** ./src/plugins/conversion-collector/destination-plugin.ts ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   conversionCollectorPlugin: () => (/* binding */ conversionCollectorPlugin)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _batch_buffer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./batch-buffer */ 2455);
/* harmony import */ var _context_to_envelope__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./context-to-envelope */ 3986);
/* harmony import */ var _runtime_registry__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./runtime-registry */ 1322);




var DEFAULT_FLUSH_INTERVAL_MS = 2000;
var DEFAULT_BATCH_SIZE = 10;
var DEFAULT_RETRY_ATTEMPTS = 2;
function registerUnloadFlush(buffer) {
    if (typeof window === 'undefined' ||
        typeof document === 'undefined' ||
        typeof document.addEventListener !== 'function') {
        return function () { return undefined; };
    }
    var flushOnUnload = function () {
        void buffer.flushAll({ unload: true });
    };
    var onVisibilityChange = function () {
        if (document.visibilityState === 'hidden') {
            flushOnUnload();
        }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', flushOnUnload);
    return function () {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('pagehide', flushOnUnload);
    };
}
function conversionCollectorPlugin(settings) {
    var _a, _b, _c;
    var buffer = new _batch_buffer__WEBPACK_IMPORTED_MODULE_0__.BatchBuffer({
        endpoint: settings.endpoint,
        headers: settings.headers,
        retryAttempts: (_a = settings.retryAttempts) !== null && _a !== void 0 ? _a : DEFAULT_RETRY_ATTEMPTS,
        flushIntervalMs: (_b = settings.flushIntervalMs) !== null && _b !== void 0 ? _b : DEFAULT_FLUSH_INTERVAL_MS,
        batchSize: (_c = settings.batchSize) !== null && _c !== void 0 ? _c : DEFAULT_BATCH_SIZE,
    });
    var analytics;
    var removeUnloadListeners;
    function deliver(ctx, flushImmediately) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
            var envelope, error_1, reason;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!analytics) {
                            return [2 /*return*/, ctx];
                        }
                        envelope = (0,_context_to_envelope__WEBPACK_IMPORTED_MODULE_2__.contextToEnvelope)(ctx, analytics);
                        if (!envelope) {
                            return [2 /*return*/, ctx];
                        }
                        buffer.enqueue(envelope);
                        if (!flushImmediately) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, buffer.flush()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        reason = error_1 instanceof Error ? error_1 : new Error(String(error_1));
                        ctx.log('error', 'Conversion collector delivery failed', { reason: reason });
                        ctx.setFailedDelivery({ reason: reason });
                        analytics.emit('error', {
                            code: 'delivery_failure',
                            reason: error_1,
                            ctx: ctx,
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, ctx];
                }
            });
        });
    }
    return {
        name: 'Conversion Collector',
        type: 'destination',
        version: '0.1.0',
        isLoaded: function () { return true; },
        load: function (_ctx, instance) {
            analytics = instance;
            (0,_runtime_registry__WEBPACK_IMPORTED_MODULE_3__.registerConversionCollectorBuffer)(analytics, buffer);
            removeUnloadListeners = registerUnloadFlush(buffer);
            buffer.start();
            return Promise.resolve();
        },
        unload: function () {
            removeUnloadListeners === null || removeUnloadListeners === void 0 ? void 0 : removeUnloadListeners();
            removeUnloadListeners = undefined;
            return buffer.flushAll({ unload: true }).then(function () { return undefined; });
        },
        track: function (ctx) { return deliver(ctx, false); },
        page: function (ctx) { return deliver(ctx, false); },
        screen: function (ctx) { return deliver(ctx, false); },
        identify: function (ctx) { return deliver(ctx, true); },
        alias: function (ctx) { return Promise.resolve(ctx); },
        group: function (ctx) { return Promise.resolve(ctx); },
    };
}


/***/ }),

/***/ 6406:
/*!***************************************************************************!*\
  !*** ./src/plugins/conversion-collector/enrichment/consent-enrichment.ts ***!
  \***************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   conversionConsentEnrichment: () => (/* binding */ conversionConsentEnrichment)
/* harmony export */ });
/* harmony import */ var _core_context__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../core/context */ 7070);

function isTrackingAllowed(settings) {
    var _a;
    if (((_a = settings.isTrackingAllowed) === null || _a === void 0 ? void 0 : _a.call(settings)) === false) {
        return false;
    }
    if (settings.respectDoNotTrack === false) {
        return true;
    }
    var dnt = typeof navigator !== 'undefined'
        ? navigator.doNotTrack
        : undefined;
    return dnt !== '1' && dnt !== 'yes';
}
function conversionConsentEnrichment(settings) {
    var drop = function (ctx) {
        if (!isTrackingAllowed(settings)) {
            ctx.cancel(new _core_context__WEBPACK_IMPORTED_MODULE_0__.ContextCancelation({
                retry: false,
                type: 'Conversion Consent',
                reason: 'Tracking not allowed',
            }));
        }
        return ctx;
    };
    return {
        name: 'Conversion Consent',
        type: 'before',
        version: '0.1.0',
        isLoaded: function () { return true; },
        load: function () { return Promise.resolve(); },
        track: drop,
        identify: drop,
        page: drop,
        screen: drop,
        alias: drop,
        group: drop,
    };
}


/***/ }),

/***/ 7141:
/*!***************************************************************************!*\
  !*** ./src/plugins/conversion-collector/enrichment/context-enrichment.ts ***!
  \***************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   conversionContextEnrichment: () => (/* binding */ conversionContextEnrichment)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _lib_resolve_context__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../lib/resolve-context */ 2754);
/* harmony import */ var _lib_session__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lib/session */ 1644);



function conversionContextEnrichment(settings) {
    var analytics;
    var enrich = function (ctx) {
        var _a, _b, _c;
        if (!analytics) {
            return ctx;
        }
        var bgAnonymousId = (0,_lib_session__WEBPACK_IMPORTED_MODULE_0__.getOrCreateAnonymousId)();
        if (analytics.user().anonymousId() !== bgAnonymousId) {
            analytics.user().anonymousId(bgAnonymousId);
        }
        ctx.updateEvent('anonymousId', bgAnonymousId);
        var sessionId = (_b = (_a = settings.getSessionId) === null || _a === void 0 ? void 0 : _a.call(settings)) !== null && _b !== void 0 ? _b : (0,_lib_session__WEBPACK_IMPORTED_MODULE_0__.getOrCreateSessionId)();
        var resolved = (0,_lib_resolve_context__WEBPACK_IMPORTED_MODULE_1__.resolveContext)(settings, { session_id: sessionId });
        var evtCtx = (_c = ctx.event.context) !== null && _c !== void 0 ? _c : {};
        ctx.updateEvent('context', (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__assign)({}, evtCtx), resolved));
        var traits = analytics.user().traits();
        if (traits && Object.keys(traits).length > 0) {
            ctx.updateEvent('context.traits', traits);
        }
        return ctx;
    };
    return {
        name: 'Conversion Context',
        type: 'before',
        version: '0.1.0',
        isLoaded: function () { return true; },
        load: function (_ctx, instance) {
            analytics = instance;
            return Promise.resolve();
        },
        track: enrich,
        identify: enrich,
        page: enrich,
        screen: enrich,
        alias: enrich,
        group: enrich,
    };
}


/***/ }),

/***/ 2998:
/*!****************************************************************************!*\
  !*** ./src/plugins/conversion-collector/enrichment/identify-enrichment.ts ***!
  \****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   conversionIdentifyEnrichment: () => (/* binding */ conversionIdentifyEnrichment)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _identify_normalizeIdentifyTraits__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../identify/normalizeIdentifyTraits */ 6159);


function conversionIdentifyEnrichment(settings) {
    var _this = this;
    var analytics;
    return {
        name: 'Conversion Identify PII',
        type: 'before',
        version: '0.1.0',
        isLoaded: function () { return true; },
        load: function (_ctx, instance) {
            analytics = instance;
            return Promise.resolve();
        },
        identify: function (ctx) { return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(_this, void 0, void 0, function () {
            var rawTraits, normalized, userId;
            var _a, _b;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        rawTraits = ((_a = ctx.event.traits) !== null && _a !== void 0 ? _a : {});
                        return [4 /*yield*/, (0,_identify_normalizeIdentifyTraits__WEBPACK_IMPORTED_MODULE_1__.normalizeIdentifyTraits)(rawTraits, {
                                defaultPhoneCountryCode: settings.defaultPhoneCountryCode,
                            })];
                    case 1:
                        normalized = _c.sent();
                        ctx.updateEvent('traits', normalized);
                        userId = (_b = ctx.event.userId) !== null && _b !== void 0 ? _b : analytics === null || analytics === void 0 ? void 0 : analytics.user().id();
                        if (userId) {
                            analytics === null || analytics === void 0 ? void 0 : analytics.user().identify(userId, normalized);
                        }
                        return [2 /*return*/, ctx];
                }
            });
        }); },
    };
}


/***/ }),

/***/ 2407:
/*!************************************************************************!*\
  !*** ./src/plugins/conversion-collector/enrichment/page-enrichment.ts ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   conversionPageEnrichment: () => (/* binding */ conversionPageEnrichment)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _lib_page_properties__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../lib/page-properties */ 8935);


function conversionPageEnrichment(settings) {
    var _this = this;
    return {
        name: 'Conversion Page Properties',
        type: 'before',
        version: '0.1.0',
        isLoaded: function () { return true; },
        load: function () { return Promise.resolve(); },
        page: function (ctx) { return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(_this, void 0, void 0, function () {
            var properties;
            var _a;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0,_lib_page_properties__WEBPACK_IMPORTED_MODULE_1__.buildPageEventProperties)(settings, ((_a = ctx.event.properties) !== null && _a !== void 0 ? _a : {}))];
                    case 1:
                        properties = _b.sent();
                        ctx.updateEvent('properties', properties);
                        return [2 /*return*/, ctx];
                }
            });
        }); },
        track: function (ctx) { return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(_this, void 0, void 0, function () {
            var eventName, properties_1, properties;
            var _a, _b;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        eventName = ctx.event.type === 'track' ? ctx.event.event : undefined;
                        if (!(eventName === 'page')) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0,_lib_page_properties__WEBPACK_IMPORTED_MODULE_1__.buildPageEventProperties)(settings, ((_a = ctx.event.properties) !== null && _a !== void 0 ? _a : {}))];
                    case 1:
                        properties_1 = _c.sent();
                        ctx.updateEvent('properties', properties_1);
                        return [2 /*return*/, ctx];
                    case 2:
                        properties = (0,_lib_page_properties__WEBPACK_IMPORTED_MODULE_1__.enrichWithSessionQueryParams)(((_b = ctx.event.properties) !== null && _b !== void 0 ? _b : {}));
                        ctx.updateEvent('properties', properties);
                        return [2 /*return*/, ctx];
                }
            });
        }); },
        screen: function (ctx) {
            var _a;
            var properties = (0,_lib_page_properties__WEBPACK_IMPORTED_MODULE_1__.enrichWithSessionQueryParams)(((_a = ctx.event.properties) !== null && _a !== void 0 ? _a : {}));
            ctx.updateEvent('properties', properties);
            return ctx;
        },
    };
}


/***/ }),

/***/ 7234:
/*!*************************************************************!*\
  !*** ./src/plugins/conversion-collector/gpt-slot-events.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CANONICAL_GPT_EVENTS: () => (/* binding */ CANONICAL_GPT_EVENTS),
/* harmony export */   conversionGptSlotEventsPlugin: () => (/* binding */ conversionGptSlotEventsPlugin),
/* harmony export */   mountGptSlotEventListeners: () => (/* binding */ mountGptSlotEventListeners)
/* harmony export */ });
var CANONICAL_GPT_EVENTS = [
    'slotRequested',
    'slotResponseReceived',
    'slotRenderEnded',
    'slotOnload',
    'impressionViewable',
    'slotEmpty',
];
function getGoogletag(windowRef) {
    return windowRef.googletag;
}
function getSlotTopOffset(slotElementId) {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
        return undefined;
    }
    var element = document.getElementById(slotElementId);
    if (!element) {
        return undefined;
    }
    var rect = element.getBoundingClientRect();
    return Math.round(rect.top + window.scrollY);
}
function getScrollDepthPct() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return undefined;
    }
    var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) {
        return 0;
    }
    return Math.round((window.scrollY / scrollHeight) * 100);
}
function assignSizeRendered(props, size) {
    if (Array.isArray(size) && size.length >= 2) {
        props.width = size[0];
        props.height = size[1];
        props.size_rendered = "".concat(size[0], "x").concat(size[1]);
        return;
    }
    if (typeof size === 'string' && size.length > 0) {
        props.size_rendered = size;
    }
}
function mapGptSlotProperties(event, eventName) {
    var _a, _b, _c, _d, _e, _f, _g;
    var props = {};
    var slot = event.slot;
    var responseInfo = (_b = (_a = slot === null || slot === void 0 ? void 0 : slot.getResponseInformation) === null || _a === void 0 ? void 0 : _a.call(slot)) !== null && _b !== void 0 ? _b : null;
    var slotElementId = (_c = slot === null || slot === void 0 ? void 0 : slot.getSlotElementId) === null || _c === void 0 ? void 0 : _c.call(slot);
    if (slotElementId) {
        props.slot_element_id = slotElementId;
        props.slot_id = slotElementId;
        var slotTopOffset = getSlotTopOffset(slotElementId);
        if (slotTopOffset !== undefined) {
            props.slot_top_offset = slotTopOffset;
        }
    }
    var adUnitPath = (_d = slot === null || slot === void 0 ? void 0 : slot.getAdUnitPath) === null || _d === void 0 ? void 0 : _d.call(slot);
    if (adUnitPath) {
        props.ad_unit_path = adUnitPath;
    }
    if (typeof event.isEmpty === 'boolean') {
        props.is_empty = event.isEmpty;
    }
    var isBackfill = typeof event.isBackfill === 'boolean'
        ? event.isBackfill
        : responseInfo === null || responseInfo === void 0 ? void 0 : responseInfo.isBackfill;
    if (typeof isBackfill === 'boolean') {
        props.is_backfill = isBackfill;
    }
    assignSizeRendered(props, event.size);
    var creativeId = (_e = event.creativeId) !== null && _e !== void 0 ? _e : responseInfo === null || responseInfo === void 0 ? void 0 : responseInfo.creativeId;
    if (creativeId !== undefined && creativeId !== '') {
        props.creative_id = creativeId;
    }
    var lineItemId = (_f = event.lineItemId) !== null && _f !== void 0 ? _f : responseInfo === null || responseInfo === void 0 ? void 0 : responseInfo.lineItemId;
    if (lineItemId !== undefined && lineItemId !== '') {
        props.line_item_id = lineItemId;
    }
    var advertiserId = (_g = event.advertiserId) !== null && _g !== void 0 ? _g : responseInfo === null || responseInfo === void 0 ? void 0 : responseInfo.advertiserId;
    if (advertiserId !== undefined && advertiserId !== '') {
        props.advertiser_id = advertiserId;
    }
    props.event_timestamp_ms = Date.now();
    if (eventName === 'slotRenderEnded' && typeof window !== 'undefined') {
        props.scroll_y_at_render = window.scrollY;
        props.slot_visible_on_render = !event.isEmpty;
    }
    if (eventName === 'impressionViewable') {
        var scrollDepth = getScrollDepthPct();
        if (scrollDepth !== undefined) {
            props.scroll_depth = scrollDepth;
        }
    }
    if (eventName === 'slotEmpty' && event.isEmpty) {
        props.reason = 'empty_response';
    }
    return props;
}
function installListeners(track, googletag) {
    var _a;
    var pubads = (_a = googletag.pubads) === null || _a === void 0 ? void 0 : _a.call(googletag);
    if (!pubads) {
        return;
    }
    var _loop_1 = function (eventName) {
        pubads.addEventListener(eventName, function (event) {
            var properties = mapGptSlotProperties(event, eventName);
            void track(eventName, properties);
        });
    };
    for (var _i = 0, CANONICAL_GPT_EVENTS_1 = CANONICAL_GPT_EVENTS; _i < CANONICAL_GPT_EVENTS_1.length; _i++) {
        var eventName = CANONICAL_GPT_EVENTS_1[_i];
        _loop_1(eventName);
    }
}
function mountGptSlotEventListeners(track, options) {
    if (options === void 0) { options = {}; }
    if (typeof window === 'undefined') {
        return;
    }
    if (options.enabled === false) {
        return;
    }
    var w = window;
    var run = function () {
        var api = getGoogletag(w);
        if (!api) {
            return;
        }
        installListeners(track, api);
    };
    if (!w.googletag) {
        w.googletag = { cmd: [] };
    }
    else if (!w.googletag.cmd) {
        w.googletag.cmd = [];
    }
    w.googletag.cmd.push(run);
}
function conversionGptSlotEventsPlugin(options) {
    if (options === void 0) { options = {}; }
    return {
        name: 'Conversion GPT Slot Events',
        type: 'utility',
        version: '0.1.0',
        isLoaded: function () { return true; },
        load: function (_ctx, instance) {
            var analytics = instance;
            mountGptSlotEventListeners(function (eventName, properties) {
                void analytics.track(eventName, properties);
            }, options);
            return Promise.resolve();
        },
    };
}


/***/ }),

/***/ 6159:
/*!******************************************************************************!*\
  !*** ./src/plugins/conversion-collector/identify/normalizeIdentifyTraits.ts ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   normalizeIdentifyTraits: () => (/* binding */ normalizeIdentifyTraits)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _sha256__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./sha256 */ 9358);
/* harmony import */ var _phone__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./phone */ 4653);



var PHONE_TRAIT_KEYS = ['phone', 'whatsapp', 'telefone', 'mobile'];
var NAME_TRAIT_KEYS = ['name'];
function asNonEmptyString(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    var trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function extractEmailDomain(email) {
    var at = email.indexOf('@');
    if (at < 0) {
        return undefined;
    }
    var domain = email
        .slice(at + 1)
        .trim()
        .toLowerCase();
    return domain.length > 0 ? domain : undefined;
}
function hashEmailTrait(rawEmail) {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
        var normalized;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
            normalized = rawEmail.trim().toLowerCase();
            if (!normalized) {
                return [2 /*return*/, ''];
            }
            if ((0,_sha256__WEBPACK_IMPORTED_MODULE_1__.isSha256Hex)(normalized)) {
                return [2 /*return*/, normalized.toLowerCase()];
            }
            return [2 /*return*/, (0,_sha256__WEBPACK_IMPORTED_MODULE_1__.sha256Hex)(normalized)];
        });
    });
}
function hashPhoneTrait(rawPhone, defaultCountryCode) {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
        var trimmed, e164;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
            trimmed = rawPhone.trim();
            if (!trimmed) {
                return [2 /*return*/, ''];
            }
            if ((0,_sha256__WEBPACK_IMPORTED_MODULE_1__.isSha256Hex)(trimmed)) {
                return [2 /*return*/, trimmed.toLowerCase()];
            }
            e164 = (0,_phone__WEBPACK_IMPORTED_MODULE_2__.normalizePhoneToE164)(trimmed, defaultCountryCode);
            if (!e164) {
                return [2 /*return*/, ''];
            }
            return [2 /*return*/, (0,_sha256__WEBPACK_IMPORTED_MODULE_1__.sha256Hex)(e164)];
        });
    });
}
function hashNameTrait(rawName) {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
        var trimmed;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
            trimmed = rawName.trim();
            if (!trimmed) {
                return [2 /*return*/, ''];
            }
            if ((0,_sha256__WEBPACK_IMPORTED_MODULE_1__.isSha256Hex)(trimmed)) {
                return [2 /*return*/, trimmed.toLowerCase()];
            }
            return [2 /*return*/, (0,_sha256__WEBPACK_IMPORTED_MODULE_1__.sha256Hex)(trimmed.toLowerCase())];
        });
    });
}
function normalizeIdentifyTraits(traits, options) {
    var _a;
    if (options === void 0) { options = {}; }
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
        var defaultPhoneCountryCode, out, rawEmail, domainFromEmail, hashedEmail, explicitDomain, _i, PHONE_TRAIT_KEYS_1, key, rawPhone, hashedPhone, _b, NAME_TRAIT_KEYS_1, key, rawName, hashedName;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_c) {
            switch (_c.label) {
                case 0:
                    defaultPhoneCountryCode = (_a = options.defaultPhoneCountryCode) !== null && _a !== void 0 ? _a : '55';
                    out = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, traits);
                    rawEmail = asNonEmptyString(traits.email);
                    if (!rawEmail) return [3 /*break*/, 2];
                    domainFromEmail = extractEmailDomain(rawEmail);
                    return [4 /*yield*/, hashEmailTrait(rawEmail)];
                case 1:
                    hashedEmail = _c.sent();
                    if (hashedEmail) {
                        out.email = hashedEmail;
                        out.email_hash = hashedEmail;
                    }
                    if (domainFromEmail && out.email_domain == null) {
                        out.email_domain = domainFromEmail;
                    }
                    _c.label = 2;
                case 2:
                    explicitDomain = asNonEmptyString(traits.email_domain);
                    if (explicitDomain) {
                        out.email_domain = explicitDomain.toLowerCase();
                    }
                    _i = 0, PHONE_TRAIT_KEYS_1 = PHONE_TRAIT_KEYS;
                    _c.label = 3;
                case 3:
                    if (!(_i < PHONE_TRAIT_KEYS_1.length)) return [3 /*break*/, 6];
                    key = PHONE_TRAIT_KEYS_1[_i];
                    rawPhone = asNonEmptyString(traits[key]);
                    if (!rawPhone) {
                        return [3 /*break*/, 5];
                    }
                    return [4 /*yield*/, hashPhoneTrait(rawPhone, defaultPhoneCountryCode)];
                case 4:
                    hashedPhone = _c.sent();
                    if (hashedPhone) {
                        out[key] = hashedPhone;
                        if (key === 'phone' || out.phone_hash == null) {
                            out.phone_hash = hashedPhone;
                        }
                    }
                    _c.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    _b = 0, NAME_TRAIT_KEYS_1 = NAME_TRAIT_KEYS;
                    _c.label = 7;
                case 7:
                    if (!(_b < NAME_TRAIT_KEYS_1.length)) return [3 /*break*/, 10];
                    key = NAME_TRAIT_KEYS_1[_b];
                    rawName = asNonEmptyString(traits[key]);
                    if (!rawName) {
                        return [3 /*break*/, 9];
                    }
                    return [4 /*yield*/, hashNameTrait(rawName)];
                case 8:
                    hashedName = _c.sent();
                    if (hashedName) {
                        out[key] = hashedName;
                    }
                    _c.label = 9;
                case 9:
                    _b++;
                    return [3 /*break*/, 7];
                case 10: return [2 /*return*/, out];
            }
        });
    });
}


/***/ }),

/***/ 4653:
/*!************************************************************!*\
  !*** ./src/plugins/conversion-collector/identify/phone.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   normalizePhoneToE164: () => (/* binding */ normalizePhoneToE164)
/* harmony export */ });
/** Normalizes phone to E.164 (e.g. `+5511987654321`). */
function normalizePhoneToE164(phone, defaultCountryCode) {
    if (defaultCountryCode === void 0) { defaultCountryCode = '55'; }
    var trimmed = phone.trim();
    if (!trimmed) {
        return '';
    }
    if (trimmed.startsWith('+')) {
        var digits_1 = trimmed.slice(1).replace(/\D/g, '');
        return digits_1 ? "+".concat(digits_1) : '';
    }
    var digits = trimmed.replace(/\D/g, '');
    if (!digits) {
        return '';
    }
    if (digits.startsWith(defaultCountryCode)) {
        return "+".concat(digits);
    }
    if (defaultCountryCode === '55' &&
        (digits.length === 10 || digits.length === 11)) {
        return "+55".concat(digits);
    }
    return "+".concat(digits);
}


/***/ }),

/***/ 9358:
/*!*************************************************************!*\
  !*** ./src/plugins/conversion-collector/identify/sha256.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isSha256Hex: () => (/* binding */ isSha256Hex),
/* harmony export */   sha256Hex: () => (/* binding */ sha256Hex)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

var SHA256_HEX_RE = /^[a-f0-9]{64}$/i;
function isSha256Hex(value) {
    return SHA256_HEX_RE.test(value.trim());
}
function sha256Hex(value) {
    var _a;
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
        var normalized, data, hash;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_b) {
            switch (_b.label) {
                case 0:
                    normalized = value.trim();
                    if (!normalized) {
                        return [2 /*return*/, ''];
                    }
                    if (typeof crypto === 'undefined' || !((_a = crypto.subtle) === null || _a === void 0 ? void 0 : _a.digest)) {
                        throw new Error('SHA-256 is not available in this environment');
                    }
                    data = new TextEncoder().encode(normalized);
                    return [4 /*yield*/, crypto.subtle.digest('SHA-256', data)];
                case 1:
                    hash = _b.sent();
                    return [2 /*return*/, Array.from(new Uint8Array(hash))
                            .map(function (byte) { return byte.toString(16).padStart(2, '0'); })
                            .join('')];
            }
        });
    });
}


/***/ }),

/***/ 9480:
/*!********************************************************************!*\
  !*** ./src/plugins/conversion-collector/lib/apply-query-params.ts ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   applyQueryParamsToProperties: () => (/* binding */ applyQueryParamsToProperties)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _query_params_dedicated__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./query-params-dedicated */ 75);


function applyQueryParamsToProperties(properties, queryParams) {
    if (Object.keys(queryParams).length === 0) {
        return properties;
    }
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, properties), (0,_query_params_dedicated__WEBPACK_IMPORTED_MODULE_1__.spreadDedicatedQueryParams)(queryParams)), { query_params: queryParams });
}


/***/ }),

/***/ 4358:
/*!*********************************************************************!*\
  !*** ./src/plugins/conversion-collector/lib/event-queue-storage.ts ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EVENT_QUEUE_STORAGE_KEY: () => (/* binding */ EVENT_QUEUE_STORAGE_KEY),
/* harmony export */   MAX_PERSISTED_BYTES: () => (/* binding */ MAX_PERSISTED_BYTES),
/* harmony export */   MAX_PERSISTED_EVENTS: () => (/* binding */ MAX_PERSISTED_EVENTS),
/* harmony export */   clearPersistedEventQueue: () => (/* binding */ clearPersistedEventQueue),
/* harmony export */   readPersistedEventQueue: () => (/* binding */ readPersistedEventQueue),
/* harmony export */   writePersistedEventQueue: () => (/* binding */ writePersistedEventQueue)
/* harmony export */ });
var EVENT_QUEUE_STORAGE_KEY = 'utua_event_queue';
var MAX_PERSISTED_EVENTS = 100;
var MAX_PERSISTED_BYTES = 1024 * 1024;
function isBrowserStorageAvailable() {
    if (typeof window === 'undefined') {
        return false;
    }
    try {
        var key = '__utua_storage_probe__';
        window.localStorage.setItem(key, '1');
        window.localStorage.removeItem(key);
        return true;
    }
    catch (_a) {
        return false;
    }
}
function isValidEnvelope(value) {
    if (!value || typeof value !== 'object') {
        return false;
    }
    var envelope = value;
    return ((envelope.type === 'track' || envelope.type === 'identify') &&
        typeof envelope.anonymous_id === 'string' &&
        typeof envelope.message_id === 'string' &&
        typeof envelope.timestamp === 'string' &&
        envelope.version === 2 &&
        typeof envelope.context === 'object');
}
function trimQueue(events) {
    var trimmed = events.slice(-MAX_PERSISTED_EVENTS);
    while (trimmed.length > 0) {
        var serialized = JSON.stringify(trimmed);
        if (serialized.length <= MAX_PERSISTED_BYTES) {
            return trimmed;
        }
        trimmed = trimmed.slice(1);
    }
    return [];
}
function readPersistedEventQueue() {
    if (!isBrowserStorageAvailable()) {
        return [];
    }
    try {
        var raw = window.localStorage.getItem(EVENT_QUEUE_STORAGE_KEY);
        if (!raw) {
            return [];
        }
        var parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.filter(isValidEnvelope);
    }
    catch (_a) {
        return [];
    }
}
function writePersistedEventQueue(events) {
    if (!isBrowserStorageAvailable()) {
        return;
    }
    try {
        if (events.length === 0) {
            window.localStorage.removeItem(EVENT_QUEUE_STORAGE_KEY);
            return;
        }
        var trimmed = trimQueue(events);
        if (trimmed.length === 0) {
            window.localStorage.removeItem(EVENT_QUEUE_STORAGE_KEY);
            return;
        }
        window.localStorage.setItem(EVENT_QUEUE_STORAGE_KEY, JSON.stringify(trimmed));
    }
    catch (_a) {
        // Quota exceeded or storage blocked — drop persistence silently.
    }
}
function clearPersistedEventQueue() {
    if (!isBrowserStorageAvailable()) {
        return;
    }
    try {
        window.localStorage.removeItem(EVENT_QUEUE_STORAGE_KEY);
    }
    catch (_a) {
        // ignore
    }
}


/***/ }),

/***/ 8935:
/*!*****************************************************************!*\
  !*** ./src/plugins/conversion-collector/lib/page-properties.ts ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   buildPageEventProperties: () => (/* binding */ buildPageEventProperties),
/* harmony export */   enrichWithSessionQueryParams: () => (/* binding */ enrichWithSessionQueryParams)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _apply_query_params__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./apply-query-params */ 9480);
/* harmony import */ var _query_params__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./query-params */ 3155);
/* harmony import */ var _page_taxonomy__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./page-taxonomy */ 1341);
/* harmony import */ var _visitor_country__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./visitor-country */ 2777);





function buildPageEventProperties(config, userProperties) {
    if (userProperties === void 0) { userProperties = {}; }
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
        var queryParams, taxonomy, visitorCountry;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryParams = (0,_query_params__WEBPACK_IMPORTED_MODULE_1__.getOrCaptureSessionQueryParams)();
                    taxonomy = (0,_page_taxonomy__WEBPACK_IMPORTED_MODULE_2__.parsePathTaxonomy)((0,_page_taxonomy__WEBPACK_IMPORTED_MODULE_2__.getPagePath)());
                    return [4 /*yield*/, (0,_visitor_country__WEBPACK_IMPORTED_MODULE_3__.resolveVisitorCountry)(config)];
                case 1:
                    visitorCountry = _a.sent();
                    return [2 /*return*/, (0,_apply_query_params__WEBPACK_IMPORTED_MODULE_4__.applyQueryParamsToProperties)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, userProperties), { page_path: (0,_page_taxonomy__WEBPACK_IMPORTED_MODULE_2__.getPagePath)(), visitor_country: visitorCountry, country: taxonomy.country, vertical: taxonomy.vertical, product: taxonomy.product, funnel: taxonomy.funnel }), queryParams)];
            }
        });
    });
}
function enrichWithSessionQueryParams(properties) {
    var queryParams = (0,_query_params__WEBPACK_IMPORTED_MODULE_1__.getOrCaptureSessionQueryParams)();
    return (0,_apply_query_params__WEBPACK_IMPORTED_MODULE_4__.applyQueryParamsToProperties)(properties, queryParams);
}


/***/ }),

/***/ 1341:
/*!***************************************************************!*\
  !*** ./src/plugins/conversion-collector/lib/page-taxonomy.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getPagePath: () => (/* binding */ getPagePath),
/* harmony export */   parsePathTaxonomy: () => (/* binding */ parsePathTaxonomy)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

var EMPTY_TAXONOMY = {
    country: '',
    vertical: '',
    product: '',
    funnel: '',
};
function parsePathTaxonomy(pathname) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var trimmed = pathname.replace(/^\/+|\/+$/g, '');
    var firstSegment = (_a = trimmed.split('/')[0]) !== null && _a !== void 0 ? _a : '';
    if (!firstSegment) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, EMPTY_TAXONOMY);
    }
    var parts = firstSegment.split('-');
    if (parts.length < 4) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, EMPTY_TAXONOMY);
    }
    if (parts.length === 4) {
        return {
            country: (_b = parts[0]) !== null && _b !== void 0 ? _b : '',
            vertical: (_c = parts[1]) !== null && _c !== void 0 ? _c : '',
            product: (_d = parts[2]) !== null && _d !== void 0 ? _d : '',
            funnel: (_e = parts[3]) !== null && _e !== void 0 ? _e : '',
        };
    }
    return {
        country: (_f = parts[0]) !== null && _f !== void 0 ? _f : '',
        vertical: (_g = parts[1]) !== null && _g !== void 0 ? _g : '',
        product: parts.slice(2, -1).join('-'),
        funnel: (_h = parts[parts.length - 1]) !== null && _h !== void 0 ? _h : '',
    };
}
function getPagePath() {
    if (typeof window === 'undefined') {
        return '';
    }
    return window.location.pathname || '';
}


/***/ }),

/***/ 75:
/*!************************************************************************!*\
  !*** ./src/plugins/conversion-collector/lib/query-params-dedicated.ts ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEDICATED_QUERY_PARAM_KEYS: () => (/* binding */ DEDICATED_QUERY_PARAM_KEYS),
/* harmony export */   spreadDedicatedQueryParams: () => (/* binding */ spreadDedicatedQueryParams)
/* harmony export */ });
/** Keys promoted to top-level `properties` (also kept inside `query_params`). */
var DEDICATED_QUERY_PARAM_KEYS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'gclid',
    'fbclid',
    'tt_clid',
    'ttclid',
    'msclkid',
    'twclid',
    'to',
    'p',
    'ref',
];
function spreadDedicatedQueryParams(queryParams) {
    var dedicated = {};
    for (var _i = 0, DEDICATED_QUERY_PARAM_KEYS_1 = DEDICATED_QUERY_PARAM_KEYS; _i < DEDICATED_QUERY_PARAM_KEYS_1.length; _i++) {
        var key = DEDICATED_QUERY_PARAM_KEYS_1[_i];
        var value = queryParams[key];
        if (value !== undefined && value !== '') {
            dedicated[key] = value;
        }
    }
    return dedicated;
}


/***/ }),

/***/ 3155:
/*!**************************************************************!*\
  !*** ./src/plugins/conversion-collector/lib/query-params.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getOrCaptureSessionQueryParams: () => (/* binding */ getOrCaptureSessionQueryParams),
/* harmony export */   parseLocationSearchParams: () => (/* binding */ parseLocationSearchParams)
/* harmony export */ });
var QUERY_PARAMS_SESSION_KEY = '__bg_analytics_query_params';
function parseLocationSearchParams(search) {
    var params = {};
    var raw = search !== null && search !== void 0 ? search : (typeof window !== 'undefined' ? window.location.search : '');
    if (!raw) {
        return params;
    }
    var query = raw.startsWith('?') ? raw.slice(1) : raw;
    var usp = new URLSearchParams(query);
    usp.forEach(function (value, key) {
        params[key] = value;
    });
    return params;
}
function getOrCaptureSessionQueryParams() {
    if (typeof window === 'undefined') {
        return {};
    }
    try {
        var stored = window.sessionStorage.getItem(QUERY_PARAMS_SESSION_KEY);
        if (stored) {
            var parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed;
            }
        }
    }
    catch (_a) {
        // fall through to capture
    }
    var captured = parseLocationSearchParams();
    try {
        window.sessionStorage.setItem(QUERY_PARAMS_SESSION_KEY, JSON.stringify(captured));
    }
    catch (_b) {
        // sessionStorage unavailable
    }
    return captured;
}


/***/ }),

/***/ 2754:
/*!*****************************************************************!*\
  !*** ./src/plugins/conversion-collector/lib/resolve-context.ts ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolveContext: () => (/* binding */ resolveContext)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _generated_version__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../generated/version */ 6452);


var SDK_LIBRARY = {
    name: 'conversion-analytics-sdk',
    version: _generated_version__WEBPACK_IMPORTED_MODULE_0__.version,
};
function resolveContext(config, extraContext) {
    var _a, _b;
    var runtimeContext = {};
    if (typeof window !== 'undefined') {
        var referrer = document.referrer || undefined;
        var location = window.location;
        var timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        var navigatorWithHints = navigator;
        runtimeContext.page = {
            path: location.pathname,
            referrer: referrer,
            search: location.search,
            title: document.title || undefined,
            url: location.href,
        };
        runtimeContext.library = SDK_LIBRARY;
        runtimeContext.channel = 'browser';
        runtimeContext.locale = navigator.language;
        runtimeContext.screen = {
            width: window.screen.width,
            height: window.screen.height,
        };
        runtimeContext.userAgent = navigator.userAgent;
        runtimeContext.timezone = timezone || undefined;
        if (config.appName) {
            runtimeContext.app = {
                name: config.appName,
            };
        }
        if (navigatorWithHints.userAgentData) {
            runtimeContext.userAgentData = {
                brands: navigatorWithHints.userAgentData.brands,
                mobile: navigatorWithHints.userAgentData.mobile,
                platform: navigatorWithHints.userAgentData.platform,
            };
        }
    }
    var dynamic = (_b = (_a = config.getContext) === null || _a === void 0 ? void 0 : _a.call(config)) !== null && _b !== void 0 ? _b : {};
    return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({ app_name: config.appName }, runtimeContext), dynamic), extraContext);
}


/***/ }),

/***/ 1644:
/*!*********************************************************!*\
  !*** ./src/plugins/conversion-collector/lib/session.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SESSION_INACTIVITY_TTL_MS: () => (/* binding */ SESSION_INACTIVITY_TTL_MS),
/* harmony export */   getOrCreateAnonymousId: () => (/* binding */ getOrCreateAnonymousId),
/* harmony export */   getOrCreateSessionId: () => (/* binding */ getOrCreateSessionId)
/* harmony export */ });
/* harmony import */ var _uuid__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./uuid */ 5129);

var SESSION_ID_COOKIE = '__bg_analytics_session_id';
var SESSION_ACTIVITY_COOKIE = '__bg_analytics_session_activity';
var ANONYMOUS_ID_KEY = '__bg_analytics_anonymous_id';
/** Inactivity window aligned with PRD / Redis finalizer (5 minutes). */
var SESSION_INACTIVITY_TTL_MS = 5 * 60 * 1000;
function getCookie(name) {
    if (typeof document === 'undefined') {
        return null;
    }
    var escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var match = document.cookie.match(new RegExp("(?:^|; )".concat(escaped, "=([^;]*)")));
    return (match === null || match === void 0 ? void 0 : match[1]) != null ? decodeURIComponent(match[1]) : null;
}
function setCookie(name, value, maxAgeSeconds) {
    var _a;
    if (typeof document === 'undefined') {
        return;
    }
    var maxAge = Math.max(1, Math.ceil(maxAgeSeconds));
    var secure = typeof window !== 'undefined' && ((_a = window.location) === null || _a === void 0 ? void 0 : _a.protocol) === 'https:'
        ? '; Secure'
        : '';
    document.cookie = "".concat(encodeURIComponent(name), "=").concat(encodeURIComponent(value), "; path=/; max-age=").concat(maxAge, "; SameSite=Lax").concat(secure);
}
function touchSessionCookies(sessionId, activityMs) {
    var maxAgeSec = SESSION_INACTIVITY_TTL_MS / 1000;
    setCookie(SESSION_ID_COOKIE, sessionId, maxAgeSec);
    setCookie(SESSION_ACTIVITY_COOKIE, String(activityMs), maxAgeSec);
}
function getOrCreateSessionId() {
    if (typeof window === 'undefined') {
        return (0,_uuid__WEBPACK_IMPORTED_MODULE_0__.generateUuidV4)();
    }
    var now = Date.now();
    try {
        var existingId = getCookie(SESSION_ID_COOKIE);
        var lastActivityRaw = getCookie(SESSION_ACTIVITY_COOKIE);
        var lastActivity = lastActivityRaw ? Number(lastActivityRaw) : 0;
        if (existingId &&
            (0,_uuid__WEBPACK_IMPORTED_MODULE_0__.isValidUuidV4)(existingId) &&
            lastActivity > 0 &&
            now - lastActivity <= SESSION_INACTIVITY_TTL_MS) {
            touchSessionCookies(existingId, now);
            return existingId;
        }
    }
    catch (_a) {
        // fall through to new session
    }
    var nextId = (0,_uuid__WEBPACK_IMPORTED_MODULE_0__.generateUuidV4)();
    try {
        touchSessionCookies(nextId, now);
    }
    catch (_b) {
        // cookie unavailable
    }
    return nextId;
}
function getOrCreateAnonymousId() {
    var _a, _b;
    if (typeof window === 'undefined') {
        return (0,_uuid__WEBPACK_IMPORTED_MODULE_0__.generateUuidV4)();
    }
    try {
        var existing = (_a = window.localStorage) === null || _a === void 0 ? void 0 : _a.getItem(ANONYMOUS_ID_KEY);
        if (existing && (0,_uuid__WEBPACK_IMPORTED_MODULE_0__.isValidUuidV4)(existing)) {
            return existing;
        }
        var nextId = (0,_uuid__WEBPACK_IMPORTED_MODULE_0__.generateUuidV4)();
        (_b = window.localStorage) === null || _b === void 0 ? void 0 : _b.setItem(ANONYMOUS_ID_KEY, nextId);
        return nextId;
    }
    catch (_c) {
        return (0,_uuid__WEBPACK_IMPORTED_MODULE_0__.generateUuidV4)();
    }
}


/***/ }),

/***/ 5129:
/*!******************************************************!*\
  !*** ./src/plugins/conversion-collector/lib/uuid.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   generateUuidV4: () => (/* binding */ generateUuidV4),
/* harmony export */   isValidUuidV4: () => (/* binding */ isValidUuidV4)
/* harmony export */ });
/** RFC 4122 UUID v4 (variant 1, version 4). */
var UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUuidV4(value) {
    return UUID_V4_REGEX.test(value);
}
function generateUuidV4() {
    var _a;
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    var bytes = new Uint8Array(16);
    var getRandomValues = (_a = globalThis.crypto) === null || _a === void 0 ? void 0 : _a.getRandomValues;
    if (getRandomValues) {
        getRandomValues(bytes);
    }
    else {
        for (var i = 0; i < 16; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = Array.from(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    return "".concat(hex.slice(0, 8), "-").concat(hex.slice(8, 12), "-").concat(hex.slice(12, 16), "-").concat(hex.slice(16, 20), "-").concat(hex.slice(20));
}


/***/ }),

/***/ 2777:
/*!*****************************************************************!*\
  !*** ./src/plugins/conversion-collector/lib/visitor-country.ts ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolveVisitorCountry: () => (/* binding */ resolveVisitorCountry),
/* harmony export */   visitorCountryFromNavigator: () => (/* binding */ visitorCountryFromNavigator)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

function visitorCountryFromNavigator() {
    var _a, _b, _c, _d;
    if (typeof navigator === 'undefined') {
        return '';
    }
    var language = (_b = (_a = navigator.language) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
    if (!language) {
        return '';
    }
    var parts = language.split('-');
    if (parts.length >= 2) {
        var region = (_d = (_c = parts[parts.length - 1]) === null || _c === void 0 ? void 0 : _c.trim().toUpperCase()) !== null && _d !== void 0 ? _d : '';
        if (/^[A-Z]{2}$/.test(region)) {
            return region;
        }
    }
    return '';
}
function resolveVisitorCountry(config) {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
        var resolved, trimmed, _a;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!config.getVisitorCountry) return [3 /*break*/, 4];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, config.getVisitorCountry()];
                case 2:
                    resolved = _b.sent();
                    trimmed = resolved === null || resolved === void 0 ? void 0 : resolved.trim();
                    if (trimmed) {
                        return [2 /*return*/, trimmed];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, visitorCountryFromNavigator()];
            }
        });
    });
}


/***/ }),

/***/ 3093:
/*!**************************************************************!*\
  !*** ./src/plugins/conversion-collector/pipeline-plugins.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   conversionPipelinePlugins: () => (/* binding */ conversionPipelinePlugins)
/* harmony export */ });
/* harmony import */ var _enrichment_consent_enrichment__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./enrichment/consent-enrichment */ 6406);
/* harmony import */ var _enrichment_context_enrichment__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./enrichment/context-enrichment */ 7141);
/* harmony import */ var _enrichment_identify_enrichment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./enrichment/identify-enrichment */ 2998);
/* harmony import */ var _enrichment_page_enrichment__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./enrichment/page-enrichment */ 2407);
/* harmony import */ var _gpt_slot_events__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./gpt-slot-events */ 7234);
/* harmony import */ var _destination_plugin__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./destination-plugin */ 2674);






/**
 * Registers the full UTUA conversion pipeline: consent → context → PII → page → collector (+ optional GPT).
 * Pass the returned array as `plugins` in `AnalyticsBrowser.load`.
 */
function conversionPipelinePlugins(settings) {
    var plugins = [
        (0,_enrichment_consent_enrichment__WEBPACK_IMPORTED_MODULE_0__.conversionConsentEnrichment)(settings),
        (0,_enrichment_context_enrichment__WEBPACK_IMPORTED_MODULE_1__.conversionContextEnrichment)(settings),
        (0,_enrichment_identify_enrichment__WEBPACK_IMPORTED_MODULE_2__.conversionIdentifyEnrichment)(settings),
        (0,_enrichment_page_enrichment__WEBPACK_IMPORTED_MODULE_3__.conversionPageEnrichment)(settings),
        (0,_destination_plugin__WEBPACK_IMPORTED_MODULE_4__.conversionCollectorPlugin)(settings),
    ];
    if (settings.enableGptSlotEvents === true) {
        plugins.push((0,_gpt_slot_events__WEBPACK_IMPORTED_MODULE_5__.conversionGptSlotEventsPlugin)());
    }
    return plugins;
}


/***/ }),

/***/ 1322:
/*!**************************************************************!*\
  !*** ./src/plugins/conversion-collector/runtime-registry.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getConversionCollectorBuffer: () => (/* binding */ getConversionCollectorBuffer),
/* harmony export */   registerConversionCollectorBuffer: () => (/* binding */ registerConversionCollectorBuffer)
/* harmony export */ });
var buffers = new WeakMap();
function registerConversionCollectorBuffer(analytics, buffer) {
    buffers.set(analytics, buffer);
}
function getConversionCollectorBuffer(analytics) {
    return buffers.get(analytics);
}


/***/ }),

/***/ 2860:
/*!*********************************************************!*\
  !*** ./src/plugins/conversion-collector/send-events.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BEACON_PAYLOAD_LIMIT_BYTES: () => (/* binding */ BEACON_PAYLOAD_LIMIT_BYTES),
/* harmony export */   CollectDeliveryError: () => (/* binding */ CollectDeliveryError),
/* harmony export */   buildCollectRequestBody: () => (/* binding */ buildCollectRequestBody),
/* harmony export */   deliverCollectPayload: () => (/* binding */ deliverCollectPayload),
/* harmony export */   sendCollectViaBeacon: () => (/* binding */ sendCollectViaBeacon),
/* harmony export */   sendEventsToCollect: () => (/* binding */ sendEventsToCollect)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

var BASE_RETRY_MS = 1000;
var MAX_RETRY_MS = 30000;
var MAX_RETRY_ATTEMPTS = 3;
/** sendBeacon payload limit (conservative). */
var BEACON_PAYLOAD_LIMIT_BYTES = 64 * 1024;
var CollectDeliveryError = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(CollectDeliveryError, _super);
    function CollectDeliveryError(message, retryable, retryAfterMs) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, message) || this;
        _this.name = 'CollectDeliveryError';
        Object.setPrototypeOf(_this, _newTarget.prototype);
        _this.retryable = retryable;
        _this.retryAfterMs = retryAfterMs;
        return _this;
    }
    return CollectDeliveryError;
}(Error));

function wait(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
function parseRetryAfterMs(header) {
    if (!header) {
        return undefined;
    }
    var seconds = Number(header);
    if (!Number.isNaN(seconds) && seconds >= 0) {
        return seconds * 1000;
    }
    var dateMs = Date.parse(header);
    if (!Number.isNaN(dateMs)) {
        return Math.max(0, dateMs - Date.now());
    }
    return undefined;
}
function classifyHttpFailure(status, headers) {
    var _a;
    if (status === 429) {
        return {
            retryable: true,
            retryAfterMs: parseRetryAfterMs((_a = headers === null || headers === void 0 ? void 0 : headers.get('Retry-After')) !== null && _a !== void 0 ? _a : null),
        };
    }
    if (status >= 500) {
        return { retryable: true };
    }
    if (status >= 400) {
        return { retryable: false };
    }
    return { retryable: false };
}
function buildCollectRequestBody(events) {
    var sentAt = new Date().toISOString();
    return JSON.stringify({
        events: events.map(function (event) { return ((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, event), { sent_at: sentAt })); }),
    });
}
function sendCollectViaBeacon(endpoint, body) {
    if (typeof navigator === 'undefined' ||
        typeof navigator.sendBeacon !== 'function') {
        return false;
    }
    if (body.length > BEACON_PAYLOAD_LIMIT_BYTES) {
        return false;
    }
    var blob = new Blob([body], { type: 'application/json' });
    return navigator.sendBeacon(endpoint, blob);
}
function deliverCollectPayload(body, config, transport) {
    if (transport === void 0) { transport = {}; }
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
        var response, error_1, _a, retryable, retryAfterMs;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch(config.endpoint, {
                            method: 'POST',
                            headers: (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({ 'Content-Type': 'application/json' }, config.headers),
                            body: body,
                            keepalive: transport.keepalive === true,
                        })];
                case 1:
                    response = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _b.sent();
                    throw new CollectDeliveryError(error_1 instanceof Error ? error_1.message : 'Collect network error', true);
                case 3:
                    if (response.ok) {
                        return [2 /*return*/];
                    }
                    _a = classifyHttpFailure(response.status, response.headers), retryable = _a.retryable, retryAfterMs = _a.retryAfterMs;
                    throw new CollectDeliveryError("Collect failed with status ".concat(response.status), retryable, retryAfterMs);
            }
        });
    });
}
function computeBackoffMs(attempt, retryAfterMs) {
    if (retryAfterMs != null) {
        return retryAfterMs;
    }
    var exponential = Math.min(BASE_RETRY_MS * Math.pow(2, attempt) + Math.random() * 1000, MAX_RETRY_MS);
    return exponential;
}
function sendEventsToCollect(events, config, transport) {
    var _a;
    if (transport === void 0) { transport = {}; }
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
        var body, maxAttempts, attempt, lastError, error_2, deliveryError;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (events.length === 0) {
                        return [2 /*return*/];
                    }
                    body = buildCollectRequestBody(events);
                    maxAttempts = Math.min((_a = config.retryAttempts) !== null && _a !== void 0 ? _a : 2, MAX_RETRY_ATTEMPTS - 1);
                    attempt = 0;
                    _b.label = 1;
                case 1:
                    if (!(attempt <= maxAttempts)) return [3 /*break*/, 8];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, 6, 7]);
                    return [4 /*yield*/, deliverCollectPayload(body, config, transport)];
                case 3:
                    _b.sent();
                    return [2 /*return*/];
                case 4:
                    error_2 = _b.sent();
                    lastError = error_2;
                    deliveryError = error_2 instanceof CollectDeliveryError
                        ? error_2
                        : new CollectDeliveryError(String(error_2), true);
                    if (!deliveryError.retryable || attempt >= maxAttempts) {
                        throw deliveryError;
                    }
                    return [4 /*yield*/, wait(computeBackoffMs(attempt, deliveryError.retryAfterMs))];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 6:
                    attempt += 1;
                    return [7 /*endfinally*/];
                case 7: return [3 /*break*/, 1];
                case 8: throw lastError instanceof Error
                    ? lastError
                    : new CollectDeliveryError('Collect request failed', true);
            }
        });
    });
}


/***/ }),

/***/ 6761:
/*!*********************************************!*\
  !*** ./src/plugins/env-enrichment/index.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ampId: () => (/* binding */ ampId),
/* harmony export */   envEnrichment: () => (/* binding */ envEnrichment),
/* harmony export */   utm: () => (/* binding */ utm)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var js_cookie__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! js-cookie */ 3478);
/* harmony import */ var _generated_version__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../generated/version */ 6452);
/* harmony import */ var _lib_version_type__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../lib/version-type */ 3831);
/* harmony import */ var _core_user_tld__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../core/user/tld */ 9894);
/* harmony import */ var _core_query_string_gracefulDecodeURIComponent__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../core/query-string/gracefulDecodeURIComponent */ 9059);
/* harmony import */ var _core_storage__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../core/storage */ 2890);
/* harmony import */ var _core_storage__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../core/storage */ 7601);
/* harmony import */ var _lib_client_hints__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../lib/client-hints */ 4083);








var cookieOptions;
function getCookieOptions() {
    if (cookieOptions) {
        return cookieOptions;
    }
    var domain = (0,_core_user_tld__WEBPACK_IMPORTED_MODULE_1__.tld)(window.location.href);
    cookieOptions = {
        expires: 31536000000,
        secure: false,
        path: '/',
    };
    if (domain) {
        cookieOptions.domain = domain;
    }
    return cookieOptions;
}
function ads(query) {
    var queryIds = {
        btid: 'dataxu',
        urid: 'millennial-media',
    };
    if (query.startsWith('?')) {
        query = query.substring(1);
    }
    query = query.replace(/\?/g, '&');
    var parts = query.split('&');
    for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var part = parts_1[_i];
        var _a = part.split('='), k = _a[0], v = _a[1];
        if (queryIds[k]) {
            return {
                id: v,
                type: queryIds[k],
            };
        }
    }
}
function utm(query) {
    if (query.startsWith('?')) {
        query = query.substring(1);
    }
    query = query.replace(/\?/g, '&');
    return query.split('&').reduce(function (acc, str) {
        var _a = str.split('='), k = _a[0], _b = _a[1], v = _b === void 0 ? '' : _b;
        if (k.includes('utm_') && k.length > 4) {
            var utmParam = k.slice(4);
            if (utmParam === 'campaign') {
                utmParam = 'name';
            }
            acc[utmParam] = (0,_core_query_string_gracefulDecodeURIComponent__WEBPACK_IMPORTED_MODULE_2__.gracefulDecodeURIComponent)(v);
        }
        return acc;
    }, {});
}
function ampId() {
    var ampId = js_cookie__WEBPACK_IMPORTED_MODULE_0__["default"].get('_ga');
    if (ampId && ampId.startsWith('amp')) {
        return ampId;
    }
}
function referrerId(query, ctx, disablePersistance) {
    var _a;
    var storage = new _core_storage__WEBPACK_IMPORTED_MODULE_3__.UniversalStorage(disablePersistance ? [] : [new _core_storage__WEBPACK_IMPORTED_MODULE_4__.CookieStorage(getCookieOptions())]);
    var stored = storage.get('s:context.referrer');
    var ad = (_a = ads(query)) !== null && _a !== void 0 ? _a : stored;
    if (!ad) {
        return;
    }
    if (ctx) {
        ctx.referrer = (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_5__.__assign)({}, ctx.referrer), ad);
    }
    storage.set('s:context.referrer', ad);
}
/**
 *
 * @param obj e.g. { foo: 'b', bar: 'd', baz: ['123', '456']}
 * @returns e.g. 'foo=b&bar=d&baz=123&baz=456'
 */
var objectToQueryString = function (obj) {
    try {
        var searchParams_1 = new URLSearchParams();
        Object.entries(obj).forEach(function (_a) {
            var k = _a[0], v = _a[1];
            if (Array.isArray(v)) {
                v.forEach(function (value) { return searchParams_1.append(k, value); });
            }
            else {
                searchParams_1.append(k, v);
            }
        });
        return searchParams_1.toString();
    }
    catch (_a) {
        return '';
    }
};
var EnvironmentEnrichmentPlugin = /** @class */ (function () {
    function EnvironmentEnrichmentPlugin() {
        var _this = this;
        this.name = 'Page Enrichment';
        this.type = 'before';
        this.version = '0.1.0';
        this.isLoaded = function () { return true; };
        this.load = function (_ctx, instance) { return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(_this, void 0, void 0, function () {
            var _a, _1;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__generator)(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.instance = instance;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        _a = this;
                        return [4 /*yield*/, (0,_lib_client_hints__WEBPACK_IMPORTED_MODULE_6__.clientHints)(this.instance.options.highEntropyValuesClientHints)];
                    case 2:
                        _a.userAgentData = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _1 = _b.sent();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, Promise.resolve()];
                }
            });
        }); };
        this.enrich = function (ctx) {
            var _a, _b;
            // Note: Types are off - context should never be undefined here, since it is set as part of event creation.
            var evtCtx = ctx.event.context;
            var search = evtCtx.page.search || '';
            var query = typeof search === 'object' ? objectToQueryString(search) : search;
            evtCtx.userAgent = navigator.userAgent;
            evtCtx.userAgentData = _this.userAgentData;
            // @ts-ignore
            var locale = navigator.userLanguage || navigator.language;
            if (typeof evtCtx.locale === 'undefined' && typeof locale !== 'undefined') {
                evtCtx.locale = locale;
            }
            (_a = evtCtx.library) !== null && _a !== void 0 ? _a : (evtCtx.library = {
                name: 'analytics.js',
                version: "".concat((0,_lib_version_type__WEBPACK_IMPORTED_MODULE_7__.getVersionType)() === 'web' ? 'next' : 'npm:next', "-").concat(_generated_version__WEBPACK_IMPORTED_MODULE_8__.version),
            });
            if (query && !evtCtx.campaign) {
                evtCtx.campaign = utm(query);
            }
            var amp = ampId();
            if (amp) {
                evtCtx.amp = { id: amp };
            }
            referrerId(query, evtCtx, (_b = _this.instance.options.disableClientPersistence) !== null && _b !== void 0 ? _b : false);
            try {
                evtCtx.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            }
            catch (_) {
                // If browser doesn't have support leave timezone undefined
            }
            return ctx;
        };
        this.track = this.enrich;
        this.identify = this.enrich;
        this.page = this.enrich;
        this.group = this.enrich;
        this.alias = this.enrich;
        this.screen = this.enrich;
    }
    return EnvironmentEnrichmentPlugin;
}());
var envEnrichment = new EnvironmentEnrichmentPlugin();


/***/ }),

/***/ 1418:
/*!*****************************************!*\
  !*** ./src/plugins/middleware/index.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   applyDestinationMiddleware: () => (/* binding */ applyDestinationMiddleware),
/* harmony export */   sourceMiddlewarePlugin: () => (/* binding */ sourceMiddlewarePlugin)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _core_context__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../core/context */ 7070);
/* harmony import */ var _lib_to_facade__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../lib/to-facade */ 7536);



function applyDestinationMiddleware(destination, evt, middleware) {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
        function applyMiddleware(event, fn) {
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
                var nextCalled, returnedEvent;
                var _a;
                return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            nextCalled = false;
                            returnedEvent = null;
                            return [4 /*yield*/, fn({
                                    payload: (0,_lib_to_facade__WEBPACK_IMPORTED_MODULE_1__.toFacade)(event, {
                                        clone: true,
                                        traverse: false,
                                    }),
                                    integration: destination,
                                    next: function (evt) {
                                        nextCalled = true;
                                        if (evt === null) {
                                            returnedEvent = null;
                                        }
                                        if (evt) {
                                            returnedEvent = evt.obj;
                                        }
                                    },
                                })];
                        case 1:
                            _b.sent();
                            if (!nextCalled && returnedEvent !== null) {
                                returnedEvent = returnedEvent;
                                returnedEvent.integrations = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, event.integrations), (_a = {}, _a[destination] = false, _a));
                            }
                            return [2 /*return*/, returnedEvent];
                    }
                });
            });
        }
        var modifiedEvent, _i, middleware_1, md, result;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    modifiedEvent = (0,_lib_to_facade__WEBPACK_IMPORTED_MODULE_1__.toFacade)(evt, {
                        clone: true,
                        traverse: false,
                    }).rawEvent();
                    _i = 0, middleware_1 = middleware;
                    _a.label = 1;
                case 1:
                    if (!(_i < middleware_1.length)) return [3 /*break*/, 4];
                    md = middleware_1[_i];
                    return [4 /*yield*/, applyMiddleware(modifiedEvent, md)];
                case 2:
                    result = _a.sent();
                    if (result === null) {
                        return [2 /*return*/, null];
                    }
                    modifiedEvent = result;
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, modifiedEvent];
            }
        });
    });
}
function sourceMiddlewarePlugin(fn, integrations) {
    function apply(ctx) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            var nextCalled;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nextCalled = false;
                        return [4 /*yield*/, fn({
                                payload: (0,_lib_to_facade__WEBPACK_IMPORTED_MODULE_1__.toFacade)(ctx.event, {
                                    clone: true,
                                    traverse: false,
                                }),
                                integrations: integrations !== null && integrations !== void 0 ? integrations : {},
                                next: function (evt) {
                                    nextCalled = true;
                                    if (evt) {
                                        ctx.event = evt.obj;
                                    }
                                },
                            })];
                    case 1:
                        _a.sent();
                        if (!nextCalled) {
                            throw new _core_context__WEBPACK_IMPORTED_MODULE_2__.ContextCancelation({
                                retry: false,
                                type: 'middleware_cancellation',
                                reason: 'Middleware `next` function skipped',
                            });
                        }
                        return [2 /*return*/, ctx];
                }
            });
        });
    }
    return {
        name: "Source Middleware ".concat(fn.name),
        type: 'before',
        version: '0.1.0',
        isLoaded: function () { return true; },
        load: function (ctx) { return Promise.resolve(ctx); },
        track: apply,
        page: apply,
        screen: apply,
        identify: apply,
        alias: apply,
        group: apply,
    };
}


/***/ }),

/***/ 2016:
/*!********************************************!*\
  !*** ./src/plugins/remote-loader/index.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ActionDestination: () => (/* binding */ ActionDestination),
/* harmony export */   remoteLoader: () => (/* binding */ remoteLoader)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _lib_load_script__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../lib/load-script */ 6238);
/* harmony import */ var _lib_parse_cdn__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../lib/parse-cdn */ 2911);
/* harmony import */ var _middleware__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../middleware */ 1418);
/* harmony import */ var _core_context__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../core/context */ 7070);
/* harmony import */ var _core_context__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../core/context */ 8456);
/* harmony import */ var _core_stats_metric_helpers__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../core/stats/metric-helpers */ 2822);
/* harmony import */ var _segment_analytics_generic_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @segment/analytics-generic-utils */ 8115);







var ActionDestination = /** @class */ (function () {
    function ActionDestination(name, action) {
        this.version = '1.0.0';
        this.alternativeNames = [];
        this.loadPromise = (0,_segment_analytics_generic_utils__WEBPACK_IMPORTED_MODULE_0__.createDeferred)();
        this.middleware = [];
        this.alias = this._createMethod('alias');
        this.group = this._createMethod('group');
        this.identify = this._createMethod('identify');
        this.page = this._createMethod('page');
        this.screen = this._createMethod('screen');
        this.track = this._createMethod('track');
        this.action = action;
        this.name = name;
        this.type = action.type;
        this.alternativeNames.push(action.name);
    }
    ActionDestination.prototype.addMiddleware = function () {
        var _a;
        var fn = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            fn[_i] = arguments[_i];
        }
        /** Make sure we only apply destination filters to actions of the "destination" type to avoid causing issues for hybrid destinations */
        if (this.type === 'destination') {
            (_a = this.middleware).push.apply(_a, fn);
        }
    };
    ActionDestination.prototype.transform = function (ctx) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
            var modifiedEvent;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0,_middleware__WEBPACK_IMPORTED_MODULE_2__.applyDestinationMiddleware)(this.name, ctx.event, this.middleware)];
                    case 1:
                        modifiedEvent = _a.sent();
                        if (modifiedEvent === null) {
                            ctx.cancel(new _core_context__WEBPACK_IMPORTED_MODULE_3__.ContextCancelation({
                                retry: false,
                                reason: 'dropped by destination middleware',
                            }));
                        }
                        return [2 /*return*/, new _core_context__WEBPACK_IMPORTED_MODULE_4__.Context(modifiedEvent)];
                }
            });
        });
    };
    ActionDestination.prototype._createMethod = function (methodName) {
        var _this = this;
        return function (ctx) { return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(_this, void 0, Promise, function () {
            var transformedContext, error_1;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.action[methodName])
                            return [2 /*return*/, ctx];
                        transformedContext = ctx;
                        if (!(this.type === 'destination')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.transform(ctx)];
                    case 1:
                        transformedContext = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, this.ready()];
                    case 3:
                        if (!(_a.sent())) {
                            throw new Error('Something prevented the destination from getting ready');
                        }
                        (0,_core_stats_metric_helpers__WEBPACK_IMPORTED_MODULE_5__.recordIntegrationMetric)(ctx, {
                            integrationName: this.action.name,
                            methodName: methodName,
                            type: 'action',
                        });
                        return [4 /*yield*/, this.action[methodName](transformedContext)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        (0,_core_stats_metric_helpers__WEBPACK_IMPORTED_MODULE_5__.recordIntegrationMetric)(ctx, {
                            integrationName: this.action.name,
                            methodName: methodName,
                            type: 'action',
                            didError: true,
                        });
                        throw error_1;
                    case 6: return [2 /*return*/, ctx];
                }
            });
        }); };
    };
    /* --- PASSTHROUGH METHODS --- */
    ActionDestination.prototype.isLoaded = function () {
        return this.action.isLoaded();
    };
    ActionDestination.prototype.ready = function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
            var _a;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.loadPromise.promise];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ActionDestination.prototype.load = function (ctx, analytics) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
            var loadP, _a, _b, error_2;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (this.loadPromise.isSettled()) {
                            return [2 /*return*/, this.loadPromise.promise];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        (0,_core_stats_metric_helpers__WEBPACK_IMPORTED_MODULE_5__.recordIntegrationMetric)(ctx, {
                            integrationName: this.action.name,
                            methodName: 'load',
                            type: 'action',
                        });
                        loadP = this.action.load(ctx, analytics);
                        _b = (_a = this.loadPromise).resolve;
                        return [4 /*yield*/, loadP];
                    case 2:
                        _b.apply(_a, [_c.sent()]);
                        return [2 /*return*/, loadP];
                    case 3:
                        error_2 = _c.sent();
                        (0,_core_stats_metric_helpers__WEBPACK_IMPORTED_MODULE_5__.recordIntegrationMetric)(ctx, {
                            integrationName: this.action.name,
                            methodName: 'load',
                            type: 'action',
                            didError: true,
                        });
                        this.loadPromise.reject(error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ActionDestination.prototype.unload = function (ctx, analytics) {
        var _a, _b;
        return (_b = (_a = this.action).unload) === null || _b === void 0 ? void 0 : _b.call(_a, ctx, analytics);
    };
    return ActionDestination;
}());

function validate(pluginLike) {
    if (!Array.isArray(pluginLike)) {
        throw new Error('Not a valid list of plugins');
    }
    var required = ['load', 'isLoaded', 'name', 'version', 'type'];
    pluginLike.forEach(function (plugin) {
        required.forEach(function (method) {
            var _a;
            if (plugin[method] === undefined) {
                throw new Error("Plugin: ".concat((_a = plugin.name) !== null && _a !== void 0 ? _a : 'unknown', " missing required function ").concat(method));
            }
        });
    });
    return true;
}
function isPluginDisabled(userIntegrations, remotePlugin) {
    var creationNameEnabled = userIntegrations[remotePlugin.creationName];
    var currentNameEnabled = userIntegrations[remotePlugin.name];
    // Check that the plugin isn't explicitly enabled when All: false
    if (userIntegrations.All === false &&
        !creationNameEnabled &&
        !currentNameEnabled) {
        return true;
    }
    // Check that the plugin isn't explicitly disabled
    if (creationNameEnabled === false || currentNameEnabled === false) {
        return true;
    }
    return false;
}
function loadPluginFactory(remotePlugin, obfuscate) {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
        var defaultCdn, cdn, urlSplit, name, obfuscatedURL, error_3, err_1;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    defaultCdn = new RegExp('https://cdn.segment.(com|build)');
                    cdn = (0,_lib_parse_cdn__WEBPACK_IMPORTED_MODULE_6__.getCDN)();
                    if (!obfuscate) return [3 /*break*/, 6];
                    urlSplit = remotePlugin.url.split('/');
                    name = urlSplit[urlSplit.length - 2];
                    obfuscatedURL = remotePlugin.url.replace(name, btoa(name).replace(/=/g, ''));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 5]);
                    return [4 /*yield*/, (0,_lib_load_script__WEBPACK_IMPORTED_MODULE_7__.loadScript)(obfuscatedURL.replace(defaultCdn, cdn))];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3:
                    error_3 = _a.sent();
                    // Due to syncing concerns it is possible that the obfuscated action destination (or requested version) might not exist.
                    // We should use the unobfuscated version as a fallback.
                    return [4 /*yield*/, (0,_lib_load_script__WEBPACK_IMPORTED_MODULE_7__.loadScript)(remotePlugin.url.replace(defaultCdn, cdn))];
                case 4:
                    // Due to syncing concerns it is possible that the obfuscated action destination (or requested version) might not exist.
                    // We should use the unobfuscated version as a fallback.
                    _a.sent();
                    return [3 /*break*/, 5];
                case 5: return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, (0,_lib_load_script__WEBPACK_IMPORTED_MODULE_7__.loadScript)(remotePlugin.url.replace(defaultCdn, cdn))];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    // @ts-expect-error
                    if (typeof window[remotePlugin.libraryName] === 'function') {
                        // @ts-expect-error
                        return [2 /*return*/, window[remotePlugin.libraryName]];
                    }
                    return [3 /*break*/, 10];
                case 9:
                    err_1 = _a.sent();
                    console.error('Failed to create PluginFactory', remotePlugin);
                    throw err_1;
                case 10: return [2 /*return*/];
            }
        });
    });
}
function remoteLoader(settings, integrations, mergedIntegrations, options, routingMiddleware, pluginSources) {
    var _a, _b, _c;
    return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(this, void 0, Promise, function () {
        var allPlugins, routingRules, pluginPromises;
        var _this = this;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_d) {
            switch (_d.label) {
                case 0:
                    allPlugins = [];
                    routingRules = (_b = (_a = settings.middlewareSettings) === null || _a === void 0 ? void 0 : _a.routingRules) !== null && _b !== void 0 ? _b : [];
                    pluginPromises = ((_c = settings.remotePlugins) !== null && _c !== void 0 ? _c : []).map(function (remotePlugin) { return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__awaiter)(_this, void 0, void 0, function () {
                        var pluginFactory, _a, intg, plugin, plugins, routing_1, error_4;
                        return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__generator)(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    if (isPluginDisabled(integrations, remotePlugin))
                                        return [2 /*return*/];
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 6, , 7]);
                                    _a = (pluginSources === null || pluginSources === void 0 ? void 0 : pluginSources.find(function (_a) {
                                        var pluginName = _a.pluginName;
                                        return pluginName === remotePlugin.name;
                                    }));
                                    if (_a) return [3 /*break*/, 3];
                                    return [4 /*yield*/, loadPluginFactory(remotePlugin, options === null || options === void 0 ? void 0 : options.obfuscate)];
                                case 2:
                                    _a = (_b.sent());
                                    _b.label = 3;
                                case 3:
                                    pluginFactory = _a;
                                    if (!pluginFactory) return [3 /*break*/, 5];
                                    intg = mergedIntegrations[remotePlugin.name];
                                    return [4 /*yield*/, pluginFactory((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, remotePlugin.settings), intg))];
                                case 4:
                                    plugin = _b.sent();
                                    plugins = Array.isArray(plugin) ? plugin : [plugin];
                                    validate(plugins);
                                    routing_1 = routingRules.filter(function (rule) { return rule.destinationName === remotePlugin.creationName; });
                                    plugins.forEach(function (plugin) {
                                        var wrapper = new ActionDestination(remotePlugin.creationName, plugin);
                                        if (routing_1.length && routingMiddleware) {
                                            wrapper.addMiddleware(routingMiddleware);
                                        }
                                        allPlugins.push(wrapper);
                                    });
                                    _b.label = 5;
                                case 5: return [3 /*break*/, 7];
                                case 6:
                                    error_4 = _b.sent();
                                    console.warn('Failed to load Remote Plugin', error_4);
                                    (0,_core_stats_metric_helpers__WEBPACK_IMPORTED_MODULE_5__.recordIntegrationMetric)(_core_context__WEBPACK_IMPORTED_MODULE_4__.Context.system(), {
                                        integrationName: remotePlugin.name,
                                        methodName: 'load',
                                        type: 'action',
                                        didError: true,
                                    });
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(pluginPromises)];
                case 1:
                    _d.sent();
                    return [2 /*return*/, allPlugins.filter(Boolean)];
            }
        });
    });
}


/***/ }),

/***/ 2866:
/*!*****************************************************!*\
  !*** ./src/plugins/segmentio/batched-dispatcher.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ batch)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _lib_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../lib/fetch */ 8970);
/* harmony import */ var _lib_on_page_change__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../lib/on-page-change */ 1934);
/* harmony import */ var _ratelimit_error__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./ratelimit-error */ 2481);
/* harmony import */ var _core_context__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../core/context */ 8456);
/* harmony import */ var _shared_dispatcher__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shared-dispatcher */ 9034);






var MAX_PAYLOAD_SIZE = 500;
var MAX_KEEPALIVE_SIZE = 64;
function kilobytes(buffer) {
    var size = encodeURI(JSON.stringify(buffer)).split(/%..|./).length - 1;
    return size / 1024;
}
/**
 * Checks if the payload is over or close to
 * the maximum payload size allowed by tracking
 * API.
 */
function approachingTrackingAPILimit(buffer) {
    return kilobytes(buffer) >= MAX_PAYLOAD_SIZE - 50;
}
/**
 * Checks if payload is over or approaching the limit for keepalive
 * requests. If keepalive is enabled we want to avoid
 * going over this to prevent data loss.
 */
function passedKeepaliveLimit(buffer) {
    return kilobytes(buffer) >= MAX_KEEPALIVE_SIZE - 10;
}
function chunks(batch) {
    var result = [];
    var index = 0;
    batch.forEach(function (item) {
        var size = kilobytes(result[index]);
        if (size >= 64) {
            index++;
        }
        if (result[index]) {
            result[index].push(item);
        }
        else {
            result[index] = [item];
        }
    });
    return result;
}
function buildBatch(buffer) {
    var batch = [];
    for (var i = 0; i < buffer.length; i++) {
        var event = buffer[i];
        var candidate = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spreadArray)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spreadArray)([], batch, true), [event], false);
        if (batch.length > 0 && approachingTrackingAPILimit(candidate)) {
            return { batch: batch, remaining: buffer.slice(i) };
        }
        batch.push(event);
    }
    return { batch: batch, remaining: [] };
}
function batch(apiHost, config, httpConfig, protocol) {
    var _a, _b;
    if (protocol === void 0) { protocol = 'https'; }
    var buffer = [];
    var pageUnloaded = false;
    var limit = (_a = config === null || config === void 0 ? void 0 : config.size) !== null && _a !== void 0 ? _a : 10;
    var timeout = (_b = config === null || config === void 0 ? void 0 : config.timeout) !== null && _b !== void 0 ? _b : 5000;
    var resolved = httpConfig !== null && httpConfig !== void 0 ? httpConfig : (0,_shared_dispatcher__WEBPACK_IMPORTED_MODULE_1__.resolveHttpConfig)();
    var rateLimitTimeout = 0;
    var requestCount = 0; // Tracks actual network requests for X-Retry-Count header
    var isRetrying = false;
    var isFlushing = false;
    var retryAfterRetries = 0;
    var totalBackoffTime = 0;
    var totalRateLimitTime = 0;
    function sendBatch(batch, retryCount) {
        var _a;
        if (batch.length === 0) {
            return;
        }
        var writeKey = (_a = batch[0]) === null || _a === void 0 ? void 0 : _a.writeKey;
        // Remove sentAt from every event as batching only needs a single timestamp
        var updatedBatch = batch.map(function (event) {
            var _a = event, sentAt = _a.sentAt, newEvent = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__rest)(_a, ["sentAt"]);
            return newEvent;
        });
        var headers = (0,_shared_dispatcher__WEBPACK_IMPORTED_MODULE_1__.createHeaders)(config === null || config === void 0 ? void 0 : config.headers);
        if (retryCount > 0) {
            headers['X-Retry-Count'] = String(retryCount);
        }
        if (writeKey) {
            var authtoken = btoa(writeKey + ':');
            headers['Authorization'] = "Basic ".concat(authtoken);
        }
        var scheme = apiHost.startsWith('http://') || apiHost.startsWith('https://')
            ? ''
            : "".concat(protocol, "://");
        return (0,_lib_fetch__WEBPACK_IMPORTED_MODULE_2__.fetch)("".concat(scheme).concat(apiHost, "/b"), {
            credentials: config === null || config === void 0 ? void 0 : config.credentials,
            keepalive: (config === null || config === void 0 ? void 0 : config.keepalive) || pageUnloaded,
            headers: headers,
            method: 'post',
            body: JSON.stringify({
                writeKey: writeKey,
                batch: updatedBatch,
                sentAt: new Date().toISOString(),
            }),
            // @ts-ignore - not in the ts lib yet
            priority: config === null || config === void 0 ? void 0 : config.priority,
        }).then(function (res) {
            var status = res.status;
            // Treat <400 as success (2xx/3xx)
            if (status < 400) {
                return;
            }
            // Determine retry/drop behavior from config (checks statusCodeOverrides first).
            var behavior = (0,_shared_dispatcher__WEBPACK_IMPORTED_MODULE_1__.getStatusBehavior)(status, resolved.backoffConfig);
            // Honor Retry-After for rate limiting, unless the status is explicitly
            // overridden to 'drop' via statusCodeOverrides.
            if (behavior !== 'drop') {
                var retryAfter = (0,_shared_dispatcher__WEBPACK_IMPORTED_MODULE_1__.parseRetryAfter)(res, resolved.rateLimitConfig);
                if (retryAfter) {
                    throw new _ratelimit_error__WEBPACK_IMPORTED_MODULE_3__.RateLimitError("Rate limit exceeded: ".concat(status), retryAfter.retryAfterMs, retryAfter.fromHeader);
                }
            }
            // Retry via backoff when the status is retryable.
            if (behavior === 'retry') {
                throw new Error("Retryable error: ".concat(status));
            }
            // Non-retryable: silently drop
        });
    }
    function dropAndContinue() {
        if (buffer.length > 0) {
            scheduleFlush(1);
        }
    }
    function flush(attempt) {
        var _a;
        if (attempt === void 0) { attempt = 1; }
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            var _b, batch_1, remaining, currentRetryCount;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_c) {
                if (!isRetrying) {
                    requestCount = 0;
                    retryAfterRetries = 0;
                    totalBackoffTime = 0;
                    totalRateLimitTime = 0;
                }
                isRetrying = false;
                isFlushing = true;
                if (buffer.length) {
                    _b = buildBatch(buffer), batch_1 = _b.batch, remaining = _b.remaining;
                    if (batch_1.length === 0) {
                        isFlushing = false;
                        return [2 /*return*/];
                    }
                    buffer = remaining;
                    currentRetryCount = requestCount;
                    requestCount += 1;
                    return [2 /*return*/, (_a = sendBatch(batch_1, currentRetryCount)) === null || _a === void 0 ? void 0 : _a.then(function (result) {
                            // If buildBatch left events due to payload size limits, schedule another flush
                            if (buffer.length > 0) {
                                scheduleFlush(1);
                            }
                            return result;
                        }).catch(function (error) {
                            var _a;
                            var ctx = _core_context__WEBPACK_IMPORTED_MODULE_4__.Context.system();
                            ctx.log('error', 'Error sending batch', error);
                            var maxRetries = (_a = config === null || config === void 0 ? void 0 : config.maxRetries) !== null && _a !== void 0 ? _a : resolved.backoffConfig.maxRetryCount;
                            var isRateLimitError = error.name === 'RateLimitError';
                            var isRetryableWithoutCount = isRateLimitError && error.isRetryableWithoutCount;
                            var canRetry = isRetryableWithoutCount || attempt <= maxRetries;
                            if (!canRetry) {
                                return dropAndContinue();
                            }
                            // Rate-limit retries: enforce count cap and total duration cap
                            if (isRetryableWithoutCount) {
                                retryAfterRetries++;
                                if (retryAfterRetries > resolved.rateLimitConfig.maxRetryCount) {
                                    return dropAndContinue();
                                }
                                var delay = error.retryTimeout;
                                totalRateLimitTime += delay;
                                var maxRateLimitMs = resolved.rateLimitConfig.maxRateLimitDuration * 1000;
                                if (totalRateLimitTime > maxRateLimitMs) {
                                    return dropAndContinue();
                                }
                                rateLimitTimeout = delay;
                            }
                            // Backoff retries: compute delay, enforce total duration cap
                            var retryDelay;
                            if (!isRateLimitError) {
                                retryDelay = (0,_shared_dispatcher__WEBPACK_IMPORTED_MODULE_1__.computeBackoff)(attempt, resolved.backoffConfig);
                                totalBackoffTime += retryDelay;
                                var maxBackoffMs = resolved.backoffConfig.maxTotalBackoffDuration * 1000;
                                if (totalBackoffTime > maxBackoffMs) {
                                    return dropAndContinue();
                                }
                            }
                            buffer = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spreadArray)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spreadArray)([], batch_1, true), buffer, true);
                            batch_1.forEach(function (event) {
                                if ('_metadata' in event) {
                                    var segmentEvent = event;
                                    segmentEvent._metadata = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, segmentEvent._metadata), { retryCount: attempt });
                                }
                            });
                            var nextAttempt = isRetryableWithoutCount ? attempt : attempt + 1;
                            isRetrying = true;
                            scheduleFlush(nextAttempt, retryDelay);
                        }).finally(function () {
                            isFlushing = false;
                        })];
                }
                else {
                    isFlushing = false;
                }
                return [2 /*return*/];
            });
        });
    }
    var schedule;
    function scheduleFlush(attempt, retryDelay) {
        if (attempt === void 0) { attempt = 1; }
        if (schedule) {
            return;
        }
        var delay = rateLimitTimeout || retryDelay || timeout;
        schedule = setTimeout(function () {
            schedule = undefined;
            flush(attempt).catch(console.error);
        }, delay);
        rateLimitTimeout = 0;
    }
    (0,_lib_on_page_change__WEBPACK_IMPORTED_MODULE_5__.onPageChange)(function (unloaded) {
        pageUnloaded = unloaded;
        if (pageUnloaded && buffer.length) {
            var reqs = chunks(buffer).map(function (b) { return sendBatch(b, 0); });
            Promise.all(reqs).catch(console.error);
        }
    });
    function dispatch(_url, body, _retryCountHeader) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
            var bufferOverflow;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                buffer.push(body);
                // If a retry is pending (e.g., 429 rate-limit), don't bypass the scheduled retry.
                // A 429 blocks the entire flush iteration until the Retry-After period elapses.
                if (isRetrying) {
                    return [2 /*return*/];
                }
                bufferOverflow = buffer.length >= limit ||
                    approachingTrackingAPILimit(buffer) ||
                    ((config === null || config === void 0 ? void 0 : config.keepalive) && passedKeepaliveLimit(buffer));
                if (!bufferOverflow && !pageUnloaded) {
                    return [2 /*return*/, scheduleFlush()];
                }
                // If a flush is already in-flight, avoid concurrent flushes that would
                // corrupt shared mutable state (requestCount, totalBackoffTime, etc.).
                // Schedule instead so events are picked up after the current flush settles.
                return [2 /*return*/, isFlushing ? scheduleFlush() : flush()];
            });
        });
    }
    return {
        dispatch: dispatch,
    };
}


/***/ }),

/***/ 241:
/*!***************************************************!*\
  !*** ./src/plugins/segmentio/fetch-dispatcher.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _lib_fetch__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../lib/fetch */ 8970);
/* harmony import */ var _ratelimit_error__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ratelimit-error */ 2481);
/* harmony import */ var _shared_dispatcher__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./shared-dispatcher */ 9034);



/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(config, httpConfig) {
    function dispatch(url, body, retryCountHeader) {
        var headers = (0,_shared_dispatcher__WEBPACK_IMPORTED_MODULE_0__.createHeaders)(config === null || config === void 0 ? void 0 : config.headers);
        var writeKey = body === null || body === void 0 ? void 0 : body.writeKey;
        if (writeKey) {
            var authtoken = btoa(writeKey + ':');
            headers['Authorization'] = "Basic ".concat(authtoken);
        }
        if (retryCountHeader) {
            headers['X-Retry-Count'] = String(retryCountHeader);
        }
        return (0,_lib_fetch__WEBPACK_IMPORTED_MODULE_1__.fetch)(url, {
            credentials: config === null || config === void 0 ? void 0 : config.credentials,
            keepalive: config === null || config === void 0 ? void 0 : config.keepalive,
            headers: headers,
            method: 'post',
            body: JSON.stringify(body),
            // @ts-ignore - not in the ts lib yet
            priority: config === null || config === void 0 ? void 0 : config.priority,
        }).then(function (res) {
            var status = res.status;
            // Treat <400 as success (2xx/3xx)
            if (status < 400) {
                return;
            }
            // Resolve config once (uses caller-supplied or built-in defaults).
            var resolved = httpConfig !== null && httpConfig !== void 0 ? httpConfig : (0,_shared_dispatcher__WEBPACK_IMPORTED_MODULE_0__.resolveHttpConfig)();
            // Determine retry/drop behavior from config (checks statusCodeOverrides first).
            var behavior = (0,_shared_dispatcher__WEBPACK_IMPORTED_MODULE_0__.getStatusBehavior)(status, resolved.backoffConfig);
            // Honor Retry-After for rate limiting, unless the status is explicitly
            // overridden to 'drop' via statusCodeOverrides.
            if (behavior !== 'drop') {
                var retryAfter = (0,_shared_dispatcher__WEBPACK_IMPORTED_MODULE_0__.parseRetryAfter)(res, resolved.rateLimitConfig);
                if (retryAfter) {
                    throw new _ratelimit_error__WEBPACK_IMPORTED_MODULE_2__.RateLimitError("Rate limit exceeded: ".concat(status), retryAfter.retryAfterMs, retryAfter.fromHeader);
                }
            }
            // Retry via backoff when the status is retryable.
            if (behavior === 'retry') {
                throw new Error("Retryable error: ".concat(status));
            }
            var err = new Error("Non-retryable error: ".concat(status));
            err.name = 'NonRetryableError';
            throw err;
        });
    }
    return {
        dispatch: dispatch,
    };
}


/***/ }),

/***/ 9099:
/*!****************************************!*\
  !*** ./src/plugins/segmentio/index.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isSegmentPlugin: () => (/* binding */ isSegmentPlugin),
/* harmony export */   segmentio: () => (/* binding */ segmentio)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _core_connection__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../core/connection */ 6789);
/* harmony import */ var _lib_priority_queue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../lib/priority-queue */ 9797);
/* harmony import */ var _lib_priority_queue_persisted__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../lib/priority-queue/persisted */ 9732);
/* harmony import */ var _lib_to_facade__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../lib/to-facade */ 7536);
/* harmony import */ var _batched_dispatcher__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./batched-dispatcher */ 2866);
/* harmony import */ var _fetch_dispatcher__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./fetch-dispatcher */ 241);
/* harmony import */ var _normalize__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./normalize */ 6988);
/* harmony import */ var _schedule_flush__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./schedule-flush */ 8965);
/* harmony import */ var _core_constants__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../core/constants */ 3858);
/* harmony import */ var _shared_dispatcher__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./shared-dispatcher */ 9034);











function onAlias(analytics, json) {
    var _a, _b, _c, _d;
    var user = analytics.user();
    json.previousId =
        (_c = (_b = (_a = json.previousId) !== null && _a !== void 0 ? _a : json.from) !== null && _b !== void 0 ? _b : user.id()) !== null && _c !== void 0 ? _c : user.anonymousId();
    json.userId = (_d = json.userId) !== null && _d !== void 0 ? _d : json.to;
    delete json.from;
    delete json.to;
    return json;
}
var isSegmentPlugin = function (plugin) {
    return plugin.name === 'Segment.io';
};
function segmentio(analytics, settings, integrations) {
    var _a, _b, _c, _d;
    // Attach `pagehide` before buffer is created so that inflight events are added
    // to the buffer before the buffer persists events in its own `pagehide` handler.
    window.addEventListener('pagehide', function () {
        buffer.push.apply(buffer, Array.from(inflightEvents));
        inflightEvents.clear();
    });
    var writeKey = (_a = settings === null || settings === void 0 ? void 0 : settings.apiKey) !== null && _a !== void 0 ? _a : '';
    var buffer = analytics.options.disableClientPersistence
        ? new _lib_priority_queue__WEBPACK_IMPORTED_MODULE_0__.PriorityQueue(analytics.queue.queue.maxAttempts, [])
        : new _lib_priority_queue_persisted__WEBPACK_IMPORTED_MODULE_1__.PersistedPriorityQueue(analytics.queue.queue.maxAttempts, "".concat(writeKey, ":dest-Segment.io"));
    var inflightEvents = new Set();
    var rateLimitAttempts = new WeakMap();
    var flushing = false;
    var apiHost = (_b = settings === null || settings === void 0 ? void 0 : settings.apiHost) !== null && _b !== void 0 ? _b : _core_constants__WEBPACK_IMPORTED_MODULE_2__.SEGMENT_API_HOST;
    var protocol = (_c = settings === null || settings === void 0 ? void 0 : settings.protocol) !== null && _c !== void 0 ? _c : 'https';
    var remote = "".concat(protocol, "://").concat(apiHost);
    var cdnHttpConfig = (_d = integrations === null || integrations === void 0 ? void 0 : integrations['Segment.io']) === null || _d === void 0 ? void 0 : _d.httpConfig;
    var initHttpConfig = settings === null || settings === void 0 ? void 0 : settings.httpConfig;
    var resolvedHttpConfig = (0,_shared_dispatcher__WEBPACK_IMPORTED_MODULE_3__.resolveHttpConfig)(initHttpConfig, cdnHttpConfig);
    // Wire the CDN/user-configured maxRetryCount to the plugin's internal buffer.
    // For fetch-dispatcher (standard mode), this is the only retry control —
    // retries are managed by the plugin's PriorityQueue, not the dispatcher.
    // For batched-dispatcher, retries are handled internally by the dispatcher
    // (which also reads maxRetryCount), so this mainly serves as a safety net.
    // retryQueue controls whether retries are allowed at all.
    // When enabled, keep buffer attempts aligned with resolved httpConfig.
    if (analytics.options.retryQueue !== false) {
        buffer.maxAttempts = resolvedHttpConfig.backoffConfig.maxRetryCount;
    }
    var deliveryStrategy = settings === null || settings === void 0 ? void 0 : settings.deliveryStrategy;
    var client = deliveryStrategy &&
        'strategy' in deliveryStrategy &&
        deliveryStrategy.strategy === 'batching'
        ? (0,_batched_dispatcher__WEBPACK_IMPORTED_MODULE_4__["default"])(apiHost, deliveryStrategy.config, resolvedHttpConfig, protocol)
        : (0,_fetch_dispatcher__WEBPACK_IMPORTED_MODULE_5__["default"])(deliveryStrategy === null || deliveryStrategy === void 0 ? void 0 : deliveryStrategy.config, resolvedHttpConfig);
    function send(ctx) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_6__.__awaiter)(this, void 0, Promise, function () {
            var path, json, attempts, error;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_6__.__generator)(this, function (_a) {
                if ((0,_core_connection__WEBPACK_IMPORTED_MODULE_7__.isOffline)()) {
                    buffer.push(ctx);
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    (0,_schedule_flush__WEBPACK_IMPORTED_MODULE_8__.scheduleFlush)(flushing, buffer, segmentio, _schedule_flush__WEBPACK_IMPORTED_MODULE_8__.scheduleFlush);
                    return [2 /*return*/, ctx];
                }
                inflightEvents.add(ctx);
                path = ctx.event.type.charAt(0);
                json = (0,_lib_to_facade__WEBPACK_IMPORTED_MODULE_9__.toFacade)(ctx.event).json();
                if (ctx.event.type === 'track') {
                    delete json.traits;
                }
                if (ctx.event.type === 'alias') {
                    json = onAlias(analytics, json);
                }
                attempts = buffer.getAttempts(ctx);
                if (attempts >= buffer.maxAttempts) {
                    inflightEvents.delete(ctx);
                    error = new Error("Retry attempts exhausted (".concat(attempts, "/").concat(buffer.maxAttempts, ")"));
                    ctx.setFailedDelivery({ reason: error });
                    analytics.emit('error', {
                        code: 'delivery_failure',
                        reason: error,
                        ctx: ctx,
                    });
                    return [2 /*return*/, ctx];
                }
                return [2 /*return*/, client
                        .dispatch("".concat(remote, "/").concat(path), (0,_normalize__WEBPACK_IMPORTED_MODULE_10__.normalize)(analytics, json, settings, integrations, ctx), attempts)
                        .then(function () { return ctx; })
                        .catch(function (error) {
                        var _a;
                        ctx.log('error', 'Error sending event', error);
                        if (error.name === 'RateLimitError') {
                            var rlAttempts = ((_a = rateLimitAttempts.get(ctx)) !== null && _a !== void 0 ? _a : 0) + 1;
                            rateLimitAttempts.set(ctx, rlAttempts);
                            if (rlAttempts > resolvedHttpConfig.rateLimitConfig.maxRetryCount) {
                                ctx.setFailedDelivery({ reason: error });
                                analytics.emit('error', {
                                    code: 'delivery_failure',
                                    reason: error,
                                    ctx: ctx,
                                });
                            }
                            else {
                                var timeout = error.retryTimeout;
                                buffer.pushWithDelay(ctx, timeout);
                            }
                        }
                        else if (error.name === 'NonRetryableError') {
                            // Do not requeue non-retryable HTTP failures; drop the event.
                            ctx.setFailedDelivery({ reason: error });
                            analytics.emit('error', {
                                code: 'delivery_failure',
                                reason: error,
                                ctx: ctx,
                            });
                        }
                        else {
                            buffer.pushWithBackoff(ctx);
                        }
                        // eslint-disable-next-line @typescript-eslint/no-use-before-define
                        (0,_schedule_flush__WEBPACK_IMPORTED_MODULE_8__.scheduleFlush)(flushing, buffer, segmentio, _schedule_flush__WEBPACK_IMPORTED_MODULE_8__.scheduleFlush);
                        return ctx;
                    })
                        .finally(function () {
                        inflightEvents.delete(ctx);
                    })];
            });
        });
    }
    var segmentio = {
        metadata: {
            writeKey: writeKey,
            apiHost: apiHost,
            protocol: protocol,
        },
        name: 'Segment.io',
        type: 'destination',
        version: '0.1.0',
        isLoaded: function () { return true; },
        load: function () { return Promise.resolve(); },
        track: send,
        identify: send,
        page: send,
        alias: send,
        group: send,
        screen: send,
    };
    // Buffer may already have items if they were previously stored in localStorage.
    // Start flushing them immediately.
    if (buffer.todo) {
        (0,_schedule_flush__WEBPACK_IMPORTED_MODULE_8__.scheduleFlush)(flushing, buffer, segmentio, _schedule_flush__WEBPACK_IMPORTED_MODULE_8__.scheduleFlush);
    }
    return segmentio;
}


/***/ }),

/***/ 6988:
/*!********************************************!*\
  !*** ./src/plugins/segmentio/normalize.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   normalize: () => (/* binding */ normalize)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

function normalize(analytics, json, settings, integrations, ctx) {
    var _a;
    var user = analytics.user();
    delete json.options;
    json.writeKey = settings === null || settings === void 0 ? void 0 : settings.apiKey;
    json.userId = json.userId || user.id();
    json.anonymousId = json.anonymousId || user.anonymousId();
    json.sentAt = new Date();
    var failed = analytics.queue.failedInitializations || [];
    if (failed.length > 0) {
        json._metadata = { failedInitializations: failed };
    }
    if (ctx != null) {
        if (ctx.attempts > 1) {
            json._metadata = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, json._metadata), { retryCount: ctx.attempts });
        }
        ctx.attempts++;
    }
    var bundled = [];
    var unbundled = [];
    for (var key in integrations) {
        var integration = integrations[key];
        if (key === 'Segment.io') {
            bundled.push(key);
        }
        if (integration.bundlingStatus === 'bundled') {
            bundled.push(key);
        }
        if (integration.bundlingStatus === 'unbundled') {
            unbundled.push(key);
        }
    }
    // This will make sure that the disabled cloud mode destinations will be
    // included in the unbundled list.
    for (var _i = 0, _b = (settings === null || settings === void 0 ? void 0 : settings.unbundledIntegrations) || []; _i < _b.length; _i++) {
        var settingsUnbundled = _b[_i];
        if (!unbundled.includes(settingsUnbundled)) {
            unbundled.push(settingsUnbundled);
        }
    }
    var configIds = (_a = settings === null || settings === void 0 ? void 0 : settings.maybeBundledConfigIds) !== null && _a !== void 0 ? _a : {};
    var bundledConfigIds = [];
    bundled.sort().forEach(function (name) {
        var _a;
        ;
        ((_a = configIds[name]) !== null && _a !== void 0 ? _a : []).forEach(function (id) {
            bundledConfigIds.push(id);
        });
    });
    if ((settings === null || settings === void 0 ? void 0 : settings.addBundledMetadata) !== false) {
        json._metadata = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, json._metadata), { bundled: bundled.sort(), unbundled: unbundled.sort(), bundledIds: bundledConfigIds });
    }
    return json;
}


/***/ }),

/***/ 2481:
/*!**************************************************!*\
  !*** ./src/plugins/segmentio/ratelimit-error.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RateLimitError: () => (/* binding */ RateLimitError)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

var RateLimitError = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(RateLimitError, _super);
    function RateLimitError(message, retryTimeout, isRetryableWithoutCount) {
        if (isRetryableWithoutCount === void 0) { isRetryableWithoutCount = false; }
        var _this = _super.call(this, message) || this;
        _this.retryTimeout = retryTimeout;
        _this.isRetryableWithoutCount = isRetryableWithoutCount;
        _this.name = 'RateLimitError';
        return _this;
    }
    return RateLimitError;
}(Error));



/***/ }),

/***/ 8965:
/*!*************************************************!*\
  !*** ./src/plugins/segmentio/schedule-flush.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   scheduleFlush: () => (/* binding */ scheduleFlush)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _core_connection__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../core/connection */ 6789);
/* harmony import */ var _core_context__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../core/context */ 8456);
/* harmony import */ var _segment_analytics_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @segment/analytics-core */ 2620);
/* harmony import */ var _lib_p_while__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../lib/p-while */ 7106);





function flushQueue(xt, queue) {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, Promise, function () {
        var failedQueue;
        var _this = this;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    failedQueue = [];
                    if ((0,_core_connection__WEBPACK_IMPORTED_MODULE_1__.isOffline)()) {
                        return [2 /*return*/, queue];
                    }
                    return [4 /*yield*/, (0,_lib_p_while__WEBPACK_IMPORTED_MODULE_2__.pWhile)(function () { return queue.length > 0 && !(0,_core_connection__WEBPACK_IMPORTED_MODULE_1__.isOffline)(); }, function () { return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(_this, void 0, void 0, function () {
                            var ctx, result, success;
                            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        ctx = queue.pop();
                                        if (!ctx) {
                                            return [2 /*return*/];
                                        }
                                        return [4 /*yield*/, (0,_segment_analytics_core__WEBPACK_IMPORTED_MODULE_3__.attempt)(ctx, xt)];
                                    case 1:
                                        result = _a.sent();
                                        success = result instanceof _core_context__WEBPACK_IMPORTED_MODULE_4__.Context;
                                        if (!success) {
                                            failedQueue.push(ctx);
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); })
                        // re-add failed tasks
                    ];
                case 1:
                    _a.sent();
                    // re-add failed tasks
                    failedQueue.map(function (failed) { return queue.pushWithBackoff(failed); });
                    return [2 /*return*/, queue];
            }
        });
    });
}
function scheduleFlush(flushing, buffer, xt, scheduleFlush) {
    var _this = this;
    if (flushing) {
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(function () { return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(_this, void 0, void 0, function () {
        var isFlushing, newBuffer;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isFlushing = true;
                    return [4 /*yield*/, flushQueue(xt, buffer)];
                case 1:
                    newBuffer = _a.sent();
                    isFlushing = false;
                    if (buffer.todo > 0) {
                        scheduleFlush(isFlushing, newBuffer, xt, scheduleFlush);
                    }
                    return [2 /*return*/];
            }
        });
    }); }, Math.random() * 500 + 100);
}


/***/ }),

/***/ 9034:
/*!****************************************************!*\
  !*** ./src/plugins/segmentio/shared-dispatcher.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   computeBackoff: () => (/* binding */ computeBackoff),
/* harmony export */   createHeaders: () => (/* binding */ createHeaders),
/* harmony export */   getStatusBehavior: () => (/* binding */ getStatusBehavior),
/* harmony export */   parseRetryAfter: () => (/* binding */ parseRetryAfter),
/* harmony export */   resolveHttpConfig: () => (/* binding */ resolveHttpConfig)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

var createHeaders = function (headerSettings) {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({ 'Content-Type': 'text/plain' }, (typeof headerSettings === 'function'
        ? headerSettings()
        : headerSettings));
};
// --- Default values ---
var DEFAULT_STATUS_CODE_OVERRIDES = {
    '408': 'retry',
    '410': 'retry',
    '429': 'retry',
    '460': 'retry',
    '501': 'drop',
    '505': 'drop',
    '511': 'drop',
};
/** Clamp a number to a range, returning the default if the value is undefined. */
function clamp(value, defaultValue, min, max) {
    var v = value !== null && value !== void 0 ? value : defaultValue;
    return Math.min(Math.max(v, min), max);
}
/**
 * Parse the Retry-After header from a response, if present and applicable.
 * Returns `{ retryAfterMs, fromHeader }` when a valid delay is found, or `null` otherwise.
 */
function parseRetryAfter(res, rateLimitConfig) {
    var _a;
    if (res.status !== 429) {
        return null;
    }
    var raw = (_a = res.headers) === null || _a === void 0 ? void 0 : _a.get('Retry-After');
    if (!raw) {
        return null;
    }
    var parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
        return null;
    }
    var cappedSeconds = Math.max(0, Math.min(parsed, rateLimitConfig.maxRetryInterval));
    return { retryAfterMs: cappedSeconds * 1000, fromHeader: true };
}
/**
 * Determine whether a given HTTP status code should cause a retry or a drop,
 * based on the resolved backoff configuration.
 */
function getStatusBehavior(status, backoffConfig) {
    var override = backoffConfig.statusCodeOverrides[String(status)];
    if (override) {
        return override;
    }
    if (status >= 500)
        return backoffConfig.default5xxBehavior;
    if (status >= 400)
        return backoffConfig.default4xxBehavior;
    return 'drop';
}
/**
 * Compute an exponential backoff delay in milliseconds for the given attempt.
 * Attempt is 1-based (first retry = 1).
 */
function computeBackoff(attempt, config) {
    var baseMs = config.baseBackoffInterval * 1000;
    var maxMs = config.maxBackoffInterval * 1000;
    var exponential = baseMs * Math.pow(2, attempt - 1);
    var capped = Math.min(exponential, maxMs);
    var jitter = 1 + (Math.random() - 0.5) * 2 * (config.jitterPercent / 100);
    return Math.max(0, capped * jitter);
}
/**
 * Resolve an optional HttpConfig from CDN/user settings into a fully-populated
 * config object with defaults applied and values clamped to safe ranges.
 */
function resolveHttpConfig(config, cdnConfig) {
    var _a, _b, _c, _d;
    // Merge order and precedence:
    // 1) `config` is the init-time base.
    // 2) `cdnConfig` is applied second and wins on overlapping fields.
    //    The CDN will only be populated as an override when necessary to address
    //    issues so takes precedence over init config to ensure it can do so effectively.
    // 3) `statusCodeOverrides` is deep-merged so CDN can override specific
    //    init-provided codes without replacing the whole map.
    // This keeps precedence centralized here instead of repeating merge logic
    // in each caller.
    var mergedConfig = config || cdnConfig
        ? {
            rateLimitConfig: (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, config === null || config === void 0 ? void 0 : config.rateLimitConfig), cdnConfig === null || cdnConfig === void 0 ? void 0 : cdnConfig.rateLimitConfig),
            backoffConfig: (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, config === null || config === void 0 ? void 0 : config.backoffConfig), cdnConfig === null || cdnConfig === void 0 ? void 0 : cdnConfig.backoffConfig), { statusCodeOverrides: (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, (_a = config === null || config === void 0 ? void 0 : config.backoffConfig) === null || _a === void 0 ? void 0 : _a.statusCodeOverrides), (_b = cdnConfig === null || cdnConfig === void 0 ? void 0 : cdnConfig.backoffConfig) === null || _b === void 0 ? void 0 : _b.statusCodeOverrides) }),
        }
        : undefined;
    var rate = mergedConfig === null || mergedConfig === void 0 ? void 0 : mergedConfig.rateLimitConfig;
    var backoff = mergedConfig === null || mergedConfig === void 0 ? void 0 : mergedConfig.backoffConfig;
    return {
        rateLimitConfig: {
            maxRetryCount: clamp(rate === null || rate === void 0 ? void 0 : rate.maxRetryCount, 10, 0, 100),
            maxRetryInterval: clamp(rate === null || rate === void 0 ? void 0 : rate.maxRetryInterval, 300, 0.1, 86400),
            maxRateLimitDuration: clamp(rate === null || rate === void 0 ? void 0 : rate.maxRateLimitDuration, 43200, 10, 86400),
        },
        backoffConfig: {
            maxRetryCount: clamp(backoff === null || backoff === void 0 ? void 0 : backoff.maxRetryCount, 10, 0, 100),
            baseBackoffInterval: clamp(backoff === null || backoff === void 0 ? void 0 : backoff.baseBackoffInterval, 0.5, 0.1, 300),
            maxBackoffInterval: clamp(backoff === null || backoff === void 0 ? void 0 : backoff.maxBackoffInterval, 60, 0.1, 86400),
            maxTotalBackoffDuration: clamp(backoff === null || backoff === void 0 ? void 0 : backoff.maxTotalBackoffDuration, 43200, 60, 604800),
            jitterPercent: clamp(backoff === null || backoff === void 0 ? void 0 : backoff.jitterPercent, 10, 0, 100),
            default4xxBehavior: (_c = backoff === null || backoff === void 0 ? void 0 : backoff.default4xxBehavior) !== null && _c !== void 0 ? _c : 'drop',
            default5xxBehavior: (_d = backoff === null || backoff === void 0 ? void 0 : backoff.default5xxBehavior) !== null && _d !== void 0 ? _d : 'retry',
            statusCodeOverrides: (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, DEFAULT_STATUS_CODE_OVERRIDES), backoff === null || backoff === void 0 ? void 0 : backoff.statusCodeOverrides),
        },
    };
}


/***/ }),

/***/ 5478:
/*!*********************************************!*\
  !*** ../../node_modules/tslib/tslib.es6.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   __assign: () => (/* binding */ __assign),
/* harmony export */   __asyncDelegator: () => (/* binding */ __asyncDelegator),
/* harmony export */   __asyncGenerator: () => (/* binding */ __asyncGenerator),
/* harmony export */   __asyncValues: () => (/* binding */ __asyncValues),
/* harmony export */   __await: () => (/* binding */ __await),
/* harmony export */   __awaiter: () => (/* binding */ __awaiter),
/* harmony export */   __classPrivateFieldGet: () => (/* binding */ __classPrivateFieldGet),
/* harmony export */   __classPrivateFieldIn: () => (/* binding */ __classPrivateFieldIn),
/* harmony export */   __classPrivateFieldSet: () => (/* binding */ __classPrivateFieldSet),
/* harmony export */   __createBinding: () => (/* binding */ __createBinding),
/* harmony export */   __decorate: () => (/* binding */ __decorate),
/* harmony export */   __exportStar: () => (/* binding */ __exportStar),
/* harmony export */   __extends: () => (/* binding */ __extends),
/* harmony export */   __generator: () => (/* binding */ __generator),
/* harmony export */   __importDefault: () => (/* binding */ __importDefault),
/* harmony export */   __importStar: () => (/* binding */ __importStar),
/* harmony export */   __makeTemplateObject: () => (/* binding */ __makeTemplateObject),
/* harmony export */   __metadata: () => (/* binding */ __metadata),
/* harmony export */   __param: () => (/* binding */ __param),
/* harmony export */   __read: () => (/* binding */ __read),
/* harmony export */   __rest: () => (/* binding */ __rest),
/* harmony export */   __spread: () => (/* binding */ __spread),
/* harmony export */   __spreadArray: () => (/* binding */ __spreadArray),
/* harmony export */   __spreadArrays: () => (/* binding */ __spreadArrays),
/* harmony export */   __values: () => (/* binding */ __values)
/* harmony export */ });
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var __createBinding = Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});

function __exportStar(m, o) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

/** @deprecated */
function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

/** @deprecated */
function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

var __setModuleDefault = Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

function __classPrivateFieldIn(state, receiver) {
    if (receiver === null || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError("Cannot use 'in' operator on non-object");
    return typeof state === "function" ? receiver === state : state.has(receiver);
}


/***/ }),

/***/ 643:
/*!**********************************************!*\
  !*** ../core/dist/esm/analytics/dispatch.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   dispatch: () => (/* binding */ dispatch),
/* harmony export */   getDelay: () => (/* binding */ getDelay)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _callback__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../callback */ 7764);


/* The amount of time in ms to wait before invoking the callback. */
var getDelay = function (startTimeInEpochMS, timeoutInMS) {
    var elapsedTime = Date.now() - startTimeInEpochMS;
    // increasing the timeout increases the delay by almost the same amount -- this is weird legacy behavior.
    return Math.max((timeoutInMS !== null && timeoutInMS !== void 0 ? timeoutInMS : 300) - elapsedTime, 0);
};
/**
 * Push an event into the dispatch queue and invoke any callbacks.
 *
 * @param event - Segment event to enqueue.
 * @param queue - Queue to dispatch against.
 * @param emitter - This is typically an instance of "Analytics" -- used for metrics / progress information.
 * @param options
 */
function dispatch(ctx, queue, emitter, options) {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, void 0, function () {
        var startTime, dispatched;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    emitter.emit('dispatch_start', ctx);
                    startTime = Date.now();
                    if (!queue.isEmpty()) return [3 /*break*/, 2];
                    return [4 /*yield*/, queue.dispatchSingle(ctx)];
                case 1:
                    dispatched = _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, queue.dispatch(ctx)];
                case 3:
                    dispatched = _a.sent();
                    _a.label = 4;
                case 4:
                    if (!(options === null || options === void 0 ? void 0 : options.callback)) return [3 /*break*/, 6];
                    return [4 /*yield*/, (0,_callback__WEBPACK_IMPORTED_MODULE_1__.invokeCallback)(dispatched, options.callback, getDelay(startTime, options.timeout))];
                case 5:
                    dispatched = _a.sent();
                    _a.label = 6;
                case 6:
                    if (options === null || options === void 0 ? void 0 : options.debug) {
                        dispatched.flush();
                    }
                    return [2 /*return*/, dispatched];
            }
        });
    });
}
//# sourceMappingURL=dispatch.js.map

/***/ }),

/***/ 7764:
/*!******************************************!*\
  !*** ../core/dist/esm/callback/index.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   invokeCallback: () => (/* binding */ invokeCallback),
/* harmony export */   pTimeout: () => (/* binding */ pTimeout),
/* harmony export */   sleep: () => (/* binding */ sleep)
/* harmony export */ });
function pTimeout(promise, timeout) {
    return new Promise(function (resolve, reject) {
        var timeoutId = setTimeout(function () {
            reject(Error('Promise timed out'));
        }, timeout);
        promise
            .then(function (val) {
            clearTimeout(timeoutId);
            return resolve(val);
        })
            .catch(reject);
    });
}
function sleep(timeoutInMs) {
    return new Promise(function (resolve) { return setTimeout(resolve, timeoutInMs); });
}
/**
 * @param ctx
 * @param callback - the function to invoke
 * @param delay - aka "timeout". The amount of time in ms to wait before invoking the callback.
 */
function invokeCallback(ctx, callback, delay) {
    var cb = function () {
        try {
            return Promise.resolve(callback(ctx));
        }
        catch (err) {
            return Promise.reject(err);
        }
    };
    return (sleep(delay)
        // pTimeout ensures that the callback can't cause the context to hang
        .then(function () { return pTimeout(cb(), 1000); })
        .catch(function (err) {
        ctx === null || ctx === void 0 ? void 0 : ctx.log('warn', 'Callback Error', { error: err });
        ctx === null || ctx === void 0 ? void 0 : ctx.stats.increment('callback_error');
    })
        .then(function () { return ctx; }));
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 7070:
/*!*****************************************!*\
  !*** ../core/dist/esm/context/index.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ContextCancelation: () => (/* binding */ ContextCancelation),
/* harmony export */   CoreContext: () => (/* binding */ CoreContext)
/* harmony export */ });
/* harmony import */ var _lukeed_uuid__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lukeed/uuid */ 9659);
/* harmony import */ var dset__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! dset */ 3435);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../logger */ 3991);
/* harmony import */ var _stats__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../stats */ 4034);




var ContextCancelation = /** @class */ (function () {
    function ContextCancelation(options) {
        var _a, _b, _c;
        this.retry = (_a = options.retry) !== null && _a !== void 0 ? _a : true;
        this.type = (_b = options.type) !== null && _b !== void 0 ? _b : 'plugin Error';
        this.reason = (_c = options.reason) !== null && _c !== void 0 ? _c : '';
    }
    return ContextCancelation;
}());

var CoreContext = /** @class */ (function () {
    function CoreContext(event, id, stats, logger) {
        if (id === void 0) { id = (0,_lukeed_uuid__WEBPACK_IMPORTED_MODULE_0__.v4)(); }
        if (stats === void 0) { stats = new _stats__WEBPACK_IMPORTED_MODULE_2__.NullStats(); }
        if (logger === void 0) { logger = new _logger__WEBPACK_IMPORTED_MODULE_3__.CoreLogger(); }
        this.attempts = 0;
        this.event = event;
        this._id = id;
        this.logger = logger;
        this.stats = stats;
    }
    CoreContext.system = function () {
        // This should be overridden by the subclass to return an instance of the subclass.
    };
    CoreContext.prototype.isSame = function (other) {
        return other.id === this.id;
    };
    CoreContext.prototype.cancel = function (error) {
        if (error) {
            throw error;
        }
        throw new ContextCancelation({ reason: 'Context Cancel' });
    };
    CoreContext.prototype.log = function (level, message, extras) {
        this.logger.log(level, message, extras);
    };
    Object.defineProperty(CoreContext.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: false,
        configurable: true
    });
    CoreContext.prototype.updateEvent = function (path, val) {
        var _a;
        // Don't allow integrations that are set to false to be overwritten with integration settings.
        if (path.split('.')[0] === 'integrations') {
            var integrationName = path.split('.')[1];
            if (((_a = this.event.integrations) === null || _a === void 0 ? void 0 : _a[integrationName]) === false) {
                return this.event;
            }
        }
        (0,dset__WEBPACK_IMPORTED_MODULE_1__.dset)(this.event, path, val);
        return this.event;
    };
    CoreContext.prototype.failedDelivery = function () {
        return this._failedDelivery;
    };
    CoreContext.prototype.setFailedDelivery = function (options) {
        this._failedDelivery = options;
    };
    CoreContext.prototype.logs = function () {
        return this.logger.logs;
    };
    CoreContext.prototype.flush = function () {
        this.logger.flush();
        this.stats.flush();
    };
    CoreContext.prototype.toJSON = function () {
        return {
            id: this._id,
            event: this.event,
            logs: this.logger.logs,
            metrics: this.stats.metrics,
        };
    };
    return CoreContext;
}());

//# sourceMappingURL=index.js.map

/***/ }),

/***/ 3210:
/*!****************************************!*\
  !*** ../core/dist/esm/events/index.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CoreEventFactory: () => (/* binding */ CoreEventFactory)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var dset__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! dset */ 3435);
/* harmony import */ var _utils_pick__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/pick */ 5099);
/* harmony import */ var _validation_assertions__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../validation/assertions */ 6583);





/**
 * Internal settings object that is used internally by the factory
 */
var InternalEventFactorySettings = /** @class */ (function () {
    function InternalEventFactorySettings(settings) {
        var _a, _b;
        this.settings = settings;
        this.createMessageId = settings.createMessageId;
        this.onEventMethodCall = (_a = settings.onEventMethodCall) !== null && _a !== void 0 ? _a : (function () { });
        this.onFinishedEvent = (_b = settings.onFinishedEvent) !== null && _b !== void 0 ? _b : (function () { });
    }
    return InternalEventFactorySettings;
}());
var CoreEventFactory = /** @class */ (function () {
    function CoreEventFactory(settings) {
        this.settings = new InternalEventFactorySettings(settings);
    }
    CoreEventFactory.prototype.track = function (event, properties, options, integrationOptions) {
        this.settings.onEventMethodCall({ type: 'track', options: options });
        return this.normalize((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, this.baseEvent()), { event: event, type: 'track', properties: properties !== null && properties !== void 0 ? properties : {}, options: (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, options), integrations: (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, integrationOptions) }));
    };
    CoreEventFactory.prototype.page = function (category, page, properties, options, integrationOptions) {
        var _a;
        this.settings.onEventMethodCall({ type: 'page', options: options });
        var event = {
            type: 'page',
            properties: (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, properties),
            options: (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, options),
            integrations: (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, integrationOptions),
        };
        if (category !== null) {
            event.category = category;
            event.properties = (_a = event.properties) !== null && _a !== void 0 ? _a : {};
            event.properties.category = category;
        }
        if (page !== null) {
            event.name = page;
        }
        return this.normalize((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, this.baseEvent()), event));
    };
    CoreEventFactory.prototype.screen = function (category, screen, properties, options, integrationOptions) {
        this.settings.onEventMethodCall({ type: 'screen', options: options });
        var event = {
            type: 'screen',
            properties: (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, properties),
            options: (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, options),
            integrations: (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, integrationOptions),
        };
        if (category !== null) {
            event.category = category;
        }
        if (screen !== null) {
            event.name = screen;
        }
        return this.normalize((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, this.baseEvent()), event));
    };
    CoreEventFactory.prototype.identify = function (userId, traits, options, integrationsOptions) {
        this.settings.onEventMethodCall({ type: 'identify', options: options });
        return this.normalize((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, this.baseEvent()), { type: 'identify', userId: userId, traits: traits !== null && traits !== void 0 ? traits : {}, options: (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, options), integrations: integrationsOptions }));
    };
    CoreEventFactory.prototype.group = function (groupId, traits, options, integrationOptions) {
        this.settings.onEventMethodCall({ type: 'group', options: options });
        return this.normalize((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, this.baseEvent()), { type: 'group', traits: traits !== null && traits !== void 0 ? traits : {}, options: (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, options), integrations: (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, integrationOptions), //
            groupId: groupId }));
    };
    CoreEventFactory.prototype.alias = function (to, from, // TODO: can we make this undefined?
    options, integrationOptions) {
        this.settings.onEventMethodCall({ type: 'alias', options: options });
        var base = {
            userId: to,
            type: 'alias',
            options: (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, options),
            integrations: (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, integrationOptions),
        };
        if (from !== null) {
            base.previousId = from;
        }
        if (to === undefined) {
            return this.normalize((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, base), this.baseEvent()));
        }
        return this.normalize((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, this.baseEvent()), base));
    };
    CoreEventFactory.prototype.baseEvent = function () {
        return {
            integrations: {},
            options: {},
        };
    };
    /**
     * Builds the context part of an event based on "foreign" keys that
     * are provided in the `Options` parameter for an Event
     */
    CoreEventFactory.prototype.context = function (options) {
        var _a;
        /**
         * If the event options are known keys from this list, we move them to the top level of the event.
         * Any other options are moved to context.
         */
        var eventOverrideKeys = [
            'userId',
            'anonymousId',
            'timestamp',
            'messageId',
        ];
        delete options['integrations'];
        var providedOptionsKeys = Object.keys(options);
        var context = (_a = options.context) !== null && _a !== void 0 ? _a : {};
        var eventOverrides = {};
        providedOptionsKeys.forEach(function (key) {
            if (key === 'context') {
                return;
            }
            if (eventOverrideKeys.includes(key)) {
                (0,dset__WEBPACK_IMPORTED_MODULE_0__.dset)(eventOverrides, key, options[key]);
            }
            else {
                (0,dset__WEBPACK_IMPORTED_MODULE_0__.dset)(context, key, options[key]);
            }
        });
        return [context, eventOverrides];
    };
    CoreEventFactory.prototype.normalize = function (event) {
        var _a, _b;
        var integrationBooleans = Object.keys((_a = event.integrations) !== null && _a !== void 0 ? _a : {}).reduce(function (integrationNames, name) {
            var _a;
            var _b;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, integrationNames), (_a = {}, _a[name] = Boolean((_b = event.integrations) === null || _b === void 0 ? void 0 : _b[name]), _a));
        }, {});
        // filter out any undefined options
        event.options = (0,_utils_pick__WEBPACK_IMPORTED_MODULE_2__.pickBy)(event.options || {}, function (_, value) {
            return value !== undefined;
        });
        // This is pretty trippy, but here's what's going on:
        // - a) We don't pass initial integration options as part of the event, only if they're true or false
        // - b) We do accept per integration overrides (like integrations.Amplitude.sessionId) at the event level
        // Hence the need to convert base integration options to booleans, but maintain per event integration overrides
        var allIntegrations = (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({}, integrationBooleans), (_b = event.options) === null || _b === void 0 ? void 0 : _b.integrations);
        var _c = event.options
            ? this.context(event.options)
            : [], context = _c[0], overrides = _c[1];
        var options = event.options, rest = (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__rest)(event, ["options"]);
        var evt = (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({ timestamp: new Date() }, rest), { context: context, integrations: allIntegrations }), overrides), { messageId: options.messageId || this.settings.createMessageId() });
        this.settings.onFinishedEvent(evt);
        (0,_validation_assertions__WEBPACK_IMPORTED_MODULE_3__.validateEvent)(evt);
        return evt;
    };
    return CoreEventFactory;
}());

//# sourceMappingURL=index.js.map

/***/ }),

/***/ 3991:
/*!****************************************!*\
  !*** ../core/dist/esm/logger/index.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CoreLogger: () => (/* binding */ CoreLogger)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

var CoreLogger = /** @class */ (function () {
    function CoreLogger() {
        this._logs = [];
    }
    CoreLogger.prototype.log = function (level, message, extras) {
        var time = new Date();
        this._logs.push({
            level: level,
            message: message,
            time: time,
            extras: extras,
        });
    };
    Object.defineProperty(CoreLogger.prototype, "logs", {
        get: function () {
            return this._logs;
        },
        enumerable: false,
        configurable: true
    });
    CoreLogger.prototype.flush = function () {
        if (this.logs.length > 1) {
            var formatted = this._logs.reduce(function (logs, log) {
                var _a;
                var _b, _c;
                var line = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, log), { json: JSON.stringify(log.extras, null, ' '), extras: log.extras });
                delete line['time'];
                var key = (_c = (_b = log.time) === null || _b === void 0 ? void 0 : _b.toISOString()) !== null && _c !== void 0 ? _c : '';
                if (logs[key]) {
                    key = "".concat(key, "-").concat(Math.random());
                }
                return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, logs), (_a = {}, _a[key] = line, _a));
            }, {});
            // ie doesn't like console.table
            if (console.table) {
                console.table(formatted);
            }
            else {
                console.log(formatted);
            }
        }
        else {
            this.logs.forEach(function (logEntry) {
                var level = logEntry.level, message = logEntry.message, extras = logEntry.extras;
                if (level === 'info' || level === 'debug') {
                    console.log(message, extras !== null && extras !== void 0 ? extras : '');
                }
                else {
                    console[level](message, extras !== null && extras !== void 0 ? extras : '');
                }
            });
        }
        this._logs = [];
    };
    return CoreLogger;
}());

//# sourceMappingURL=index.js.map

/***/ }),

/***/ 9845:
/*!**************************************************!*\
  !*** ../core/dist/esm/priority-queue/backoff.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   backoff: () => (/* binding */ backoff)
/* harmony export */ });
function backoff(params) {
    var random = Math.random() + 1;
    var _a = params.minTimeout, minTimeout = _a === void 0 ? 500 : _a, _b = params.factor, factor = _b === void 0 ? 2 : _b, attempt = params.attempt, _c = params.maxTimeout, maxTimeout = _c === void 0 ? Infinity : _c;
    return Math.min(random * minTimeout * Math.pow(factor, attempt), maxTimeout);
}
//# sourceMappingURL=backoff.js.map

/***/ }),

/***/ 9797:
/*!************************************************!*\
  !*** ../core/dist/esm/priority-queue/index.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ON_REMOVE_FROM_FUTURE: () => (/* binding */ ON_REMOVE_FROM_FUTURE),
/* harmony export */   PriorityQueue: () => (/* binding */ PriorityQueue)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _segment_analytics_generic_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @segment/analytics-generic-utils */ 3255);
/* harmony import */ var _backoff__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./backoff */ 9845);



/**
 * @internal
 */
var ON_REMOVE_FROM_FUTURE = 'onRemoveFromFuture';
var PriorityQueue = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(PriorityQueue, _super);
    function PriorityQueue(maxAttempts, queue, seen) {
        var _this = _super.call(this) || this;
        _this.future = [];
        _this.maxAttempts = maxAttempts;
        _this.queue = queue;
        _this.seen = seen !== null && seen !== void 0 ? seen : {};
        return _this;
    }
    PriorityQueue.prototype.push = function () {
        var _this = this;
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        var accepted = items.map(function (operation) {
            var attempts = _this.updateAttempts(operation);
            if (attempts > _this.maxAttempts || _this.includes(operation)) {
                return false;
            }
            _this.queue.push(operation);
            return true;
        });
        this.queue = this.queue.sort(function (a, b) { return _this.getAttempts(a) - _this.getAttempts(b); });
        return accepted;
    };
    PriorityQueue.prototype.pushWithBackoff = function (item, minTimeout) {
        if (minTimeout === void 0) { minTimeout = 0; }
        // One immediate retry unless we have a minimum timeout (e.g. for rate limiting)
        if (minTimeout == 0 && this.getAttempts(item) === 0) {
            return this.push(item)[0];
        }
        var timeout = (0,_backoff__WEBPACK_IMPORTED_MODULE_1__.backoff)({ attempt: this.getAttempts(item) });
        if (minTimeout > 0 && timeout < minTimeout) {
            timeout = minTimeout;
        }
        return this.scheduleItem(item, timeout);
    };
    PriorityQueue.prototype.pushWithDelay = function (item, delay) {
        return this.scheduleItem(item, delay);
    };
    PriorityQueue.prototype.scheduleItem = function (item, timeout) {
        var _this = this;
        var attempt = this.updateAttempts(item);
        if (attempt > this.maxAttempts || this.includes(item)) {
            return false;
        }
        setTimeout(function () {
            _this.queue.push(item);
            _this.future = _this.future.filter(function (f) { return f.id !== item.id; });
            _this.emit(ON_REMOVE_FROM_FUTURE);
        }, timeout);
        this.future.push(item);
        return true;
    };
    PriorityQueue.prototype.getAttempts = function (item) {
        var _a;
        return (_a = this.seen[item.id]) !== null && _a !== void 0 ? _a : 0;
    };
    PriorityQueue.prototype.updateAttempts = function (item) {
        this.seen[item.id] = this.getAttempts(item) + 1;
        return this.getAttempts(item);
    };
    PriorityQueue.prototype.includes = function (item) {
        return (this.queue.includes(item) ||
            this.future.includes(item) ||
            Boolean(this.queue.find(function (i) { return i.id === item.id; })) ||
            Boolean(this.future.find(function (i) { return i.id === item.id; })));
    };
    PriorityQueue.prototype.pop = function () {
        return this.queue.shift();
    };
    Object.defineProperty(PriorityQueue.prototype, "length", {
        get: function () {
            return this.queue.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PriorityQueue.prototype, "todo", {
        get: function () {
            return this.queue.length + this.future.length;
        },
        enumerable: false,
        configurable: true
    });
    return PriorityQueue;
}(_segment_analytics_generic_utils__WEBPACK_IMPORTED_MODULE_2__.Emitter));

//# sourceMappingURL=index.js.map

/***/ }),

/***/ 2620:
/*!******************************************!*\
  !*** ../core/dist/esm/queue/delivery.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   attempt: () => (/* binding */ attempt),
/* harmony export */   ensure: () => (/* binding */ ensure)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _context__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../context */ 7070);


function tryAsync(fn) {
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, void 0, function () {
        var err_1;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fn()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    err_1 = _a.sent();
                    return [2 /*return*/, Promise.reject(err_1)];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function attempt(ctx, plugin) {
    ctx.log('debug', 'plugin', { plugin: plugin.name });
    var start = new Date().getTime();
    var hook = plugin[ctx.event.type];
    if (hook === undefined) {
        return Promise.resolve(ctx);
    }
    var newCtx = tryAsync(function () { return hook.apply(plugin, [ctx]); })
        .then(function (ctx) {
        var done = new Date().getTime() - start;
        ctx.stats.gauge('plugin_time', done, ["plugin:".concat(plugin.name)]);
        return ctx;
    })
        .catch(function (err) {
        if (err instanceof _context__WEBPACK_IMPORTED_MODULE_1__.ContextCancelation &&
            err.type === 'middleware_cancellation') {
            throw err;
        }
        if (err instanceof _context__WEBPACK_IMPORTED_MODULE_1__.ContextCancelation) {
            ctx.log('warn', err.type, {
                plugin: plugin.name,
                error: err,
            });
            return err;
        }
        ctx.log('error', 'plugin Error', {
            plugin: plugin.name,
            error: err,
        });
        ctx.stats.increment('plugin_error', 1, ["plugin:".concat(plugin.name)]);
        return err;
    });
    return newCtx;
}
function ensure(ctx, plugin) {
    return attempt(ctx, plugin).then(function (newContext) {
        if (newContext instanceof _context__WEBPACK_IMPORTED_MODULE_1__.CoreContext) {
            return newContext;
        }
        ctx.log('debug', 'Context canceled');
        ctx.stats.increment('context_canceled');
        ctx.cancel(newContext);
    });
}
//# sourceMappingURL=delivery.js.map

/***/ }),

/***/ 6108:
/*!*********************************************!*\
  !*** ../core/dist/esm/queue/event-queue.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CoreEventQueue: () => (/* binding */ CoreEventQueue)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);
/* harmony import */ var _utils_group_by__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/group-by */ 9533);
/* harmony import */ var _priority_queue__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../priority-queue */ 9797);
/* harmony import */ var _context__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../context */ 7070);
/* harmony import */ var _segment_analytics_generic_utils__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @segment/analytics-generic-utils */ 3255);
/* harmony import */ var _task_task_group__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../task/task-group */ 9719);
/* harmony import */ var _delivery__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./delivery */ 2620);







var CoreEventQueue = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(CoreEventQueue, _super);
    function CoreEventQueue(priorityQueue) {
        var _this = _super.call(this) || this;
        /**
         * All event deliveries get suspended until all the tasks in this task group are complete.
         * For example: a middleware that augments the event object should be loaded safely as a
         * critical task, this way, event queue will wait for it to be ready before sending events.
         *
         * This applies to all the events already in the queue, and the upcoming ones
         */
        _this.criticalTasks = (0,_task_task_group__WEBPACK_IMPORTED_MODULE_1__.createTaskGroup)();
        _this.plugins = [];
        _this.failedInitializations = [];
        _this.flushing = false;
        _this.queue = priorityQueue;
        _this.queue.on(_priority_queue__WEBPACK_IMPORTED_MODULE_2__.ON_REMOVE_FROM_FUTURE, function () {
            _this.scheduleFlush(0);
        });
        return _this;
    }
    CoreEventQueue.prototype.register = function (ctx, plugin, instance) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, void 0, function () {
            var handleLoadError, err_1;
            var _this = this;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.plugins.push(plugin);
                        handleLoadError = function (err) {
                            _this.failedInitializations.push(plugin.name);
                            _this.emit('initialization_failure', plugin);
                            console.warn(plugin.name, err);
                            ctx.log('warn', 'Failed to load destination', {
                                plugin: plugin.name,
                                error: err,
                            });
                            // Filter out the failed plugin by excluding it from the list
                            _this.plugins = _this.plugins.filter(function (p) { return p !== plugin; });
                        };
                        if (!(plugin.type === 'destination' && plugin.name !== 'Segment.io')) return [3 /*break*/, 1];
                        plugin.load(ctx, instance).catch(handleLoadError);
                        return [3 /*break*/, 4];
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, plugin.load(ctx, instance)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        handleLoadError(err_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CoreEventQueue.prototype.deregister = function (ctx, plugin, instance) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, void 0, function () {
            var e_1;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!plugin.unload) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.resolve(plugin.unload(ctx, instance))];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.plugins = this.plugins.filter(function (p) { return p.name !== plugin.name; });
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        ctx.log('warn', 'Failed to unload destination', {
                            plugin: plugin.name,
                            error: e_1,
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CoreEventQueue.prototype.dispatch = function (ctx) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, void 0, function () {
            var willDeliver;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                ctx.log('debug', 'Dispatching');
                ctx.stats.increment('message_dispatched');
                this.queue.push(ctx);
                willDeliver = this.subscribeToDelivery(ctx);
                this.scheduleFlush(0);
                return [2 /*return*/, willDeliver];
            });
        });
    };
    CoreEventQueue.prototype.subscribeToDelivery = function (ctx) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, void 0, function () {
            var _this = this;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        var onDeliver = function (flushed, delivered) {
                            if (flushed.isSame(ctx)) {
                                _this.off('flush', onDeliver);
                                if (delivered) {
                                    resolve(flushed);
                                }
                                else {
                                    resolve(flushed);
                                }
                            }
                        };
                        _this.on('flush', onDeliver);
                    })];
            });
        });
    };
    CoreEventQueue.prototype.dispatchSingle = function (ctx) {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, void 0, function () {
            var _this = this;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                ctx.log('debug', 'Dispatching');
                ctx.stats.increment('message_dispatched');
                this.queue.updateAttempts(ctx);
                ctx.attempts = 1;
                return [2 /*return*/, this.deliver(ctx).catch(function (err) {
                        var accepted = _this.enqueuRetry(err, ctx);
                        if (!accepted) {
                            ctx.setFailedDelivery({ reason: err });
                            return ctx;
                        }
                        return _this.subscribeToDelivery(ctx);
                    })];
            });
        });
    };
    CoreEventQueue.prototype.isEmpty = function () {
        return this.queue.length === 0;
    };
    CoreEventQueue.prototype.scheduleFlush = function (timeout) {
        var _this = this;
        if (timeout === void 0) { timeout = 500; }
        if (this.flushing) {
            return;
        }
        this.flushing = true;
        setTimeout(function () {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            _this.flush().then(function () {
                setTimeout(function () {
                    _this.flushing = false;
                    if (_this.queue.length) {
                        _this.scheduleFlush(0);
                    }
                }, 0);
            });
        }, timeout);
    };
    CoreEventQueue.prototype.deliver = function (ctx) {
        var _a;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, void 0, function () {
            var start, done, failure, error, err_2, error;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.criticalTasks.done()];
                    case 1:
                        _b.sent();
                        start = Date.now();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.flushOne(ctx)];
                    case 3:
                        ctx = _b.sent();
                        done = Date.now() - start;
                        failure = ctx.failedDelivery();
                        if (failure) {
                            error = failure.reason instanceof Error
                                ? failure.reason
                                : new Error(String((_a = failure.reason) !== null && _a !== void 0 ? _a : 'Unknown delivery failure'));
                            ctx.log('error', 'Failed to deliver', error);
                            this.emit('delivery_failure', ctx, error);
                            ctx.stats.increment('delivery_failed');
                            return [2 /*return*/, ctx];
                        }
                        this.emit('delivery_success', ctx);
                        ctx.stats.gauge('delivered', done);
                        ctx.log('debug', 'Delivered', ctx.event);
                        return [2 /*return*/, ctx];
                    case 4:
                        err_2 = _b.sent();
                        error = err_2;
                        ctx.log('error', 'Failed to deliver', error);
                        this.emit('delivery_failure', ctx, error);
                        ctx.stats.increment('delivery_failed');
                        throw err_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CoreEventQueue.prototype.enqueuRetry = function (err, ctx) {
        var retriable = !(err instanceof _context__WEBPACK_IMPORTED_MODULE_3__.ContextCancelation) || err.retry;
        if (!retriable) {
            return false;
        }
        return this.queue.pushWithBackoff(ctx);
    };
    CoreEventQueue.prototype.flush = function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, void 0, function () {
            var ctx, delivered, err_3, accepted;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.queue.length === 0) {
                            return [2 /*return*/, []];
                        }
                        ctx = this.queue.pop();
                        if (!ctx) {
                            return [2 /*return*/, []];
                        }
                        ctx.attempts = this.queue.getAttempts(ctx);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.deliver(ctx)
                            // deliver() now handles failedDelivery state internally without throwing,
                            // so we check ctx.failedDelivery() to determine the correct flush status
                        ];
                    case 2:
                        ctx = _a.sent();
                        delivered = !ctx.failedDelivery();
                        this.emit('flush', ctx, delivered);
                        return [3 /*break*/, 4];
                    case 3:
                        err_3 = _a.sent();
                        accepted = this.enqueuRetry(err_3, ctx);
                        if (!accepted) {
                            ctx.setFailedDelivery({ reason: err_3 });
                            this.emit('flush', ctx, false);
                        }
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/, [ctx]];
                }
            });
        });
    };
    CoreEventQueue.prototype.isReady = function () {
        // return this.plugins.every((p) => p.isLoaded())
        // should we wait for every plugin to load?
        return true;
    };
    CoreEventQueue.prototype.availableExtensions = function (denyList) {
        var available = this.plugins.filter(function (p) {
            var _a, _b, _c;
            // Only filter out destination plugins or the Segment.io plugin
            if (p.type !== 'destination' && p.name !== 'Segment.io') {
                return true;
            }
            var alternativeNameMatch = undefined;
            (_a = p.alternativeNames) === null || _a === void 0 ? void 0 : _a.forEach(function (name) {
                if (denyList[name] !== undefined) {
                    alternativeNameMatch = denyList[name];
                }
            });
            // Explicit integration option takes precedence, `All: false` does not apply to Segment.io
            return ((_c = (_b = denyList[p.name]) !== null && _b !== void 0 ? _b : alternativeNameMatch) !== null && _c !== void 0 ? _c : (p.name === 'Segment.io' ? true : denyList.All) !== false);
        });
        var _a = (0,_utils_group_by__WEBPACK_IMPORTED_MODULE_4__.groupBy)(available, 'type'), _b = _a.before, before = _b === void 0 ? [] : _b, _c = _a.enrichment, enrichment = _c === void 0 ? [] : _c, _d = _a.destination, destination = _d === void 0 ? [] : _d, _e = _a.after, after = _e === void 0 ? [] : _e;
        return {
            before: before,
            enrichment: enrichment,
            destinations: destination,
            after: after,
        };
    };
    CoreEventQueue.prototype.flushOne = function (ctx) {
        var _a, _b;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(this, void 0, void 0, function () {
            var _c, before, enrichment, _i, before_1, beforeWare, temp, _d, enrichment_1, enrichmentWare, temp, _e, destinations, after, afterCalls;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!this.isReady()) {
                            throw new Error('Not ready');
                        }
                        if (ctx.attempts > 1) {
                            this.emit('delivery_retry', ctx);
                        }
                        _c = this.availableExtensions((_a = ctx.event.integrations) !== null && _a !== void 0 ? _a : {}), before = _c.before, enrichment = _c.enrichment;
                        _i = 0, before_1 = before;
                        _f.label = 1;
                    case 1:
                        if (!(_i < before_1.length)) return [3 /*break*/, 4];
                        beforeWare = before_1[_i];
                        return [4 /*yield*/, (0,_delivery__WEBPACK_IMPORTED_MODULE_5__.ensure)(ctx, beforeWare)];
                    case 2:
                        temp = _f.sent();
                        if (temp instanceof _context__WEBPACK_IMPORTED_MODULE_3__.CoreContext) {
                            ctx = temp;
                        }
                        this.emit('message_enriched', ctx, beforeWare);
                        _f.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        _d = 0, enrichment_1 = enrichment;
                        _f.label = 5;
                    case 5:
                        if (!(_d < enrichment_1.length)) return [3 /*break*/, 8];
                        enrichmentWare = enrichment_1[_d];
                        return [4 /*yield*/, (0,_delivery__WEBPACK_IMPORTED_MODULE_5__.attempt)(ctx, enrichmentWare)];
                    case 6:
                        temp = _f.sent();
                        if (temp instanceof _context__WEBPACK_IMPORTED_MODULE_3__.CoreContext) {
                            ctx = temp;
                        }
                        this.emit('message_enriched', ctx, enrichmentWare);
                        _f.label = 7;
                    case 7:
                        _d++;
                        return [3 /*break*/, 5];
                    case 8:
                        _e = this.availableExtensions((_b = ctx.event.integrations) !== null && _b !== void 0 ? _b : {}), destinations = _e.destinations, after = _e.after;
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                setTimeout(function () {
                                    var attempts = destinations.map(function (destination) {
                                        return (0,_delivery__WEBPACK_IMPORTED_MODULE_5__.attempt)(ctx, destination);
                                    });
                                    Promise.all(attempts).then(resolve).catch(reject);
                                }, 0);
                            })];
                    case 9:
                        _f.sent();
                        ctx.stats.increment('message_delivered');
                        this.emit('message_delivered', ctx);
                        afterCalls = after.map(function (after) { return (0,_delivery__WEBPACK_IMPORTED_MODULE_5__.attempt)(ctx, after); });
                        return [4 /*yield*/, Promise.all(afterCalls)];
                    case 10:
                        _f.sent();
                        return [2 /*return*/, ctx];
                }
            });
        });
    };
    return CoreEventQueue;
}(_segment_analytics_generic_utils__WEBPACK_IMPORTED_MODULE_6__.Emitter));

//# sourceMappingURL=event-queue.js.map

/***/ }),

/***/ 4034:
/*!***************************************!*\
  !*** ../core/dist/esm/stats/index.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CoreStats: () => (/* binding */ CoreStats),
/* harmony export */   NullStats: () => (/* binding */ NullStats)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

var compactMetricType = function (type) {
    var enums = {
        gauge: 'g',
        counter: 'c',
    };
    return enums[type];
};
var CoreStats = /** @class */ (function () {
    function CoreStats() {
        this.metrics = [];
    }
    CoreStats.prototype.increment = function (metric, by, tags) {
        if (by === void 0) { by = 1; }
        this.metrics.push({
            metric: metric,
            value: by,
            tags: tags !== null && tags !== void 0 ? tags : [],
            type: 'counter',
            timestamp: Date.now(),
        });
    };
    CoreStats.prototype.gauge = function (metric, value, tags) {
        this.metrics.push({
            metric: metric,
            value: value,
            tags: tags !== null && tags !== void 0 ? tags : [],
            type: 'gauge',
            timestamp: Date.now(),
        });
    };
    CoreStats.prototype.flush = function () {
        var formatted = this.metrics.map(function (m) { return ((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__assign)({}, m), { tags: m.tags.join(',') })); });
        // ie doesn't like console.table
        if (console.table) {
            console.table(formatted);
        }
        else {
            console.log(formatted);
        }
        this.metrics = [];
    };
    /**
     * compact keys for smaller payload
     */
    CoreStats.prototype.serialize = function () {
        return this.metrics.map(function (m) {
            return {
                m: m.metric,
                v: m.value,
                t: m.tags,
                k: compactMetricType(m.type),
                e: m.timestamp,
            };
        });
    };
    return CoreStats;
}());

var NullStats = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(NullStats, _super);
    function NullStats() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NullStats.prototype.gauge = function () {
        var _args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _args[_i] = arguments[_i];
        }
    };
    NullStats.prototype.increment = function () {
        var _args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _args[_i] = arguments[_i];
        }
    };
    NullStats.prototype.flush = function () {
        var _args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _args[_i] = arguments[_i];
        }
    };
    NullStats.prototype.serialize = function () {
        var _args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _args[_i] = arguments[_i];
        }
        return [];
    };
    return NullStats;
}(CoreStats));

//# sourceMappingURL=index.js.map

/***/ }),

/***/ 9719:
/*!*******************************************!*\
  !*** ../core/dist/esm/task/task-group.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createTaskGroup: () => (/* binding */ createTaskGroup)
/* harmony export */ });
/* harmony import */ var _utils_is_thenable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/is-thenable */ 2876);

var createTaskGroup = function () {
    var taskCompletionPromise;
    var resolvePromise;
    var count = 0;
    return {
        done: function () { return taskCompletionPromise; },
        run: function (op) {
            var returnValue = op();
            if ((0,_utils_is_thenable__WEBPACK_IMPORTED_MODULE_0__.isThenable)(returnValue)) {
                if (++count === 1) {
                    taskCompletionPromise = new Promise(function (res) { return (resolvePromise = res); });
                }
                returnValue.finally(function () { return --count === 0 && resolvePromise(); });
            }
            return returnValue;
        },
    };
};
//# sourceMappingURL=task-group.js.map

/***/ }),

/***/ 9533:
/*!******************************************!*\
  !*** ../core/dist/esm/utils/group-by.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   groupBy: () => (/* binding */ groupBy)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

function groupBy(collection, grouper) {
    var results = {};
    collection.forEach(function (item) {
        var _a;
        var key = undefined;
        if (typeof grouper === 'string') {
            var suggestedKey = item[grouper];
            key =
                typeof suggestedKey !== 'string'
                    ? JSON.stringify(suggestedKey)
                    : suggestedKey;
        }
        else if (grouper instanceof Function) {
            key = grouper(item);
        }
        if (key === undefined) {
            return;
        }
        results[key] = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spreadArray)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spreadArray)([], ((_a = results[key]) !== null && _a !== void 0 ? _a : []), true), [item], false);
    });
    return results;
}
//# sourceMappingURL=group-by.js.map

/***/ }),

/***/ 2876:
/*!*********************************************!*\
  !*** ../core/dist/esm/utils/is-thenable.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isThenable: () => (/* binding */ isThenable)
/* harmony export */ });
/**
 *  Check if  thenable
 *  (instanceof Promise doesn't respect realms)
 */
var isThenable = function (value) {
    return typeof value === 'object' &&
        value !== null &&
        'then' in value &&
        typeof value.then === 'function';
};
//# sourceMappingURL=is-thenable.js.map

/***/ }),

/***/ 5099:
/*!**************************************!*\
  !*** ../core/dist/esm/utils/pick.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   pickBy: () => (/* binding */ pickBy)
/* harmony export */ });
var pickBy = function (obj, fn) {
    return Object.keys(obj)
        .filter(function (k) { return fn(k, obj[k]); })
        .reduce(function (acc, key) { return ((acc[key] = obj[key]), acc); }, {});
};
//# sourceMappingURL=pick.js.map

/***/ }),

/***/ 6583:
/*!*************************************************!*\
  !*** ../core/dist/esm/validation/assertions.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   assertEventExists: () => (/* binding */ assertEventExists),
/* harmony export */   assertEventType: () => (/* binding */ assertEventType),
/* harmony export */   assertMessageId: () => (/* binding */ assertMessageId),
/* harmony export */   assertTrackEventName: () => (/* binding */ assertTrackEventName),
/* harmony export */   assertTrackEventProperties: () => (/* binding */ assertTrackEventProperties),
/* harmony export */   assertTraits: () => (/* binding */ assertTraits),
/* harmony export */   assertUserIdentity: () => (/* binding */ assertUserIdentity),
/* harmony export */   validateEvent: () => (/* binding */ validateEvent)
/* harmony export */ });
/* harmony import */ var _errors__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./errors */ 4285);
/* harmony import */ var _helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./helpers */ 441);


var stringError = 'is not a string';
var objError = 'is not an object';
var nilError = 'is nil';
// user identity check could hypothetically could be used in the browser event factory, but not 100% sure -- so this is node only for now
function assertUserIdentity(event) {
    var USER_FIELD_NAME = '.userId/anonymousId/previousId/groupId';
    var getAnyUserId = function (event) { var _a, _b, _c; return (_c = (_b = (_a = event.userId) !== null && _a !== void 0 ? _a : event.anonymousId) !== null && _b !== void 0 ? _b : event.groupId) !== null && _c !== void 0 ? _c : event.previousId; };
    var id = getAnyUserId(event);
    if (!(0,_helpers__WEBPACK_IMPORTED_MODULE_0__.exists)(id)) {
        throw new _errors__WEBPACK_IMPORTED_MODULE_1__.ValidationError(USER_FIELD_NAME, nilError);
    }
    else if (!(0,_helpers__WEBPACK_IMPORTED_MODULE_0__.isString)(id)) {
        throw new _errors__WEBPACK_IMPORTED_MODULE_1__.ValidationError(USER_FIELD_NAME, stringError);
    }
}
function assertEventExists(event) {
    if (!(0,_helpers__WEBPACK_IMPORTED_MODULE_0__.exists)(event)) {
        throw new _errors__WEBPACK_IMPORTED_MODULE_1__.ValidationError('Event', nilError);
    }
    if (typeof event !== 'object') {
        throw new _errors__WEBPACK_IMPORTED_MODULE_1__.ValidationError('Event', objError);
    }
}
function assertEventType(event) {
    if (!(0,_helpers__WEBPACK_IMPORTED_MODULE_0__.isString)(event.type)) {
        throw new _errors__WEBPACK_IMPORTED_MODULE_1__.ValidationError('.type', stringError);
    }
}
function assertTrackEventName(event) {
    if (!(0,_helpers__WEBPACK_IMPORTED_MODULE_0__.isString)(event.event)) {
        throw new _errors__WEBPACK_IMPORTED_MODULE_1__.ValidationError('.event', stringError);
    }
}
function assertTrackEventProperties(event) {
    if (!(0,_helpers__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(event.properties)) {
        throw new _errors__WEBPACK_IMPORTED_MODULE_1__.ValidationError('.properties', objError);
    }
}
function assertTraits(event) {
    if (!(0,_helpers__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(event.traits)) {
        throw new _errors__WEBPACK_IMPORTED_MODULE_1__.ValidationError('.traits', objError);
    }
}
function assertMessageId(event) {
    if (!(0,_helpers__WEBPACK_IMPORTED_MODULE_0__.isString)(event.messageId)) {
        throw new _errors__WEBPACK_IMPORTED_MODULE_1__.ValidationError('.messageId', stringError);
    }
}
function validateEvent(event) {
    assertEventExists(event);
    assertEventType(event);
    assertMessageId(event);
    if (event.type === 'track') {
        assertTrackEventName(event);
        assertTrackEventProperties(event);
    }
    if (['group', 'identify'].includes(event.type)) {
        assertTraits(event);
    }
}
//# sourceMappingURL=assertions.js.map

/***/ }),

/***/ 4285:
/*!*********************************************!*\
  !*** ../core/dist/esm/validation/errors.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ValidationError: () => (/* binding */ ValidationError)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ 5478);

var ValidationError = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(ValidationError, _super);
    function ValidationError(field, message) {
        var _this = _super.call(this, "".concat(field, " ").concat(message)) || this;
        _this.field = field;
        return _this;
    }
    return ValidationError;
}(Error));

//# sourceMappingURL=errors.js.map

/***/ }),

/***/ 441:
/*!**********************************************!*\
  !*** ../core/dist/esm/validation/helpers.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   exists: () => (/* binding */ exists),
/* harmony export */   isFunction: () => (/* binding */ isFunction),
/* harmony export */   isNumber: () => (/* binding */ isNumber),
/* harmony export */   isPlainObject: () => (/* binding */ isPlainObject),
/* harmony export */   isString: () => (/* binding */ isString)
/* harmony export */ });
function isString(obj) {
    return typeof obj === 'string';
}
function isNumber(obj) {
    return typeof obj === 'number';
}
function isFunction(obj) {
    return typeof obj === 'function';
}
function exists(val) {
    return val !== undefined && val !== null;
}
function isPlainObject(obj) {
    return (Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === 'object');
}
//# sourceMappingURL=helpers.js.map

/***/ }),

/***/ 8115:
/*!********************************************************************!*\
  !*** ../generic-utils/dist/esm/create-deferred/create-deferred.js ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createDeferred: () => (/* binding */ createDeferred)
/* harmony export */ });
/**
 * Return a promise that can be externally resolved
 */
var createDeferred = function () {
    var resolve;
    var reject;
    var settled = false;
    var promise = new Promise(function (_resolve, _reject) {
        resolve = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            settled = true;
            _resolve.apply(void 0, args);
        };
        reject = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            settled = true;
            _reject.apply(void 0, args);
        };
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise,
        isSettled: function () { return settled; },
    };
};
//# sourceMappingURL=create-deferred.js.map

/***/ }),

/***/ 3255:
/*!****************************************************!*\
  !*** ../generic-utils/dist/esm/emitter/emitter.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Emitter: () => (/* binding */ Emitter)
/* harmony export */ });
/**
 * Event Emitter that takes the expected contract as a generic
 * @example
 * ```ts
 *  type Contract = {
 *    delivery_success: [DeliverySuccessResponse, Metrics],
 *    delivery_failure: [DeliveryError]
 * }
 *  new Emitter<Contract>()
 *  .on('delivery_success', (res, metrics) => ...)
 *  .on('delivery_failure', (err) => ...)
 * ```
 */
var Emitter = /** @class */ (function () {
    function Emitter(options) {
        var _a;
        this.callbacks = {};
        this.warned = false;
        this.maxListeners = (_a = options === null || options === void 0 ? void 0 : options.maxListeners) !== null && _a !== void 0 ? _a : 10;
    }
    Emitter.prototype.warnIfPossibleMemoryLeak = function (event) {
        if (this.warned) {
            return;
        }
        if (this.maxListeners &&
            this.callbacks[event].length > this.maxListeners) {
            console.warn("Event Emitter: Possible memory leak detected; ".concat(String(event), " has exceeded ").concat(this.maxListeners, " listeners."));
            this.warned = true;
        }
    };
    Emitter.prototype.on = function (event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [callback];
        }
        else {
            this.callbacks[event].push(callback);
            this.warnIfPossibleMemoryLeak(event);
        }
        return this;
    };
    Emitter.prototype.once = function (event, callback) {
        var _this = this;
        var on = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _this.off(event, on);
            callback.apply(_this, args);
        };
        this.on(event, on);
        return this;
    };
    Emitter.prototype.off = function (event, callback) {
        var _a;
        var fns = (_a = this.callbacks[event]) !== null && _a !== void 0 ? _a : [];
        var without = fns.filter(function (fn) { return fn !== callback; });
        this.callbacks[event] = without;
        return this;
    };
    Emitter.prototype.emit = function (event) {
        var _this = this;
        var _a;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var callbacks = (_a = this.callbacks[event]) !== null && _a !== void 0 ? _a : [];
        callbacks.forEach(function (callback) {
            callback.apply(_this, args);
        });
        return this;
    };
    return Emitter;
}());

//# sourceMappingURL=emitter.js.map

/***/ }),

/***/ 9659:
/*!******************************************************!*\
  !*** ../../node_modules/@lukeed/uuid/dist/index.mjs ***!
  \******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   v4: () => (/* binding */ v4)
/* harmony export */ });
var IDX=256, HEX=[], BUFFER;
while (IDX--) HEX[IDX] = (IDX + 256).toString(16).substring(1);

function v4() {
	var i=0, num, out='';

	if (!BUFFER || ((IDX + 16) > 256)) {
		BUFFER = Array(i=256);
		while (i--) BUFFER[i] = 256 * Math.random() | 0;
		i = IDX = 0;
	}

	for (; i < 16; i++) {
		num = BUFFER[IDX + i];
		if (i==6) out += HEX[num & 15 | 64];
		else if (i==8) out += HEX[num & 63 | 128];
		else out += HEX[num];

		if (i & 1 && i > 1 && i < 11) out += '-';
	}

	IDX++;
	return out;
}


/***/ }),

/***/ 3435:
/*!**********************************************!*\
  !*** ../../node_modules/dset/dist/index.mjs ***!
  \**********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   dset: () => (/* binding */ dset)
/* harmony export */ });
function dset(obj, keys, val) {
	keys.split && (keys=keys.split('.'));
	var i=0, l=keys.length, t=obj, x, k;
	while (i < l) {
		k = ''+keys[i++];
		if (k === '__proto__' || k === 'constructor' || k === 'prototype') break;
		t = t[k] = (i === l) ? val : (typeof(x=t[k])===typeof(keys)) ? x : (keys[i]*0 !== 0 || !!~(''+keys[i]).indexOf('.')) ? {} : [];
	}
}


/***/ }),

/***/ 3478:
/*!*******************************************************!*\
  !*** ../../node_modules/js-cookie/dist/js.cookie.mjs ***!
  \*******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/*! js-cookie v3.0.1 | MIT */
/* eslint-disable no-var */
function assign (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    for (var key in source) {
      target[key] = source[key];
    }
  }
  return target
}
/* eslint-enable no-var */

/* eslint-disable no-var */
var defaultConverter = {
  read: function (value) {
    if (value[0] === '"') {
      value = value.slice(1, -1);
    }
    return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
  },
  write: function (value) {
    return encodeURIComponent(value).replace(
      /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
      decodeURIComponent
    )
  }
};
/* eslint-enable no-var */

/* eslint-disable no-var */

function init (converter, defaultAttributes) {
  function set (key, value, attributes) {
    if (typeof document === 'undefined') {
      return
    }

    attributes = assign({}, defaultAttributes, attributes);

    if (typeof attributes.expires === 'number') {
      attributes.expires = new Date(Date.now() + attributes.expires * 864e5);
    }
    if (attributes.expires) {
      attributes.expires = attributes.expires.toUTCString();
    }

    key = encodeURIComponent(key)
      .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
      .replace(/[()]/g, escape);

    var stringifiedAttributes = '';
    for (var attributeName in attributes) {
      if (!attributes[attributeName]) {
        continue
      }

      stringifiedAttributes += '; ' + attributeName;

      if (attributes[attributeName] === true) {
        continue
      }

      // Considers RFC 6265 section 5.2:
      // ...
      // 3.  If the remaining unparsed-attributes contains a %x3B (";")
      //     character:
      // Consume the characters of the unparsed-attributes up to,
      // not including, the first %x3B (";") character.
      // ...
      stringifiedAttributes += '=' + attributes[attributeName].split(';')[0];
    }

    return (document.cookie =
      key + '=' + converter.write(value, key) + stringifiedAttributes)
  }

  function get (key) {
    if (typeof document === 'undefined' || (arguments.length && !key)) {
      return
    }

    // To prevent the for loop in the first place assign an empty array
    // in case there are no cookies at all.
    var cookies = document.cookie ? document.cookie.split('; ') : [];
    var jar = {};
    for (var i = 0; i < cookies.length; i++) {
      var parts = cookies[i].split('=');
      var value = parts.slice(1).join('=');

      try {
        var foundKey = decodeURIComponent(parts[0]);
        jar[foundKey] = converter.read(value, foundKey);

        if (key === foundKey) {
          break
        }
      } catch (e) {}
    }

    return key ? jar[key] : jar
  }

  return Object.create(
    {
      set: set,
      get: get,
      remove: function (key, attributes) {
        set(
          key,
          '',
          assign({}, attributes, {
            expires: -1
          })
        );
      },
      withAttributes: function (attributes) {
        return init(this.converter, assign({}, this.attributes, attributes))
      },
      withConverter: function (converter) {
        return init(assign({}, this.converter, converter), this.attributes)
      }
    },
    {
      attributes: { value: Object.freeze(defaultAttributes) },
      converter: { value: Object.freeze(converter) }
    }
  )
}

var api = init(defaultConverter, { path: '/' });
/* eslint-enable no-var */

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (api);


/***/ }),

/***/ 8575:
/*!***************************************************!*\
  !*** ../../node_modules/unfetch/dist/unfetch.mjs ***!
  \***************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(e,n){return n=n||{},new Promise(function(t,r){var s=new XMLHttpRequest,o=[],u=[],i={},a=function(){return{ok:2==(s.status/100|0),statusText:s.statusText,status:s.status,url:s.responseURL,text:function(){return Promise.resolve(s.responseText)},json:function(){return Promise.resolve(JSON.parse(s.responseText))},blob:function(){return Promise.resolve(new Blob([s.response]))},clone:a,headers:{keys:function(){return o},entries:function(){return u},get:function(e){return i[e.toLowerCase()]},has:function(e){return e.toLowerCase()in i}}}};for(var l in s.open(n.method||"get",e,!0),s.onload=function(){s.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm,function(e,n,t){o.push(n=n.toLowerCase()),u.push([n,t]),i[n]=i[n]?i[n]+","+t:t}),t(a())},s.onerror=r,s.withCredentials="include"==n.credentials,n.headers)s.setRequestHeader(l,n.headers[l]);s.send(n.body||null)})}
//# sourceMappingURL=unfetch.mjs.map


/***/ }),

/***/ 8838:
/*!****************************************!*\
  !*** ../page-tools/dist/esm/index.mjs ***!
  \****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BufferedPageContextDiscriminant: () => (/* binding */ BufferedPageContextDiscriminant),
/* harmony export */   createBufferedPageContext: () => (/* binding */ createBufferedPageContext),
/* harmony export */   createPageContext: () => (/* binding */ createPageContext),
/* harmony export */   getDefaultBufferedPageContext: () => (/* binding */ getDefaultBufferedPageContext),
/* harmony export */   getDefaultPageContext: () => (/* binding */ getDefaultPageContext),
/* harmony export */   isBufferedPageContext: () => (/* binding */ isBufferedPageContext)
/* harmony export */ });
// src/page-context.ts
function isPlainObject(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === "object";
}
var BufferedPageContextDiscriminant = "bpc";
var createBufferedPageContext = function(url, canonicalUrl, search, path, title, referrer) {
    return {
        __t: BufferedPageContextDiscriminant,
        c: canonicalUrl,
        p: path,
        u: url,
        s: search,
        t: title,
        r: referrer
    };
};
var BUFFERED_PAGE_CONTEXT_KEYS = Object.keys(createBufferedPageContext("", "", "", "", "", ""));
function isBufferedPageContext(bufferedPageCtx) {
    if (!isPlainObject(bufferedPageCtx)) return false;
    if (bufferedPageCtx.__t !== BufferedPageContextDiscriminant) return false;
    for(var k in bufferedPageCtx){
        if (!BUFFERED_PAGE_CONTEXT_KEYS.includes(k)) {
            return false;
        }
    }
    return true;
}
var createCanonicalURL = function(canonicalUrl, searchParams) {
    return canonicalUrl.indexOf("?") > -1 ? canonicalUrl : canonicalUrl + searchParams;
};
var removeHash = function(href) {
    var hashIdx = href.indexOf("#");
    return hashIdx === -1 ? href : href.slice(0, hashIdx);
};
var parseCanonicalPath = function(canonicalUrl) {
    try {
        return new URL(canonicalUrl).pathname;
    } catch (_e) {
        return canonicalUrl[0] === "/" ? canonicalUrl : "/" + canonicalUrl;
    }
};
var createPageContext = function(param) {
    var canonicalUrl = param.c, pathname = param.p, search = param.s, url = param.u, referrer = param.r, title = param.t;
    var newPath = canonicalUrl ? parseCanonicalPath(canonicalUrl) : pathname;
    var newUrl = canonicalUrl ? createCanonicalURL(canonicalUrl, search) : removeHash(url);
    return {
        path: newPath,
        referrer: referrer,
        search: search,
        title: title,
        url: newUrl
    };
};
var getDefaultBufferedPageContext = function() {
    var c = document.querySelector("link[rel='canonical']");
    return createBufferedPageContext(location.href, c && c.getAttribute("href") || void 0, location.search, location.pathname, document.title, document.referrer);
};
var getDefaultPageContext = function() {
    return createPageContext(getDefaultBufferedPageContext());
};



/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".conversion-analytics.build.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "@segment/analytics-next:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 		
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"conversion-analytics.build": 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = (chunkId, promises) => {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(true) { // all chunks have JS
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = (event) => {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 		
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunk_segment_analytics_next"] = self["webpackChunk_segment_analytics_next"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!*********************************************!*\
  !*** ./src/conversion-sdk/browser-entry.ts ***!
  \*********************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _bootstrap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./bootstrap */ 2720);

void (0,_bootstrap__WEBPACK_IMPORTED_MODULE_0__.bootstrapConversionAnalyticsFromWindow)();

})();

/******/ })()
;
//# sourceMappingURL=conversion-analytics.build.js.map