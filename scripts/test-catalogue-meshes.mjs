import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const catalogue=JSON.parse(await readFile(path.join(root,"parts.json"),"utf8"));
const source=await readFile(path.join(root,"js/model-registry.js"),"utf8");
const context={window:{}};vm.createContext(context);vm.runInContext(source,context);
const registry=context.window.RigCraftModelRegistry;let checked=0;
for(const [category,parts] of Object.entries(catalogue))for(const part of parts){
 const file=path.join(root,"assets/models/catalogue",part.id+".glb");assert.ok(existsSync(file),`Missing mesh ${part.id}`);
 const bytes=await readFile(file);assert.ok(bytes.length>12000,`Mesh too small ${part.id}`);
 assert.equal(bytes.toString("ascii",0,4),"glTF",`Bad GLB magic ${part.id}`);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
 const len=bytes.readUInt32LE(12);assert.equal(bytes.toString("ascii",16,20),"JSON");const doc=JSON.parse(bytes.toString("utf8",20,20+len).trim());
 assert.equal(doc.extras.catalogueId,part.id);assert.equal(doc.extras.manufacturerCAD,false);assert.ok(doc.meshes[0].primitives.length>=2);
 const tris=doc.meshes[0].primitives.reduce((n,p)=>n+doc.accessors[p.indices].count/3,0);assert.ok(tris>=250,`Low detail ${part.id}`);
  if(category==="cases"){assert.ok(tris>=15000,`Case chassis detail regression ${part.id}: ${tris} triangles`);assert.ok(doc.meshes[0].primitives.length>=4,`Case material segmentation regression ${part.id}`);}
 const descriptor=registry.resolve(category,part);assert.equal(descriptor.asset,`assets/models/catalogue/${part.id}.glb`);assert.equal(descriptor.exactManufacturerModel,false);checked++;
}
assert.equal(checked,31);console.log(`Catalogue mesh QA passed: ${checked} SKU GLBs, metadata, geometry and registry paths verified.`);
