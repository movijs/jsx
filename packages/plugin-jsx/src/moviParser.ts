import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import htmlTags from 'html-tags';
import { htmlAttributes, htmlEvents } from './htmlAtributes';
import svgTags from 'svg-tags';
import { findIfStatements, makeComponentTraps, makeDirectives, makeHtmlAttr, makeHtmlEvents, makePreDirectives, mergeHtmlAttributes, returnIfStatement } from './propBuilder';
import { moviComponent, moviFragment, State } from './constants';
export const JSX_HELPER_KEY = 'JSX_HELPER_KEY';
export const FRAGMENT = 'Fragment';
export const KEEP_ALIVE = 'KeepAlive';


const componentEvents = new Set(['oncreating', 'onconfig', 'oncreated', 'onbuilding', 'onbuilded', 'ondisposing', 'ondisposed']);
function isComponentEvent(name: string): boolean {
    return componentEvents.has(name);
}
function isContextHandler(name: string) {
    return name.toLowerCase().startsWith("on-") || name.toLowerCase().startsWith("on:") || name.toLowerCase().startsWith("on_");
}

function isDirective(name: string) {
    return name.toLowerCase().startsWith("x-") || name.toLowerCase().startsWith("x:");
}


function startAttr(v: string) {
    if (v.startsWith("data-") || v.startsWith('aria-')) {
        return true;
    }
    return false;
}

export const getAttributeName = (path: NodePath<t.JSXAttribute>): string => {
    const nameNode = path.node.name;
    if (t.isJSXIdentifier(nameNode)) {
        return nameNode.name;
    }
    return `${nameNode.namespace.name}:${nameNode.name.name}`;
};

export const getAttributeValue = (path: NodePath<t.JSXAttribute>, state: State): (
    t.StringLiteral | t.Expression | t.CallExpression | t.ObjectMethod | null
) => {
    const valuePath = path.get('value');
    if (valuePath.isJSXElement()) {
        return ParseComponent(valuePath, state);
    }

    if (valuePath.isStringLiteral()) {
        return valuePath.node;
    }
    if (valuePath.isJSXExpressionContainer()) {
        return transformJSXExpressionContainer(valuePath);
    }

    return null;
};

export const transformJSXText = (path: NodePath<t.JSXText>): t.StringLiteral | null => {
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

export const transformJSXMemberExpression = (path: NodePath<t.JSXMemberExpression>,): t.MemberExpression => {
    const objectPath = path.node.object;
    const propertyPath = path.node.property;
    var transformedObject;
    if (t.isJSXMemberExpression(objectPath)) {
        transformedObject = transformJSXMemberExpression(path.get('object') as NodePath<t.JSXMemberExpression>);
    } else if (t.isJSXIdentifier(objectPath)) {
        transformedObject = t.identifier(objectPath.name)
    } else {
        transformedObject = t.nullLiteral();
    }
    const transformedProperty = t.identifier(propertyPath.name);
    return t.memberExpression(transformedObject, transformedProperty);
};

export const transformJSXExpressionContainer = (path: NodePath<t.JSXExpressionContainer>): t.Expression => {
    return path.get('expression').node as t.Expression;
}
export const getJSXExpressionContainer = (path: NodePath<t.JSXExpressionContainer>): t.Expression | t.JSXEmptyExpression => {
    return path.get('expression').node;
}

export const setParentScope = (path: NodePath, name: string, slotFlag: string): void => {
    if (path.scope.hasBinding(name) && path.parentPath) {
        if (t.isJSXElement(path.parentPath.node)) {
            path.parentPath.setData('setParentScope', slotFlag);
        }
        setParentScope(path.parentPath, name, slotFlag);
    }
};

export const getTag = (
    path: NodePath<t.JSXElement>): t.Identifier | t.CallExpression | t.StringLiteral | t.MemberExpression => {
    const namePath = path.get('openingElement').get('name');
    if (namePath.isJSXIdentifier()) {
        const { name } = namePath.node;

        if (!htmlTags.includes(name as htmlTags.htmlTags) && !svgTags.includes(name) && name !== 'center') {
            if (name === FRAGMENT) {
                return t.identifier(FRAGMENT);
            }
            else if (path.scope.hasBinding(name)) {
                return t.identifier(name);
            } else {
                return t.identifier(name); 
            }

        } else if (htmlTags.includes(name as htmlTags.htmlTags) || name == 'center') {
            t.stringLiteral(name + 'isHTML'); 
        }

        return t.stringLiteral(name);
    }
    else if (namePath.isJSXMemberExpression()) {
        return transformJSXMemberExpression(namePath);
    }
    throw new Error(`getTag: ${namePath.type} is not supported`);
};

export const isSvg = (
    path: NodePath<t.JSXElement>): boolean => {
    const namePath = path.get('openingElement').get('name');
    if (namePath.isJSXIdentifier()) {
        const { name } = namePath.node;
        if (svgTags.includes(name)) {
            return true
        }
        return false;
    }
    else if (namePath.isJSXMemberExpression()) {
        return false;
    }
    return false;
};

const getProps = (props: NodePath<t.JSXAttribute | t.JSXSpreadAttribute>[], path: NodePath<t.JSXElement>, state: State) => {

    const objectProps: t.ObjectMethod[] = [];
    const objectExpression: t.ObjectProperty[] = [];
    const eventProps: t.ExpressionStatement[] = [];
    const directives: t.ExpressionStatement[] = [];
    const preDirectives: t.ExpressionStatement[] = [];
    const componentEvents: t.ObjectProperty[] = [];
    let htmlAttrlist: t.ObjectProperty[] = [];
    const thisStatement: t.VariableDeclaration[] = [];
    if (props.length > 0) {
        props.forEach(prop => {
            if (prop.isJSXAttribute()) {
                let name = getAttributeName(prop);
                let value = getAttributeValue(prop, state);




                if (isComponentEvent(name.toLowerCase())) {
                    if (value != null) {
                        var ce = makeComponentTraps(prop, name, value, path);
                        if (ce !== null) {
                            componentEvents.push(ce)
                        }
                    }
                } else if (isContextHandler(name.toLowerCase()) && value != null) {
                    var newName = "";
                    if (name.toLowerCase().startsWith('on:')) {
                        newName = name.split(':')[1];
                    } else if (name.toLowerCase().startsWith('on-')) {
                        newName = name.split('-')[1];
                    } else if (name.toLowerCase().startsWith('on_')) {
                        newName = name.split('_')[1];
                    }

                    if (t.isFunctionExpression(value) || t.isArrowFunctionExpression(value)) {

                        var expre = t.functionExpression(null, [id('...args')], t.blockStatement([t.expressionStatement(t.callExpression(value, [id('sender'), id('args')]))]));
                        //thisStatement.push(t.variableDeclaration('const', [t.variableDeclarator(t.identifier('_self'), t.identifier('this'))]));
                        directives.push(t.expressionStatement(t.callExpression(id('sender.on'), [t.stringLiteral(newName), expre])));
                    } else {
                        // thisStatement.push(t.variableDeclaration('const', [t.variableDeclarator(t.identifier('_self'), t.identifier('this'))]));
                        var expre = t.functionExpression(null, [id('...args')], t.blockStatement([t.expressionStatement(t.callExpression(value as any, [id('sender'), id('args')]))]));
                        directives.push(t.expressionStatement(t.callExpression(id('sender.on'), [t.stringLiteral(newName), expre])));
                    }
                } else if (isDirective(name.toLowerCase())) {
                    if (value != null) {
                        var clearedName = name.toLowerCase().replace("x:", "").replace("x-", "").replace("on:", "");
                        if (['wait', 'reload', 'model', 'bind', 'text', 'html', 'value', 'display', 'effect', 'watch', 'to', 'loop', 'focus', 'interrupt'].includes(clearedName)) {
                            if (clearedName !== 'wait' && clearedName !== 'loop' && clearedName !== 'interrupt') {
                                var directive = makeDirectives(prop, name, value, path, state);
                                if (directive != null) {
                                    directives.push(directive)
                                }
                            } else if (clearedName === 'loop') {
                                var directive = makeDirectives(prop, name, value, path, state);
                                if (directive != null) {
                                    directives.push(directive)
                                }
                            } else {
                                var directive = makePreDirectives(prop, name, value, path);
                                if (directive != null) {
                                    preDirectives.push(directive)
                                }
                            }
                        } else {
                            if (t.isExpression(value)) {
                                objectExpression.push(t.objectProperty(id(clearedName), value))
                            } else {
                                objectProps.push(value)
                            }
                        }
                    }
                } else if (htmlAttributes.has(name) || startAttr(name)) {
                 
                    var isComponent = false;
                    if (t.isJSXElement(path.node)) {
                        var args = (<t.JSXIdentifier>(<t.JSXElement>path.node).openingElement.name).name;
                        const val = args;
                        if (val[0].toUpperCase() === val[0]) {
                            isComponent = true;
                        }
                    }

                    if (isComponent) {
                        if (value != null) {
                            if (t.isExpression(value)) {
                                objectExpression.push(t.objectProperty(id(name), value))

                            } else {
                                objectProps.push(value)
                            }
                        }
                    }
                    else if (value !== null) {
                        var atr = makeHtmlAttr(prop, name, value, path);
                        if (atr !== null) {
                            htmlAttrlist.push(atr);
                        }
                    } else {
                        var atr = makeHtmlAttr(prop, name, t.booleanLiteral(true), path);
                        if (atr !== null) {
                            htmlAttrlist.push(atr);
                        }
                    }
                } else if (name.toLowerCase().startsWith("on") && htmlEvents.has(name.toLowerCase())) {
                    if (value != null) {
                        var evp = makeHtmlEvents(prop, name, value, path);
                        if (evp !== null) {
                            eventProps.push(t.expressionStatement(evp));
                        }
                    }
                } else if (!name.startsWith("x")) {
                    if (value != null) {
                        if (t.isExpression(value)) {
                            objectExpression.push(t.objectProperty(id(name), value))

                        } else {
                            objectProps.push(value)
                        }

                    } else {
                        // objectProps.push(t.objectProperty(id(name), t.nullLiteral()))
                    }

                    //console.warn('isObj C', prop)
                }
            }
        });
    }

    const htmlProps: t.ExpressionStatement[] = mergeHtmlAttributes(htmlAttrlist);


    return { htmlProps, eventProps, objectExpression, objectProps, componentEvents, directives, preDirectives, thisStatement }
};


export const getChildren = (
    paths: NodePath<t.JSXText | t.JSXExpressionContainer | t.JSXSpreadChild | t.JSXElement | t.JSXFragment>[]
    , state: State) => {

    return paths.map((path) => {
        if (path.isJSXText()) {
            const transformedText = transformJSXText(path);
            if (transformedText) {
                return mkText(transformedText)
                //return t.callExpression(id('moviText'), [transformedText]);
            }
            return transformedText;
        }

        if (path.isJSXExpressionContainer()) {
            const expression = transformJSXExpressionContainer(path);

            // if (t.isArrayExpression(expression)) { 
            //     if (expression.elements.length === 2) { 
            //         return t.functionExpression(t.identifier('fnc'), [t.identifier('asdsad')], t.blockStatement([]));
            //     } 
            // }
            if (t.isIdentifier(expression)) {
                const { name } = expression;
                const { referencePaths = [] } = path.scope.getBinding(name) || {};
                referencePaths.forEach((referencePath) => {
                    setParentScope(referencePath, name, 'DYNAMIC');
                });
            }
            if (t.isIdentifier(expression)) {
                return mkText(expression)
            }

            if (t.isBinaryExpression(expression)) {
                return mkText(expression)
            }

            if (t.isMemberExpression(expression)) {
                return mkText(expression)
            }
            if (t.isFunctionExpression(expression)) {
                return expression
            }
            if (t.isCallExpression(expression)) {

                if (t.isCallExpression(expression)) {
                    var b = expression.arguments;
                    if (t.isMemberExpression(expression.callee)) {
                        if (t.isIdentifier(expression.callee.property)) {
                            if (expression.callee.property.name === 'map' || expression.callee.property.name === 'forEach') {
                                // console.warn('expression.callee.object', expression.callee.object);

                                // var mx = t.binaryExpression('!==', expression.callee.object, t.nullLiteral()); 
                                // t.ifStatement(mx,t.nullLiteral())
                                state.set('loop-waiter', expression.callee.object);
                                return t.callExpression(id('sender.repeater'), [expression.callee.object, ...b]);
                            }
                        }
                    }
                }

                if (t.isMemberExpression(expression.callee)) {
                    return mkText(expression)
                }
            }

            // if (t.isLogicalExpression(expression)) { 
            //     return mkText(expression);
            //     //return  t.callExpression(id('moviLogic'),[expression.left,expression.right])
            // }

            if (t.isStringLiteral(expression)) {
                return mkText(expression)
            }


            return expression;
        }

        if (t.isJSXSpreadChild(path.node)) {
            //return transformJSXSpreadChild(path as NodePath<t.JSXSpreadChild>);
        }
        if (path.isCallExpression()) {
            return (path as NodePath<t.CallExpression>).node;
        }
        if (path.isJSXElement()) {
            return ParseComponent(path, state);
        }

        throw new Error(`getChildren: ${path.type} is not supported`);
    }).filter(((value: any) => (
        value !== undefined
        && value !== null
        && !t.isJSXEmptyExpression(value)
    )) as any);

    //return expContainers;
}

function id(name: string): t.Identifier {
    return t.identifier(name);
}

const mkText = (exp: t.Expression) => {
    var a1: t.CallExpression;


    if (t.isStringLiteral(exp)) {
        a1 = t.callExpression(id('sender.setText'), [exp]);
    } else if (t.isObjectExpression(exp) || t.isMemberExpression(exp) || t.isIdentifier(exp)) {
        var ifStatement = findIfStatements(exp);
        var mx = t.binaryExpression('===', t.unaryExpression('typeof', exp), t.stringLiteral('function'));
        var rtrn = t.returnStatement(t.conditionalExpression(mx, t.callExpression(exp, []), t.arrowFunctionExpression([], exp)));
        var rtrns = t.ifStatement(ifStatement!, t.blockStatement([rtrn]));
        var kx = t.arrowFunctionExpression([], t.blockStatement([rtrns]));

        //var mx = t.binaryExpression('===', t.unaryExpression('typeof', exp), t.stringLiteral('function'));
        //var result = kx; //t.arrowFunctionExpression([], t.conditionalExpression(kx, t.callExpression(exp, []), exp));

        a1 = t.callExpression(id('sender.bind.text'), [kx]);
    } else if (t.isArrowFunctionExpression(exp)) {

        var ifStatement = findIfStatements(exp);
        var mx = t.binaryExpression('===', t.unaryExpression('typeof', exp), t.stringLiteral('function'));
        var rtrn = t.returnStatement(t.conditionalExpression(mx, t.callExpression(exp, []), t.arrowFunctionExpression([], exp)));
        var rtrns = t.ifStatement(ifStatement!, t.blockStatement([rtrn]));
        var kx = t.arrowFunctionExpression([], t.blockStatement([rtrns]));

        a1 = t.callExpression(id('sender.bind.text'), [kx]);


    } else if (t.isLogicalExpression(exp)) {
        var ifStatement = findIfStatements(exp.left);
        var mx = t.binaryExpression('===', t.unaryExpression('typeof', exp.left), t.stringLiteral('function'));
        var rtrn = t.returnStatement(t.conditionalExpression(mx, t.callExpression(exp.left, []), t.arrowFunctionExpression([], exp.left)));
        var rtrns = t.ifStatement(ifStatement!, t.blockStatement([rtrn]));
        var kx = t.arrowFunctionExpression([], t.blockStatement([rtrns]));
        a1 = t.callExpression(id('sender.bind.logic'), [kx, exp.right]);

    } else if (t.isBinaryExpression(exp)) {
        var ifStatement = findIfStatements(exp);

        var mx = t.binaryExpression('===', t.unaryExpression('typeof', exp), t.stringLiteral('function'));
        var rtrn = t.returnStatement(t.conditionalExpression(mx, t.callExpression(exp, []), t.arrowFunctionExpression([], exp)));
        var rtrns = t.ifStatement(ifStatement!, t.blockStatement([rtrn]));
        var kx = t.arrowFunctionExpression([], t.blockStatement([rtrns]));
        a1 = t.callExpression(id('sender.bind.text'), [kx]);
    } else {
        var ifStatement = findIfStatements(exp);
        var mx = t.binaryExpression('===', t.unaryExpression('typeof', exp), t.stringLiteral('function'));
        var rtrn = t.returnStatement(t.conditionalExpression(mx, t.callExpression(exp, []), t.arrowFunctionExpression([], exp)));
        var rtrns = t.ifStatement(ifStatement!, t.blockStatement([rtrn]));
        var kx = t.arrowFunctionExpression([], t.blockStatement([rtrns]));
        a1 = t.callExpression(id('sender.bind.text'), [kx]);
    }

    var arrayBody = t.arrowFunctionExpression([id('sender')], t.blockStatement([t.expressionStatement(a1)]));
    var body = t.objectExpression([t.objectProperty(id('setup'), arrayBody)]);//,t.objectMethod('set', id('setup'), [id('sender')], t.blockStatement([t.expressionStatement(a1)]))])

    return t.callExpression(id(moviComponent()), [t.stringLiteral('text'), body]);
}

var isSvgComponent: boolean = false;

export function ParseComponent(path: NodePath<t.JSXElement>, state: State): t.CallExpression | t.Expression | t.ObjectMethod {

    const props = path.get('openingElement').get('attributes');
    var tag = getTag(path);

    const { htmlProps, eventProps, objectExpression, componentEvents, directives, preDirectives, thisStatement } = getProps(props, path, state)


    // var tt: (t.Expression | t.ObjectMethod | null)[] = getChildren(path.get('children'));

    const children = getChildren(path.get('children'), state);

    var setup: t.Expression[] = [];
    let statements: t.Statement[] = [];
    var childs: t.Expression[] = [];

    if (thisStatement.length > 0) {
        statements.push(thisStatement[0])

    }

    children.forEach(exp => {


        if (t.isExpression(exp)) {

            if (exp !== null) {

                if (t.isCallExpression(exp) && t.isIdentifier(exp.callee) && exp.callee.name === 'sender.repeater') {
                    childs.push(t.callExpression(id('sender.bind.loop'), [returnIfStatement(exp.arguments[0], true, t.arrayExpression()), exp.arguments[1]]));
                } else {
                    childs.push(exp);
                }
            }
        }
    })



    if (htmlProps.length > 0) {
        htmlProps.forEach(d => {
            statements.push(d);
        })
    }

    if (eventProps.length > 0) {
        eventProps.forEach(d => {
            statements.push(d);
        })
    }

    var hasLoop = false;
    if (directives.length > 0) {
        directives.forEach(d => {
            statements.push(d);
        })
    }

    var bodyExpression = t.objectExpression([]);

    var existThis = false;
    if (childs.length > 0) {
        childs.forEach(cx => {

            if (t.isArrayExpression(cx)) {


                var ifStatement = findIfStatements(cx.elements[0] as any);
                var rtrn = t.returnStatement(cx.elements[0] as any);
                var rtrns = t.ifStatement(ifStatement!, t.blockStatement([rtrn]));
                var kx = t.arrowFunctionExpression([], t.blockStatement([rtrns]));

                statements.push(t.expressionStatement(t.callExpression(id('sender.bind.logic'), [kx, cx.elements[1] as any])))
            }
            else
                if (t.isFunctionExpression(cx)) {
                    statements.push(t.expressionStatement(t.callExpression(id('sender.bind.computed'), [cx])))
                } else if (t.isAssignmentExpression(cx)) {
                    statements.push(t.expressionStatement(cx))
                } else if (t.isLogicalExpression(cx)) {
                    var left: t.Expression;
                    var right: t.Expression;
                    if (t.isFunctionExpression(cx.left) || t.isArrowFunctionExpression(cx.left)) {
                        left = cx.left;
                    } else {
                        left = t.functionExpression(null, [], t.blockStatement([t.returnStatement(cx.left)]))
                    }

                    if (t.isFunctionExpression(cx.right) || t.isArrowFunctionExpression(cx.right)) {
                        right = cx.right;
                    } else {
                        right = t.functionExpression(null, [], t.blockStatement([t.returnStatement(cx.right)]))
                    }

                    if (!t.isFunctionExpression(cx.left)) {
                        //cx.right = t.logicalExpression('&&',t.binaryExpression('!==',( cx as t.LogicalExpression).left,t.nullLiteral()),t.binaryExpression('!==',( cx as t.LogicalExpression).left,t.identifier('undefined'))) ; 
                        var ifStatement = findIfStatements(cx.left);
                        var mx = t.binaryExpression('===', t.unaryExpression('typeof', cx.left), t.stringLiteral('function'));
                        var rtrn = t.returnStatement(t.conditionalExpression(mx, t.callExpression(cx.left, []), t.arrowFunctionExpression([], cx.left)));
                        //var rtrn = t.returnStatement(cx.left);
                        var rtrns = t.ifStatement(ifStatement!, t.blockStatement([rtrn]));
                        var kx = t.arrowFunctionExpression([], t.blockStatement([rtrns]));

                        statements.push(t.expressionStatement(t.callExpression(id('sender.bind.logic'), [kx, right])))
                    } else {
                        statements.push(t.expressionStatement(t.callExpression(id('sender.bind.logic'), [left, right])))
                    }

                } else {
                    if (t.isStringLiteral(tag)) {
                        if (tag.value === 'svg') {
                            if (!state.get('isSvgComponent')) {
                                state.set('isSvgComponent', true);
                                objectExpression.push(t.objectProperty(t.identifier('__isSvgElement'), t.booleanLiteral(true)))
                            }
                        }

                        if (t.isCallExpression(cx) && t.isIdentifier(cx.callee) && cx.callee.name === 'sender.on' && existThis == false) {
                            existThis = true;

                        }
                        if (t.isCallExpression(cx) && t.isIdentifier(cx.callee) && cx.callee.name === 'sender.bind.loop') {
                            hasLoop = true;
                            statements.push(t.expressionStatement(cx));
                        } else {


                            if (t.isCallExpression(cx)) {
                                if (state.get('isSvgComponent') == true) {

                                    if (cx.arguments.length > 1) {
                                        if (t.isObjectExpression(cx.arguments[1])) {
                                            cx.arguments[1].properties.splice(0, 0, t.objectProperty(t.identifier('__isSvgElement'), t.booleanLiteral(true)))
                                        }
                                    }

                                }

                            }


                            var uid = path.scope.generateUid('_comp');
                            statements.push(t.variableDeclaration('const', [t.variableDeclarator(t.identifier(uid), cx)]));
                            statements.push(t.expressionStatement(t.callExpression(t.identifier('sender.controls.add'), [t.identifier(uid)])))

                        }


                    }


                }


        });

    }



    if (t.isStringLiteral(tag)) {
        if (preDirectives.length > 0) {
            let preStatements: t.Statement[] = [];
            preStatements.push(...preDirectives)
            var setupMethods = t.objectProperty(t.identifier('preconfig'), t.arrowFunctionExpression([id('sender')], t.blockStatement([...preStatements])));
            bodyExpression.properties.push(setupMethods);
        }

        if (componentEvents.length > 0) {
            bodyExpression.properties.push(...componentEvents)
        }
        if (objectExpression.length > 0) {
            var expr = t.objectProperty(t.identifier('props'), t.objectExpression(objectExpression));
            bodyExpression.properties.push(...objectExpression)
        };
        if (statements.length > 0) {
            // var setupMethod = t.objectMethod('method', id('setup'), [id('sender')], t.blockStatement([...statements]));
            var setupMethods = t.objectProperty(t.identifier('setup'), t.arrowFunctionExpression([id('sender')], t.blockStatement([...statements])));
            bodyExpression.properties.push(setupMethods)
        };
    } else {
        var tts = t.objectProperty(id('slots'), t.arrayExpression(childs));

        if (objectExpression.length > 0) {
            var expr = t.objectProperty(t.identifier('props'), t.objectExpression(objectExpression));
            bodyExpression.properties.push(...objectExpression)
        };

        var takedown = t.objectExpression([]);

        if (statements.length > 0) {
            //var setupMethod = t.objectMethod('method', id('setup'), [id('sender')], t.blockStatement([...statements]));
            var setupMethods = t.objectProperty(t.identifier('setup'), t.arrowFunctionExpression([id('sender')], t.blockStatement([...statements])));
            takedown.properties.push(setupMethods)
        };

        if (preDirectives.length > 0) {
            let preStatements: t.Statement[] = [];
            preStatements.push(...preDirectives)
            //var preMethod = t.objectMethod('method', id('preconfig'), [], t.blockStatement([...preStatements]));
            var setupMethods = t.objectProperty(t.identifier('preconfig'), t.arrowFunctionExpression([id('sender')], t.blockStatement([...preStatements])));
            takedown.properties.push(setupMethods);
        }

        if (componentEvents.length > 0) {
            takedown.properties.push(...componentEvents)
            //bodyExpression.properties.push(exp);
        }
        var exp = t.objectProperty(id('intervention'), takedown);
        bodyExpression.properties.push(exp);
        bodyExpression.properties.push(tts);
    }

    setup.push(bodyExpression);

 
    state.set('isSvgComponent', false);
    return t.callExpression(t.identifier(moviComponent()), [tag, ...setup]);


}

export function ParseFrament(path: NodePath<t.JSXElement>, state: State): t.CallExpression | t.Expression | t.ObjectMethod {
    const children = getChildren(path.get('children'), state);
    var childs: t.Expression[] = [];
    var setup: t.BlockStatement = t.blockStatement([]);
    children.forEach(exp => {
        //console.error(exp)

        if (t.isExpression(exp)) {
            //childs.push(exp); 
            if (exp !== null) {
                var uid = path.scope.generateUid('_comp');
                if (t.isCallExpression(exp) && t.isIdentifier(exp.callee) && exp.callee.name === 'sender.repeater') {


                    setup.body.push(t.expressionStatement(t.callExpression(id('sender.bind.loop'), [returnIfStatement(exp.arguments[0], true, t.arrayExpression()), exp.arguments[1]]))); 
                } else {
                    childs.push(exp);

                    setup.body.push(t.variableDeclaration('const', [t.variableDeclarator(t.identifier(uid), exp)]));
                    setup.body.push(t.expressionStatement(t.callExpression(t.identifier('sender.controls.add'), [t.identifier(uid)])))
                }
            }
        }
    })


    if (!state.get(moviFragment())) {
        state.set(moviFragment(), moviFragment());
    }
    var tts = t.objectProperty(id('nodes'), t.arrayExpression(childs));
    var objExp = t.objectExpression([]);
    if (setup !== null) {
 
        var setupMethods = t.objectProperty(t.identifier('setup'), t.arrowFunctionExpression([id('sender')], t.blockStatement([setup])));

        objExp.properties.push(setupMethods);
    }



    return t.callExpression(t.identifier(moviFragment()), [objExp]);
}
