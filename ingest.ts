// Supabase Edge Function named ingest. Deploy with --no-verify-jwt.
// Authentication is performed with x-device-key; service key stays on the server.
import { createClient } from 'npm:@supabase/supabase-js@2';
const reply=(status:number,body:object)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return reply(405,{error:'POST required'});
 const secret=req.headers.get('x-device-key');if(!secret||secret.length<32)return reply(401,{error:'Invalid device credentials'});
 if(Number(req.headers.get('content-length')||0)>4096)return reply(413,{error:'Payload too large'});
 try{
 const raw=await req.text();if(raw.length>4096)return reply(413,{error:'Payload too large'});const b=JSON.parse(raw);
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!uuid.test(b.device_id)||!uuid.test(b.reading_id)||typeof b.measured_at!=='string'||!/(Z|[+-]\d{2}:\d{2})$/.test(b.measured_at)||!Number.isFinite(Date.parse(b.measured_at))||Date.parse(b.measured_at)>Date.now()+300000)return reply(400,{error:'Invalid IDs or timestamp'});
 for(const [field,min,max] of [['temperature_c',-60,100],['humidity_pct',0,100],['co2_ppm',0,100000]] as const){if(typeof b[field]!=='number'||!Number.isFinite(b[field])||b[field]<min||b[field]>max)return reply(400,{error:'Invalid '+field});}
 if(b.battery_v!=null&&(typeof b.battery_v!=='number'||!Number.isFinite(b.battery_v)||b.battery_v<0||b.battery_v>60))return reply(400,{error:'Invalid battery_v'});
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secret)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const {data:device,error:lookupError}=await db.from('devices').select('id,hive_id').eq('id',b.device_id).eq('key_hash',hash).eq('enabled',true).maybeSingle();
 if(lookupError)return reply(503,{error:'Device lookup unavailable'});if(!device)return reply(401,{error:'Invalid device credentials'});
 const {error}=await db.from('readings').insert({reading_id:b.reading_id,device_id:device.id,hive_id:device.hive_id,measured_at:b.measured_at,temperature_c:b.temperature_c,humidity_pct:b.humidity_pct,co2_ppm:b.co2_ppm,battery_v:b.battery_v??null});
 if(error?.code==='23505'){const {data:existing}=await db.from('readings').select('device_id').eq('reading_id',b.reading_id).maybeSingle();return existing?.device_id===device.id?reply(200,{accepted:true,duplicate:true}):reply(409,{error:'Reading ID conflict'});}
 if(error)return reply(503,{error:'Storage unavailable; retry with the same reading_id'});
 return reply(201,{accepted:true});
 }catch{return reply(400,{error:'Invalid request'});}
});
