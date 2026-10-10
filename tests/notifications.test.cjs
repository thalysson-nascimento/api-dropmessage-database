const assert = require("node:assert/strict");
const {afterEach, test} = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);
const {GetNotificationUseCase} = require("../src/modules/notification/get-notification/useCase/getNotificationUseCase");
const {GetNotificationRepository} = require("../src/modules/notification/get-notification/useCase/getNotificationRepository");
const {CreateNotificationUseCase} = require("../src/modules/notification/create-notification/useCase/createNotificationUseCase");
const socket = require("../src/lib/socket");
const originalSocket = socket.getSocketIO;
afterEach(() => {socket.getSocketIO = originalSocket;});
test("global notification list is scoped to JWT recipient and preserves exact comment text", async () => {
  const useCase = new GetNotificationUseCase();
  const scopes = [];
  const events = [];
  socket.getSocketIO = () => ({to: room => ({emit:(event,payload)=>events.push({room,event,payload})})});
  useCase.repository = {
    findActiveSubscription:async id => {scopes.push(id); return null;},
    findByRecipient:async id => {scopes.push(id); return ["first comment","second comment"].map((commentText,i)=>({id:String(i),type:"COMMENT",actor:{id:"actor",name:"Actor",avatar:null},globalChatMessage:{id:"global-message",type:"TEXT"},globalChatMessageId:"global-message",commentText,createdAt:new Date(),isRead:false}));},
    markAllAsRead:async id => scopes.push(id),
    findMatchesBetweenUsers:async id => {scopes.push(id); return [];},
  };
  const result = await useCase.execute("recipient");
  assert.ok(scopes.every(id=>id === "recipient"));
  assert.deepEqual(result.items.map(n=>n.meta.commentText), ["first comment","second comment"]);
  assert.deepEqual(result.items[0].target,{id:"global-message",type:"global-chat",thumbnailUrl:null});
  assert.ok(events.every(e=>e.room === "recipient"));
});
test("global image reaction notifications never expose media in thumbnails", async () => {
  const useCase = new GetNotificationUseCase();
  socket.getSocketIO = () => ({to:()=>({emit:()=>{}})});
  useCase.repository = {
    findActiveSubscription:async()=>null,
    findByRecipient:async()=>[{id:"n",type:"LIKE",emotion:"❤️",actor:{id:"actor",name:"Actor",avatar:null},globalChatMessage:{id:"private-photo",type:"IMAGE"},createdAt:new Date(),isRead:false}],
    markAllAsRead:async()=>{},findMatchesBetweenUsers:async()=>[],
  };
  const result = await useCase.execute("recipient");
  assert.equal(result.items[0].target.thumbnailUrl,null);
  assert.equal(result.items[0].meta.emotion,"❤️");
});
test("socket failure does not lose a persisted notification or fail the action", async () => {
  const useCase = new CreateNotificationUseCase();
  const stored = {id:"persisted", notifiedUserId:"recipient"};
  useCase.repository = {create:async()=>stored};
  socket.getSocketIO = () => {throw Error("unavailable");};
  const result = await useCase.execute({notifiedUserId:"recipient",actorId:"actor",type:"LIKE"});
  assert.equal(result,stored);
});
test("repository queries only the specified notification recipient", async () => {
  const {prismaCliente} = require("../src/database/prismaCliente");
  const original = prismaCliente.notification.findMany;
  let query;
  prismaCliente.notification.findMany = async args => {query=args;return [];};
  try {await new GetNotificationRepository().findByRecipient("recipient");assert.deepEqual(query.where,{notifiedUserId:"recipient"});}
  finally {prismaCliente.notification.findMany=original;}
});
