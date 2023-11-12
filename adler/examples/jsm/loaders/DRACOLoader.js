import{BufferAttribute as e,BufferGeometry as t,Color as r,FileLoader as o,Loader as s,LinearSRGBColorSpace as i,SRGBColorSpace as a}from"three";let _taskCache=new WeakMap;class DRACOLoader extends s{constructor(e){super(e),this.decoderPath="",this.decoderConfig={},this.decoderBinary=null,this.decoderPending=null,this.workerLimit=4,this.workerPool=[],this.workerNextTaskID=1,this.workerSourceURL="",this.defaultAttributeIDs={position:"POSITION",normal:"NORMAL",color:"COLOR",uv:"TEX_COORD"},this.defaultAttributeTypes={position:"Float32Array",normal:"Float32Array",color:"Float32Array",uv:"Float32Array"}}setDecoderPath(e){return this.decoderPath=e,this}setDecoderConfig(e){return this.decoderConfig=e,this}setWorkerLimit(e){return this.workerLimit=e,this}load(e,t,r,s){let i=new o(this.manager);i.setPath(this.path),i.setResponseType("arraybuffer"),i.setRequestHeader(this.requestHeader),i.setWithCredentials(this.withCredentials),i.load(e,e=>{this.parse(e,t,s)},r,s)}parse(e,t,r){this.decodeDracoFile(e,t,null,null,a).catch(r)}decodeDracoFile(e,t,r,o,s=i){let a={attributeIDs:r||this.defaultAttributeIDs,attributeTypes:o||this.defaultAttributeTypes,useUniqueIDs:!!r,vertexColorSpace:s};return this.decodeGeometry(e,a).then(t)}decodeGeometry(e,t){let r=JSON.stringify(t);if(_taskCache.has(e)){let o=_taskCache.get(e);if(o.key===r)return o.promise;if(0===e.byteLength)throw Error("THREE.DRACOLoader: Unable to re-decode a buffer with different settings. Buffer has already been transferred.")}let s,i=this.workerNextTaskID++,a=e.byteLength,n=this._getWorker(i,a).then(r=>(s=r,new Promise((r,o)=>{s._callbacks[i]={resolve:r,reject:o},s.postMessage({type:"decode",id:i,taskConfig:t,buffer:e},[e])}))).then(e=>this._createGeometry(e.geometry));return n.catch(()=>!0).then(()=>{s&&i&&this._releaseTask(s,i)}),_taskCache.set(e,{key:r,promise:n}),n}_createGeometry(r){let o=new t;r.index&&o.setIndex(new e(r.index.array,1));for(let s=0;s<r.attributes.length;s++){let i=r.attributes[s],a=i.name,n=i.array,d=i.itemSize,l=new e(n,d);"color"===a&&(this._assignVertexColorSpace(l,i.vertexColorSpace),l.normalized=n instanceof Float32Array==!1),o.setAttribute(a,l)}return o}_assignVertexColorSpace(e,t){if(t!==a)return;let o=new r;for(let s=0,i=e.count;s<i;s++)o.fromBufferAttribute(e,s).convertSRGBToLinear(),e.setXYZ(s,o.r,o.g,o.b)}_loadLibrary(e,t){let r=new o(this.manager);return r.setPath(this.decoderPath),r.setResponseType(t),r.setWithCredentials(this.withCredentials),new Promise((t,o)=>{r.load(e,t,void 0,o)})}preload(){return this._initDecoder(),this}_initDecoder(){if(this.decoderPending)return this.decoderPending;let e="object"!=typeof WebAssembly||"js"===this.decoderConfig.type,t=[];return e?t.push(this._loadLibrary("draco_decoder.js","text")):(t.push(this._loadLibrary("draco_wasm_wrapper.js","text")),t.push(this._loadLibrary("draco_decoder.wasm","arraybuffer"))),this.decoderPending=Promise.all(t).then(t=>{let r=t[0];e||(this.decoderConfig.wasmBinary=t[1]);let o=DRACOWorker.toString(),s=["/* draco decoder */",r,"","/* worker */",o.substring(o.indexOf("{")+1,o.lastIndexOf("}"))].join("\n");this.workerSourceURL=URL.createObjectURL(new Blob([s]))}),this.decoderPending}_getWorker(e,t){return this._initDecoder().then(()=>{if(this.workerPool.length<this.workerLimit){let r=new Worker(this.workerSourceURL);r._callbacks={},r._taskCosts={},r._taskLoad=0,r.postMessage({type:"init",decoderConfig:this.decoderConfig}),r.onmessage=function(e){let t=e.data;switch(t.type){case"decode":r._callbacks[t.id].resolve(t);break;case"error":r._callbacks[t.id].reject(t);break;default:console.error('THREE.DRACOLoader: Unexpected message, "'+t.type+'"')}},this.workerPool.push(r)}else this.workerPool.sort(function(e,t){return e._taskLoad>t._taskLoad?-1:1});let o=this.workerPool[this.workerPool.length-1];return o._taskCosts[e]=t,o._taskLoad+=t,o})}_releaseTask(e,t){e._taskLoad-=e._taskCosts[t],delete e._callbacks[t],delete e._taskCosts[t]}debug(){console.log("Task load: ",this.workerPool.map(e=>e._taskLoad))}dispose(){for(let e=0;e<this.workerPool.length;++e)this.workerPool[e].terminate();return this.workerPool.length=0,""!==this.workerSourceURL&&URL.revokeObjectURL(this.workerSourceURL),this}}function DRACOWorker(){let e,t;function r(e,t,r,o,s,i){let a=i.num_components(),n=r.num_points(),d=n*a,l=d*s.BYTES_PER_ELEMENT,c=function e(t,r){switch(r){case Float32Array:return t.DT_FLOAT32;case Int8Array:return t.DT_INT8;case Int16Array:return t.DT_INT16;case Int32Array:return t.DT_INT32;case Uint8Array:return t.DT_UINT8;case Uint16Array:return t.DT_UINT16;case Uint32Array:return t.DT_UINT32}}(e,s),h=e._malloc(l);t.GetAttributeDataArrayForAllPoints(r,i,c,l,h);let u=new s(e.HEAPF32.buffer,h,d).slice();return e._free(h),{name:o,array:u,itemSize:a}}onmessage=function(o){let s=o.data;switch(s.type){case"init":e=s.decoderConfig,t=new Promise(function(t){e.onModuleLoaded=function(e){t({draco:e})},DracoDecoderModule(e)});break;case"decode":let i=s.buffer,a=s.taskConfig;t.then(e=>{let t=e.draco,o=new t.Decoder;try{let n=function e(t,o,s,i){let a=i.attributeIDs,n=i.attributeTypes,d,l,c=o.GetEncodedGeometryType(s);if(c===t.TRIANGULAR_MESH)d=new t.Mesh,l=o.DecodeArrayToMesh(s,s.byteLength,d);else if(c===t.POINT_CLOUD)d=new t.PointCloud,l=o.DecodeArrayToPointCloud(s,s.byteLength,d);else throw Error("THREE.DRACOLoader: Unexpected geometry type.");if(!l.ok()||0===d.ptr)throw Error("THREE.DRACOLoader: Decoding failed: "+l.error_msg());let h={index:null,attributes:[]};for(let u in a){let f=self[n[u]],y,k;if(i.useUniqueIDs)k=a[u],y=o.GetAttributeByUniqueId(d,k);else{if(-1===(k=o.GetAttributeId(d,t[a[u]])))continue;y=o.GetAttribute(d,k)}let p=r(t,o,d,u,f,y);"color"===u&&(p.vertexColorSpace=i.vertexColorSpace),h.attributes.push(p)}return c===t.TRIANGULAR_MESH&&(h.index=function e(t,r,o){let s=o.num_faces(),i=3*s,a=4*i,n=t._malloc(a);r.GetTrianglesUInt32Array(o,a,n);let d=new Uint32Array(t.HEAPF32.buffer,n,i).slice();return t._free(n),{array:d,itemSize:1}}(t,o,d)),t.destroy(d),h}(t,o,new Int8Array(i),a),d=n.attributes.map(e=>e.array.buffer);n.index&&d.push(n.index.array.buffer),self.postMessage({type:"decode",id:s.id,geometry:n},d)}catch(l){console.error(l),self.postMessage({type:"error",id:s.id,error:l.message})}finally{t.destroy(o)}})}}}export{DRACOLoader};