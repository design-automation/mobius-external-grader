
const grader = require('./dist/grader');
const runFunc = grader.runJavascriptFile;


const result = runFunc('https://raw.githubusercontent.com/phuongtung1/test_repo/master/testtest.js');
result.then(r => {
    // console.log('result:',r);
    console.log('>>>>>>><<<<<<<')
})
