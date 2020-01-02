var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const Modules = __importStar(require("./dist/core/modules"));

const grader = require('./dist/grader');
const runFunc = grader.runJavascriptFile;

var fs = require('fs');
let tempFileName = './tmp/.__temporaryFile.mjs';

fs.readFile('testtest.js', 'utf8', function(err, contents) {

    fs.writeFileSync(tempFileName, contents);
    
    import(tempFileName).then((loadedModule) => console.log(loadedModule.func(Modules)))

});
 


// const result = runFunc('https://raw.githubusercontent.com/phuongtung1/test_repo/master/test.js');
// result.then(r => {
//     console.log('result:',r);
//     console.log('>>>>>>><<<<<<<')
// })
