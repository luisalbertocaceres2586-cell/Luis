// Pruebas del servidor (servidor/Code.gs) con una simulación de Google Sheets / Apps Script. Ejecutar: node tests/servidor.test.js
const vm=require('vm'),fs=require('fs'),crypto=require('crypto'),assert=require('assert');
// ---- mocks de Google ----
const C={n:0};
class Range{constructor(sh,r,c,nr,nc){this.sh=sh;this.r=r;this.c=c;this.nr=nr||1;this.nc=nc||1;return new Proxy(this,{get(t,k,rcv){return k in t?t[k]:(()=>rcv)}})}
 getValues(){C.n++;const o=[];for(let i=0;i<this.nr;i++){const row=[];for(let j=0;j<this.nc;j++)row.push(this.sh.get(this.r+i,this.c+j));o.push(row)}return o}
 getValue(){C.n++;return this.sh.get(this.r,this.c)}
 setValues(v){C.n++;for(let i=0;i<this.nr;i++)for(let j=0;j<this.nc;j++)this.sh.set(this.r+i,this.c+j,v[i][j]);return this}
 setValue(v){C.n++;for(let i=0;i<this.nr;i++)for(let j=0;j<this.nc;j++)this.sh.set(this.r+i,this.c+j,v);return this}
 setNumberFormat(f){for(let i=0;i<this.nr;i++)for(let j=0;j<this.nc;j++)this.sh.fmt[(this.r+i)+','+(this.c+j)]=f;return this}
 setFontWeight(){return this}setBackground(){return this}getRow(){return this.r}}
class Sheet{constructor(n){this.name=n;this.d=[];this.fmt={};this.max=100;this.active=[2,1]}
 get(r,c){const v=(this.d[r-1]||[])[c-1];return v===undefined?'':v}
 set(r,c,v){if(r>this.max)throw new Error('fuera de la hoja');
  // simula que Sheets convierte texto numérico a número salvo formato '@'
  if(typeof v==='string'&&/^\d+$/.test(v)&&this.fmt[r+','+c]!=='@')v=Number(v);
  (this.d[r-1]=this.d[r-1]||[])[c-1]=v}
 getLastRow(){C.n++;let l=0;this.d.forEach((r,i)=>{if(r&&r.some(x=>x!==''&&x!==undefined))l=i+1});return l}
 getMaxRows(){C.n++;return this.max}getMaxColumns(){return this.maxC||26}insertColumnsAfter(a,n){this.maxC=(this.maxC||26)+n}getRange(r,c,nr,nc){return new Range(this,r,c,nr,nc)}
 deleteRow(r){C.n++;this.d.splice(r-1,1)}deleteRows(r,k){C.n++;this.d.splice(r-1,k)}appendRow(a){C.n++;const r=this.getLastRow()+1;if(r>this.max)this.max=r+50;a.forEach((v,i)=>this.set(r,i+1,v))}insertRowsAfter(a,n){this.max+=n}setFrozenRows(){}getName(){return this.name}getActiveCell(){return new Range(this,...this.active)}clear(){this.d=[];this.fmt={}}getFilter(){return null}insertRowsAfter(a,n){this.max+=n}autoResizeColumns(){}setColumnWidth(){}}
const ss={setActiveSheet(sh){this.active=sh},sheets:{},getSheetByName(n){C.n++;return this.sheets[n]||null},insertSheet(n){return this.sheets[n]=new Sheet(n)}};
const props={alerts:[],prompts:[],alertBtn:'YES',dialogs:[]};
const ui={ButtonSet:{OK:'OK',OK_CANCEL:'OK_CANCEL',YES_NO:'YES_NO'},Button:{OK:'OK',YES:'YES',NO:'NO',CANCEL:'CANCEL'},
 alert(t,m){props.alerts.push([t,m===undefined?t:m]);return props.alertBtn},
 prompt(t,m){props.alerts.push([t,m]);const a=props.prompts.shift();return{getSelectedButton:()=>a===null?'CANCEL':'OK',getResponseText:()=>a||''}},
 createMenu(n){const m={n,items:[],addItem(l,f){this.items.push(f);return this},addSeparator(){return this},addSubMenu(s){this.items.push(...s.items);return this},addToUi(){props.menus=(props.menus||[]).concat(this)}};return m},
 showModalDialog(o,t){props.dialogs.push(t)}};
const cache={};const propStore={};const lock={n:0,falla:false};
const ctx={Logger:{log:m=>(global.__log=(global.__log||[]).concat(m))},console:{log(){},error(){},warn(){}},Date,JSON,Math,String,Number,parseInt,Error,
 SpreadsheetApp:{getActiveSpreadsheet:()=>ss,getUi:()=>ui,getActiveSheet:()=>ss.sheets.Users},
 Utilities:{computeDigest:(a,s)=>Array.from(crypto.createHash('sha256').update(s,'utf8').digest()).map(b=>b>127?b-256:b),getUuid:()=>crypto.randomUUID(),
  DigestAlgorithm:{SHA_256:1},Charset:{UTF_8:1},formatDate:(d,tz,p)=>{const z=n=>String(n).padStart(2,'0');return p.replace('yyyy',d.getUTCFullYear()).replace('dd',z(d.getUTCDate())).replace('MM',z(d.getUTCMonth()+1)).replace('HH',z(d.getUTCHours())).replace('mm',z(d.getUTCMinutes()))}},
 LockService:{getScriptLock:()=>({waitLock(){lock.n++;if(lock.falla)throw new Error('Lock timeout')},releaseLock(){}})},
 PropertiesService:{getScriptProperties:()=>({getProperties:()=>Object.assign({},propStore),setProperty:(k,v)=>{propStore[k]=String(v)}})},
 CacheService:{getScriptCache:()=>({get:k=>cache[k]||null,put:(k,v)=>cache[k]=v,remove:k=>delete cache[k]})},
 ContentService:{createTextOutput:t=>({t,getContent(){return t},setMimeType(){return this}}),MimeType:{JSON:1}},
 Logger:{log:m=>(global.__log=(global.__log||[]).concat(m))},Session:{getScriptTimeZone:()=>'America/Bogota'},ScriptApp:{getService:()=>({getUrl:()=>'https://script.google.com/macros/s/X/exec'})},
 HtmlService:{createHtmlOutput:h=>({setWidth(){return this},setHeight(){return this}})}};
propStore.EXIGIR_CONSENTIMIENTO='no';
vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','servidor','Code.gs'),'utf8'),ctx);
const limpiaRk=()=>Object.keys(cache).filter(k=>k.startsWith('rk_')).forEach(k=>delete cache[k]);
const call=(o)=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(o)}}).t);
const run=(f)=>vm.runInContext(f+'()',ctx);
(async()=>{
 // doGet y creación automática de pestaña
 assert.strictEqual(JSON.parse(ctx.doGet().t).ok,true);
 assert.deepStrictEqual(call({action:'check',nick:'antarez23'}),{ok:true,available:true});
 assert.ok(ss.sheets.Users,'crea la pestaña sola'); assert.strictEqual(ss.sheets.Users.get(1,1),'nick');
 assert.strictEqual(call({action:'check',nick:'a'}).error,'nick_invalido');
 // registro, duplicados (incluye apodo numérico) y mayúsculas
 let r=call({action:'register',nick:'antarez23',pass:'abcd',progress:{v:1,ts:5,datos:{x:'1'}}});assert.ok(r.ok&&r.token);
 assert.strictEqual(call({action:'register',nick:'ANTAREZ23',pass:'abcd'}).error,'nick_en_uso');
 assert.ok(call({action:'register',nick:'12345',pass:'abcd'}).ok);
 assert.strictEqual(call({action:'register',nick:'12345',pass:'zzzz'}).error,'nick_en_uso','apodo numérico no se duplica');
 assert.strictEqual(call({action:'check',nick:'12345'}).available,false);
 assert.strictEqual(call({action:'register',nick:'nuevo_1',pass:'12'}).error,'clave_corta');
 // login, varias sesiones, carga y guardado
 assert.strictEqual(call({action:'login',nick:'antarez23',pass:'mala'}).error,'credenciales');
 const l1=call({action:'login',nick:'antarez23',pass:'abcd'}), l2=call({action:'login',nick:'ANTAREZ23',pass:'abcd'});
 assert.ok(l1.ok&&l2.ok&&l1.token!==l2.token); assert.deepStrictEqual(l1.progress,{v:1,ts:5,datos:{x:'1'}});
 assert.ok(call({action:'load',nick:'antarez23',token:l1.token}).ok,'sesión 1 sigue viva tras entrar en otro dispositivo');
 assert.ok(call({action:'save',nick:'antarez23',token:l2.token,progress:{v:1,ts:9,datos:{x:'2'}}}).ok);
 assert.strictEqual(call({action:'load',nick:'antarez23',token:l1.token}).progress.datos.x,'2');
 assert.strictEqual(call({action:'save',nick:'antarez23',token:'falso',progress:{}}).error,'sesion');
 assert.strictEqual(call({action:'save',nick:'antarez23',token:l1.token,progress:{a:'x'.repeat(46000)}}).error,'muy_grande');
 for(let i=0;i<6;i++)call({action:'login',nick:'antarez23',pass:'abcd'});
 assert.strictEqual(call({action:'load',nick:'antarez23',token:l1.token}).error,'sesion','solo 5 sesiones');
 // bloqueo por intentos
 for(let i=0;i<5;i++)call({action:'login',nick:'12345',pass:'mala'});
 assert.strictEqual(call({action:'login',nick:'12345',pass:'abcd'}).error,'demasiados_intentos');
 // error de JSON no rompe
 assert.strictEqual(JSON.parse(ctx.doPost({postData:{contents:'xx'}}).t).error,'error_servidor');

 // ---- v2.1: código de rescate y claves ----
 const rg=call({action:'register',nick:'rescate_1',pass:'clave1'});
 assert.ok(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(rg.rescate),'formato XXXX-XXXX-XXXX: '+rg.rescate);
 assert.ok(ss.sheets.Users.get(ctx.findRow('rescate_1'),9)!=='' && !JSON.stringify(ss.sheets.Users.d).includes(rg.rescate),'solo se guarda el hash');
 assert.strictEqual(call({action:'login',nick:'rescate_1',pass:'clave1'}).tieneRescate,true);
 assert.strictEqual(call({action:'recover',nick:'rescate_1',codigo:'AAAA-BBBB-CCCC',newpass:'nueva9'}).error,'codigo_invalido');
 assert.strictEqual(call({action:'recover',nick:'rescate_1',codigo:rg.rescate,newpass:'12'}).error,'clave_corta');
 const old=call({action:'login',nick:'rescate_1',pass:'clave1'}).token;
 const rc=call({action:'recover',nick:'rescate_1',codigo:rg.rescate.toLowerCase().replace(/-/g,' '),newpass:'nueva9'});
 assert.ok(rc.ok&&rc.token&&rc.rescate&&rc.rescate!==rg.rescate,'acepta minúsculas/espacios y rota el código');
 assert.strictEqual(call({action:'login',nick:'rescate_1',pass:'clave1'}).error,'credenciales');
 assert.ok(call({action:'login',nick:'rescate_1',pass:'nueva9'}).ok);
 assert.strictEqual(call({action:'load',nick:'rescate_1',token:old}).error,'sesion','recuperar cierra las otras sesiones');
 assert.strictEqual(call({action:'recover',nick:'rescate_1',codigo:rg.rescate,newpass:'otra99'}).error,'codigo_invalido','el código usado ya no sirve');
 for(let i=0;i<5;i++)call({action:'recover',nick:'rescate_1',codigo:'ZZZZ-ZZZZ-ZZZZ',newpass:'otra99'});
 assert.strictEqual(call({action:'recover',nick:'rescate_1',codigo:rc.rescate,newpass:'otra99'}).error,'demasiados_intentos','se bloquea tras 5 fallos');
 delete cache['rec_rescate_1'];
 // cambiar clave y generar código nuevo (piden la clave actual)
 const tk=call({action:'login',nick:'rescate_1',pass:'nueva9'}).token, tk2=call({action:'login',nick:'rescate_1',pass:'nueva9'}).token;
 assert.strictEqual(call({action:'changepass',nick:'rescate_1',token:tk,pass:'mala',newpass:'zzzz1'}).error,'credenciales');
 assert.strictEqual(call({action:'changepass',nick:'rescate_1',token:'x',pass:'nueva9',newpass:'zzzz1'}).error,'sesion');
 assert.ok(call({action:'changepass',nick:'rescate_1',token:tk,pass:'nueva9',newpass:'zzzz1'}).ok);
 assert.ok(call({action:'load',nick:'rescate_1',token:tk}).ok&&call({action:'load',nick:'rescate_1',token:tk2}).error==='sesion','cambiar clave deja solo esta sesión');
 assert.ok(call({action:'login',nick:'rescate_1',pass:'zzzz1'}).ok);
 const nr=call({action:'newrescue',nick:'rescate_1',token:tk,pass:'zzzz1'});assert.ok(nr.ok&&nr.rescate);
 assert.strictEqual(call({action:'recover',nick:'rescate_1',codigo:rc.rescate,newpass:'otra99'}).error,'codigo_invalido','el código anterior se reemplaza');
 assert.ok(call({action:'recover',nick:'rescate_1',codigo:nr.rescate,newpass:'final9'}).ok);
 // cuenta antigua (sin columnas H:I): sigue entrando y puede generar su código
 const sh0=ss.sheets.Users;const ro=sh0.getLastRow()+1;
 ['viejo_v20','viejo_v20','s1',ctx.hash('vieja1','s1'),'tok1','{}',new Date()].forEach((v,i)=>sh0.set(ro,i+1,v));
 sh0.set(1,8,'');sh0.set(1,9,'');vm.runInContext('hojaRevisada_=false',ctx);delete cache['hoja_ok'];
 assert.strictEqual(call({action:'recover',nick:'viejo_v20',codigo:'AAAA-BBBB-CCCC',newpass:'abcd1'}).error,'sin_codigo');
 assert.strictEqual(sh0.get(1,8),'rescueSalt','agrega los encabezados H:I solo');
 const lv=call({action:'login',nick:'viejo_v20',pass:'vieja1'});assert.ok(lv.ok&&lv.tieneRescate===false);
 const nv=call({action:'newrescue',nick:'viejo_v20',token:lv.token,pass:'vieja1'});assert.ok(nv.ok);
 assert.ok(call({action:'recover',nick:'viejo_v20',codigo:nv.rescate,newpass:'nuevo77'}).ok);
 // menú: código de rescate
 props.prompts=['viejo_v20'];run('adminNuevoRescate');const am=props.alerts.pop()[1];const cod=/([A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4})/.exec(am)[1];
 assert.ok(call({action:'recover',nick:'viejo_v20',codigo:cod,newpass:'porfin1'}).ok);

 // ================= v2.2: clases, ranking y reportes =================
 const perfilJSON=(id,over)=>JSON.stringify({v:1,activo:id,perfiles:{[id]:Object.assign({id,nombre:id,progreso:{fase:'easy',nivel:2,puntos:100},nivel1:{completados:3},nivel2:{mejor:50,estrellas:2},nivel3:{mejor:25,estrellas:1},estadisticas:{aciertos:80,errores:20,minutos:42},maestria:{'7x8':{a:2,e:6,caja:0,t:1},'6x7':{a:5,e:3,caja:0,t:1},'2x3':{a:9,e:0,caja:4,t:1}}},over)}});
 const prog=(id,over)=>({v:1,ts:1,datos:{ninja_perfiles_v1:perfilJSON(id,over)}});
 const reg=(n,over,clase)=>{const r=call({action:'register',nick:n,pass:'abcd',progress:prog(n.toLowerCase(),over),clase});return r};
 // crear clase desde el menú
 props.alertBtn='YES';
 props.prompts=['3A Matemáticas'];run('adminCrearClase');
 const codA=/Código: ([A-Z2-9]{6})/.exec(props.alerts.pop()[1])[1];
 props.prompts=['3B'];run('adminCrearClase');const codB=/Código: ([A-Z2-9]{6})/.exec(props.alerts.pop()[1])[1];
 props.prompts=['3a matemáticas'];run('adminCrearClase');assert.ok(/Ya existe/.test(props.alerts.pop()[1]),'no repite nombres');
 assert.notStrictEqual(codA,codB);
 assert.deepStrictEqual(call({action:'checkclass',codigo:codA.toLowerCase()}),{ok:true,valid:true,nombre:'3A Matemáticas'});
 assert.strictEqual(call({action:'checkclass',codigo:'ZZZZZZ'}).valid,false);
 // registrar con clase mala no crea la cuenta; con clase buena sí
 assert.strictEqual(reg('Ana_3A',{}, 'ZZZZZZ').error,'clase_invalida');assert.strictEqual(call({action:'check',nick:'Ana_3A'}).available,true);
 const rAna=reg('Ana_3A',{progreso:{fase:'easy',nivel:2,puntos:300}},codA.slice(0,3)+'-'+codA.slice(3));
 assert.ok(rAna.ok&&rAna.cuenta.clase.codigo===codA&&rAna.cuenta.clase.nombre==='3A Matemáticas'&&rAna.cuenta.ranking===true);
 const shU=ss.sheets.Users; const filaAna=ctx.findRow('Ana_3A');
 assert.strictEqual(shU.get(filaAna,10),codA); assert.strictEqual(shU.get(filaAna,11),300+50+25,'puntaje = puntos + récord mundo 2 + récord mundo 3');
 assert.strictEqual(call({action:'login',nick:'ana_3a',pass:'abcd'}).cuenta.clase.codigo,codA);
 // más alumnos: puntajes y un empate
 const rBen=reg('Ben_3A',{progreso:{fase:'easy',nivel:1,puntos:100}},codA);          // 175
 const rCar=reg('Car_3A',{progreso:{fase:'easy',nivel:1,puntos:100}},codA);          // 175 (empate)
 const rDan=reg('Dan_3B',{progreso:{fase:'easy',nivel:1,puntos:900}},codB);          // 975
 const rEva=reg('Eva_sola',{progreso:{fase:'easy',nivel:1,puntos:10}});              // 85, sin clase
 const rOcu=reg('Ocu_3A',{progreso:{fase:'easy',nivel:1,puntos:5000}},codA);         // 5075 pero se oculta
 assert.ok(call({action:'setranking',nick:'Ocu_3A',token:rOcu.token,visible:false}).cuenta.ranking===false);
 limpiaRk();
 let t=call({action:'top',nick:'Ana_3A',token:rAna.token,ambito:'todos'});
 assert.deepStrictEqual(t.top.map(x=>x.nick),['Dan_3B','Ana_3A','Ben_3A','Car_3A','Eva_sola'],'orden por puntaje; el oculto no aparece');
 assert.deepStrictEqual(t.top.map(x=>x.pos),[1,2,3,3,5],'empates comparten posición');
 assert.ok(t.yo.pos===2&&t.yo.puntaje===375&&t.top[1].yo===true&&t.total===5);
 t=call({action:'top',nick:'Ana_3A',token:rAna.token,ambito:'clase'});
 assert.deepStrictEqual(t.top.map(x=>x.nick),['Ana_3A','Ben_3A','Car_3A']);assert.strictEqual(t.clase.nombre,'3A Matemáticas');
 t=call({action:'top',nick:'Ana_3A',token:rAna.token,ambito:'todos',limite:2});assert.strictEqual(t.top.length,2);
 t=call({action:'top',nick:'Car_3A',token:rCar.token,ambito:'todos',limite:2});assert.ok(t.yo.pos===3&&t.top.every(x=>!x.yo),'quien está fuera del Top ve su posición');
 t=call({action:'top',nick:'Ocu_3A',token:rOcu.token,ambito:'todos'});assert.ok(t.oculto===true&&t.yo===null,'el oculto no ve su posición');
 assert.strictEqual(call({action:'top',nick:'Eva_sola',token:rEva.token,ambito:'clase'}).error,'sin_clase');
 assert.strictEqual(call({action:'top',nick:'Eva_sola',token:'falso',ambito:'todos'}).error,'sesion');
 assert.ok(call({action:'setranking',nick:'Ocu_3A',token:rOcu.token,visible:true}).cuenta.ranking);limpiaRk();
 assert.strictEqual(call({action:'top',nick:'Ana_3A',token:rAna.token,ambito:'todos'}).top[0].nick,'Ocu_3A');
 // guardar actualiza el puntaje (y por tanto el ranking)
 assert.ok(call({action:'save',nick:'Eva_sola',token:rEva.token,progress:prog('eva_sola',{progreso:{fase:'easy',nivel:3,puntos:2000}})}).ok);
 assert.strictEqual(shU.get(ctx.findRow('Eva_sola'),11),2075);
 assert.strictEqual(call({action:'load',nick:'Eva_sola',token:rEva.token}).cuenta.clase,null);
 // unirse / salir de una clase
 assert.strictEqual(call({action:'joinclass',nick:'Eva_sola',token:rEva.token,codigo:'ZZZZZZ'}).error,'clase_invalida');
 const jc=call({action:'joinclass',nick:'Eva_sola',token:rEva.token,codigo:codB});assert.ok(jc.ok&&jc.cuenta.clase.codigo===codB);
 assert.strictEqual(call({action:'joinclass',nick:'Eva_sola',token:rEva.token,codigo:''}).cuenta.clase,null);
 for(let i=0;i<5;i++)call({action:'joinclass',nick:'Eva_sola',token:rEva.token,codigo:'QQQQQQ'});
 assert.strictEqual(call({action:'joinclass',nick:'Eva_sola',token:rEva.token,codigo:codB}).error,'demasiados_intentos');delete cache['jc_eva_sola'];
 // menú: ver / asignar / desactivar / cambiar código
 run('adminVerClases');assert.ok(/3A Matemáticas[\s\S]*Alumnos: 4/.test(props.alerts.pop()[1]));
 props.prompts=['Eva_sola','3B'];run('adminAsignarClase');assert.strictEqual(shU.get(ctx.findRow('Eva_sola'),10),codB);
 props.prompts=[codB.toLowerCase()];run('adminAlternarClase');assert.ok(/desactivada/.test(props.alerts.pop()[0]));
 assert.strictEqual(call({action:'checkclass',codigo:codB}).valid,false);assert.strictEqual(reg('Fer_3B',{},codB).error,'clase_invalida','clase desactivada no admite nuevos');
 assert.strictEqual(call({action:'login',nick:'Dan_3B',pass:'abcd'}).cuenta.clase.codigo,codB,'los que ya estaban se quedan');
 props.prompts=['3B'];run('adminAlternarClase');assert.strictEqual(call({action:'checkclass',codigo:codB}).valid,true);
 props.alertBtn='NO';props.prompts=['3B'];run('adminCambiarCodigoClase');assert.strictEqual(call({action:'checkclass',codigo:codB}).valid,true,'cancelar no cambia nada');
 props.alertBtn='YES';props.prompts=['3B'];run('adminCambiarCodigoClase');
 const codB2=/Código nuevo: ([A-Z2-9]{6})/.exec(props.alerts.pop()[1])[1];
 assert.ok(codB2!==codB&&call({action:'checkclass',codigo:codB}).valid===false&&call({action:'checkclass',codigo:codB2}).valid===true);
 assert.strictEqual(shU.get(ctx.findRow('Dan_3B'),10),codB2,'los alumnos pasan al código nuevo');
 // ---- reportes ----
 const celdas=(sh)=>sh.d.map(r=>(r||[]).map(x=>x instanceof Date?'<fecha>':String(x)));
 const buscar=(sh,txt)=>celdas(sh).findIndex(r=>r[0]===txt);
 props.prompts=['3A Matemáticas'];run('adminReporteClase');
 let R=ss.sheets['Reporte'];assert.ok(R&&/Reporte — 3A Matemáticas/.test(R.get(1,1)));assert.ok(/Reporte listo/.test(props.alerts.pop()[0]));
 let rcl=celdas(R);const iCab=buscar(R,'Apodo');
 assert.deepStrictEqual(rcl.slice(iCab+1).map(r=>r[0]).filter(Boolean),['Ocu_3A','Ana_3A','Ben_3A','Car_3A'],'alumnos de la clase, por puntaje');
 assert.strictEqual(rcl[buscar(R,'Alumnos')][1],'4');
 assert.ok(rcl.some(r=>r[0]==='7×8'&&r[3]==='0.75'),'tabla difícil del grupo: 7×8 con 75% de error ('+JSON.stringify(rcl.find(r=>r[0]==='7×8'))+')');
 const filaAnaRep=rcl[iCab+1+rcl.slice(iCab+1).findIndex(r=>r[0]==='Ana_3A')];
 assert.ok(filaAnaRep[1]==='3A Matemáticas'&&filaAnaRep[5]==='375'&&filaAnaRep[12]==='42'&&filaAnaRep[16].startsWith('7×8 (75%)'),'fila del alumno: '+JSON.stringify(filaAnaRep));
 run('adminReporteTodos');rcl=celdas(ss.sheets['Reporte']);assert.ok(/Todos los alumnos/.test(rcl[0][0]),'reemplaza el reporte anterior');
 props.prompts=['Ana_3A'];run('adminReporteAlumno');const RA=ss.sheets['Reporte alumno'];assert.ok(/Reporte de práctica — Ana_3A/.test(RA.get(1,1)));
 assert.ok(celdas(RA).some(r=>r[0]==='7×8')&&celdas(RA).some(r=>/Practicar las tablas del/.test(r[0])),'recomendaciones de práctica');
 // clase sin alumnos
 props.prompts=['Vacía 1'];run('adminCrearClase');props.alerts.pop();props.prompts=['Vacía 1'];run('adminReporteClase');assert.ok(/todavía no tiene alumnos/.test(props.alerts.pop()[1]));
 // ---- hoja de la versión anterior (9 columnas) se actualiza sola y "Reparar" recalcula puntajes ----
 const shOld=ss.sheets.Users;shOld.set(1,10,'');shOld.set(1,11,'');shOld.set(1,12,'');vm.runInContext('hojaRevisada_=false',ctx);delete cache['hoja_ok'];
 assert.ok(call({action:'check',nick:'zzz_nuevo'}).ok);assert.strictEqual(shOld.get(1,10),'clase');assert.strictEqual(shOld.get(1,12),'ocultoRanking');
 shOld.set(ctx.findRow('Ben_3A'),11,0);run('adminReparar');assert.strictEqual(shOld.get(ctx.findRow('Ben_3A'),11),175,'recalcula el puntaje desde el progreso');

 // ================= v3.0: rendimiento, registro, claves visibles y consentimiento =================
 const crypto2=require('crypto');
 const hashViejo=(pass,salt)=>{let h=salt+pass;for(let i=0;i<1000;i++)h=crypto2.createHash('sha256').update(h,'utf8').digest('hex');return h};
 // 1) el cifrado rápido da EXACTAMENTE lo mismo que el anterior (las claves ya guardadas siguen valiendo)
 ['abcd','clave1','ñandú','contraseña_con_ñ_y_tildes_áéíóú','😀🔑clave','x'.repeat(100),'日本語パスワード','a b c'].forEach(p=>{
   const salt=crypto2.randomUUID();assert.strictEqual(ctx.hash(p,salt),hashViejo(p,salt),'hash idéntico para '+p.slice(0,8));
   assert.strictEqual(ctx.hash(p,salt),ctx.hashLento_(p,salt));});
 const t0=Date.now();for(let i=0;i<20;i++)ctx.hash('prueba'+i,'sal');const msHash=(Date.now()-t0)/20;console.log('cifrado rápido (JS puro en Node):',msHash.toFixed(1),'ms por clave');
 // 2) una cuenta creada con el método ANTERIOR sigue entrando
 const shV=ss.sheets.Users;const rowV=shV.getLastRow()+1;const saltV=crypto2.randomUUID();
 [ 'antiguo_1','antiguo_1',saltV,hashViejo('claveVieja9',saltV),'tokViejo','{}',new Date(),'','','',0,'',''].forEach((v,i)=>shV.set(rowV,i+1,v));
 const lg0=call({action:'login',nick:'ANTIGUO_1',pass:'claveVieja9'});assert.ok(lg0.ok,'cuenta antigua entra con el cifrado nuevo');
 assert.strictEqual(call({action:'login',nick:'antiguo_1',pass:'otra'}).error,'credenciales');
 // 3) cuántas veces se bloquea y cuánto toca la hoja cada acción (cada llamada a Google cuesta tiempo real)
 const tok=(n,p)=>call({action:'login',nick:n,pass:p}).token;
 const medir=(o)=>{lock.n=0;C.n=0;const r=call(o);return {r,locks:lock.n,calls:C.n}};
 call({action:'register',nick:'carga_0',pass:'clave0',progress:prog('carga_0',{})});
 const tCarga=tok('carga_0','clave0');
 const M={};
 M.check=medir({action:'check',nick:'carga_0'});
 M.checkclass=medir({action:'checkclass',codigo:codA});
 M.config=medir({action:'config'});
 M.load=medir({action:'load',nick:'carga_0',token:tCarga});
 M.save=medir({action:'save',nick:'carga_0',token:tCarga,progress:prog('carga_0',{progreso:{puntos:7}})});
 limpiaRk();M.top=medir({action:'top',nick:'carga_0',token:tCarga,ambito:'todos'});
 M.login=medir({action:'login',nick:'carga_0',pass:'clave0'});
 M.register=medir({action:'register',nick:'carga_1',pass:'clave1',progress:prog('carga_1',{})});
 console.log('acción         bloqueos  llamadas a la hoja');
 Object.keys(M).forEach(k=>console.log(k.padEnd(14),String(M[k].locks).padEnd(9),M[k].calls));
 ['check','checkclass','config','load','save','top'].forEach(k=>assert.strictEqual(M[k].locks,0,k+' no debe bloquear a nadie'));
 assert.strictEqual(M.login.locks,1);assert.strictEqual(M.register.locks,1);
 assert.ok(M.save.calls<=4,'guardar toca la hoja pocas veces: '+M.save.calls);
 assert.ok(M.check.calls<=3,'revisar un apodo: '+M.check.calls);
 assert.ok(M.load.calls<=4&&M.login.calls<=7,'cargar/entrar: '+M.load.calls+'/'+M.login.calls);
 assert.ok(M.register.calls<=12,'registrar: '+M.register.calls);
 // 4) con el servidor saturado (no se consigue el bloqueo): leer y guardar siguen funcionando; lo que escribe pide reintentar
 lock.falla=true;
 assert.ok(call({action:'check',nick:'carga_0'}).ok&&call({action:'load',nick:'carga_0',token:tCarga}).ok&&call({action:'save',nick:'carga_0',token:tCarga,progress:prog('carga_0',{})}).ok,'leer/guardar no dependen del bloqueo');
 assert.strictEqual(call({action:'register',nick:'carga_2',pass:'clave2',progress:{}}).error,'ocupado');
 assert.strictEqual(call({action:'login',nick:'carga_0',pass:'clave0'}).error,'ocupado');
 lock.falla=false;assert.strictEqual(call({action:'check',nick:'carga_2'}).available,true,'no quedó a medias');
 // 5) la pista de fila en caché se corrige sola cuando las filas cambian de lugar
 const rBorra=call({action:'register',nick:'borra_a',pass:'clave1',progress:{}}),rQueda=call({action:'register',nick:'queda_b',pass:'clave1',progress:{}});
 call({action:'check',nick:'queda_b'});props.prompts=['borra_a','BORRAR'];run('adminBorrarUsuario');   // las filas de abajo suben un lugar
 assert.ok(call({action:'load',nick:'queda_b',token:rQueda.token}).ok,'sigue encontrándolo tras borrar una fila de arriba');
 assert.strictEqual(call({action:'check',nick:'borra_a'}).available,true);
 assert.strictEqual(call({action:'load',nick:'borra_a',token:rBorra.token}).error,'sesion');
 // 6) registro de eventos
 const REG=()=>(ss.sheets['Registro']?ss.sheets['Registro'].d.slice(1):[]).map(r=>r.map(x=>x instanceof Date?'<f>':String(x)));
 const antes=REG().length;
 ['mala1','mala2','mala3','mala4','mala5'].forEach(p=>call({action:'login',nick:'queda_b',pass:p}));
 call({action:'login',nick:'queda_b',pass:'clave1'});
 let ev=REG().slice(antes);
 assert.deepStrictEqual(ev.map(r=>r[1]),['login_fallido','login_fallido','login_fallido','login_fallido','bloqueo_por_intentos'],'intentos fallidos y bloqueo');
 assert.ok(/intento 1 de 5/.test(ev[0][3])&&ev[0][2]==='queda_b');
 delete cache['fail_queda_b'];
 assert.ok(!JSON.stringify(REG()).match(/mala[1-5]|clave1|clave0|claveVieja9|NuevaClave9/),'el registro NUNCA guarda claves');
 props.prompts=['queda_b','tempo88'];run('adminRestablecerClave');
 assert.ok(REG().some(r=>r[1]==='admin_clave_restablecida'&&r[2]==='queda_b'));
 assert.ok(REG().some(r=>r[1]==='admin_usuario_borrado'&&r[2]==='borra_a'));
 assert.ok(REG().some(r=>r[1]==='cuenta_creada'&&r[2]==='carga_0'));
 assert.ok(!JSON.stringify(REG()).includes('tempo88'));
 const trL=call({action:'login',nick:'queda_b',pass:'tempo88'}).token;
 call({action:'changepass',nick:'queda_b',token:trL,pass:'mala',newpass:'zzzz99'});call({action:'changepass',nick:'queda_b',token:trL,pass:'tempo88',newpass:'zzzz99'});
 assert.ok(REG().some(r=>r[1]==='cambio_clave_fallido')&&REG().some(r=>r[1]==='clave_cambiada'));
 props.prompts=['queda_b'];run('adminCerrarSesiones');assert.ok(REG().some(r=>r[1]==='admin_sesiones_cerradas'));
 // el registro nunca rompe el juego ni crece sin límite
 for(let i=0;i<130;i++)ctx.registrar_('prueba_flujo','x','n'+i);assert.ok(REG().length-antes<=200,'tope de eventos por minuto');
 Object.keys(cache).filter(k=>k.startsWith('lg_')).forEach(k=>delete cache[k]);   // el tope es por minuto: se reinicia para seguir probando
 // ver y limpiar el registro
 run('adminVerRegistro');assert.ok(/Hay \d+ evento/.test(props.alerts.pop()[1]));
 const shR=ss.sheets['Registro'];shR.set(2,1,new Date(Date.now()-400*86400000));shR.set(3,1,new Date(Date.now()-300*86400000));
 props.alertBtn='YES';props.prompts=['30'];const nAntes=shR.getLastRow();run('adminLimpiarRegistro');assert.ok(shR.getLastRow()<nAntes&&/Se borraron 2 evento/.test(props.alerts.pop()[0]));
 props.prompts=['5'];run('adminLimpiarRegistro');assert.ok(/30 o más/.test(props.alerts.pop()[0]));
 // 7) claves visibles para el administrador
 const colM=n=>shV.get(ctx.findRow(n),13);
 call({action:'register',nick:'vis_1',pass:'MiClave55',progress:{}});assert.strictEqual(colM('vis_1'),'MiClave55','se ve al registrarse');
 call({action:'register',nick:'vis_num',pass:'123456',progress:{}});assert.strictEqual(colM('vis_num'),'123456');assert.strictEqual(typeof colM('vis_num'),'string','una clave numérica sigue siendo texto');
 assert.strictEqual(colM('antiguo_1'),'claveVieja9','cuentas anteriores: aparece tras volver a entrar');
 const tv=call({action:'login',nick:'vis_1',pass:'MiClave55'}).token;
 assert.ok(call({action:'changepass',nick:'vis_1',token:tv,pass:'MiClave55',newpass:'Otra7777'}).ok);assert.strictEqual(colM('vis_1'),'Otra7777','cambiar clave actualiza la columna');
 const rcv=call({action:'newrescue',nick:'vis_1',token:tv,pass:'Otra7777'});
 const rec=call({action:'recover',nick:'vis_1',codigo:rcv.rescate,newpass:'Recup9999'});assert.ok(rec.ok);assert.strictEqual(colM('vis_1'),'Recup9999');
 props.prompts=['vis_1','AdminFijo1'];run('adminRestablecerClave');assert.strictEqual(colM('vis_1'),'AdminFijo1');assert.ok(call({action:'login',nick:'vis_1',pass:'AdminFijo1'}).ok);
 assert.strictEqual(call({action:'config'}).clavesVisibles,true);
 props.alertBtn='YES';run('adminAlternarClaves');   // desactivar: se borran todas
 assert.strictEqual(call({action:'config'}).clavesVisibles,false);assert.strictEqual(colM('vis_1'),'');assert.strictEqual(colM('antiguo_1'),'');
 call({action:'register',nick:'sin_vis',pass:'NoSeVe123',progress:{}});assert.strictEqual(colM('sin_vis'),'','desactivado: no se guarda');
 call({action:'login',nick:'sin_vis',pass:'NoSeVe123'});assert.strictEqual(colM('sin_vis'),'');
 assert.ok(!JSON.stringify(ss.sheets.Users.d).includes('NoSeVe123'));
 props.alertBtn='NO';run('adminAlternarClaves');assert.strictEqual(call({action:'config'}).clavesVisibles,false,'cancelar no cambia nada');
 props.alertBtn='YES';run('adminAlternarClaves');assert.strictEqual(call({action:'config'}).clavesVisibles,true);   // volver a activar
 assert.ok(REG().some(r=>r[1]==='admin_claves_visibles_desactivadas')&&REG().some(r=>r[1]==='admin_claves_visibles_activadas'));
 // 8) consentimiento de un adulto al crear la cuenta
 propStore.EXIGIR_CONSENTIMIENTO='si';
 assert.strictEqual(call({action:'config'}).exigeConsentimiento,true);
 assert.strictEqual(call({action:'register',nick:'sin_ok',pass:'clave1',progress:{}}).error,'sin_consentimiento');
 assert.strictEqual(call({action:'register',nick:'sin_ok',pass:'clave1',progress:{},consentimiento:{aceptado:false}}).error,'sin_consentimiento');
 assert.strictEqual(call({action:'check',nick:'sin_ok'}).available,true,'sin autorización no se crea la cuenta');
 assert.ok(call({action:'register',nick:'con_ok',pass:'clave1',progress:{},consentimiento:{aceptado:true,version:'1.0'}}).ok);
 assert.ok(/^v1\.0 · \d\d\/\d\d\/\d{4} \d\d:\d\d$/.test(shV.get(ctx.findRow('con_ok'),14)),'constancia: '+shV.get(ctx.findRow('con_ok'),14));
 assert.ok(REG().some(r=>r[1]==='cuenta_creada'&&r[2]==='con_ok'&&/autorización de adulto v1\.0/.test(r[3])));
 propStore.EXIGIR_CONSENTIMIENTO='no';
 // 9) datos del responsable, formato de autorización y exportación
 assert.deepStrictEqual([call({action:'config'}).responsable,call({action:'config'}).contacto],['','']);
 props.prompts=['Colegio San Luis','privacidad@colegio.edu.co'];run('adminDatosResponsable');
 assert.deepStrictEqual([call({action:'config'}).responsable,call({action:'config'}).contacto],['Colegio San Luis','privacidad@colegio.edu.co']);
 run('adminFormatoAutorizacion');assert.ok(/Formato listo/.test(props.alerts.pop()[0]),'el formato termina bien');assert.ok(REG().some(r=>r[1]==='admin_formato_autorizacion'));const AU=ss.sheets['Autorización'];assert.ok(AU);const tx=AU.d.map(r=>String(r[0])).join('\n');
 assert.ok(/AUTORIZACIÓN DE LA FAMILIA/.test(tx)&&/Colegio San Luis/.test(tx)&&/privacidad@colegio\.edu\.co/.test(tx)&&/administrador del juego puede verla/.test(tx),'el formato refleja la configuración');
 assert.ok(/Ley|derechos/i.test(tx)&&/Superintendencia de Industria y Comercio/.test(tx)&&/NO se pide ni se guarda/.test(tx)||/Qué NO se pide/.test(tx));
 props.alertBtn='YES';run('adminAlternarClaves');run('adminFormatoAutorizacion');assert.ok(/se guarda cifrada; nadie puede verla/.test(ss.sheets['Autorización'].d.map(r=>String(r[0])).join('\n')),'el formato cambia si las claves no son visibles');run('adminAlternarClaves');
 props.prompts=['con_ok'];run('adminExportarUsuario');assert.ok(props.dialogs.some(d=>/Datos de con_ok/.test(d)));assert.ok(REG().some(r=>r[1]==='admin_exportacion'&&r[2]==='con_ok'));
 ['ayudaLegal','ayudaPrivacidad','ayudaUso','ayudaProblemas'].forEach(f=>run(f));
 // la prueba del servidor ahora mide y compara
 run('adminProbar');const pr=props.alerts.pop()[1];assert.ok(/Cifrar una clave/.test(pr)&&/mismo resultado/.test(pr),pr);
 console.log('v3 OK');
 // ---- menú ----
 assert.ok(props.menus===undefined); ctx.onOpen(); assert.strictEqual(props.menus.length,2);
 const fns=props.menus.flatMap(m=>m.items); fns.forEach(f=>assert.strictEqual(typeof ctx[f],'function',f+' existe'));
 console.log('menú:',fns.length,'opciones');
 const sh=ss.sheets.Users;
 run('adminResumen'); assert.ok(/Usuarios registrados: \d+/.test(props.alerts.pop()[1]));
 props.prompts=['antarez23'];run('adminBuscar'); assert.ok(/Sesiones abiertas: [1-5]/.test(props.alerts.pop()[1]));
 // restablecer con clave generada y personalizada
 cache['fail_12345']='5';
 props.prompts=['12345',''];run('adminRestablecerClave');const msg=props.alerts.pop()[1];const nueva=/Nueva clave: (\S+)/.exec(msg)[1];
 assert.strictEqual(nueva.length,6); assert.ok(call({action:'login',nick:'12345',pass:nueva}).ok,'entra con la temporal');
 props.prompts=['antarez23','NuevaClave9'];run('adminRestablecerClave');
 assert.strictEqual(call({action:'login',nick:'antarez23',pass:'abcd'}).error,'credenciales');
 assert.ok(call({action:'login',nick:'antarez23',pass:'NuevaClave9'}).ok);
 assert.strictEqual(call({action:'load',nick:'antarez23',token:l2.token}).error,'sesion','cierra sesiones viejas');
 // fila seleccionada (prompt vacío)
 const f12=ctx.findRow('12345');sh.active=[f12,1];props.prompts=[''];run('adminBuscar');assert.ok(/12345/.test(props.alerts.pop()[0]));
 // renombrar
 props.prompts=['antarez23','ANTAREZ_PRO'];run('adminRenombrar');
 assert.strictEqual(call({action:'check',nick:'antarez23'}).available,true);assert.strictEqual(call({action:'check',nick:'antarez_pro'}).available,false);
 props.prompts=['antarez_pro','12345'];run('adminRenombrar');assert.ok(/ya está en uso/.test(props.alerts.pop()[1]));
 // borrar progreso (YES)
 props.alertBtn='YES';props.prompts=['antarez_pro'];run('adminBorrarProgreso');
 const lg=call({action:'login',nick:'antarez_pro',pass:'NuevaClave9'});assert.deepStrictEqual(lg.progress,{});
 // cerrar sesiones
 props.prompts=['antarez_pro'];run('adminCerrarSesiones');assert.strictEqual(call({action:'load',nick:'antarez_pro',token:lg.token}).error,'sesion');
 // cerrar todas (NO cancela)
 const t12=call({action:'login',nick:'12345',pass:nueva}).token;
 props.alertBtn='NO';run('adminCerrarTodasSesiones');assert.ok(call({action:'load',nick:'12345',token:t12}).ok);
 props.alertBtn='YES';run('adminCerrarTodasSesiones');assert.strictEqual(call({action:'load',nick:'12345',token:t12}).error,'sesion');
 // borrar usuario: sin confirmar no borra; con BORRAR sí
 props.prompts=['12345','no'];run('adminBorrarUsuario');assert.strictEqual(call({action:'check',nick:'12345'}).available,false);
 props.prompts=['12345','BORRAR'];run('adminBorrarUsuario');assert.strictEqual(call({action:'check',nick:'12345'}).available,true);
 // inactivos
 call({action:'register',nick:'viejo_1',pass:'abcd'});const row=ctx.findRow('viejo_1');sh.set(row,7,new Date(Date.now()-100*86400000));
 props.prompts=['10'];run('adminBorrarInactivos');assert.ok(/30 o más/.test(props.alerts.pop()[0]));
 props.prompts=['90','BORRAR'];run('adminBorrarInactivos');assert.strictEqual(call({action:'check',nick:'viejo_1'}).available,true);
 assert.strictEqual(call({action:'check',nick:'antarez_pro'}).available,false,'activos no se tocan');
 // reparar: resincroniza nickLower tras edición manual y detecta repetidos
 sh.set(2,1,'EditadoMano');run('adminReparar');assert.strictEqual(call({action:'check',nick:'editadomano'}).available,false);
 call({action:'register',nick:'otro_9',pass:'abcd'});sh.set(ctx.findRow('otro_9'),1,'EDITADOMANO');run('adminReparar');assert.ok(/repetidos/.test(props.alerts.pop()[1]));
 run('adminProbar');assert.ok(/funciona/.test(props.alerts.pop()[1]));
 props.dialogs.length=0;['ayudaUso','ayudaProblemas','ayudaURL','ayudaPrivacidad','ayudaLegal'].forEach(f=>run(f));assert.strictEqual(props.dialogs.length,5);
 // errores del menú se muestran, no revientan
 ss.sheets={};ctx.SpreadsheetApp.getActiveSpreadsheet=()=>null;run('adminResumen');assert.ok(/no está dentro de una hoja/.test(props.alerts.pop()[1]));
 console.log('OK: todo el servidor y el menú pasaron');
})().catch(e=>{console.error(e);process.exit(1)});
