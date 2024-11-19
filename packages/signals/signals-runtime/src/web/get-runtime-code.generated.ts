/* eslint-disable */
// GENERATED, DO NOT EDIT
// Entry point: src/web/index.signals-runtime.ts
export const getRuntimeCode = (): string => `
"use strict";(()=>{var o=Object.defineProperty;var S=(l,e)=>{for(var n in e)o(l,n,{get:e[n],enumerable:!0})};var i=class{constructor(e=[]){this.find=(e,n,a)=>this.filter(e,n,a)[0];this.filter=(e,n,a)=>{let s=g=>g.type===n;return this.signalBuffer.slice(this.signalBuffer.indexOf(e)+1).filter(s).filter(g=>a?a(g):()=>!0)};this.signalBuffer=e}};var t=class extends i{};var r={};S(r,{EventType:()=>f,NavigationAction:()=>p,SignalType:()=>y});var f=Object.freeze({Track:"track",Page:"page",Screen:"screen",Identify:"identify",Group:"group",Alias:"alias"}),p=Object.freeze({URLChange:"urlChange",PageLoad:"pageLoad"}),y=Object.freeze({Interaction:"interaction",Navigation:"navigation",Network:"network",LocalData:"localData",Instrumentation:"instrumentation",UserDefined:"userDefined"});Object.assign(globalThis,{signals:new t},r);})();
`
  