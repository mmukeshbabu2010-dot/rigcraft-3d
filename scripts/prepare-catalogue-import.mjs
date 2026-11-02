#!/usr/bin/env node
import fs from "node:fs";
const [input,output]=process.argv.slice(2);
if(!input||!output){console.error("Usage: node scripts/prepare-catalogue-import.mjs input.json review.sql");process.exit(2);}
const cats=new Set(["cases","motherboards","cpus","gpus","coolers","ram","storage","psus","fans"]), slug=/^[a-z0-9][a-z0-9_-]{1,119}$/;
const q=v=>v==null?"NULL":"'"+String(v).replace(/'/g,"''")+"'", https=v=>{try{return new URL(v).protocol==="https:"}catch{return false}};
const rows=JSON.parse(fs.readFileSync(input,"utf8")); if(!Array.isArray(rows))throw Error("Input must be an array.");
const ids=new Set(), out=["-- Review before applying. Candidate rows are unverified.","begin;"];
for(const [i,r] of rows.entries()){
 const fail=m=>{throw Error("Row "+(i+1)+": "+m)};
 if(!r||typeof r!=="object"||Array.isArray(r))fail("expected object");
 if(typeof r.id!=="string"||!slug.test(r.id)||ids.has(r.id))fail("invalid or duplicate ID");ids.add(r.id);
 if(!cats.has(r.category_id))fail("unsupported category");
 for(const k of ["display_name","model","source_name","source_url","license"])if(typeof r[k]!=="string"||!r[k].trim())fail("missing "+k);
 if(!https(r.source_url))fail("source_url must be HTTPS");
 for(const k of ["image_url","product_url"])if(r[k]&&!https(r[k]))fail(k+" must be HTTPS");
 if(!r.specs||typeof r.specs!=="object"||Array.isArray(r.specs))fail("specs must be object");
 const vals=[r.id,r.category_id,r.manufacturer||null,r.model,r.display_name,JSON.stringify({...r.specs,license:r.license}),r.image_url||null,r.product_url||null,r.source_name,r.source_url];
 out.push("insert into public.parts(id,category_id,manufacturer,model,display_name,specs,image_url,product_url,source_name,source_url,data_status) values ("+vals.map((v,j)=>j===5?q(v)+"::jsonb":q(v)).join(",")+",'unverified') on conflict(id) do nothing;");
}
out.push("commit;","-- Review provenance and verify technical specifications before approval.");
fs.writeFileSync(output,out.join("\n")+"\n");console.log("Prepared "+rows.length+" unverified candidate rows.");
