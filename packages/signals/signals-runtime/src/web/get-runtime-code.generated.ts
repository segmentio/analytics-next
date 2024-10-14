/* eslint-disable */
// GENERATED, DO NOT EDIT
// @segment/analytics-signals-runtime@0.0.0
// Entry point: src/web/index.signals-runtime.ts
export const getRuntimeCode = (): string => `
"use strict";(()=>{var o=Object.defineProperty;var S=(l,e)=>{for(var n in e)o(l,n,{get:e[n],enumerable:!0})};var a=class{constructor(e=[]){this.find=(e,n,i)=>this.filter(e,n,i)[0];this.filter=(e,n,i)=>{let r=g=>g.type===n;return this.signalBuffer.slice(this.signalBuffer.indexOf(e)+1).filter(r).filter(g=>i?i(g):()=>!0)};this.signalBuffer=e}};var t=class extends a{};var s={};S(s,{EventType:()=>p,NavigationAction:()=>f,SignalType:()=>y});var p=Object.freeze({Track:"track",Page:"page",Screen:"screen",Identify:"identify",Group:"group",Alias:"alias"}),f=Object.freeze({URLChange:"urlChange",PageLoad:"pageLoad"}),y=Object.freeze({Interaction:"interaction",Navigation:"navigation",Network:"network",LocalData:"localData",Instrumentation:"instrumentation",UserDefined:"userDefined"});Object.assign(globalThis,{signals:new t},s);})();
`
  