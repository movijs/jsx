import * as t from '@babel/types';
import * as babel from '@babel/core';
import babelParser from '@babel/plugin-syntax-jsx';
import htmlTags from 'html-tags';
import svgTags from 'svg-tags';

const htmlAttributes = new Map();
htmlAttributes.set('accept', false);
htmlAttributes.set("accept-charset", false);
htmlAttributes.set('accesskey', false);
htmlAttributes.set('action', false);
htmlAttributes.set('align', false);
htmlAttributes.set('allow', false);
htmlAttributes.set('alt', false);
htmlAttributes.set('async', false);
htmlAttributes.set('autocapitalize', false);
htmlAttributes.set('autofocus', false);
htmlAttributes.set('autoplay', false);
htmlAttributes.set('background', false);
htmlAttributes.set('bgcolor', false);
htmlAttributes.set('border', false);
htmlAttributes.set('buffered', false);
htmlAttributes.set('capture', false);
htmlAttributes.set('challenge', false);
htmlAttributes.set('charset', false);
htmlAttributes.set('checked', false);
htmlAttributes.set('cite', false);
htmlAttributes.set('class', false);
htmlAttributes.set('code', false);
htmlAttributes.set('codebase', false);
htmlAttributes.set('color', false);
htmlAttributes.set('cols', false);
htmlAttributes.set('colspan', false);
htmlAttributes.set('content', false);
htmlAttributes.set('contenteditable', false);
htmlAttributes.set('contextmenu', false);
htmlAttributes.set('controls', false);
htmlAttributes.set('coords', false);
htmlAttributes.set('crossorigin', false);
htmlAttributes.set('csp', false);
htmlAttributes.set('data', false);
htmlAttributes.set('data-*', false);
htmlAttributes.set('datetime', false);
htmlAttributes.set('decoding', false);
htmlAttributes.set('default', false);
htmlAttributes.set('defer', false);
htmlAttributes.set('dir', false);
htmlAttributes.set('dirname', false);
htmlAttributes.set('disabled', false);
htmlAttributes.set('download', false);
htmlAttributes.set('draggable', false);
htmlAttributes.set('enctype', false);
htmlAttributes.set('enterkeyhint', false);
htmlAttributes.set('for', false);
htmlAttributes.set('form', false);
htmlAttributes.set('formaction', false);
htmlAttributes.set('formenctype', false);
htmlAttributes.set('formmethod', false);
htmlAttributes.set('formnovalidate', false);
htmlAttributes.set('formtarget', false);
htmlAttributes.set('headers', false);
htmlAttributes.set('height', false);
htmlAttributes.set('hidden', false);
htmlAttributes.set('high', false);
htmlAttributes.set('href', false);
htmlAttributes.set('hreflang', false);
htmlAttributes.set('http-equiv', false);
htmlAttributes.set('icon', false);
htmlAttributes.set('id', false);
htmlAttributes.set('importance', false);
htmlAttributes.set('integrity', false);
htmlAttributes.set('intrinsicsize', false);
htmlAttributes.set('inputmode', false);
htmlAttributes.set('ismap', false);
htmlAttributes.set('itemprop', false);
htmlAttributes.set('keytype', false);
htmlAttributes.set('kind', false);
htmlAttributes.set('label', false);
htmlAttributes.set('lang', false);
htmlAttributes.set('language', false);
htmlAttributes.set('loading', false);
htmlAttributes.set('list', false);
htmlAttributes.set('loop', false);
htmlAttributes.set('low', false);
htmlAttributes.set('manifest', false);
htmlAttributes.set('max', false);
htmlAttributes.set('maxlength', false);
htmlAttributes.set('minlength', false);
htmlAttributes.set('media', false);
htmlAttributes.set('method', false);
htmlAttributes.set('min', false);
htmlAttributes.set('multiple', false);
htmlAttributes.set('muted', false);
htmlAttributes.set('name', false);
htmlAttributes.set('novalidate', false);
htmlAttributes.set('open', false);
htmlAttributes.set('optimum', false);
htmlAttributes.set('pattern', false);
htmlAttributes.set('ping', false);
htmlAttributes.set('placeholder', false);
htmlAttributes.set('poster', false);
htmlAttributes.set('preload', false);
htmlAttributes.set('radiogroup', false);
htmlAttributes.set('readonly', false);
htmlAttributes.set('referrerpolicy', false);
htmlAttributes.set('rel', false);
htmlAttributes.set('required', false);
htmlAttributes.set('reversed', false);
htmlAttributes.set('role', false);
htmlAttributes.set('rows', false);
htmlAttributes.set('rowspan', false);
htmlAttributes.set('sandbox', false);
htmlAttributes.set('scope', false);
htmlAttributes.set('scoped', false);
htmlAttributes.set('selected', false);
htmlAttributes.set('shape', false);
htmlAttributes.set('size', false);
htmlAttributes.set('sizes', false);
htmlAttributes.set('slot', false);
htmlAttributes.set('span', false);
htmlAttributes.set('spellcheck', false);
htmlAttributes.set('src', false);
htmlAttributes.set('srcdoc', false);
htmlAttributes.set('srclang', false);
htmlAttributes.set('srcset', false);
htmlAttributes.set('start', false);
htmlAttributes.set('step', false);
htmlAttributes.set('style', false);
htmlAttributes.set('summary', false);
htmlAttributes.set('tabindex', false);
htmlAttributes.set('target', false);
htmlAttributes.set('title', false);
htmlAttributes.set('translate', false);
htmlAttributes.set('type', false);
htmlAttributes.set('usemap', false);
htmlAttributes.set('value', false);
htmlAttributes.set('width', false);
htmlAttributes.set('wrap', false);
htmlAttributes.set('aria-readonly', true);
htmlAttributes.set('classname', false);

const moviComponent = () => { return "_mc"; };
const moviFragment = () => { return "_mf"; };

const WriteError = (msg, line, path) => {
    throw path.buildCodeFrameError(`[MOVIJS] ${msg} ${line}`);
};
const makeHtmlAttr = (prop, name, value, path) => {
    if (t.isStringLiteral(value) && value !== null) {
        return t.objectProperty(t.stringLiteral(name), value);
    }
    else if (t.isBooleanLiteral(value)) {
        return t.objectProperty(t.stringLiteral(name), value || t.booleanLiteral(true));
    }
    else if (t.isArrowFunctionExpression(value) && value !== null) {
        var el;
        if (t.isBlockStatement(value.body)) {
            el = t.functionExpression(null, value.params, value.body);
        }
        else {
            el = t.functionExpression(null, value.params, t.blockStatement([t.returnStatement(value.body)]));
        }
        return t.objectProperty(t.stringLiteral(name), el);
    }
    else if (t.isFunctionExpression(value)) {
        return t.objectProperty(t.stringLiteral(name), value);
    }
    else {
        if (value != null) {
            if (t.isCallExpression(value) && t.isIdentifier(value.callee)) {
                if (value.callee.name !== 'moviComponent' && value.callee.name !== moviComponent()) {
                    return t.objectProperty(t.stringLiteral(name), value);
                }
            }
            else if (t.isIdentifier(value)) {
                return t.objectProperty(t.stringLiteral(name), value);
                // return t.objectProperty(t.stringLiteral(name), t.arrowFunctionExpression([], value));
            }
            else if (t.isExpression(value)) {
                return t.objectProperty(t.stringLiteral(name), value);
            }
        }
    }
    return null;
};
const mergeHtmlAttributes = (htmlAttrlist) => {
    const htmlProps = [];
    if (htmlAttrlist.length > 0) {
        var totalAttr = [];
        var totalClass = [];
        var totalBindClass = [];
        var totalStringClass = [];
        htmlAttrlist.forEach(attr => {
            if (t.isObjectProperty(attr)) {
                if (t.isStringLiteral(attr.key)) {
                    if (attr.key.value.toLowerCase() === 'class' || attr.key.value.toLowerCase() === 'classname') {
                        if (t.isObjectExpression(attr.value)) {
                            attr.value.properties.forEach(p => {
                                if (t.isObjectProperty(p)) {
                                    if (t.isStringLiteral(p.value)) {
                                        totalStringClass.push(p.key);
                                    }
                                    else if (t.isBooleanLiteral(p.value)) {
                                        totalStringClass.push(p.key);
                                    }
                                    else {
                                        totalClass.push(p);
                                    }
                                }
                            });
                            //totalClass.push(attr.value);
                        }
                        else if (t.isMemberExpression(attr.value) || t.isCallExpression(attr.value)) {
                            totalBindClass.push(attr.value);
                            //totalClass.push(attr.value)
                        }
                        else if (t.isIdentifier(attr.value)) ;
                        else if (t.isStringLiteral(attr.value)) {
                            totalStringClass.push(t.stringLiteral(attr.value.value));
                        }
                        else if (t.isArrayExpression(attr.value)) {
                            attr.value.elements.forEach(element => {
                                if (t.isObjectExpression(element)) {
                                    element.properties.forEach(p => {
                                        if (t.isObjectProperty(p)) {
                                            if (t.isStringLiteral(p.value)) {
                                                totalStringClass.push(p.key);
                                            }
                                            else if (t.isBooleanLiteral(p.value)) {
                                                totalStringClass.push(p.key);
                                            }
                                            else {
                                                totalClass.push(p);
                                            }
                                        }
                                    });
                                    //totalClass.push(attr.value);
                                }
                                else if (t.isStringLiteral(element)) {
                                    totalStringClass.push(element);
                                }
                            });
                        }
                        else if (attr.value !== null) {
                            // totalAttr.push(attr);
                            if (t.isObjectExpression(attr.value)) ;
                            //var paramVal = t.objectExpression([attr]);
                            //htmlProps.push(t.expressionStatement(t.callExpression(id('this.class.add'),[attr])));
                            //htmlProps.push(t.memberExpression())
                        }
                    }
                    else if (attr.key.value.toLowerCase() === 'style') {
                        if (t.isObjectExpression(attr.value)) {
                            htmlProps.push(t.expressionStatement(t.callExpression(t.identifier('this.style'), [attr.value])));
                        }
                        else if (t.isStringLiteral(attr.value)) {
                            htmlProps.push(t.expressionStatement(t.callExpression(t.identifier('this.style'), [attr.value])));
                        }
                        else if (t.isExpression(attr.value)) {
                            htmlProps.push(t.expressionStatement(t.callExpression(t.identifier('this.style'), [attr.value])));
                        }
                    }
                    else {
                        totalAttr.push(attr);
                        if (t.isObjectProperty(attr)) {
                            if (t.isMemberExpression(attr.value) || t.isArrowFunctionExpression(attr.value)) ;
                            else if (t.isStringLiteral(attr)) ;
                        }
                        else if (t.isStringLiteral(attr)) ;
                    }
                }
            }
        });
        if (totalAttr.length > 0) {
            htmlProps.push(t.expressionStatement(t.callExpression(t.identifier('this.attr.add'), [t.objectExpression(totalAttr)])));
        }
        if (totalBindClass.length > 0) {
            htmlProps.push(t.expressionStatement(t.callExpression(t.identifier('this.class.add'), [...totalBindClass])));
        }
        if (totalClass.length > 0) {
            htmlProps.push(t.expressionStatement(t.callExpression(t.identifier('this.class.add'), [t.objectExpression(totalClass)])));
        }
        if (totalStringClass.length > 0) {
            htmlProps.push(t.expressionStatement(t.callExpression(t.identifier('this.class.add'), [...totalStringClass])));
        }
    }
    return htmlProps;
};
const makeHtmlEvents = (prop, name, value, path) => {
    var _a, _b;
    if (!t.isStringLiteral(value) && !t.isBooleanLiteral(value) && value !== null) {
        if (t.isArrowFunctionExpression(value)) {
            var el;
            if (t.isBlockStatement(value.body)) {
                el = t.functionExpression(null, value.params, value.body);
            }
            else {
                el = t.functionExpression(null, value.params, t.blockStatement([t.returnStatement(value.body)]));
            }
            var evName = name.toLowerCase().replace("on", '').replace('doubleclick', 'dblclick');
            return t.callExpression(t.identifier("this.addHandler"), [t.stringLiteral(evName), el]);
        }
        else {
            if (t.isExpression(value)) {
                var evName = name.toLowerCase().replace("on", '').replace('doubleclick', 'dblclick');
                return t.callExpression(t.identifier("this.addHandler"), [t.stringLiteral(evName), value]);
            }
        }
    }
    else {
        if (t.isJSXAttribute(prop)) {
            WriteError(`html events is not allowed using string or boolean.`, `[${(_a = prop.parent.loc) === null || _a === void 0 ? void 0 : _a.end.line}]${name}:${value}`, path);
        }
        else {
            WriteError(`html events is not allowed using string or boolean.`, `[${(_b = prop.parent.loc) === null || _b === void 0 ? void 0 : _b.end.line}]${name}:${value}`, path);
        }
    }
    return null;
};
const makeComponentTraps = (prop, name, value, path) => {
    if (t.isFunctionExpression(value) ||
        t.isArrowFunctionExpression(value) && value !== null ||
        t.isObjectExpression(value) ||
        t.isMemberExpression(value) ||
        t.isObjectMethod(value) ||
        t.isIdentifier(value)) {
        if (t.isArrowFunctionExpression(value)) {
            var el;
            if (t.isBlockStatement(value.body)) {
                el = t.functionExpression(null, value.params, value.body);
            }
            else {
                el = t.functionExpression(null, value.params, t.blockStatement([t.expressionStatement(value.body)]));
            }
            return t.objectProperty(t.identifier(name), el);
        }
        else {
            if (t.isExpression(value)) {
                return t.objectProperty(t.identifier(name), value);
            }
            return null;
        }
    }
    else {
        if (t.isJSXAttribute(prop)) {
            WriteError(`component traps support only function or object type declaration. failed trap name "${name}"`, ``, path);
        }
        else {
            WriteError(`component traps support only function or object type declaration. failed trap name "${name}"`, ``, path);
        }
        return null;
    }
};
const directiveNames = new Set(['wait', 'reload', 'model', 'text', 'html', 'value', 'display', 'effect', 'loop', 'focus']);
const makeDirectives = (prop, name, value, path) => {
    var result = null;
    if (value != null) {
        var clearedName = name.toLowerCase().replace("x:", "").replace("x-", "").replace("on:", "");
        var callerName = `this.bind.${clearedName}`;
        if (directiveNames.has(clearedName)) {
            if (clearedName !== 'loop' && clearedName !== 'wait') {
                if (t.isFunctionExpression(value) ||
                    t.isArrowFunctionExpression(value) && value !== null ||
                    t.isObjectExpression(value) ||
                    t.isMemberExpression(value) ||
                    t.isObjectMethod(value) ||
                    t.isIdentifier(value) ||
                    t.isCallExpression(value) && value !== null) {
                    if (t.isFunctionExpression(value)) {
                        result = t.expressionStatement(t.callExpression(t.identifier(callerName), [value]));
                    }
                    else if (t.isArrowFunctionExpression(value)) {
                        var el;
                        if (t.isBlockStatement(value.body)) {
                            var kx = t.functionExpression(null, [], value.body);
                            el = t.expressionStatement(t.callExpression(t.identifier(callerName), [kx]));
                        }
                        else {
                            if (t.isStringLiteral(value.body)) {
                                var rtrn = t.returnStatement(value.body);
                                var kx = t.functionExpression(null, [], t.blockStatement([rtrn]));
                                el = t.expressionStatement(t.callExpression(t.identifier(callerName), [kx]));
                            }
                            else {
                                var mx = t.binaryExpression('===', t.unaryExpression('typeof', value.body), t.stringLiteral('function'));
                                var rtrn = t.returnStatement(t.conditionalExpression(mx, t.callExpression(value.body, []), value.body));
                                var kx = t.functionExpression(null, [], t.blockStatement([rtrn]));
                                el = t.expressionStatement(t.callExpression(t.identifier(callerName), [kx]));
                            }
                            //el = t.functionExpression(null, value.params, t.blockStatement([t.returnStatement(value.body)]));
                        }
                        result = el; //t.expressionStatement(t.callExpression(id('this.bind.text'), [el]));
                        // result = t.expressionStatement(t.callExpression(id(callerName), [value]));
                    }
                    else {
                        if (t.isExpression(value)) {
                            var mx = t.binaryExpression('===', t.unaryExpression('typeof', value), t.stringLiteral('function'));
                            var rtrn = t.returnStatement(t.conditionalExpression(mx, t.callExpression(value, []), value));
                            var kx = t.functionExpression(null, [], t.blockStatement([rtrn]));
                            result = t.expressionStatement(t.callExpression(t.identifier(callerName), [kx]));
                        }
                    }
                }
                else if (t.isBinaryExpression(value)) {
                    var re = t.returnStatement(value);
                    var els = t.functionExpression(null, [], t.blockStatement([re]));
                    result = t.expressionStatement(t.callExpression(t.identifier(callerName), [els]));
                }
                else {
                    WriteError(`component directives support only function or object type declaration. failed directive name "${name}"`, ``, path);
                }
            }
        }
        else {
            var sdir = [];
            directiveNames.forEach(x => sdir.push(x));
            WriteError(`directive "${clearedName}" is not supported.
            Supported directives:${JSON.stringify(sdir)}
            https://movijs.com/directives`, ``, path);
        }
    }
    return result;
};
const makePreDirectives = (prop, name, value, path) => {
    var result = null;
    if (value != null) {
        var clearedName = name.toLowerCase().replace("x:", "").replace("x-", "").replace("on:", "");
        var callerName = `this.bind.${clearedName}`;
        if (directiveNames.has(clearedName)) {
            if (clearedName === 'loop') ;
            else if (clearedName === 'wait' && t.isExpression(value)) {
                result = t.expressionStatement(t.callExpression(t.identifier(callerName), [value]));
            }
        }
        else {
            var sdir = [];
            directiveNames.forEach(x => sdir.push(x));
            WriteError(`predirective "${clearedName}" is not supported.
            Supported directives:${JSON.stringify(sdir)}
            https://movijs.com/directives`, ``, path);
        }
    }
    return result;
};

const FRAGMENT = 'Fragment';
const componentEvents = new Set(['oncreating', 'onconfig', 'oncreated', 'onbuilding', 'onbuilded', 'ondisposing', 'ondisposed']);
function isComponentEvent(name) {
    return componentEvents.has(name);
}
function isContextHandler(name) {
    return name.toLowerCase().startsWith("on-") || name.toLowerCase().startsWith("on:") || name.toLowerCase().startsWith("on_");
}
function isDirective(name) {
    return name.toLowerCase().startsWith("x-") || name.toLowerCase().startsWith("x:");
}
function startAttr(v) {
    if (v.startsWith("data-") || v.startsWith('aria-')) {
        return true;
    }
    return false;
}
const getAttributeName = (path) => {
    const nameNode = path.node.name;
    if (t.isJSXIdentifier(nameNode)) {
        return nameNode.name;
    }
    return `${nameNode.namespace.name}:${nameNode.name.name}`;
};
const getAttributeValue = (path, state) => {
    const valuePath = path.get('value');
    if (valuePath.isJSXElement()) {
        return ParseComponent(valuePath);
    }
    if (valuePath.isStringLiteral()) {
        return valuePath.node;
    }
    if (valuePath.isJSXExpressionContainer()) {
        return transformJSXExpressionContainer(valuePath);
    }
    return null;
};
const transformJSXText = (path) => {
    const { node } = path;
    const lines = node.value.split(/\r\n|\n|\r/);
    let lastNonEmptyLine = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/[^ \t]/)) {
            lastNonEmptyLine = i;
        }
    }
    let str = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isFirstLine = i === 0;
        const isLastLine = i === lines.length - 1;
        const isLastNonEmptyLine = i === lastNonEmptyLine;
        let trimmedLine = line.replace(/\t/g, ' ');
        if (!isFirstLine) {
            trimmedLine = trimmedLine.replace(/^[ ]+/, '');
        }
        if (!isLastLine) {
            trimmedLine = trimmedLine.replace(/[ ]+$/, '');
        }
        if (trimmedLine) {
            if (!isLastNonEmptyLine) {
                trimmedLine += ' ';
            }
            str += trimmedLine;
        }
    }
    return str !== '' ? t.stringLiteral(str) : null;
};
const transformJSXMemberExpression = (path) => {
    const objectPath = path.node.object;
    const propertyPath = path.node.property;
    var transformedObject;
    if (t.isJSXMemberExpression(objectPath)) {
        transformedObject = transformJSXMemberExpression(path.get('object'));
    }
    else if (t.isJSXIdentifier(objectPath)) {
        transformedObject = t.identifier(objectPath.name);
    }
    else {
        transformedObject = t.nullLiteral();
    }
    const transformedProperty = t.identifier(propertyPath.name);
    return t.memberExpression(transformedObject, transformedProperty);
};
const transformJSXExpressionContainer = (path) => {
    return path.get('expression').node;
};
const setParentScope = (path, name, slotFlag) => {
    if (path.scope.hasBinding(name) && path.parentPath) {
        if (t.isJSXElement(path.parentPath.node)) {
            path.parentPath.setData('setParentScope', slotFlag);
        }
        setParentScope(path.parentPath, name, slotFlag);
    }
};
const getTag = (path) => {
    const namePath = path.get('openingElement').get('name');
    if (namePath.isJSXIdentifier()) {
        const { name } = namePath.node;
        if (!htmlTags.includes(name) && !svgTags.includes(name)) {
            if (name === FRAGMENT) {
                return t.identifier(FRAGMENT);
            }
            else if (path.scope.hasBinding(name)) {
                return t.identifier(name);
            }
            else {
                return t.identifier(name);
                //return t.callExpression(t.identifier('moviComponent'), [t.stringLiteral(name)])
            }
        }
        else if (htmlTags.includes(name)) {
            t.stringLiteral(name + 'isHTML');
            // return  t.callExpression(t.identifier('moviComponent'), [t.stringLiteral(name)]);
        }
        return t.stringLiteral(name);
    }
    else if (namePath.isJSXMemberExpression()) {
        return transformJSXMemberExpression(namePath);
    }
    throw new Error(`getTag: ${namePath.type} is not supported`);
};
const getProps = (props, path, state) => {
    const objectProps = [];
    const objectExpression = [];
    const eventProps = [];
    const directives = [];
    const preDirectives = [];
    const componentEvents = [];
    let htmlAttrlist = [];
    if (props.length > 0) {
        props.forEach(prop => {
            if (prop.isJSXAttribute()) {
                let name = getAttributeName(prop);
                let value = getAttributeValue(prop);
                if (isComponentEvent(name.toLowerCase())) {
                    if (value != null) {
                        var ce = makeComponentTraps(prop, name, value, path);
                        if (ce !== null) {
                            componentEvents.push(ce);
                        }
                    }
                }
                else if (isContextHandler(name.toLowerCase()) && value != null) {
                    var newName = "";
                    if (name.toLowerCase().startsWith('on:')) {
                        newName = name.split(':')[1];
                    }
                    else if (name.toLowerCase().startsWith('on-')) {
                        newName = name.split('-')[1];
                    }
                    else if (name.toLowerCase().startsWith('on_')) {
                        newName = name.split('_')[1];
                    }
                    if (t.isFunctionExpression(value) || t.isArrowFunctionExpression(value)) {
                        var expre = t.functionExpression(null, [id('...args')], t.blockStatement([t.expressionStatement(t.callExpression(value, [id('_self'), id('args')]))]));
                        directives.push(t.expressionStatement(t.callExpression(id('this.on'), [t.stringLiteral(newName), expre])));
                    }
                    else {
                        var expre = t.functionExpression(null, [id('...args')], t.blockStatement([t.expressionStatement(t.callExpression(value, [id('_self'), id('args')]))]));
                        directives.push(t.expressionStatement(t.callExpression(id('this.on'), [t.stringLiteral(newName), expre])));
                    }
                }
                else if (isDirective(name.toLowerCase())) {
                    if (value != null) {
                        var clearedName = name.toLowerCase().replace("x:", "").replace("x-", "").replace("on:", "");
                        if (clearedName !== 'wait' && clearedName !== 'loop') {
                            var directive = makeDirectives(prop, name, value, path);
                            if (directive != null) {
                                directives.push(directive);
                            }
                        }
                        else {
                            var directive = makePreDirectives(prop, name, value, path);
                            if (directive != null) {
                                preDirectives.push(directive);
                            }
                        }
                    }
                }
                else if (htmlAttributes.has(name.toLowerCase()) || startAttr(name.toLowerCase())) {
                    if (value !== null) {
                        var atr = makeHtmlAttr(prop, name, value);
                        if (atr !== null) {
                            htmlAttrlist.push(atr);
                        }
                    }
                }
                else if (name.toLowerCase().startsWith("on")) {
                    if (value != null) {
                        var evp = makeHtmlEvents(prop, name, value, path);
                        if (evp !== null) {
                            eventProps.push(t.expressionStatement(evp));
                        }
                    }
                }
                else if (!name.startsWith("x")) {
                    if (value != null) {
                        if (t.isExpression(value)) {
                            objectExpression.push(t.objectProperty(id(name), value));
                        }
                        else {
                            objectProps.push(value);
                        }
                    }
                    //console.warn('isObj C', prop)
                }
            }
        });
    }
    const htmlProps = mergeHtmlAttributes(htmlAttrlist);
    return { htmlProps, eventProps, objectExpression, objectProps, componentEvents, directives, preDirectives };
};
const getChildren = (paths, state) => {
    return paths.map((path) => {
        if (path.isJSXText()) {
            const transformedText = transformJSXText(path);
            if (transformedText) {
                return mkText(transformedText);
                //return t.callExpression(id('moviText'), [transformedText]);
            }
            return transformedText;
        }
        if (path.isJSXExpressionContainer()) {
            const expression = transformJSXExpressionContainer(path);
            if (t.isIdentifier(expression)) {
                const { name } = expression;
                const { referencePaths = [] } = path.scope.getBinding(name) || {};
                referencePaths.forEach((referencePath) => {
                    setParentScope(referencePath, name, 'DYNAMIC');
                });
            }
            if (t.isIdentifier(expression)) {
                return mkText(expression);
            }
            if (t.isMemberExpression(expression)) {
                return mkText(expression);
            }
            if (t.isFunctionExpression(expression)) {
                return expression;
            }
            if (t.isCallExpression(expression)) {
                if (t.isCallExpression(expression)) {
                    var b = expression.arguments;
                    if (t.isMemberExpression(expression.callee)) {
                        if (t.isIdentifier(expression.callee.property)) {
                            if (expression.callee.property.name === 'map' || expression.callee.property.name === 'forEach') {
                                return t.callExpression(id('this.repeater'), [t.arrowFunctionExpression([], t.blockStatement([t.returnStatement(expression.callee.object)])), ...b]);
                            }
                        }
                    }
                }
                if (t.isMemberExpression(expression.callee)) {
                    return mkText(expression);
                }
            }
            // if (t.isLogicalExpression(expression)) { 
            //     return mkText(expression);
            //     //return  t.callExpression(id('moviLogic'),[expression.left,expression.right])
            // }
            if (t.isStringLiteral(expression)) {
                return mkText(expression);
            }
            return expression;
        }
        if (t.isJSXSpreadChild(path)) ;
        if (path.isCallExpression()) {
            return path.node;
        }
        if (path.isJSXElement()) {
            return ParseComponent(path);
        }
        throw new Error(`getChildren: ${path.type} is not supported`);
    }).filter(((value) => (value !== undefined
        && value !== null
        && !t.isJSXEmptyExpression(value))));
    //return expContainers;
};
function id(name) {
    return t.identifier(name);
}
const mkText = (exp) => {
    var a1;
    if (t.isStringLiteral(exp)) {
        a1 = t.callExpression(id('this.setText'), [exp]);
    }
    else if (t.isObjectExpression(exp) || t.isMemberExpression(exp) || t.isIdentifier(exp)) {
        var mx = t.binaryExpression('===', t.unaryExpression('typeof', exp), t.stringLiteral('function'));
        var result = t.arrowFunctionExpression([], t.conditionalExpression(mx, t.callExpression(exp, []), exp));
        a1 = t.callExpression(id('this.bind.text'), [result]);
    }
    else if (t.isArrowFunctionExpression(exp)) {
        a1 = t.callExpression(id('this.bind.text'), [exp]);
        // if (t.isExpression(exp.body)) {
        //     var a2 = t.functionExpression(null, [], t.blockStatement([t.returnStatement(exp.body)]))
        //     a1 = t.callExpression(id('this.bind.text'), [a2]);
        // } else {
        //     var a2 = t.functionExpression(null, [], exp.body)
        //     a1 = t.callExpression(id('this.bind.text'), [a2]);
        // }
    }
    else if (t.isLogicalExpression(exp)) {
        a1 = t.callExpression(id('this.bind.logic'), [exp.left, exp.right]);
    }
    else {
        a1 = t.callExpression(id('this.bind.text'), [exp]);
    }
    var body = t.objectExpression([t.objectMethod('method', id('setup'), [], t.blockStatement([t.expressionStatement(a1)]))]);
    return t.callExpression(id(moviComponent()), [t.stringLiteral('text'), body]);
};
function ParseComponent(path, state) {
    const props = path.get('openingElement').get('attributes');
    var tag = getTag(path);
    const { htmlProps, eventProps, objectExpression, componentEvents, directives, preDirectives } = getProps(props, path);
    // var tt: (t.Expression | t.ObjectMethod | null)[] = getChildren(path.get('children'));
    const children = getChildren(path.get('children'));
    var setup = [];
    var childs = [];
    children.forEach(exp => {
        if (t.isExpression(exp)) {
            if (exp !== null) {
                if (t.isCallExpression(exp) && t.isIdentifier(exp.callee) && exp.callee.name === 'this.repeater') {
                    directives.push(t.expressionStatement(t.callExpression(id('this.bind.loop'), [exp.arguments[0], exp.arguments[1]])));
                }
                else {
                    childs.push(exp);
                }
            }
            /*
             if (exp !== null && t.isCallExpression(exp) && t.isIdentifier(exp.callee)) {
                if (exp.callee.name === 'this.repeater') {
                    //directives.push(t.expressionStatement(t.callExpression(id('this.bind.loop'), [exp.arguments[0],exp.arguments[1]])))
                }
            } else {
                childs.push(exp);
            }
             */
        }
    });
    let statements = [];
    if (htmlProps.length > 0) {
        htmlProps.forEach(d => {
            statements.push(d);
        });
    }
    if (eventProps.length > 0) {
        eventProps.forEach(d => {
            statements.push(d);
        });
    }
    if (directives.length > 0) {
        directives.forEach(d => {
            statements.push(d);
        });
    }
    var bodyExpression = t.objectExpression([]);
    if (childs.length > 0) {
        childs.forEach(cx => {
            //console.error(cx);
            if (t.isFunctionExpression(cx)) {
                statements.push(t.expressionStatement(t.callExpression(id('this.bind.computed'), [cx])));
            }
            else if (t.isAssignmentExpression(cx)) {
                statements.push(t.expressionStatement(cx));
            }
            else if (t.isLogicalExpression(cx)) {
                var left;
                var right;
                if (t.isFunctionExpression(cx.left) || t.isArrowFunctionExpression(cx.left)) {
                    left = cx.left;
                }
                else {
                    left = t.functionExpression(null, [], t.blockStatement([t.returnStatement(cx.left)]));
                }
                if (t.isFunctionExpression(cx.right) || t.isArrowFunctionExpression(cx.right)) {
                    right = cx.right;
                }
                else {
                    right = t.functionExpression(null, [], t.blockStatement([t.returnStatement(cx.right)]));
                }
                statements.push(t.expressionStatement(t.callExpression(id('this.bind.logic'), [left, right])));
            }
            else {
                if (t.isStringLiteral(tag)) {
                    statements.push(t.expressionStatement(t.callExpression(id('this.add'), [cx])));
                }
                // statements.push( t.expressionStatement(cx));
            }
        });
        // var tts = t.objectProperty(id('slots'), t.arrayExpression(childs));
        // setup.push(t.objectExpression([tts]))
    }
    if (preDirectives.length > 0) {
        let preStatements = [];
        preStatements.push(...preDirectives);
        var preMethod = t.objectMethod('method', id('preConfig'), [], t.blockStatement([...preStatements]));
        bodyExpression.properties.push(preMethod);
    }
    if (t.isStringLiteral(tag)) {
        if (componentEvents.length > 0) {
            bodyExpression.properties.push(...componentEvents);
        }
        if (objectExpression.length > 0) {
            bodyExpression.properties.push(...objectExpression);
        }
        if (statements.length > 0) {
            var setupMethod = t.objectMethod('method', id('setup'), [], t.blockStatement([...statements]));
            bodyExpression.properties.push(setupMethod);
        }
    }
    else {
        var tts = t.objectProperty(id('slots'), t.arrayExpression(childs));
        if (objectExpression.length > 0) {
            bodyExpression.properties.push(...objectExpression);
        }
        var takedown = t.objectExpression([]);
        if (statements.length > 0) {
            var setupMethod = t.objectMethod('method', id('setup'), [], t.blockStatement([...statements]));
            takedown.properties.push(setupMethod);
        }
        if (componentEvents.length > 0) {
            takedown.properties.push(...componentEvents);
            //bodyExpression.properties.push(exp);
        }
        var exp = t.objectProperty(id('intervention'), takedown);
        bodyExpression.properties.push(exp);
        bodyExpression.properties.push(tts);
    }
    setup.push(bodyExpression);
    if (t.isStringLiteral(tag)) {
        return t.callExpression(t.identifier(moviComponent()), [tag, ...setup]);
    }
    else {
        return t.callExpression(t.identifier(moviComponent()), [tag, ...setup]);
    }
}
function ParseFrament(path, state) {
    const children = getChildren(path.get('children'));
    var childs = [];
    children.forEach(exp => {
        if (t.isExpression(exp)) {
            childs.push(exp);
            // if (t.isCallExpression(exp) && t.isIdentifier(exp.callee) && exp.callee.name === 'this.repeater') {
            //     childs.push(t.callExpression(id(moviFragment()),[t.callExpression(id('this.bind.loop'), [exp.arguments[0],exp.arguments[1]])]))
            // } else { 
            //     childs.push(exp);
            // }  
        }
    });
    if (!state.get(moviFragment())) {
        state.set(moviFragment(), moviFragment());
    }
    var tts = t.objectProperty(id('nodes'), t.arrayExpression(childs));
    return t.callExpression(t.identifier(moviFragment()), [t.objectExpression([tts])]);
}

//import fs from 'node:fs' 
class Compiler {
    start(code, filename) {
        //var code = fs.readFileSync(filename, 'utf-8') 
        return babel.transformSync(code, {
            sourceType: 'module',
            ast: true,
            plugins: [
                babelParser,
                function () {
                    return {
                        visitor: {
                            JSXElement: {
                                exit(path, state) {
                                    path.replaceWith(ParseComponent(path));
                                }
                            },
                            JSXFragment: {
                                exit(path, state) {
                                    path.replaceWith(ParseFrament(path, state));
                                }
                            },
                            Program: {
                                exit(path, state) {
                                    var spc = [];
                                    spc.push(t.importSpecifier(t.identifier(moviComponent()), t.identifier("moviComponent")));
                                    if (state.get(moviFragment())) {
                                        spc.push(t.importSpecifier(t.identifier(moviFragment()), t.identifier("moviFragment")));
                                    }
                                    path.unshiftContainer('body', t.importDeclaration(spc, t.stringLiteral("movijs")));
                                }
                            }
                        },
                    };
                }
            ]
        });
    }
}

export { Compiler as default };
