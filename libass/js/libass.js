// Note: Some Emscripten settings will significantly limit the speed of the generated code.
// Note: Some Emscripten settings may limit the speed of the generated code.
// TODO: " u s e   s t r i c t ";

try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function(filename) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename).toString();
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename).toString();
    }
    return ret;
  };

  Module['load'] = function(f) {
    globalEval(read(f));
  };

  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
} else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  Module['printErr'] = printErr;

  // Polyfill over SpiderMonkey/V8 differences
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function(f) { snarf(f) };
  }

  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
} else if (ENVIRONMENT_IS_WEB) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }

  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }

  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
} else if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...

  Module['load'] = importScripts;

} else {
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['printErr']) {
  Module['printErr'] = function(){};
}
if (!Module['print']) {
  Module['print'] = Module['printErr'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

  
// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  bitshift64: function (low, high, op, bits) {
    var ander = Math.pow(2, bits)-1;
    if (bits < 32) {
      switch (op) {
        case 'shl':
          return [low << bits, (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits))];
        case 'ashr':
          return [(((low >>> bits ) | ((high&ander) << (32 - bits))) >> 0) >>> 0, (high >> bits) >>> 0];
        case 'lshr':
          return [((low >>> bits) | ((high&ander) << (32 - bits))) >>> 0, high >>> bits];
      }
    } else if (bits == 32) {
      switch (op) {
        case 'shl':
          return [0, low];
        case 'ashr':
          return [high, (high|0) < 0 ? ander : 0];
        case 'lshr':
          return [high, 0];
      }
    } else { // bits > 32
      switch (op) {
        case 'shl':
          return [0, low << (bits - 32)];
        case 'ashr':
          return [(high >> (bits - 32)) >>> 0, (high|0) < 0 ? ander : 0];
        case 'lshr':
          return [high >>>  (bits - 32) , 0];
      }
    }
    abort('unknown bitshift64 op: ' + [value, op, bits]);
  },
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type[type.length-1] == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      assert(type.fields.length === struct.length, 'Number of named fields must match the type for ' + typeName);
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  addFunction: function (func) {
    var ret = FUNCTION_TABLE.length;
    FUNCTION_TABLE.push(func);
    FUNCTION_TABLE.push(0);
    return ret;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func) {
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        FUNCTION_TABLE[func].apply(null, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  stackAlloc: function stackAlloc(size) { var ret = STACKTOP;STACKTOP += size;STACKTOP = ((((STACKTOP)+3)>>2)<<2);assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"); return ret; },
  staticAlloc: function staticAlloc(size) { var ret = STATICTOP;STATICTOP += size;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function alignMemory(size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function makeBigInt(low,high,unsigned) { var ret = (unsigned ? (((low)>>>0)+(((high)>>>0)*4294967296)) : (((low)>>>0)+(((high)|0)*4294967296))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}



var CorrectionsMonitor = {
  MAX_ALLOWED: 0, // XXX
  corrections: 0,
  sigs: {},

  note: function(type, succeed, sig) {
    if (!succeed) {
      this.corrections++;
      if (this.corrections >= this.MAX_ALLOWED) abort('\n\nToo many corrections!');
    }
  },

  print: function() {
  }
};





//========================================
// Runtime essentials
//========================================

var __THREW__ = false; // Used in checking for thrown exceptions.

var ABORT = false;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;

function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Adding
//
//         __attribute__((used))
//
//       to the function definition will prevent that.
//
// Note: Closure optimizations will minify function names, making
//       functions no longer callable. If you run closure (on by default
//       in -O2 and above), you should export the functions you will call
//       by calling emcc with something like
//
//         -s EXPORTED_FUNCTIONS='["_func1","_func2"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  try {
    var func = eval('_' + ident);
  } catch(e) {
    try {
      func = globalScope['Module']['_' + ident]; // closure exported function
    } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
Module["ccall"] = ccall;

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  // TODO: optimize this, eval the whole function once instead of going through ccall each time
  return function() {
    return ccall(ident, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type[type.length-1] === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': HEAP32[((ptr)>>2)]=value; break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (tempDoubleF64[0]=value,HEAP32[((ptr)>>2)]=tempDoubleI32[0],HEAP32[(((ptr)+(4))>>2)]=tempDoubleI32[1]); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type[type.length-1] === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (tempDoubleI32[0]=HEAP32[((ptr)>>2)],tempDoubleI32[1]=HEAP32[(((ptr)+(4))>>2)],tempDoubleF64[0]);
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

// Allocates memory for some data and initializes it properly.

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;

function allocate(slab, types, allocator) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));

  if (zeroinit) {
      _memset(ret, 0, size);
      return ret;
  }
  
  var i = 0, type;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);
    i += Runtime.getNativeTypeSize(type);
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  var nullTerminated = typeof(length) == "undefined";
  var ret = "";
  var i = 0;
  var t;
  var nullByte = String.fromCharCode(0);
  while (1) {
    t = String.fromCharCode(HEAPU8[((ptr)+(i))]);
    if (nullTerminated && t == nullByte) { break; } else {}
    ret += t;
    i += 1;
    if (!nullTerminated && i == length) { break; }
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

function Array_stringify(array) {
  var ret = "";
  for (var i = 0; i < array.length; i++) {
    ret += String.fromCharCode(array[i]);
  }
  return ret;
}
Module['Array_stringify'] = Array_stringify;

// Memory management

var FUNCTION_TABLE; // XXX: In theory the indexes here can be equal to pointers to stacked or malloced memory. Such comparisons should
                    //      be false, but can turn out true. We should probably set the top bit to prevent such issues.

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  // TOTAL_MEMORY is the current size of the actual array, and STATICTOP is the new top.
  Module.printErr('Warning: Enlarging memory arrays, this is not fast! ' + [STATICTOP, TOTAL_MEMORY]);
  assert(STATICTOP >= TOTAL_MEMORY);
  assert(TOTAL_MEMORY > 4); // So the loop below will not be infinite
  while (TOTAL_MEMORY <= STATICTOP) { // Simple heuristic. Override enlargeMemory() if your program has something more optimal for it
    TOTAL_MEMORY = alignMemoryPage(2*TOTAL_MEMORY);
  }
  var oldHEAP8 = HEAP8;
  var buffer = new ArrayBuffer(TOTAL_MEMORY);
  HEAP8 = new Int8Array(buffer);
  HEAP16 = new Int16Array(buffer);
  HEAP32 = new Int32Array(buffer);
  HEAPU8 = new Uint8Array(buffer);
  HEAPU16 = new Uint16Array(buffer);
  HEAPU32 = new Uint32Array(buffer);
  HEAPF32 = new Float32Array(buffer);
  HEAPF64 = new Float64Array(buffer);
  HEAP8.set(oldHEAP8);
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 10485760;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
  assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
         'Cannot fallback to non-typed array case: Code is too specialized');

  var buffer = new ArrayBuffer(TOTAL_MEMORY);
  HEAP8 = new Int8Array(buffer);
  HEAP16 = new Int16Array(buffer);
  HEAP32 = new Int32Array(buffer);
  HEAPU8 = new Uint8Array(buffer);
  HEAPU16 = new Uint16Array(buffer);
  HEAPU32 = new Uint32Array(buffer);
  HEAPF32 = new Float32Array(buffer);
  HEAPF64 = new Float64Array(buffer);

  // Endianness check (note: assumes compiler arch was little-endian)
  HEAP32[0] = 255;
  assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

var base = intArrayFromString('(null)'); // So printing %s of NULL gives '(null)'
                                         // Also this ensures we leave 0 as an invalid address, 'NULL'
STATICTOP = base.length;
for (var i = 0; i < base.length; i++) {
  HEAP8[(i)]=base[i]
}

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

STACK_ROOT = STACKTOP = Runtime.alignMemory(STATICTOP);
STACK_MAX = STACK_ROOT + TOTAL_STACK;

var tempDoublePtr = Runtime.alignMemory(STACK_MAX, 8);
var tempDoubleI8  = HEAP8.subarray(tempDoublePtr);
var tempDoubleI32 = HEAP32.subarray(tempDoublePtr >> 2);
var tempDoubleF32 = HEAPF32.subarray(tempDoublePtr >> 2);
var tempDoubleF64 = HEAPF64.subarray(tempDoublePtr >> 3);
function copyTempFloat(ptr) { // functions, because inlining this code is increases code size too much
  tempDoubleI8[0] = HEAP8[ptr];
  tempDoubleI8[1] = HEAP8[ptr+1];
  tempDoubleI8[2] = HEAP8[ptr+2];
  tempDoubleI8[3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  tempDoubleI8[0] = HEAP8[ptr];
  tempDoubleI8[1] = HEAP8[ptr+1];
  tempDoubleI8[2] = HEAP8[ptr+2];
  tempDoubleI8[3] = HEAP8[ptr+3];
  tempDoubleI8[4] = HEAP8[ptr+4];
  tempDoubleI8[5] = HEAP8[ptr+5];
  tempDoubleI8[6] = HEAP8[ptr+6];
  tempDoubleI8[7] = HEAP8[ptr+7];
}
STACK_MAX = tempDoublePtr + 8;

STATICTOP = alignMemoryPage(STACK_MAX);

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    var func = callback.func;
    if (typeof func === 'number') {
      func = FUNCTION_TABLE[func];
    }
    func(callback.arg === undefined ? null : callback.arg);
  }
}

var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown

function initRuntime() {
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);

  // Print summary of correction activity
  CorrectionsMonitor.print();
}

function String_len(ptr) {
  var i = 0;
  while (HEAP8[((ptr)+(i))]) i++; // Note: should be |!= 0|, technically. But this helps catch bugs with undefineds
  return i;
}
Module['String_len'] = String_len;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = [];
  var t;
  var i = 0;
  if (length === undefined) {
    length = stringy.length;
  }
  while (i < length) {
    var chr = stringy.charCodeAt(i);
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + stringy[i] + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(chr);
    i = i + 1;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var i = 0;
  while (i < string.length) {
    var chr = string.charCodeAt(i);
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + string[i] + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    HEAP8[((buffer)+(i))]=chr
    i = i + 1;
  }
  if (!dontAddNull) {
    HEAP8[((buffer)+(i))]=0
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[((buffer)+(i))]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

var STRING_TABLE = [];

function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
  // TODO: clean up previous line
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
function addRunDependency() {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency() {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) run();
}
Module['removeRunDependency'] = removeRunDependency;

// === Body ===




function _malloc($bytes) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $bytes_addr;
      var $mem;
      var $nb;
      var $idx;
      var $smallbits;
      var $b;
      var $p;
      var $F;
      var $b33;
      var $p34;
      var $r;
      var $rsize;
      var $i;
      var $leftbits;
      var $leastbit;
      var $Y;
      var $K;
      var $N;
      var $F68;
      var $DVS;
      var $DV;
      var $I;
      var $B;
      var $F102;
      var $rsize157;
      var $p159;
      var $r163;
      var $dvs;
      var $rsize185;
      var $p187;
      var $r188;
      $bytes_addr=$bytes;
      var $0=$bytes_addr; //@line 4628 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)>>>0) <= 244; //@line 4628 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 38; break; } //@line 4628 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $1=$bytes_addr; //@line 4631 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($1)>>>0) < 11; //@line 4631 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 4; break; } else { __label__ = 5; break; } //@line 4631 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $cond = 16;__label__ = 6; break; //@line 4631 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $2=$bytes_addr; //@line 4631 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($2)+(4))|0); //@line 4631 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add2=((($add)+(7))|0); //@line 4631 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$add2 & -8; //@line 4631 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $and;__label__ = 6; break; //@line 4631 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $cond; //@line 4631 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $nb=$cond; //@line 4631 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=$nb; //@line 4632 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr=$3 >>> 3; //@line 4632 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $idx=$shr; //@line 4632 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=HEAPU32[((((__gm_)|0))>>2)]; //@line 4633 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=$idx; //@line 4633 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr3=$4 >>> (($5)>>>0); //@line 4633 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $smallbits=$shr3; //@line 4633 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=$smallbits; //@line 4635 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and4=$6 & 3; //@line 4635 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp5=(($and4)|0)!=0; //@line 4635 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp5) { __label__ = 7; break; } else { __label__ = 14; break; } //@line 4635 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $7=$smallbits; //@line 4637 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg=$7 ^ -1; //@line 4637 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and7=$neg & 1; //@line 4637 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=$idx; //@line 4637 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add8=((($8)+($and7))|0); //@line 4637 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $idx=$add8; //@line 4637 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $9=$idx; //@line 4638 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl=$9 << 1; //@line 4638 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=((((__gm_+40)|0)+($shl<<2))|0); //@line 4638 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=$arrayidx; //@line 4638 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=$10; //@line 4638 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $b=$11; //@line 4638 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=$b; //@line 4639 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd=(($12+8)|0); //@line 4639 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $13=HEAP32[(($fd)>>2)]; //@line 4639 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p=$13; //@line 4639 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=$p; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd9=(($14+8)|0); //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $15=HEAP32[(($fd9)>>2)]; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F=$15; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=$b; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $17=$F; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp10=(($16)|0)==(($17)|0); //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp10) { __label__ = 8; break; } else { __label__ = 9; break; } //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $18=$idx; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl12=1 << $18; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg13=$shl12 ^ -1; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $19=HEAP32[((((__gm_)|0))>>2)]; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and14=$19 & $neg13; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_)|0))>>2)]=$and14; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 13; break; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $20=$F; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=$20; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $22=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp15=(($21)>>>0) >= (($22)>>>0); //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv=(($cmp15)&1); //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval=(($conv)==(1)); //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($expval)|0)!=0; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool) { __label__ = 10; break; } else { __label__ = 11; break; } //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $23=$F; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $24=$b; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd17=(($24+8)|0); //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd17)>>2)]=$23; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $25=$b; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $26=$F; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk=(($26+12)|0); //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk)>>2)]=$25; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 12; break; //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      _abort(); //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4641 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      __label__ = 13; break;
    case 13: 
      var $27=$idx; //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl20=$27 << 3; //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or=$shl20 | 1; //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or21=$or | 2; //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=$p; //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($28+4)|0); //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head)>>2)]=$or21; //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $29=$p; //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $30=$29; //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $31=$idx; //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl22=$31 << 3; //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($30+$shl22)|0); //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $32=$add_ptr; //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head23=(($32+4)|0); //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $33=HEAP32[(($head23)>>2)]; //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or24=$33 | 1; //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head23)>>2)]=$or24; //@line 4642 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $34=$p; //@line 4643 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $35=$34; //@line 4643 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr25=(($35+8)|0); //@line 4643 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mem=$add_ptr25; //@line 4643 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 54; break; //@line 4645 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $36=$nb; //@line 4648 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $37=HEAPU32[((((__gm_+8)|0))>>2)]; //@line 4648 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp27=(($36)>>>0) > (($37)>>>0); //@line 4648 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp27) { __label__ = 15; break; } else { __label__ = 36; break; } //@line 4648 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $38=$smallbits; //@line 4649 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp30=(($38)|0)!=0; //@line 4649 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp30) { __label__ = 16; break; } else { __label__ = 31; break; } //@line 4649 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 16: 
      var $39=$smallbits; //@line 4653 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $40=$idx; //@line 4653 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl35=$39 << $40; //@line 4653 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $41=$idx; //@line 4653 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl36=1 << $41; //@line 4653 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl37=$shl36 << 1; //@line 4653 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $42=$idx; //@line 4653 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl38=1 << $42; //@line 4653 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl39=$shl38 << 1; //@line 4653 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=(((-$shl39))|0); //@line 4653 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or40=$shl37 | $sub; //@line 4653 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and41=$shl35 & $or40; //@line 4653 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $leftbits=$and41; //@line 4653 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $43=$leftbits; //@line 4654 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $44=$leftbits; //@line 4654 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub42=(((-$44))|0); //@line 4654 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and43=$43 & $sub42; //@line 4654 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $leastbit=$and43; //@line 4654 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $45=$leastbit; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub44=((($45)-(1))|0); //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$sub44; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $46=$Y; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr45=$46 >>> 12; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and46=$shr45 & 16; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and46; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $47=$K; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$47; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $48=$K; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $49=$Y; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr47=$49 >>> (($48)>>>0); //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shr47; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $50=$Y; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr48=$50 >>> 5; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and49=$shr48 & 8; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and49; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $51=$N; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add50=((($51)+($and49))|0); //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add50; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $52=$K; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $53=$Y; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr51=$53 >>> (($52)>>>0); //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shr51; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $54=$Y; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr52=$54 >>> 2; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and53=$shr52 & 4; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and53; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $55=$N; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add54=((($55)+($and53))|0); //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add54; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $56=$K; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $57=$Y; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr55=$57 >>> (($56)>>>0); //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shr55; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $58=$Y; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr56=$58 >>> 1; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and57=$shr56 & 2; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and57; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $59=$N; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add58=((($59)+($and57))|0); //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add58; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $60=$K; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $61=$Y; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr59=$61 >>> (($60)>>>0); //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shr59; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $62=$Y; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr60=$62 >>> 1; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and61=$shr60 & 1; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and61; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $63=$N; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add62=((($63)+($and61))|0); //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add62; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $64=$K; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $65=$Y; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr63=$65 >>> (($64)>>>0); //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shr63; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $66=$N; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $67=$Y; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add64=((($66)+($67))|0); //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $i=$add64; //@line 4655 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $68=$i; //@line 4656 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl65=$68 << 1; //@line 4656 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx66=((((__gm_+40)|0)+($shl65<<2))|0); //@line 4656 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $69=$arrayidx66; //@line 4656 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $70=$69; //@line 4656 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $b33=$70; //@line 4656 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $71=$b33; //@line 4657 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd67=(($71+8)|0); //@line 4657 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $72=HEAP32[(($fd67)>>2)]; //@line 4657 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p34=$72; //@line 4657 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $73=$p34; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd69=(($73+8)|0); //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $74=HEAP32[(($fd69)>>2)]; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F68=$74; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $75=$b33; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $76=$F68; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp70=(($75)|0)==(($76)|0); //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp70) { __label__ = 17; break; } else { __label__ = 18; break; } //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $77=$i; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl73=1 << $77; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg74=$shl73 ^ -1; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $78=HEAP32[((((__gm_)|0))>>2)]; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and75=$78 & $neg74; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_)|0))>>2)]=$and75; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 22; break; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $79=$F68; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $80=$79; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $81=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp77=(($80)>>>0) >= (($81)>>>0); //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv78=(($cmp77)&1); //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval79=(($conv78)==(1)); //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool80=(($expval79)|0)!=0; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool80) { __label__ = 19; break; } else { __label__ = 20; break; } //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $82=$F68; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $83=$b33; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd82=(($83+8)|0); //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd82)>>2)]=$82; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $84=$b33; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $85=$F68; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk83=(($85+12)|0); //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk83)>>2)]=$84; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 21; break; //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 20: 
      _abort(); //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4659 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 21: 
      __label__ = 22; break;
    case 22: 
      var $86=$i; //@line 4660 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl87=$86 << 3; //@line 4660 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $87=$nb; //@line 4660 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub88=((($shl87)-($87))|0); //@line 4660 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rsize=$sub88; //@line 4660 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $88=$nb; //@line 4665 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or89=$88 | 1; //@line 4665 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or90=$or89 | 2; //@line 4665 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $89=$p34; //@line 4665 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head91=(($89+4)|0); //@line 4665 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head91)>>2)]=$or90; //@line 4665 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $90=$p34; //@line 4666 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $91=$90; //@line 4666 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $92=$nb; //@line 4666 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr92=(($91+$92)|0); //@line 4666 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $93=$add_ptr92; //@line 4666 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $r=$93; //@line 4666 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $94=$rsize; //@line 4667 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or93=$94 | 1; //@line 4667 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $95=$r; //@line 4667 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head94=(($95+4)|0); //@line 4667 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head94)>>2)]=$or93; //@line 4667 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $96=$rsize; //@line 4667 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $97=$r; //@line 4667 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $98=$97; //@line 4667 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $99=$rsize; //@line 4667 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr95=(($98+$99)|0); //@line 4667 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $100=$add_ptr95; //@line 4667 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($100)|0); //@line 4667 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot)>>2)]=$96; //@line 4667 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $101=HEAP32[((((__gm_+8)|0))>>2)]; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $DVS=$101; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $102=$DVS; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp96=(($102)|0)!=0; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp96) { __label__ = 23; break; } else { __label__ = 30; break; } //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 23: 
      var $103=HEAP32[((((__gm_+20)|0))>>2)]; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $DV=$103; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $104=$DVS; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr99=$104 >>> 3; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $I=$shr99; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $105=$I; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl100=$105 << 1; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx101=((((__gm_+40)|0)+($shl100<<2))|0); //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $106=$arrayidx101; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $107=$106; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $B=$107; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $108=$B; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F102=$108; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $109=HEAP32[((((__gm_)|0))>>2)]; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $110=$I; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl103=1 << $110; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and104=$109 & $shl103; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool105=(($and104)|0)!=0; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool105) { __label__ = 25; break; } else { __label__ = 24; break; } //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $111=$I; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl107=1 << $111; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $112=HEAP32[((((__gm_)|0))>>2)]; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or108=$112 | $shl107; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_)|0))>>2)]=$or108; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 29; break; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $113=$B; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd110=(($113+8)|0); //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $114=HEAP32[(($fd110)>>2)]; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $115=$114; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $116=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp111=(($115)>>>0) >= (($116)>>>0); //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv112=(($cmp111)&1); //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval113=(($conv112)==(1)); //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool114=(($expval113)|0)!=0; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool114) { __label__ = 26; break; } else { __label__ = 27; break; } //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $117=$B; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd116=(($117+8)|0); //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $118=HEAP32[(($fd116)>>2)]; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F102=$118; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 28; break; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 27: 
      _abort(); //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 28: 
      __label__ = 29; break;
    case 29: 
      var $119=$DV; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $120=$B; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd120=(($120+8)|0); //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd120)>>2)]=$119; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $121=$DV; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $122=$F102; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk121=(($122+12)|0); //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk121)>>2)]=$121; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $123=$F102; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $124=$DV; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd122=(($124+8)|0); //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd122)>>2)]=$123; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $125=$B; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $126=$DV; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk123=(($126+12)|0); //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk123)>>2)]=$125; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 30; break; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 30: 
      var $127=$rsize; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+8)|0))>>2)]=$127; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $128=$r; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+20)|0))>>2)]=$128; //@line 4668 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $129=$p34; //@line 4670 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $130=$129; //@line 4670 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr125=(($130+8)|0); //@line 4670 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mem=$add_ptr125; //@line 4670 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 54; break; //@line 4672 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $131=HEAP32[((((__gm_+4)|0))>>2)]; //@line 4675 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp127=(($131)|0)!=0; //@line 4675 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp127) { __label__ = 32; break; } else { __label__ = 34; break; } //@line 4675 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $132=$nb; //@line 4675 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call=_tmalloc_small(__gm_, $132); //@line 4675 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mem=$call; //@line 4675 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp129=(($call)|0)!=0; //@line 4675 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp129) { __label__ = 33; break; } else { __label__ = 34; break; } //@line 4675 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 33: 
      __label__ = 54; break; //@line 4677 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 34: 
      __label__ = 35; break;
    case 35: 
      __label__ = 36; break; //@line 4679 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 36: 
      __label__ = 37; break;
    case 37: 
      __label__ = 45; break; //@line 4680 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 38: 
      var $133=$bytes_addr; //@line 4681 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp137=(($133)>>>0) >= 4294967232; //@line 4681 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp137) { __label__ = 39; break; } else { __label__ = 40; break; } //@line 4681 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 39: 
      $nb=-1; //@line 4682 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 44; break; //@line 4682 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 40: 
      var $134=$bytes_addr; //@line 4684 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add141=((($134)+(4))|0); //@line 4684 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add142=((($add141)+(7))|0); //@line 4684 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and143=$add142 & -8; //@line 4684 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $nb=$and143; //@line 4684 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $135=HEAP32[((((__gm_+4)|0))>>2)]; //@line 4685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp144=(($135)|0)!=0; //@line 4685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp144) { __label__ = 41; break; } else { __label__ = 43; break; } //@line 4685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 41: 
      var $136=$nb; //@line 4685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call147=_tmalloc_large(__gm_, $136); //@line 4685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mem=$call147; //@line 4685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp148=(($call147)|0)!=0; //@line 4685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp148) { __label__ = 42; break; } else { __label__ = 43; break; } //@line 4685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 42: 
      __label__ = 54; break; //@line 4687 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 43: 
      __label__ = 44; break;
    case 44: 
      __label__ = 45; break;
    case 45: 
      var $137=$nb; //@line 4691 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $138=HEAPU32[((((__gm_+8)|0))>>2)]; //@line 4691 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp154=(($137)>>>0) <= (($138)>>>0); //@line 4691 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp154) { __label__ = 46; break; } else { __label__ = 50; break; } //@line 4691 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 46: 
      var $139=HEAP32[((((__gm_+8)|0))>>2)]; //@line 4692 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $140=$nb; //@line 4692 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub158=((($139)-($140))|0); //@line 4692 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rsize157=$sub158; //@line 4692 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $141=HEAP32[((((__gm_+20)|0))>>2)]; //@line 4693 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p159=$141; //@line 4693 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $142=$rsize157; //@line 4694 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp160=(($142)>>>0) >= 16; //@line 4694 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp160) { __label__ = 47; break; } else { __label__ = 48; break; } //@line 4694 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 47: 
      var $143=$p159; //@line 4695 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $144=$143; //@line 4695 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $145=$nb; //@line 4695 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr164=(($144+$145)|0); //@line 4695 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $146=$add_ptr164; //@line 4695 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+20)|0))>>2)]=$146; //@line 4695 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $r163=$146; //@line 4695 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $147=$rsize157; //@line 4696 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+8)|0))>>2)]=$147; //@line 4696 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $148=$rsize157; //@line 4697 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or165=$148 | 1; //@line 4697 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $149=$r163; //@line 4697 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head166=(($149+4)|0); //@line 4697 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head166)>>2)]=$or165; //@line 4697 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $150=$rsize157; //@line 4697 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $151=$r163; //@line 4697 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $152=$151; //@line 4697 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $153=$rsize157; //@line 4697 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr167=(($152+$153)|0); //@line 4697 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $154=$add_ptr167; //@line 4697 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot168=(($154)|0); //@line 4697 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot168)>>2)]=$150; //@line 4697 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $155=$nb; //@line 4698 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or169=$155 | 1; //@line 4698 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or170=$or169 | 2; //@line 4698 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $156=$p159; //@line 4698 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head171=(($156+4)|0); //@line 4698 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head171)>>2)]=$or170; //@line 4698 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 49; break; //@line 4699 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 48: 
      var $157=HEAP32[((((__gm_+8)|0))>>2)]; //@line 4701 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $dvs=$157; //@line 4701 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+8)|0))>>2)]=0; //@line 4702 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+20)|0))>>2)]=0; //@line 4703 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $158=$dvs; //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or173=$158 | 1; //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or174=$or173 | 2; //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $159=$p159; //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head175=(($159+4)|0); //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head175)>>2)]=$or174; //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $160=$p159; //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $161=$160; //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $162=$dvs; //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr176=(($161+$162)|0); //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $163=$add_ptr176; //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head177=(($163+4)|0); //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $164=HEAP32[(($head177)>>2)]; //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or178=$164 | 1; //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head177)>>2)]=$or178; //@line 4704 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 49; break;
    case 49: 
      var $165=$p159; //@line 4706 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $166=$165; //@line 4706 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr180=(($166+8)|0); //@line 4706 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mem=$add_ptr180; //@line 4706 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 54; break; //@line 4708 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 50: 
      var $167=$nb; //@line 4711 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $168=HEAPU32[((((__gm_+12)|0))>>2)]; //@line 4711 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp182=(($167)>>>0) < (($168)>>>0); //@line 4711 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp182) { __label__ = 51; break; } else { __label__ = 52; break; } //@line 4711 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 51: 
      var $169=$nb; //@line 4712 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $170=HEAP32[((((__gm_+12)|0))>>2)]; //@line 4712 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub186=((($170)-($169))|0); //@line 4712 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+12)|0))>>2)]=$sub186; //@line 4712 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rsize185=$sub186; //@line 4712 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $171=HEAP32[((((__gm_+24)|0))>>2)]; //@line 4713 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p187=$171; //@line 4713 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $172=$p187; //@line 4714 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $173=$172; //@line 4714 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $174=$nb; //@line 4714 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr189=(($173+$174)|0); //@line 4714 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $175=$add_ptr189; //@line 4714 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+24)|0))>>2)]=$175; //@line 4714 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $r188=$175; //@line 4714 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $176=$rsize185; //@line 4715 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or190=$176 | 1; //@line 4715 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $177=$r188; //@line 4715 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head191=(($177+4)|0); //@line 4715 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head191)>>2)]=$or190; //@line 4715 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $178=$nb; //@line 4716 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or192=$178 | 1; //@line 4716 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or193=$or192 | 2; //@line 4716 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $179=$p187; //@line 4716 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head194=(($179+4)|0); //@line 4716 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head194)>>2)]=$or193; //@line 4716 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $180=$p187; //@line 4717 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $181=$180; //@line 4717 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr195=(($181+8)|0); //@line 4717 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mem=$add_ptr195; //@line 4717 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 54; break; //@line 4720 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 52: 
      __label__ = 53; break;
    case 53: 
      var $182=$nb; //@line 4723 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call198=_sys_alloc(__gm_, $182); //@line 4723 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mem=$call198; //@line 4723 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 54; break; //@line 4723 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 54: 
      var $183=$mem; //@line 4727 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $183; //@line 4727 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
Module["_malloc"] = _malloc;_malloc["X"]=1;

function _tmalloc_small($m, $nb) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $nb_addr;
      var $t;
      var $v;
      var $rsize;
      var $i;
      var $leastbit;
      var $Y;
      var $K;
      var $N;
      var $trem;
      var $r;
      var $XP;
      var $R;
      var $F;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $DVS;
      var $DV;
      var $I;
      var $B;
      var $F191;
      $m_addr=$m;
      $nb_addr=$nb;
      var $0=$m_addr; //@line 4268 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap=(($0+4)|0); //@line 4268 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1=HEAP32[(($treemap)>>2)]; //@line 4268 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$m_addr; //@line 4268 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap1=(($2+4)|0); //@line 4268 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=HEAP32[(($treemap1)>>2)]; //@line 4268 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=(((-$3))|0); //@line 4268 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$1 & $sub; //@line 4268 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $leastbit=$and; //@line 4268 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=$leastbit; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub2=((($4)-(1))|0); //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$sub2; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=$Y; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr=$5 >>> 12; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and3=$shr & 16; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and3; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=$K; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$6; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$K; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=$Y; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr4=$8 >>> (($7)>>>0); //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shr4; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $9=$Y; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr5=$9 >>> 5; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and6=$shr5 & 8; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and6; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=$N; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($10)+($and6))|0); //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=$K; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=$Y; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr7=$12 >>> (($11)>>>0); //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shr7; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $13=$Y; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr8=$13 >>> 2; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and9=$shr8 & 4; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and9; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=$N; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add10=((($14)+($and9))|0); //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add10; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $15=$K; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=$Y; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr11=$16 >>> (($15)>>>0); //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shr11; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $17=$Y; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr12=$17 >>> 1; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and13=$shr12 & 2; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and13; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $18=$N; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add14=((($18)+($and13))|0); //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add14; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $19=$K; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=$Y; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr15=$20 >>> (($19)>>>0); //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shr15; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=$Y; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr16=$21 >>> 1; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and17=$shr16 & 1; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and17; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $22=$N; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add18=((($22)+($and17))|0); //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add18; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $23=$K; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $24=$Y; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr19=$24 >>> (($23)>>>0); //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shr19; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $25=$N; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $26=$Y; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add20=((($25)+($26))|0); //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $i=$add20; //@line 4269 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $27=$i; //@line 4270 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=$m_addr; //@line 4270 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treebins=(($28+304)|0); //@line 4270 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=(($treebins+($27<<2))|0); //@line 4270 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $29=HEAP32[(($arrayidx)>>2)]; //@line 4270 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $t=$29; //@line 4270 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $v=$29; //@line 4270 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $30=$t; //@line 4271 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($30+4)|0); //@line 4271 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $31=HEAP32[(($head)>>2)]; //@line 4271 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and21=$31 & -8; //@line 4271 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $32=$nb_addr; //@line 4271 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub22=((($and21)-($32))|0); //@line 4271 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rsize=$sub22; //@line 4271 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 3; break; //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $33=$t; //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child=(($33+16)|0); //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx23=(($child)|0); //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $34=HEAP32[(($arrayidx23)>>2)]; //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($34)|0)!=0; //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 4; break; } else { __label__ = 5; break; } //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $35=$t; //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child24=(($35+16)|0); //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx25=(($child24)|0); //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $36=HEAP32[(($arrayidx25)>>2)]; //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $36;__label__ = 6; break; //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $37=$t; //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child26=(($37+16)|0); //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx27=(($child26+4)|0); //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $38=HEAP32[(($arrayidx27)>>2)]; //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $38;__label__ = 6; break; //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $cond; //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $t=$cond; //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp28=(($cond)|0)!=0; //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp28) { __label__ = 7; break; } else { __label__ = 10; break; } //@line 4273 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $39=$t; //@line 4274 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head29=(($39+4)|0); //@line 4274 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $40=HEAP32[(($head29)>>2)]; //@line 4274 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and30=$40 & -8; //@line 4274 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $41=$nb_addr; //@line 4274 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub31=((($and30)-($41))|0); //@line 4274 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $trem=$sub31; //@line 4274 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $42=$trem; //@line 4275 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $43=$rsize; //@line 4275 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp32=(($42)>>>0) < (($43)>>>0); //@line 4275 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp32) { __label__ = 8; break; } else { __label__ = 9; break; } //@line 4275 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $44=$trem; //@line 4276 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rsize=$44; //@line 4276 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $45=$t; //@line 4277 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $v=$45; //@line 4277 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 9; break; //@line 4278 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      __label__ = 3; break; //@line 4279 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $46=$v; //@line 4281 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $47=$46; //@line 4281 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $48=$m_addr; //@line 4281 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($48+16)|0); //@line 4281 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $49=HEAPU32[(($least_addr)>>2)]; //@line 4281 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp33=(($47)>>>0) >= (($49)>>>0); //@line 4281 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv=(($cmp33)&1); //@line 4281 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval=(($conv)==(1)); //@line 4281 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($expval)|0)!=0; //@line 4281 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool) { __label__ = 11; break; } else { __label__ = 70; break; } //@line 4281 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $50=$v; //@line 4282 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $51=$50; //@line 4282 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $52=$nb_addr; //@line 4282 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($51+$52)|0); //@line 4282 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $53=$add_ptr; //@line 4282 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $r=$53; //@line 4282 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $54=$v; //@line 4284 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $55=$54; //@line 4284 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $56=$r; //@line 4284 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $57=$56; //@line 4284 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp35=(($55)>>>0) < (($57)>>>0); //@line 4284 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv36=(($cmp35)&1); //@line 4284 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval37=(($conv36)==(1)); //@line 4284 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool38=(($expval37)|0)!=0; //@line 4284 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool38) { __label__ = 12; break; } else { __label__ = 69; break; } //@line 4284 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $58=$v; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent=(($58+24)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $59=HEAP32[(($parent)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $XP=$59; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $60=$v; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk=(($60+12)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $61=HEAP32[(($bk)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $62=$v; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp40=(($61)|0)!=(($62)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp40) { __label__ = 13; break; } else { __label__ = 17; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $63=$v; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd=(($63+8)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $64=HEAP32[(($fd)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F=$64; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $65=$v; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk43=(($65+12)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $66=HEAP32[(($bk43)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$66; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $67=$F; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $68=$67; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $69=$m_addr; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr44=(($69+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $70=HEAPU32[(($least_addr44)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp45=(($68)>>>0) >= (($70)>>>0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv46=(($cmp45)&1); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval47=(($conv46)==(1)); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool48=(($expval47)|0)!=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool48) { __label__ = 14; break; } else { __label__ = 15; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $71=$R; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $72=$F; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk50=(($72+12)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk50)>>2)]=$71; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $73=$F; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $74=$R; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd51=(($74+8)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd51)>>2)]=$73; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 16; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      _abort(); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 16: 
      __label__ = 29; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $75=$v; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child54=(($75+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx55=(($child54+4)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx55; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $76=HEAP32[(($arrayidx55)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$76; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp56=(($76)|0)!=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp56) { __label__ = 19; break; } else { __label__ = 18; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $77=$v; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child58=(($77+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx59=(($child58)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx59; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $78=HEAP32[(($arrayidx59)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$78; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp60=(($78)|0)!=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp60) { __label__ = 19; break; } else { __label__ = 28; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 19: 
      __label__ = 20; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 20: 
      var $79=$R; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child64=(($79+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx65=(($child64+4)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx65; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $80=HEAP32[(($arrayidx65)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp66=(($80)|0)!=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp66) { var $83 = 1;__label__ = 22; break; } else { __label__ = 21; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 21: 
      var $81=$R; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child68=(($81+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx69=(($child68)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx69; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $82=HEAP32[(($arrayidx69)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp70=(($82)|0)!=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $83 = $cmp70;__label__ = 22; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 22: 
      var $83;
      if ($83) { __label__ = 23; break; } else { __label__ = 24; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 23: 
      var $84=$CP; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$84; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $85=HEAP32[(($84)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$85; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 20; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $86=$RP; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $87=$86; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $88=$m_addr; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr74=(($88+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $89=HEAPU32[(($least_addr74)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp75=(($87)>>>0) >= (($89)>>>0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv76=(($cmp75)&1); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval77=(($conv76)==(1)); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool78=(($expval77)|0)!=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool78) { __label__ = 25; break; } else { __label__ = 26; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $90=$RP; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($90)>>2)]=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 27; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 26: 
      _abort(); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 27: 
      __label__ = 28; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 28: 
      __label__ = 29; break;
    case 29: 
      var $91=$XP; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp84=(($91)|0)!=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp84) { __label__ = 30; break; } else { __label__ = 57; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 30: 
      var $92=$v; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index=(($92+28)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $93=HEAP32[(($index)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $94=$m_addr; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treebins87=(($94+304)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx88=(($treebins87+($93<<2))|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $H=$arrayidx88; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $95=$v; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $96=$H; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $97=HEAP32[(($96)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp89=(($95)|0)==(($97)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp89) { __label__ = 31; break; } else { __label__ = 34; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $98=$R; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $99=$H; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($99)>>2)]=$98; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp92=(($98)|0)==0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp92) { __label__ = 32; break; } else { __label__ = 33; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $100=$v; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index95=(($100+28)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $101=HEAP32[(($index95)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl=1 << $101; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg=$shl ^ -1; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $102=$m_addr; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap96=(($102+4)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $103=HEAP32[(($treemap96)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and97=$103 & $neg; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap96)>>2)]=$and97; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 33; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 33: 
      __label__ = 41; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $104=$XP; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $105=$104; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $106=$m_addr; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr100=(($106+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $107=HEAPU32[(($least_addr100)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp101=(($105)>>>0) >= (($107)>>>0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv102=(($cmp101)&1); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval103=(($conv102)==(1)); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool104=(($expval103)|0)!=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool104) { __label__ = 35; break; } else { __label__ = 39; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 35: 
      var $108=$XP; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child106=(($108+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx107=(($child106)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $109=HEAP32[(($arrayidx107)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $110=$v; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp108=(($109)|0)==(($110)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp108) { __label__ = 36; break; } else { __label__ = 37; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 36: 
      var $111=$R; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $112=$XP; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child111=(($112+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx112=(($child111)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx112)>>2)]=$111; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 38; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 37: 
      var $113=$R; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $114=$XP; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child114=(($114+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx115=(($child114+4)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx115)>>2)]=$113; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 38; break;
    case 38: 
      __label__ = 40; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 39: 
      _abort(); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 40: 
      __label__ = 41; break;
    case 41: 
      var $115=$R; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp120=(($115)|0)!=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp120) { __label__ = 42; break; } else { __label__ = 56; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 42: 
      var $116=$R; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $117=$116; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $118=$m_addr; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr123=(($118+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $119=HEAPU32[(($least_addr123)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp124=(($117)>>>0) >= (($119)>>>0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv125=(($cmp124)&1); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval126=(($conv125)==(1)); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool127=(($expval126)|0)!=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool127) { __label__ = 43; break; } else { __label__ = 54; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 43: 
      var $120=$XP; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $121=$R; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent129=(($121+24)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent129)>>2)]=$120; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $122=$v; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child130=(($122+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx131=(($child130)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $123=HEAP32[(($arrayidx131)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C0=$123; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp132=(($123)|0)!=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp132) { __label__ = 44; break; } else { __label__ = 48; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 44: 
      var $124=$C0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $125=$124; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $126=$m_addr; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr135=(($126+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $127=HEAPU32[(($least_addr135)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp136=(($125)>>>0) >= (($127)>>>0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv137=(($cmp136)&1); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval138=(($conv137)==(1)); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool139=(($expval138)|0)!=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool139) { __label__ = 45; break; } else { __label__ = 46; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 45: 
      var $128=$C0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $129=$R; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child141=(($129+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx142=(($child141)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx142)>>2)]=$128; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $130=$R; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $131=$C0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent143=(($131+24)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent143)>>2)]=$130; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 47; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 46: 
      _abort(); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 47: 
      __label__ = 48; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 48: 
      var $132=$v; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child147=(($132+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx148=(($child147+4)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $133=HEAP32[(($arrayidx148)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C1=$133; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp149=(($133)|0)!=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp149) { __label__ = 49; break; } else { __label__ = 53; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 49: 
      var $134=$C1; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $135=$134; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $136=$m_addr; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr152=(($136+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $137=HEAPU32[(($least_addr152)>>2)]; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp153=(($135)>>>0) >= (($137)>>>0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv154=(($cmp153)&1); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval155=(($conv154)==(1)); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool156=(($expval155)|0)!=0; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool156) { __label__ = 50; break; } else { __label__ = 51; break; } //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 50: 
      var $138=$C1; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $139=$R; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child158=(($139+16)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx159=(($child158+4)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx159)>>2)]=$138; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $140=$R; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $141=$C1; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent160=(($141+24)|0); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent160)>>2)]=$140; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 52; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 51: 
      _abort(); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 52: 
      __label__ = 53; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 53: 
      __label__ = 55; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 54: 
      _abort(); //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 55: 
      __label__ = 56; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 56: 
      __label__ = 57; break; //@line 4285 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 57: 
      var $142=$rsize; //@line 4286 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp168=(($142)>>>0) < 16; //@line 4286 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp168) { __label__ = 58; break; } else { __label__ = 59; break; } //@line 4286 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 58: 
      var $143=$rsize; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $144=$nb_addr; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add171=((($143)+($144))|0); //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or=$add171 | 1; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or172=$or | 2; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $145=$v; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head173=(($145+4)|0); //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head173)>>2)]=$or172; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $146=$v; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $147=$146; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $148=$rsize; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $149=$nb_addr; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add174=((($148)+($149))|0); //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr175=(($147+$add174)|0); //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $150=$add_ptr175; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head176=(($150+4)|0); //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $151=HEAP32[(($head176)>>2)]; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or177=$151 | 1; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head176)>>2)]=$or177; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 68; break; //@line 4287 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 59: 
      var $152=$nb_addr; //@line 4289 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or179=$152 | 1; //@line 4289 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or180=$or179 | 2; //@line 4289 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $153=$v; //@line 4289 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head181=(($153+4)|0); //@line 4289 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head181)>>2)]=$or180; //@line 4289 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $154=$rsize; //@line 4290 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or182=$154 | 1; //@line 4290 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $155=$r; //@line 4290 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head183=(($155+4)|0); //@line 4290 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head183)>>2)]=$or182; //@line 4290 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $156=$rsize; //@line 4290 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $157=$r; //@line 4290 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $158=$157; //@line 4290 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $159=$rsize; //@line 4290 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr184=(($158+$159)|0); //@line 4290 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $160=$add_ptr184; //@line 4290 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($160)|0); //@line 4290 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot)>>2)]=$156; //@line 4290 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $161=$m_addr; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $dvsize=(($161+8)|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $162=HEAP32[(($dvsize)>>2)]; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $DVS=$162; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $163=$DVS; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp185=(($163)|0)!=0; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp185) { __label__ = 60; break; } else { __label__ = 67; break; } //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 60: 
      var $164=$m_addr; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $dv=(($164+20)|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $165=HEAP32[(($dv)>>2)]; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $DV=$165; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $166=$DVS; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr188=$166 >>> 3; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $I=$shr188; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $167=$I; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl189=$167 << 1; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $168=$m_addr; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallbins=(($168+40)|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx190=(($smallbins+($shl189<<2))|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $169=$arrayidx190; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $170=$169; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $B=$170; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $171=$B; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F191=$171; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $172=$m_addr; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallmap=(($172)|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $173=HEAP32[(($smallmap)>>2)]; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $174=$I; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl192=1 << $174; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and193=$173 & $shl192; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool194=(($and193)|0)!=0; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool194) { __label__ = 62; break; } else { __label__ = 61; break; } //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 61: 
      var $175=$I; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl196=1 << $175; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $176=$m_addr; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallmap197=(($176)|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $177=HEAP32[(($smallmap197)>>2)]; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or198=$177 | $shl196; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($smallmap197)>>2)]=$or198; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 66; break; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 62: 
      var $178=$B; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd200=(($178+8)|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $179=HEAP32[(($fd200)>>2)]; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $180=$179; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $181=$m_addr; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr201=(($181+16)|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $182=HEAPU32[(($least_addr201)>>2)]; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp202=(($180)>>>0) >= (($182)>>>0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv203=(($cmp202)&1); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval204=(($conv203)==(1)); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool205=(($expval204)|0)!=0; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool205) { __label__ = 63; break; } else { __label__ = 64; break; } //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 63: 
      var $183=$B; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd207=(($183+8)|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $184=HEAP32[(($fd207)>>2)]; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F191=$184; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 65; break; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 64: 
      _abort(); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 65: 
      __label__ = 66; break;
    case 66: 
      var $185=$DV; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $186=$B; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd211=(($186+8)|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd211)>>2)]=$185; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $187=$DV; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $188=$F191; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk212=(($188+12)|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk212)>>2)]=$187; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $189=$F191; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $190=$DV; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd213=(($190+8)|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd213)>>2)]=$189; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $191=$B; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $192=$DV; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk214=(($192+12)|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk214)>>2)]=$191; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 67; break; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 67: 
      var $193=$rsize; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $194=$m_addr; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $dvsize216=(($194+8)|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($dvsize216)>>2)]=$193; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $195=$r; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $196=$m_addr; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $dv217=(($196+20)|0); //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($dv217)>>2)]=$195; //@line 4291 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 68; break;
    case 68: 
      var $197=$v; //@line 4293 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $198=$197; //@line 4293 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr219=(($198+8)|0); //@line 4293 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $add_ptr219; //@line 4293 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 69: 
      __label__ = 70; break; //@line 4295 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 70: 
      _abort(); //@line 4297 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4297 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_tmalloc_small["X"]=1;

function _tmalloc_large($m, $nb) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $m_addr;
      var $nb_addr;
      var $v;
      var $rsize;
      var $t;
      var $idx;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $sizebits;
      var $rst;
      var $rt;
      var $trem;
      var $leftbits;
      var $i;
      var $leastbit;
      var $Y68;
      var $K70;
      var $N73;
      var $trem97;
      var $r;
      var $XP;
      var $R;
      var $F;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $I;
      var $B;
      var $F282;
      var $TP;
      var $H307;
      var $I308;
      var $X309;
      var $Y319;
      var $N320;
      var $K324;
      var $T;
      var $K365;
      var $C;
      var $F404;
      $m_addr=$m;
      $nb_addr=$nb;
      $v=0; //@line 4194 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $0=$nb_addr; //@line 4195 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=(((-$0))|0); //@line 4195 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rsize=$sub; //@line 4195 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1=$nb_addr; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr=$1 >>> 8; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $X=$shr; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$X; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($2)|0)==0; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      $idx=0; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 8; break; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $3=$X; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($3)>>>0) > 65535; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      $idx=31; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 7; break; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $4=$X; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$4; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=$Y; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub4=((($5)-(256))|0); //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr5=$sub4 >>> 16; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$shr5 & 8; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$and; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=$N; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$Y; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl=$7 << $6; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub6=((($shl)-(4096))|0); //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr7=$sub6 >>> 16; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and8=$shr7 & 4; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and8; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=$K; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $9=$N; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($9)+($8))|0); //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=$K; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=$Y; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl9=$11 << $10; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl9; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub10=((($shl9)-(16384))|0); //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr11=$sub10 >>> 16; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and12=$shr11 & 2; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and12; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=$N; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add13=((($12)+($and12))|0); //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add13; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $13=$N; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub14=(((14)-($13))|0); //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=$K; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $15=$Y; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl15=$15 << $14; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl15; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr16=$shl15 >>> 15; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add17=((($sub14)+($shr16))|0); //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$add17; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=$K; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl18=$16 << 1; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $17=$nb_addr; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $18=$K; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add19=((($18)+(7))|0); //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr20=$17 >>> (($add19)>>>0); //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and21=$shr20 & 1; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add22=((($shl18)+($and21))|0); //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $idx=$add22; //@line 4198 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 7; break;
    case 7: 
      __label__ = 8; break;
    case 8: 
      var $19=$idx; //@line 4199 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=$m_addr; //@line 4199 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treebins=(($20+304)|0); //@line 4199 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=(($treebins+($19<<2))|0); //@line 4199 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=HEAP32[(($arrayidx)>>2)]; //@line 4199 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $t=$21; //@line 4199 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp24=(($21)|0)!=0; //@line 4199 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp24) { __label__ = 9; break; } else { __label__ = 24; break; } //@line 4199 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $22=$nb_addr; //@line 4201 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $23=$idx; //@line 4201 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp26=(($23)|0)==31; //@line 4201 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp26) { __label__ = 10; break; } else { __label__ = 11; break; } //@line 4201 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $cond = 0;__label__ = 12; break; //@line 4201 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $24=$idx; //@line 4201 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr27=$24 >>> 1; //@line 4201 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add28=((($shr27)+(8))|0); //@line 4201 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub29=((($add28)-(2))|0); //@line 4201 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub30=(((31)-($sub29))|0); //@line 4201 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $sub30;__label__ = 12; break; //@line 4201 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $cond; //@line 4201 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl31=$22 << $cond; //@line 4201 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sizebits=$shl31; //@line 4201 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rst=0; //@line 4202 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 13; break; //@line 4203 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $25=$t; //@line 4205 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($25+4)|0); //@line 4205 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $26=HEAP32[(($head)>>2)]; //@line 4205 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and32=$26 & -8; //@line 4205 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $27=$nb_addr; //@line 4205 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub33=((($and32)-($27))|0); //@line 4205 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $trem=$sub33; //@line 4205 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=$trem; //@line 4206 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $29=$rsize; //@line 4206 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp34=(($28)>>>0) < (($29)>>>0); //@line 4206 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp34) { __label__ = 14; break; } else { __label__ = 17; break; } //@line 4206 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $30=$t; //@line 4207 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $v=$30; //@line 4207 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $31=$trem; //@line 4208 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rsize=$31; //@line 4208 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp36=(($31)|0)==0; //@line 4208 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp36) { __label__ = 15; break; } else { __label__ = 16; break; } //@line 4208 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      __label__ = 23; break; //@line 4209 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 16: 
      __label__ = 17; break; //@line 4210 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $32=$t; //@line 4211 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child=(($32+16)|0); //@line 4211 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx40=(($child+4)|0); //@line 4211 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $33=HEAP32[(($arrayidx40)>>2)]; //@line 4211 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rt=$33; //@line 4211 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $34=$sizebits; //@line 4212 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr41=$34 >>> 31; //@line 4212 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and42=$shr41 & 1; //@line 4212 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $35=$t; //@line 4212 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child43=(($35+16)|0); //@line 4212 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx44=(($child43+($and42<<2))|0); //@line 4212 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $36=HEAP32[(($arrayidx44)>>2)]; //@line 4212 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $t=$36; //@line 4212 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $37=$rt; //@line 4213 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp45=(($37)|0)!=0; //@line 4213 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp45) { __label__ = 18; break; } else { __label__ = 20; break; } //@line 4213 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $38=$rt; //@line 4213 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $39=$t; //@line 4213 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp46=(($38)|0)!=(($39)|0); //@line 4213 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp46) { __label__ = 19; break; } else { __label__ = 20; break; } //@line 4213 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $40=$rt; //@line 4214 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rst=$40; //@line 4214 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 20; break; //@line 4214 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 20: 
      var $41=$t; //@line 4215 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp49=(($41)|0)==0; //@line 4215 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp49) { __label__ = 21; break; } else { __label__ = 22; break; } //@line 4215 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 21: 
      var $42=$rst; //@line 4216 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $t=$42; //@line 4216 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 23; break; //@line 4217 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 22: 
      var $43=$sizebits; //@line 4219 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl52=$43 << 1; //@line 4219 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sizebits=$shl52; //@line 4219 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 13; break; //@line 4220 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 23: 
      __label__ = 24; break; //@line 4221 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $44=$t; //@line 4222 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp54=(($44)|0)==0; //@line 4222 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp54) { __label__ = 25; break; } else { __label__ = 29; break; } //@line 4222 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $45=$v; //@line 4222 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp56=(($45)|0)==0; //@line 4222 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp56) { __label__ = 26; break; } else { __label__ = 29; break; } //@line 4222 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $46=$idx; //@line 4223 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl58=1 << $46; //@line 4223 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl59=$shl58 << 1; //@line 4223 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $47=$idx; //@line 4223 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl60=1 << $47; //@line 4223 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl61=$shl60 << 1; //@line 4223 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub62=(((-$shl61))|0); //@line 4223 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or=$shl59 | $sub62; //@line 4223 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $48=$m_addr; //@line 4223 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap=(($48+4)|0); //@line 4223 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $49=HEAP32[(($treemap)>>2)]; //@line 4223 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and63=$or & $49; //@line 4223 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $leftbits=$and63; //@line 4223 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $50=$leftbits; //@line 4224 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp64=(($50)|0)!=0; //@line 4224 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp64) { __label__ = 27; break; } else { __label__ = 28; break; } //@line 4224 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 27: 
      var $51=$leftbits; //@line 4226 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $52=$leftbits; //@line 4226 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub66=(((-$52))|0); //@line 4226 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and67=$51 & $sub66; //@line 4226 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $leastbit=$and67; //@line 4226 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $53=$leastbit; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub69=((($53)-(1))|0); //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y68=$sub69; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $54=$Y68; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr71=$54 >>> 12; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and72=$shr71 & 16; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K70=$and72; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $55=$K70; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N73=$55; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $56=$K70; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $57=$Y68; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr74=$57 >>> (($56)>>>0); //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y68=$shr74; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $58=$Y68; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr75=$58 >>> 5; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and76=$shr75 & 8; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K70=$and76; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $59=$N73; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add77=((($59)+($and76))|0); //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N73=$add77; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $60=$K70; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $61=$Y68; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr78=$61 >>> (($60)>>>0); //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y68=$shr78; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $62=$Y68; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr79=$62 >>> 2; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and80=$shr79 & 4; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K70=$and80; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $63=$N73; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add81=((($63)+($and80))|0); //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N73=$add81; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $64=$K70; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $65=$Y68; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr82=$65 >>> (($64)>>>0); //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y68=$shr82; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $66=$Y68; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr83=$66 >>> 1; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and84=$shr83 & 2; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K70=$and84; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $67=$N73; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add85=((($67)+($and84))|0); //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N73=$add85; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $68=$K70; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $69=$Y68; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr86=$69 >>> (($68)>>>0); //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y68=$shr86; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $70=$Y68; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr87=$70 >>> 1; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and88=$shr87 & 1; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K70=$and88; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $71=$N73; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add89=((($71)+($and88))|0); //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N73=$add89; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $72=$K70; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $73=$Y68; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr90=$73 >>> (($72)>>>0); //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y68=$shr90; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $74=$N73; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $75=$Y68; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add91=((($74)+($75))|0); //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $i=$add91; //@line 4227 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $76=$i; //@line 4228 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $77=$m_addr; //@line 4228 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treebins92=(($77+304)|0); //@line 4228 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx93=(($treebins92+($76<<2))|0); //@line 4228 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $78=HEAP32[(($arrayidx93)>>2)]; //@line 4228 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $t=$78; //@line 4228 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 28; break; //@line 4229 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 28: 
      __label__ = 29; break; //@line 4230 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 29: 
      __label__ = 30; break; //@line 4232 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 30: 
      var $79=$t; //@line 4232 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp96=(($79)|0)!=0; //@line 4232 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp96) { __label__ = 31; break; } else { __label__ = 37; break; } //@line 4232 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $80=$t; //@line 4233 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head98=(($80+4)|0); //@line 4233 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $81=HEAP32[(($head98)>>2)]; //@line 4233 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and99=$81 & -8; //@line 4233 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $82=$nb_addr; //@line 4233 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub100=((($and99)-($82))|0); //@line 4233 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $trem97=$sub100; //@line 4233 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $83=$trem97; //@line 4234 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $84=$rsize; //@line 4234 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp101=(($83)>>>0) < (($84)>>>0); //@line 4234 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp101) { __label__ = 32; break; } else { __label__ = 33; break; } //@line 4234 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $85=$trem97; //@line 4235 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rsize=$85; //@line 4235 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $86=$t; //@line 4236 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $v=$86; //@line 4236 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 33; break; //@line 4237 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 33: 
      var $87=$t; //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child104=(($87+16)|0); //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx105=(($child104)|0); //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $88=HEAP32[(($arrayidx105)>>2)]; //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp106=(($88)|0)!=0; //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp106) { __label__ = 34; break; } else { __label__ = 35; break; } //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $89=$t; //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child108=(($89+16)|0); //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx109=(($child108)|0); //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $90=HEAP32[(($arrayidx109)>>2)]; //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond114 = $90;__label__ = 36; break; //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 35: 
      var $91=$t; //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child111=(($91+16)|0); //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx112=(($child111+4)|0); //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $92=HEAP32[(($arrayidx112)>>2)]; //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond114 = $92;__label__ = 36; break; //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 36: 
      var $cond114; //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $t=$cond114; //@line 4238 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 30; break; //@line 4239 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 37: 
      var $93=$v; //@line 4242 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp115=(($93)|0)!=0; //@line 4242 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp115) { __label__ = 38; break; } else { __label__ = 127; break; } //@line 4242 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 38: 
      var $94=$rsize; //@line 4242 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $95=$m_addr; //@line 4242 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $dvsize=(($95+8)|0); //@line 4242 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $96=HEAP32[(($dvsize)>>2)]; //@line 4242 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $97=$nb_addr; //@line 4242 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub117=((($96)-($97))|0); //@line 4242 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp118=(($94)>>>0) < (($sub117)>>>0); //@line 4242 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp118) { __label__ = 39; break; } else { __label__ = 127; break; } //@line 4242 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 39: 
      var $98=$v; //@line 4243 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $99=$98; //@line 4243 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $100=$m_addr; //@line 4243 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($100+16)|0); //@line 4243 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $101=HEAPU32[(($least_addr)>>2)]; //@line 4243 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp120=(($99)>>>0) >= (($101)>>>0); //@line 4243 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv=(($cmp120)&1); //@line 4243 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval=(($conv)==(1)); //@line 4243 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($expval)|0)!=0; //@line 4243 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool) { __label__ = 40; break; } else { __label__ = 126; break; } //@line 4243 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 40: 
      var $102=$v; //@line 4244 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $103=$102; //@line 4244 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $104=$nb_addr; //@line 4244 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($103+$104)|0); //@line 4244 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $105=$add_ptr; //@line 4244 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $r=$105; //@line 4244 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $106=$v; //@line 4246 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $107=$106; //@line 4246 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $108=$r; //@line 4246 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $109=$108; //@line 4246 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp122=(($107)>>>0) < (($109)>>>0); //@line 4246 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv123=(($cmp122)&1); //@line 4246 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval124=(($conv123)==(1)); //@line 4246 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool125=(($expval124)|0)!=0; //@line 4246 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool125) { __label__ = 41; break; } else { __label__ = 125; break; } //@line 4246 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 41: 
      var $110=$v; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent=(($110+24)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $111=HEAP32[(($parent)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $XP=$111; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $112=$v; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk=(($112+12)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $113=HEAP32[(($bk)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $114=$v; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp127=(($113)|0)!=(($114)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp127) { __label__ = 42; break; } else { __label__ = 46; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 42: 
      var $115=$v; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd=(($115+8)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $116=HEAP32[(($fd)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F=$116; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $117=$v; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk130=(($117+12)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $118=HEAP32[(($bk130)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$118; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $119=$F; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $120=$119; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $121=$m_addr; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr131=(($121+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $122=HEAPU32[(($least_addr131)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp132=(($120)>>>0) >= (($122)>>>0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv133=(($cmp132)&1); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval134=(($conv133)==(1)); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool135=(($expval134)|0)!=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool135) { __label__ = 43; break; } else { __label__ = 44; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 43: 
      var $123=$R; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $124=$F; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk137=(($124+12)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk137)>>2)]=$123; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $125=$F; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $126=$R; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd138=(($126+8)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd138)>>2)]=$125; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 45; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 44: 
      _abort(); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 45: 
      __label__ = 58; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 46: 
      var $127=$v; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child142=(($127+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx143=(($child142+4)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx143; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $128=HEAP32[(($arrayidx143)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$128; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp144=(($128)|0)!=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp144) { __label__ = 48; break; } else { __label__ = 47; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 47: 
      var $129=$v; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child146=(($129+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx147=(($child146)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx147; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $130=HEAP32[(($arrayidx147)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$130; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp148=(($130)|0)!=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp148) { __label__ = 48; break; } else { __label__ = 57; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 48: 
      __label__ = 49; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 49: 
      var $131=$R; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child152=(($131+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx153=(($child152+4)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx153; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $132=HEAP32[(($arrayidx153)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp154=(($132)|0)!=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp154) { var $135 = 1;__label__ = 51; break; } else { __label__ = 50; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 50: 
      var $133=$R; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child156=(($133+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx157=(($child156)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx157; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $134=HEAP32[(($arrayidx157)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp158=(($134)|0)!=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $135 = $cmp158;__label__ = 51; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 51: 
      var $135;
      if ($135) { __label__ = 52; break; } else { __label__ = 53; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 52: 
      var $136=$CP; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$136; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $137=HEAP32[(($136)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$137; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 49; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 53: 
      var $138=$RP; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $139=$138; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $140=$m_addr; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr162=(($140+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $141=HEAPU32[(($least_addr162)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp163=(($139)>>>0) >= (($141)>>>0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv164=(($cmp163)&1); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval165=(($conv164)==(1)); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool166=(($expval165)|0)!=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool166) { __label__ = 54; break; } else { __label__ = 55; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 54: 
      var $142=$RP; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($142)>>2)]=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 56; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 55: 
      _abort(); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 56: 
      __label__ = 57; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 57: 
      __label__ = 58; break;
    case 58: 
      var $143=$XP; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp172=(($143)|0)!=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp172) { __label__ = 59; break; } else { __label__ = 86; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 59: 
      var $144=$v; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index=(($144+28)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $145=HEAP32[(($index)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $146=$m_addr; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treebins175=(($146+304)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx176=(($treebins175+($145<<2))|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $H=$arrayidx176; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $147=$v; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $148=$H; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $149=HEAP32[(($148)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp177=(($147)|0)==(($149)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp177) { __label__ = 60; break; } else { __label__ = 63; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 60: 
      var $150=$R; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $151=$H; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($151)>>2)]=$150; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp180=(($150)|0)==0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp180) { __label__ = 61; break; } else { __label__ = 62; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 61: 
      var $152=$v; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index183=(($152+28)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $153=HEAP32[(($index183)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl184=1 << $153; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg=$shl184 ^ -1; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $154=$m_addr; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap185=(($154+4)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $155=HEAP32[(($treemap185)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and186=$155 & $neg; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap185)>>2)]=$and186; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 62; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 62: 
      __label__ = 70; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 63: 
      var $156=$XP; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $157=$156; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $158=$m_addr; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr189=(($158+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $159=HEAPU32[(($least_addr189)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp190=(($157)>>>0) >= (($159)>>>0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv191=(($cmp190)&1); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval192=(($conv191)==(1)); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool193=(($expval192)|0)!=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool193) { __label__ = 64; break; } else { __label__ = 68; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 64: 
      var $160=$XP; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child195=(($160+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx196=(($child195)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $161=HEAP32[(($arrayidx196)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $162=$v; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp197=(($161)|0)==(($162)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp197) { __label__ = 65; break; } else { __label__ = 66; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 65: 
      var $163=$R; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $164=$XP; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child200=(($164+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx201=(($child200)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx201)>>2)]=$163; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 67; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 66: 
      var $165=$R; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $166=$XP; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child203=(($166+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx204=(($child203+4)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx204)>>2)]=$165; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 67; break;
    case 67: 
      __label__ = 69; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 68: 
      _abort(); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 69: 
      __label__ = 70; break;
    case 70: 
      var $167=$R; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp209=(($167)|0)!=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp209) { __label__ = 71; break; } else { __label__ = 85; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 71: 
      var $168=$R; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $169=$168; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $170=$m_addr; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr212=(($170+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $171=HEAPU32[(($least_addr212)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp213=(($169)>>>0) >= (($171)>>>0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv214=(($cmp213)&1); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval215=(($conv214)==(1)); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool216=(($expval215)|0)!=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool216) { __label__ = 72; break; } else { __label__ = 83; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 72: 
      var $172=$XP; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $173=$R; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent218=(($173+24)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent218)>>2)]=$172; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $174=$v; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child219=(($174+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx220=(($child219)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $175=HEAP32[(($arrayidx220)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C0=$175; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp221=(($175)|0)!=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp221) { __label__ = 73; break; } else { __label__ = 77; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 73: 
      var $176=$C0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $177=$176; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $178=$m_addr; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr224=(($178+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $179=HEAPU32[(($least_addr224)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp225=(($177)>>>0) >= (($179)>>>0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv226=(($cmp225)&1); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval227=(($conv226)==(1)); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool228=(($expval227)|0)!=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool228) { __label__ = 74; break; } else { __label__ = 75; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 74: 
      var $180=$C0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $181=$R; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child230=(($181+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx231=(($child230)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx231)>>2)]=$180; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $182=$R; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $183=$C0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent232=(($183+24)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent232)>>2)]=$182; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 76; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 75: 
      _abort(); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 76: 
      __label__ = 77; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 77: 
      var $184=$v; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child236=(($184+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx237=(($child236+4)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $185=HEAP32[(($arrayidx237)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C1=$185; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp238=(($185)|0)!=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp238) { __label__ = 78; break; } else { __label__ = 82; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 78: 
      var $186=$C1; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $187=$186; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $188=$m_addr; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr241=(($188+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $189=HEAPU32[(($least_addr241)>>2)]; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp242=(($187)>>>0) >= (($189)>>>0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv243=(($cmp242)&1); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval244=(($conv243)==(1)); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool245=(($expval244)|0)!=0; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool245) { __label__ = 79; break; } else { __label__ = 80; break; } //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 79: 
      var $190=$C1; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $191=$R; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child247=(($191+16)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx248=(($child247+4)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx248)>>2)]=$190; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $192=$R; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $193=$C1; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent249=(($193+24)|0); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent249)>>2)]=$192; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 81; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 80: 
      _abort(); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 81: 
      __label__ = 82; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 82: 
      __label__ = 84; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 83: 
      _abort(); //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 84: 
      __label__ = 85; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 85: 
      __label__ = 86; break; //@line 4247 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 86: 
      var $194=$rsize; //@line 4248 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp257=(($194)>>>0) < 16; //@line 4248 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp257) { __label__ = 87; break; } else { __label__ = 88; break; } //@line 4248 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 87: 
      var $195=$rsize; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $196=$nb_addr; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add260=((($195)+($196))|0); //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or261=$add260 | 1; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or262=$or261 | 2; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $197=$v; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head263=(($197+4)|0); //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head263)>>2)]=$or262; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $198=$v; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $199=$198; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $200=$rsize; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $201=$nb_addr; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add264=((($200)+($201))|0); //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr265=(($199+$add264)|0); //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $202=$add_ptr265; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head266=(($202+4)|0); //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $203=HEAP32[(($head266)>>2)]; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or267=$203 | 1; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head266)>>2)]=$or267; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 124; break; //@line 4249 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 88: 
      var $204=$nb_addr; //@line 4251 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or269=$204 | 1; //@line 4251 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or270=$or269 | 2; //@line 4251 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $205=$v; //@line 4251 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head271=(($205+4)|0); //@line 4251 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head271)>>2)]=$or270; //@line 4251 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $206=$rsize; //@line 4252 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or272=$206 | 1; //@line 4252 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $207=$r; //@line 4252 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head273=(($207+4)|0); //@line 4252 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head273)>>2)]=$or272; //@line 4252 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $208=$rsize; //@line 4252 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $209=$r; //@line 4252 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $210=$209; //@line 4252 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $211=$rsize; //@line 4252 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr274=(($210+$211)|0); //@line 4252 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $212=$add_ptr274; //@line 4252 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($212)|0); //@line 4252 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot)>>2)]=$208; //@line 4252 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $213=$rsize; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr275=$213 >>> 3; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp276=(($shr275)>>>0) < 32; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp276) { __label__ = 89; break; } else { __label__ = 96; break; } //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 89: 
      var $214=$rsize; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr279=$214 >>> 3; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $I=$shr279; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $215=$I; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl280=$215 << 1; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $216=$m_addr; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallbins=(($216+40)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx281=(($smallbins+($shl280<<2))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $217=$arrayidx281; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $218=$217; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $B=$218; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $219=$B; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F282=$219; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $220=$m_addr; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallmap=(($220)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $221=HEAP32[(($smallmap)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $222=$I; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl283=1 << $222; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and284=$221 & $shl283; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool285=(($and284)|0)!=0; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool285) { __label__ = 91; break; } else { __label__ = 90; break; } //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 90: 
      var $223=$I; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl287=1 << $223; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $224=$m_addr; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallmap288=(($224)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $225=HEAP32[(($smallmap288)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or289=$225 | $shl287; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($smallmap288)>>2)]=$or289; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 95; break; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 91: 
      var $226=$B; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd291=(($226+8)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $227=HEAP32[(($fd291)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $228=$227; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $229=$m_addr; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr292=(($229+16)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $230=HEAPU32[(($least_addr292)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp293=(($228)>>>0) >= (($230)>>>0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv294=(($cmp293)&1); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval295=(($conv294)==(1)); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool296=(($expval295)|0)!=0; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool296) { __label__ = 92; break; } else { __label__ = 93; break; } //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 92: 
      var $231=$B; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd298=(($231+8)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $232=HEAP32[(($fd298)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F282=$232; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 94; break; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 93: 
      _abort(); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 94: 
      __label__ = 95; break;
    case 95: 
      var $233=$r; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $234=$B; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd302=(($234+8)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd302)>>2)]=$233; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $235=$r; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $236=$F282; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk303=(($236+12)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk303)>>2)]=$235; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $237=$F282; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $238=$r; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd304=(($238+8)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd304)>>2)]=$237; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $239=$B; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $240=$r; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk305=(($240+12)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk305)>>2)]=$239; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 123; break; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 96: 
      var $241=$r; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $242=$241; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $TP=$242; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $243=$rsize; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr310=$243 >>> 8; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $X309=$shr310; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $244=$X309; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp311=(($244)|0)==0; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp311) { __label__ = 97; break; } else { __label__ = 98; break; } //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 97: 
      $I308=0; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 102; break; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 98: 
      var $245=$X309; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp315=(($245)>>>0) > 65535; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp315) { __label__ = 99; break; } else { __label__ = 100; break; } //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 99: 
      $I308=31; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 101; break; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 100: 
      var $246=$X309; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y319=$246; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $247=$Y319; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub321=((($247)-(256))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr322=$sub321 >>> 16; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and323=$shr322 & 8; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N320=$and323; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $248=$N320; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $249=$Y319; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl325=$249 << $248; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y319=$shl325; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub326=((($shl325)-(4096))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr327=$sub326 >>> 16; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and328=$shr327 & 4; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K324=$and328; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $250=$K324; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $251=$N320; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add329=((($251)+($250))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N320=$add329; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $252=$K324; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $253=$Y319; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl330=$253 << $252; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y319=$shl330; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub331=((($shl330)-(16384))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr332=$sub331 >>> 16; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and333=$shr332 & 2; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K324=$and333; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $254=$N320; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add334=((($254)+($and333))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N320=$add334; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $255=$N320; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub335=(((14)-($255))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $256=$K324; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $257=$Y319; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl336=$257 << $256; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y319=$shl336; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr337=$shl336 >>> 15; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add338=((($sub335)+($shr337))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K324=$add338; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $258=$K324; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl339=$258 << 1; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $259=$rsize; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $260=$K324; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add340=((($260)+(7))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr341=$259 >>> (($add340)>>>0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and342=$shr341 & 1; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add343=((($shl339)+($and342))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $I308=$add343; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 101; break;
    case 101: 
      __label__ = 102; break;
    case 102: 
      var $261=$I308; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $262=$m_addr; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treebins346=(($262+304)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx347=(($treebins346+($261<<2))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $H307=$arrayidx347; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $263=$I308; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $264=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index348=(($264+28)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($index348)>>2)]=$263; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $265=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child349=(($265+16)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx350=(($child349+4)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx350)>>2)]=0; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $266=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child351=(($266+16)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx352=(($child351)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx352)>>2)]=0; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $267=$m_addr; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap353=(($267+4)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $268=HEAP32[(($treemap353)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $269=$I308; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl354=1 << $269; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and355=$268 & $shl354; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool356=(($and355)|0)!=0; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool356) { __label__ = 104; break; } else { __label__ = 103; break; } //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 103: 
      var $270=$I308; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl358=1 << $270; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $271=$m_addr; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap359=(($271+4)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $272=HEAP32[(($treemap359)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or360=$272 | $shl358; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap359)>>2)]=$or360; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $273=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $274=$H307; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($274)>>2)]=$273; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $275=$H307; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $276=$275; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $277=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent361=(($277+24)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent361)>>2)]=$276; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $278=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $279=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk362=(($279+12)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk362)>>2)]=$278; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $280=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd363=(($280+8)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd363)>>2)]=$278; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 122; break; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 104: 
      var $281=$H307; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $282=HEAP32[(($281)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $T=$282; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $283=$rsize; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $284=$I308; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp366=(($284)|0)==31; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp366) { __label__ = 105; break; } else { __label__ = 106; break; } //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 105: 
      var $cond375 = 0;__label__ = 107; break; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 106: 
      var $285=$I308; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr370=$285 >>> 1; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add371=((($shr370)+(8))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub372=((($add371)-(2))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub373=(((31)-($sub372))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond375 = $sub373;__label__ = 107; break; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 107: 
      var $cond375; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl376=$283 << $cond375; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K365=$shl376; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 108; break; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 108: 
      var $286=$T; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head378=(($286+4)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $287=HEAP32[(($head378)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and379=$287 & -8; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $288=$rsize; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp380=(($and379)|0)!=(($288)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp380) { __label__ = 109; break; } else { __label__ = 115; break; } //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 109: 
      var $289=$K365; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr383=$289 >>> 31; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and384=$shr383 & 1; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $290=$T; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child385=(($290+16)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx386=(($child385+($and384<<2))|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C=$arrayidx386; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $291=$K365; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl387=$291 << 1; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K365=$shl387; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $292=$C; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $293=HEAP32[(($292)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp388=(($293)|0)!=0; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp388) { __label__ = 110; break; } else { __label__ = 111; break; } //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 110: 
      var $294=$C; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $295=HEAP32[(($294)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $T=$295; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 114; break; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 111: 
      var $296=$C; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $297=$296; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $298=$m_addr; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr392=(($298+16)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $299=HEAPU32[(($least_addr392)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp393=(($297)>>>0) >= (($299)>>>0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv394=(($cmp393)&1); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval395=(($conv394)==(1)); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool396=(($expval395)|0)!=0; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool396) { __label__ = 112; break; } else { __label__ = 113; break; } //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 112: 
      var $300=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $301=$C; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($301)>>2)]=$300; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $302=$T; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $303=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent398=(($303+24)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent398)>>2)]=$302; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $304=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $305=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk399=(($305+12)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk399)>>2)]=$304; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $306=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd400=(($306+8)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd400)>>2)]=$304; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 121; break; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 113: 
      _abort(); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 114: 
      __label__ = 120; break; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 115: 
      var $307=$T; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd405=(($307+8)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $308=HEAP32[(($fd405)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F404=$308; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $309=$T; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $310=$309; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $311=$m_addr; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr406=(($311+16)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $312=HEAPU32[(($least_addr406)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp407=(($310)>>>0) >= (($312)>>>0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp407) { __label__ = 116; break; } else { var $317 = 0;__label__ = 117; break; } //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 116: 
      var $313=$F404; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $314=$313; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $315=$m_addr; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr409=(($315+16)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $316=HEAPU32[(($least_addr409)>>2)]; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp410=(($314)>>>0) >= (($316)>>>0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $317 = $cmp410;__label__ = 117; break;
    case 117: 
      var $317;
      var $land_ext=(($317)&1);
      var $expval412=(($land_ext)==(1));
      var $tobool413=(($expval412)|0)!=0;
      if ($tobool413) { __label__ = 118; break; } else { __label__ = 119; break; }
    case 118: 
      var $318=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $319=$F404; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk415=(($319+12)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk415)>>2)]=$318; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $320=$T; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd416=(($320+8)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd416)>>2)]=$318; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $321=$F404; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $322=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd417=(($322+8)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd417)>>2)]=$321; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $323=$T; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $324=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk418=(($324+12)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk418)>>2)]=$323; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $325=$TP; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent419=(($325+24)|0); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent419)>>2)]=0; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 121; break; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 119: 
      _abort(); //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 120: 
      __label__ = 108; break; //@line 4253 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 121: 
      __label__ = 122; break;
    case 122: 
      __label__ = 123; break;
    case 123: 
      __label__ = 124; break;
    case 124: 
      var $326=$v; //@line 4255 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $327=$326; //@line 4255 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr426=(($327+8)|0); //@line 4255 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$add_ptr426; //@line 4255 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 128; break; //@line 4255 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 125: 
      __label__ = 126; break; //@line 4257 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 126: 
      _abort(); //@line 4258 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4258 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 127: 
      $retval=0; //@line 4260 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 128; break; //@line 4260 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 128: 
      var $328=$retval; //@line 4261 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $328; //@line 4261 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_tmalloc_large["X"]=1;

function _sys_alloc($m, $nb) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $m_addr;
      var $nb_addr;
      var $tbase;
      var $tsize;
      var $mmap_flag;
      var $mem;
      var $br;
      var $ss;
      var $asize;
      var $base;
      var $esize;
      var $end;
      var $asize97;
      var $br106;
      var $end107;
      var $ssize;
      var $mn;
      var $sp;
      var $oldbase;
      var $rsize;
      var $p;
      var $r;
      $m_addr=$m;
      $nb_addr=$nb;
      $tbase=-1; //@line 3876 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tsize=0; //@line 3877 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mmap_flag=0; //@line 3878 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $0=HEAP32[((((_mparams)|0))>>2)]; //@line 3880 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)!=0; //@line 3880 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { var $1 = 1;__label__ = 4; break; } else { __label__ = 3; break; } //@line 3880 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $call=_init_mparams(); //@line 3880 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($call)|0)!=0; //@line 3880 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1 = $tobool;__label__ = 4; break; //@line 3880 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $1;
      var $lor_ext=(($1)&1); //@line 3880 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$m_addr; //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $mflags=(($2+440)|0); //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=HEAP32[(($mflags)>>2)]; //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$3 & 0; //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool1=(($and)|0)!=0; //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool1) { __label__ = 5; break; } else { __label__ = 10; break; } //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $4=$nb_addr; //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=HEAPU32[((((_mparams+12)|0))>>2)]; //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp2=(($4)>>>0) >= (($5)>>>0); //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp2) { __label__ = 6; break; } else { __label__ = 10; break; } //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $6=$m_addr; //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize=(($6+12)|0); //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=HEAP32[(($topsize)>>2)]; //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp4=(($7)|0)!=0; //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp4) { __label__ = 7; break; } else { __label__ = 10; break; } //@line 3883 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $8=$m_addr; //@line 3884 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $9=$nb_addr; //@line 3884 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call5=_mmap_alloc($8, $9); //@line 3884 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mem=$call5; //@line 3884 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=$mem; //@line 3885 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp6=(($10)|0)!=0; //@line 3885 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp6) { __label__ = 8; break; } else { __label__ = 9; break; } //@line 3885 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $11=$mem; //@line 3886 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$11; //@line 3886 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 93; break; //@line 3886 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      __label__ = 10; break; //@line 3887 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $12=$m_addr; //@line 3911 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $mflags9=(($12+440)|0); //@line 3911 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $13=HEAP32[(($mflags9)>>2)]; //@line 3911 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and10=$13 & 4; //@line 3911 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool11=(($and10)|0)!=0; //@line 3911 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool11) { __label__ = 43; break; } else { __label__ = 11; break; } //@line 3911 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      $br=-1; //@line 3912 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=$m_addr; //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top=(($14+24)|0); //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $15=HEAP32[(($top)>>2)]; //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp13=(($15)|0)==0; //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp13) { __label__ = 12; break; } else { __label__ = 13; break; } //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $cond = 0;__label__ = 14; break; //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $16=$m_addr; //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $17=$m_addr; //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top14=(($17+24)|0); //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $18=HEAP32[(($top14)>>2)]; //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $19=$18; //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call15=_segment_holding($16, $19); //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $call15;__label__ = 14; break; //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $cond; //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $ss=$cond; //@line 3913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $asize=0; //@line 3914 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=$ss; //@line 3917 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp16=(($20)|0)==0; //@line 3917 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp16) { __label__ = 15; break; } else { __label__ = 23; break; } //@line 3917 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $call18=_sbrk(0); //@line 3918 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $base=$call18; //@line 3918 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=$base; //@line 3919 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp19=(($21)|0)!=-1; //@line 3919 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp19) { __label__ = 16; break; } else { __label__ = 22; break; } //@line 3919 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 16: 
      var $22=$nb_addr; //@line 3920 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($22)+(48))|0); //@line 3920 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $23=HEAP32[((((_mparams+8)|0))>>2)]; //@line 3920 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=((($23)-(1))|0); //@line 3920 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add21=((($add)+($sub))|0); //@line 3920 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $24=HEAP32[((((_mparams+8)|0))>>2)]; //@line 3920 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub22=((($24)-(1))|0); //@line 3920 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg=$sub22 ^ -1; //@line 3920 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and23=$add21 & $neg; //@line 3920 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $asize=$and23; //@line 3920 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $25=$base; //@line 3922 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $26=$25; //@line 3922 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $27=HEAP32[((((_mparams+4)|0))>>2)]; //@line 3922 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub24=((($27)-(1))|0); //@line 3922 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and25=$26 & $sub24; //@line 3922 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp26=(($and25)|0)==0; //@line 3922 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp26) { __label__ = 18; break; } else { __label__ = 17; break; } //@line 3922 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $28=$base; //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $29=$28; //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $30=HEAP32[((((_mparams+4)|0))>>2)]; //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub28=((($30)-(1))|0); //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add29=((($29)+($sub28))|0); //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $31=HEAP32[((((_mparams+4)|0))>>2)]; //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub30=((($31)-(1))|0); //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg31=$sub30 ^ -1; //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and32=$add29 & $neg31; //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $32=$base; //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $33=$32; //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub33=((($and32)-($33))|0); //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $34=$asize; //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add34=((($34)+($sub33))|0); //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $asize=$add34; //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 18; break; //@line 3923 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $35=$asize; //@line 3925 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp36=(($35)>>>0) < 2147483647; //@line 3925 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp36) { __label__ = 19; break; } else { __label__ = 21; break; } //@line 3925 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $36=$asize; //@line 3926 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call38=_sbrk($36); //@line 3926 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $br=$call38; //@line 3926 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $37=$base; //@line 3926 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp39=(($call38)|0)==(($37)|0); //@line 3926 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp39) { __label__ = 20; break; } else { __label__ = 21; break; } //@line 3926 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 20: 
      var $38=$base; //@line 3927 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tbase=$38; //@line 3927 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $39=$asize; //@line 3928 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tsize=$39; //@line 3928 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 21; break; //@line 3929 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 21: 
      __label__ = 22; break; //@line 3930 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 22: 
      __label__ = 27; break; //@line 3931 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 23: 
      var $40=$nb_addr; //@line 3934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $41=$m_addr; //@line 3934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize43=(($41+12)|0); //@line 3934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $42=HEAP32[(($topsize43)>>2)]; //@line 3934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub44=((($40)-($42))|0); //@line 3934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add45=((($sub44)+(48))|0); //@line 3934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $43=HEAP32[((((_mparams+8)|0))>>2)]; //@line 3934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub46=((($43)-(1))|0); //@line 3934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add47=((($add45)+($sub46))|0); //@line 3934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $44=HEAP32[((((_mparams+8)|0))>>2)]; //@line 3934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub48=((($44)-(1))|0); //@line 3934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg49=$sub48 ^ -1; //@line 3934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and50=$add47 & $neg49; //@line 3934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $asize=$and50; //@line 3934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $45=$asize; //@line 3936 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp51=(($45)>>>0) < 2147483647; //@line 3936 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp51) { __label__ = 24; break; } else { __label__ = 26; break; } //@line 3936 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $46=$asize; //@line 3937 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call53=_sbrk($46); //@line 3937 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $br=$call53; //@line 3937 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $47=$ss; //@line 3937 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base54=(($47)|0); //@line 3937 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $48=HEAP32[(($base54)>>2)]; //@line 3937 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $49=$ss; //@line 3937 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $size=(($49+4)|0); //@line 3937 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $50=HEAP32[(($size)>>2)]; //@line 3937 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($48+$50)|0); //@line 3937 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp55=(($call53)|0)==(($add_ptr)|0); //@line 3937 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp55) { __label__ = 25; break; } else { __label__ = 26; break; } //@line 3937 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $51=$br; //@line 3938 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tbase=$51; //@line 3938 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $52=$asize; //@line 3939 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tsize=$52; //@line 3939 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 26; break; //@line 3940 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 26: 
      __label__ = 27; break;
    case 27: 
      var $53=$tbase; //@line 3943 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp59=(($53)|0)==-1; //@line 3943 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp59) { __label__ = 28; break; } else { __label__ = 42; break; } //@line 3943 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 28: 
      var $54=$br; //@line 3944 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp61=(($54)|0)!=-1; //@line 3944 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp61) { __label__ = 29; break; } else { __label__ = 38; break; } //@line 3944 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 29: 
      var $55=$asize; //@line 3945 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp63=(($55)>>>0) < 2147483647; //@line 3945 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp63) { __label__ = 30; break; } else { __label__ = 37; break; } //@line 3945 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 30: 
      var $56=$asize; //@line 3945 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $57=$nb_addr; //@line 3945 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add65=((($57)+(48))|0); //@line 3945 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp66=(($56)>>>0) < (($add65)>>>0); //@line 3945 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp66) { __label__ = 31; break; } else { __label__ = 37; break; } //@line 3945 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $58=$nb_addr; //@line 3947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add68=((($58)+(48))|0); //@line 3947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $59=$asize; //@line 3947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub69=((($add68)-($59))|0); //@line 3947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $60=HEAP32[((((_mparams+8)|0))>>2)]; //@line 3947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub70=((($60)-(1))|0); //@line 3947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add71=((($sub69)+($sub70))|0); //@line 3947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $61=HEAP32[((((_mparams+8)|0))>>2)]; //@line 3947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub72=((($61)-(1))|0); //@line 3947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg73=$sub72 ^ -1; //@line 3947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and74=$add71 & $neg73; //@line 3947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $esize=$and74; //@line 3947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $62=$esize; //@line 3948 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp75=(($62)>>>0) < 2147483647; //@line 3948 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp75) { __label__ = 32; break; } else { __label__ = 36; break; } //@line 3948 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $63=$esize; //@line 3949 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call77=_sbrk($63); //@line 3949 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $end=$call77; //@line 3949 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $64=$end; //@line 3950 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp78=(($64)|0)!=-1; //@line 3950 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp78) { __label__ = 33; break; } else { __label__ = 34; break; } //@line 3950 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 33: 
      var $65=$esize; //@line 3951 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $66=$asize; //@line 3951 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add80=((($66)+($65))|0); //@line 3951 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $asize=$add80; //@line 3951 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 35; break; //@line 3951 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $67=$asize; //@line 3953 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub82=(((-$67))|0); //@line 3953 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call83=_sbrk($sub82); //@line 3953 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $br=-1; //@line 3954 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 35; break;
    case 35: 
      __label__ = 36; break; //@line 3956 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 36: 
      __label__ = 37; break; //@line 3957 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 37: 
      __label__ = 38; break; //@line 3958 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 38: 
      var $68=$br; //@line 3959 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp88=(($68)|0)!=-1; //@line 3959 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp88) { __label__ = 39; break; } else { __label__ = 40; break; } //@line 3959 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 39: 
      var $69=$br; //@line 3960 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tbase=$69; //@line 3960 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $70=$asize; //@line 3961 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tsize=$70; //@line 3961 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 41; break; //@line 3962 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 40: 
      var $71=$m_addr; //@line 3964 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $mflags91=(($71+440)|0); //@line 3964 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $72=HEAP32[(($mflags91)>>2)]; //@line 3964 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or=$72 | 4; //@line 3964 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($mflags91)>>2)]=$or; //@line 3964 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 41; break;
    case 41: 
      __label__ = 42; break; //@line 3965 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 42: 
      __label__ = 43; break; //@line 3968 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 43: 
      var $73=$tbase; //@line 3982 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp95=(($73)|0)==-1; //@line 3982 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp95) { __label__ = 44; break; } else { __label__ = 53; break; } //@line 3982 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 44: 
      var $74=$nb_addr; //@line 3983 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add98=((($74)+(48))|0); //@line 3983 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $75=HEAP32[((((_mparams+8)|0))>>2)]; //@line 3983 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub99=((($75)-(1))|0); //@line 3983 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add100=((($add98)+($sub99))|0); //@line 3983 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $76=HEAP32[((((_mparams+8)|0))>>2)]; //@line 3983 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub101=((($76)-(1))|0); //@line 3983 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg102=$sub101 ^ -1; //@line 3983 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and103=$add100 & $neg102; //@line 3983 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $asize97=$and103; //@line 3983 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $77=$asize97; //@line 3984 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp104=(($77)>>>0) < 2147483647; //@line 3984 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp104) { __label__ = 45; break; } else { __label__ = 52; break; } //@line 3984 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 45: 
      $br106=-1; //@line 3985 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $end107=-1; //@line 3986 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $78=$asize97; //@line 3988 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call108=_sbrk($78); //@line 3988 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $br106=$call108; //@line 3988 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call109=_sbrk(0); //@line 3989 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $end107=$call109; //@line 3989 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $79=$br106; //@line 3991 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp110=(($79)|0)!=-1; //@line 3991 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp110) { __label__ = 46; break; } else { __label__ = 51; break; } //@line 3991 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 46: 
      var $80=$end107; //@line 3991 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp112=(($80)|0)!=-1; //@line 3991 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp112) { __label__ = 47; break; } else { __label__ = 51; break; } //@line 3991 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 47: 
      var $81=$br106; //@line 3991 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $82=$end107; //@line 3991 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp114=(($81)>>>0) < (($82)>>>0); //@line 3991 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp114) { __label__ = 48; break; } else { __label__ = 51; break; } //@line 3991 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 48: 
      var $83=$end107; //@line 3992 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $84=$br106; //@line 3992 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_lhs_cast=$83; //@line 3992 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_rhs_cast=$84; //@line 3992 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_sub=((($sub_ptr_lhs_cast)-($sub_ptr_rhs_cast))|0); //@line 3992 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $ssize=$sub_ptr_sub; //@line 3992 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $85=$ssize; //@line 3993 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $86=$nb_addr; //@line 3993 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add116=((($86)+(40))|0); //@line 3993 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp117=(($85)>>>0) > (($add116)>>>0); //@line 3993 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp117) { __label__ = 49; break; } else { __label__ = 50; break; } //@line 3993 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 49: 
      var $87=$br106; //@line 3994 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tbase=$87; //@line 3994 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $88=$ssize; //@line 3995 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tsize=$88; //@line 3995 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 50; break; //@line 3996 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 50: 
      __label__ = 51; break; //@line 3997 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 51: 
      __label__ = 52; break; //@line 3998 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 52: 
      __label__ = 53; break; //@line 3999 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 53: 
      var $89=$tbase; //@line 4001 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp123=(($89)|0)!=-1; //@line 4001 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp123) { __label__ = 54; break; } else { __label__ = 92; break; } //@line 4001 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 54: 
      var $90=$tsize; //@line 4003 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $91=$m_addr; //@line 4003 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $footprint=(($91+432)|0); //@line 4003 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $92=HEAP32[(($footprint)>>2)]; //@line 4003 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add125=((($92)+($90))|0); //@line 4003 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($footprint)>>2)]=$add125; //@line 4003 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $93=$m_addr; //@line 4003 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $max_footprint=(($93+436)|0); //@line 4003 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $94=HEAPU32[(($max_footprint)>>2)]; //@line 4003 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp126=(($add125)>>>0) > (($94)>>>0); //@line 4003 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp126) { __label__ = 55; break; } else { __label__ = 56; break; } //@line 4003 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 55: 
      var $95=$m_addr; //@line 4004 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $footprint128=(($95+432)|0); //@line 4004 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $96=HEAP32[(($footprint128)>>2)]; //@line 4004 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $97=$m_addr; //@line 4004 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $max_footprint129=(($97+436)|0); //@line 4004 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($max_footprint129)>>2)]=$96; //@line 4004 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 56; break; //@line 4004 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 56: 
      var $98=$m_addr; //@line 4006 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top131=(($98+24)|0); //@line 4006 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $99=HEAP32[(($top131)>>2)]; //@line 4006 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp132=(($99)|0)!=0; //@line 4006 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp132) { __label__ = 64; break; } else { __label__ = 57; break; } //@line 4006 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 57: 
      var $100=$m_addr; //@line 4007 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($100+16)|0); //@line 4007 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $101=HEAP32[(($least_addr)>>2)]; //@line 4007 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp134=(($101)|0)==0; //@line 4007 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp134) { __label__ = 59; break; } else { __label__ = 58; break; } //@line 4007 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 58: 
      var $102=$tbase; //@line 4007 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $103=$m_addr; //@line 4007 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr135=(($103+16)|0); //@line 4007 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $104=HEAPU32[(($least_addr135)>>2)]; //@line 4007 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp136=(($102)>>>0) < (($104)>>>0); //@line 4007 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp136) { __label__ = 59; break; } else { __label__ = 60; break; } //@line 4007 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 59: 
      var $105=$tbase; //@line 4008 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $106=$m_addr; //@line 4008 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr138=(($106+16)|0); //@line 4008 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($least_addr138)>>2)]=$105; //@line 4008 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 60; break; //@line 4008 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 60: 
      var $107=$tbase; //@line 4009 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $108=$m_addr; //@line 4009 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $seg=(($108+444)|0); //@line 4009 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base140=(($seg)|0); //@line 4009 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($base140)>>2)]=$107; //@line 4009 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $109=$tsize; //@line 4010 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $110=$m_addr; //@line 4010 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $seg141=(($110+444)|0); //@line 4010 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $size142=(($seg141+4)|0); //@line 4010 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($size142)>>2)]=$109; //@line 4010 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $111=$mmap_flag; //@line 4011 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $112=$m_addr; //@line 4011 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $seg143=(($112+444)|0); //@line 4011 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sflags=(($seg143+12)|0); //@line 4011 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($sflags)>>2)]=$111; //@line 4011 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $113=HEAP32[((((_mparams)|0))>>2)]; //@line 4012 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $114=$m_addr; //@line 4012 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $magic=(($114+36)|0); //@line 4012 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($magic)>>2)]=$113; //@line 4012 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $115=$m_addr; //@line 4013 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $release_checks=(($115+32)|0); //@line 4013 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($release_checks)>>2)]=-1; //@line 4013 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $116=$m_addr; //@line 4014 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      _init_bins($116); //@line 4014 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $117=$m_addr; //@line 4016 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp144=(($117)|0)==((__gm_)|0); //@line 4016 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp144) { __label__ = 61; break; } else { __label__ = 62; break; } //@line 4016 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 61: 
      var $118=$m_addr; //@line 4017 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $119=$tbase; //@line 4017 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $120=$119; //@line 4017 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $121=$tsize; //@line 4017 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub146=((($121)-(40))|0); //@line 4017 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      _init_top($118, $120, $sub146); //@line 4017 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 63; break; //@line 4017 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 62: 
      var $122=$m_addr; //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $123=$122; //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr148=((($123)-(8))|0); //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $124=$add_ptr148; //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $125=$124; //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $126=$m_addr; //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $127=$126; //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr149=((($127)-(8))|0); //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $128=$add_ptr149; //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($128+4)|0); //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $129=HEAP32[(($head)>>2)]; //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and150=$129 & -8; //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr151=(($125+$and150)|0); //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $130=$add_ptr151; //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mn=$130; //@line 4022 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $131=$m_addr; //@line 4023 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $132=$mn; //@line 4023 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $133=$tbase; //@line 4023 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $134=$tsize; //@line 4023 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr152=(($133+$134)|0); //@line 4023 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $135=$mn; //@line 4023 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $136=$135; //@line 4023 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_lhs_cast153=$add_ptr152; //@line 4023 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_rhs_cast154=$136; //@line 4023 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_sub155=((($sub_ptr_lhs_cast153)-($sub_ptr_rhs_cast154))|0); //@line 4023 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub156=((($sub_ptr_sub155)-(40))|0); //@line 4023 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      _init_top($131, $132, $sub156); //@line 4023 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 63; break;
    case 63: 
      __label__ = 89; break; //@line 4025 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 64: 
      var $137=$m_addr; //@line 4029 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $seg159=(($137+444)|0); //@line 4029 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sp=$seg159; //@line 4029 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 65; break; //@line 4031 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 65: 
      var $138=$sp; //@line 4031 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp160=(($138)|0)!=0; //@line 4031 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp160) { __label__ = 66; break; } else { var $144 = 0;__label__ = 67; break; } //@line 4031 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 66: 
      var $139=$tbase; //@line 4031 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $140=$sp; //@line 4031 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base161=(($140)|0); //@line 4031 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $141=HEAP32[(($base161)>>2)]; //@line 4031 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $142=$sp; //@line 4031 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $size162=(($142+4)|0); //@line 4031 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $143=HEAP32[(($size162)>>2)]; //@line 4031 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr163=(($141+$143)|0); //@line 4031 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp164=(($139)|0)!=(($add_ptr163)|0); //@line 4031 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $144 = $cmp164;__label__ = 67; break;
    case 67: 
      var $144;
      if ($144) { __label__ = 68; break; } else { __label__ = 69; break; }
    case 68: 
      var $145=$sp; //@line 4032 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $next=(($145+8)|0); //@line 4032 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $146=HEAP32[(($next)>>2)]; //@line 4032 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sp=$146; //@line 4032 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 65; break; //@line 4032 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 69: 
      var $147=$sp; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp165=(($147)|0)!=0; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp165) { __label__ = 70; break; } else { __label__ = 75; break; } //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 70: 
      var $148=$sp; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sflags167=(($148+12)|0); //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $149=HEAP32[(($sflags167)>>2)]; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and168=$149 & 8; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool169=(($and168)|0)!=0; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool169) { __label__ = 75; break; } else { __label__ = 71; break; } //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 71: 
      var $150=$sp; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sflags171=(($150+12)|0); //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $151=HEAP32[(($sflags171)>>2)]; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and172=$151 & 0; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $152=$mmap_flag; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp173=(($and172)|0)==(($152)|0); //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp173) { __label__ = 72; break; } else { __label__ = 75; break; } //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 72: 
      var $153=$m_addr; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top175=(($153+24)|0); //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $154=HEAP32[(($top175)>>2)]; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $155=$154; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $156=$sp; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base176=(($156)|0); //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $157=HEAPU32[(($base176)>>2)]; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp177=(($155)>>>0) >= (($157)>>>0); //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp177) { __label__ = 73; break; } else { __label__ = 75; break; } //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 73: 
      var $158=$m_addr; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top179=(($158+24)|0); //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $159=HEAP32[(($top179)>>2)]; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $160=$159; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $161=$sp; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base180=(($161)|0); //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $162=HEAP32[(($base180)>>2)]; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $163=$sp; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $size181=(($163+4)|0); //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $164=HEAP32[(($size181)>>2)]; //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr182=(($162+$164)|0); //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp183=(($160)>>>0) < (($add_ptr182)>>>0); //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp183) { __label__ = 74; break; } else { __label__ = 75; break; } //@line 4033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 74: 
      var $165=$tsize; //@line 4037 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $166=$sp; //@line 4037 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $size185=(($166+4)|0); //@line 4037 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $167=HEAP32[(($size185)>>2)]; //@line 4037 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add186=((($167)+($165))|0); //@line 4037 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($size185)>>2)]=$add186; //@line 4037 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $168=$m_addr; //@line 4038 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $169=$m_addr; //@line 4038 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top187=(($169+24)|0); //@line 4038 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $170=HEAP32[(($top187)>>2)]; //@line 4038 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $171=$m_addr; //@line 4038 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize188=(($171+12)|0); //@line 4038 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $172=HEAP32[(($topsize188)>>2)]; //@line 4038 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $173=$tsize; //@line 4038 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add189=((($172)+($173))|0); //@line 4038 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      _init_top($168, $170, $add189); //@line 4038 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 88; break; //@line 4039 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 75: 
      var $174=$tbase; //@line 4041 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $175=$m_addr; //@line 4041 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr191=(($175+16)|0); //@line 4041 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $176=HEAPU32[(($least_addr191)>>2)]; //@line 4041 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp192=(($174)>>>0) < (($176)>>>0); //@line 4041 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp192) { __label__ = 76; break; } else { __label__ = 77; break; } //@line 4041 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 76: 
      var $177=$tbase; //@line 4042 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $178=$m_addr; //@line 4042 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr194=(($178+16)|0); //@line 4042 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($least_addr194)>>2)]=$177; //@line 4042 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 77; break; //@line 4042 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 77: 
      var $179=$m_addr; //@line 4043 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $seg196=(($179+444)|0); //@line 4043 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sp=$seg196; //@line 4043 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 78; break; //@line 4044 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 78: 
      var $180=$sp; //@line 4044 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp198=(($180)|0)!=0; //@line 4044 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp198) { __label__ = 79; break; } else { var $185 = 0;__label__ = 80; break; } //@line 4044 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 79: 
      var $181=$sp; //@line 4044 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base200=(($181)|0); //@line 4044 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $182=HEAP32[(($base200)>>2)]; //@line 4044 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $183=$tbase; //@line 4044 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $184=$tsize; //@line 4044 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr201=(($183+$184)|0); //@line 4044 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp202=(($182)|0)!=(($add_ptr201)|0); //@line 4044 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $185 = $cmp202;__label__ = 80; break;
    case 80: 
      var $185;
      if ($185) { __label__ = 81; break; } else { __label__ = 82; break; }
    case 81: 
      var $186=$sp; //@line 4045 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $next205=(($186+8)|0); //@line 4045 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $187=HEAP32[(($next205)>>2)]; //@line 4045 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sp=$187; //@line 4045 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 78; break; //@line 4045 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 82: 
      var $188=$sp; //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp207=(($188)|0)!=0; //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp207) { __label__ = 83; break; } else { __label__ = 86; break; } //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 83: 
      var $189=$sp; //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sflags209=(($189+12)|0); //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $190=HEAP32[(($sflags209)>>2)]; //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and210=$190 & 8; //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool211=(($and210)|0)!=0; //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool211) { __label__ = 86; break; } else { __label__ = 84; break; } //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 84: 
      var $191=$sp; //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sflags213=(($191+12)|0); //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $192=HEAP32[(($sflags213)>>2)]; //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and214=$192 & 0; //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $193=$mmap_flag; //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp215=(($and214)|0)==(($193)|0); //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp215) { __label__ = 85; break; } else { __label__ = 86; break; } //@line 4046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 85: 
      var $194=$sp; //@line 4049 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base217=(($194)|0); //@line 4049 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $195=HEAP32[(($base217)>>2)]; //@line 4049 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $oldbase=$195; //@line 4049 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $196=$tbase; //@line 4050 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $197=$sp; //@line 4050 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base218=(($197)|0); //@line 4050 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($base218)>>2)]=$196; //@line 4050 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $198=$tsize; //@line 4051 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $199=$sp; //@line 4051 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $size219=(($199+4)|0); //@line 4051 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $200=HEAP32[(($size219)>>2)]; //@line 4051 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add220=((($200)+($198))|0); //@line 4051 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($size219)>>2)]=$add220; //@line 4051 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $201=$m_addr; //@line 4052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $202=$tbase; //@line 4052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $203=$oldbase; //@line 4052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $204=$nb_addr; //@line 4052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call221=_prepend_alloc($201, $202, $203, $204); //@line 4052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$call221; //@line 4052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 93; break; //@line 4052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 86: 
      var $205=$m_addr; //@line 4055 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $206=$tbase; //@line 4055 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $207=$tsize; //@line 4055 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $208=$mmap_flag; //@line 4055 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      _add_segment($205, $206, $207, $208); //@line 4055 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 87; break;
    case 87: 
      __label__ = 88; break;
    case 88: 
      __label__ = 89; break;
    case 89: 
      var $209=$nb_addr; //@line 4059 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $210=$m_addr; //@line 4059 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize226=(($210+12)|0); //@line 4059 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $211=HEAPU32[(($topsize226)>>2)]; //@line 4059 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp227=(($209)>>>0) < (($211)>>>0); //@line 4059 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp227) { __label__ = 90; break; } else { __label__ = 91; break; } //@line 4059 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 90: 
      var $212=$nb_addr; //@line 4060 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $213=$m_addr; //@line 4060 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize229=(($213+12)|0); //@line 4060 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $214=HEAP32[(($topsize229)>>2)]; //@line 4060 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub230=((($214)-($212))|0); //@line 4060 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($topsize229)>>2)]=$sub230; //@line 4060 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rsize=$sub230; //@line 4060 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $215=$m_addr; //@line 4061 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top231=(($215+24)|0); //@line 4061 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $216=HEAP32[(($top231)>>2)]; //@line 4061 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p=$216; //@line 4061 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $217=$p; //@line 4062 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $218=$217; //@line 4062 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $219=$nb_addr; //@line 4062 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr232=(($218+$219)|0); //@line 4062 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $220=$add_ptr232; //@line 4062 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $221=$m_addr; //@line 4062 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top233=(($221+24)|0); //@line 4062 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($top233)>>2)]=$220; //@line 4062 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $r=$220; //@line 4062 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $222=$rsize; //@line 4063 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or234=$222 | 1; //@line 4063 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $223=$r; //@line 4063 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head235=(($223+4)|0); //@line 4063 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head235)>>2)]=$or234; //@line 4063 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $224=$nb_addr; //@line 4064 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or236=$224 | 1; //@line 4064 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or237=$or236 | 2; //@line 4064 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $225=$p; //@line 4064 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head238=(($225+4)|0); //@line 4064 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head238)>>2)]=$or237; //@line 4064 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $226=$p; //@line 4067 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $227=$226; //@line 4067 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr239=(($227+8)|0); //@line 4067 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$add_ptr239; //@line 4067 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 93; break; //@line 4067 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 91: 
      __label__ = 92; break; //@line 4069 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 92: 
      var $call242=___errno(); //@line 4071 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($call242)>>2)]=12; //@line 4071 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=0; //@line 4072 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 93; break; //@line 4072 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 93: 
      var $228=$retval; //@line 4073 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $228; //@line 4073 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_sys_alloc["X"]=1;

function _free($mem) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $mem_addr;
      var $p;
      var $psize;
      var $next;
      var $prevsize;
      var $prev;
      var $F;
      var $B;
      var $I;
      var $TP;
      var $XP;
      var $R;
      var $F60;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $tsize;
      var $dsize;
      var $nsize;
      var $F245;
      var $B247;
      var $I249;
      var $TP285;
      var $XP286;
      var $R288;
      var $F293;
      var $RP306;
      var $CP317;
      var $H343;
      var $C0385;
      var $C1386;
      var $I447;
      var $B449;
      var $F452;
      var $tp;
      var $H475;
      var $I476;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K525;
      var $C;
      var $F558;
      $mem_addr=$mem;
      var $0=$mem_addr; //@line 4740 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)!=0; //@line 4740 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 197; break; } //@line 4740 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $1=$mem_addr; //@line 4741 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=((($1)-(8))|0); //@line 4741 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$add_ptr; //@line 4741 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p=$2; //@line 4741 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=$p; //@line 4753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=$3; //@line 4753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($4)>>>0) >= (($5)>>>0); //@line 4753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 4; break; } else { var $8 = 0;__label__ = 5; break; } //@line 4753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $6=$p; //@line 4753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($6+4)|0); //@line 4753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=HEAP32[(($head)>>2)]; //@line 4753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$7 & 3; //@line 4753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp2=(($and)|0)!=1; //@line 4753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8 = $cmp2;__label__ = 5; break;
    case 5: 
      var $8;
      var $land_ext=(($8)&1);
      var $expval=(($land_ext)==(1));
      var $tobool=(($expval)|0)!=0;
      if ($tobool) { __label__ = 6; break; } else { __label__ = 194; break; }
    case 6: 
      var $9=$p; //@line 4754 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head4=(($9+4)|0); //@line 4754 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=HEAP32[(($head4)>>2)]; //@line 4754 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and5=$10 & -8; //@line 4754 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $psize=$and5; //@line 4754 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=$p; //@line 4755 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=$11; //@line 4755 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $13=$psize; //@line 4755 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr6=(($12+$13)|0); //@line 4755 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=$add_ptr6; //@line 4755 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $next=$14; //@line 4755 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $15=$p; //@line 4756 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head7=(($15+4)|0); //@line 4756 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=HEAP32[(($head7)>>2)]; //@line 4756 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and8=$16 & 1; //@line 4756 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool9=(($and8)|0)!=0; //@line 4756 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool9) { __label__ = 78; break; } else { __label__ = 7; break; } //@line 4756 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $17=$p; //@line 4757 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($17)|0); //@line 4757 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $18=HEAP32[(($prev_foot)>>2)]; //@line 4757 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $prevsize=$18; //@line 4757 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $19=$p; //@line 4758 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head11=(($19+4)|0); //@line 4758 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=HEAP32[(($head11)>>2)]; //@line 4758 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and12=$20 & 3; //@line 4758 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp13=(($and12)|0)==0; //@line 4758 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp13) { __label__ = 8; break; } else { __label__ = 9; break; } //@line 4758 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $21=$prevsize; //@line 4759 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($21)+(16))|0); //@line 4759 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $22=$psize; //@line 4759 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add15=((($22)+($add))|0); //@line 4759 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $psize=$add15; //@line 4759 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 196; break; //@line 4762 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $23=$p; //@line 4765 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $24=$23; //@line 4765 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $25=$prevsize; //@line 4765 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $idx_neg=(((-$25))|0); //@line 4765 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr16=(($24+$idx_neg)|0); //@line 4765 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $26=$add_ptr16; //@line 4765 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $prev=$26; //@line 4765 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $27=$prevsize; //@line 4766 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=$psize; //@line 4766 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add17=((($28)+($27))|0); //@line 4766 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $psize=$add17; //@line 4766 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $29=$prev; //@line 4767 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p=$29; //@line 4767 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $30=$prev; //@line 4768 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $31=$30; //@line 4768 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $32=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4768 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp18=(($31)>>>0) >= (($32)>>>0); //@line 4768 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv=(($cmp18)&1); //@line 4768 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval19=(($conv)==(1)); //@line 4768 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool20=(($expval19)|0)!=0; //@line 4768 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool20) { __label__ = 10; break; } else { __label__ = 75; break; } //@line 4768 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $33=$p; //@line 4769 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $34=HEAP32[((((__gm_+20)|0))>>2)]; //@line 4769 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp22=(($33)|0)!=(($34)|0); //@line 4769 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp22) { __label__ = 11; break; } else { __label__ = 71; break; } //@line 4769 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $35=$prevsize; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr=$35 >>> 3; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp25=(($shr)>>>0) < 32; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp25) { __label__ = 12; break; } else { __label__ = 24; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $36=$p; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd=(($36+8)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $37=HEAP32[(($fd)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F=$37; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $38=$p; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk=(($38+12)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $39=HEAP32[(($bk)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $B=$39; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $40=$prevsize; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr28=$40 >>> 3; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $I=$shr28; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $41=$F; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $42=$B; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp29=(($41)|0)==(($42)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp29) { __label__ = 13; break; } else { __label__ = 14; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $43=$I; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl=1 << $43; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg=$shl ^ -1; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $44=HEAP32[((((__gm_)|0))>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and32=$44 & $neg; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_)|0))>>2)]=$and32; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 23; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $45=$F; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $46=$I; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl34=$46 << 1; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=((((__gm_+40)|0)+($shl34<<2))|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $47=$arrayidx; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $48=$47; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp35=(($45)|0)==(($48)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp35) { __label__ = 16; break; } else { __label__ = 15; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $49=$F; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $50=$49; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $51=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp37=(($50)>>>0) >= (($51)>>>0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp37) { __label__ = 16; break; } else { var $60 = 0;__label__ = 19; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 16: 
      var $52=$B; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $53=$I; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl40=$53 << 1; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx41=((((__gm_+40)|0)+($shl40<<2))|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $54=$arrayidx41; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $55=$54; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp42=(($52)|0)==(($55)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp42) { var $59 = 1;__label__ = 18; break; } else { __label__ = 17; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $56=$B; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $57=$56; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $58=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp44=(($57)>>>0) >= (($58)>>>0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $59 = $cmp44;__label__ = 18; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $59;
      var $60 = $59;__label__ = 19; break;
    case 19: 
      var $60;
      var $land_ext47=(($60)&1);
      var $expval48=(($land_ext47)==(1));
      var $tobool49=(($expval48)|0)!=0;
      if ($tobool49) { __label__ = 20; break; } else { __label__ = 21; break; }
    case 20: 
      var $61=$B; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $62=$F; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk51=(($62+12)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk51)>>2)]=$61; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $63=$F; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $64=$B; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd52=(($64+8)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd52)>>2)]=$63; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 22; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 21: 
      _abort(); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 22: 
      __label__ = 23; break;
    case 23: 
      __label__ = 70; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $65=$p; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $66=$65; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $TP=$66; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $67=$TP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent=(($67+24)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $68=HEAP32[(($parent)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $XP=$68; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $69=$TP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk56=(($69+12)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $70=HEAP32[(($bk56)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $71=$TP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp57=(($70)|0)!=(($71)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp57) { __label__ = 25; break; } else { __label__ = 29; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $72=$TP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd61=(($72+8)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $73=HEAP32[(($fd61)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F60=$73; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $74=$TP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk62=(($74+12)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $75=HEAP32[(($bk62)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$75; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $76=$F60; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $77=$76; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $78=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp63=(($77)>>>0) >= (($78)>>>0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv64=(($cmp63)&1); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval65=(($conv64)==(1)); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool66=(($expval65)|0)!=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool66) { __label__ = 26; break; } else { __label__ = 27; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $79=$R; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $80=$F60; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk68=(($80+12)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk68)>>2)]=$79; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $81=$F60; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $82=$R; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd69=(($82+8)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd69)>>2)]=$81; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 28; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 27: 
      _abort(); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 28: 
      __label__ = 41; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 29: 
      var $83=$TP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child=(($83+16)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx73=(($child+4)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx73; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $84=HEAP32[(($arrayidx73)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$84; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp74=(($84)|0)!=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp74) { __label__ = 31; break; } else { __label__ = 30; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 30: 
      var $85=$TP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child77=(($85+16)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx78=(($child77)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx78; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $86=HEAP32[(($arrayidx78)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$86; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp79=(($86)|0)!=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp79) { __label__ = 31; break; } else { __label__ = 40; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 31: 
      __label__ = 32; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $87=$R; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child82=(($87+16)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx83=(($child82+4)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx83; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $88=HEAP32[(($arrayidx83)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp84=(($88)|0)!=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp84) { var $91 = 1;__label__ = 34; break; } else { __label__ = 33; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 33: 
      var $89=$R; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child87=(($89+16)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx88=(($child87)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx88; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $90=HEAP32[(($arrayidx88)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp89=(($90)|0)!=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $91 = $cmp89;__label__ = 34; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $91;
      if ($91) { __label__ = 35; break; } else { __label__ = 36; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 35: 
      var $92=$CP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$92; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $93=HEAP32[(($92)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$93; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 32; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 36: 
      var $94=$RP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $95=$94; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $96=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp92=(($95)>>>0) >= (($96)>>>0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv93=(($cmp92)&1); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval94=(($conv93)==(1)); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool95=(($expval94)|0)!=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool95) { __label__ = 37; break; } else { __label__ = 38; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 37: 
      var $97=$RP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($97)>>2)]=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 39; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 38: 
      _abort(); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 39: 
      __label__ = 40; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 40: 
      __label__ = 41; break;
    case 41: 
      var $98=$XP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp101=(($98)|0)!=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp101) { __label__ = 42; break; } else { __label__ = 69; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 42: 
      var $99=$TP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index=(($99+28)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $100=HEAP32[(($index)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx104=((((__gm_+304)|0)+($100<<2))|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $H=$arrayidx104; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $101=$TP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $102=$H; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $103=HEAP32[(($102)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp105=(($101)|0)==(($103)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp105) { __label__ = 43; break; } else { __label__ = 46; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 43: 
      var $104=$R; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $105=$H; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($105)>>2)]=$104; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp108=(($104)|0)==0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp108) { __label__ = 44; break; } else { __label__ = 45; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 44: 
      var $106=$TP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index111=(($106+28)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $107=HEAP32[(($index111)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl112=1 << $107; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg113=$shl112 ^ -1; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $108=HEAP32[((((__gm_+4)|0))>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and114=$108 & $neg113; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+4)|0))>>2)]=$and114; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 45; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 45: 
      __label__ = 53; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 46: 
      var $109=$XP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $110=$109; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $111=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp117=(($110)>>>0) >= (($111)>>>0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv118=(($cmp117)&1); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval119=(($conv118)==(1)); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool120=(($expval119)|0)!=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool120) { __label__ = 47; break; } else { __label__ = 51; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 47: 
      var $112=$XP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child122=(($112+16)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx123=(($child122)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $113=HEAP32[(($arrayidx123)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $114=$TP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp124=(($113)|0)==(($114)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp124) { __label__ = 48; break; } else { __label__ = 49; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 48: 
      var $115=$R; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $116=$XP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child127=(($116+16)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx128=(($child127)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx128)>>2)]=$115; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 50; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 49: 
      var $117=$R; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $118=$XP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child130=(($118+16)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx131=(($child130+4)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx131)>>2)]=$117; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 50; break;
    case 50: 
      __label__ = 52; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 51: 
      _abort(); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 52: 
      __label__ = 53; break;
    case 53: 
      var $119=$R; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp136=(($119)|0)!=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp136) { __label__ = 54; break; } else { __label__ = 68; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 54: 
      var $120=$R; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $121=$120; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $122=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp139=(($121)>>>0) >= (($122)>>>0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv140=(($cmp139)&1); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval141=(($conv140)==(1)); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool142=(($expval141)|0)!=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool142) { __label__ = 55; break; } else { __label__ = 66; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 55: 
      var $123=$XP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $124=$R; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent144=(($124+24)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent144)>>2)]=$123; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $125=$TP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child145=(($125+16)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx146=(($child145)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $126=HEAP32[(($arrayidx146)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C0=$126; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp147=(($126)|0)!=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp147) { __label__ = 56; break; } else { __label__ = 60; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 56: 
      var $127=$C0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $128=$127; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $129=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp150=(($128)>>>0) >= (($129)>>>0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv151=(($cmp150)&1); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval152=(($conv151)==(1)); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool153=(($expval152)|0)!=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool153) { __label__ = 57; break; } else { __label__ = 58; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 57: 
      var $130=$C0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $131=$R; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child155=(($131+16)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx156=(($child155)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx156)>>2)]=$130; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $132=$R; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $133=$C0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent157=(($133+24)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent157)>>2)]=$132; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 59; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 58: 
      _abort(); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 59: 
      __label__ = 60; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 60: 
      var $134=$TP; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child161=(($134+16)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx162=(($child161+4)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $135=HEAP32[(($arrayidx162)>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C1=$135; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp163=(($135)|0)!=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp163) { __label__ = 61; break; } else { __label__ = 65; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 61: 
      var $136=$C1; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $137=$136; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $138=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp166=(($137)>>>0) >= (($138)>>>0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv167=(($cmp166)&1); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval168=(($conv167)==(1)); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool169=(($expval168)|0)!=0; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool169) { __label__ = 62; break; } else { __label__ = 63; break; } //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 62: 
      var $139=$C1; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $140=$R; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child171=(($140+16)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx172=(($child171+4)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx172)>>2)]=$139; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $141=$R; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $142=$C1; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent173=(($142+24)|0); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent173)>>2)]=$141; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 64; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 63: 
      _abort(); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 64: 
      __label__ = 65; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 65: 
      __label__ = 67; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 66: 
      _abort(); //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 67: 
      __label__ = 68; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 68: 
      __label__ = 69; break; //@line 4770 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 69: 
      __label__ = 70; break;
    case 70: 
      __label__ = 74; break; //@line 4771 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 71: 
      var $143=$next; //@line 4772 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head183=(($143+4)|0); //@line 4772 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $144=HEAP32[(($head183)>>2)]; //@line 4772 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and184=$144 & 3; //@line 4772 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp185=(($and184)|0)==3; //@line 4772 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp185) { __label__ = 72; break; } else { __label__ = 73; break; } //@line 4772 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 72: 
      var $145=$psize; //@line 4773 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+8)|0))>>2)]=$145; //@line 4773 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $146=$next; //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head188=(($146+4)|0); //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $147=HEAP32[(($head188)>>2)]; //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and189=$147 & -2; //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head188)>>2)]=$and189; //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $148=$psize; //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or=$148 | 1; //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $149=$p; //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head190=(($149+4)|0); //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head190)>>2)]=$or; //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $150=$psize; //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $151=$p; //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $152=$151; //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $153=$psize; //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr191=(($152+$153)|0); //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $154=$add_ptr191; //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot192=(($154)|0); //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot192)>>2)]=$150; //@line 4774 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 196; break; //@line 4775 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 73: 
      __label__ = 74; break;
    case 74: 
      __label__ = 76; break; //@line 4777 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 75: 
      __label__ = 195; break; //@line 4779 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 76: 
      __label__ = 77; break;
    case 77: 
      __label__ = 78; break; //@line 4781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 78: 
      var $155=$p; //@line 4783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $156=$155; //@line 4783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $157=$next; //@line 4783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $158=$157; //@line 4783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp199=(($156)>>>0) < (($158)>>>0); //@line 4783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp199) { __label__ = 79; break; } else { var $161 = 0;__label__ = 80; break; } //@line 4783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 79: 
      var $159=$next; //@line 4783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head202=(($159+4)|0); //@line 4783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $160=HEAP32[(($head202)>>2)]; //@line 4783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and203=$160 & 1; //@line 4783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool204=(($and203)|0)!=0; //@line 4783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $161 = $tobool204;__label__ = 80; break;
    case 80: 
      var $161;
      var $land_ext206=(($161)&1);
      var $expval207=(($land_ext206)==(1));
      var $tobool208=(($expval207)|0)!=0;
      if ($tobool208) { __label__ = 81; break; } else { __label__ = 193; break; }
    case 81: 
      var $162=$next; //@line 4784 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head210=(($162+4)|0); //@line 4784 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $163=HEAP32[(($head210)>>2)]; //@line 4784 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and211=$163 & 2; //@line 4784 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool212=(($and211)|0)!=0; //@line 4784 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool212) { __label__ = 154; break; } else { __label__ = 82; break; } //@line 4784 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 82: 
      var $164=$next; //@line 4785 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $165=HEAP32[((((__gm_+24)|0))>>2)]; //@line 4785 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp214=(($164)|0)==(($165)|0); //@line 4785 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp214) { __label__ = 83; break; } else { __label__ = 88; break; } //@line 4785 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 83: 
      var $166=$psize; //@line 4786 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $167=HEAP32[((((__gm_+12)|0))>>2)]; //@line 4786 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add217=((($167)+($166))|0); //@line 4786 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+12)|0))>>2)]=$add217; //@line 4786 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tsize=$add217; //@line 4786 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $168=$p; //@line 4787 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+24)|0))>>2)]=$168; //@line 4787 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $169=$tsize; //@line 4788 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or218=$169 | 1; //@line 4788 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $170=$p; //@line 4788 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head219=(($170+4)|0); //@line 4788 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head219)>>2)]=$or218; //@line 4788 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $171=$p; //@line 4789 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $172=HEAP32[((((__gm_+20)|0))>>2)]; //@line 4789 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp220=(($171)|0)==(($172)|0); //@line 4789 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp220) { __label__ = 84; break; } else { __label__ = 85; break; } //@line 4789 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 84: 
      HEAP32[((((__gm_+20)|0))>>2)]=0; //@line 4790 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+8)|0))>>2)]=0; //@line 4791 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 85; break; //@line 4792 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 85: 
      var $173=$tsize; //@line 4793 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $174=HEAPU32[((((__gm_+28)|0))>>2)]; //@line 4793 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp224=(($173)>>>0) > (($174)>>>0); //@line 4793 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp224) { __label__ = 86; break; } else { __label__ = 87; break; } //@line 4793 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 86: 
      var $call=_sys_trim(__gm_, 0); //@line 4794 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 87; break; //@line 4794 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 87: 
      __label__ = 196; break; //@line 4795 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 88: 
      var $175=$next; //@line 4797 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $176=HEAP32[((((__gm_+20)|0))>>2)]; //@line 4797 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp229=(($175)|0)==(($176)|0); //@line 4797 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp229) { __label__ = 89; break; } else { __label__ = 90; break; } //@line 4797 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 89: 
      var $177=$psize; //@line 4798 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $178=HEAP32[((((__gm_+8)|0))>>2)]; //@line 4798 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add232=((($178)+($177))|0); //@line 4798 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+8)|0))>>2)]=$add232; //@line 4798 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $dsize=$add232; //@line 4798 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $179=$p; //@line 4799 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+20)|0))>>2)]=$179; //@line 4799 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $180=$dsize; //@line 4800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or233=$180 | 1; //@line 4800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $181=$p; //@line 4800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head234=(($181+4)|0); //@line 4800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head234)>>2)]=$or233; //@line 4800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $182=$dsize; //@line 4800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $183=$p; //@line 4800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $184=$183; //@line 4800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $185=$dsize; //@line 4800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr235=(($184+$185)|0); //@line 4800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $186=$add_ptr235; //@line 4800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot236=(($186)|0); //@line 4800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot236)>>2)]=$182; //@line 4800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 196; break; //@line 4801 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 90: 
      var $187=$next; //@line 4804 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head238=(($187+4)|0); //@line 4804 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $188=HEAP32[(($head238)>>2)]; //@line 4804 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and239=$188 & -8; //@line 4804 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $nsize=$and239; //@line 4804 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $189=$nsize; //@line 4805 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $190=$psize; //@line 4805 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add240=((($190)+($189))|0); //@line 4805 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $psize=$add240; //@line 4805 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $191=$nsize; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr241=$191 >>> 3; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp242=(($shr241)>>>0) < 32; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp242) { __label__ = 91; break; } else { __label__ = 103; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 91: 
      var $192=$next; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd246=(($192+8)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $193=HEAP32[(($fd246)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F245=$193; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $194=$next; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk248=(($194+12)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $195=HEAP32[(($bk248)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $B247=$195; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $196=$nsize; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr250=$196 >>> 3; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $I249=$shr250; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $197=$F245; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $198=$B247; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp251=(($197)|0)==(($198)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp251) { __label__ = 92; break; } else { __label__ = 93; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 92: 
      var $199=$I249; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl254=1 << $199; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg255=$shl254 ^ -1; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $200=HEAP32[((((__gm_)|0))>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and256=$200 & $neg255; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_)|0))>>2)]=$and256; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 102; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 93: 
      var $201=$F245; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $202=$I249; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl258=$202 << 1; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx259=((((__gm_+40)|0)+($shl258<<2))|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $203=$arrayidx259; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $204=$203; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp260=(($201)|0)==(($204)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp260) { __label__ = 95; break; } else { __label__ = 94; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 94: 
      var $205=$F245; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $206=$205; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $207=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp263=(($206)>>>0) >= (($207)>>>0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp263) { __label__ = 95; break; } else { var $216 = 0;__label__ = 98; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 95: 
      var $208=$B247; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $209=$I249; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl266=$209 << 1; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx267=((((__gm_+40)|0)+($shl266<<2))|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $210=$arrayidx267; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $211=$210; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp268=(($208)|0)==(($211)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp268) { var $215 = 1;__label__ = 97; break; } else { __label__ = 96; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 96: 
      var $212=$B247; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $213=$212; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $214=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp271=(($213)>>>0) >= (($214)>>>0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $215 = $cmp271;__label__ = 97; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 97: 
      var $215;
      var $216 = $215;__label__ = 98; break;
    case 98: 
      var $216;
      var $land_ext275=(($216)&1);
      var $expval276=(($land_ext275)==(1));
      var $tobool277=(($expval276)|0)!=0;
      if ($tobool277) { __label__ = 99; break; } else { __label__ = 100; break; }
    case 99: 
      var $217=$B247; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $218=$F245; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk279=(($218+12)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk279)>>2)]=$217; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $219=$F245; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $220=$B247; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd280=(($220+8)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd280)>>2)]=$219; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 101; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 100: 
      _abort(); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 101: 
      __label__ = 102; break;
    case 102: 
      __label__ = 149; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 103: 
      var $221=$next; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $222=$221; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $TP285=$222; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $223=$TP285; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent287=(($223+24)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $224=HEAP32[(($parent287)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $XP286=$224; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $225=$TP285; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk289=(($225+12)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $226=HEAP32[(($bk289)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $227=$TP285; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp290=(($226)|0)!=(($227)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp290) { __label__ = 104; break; } else { __label__ = 108; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 104: 
      var $228=$TP285; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd294=(($228+8)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $229=HEAP32[(($fd294)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F293=$229; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $230=$TP285; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk295=(($230+12)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $231=HEAP32[(($bk295)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R288=$231; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $232=$F293; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $233=$232; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $234=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp296=(($233)>>>0) >= (($234)>>>0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv297=(($cmp296)&1); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval298=(($conv297)==(1)); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool299=(($expval298)|0)!=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool299) { __label__ = 105; break; } else { __label__ = 106; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 105: 
      var $235=$R288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $236=$F293; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk301=(($236+12)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk301)>>2)]=$235; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $237=$F293; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $238=$R288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd302=(($238+8)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd302)>>2)]=$237; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 107; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 106: 
      _abort(); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 107: 
      __label__ = 120; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 108: 
      var $239=$TP285; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child307=(($239+16)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx308=(($child307+4)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP306=$arrayidx308; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $240=HEAP32[(($arrayidx308)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R288=$240; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp309=(($240)|0)!=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp309) { __label__ = 110; break; } else { __label__ = 109; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 109: 
      var $241=$TP285; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child312=(($241+16)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx313=(($child312)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP306=$arrayidx313; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $242=HEAP32[(($arrayidx313)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R288=$242; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp314=(($242)|0)!=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp314) { __label__ = 110; break; } else { __label__ = 119; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 110: 
      __label__ = 111; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 111: 
      var $243=$R288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child319=(($243+16)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx320=(($child319+4)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $CP317=$arrayidx320; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $244=HEAP32[(($arrayidx320)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp321=(($244)|0)!=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp321) { var $247 = 1;__label__ = 113; break; } else { __label__ = 112; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 112: 
      var $245=$R288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child324=(($245+16)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx325=(($child324)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $CP317=$arrayidx325; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $246=HEAP32[(($arrayidx325)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp326=(($246)|0)!=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $247 = $cmp326;__label__ = 113; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 113: 
      var $247;
      if ($247) { __label__ = 114; break; } else { __label__ = 115; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 114: 
      var $248=$CP317; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP306=$248; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $249=HEAP32[(($248)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R288=$249; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 111; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 115: 
      var $250=$RP306; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $251=$250; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $252=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp331=(($251)>>>0) >= (($252)>>>0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv332=(($cmp331)&1); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval333=(($conv332)==(1)); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool334=(($expval333)|0)!=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool334) { __label__ = 116; break; } else { __label__ = 117; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 116: 
      var $253=$RP306; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($253)>>2)]=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 118; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 117: 
      _abort(); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 118: 
      __label__ = 119; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 119: 
      __label__ = 120; break;
    case 120: 
      var $254=$XP286; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp340=(($254)|0)!=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp340) { __label__ = 121; break; } else { __label__ = 148; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 121: 
      var $255=$TP285; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index344=(($255+28)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $256=HEAP32[(($index344)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx345=((((__gm_+304)|0)+($256<<2))|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $H343=$arrayidx345; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $257=$TP285; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $258=$H343; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $259=HEAP32[(($258)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp346=(($257)|0)==(($259)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp346) { __label__ = 122; break; } else { __label__ = 125; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 122: 
      var $260=$R288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $261=$H343; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($261)>>2)]=$260; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp349=(($260)|0)==0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp349) { __label__ = 123; break; } else { __label__ = 124; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 123: 
      var $262=$TP285; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index352=(($262+28)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $263=HEAP32[(($index352)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl353=1 << $263; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg354=$shl353 ^ -1; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $264=HEAP32[((((__gm_+4)|0))>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and355=$264 & $neg354; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+4)|0))>>2)]=$and355; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 124; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 124: 
      __label__ = 132; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 125: 
      var $265=$XP286; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $266=$265; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $267=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp358=(($266)>>>0) >= (($267)>>>0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv359=(($cmp358)&1); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval360=(($conv359)==(1)); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool361=(($expval360)|0)!=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool361) { __label__ = 126; break; } else { __label__ = 130; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 126: 
      var $268=$XP286; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child363=(($268+16)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx364=(($child363)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $269=HEAP32[(($arrayidx364)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $270=$TP285; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp365=(($269)|0)==(($270)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp365) { __label__ = 127; break; } else { __label__ = 128; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 127: 
      var $271=$R288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $272=$XP286; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child368=(($272+16)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx369=(($child368)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx369)>>2)]=$271; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 129; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 128: 
      var $273=$R288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $274=$XP286; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child371=(($274+16)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx372=(($child371+4)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx372)>>2)]=$273; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 129; break;
    case 129: 
      __label__ = 131; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 130: 
      _abort(); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 131: 
      __label__ = 132; break;
    case 132: 
      var $275=$R288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp377=(($275)|0)!=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp377) { __label__ = 133; break; } else { __label__ = 147; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 133: 
      var $276=$R288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $277=$276; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $278=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp380=(($277)>>>0) >= (($278)>>>0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv381=(($cmp380)&1); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval382=(($conv381)==(1)); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool383=(($expval382)|0)!=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool383) { __label__ = 134; break; } else { __label__ = 145; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 134: 
      var $279=$XP286; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $280=$R288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent387=(($280+24)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent387)>>2)]=$279; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $281=$TP285; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child388=(($281+16)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx389=(($child388)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $282=HEAP32[(($arrayidx389)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C0385=$282; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp390=(($282)|0)!=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp390) { __label__ = 135; break; } else { __label__ = 139; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 135: 
      var $283=$C0385; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $284=$283; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $285=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp393=(($284)>>>0) >= (($285)>>>0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv394=(($cmp393)&1); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval395=(($conv394)==(1)); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool396=(($expval395)|0)!=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool396) { __label__ = 136; break; } else { __label__ = 137; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 136: 
      var $286=$C0385; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $287=$R288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child398=(($287+16)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx399=(($child398)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx399)>>2)]=$286; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $288=$R288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $289=$C0385; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent400=(($289+24)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent400)>>2)]=$288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 138; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 137: 
      _abort(); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 138: 
      __label__ = 139; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 139: 
      var $290=$TP285; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child404=(($290+16)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx405=(($child404+4)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $291=HEAP32[(($arrayidx405)>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C1386=$291; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp406=(($291)|0)!=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp406) { __label__ = 140; break; } else { __label__ = 144; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 140: 
      var $292=$C1386; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $293=$292; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $294=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp409=(($293)>>>0) >= (($294)>>>0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv410=(($cmp409)&1); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval411=(($conv410)==(1)); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool412=(($expval411)|0)!=0; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool412) { __label__ = 141; break; } else { __label__ = 142; break; } //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 141: 
      var $295=$C1386; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $296=$R288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child414=(($296+16)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx415=(($child414+4)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx415)>>2)]=$295; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $297=$R288; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $298=$C1386; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent416=(($298+24)|0); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent416)>>2)]=$297; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 143; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 142: 
      _abort(); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 143: 
      __label__ = 144; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 144: 
      __label__ = 146; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 145: 
      _abort(); //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 146: 
      __label__ = 147; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 147: 
      __label__ = 148; break; //@line 4806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 148: 
      __label__ = 149; break;
    case 149: 
      var $299=$psize; //@line 4807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or425=$299 | 1; //@line 4807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $300=$p; //@line 4807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head426=(($300+4)|0); //@line 4807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head426)>>2)]=$or425; //@line 4807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $301=$psize; //@line 4807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $302=$p; //@line 4807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $303=$302; //@line 4807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $304=$psize; //@line 4807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr427=(($303+$304)|0); //@line 4807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $305=$add_ptr427; //@line 4807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot428=(($305)|0); //@line 4807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot428)>>2)]=$301; //@line 4807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $306=$p; //@line 4808 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $307=HEAP32[((((__gm_+20)|0))>>2)]; //@line 4808 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp429=(($306)|0)==(($307)|0); //@line 4808 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp429) { __label__ = 150; break; } else { __label__ = 151; break; } //@line 4808 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 150: 
      var $308=$psize; //@line 4809 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+8)|0))>>2)]=$308; //@line 4809 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 196; break; //@line 4810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 151: 
      __label__ = 152; break;
    case 152: 
      __label__ = 153; break;
    case 153: 
      __label__ = 155; break; //@line 4813 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 154: 
      var $309=$next; //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head436=(($309+4)|0); //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $310=HEAP32[(($head436)>>2)]; //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and437=$310 & -2; //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head436)>>2)]=$and437; //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $311=$psize; //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or438=$311 | 1; //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $312=$p; //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head439=(($312+4)|0); //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head439)>>2)]=$or438; //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $313=$psize; //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $314=$p; //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $315=$314; //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $316=$psize; //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr440=(($315+$316)|0); //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $317=$add_ptr440; //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot441=(($317)|0); //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot441)>>2)]=$313; //@line 4815 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 155; break;
    case 155: 
      var $318=$psize; //@line 4817 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr443=$318 >>> 3; //@line 4817 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp444=(($shr443)>>>0) < 32; //@line 4817 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp444) { __label__ = 156; break; } else { __label__ = 163; break; } //@line 4817 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 156: 
      var $319=$psize; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr448=$319 >>> 3; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $I447=$shr448; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $320=$I447; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl450=$320 << 1; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx451=((((__gm_+40)|0)+($shl450<<2))|0); //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $321=$arrayidx451; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $322=$321; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $B449=$322; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $323=$B449; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F452=$323; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $324=HEAP32[((((__gm_)|0))>>2)]; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $325=$I447; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl453=1 << $325; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and454=$324 & $shl453; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool455=(($and454)|0)!=0; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool455) { __label__ = 158; break; } else { __label__ = 157; break; } //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 157: 
      var $326=$I447; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl457=1 << $326; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $327=HEAP32[((((__gm_)|0))>>2)]; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or458=$327 | $shl457; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_)|0))>>2)]=$or458; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 162; break; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 158: 
      var $328=$B449; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd460=(($328+8)|0); //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $329=HEAP32[(($fd460)>>2)]; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $330=$329; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $331=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp461=(($330)>>>0) >= (($331)>>>0); //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv462=(($cmp461)&1); //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval463=(($conv462)==(1)); //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool464=(($expval463)|0)!=0; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool464) { __label__ = 159; break; } else { __label__ = 160; break; } //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 159: 
      var $332=$B449; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd466=(($332+8)|0); //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $333=HEAP32[(($fd466)>>2)]; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F452=$333; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 161; break; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 160: 
      _abort(); //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 161: 
      __label__ = 162; break;
    case 162: 
      var $334=$p; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $335=$B449; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd470=(($335+8)|0); //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd470)>>2)]=$334; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $336=$p; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $337=$F452; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk471=(($337+12)|0); //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk471)>>2)]=$336; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $338=$F452; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $339=$p; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd472=(($339+8)|0); //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd472)>>2)]=$338; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $340=$B449; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $341=$p; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk473=(($341+12)|0); //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk473)>>2)]=$340; //@line 4818 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 192; break; //@line 4820 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 163: 
      var $342=$p; //@line 4822 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $343=$342; //@line 4822 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tp=$343; //@line 4822 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $344=$psize; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr477=$344 >>> 8; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $X=$shr477; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $345=$X; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp478=(($345)|0)==0; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp478) { __label__ = 164; break; } else { __label__ = 165; break; } //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 164: 
      $I476=0; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 169; break; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 165: 
      var $346=$X; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp482=(($346)>>>0) > 65535; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp482) { __label__ = 166; break; } else { __label__ = 167; break; } //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 166: 
      $I476=31; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 168; break; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 167: 
      var $347=$X; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$347; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $348=$Y; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=((($348)-(256))|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr486=$sub >>> 16; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and487=$shr486 & 8; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$and487; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $349=$N; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $350=$Y; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl488=$350 << $349; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl488; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub489=((($shl488)-(4096))|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr490=$sub489 >>> 16; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and491=$shr490 & 4; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and491; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $351=$K; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $352=$N; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add492=((($352)+($351))|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add492; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $353=$K; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $354=$Y; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl493=$354 << $353; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl493; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub494=((($shl493)-(16384))|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr495=$sub494 >>> 16; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and496=$shr495 & 2; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and496; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $355=$N; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add497=((($355)+($and496))|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add497; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $356=$N; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub498=(((14)-($356))|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $357=$K; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $358=$Y; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl499=$358 << $357; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl499; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr500=$shl499 >>> 15; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add501=((($sub498)+($shr500))|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$add501; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $359=$K; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl502=$359 << 1; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $360=$psize; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $361=$K; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add503=((($361)+(7))|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr504=$360 >>> (($add503)>>>0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and505=$shr504 & 1; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add506=((($shl502)+($and505))|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $I476=$add506; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 168; break;
    case 168: 
      __label__ = 169; break;
    case 169: 
      var $362=$I476; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx509=((((__gm_+304)|0)+($362<<2))|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $H475=$arrayidx509; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $363=$I476; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $364=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index510=(($364+28)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($index510)>>2)]=$363; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $365=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child511=(($365+16)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx512=(($child511+4)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx512)>>2)]=0; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $366=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child513=(($366+16)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx514=(($child513)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx514)>>2)]=0; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $367=HEAP32[((((__gm_+4)|0))>>2)]; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $368=$I476; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl515=1 << $368; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and516=$367 & $shl515; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool517=(($and516)|0)!=0; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool517) { __label__ = 171; break; } else { __label__ = 170; break; } //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 170: 
      var $369=$I476; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl519=1 << $369; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $370=HEAP32[((((__gm_+4)|0))>>2)]; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or520=$370 | $shl519; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+4)|0))>>2)]=$or520; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $371=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $372=$H475; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($372)>>2)]=$371; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $373=$H475; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $374=$373; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $375=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent521=(($375+24)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent521)>>2)]=$374; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $376=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $377=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk522=(($377+12)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk522)>>2)]=$376; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $378=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd523=(($378+8)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd523)>>2)]=$376; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 189; break; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 171: 
      var $379=$H475; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $380=HEAP32[(($379)>>2)]; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $T=$380; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $381=$psize; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $382=$I476; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp526=(($382)|0)==31; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp526) { __label__ = 172; break; } else { __label__ = 173; break; } //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 172: 
      var $cond = 0;__label__ = 174; break; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 173: 
      var $383=$I476; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr528=$383 >>> 1; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add529=((($shr528)+(8))|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub530=((($add529)-(2))|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub531=(((31)-($sub530))|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $sub531;__label__ = 174; break; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 174: 
      var $cond; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl532=$381 << $cond; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K525=$shl532; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 175; break; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 175: 
      var $384=$T; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head533=(($384+4)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $385=HEAP32[(($head533)>>2)]; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and534=$385 & -8; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $386=$psize; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp535=(($and534)|0)!=(($386)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp535) { __label__ = 176; break; } else { __label__ = 182; break; } //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 176: 
      var $387=$K525; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr538=$387 >>> 31; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and539=$shr538 & 1; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $388=$T; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child540=(($388+16)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx541=(($child540+($and539<<2))|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C=$arrayidx541; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $389=$K525; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl542=$389 << 1; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K525=$shl542; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $390=$C; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $391=HEAP32[(($390)>>2)]; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp543=(($391)|0)!=0; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp543) { __label__ = 177; break; } else { __label__ = 178; break; } //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 177: 
      var $392=$C; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $393=HEAP32[(($392)>>2)]; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $T=$393; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 181; break; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 178: 
      var $394=$C; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $395=$394; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $396=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp547=(($395)>>>0) >= (($396)>>>0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv548=(($cmp547)&1); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval549=(($conv548)==(1)); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool550=(($expval549)|0)!=0; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool550) { __label__ = 179; break; } else { __label__ = 180; break; } //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 179: 
      var $397=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $398=$C; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($398)>>2)]=$397; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $399=$T; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $400=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent552=(($400+24)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent552)>>2)]=$399; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $401=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $402=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk553=(($402+12)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk553)>>2)]=$401; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $403=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd554=(($403+8)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd554)>>2)]=$401; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 188; break; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 180: 
      _abort(); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 181: 
      __label__ = 187; break; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 182: 
      var $404=$T; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd559=(($404+8)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $405=HEAP32[(($fd559)>>2)]; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F558=$405; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $406=$T; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $407=$406; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $408=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp560=(($407)>>>0) >= (($408)>>>0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp560) { __label__ = 183; break; } else { var $412 = 0;__label__ = 184; break; } //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 183: 
      var $409=$F558; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $410=$409; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $411=HEAPU32[((((__gm_+16)|0))>>2)]; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp563=(($410)>>>0) >= (($411)>>>0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $412 = $cmp563;__label__ = 184; break;
    case 184: 
      var $412;
      var $land_ext566=(($412)&1);
      var $expval567=(($land_ext566)==(1));
      var $tobool568=(($expval567)|0)!=0;
      if ($tobool568) { __label__ = 185; break; } else { __label__ = 186; break; }
    case 185: 
      var $413=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $414=$F558; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk570=(($414+12)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk570)>>2)]=$413; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $415=$T; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd571=(($415+8)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd571)>>2)]=$413; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $416=$F558; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $417=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd572=(($417+8)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd572)>>2)]=$416; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $418=$T; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $419=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk573=(($419+12)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk573)>>2)]=$418; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $420=$tp; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent574=(($420+24)|0); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent574)>>2)]=0; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 188; break; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 186: 
      _abort(); //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 187: 
      __label__ = 175; break; //@line 4823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 188: 
      __label__ = 189; break;
    case 189: 
      var $421=HEAP32[((((__gm_+32)|0))>>2)]; //@line 4825 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $dec=((($421)-(1))|0); //@line 4825 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+32)|0))>>2)]=$dec; //@line 4825 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp578=(($dec)|0)==0; //@line 4825 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp578) { __label__ = 190; break; } else { __label__ = 191; break; } //@line 4825 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 190: 
      var $call581=_release_unused_segments(__gm_); //@line 4826 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 191; break; //@line 4826 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 191: 
      __label__ = 192; break;
    case 192: 
      __label__ = 196; break; //@line 4828 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 193: 
      __label__ = 194; break; //@line 4830 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 194: 
      __label__ = 195; break; //@line 4830 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 195: 
      _abort(); //@line 4832 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4832 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 196: 
      __label__ = 197; break; //@line 4836 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 197: 
      ;
      return; //@line 4840 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
Module["_free"] = _free;_free["X"]=1;

function _sys_trim($m, $pad) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $pad_addr;
      var $released;
      var $unit;
      var $extra;
      var $sp;
      var $old_br;
      var $rel_br;
      var $new_br;
      $m_addr=$m;
      $pad_addr=$pad;
      $released=0; //@line 4126 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $0=HEAP32[((((_mparams)|0))>>2)]; //@line 4127 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)!=0; //@line 4127 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { var $1 = 1;__label__ = 4; break; } else { __label__ = 3; break; } //@line 4127 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $call=_init_mparams(); //@line 4127 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($call)|0)!=0; //@line 4127 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1 = $tobool;__label__ = 4; break; //@line 4127 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $1;
      var $lor_ext=(($1)&1); //@line 4127 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$pad_addr; //@line 4128 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($2)>>>0) < 4294967232; //@line 4128 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 26; break; } //@line 4128 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $3=$m_addr; //@line 4128 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top=(($3+24)|0); //@line 4128 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=HEAP32[(($top)>>2)]; //@line 4128 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp2=(($4)|0)!=0; //@line 4128 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp2) { __label__ = 6; break; } else { __label__ = 26; break; } //@line 4128 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $5=$pad_addr; //@line 4129 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($5)+(40))|0); //@line 4129 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $pad_addr=$add; //@line 4129 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=$m_addr; //@line 4131 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize=(($6+12)|0); //@line 4131 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=HEAPU32[(($topsize)>>2)]; //@line 4131 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=$pad_addr; //@line 4131 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp3=(($7)>>>0) > (($8)>>>0); //@line 4131 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp3) { __label__ = 7; break; } else { __label__ = 22; break; } //@line 4131 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $9=HEAP32[((((_mparams+8)|0))>>2)]; //@line 4133 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $unit=$9; //@line 4133 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=$m_addr; //@line 4135 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize5=(($10+12)|0); //@line 4135 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=HEAP32[(($topsize5)>>2)]; //@line 4135 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=$pad_addr; //@line 4135 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=((($11)-($12))|0); //@line 4135 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $13=$unit; //@line 4135 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub6=((($13)-(1))|0); //@line 4135 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add7=((($sub)+($sub6))|0); //@line 4135 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=$unit; //@line 4135 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $div=Math.floor(((($add7)>>>0))/((($14)>>>0))); //@line 4135 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub8=((($div)-(1))|0); //@line 4135 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $15=$unit; //@line 4135 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $mul=((($sub8)*($15))|0); //@line 4135 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $extra=$mul; //@line 4135 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=$m_addr; //@line 4136 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $17=$m_addr; //@line 4136 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top9=(($17+24)|0); //@line 4136 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $18=HEAP32[(($top9)>>2)]; //@line 4136 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $19=$18; //@line 4136 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call10=_segment_holding($16, $19); //@line 4136 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sp=$call10; //@line 4136 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=$sp; //@line 4138 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sflags=(($20+12)|0); //@line 4138 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=HEAP32[(($sflags)>>2)]; //@line 4138 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$21 & 8; //@line 4138 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool11=(($and)|0)!=0; //@line 4138 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool11) { __label__ = 19; break; } else { __label__ = 8; break; } //@line 4138 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $22=$sp; //@line 4139 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sflags13=(($22+12)|0); //@line 4139 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $23=HEAP32[(($sflags13)>>2)]; //@line 4139 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and14=$23 & 0; //@line 4139 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool15=(($and14)|0)!=0; //@line 4139 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool15) { __label__ = 9; break; } else { __label__ = 10; break; } //@line 4139 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      __label__ = 18; break; //@line 4150 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $24=$extra; //@line 4152 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp17=(($24)>>>0) >= 2147483647; //@line 4152 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp17) { __label__ = 11; break; } else { __label__ = 12; break; } //@line 4152 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $25=$unit; //@line 4153 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub19=(((-2147483648)-($25))|0); //@line 4153 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $extra=$sub19; //@line 4153 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 12; break; //@line 4153 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $call20=_sbrk(0); //@line 4157 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $old_br=$call20; //@line 4157 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $26=$old_br; //@line 4158 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $27=$sp; //@line 4158 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base=(($27)|0); //@line 4158 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=HEAP32[(($base)>>2)]; //@line 4158 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $29=$sp; //@line 4158 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $size=(($29+4)|0); //@line 4158 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $30=HEAP32[(($size)>>2)]; //@line 4158 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($28+$30)|0); //@line 4158 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp21=(($26)|0)==(($add_ptr)|0); //@line 4158 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp21) { __label__ = 13; break; } else { __label__ = 17; break; } //@line 4158 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $31=$extra; //@line 4159 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub23=(((-$31))|0); //@line 4159 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call24=_sbrk($sub23); //@line 4159 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rel_br=$call24; //@line 4159 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call25=_sbrk(0); //@line 4160 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $new_br=$call25; //@line 4160 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $32=$rel_br; //@line 4161 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp26=(($32)|0)!=-1; //@line 4161 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp26) { __label__ = 14; break; } else { __label__ = 16; break; } //@line 4161 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $33=$new_br; //@line 4161 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $34=$old_br; //@line 4161 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp28=(($33)>>>0) < (($34)>>>0); //@line 4161 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp28) { __label__ = 15; break; } else { __label__ = 16; break; } //@line 4161 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $35=$old_br; //@line 4162 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $36=$new_br; //@line 4162 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_lhs_cast=$35; //@line 4162 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_rhs_cast=$36; //@line 4162 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_sub=((($sub_ptr_lhs_cast)-($sub_ptr_rhs_cast))|0); //@line 4162 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $released=$sub_ptr_sub; //@line 4162 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 16; break; //@line 4162 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 16: 
      __label__ = 17; break; //@line 4163 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 17: 
      __label__ = 18; break;
    case 18: 
      __label__ = 19; break; //@line 4167 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $37=$released; //@line 4169 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp34=(($37)|0)!=0; //@line 4169 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp34) { __label__ = 20; break; } else { __label__ = 21; break; } //@line 4169 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 20: 
      var $38=$released; //@line 4170 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $39=$sp; //@line 4170 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $size36=(($39+4)|0); //@line 4170 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $40=HEAP32[(($size36)>>2)]; //@line 4170 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub37=((($40)-($38))|0); //@line 4170 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($size36)>>2)]=$sub37; //@line 4170 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $41=$released; //@line 4171 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $42=$m_addr; //@line 4171 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $footprint=(($42+432)|0); //@line 4171 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $43=HEAP32[(($footprint)>>2)]; //@line 4171 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub38=((($43)-($41))|0); //@line 4171 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($footprint)>>2)]=$sub38; //@line 4171 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $44=$m_addr; //@line 4172 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $45=$m_addr; //@line 4172 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top39=(($45+24)|0); //@line 4172 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $46=HEAP32[(($top39)>>2)]; //@line 4172 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $47=$m_addr; //@line 4172 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize40=(($47+12)|0); //@line 4172 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $48=HEAP32[(($topsize40)>>2)]; //@line 4172 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $49=$released; //@line 4172 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub41=((($48)-($49))|0); //@line 4172 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      _init_top($44, $46, $sub41); //@line 4172 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 21; break; //@line 4174 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 21: 
      __label__ = 22; break; //@line 4175 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 22: 
      var $50=$released; //@line 4182 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp44=(($50)|0)==0; //@line 4182 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp44) { __label__ = 23; break; } else { __label__ = 25; break; } //@line 4182 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 23: 
      var $51=$m_addr; //@line 4182 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize46=(($51+12)|0); //@line 4182 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $52=HEAPU32[(($topsize46)>>2)]; //@line 4182 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $53=$m_addr; //@line 4182 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $trim_check=(($53+28)|0); //@line 4182 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $54=HEAPU32[(($trim_check)>>2)]; //@line 4182 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp47=(($52)>>>0) > (($54)>>>0); //@line 4182 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp47) { __label__ = 24; break; } else { __label__ = 25; break; } //@line 4182 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $55=$m_addr; //@line 4183 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $trim_check49=(($55+28)|0); //@line 4183 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($trim_check49)>>2)]=-1; //@line 4183 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 25; break; //@line 4183 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 25: 
      __label__ = 26; break; //@line 4184 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $56=$released; //@line 4186 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp52=(($56)|0)!=0; //@line 4186 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond=$cmp52 ? 1 : 0; //@line 4186 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $cond; //@line 4186 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_sys_trim["X"]=1;

function _calloc($n_elements, $elem_size) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $n_elements_addr;
      var $elem_size_addr;
      var $mem;
      var $req;
      $n_elements_addr=$n_elements;
      $elem_size_addr=$elem_size;
      $req=0; //@line 4844 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $0=$n_elements_addr; //@line 4845 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)!=0; //@line 4845 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 7; break; } //@line 4845 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $1=$n_elements_addr; //@line 4846 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$elem_size_addr; //@line 4846 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $mul=((($1)*($2))|0); //@line 4846 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $req=$mul; //@line 4846 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=$n_elements_addr; //@line 4847 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=$elem_size_addr; //@line 4847 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or=$3 | $4; //@line 4847 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$or & -65536; //@line 4847 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($and)|0)!=0; //@line 4847 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool) { __label__ = 4; break; } else { __label__ = 6; break; } //@line 4847 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $5=$req; //@line 4847 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=$n_elements_addr; //@line 4847 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $div=Math.floor(((($5)>>>0))/((($6)>>>0))); //@line 4847 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$elem_size_addr; //@line 4847 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($div)|0)!=(($7)|0); //@line 4847 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 4847 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      $req=-1; //@line 4849 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 6; break; //@line 4849 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      __label__ = 7; break; //@line 4850 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $8=$req; //@line 4851 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call=_malloc($8); //@line 4851 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mem=$call; //@line 4851 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $9=$mem; //@line 4852 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp4=(($9)|0)!=0; //@line 4852 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp4) { __label__ = 8; break; } else { __label__ = 10; break; } //@line 4852 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $10=$mem; //@line 4852 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=((($10)-(8))|0); //@line 4852 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=$add_ptr; //@line 4852 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($11+4)|0); //@line 4852 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=HEAP32[(($head)>>2)]; //@line 4852 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and6=$12 & 3; //@line 4852 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp7=(($and6)|0)==0; //@line 4852 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp7) { __label__ = 10; break; } else { __label__ = 9; break; } //@line 4852 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $13=$mem; //@line 4853 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=$req; //@line 4853 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      _memset($13, 0, $14, 1); //@line 4853 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 10; break; //@line 4853 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $15=$mem; //@line 4854 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $15; //@line 4854 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _realloc($oldmem, $bytes) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $oldmem_addr;
      var $bytes_addr;
      var $m;
      $oldmem_addr=$oldmem;
      $bytes_addr=$bytes;
      var $0=$oldmem_addr; //@line 4858 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)==0; //@line 4858 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 4858 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $1=$bytes_addr; //@line 4859 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call=_malloc($1); //@line 4859 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$call; //@line 4859 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 5; break; //@line 4859 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      $m=__gm_; //@line 4868 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$m; //@line 4876 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=$oldmem_addr; //@line 4876 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=$bytes_addr; //@line 4876 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call1=_internal_realloc($2, $3, $4); //@line 4876 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$call1; //@line 4876 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 5; break; //@line 4876 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $5=$retval; //@line 4878 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $5; //@line 4878 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _release_unused_segments($m) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $released;
      var $nsegs;
      var $pred;
      var $sp;
      var $base;
      var $size;
      var $next3;
      var $p;
      var $psize;
      var $tp;
      var $XP;
      var $R;
      var $F;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $H147;
      var $I;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K197;
      var $C;
      var $F235;
      $m_addr=$m;
      $released=0; //@line 4079 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $nsegs=0; //@line 4080 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $0=$m_addr; //@line 4081 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $seg=(($0+444)|0); //@line 4081 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $pred=$seg; //@line 4081 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1=$pred; //@line 4082 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $next=(($1+8)|0); //@line 4082 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=HEAP32[(($next)>>2)]; //@line 4082 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sp=$2; //@line 4082 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 3; break; //@line 4083 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $3=$sp; //@line 4083 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($3)|0)!=0; //@line 4083 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 4; break; } else { __label__ = 88; break; } //@line 4083 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $4=$sp; //@line 4084 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base1=(($4)|0); //@line 4084 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=HEAP32[(($base1)>>2)]; //@line 4084 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $base=$5; //@line 4084 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=$sp; //@line 4085 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $size2=(($6+4)|0); //@line 4085 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=HEAP32[(($size2)>>2)]; //@line 4085 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $size=$7; //@line 4085 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=$sp; //@line 4086 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $next4=(($8+8)|0); //@line 4086 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $9=HEAP32[(($next4)>>2)]; //@line 4086 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $next3=$9; //@line 4086 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=$nsegs; //@line 4087 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $inc=((($10)+(1))|0); //@line 4087 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $nsegs=$inc; //@line 4087 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=$sp; //@line 4088 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sflags=(($11+12)|0); //@line 4088 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=HEAP32[(($sflags)>>2)]; //@line 4088 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$12 & 0; //@line 4088 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($and)|0)!=0; //@line 4088 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool) { __label__ = 5; break; } else { __label__ = 87; break; } //@line 4088 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $13=$sp; //@line 4088 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sflags5=(($13+12)|0); //@line 4088 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=HEAP32[(($sflags5)>>2)]; //@line 4088 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and6=$14 & 8; //@line 4088 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool7=(($and6)|0)!=0; //@line 4088 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool7) { __label__ = 87; break; } else { __label__ = 6; break; } //@line 4088 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $15=$base; //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=$base; //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($16+8)|0); //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $17=$add_ptr; //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and8=$17 & 7; //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp9=(($and8)|0)==0; //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp9) { __label__ = 7; break; } else { __label__ = 8; break; } //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $cond = 0;__label__ = 9; break; //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $18=$base; //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr10=(($18+8)|0); //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $19=$add_ptr10; //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and11=$19 & 7; //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=(((8)-($and11))|0); //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and12=$sub & 7; //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $and12;__label__ = 9; break; //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $cond; //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr13=(($15+$cond)|0); //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=$add_ptr13; //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p=$20; //@line 4089 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=$p; //@line 4090 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($21+4)|0); //@line 4090 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $22=HEAP32[(($head)>>2)]; //@line 4090 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and14=$22 & -8; //@line 4090 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $psize=$and14; //@line 4090 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $23=$p; //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head15=(($23+4)|0); //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $24=HEAP32[(($head15)>>2)]; //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and16=$24 & 3; //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp17=(($and16)|0)!=1; //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp17) { __label__ = 86; break; } else { __label__ = 10; break; } //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $25=$p; //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $26=$25; //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $27=$psize; //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr19=(($26+$27)|0); //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=$base; //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $29=$size; //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr20=(($28+$29)|0); //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr21=((($add_ptr20)-(40))|0); //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp22=(($add_ptr19)>>>0) >= (($add_ptr21)>>>0); //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp22) { __label__ = 11; break; } else { __label__ = 86; break; } //@line 4092 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $30=$p; //@line 4093 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $31=$30; //@line 4093 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tp=$31; //@line 4093 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $32=$p; //@line 4095 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $33=$m_addr; //@line 4095 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $dv=(($33+20)|0); //@line 4095 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $34=HEAP32[(($dv)>>2)]; //@line 4095 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp24=(($32)|0)==(($34)|0); //@line 4095 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp24) { __label__ = 12; break; } else { __label__ = 13; break; } //@line 4095 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $35=$m_addr; //@line 4096 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $dv26=(($35+20)|0); //@line 4096 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($dv26)>>2)]=0; //@line 4096 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $36=$m_addr; //@line 4097 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $dvsize=(($36+8)|0); //@line 4097 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($dvsize)>>2)]=0; //@line 4097 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 59; break; //@line 4098 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $37=$tp; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent=(($37+24)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $38=HEAP32[(($parent)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $XP=$38; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $39=$tp; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk=(($39+12)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $40=HEAP32[(($bk)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $41=$tp; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp27=(($40)|0)!=(($41)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp27) { __label__ = 14; break; } else { __label__ = 18; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $42=$tp; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd=(($42+8)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $43=HEAP32[(($fd)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F=$43; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $44=$tp; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk29=(($44+12)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $45=HEAP32[(($bk29)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$45; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $46=$F; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $47=$46; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $48=$m_addr; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($48+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $49=HEAPU32[(($least_addr)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp30=(($47)>>>0) >= (($49)>>>0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv=(($cmp30)&1); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval=(($conv)==(1)); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool31=(($expval)|0)!=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool31) { __label__ = 15; break; } else { __label__ = 16; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $50=$R; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $51=$F; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk33=(($51+12)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk33)>>2)]=$50; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $52=$F; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $53=$R; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd34=(($53+8)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd34)>>2)]=$52; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 17; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 16: 
      _abort(); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 17: 
      __label__ = 30; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $54=$tp; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child=(($54+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=(($child+4)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $55=HEAP32[(($arrayidx)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$55; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp37=(($55)|0)!=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp37) { __label__ = 20; break; } else { __label__ = 19; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $56=$tp; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child39=(($56+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx40=(($child39)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx40; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $57=HEAP32[(($arrayidx40)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$57; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp41=(($57)|0)!=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp41) { __label__ = 20; break; } else { __label__ = 29; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 20: 
      __label__ = 21; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 21: 
      var $58=$R; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child45=(($58+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx46=(($child45+4)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx46; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $59=HEAP32[(($arrayidx46)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp47=(($59)|0)!=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp47) { var $62 = 1;__label__ = 23; break; } else { __label__ = 22; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 22: 
      var $60=$R; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child49=(($60+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx50=(($child49)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx50; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $61=HEAP32[(($arrayidx50)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp51=(($61)|0)!=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $62 = $cmp51;__label__ = 23; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 23: 
      var $62;
      if ($62) { __label__ = 24; break; } else { __label__ = 25; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $63=$CP; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$63; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $64=HEAP32[(($63)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$64; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 21; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $65=$RP; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $66=$65; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $67=$m_addr; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr54=(($67+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $68=HEAPU32[(($least_addr54)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp55=(($66)>>>0) >= (($68)>>>0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv56=(($cmp55)&1); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval57=(($conv56)==(1)); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool58=(($expval57)|0)!=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool58) { __label__ = 26; break; } else { __label__ = 27; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $69=$RP; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($69)>>2)]=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 28; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 27: 
      _abort(); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 28: 
      __label__ = 29; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 29: 
      __label__ = 30; break;
    case 30: 
      var $70=$XP; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp64=(($70)|0)!=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp64) { __label__ = 31; break; } else { __label__ = 58; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $71=$tp; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index=(($71+28)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $72=HEAP32[(($index)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $73=$m_addr; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treebins=(($73+304)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx67=(($treebins+($72<<2))|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $H=$arrayidx67; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $74=$tp; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $75=$H; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $76=HEAP32[(($75)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp68=(($74)|0)==(($76)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp68) { __label__ = 32; break; } else { __label__ = 35; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $77=$R; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $78=$H; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($78)>>2)]=$77; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp71=(($77)|0)==0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp71) { __label__ = 33; break; } else { __label__ = 34; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 33: 
      var $79=$tp; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index74=(($79+28)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $80=HEAP32[(($index74)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl=1 << $80; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg=$shl ^ -1; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $81=$m_addr; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap=(($81+4)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $82=HEAP32[(($treemap)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and75=$82 & $neg; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap)>>2)]=$and75; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 34; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 34: 
      __label__ = 42; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 35: 
      var $83=$XP; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $84=$83; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $85=$m_addr; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr78=(($85+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $86=HEAPU32[(($least_addr78)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp79=(($84)>>>0) >= (($86)>>>0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv80=(($cmp79)&1); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval81=(($conv80)==(1)); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool82=(($expval81)|0)!=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool82) { __label__ = 36; break; } else { __label__ = 40; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 36: 
      var $87=$XP; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child84=(($87+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx85=(($child84)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $88=HEAP32[(($arrayidx85)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $89=$tp; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp86=(($88)|0)==(($89)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp86) { __label__ = 37; break; } else { __label__ = 38; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 37: 
      var $90=$R; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $91=$XP; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child89=(($91+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx90=(($child89)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx90)>>2)]=$90; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 39; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 38: 
      var $92=$R; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $93=$XP; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child92=(($93+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx93=(($child92+4)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx93)>>2)]=$92; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 39; break;
    case 39: 
      __label__ = 41; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 40: 
      _abort(); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 41: 
      __label__ = 42; break;
    case 42: 
      var $94=$R; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp98=(($94)|0)!=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp98) { __label__ = 43; break; } else { __label__ = 57; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 43: 
      var $95=$R; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $96=$95; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $97=$m_addr; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr101=(($97+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $98=HEAPU32[(($least_addr101)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp102=(($96)>>>0) >= (($98)>>>0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv103=(($cmp102)&1); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval104=(($conv103)==(1)); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool105=(($expval104)|0)!=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool105) { __label__ = 44; break; } else { __label__ = 55; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 44: 
      var $99=$XP; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $100=$R; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent107=(($100+24)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent107)>>2)]=$99; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $101=$tp; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child108=(($101+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx109=(($child108)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $102=HEAP32[(($arrayidx109)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C0=$102; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp110=(($102)|0)!=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp110) { __label__ = 45; break; } else { __label__ = 49; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 45: 
      var $103=$C0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $104=$103; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $105=$m_addr; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr113=(($105+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $106=HEAPU32[(($least_addr113)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp114=(($104)>>>0) >= (($106)>>>0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv115=(($cmp114)&1); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval116=(($conv115)==(1)); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool117=(($expval116)|0)!=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool117) { __label__ = 46; break; } else { __label__ = 47; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 46: 
      var $107=$C0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $108=$R; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child119=(($108+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx120=(($child119)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx120)>>2)]=$107; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $109=$R; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $110=$C0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent121=(($110+24)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent121)>>2)]=$109; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 48; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 47: 
      _abort(); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 48: 
      __label__ = 49; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 49: 
      var $111=$tp; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child125=(($111+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx126=(($child125+4)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $112=HEAP32[(($arrayidx126)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C1=$112; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp127=(($112)|0)!=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp127) { __label__ = 50; break; } else { __label__ = 54; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 50: 
      var $113=$C1; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $114=$113; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $115=$m_addr; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr130=(($115+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $116=HEAPU32[(($least_addr130)>>2)]; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp131=(($114)>>>0) >= (($116)>>>0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv132=(($cmp131)&1); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval133=(($conv132)==(1)); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool134=(($expval133)|0)!=0; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool134) { __label__ = 51; break; } else { __label__ = 52; break; } //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 51: 
      var $117=$C1; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $118=$R; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child136=(($118+16)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx137=(($child136+4)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx137)>>2)]=$117; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $119=$R; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $120=$C1; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent138=(($120+24)|0); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent138)>>2)]=$119; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 53; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 52: 
      _abort(); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 53: 
      __label__ = 54; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 54: 
      __label__ = 56; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 55: 
      _abort(); //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 56: 
      __label__ = 57; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 57: 
      __label__ = 58; break; //@line 4100 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 58: 
      __label__ = 59; break;
    case 59: 
      var $121=$psize; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr=$121 >>> 8; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $X=$shr; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $122=$X; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp148=(($122)|0)==0; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp148) { __label__ = 60; break; } else { __label__ = 61; break; } //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 60: 
      $I=0; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 65; break; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 61: 
      var $123=$X; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp152=(($123)>>>0) > 65535; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp152) { __label__ = 62; break; } else { __label__ = 63; break; } //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 62: 
      $I=31; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 64; break; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 63: 
      var $124=$X; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$124; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $125=$Y; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub156=((($125)-(256))|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr157=$sub156 >>> 16; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and158=$shr157 & 8; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$and158; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $126=$N; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $127=$Y; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl159=$127 << $126; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl159; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub160=((($shl159)-(4096))|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr161=$sub160 >>> 16; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and162=$shr161 & 4; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and162; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $128=$K; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $129=$N; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($129)+($128))|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $130=$K; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $131=$Y; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl163=$131 << $130; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl163; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub164=((($shl163)-(16384))|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr165=$sub164 >>> 16; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and166=$shr165 & 2; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and166; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $132=$N; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add167=((($132)+($and166))|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add167; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $133=$N; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub168=(((14)-($133))|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $134=$K; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $135=$Y; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl169=$135 << $134; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl169; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr170=$shl169 >>> 15; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add171=((($sub168)+($shr170))|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$add171; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $136=$K; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl172=$136 << 1; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $137=$psize; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $138=$K; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add173=((($138)+(7))|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr174=$137 >>> (($add173)>>>0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and175=$shr174 & 1; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add176=((($shl172)+($and175))|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $I=$add176; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 64; break;
    case 64: 
      __label__ = 65; break;
    case 65: 
      var $139=$I; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $140=$m_addr; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treebins179=(($140+304)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx180=(($treebins179+($139<<2))|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $H147=$arrayidx180; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $141=$I; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $142=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index181=(($142+28)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($index181)>>2)]=$141; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $143=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child182=(($143+16)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx183=(($child182+4)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx183)>>2)]=0; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $144=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child184=(($144+16)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx185=(($child184)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx185)>>2)]=0; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $145=$m_addr; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap186=(($145+4)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $146=HEAP32[(($treemap186)>>2)]; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $147=$I; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl187=1 << $147; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and188=$146 & $shl187; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool189=(($and188)|0)!=0; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool189) { __label__ = 67; break; } else { __label__ = 66; break; } //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 66: 
      var $148=$I; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl191=1 << $148; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $149=$m_addr; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap192=(($149+4)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $150=HEAP32[(($treemap192)>>2)]; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or=$150 | $shl191; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap192)>>2)]=$or; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $151=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $152=$H147; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($152)>>2)]=$151; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $153=$H147; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $154=$153; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $155=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent193=(($155+24)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent193)>>2)]=$154; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $156=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $157=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk194=(($157+12)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk194)>>2)]=$156; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $158=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd195=(($158+8)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd195)>>2)]=$156; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 85; break; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 67: 
      var $159=$H147; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $160=HEAP32[(($159)>>2)]; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $T=$160; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $161=$psize; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $162=$I; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp198=(($162)|0)==31; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp198) { __label__ = 68; break; } else { __label__ = 69; break; } //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 68: 
      var $cond207 = 0;__label__ = 70; break; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 69: 
      var $163=$I; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr202=$163 >>> 1; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add203=((($shr202)+(8))|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub204=((($add203)-(2))|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub205=(((31)-($sub204))|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond207 = $sub205;__label__ = 70; break; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 70: 
      var $cond207; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl208=$161 << $cond207; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K197=$shl208; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 71; break; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 71: 
      var $164=$T; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head209=(($164+4)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $165=HEAP32[(($head209)>>2)]; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and210=$165 & -8; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $166=$psize; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp211=(($and210)|0)!=(($166)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp211) { __label__ = 72; break; } else { __label__ = 78; break; } //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 72: 
      var $167=$K197; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr214=$167 >>> 31; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and215=$shr214 & 1; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $168=$T; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child216=(($168+16)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx217=(($child216+($and215<<2))|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C=$arrayidx217; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $169=$K197; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl218=$169 << 1; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K197=$shl218; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $170=$C; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $171=HEAP32[(($170)>>2)]; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp219=(($171)|0)!=0; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp219) { __label__ = 73; break; } else { __label__ = 74; break; } //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 73: 
      var $172=$C; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $173=HEAP32[(($172)>>2)]; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $T=$173; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 77; break; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 74: 
      var $174=$C; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $175=$174; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $176=$m_addr; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr223=(($176+16)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $177=HEAPU32[(($least_addr223)>>2)]; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp224=(($175)>>>0) >= (($177)>>>0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv225=(($cmp224)&1); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval226=(($conv225)==(1)); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool227=(($expval226)|0)!=0; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool227) { __label__ = 75; break; } else { __label__ = 76; break; } //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 75: 
      var $178=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $179=$C; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($179)>>2)]=$178; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $180=$T; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $181=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent229=(($181+24)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent229)>>2)]=$180; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $182=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $183=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk230=(($183+12)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk230)>>2)]=$182; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $184=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd231=(($184+8)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd231)>>2)]=$182; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 84; break; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 76: 
      _abort(); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 77: 
      __label__ = 83; break; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 78: 
      var $185=$T; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd236=(($185+8)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $186=HEAP32[(($fd236)>>2)]; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F235=$186; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $187=$T; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $188=$187; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $189=$m_addr; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr237=(($189+16)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $190=HEAPU32[(($least_addr237)>>2)]; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp238=(($188)>>>0) >= (($190)>>>0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp238) { __label__ = 79; break; } else { var $195 = 0;__label__ = 80; break; } //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 79: 
      var $191=$F235; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $192=$191; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $193=$m_addr; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr240=(($193+16)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $194=HEAPU32[(($least_addr240)>>2)]; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp241=(($192)>>>0) >= (($194)>>>0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $195 = $cmp241;__label__ = 80; break;
    case 80: 
      var $195;
      var $land_ext=(($195)&1);
      var $expval243=(($land_ext)==(1));
      var $tobool244=(($expval243)|0)!=0;
      if ($tobool244) { __label__ = 81; break; } else { __label__ = 82; break; }
    case 81: 
      var $196=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $197=$F235; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk246=(($197+12)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk246)>>2)]=$196; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $198=$T; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd247=(($198+8)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd247)>>2)]=$196; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $199=$F235; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $200=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd248=(($200+8)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd248)>>2)]=$199; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $201=$T; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $202=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk249=(($202+12)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk249)>>2)]=$201; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $203=$tp; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent250=(($203+24)|0); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent250)>>2)]=0; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 84; break; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 82: 
      _abort(); //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 83: 
      __label__ = 71; break; //@line 4110 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 84: 
      __label__ = 85; break;
    case 85: 
      __label__ = 86; break; //@line 4112 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 86: 
      __label__ = 87; break; //@line 4113 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 87: 
      var $204=$sp; //@line 4116 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $pred=$204; //@line 4116 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $205=$next3; //@line 4117 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sp=$205; //@line 4117 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 3; break; //@line 4118 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 88: 
      var $206=$nsegs; //@line 4120 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp257=(($206)>>>0) > 4294967295; //@line 4120 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp257) { __label__ = 89; break; } else { __label__ = 90; break; } //@line 4120 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 89: 
      var $207=$nsegs; //@line 4120 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond262 = $207;__label__ = 91; break; //@line 4120 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 90: 
      var $cond262 = -1;__label__ = 91; break; //@line 4120 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 91: 
      var $cond262; //@line 4120 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $208=$m_addr; //@line 4120 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $release_checks=(($208+32)|0); //@line 4120 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($release_checks)>>2)]=$cond262; //@line 4120 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $209=$released; //@line 4122 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $209; //@line 4122 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_release_unused_segments["X"]=1;

function _memalign($alignment, $bytes) {
  ;
  var __label__;

  var $alignment_addr;
  var $bytes_addr;
  $alignment_addr=$alignment;
  $bytes_addr=$bytes;
  var $0=$alignment_addr; //@line 4881 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  var $1=$bytes_addr; //@line 4881 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  var $call=_internal_memalign(__gm_, $0, $1); //@line 4881 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  ;
  return $call; //@line 4881 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
}


function _internal_memalign($m, $alignment, $bytes) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $m_addr;
      var $alignment_addr;
      var $bytes_addr;
      var $a;
      var $nb;
      var $req;
      var $mem;
      var $leader;
      var $trailer;
      var $p;
      var $br;
      var $pos;
      var $newp;
      var $leadsize;
      var $newsize;
      var $size;
      var $remainder_size;
      var $remainder;
      $m_addr=$m;
      $alignment_addr=$alignment;
      $bytes_addr=$bytes;
      var $0=$alignment_addr; //@line 4379 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)>>>0) <= 8; //@line 4379 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 4379 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $1=$bytes_addr; //@line 4380 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call=_malloc($1); //@line 4380 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$call; //@line 4380 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 38; break; //@line 4380 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $2=$alignment_addr; //@line 4381 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($2)>>>0) < 16; //@line 4381 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 4381 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      $alignment_addr=16; //@line 4382 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 6; break; //@line 4382 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $3=$alignment_addr; //@line 4383 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=$alignment_addr; //@line 4383 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=((($4)-(1))|0); //@line 4383 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$3 & $sub; //@line 4383 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp4=(($and)|0)!=0; //@line 4383 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp4) { __label__ = 7; break; } else { __label__ = 11; break; } //@line 4383 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      $a=16; //@line 4384 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 8; break; //@line 4385 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $5=$a; //@line 4385 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=$alignment_addr; //@line 4385 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp6=(($5)>>>0) < (($6)>>>0); //@line 4385 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp6) { __label__ = 9; break; } else { __label__ = 10; break; } //@line 4385 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $7=$a; //@line 4385 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl=$7 << 1; //@line 4385 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $a=$shl; //@line 4385 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 8; break; //@line 4385 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $8=$a; //@line 4386 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $alignment_addr=$8; //@line 4386 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 11; break; //@line 4387 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $9=$bytes_addr; //@line 4389 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=$alignment_addr; //@line 4389 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub8=(((-64)-($10))|0); //@line 4389 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp9=(($9)>>>0) >= (($sub8)>>>0); //@line 4389 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp9) { __label__ = 12; break; } else { __label__ = 15; break; } //@line 4389 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $11=$m_addr; //@line 4390 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp11=(($11)|0)!=0; //@line 4390 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp11) { __label__ = 13; break; } else { __label__ = 14; break; } //@line 4390 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $call13=___errno(); //@line 4391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($call13)>>2)]=12; //@line 4391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 14; break; //@line 4392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      __label__ = 37; break; //@line 4393 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $12=$bytes_addr; //@line 4395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp15=(($12)>>>0) < 11; //@line 4395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp15) { __label__ = 16; break; } else { __label__ = 17; break; } //@line 4395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 16: 
      var $cond = 16;__label__ = 18; break; //@line 4395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $13=$bytes_addr; //@line 4395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($13)+(4))|0); //@line 4395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add16=((($add)+(7))|0); //@line 4395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and17=$add16 & -8; //@line 4395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $and17;__label__ = 18; break; //@line 4395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $cond; //@line 4395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $nb=$cond; //@line 4395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=$nb; //@line 4396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $15=$alignment_addr; //@line 4396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add18=((($14)+($15))|0); //@line 4396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add19=((($add18)+(16))|0); //@line 4396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub20=((($add19)-(4))|0); //@line 4396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $req=$sub20; //@line 4396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=$req; //@line 4397 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call21=_malloc($16); //@line 4397 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mem=$call21; //@line 4397 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $17=$mem; //@line 4398 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp22=(($17)|0)!=0; //@line 4398 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp22) { __label__ = 19; break; } else { __label__ = 36; break; } //@line 4398 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 19: 
      $leader=0; //@line 4399 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $trailer=0; //@line 4400 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $18=$mem; //@line 4401 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=((($18)-(8))|0); //@line 4401 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $19=$add_ptr; //@line 4401 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p=$19; //@line 4401 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=$mem; //@line 4404 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=$20; //@line 4404 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $22=$alignment_addr; //@line 4404 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $rem=((($21)>>>0))%((($22)>>>0)); //@line 4404 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp24=(($rem)|0)!=0; //@line 4404 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp24) { __label__ = 20; break; } else { __label__ = 27; break; } //@line 4404 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 20: 
      var $23=$mem; //@line 4416 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $24=$alignment_addr; //@line 4416 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr26=(($23+$24)|0); //@line 4416 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr27=((($add_ptr26)-(1))|0); //@line 4416 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $25=$add_ptr27; //@line 4416 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $26=$alignment_addr; //@line 4416 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub28=(((-$26))|0); //@line 4416 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and29=$25 & $sub28; //@line 4416 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $27=$and29; //@line 4416 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr30=((($27)-(8))|0); //@line 4416 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=$add_ptr30; //@line 4416 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $29=$28; //@line 4416 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $br=$29; //@line 4416 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $30=$br; //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $31=$p; //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $32=$31; //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_lhs_cast=$30; //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_rhs_cast=$32; //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_sub=((($sub_ptr_lhs_cast)-($sub_ptr_rhs_cast))|0); //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp31=(($sub_ptr_sub)>>>0) >= 16; //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp31) { __label__ = 21; break; } else { __label__ = 22; break; } //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 21: 
      var $33=$br; //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond36 = $33;__label__ = 23; break; //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 22: 
      var $34=$br; //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $35=$alignment_addr; //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr34=(($34+$35)|0); //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond36 = $add_ptr34;__label__ = 23; break; //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 23: 
      var $cond36; //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $pos=$cond36; //@line 4418 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $36=$pos; //@line 4419 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $37=$36; //@line 4419 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $newp=$37; //@line 4419 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $38=$pos; //@line 4420 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $39=$p; //@line 4420 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $40=$39; //@line 4420 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_lhs_cast37=$38; //@line 4420 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_rhs_cast38=$40; //@line 4420 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_sub39=((($sub_ptr_lhs_cast37)-($sub_ptr_rhs_cast38))|0); //@line 4420 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $leadsize=$sub_ptr_sub39; //@line 4420 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $41=$p; //@line 4421 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($41+4)|0); //@line 4421 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $42=HEAP32[(($head)>>2)]; //@line 4421 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and40=$42 & -8; //@line 4421 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $43=$leadsize; //@line 4421 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub41=((($and40)-($43))|0); //@line 4421 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $newsize=$sub41; //@line 4421 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $44=$p; //@line 4423 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head42=(($44+4)|0); //@line 4423 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $45=HEAP32[(($head42)>>2)]; //@line 4423 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and43=$45 & 3; //@line 4423 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp44=(($and43)|0)==0; //@line 4423 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp44) { __label__ = 24; break; } else { __label__ = 25; break; } //@line 4423 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $46=$p; //@line 4424 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($46)|0); //@line 4424 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $47=HEAP32[(($prev_foot)>>2)]; //@line 4424 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $48=$leadsize; //@line 4424 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add46=((($47)+($48))|0); //@line 4424 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $49=$newp; //@line 4424 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot47=(($49)|0); //@line 4424 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot47)>>2)]=$add46; //@line 4424 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $50=$newsize; //@line 4425 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $51=$newp; //@line 4425 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head48=(($51+4)|0); //@line 4425 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head48)>>2)]=$50; //@line 4425 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 26; break; //@line 4426 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $52=$newp; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head50=(($52+4)|0); //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $53=HEAP32[(($head50)>>2)]; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and51=$53 & 1; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $54=$newsize; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or=$and51 | $54; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or52=$or | 2; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $55=$newp; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head53=(($55+4)|0); //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head53)>>2)]=$or52; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $56=$newp; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $57=$56; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $58=$newsize; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr54=(($57+$58)|0); //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $59=$add_ptr54; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head55=(($59+4)|0); //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $60=HEAP32[(($head55)>>2)]; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or56=$60 | 1; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head55)>>2)]=$or56; //@line 4428 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $61=$p; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head57=(($61+4)|0); //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $62=HEAP32[(($head57)>>2)]; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and58=$62 & 1; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $63=$leadsize; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or59=$and58 | $63; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or60=$or59 | 2; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $64=$p; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head61=(($64+4)|0); //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head61)>>2)]=$or60; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $65=$p; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $66=$65; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $67=$leadsize; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr62=(($66+$67)|0); //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $68=$add_ptr62; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head63=(($68+4)|0); //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $69=HEAP32[(($head63)>>2)]; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or64=$69 | 1; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head63)>>2)]=$or64; //@line 4429 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $70=$p; //@line 4430 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $71=$70; //@line 4430 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr65=(($71+8)|0); //@line 4430 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $leader=$add_ptr65; //@line 4430 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 26; break;
    case 26: 
      var $72=$newp; //@line 4432 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p=$72; //@line 4432 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 27; break; //@line 4433 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 27: 
      var $73=$p; //@line 4436 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head68=(($73+4)|0); //@line 4436 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $74=HEAP32[(($head68)>>2)]; //@line 4436 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and69=$74 & 3; //@line 4436 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp70=(($and69)|0)==0; //@line 4436 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp70) { __label__ = 31; break; } else { __label__ = 28; break; } //@line 4436 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 28: 
      var $75=$p; //@line 4437 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head72=(($75+4)|0); //@line 4437 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $76=HEAP32[(($head72)>>2)]; //@line 4437 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and73=$76 & -8; //@line 4437 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $size=$and73; //@line 4437 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $77=$size; //@line 4438 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $78=$nb; //@line 4438 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add74=((($78)+(16))|0); //@line 4438 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp75=(($77)>>>0) > (($add74)>>>0); //@line 4438 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp75) { __label__ = 29; break; } else { __label__ = 30; break; } //@line 4438 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 29: 
      var $79=$size; //@line 4439 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $80=$nb; //@line 4439 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub77=((($79)-($80))|0); //@line 4439 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $remainder_size=$sub77; //@line 4439 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $81=$p; //@line 4440 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $82=$81; //@line 4440 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $83=$nb; //@line 4440 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr78=(($82+$83)|0); //@line 4440 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $84=$add_ptr78; //@line 4440 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $remainder=$84; //@line 4440 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $85=$p; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head79=(($85+4)|0); //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $86=HEAP32[(($head79)>>2)]; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and80=$86 & 1; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $87=$nb; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or81=$and80 | $87; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or82=$or81 | 2; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $88=$p; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head83=(($88+4)|0); //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head83)>>2)]=$or82; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $89=$p; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $90=$89; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $91=$nb; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr84=(($90+$91)|0); //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $92=$add_ptr84; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head85=(($92+4)|0); //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $93=HEAP32[(($head85)>>2)]; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or86=$93 | 1; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head85)>>2)]=$or86; //@line 4441 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $94=$remainder; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head87=(($94+4)|0); //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $95=HEAP32[(($head87)>>2)]; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and88=$95 & 1; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $96=$remainder_size; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or89=$and88 | $96; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or90=$or89 | 2; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $97=$remainder; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head91=(($97+4)|0); //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head91)>>2)]=$or90; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $98=$remainder; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $99=$98; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $100=$remainder_size; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr92=(($99+$100)|0); //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $101=$add_ptr92; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head93=(($101+4)|0); //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $102=HEAP32[(($head93)>>2)]; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or94=$102 | 1; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head93)>>2)]=$or94; //@line 4442 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $103=$remainder; //@line 4443 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $104=$103; //@line 4443 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr95=(($104+8)|0); //@line 4443 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $trailer=$add_ptr95; //@line 4443 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 30; break; //@line 4444 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 30: 
      __label__ = 31; break; //@line 4445 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $105=$leader; //@line 4451 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp98=(($105)|0)!=0; //@line 4451 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp98) { __label__ = 32; break; } else { __label__ = 33; break; } //@line 4451 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $106=$leader; //@line 4452 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      _free($106); //@line 4452 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 33; break; //@line 4453 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 33: 
      var $107=$trailer; //@line 4454 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp101=(($107)|0)!=0; //@line 4454 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp101) { __label__ = 34; break; } else { __label__ = 35; break; } //@line 4454 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $108=$trailer; //@line 4455 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      _free($108); //@line 4455 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 35; break; //@line 4456 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 35: 
      var $109=$p; //@line 4457 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $110=$109; //@line 4457 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr104=(($110+8)|0); //@line 4457 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$add_ptr104; //@line 4457 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 38; break; //@line 4457 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 36: 
      __label__ = 37; break;
    case 37: 
      $retval=0; //@line 4460 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 38; break; //@line 4460 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 38: 
      var $111=$retval; //@line 4461 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $111; //@line 4461 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_internal_memalign["X"]=1;

function _independent_calloc($n_elements, $elem_size, $chunks) {
  var __stackBase__  = STACKTOP; STACKTOP += 4; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;

  var $n_elements_addr;
  var $elem_size_addr;
  var $chunks_addr;
  var $sz=__stackBase__;
  $n_elements_addr=$n_elements;
  $elem_size_addr=$elem_size;
  $chunks_addr=$chunks;
  var $0=$elem_size_addr; //@line 4886 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  HEAP32[(($sz)>>2)]=$0; //@line 4886 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  var $1=$n_elements_addr; //@line 4887 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  var $2=$chunks_addr; //@line 4887 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  var $call=_ialloc(__gm_, $1, $sz, 3, $2); //@line 4887 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  STACKTOP = __stackBase__;
  return $call; //@line 4887 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
}


function _internal_realloc($m, $oldmem, $bytes) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $m_addr;
      var $oldmem_addr;
      var $bytes_addr;
      var $oldp;
      var $oldsize;
      var $next;
      var $newp;
      var $extra;
      var $nb;
      var $rsize;
      var $remainder;
      var $newsize;
      var $newtopsize;
      var $newtop;
      var $newmem;
      var $oc;
      $m_addr=$m;
      $oldmem_addr=$oldmem;
      $bytes_addr=$bytes;
      var $0=$bytes_addr; //@line 4304 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)>>>0) >= 4294967232; //@line 4304 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 4304 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $call=___errno(); //@line 4305 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($call)>>2)]=12; //@line 4305 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=0; //@line 4306 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 35; break; //@line 4306 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $1=$oldmem_addr; //@line 4309 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=((($1)-(8))|0); //@line 4309 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$add_ptr; //@line 4309 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $oldp=$2; //@line 4309 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=$oldp; //@line 4310 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($3+4)|0); //@line 4310 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=HEAP32[(($head)>>2)]; //@line 4310 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$4 & -8; //@line 4310 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $oldsize=$and; //@line 4310 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=$oldp; //@line 4311 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=$5; //@line 4311 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$oldsize; //@line 4311 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr1=(($6+$7)|0); //@line 4311 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=$add_ptr1; //@line 4311 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $next=$8; //@line 4311 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $newp=0; //@line 4312 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $extra=0; //@line 4313 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $9=$oldp; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=$9; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=$m_addr; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($11+16)|0); //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=HEAPU32[(($least_addr)>>2)]; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp2=(($10)>>>0) >= (($12)>>>0); //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp2) { __label__ = 5; break; } else { var $21 = 0;__label__ = 8; break; } //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $13=$oldp; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head3=(($13+4)|0); //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=HEAP32[(($head3)>>2)]; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and4=$14 & 3; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp5=(($and4)|0)!=1; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp5) { __label__ = 6; break; } else { var $21 = 0;__label__ = 8; break; } //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $15=$oldp; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=$15; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $17=$next; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $18=$17; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp7=(($16)>>>0) < (($18)>>>0); //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp7) { __label__ = 7; break; } else { var $21 = 0;__label__ = 8; break; } //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $19=$next; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head8=(($19+4)|0); //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=HEAP32[(($head8)>>2)]; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and9=$20 & 1; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($and9)|0)!=0; //@line 4317 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21 = $tobool;__label__ = 8; break;
    case 8: 
      var $21;
      var $land_ext=(($21)&1);
      var $expval=(($land_ext)==(1));
      var $tobool10=(($expval)|0)!=0;
      if ($tobool10) { __label__ = 9; break; } else { __label__ = 24; break; }
    case 9: 
      var $22=$bytes_addr; //@line 4319 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp12=(($22)>>>0) < 11; //@line 4319 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp12) { __label__ = 10; break; } else { __label__ = 11; break; } //@line 4319 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $cond = 16;__label__ = 12; break; //@line 4319 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $23=$bytes_addr; //@line 4319 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($23)+(4))|0); //@line 4319 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add13=((($add)+(7))|0); //@line 4319 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and14=$add13 & -8; //@line 4319 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $and14;__label__ = 12; break; //@line 4319 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $cond; //@line 4319 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $nb=$cond; //@line 4319 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $24=$oldp; //@line 4320 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head15=(($24+4)|0); //@line 4320 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $25=HEAP32[(($head15)>>2)]; //@line 4320 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and16=$25 & 3; //@line 4320 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp17=(($and16)|0)==0; //@line 4320 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp17) { __label__ = 13; break; } else { __label__ = 14; break; } //@line 4320 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $26=$m_addr; //@line 4321 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $27=$oldp; //@line 4321 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=$nb; //@line 4321 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call19=_mmap_resize($26, $27, $28); //@line 4321 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $newp=$call19; //@line 4321 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 23; break; //@line 4321 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $29=$oldsize; //@line 4322 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $30=$nb; //@line 4322 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp20=(($29)>>>0) >= (($30)>>>0); //@line 4322 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp20) { __label__ = 15; break; } else { __label__ = 18; break; } //@line 4322 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $31=$oldsize; //@line 4323 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $32=$nb; //@line 4323 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=((($31)-($32))|0); //@line 4323 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rsize=$sub; //@line 4323 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $33=$oldp; //@line 4324 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $newp=$33; //@line 4324 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $34=$rsize; //@line 4325 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp22=(($34)>>>0) >= 16; //@line 4325 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp22) { __label__ = 16; break; } else { __label__ = 17; break; } //@line 4325 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 16: 
      var $35=$newp; //@line 4326 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $36=$35; //@line 4326 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $37=$nb; //@line 4326 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr24=(($36+$37)|0); //@line 4326 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $38=$add_ptr24; //@line 4326 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $remainder=$38; //@line 4326 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $39=$newp; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head25=(($39+4)|0); //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $40=HEAP32[(($head25)>>2)]; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and26=$40 & 1; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $41=$nb; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or=$and26 | $41; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or27=$or | 2; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $42=$newp; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head28=(($42+4)|0); //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head28)>>2)]=$or27; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $43=$newp; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $44=$43; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $45=$nb; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr29=(($44+$45)|0); //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $46=$add_ptr29; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head30=(($46+4)|0); //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $47=HEAP32[(($head30)>>2)]; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or31=$47 | 1; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head30)>>2)]=$or31; //@line 4327 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $48=$rsize; //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or32=$48 | 1; //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or33=$or32 | 2; //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $49=$remainder; //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head34=(($49+4)|0); //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head34)>>2)]=$or33; //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $50=$remainder; //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $51=$50; //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $52=$rsize; //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr35=(($51+$52)|0); //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $53=$add_ptr35; //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head36=(($53+4)|0); //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $54=HEAP32[(($head36)>>2)]; //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or37=$54 | 1; //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head36)>>2)]=$or37; //@line 4328 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $55=$remainder; //@line 4329 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $56=$55; //@line 4329 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr38=(($56+8)|0); //@line 4329 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $extra=$add_ptr38; //@line 4329 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 17; break; //@line 4330 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 17: 
      __label__ = 22; break; //@line 4331 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $57=$next; //@line 4332 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $58=$m_addr; //@line 4332 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top=(($58+24)|0); //@line 4332 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $59=HEAP32[(($top)>>2)]; //@line 4332 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp41=(($57)|0)==(($59)|0); //@line 4332 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp41) { __label__ = 19; break; } else { __label__ = 21; break; } //@line 4332 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $60=$oldsize; //@line 4332 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $61=$m_addr; //@line 4332 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize=(($61+12)|0); //@line 4332 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $62=HEAP32[(($topsize)>>2)]; //@line 4332 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add43=((($60)+($62))|0); //@line 4332 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $63=$nb; //@line 4332 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp44=(($add43)>>>0) > (($63)>>>0); //@line 4332 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp44) { __label__ = 20; break; } else { __label__ = 21; break; } //@line 4332 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 20: 
      var $64=$oldsize; //@line 4334 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $65=$m_addr; //@line 4334 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize46=(($65+12)|0); //@line 4334 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $66=HEAP32[(($topsize46)>>2)]; //@line 4334 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add47=((($64)+($66))|0); //@line 4334 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $newsize=$add47; //@line 4334 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $67=$newsize; //@line 4335 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $68=$nb; //@line 4335 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub48=((($67)-($68))|0); //@line 4335 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $newtopsize=$sub48; //@line 4335 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $69=$oldp; //@line 4336 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $70=$69; //@line 4336 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $71=$nb; //@line 4336 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr49=(($70+$71)|0); //@line 4336 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $72=$add_ptr49; //@line 4336 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $newtop=$72; //@line 4336 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $73=$oldp; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head50=(($73+4)|0); //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $74=HEAP32[(($head50)>>2)]; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and51=$74 & 1; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $75=$nb; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or52=$and51 | $75; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or53=$or52 | 2; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $76=$oldp; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head54=(($76+4)|0); //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head54)>>2)]=$or53; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $77=$oldp; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $78=$77; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $79=$nb; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr55=(($78+$79)|0); //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $80=$add_ptr55; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head56=(($80+4)|0); //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $81=HEAP32[(($head56)>>2)]; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or57=$81 | 1; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head56)>>2)]=$or57; //@line 4337 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $82=$newtopsize; //@line 4338 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or58=$82 | 1; //@line 4338 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $83=$newtop; //@line 4338 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head59=(($83+4)|0); //@line 4338 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head59)>>2)]=$or58; //@line 4338 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $84=$newtop; //@line 4339 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $85=$m_addr; //@line 4339 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top60=(($85+24)|0); //@line 4339 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($top60)>>2)]=$84; //@line 4339 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $86=$newtopsize; //@line 4340 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $87=$m_addr; //@line 4340 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize61=(($87+12)|0); //@line 4340 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($topsize61)>>2)]=$86; //@line 4340 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $88=$oldp; //@line 4341 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $newp=$88; //@line 4341 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 21; break; //@line 4342 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 21: 
      __label__ = 22; break;
    case 22: 
      __label__ = 23; break;
    case 23: 
      __label__ = 25; break; //@line 4343 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 24: 
      _abort(); //@line 4345 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 4345 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $89=$newp; //@line 4357 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp67=(($89)|0)!=0; //@line 4357 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp67) { __label__ = 26; break; } else { __label__ = 29; break; } //@line 4357 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $90=$extra; //@line 4358 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp69=(($90)|0)!=0; //@line 4358 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp69) { __label__ = 27; break; } else { __label__ = 28; break; } //@line 4358 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 27: 
      var $91=$extra; //@line 4359 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      _free($91); //@line 4359 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 28; break; //@line 4360 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 28: 
      var $92=$newp; //@line 4361 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $93=$92; //@line 4361 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr72=(($93+8)|0); //@line 4361 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$add_ptr72; //@line 4361 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 35; break; //@line 4361 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 29: 
      var $94=$bytes_addr; //@line 4364 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call74=_malloc($94); //@line 4364 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $newmem=$call74; //@line 4364 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $95=$newmem; //@line 4365 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp75=(($95)|0)!=0; //@line 4365 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp75) { __label__ = 30; break; } else { __label__ = 34; break; } //@line 4365 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 30: 
      var $96=$oldsize; //@line 4366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $97=$oldp; //@line 4366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head77=(($97+4)|0); //@line 4366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $98=HEAP32[(($head77)>>2)]; //@line 4366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and78=$98 & 3; //@line 4366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp79=(($and78)|0)==0; //@line 4366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond80=$cmp79 ? 8 : 4; //@line 4366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub81=((($96)-($cond80))|0); //@line 4366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $oc=$sub81; //@line 4366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $99=$newmem; //@line 4367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $100=$oldmem_addr; //@line 4367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $101=$oc; //@line 4367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $102=$bytes_addr; //@line 4367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp82=(($101)>>>0) < (($102)>>>0); //@line 4367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp82) { __label__ = 31; break; } else { __label__ = 32; break; } //@line 4367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $103=$oc; //@line 4367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond86 = $103;__label__ = 33; break; //@line 4367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $104=$bytes_addr; //@line 4367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond86 = $104;__label__ = 33; break; //@line 4367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 33: 
      var $cond86; //@line 4367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      assert($cond86 % 1 === 0, 'memcpy given ' + $cond86 + ' bytes to copy. Problem with quantum=1 corrections perhaps?');_memcpy($99, $100, $cond86, 1); //@line 4367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $105=$oldmem_addr; //@line 4368 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      _free($105); //@line 4368 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 34; break; //@line 4369 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $106=$newmem; //@line 4370 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$106; //@line 4370 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 35; break; //@line 4370 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 35: 
      var $107=$retval; //@line 4374 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $107; //@line 4374 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_internal_realloc["X"]=1;

function _malloc_footprint() {
  ;
  var __label__;

  var $0=HEAP32[((((__gm_+432)|0))>>2)]; //@line 4920 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  ;
  return $0; //@line 4920 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
}


function _malloc_max_footprint() {
  ;
  var __label__;

  var $0=HEAP32[((((__gm_+436)|0))>>2)]; //@line 4924 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  ;
  return $0; //@line 4924 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
}


function _ialloc($m, $n_elements, $sizes, $opts, $chunks) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $m_addr;
      var $n_elements_addr;
      var $sizes_addr;
      var $opts_addr;
      var $chunks_addr;
      var $element_size;
      var $contents_size;
      var $array_size;
      var $mem;
      var $p;
      var $remainder_size;
      var $marray;
      var $array_chunk;
      var $was_enabled;
      var $size;
      var $i;
      var $array_chunk_size;
      $m_addr=$m;
      $n_elements_addr=$n_elements;
      $sizes_addr=$sizes;
      $opts_addr=$opts;
      $chunks_addr=$chunks;
      var $0=HEAP32[((((_mparams)|0))>>2)]; //@line 4491 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)!=0; //@line 4491 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { var $1 = 1;__label__ = 4; break; } else { __label__ = 3; break; } //@line 4491 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $call=_init_mparams(); //@line 4491 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($call)|0)!=0; //@line 4491 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1 = $tobool;__label__ = 4; break; //@line 4491 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $1;
      var $lor_ext=(($1)&1); //@line 4491 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$chunks_addr; //@line 4493 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($2)|0)!=0; //@line 4493 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 8; break; } //@line 4493 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $3=$n_elements_addr; //@line 4494 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp2=(($3)|0)==0; //@line 4494 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp2) { __label__ = 6; break; } else { __label__ = 7; break; } //@line 4494 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $4=$chunks_addr; //@line 4495 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$4; //@line 4495 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 48; break; //@line 4495 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $5=$chunks_addr; //@line 4496 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $marray=$5; //@line 4496 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $array_size=0; //@line 4497 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 14; break; //@line 4498 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $6=$n_elements_addr; //@line 4501 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp4=(($6)|0)==0; //@line 4501 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp4) { __label__ = 9; break; } else { __label__ = 10; break; } //@line 4501 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $call6=_malloc(0); //@line 4502 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$call6; //@line 4502 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$7; //@line 4502 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 48; break; //@line 4502 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      $marray=0; //@line 4503 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=$n_elements_addr; //@line 4504 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $mul=((($8<<2))|0); //@line 4504 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp8=(($mul)>>>0) < 11; //@line 4504 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp8) { __label__ = 11; break; } else { __label__ = 12; break; } //@line 4504 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $cond = 16;__label__ = 13; break; //@line 4504 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $9=$n_elements_addr; //@line 4504 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $mul9=((($9<<2))|0); //@line 4504 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($mul9)+(4))|0); //@line 4504 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add10=((($add)+(7))|0); //@line 4504 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$add10 & -8; //@line 4504 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $and;__label__ = 13; break; //@line 4504 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $cond; //@line 4504 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $array_size=$cond; //@line 4504 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 14; break;
    case 14: 
      var $10=$opts_addr; //@line 4508 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and12=$10 & 1; //@line 4508 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool13=(($and12)|0)!=0; //@line 4508 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool13) { __label__ = 15; break; } else { __label__ = 19; break; } //@line 4508 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $11=$sizes_addr; //@line 4509 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=HEAPU32[(($11)>>2)]; //@line 4509 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp15=(($12)>>>0) < 11; //@line 4509 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp15) { __label__ = 16; break; } else { __label__ = 17; break; } //@line 4509 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 16: 
      var $cond22 = 16;__label__ = 18; break; //@line 4509 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $13=$sizes_addr; //@line 4509 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=HEAP32[(($13)>>2)]; //@line 4509 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add18=((($14)+(4))|0); //@line 4509 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add19=((($add18)+(7))|0); //@line 4509 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and20=$add19 & -8; //@line 4509 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond22 = $and20;__label__ = 18; break; //@line 4509 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $cond22; //@line 4509 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $element_size=$cond22; //@line 4509 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $15=$n_elements_addr; //@line 4510 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=$element_size; //@line 4510 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $mul23=((($15)*($16))|0); //@line 4510 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $contents_size=$mul23; //@line 4510 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 27; break; //@line 4511 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 19: 
      $element_size=0; //@line 4513 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $contents_size=0; //@line 4514 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $i=0; //@line 4515 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 20; break; //@line 4515 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 20: 
      var $17=$i; //@line 4515 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $18=$n_elements_addr; //@line 4515 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp25=(($17)|0)!=(($18)|0); //@line 4515 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp25) { __label__ = 21; break; } else { __label__ = 26; break; } //@line 4515 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 21: 
      var $19=$i; //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=$sizes_addr; //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=(($20+($19<<2))|0); //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=HEAPU32[(($arrayidx)>>2)]; //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp26=(($21)>>>0) < 11; //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp26) { __label__ = 22; break; } else { __label__ = 23; break; } //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 22: 
      var $cond34 = 16;__label__ = 24; break; //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 23: 
      var $22=$i; //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $23=$sizes_addr; //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx29=(($23+($22<<2))|0); //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $24=HEAP32[(($arrayidx29)>>2)]; //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add30=((($24)+(4))|0); //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add31=((($add30)+(7))|0); //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and32=$add31 & -8; //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond34 = $and32;__label__ = 24; break; //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $cond34; //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $25=$contents_size; //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add35=((($25)+($cond34))|0); //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $contents_size=$add35; //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 25; break; //@line 4516 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $26=$i; //@line 4515 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $inc=((($26)+(1))|0); //@line 4515 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $i=$inc; //@line 4515 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 20; break; //@line 4515 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 26: 
      __label__ = 27; break;
    case 27: 
      var $27=$contents_size; //@line 4519 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=$array_size; //@line 4519 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add37=((($27)+($28))|0); //@line 4519 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $size=$add37; //@line 4519 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $29=$m_addr; //@line 4526 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $mflags=(($29+440)|0); //@line 4526 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $30=HEAP32[(($mflags)>>2)]; //@line 4526 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and38=$30 & 0; //@line 4526 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $was_enabled=$and38; //@line 4526 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $31=$m_addr; //@line 4527 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $mflags39=(($31+440)|0); //@line 4527 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $32=HEAP32[(($mflags39)>>2)]; //@line 4527 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($mflags39)>>2)]=$32; //@line 4527 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $33=$size; //@line 4528 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=((($33)-(4))|0); //@line 4528 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call40=_malloc($sub); //@line 4528 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mem=$call40; //@line 4528 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $34=$was_enabled; //@line 4529 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool41=(($34)|0)!=0; //@line 4529 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool41) { __label__ = 28; break; } else { __label__ = 29; break; } //@line 4529 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 28: 
      var $35=$m_addr; //@line 4530 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $mflags43=(($35+440)|0); //@line 4530 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $36=HEAP32[(($mflags43)>>2)]; //@line 4530 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($mflags43)>>2)]=$36; //@line 4530 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 29; break; //@line 4530 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 29: 
      var $37=$mem; //@line 4531 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp45=(($37)|0)==0; //@line 4531 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp45) { __label__ = 30; break; } else { __label__ = 31; break; } //@line 4531 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 30: 
      $retval=0; //@line 4532 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 48; break; //@line 4532 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $38=$mem; //@line 4535 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=((($38)-(8))|0); //@line 4535 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $39=$add_ptr; //@line 4535 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p=$39; //@line 4535 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $40=$p; //@line 4536 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($40+4)|0); //@line 4536 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $41=HEAP32[(($head)>>2)]; //@line 4536 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and48=$41 & -8; //@line 4536 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $remainder_size=$and48; //@line 4536 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $42=$opts_addr; //@line 4540 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and49=$42 & 2; //@line 4540 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool50=(($and49)|0)!=0; //@line 4540 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool50) { __label__ = 32; break; } else { __label__ = 33; break; } //@line 4540 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $43=$mem; //@line 4541 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $44=$43; //@line 4541 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $45=$44; //@line 4541 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $46=$remainder_size; //@line 4541 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub52=((($46)-(4))|0); //@line 4541 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $47=$array_size; //@line 4541 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub53=((($sub52)-($47))|0); //@line 4541 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      _memset($45, 0, $sub53, 4); //@line 4541 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 33; break; //@line 4542 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 33: 
      var $48=$marray; //@line 4545 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp55=(($48)|0)==0; //@line 4545 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp55) { __label__ = 34; break; } else { __label__ = 35; break; } //@line 4545 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $49=$p; //@line 4547 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $50=$49; //@line 4547 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $51=$contents_size; //@line 4547 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr57=(($50+$51)|0); //@line 4547 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $52=$add_ptr57; //@line 4547 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $array_chunk=$52; //@line 4547 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $53=$remainder_size; //@line 4548 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $54=$contents_size; //@line 4548 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub58=((($53)-($54))|0); //@line 4548 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $array_chunk_size=$sub58; //@line 4548 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $55=$array_chunk; //@line 4549 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $56=$55; //@line 4549 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr59=(($56+8)|0); //@line 4549 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $57=$add_ptr59; //@line 4549 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $marray=$57; //@line 4549 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $58=$array_chunk_size; //@line 4550 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or=$58 | 1; //@line 4550 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or60=$or | 2; //@line 4550 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $59=$array_chunk; //@line 4550 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head61=(($59+4)|0); //@line 4550 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head61)>>2)]=$or60; //@line 4550 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $60=$contents_size; //@line 4551 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $remainder_size=$60; //@line 4551 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 35; break; //@line 4552 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 35: 
      $i=0; //@line 4555 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 36; break; //@line 4555 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 36: 
      var $61=$p; //@line 4556 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $62=$61; //@line 4556 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr64=(($62+8)|0); //@line 4556 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $63=$i; //@line 4556 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $64=$marray; //@line 4556 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx65=(($64+($63<<2))|0); //@line 4556 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx65)>>2)]=$add_ptr64; //@line 4556 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $65=$i; //@line 4557 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $66=$n_elements_addr; //@line 4557 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub66=((($66)-(1))|0); //@line 4557 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp67=(($65)|0)!=(($sub66)|0); //@line 4557 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp67) { __label__ = 37; break; } else { __label__ = 44; break; } //@line 4557 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 37: 
      var $67=$element_size; //@line 4558 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp69=(($67)|0)!=0; //@line 4558 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp69) { __label__ = 38; break; } else { __label__ = 39; break; } //@line 4558 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 38: 
      var $68=$element_size; //@line 4559 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $size=$68; //@line 4559 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 43; break; //@line 4559 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 39: 
      var $69=$i; //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $70=$sizes_addr; //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx72=(($70+($69<<2))|0); //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $71=HEAPU32[(($arrayidx72)>>2)]; //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp73=(($71)>>>0) < 11; //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp73) { __label__ = 40; break; } else { __label__ = 41; break; } //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 40: 
      var $cond81 = 16;__label__ = 42; break; //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 41: 
      var $72=$i; //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $73=$sizes_addr; //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx76=(($73+($72<<2))|0); //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $74=HEAP32[(($arrayidx76)>>2)]; //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add77=((($74)+(4))|0); //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add78=((($add77)+(7))|0); //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and79=$add78 & -8; //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond81 = $and79;__label__ = 42; break; //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 42: 
      var $cond81; //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $size=$cond81; //@line 4561 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 43; break;
    case 43: 
      var $75=$size; //@line 4562 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $76=$remainder_size; //@line 4562 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub83=((($76)-($75))|0); //@line 4562 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $remainder_size=$sub83; //@line 4562 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $77=$size; //@line 4563 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or84=$77 | 1; //@line 4563 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or85=$or84 | 2; //@line 4563 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $78=$p; //@line 4563 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head86=(($78+4)|0); //@line 4563 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head86)>>2)]=$or85; //@line 4563 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $79=$p; //@line 4564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $80=$79; //@line 4564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $81=$size; //@line 4564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr87=(($80+$81)|0); //@line 4564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $82=$add_ptr87; //@line 4564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p=$82; //@line 4564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 45; break; //@line 4565 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 44: 
      var $83=$remainder_size; //@line 4567 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or89=$83 | 1; //@line 4567 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or90=$or89 | 2; //@line 4567 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $84=$p; //@line 4567 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head91=(($84+4)|0); //@line 4567 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head91)>>2)]=$or90; //@line 4567 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 47; break; //@line 4568 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 45: 
      __label__ = 46; break; //@line 4570 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 46: 
      var $85=$i; //@line 4555 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $inc94=((($85)+(1))|0); //@line 4555 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $i=$inc94; //@line 4555 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 36; break; //@line 4555 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 47: 
      var $86=$marray; //@line 4589 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$86; //@line 4589 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 48; break; //@line 4589 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 48: 
      var $87=$retval; //@line 4590 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $87; //@line 4590 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_ialloc["X"]=1;

function _independent_comalloc($n_elements, $sizes, $chunks) {
  ;
  var __label__;

  var $n_elements_addr;
  var $sizes_addr;
  var $chunks_addr;
  $n_elements_addr=$n_elements;
  $sizes_addr=$sizes;
  $chunks_addr=$chunks;
  var $0=$n_elements_addr; //@line 4892 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  var $1=$sizes_addr; //@line 4892 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  var $2=$chunks_addr; //@line 4892 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  var $call=_ialloc(__gm_, $0, $1, 0, $2); //@line 4892 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  ;
  return $call; //@line 4892 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
}


function _valloc($bytes) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $bytes_addr;
      var $pagesz;
      $bytes_addr=$bytes;
      var $0=HEAP32[((((_mparams)|0))>>2)]; //@line 4897 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)!=0; //@line 4897 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { var $1 = 1;__label__ = 4; break; } else { __label__ = 3; break; } //@line 4897 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $call=_init_mparams(); //@line 4897 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($call)|0)!=0; //@line 4897 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1 = $tobool;__label__ = 4; break; //@line 4897 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $1;
      var $lor_ext=(($1)&1); //@line 4897 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=HEAP32[((((_mparams+4)|0))>>2)]; //@line 4898 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $pagesz=$2; //@line 4898 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=$pagesz; //@line 4899 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=$bytes_addr; //@line 4899 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call1=_memalign($3, $4); //@line 4899 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $call1; //@line 4899 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _pvalloc($bytes) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $bytes_addr;
      var $pagesz;
      $bytes_addr=$bytes;
      var $0=HEAP32[((((_mparams)|0))>>2)]; //@line 4904 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)!=0; //@line 4904 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { var $1 = 1;__label__ = 4; break; } else { __label__ = 3; break; } //@line 4904 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $call=_init_mparams(); //@line 4904 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($call)|0)!=0; //@line 4904 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1 = $tobool;__label__ = 4; break; //@line 4904 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $1;
      var $lor_ext=(($1)&1); //@line 4904 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=HEAP32[((((_mparams+4)|0))>>2)]; //@line 4905 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $pagesz=$2; //@line 4905 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=$pagesz; //@line 4906 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=$bytes_addr; //@line 4906 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=$pagesz; //@line 4906 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($4)+($5))|0); //@line 4906 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=((($add)-(1))|0); //@line 4906 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=$pagesz; //@line 4906 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub1=((($6)-(1))|0); //@line 4906 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg=$sub1 ^ -1; //@line 4906 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$sub & $neg; //@line 4906 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call2=_memalign($3, $and); //@line 4906 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $call2; //@line 4906 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _malloc_trim($pad) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $pad_addr;
      var $result;
      $pad_addr=$pad;
      $result=0; //@line 4910 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $0=HEAP32[((((_mparams)|0))>>2)]; //@line 4911 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)!=0; //@line 4911 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { var $1 = 1;__label__ = 4; break; } else { __label__ = 3; break; } //@line 4911 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $call=_init_mparams(); //@line 4911 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($call)|0)!=0; //@line 4911 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1 = $tobool;__label__ = 4; break; //@line 4911 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $1;
      var $lor_ext=(($1)&1); //@line 4911 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$pad_addr; //@line 4913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call1=_sys_trim(__gm_, $2); //@line 4913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $result=$call1; //@line 4913 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=$result; //@line 4916 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $3; //@line 4916 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _mallinfo($agg_result) {
  ;
  var __label__;

  _internal_mallinfo($agg_result, __gm_); //@line 4929 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  ;
  return; //@line 4929 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
}


function _internal_mallinfo($agg_result, $m) {
  var __stackBase__  = STACKTOP; STACKTOP += 40; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $nm=__stackBase__;
      var $nfree;
      var $mfree;
      var $sum;
      var $s;
      var $q;
      var $sz;
      $m_addr=$m;
      var $0=$nm; //@line 3338 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      for (var $$dest = $0>>2, $$stop = $$dest + 10; $$dest < $$stop; $$dest++) {
        HEAP32[$$dest] = 0
      }; //@line 3338 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1=HEAP32[((((_mparams)|0))>>2)]; //@line 3339 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($1)|0)!=0; //@line 3339 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { var $2 = 1;__label__ = 4; break; } else { __label__ = 3; break; } //@line 3339 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $call=_init_mparams(); //@line 3339 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($call)|0)!=0; //@line 3339 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2 = $tobool;__label__ = 4; break; //@line 3339 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $2;
      var $lor_ext=(($2)&1); //@line 3339 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=$m_addr; //@line 3342 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top=(($3+24)|0); //@line 3342 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=HEAP32[(($top)>>2)]; //@line 3342 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($4)|0)!=0; //@line 3342 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 21; break; } //@line 3342 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      $nfree=1; //@line 3343 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=$m_addr; //@line 3344 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize=(($5+12)|0); //@line 3344 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=HEAP32[(($topsize)>>2)]; //@line 3344 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($6)+(40))|0); //@line 3344 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mfree=$add; //@line 3344 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$mfree; //@line 3345 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sum=$7; //@line 3345 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=$m_addr; //@line 3346 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $seg=(($8+444)|0); //@line 3346 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $s=$seg; //@line 3346 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 6; break; //@line 3347 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $9=$s; //@line 3347 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp2=(($9)|0)!=0; //@line 3347 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp2) { __label__ = 7; break; } else { __label__ = 20; break; } //@line 3347 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $10=$s; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base=(($10)|0); //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=HEAP32[(($base)>>2)]; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=$s; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base3=(($12)|0); //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $13=HEAP32[(($base3)>>2)]; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($13+8)|0); //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=$add_ptr; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$14 & 7; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp4=(($and)|0)==0; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp4) { __label__ = 8; break; } else { __label__ = 9; break; } //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $cond = 0;__label__ = 10; break; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $15=$s; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base5=(($15)|0); //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=HEAP32[(($base5)>>2)]; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr6=(($16+8)|0); //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $17=$add_ptr6; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and7=$17 & 7; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=(((8)-($and7))|0); //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and8=$sub & 7; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $and8;__label__ = 10; break; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $cond; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr9=(($11+$cond)|0); //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $18=$add_ptr9; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $q=$18; //@line 3348 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 11; break; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $19=$q; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=$19; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=$s; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base11=(($21)|0); //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $22=HEAPU32[(($base11)>>2)]; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp12=(($20)>>>0) >= (($22)>>>0); //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp12) { __label__ = 12; break; } else { var $34 = 0;__label__ = 15; break; } //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $23=$q; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $24=$23; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $25=$s; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base13=(($25)|0); //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $26=HEAP32[(($base13)>>2)]; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $27=$s; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $size=(($27+4)|0); //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=HEAP32[(($size)>>2)]; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr14=(($26+$28)|0); //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp15=(($24)>>>0) < (($add_ptr14)>>>0); //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp15) { __label__ = 13; break; } else { var $34 = 0;__label__ = 15; break; } //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $29=$q; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $30=$m_addr; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top17=(($30+24)|0); //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $31=HEAP32[(($top17)>>2)]; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp18=(($29)|0)!=(($31)|0); //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp18) { __label__ = 14; break; } else { var $34 = 0;__label__ = 15; break; } //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $32=$q; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($32+4)|0); //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $33=HEAP32[(($head)>>2)]; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp19=(($33)|0)!=7; //@line 3349 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $34 = $cmp19;__label__ = 15; break;
    case 15: 
      var $34;
      if ($34) { __label__ = 16; break; } else { __label__ = 19; break; }
    case 16: 
      var $35=$q; //@line 3351 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head21=(($35+4)|0); //@line 3351 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $36=HEAP32[(($head21)>>2)]; //@line 3351 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and22=$36 & -8; //@line 3351 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sz=$and22; //@line 3351 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $37=$sz; //@line 3352 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $38=$sum; //@line 3352 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add23=((($38)+($37))|0); //@line 3352 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sum=$add23; //@line 3352 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $39=$q; //@line 3353 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head24=(($39+4)|0); //@line 3353 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $40=HEAP32[(($head24)>>2)]; //@line 3353 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and25=$40 & 3; //@line 3353 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp26=(($and25)|0)!=1; //@line 3353 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp26) { __label__ = 18; break; } else { __label__ = 17; break; } //@line 3353 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $41=$sz; //@line 3354 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $42=$mfree; //@line 3354 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add28=((($42)+($41))|0); //@line 3354 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mfree=$add28; //@line 3354 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $43=$nfree; //@line 3355 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $inc=((($43)+(1))|0); //@line 3355 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $nfree=$inc; //@line 3355 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 18; break; //@line 3356 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $44=$q; //@line 3357 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $45=$44; //@line 3357 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $46=$q; //@line 3357 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head29=(($46+4)|0); //@line 3357 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $47=HEAP32[(($head29)>>2)]; //@line 3357 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and30=$47 & -8; //@line 3357 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr31=(($45+$and30)|0); //@line 3357 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $48=$add_ptr31; //@line 3357 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $q=$48; //@line 3357 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 11; break; //@line 3358 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $49=$s; //@line 3359 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $next=(($49+8)|0); //@line 3359 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $50=HEAP32[(($next)>>2)]; //@line 3359 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $s=$50; //@line 3359 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 6; break; //@line 3360 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 20: 
      var $51=$sum; //@line 3362 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arena=(($nm)|0); //@line 3362 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arena)>>2)]=$51; //@line 3362 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $52=$nfree; //@line 3363 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $ordblks=(($nm+4)|0); //@line 3363 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($ordblks)>>2)]=$52; //@line 3363 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $53=$m_addr; //@line 3364 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $footprint=(($53+432)|0); //@line 3364 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $54=HEAP32[(($footprint)>>2)]; //@line 3364 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $55=$sum; //@line 3364 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub33=((($54)-($55))|0); //@line 3364 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $hblkhd=(($nm+16)|0); //@line 3364 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($hblkhd)>>2)]=$sub33; //@line 3364 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $56=$m_addr; //@line 3365 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $max_footprint=(($56+436)|0); //@line 3365 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $57=HEAP32[(($max_footprint)>>2)]; //@line 3365 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $usmblks=(($nm+20)|0); //@line 3365 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($usmblks)>>2)]=$57; //@line 3365 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $58=$m_addr; //@line 3366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $footprint34=(($58+432)|0); //@line 3366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $59=HEAP32[(($footprint34)>>2)]; //@line 3366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $60=$mfree; //@line 3366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub35=((($59)-($60))|0); //@line 3366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $uordblks=(($nm+28)|0); //@line 3366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($uordblks)>>2)]=$sub35; //@line 3366 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $61=$mfree; //@line 3367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fordblks=(($nm+32)|0); //@line 3367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fordblks)>>2)]=$61; //@line 3367 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $62=$m_addr; //@line 3368 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize36=(($62+12)|0); //@line 3368 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $63=HEAP32[(($topsize36)>>2)]; //@line 3368 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $keepcost=(($nm+36)|0); //@line 3368 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($keepcost)>>2)]=$63; //@line 3368 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 21; break; //@line 3369 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 21: 
      var $64=$agg_result; //@line 3373 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $65=$nm; //@line 3373 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      assert(40 % 1 === 0, 'memcpy given ' + 40 + ' bytes to copy. Problem with quantum=1 corrections perhaps?');for (var $$src = $65>>2, $$dest = $64>>2, $$stop = $$src + 10; $$src < $$stop; $$src++, $$dest++) {
        HEAP32[$$dest] = HEAP32[$$src]
      }; //@line 3373 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      STACKTOP = __stackBase__;
      return; //@line 3373 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_internal_mallinfo["X"]=1;

function _malloc_stats() {
  ;
  var __label__;

  _internal_malloc_stats(__gm_); //@line 4934 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  ;
  return; //@line 4935 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
}


function _internal_malloc_stats($m) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $maxfp;
      var $fp;
      var $used;
      var $s;
      var $q;
      $m_addr=$m;
      var $0=HEAP32[((((_mparams)|0))>>2)]; //@line 3378 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)!=0; //@line 3378 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { var $1 = 1;__label__ = 4; break; } else { __label__ = 3; break; } //@line 3378 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $call=_init_mparams(); //@line 3378 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($call)|0)!=0; //@line 3378 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1 = $tobool;__label__ = 4; break; //@line 3378 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $1;
      var $lor_ext=(($1)&1); //@line 3378 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $maxfp=0; //@line 3380 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $fp=0; //@line 3381 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $used=0; //@line 3382 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$m_addr; //@line 3384 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top=(($2+24)|0); //@line 3384 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=HEAP32[(($top)>>2)]; //@line 3384 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($3)|0)!=0; //@line 3384 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 21; break; } //@line 3384 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $4=$m_addr; //@line 3385 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $seg=(($4+444)|0); //@line 3385 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $s=$seg; //@line 3385 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=$m_addr; //@line 3386 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $max_footprint=(($5+436)|0); //@line 3386 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=HEAP32[(($max_footprint)>>2)]; //@line 3386 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $maxfp=$6; //@line 3386 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$m_addr; //@line 3387 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $footprint=(($7+432)|0); //@line 3387 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=HEAP32[(($footprint)>>2)]; //@line 3387 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $fp=$8; //@line 3387 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $9=$fp; //@line 3388 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=$m_addr; //@line 3388 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize=(($10+12)|0); //@line 3388 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=HEAP32[(($topsize)>>2)]; //@line 3388 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($11)+(40))|0); //@line 3388 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=((($9)-($add))|0); //@line 3388 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $used=$sub; //@line 3388 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 6; break; //@line 3390 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $12=$s; //@line 3390 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp2=(($12)|0)!=0; //@line 3390 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp2) { __label__ = 7; break; } else { __label__ = 20; break; } //@line 3390 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $13=$s; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base=(($13)|0); //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=HEAP32[(($base)>>2)]; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $15=$s; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base3=(($15)|0); //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=HEAP32[(($base3)>>2)]; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($16+8)|0); //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $17=$add_ptr; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$17 & 7; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp4=(($and)|0)==0; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp4) { __label__ = 8; break; } else { __label__ = 9; break; } //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $cond = 0;__label__ = 10; break; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $18=$s; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base5=(($18)|0); //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $19=HEAP32[(($base5)>>2)]; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr6=(($19+8)|0); //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=$add_ptr6; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and7=$20 & 7; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub8=(((8)-($and7))|0); //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and9=$sub8 & 7; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $and9;__label__ = 10; break; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $cond; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr10=(($14+$cond)|0); //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=$add_ptr10; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $q=$21; //@line 3391 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 11; break; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $22=$q; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $23=$22; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $24=$s; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base12=(($24)|0); //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $25=HEAPU32[(($base12)>>2)]; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp13=(($23)>>>0) >= (($25)>>>0); //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp13) { __label__ = 12; break; } else { var $37 = 0;__label__ = 15; break; } //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $26=$q; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $27=$26; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=$s; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base14=(($28)|0); //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $29=HEAP32[(($base14)>>2)]; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $30=$s; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $size=(($30+4)|0); //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $31=HEAP32[(($size)>>2)]; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr15=(($29+$31)|0); //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp16=(($27)>>>0) < (($add_ptr15)>>>0); //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp16) { __label__ = 13; break; } else { var $37 = 0;__label__ = 15; break; } //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $32=$q; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $33=$m_addr; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top18=(($33+24)|0); //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $34=HEAP32[(($top18)>>2)]; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp19=(($32)|0)!=(($34)|0); //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp19) { __label__ = 14; break; } else { var $37 = 0;__label__ = 15; break; } //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $35=$q; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($35+4)|0); //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $36=HEAP32[(($head)>>2)]; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp20=(($36)|0)!=7; //@line 3392 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $37 = $cmp20;__label__ = 15; break;
    case 15: 
      var $37;
      if ($37) { __label__ = 16; break; } else { __label__ = 19; break; }
    case 16: 
      var $38=$q; //@line 3394 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head22=(($38+4)|0); //@line 3394 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $39=HEAP32[(($head22)>>2)]; //@line 3394 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and23=$39 & 3; //@line 3394 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp24=(($and23)|0)!=1; //@line 3394 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp24) { __label__ = 18; break; } else { __label__ = 17; break; } //@line 3394 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $40=$q; //@line 3395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head26=(($40+4)|0); //@line 3395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $41=HEAP32[(($head26)>>2)]; //@line 3395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and27=$41 & -8; //@line 3395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $42=$used; //@line 3395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub28=((($42)-($and27))|0); //@line 3395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $used=$sub28; //@line 3395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 18; break; //@line 3395 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $43=$q; //@line 3396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $44=$43; //@line 3396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $45=$q; //@line 3396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head29=(($45+4)|0); //@line 3396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $46=HEAP32[(($head29)>>2)]; //@line 3396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and30=$46 & -8; //@line 3396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr31=(($44+$and30)|0); //@line 3396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $47=$add_ptr31; //@line 3396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $q=$47; //@line 3396 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 11; break; //@line 3397 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $48=$s; //@line 3398 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $next=(($48+8)|0); //@line 3398 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $49=HEAP32[(($next)>>2)]; //@line 3398 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $s=$49; //@line 3398 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 6; break; //@line 3399 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 20: 
      __label__ = 21; break; //@line 3400 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 21: 
      var $50=HEAP32[((_stderr)>>2)]; //@line 3402 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $51=$maxfp; //@line 3402 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call34=_fprintf($50, ((STRING_TABLE.__str)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$51,tempInt)); //@line 3402 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $52=HEAP32[((_stderr)>>2)]; //@line 3403 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $53=$fp; //@line 3403 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call35=_fprintf($52, ((STRING_TABLE.__str1)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$53,tempInt)); //@line 3403 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $54=HEAP32[((_stderr)>>2)]; //@line 3404 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $55=$used; //@line 3404 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call36=_fprintf($54, ((STRING_TABLE.__str2)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$55,tempInt)); //@line 3404 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return; //@line 3408 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_internal_malloc_stats["X"]=1;

function _mallopt($param_number, $value) {
  ;
  var __label__;

  var $param_number_addr;
  var $value_addr;
  $param_number_addr=$param_number;
  $value_addr=$value;
  var $0=$param_number_addr; //@line 4938 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  var $1=$value_addr; //@line 4938 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  var $call=_change_mparam($0, $1); //@line 4938 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
  ;
  return $call; //@line 4938 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
}


function _init_mparams() {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $magic;
      var $psize;
      var $gsize;
      var $0=HEAP32[((((_mparams)|0))>>2)]; //@line 2965 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)==0; //@line 2965 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 7; break; } //@line 2965 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $call=_sysconf(8); //@line 2971 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $psize=$call; //@line 2971 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1=$psize; //@line 2972 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $gsize=$1; //@line 2972 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$gsize; //@line 2989 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=$gsize; //@line 2989 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=((($3)-(1))|0); //@line 2989 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$2 & $sub; //@line 2989 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($and)|0)!=0; //@line 2989 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 4; break; } //@line 2989 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $4=$psize; //@line 2989 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=$psize; //@line 2989 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub2=((($5)-(1))|0); //@line 2989 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and3=$4 & $sub2; //@line 2989 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp4=(($and3)|0)!=0; //@line 2989 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp4) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 2989 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      _abort(); //@line 2997 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 2997 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $6=$gsize; //@line 2999 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((_mparams+8)|0))>>2)]=$6; //@line 2999 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$psize; //@line 3000 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((_mparams+4)|0))>>2)]=$7; //@line 3000 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((_mparams+12)|0))>>2)]=-1; //@line 3001 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((_mparams+16)|0))>>2)]=2097152; //@line 3002 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((_mparams+20)|0))>>2)]=0; //@line 3004 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=HEAP32[((((_mparams+20)|0))>>2)]; //@line 3011 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__gm_+440)|0))>>2)]=$8; //@line 3011 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call6=_time(0); //@line 3030 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $xor=$call6 ^ 1431655765; //@line 3030 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $magic=$xor; //@line 3030 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $9=$magic; //@line 3032 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or=$9 | 8; //@line 3032 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $magic=$or; //@line 3032 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=$magic; //@line 3033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and7=$10 & -8; //@line 3033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $magic=$and7; //@line 3033 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=$magic; //@line 3034 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((_mparams)|0))>>2)]=$11; //@line 3034 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 7; break; //@line 3036 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      ;
      return 1; //@line 3039 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _malloc_usable_size($mem) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $mem_addr;
      var $p;
      $mem_addr=$mem;
      var $0=$mem_addr; //@line 4944 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)!=0; //@line 4944 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 6; break; } //@line 4944 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $1=$mem_addr; //@line 4945 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=((($1)-(8))|0); //@line 4945 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$add_ptr; //@line 4945 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p=$2; //@line 4945 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=$p; //@line 4946 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($3+4)|0); //@line 4946 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=HEAP32[(($head)>>2)]; //@line 4946 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$4 & 3; //@line 4946 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($and)|0)!=1; //@line 4946 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 4; break; } else { __label__ = 5; break; } //@line 4946 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $5=$p; //@line 4947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head3=(($5+4)|0); //@line 4947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=HEAP32[(($head3)>>2)]; //@line 4947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and4=$6 & -8; //@line 4947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$p; //@line 4947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head5=(($7+4)|0); //@line 4947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=HEAP32[(($head5)>>2)]; //@line 4947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and6=$8 & 3; //@line 4947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp7=(($and6)|0)==0; //@line 4947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond=$cmp7 ? 8 : 4; //@line 4947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=((($and4)-($cond))|0); //@line 4947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$sub; //@line 4947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 7; break; //@line 4947 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      __label__ = 6; break; //@line 4948 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      $retval=0; //@line 4949 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 7; break; //@line 4949 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $9=$retval; //@line 4950 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $9; //@line 4950 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _mmap_resize($m, $oldp, $nb) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $m_addr;
      var $oldp_addr;
      var $nb_addr;
      var $oldsize;
      var $offset;
      var $oldmmsize;
      var $newmmsize;
      var $cp;
      var $newp;
      var $psize;
      $m_addr=$m;
      $oldp_addr=$oldp;
      $nb_addr=$nb;
      var $0=$oldp_addr; //@line 3699 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($0+4)|0); //@line 3699 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1=HEAP32[(($head)>>2)]; //@line 3699 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$1 & -8; //@line 3699 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $oldsize=$and; //@line 3699 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$nb_addr; //@line 3700 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr=$2 >>> 3; //@line 3700 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($shr)>>>0) < 32; //@line 3700 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 3700 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      $retval=0; //@line 3701 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 15; break; //@line 3701 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $3=$oldsize; //@line 3703 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=$nb_addr; //@line 3703 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($4)+(4))|0); //@line 3703 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($3)>>>0) >= (($add)>>>0); //@line 3703 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 7; break; } //@line 3703 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $5=$oldsize; //@line 3703 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=$nb_addr; //@line 3703 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=((($5)-($6))|0); //@line 3703 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=HEAP32[((((_mparams+8)|0))>>2)]; //@line 3703 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl=$7 << 1; //@line 3703 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp2=(($sub)>>>0) <= (($shl)>>>0); //@line 3703 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp2) { __label__ = 6; break; } else { __label__ = 7; break; } //@line 3703 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $8=$oldp_addr; //@line 3705 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$8; //@line 3705 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 15; break; //@line 3705 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $9=$oldp_addr; //@line 3707 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($9)|0); //@line 3707 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=HEAP32[(($prev_foot)>>2)]; //@line 3707 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $offset=$10; //@line 3707 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=$oldsize; //@line 3708 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=$offset; //@line 3708 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add4=((($11)+($12))|0); //@line 3708 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add5=((($add4)+(16))|0); //@line 3708 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $oldmmsize=$add5; //@line 3708 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $13=$nb_addr; //@line 3709 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add6=((($13)+(24))|0); //@line 3709 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add7=((($add6)+(7))|0); //@line 3709 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=HEAP32[((((_mparams+4)|0))>>2)]; //@line 3709 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub8=((($14)-(1))|0); //@line 3709 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add9=((($add7)+($sub8))|0); //@line 3709 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $15=HEAP32[((((_mparams+4)|0))>>2)]; //@line 3709 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub10=((($15)-(1))|0); //@line 3709 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg=$sub10 ^ -1; //@line 3709 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and11=$add9 & $neg; //@line 3709 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $newmmsize=$and11; //@line 3709 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $cp=-1; //@line 3711 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=$cp; //@line 3712 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp12=(($16)|0)!=-1; //@line 3712 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp12) { __label__ = 8; break; } else { __label__ = 13; break; } //@line 3712 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $17=$cp; //@line 3713 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $18=$offset; //@line 3713 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($17+$18)|0); //@line 3713 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $19=$add_ptr; //@line 3713 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $newp=$19; //@line 3713 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=$newmmsize; //@line 3714 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=$offset; //@line 3714 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub14=((($20)-($21))|0); //@line 3714 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub15=((($sub14)-(16))|0); //@line 3714 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $psize=$sub15; //@line 3714 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $22=$psize; //@line 3715 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $23=$newp; //@line 3715 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head16=(($23+4)|0); //@line 3715 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head16)>>2)]=$22; //@line 3715 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $24=$newp; //@line 3717 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $25=$24; //@line 3717 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $26=$psize; //@line 3717 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr17=(($25+$26)|0); //@line 3717 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $27=$add_ptr17; //@line 3717 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head18=(($27+4)|0); //@line 3717 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head18)>>2)]=7; //@line 3717 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=$newp; //@line 3718 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $29=$28; //@line 3718 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $30=$psize; //@line 3718 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add19=((($30)+(4))|0); //@line 3718 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr20=(($29+$add19)|0); //@line 3718 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $31=$add_ptr20; //@line 3718 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head21=(($31+4)|0); //@line 3718 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head21)>>2)]=0; //@line 3718 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $32=$cp; //@line 3720 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $33=$m_addr; //@line 3720 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($33+16)|0); //@line 3720 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $34=HEAPU32[(($least_addr)>>2)]; //@line 3720 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp22=(($32)>>>0) < (($34)>>>0); //@line 3720 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp22) { __label__ = 9; break; } else { __label__ = 10; break; } //@line 3720 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $35=$cp; //@line 3721 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $36=$m_addr; //@line 3721 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr24=(($36+16)|0); //@line 3721 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($least_addr24)>>2)]=$35; //@line 3721 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 10; break; //@line 3721 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $37=$newmmsize; //@line 3722 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $38=$oldmmsize; //@line 3722 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub26=((($37)-($38))|0); //@line 3722 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $39=$m_addr; //@line 3722 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $footprint=(($39+432)|0); //@line 3722 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $40=HEAP32[(($footprint)>>2)]; //@line 3722 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add27=((($40)+($sub26))|0); //@line 3722 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($footprint)>>2)]=$add27; //@line 3722 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $41=$m_addr; //@line 3722 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $max_footprint=(($41+436)|0); //@line 3722 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $42=HEAPU32[(($max_footprint)>>2)]; //@line 3722 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp28=(($add27)>>>0) > (($42)>>>0); //@line 3722 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp28) { __label__ = 11; break; } else { __label__ = 12; break; } //@line 3722 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $43=$m_addr; //@line 3723 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $footprint30=(($43+432)|0); //@line 3723 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $44=HEAP32[(($footprint30)>>2)]; //@line 3723 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $45=$m_addr; //@line 3723 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $max_footprint31=(($45+436)|0); //@line 3723 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($max_footprint31)>>2)]=$44; //@line 3723 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 12; break; //@line 3723 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $46=$newp; //@line 3725 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$46; //@line 3725 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 15; break; //@line 3725 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      __label__ = 14; break;
    case 14: 
      $retval=0; //@line 3728 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 15; break; //@line 3728 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $47=$retval; //@line 3729 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $47; //@line 3729 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_mmap_resize["X"]=1;

function _segment_holding($m, $addr) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $m_addr;
      var $addr_addr;
      var $sp;
      $m_addr=$m;
      $addr_addr=$addr;
      var $0=$m_addr; //@line 2562 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $seg=(($0+444)|0); //@line 2562 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sp=$seg; //@line 2562 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 3; break; //@line 2563 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $1=$addr_addr; //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$sp; //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base=(($2)|0); //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=HEAPU32[(($base)>>2)]; //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($1)>>>0) >= (($3)>>>0); //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 4; break; } else { __label__ = 6; break; } //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $4=$addr_addr; //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=$sp; //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base1=(($5)|0); //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=HEAP32[(($base1)>>2)]; //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$sp; //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $size=(($7+4)|0); //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=HEAP32[(($size)>>2)]; //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($6+$8)|0); //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp2=(($4)>>>0) < (($add_ptr)>>>0); //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp2) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 2564 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $9=$sp; //@line 2565 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$9; //@line 2565 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 9; break; //@line 2565 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $10=$sp; //@line 2566 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $next=(($10+8)|0); //@line 2566 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=HEAP32[(($next)>>2)]; //@line 2566 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sp=$11; //@line 2566 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp3=(($11)|0)==0; //@line 2566 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp3) { __label__ = 7; break; } else { __label__ = 8; break; } //@line 2566 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      $retval=0; //@line 2567 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 9; break; //@line 2567 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      __label__ = 3; break; //@line 2568 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $12=$retval; //@line 2569 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $12; //@line 2569 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _init_top($m, $p, $psize) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $p_addr;
      var $psize_addr;
      var $offset;
      $m_addr=$m;
      $p_addr=$p;
      $psize_addr=$psize;
      var $0=$p_addr; //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1=$0; //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($1+8)|0); //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$add_ptr; //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$2 & 7; //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($and)|0)==0; //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $cond = 0;__label__ = 5; break; //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $3=$p_addr; //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=$3; //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr1=(($4+8)|0); //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=$add_ptr1; //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and2=$5 & 7; //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=(((8)-($and2))|0); //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and3=$sub & 7; //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $and3;__label__ = 5; break; //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $cond; //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $offset=$cond; //@line 3736 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=$p_addr; //@line 3737 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$6; //@line 3737 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=$offset; //@line 3737 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr4=(($7+$8)|0); //@line 3737 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $9=$add_ptr4; //@line 3737 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p_addr=$9; //@line 3737 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=$offset; //@line 3738 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=$psize_addr; //@line 3738 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub5=((($11)-($10))|0); //@line 3738 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $psize_addr=$sub5; //@line 3738 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=$p_addr; //@line 3740 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $13=$m_addr; //@line 3740 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top=(($13+24)|0); //@line 3740 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($top)>>2)]=$12; //@line 3740 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=$psize_addr; //@line 3741 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $15=$m_addr; //@line 3741 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize=(($15+12)|0); //@line 3741 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($topsize)>>2)]=$14; //@line 3741 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=$psize_addr; //@line 3742 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or=$16 | 1; //@line 3742 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $17=$p_addr; //@line 3742 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($17+4)|0); //@line 3742 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head)>>2)]=$or; //@line 3742 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $18=$p_addr; //@line 3744 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $19=$18; //@line 3744 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=$psize_addr; //@line 3744 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr6=(($19+$20)|0); //@line 3744 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=$add_ptr6; //@line 3744 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head7=(($21+4)|0); //@line 3744 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head7)>>2)]=40; //@line 3744 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $22=HEAP32[((((_mparams+16)|0))>>2)]; //@line 3745 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $23=$m_addr; //@line 3745 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $trim_check=(($23+28)|0); //@line 3745 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($trim_check)>>2)]=$22; //@line 3745 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return; //@line 3746 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_init_top["X"]=1;

function _mmap_alloc($m, $nb) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $m_addr;
      var $nb_addr;
      var $mmsize;
      var $mm;
      var $offset;
      var $psize;
      var $p;
      $m_addr=$m;
      $nb_addr=$nb;
      var $0=$nb_addr; //@line 3672 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($0)+(24))|0); //@line 3672 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add1=((($add)+(7))|0); //@line 3672 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1=HEAP32[((((_mparams+4)|0))>>2)]; //@line 3672 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=((($1)-(1))|0); //@line 3672 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add2=((($add1)+($sub))|0); //@line 3672 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=HEAP32[((((_mparams+4)|0))>>2)]; //@line 3672 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub3=((($2)-(1))|0); //@line 3672 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg=$sub3 ^ -1; //@line 3672 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$add2 & $neg; //@line 3672 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $mmsize=$and; //@line 3672 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=$mmsize; //@line 3673 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=$nb_addr; //@line 3673 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($3)>>>0) > (($4)>>>0); //@line 3673 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 14; break; } //@line 3673 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      $mm=-1; //@line 3674 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=$mm; //@line 3675 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp4=(($5)|0)!=-1; //@line 3675 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp4) { __label__ = 4; break; } else { __label__ = 13; break; } //@line 3675 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $6=$mm; //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($6+8)|0); //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$add_ptr; //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and6=$7 & 7; //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp7=(($and6)|0)==0; //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp7) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $cond = 0;__label__ = 7; break; //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $8=$mm; //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr8=(($8+8)|0); //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $9=$add_ptr8; //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and9=$9 & 7; //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub10=(((8)-($and9))|0); //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and11=$sub10 & 7; //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $and11;__label__ = 7; break; //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $cond; //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $offset=$cond; //@line 3676 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=$mmsize; //@line 3677 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=$offset; //@line 3677 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub12=((($10)-($11))|0); //@line 3677 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub13=((($sub12)-(16))|0); //@line 3677 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $psize=$sub13; //@line 3677 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=$mm; //@line 3678 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $13=$offset; //@line 3678 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr14=(($12+$13)|0); //@line 3678 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=$add_ptr14; //@line 3678 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p=$14; //@line 3678 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $15=$offset; //@line 3679 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=$p; //@line 3679 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($16)|0); //@line 3679 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot)>>2)]=$15; //@line 3679 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $17=$psize; //@line 3680 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $18=$p; //@line 3680 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($18+4)|0); //@line 3680 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head)>>2)]=$17; //@line 3680 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $19=$p; //@line 3682 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=$19; //@line 3682 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=$psize; //@line 3682 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr15=(($20+$21)|0); //@line 3682 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $22=$add_ptr15; //@line 3682 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head16=(($22+4)|0); //@line 3682 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head16)>>2)]=7; //@line 3682 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $23=$p; //@line 3683 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $24=$23; //@line 3683 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $25=$psize; //@line 3683 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add17=((($25)+(4))|0); //@line 3683 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr18=(($24+$add17)|0); //@line 3683 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $26=$add_ptr18; //@line 3683 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head19=(($26+4)|0); //@line 3683 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head19)>>2)]=0; //@line 3683 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $27=$m_addr; //@line 3685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($27+16)|0); //@line 3685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=HEAP32[(($least_addr)>>2)]; //@line 3685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp20=(($28)|0)==0; //@line 3685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp20) { __label__ = 9; break; } else { __label__ = 8; break; } //@line 3685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $29=$mm; //@line 3685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $30=$m_addr; //@line 3685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr21=(($30+16)|0); //@line 3685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $31=HEAPU32[(($least_addr21)>>2)]; //@line 3685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp22=(($29)>>>0) < (($31)>>>0); //@line 3685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp22) { __label__ = 9; break; } else { __label__ = 10; break; } //@line 3685 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $32=$mm; //@line 3686 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $33=$m_addr; //@line 3686 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr24=(($33+16)|0); //@line 3686 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($least_addr24)>>2)]=$32; //@line 3686 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 10; break; //@line 3686 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $34=$mmsize; //@line 3687 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $35=$m_addr; //@line 3687 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $footprint=(($35+432)|0); //@line 3687 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $36=HEAP32[(($footprint)>>2)]; //@line 3687 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add25=((($36)+($34))|0); //@line 3687 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($footprint)>>2)]=$add25; //@line 3687 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $37=$m_addr; //@line 3687 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $max_footprint=(($37+436)|0); //@line 3687 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $38=HEAPU32[(($max_footprint)>>2)]; //@line 3687 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp26=(($add25)>>>0) > (($38)>>>0); //@line 3687 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp26) { __label__ = 11; break; } else { __label__ = 12; break; } //@line 3687 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $39=$m_addr; //@line 3688 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $footprint28=(($39+432)|0); //@line 3688 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $40=HEAP32[(($footprint28)>>2)]; //@line 3688 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $41=$m_addr; //@line 3688 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $max_footprint29=(($41+436)|0); //@line 3688 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($max_footprint29)>>2)]=$40; //@line 3688 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 12; break; //@line 3688 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $42=$p; //@line 3691 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $43=$42; //@line 3691 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr31=(($43+8)|0); //@line 3691 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=$add_ptr31; //@line 3691 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 15; break; //@line 3691 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      __label__ = 14; break; //@line 3693 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      $retval=0; //@line 3694 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 15; break; //@line 3694 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $44=$retval; //@line 3695 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $44; //@line 3695 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_mmap_alloc["X"]=1;

function _init_bins($m) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $i;
      var $bin;
      $m_addr=$m;
      $i=0; //@line 3752 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 3; break; //@line 3752 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $0=$i; //@line 3752 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)>>>0) < 32; //@line 3752 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 4; break; } else { __label__ = 6; break; } //@line 3752 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $1=$i; //@line 3753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl=$1 << 1; //@line 3753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$m_addr; //@line 3753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallbins=(($2+40)|0); //@line 3753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=(($smallbins+($shl<<2))|0); //@line 3753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=$arrayidx; //@line 3753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=$3; //@line 3753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $bin=$4; //@line 3753 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=$bin; //@line 3754 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=$bin; //@line 3754 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk=(($6+12)|0); //@line 3754 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk)>>2)]=$5; //@line 3754 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$bin; //@line 3754 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd=(($7+8)|0); //@line 3754 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd)>>2)]=$5; //@line 3754 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 5; break; //@line 3755 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $8=$i; //@line 3752 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $inc=((($8)+(1))|0); //@line 3752 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $i=$inc; //@line 3752 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 3; break; //@line 3752 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      ;
      return; //@line 3756 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _change_mparam($param_number, $value) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $param_number_addr;
      var $value_addr;
      var $val;
      $param_number_addr=$param_number;
      $value_addr=$value;
      var $0=HEAP32[((((_mparams)|0))>>2)]; //@line 3045 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)!=0; //@line 3045 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { var $1 = 1;__label__ = 4; break; } else { __label__ = 3; break; } //@line 3045 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $call=_init_mparams(); //@line 3045 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($call)|0)!=0; //@line 3045 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1 = $tobool;__label__ = 4; break; //@line 3045 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $1;
      var $lor_ext=(($1)&1); //@line 3045 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$value_addr; //@line 3046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($2)|0)==-1; //@line 3046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 3046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $cond = -1;__label__ = 7; break; //@line 3046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $3=$value_addr; //@line 3046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $3;__label__ = 7; break; //@line 3046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $cond; //@line 3046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $val=$cond; //@line 3046 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=$param_number_addr; //@line 3047 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ((($4)|0) == -1) {
        __label__ = 8; break;
      }
      else if ((($4)|0) == -2) {
        __label__ = 9; break;
      }
      else if ((($4)|0) == -3) {
        __label__ = 13; break;
      }
      else {
      __label__ = 14; break;
      }
      
    case 8: 
      var $5=$val; //@line 3049 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((_mparams+16)|0))>>2)]=$5; //@line 3049 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=1; //@line 3050 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 15; break; //@line 3050 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $6=$val; //@line 3052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=HEAPU32[((((_mparams+4)|0))>>2)]; //@line 3052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp3=(($6)>>>0) >= (($7)>>>0); //@line 3052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp3) { __label__ = 10; break; } else { __label__ = 12; break; } //@line 3052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $8=$val; //@line 3052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $9=$val; //@line 3052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=((($9)-(1))|0); //@line 3052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$8 & $sub; //@line 3052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp4=(($and)|0)==0; //@line 3052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp4) { __label__ = 11; break; } else { __label__ = 12; break; } //@line 3052 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $10=$val; //@line 3053 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((_mparams+8)|0))>>2)]=$10; //@line 3053 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=1; //@line 3054 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 15; break; //@line 3054 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      $retval=0; //@line 3057 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 15; break; //@line 3057 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $11=$val; //@line 3059 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((_mparams+12)|0))>>2)]=$11; //@line 3059 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $retval=1; //@line 3060 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 15; break; //@line 3060 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      $retval=0; //@line 3062 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 15; break; //@line 3062 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $12=$retval; //@line 3064 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $12; //@line 3064 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_change_mparam["X"]=1;

function _prepend_alloc($m, $newbase, $oldbase, $nb) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $newbase_addr;
      var $oldbase_addr;
      var $nb_addr;
      var $p;
      var $oldfirst;
      var $psize;
      var $q;
      var $qsize;
      var $tsize;
      var $dsize;
      var $nsize;
      var $F;
      var $B;
      var $I;
      var $TP;
      var $XP;
      var $R;
      var $F63;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $I203;
      var $B205;
      var $F209;
      var $TP235;
      var $H236;
      var $I237;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K290;
      var $C;
      var $F328;
      $m_addr=$m;
      $newbase_addr=$newbase;
      $oldbase_addr=$oldbase;
      $nb_addr=$nb;
      var $0=$newbase_addr; //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1=$newbase_addr; //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($1+8)|0); //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$add_ptr; //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$2 & 7; //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($and)|0)==0; //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $cond = 0;__label__ = 5; break; //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $3=$newbase_addr; //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr1=(($3+8)|0); //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=$add_ptr1; //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and2=$4 & 7; //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=(((8)-($and2))|0); //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and3=$sub & 7; //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $and3;__label__ = 5; break; //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $cond; //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr4=(($0+$cond)|0); //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=$add_ptr4; //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p=$5; //@line 3780 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=$oldbase_addr; //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$oldbase_addr; //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr5=(($7+8)|0); //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=$add_ptr5; //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and6=$8 & 7; //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp7=(($and6)|0)==0; //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp7) { __label__ = 6; break; } else { __label__ = 7; break; } //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $cond15 = 0;__label__ = 8; break; //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $9=$oldbase_addr; //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr10=(($9+8)|0); //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=$add_ptr10; //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and11=$10 & 7; //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub12=(((8)-($and11))|0); //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and13=$sub12 & 7; //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond15 = $and13;__label__ = 8; break; //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $cond15; //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr16=(($6+$cond15)|0); //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=$add_ptr16; //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $oldfirst=$11; //@line 3781 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=$oldfirst; //@line 3782 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $13=$12; //@line 3782 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=$p; //@line 3782 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $15=$14; //@line 3782 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_lhs_cast=$13; //@line 3782 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_rhs_cast=$15; //@line 3782 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_sub=((($sub_ptr_lhs_cast)-($sub_ptr_rhs_cast))|0); //@line 3782 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $psize=$sub_ptr_sub; //@line 3782 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=$p; //@line 3783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $17=$16; //@line 3783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $18=$nb_addr; //@line 3783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr17=(($17+$18)|0); //@line 3783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $19=$add_ptr17; //@line 3783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $q=$19; //@line 3783 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $20=$psize; //@line 3784 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=$nb_addr; //@line 3784 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub18=((($20)-($21))|0); //@line 3784 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $qsize=$sub18; //@line 3784 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $22=$nb_addr; //@line 3785 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or=$22 | 1; //@line 3785 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or19=$or | 2; //@line 3785 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $23=$p; //@line 3785 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($23+4)|0); //@line 3785 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head)>>2)]=$or19; //@line 3785 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $24=$oldfirst; //@line 3792 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $25=$m_addr; //@line 3792 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top=(($25+24)|0); //@line 3792 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $26=HEAP32[(($top)>>2)]; //@line 3792 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp20=(($24)|0)==(($26)|0); //@line 3792 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp20) { __label__ = 9; break; } else { __label__ = 10; break; } //@line 3792 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $27=$qsize; //@line 3793 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=$m_addr; //@line 3793 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $topsize=(($28+12)|0); //@line 3793 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $29=HEAP32[(($topsize)>>2)]; //@line 3793 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($29)+($27))|0); //@line 3793 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($topsize)>>2)]=$add; //@line 3793 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tsize=$add; //@line 3793 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $30=$q; //@line 3794 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $31=$m_addr; //@line 3794 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top21=(($31+24)|0); //@line 3794 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($top21)>>2)]=$30; //@line 3794 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $32=$tsize; //@line 3795 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or22=$32 | 1; //@line 3795 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $33=$q; //@line 3795 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head23=(($33+4)|0); //@line 3795 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head23)>>2)]=$or22; //@line 3795 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 110; break; //@line 3797 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $34=$oldfirst; //@line 3798 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $35=$m_addr; //@line 3798 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $dv=(($35+20)|0); //@line 3798 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $36=HEAP32[(($dv)>>2)]; //@line 3798 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp24=(($34)|0)==(($36)|0); //@line 3798 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp24) { __label__ = 11; break; } else { __label__ = 12; break; } //@line 3798 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $37=$qsize; //@line 3799 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $38=$m_addr; //@line 3799 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $dvsize=(($38+8)|0); //@line 3799 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $39=HEAP32[(($dvsize)>>2)]; //@line 3799 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add26=((($39)+($37))|0); //@line 3799 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($dvsize)>>2)]=$add26; //@line 3799 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $dsize=$add26; //@line 3799 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $40=$q; //@line 3800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $41=$m_addr; //@line 3800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $dv27=(($41+20)|0); //@line 3800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($dv27)>>2)]=$40; //@line 3800 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $42=$dsize; //@line 3801 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or28=$42 | 1; //@line 3801 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $43=$q; //@line 3801 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head29=(($43+4)|0); //@line 3801 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head29)>>2)]=$or28; //@line 3801 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $44=$dsize; //@line 3801 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $45=$q; //@line 3801 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $46=$45; //@line 3801 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $47=$dsize; //@line 3801 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr30=(($46+$47)|0); //@line 3801 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $48=$add_ptr30; //@line 3801 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($48)|0); //@line 3801 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot)>>2)]=$44; //@line 3801 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 109; break; //@line 3802 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $49=$oldfirst; //@line 3804 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head32=(($49+4)|0); //@line 3804 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $50=HEAP32[(($head32)>>2)]; //@line 3804 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and33=$50 & 3; //@line 3804 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp34=(($and33)|0)!=1; //@line 3804 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp34) { __label__ = 73; break; } else { __label__ = 13; break; } //@line 3804 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $51=$oldfirst; //@line 3805 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head36=(($51+4)|0); //@line 3805 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $52=HEAP32[(($head36)>>2)]; //@line 3805 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and37=$52 & -8; //@line 3805 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $nsize=$and37; //@line 3805 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $53=$nsize; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr=$53 >>> 3; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp38=(($shr)>>>0) < 32; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp38) { __label__ = 14; break; } else { __label__ = 26; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $54=$oldfirst; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd=(($54+8)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $55=HEAP32[(($fd)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F=$55; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $56=$oldfirst; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk=(($56+12)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $57=HEAP32[(($bk)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $B=$57; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $58=$nsize; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr40=$58 >>> 3; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $I=$shr40; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $59=$F; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $60=$B; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp41=(($59)|0)==(($60)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp41) { __label__ = 15; break; } else { __label__ = 16; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $61=$I; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl=1 << $61; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg=$shl ^ -1; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $62=$m_addr; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallmap=(($62)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $63=HEAP32[(($smallmap)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and43=$63 & $neg; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($smallmap)>>2)]=$and43; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 25; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 16: 
      var $64=$F; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $65=$I; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl45=$65 << 1; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $66=$m_addr; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallbins=(($66+40)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=(($smallbins+($shl45<<2))|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $67=$arrayidx; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $68=$67; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp46=(($64)|0)==(($68)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp46) { __label__ = 18; break; } else { __label__ = 17; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $69=$F; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $70=$69; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $71=$m_addr; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($71+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $72=HEAPU32[(($least_addr)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp47=(($70)>>>0) >= (($72)>>>0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp47) { __label__ = 18; break; } else { var $83 = 0;__label__ = 21; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $73=$B; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $74=$I; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl48=$74 << 1; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $75=$m_addr; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallbins49=(($75+40)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx50=(($smallbins49+($shl48<<2))|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $76=$arrayidx50; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $77=$76; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp51=(($73)|0)==(($77)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp51) { var $82 = 1;__label__ = 20; break; } else { __label__ = 19; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $78=$B; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $79=$78; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $80=$m_addr; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr52=(($80+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $81=HEAPU32[(($least_addr52)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp53=(($79)>>>0) >= (($81)>>>0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $82 = $cmp53;__label__ = 20; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 20: 
      var $82;
      var $83 = $82;__label__ = 21; break;
    case 21: 
      var $83;
      var $land_ext=(($83)&1);
      var $expval=(($land_ext)==(1));
      var $tobool=(($expval)|0)!=0;
      if ($tobool) { __label__ = 22; break; } else { __label__ = 23; break; }
    case 22: 
      var $84=$B; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $85=$F; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk55=(($85+12)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk55)>>2)]=$84; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $86=$F; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $87=$B; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd56=(($87+8)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd56)>>2)]=$86; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 24; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 23: 
      _abort(); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 24: 
      __label__ = 25; break;
    case 25: 
      __label__ = 72; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $88=$oldfirst; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $89=$88; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $TP=$89; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $90=$TP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent=(($90+24)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $91=HEAP32[(($parent)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $XP=$91; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $92=$TP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk60=(($92+12)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $93=HEAP32[(($bk60)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $94=$TP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp61=(($93)|0)!=(($94)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp61) { __label__ = 27; break; } else { __label__ = 31; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 27: 
      var $95=$TP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd64=(($95+8)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $96=HEAP32[(($fd64)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F63=$96; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $97=$TP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk65=(($97+12)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $98=HEAP32[(($bk65)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$98; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $99=$F63; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $100=$99; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $101=$m_addr; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr66=(($101+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $102=HEAPU32[(($least_addr66)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp67=(($100)>>>0) >= (($102)>>>0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv=(($cmp67)&1); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval68=(($conv)==(1)); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool69=(($expval68)|0)!=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool69) { __label__ = 28; break; } else { __label__ = 29; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 28: 
      var $103=$R; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $104=$F63; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk71=(($104+12)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk71)>>2)]=$103; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $105=$F63; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $106=$R; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd72=(($106+8)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd72)>>2)]=$105; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 30; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 29: 
      _abort(); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 30: 
      __label__ = 43; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $107=$TP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child=(($107+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx76=(($child+4)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx76; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $108=HEAP32[(($arrayidx76)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$108; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp77=(($108)|0)!=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp77) { __label__ = 33; break; } else { __label__ = 32; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $109=$TP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child80=(($109+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx81=(($child80)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx81; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $110=HEAP32[(($arrayidx81)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$110; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp82=(($110)|0)!=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp82) { __label__ = 33; break; } else { __label__ = 42; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 33: 
      __label__ = 34; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $111=$R; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child85=(($111+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx86=(($child85+4)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx86; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $112=HEAP32[(($arrayidx86)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp87=(($112)|0)!=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp87) { var $115 = 1;__label__ = 36; break; } else { __label__ = 35; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 35: 
      var $113=$R; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child90=(($113+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx91=(($child90)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx91; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $114=HEAP32[(($arrayidx91)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp92=(($114)|0)!=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $115 = $cmp92;__label__ = 36; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 36: 
      var $115;
      if ($115) { __label__ = 37; break; } else { __label__ = 38; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 37: 
      var $116=$CP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $RP=$116; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $117=HEAP32[(($116)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $R=$117; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 34; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 38: 
      var $118=$RP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $119=$118; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $120=$m_addr; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr95=(($120+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $121=HEAPU32[(($least_addr95)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp96=(($119)>>>0) >= (($121)>>>0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv97=(($cmp96)&1); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval98=(($conv97)==(1)); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool99=(($expval98)|0)!=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool99) { __label__ = 39; break; } else { __label__ = 40; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 39: 
      var $122=$RP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($122)>>2)]=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 41; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 40: 
      _abort(); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 41: 
      __label__ = 42; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 42: 
      __label__ = 43; break;
    case 43: 
      var $123=$XP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp105=(($123)|0)!=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp105) { __label__ = 44; break; } else { __label__ = 71; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 44: 
      var $124=$TP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index=(($124+28)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $125=HEAP32[(($index)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $126=$m_addr; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treebins=(($126+304)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx108=(($treebins+($125<<2))|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $H=$arrayidx108; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $127=$TP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $128=$H; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $129=HEAP32[(($128)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp109=(($127)|0)==(($129)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp109) { __label__ = 45; break; } else { __label__ = 48; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 45: 
      var $130=$R; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $131=$H; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($131)>>2)]=$130; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp112=(($130)|0)==0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp112) { __label__ = 46; break; } else { __label__ = 47; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 46: 
      var $132=$TP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index115=(($132+28)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $133=HEAP32[(($index115)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl116=1 << $133; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $neg117=$shl116 ^ -1; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $134=$m_addr; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap=(($134+4)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $135=HEAP32[(($treemap)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and118=$135 & $neg117; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap)>>2)]=$and118; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 47; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 47: 
      __label__ = 55; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 48: 
      var $136=$XP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $137=$136; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $138=$m_addr; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr121=(($138+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $139=HEAPU32[(($least_addr121)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp122=(($137)>>>0) >= (($139)>>>0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv123=(($cmp122)&1); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval124=(($conv123)==(1)); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool125=(($expval124)|0)!=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool125) { __label__ = 49; break; } else { __label__ = 53; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 49: 
      var $140=$XP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child127=(($140+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx128=(($child127)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $141=HEAP32[(($arrayidx128)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $142=$TP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp129=(($141)|0)==(($142)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp129) { __label__ = 50; break; } else { __label__ = 51; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 50: 
      var $143=$R; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $144=$XP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child132=(($144+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx133=(($child132)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx133)>>2)]=$143; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 52; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 51: 
      var $145=$R; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $146=$XP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child135=(($146+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx136=(($child135+4)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx136)>>2)]=$145; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 52; break;
    case 52: 
      __label__ = 54; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 53: 
      _abort(); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 54: 
      __label__ = 55; break;
    case 55: 
      var $147=$R; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp141=(($147)|0)!=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp141) { __label__ = 56; break; } else { __label__ = 70; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 56: 
      var $148=$R; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $149=$148; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $150=$m_addr; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr144=(($150+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $151=HEAPU32[(($least_addr144)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp145=(($149)>>>0) >= (($151)>>>0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv146=(($cmp145)&1); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval147=(($conv146)==(1)); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool148=(($expval147)|0)!=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool148) { __label__ = 57; break; } else { __label__ = 68; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 57: 
      var $152=$XP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $153=$R; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent150=(($153+24)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent150)>>2)]=$152; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $154=$TP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child151=(($154+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx152=(($child151)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $155=HEAP32[(($arrayidx152)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C0=$155; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp153=(($155)|0)!=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp153) { __label__ = 58; break; } else { __label__ = 62; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 58: 
      var $156=$C0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $157=$156; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $158=$m_addr; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr156=(($158+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $159=HEAPU32[(($least_addr156)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp157=(($157)>>>0) >= (($159)>>>0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv158=(($cmp157)&1); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval159=(($conv158)==(1)); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool160=(($expval159)|0)!=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool160) { __label__ = 59; break; } else { __label__ = 60; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 59: 
      var $160=$C0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $161=$R; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child162=(($161+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx163=(($child162)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx163)>>2)]=$160; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $162=$R; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $163=$C0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent164=(($163+24)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent164)>>2)]=$162; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 61; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 60: 
      _abort(); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 61: 
      __label__ = 62; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 62: 
      var $164=$TP; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child168=(($164+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx169=(($child168+4)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $165=HEAP32[(($arrayidx169)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C1=$165; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp170=(($165)|0)!=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp170) { __label__ = 63; break; } else { __label__ = 67; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 63: 
      var $166=$C1; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $167=$166; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $168=$m_addr; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr173=(($168+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $169=HEAPU32[(($least_addr173)>>2)]; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp174=(($167)>>>0) >= (($169)>>>0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv175=(($cmp174)&1); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval176=(($conv175)==(1)); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool177=(($expval176)|0)!=0; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool177) { __label__ = 64; break; } else { __label__ = 65; break; } //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 64: 
      var $170=$C1; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $171=$R; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child179=(($171+16)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx180=(($child179+4)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx180)>>2)]=$170; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $172=$R; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $173=$C1; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent181=(($173+24)|0); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent181)>>2)]=$172; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 66; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 65: 
      _abort(); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 66: 
      __label__ = 67; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 67: 
      __label__ = 69; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 68: 
      _abort(); //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 69: 
      __label__ = 70; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 70: 
      __label__ = 71; break; //@line 3806 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 71: 
      __label__ = 72; break;
    case 72: 
      var $174=$oldfirst; //@line 3807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $175=$174; //@line 3807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $176=$nsize; //@line 3807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr190=(($175+$176)|0); //@line 3807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $177=$add_ptr190; //@line 3807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $oldfirst=$177; //@line 3807 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $178=$nsize; //@line 3808 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $179=$qsize; //@line 3808 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add191=((($179)+($178))|0); //@line 3808 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $qsize=$add191; //@line 3808 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 73; break; //@line 3809 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 73: 
      var $180=$oldfirst; //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head193=(($180+4)|0); //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $181=HEAP32[(($head193)>>2)]; //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and194=$181 & -2; //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head193)>>2)]=$and194; //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $182=$qsize; //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or195=$182 | 1; //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $183=$q; //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head196=(($183+4)|0); //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head196)>>2)]=$or195; //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $184=$qsize; //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $185=$q; //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $186=$185; //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $187=$qsize; //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr197=(($186+$187)|0); //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $188=$add_ptr197; //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot198=(($188)|0); //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot198)>>2)]=$184; //@line 3810 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $189=$qsize; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr199=$189 >>> 3; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp200=(($shr199)>>>0) < 32; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp200) { __label__ = 74; break; } else { __label__ = 81; break; } //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 74: 
      var $190=$qsize; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr204=$190 >>> 3; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $I203=$shr204; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $191=$I203; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl206=$191 << 1; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $192=$m_addr; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallbins207=(($192+40)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx208=(($smallbins207+($shl206<<2))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $193=$arrayidx208; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $194=$193; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $B205=$194; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $195=$B205; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F209=$195; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $196=$m_addr; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallmap210=(($196)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $197=HEAP32[(($smallmap210)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $198=$I203; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl211=1 << $198; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and212=$197 & $shl211; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool213=(($and212)|0)!=0; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool213) { __label__ = 76; break; } else { __label__ = 75; break; } //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 75: 
      var $199=$I203; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl215=1 << $199; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $200=$m_addr; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallmap216=(($200)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $201=HEAP32[(($smallmap216)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or217=$201 | $shl215; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($smallmap216)>>2)]=$or217; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 80; break; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 76: 
      var $202=$B205; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd219=(($202+8)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $203=HEAP32[(($fd219)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $204=$203; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $205=$m_addr; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr220=(($205+16)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $206=HEAPU32[(($least_addr220)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp221=(($204)>>>0) >= (($206)>>>0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv222=(($cmp221)&1); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval223=(($conv222)==(1)); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool224=(($expval223)|0)!=0; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool224) { __label__ = 77; break; } else { __label__ = 78; break; } //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 77: 
      var $207=$B205; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd226=(($207+8)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $208=HEAP32[(($fd226)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F209=$208; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 79; break; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 78: 
      _abort(); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 79: 
      __label__ = 80; break;
    case 80: 
      var $209=$q; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $210=$B205; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd230=(($210+8)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd230)>>2)]=$209; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $211=$q; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $212=$F209; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk231=(($212+12)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk231)>>2)]=$211; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $213=$F209; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $214=$q; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd232=(($214+8)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd232)>>2)]=$213; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $215=$B205; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $216=$q; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk233=(($216+12)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk233)>>2)]=$215; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 108; break; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 81: 
      var $217=$q; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $218=$217; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $TP235=$218; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $219=$qsize; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr238=$219 >>> 8; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $X=$shr238; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $220=$X; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp239=(($220)|0)==0; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp239) { __label__ = 82; break; } else { __label__ = 83; break; } //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 82: 
      $I237=0; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 87; break; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 83: 
      var $221=$X; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp243=(($221)>>>0) > 65535; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp243) { __label__ = 84; break; } else { __label__ = 85; break; } //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 84: 
      $I237=31; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 86; break; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 85: 
      var $222=$X; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$222; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $223=$Y; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub247=((($223)-(256))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr248=$sub247 >>> 16; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and249=$shr248 & 8; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$and249; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $224=$N; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $225=$Y; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl250=$225 << $224; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl250; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub251=((($shl250)-(4096))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr252=$sub251 >>> 16; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and253=$shr252 & 4; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and253; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $226=$K; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $227=$N; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add254=((($227)+($226))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add254; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $228=$K; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $229=$Y; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl255=$229 << $228; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl255; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub256=((($shl255)-(16384))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr257=$sub256 >>> 16; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and258=$shr257 & 2; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and258; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $230=$N; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add259=((($230)+($and258))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add259; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $231=$N; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub260=(((14)-($231))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $232=$K; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $233=$Y; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl261=$233 << $232; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl261; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr262=$shl261 >>> 15; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add263=((($sub260)+($shr262))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$add263; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $234=$K; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl264=$234 << 1; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $235=$qsize; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $236=$K; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add265=((($236)+(7))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr266=$235 >>> (($add265)>>>0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and267=$shr266 & 1; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add268=((($shl264)+($and267))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $I237=$add268; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 86; break;
    case 86: 
      __label__ = 87; break;
    case 87: 
      var $237=$I237; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $238=$m_addr; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treebins271=(($238+304)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx272=(($treebins271+($237<<2))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $H236=$arrayidx272; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $239=$I237; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $240=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index273=(($240+28)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($index273)>>2)]=$239; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $241=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child274=(($241+16)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx275=(($child274+4)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx275)>>2)]=0; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $242=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child276=(($242+16)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx277=(($child276)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx277)>>2)]=0; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $243=$m_addr; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap278=(($243+4)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $244=HEAP32[(($treemap278)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $245=$I237; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl279=1 << $245; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and280=$244 & $shl279; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool281=(($and280)|0)!=0; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool281) { __label__ = 89; break; } else { __label__ = 88; break; } //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 88: 
      var $246=$I237; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl283=1 << $246; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $247=$m_addr; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap284=(($247+4)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $248=HEAP32[(($treemap284)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or285=$248 | $shl283; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap284)>>2)]=$or285; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $249=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $250=$H236; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($250)>>2)]=$249; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $251=$H236; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $252=$251; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $253=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent286=(($253+24)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent286)>>2)]=$252; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $254=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $255=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk287=(($255+12)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk287)>>2)]=$254; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $256=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd288=(($256+8)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd288)>>2)]=$254; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 107; break; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 89: 
      var $257=$H236; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $258=HEAP32[(($257)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $T=$258; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $259=$qsize; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $260=$I237; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp291=(($260)|0)==31; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp291) { __label__ = 90; break; } else { __label__ = 91; break; } //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 90: 
      var $cond300 = 0;__label__ = 92; break; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 91: 
      var $261=$I237; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr295=$261 >>> 1; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add296=((($shr295)+(8))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub297=((($add296)-(2))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub298=(((31)-($sub297))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond300 = $sub298;__label__ = 92; break; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 92: 
      var $cond300; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl301=$259 << $cond300; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K290=$shl301; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 93; break; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 93: 
      var $262=$T; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head302=(($262+4)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $263=HEAP32[(($head302)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and303=$263 & -8; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $264=$qsize; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp304=(($and303)|0)!=(($264)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp304) { __label__ = 94; break; } else { __label__ = 100; break; } //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 94: 
      var $265=$K290; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr307=$265 >>> 31; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and308=$shr307 & 1; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $266=$T; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child309=(($266+16)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx310=(($child309+($and308<<2))|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C=$arrayidx310; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $267=$K290; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl311=$267 << 1; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K290=$shl311; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $268=$C; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $269=HEAP32[(($268)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp312=(($269)|0)!=0; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp312) { __label__ = 95; break; } else { __label__ = 96; break; } //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 95: 
      var $270=$C; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $271=HEAP32[(($270)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $T=$271; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 99; break; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 96: 
      var $272=$C; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $273=$272; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $274=$m_addr; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr316=(($274+16)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $275=HEAPU32[(($least_addr316)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp317=(($273)>>>0) >= (($275)>>>0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv318=(($cmp317)&1); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval319=(($conv318)==(1)); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool320=(($expval319)|0)!=0; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool320) { __label__ = 97; break; } else { __label__ = 98; break; } //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 97: 
      var $276=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $277=$C; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($277)>>2)]=$276; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $278=$T; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $279=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent322=(($279+24)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent322)>>2)]=$278; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $280=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $281=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk323=(($281+12)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk323)>>2)]=$280; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $282=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd324=(($282+8)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd324)>>2)]=$280; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 106; break; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 98: 
      _abort(); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 99: 
      __label__ = 105; break; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 100: 
      var $283=$T; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd329=(($283+8)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $284=HEAP32[(($fd329)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F328=$284; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $285=$T; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $286=$285; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $287=$m_addr; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr330=(($287+16)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $288=HEAPU32[(($least_addr330)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp331=(($286)>>>0) >= (($288)>>>0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp331) { __label__ = 101; break; } else { var $293 = 0;__label__ = 102; break; } //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 101: 
      var $289=$F328; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $290=$289; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $291=$m_addr; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr334=(($291+16)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $292=HEAPU32[(($least_addr334)>>2)]; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp335=(($290)>>>0) >= (($292)>>>0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $293 = $cmp335;__label__ = 102; break;
    case 102: 
      var $293;
      var $land_ext338=(($293)&1);
      var $expval339=(($land_ext338)==(1));
      var $tobool340=(($expval339)|0)!=0;
      if ($tobool340) { __label__ = 103; break; } else { __label__ = 104; break; }
    case 103: 
      var $294=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $295=$F328; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk342=(($295+12)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk342)>>2)]=$294; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $296=$T; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd343=(($296+8)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd343)>>2)]=$294; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $297=$F328; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $298=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd344=(($298+8)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd344)>>2)]=$297; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $299=$T; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $300=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk345=(($300+12)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk345)>>2)]=$299; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $301=$TP235; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent346=(($301+24)|0); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent346)>>2)]=0; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 106; break; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 104: 
      _abort(); //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 105: 
      __label__ = 93; break; //@line 3811 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 106: 
      __label__ = 107; break;
    case 107: 
      __label__ = 108; break;
    case 108: 
      __label__ = 109; break;
    case 109: 
      __label__ = 110; break;
    case 110: 
      var $302=$p; //@line 3816 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $303=$302; //@line 3816 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr353=(($303+8)|0); //@line 3816 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      ;
      return $add_ptr353; //@line 3816 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_prepend_alloc["X"]=1;

function __ZNKSt9bad_alloc4whatEv($this) {
  ;
  var __label__;

  var $this_addr;
  $this_addr=$this;
  var $this1=$this_addr;
  ;
  return ((STRING_TABLE.__str3)|0); //@line 160 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
}


function __ZSt15get_new_handlerv() {
  ;
  var __label__;

  var $0=(tempValue=HEAP32[((__ZL13__new_handler)>>2)],HEAP32[((__ZL13__new_handler)>>2)]=tempValue+0,tempValue); //@line 146 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
  var $1=$0; //@line 146 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
  ;
  return $1; //@line 146 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
}


function __ZSt15set_new_handlerPFvvE($handler) {
  ;
  var __label__;

  var $handler_addr;
  $handler_addr=$handler;
  var $0=$handler_addr; //@line 140 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
  var $1=$0; //@line 140 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
  var $2=(tempValue=HEAP32[((__ZL13__new_handler)>>2)],HEAP32[((__ZL13__new_handler)>>2)]=$1,tempValue); //@line 140 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
  var $3=$2; //@line 140 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
  ;
  return $3; //@line 140 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
}


function __ZNSt9bad_allocC2Ev($this) {
  ;
  var __label__;

  var $this_addr_i;
  var $this_addr;
  $this_addr=$this;
  var $this1=$this_addr;
  var $0=$this1; //@line 150 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
  $this_addr_i=$0;
  var $this1_i=$this_addr_i;
  var $1=$this1_i; //@line 90 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/exception"
  HEAP32[(($1)>>2)]=((__ZTVSt9exception+8)|0); //@line 90 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/exception"
  var $2=$this1; //@line 150 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
  HEAP32[(($2)>>2)]=((__ZTVSt9bad_alloc+8)|0); //@line 150 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
  ;
  return; //@line 151 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
}


function __ZdlPv($ptr) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $ptr_addr;
      $ptr_addr=$ptr;
      var $0=$ptr_addr; //@line 107 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $tobool=(($0)|0)!=0; //@line 107 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      if ($tobool) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 107 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 3: 
      var $1=$ptr_addr; //@line 108 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      _free($1); //@line 108 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      __label__ = 4; break; //@line 108 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 4: 
      ;
      return; //@line 109 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    default: assert(0, "bad label: " + __label__);
  }
}


function __ZdlPvRKSt9nothrow_t($ptr, $0) {
  ;
  var __label__;

  var $ptr_addr;
  var $_addr;
  $ptr_addr=$ptr;
  $_addr=$0;
  var $1=$ptr_addr; //@line 115 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
  __ZdlPv($1); //@line 115 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
  ;
  return; //@line 116 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
}


function __ZdaPv($ptr) {
  ;
  var __label__;

  var $ptr_addr;
  $ptr_addr=$ptr;
  var $0=$ptr_addr; //@line 122 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
  __ZdlPv($0); //@line 122 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
  ;
  return; //@line 123 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
}


function __ZdaPvRKSt9nothrow_t($ptr, $0) {
  ;
  var __label__;

  var $ptr_addr;
  var $_addr;
  $ptr_addr=$ptr;
  $_addr=$0;
  var $1=$ptr_addr; //@line 129 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
  __ZdaPv($1); //@line 129 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
  ;
  return; //@line 130 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
}


function __ZNSt9bad_allocD0Ev($this) {
  ;
  var __label__;

  var $this_addr;
  $this_addr=$this;
  var $this1=$this_addr;
  FUNCTION_TABLE[__ZNSt9bad_allocD1Ev]($this1); //@line 154 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
  var $0=$this1; //@line 154 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
  __ZdlPv($0); //@line 154 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
  ;
  return; //@line 155 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
}


function __ZNSt9bad_allocD2Ev($this) {
  ;
  var __label__;

  var $this_addr;
  $this_addr=$this;
  var $this1=$this_addr;
  var $0=$this1; //@line 155 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
  __ZNSt9exceptionD2Ev($0); //@line 155 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
  ;
  return; //@line 155 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
}


function _add_segment($m, $tbase, $tsize, $mmapped) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $tbase_addr;
      var $tsize_addr;
      var $mmapped_addr;
      var $old_top;
      var $oldsp;
      var $old_end;
      var $ssize;
      var $rawsp;
      var $offset;
      var $asp;
      var $csp;
      var $sp;
      var $ss;
      var $tnext;
      var $p;
      var $nfences;
      var $nextp;
      var $q;
      var $psize;
      var $tn;
      var $I;
      var $B;
      var $F;
      var $TP;
      var $H;
      var $I57;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K105;
      var $C;
      var $F144;
      $m_addr=$m;
      $tbase_addr=$tbase;
      $tsize_addr=$tsize;
      $mmapped_addr=$mmapped;
      var $0=$m_addr; //@line 3822 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $top=(($0+24)|0); //@line 3822 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $1=HEAP32[(($top)>>2)]; //@line 3822 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $2=$1; //@line 3822 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $old_top=$2; //@line 3822 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $3=$m_addr; //@line 3823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $4=$old_top; //@line 3823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $call=_segment_holding($3, $4); //@line 3823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $oldsp=$call; //@line 3823 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $5=$oldsp; //@line 3824 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base=(($5)|0); //@line 3824 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $6=HEAP32[(($base)>>2)]; //@line 3824 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $7=$oldsp; //@line 3824 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $size=(($7+4)|0); //@line 3824 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $8=HEAP32[(($size)>>2)]; //@line 3824 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($6+$8)|0); //@line 3824 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $old_end=$add_ptr; //@line 3824 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $ssize=24; //@line 3825 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $9=$old_end; //@line 3826 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $10=$ssize; //@line 3826 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add=((($10)+(16))|0); //@line 3826 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add1=((($add)+(7))|0); //@line 3826 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $idx_neg=(((-$add1))|0); //@line 3826 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr2=(($9+$idx_neg)|0); //@line 3826 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $rawsp=$add_ptr2; //@line 3826 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $11=$rawsp; //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr3=(($11+8)|0); //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $12=$add_ptr3; //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and=$12 & 7; //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($and)|0)==0; //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $cond = 0;__label__ = 5; break; //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $13=$rawsp; //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr4=(($13+8)|0); //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $14=$add_ptr4; //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and5=$14 & 7; //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub=(((8)-($and5))|0); //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and6=$sub & 7; //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond = $and6;__label__ = 5; break; //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $cond; //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $offset=$cond; //@line 3827 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $15=$rawsp; //@line 3828 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $16=$offset; //@line 3828 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr7=(($15+$16)|0); //@line 3828 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $asp=$add_ptr7; //@line 3828 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $17=$asp; //@line 3829 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $18=$old_top; //@line 3829 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr8=(($18+16)|0); //@line 3829 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp9=(($17)>>>0) < (($add_ptr8)>>>0); //@line 3829 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp9) { __label__ = 6; break; } else { __label__ = 7; break; } //@line 3829 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $19=$old_top; //@line 3829 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond13 = $19;__label__ = 8; break; //@line 3829 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $20=$asp; //@line 3829 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond13 = $20;__label__ = 8; break; //@line 3829 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $cond13; //@line 3829 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $csp=$cond13; //@line 3829 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $21=$csp; //@line 3830 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $22=$21; //@line 3830 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $sp=$22; //@line 3830 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $23=$sp; //@line 3831 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $24=$23; //@line 3831 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr14=(($24+8)|0); //@line 3831 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $25=$add_ptr14; //@line 3831 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $ss=$25; //@line 3831 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $26=$sp; //@line 3832 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $27=$26; //@line 3832 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $28=$ssize; //@line 3832 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr15=(($27+$28)|0); //@line 3832 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $29=$add_ptr15; //@line 3832 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tnext=$29; //@line 3832 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $30=$tnext; //@line 3833 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p=$30; //@line 3833 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $nfences=0; //@line 3834 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $31=$m_addr; //@line 3837 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $32=$tbase_addr; //@line 3837 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $33=$32; //@line 3837 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $34=$tsize_addr; //@line 3837 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub16=((($34)-(40))|0); //@line 3837 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      _init_top($31, $33, $sub16); //@line 3837 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $35=$ssize; //@line 3841 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or=$35 | 1; //@line 3841 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or17=$or | 2; //@line 3841 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $36=$sp; //@line 3841 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head=(($36+4)|0); //@line 3841 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head)>>2)]=$or17; //@line 3841 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $37=$ss; //@line 3842 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $38=$m_addr; //@line 3842 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $seg=(($38+444)|0); //@line 3842 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $39=$37; //@line 3842 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $40=$seg; //@line 3842 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      assert(16 % 1 === 0, 'memcpy given ' + 16 + ' bytes to copy. Problem with quantum=1 corrections perhaps?');HEAP32[(($39)>>2)]=HEAP32[(($40)>>2)];HEAP32[((($39)+(4))>>2)]=HEAP32[((($40)+(4))>>2)];HEAP32[((($39)+(8))>>2)]=HEAP32[((($40)+(8))>>2)];HEAP32[((($39)+(12))>>2)]=HEAP32[((($40)+(12))>>2)]; //@line 3842 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $41=$tbase_addr; //@line 3843 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $42=$m_addr; //@line 3843 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $seg18=(($42+444)|0); //@line 3843 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $base19=(($seg18)|0); //@line 3843 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($base19)>>2)]=$41; //@line 3843 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $43=$tsize_addr; //@line 3844 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $44=$m_addr; //@line 3844 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $seg20=(($44+444)|0); //@line 3844 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $size21=(($seg20+4)|0); //@line 3844 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($size21)>>2)]=$43; //@line 3844 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $45=$mmapped_addr; //@line 3845 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $46=$m_addr; //@line 3845 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $seg22=(($46+444)|0); //@line 3845 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sflags=(($seg22+12)|0); //@line 3845 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($sflags)>>2)]=$45; //@line 3845 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $47=$ss; //@line 3846 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $48=$m_addr; //@line 3846 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $seg23=(($48+444)|0); //@line 3846 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $next=(($seg23+8)|0); //@line 3846 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($next)>>2)]=$47; //@line 3846 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 9; break; //@line 3849 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $49=$p; //@line 3850 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $50=$49; //@line 3850 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr24=(($50+4)|0); //@line 3850 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $51=$add_ptr24; //@line 3850 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $nextp=$51; //@line 3850 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $52=$p; //@line 3851 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head25=(($52+4)|0); //@line 3851 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head25)>>2)]=7; //@line 3851 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $53=$nfences; //@line 3852 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $inc=((($53)+(1))|0); //@line 3852 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $nfences=$inc; //@line 3852 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $54=$nextp; //@line 3853 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head26=(($54+4)|0); //@line 3853 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $55=$head26; //@line 3853 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $56=$old_end; //@line 3853 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp27=(($55)>>>0) < (($56)>>>0); //@line 3853 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp27) { __label__ = 10; break; } else { __label__ = 11; break; } //@line 3853 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $57=$nextp; //@line 3854 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $p=$57; //@line 3854 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 12; break; //@line 3854 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 11: 
      __label__ = 13; break; //@line 3856 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 12: 
      __label__ = 9; break; //@line 3857 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $58=$csp; //@line 3861 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $59=$old_top; //@line 3861 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp28=(($58)|0)!=(($59)|0); //@line 3861 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp28) { __label__ = 14; break; } else { __label__ = 50; break; } //@line 3861 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $60=$old_top; //@line 3862 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $61=$60; //@line 3862 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $q=$61; //@line 3862 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $62=$csp; //@line 3863 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $63=$old_top; //@line 3863 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_lhs_cast=$62; //@line 3863 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_rhs_cast=$63; //@line 3863 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_sub=((($sub_ptr_lhs_cast)-($sub_ptr_rhs_cast))|0); //@line 3863 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $psize=$sub_ptr_sub; //@line 3863 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $64=$q; //@line 3864 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $65=$64; //@line 3864 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $66=$psize; //@line 3864 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr30=(($65+$66)|0); //@line 3864 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $67=$add_ptr30; //@line 3864 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $tn=$67; //@line 3864 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $68=$tn; //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head31=(($68+4)|0); //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $69=HEAP32[(($head31)>>2)]; //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and32=$69 & -2; //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head31)>>2)]=$and32; //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $70=$psize; //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or33=$70 | 1; //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $71=$q; //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head34=(($71+4)|0); //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head34)>>2)]=$or33; //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $72=$psize; //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $73=$q; //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $74=$73; //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $75=$psize; //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add_ptr35=(($74+$75)|0); //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $76=$add_ptr35; //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($76)|0); //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot)>>2)]=$72; //@line 3865 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $77=$psize; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr=$77 >>> 3; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp36=(($shr)>>>0) < 32; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp36) { __label__ = 15; break; } else { __label__ = 22; break; } //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $78=$psize; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr38=$78 >>> 3; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $I=$shr38; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $79=$I; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl=$79 << 1; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $80=$m_addr; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallbins=(($80+40)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=(($smallbins+($shl<<2))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $81=$arrayidx; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $82=$81; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $B=$82; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $83=$B; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F=$83; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $84=$m_addr; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallmap=(($84)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $85=HEAP32[(($smallmap)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $86=$I; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl39=1 << $86; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and40=$85 & $shl39; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($and40)|0)!=0; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool) { __label__ = 17; break; } else { __label__ = 16; break; } //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 16: 
      var $87=$I; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl42=1 << $87; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $88=$m_addr; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $smallmap43=(($88)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $89=HEAP32[(($smallmap43)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or44=$89 | $shl42; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($smallmap43)>>2)]=$or44; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 21; break; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $90=$B; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd=(($90+8)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $91=HEAP32[(($fd)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $92=$91; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $93=$m_addr; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($93+16)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $94=HEAPU32[(($least_addr)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp46=(($92)>>>0) >= (($94)>>>0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv=(($cmp46)&1); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval=(($conv)==(1)); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool47=(($expval)|0)!=0; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool47) { __label__ = 18; break; } else { __label__ = 19; break; } //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $95=$B; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd49=(($95+8)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $96=HEAP32[(($fd49)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F=$96; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 20; break; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 19: 
      _abort(); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 20: 
      __label__ = 21; break;
    case 21: 
      var $97=$q; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $98=$B; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd53=(($98+8)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd53)>>2)]=$97; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $99=$q; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $100=$F; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk=(($100+12)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk)>>2)]=$99; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $101=$F; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $102=$q; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd54=(($102+8)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd54)>>2)]=$101; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $103=$B; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $104=$q; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk55=(($104+12)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk55)>>2)]=$103; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 49; break; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 22: 
      var $105=$q; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $106=$105; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $TP=$106; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $107=$psize; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr58=$107 >>> 8; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $X=$shr58; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $108=$X; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp59=(($108)|0)==0; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp59) { __label__ = 23; break; } else { __label__ = 24; break; } //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 23: 
      $I57=0; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 28; break; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $109=$X; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp63=(($109)>>>0) > 65535; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp63) { __label__ = 25; break; } else { __label__ = 26; break; } //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 25: 
      $I57=31; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 27; break; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $110=$X; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$110; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $111=$Y; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub67=((($111)-(256))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr68=$sub67 >>> 16; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and69=$shr68 & 8; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$and69; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $112=$N; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $113=$Y; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl70=$113 << $112; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl70; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub71=((($shl70)-(4096))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr72=$sub71 >>> 16; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and73=$shr72 & 4; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and73; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $114=$K; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $115=$N; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add74=((($115)+($114))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add74; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $116=$K; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $117=$Y; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl75=$117 << $116; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl75; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub76=((($shl75)-(16384))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr77=$sub76 >>> 16; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and78=$shr77 & 2; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$and78; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $118=$N; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add79=((($118)+($and78))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $N=$add79; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $119=$N; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub80=(((14)-($119))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $120=$K; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $121=$Y; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl81=$121 << $120; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $Y=$shl81; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr82=$shl81 >>> 15; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add83=((($sub80)+($shr82))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K=$add83; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $122=$K; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl84=$122 << 1; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $123=$psize; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $124=$K; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add85=((($124)+(7))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr86=$123 >>> (($add85)>>>0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and87=$shr86 & 1; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add88=((($shl84)+($and87))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $I57=$add88; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 27; break;
    case 27: 
      __label__ = 28; break;
    case 28: 
      var $125=$I57; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $126=$m_addr; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treebins=(($126+304)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx91=(($treebins+($125<<2))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $H=$arrayidx91; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $127=$I57; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $128=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $index=(($128+28)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($index)>>2)]=$127; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $129=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child=(($129+16)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx92=(($child+4)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx92)>>2)]=0; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $130=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child93=(($130+16)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx94=(($child93)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx94)>>2)]=0; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $131=$m_addr; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap=(($131+4)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $132=HEAP32[(($treemap)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $133=$I57; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl95=1 << $133; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and96=$132 & $shl95; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool97=(($and96)|0)!=0; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool97) { __label__ = 30; break; } else { __label__ = 29; break; } //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 29: 
      var $134=$I57; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl99=1 << $134; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $135=$m_addr; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $treemap100=(($135+4)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $136=HEAP32[(($treemap100)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $or101=$136 | $shl99; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap100)>>2)]=$or101; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $137=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $138=$H; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($138)>>2)]=$137; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $139=$H; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $140=$139; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $141=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent=(($141+24)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent)>>2)]=$140; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $142=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $143=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk102=(($143+12)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk102)>>2)]=$142; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $144=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd103=(($144+8)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd103)>>2)]=$142; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 48; break; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 30: 
      var $145=$H; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $146=HEAP32[(($145)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $T=$146; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $147=$psize; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $148=$I57; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp106=(($148)|0)==31; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp106) { __label__ = 31; break; } else { __label__ = 32; break; } //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $cond115 = 0;__label__ = 33; break; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $149=$I57; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr110=$149 >>> 1; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $add111=((($shr110)+(8))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub112=((($add111)-(2))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $sub113=(((31)-($sub112))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cond115 = $sub113;__label__ = 33; break; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 33: 
      var $cond115; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl116=$147 << $cond115; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K105=$shl116; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 34; break; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $150=$T; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $head118=(($150+4)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $151=HEAP32[(($head118)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and119=$151 & -8; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $152=$psize; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp120=(($and119)|0)!=(($152)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp120) { __label__ = 35; break; } else { __label__ = 41; break; } //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 35: 
      var $153=$K105; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shr123=$153 >>> 31; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $and124=$shr123 & 1; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $154=$T; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $child125=(($154+16)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $arrayidx126=(($child125+($and124<<2))|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $C=$arrayidx126; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $155=$K105; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $shl127=$155 << 1; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $K105=$shl127; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $156=$C; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $157=HEAP32[(($156)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp128=(($157)|0)!=0; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp128) { __label__ = 36; break; } else { __label__ = 37; break; } //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 36: 
      var $158=$C; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $159=HEAP32[(($158)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $T=$159; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 40; break; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 37: 
      var $160=$C; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $161=$160; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $162=$m_addr; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr132=(($162+16)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $163=HEAPU32[(($least_addr132)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp133=(($161)>>>0) >= (($163)>>>0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $conv134=(($cmp133)&1); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $expval135=(($conv134)==(1)); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $tobool136=(($expval135)|0)!=0; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($tobool136) { __label__ = 38; break; } else { __label__ = 39; break; } //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 38: 
      var $164=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $165=$C; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($165)>>2)]=$164; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $166=$T; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $167=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent138=(($167+24)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent138)>>2)]=$166; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $168=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $169=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk139=(($169+12)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk139)>>2)]=$168; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $170=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd140=(($170+8)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd140)>>2)]=$168; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 47; break; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 39: 
      _abort(); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 40: 
      __label__ = 46; break; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 41: 
      var $171=$T; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd145=(($171+8)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $172=HEAP32[(($fd145)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      $F144=$172; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $173=$T; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $174=$173; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $175=$m_addr; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr146=(($175+16)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $176=HEAPU32[(($least_addr146)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp147=(($174)>>>0) >= (($176)>>>0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      if ($cmp147) { __label__ = 42; break; } else { var $181 = 0;__label__ = 43; break; } //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 42: 
      var $177=$F144; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $178=$177; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $179=$m_addr; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $least_addr149=(($179+16)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $180=HEAPU32[(($least_addr149)>>2)]; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $cmp150=(($178)>>>0) >= (($180)>>>0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $181 = $cmp150;__label__ = 43; break;
    case 43: 
      var $181;
      var $land_ext=(($181)&1);
      var $expval152=(($land_ext)==(1));
      var $tobool153=(($expval152)|0)!=0;
      if ($tobool153) { __label__ = 44; break; } else { __label__ = 45; break; }
    case 44: 
      var $182=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $183=$F144; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk155=(($183+12)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk155)>>2)]=$182; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $184=$T; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd156=(($184+8)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd156)>>2)]=$182; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $185=$F144; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $186=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $fd157=(($186+8)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd157)>>2)]=$185; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $187=$T; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $188=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $bk158=(($188+12)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk158)>>2)]=$187; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $189=$TP; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      var $parent159=(($189+24)|0); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent159)>>2)]=0; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      __label__ = 47; break; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 45: 
      _abort(); //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
      throw "Reached an unreachable!" //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 46: 
      __label__ = 34; break; //@line 3866 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 47: 
      __label__ = 48; break;
    case 48: 
      __label__ = 49; break;
    case 49: 
      __label__ = 50; break; //@line 3867 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    case 50: 
      ;
      return; //@line 3870 "/home/slarti/Development/emscripten/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_add_segment["X"]=1;

function __Znwj($size) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $size_addr;
      var $p;
      var $nh;
      var $exn_slot;
      var $ehselector_slot;
      $size_addr=$size;
      var $0=$size_addr; //@line 35 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $cmp=(($0)|0)==0; //@line 35 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 35 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 3: 
      $size_addr=1; //@line 36 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      __label__ = 4; break; //@line 36 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 4: 
      __label__ = 5; break; //@line 38 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 5: 
      var $1=$size_addr; //@line 38 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $call=_malloc($1); //@line 38 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      $p=$call; //@line 38 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $cmp1=(($call)|0)==0; //@line 38 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      if ($cmp1) { __label__ = 6; break; } else { __label__ = 14; break; } //@line 38 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 6: 
      var $call2=__ZSt15get_new_handlerv(); //@line 42 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      $nh=$call2; //@line 42 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $2=$nh; //@line 43 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $tobool=(($2)|0)!=0; //@line 43 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      if ($tobool) { __label__ = 7; break; } else { __label__ = 12; break; } //@line 43 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 7: 
      var $3=$nh; //@line 44 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      (function() { try { __THREW__ = false; return FUNCTION_TABLE[$3]() } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = true; Module.print("Exception: " + e + ", currently at: " + (new Error().stack)); return null } })();if (!__THREW__) { __label__ = 8; break; } else { __label__ = 9; break; }
    case 8: 
      __label__ = 13; break; //@line 44 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 9: 
      var $4=___cxa_find_matching_catch(HEAP32[((_llvm_eh_exception.buf)>>2)],HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)],[]);
      var $5=$4.f0; //@line 44 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      $exn_slot=$5; //@line 44 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $6=$4.f1; //@line 44 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      $ehselector_slot=$6; //@line 44 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      __label__ = 10; break; //@line 44 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 10: 
      var $sel=$ehselector_slot; //@line 52 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $ehspec_fails=(($sel)|0) < 0; //@line 52 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      if ($ehspec_fails) { __label__ = 11; break; } else { __label__ = 15; break; } //@line 52 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 11: 
      var $exn=$exn_slot; //@line 52 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      ___cxa_call_unexpected($exn); //@line 52 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      throw "Reached an unreachable!" //@line 52 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 12: 
      var $exception=___cxa_allocate_exception(4); //@line 47 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $7=$exception; //@line 47 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      FUNCTION_TABLE[__ZNSt9bad_allocC1Ev]($7); //@line 47 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      (function() { try { __THREW__ = false; return ___cxa_throw($exception, __ZTISt9bad_alloc, 2) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = true; Module.print("Exception: " + e + ", currently at: " + (new Error().stack)); return null } })();if (!__THREW__) { __label__ = 16; break; } else { __label__ = 9; break; }
    case 13: 
      __label__ = 5; break; //@line 51 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 14: 
      var $8=$p; //@line 52 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      ;
      return $8; //@line 52 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 15: 
      var $exn5=$exn_slot; //@line 52 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $sel6=$ehselector_slot; //@line 52 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $lpad_val=(tempValue = [0,0,0,0,0,0,0,0], tempValue.f0 = $exn5, tempValue); //@line 52 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $lpad_val7=($lpad_val.f1 = $sel6, $lpad_val); //@line 52 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      Module.print("Resuming exception");throw HEAP32[((_llvm_eh_exception.buf)>>2)]; //@line 52 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 16: 
      throw "Reached an unreachable!"
    default: assert(0, "bad label: " + __label__);
  }
}
__Znwj["X"]=1;

function __ZnwjRKSt9nothrow_t($size, $0) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $size_addr;
      var $_addr;
      var $p;
      var $exn_slot;
      var $ehselector_slot;
      $size_addr=$size;
      $_addr=$0;
      $p=0; //@line 59 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $1=$size_addr; //@line 64 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $call = (function() { try { __THREW__ = false; return __Znwj($1) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = true; Module.print("Exception: " + e + ", currently at: " + (new Error().stack)); return null } })();if (!__THREW__) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      $p=$call; //@line 64 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      __label__ = 7; break; //@line 66 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 4: 
      var $2=___cxa_find_matching_catch(HEAP32[((_llvm_eh_exception.buf)>>2)],HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)],[0]);
      var $3=$2.f0; //@line 64 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      $exn_slot=$3; //@line 64 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $4=$2.f1; //@line 64 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      $ehselector_slot=$4; //@line 64 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      __label__ = 5; break; //@line 64 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 5: 
      var $exn=$exn_slot; //@line 66 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $5=___cxa_begin_catch($exn); //@line 66 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      (function() { try { __THREW__ = false; return ___cxa_end_catch() } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = true; Module.print("Exception: " + e + ", currently at: " + (new Error().stack)); return null } })();if (!__THREW__) { __label__ = 6; break; } else { __label__ = 8; break; }
    case 6: 
      __label__ = 7; break; //@line 69 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 7: 
      var $6=$p; //@line 71 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      ;
      return $6; //@line 71 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 8: 
      var $7=___cxa_find_matching_catch(HEAP32[((_llvm_eh_exception.buf)>>2)],HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)],[]);
      var $8=$7.f0; //@line 69 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      $exn_slot=$8; //@line 69 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $9=$7.f1; //@line 69 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      $ehselector_slot=$9; //@line 69 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      __label__ = 9; break; //@line 69 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 9: 
      var $exn3=$exn_slot; //@line 71 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      ___cxa_call_unexpected($exn3); //@line 71 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      throw "Reached an unreachable!" //@line 71 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    default: assert(0, "bad label: " + __label__);
  }
}


function __Znaj($size) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $size_addr;
      var $exn_slot;
      var $ehselector_slot;
      $size_addr=$size;
      var $0=$size_addr; //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $call = (function() { try { __THREW__ = false; return __Znwj($0) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = true; Module.print("Exception: " + e + ", currently at: " + (new Error().stack)); return null } })();if (!__THREW__) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      ;
      return $call; //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 4: 
      var $1=___cxa_find_matching_catch(HEAP32[((_llvm_eh_exception.buf)>>2)],HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)],[]);
      var $2=$1.f0; //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      $exn_slot=$2; //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $3=$1.f1; //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      $ehselector_slot=$3; //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      __label__ = 5; break; //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 5: 
      var $sel=$ehselector_slot; //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $ehspec_fails=(($sel)|0) < 0; //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      if ($ehspec_fails) { __label__ = 6; break; } else { __label__ = 7; break; } //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 6: 
      var $exn=$exn_slot; //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      ___cxa_call_unexpected($exn); //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      throw "Reached an unreachable!" //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 7: 
      var $exn1=$exn_slot; //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $sel2=$ehselector_slot; //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $lpad_val=(tempValue = [0,0,0,0,0,0,0,0], tempValue.f0 = $exn1, tempValue); //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $lpad_val3=($lpad_val.f1 = $sel2, $lpad_val); //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      Module.print("Resuming exception");throw HEAP32[((_llvm_eh_exception.buf)>>2)]; //@line 81 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    default: assert(0, "bad label: " + __label__);
  }
}


function __ZnajRKSt9nothrow_t($size, $nothrow) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $size_addr;
      var $nothrow_addr;
      var $p;
      var $exn_slot;
      var $ehselector_slot;
      $size_addr=$size;
      $nothrow_addr=$nothrow;
      $p=0; //@line 88 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $0=$size_addr; //@line 93 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $call = (function() { try { __THREW__ = false; return __Znaj($0) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = true; Module.print("Exception: " + e + ", currently at: " + (new Error().stack)); return null } })();if (!__THREW__) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      $p=$call; //@line 93 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      __label__ = 7; break; //@line 95 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 4: 
      var $1=___cxa_find_matching_catch(HEAP32[((_llvm_eh_exception.buf)>>2)],HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)],[0]);
      var $2=$1.f0; //@line 93 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      $exn_slot=$2; //@line 93 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $3=$1.f1; //@line 93 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      $ehselector_slot=$3; //@line 93 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      __label__ = 5; break; //@line 93 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 5: 
      var $exn=$exn_slot; //@line 95 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $4=___cxa_begin_catch($exn); //@line 95 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      (function() { try { __THREW__ = false; return ___cxa_end_catch() } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = true; Module.print("Exception: " + e + ", currently at: " + (new Error().stack)); return null } })();if (!__THREW__) { __label__ = 6; break; } else { __label__ = 8; break; }
    case 6: 
      __label__ = 7; break; //@line 98 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 7: 
      var $5=$p; //@line 100 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      ;
      return $5; //@line 100 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 8: 
      var $6=___cxa_find_matching_catch(HEAP32[((_llvm_eh_exception.buf)>>2)],HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)],[]);
      var $7=$6.f0; //@line 98 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      $exn_slot=$7; //@line 98 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $8=$6.f1; //@line 98 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      $ehselector_slot=$8; //@line 98 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      __label__ = 9; break; //@line 98 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 9: 
      var $exn3=$exn_slot; //@line 100 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      ___cxa_call_unexpected($exn3); //@line 100 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      throw "Reached an unreachable!" //@line 100 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    default: assert(0, "bad label: " + __label__);
  }
}


function __ZNKSt20bad_array_new_length4whatEv($this) {
  ;
  var __label__;

  var $this_addr;
  $this_addr=$this;
  var $this1=$this_addr;
  ;
  return ((STRING_TABLE.__str14)|0); //@line 174 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
}


function __ZNSt20bad_array_new_lengthC2Ev($this) {
  ;
  var __label__;

  var $this_addr;
  $this_addr=$this;
  var $this1=$this_addr;
  var $0=$this1; //@line 164 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
  __ZNSt9bad_allocC2Ev($0); //@line 164 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
  var $1=$this1; //@line 164 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
  HEAP32[(($1)>>2)]=((__ZTVSt20bad_array_new_length+8)|0); //@line 164 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
  ;
  return; //@line 165 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
}


function __ZNSt20bad_array_new_lengthD0Ev($this) {
  ;
  var __label__;

  var $this_addr;
  $this_addr=$this;
  var $this1=$this_addr;
  FUNCTION_TABLE[__ZNSt20bad_array_new_lengthD1Ev]($this1); //@line 168 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
  var $0=$this1; //@line 168 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
  __ZdlPv($0); //@line 168 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
  ;
  return; //@line 169 "/home/slarti/Development/emscripten/emscripten/system/include/libcxx/new"
}


function __ZSt17__throw_bad_allocv() {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $exception=___cxa_allocate_exception(4); //@line 181 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      var $0=$exception; //@line 181 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      FUNCTION_TABLE[__ZNSt9bad_allocC1Ev]($0); //@line 181 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      ___cxa_throw($exception, __ZTISt9bad_alloc, 2); //@line 181 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
      throw "Reached an unreachable!" //@line 181 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    case 3: 
      ;
      return; //@line 183 "/home/slarti/Development/emscripten/emscripten/system/lib/libcxx/new.cpp"
    default: assert(0, "bad label: " + __label__);
  }
}

// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
var _llvm_dbg_declare; // stub for _llvm_dbg_declare
var _llvm_expect_i32; // stub for _llvm_expect_i32

  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }

  
  function _memset(ptr, value, num, align) {
      // TODO: make these settings, and in memcpy, {{'s
      if (num >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        var stop = ptr + num;
        while (ptr % 4) { // no need to check for stop, since we have large num
          HEAP8[ptr++] = value;
        }
        if (value < 0) value += 256; // make it unsigned
        var ptr4 = ptr >> 2, stop4 = stop >> 2, value4 = value | (value << 8) | (value << 16) | (value << 24);
        while (ptr4 < stop4) {
          HEAP32[ptr4++] = value4;
        }
        ptr = ptr4 << 2;
        while (ptr < stop) {
          HEAP8[ptr++] = value;
        }
      } else {
        while (num--) {
          HEAP8[ptr++] = value;
        }
      }
    }var _llvm_memset_p0i8_i32=_memset;

  
  
  
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};
  
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }
  
  var _stdin=0;
  
  var _stdout=0;
  
  var _stderr=0;
  
  var __impure_ptr=0;var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
  
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
  
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
  
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {isDevice: false, contents: data};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        var properties = {isDevice: false, url: url};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite) {
        Browser.asyncLoad(url, function(data) {
          FS.createDataFile(parent, name, data, canRead, canWrite);
        });
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          // Browser.
          assert('Cannot do synchronous binary XHRs in modern browsers. Use --embed-file or --preload-file in emcc');
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureRoot();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
  
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        function simpleOutput(val) {
          if (val === null || val === '\n'.charCodeAt(0)) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(String.fromCharCode(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
  
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
  
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
  
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        _stdin = allocate([1], 'void*', ALLOC_STATIC);
        _stdout = allocate([2], 'void*', ALLOC_STATIC);
        _stderr = allocate([3], 'void*', ALLOC_STATIC);
  
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
  
        // Newlib initialization
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        __impure_ptr = allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_STATIC) ], 'void*', ALLOC_STATIC);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output('\n'.charCodeAt(0));
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output('\n'.charCodeAt(0));
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        var path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[((buf)+(i))];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[((buf)+(i))]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return -1;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  
  function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (tempDoubleI32[0]=HEAP32[(((varargs)+(argIndex))>>2)],tempDoubleI32[1]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],tempDoubleF64[0]);
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[(textIndex+1)];
        if (curr == '%'.charCodeAt(0)) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case '+'.charCodeAt(0):
                flagAlwaysSigned = true;
                break;
              case '-'.charCodeAt(0):
                flagLeftAlign = true;
                break;
              case '#'.charCodeAt(0):
                flagAlternative = true;
                break;
              case '0'.charCodeAt(0):
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[(textIndex+1)];
          }
  
          // Handle width.
          var width = 0;
          if (next == '*'.charCodeAt(0)) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[(textIndex+1)];
          } else {
            while (next >= '0'.charCodeAt(0) && next <= '9'.charCodeAt(0)) {
              width = width * 10 + (next - '0'.charCodeAt(0));
              textIndex++;
              next = HEAP8[(textIndex+1)];
            }
          }
  
          // Handle precision.
          var precisionSet = false;
          if (next == '.'.charCodeAt(0)) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[(textIndex+1)];
            if (next == '*'.charCodeAt(0)) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[(textIndex+1)];
                if (precisionChr < '0'.charCodeAt(0) ||
                    precisionChr > '9'.charCodeAt(0)) break;
                precision = precision * 10 + (precisionChr - '0'.charCodeAt(0));
                textIndex++;
              }
            }
            next = HEAP8[(textIndex+1)];
          } else {
            var precision = 6; // Standard default.
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[(textIndex+2)];
              if (nextNext == 'h'.charCodeAt(0)) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[(textIndex+2)];
              if (nextNext == 'l'.charCodeAt(0)) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[(textIndex+1)];
  
          // Handle type specifier.
          if (['d', 'i', 'u', 'o', 'x', 'X', 'p'].indexOf(String.fromCharCode(next)) != -1) {
            // Integer.
            var signed = next == 'd'.charCodeAt(0) || next == 'i'.charCodeAt(0);
            argSize = argSize || 4;
            var currArg = getNextArg('i' + (argSize * 8));
            var origArg = currArg;
            var argText;
            // Flatten i64-1 [low, high] into a (slightly rounded) double
            if (argSize == 8) {
              currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 'u'.charCodeAt(0));
            }
            // Truncate to requested size.
            if (argSize <= 4) {
              var limit = Math.pow(256, argSize) - 1;
              currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
            }
            // Format the number.
            var currAbsArg = Math.abs(currArg);
            var prefix = '';
            if (next == 'd'.charCodeAt(0) || next == 'i'.charCodeAt(0)) {
              if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1]); else
              argText = reSign(currArg, 8 * argSize, 1).toString(10);
            } else if (next == 'u'.charCodeAt(0)) {
              if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
              argText = unSign(currArg, 8 * argSize, 1).toString(10);
              currArg = Math.abs(currArg);
            } else if (next == 'o'.charCodeAt(0)) {
              argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
            } else if (next == 'x'.charCodeAt(0) || next == 'X'.charCodeAt(0)) {
              prefix = flagAlternative ? '0x' : '';
              if (currArg < 0) {
                // Represent negative numbers in hex as 2's complement.
                currArg = -currArg;
                argText = (currAbsArg - 1).toString(16);
                var buffer = [];
                for (var i = 0; i < argText.length; i++) {
                  buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                }
                argText = buffer.join('');
                while (argText.length < argSize * 2) argText = 'f' + argText;
              } else {
                argText = currAbsArg.toString(16);
              }
              if (next == 'X'.charCodeAt(0)) {
                prefix = prefix.toUpperCase();
                argText = argText.toUpperCase();
              }
            } else if (next == 'p'.charCodeAt(0)) {
              if (currAbsArg === 0) {
                argText = '(nil)';
              } else {
                prefix = '0x';
                argText = currAbsArg.toString(16);
              }
            }
            if (precisionSet) {
              while (argText.length < precision) {
                argText = '0' + argText;
              }
            }
  
            // Add sign if needed
            if (flagAlwaysSigned) {
              if (currArg < 0) {
                prefix = '-' + prefix;
              } else {
                prefix = '+' + prefix;
              }
            }
  
            // Add padding.
            while (prefix.length + argText.length < width) {
              if (flagLeftAlign) {
                argText += ' ';
              } else {
                if (flagZeroPad) {
                  argText = '0' + argText;
                } else {
                  prefix = ' ' + prefix;
                }
              }
            }
  
            // Insert the result into the buffer.
            argText = prefix + argText;
            argText.split('').forEach(function(chr) {
              ret.push(chr.charCodeAt(0));
            });
          } else if (['f', 'F', 'e', 'E', 'g', 'G'].indexOf(String.fromCharCode(next)) != -1) {
            // Float.
            var currArg = getNextArg('double');
            var argText;
  
            if (isNaN(currArg)) {
              argText = 'nan';
              flagZeroPad = false;
            } else if (!isFinite(currArg)) {
              argText = (currArg < 0 ? '-' : '') + 'inf';
              flagZeroPad = false;
            } else {
              var isGeneral = false;
              var effectivePrecision = Math.min(precision, 20);
  
              // Convert g/G to f/F or e/E, as per:
              // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
              if (next == 'g'.charCodeAt(0) || next == 'G'.charCodeAt(0)) {
                isGeneral = true;
                precision = precision || 1;
                var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                if (precision > exponent && exponent >= -4) {
                  next = ((next == 'g'.charCodeAt(0)) ? 'f' : 'F').charCodeAt(0);
                  precision -= exponent + 1;
                } else {
                  next = ((next == 'g'.charCodeAt(0)) ? 'e' : 'E').charCodeAt(0);
                  precision--;
                }
                effectivePrecision = Math.min(precision, 20);
              }
  
              if (next == 'e'.charCodeAt(0) || next == 'E'.charCodeAt(0)) {
                argText = currArg.toExponential(effectivePrecision);
                // Make sure the exponent has at least 2 digits.
                if (/[eE][-+]\d$/.test(argText)) {
                  argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                }
              } else if (next == 'f'.charCodeAt(0) || next == 'F'.charCodeAt(0)) {
                argText = currArg.toFixed(effectivePrecision);
              }
  
              var parts = argText.split('e');
              if (isGeneral && !flagAlternative) {
                // Discard trailing zeros and periods.
                while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                       (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                  parts[0] = parts[0].slice(0, -1);
                }
              } else {
                // Make sure we have a period in alternative mode.
                if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                // Zero pad until required precision.
                while (precision > effectivePrecision++) parts[0] += '0';
              }
              argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
              // Capitalize 'E' if needed.
              if (next == 'E'.charCodeAt(0)) argText = argText.toUpperCase();
  
              // Add sign.
              if (flagAlwaysSigned && currArg >= 0) {
                argText = '+' + argText;
              }
            }
  
            // Add padding.
            while (argText.length < width) {
              if (flagLeftAlign) {
                argText += ' ';
              } else {
                if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                  argText = argText[0] + '0' + argText.slice(1);
                } else {
                  argText = (flagZeroPad ? '0' : ' ') + argText;
                }
              }
            }
  
            // Adjust case.
            if (next < 'a'.charCodeAt(0)) argText = argText.toUpperCase();
  
            // Insert the result into the buffer.
            argText.split('').forEach(function(chr) {
              ret.push(chr.charCodeAt(0));
            });
          } else if (next == 's'.charCodeAt(0)) {
            // String.
            var arg = getNextArg('i8*') || 0; // 0 holds '(null)'
            var argLength = String_len(arg);
            if (precisionSet) argLength = Math.min(String_len(arg), precision);
            if (!flagLeftAlign) {
              while (argLength < width--) {
                ret.push(' '.charCodeAt(0));
              }
            }
            for (var i = 0; i < argLength; i++) {
              ret.push(HEAPU8[(arg++)]);
            }
            if (flagLeftAlign) {
              while (argLength < width--) {
                ret.push(' '.charCodeAt(0));
              }
            }
          } else if (next == 'c'.charCodeAt(0)) {
            // Character.
            if (flagLeftAlign) ret.push(getNextArg('i8'));
            while (--width > 0) {
              ret.push(' '.charCodeAt(0));
            }
            if (!flagLeftAlign) ret.push(getNextArg('i8'));
          } else if (next == 'n'.charCodeAt(0)) {
            // Write the length written so far to the next parameter.
            var ptr = getNextArg('i32*');
            HEAP32[((ptr)>>2)]=ret.length
          } else if (next == '%'.charCodeAt(0)) {
            // Literal percent sign.
            ret.push(curr);
          } else {
            // Unknown specifiers remain untouched.
            for (var i = startTextIndex; i < textIndex + 2; i++) {
              ret.push(HEAP8[(i)]);
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }

  
  function _memcpy(dest, src, num, align) {
      assert(num % 1 === 0, 'memcpy given ' + num + ' bytes to copy. Problem with quantum=1 corrections perhaps?');
      if (num >= 20 && src % 2 == dest % 2) {
        // This is unaligned, but quite large, and potentially alignable, so work hard to get to aligned settings
        if (src % 4 == dest % 4) {
          var stop = src + num;
          while (src % 4) { // no need to check for stop, since we have large num
            HEAP8[dest++] = HEAP8[src++];
          }
          var src4 = src >> 2, dest4 = dest >> 2, stop4 = stop >> 2;
          while (src4 < stop4) {
            HEAP32[dest4++] = HEAP32[src4++];
          }
          src = src4 << 2;
          dest = dest4 << 2;
          while (src < stop) {
            HEAP8[dest++] = HEAP8[src++];
          }
        } else {
          var stop = src + num;
          if (src % 2) { // no need to check for stop, since we have large num
            HEAP8[dest++] = HEAP8[src++];
          }
          var src2 = src >> 1, dest2 = dest >> 1, stop2 = stop >> 1;
          while (src2 < stop2) {
            HEAP16[dest2++] = HEAP16[src2++];
          }
          src = src2 << 1;
          dest = dest2 << 1;
          if (src < stop) {
            HEAP8[dest++] = HEAP8[src++];
          }
        }
      } else {
        while (num--) {
          HEAP8[dest++] = HEAP8[src++];
        }
      }
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }

  
  function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
  
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }

  function ___gxx_personality_v0() {
    }

  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }

  
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  
  
  
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }function ___cxa_find_matching_catch(thrown, throwntype, typeArray) {
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return { f0:thrown, f1:typeArray[i] };
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return { f0:thrown, f1 :throwntype };
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      Module.printErr('Compiled code throwing an exception, ' + [ptr,type,destructor] + ', at ' + new Error().stack);
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr;
    }

  function ___cxa_call_unexpected(exception) {
      ABORT = true;
      throw exception;
    }

  function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }

  
  function ___cxa_free_exception(ptr) {
      return _free(ptr);
    }function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      __THREW__ = false;
      // Clear type.
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=0
      // Call destructor if one is registered then clear it.
      var ptr = HEAP32[((_llvm_eh_exception.buf)>>2)];
      var destructor = HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)];
      if (destructor) {
        FUNCTION_TABLE[destructor](ptr);
        HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=0
      }
      // Free ptr if it isn't null.
      if (ptr) {
        ___cxa_free_exception(ptr);
        HEAP32[((_llvm_eh_exception.buf)>>2)]=0
      }
    }
var __ZNSt9exceptionD2Ev; // stub for __ZNSt9exceptionD2Ev





  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false},pointerLock:false,moduleContextCreatedCallbacks:[],createContext:function (canvas, useWebGL, setInModule) {
        try {
          var ctx = canvas.getContext(useWebGL ? 'experimental-webgl' : '2d');
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
        }
        return ctx;
      },requestFullScreen:function () {
        var canvas = Module.canvas;
        function fullScreenChange() {
          if (document['webkitFullScreenElement'] === canvas ||
              document['mozFullScreenElement'] === canvas ||
              document['fullScreenElement'] === canvas) {
            canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                        canvas['mozRequestPointerLock'] ||
                                        canvas['webkitRequestPointerLock'];
            canvas.requestPointerLock();
          }
        }
  
        document.addEventListener('fullscreenchange', fullScreenChange, false);
        document.addEventListener('mozfullscreenchange', fullScreenChange, false);
        document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },getMovementX:function (delta, event) {
        if (!Browser.pointerLock) return delta;
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0; // delta;
      },getMovementY:function (delta, event) {
        if (!Browser.pointerLock) return delta;
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0; // delta;
      },asyncLoad:function (url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          var arrayBuffer = xhr.response;
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          callback(new Uint8Array(arrayBuffer));
          removeRunDependency();
        };
        xhr.onerror = function(event) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed.');
        };
        xhr.send(null);
        addRunDependency();
      }};
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___setErrNo(0);
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
Module["requestFullScreen"] = function() { Browser.requestFullScreen() };
  

// === Auto-generated postamble setup entry stuff ===

Module.callMain = function callMain(args) {
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);

  return _main(argc, argv, 0);
}


var __gm_;
var _mparams;
var _stderr;



var __ZSt7nothrow;
var __ZL13__new_handler;
var __ZTVSt9bad_alloc;

var __ZTVSt20bad_array_new_length;

var __ZTVN10__cxxabiv120__si_class_type_infoE;

var __ZTISt9exception;
var __ZTISt9bad_alloc;

var __ZTISt20bad_array_new_length;
var __ZTVSt9exception;
var __ZNSt9bad_allocC1Ev;
var __ZNSt9bad_allocD1Ev;
var __ZNSt20bad_array_new_lengthC1Ev;
var __ZNSt20bad_array_new_lengthD1Ev;
var __ZNSt20bad_array_new_lengthD2Ev;
__gm_=allocate(468, ["i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"i32",0,0,0,"*",0,0,0,"i32",0,0,0,"*",0,0,0,"i32",0,0,0], ALLOC_STATIC);
_mparams=allocate(24, "i32", ALLOC_STATIC);
STRING_TABLE.__str=allocate([109,97,120,32,115,121,115,116,101,109,32,98,121,116,101,115,32,61,32,37,49,48,108,117,10,0] /* max system bytes = % */, "i8", ALLOC_STATIC);
STRING_TABLE.__str1=allocate([115,121,115,116,101,109,32,98,121,116,101,115,32,32,32,32,32,61,32,37,49,48,108,117,10,0] /* system bytes     = % */, "i8", ALLOC_STATIC);
STRING_TABLE.__str2=allocate([105,110,32,117,115,101,32,98,121,116,101,115,32,32,32,32,32,61,32,37,49,48,108,117,10,0] /* in use bytes     = % */, "i8", ALLOC_STATIC);
__ZSt7nothrow=allocate(1, "i8", ALLOC_STATIC);
__ZL13__new_handler=allocate(1, "void ()*", ALLOC_STATIC);
__ZTVSt9bad_alloc=allocate([0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_STATIC);
allocate(1, "void*", ALLOC_STATIC);
STRING_TABLE.__str3=allocate([115,116,100,58,58,98,97,100,95,97,108,108,111,99,0] /* std::bad_alloc\00 */, "i8", ALLOC_STATIC);
__ZTVSt20bad_array_new_length=allocate([0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 10, 0, 0, 0, 12, 0, 0, 0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_STATIC);
allocate(1, "void*", ALLOC_STATIC);
STRING_TABLE.__str14=allocate([98,97,100,95,97,114,114,97,121,95,110,101,119,95,108,101,110,103,116,104,0] /* bad_array_new_length */, "i8", ALLOC_STATIC);
STRING_TABLE.__ZTSSt9bad_alloc=allocate([83,116,57,98,97,100,95,97,108,108,111,99,0] /* St9bad_alloc\00 */, "i8", ALLOC_STATIC);
__ZTISt9bad_alloc=allocate(12, "*", ALLOC_STATIC);
STRING_TABLE.__ZTSSt20bad_array_new_length=allocate([83,116,50,48,98,97,100,95,97,114,114,97,121,95,110,101,119,95,108,101,110,103,116,104,0] /* St20bad_array_new_le */, "i8", ALLOC_STATIC);
__ZTISt20bad_array_new_length=allocate(12, "*", ALLOC_STATIC);
HEAP32[(((__ZTVSt9bad_alloc)+(4))>>2)]=__ZTISt9bad_alloc;
HEAP32[(((__ZTVSt20bad_array_new_length)+(4))>>2)]=__ZTISt20bad_array_new_length;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([2,0,0,0,0], ["i8*",0,0,0,0], ALLOC_STATIC);
HEAP32[((__ZTISt9bad_alloc)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[(((__ZTISt9bad_alloc)+(4))>>2)]=((STRING_TABLE.__ZTSSt9bad_alloc)|0);
HEAP32[(((__ZTISt9bad_alloc)+(8))>>2)]=__ZTISt9exception;
HEAP32[((__ZTISt20bad_array_new_length)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[(((__ZTISt20bad_array_new_length)+(4))>>2)]=((STRING_TABLE.__ZTSSt20bad_array_new_length)|0);
HEAP32[(((__ZTISt20bad_array_new_length)+(8))>>2)]=__ZTISt9bad_alloc;
__ZNSt9bad_allocC1Ev = 14;
__ZNSt9bad_allocD1Ev = 16;
__ZNSt20bad_array_new_lengthC1Ev = 18;
__ZNSt20bad_array_new_lengthD1Ev = 20;
__ZNSt20bad_array_new_lengthD2Ev = 16;
FUNCTION_TABLE = [0,0,__ZNSt9bad_allocD2Ev,0,__ZNSt9bad_allocD0Ev,0,__ZNKSt9bad_alloc4whatEv,0,__ZNSt9bad_allocD2Ev,0,__ZNSt20bad_array_new_lengthD0Ev,0,__ZNKSt20bad_array_new_length4whatEv,0,__ZNSt9bad_allocC2Ev,0,__ZNSt9bad_allocD2Ev,0,__ZNSt20bad_array_new_lengthC2Ev,0,__ZNSt9bad_allocD2Ev,0]; Module["FUNCTION_TABLE"] = FUNCTION_TABLE;


function run(args) {
  args = args || Module['arguments'];

  if (Module['preRun']) {
    Module['preRun']();
    if (runDependencies > 0) {
      // preRun added a dependency, run will be called later
      Module['preRun'] = null;
      return 0;
    }
  }

  function doRun() {
    var ret = 0;
    if (Module['_main']) {
      preMain();
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      Module['postRun']();
    }
    return ret;
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = run;

// {{PRE_RUN_ADDITIONS}}

initRuntime();

if (Module['noInitialRun']) {
  addRunDependency();
}

if (runDependencies == 0) {
  var ret = run();
}

// {{POST_RUN_ADDITIONS}}





  // {{MODULE_ADDITIONS}}


// EMSCRIPTEN_GENERATED_FUNCTIONS: ["_malloc","_tmalloc_small","_tmalloc_large","_sys_alloc","_free","_sys_trim","_calloc","_realloc","_release_unused_segments","_memalign","_internal_memalign","_independent_calloc","_internal_realloc","_malloc_footprint","_malloc_max_footprint","_ialloc","_independent_comalloc","_valloc","_pvalloc","_malloc_trim","_mallinfo","_internal_mallinfo","_malloc_stats","_internal_malloc_stats","_mallopt","_init_mparams","_malloc_usable_size","_mmap_resize","_segment_holding","_init_top","_mmap_alloc","_init_bins","_change_mparam","_prepend_alloc","__ZNKSt9bad_alloc4whatEv","__ZSt15get_new_handlerv","__ZSt15set_new_handlerPFvvE","__ZNSt9bad_allocC2Ev","__ZdlPv","__ZdlPvRKSt9nothrow_t","__ZdaPv","__ZdaPvRKSt9nothrow_t","__ZNSt9bad_allocD0Ev","__ZNSt9bad_allocD2Ev","_add_segment","__Znwj","__ZnwjRKSt9nothrow_t","__Znaj","__ZnajRKSt9nothrow_t","__ZNKSt20bad_array_new_length4whatEv","__ZNSt20bad_array_new_lengthC2Ev","__ZNSt20bad_array_new_lengthD0Ev","__ZSt17__throw_bad_allocv"]

