/* eslint-disable */
// GENERATED, DO NOT EDIT
// @segment/analytics-signals-runtime@1.0.0
// Entry point: src/web/index.signals-runtime.ts
export const getRuntimeCode = (): string => `
"use strict";(()=>{var f=Object.defineProperty;var o=(r,n)=>{for(var i in n)f(r,i,{get:n[i],enumerable:!0})};var l=class{constructor(n=[]){this.find=(n,i,a)=>this.filter(n,i,a)[0];this.filter=(n,i,a)=>{let t=this.signalBuffer.findIndex(e=>e===n?!0:"id"in e&&"id"in n&&e.id!==void 0&&n.id!==void 0?e.id===n.id:"index"in e&&"index"in n&&e.index!==void 0&&n.index!==void 0?e.index===n.index:JSON.stringify(e)===JSON.stringify(n));return t===-1&&console.warn("Invariant: the fromSignal was not found in the signalBuffer"),this.filterBuffer(this.signalBuffer.slice(t+1),i,a)};this.filterBuffer=(n,i,a)=>{let t=e=>e.type===i;return n.filter(t).filter(e=>a?a(e):()=>!0)};this.signalBuffer=n}};var g=class extends l{};var s={};o(s,{EventType:()=>p,NavigationAction:()=>S,SignalType:()=>d});var p=Object.freeze({Track:"track",Page:"page",Screen:"screen",Identify:"identify",Group:"group",Alias:"alias"}),S=Object.freeze({URLChange:"urlChange",PageLoad:"pageLoad"}),d=Object.freeze({Interaction:"interaction",Navigation:"navigation",Network:"network",LocalData:"localData",Instrumentation:"instrumentation",UserDefined:"userDefined"});Object.assign(globalThis,{signals:new g},s);})();
`
  