require('dotenv/config');
const {randomUUID}=require('node:crypto');
const cloudinary=require('../dist/config/cloudinary').default;
const service=require('../dist/service/cloudinaryDirectUpload.service');
(async()=>{
 const publicId='direct-uploads/verification/'+randomUUID()+'/image';
 const now=new Date();const grant=service.signDirectImageUpload({publicId,createdAt:now,expiresAt:new Date(now.getTime()+900000)},['png']);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 try {
  const form=new FormData();for(const[k,v]of Object.entries(grant.fields))form.append(k,v);form.append('file',new Blob([png],{type:'image/png'}),'verification.png');
  const response=await fetch(grant.uploadUrl,{method:'POST',body:form});const result=await response.json();
  if(!response.ok)throw Error('REMOTE_UPLOAD_FAILED');
  const expected=cloudinary.utils.api_sign_request({public_id:result.public_id,version:result.version},cloudinary.config().api_secret);
  if(result.public_id!==publicId||result.type!=='authenticated'||result.resource_type!=='image'||expected!==result.signature)throw Error('REMOTE_RESPONSE_INVALID');
  const metadata=await service.getDirectUploadAsset(publicId);
  console.log(JSON.stringify({signedUpload:true,responseSignatureVerified:true,metadataVerified:metadata.public_id===publicId,format:metadata.format,bytes:metadata.bytes,width:metadata.width,height:metadata.height,verificationPublicId:publicId,callback:'Confirmar o HTTP de entrega no painel Cloudinary; nenhum recurso de cliente foi publicado.'},null,2));
 } finally {await service.deleteDirectUploadAsset(publicId);console.log('Recurso sintético de verificação removido.');}
})().catch(error=>{console.error('Verificação externa falhou',{code:error.http_code||error.error?.http_code||'VERIFICATION_FAILED'});process.exitCode=1;});
