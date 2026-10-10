const assert = require('node:assert/strict');
const fs = require('node:fs');
const {test, afterEach} = require('node:test');
const ts = require('typescript');
const {createHash} = require('node:crypto');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);
const express = require('express');
const {sign} = require('jsonwebtoken');
const cloudinary = require('../src/config/cloudinary').default;
const service = require('../src/service/cloudinaryDirectUpload.service');
const {prismaCliente: prisma} = require('../src/database/prismaCliente');
const socket = require('../src/lib/socket');
const {DirectUploadUseCase} = require('../src/modules/direct-upload/directUploadUseCase');
const {DirectUploadRepository} = require('../src/modules/direct-upload/directUploadRepository');
const {GlobalChatUseCase} = require('../src/modules/global-chat/globalChatUseCase');
const {cleanupDirectUploads} = require('../src/work/directUploadCleanup');
const originalCleanup = DirectUploadRepository.prototype.pendingCleanup;
const originalCleanupAck = DirectUploadRepository.prototype.markCleanupComplete;
const originalSessionUpdateMany = prisma.directUploadSession.updateMany;
const originalMessageDelete = prisma.globalChatMessage.deleteMany;
const {DirectUploadController, cloudinaryWebhookBodyParser, globalChatUploadInput} = require('../src/modules/direct-upload/directUploadController');
const {ensureAuthenticateUserAdmin} = require('../src/middlewares/ensureAuthenticateUserAdmin');
const keys = ['CLOUDINARY_NOTIFICATION_URL','CLOUDINARY_WEBHOOK_API_SECRET','CLOUDINARY_GLOBAL_CHAT_DIRECT_ONLY','JWT_SECRET','BASE_URL'];
const originalEnv = Object.fromEntries(keys.map(k=>[k,process.env[k]]));
const originalConfig = {...cloudinary.config()};
const originals = {transaction:prisma.$transaction,findMessage:prisma.globalChatMessage.findUnique,getSocketIO:socket.getSocketIO,emit:socket.emitGlobalChatEvent,delete:service.deleteDirectUploadAsset,resource:service.getDirectUploadAsset};
const uploadId = '0b098de5-e85b-4018-b92c-e5904b068ca3';
const requestId = '0b098de5-e85b-4018-b92c-e5904b068ca4';
let sessions, messages, events, removed, rowLocks;
function session(overrides={}) {return {id:uploadId,userId:'owner',purpose:'GLOBAL_CHAT_IMAGE',clientRequestId:requestId,publicId:'direct-uploads/global-chat/'+uploadId,status:'PENDING',fileName:'photo.png',declaredBytes:68,content:'caption',viewOnce:true,expirationSeconds:60,createdAt:new Date(),expiresAt:new Date(Date.now()+900000),messageId:null,rejectionReason:null,...overrides};}
function asset(overrides={}) {return {notification_type:'upload',public_id:'direct-uploads/global-chat/'+uploadId,asset_id:'asset-1',resource_type:'image',type:'authenticated',bytes:68,format:'png',width:1,height:1,created_at:new Date().toISOString(),...overrides};}
function signed(body, age=0, algorithm='sha256') {const raw=Buffer.from(typeof body==='string'?body:JSON.stringify(body));const timestamp=String(Math.floor(Date.now()/1000)+age);return {raw,timestamp,signature:createHash(algorithm).update(raw).update(timestamp).update('test-webhook-secret').digest('hex')};}
async function deliver(useCase, body=asset()) {const s=signed(body);return useCase.webhook(s.raw,s.timestamp,s.signature);}
function setup(seed=[session()]) {
  cloudinary.config({cloud_name:'test-cloud',api_key:'test-key',api_secret:'test-secret'});
  process.env.CLOUDINARY_NOTIFICATION_URL='https://api.example.com/cloudinary/webhook';
  process.env.CLOUDINARY_WEBHOOK_API_SECRET='test-webhook-secret';
  process.env.JWT_SECRET='jwt-test';
  sessions=new Map(seed.map(s=>[s.id,s]));messages=new Map();events=[];removed=[];rowLocks=0;
  socket.getSocketIO=()=>({to:room=>({emit:(event,payload)=>events.push({room,event,payload})})});
  socket.emitGlobalChatEvent=(event,payload)=>events.push({event,payload});
  service.deleteDirectUploadAsset=async(...args)=>{removed.push(args);return {result:'ok'};};
  service.getDirectUploadAsset=async()=>asset();
  const tx={
    $queryRaw:async(strings,...values)=>{rowLocks++;return [...sessions.values()].filter(s=>s.publicId===values[0]||s.id===values[0]).map(s=>({id:s.id}));},
    user:{findFirst:async()=>({id:'owner'})},
    directUploadSession:{
      findUnique:async({where})=>where.id?sessions.get(where.id):[...sessions.values()].find(s=>s.clientRequestId===where.userId_purpose_clientRequestId.clientRequestId && s.userId===where.userId_purpose_clientRequestId.userId),
      findFirst:async({where})=>[...sessions.values()].find(s=>s.id===where.id&&s.userId===where.userId&&s.purpose===where.purpose),
      count:async({where})=>[...sessions.values()].filter(s=>s.userId===where.userId&&(!where.status||s.status===where.status&&s.expiresAt>where.expiresAt.gt)&&(!where.createdAt||s.createdAt>where.createdAt.gt)).length,
      updateMany:async({where,data})=>{let count=0;for(const [id,s] of sessions){if((!where.publicId||s.publicId===where.publicId)&&(!where.messageId||s.messageId===where.messageId)&&(!where.userId||s.userId===where.userId)){sessions.set(id,{...s,...data});count++;}}return {count};},
      create:async({data})=>{const s={...session(),...data};sessions.set(s.id,s);return s;},
      update:async({where,data})=>{const s={...sessions.get(where.id),...data};sessions.set(s.id,s);return s;},
    },
    globalChatMessage:{
      deleteMany:async({where})=>{const existed=messages.delete(where.id);for(const [id,s] of sessions)if(s.messageId===where.id)sessions.set(id,{...s,messageId:null});return {count:existed?1:0};},
      findFirst:async()=>null,
      create:async({data})=>{const m={...data,id:'message-1',createdAt:new Date(),user:{userHashPublic:'owner-public',name:'Owner',avatar:null,UserLocation:null},views:[],reactions:[]};messages.set(m.id,m);return m;},
    },
  };
  let tail=Promise.resolve();
  prisma.$transaction=callback=>{
    const run=tail.then(async()=>{
      const before=new Map(sessions), beforeMessages=new Map(messages);
      try {return await callback(tx);}
      catch(e){sessions=before;messages=beforeMessages;throw e;}
    });tail=run.catch(()=>{});return run;
  };
  prisma.directUploadSession.updateMany=tx.directUploadSession.updateMany;
  prisma.globalChatMessage.deleteMany=tx.globalChatMessage.deleteMany;
  prisma.globalChatMessage.findUnique=async({where})=>messages.get(where.id)||null;
  const useCase=new DirectUploadUseCase();
  useCase.repository.markCleanupComplete=async()=>({count:1});
  useCase.repository.findOwned=async(id,userId)=>tx.directUploadSession.findFirst({where:{id,userId,purpose:'GLOBAL_CHAT_IMAGE'}});
  return {useCase,tx};
}
afterEach(()=>{
  DirectUploadRepository.prototype.pendingCleanup=originalCleanup;
  DirectUploadRepository.prototype.markCleanupComplete=originalCleanupAck;
  prisma.directUploadSession.updateMany=originalSessionUpdateMany;
  prisma.globalChatMessage.deleteMany=originalMessageDelete;
  prisma.$transaction=originals.transaction;prisma.globalChatMessage.findUnique=originals.findMessage;
  socket.getSocketIO=originals.getSocketIO;socket.emitGlobalChatEvent=originals.emit;
  service.deleteDirectUploadAsset=originals.delete;service.getDirectUploadAsset=originals.resource;
  cloudinary.config(originalConfig);
  for(const k of keys) originalEnv[k]===undefined?delete process.env[k]:process.env[k]=originalEnv[k];
});
const input={clientRequestId:requestId,fileName:'photo.png',bytes:68,mimeType:'image/png',viewOnce:true,expiresInSeconds:60};
test('authorization returns signed image-only parameters without secrets or API image upload',async()=>{
  const {useCase}=setup([]);const result=await useCase.authorize('owner',input);
  assert.match(result.upload.uploadUrl,/\/image\/upload$/);assert.equal(result.upload.fields.type,'authenticated');assert.equal(result.upload.fields.overwrite,'false');
  assert.equal(result.upload.fields.signature,cloudinary.utils.api_sign_request(Object.fromEntries(Object.entries(result.upload.fields).filter(([k])=>!['api_key','signature'].includes(k))),'test-secret'));
  assert.equal(result.upload.maxBytes,5*1024*1024);assert.equal(JSON.stringify(result).includes('test-secret'),false);assert.equal(messages.size,0);
});
test('same request ID is idempotent and conflicting metadata is rejected',async()=>{
  const {useCase}=setup([]);const a=await useCase.authorize('owner',input),b=await useCase.authorize('owner',input);
  assert.equal(a.uploadId,b.uploadId);assert.equal(sessions.size,1);
  await assert.rejects(useCase.authorize('owner',{...input,viewOnce:false}),{statusCode:409});
});
test('authorization rejects invalid files and nonexistent replies before publication',async()=>{
  const {useCase}=setup([]);
  for(const change of [{bytes:0},{bytes:5*1024*1024+1},{mimeType:'image/svg+xml'},{viewOnce:'true'},{expiresInSeconds:59},{public_id:'arbitrary'}])
    await assert.rejects(useCase.authorize('owner',{...input,...change}),{statusCode:400});
  await assert.rejects(useCase.authorize('owner',{...input,replyToId:requestId}),{statusCode:404});assert.equal(messages.size,0);
});
test('issuance quotas and inactive users are enforced in a database transaction',async()=>{
  const {useCase,tx}=setup([1,2,3].map(i=>session({id:String(i),clientRequestId:String(i)})));
  await assert.rejects(useCase.authorize('owner',input),{statusCode:429});
  tx.user.findFirst=async()=>null;await assert.rejects(useCase.authorize('owner',input),{statusCode:403});assert.ok(rowLocks>0);
});
test('raw body verification supports SHA1 and SHA256 and rejects tampering and replay timestamps',()=>{
  setup();for(const algo of ['sha1','sha256']){const s=signed('{ "notification_type": "upload" }',0,algo);service.verifyCloudinaryWebhook(s.raw,s.timestamp,s.signature);assert.throws(()=>service.verifyCloudinaryWebhook(Buffer.from('{}'),s.timestamp,s.signature),{statusCode:401});}
  for(const age of [-7201,120]){const s=signed(asset(),age);assert.throws(()=>service.verifyCloudinaryWebhook(s.raw,s.timestamp,s.signature),{statusCode:401});}
});
test('invalid signature never reads sessions or publishes',async()=>{
  const {useCase}=setup();await assert.rejects(useCase.webhook(Buffer.from('{}'),'1','bad'),{statusCode:401});assert.equal(rowLocks,0);assert.equal(messages.size,0);
});
test('signed webhook publishes once, hides view-once URLs, and sends only private upload status',async()=>{
  const {useCase}=setup();await deliver(useCase);await deliver(useCase);
  assert.equal(messages.size,1);assert.equal(sessions.get(uploadId).status,'PUBLISHED');
  const publicEvents=events.filter(e=>e.event==='global-chat:new-message');assert.equal(publicEvents.length,1);assert.equal(publicEvents[0].payload.imageUrl,null);assert.equal(publicEvents[0].payload.fileName,null);assert.equal(publicEvents[0].payload.uploadId,uploadId);
  assert.ok(events.filter(e=>e.event==='upload:status').every(e=>e.room==='owner'));
});
test('concurrent duplicate callbacks publish exactly one message',async()=>{
  const {useCase}=setup();await Promise.all([deliver(useCase),deliver(useCase),deliver(useCase)]);
  assert.equal(messages.size,1);assert.equal(events.filter(e=>e.event==='global-chat:new-message').length,1);
});
test('invalid, oversized, or non-authenticated assets are rejected and cleaned up',async()=>{
  for(const override of [{bytes:5*1024*1024+1},{format:'svg'},{resource_type:'raw'},{type:'upload'},{width:0},{width:100000,height:100000}]){
    const {useCase}=setup();await deliver(useCase,asset(override));assert.equal(messages.size,0);assert.equal(sessions.get(uploadId).status,'REJECTED');assert.equal(removed.length,1);
  }
});
test('unknown assets and unrelated notification types cannot modify existing media',async()=>{
  const {useCase}=setup();await deliver(useCase,asset({public_id:'user-posts/customer-photo'}));await deliver(useCase,asset({public_id:'direct-uploads/global-chat/'+requestId}));await deliver(useCase,{notification_type:'delete'});
  assert.equal(messages.size,0);assert.equal(removed.length,0);
});
test('upload finished on time survives delayed webhook; late upload is rejected',async()=>{
  let fixture=setup([session({createdAt:new Date(Date.now()-1200000),expiresAt:new Date(Date.now()-300000)})]);
  await deliver(fixture.useCase,asset({created_at:new Date(Date.now()-600000).toISOString()}));assert.equal(messages.size,1);
  fixture=setup([session({createdAt:new Date(Date.now()-1200000),expiresAt:new Date(Date.now()-300000)})]);await deliver(fixture.useCase);assert.equal(messages.size,0);assert.equal(removed.length,1);
});
test('cancel is owner-only, late webhook deletes media, and published posts use existing delete endpoint',async()=>{
  const {useCase}=setup();await assert.rejects(useCase.cancel(uploadId,'stranger'),{statusCode:404});await useCase.cancel(uploadId,'owner');await deliver(useCase);assert.equal(messages.size,0);assert.equal(removed.length,1);
  setup();const other=new DirectUploadUseCase();await deliver(other);await assert.rejects(other.cancel(uploadId,'owner'),{statusCode:409});
});
test('deleting a published message does not allow webhook replay to recreate it',async()=>{
  const {useCase}=setup();await deliver(useCase);messages.clear();sessions.set(uploadId,{...sessions.get(uploadId),messageId:null});await deliver(useCase);assert.equal(messages.size,0);
  const status=await useCase.status(uploadId,'owner');assert.equal(status.status,'PUBLISHED');assert.equal(status.unavailable,true);assert.equal(status.message,null);
});
test('status is owner-only and preserves view-once privacy',async()=>{
  const {useCase}=setup();await assert.rejects(useCase.status(uploadId,'stranger'),{statusCode:404});await deliver(useCase);const status=await useCase.status(uploadId,'owner');assert.equal(status.message.imageUrl,null);assert.equal(status.message.uploadId,uploadId);
});
test('database failure rolls back publication and session completion for webhook retries',async()=>{
  const {useCase,tx}=setup();const update=tx.directUploadSession.update;tx.directUploadSession.update=async()=>{throw Error('database unavailable');};
  await assert.rejects(deliver(useCase));assert.equal(messages.size,0);assert.equal(sessions.get(uploadId).status,'PENDING');assert.equal(events.length,0);
  tx.directUploadSession.update=update;await deliver(useCase);assert.equal(messages.size,1);
});
test('cleanup failure leaves a rejected session and is retried on the next callback',async()=>{
  const {useCase}=setup();service.deleteDirectUploadAsset=async()=>{throw Error('Cloudinary unavailable');};await assert.rejects(deliver(useCase,asset({format:'svg'})));assert.equal(sessions.get(uploadId).status,'REJECTED');
  service.deleteDirectUploadAsset=async(...args)=>removed.push(args);await deliver(useCase,asset({format:'svg'}));assert.equal(removed.length,1);assert.equal(messages.size,0);
});
test('authenticated metadata reconciliation recovers webhook loss and cannot attach another user asset',async()=>{
  const {useCase}=setup();await assert.rejects(useCase.reconcile(uploadId,'stranger'),{statusCode:404});const status=await useCase.reconcile(uploadId,'owner');assert.equal(status.status,'PUBLISHED');assert.equal(messages.size,1);await deliver(useCase);assert.equal(messages.size,1);
});
test('reconciliation of an absent remote asset leaves the intent pending',async()=>{
  const {useCase}=setup();service.getDirectUploadAsset=async()=>{throw {http_code:404};};assert.equal((await useCase.reconcile(uploadId,'owner')).status,'PENDING');assert.equal(messages.size,0);
});
async function withServer(app, callback) {const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));try{return await callback('http://127.0.0.1:'+server.address().port);}finally{await new Promise(resolve=>server.close(resolve));}}
test('HTTP webhook preserves exact JSON bytes through parsers and returns 401 for forged signatures',async()=>{
  const {useCase}=setup();const controller=new DirectUploadController();controller.useCase=useCase;const app=express();app.use('/cloudinary/webhook',cloudinaryWebhookBodyParser);app.use(express.json());app.post('/cloudinary/webhook',controller.webhook.bind(controller));
  await withServer(app,async base=>{const signedBody=signed(JSON.stringify(asset(),null,2));const response=await fetch(base+'/cloudinary/webhook',{method:'POST',headers:{'content-type':'application/json','x-cld-signature':signedBody.signature,'x-cld-timestamp':signedBody.timestamp},body:signedBody.raw});assert.equal(response.status,200);const forged=await fetch(base+'/cloudinary/webhook',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.equal(forged.status,401);});
});
test('direct-only global chat rejects binary bodies before buffering and leaves JSON text intact',async()=>{
  setup();process.env.CLOUDINARY_GLOBAL_CHAT_DIRECT_ONLY='true';const app=express();app.use(express.json());app.post('/global-chat',globalChatUploadInput,(req,res)=>res.json(req.body));
  await withServer(app,async base=>{const form=new FormData();form.append('file',new Blob(['bytes']),'photo.jpg');const rejected=await fetch(base+'/global-chat',{method:'POST',body:form});assert.equal(rejected.status,415);assert.equal((await rejected.json()).code,'DIRECT_UPLOAD_REQUIRED');const text=await fetch(base+'/global-chat',{method:'POST',headers:{'content-type':'application/json'},body:'{"content":"hello"}'});assert.deepEqual(await text.json(),{content:'hello'});});
});
test('HTTP authorization requires JWT before accessing upload sessions',async()=>{
  const {useCase}=setup([]);const controller=new DirectUploadController();controller.useCase=useCase;const app=express();app.use(express.json());app.post('/global-chat/uploads',ensureAuthenticateUserAdmin,controller.authorize.bind(controller));
  await withServer(app,async base=>{const noToken=await fetch(base+'/global-chat/uploads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)});assert.equal(noToken.status,401);assert.equal(sessions.size,0);const ok=await fetch(base+'/global-chat/uploads',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+sign({},'jwt-test',{subject:'owner'})},body:JSON.stringify(input)});assert.equal(ok.status,201);});
});

test('direct message deletion queues cleanup durably and failed Cloudinary deletion is retried',async()=>{
  const {useCase}=setup();await deliver(useCase);service.deleteDirectUploadAsset=async()=>{throw Error('temporarily unavailable');};
  await new GlobalChatUseCase().deleteMessage('message-1','owner');assert.equal(messages.size,0);assert.equal(sessions.get(uploadId).messageId,null);assert.equal(sessions.get(uploadId).cleanupPending,true);
  DirectUploadRepository.prototype.pendingCleanup=async()=>[sessions.get(uploadId)];
  service.deleteDirectUploadAsset=async(...args)=>{removed.push(args);return {result:'ok'};};await cleanupDirectUploads();assert.equal(removed.length,1);assert.equal(sessions.get(uploadId).cleanupPending,false);
});
test('cleanup worker never removes IDs outside the direct upload namespace',async()=>{
  setup();DirectUploadRepository.prototype.pendingCleanup=async()=>[session({publicId:'user-posts/existing-customer-photo',cleanupResourceType:'image',cleanupDeliveryType:'authenticated'})];
  await cleanupDirectUploads();assert.equal(removed.length,0);
});
test('legacy global chat clients keep their upload path until direct-only mode is enabled',async()=>{
  setup();delete process.env.CLOUDINARY_GLOBAL_CHAT_DIRECT_ONLY;
  const app=express();app.post('/global-chat',globalChatUploadInput,(req,res)=>res.json({bytes:req.file?.size}));
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
  await withServer(app,async base=>{const form=new FormData();form.append('file',new Blob([png],{type:'image/png'}),'photo.png');const response=await fetch(base+'/global-chat',{method:'POST',body:form});assert.equal(response.status,200);assert.equal((await response.json()).bytes,png.length);});
});
