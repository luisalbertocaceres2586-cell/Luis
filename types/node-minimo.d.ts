/** Lo mínimo de CommonJS que usan los módulos UMD (para poder cargarse también en Node durante las pruebas). */
declare var module: any;
declare var exports: any;
declare function require(id: string): any;
declare var Buffer: any;
